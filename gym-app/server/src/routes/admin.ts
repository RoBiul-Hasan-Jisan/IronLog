import { Router } from "express";
import { z } from "zod";
import { firebaseAuth } from "../firebase.js";
import {
  CustomExercise,
  HiddenExercise,
  ORDER_STATUSES,
  Order,
  PRODUCT_CATEGORIES,
  Plan,
  Product,
  ROLES,
  SavedWorkout,
  User,
} from "../models.js";
import { HttpError, wrap } from "../middleware.js";

export const adminRouter = Router();

const escapeRegex = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
const pageQuery = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  q: z.string().trim().max(80).optional(),
});

// ---------------------------------------------------------------- stats
adminRouter.get(
  "/stats",
  wrap(async (_req, res) => {
    const since = new Date(Date.now() - 7 * 86_400_000);
    const [users, admins, products, orders, revenue, byStatus, lowStock, recentOrders, newUsers, members] = await Promise.all([
      User.countDocuments(),
      User.countDocuments({ role: "admin" }),
      Product.countDocuments({ active: true }),
      Order.countDocuments(),
      Order.aggregate([{ $match: { status: { $ne: "cancelled" } } }, { $group: { _id: null, total: { $sum: "$totalCents" } } }]),
      Order.aggregate([{ $group: { _id: "$status", count: { $sum: 1 } } }]),
      Product.find({ active: true, stock: { $lte: 5 } }).sort({ stock: 1 }).limit(8),
      Order.find().sort({ createdAt: -1 }).limit(8).populate("user", "email name"),
      User.countDocuments({ createdAt: { $gte: since } }),
      User.countDocuments({ "membership.expiresAt": { $gt: new Date() } }),
    ]);
    res.json({
      users,
      admins,
      newUsers,
      members,
      products,
      orders,
      revenueCents: revenue[0]?.total ?? 0,
      ordersByStatus: Object.fromEntries(byStatus.map((s) => [s._id, s.count])),
      lowStock,
      recentOrders,
      customExercises: await CustomExercise.countDocuments(),
      hiddenExercises: await HiddenExercise.countDocuments(),
    });
  }),
);

// ---------------------------------------------------------------- users
adminRouter.get(
  "/users",
  wrap(async (req, res) => {
    const { page, limit, q } = pageQuery.parse(req.query);
    const filter = q ? { $or: [{ email: { $regex: escapeRegex(q), $options: "i" } }, { name: { $regex: escapeRegex(q), $options: "i" } }] } : {};
    const [items, total] = await Promise.all([
      User.find(filter)
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit),
      User.countDocuments(filter),
    ]);
    res.json({ items, total, page, pages: Math.max(1, Math.ceil(total / limit)) });
  }),
);

adminRouter.patch(
  "/users/:id",
  wrap(async (req, res) => {
    const body = z.object({ role: z.enum(ROLES).optional(), disabled: z.boolean().optional() }).parse(req.body);
    const user = await User.findById(req.params.id);
    if (!user) throw new HttpError(404, "User not found");
    if (user.id === req.user!.id && (body.role === "user" || body.disabled)) {
      throw new HttpError(400, "You cannot demote or disable your own account");
    }
    if (body.role) user.role = body.role;
    if (body.disabled !== undefined) {
      user.disabled = body.disabled;
      // Also stop Firebase from issuing new sessions (existing tokens are rejected by our own check).
      await firebaseAuth.updateUser(user.uid, { disabled: body.disabled }).catch(() => undefined);
    }
    await user.save();
    res.json(user);
  }),
);

adminRouter.delete(
  "/users/:id",
  wrap(async (req, res) => {
    const user = await User.findById(req.params.id);
    if (!user) throw new HttpError(404, "User not found");
    if (user.id === req.user!.id) throw new HttpError(400, "You cannot delete your own account");
    await firebaseAuth.deleteUser(user.uid).catch(() => undefined);
    await Promise.all([SavedWorkout.deleteOne({ user: user._id }), user.deleteOne()]);
    res.status(204).end();
  }),
);

// ---------------------------------------------------------------- products
const productBody = z.object({
  name: z.string().trim().min(1).max(120),
  description: z.string().trim().max(2000).default(""),
  category: z.enum(PRODUCT_CATEGORIES),
  priceCents: z.number().int().min(0).max(100_000_00),
  stock: z.number().int().min(0).max(100_000),
  imageUrl: z.string().trim().max(500).default(""),
  active: z.boolean().default(true),
});

adminRouter.get(
  "/products",
  wrap(async (req, res) => {
    const { q } = pageQuery.parse(req.query);
    const filter = q ? { name: { $regex: escapeRegex(q), $options: "i" } } : {};
    res.json(await Product.find(filter).sort({ createdAt: -1 }).limit(500));
  }),
);
adminRouter.post(
  "/products",
  wrap(async (req, res) => {
    res.status(201).json(await Product.create(productBody.parse(req.body)));
  }),
);
adminRouter.put(
  "/products/:id",
  wrap(async (req, res) => {
    const product = await Product.findByIdAndUpdate(req.params.id, productBody.parse(req.body), { new: true });
    if (!product) throw new HttpError(404, "Product not found");
    res.json(product);
  }),
);
adminRouter.delete(
  "/products/:id",
  wrap(async (req, res) => {
    // Old orders keep their name/price snapshot, so deleting is safe.
    await Product.findByIdAndDelete(req.params.id);
    res.status(204).end();
  }),
);

// ---------------------------------------------------------------- plans
const planBody = z.object({
  name: z.string().trim().min(1).max(80),
  description: z.string().trim().max(500).default(""),
  priceCents: z.number().int().min(0).max(100_000_00),
  durationDays: z.number().int().min(1).max(3650),
  features: z.array(z.string().trim().min(1).max(120)).max(12).default([]),
  active: z.boolean().default(true),
});
adminRouter.get(
  "/plans",
  wrap(async (_req, res) => {
    res.json(await Plan.find().sort({ priceCents: 1 }));
  }),
);
adminRouter.post(
  "/plans",
  wrap(async (req, res) => {
    res.status(201).json(await Plan.create(planBody.parse(req.body)));
  }),
);
adminRouter.put(
  "/plans/:id",
  wrap(async (req, res) => {
    const plan = await Plan.findByIdAndUpdate(req.params.id, planBody.parse(req.body), { new: true });
    if (!plan) throw new HttpError(404, "Plan not found");
    res.json(plan);
  }),
);
adminRouter.delete(
  "/plans/:id",
  wrap(async (req, res) => {
    await Plan.findByIdAndDelete(req.params.id);
    res.status(204).end();
  }),
);

// ---------------------------------------------------------------- orders
adminRouter.get(
  "/orders",
  wrap(async (req, res) => {
    const { page, limit } = pageQuery.parse(req.query);
    const status = z.enum(ORDER_STATUSES).optional().parse(req.query.status || undefined);
    const filter = status ? { status } : {};
    const [items, total] = await Promise.all([
      Order.find(filter)
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .populate("user", "email name"),
      Order.countDocuments(filter),
    ]);
    res.json({ items, total, page, pages: Math.max(1, Math.ceil(total / limit)) });
  }),
);

adminRouter.patch(
  "/orders/:id",
  wrap(async (req, res) => {
    const { status } = z.object({ status: z.enum(ORDER_STATUSES) }).parse(req.body);
    const order = await Order.findById(req.params.id);
    if (!order) throw new HttpError(404, "Order not found");
    if (order.status === "cancelled" || order.status === "completed") {
      throw new HttpError(409, `A ${order.status} order cannot be changed`);
    }
    if (status === "cancelled" && order.kind === "product") {
      await Promise.all(
        order.items.filter((i) => i.product).map((i) => Product.updateOne({ _id: i.product }, { $inc: { stock: i.qty } })),
      );
    }
    order.status = status;
    await order.save();
    res.json(order);
  }),
);

// ---------------------------------------------------------------- exercise content
const customBody = z.object({
  name: z.string().trim().min(1).max(120),
  bodyPart: z.string().trim().min(1).max(40),
  equipment: z.string().trim().min(1).max(40),
  target: z.string().trim().min(1).max(40),
  secondary: z.array(z.string().trim().min(1).max(40)).max(8).default([]),
  steps: z.array(z.string().trim().min(1).max(500)).min(1).max(20),
  imageUrl: z.string().trim().max(500).default(""),
  gifUrl: z.string().trim().max(500).default(""),
});

adminRouter.get(
  "/exercises/custom",
  wrap(async (_req, res) => {
    res.json(await CustomExercise.find().sort({ createdAt: -1 }));
  }),
);
adminRouter.post(
  "/exercises/custom",
  wrap(async (req, res) => {
    res.status(201).json(await CustomExercise.create(customBody.parse(req.body)));
  }),
);
adminRouter.put(
  "/exercises/custom/:id",
  wrap(async (req, res) => {
    const ex = await CustomExercise.findByIdAndUpdate(req.params.id, customBody.parse(req.body), { new: true });
    if (!ex) throw new HttpError(404, "Exercise not found");
    res.json(ex);
  }),
);
adminRouter.delete(
  "/exercises/custom/:id",
  wrap(async (req, res) => {
    await CustomExercise.findByIdAndDelete(req.params.id);
    res.status(204).end();
  }),
);

adminRouter.get(
  "/exercises/hidden",
  wrap(async (_req, res) => {
    res.json((await HiddenExercise.find().lean()).map((h) => h.exerciseId));
  }),
);
adminRouter.put(
  "/exercises/hidden/:exerciseId",
  wrap(async (req, res) => {
    const { hidden } = z.object({ hidden: z.boolean() }).parse(req.body);
    const exerciseId = z.string().min(1).max(40).parse(req.params.exerciseId);
    if (hidden) await HiddenExercise.updateOne({ exerciseId }, { exerciseId }, { upsert: true });
    else await HiddenExercise.deleteOne({ exerciseId });
    res.json({ exerciseId, hidden });
  }),
);
