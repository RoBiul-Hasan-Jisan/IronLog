import mongoose, { Schema, type InferSchemaType } from "mongoose";

const opts = { timestamps: true } as const;

export const ROLES = ["user", "admin"] as const;
export type Role = (typeof ROLES)[number];

const userSchema = new Schema(
  {
    uid: { type: String, required: true, unique: true },
    email: { type: String, required: true, lowercase: true, index: true },
    name: { type: String, default: "" },
    photoUrl: { type: String, default: "" },
    role: { type: String, enum: ROLES, default: "user" },
    disabled: { type: Boolean, default: false },
    membership: {
      planId: { type: Schema.Types.ObjectId, ref: "Plan" },
      planName: String,
      startedAt: Date,
      expiresAt: Date,
    },
    /** Short code the member shows at the front desk. Created on first request. */
    checkInCode: { type: String, unique: true, sparse: true },
    lastLoginAt: Date,
  },
  opts,
);
export const User = mongoose.model("User", userSchema);
export type UserDoc = InferSchemaType<typeof userSchema> & { _id: mongoose.Types.ObjectId };

export const PRODUCT_CATEGORIES = ["supplements", "equipment", "apparel", "accessories"] as const;
const productSchema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    description: { type: String, default: "" },
    category: { type: String, enum: PRODUCT_CATEGORIES, required: true },
    priceCents: { type: Number, required: true, min: 0 },
    stock: { type: Number, required: true, min: 0, default: 0 },
    imageUrl: { type: String, default: "" },
    active: { type: Boolean, default: true },
  },
  opts,
);
productSchema.index({ name: "text", description: "text" });
export const Product = mongoose.model("Product", productSchema);

const planSchema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    description: { type: String, default: "" },
    priceCents: { type: Number, required: true, min: 0 },
    durationDays: { type: Number, required: true, min: 1 },
    features: { type: [String], default: [] },
    active: { type: Boolean, default: true },
  },
  opts,
);
export const Plan = mongoose.model("Plan", planSchema);

export const ORDER_STATUSES = ["pending", "paid", "shipped", "completed", "cancelled"] as const;
export type OrderStatus = (typeof ORDER_STATUSES)[number];
const orderSchema = new Schema(
  {
    user: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    kind: { type: String, enum: ["product", "membership"], required: true },
    items: [
      {
        _id: false,
        product: { type: Schema.Types.ObjectId, ref: "Product" },
        plan: { type: Schema.Types.ObjectId, ref: "Plan" },
        name: { type: String, required: true },
        priceCents: { type: Number, required: true },
        qty: { type: Number, required: true, min: 1 },
      },
    ],
    totalCents: { type: Number, required: true },
    status: { type: String, enum: ORDER_STATUSES, default: "pending", index: true },
    shipping: { name: String, phone: String, address: String, city: String },
  },
  opts,
);
export const Order = mongoose.model("Order", orderSchema);

const workoutSchema = new Schema(
  {
    user: { type: Schema.Types.ObjectId, ref: "User", required: true, unique: true },
    items: { type: [Schema.Types.Mixed], default: [] },
  },
  opts,
);
export const SavedWorkout = mongoose.model("SavedWorkout", workoutSchema);

const customExerciseSchema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    bodyPart: { type: String, required: true, lowercase: true, trim: true },
    equipment: { type: String, required: true, lowercase: true, trim: true },
    target: { type: String, required: true, lowercase: true, trim: true },
    secondary: { type: [String], default: [] },
    steps: { type: [String], default: [] },
    imageUrl: { type: String, default: "" },
    gifUrl: { type: String, default: "" },
  },
  opts,
);
export const CustomExercise = mongoose.model("CustomExercise", customExerciseSchema);

const hiddenSchema = new Schema({ exerciseId: { type: String, required: true, unique: true } }, opts);
export const HiddenExercise = mongoose.model("HiddenExercise", hiddenSchema);

// ------------------------------------------------------------------ gym operations

const trainerSchema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    title: { type: String, default: "" },
    bio: { type: String, default: "" },
    specialties: { type: [String], default: [] },
    photoUrl: { type: String, default: "" },
    active: { type: Boolean, default: true },
  },
  opts,
);
export const Trainer = mongoose.model("Trainer", trainerSchema);

export const CLASS_CATEGORIES = ["strength", "cardio", "hiit", "yoga", "mobility", "boxing", "cycling"] as const;
export const CLASS_LEVELS = ["all", "beginner", "intermediate", "advanced"] as const;
const sessionSchema = new Schema(
  {
    title: { type: String, required: true, trim: true },
    description: { type: String, default: "" },
    category: { type: String, enum: CLASS_CATEGORIES, required: true },
    level: { type: String, enum: CLASS_LEVELS, default: "all" },
    trainer: { type: Schema.Types.ObjectId, ref: "Trainer" },
    startsAt: { type: Date, required: true, index: true },
    durationMin: { type: Number, required: true, min: 10, max: 240 },
    capacity: { type: Number, required: true, min: 1, max: 500 },
    bookedCount: { type: Number, default: 0, min: 0 },
    room: { type: String, default: "Studio" },
    active: { type: Boolean, default: true },
  },
  opts,
);
export const ClassSession = mongoose.model("ClassSession", sessionSchema);

export const BOOKING_STATUSES = ["booked", "cancelled", "attended", "noshow"] as const;
const bookingSchema = new Schema(
  {
    user: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    session: { type: Schema.Types.ObjectId, ref: "ClassSession", required: true, index: true },
    status: { type: String, enum: BOOKING_STATUSES, default: "booked" },
  },
  opts,
);
// One live booking per member per class (cancelled ones don't count).
bookingSchema.index({ user: 1, session: 1 }, { unique: true, partialFilterExpression: { status: "booked" } });
export const Booking = mongoose.model("Booking", bookingSchema);

const checkInSchema = new Schema(
  {
    user: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    at: { type: Date, default: Date.now, index: true },
    by: { type: Schema.Types.ObjectId, ref: "User" },
    override: { type: Boolean, default: false },
  },
  opts,
);
export const CheckIn = mongoose.model("CheckIn", checkInSchema);

const progressSchema = new Schema(
  {
    user: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    date: { type: Date, required: true },
    weightKg: Number,
    bodyFatPct: Number,
    waistCm: Number,
    chestCm: Number,
    hipsCm: Number,
    armCm: Number,
    thighCm: Number,
    note: { type: String, default: "" },
  },
  opts,
);
export const ProgressEntry = mongoose.model("ProgressEntry", progressSchema);

const workoutLogSchema = new Schema(
  {
    user: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    completedAt: { type: Date, default: Date.now, index: true },
    durationSec: { type: Number, default: 0 },
    totalSets: { type: Number, default: 0 },
    exercises: [{ _id: false, exerciseId: String, name: String, sets: Number }],
  },
  opts,
);
export const WorkoutLog = mongoose.model("WorkoutLog", workoutLogSchema);

const leadSchema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, lowercase: true, trim: true },
    phone: { type: String, default: "" },
    interest: { type: String, enum: ["trial", "membership", "personal-training", "other"], default: "trial" },
    message: { type: String, default: "" },
    status: { type: String, enum: ["new", "contacted", "closed"], default: "new", index: true },
  },
  opts,
);
export const Lead = mongoose.model("Lead", leadSchema);
