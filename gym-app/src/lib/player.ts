import type { WorkoutItem } from "./types";

/**
 * Pure state machine behind the workout player. The UI calls `tick` once a
 * second and the other functions on button presses; nothing here touches
 * the DOM or timers, so it is easy to test.
 */

export type Phase = "work" | "rest" | "done";

export interface PlayerState {
  /** Current exercise (or, during rest, the one coming up). */
  itemIndex: number;
  /** Current set, 0-based (or, during rest, the one coming up). */
  setIndex: number;
  phase: Phase;
  /** Seconds left. For rep-based work this stays 0 (user taps "Done"). */
  remaining: number;
  completedSets: number;
}

/** Items with no sets can't be played. */
export function playable(items: WorkoutItem[]): WorkoutItem[] {
  return items.filter((it) => it.sets > 0);
}

export function totalSets(items: WorkoutItem[]): number {
  return items.reduce((sum, it) => sum + Math.max(0, it.sets), 0);
}

function workStart(item: WorkoutItem): number {
  return item.mode === "time" ? item.holdSec : 0;
}

export function initialState(items: WorkoutItem[]): PlayerState {
  if (items.length === 0) {
    return { itemIndex: 0, setIndex: 0, phase: "done", remaining: 0, completedSets: 0 };
  }
  return { itemIndex: 0, setIndex: 0, phase: "work", remaining: workStart(items[0]), completedSets: 0 };
}

/** Rest is over (or skipped): start working on the upcoming set. */
export function endRest(items: WorkoutItem[], s: PlayerState): PlayerState {
  if (s.phase !== "rest") return s;
  return { ...s, phase: "work", remaining: workStart(items[s.itemIndex]) };
}

/** The current set is finished: rest, then move on (or finish the workout). */
export function completeSet(items: WorkoutItem[], s: PlayerState): PlayerState {
  if (s.phase !== "work") return s;
  const item = items[s.itemIndex];
  const completedSets = s.completedSets + 1;
  const lastSet = s.setIndex >= item.sets - 1;
  const lastItem = s.itemIndex >= items.length - 1;

  if (lastSet && lastItem) {
    return { ...s, phase: "done", remaining: 0, completedSets };
  }

  const next: PlayerState = {
    itemIndex: lastSet ? s.itemIndex + 1 : s.itemIndex,
    setIndex: lastSet ? 0 : s.setIndex + 1,
    phase: "rest",
    remaining: item.restSec,
    completedSets,
  };
  return item.restSec > 0 ? next : endRest(items, next);
}

/** Advance the clock by one second. */
export function tick(items: WorkoutItem[], s: PlayerState): PlayerState {
  if (s.phase === "rest") {
    const remaining = s.remaining - 1;
    return remaining > 0 ? { ...s, remaining } : endRest(items, { ...s, remaining: 0 });
  }
  if (s.phase === "work" && items[s.itemIndex]?.mode === "time") {
    const remaining = s.remaining - 1;
    return remaining > 0 ? { ...s, remaining } : completeSet(items, { ...s, remaining: 0 });
  }
  return s;
}

export function addRest(s: PlayerState, seconds: number): PlayerState {
  return s.phase === "rest" ? { ...s, remaining: Math.max(0, s.remaining + seconds) } : s;
}

/** Jump to the first set of the next exercise (no set credit). */
export function skipExercise(items: WorkoutItem[], s: PlayerState): PlayerState {
  if (s.phase === "done") return s;
  // During rest `itemIndex` is already the upcoming exercise, so skipping
  // moves one past it; during work it moves one past the current exercise.
  const nextIndex = s.itemIndex + 1;
  if (nextIndex >= items.length) {
    return { ...s, phase: "done", remaining: 0 };
  }
  return {
    ...s,
    itemIndex: nextIndex,
    setIndex: 0,
    phase: "work",
    remaining: workStart(items[nextIndex]),
  };
}

/** Restart the current exercise, or go back one exercise if already at its first set. */
export function previousExercise(items: WorkoutItem[], s: PlayerState): PlayerState {
  const atStart = s.phase === "work" && s.setIndex === 0;
  const target = s.phase === "done" ? items.length - 1 : atStart ? Math.max(0, s.itemIndex - 1) : s.itemIndex;
  return {
    ...s,
    itemIndex: target,
    setIndex: 0,
    phase: "work",
    remaining: workStart(items[target]),
  };
}

/** 0..1 fill for exercise `index` in the segmented progress bar. */
export function segmentFill(items: WorkoutItem[], s: PlayerState, index: number): number {
  if (s.phase === "done" || index < s.itemIndex) return 1;
  if (index === s.itemIndex) return Math.min(1, s.setIndex / Math.max(1, items[index].sets));
  return 0;
}

/** 0..1 share of all sets completed. */
export function progress(items: WorkoutItem[], s: PlayerState): number {
  const total = totalSets(items);
  return total === 0 ? 1 : Math.min(1, s.completedSets / total);
}

/**
 * Which exercises (and how many sets of each) a finished or abandoned session counts as,
 * for the workout history. Completed sets are handed out in workout order.
 */
export function loggedExercises(
  items: WorkoutItem[],
  completedSets: number,
  nameOf: (exerciseId: string) => string,
): { exerciseId: string; name: string; sets: number }[] {
  let left = Math.max(0, completedSets);
  const out: { exerciseId: string; name: string; sets: number }[] = [];
  for (const it of items) {
    if (left <= 0) break;
    const sets = Math.min(it.sets, left);
    left -= sets;
    if (sets > 0) out.push({ exerciseId: it.exerciseId, name: nameOf(it.exerciseId), sets });
  }
  return out;
}
