import type { ExerciseSummary, WorkoutItem } from "./types";

/** Average seconds one controlled rep takes (used for time estimates). */
export const SEC_PER_REP = 4;
/** Seconds to walk to / set up the next exercise. */
export const TRANSITION_SEC = 20;

const TIMED_NAME = /stretch|plank|hold|isometric|wall sit|hang|pose|bridge hold/i;

/** Stretches, holds and cardio are done for time rather than reps. */
export function isTimed(ex: Pick<ExerciseSummary, "name" | "bodyPart">): boolean {
  return ex.bodyPart === "cardio" || TIMED_NAME.test(ex.name);
}

/** Sensible starting prescription for an exercise. */
export function defaultPrescription(
  ex: Pick<ExerciseSummary, "name" | "bodyPart">,
): Omit<WorkoutItem, "exerciseId"> {
  if (isTimed(ex)) {
    const cardio = ex.bodyPart === "cardio";
    return {
      mode: "time",
      sets: cardio ? 3 : 2,
      reps: 0,
      holdSec: cardio ? 45 : 30,
      restSec: cardio ? 30 : 15,
    };
  }
  return { mode: "reps", sets: 3, reps: 12, holdSec: 0, restSec: 60 };
}

export function newWorkoutItem(ex: Pick<ExerciseSummary, "id" | "name" | "bodyPart">): WorkoutItem {
  return { exerciseId: ex.id, ...defaultPrescription(ex) };
}

/** Seconds of actual work in a single set. */
export function workSeconds(item: WorkoutItem): number {
  return item.mode === "time" ? item.holdSec : item.reps * SEC_PER_REP;
}

/** Estimated seconds for one exercise: all sets plus rests between them. */
export function estimateItemSeconds(item: WorkoutItem): number {
  const sets = Math.max(0, item.sets);
  if (sets === 0) return 0;
  return sets * workSeconds(item) + (sets - 1) * item.restSec;
}

/** Estimated seconds for a whole workout, including transitions. */
export function estimateWorkoutSeconds(items: WorkoutItem[]): number {
  if (items.length === 0) return 0;
  const body = items.reduce((sum, it) => sum + estimateItemSeconds(it), 0);
  return body + (items.length - 1) * TRANSITION_SEC;
}

/** "1 set" / "9 sets" across the whole workout. */
export function totalSetsLabel(items: WorkoutItem[]): string {
  const n = items.reduce((sum, it) => sum + Math.max(0, it.sets), 0);
  return `${n} ${n === 1 ? "set" : "sets"}`;
}

/** "3 × 12 reps" or "2 × 30 sec" */
export function describePrescription(item: WorkoutItem): string {
  return item.mode === "time"
    ? `${item.sets} × ${item.holdSec} sec`
    : `${item.sets} × ${item.reps} reps`;
}
