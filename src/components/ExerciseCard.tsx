import Link from "next/link";
import type { ExerciseSummary } from "@/lib/types";
import { titleCase } from "@/lib/format";
import { isTimed } from "@/lib/prescription";
import { AddToWorkoutButton } from "./AddToWorkoutButton";
import { ExerciseMedia } from "./ExerciseMedia";

export function ExerciseCard({ exercise }: { exercise: ExerciseSummary }) {
  const name = titleCase(exercise.name);
  return (
    <li className="flex flex-col overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-900">
      <Link
        href={`/exercises/${exercise.id}`}
        className="group block focus-visible:outline-2 focus-visible:outline-lime-300"
        aria-label={`${name} — view steps and timing`}
      >
        <ExerciseMedia
          path={exercise.image}
          alt={name}
          className="aspect-square w-full transition-transform duration-300 group-hover:scale-[1.02]"
        />
      </Link>
      <div className="flex flex-1 flex-col gap-2 p-3">
        <Link href={`/exercises/${exercise.id}`} className="line-clamp-2 min-h-10 text-sm font-semibold leading-5 hover:text-lime-300">
          {name}
        </Link>
        <div className="flex flex-wrap gap-1.5 text-[11px] text-zinc-400">
          <span className="rounded-full bg-zinc-800 px-2 py-0.5 capitalize">{exercise.target}</span>
          <span className="rounded-full bg-zinc-800 px-2 py-0.5 capitalize">{exercise.equipment}</span>
          {isTimed(exercise) && (
            <span className="rounded-full bg-sky-950 px-2 py-0.5 text-sky-300">Timed</span>
          )}
        </div>
        <div className="mt-auto pt-1">
          <AddToWorkoutButton exercise={exercise} />
        </div>
      </div>
    </li>
  );
}
