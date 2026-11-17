import type { NextFunction, Request, RequestHandler, Response } from "express";
import { ZodError, type ZodTypeAny, type z } from "zod";
import { env } from "./env.js";
import { firebaseAuth } from "./firebase.js";
import { User, type Role } from "./models.js";

type UserDocument = NonNullable<Awaited<ReturnType<typeof User.findOne>>>;

declare module "express-serve-static-core" {
  interface Request {
    user?: UserDocument;
  }
}

export class HttpError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
  }
}

/** Express 4 does not catch rejected promises on its own. */
export const wrap =
  (fn: (req: Request, res: Response, next: NextFunction) => Promise<unknown>): RequestHandler =>
  (req, res, next) => {
    fn(req, res, next).catch(next);
  };

/** Verifies the Firebase ID token, loads (or creates) the matching MongoDB user. */
export const authenticate = wrap(async (req, _res, next) => {
  const header = req.headers.authorization ?? "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : "";
  if (!token) throw new HttpError(401, "Sign in required");

  let decoded;
  try {
    decoded = await firebaseAuth.verifyIdToken(token);
  } catch {
    throw new HttpError(401, "Invalid or expired session");
  }

  const email = (decoded.email ?? "").toLowerCase();
  let user = await User.findOne({ uid: decoded.uid });
  if (!user) {
    user = await User.create({
      uid: decoded.uid,
      email,
      name: decoded.name ?? "",
      photoUrl: decoded.picture ?? "",
    });
  }
  // Bootstrap: listed emails become admin, but only once the address is verified,
  // so nobody can claim an admin email by registering with it first.
  if (user.role !== "admin" && decoded.email_verified && env.adminEmails.includes(email)) {
    user.role = "admin";
  }
  if (user.disabled) throw new HttpError(403, "This account has been disabled");
  user.lastLoginAt = new Date();
  await user.save();

  req.user = user;
  next();
});

export const requireRole = (role: Role): RequestHandler => (req, _res, next) => {
  if (req.user?.role !== role) return next(new HttpError(403, "You do not have access to this"));
  next();
};

export function parse<T extends ZodTypeAny>(schema: T, data: unknown): z.infer<T> {
  return schema.parse(data);
}

export const errorHandler = (err: unknown, _req: Request, res: Response, _next: NextFunction) => {
  if (err instanceof HttpError) return res.status(err.status).json({ error: err.message });
  if (err instanceof ZodError) {
    return res.status(400).json({ error: err.issues.map((i) => `${i.path.join(".") || "body"}: ${i.message}`).join("; ") });
  }
  if ((err as { name?: string } | null)?.name === "CastError") {
    return res.status(400).json({ error: "Invalid id" });
  }
  console.error(err);
  res.status(500).json({ error: "Something went wrong" });
};
