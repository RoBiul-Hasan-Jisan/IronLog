import Link from "next/link";
import { exerciseIndex } from "@/lib/data";
import { buildFacets } from "@/lib/search";
import { estimateWorkoutSeconds } from "@/lib/prescription";
import { PRESETS, generateWorkout } from "@/lib/workouts";
import { Plate } from "@/components/Plate";
import { SessionCard, type SessionPreview } from "@/components/SessionCard";

// Sessions are re-picked each day, so this page must be rendered per request.
export const dynamic = "force-dynamic";

function todaysSessions(): SessionPreview[] {
  const day = Number(new Date().toISOString().slice(0, 10).replace(/-/g, ""));
  const byId = new Map(exerciseIndex.map((e) => [e.id, e]));

  return PRESETS.map((preset, i) => {
    const items = generateWorkout(exerciseIndex, preset, day + i * 997);
    const exercises = items.flatMap((it) => {
      const ex = byId.get(it.exerciseId);
      return ex ? [{ id: ex.id, name: ex.name, image: ex.image, bodyPart: ex.bodyPart }] : [];
    });
    return {
      id: preset.id,
      title: preset.title,
      subtitle: preset.subtitle,
      items,
      exercises,
      minutes: Math.max(1, Math.round(estimateWorkoutSeconds(items) / 60)),
      sets: items.reduce((sum, it) => sum + it.sets, 0),
      bodyParts: [...new Set(exercises.map((e) => e.bodyPart))],
    };
  });
}

export const metadata = { title: "Train" };

export default function TrainPage() {
  const bodyParts = buildFacets(exerciseIndex).bodyParts;
  const sessions = todaysSessions();

  return (
    <div>
      <header>
        <h1 className="page-title">What are we training today?</h1>
        <p className="page-sub">
          Choose a muscle group to see its exercises, or start one of today&apos;s sessions below. Every exercise comes
          with an animation, the steps, and how long it takes.
        </p>
      </header>

      <ul className="plate-grid" aria-label="Muscle groups">
        {bodyParts.map((bp) => (
          <li key={bp.name}>
            <Link href={`/exercises?bodyPart=${encodeURIComponent(bp.name)}`} className="plate-link">
              <Plate bodyPart={bp.name} size={40} hole="var(--paper)" />
              <span>
                <span className="plate-link-name">{bp.name}</span>
                <span className="plate-link-count">{bp.count} exercises</span>
              </span>
            </Link>
          </li>
        ))}
      </ul>

      <section className="section" aria-labelledby="sessions">
        <div className="section-head">
          <h2 id="sessions" className="h2">
            Today&apos;s sessions
          </h2>
          <p>New picks every day. Start as they are, or change anything first.</p>
        </div>
        <ul className="sessions">
          {sessions.map((s) => (
            <SessionCard key={s.id} session={s} />
          ))}
        </ul>
      </section>

      <section className="section" style={{ textAlign: "center" }}>
        <Link href="/exercises" className="btn btn--secondary btn--lg">
          Browse all {exerciseIndex.length.toLocaleString()} exercises
        </Link>
      </section>
    </div>
  );
}
