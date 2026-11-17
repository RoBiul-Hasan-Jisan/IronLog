import { Router } from "express";
import { z } from "zod";
import { Order, Plan, Product, SavedWorkout, User } from "../models.js";
import { HttpError, wrap } from "../middleware.js";

export const meRouter = Router();

meRouter.get("/me", (req, res) => {
  res.json(req.user);
});

meRouter.patch(
  "/me",
  wrap(async (req, res) => {
    const body = z.object({ name: z.string().trim().min(1).max(80) }).parse(req.body);
    req.user!.name = body.name;
    await req.user!.save();
    res.json(req.user);
  }),
);

// ---- saved workout (the browser keeps working without it; this syncs across devices)
const workoutItem = z.object({
  exerciseId: z.string().min(1).max(40),
  mode: z.enum(["reps", "time"]),
  sets: z.number().int().min(1).max(20),
  reps: z.number().int().min(0).max(200),
  holdSec: z.number().int().min(0).max(1800),
  restSec: z.number().int().min(0).max(600),
});

meRouter.get(
  "/me/workout",
  wrap(async (req, res) => {
    const doc = await SavedWorkout.findOne({ user: req.user!._id });
    res.json({ items: doc?.items ?? [] });
  }),
);

meRouter.put(
  "/me/workout",
  wrap(async (req, res) => {
    const body = z.object({ items: z.array(workoutItem).max(60) }).parse(req.body);
    await SavedWorkout.findOneAndUpdate({ user: req.user!._id }, { items: body.items }, { upsert: true });
    res.json({ items: body.items });
  }),
);

// ---- orders
const checkout = z.object({
  items: z.array(z.object({ productId: z.string(), qty: z.number().int().min(1).max(20) })).min(1).max(30),
  shipping: z.object({
    name: z.string().trim().min(1).max(80),
    phone: z.string().trim().min(5).max(30),
    address: z.string().trim().min(5).max(200),
    city: z.string().trim().min(1).max(80),
  }),
});

meRouter.post(
  "/orders",
  wrap(async (req, res) => {
    const body = checkout.parse(req.body);

    // merge duplicate lines
    const wanted = new Map<string, number>();
    for (const i of body.items) wanted.set(i.productId, (wanted.get(i.productId) ?? 0) + i.qty);

    const taken: { id: string; qty: number }[] = [];
    const lines: { product: unknown; name: string; priceCents: number; qty: number }[] = [];
    try {
      for (const [productId, qty] of wanted) {
        // Atomic: only decrement when enough stock is left, so two buyers cannot oversell.
        const product = await Product.findOneAndUpdate(
          { _id: productId, active: true, stock: { $gte: qty } },
          { $inc: { stock: -qty } },
          { new: true },
        );
        if (!product) {
          const existing = await Product.findById(productId);
          throw new HttpError(409, existing ? `Not enough stock for ${existing.name}` : "A product in your cart is no longer available");
        }
        taken.push({ id: productId, qty });
        lines.push({ product: product._id, name: product.name, priceCents: product.priceCents, qty });
      }
    } catch (err) {
      await Promise.all(taken.map((t) => Product.updateOne({ _id: t.id }, { $inc: { stock: t.qty } })));
      throw err;
    }

    const order = await Order.create({
      user: req.user!._id,
      kind: "product",
      items: lines,
      totalCents: lines.reduce((s, l) => s + l.priceCents * l.qty, 0),
      shipping: body.shipping,
    });
    res.status(201).json(order);
  }),
);

meRouter.get(
  "/orders",
  wrap(async (req, res) => {
    res.json(await Order.find({ user: req.user!._id }).sort({ createdAt: -1 }).limit(100));
  }),
);

meRouter.post(
  "/orders/:id/cancel",
  wrap(async (req, res) => {
    const order = await Order.findOne({ _id: req.params.id, user: req.user!._id });
    if (!order) throw new HttpError(404, "Order not found");
    if (order.status !== "pending") throw new HttpError(409, "Only orders that have not been processed can be cancelled");
    order.status = "cancelled";
    await order.save();
    await Promise.all(
      order.items.filter((i) => i.product).map((i) => Product.updateOne({ _id: i.product }, { $inc: { stock: i.qty } })),
    );
    res.json(order);
  }),
);

// ---- membership (mock checkout: no payment provider is connected)
meRouter.post(
  "/membership",
  wrap(async (req, res) => {
    const { planId } = z.object({ planId: z.string() }).parse(req.body);
    const plan = await Plan.findOne({ _id: planId, active: true });
    if (!plan) throw new HttpError(404, "Plan not found");

    const user = req.user!;
    const now = new Date();
    // Renewing early extends from the current expiry instead of wasting remaining days.
    const current = user.membership?.expiresAt;
    const start = current && current > now ? current : now;
    const expiresAt = new Date(start.getTime() + plan.durationDays * 86_400_000);

    const order = await Order.create({
      user: user._id,
      kind: "membership",
      items: [{ plan: plan._id, name: plan.name, priceCents: plan.priceCents, qty: 1 }],
      totalCents: plan.priceCents,
      status: "paid",
    });
    await User.updateOne(
      { _id: user._id },
      { membership: { planId: plan._id, planName: plan.name, startedAt: user.membership?.startedAt ?? now, expiresAt } },
    );
    res.status(201).json({ order, expiresAt });
  }),
);
