import Link from "next/link";
import type { ExerciseSummary } from "@/lib/types";
import { titleCase } from "@/lib/format";
import { isTimed } from "@/lib/prescription";
import { AddToWorkoutButton } from "./AddToWorkoutButton";
import { ExerciseThumb } from "./ExerciseThumb";
import { Plate } from "./Plate";

export function ExerciseCard({ exercise }: { exercise: ExerciseSummary }) {
  const name = titleCase(exercise.name);
  const href = `/exercises/${exercise.id}`;
  return (
    <li className="tile">
      <div className="tile-media">
        <ExerciseThumb href={href} image={exercise.image} label={name} />
        <AddToWorkoutButton exercise={exercise} variant="icon" />
        {isTimed(exercise) && <span className="tile-flag">Timed</span>}
      </div>
      <Link href={href} className="tile-name">
        {name}
      </Link>
      <p className="tile-meta">
        <Plate bodyPart={exercise.bodyPart} size={14} />
        <span>{exercise.target}</span>
        <span className="tile-equip">{exercise.equipment}</span>
      </p>
    </li>
  );
}
