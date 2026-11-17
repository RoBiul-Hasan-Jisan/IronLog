import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getExercise, relatedExercises } from "@/lib/data";
import { formatDuration, titleCase } from "@/lib/format";
import { defaultPrescription, estimateItemSeconds, isTimed } from "@/lib/prescription";
import type { WorkoutItem } from "@/lib/types";
import { AddToWorkoutButton } from "@/components/AddToWorkoutButton";
import { ExerciseCard } from "@/components/ExerciseCard";
import { ExerciseMedia } from "@/components/ExerciseMedia";
import { Icon } from "@/components/icons";
import { Plate } from "@/components/Plate";
import { SetTimer } from "@/components/SetTimer";
import { CustomExerciseView } from "@/components/CustomExerciseView";

type Props = { params: Promise<{ id: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  if (id.startsWith("c_")) return { title: "Exercise" };
  const ex = getExercise(id);
  return { title: ex ? titleCase(ex.name) : "Exercise not found" };
}

export default async function ExercisePage({ params }: Props) {
  const { id } = await params;
  if (id.startsWith("c_")) return <CustomExerciseView id={id} />;
  const ex = getExercise(id);
  if (!ex) return notFound();

  const name = titleCase(ex.name);
  const item: WorkoutItem = { exerciseId: ex.id, ...defaultPrescription(ex) };
  const timed = item.mode === "time";
  const total = estimateItemSeconds(item);
  const related = relatedExercises(ex, 10);

  return (
    <article>
      <Link href={`/exercises?bodyPart=${encodeURIComponent(ex.bodyPart)}`} className="crumb">
        <Icon name="chevronLeft" size={18} />
        {titleCase(ex.bodyPart)} exercises
      </Link>

      <div className="detail">
        <div className="detail-media">
          <ExerciseMedia path={ex.gif} alt={`${name} demonstration`} eager />
        </div>

        <div>
          <p className="kicker">
            <Plate bodyPart={ex.bodyPart} size={22} />
            {ex.bodyPart}
          </p>
          <h1 className="detail-title">{name}</h1>

          <dl className="facts">
            <div className="fact">
              <dt>Target muscle</dt>
              <dd>{ex.target}</dd>
            </div>
            <div className="fact">
              <dt>Equipment</dt>
              <dd>{ex.equipment}</dd>
            </div>
            <div className="fact">
              <dt>Done by</dt>
              <dd>{timed ? "Time" : "Reps"}</dd>
            </div>
          </dl>

          {ex.secondary.length > 0 && (
            <div className="also">
              <span>Also works</span>
              {ex.secondary.map((m) => (
                <span key={m} className="chip chip--static capitalize">
                  {m}
                </span>
              ))}
            </div>
          )}

          <section className="rx" aria-labelledby="rx-title">
            <h2 id="rx-title" className="rx-title">
              Suggested for this exercise
            </h2>
            <div className="rx-grid">
              <div className="rx-item">
                <span className="rx-value display">{item.sets}</span>
                <span className="rx-label">sets</span>
              </div>
              <div className="rx-item">
                <span className="rx-value display">{timed ? item.holdSec : item.reps}</span>
                <span className="rx-label">{timed ? "seconds each" : "reps each"}</span>
              </div>
              <div className="rx-item">
                <span className="rx-value display">{item.restSec}</span>
                <span className="rx-label">seconds rest</span>
              </div>
            </div>
            <p className="rx-note">About {formatDuration(total)} in total, rest included.</p>
          </section>

          <div className="actions">
            <AddToWorkoutButton exercise={ex} variant="full" />
          </div>
        </div>
      </div>

      <section className="section" aria-labelledby="steps">
        <div className="section-head">
          <h2 id="steps" className="h2">
            How to do it
          </h2>
        </div>
        <ol className="steps">
          {ex.steps.map((step, i) => (
            <li key={i} className="step">
              <span className="step-num display" aria-hidden="true">
                {i + 1}
              </span>
              <p className="step-text">
                <span className="sr-only">Step {i + 1}: </span>
                {step}
              </p>
            </li>
          ))}
        </ol>
      </section>

      <section className="section" aria-labelledby="timers">
        <div className="section-head">
          <h2 id="timers" className="h2">
            Time your sets
          </h2>
        </div>
        <SetTimer suggestedRestSec={item.restSec} />
      </section>

      {related.length > 0 && (
        <section className="section" aria-labelledby="related">
          <div className="section-head">
            <h2 id="related" className="h2">
              Similar exercises
            </h2>
          </div>
          <ul className="tiles tiles--row">
            {related.map((r) => (
              <ExerciseCard key={r.id} exercise={r} />
            ))}
          </ul>
        </section>
      )}
    </article>
  );
}
