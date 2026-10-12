"use client";

import type { ExerciseSummary } from "@/lib/types";
import { Icon } from "./icons";
import { useWorkout } from "./WorkoutProvider";

interface Props {
  exercise: Pick<ExerciseSummary, "id" | "name" | "bodyPart">;
  /** "icon": round button on a tile. "full": labelled button on the detail page. */
  variant?: "icon" | "full";
}

export function AddToWorkoutButton({ exercise, variant = "icon" }: Props) {
  const { ready, has, add, remove } = useWorkout();
  const added = ready && has(exercise.id);
  const toggle = () => (added ? remove(exercise.id) : add(exercise));

  if (variant === "icon") {
    return (
      <button
        type="button"
        onClick={toggle}
        aria-pressed={added}
        aria-label={added ? "Remove from workout" : "Add to workout"}
        title={added ? "Remove from workout" : "Add to workout"}
        className={`tile-add${added ? " tile-add--on" : ""}`}
      >
        <Icon name={added ? "check" : "plus"} size={18} />
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={toggle}
      aria-pressed={added}
      className={`btn btn--lg ${added ? "btn--secondary" : "btn--primary"}`}
    >
      <Icon name={added ? "check" : "plus"} size={20} />
      {added ? "In your workout" : "Add to workout"}
    </button>
  );
}
