import { randomInt } from "node:crypto";
import { Router } from "express";
import rateLimit from "express-rate-limit";
import { z } from "zod";
import {
  Booking,
  CheckIn,
  ClassSession,
  Lead,
  ProgressEntry,
  Trainer,
  User,
  WorkoutLog,
} from "../models.js";
import { HttpError, wrap } from "../middleware.js";
import { DAY_MS, canCancel, makeCheckInCode, membershipActiveAt, weekStreak } from "../gymLogic.js";

// ------------------------------------------------------------------ public
export const gymPublicRouter = Router();

gymPublicRouter.get(
  "/trainers",
  wrap(async (_req, res) => {
    res.json(await Trainer.find({ active: true }).sort({ name: 1 }));
  }),
);

/** Upcoming class sessions. Default: the next 7 days. */
gymPublicRouter.get(
  "/classes",
  wrap(async (req, res) => {
    const q = z.object({ days: z.coerce.number().int().min(1).max(31).default(7) }).parse(req.query);
    const from = new Date();
    const to = new Date(from.getTime() + q.days * DAY_MS);
    res.json(
      await ClassSession.find({ active: true, startsAt: { $gte: from, $lte: to } })
        .sort({ startsAt: 1 })
        .populate("trainer", "name photoUrl"),
    );
  }),
);

const leadLimiter = rateLimit({ windowMs: 3_600_000, limit: 8, standardHeaders: true, legacyHeaders: false });
gymPublicRouter.post(
  "/leads",
  leadLimiter,
  wrap(async (req, res) => {
    const body = z
      .object({
        name: z.string().trim().min(1).max(80),
        email: z.string().trim().email().max(120),
        phone: z.string().trim().max(30).default(""),
        interest: z.enum(["trial", "membership", "personal-training", "other"]).default("trial"),
        message: z.string().trim().max(1000).default(""),
        website: z.string().max(0).optional(), // honeypot: real people leave it empty
      })
      .parse(req.body);
    const { website: _ignored, ...lead } = body;
    await Lead.create(lead);
    res.status(201).json({ ok: true });
  }),
);

// ------------------------------------------------------------------ signed-in member
export const gymMeRouter = Router();

// ---- class booking
gymMeRouter.post(
  "/classes/:id/book",
  wrap(async (req, res) => {
    const user = req.user!;
    const session = await ClassSession.findOne({ _id: req.params.id, active: true });
    if (!session) throw new HttpError(404, "Class not found");
    if (session.startsAt.getTime() <= Date.now()) throw new HttpError(409, "This class has already started");
    if (user.role !== "admin" && !membershipActiveAt(user.membership?.expiresAt, session.startsAt)) {
      throw new HttpError(402, "You need an active membership on the day of the class. See Pricing.");
    }
    if (await Booking.exists({ user: user._id, session: session._id, status: "booked" })) {
      throw new HttpError(409, "You are already booked into this class");
    }

    // Atomic seat grab: two people cannot take the last spot.
    const taken = await ClassSession.findOneAndUpdate(
      { _id: session._id, $expr: { $lt: ["$bookedCount", "$capacity"] } },
      { $inc: { bookedCount: 1 } },
    );
    if (!taken) throw new HttpError(409, "This class is full");
    try {
      const booking = await Booking.create({ user: user._id, session: session._id });
      res.status(201).json(booking);
    } catch (err) {
      await ClassSession.updateOne({ _id: session._id }, { $inc: { bookedCount: -1 } });
      if ((err as { code?: number }).code === 11000) throw new HttpError(409, "You are already booked into this class");
      throw err;
    }
  }),
);

gymMeRouter.get(
  "/me/bookings",
  wrap(async (req, res) => {
    const items = await Booking.find({ user: req.user!._id, status: { $ne: "cancelled" } })
      .sort({ createdAt: -1 })
      .limit(100)
      .populate({ path: "session", populate: { path: "trainer", select: "name" } });
    res.json(items.filter((b) => b.session));
  }),
);

gymMeRouter.post(
  "/bookings/:id/cancel",
  wrap(async (req, res) => {
    const booking = await Booking.findOne({ _id: req.params.id, user: req.user!._id });
    if (!booking) throw new HttpError(404, "Booking not found");
    if (booking.status !== "booked") throw new HttpError(409, "This booking can no longer be cancelled");
    const session = await ClassSession.findById(booking.session);
    if (session && !canCancel(session.startsAt)) {
      throw new HttpError(409, "Cancellations close 2 hours before the class starts");
    }
    booking.status = "cancelled";
    await booking.save();
    if (session) await ClassSession.updateOne({ _id: session._id, bookedCount: { $gt: 0 } }, { $inc: { bookedCount: -1 } });
    res.json(booking);
  }),
);

// ---- check-in
gymMeRouter.get(
  "/me/checkin",
  wrap(async (req, res) => {
    const user = req.user!;
    if (!user.checkInCode) {
      for (let attempt = 0; attempt < 5 && !user.checkInCode; attempt++) {
        const code = makeCheckInCode(() => randomInt(0, 1_000_000) / 1_000_000);
        if (!(await User.exists({ checkInCode: code }))) user.checkInCode = code;
      }
      await user.save();
    }
    const since = new Date(Date.now() - 365 * DAY_MS);
    const visits = await CheckIn.find({ user: user._id, at: { $gte: since } }).sort({ at: -1 }).lean();
    const monthStart = new Date();
    monthStart.setDate(1);
    monthStart.setHours(0, 0, 0, 0);
    res.json({
      code: user.checkInCode,
      memberActive: membershipActiveAt(user.membership?.expiresAt, new Date()),
      thisMonth: visits.filter((v) => v.at >= monthStart).length,
      total: visits.length,
      streakWeeks: weekStreak(visits.map((v) => v.at)),
      recent: visits.slice(0, 30).map((v) => v.at),
    });
  }),
);

// ---- body progress
const metric = (max: number) => z.number().min(0.1).max(max).optional();
const progressBody = z
  .object({
    date: z.string().datetime().or(z.string().regex(/^\d{4}-\d{2}-\d{2}$/)),
    weightKg: metric(500),
    bodyFatPct: metric(80),
    waistCm: metric(300),
    chestCm: metric(300),
    hipsCm: metric(300),
    armCm: metric(150),
    thighCm: metric(200),
    note: z.string().trim().max(300).default(""),
  })
  .refine((b) => [b.weightKg, b.bodyFatPct, b.waistCm, b.chestCm, b.hipsCm, b.armCm, b.thighCm].some((v) => v !== undefined), {
    message: "Enter at least one measurement",
  });

gymMeRouter.get(
  "/me/progress",
  wrap(async (req, res) => {
    res.json(await ProgressEntry.find({ user: req.user!._id }).sort({ date: 1 }).limit(500));
  }),
);
gymMeRouter.post(
  "/me/progress",
  wrap(async (req, res) => {
    const body = progressBody.parse(req.body);
    const date = new Date(body.date);
    if (date.getTime() > Date.now() + DAY_MS) throw new HttpError(400, "The date cannot be in the future");
    res.status(201).json(await ProgressEntry.create({ ...body, date, user: req.user!._id }));
  }),
);
gymMeRouter.delete(
  "/me/progress/:id",
  wrap(async (req, res) => {
    await ProgressEntry.deleteOne({ _id: req.params.id, user: req.user!._id });
    res.status(204).end();
  }),
);

// ---- finished workouts (sent by the workout player)
gymMeRouter.post(
  "/me/workout-logs",
  wrap(async (req, res) => {
    const body = z
      .object({
        durationSec: z.number().int().min(0).max(6 * 3600),
        exercises: z
          .array(z.object({ exerciseId: z.string().max(40), name: z.string().max(120), sets: z.number().int().min(1).max(30) }))
          .min(1)
          .max(60),
      })
      .parse(req.body);
    const log = await WorkoutLog.create({
      user: req.user!._id,
      durationSec: body.durationSec,
      exercises: body.exercises,
      totalSets: body.exercises.reduce((n, e) => n + e.sets, 0),
    });
    res.status(201).json(log);
  }),
);
gymMeRouter.get(
  "/me/workout-logs",
  wrap(async (req, res) => {
    res.json(await WorkoutLog.find({ user: req.user!._id }).sort({ completedAt: -1 }).limit(120));
  }),
);
