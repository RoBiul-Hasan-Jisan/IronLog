"use client";

import { useRouter } from "next/navigation";
import type { WorkoutItem } from "@/lib/types";
import { Icon } from "./icons";
import { ExerciseMedia } from "./ExerciseMedia";
import { Plate } from "./Plate";
import { useWorkout } from "./WorkoutProvider";

export interface SessionPreview {
  id: string;
  title: string;
  subtitle: string;
  items: WorkoutItem[];
  exercises: { id: string; name: string; image: string; bodyPart: string }[];
  minutes: number;
  sets: number;
  bodyParts: string[];
}

const MAX_THUMBS = 5;

/** A ready-made session with the exercises it actually contains. */
export function SessionCard({ session }: { session: SessionPreview }) {
  const { replace } = useWorkout();
  const router = useRouter();

  const load = (to: string) => {
    replace(session.items);
    router.push(to);
  };

  const shown = session.exercises.slice(0, MAX_THUMBS);
  const extra = session.exercises.length - shown.length;

  return (
    <li className="session">
      <div>
        <h3 className="session-title">{session.title}</h3>
        <p className="session-sub">{session.subtitle}</p>
      </div>

      <div className="thumbs">
        {shown.map((ex) => (
          <div key={ex.id} className="thumb" title={ex.name}>
            <ExerciseMedia path={ex.image} alt={ex.name} className="thumb-img" />
          </div>
        ))}
        {extra > 0 && <div className="thumb thumb--more">+{extra}</div>}
      </div>

      <div className="session-stats">
        <div>
          <span className="stat-value display">{session.minutes}</span>
          <span className="stat-label">minutes</span>
        </div>
        <div>
          <span className="stat-value display">{session.exercises.length}</span>
          <span className="stat-label">exercises</span>
        </div>
        <div>
          <span className="stat-value display">{session.sets}</span>
          <span className="stat-label">sets</span>
        </div>
      </div>

      <div className="session-plates">
        {session.bodyParts.map((bp) => (
          <span key={bp}>
            <Plate bodyPart={bp} size={14} />
            {bp}
          </span>
        ))}
      </div>

      <div className="session-actions">
        <button type="button" className="btn btn--primary" onClick={() => load("/workout/play")}>
          <Icon name="play" size={16} />
          Start now
        </button>
        <button type="button" className="btn btn--secondary" onClick={() => load("/workout")}>
          Customize
        </button>
      </div>
    </li>
  );
}
