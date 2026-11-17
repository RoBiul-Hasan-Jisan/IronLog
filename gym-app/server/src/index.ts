import cors from "cors";
import express from "express";
import rateLimit from "express-rate-limit";
import helmet from "helmet";
import mongoose from "mongoose";
import morgan from "morgan";
import { env } from "./env.js";
import { authenticate, errorHandler, requireRole } from "./middleware.js";
import { adminRouter } from "./routes/admin.js";
import { adminGymRouter } from "./routes/adminGym.js";
import { gymMeRouter, gymPublicRouter } from "./routes/gym.js";
import { meRouter } from "./routes/me.js";
import { publicRouter } from "./routes/public.js";

const app = express();
app.use(helmet());
app.use(cors({ origin: env.clientOrigin }));
app.use(express.json({ limit: "100kb" }));
app.use(morgan("dev"));
app.use("/api", rateLimit({ windowMs: 60_000, limit: 300, standardHeaders: true, legacyHeaders: false }));

app.get("/api/health", (_req, res) => res.json({ ok: true }));
app.use("/api", publicRouter);
app.use("/api", gymPublicRouter);
app.use("/api/admin", authenticate, requireRole("admin"), adminRouter, adminGymRouter);
app.use("/api", authenticate, meRouter, gymMeRouter);
app.use((_req, res) => res.status(404).json({ error: "Not found" }));
app.use(errorHandler);

await mongoose.connect(env.mongoUri);
console.log("MongoDB connected");
app.listen(env.port, () => console.log(`API on http://localhost:${env.port}`));
