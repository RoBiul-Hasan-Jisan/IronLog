import type { ExerciseSummary, WorkoutItem } from "./types";
import { isTimed, newWorkoutItem } from "./prescription";

export interface Preset {
  id: string;
  title: string;
  subtitle: string;
  bodyParts: string[];
  count: number;
  includeTimed: boolean;
}

export const PRESETS: Preset[] = [
  {
    id: "full-body",
    title: "Full body",
    subtitle: "Chest, back, legs, shoulders and core",
    bodyParts: ["upper legs", "chest", "back", "shoulders", "waist"],
    count: 8,
    includeTimed: false,
  },
  {
    id: "push",
    title: "Push day",
    subtitle: "Chest, shoulders and triceps",
    bodyParts: ["chest", "shoulders", "chest", "upper arms"],
    count: 6,
    includeTimed: false,
  },
  {
    id: "pull",
    title: "Pull day",
    subtitle: "Back and biceps",
    bodyParts: ["back", "back", "upper arms", "lower arms"],
    count: 6,
    includeTimed: false,
  },
  {
    id: "legs",
    title: "Leg day",
    subtitle: "Quads, hamstrings, glutes and calves",
    bodyParts: ["upper legs", "upper legs", "lower legs"],
    count: 6,
    includeTimed: false,
  },
  {
    id: "core",
    title: "Core burner",
    subtitle: "Abs and waist, with holds",
    bodyParts: ["waist"],
    count: 6,
    includeTimed: true,
  },
  {
    id: "cardio",
    title: "Cardio blast",
    subtitle: "Timed intervals",
    bodyParts: ["cardio"],
    count: 5,
    includeTimed: true,
  },
];

/** Equipment you can expect in a normal gym (or at home with a few weights). */
export const COMMON_EQUIPMENT = [
  "body weight",
  "dumbbell",
  "barbell",
  "cable",
  "kettlebell",
  "leverage machine",
  "smith machine",
  "ez barbell",
  "band",
];

/** Small deterministic PRNG so a given seed always yields the same workout. */
export function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function shuffle<T>(arr: T[], rand: () => number): T[] {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export interface GenerateOptions {
  bodyParts: string[];
  count: number;
  includeTimed: boolean;
  /** Defaults to COMMON_EQUIPMENT (no filter when the workout is cardio only). */
  equipment?: string[];
}

/**
 * Builds a workout by cycling through the requested body parts, picking
 * random exercises and avoiding more than two for the same target muscle.
 */
export function generateWorkout(
  index: ExerciseSummary[],
  opts: GenerateOptions,
  seed: number,
): WorkoutItem[] {
  const rand = mulberry32(seed);
  const cardioOnly = opts.bodyParts.length > 0 && opts.bodyParts.every((p) => p === "cardio");
  const allowedEquipment = opts.equipment ?? (cardioOnly ? null : COMMON_EQUIPMENT);

  const pools = new Map<string, ExerciseSummary[]>();
  for (const part of new Set(opts.bodyParts)) {
    const pool = index.filter(
      (e) =>
        e.bodyPart === part &&
        (allowedEquipment === null || allowedEquipment.includes(e.equipment)) &&
        (opts.includeTimed || !isTimed(e)),
    );
    pools.set(part, shuffle(pool, rand));
  }

  const picked: ExerciseSummary[] = [];
  const perTarget = new Map<string, number>();
  const maxAttempts = opts.count * Math.max(1, opts.bodyParts.length) * 2;

  for (let i = 0; picked.length < opts.count && i < maxAttempts; i++) {
    const part = opts.bodyParts[i % opts.bodyParts.length];
    const pool = pools.get(part);
    if (!pool || pool.length === 0) continue;
    let at = pool.findIndex((e) => (perTarget.get(e.target) ?? 0) < 2);
    if (at === -1) at = 0;
    const [ex] = pool.splice(at, 1);
    picked.push(ex);
    perTarget.set(ex.target, (perTarget.get(ex.target) ?? 0) + 1);
  }

  return picked.map(newWorkoutItem);
}
