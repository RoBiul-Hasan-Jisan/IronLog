import { Router } from "express";
import { z } from "zod";
import {
  BOOKING_STATUSES,
  Booking,
  CLASS_CATEGORIES,
  CLASS_LEVELS,
  CheckIn,
  ClassSession,
  Lead,
  Trainer,
  User,
} from "../models.js";
import { HttpError, wrap } from "../middleware.js";
import { DAY_MS, DUPLICATE_CHECKIN_MS, membershipActiveAt } from "../gymLogic.js";

export const adminGymRouter = Router();

// ------------------------------------------------------------------ trainers
const trainerBody = z.object({
  name: z.string().trim().min(1).max(80),
  title: z.string().trim().max(80).default(""),
  bio: z.string().trim().max(1000).default(""),
  specialties: z.array(z.string().trim().min(1).max(40)).max(8).default([]),
  photoUrl: z.string().trim().max(500).default(""),
  active: z.boolean().default(true),
});
adminGymRouter.get("/trainers", wrap(async (_req, res) => void res.json(await Trainer.find().sort({ name: 1 }))));
adminGymRouter.post("/trainers", wrap(async (req, res) => void res.status(201).json(await Trainer.create(trainerBody.parse(req.body)))));
adminGymRouter.put(
  "/trainers/:id",
  wrap(async (req, res) => {
    const t = await Trainer.findByIdAndUpdate(req.params.id, trainerBody.parse(req.body), { new: true });
    if (!t) throw new HttpError(404, "Trainer not found");
    res.json(t);
  }),
);
adminGymRouter.delete(
  "/trainers/:id",
  wrap(async (req, res) => {
    // Classes keep running without a named trainer rather than disappearing.
    await ClassSession.updateMany({ trainer: req.params.id }, { $unset: { trainer: 1 } });
    await Trainer.findByIdAndDelete(req.params.id);
    res.status(204).end();
  }),
);

// ------------------------------------------------------------------ class sessions
const sessionBody = z.object({
  title: z.string().trim().min(1).max(80),
  description: z.string().trim().max(600).default(""),
  category: z.enum(CLASS_CATEGORIES),
  level: z.enum(CLASS_LEVELS).default("all"),
  trainer: z.string().optional().or(z.literal("")),
  startsAt: z.string().datetime(),
  durationMin: z.number().int().min(10).max(240),
  capacity: z.number().int().min(1).max(500),
  room: z.string().trim().max(40).default("Studio"),
  active: z.boolean().default(true),
});

adminGymRouter.get(
  "/classes",
  wrap(async (req, res) => {
    const days = z.coerce.number().int().min(1).max(60).default(14).parse(req.query.days);
    const from = new Date(Date.now() - DAY_MS);
    res.json(
      await ClassSession.find({ startsAt: { $gte: from, $lte: new Date(Date.now() + days * DAY_MS) } })
        .sort({ startsAt: 1 })
        .populate("trainer", "name"),
    );
  }),
);

/** `repeatWeeks` creates the same class once a week for that many weeks (1 = just this one). */
adminGymRouter.post(
  "/classes",
  wrap(async (req, res) => {
    const repeatWeeks = z.coerce.number().int().min(1).max(26).default(1).parse(req.body?.repeatWeeks ?? 1);
    const body = sessionBody.parse(req.body);
    const first = new Date(body.startsAt);
    const docs = Array.from({ length: repeatWeeks }, (_, i) => ({
      ...body,
      trainer: body.trainer || undefined,
      startsAt: new Date(first.getTime() + i * 7 * DAY_MS),
    }));
    res.status(201).json(await ClassSession.insertMany(docs));
  }),
);

adminGymRouter.put(
  "/classes/:id",
  wrap(async (req, res) => {
    const body = sessionBody.parse(req.body);
    const current = await ClassSession.findById(req.params.id);
    if (!current) throw new HttpError(404, "Class not found");
    if (body.capacity < current.bookedCount) {
      throw new HttpError(409, `${current.bookedCount} members are already booked; capacity cannot go below that`);
    }
    Object.assign(current, { ...body, trainer: body.trainer || undefined, startsAt: new Date(body.startsAt) });
    await current.save();
    res.json(current);
  }),
);

/** Cancelling a class cancels every booking in it. */
adminGymRouter.delete(
  "/classes/:id",
  wrap(async (req, res) => {
    await Booking.updateMany({ session: req.params.id, status: "booked" }, { status: "cancelled" });
    await ClassSession.findByIdAndUpdate(req.params.id, { active: false, bookedCount: 0 });
    res.status(204).end();
  }),
);

adminGymRouter.get(
  "/classes/:id/bookings",
  wrap(async (req, res) => {
    res.json(await Booking.find({ session: req.params.id, status: { $ne: "cancelled" } }).populate("user", "name email").sort({ createdAt: 1 }));
  }),
);
adminGymRouter.patch(
  "/bookings/:id",
  wrap(async (req, res) => {
    const { status } = z.object({ status: z.enum(BOOKING_STATUSES) }).parse(req.body);
    const b = await Booking.findById(req.params.id);
    if (!b) throw new HttpError(404, "Booking not found");
    if (b.status === "cancelled") throw new HttpError(409, "This booking was cancelled");
    if (status === "cancelled") {
      await ClassSession.updateOne({ _id: b.session, bookedCount: { $gt: 0 } }, { $inc: { bookedCount: -1 } });
    }
    b.status = status;
    await b.save();
    res.json(b);
  }),
);

// ------------------------------------------------------------------ front desk
const startOfToday = () => {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
};

adminGymRouter.post(
  "/checkin",
  wrap(async (req, res) => {
    const body = z
      .object({ code: z.string().trim().toUpperCase().max(12).optional(), userId: z.string().optional(), override: z.boolean().default(false) })
      .refine((b) => b.code || b.userId, { message: "Enter a member code or pick a member" })
      .parse(req.body);

    const member = body.code ? await User.findOne({ checkInCode: body.code }) : await User.findById(body.userId);
    if (!member) throw new HttpError(404, "No member with that code");
    if (member.disabled) throw new HttpError(403, "This account is disabled");

    const active = membershipActiveAt(member.membership?.expiresAt, new Date());
    const summary = { _id: member.id, name: member.name || member.email, email: member.email, membership: member.membership, active };
    if (!active && !body.override) {
      return void res.status(409).json({ error: "Membership expired or none", member: summary, canOverride: true });
    }

    const recent = await CheckIn.findOne({ user: member._id, at: { $gte: new Date(Date.now() - DUPLICATE_CHECKIN_MS) } });
    if (recent) return void res.json({ duplicate: true, member: summary, checkIn: recent });

    const checkIn = await CheckIn.create({ user: member._id, by: req.user!._id, override: !active });
    res.status(201).json({ duplicate: false, member: summary, checkIn });
  }),
);

adminGymRouter.get(
  "/checkins",
  wrap(async (_req, res) => {
    res.json(await CheckIn.find({ at: { $gte: startOfToday() } }).sort({ at: -1 }).limit(200).populate("user", "name email"));
  }),
);

// ------------------------------------------------------------------ leads
adminGymRouter.get(
  "/leads",
  wrap(async (req, res) => {
    const status = z.enum(["new", "contacted", "closed"]).optional().parse(req.query.status || undefined);
    res.json(await Lead.find(status ? { status } : {}).sort({ createdAt: -1 }).limit(300));
  }),
);
adminGymRouter.patch(
  "/leads/:id",
  wrap(async (req, res) => {
    const { status } = z.object({ status: z.enum(["new", "contacted", "closed"]) }).parse(req.body);
    const lead = await Lead.findByIdAndUpdate(req.params.id, { status }, { new: true });
    if (!lead) throw new HttpError(404, "Lead not found");
    res.json(lead);
  }),
);
adminGymRouter.delete(
  "/leads/:id",
  wrap(async (req, res) => {
    await Lead.findByIdAndDelete(req.params.id);
    res.status(204).end();
  }),
);

// ------------------------------------------------------------------ extra dashboard numbers
adminGymRouter.get(
  "/gym-stats",
  wrap(async (_req, res) => {
    const now = new Date();
    const [checkinsToday, upcomingBookings, newLeads, classesNext7, activeMembers, expiringSoon] = await Promise.all([
      CheckIn.countDocuments({ at: { $gte: startOfToday() } }),
      ClassSession.find({ active: true, startsAt: { $gte: now } })
        .select("_id")
        .then((upcoming) => Booking.countDocuments({ status: "booked", session: { $in: upcoming.map((s) => s._id) } })),
      Lead.countDocuments({ status: "new" }),
      ClassSession.countDocuments({ active: true, startsAt: { $gte: now, $lte: new Date(now.getTime() + 7 * DAY_MS) } }),
      User.countDocuments({ "membership.expiresAt": { $gt: now } }),
      User.find({ "membership.expiresAt": { $gt: now, $lte: new Date(now.getTime() + 7 * DAY_MS) } })
        .select("name email membership")
        .sort({ "membership.expiresAt": 1 })
        .limit(8),
    ]);
    res.json({ checkinsToday, upcomingBookings, newLeads, classesNext7, activeMembers, expiringSoon });
  }),
);
