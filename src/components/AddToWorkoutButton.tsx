"use client";

import type { ExerciseSummary } from "@/lib/types";
import { useWorkout } from "./WorkoutProvider";

interface Props {
  exercise: Pick<ExerciseSummary, "id" | "name" | "bodyPart">;
  /** "compact" for cards, "full" for the detail page. */
  size?: "compact" | "full";
}

export function AddToWorkoutButton({ exercise, size = "compact" }: Props) {
  const { ready, has, add, remove } = useWorkout();
  const added = ready && has(exercise.id);

  const base =
    size === "full"
      ? "rounded-xl px-5 py-3 text-base font-bold"
      : "rounded-lg px-3 py-1.5 text-xs font-semibold";
  const tone = added
    ? "bg-zinc-800 text-lime-300 ring-1 ring-lime-400/40 hover:bg-zinc-700"
    : "bg-lime-400 text-zinc-950 hover:bg-lime-300";

  return (
    <button
      type="button"
      onClick={() => (added ? remove(exercise.id) : add(exercise))}
      aria-pressed={added}
      className={`${base} ${tone} transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-lime-300`}
    >
      {added ? "✓ In workout" : "+ Add to workout"}
    </button>
  );
}
