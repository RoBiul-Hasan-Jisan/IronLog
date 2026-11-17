export type Role = "user" | "admin";

export interface Profile {
  _id: string;
  uid: string;
  email: string;
  name: string;
  role: Role;
  disabled: boolean;
  membership?: { planName?: string; startedAt?: string; expiresAt?: string };
  createdAt: string;
  lastLoginAt?: string;
}

export const PRODUCT_CATEGORIES = ["supplements", "equipment", "apparel", "accessories"] as const;
export type ProductCategory = (typeof PRODUCT_CATEGORIES)[number];

export interface Product {
  _id: string;
  name: string;
  description: string;
  category: ProductCategory;
  priceCents: number;
  stock: number;
  imageUrl: string;
  active: boolean;
}

export interface Plan {
  _id: string;
  name: string;
  description: string;
  priceCents: number;
  durationDays: number;
  features: string[];
  active: boolean;
}

export const ORDER_STATUSES = ["pending", "paid", "shipped", "completed", "cancelled"] as const;
export type OrderStatus = (typeof ORDER_STATUSES)[number];

export interface Order {
  _id: string;
  kind: "product" | "membership";
  items: { name: string; priceCents: number; qty: number }[];
  totalCents: number;
  status: OrderStatus;
  shipping?: { name: string; phone: string; address: string; city: string };
  user?: string | { _id: string; email: string; name: string };
  createdAt: string;
}

export interface Paged<T> {
  items: T[];
  total: number;
  page: number;
  pages: number;
}

export interface CustomExercise {
  _id: string;
  name: string;
  bodyPart: string;
  equipment: string;
  target: string;
  secondary: string[];
  steps: string[];
  imageUrl: string;
  gifUrl: string;
}

export const CLASS_CATEGORIES = ["strength", "cardio", "hiit", "yoga", "mobility", "boxing", "cycling"] as const;
export const CLASS_LEVELS = ["all", "beginner", "intermediate", "advanced"] as const;

export interface Trainer {
  _id: string;
  name: string;
  title: string;
  bio: string;
  specialties: string[];
  photoUrl: string;
  active: boolean;
}

export interface ClassSession {
  _id: string;
  title: string;
  description: string;
  category: (typeof CLASS_CATEGORIES)[number];
  level: (typeof CLASS_LEVELS)[number];
  trainer?: { _id: string; name: string; photoUrl?: string } | string | null;
  startsAt: string;
  durationMin: number;
  capacity: number;
  bookedCount: number;
  room: string;
  active: boolean;
}

export interface Booking {
  _id: string;
  status: "booked" | "cancelled" | "attended" | "noshow";
  session: ClassSession;
  createdAt: string;
}

export interface CheckInSummary {
  code: string;
  memberActive: boolean;
  thisMonth: number;
  total: number;
  streakWeeks: number;
  recent: string[];
}

export interface ProgressEntry {
  _id: string;
  date: string;
  weightKg?: number;
  bodyFatPct?: number;
  waistCm?: number;
  chestCm?: number;
  hipsCm?: number;
  armCm?: number;
  thighCm?: number;
  note: string;
}

export interface WorkoutLog {
  _id: string;
  completedAt: string;
  durationSec: number;
  totalSets: number;
  exercises: { exerciseId: string; name: string; sets: number }[];
}

export interface Lead {
  _id: string;
  name: string;
  email: string;
  phone: string;
  interest: string;
  message: string;
  status: "new" | "contacted" | "closed";
  createdAt: string;
}
