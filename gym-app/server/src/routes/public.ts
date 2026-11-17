import { Router } from "express";
import { z } from "zod";
import { CustomExercise, HiddenExercise, PRODUCT_CATEGORIES, Plan, Product } from "../models.js";
import { wrap } from "../middleware.js";

export const publicRouter = Router();

publicRouter.get(
  "/products",
  wrap(async (req, res) => {
    const q = z
      .object({ category: z.enum(PRODUCT_CATEGORIES).optional(), q: z.string().trim().max(80).optional() })
      .parse(req.query);
    const filter: Record<string, unknown> = { active: true };
    if (q.category) filter.category = q.category;
    if (q.q) filter.name = { $regex: q.q.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), $options: "i" };
    res.json(await Product.find(filter).sort({ createdAt: -1 }).limit(200));
  }),
);

publicRouter.get(
  "/plans",
  wrap(async (_req, res) => {
    res.json(await Plan.find({ active: true }).sort({ priceCents: 1 }));
  }),
);

/** What the exercise library needs on top of the bundled data: hidden ids + custom exercises. */
publicRouter.get(
  "/exercises/overlay",
  wrap(async (_req, res) => {
    const [hidden, custom] = await Promise.all([HiddenExercise.find().lean(), CustomExercise.find().sort({ name: 1 }).lean()]);
    res.json({
      hidden: hidden.map((h) => h.exerciseId),
      custom: custom.map((c) => ({ ...c, id: `c_${c._id}` })),
    });
  }),
);
