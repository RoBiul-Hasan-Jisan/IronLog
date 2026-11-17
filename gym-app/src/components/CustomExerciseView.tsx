"use client";

import Link from "next/link";
import { titleCase } from "@/lib/format";
import { useOverlay } from "@/lib/useOverlay";
import { ExerciseMedia } from "./ExerciseMedia";
import { Icon } from "./icons";
import { Plate } from "./Plate";

/** Detail page for an exercise an admin created. */
export function CustomExerciseView({ id }: { id: string }) {
  const { custom } = useOverlay();
  const ex = custom.find((c) => c.id === id);

  if (!ex) {
    return (
      <div className="message">
        <h1>Loading exercise…</h1>
        <p>If this stays, the exercise may have been removed.</p>
        <Link href="/exercises" className="btn btn--primary">
          Browse exercises
        </Link>
      </div>
    );
  }
  const name = titleCase(ex.name);
  const media = ex.gifUrl || ex.imageUrl;
  return (
    <article>
      <Link href="/exercises" className="crumb">
        <Icon name="chevronLeft" size={18} />
        All exercises
      </Link>
      <div className="detail">
        <div className="detail-media">{media ? <ExerciseMedia path={media} alt={`${name} demonstration`} eager /> : <div className="media-missing">No preview</div>}</div>
        <div>
          <p className="kicker">
            <Plate bodyPart={ex.bodyPart} size={22} />
            {ex.bodyPart}
          </p>
          <h1 className="detail-title">{name}</h1>
          <dl className="facts">
            <div className="fact"><dt>Target muscle</dt><dd>{ex.target}</dd></div>
            <div className="fact"><dt>Equipment</dt><dd>{ex.equipment}</dd></div>
          </dl>
          {ex.secondary.length > 0 && (
            <div className="also">
              <span>Also works</span>
              {ex.secondary.map((m) => (
                <span key={m} className="chip chip--static capitalize">{m}</span>
              ))}
            </div>
          )}
        </div>
      </div>
      <section className="section" aria-labelledby="steps">
        <div className="section-head"><h2 id="steps" className="h2">How to do it</h2></div>
        <ol className="steps">
          {ex.steps.map((step, i) => (
            <li key={i} className="step">
              <span className="step-num display" aria-hidden="true">{i + 1}</span>
              <p className="step-text"><span className="sr-only">Step {i + 1}: </span>{step}</p>
            </li>
          ))}
        </ol>
      </section>
    </article>
  );
}
