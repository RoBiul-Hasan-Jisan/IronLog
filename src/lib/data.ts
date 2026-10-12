import fullData from "../data/exercises.json";
import indexData from "../data/exercises-index.json";
import type { Exercise, ExerciseSummary } from "./types";

// Server-side access to the exercise library. The full file (steps, GIF paths)
// stays on the server; the browser only ever receives the small index or
// individual exercises through the API route.

const all = fullData as unknown as Exercise[];
const byId = new Map(all.map((e) => [e.id, e]));

export const exerciseIndex = indexData as unknown as ExerciseSummary[];

export function getExercise(id: string): Exercise | undefined {
  return byId.get(id);
}

/** Returns the exercises for the given ids, in the same order, skipping unknown ids. */
export function getExercises(ids: string[]): Exercise[] {
  return ids.map((id) => byId.get(id)).filter((e): e is Exercise => e !== undefined);
}

/** Exercises that train the same muscle (then the same body part), excluding the one given. */
export function relatedExercises(ex: ExerciseSummary, limit = 6): ExerciseSummary[] {
  const score = (e: ExerciseSummary) => (e.target === ex.target ? 2 : 0) + (e.bodyPart === ex.bodyPart ? 1 : 0);
  return exerciseIndex
    .filter((e) => e.id !== ex.id && score(e) > 0)
    .sort((a, b) => score(b) - score(a) || a.name.localeCompare(b.name))
    .slice(0, limit);
}
