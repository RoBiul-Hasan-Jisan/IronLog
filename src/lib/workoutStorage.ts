import type { WorkoutItem, WorkoutMode } from "./types";

export const STORAGE_KEY = "gym.workout.v1";

export const LIMITS = {
  sets: { min: 1, max: 10 },
  reps: { min: 1, max: 100 },
  holdSec: { min: 5, max: 600 },
  restSec: { min: 0, max: 600 },
} as const;

export type NumericField = keyof typeof LIMITS;

function clampInt(value: unknown, min: number, max: number, fallback: number): number {
  const n = typeof value === "number" && Number.isFinite(value) ? Math.round(value) : fallback;
  return Math.min(max, Math.max(min, n));
}

export function clampField(field: NumericField, value: number): number {
  const { min, max } = LIMITS[field];
  return clampInt(value, min, max, min);
}

/** Validates one stored/patched item; returns null if it is unusable. */
export function sanitizeItem(raw: unknown): WorkoutItem | null {
  if (typeof raw !== "object" || raw === null) return null;
  const r = raw as Record<string, unknown>;
  if (typeof r.exerciseId !== "string" || r.exerciseId === "") return null;
  const mode: WorkoutMode = r.mode === "time" ? "time" : "reps";
  return {
    exerciseId: r.exerciseId,
    mode,
    sets: clampInt(r.sets, LIMITS.sets.min, LIMITS.sets.max, 3),
    reps: mode === "reps" ? clampInt(r.reps, LIMITS.reps.min, LIMITS.reps.max, 12) : 0,
    holdSec: mode === "time" ? clampInt(r.holdSec, LIMITS.holdSec.min, LIMITS.holdSec.max, 30) : 0,
    restSec: clampInt(r.restSec, LIMITS.restSec.min, LIMITS.restSec.max, 60),
  };
}

/** Safely reads a workout from a JSON string (e.g. from localStorage). */
export function parseWorkout(json: string | null): WorkoutItem[] {
  if (!json) return [];
  try {
    const data: unknown = JSON.parse(json);
    if (!Array.isArray(data)) return [];
    const seen = new Set<string>();
    const items: WorkoutItem[] = [];
    for (const raw of data) {
      const item = sanitizeItem(raw);
      if (item && !seen.has(item.exerciseId)) {
        seen.add(item.exerciseId);
        items.push(item);
      }
    }
    return items;
  } catch {
    return [];
  }
}

export function serializeWorkout(items: WorkoutItem[]): string {
  return JSON.stringify(items);
}
