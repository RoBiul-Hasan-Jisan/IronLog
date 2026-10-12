"use client";

import Link from "next/link";
import { useMemo } from "react";
import type { WorkoutItem } from "@/lib/types";
import { LIMITS, clampField, type NumericField } from "@/lib/workoutStorage";
import { estimateItemSeconds, estimateWorkoutSeconds, totalSetsLabel } from "@/lib/prescription";
import { formatDuration, titleCase } from "@/lib/format";
import { ExerciseMedia } from "./ExerciseMedia";
import { Icon } from "./icons";
import { Plate } from "./Plate";
import { PresetPicker } from "./PresetPicker";
import { useExerciseDetails } from "./useExerciseDetails";
import { useWorkout } from "./WorkoutProvider";

function Stepper({
  label,
  field,
  value,
  step,
  unit = "",
  onChange,
}: {
  label: string;
  field: NumericField;
  value: number;
  step: number;
  unit?: string;
  onChange: (next: number) => void;
}) {
  const { min, max } = LIMITS[field];
  return (
    <div className="field">
      <span>{label}</span>
      <div className="stepper" role="group" aria-label={label}>
        <button
          type="button"
          className="stepper-btn"
          aria-label={`Decrease ${label.toLowerCase()}`}
          disabled={value <= min}
          onClick={() => onChange(clampField(field, value - step))}
        >
          <Icon name="minus" size={16} />
        </button>
        <span className="stepper-value display">
          {value}
          {unit}
        </span>
        <button
          type="button"
          className="stepper-btn"
          aria-label={`Increase ${label.toLowerCase()}`}
          disabled={value >= max}
          onClick={() => onChange(clampField(field, value + step))}
        >
          <Icon name="plus" size={16} />
        </button>
      </div>
    </div>
  );
}

function ItemRow({
  item,
  index,
  count,
  name,
  image,
  bodyPart,
  target,
}: {
  item: WorkoutItem;
  index: number;
  count: number;
  name: string | null;
  image: string | null;
  bodyPart: string | null;
  target: string | null;
}) {
  const { update, remove, move } = useWorkout();
  const id = item.exerciseId;
  const timed = item.mode === "time";

  return (
    <li className="row">
      <div className="row-thumb">
        {image ? (
          <Link href={`/exercises/${id}`} aria-label={`${name ?? "Exercise"}: steps and timing`}>
            <ExerciseMedia path={image} alt="" />
          </Link>
        ) : (
          <div className="skeleton" />
        )}
        <span className="row-index" aria-label={`Exercise ${index + 1}`}>
          {index + 1}
        </span>
      </div>

      <div className="row-main">
        <div className="row-top">
          <div>
            <Link href={`/exercises/${id}`} className="row-name">
              {name ?? "Loading…"}
            </Link>
            <p className="row-sub">
              {bodyPart && <Plate bodyPart={bodyPart} size={14} />}
              <span className="capitalize">{target}</span>
              <span className="row-time">
                <Icon name="clock" size={14} />
                {formatDuration(estimateItemSeconds(item))}
              </span>
            </p>
          </div>
          <div className="row-actions">
            <button type="button" className="btn btn--quiet btn--icon" disabled={index === 0} onClick={() => move(id, -1)} aria-label="Move up">
              <Icon name="arrowUp" size={18} />
            </button>
            <button type="button" className="btn btn--quiet btn--icon" disabled={index === count - 1} onClick={() => move(id, 1)} aria-label="Move down">
              <Icon name="arrowDown" size={18} />
            </button>
            <button type="button" className="btn btn--danger btn--icon" onClick={() => remove(id)} aria-label="Remove from workout">
              <Icon name="trash" size={18} />
            </button>
          </div>
        </div>
        <div className="seg" role="group" aria-label="Count by">
          <button type="button" className="seg-btn" aria-pressed={!timed} onClick={() => update(id, { mode: "reps", reps: 12, holdSec: 0 })}>
            Reps
          </button>
          <button type="button" className="seg-btn" aria-pressed={timed} onClick={() => update(id, { mode: "time", reps: 0, holdSec: 30 })}>
            Timed
          </button>
        </div>
      </div>

      <div className="row-controls">
        <Stepper label="Sets" field="sets" value={item.sets} step={1} onChange={(v) => update(id, { sets: v })} />
        {timed ? (
          <Stepper label="Seconds per set" field="holdSec" value={item.holdSec} step={5} onChange={(v) => update(id, { holdSec: v })} />
        ) : (
          <Stepper label="Reps per set" field="reps" value={item.reps} step={1} onChange={(v) => update(id, { reps: v })} />
        )}
        <Stepper label="Rest" field="restSec" value={item.restSec} step={15} unit="s" onChange={(v) => update(id, { restSec: v })} />
      </div>
    </li>
  );
}

export function WorkoutBuilder() {
  const { items, ready, clear } = useWorkout();
  const ids = useMemo(() => items.map((i) => i.exerciseId), [items]);
  const { details } = useExerciseDetails(ids);

  const muscles = useMemo(() => {
    const counts = new Map<string, number>();
    for (const item of items) {
      const ex = details[item.exerciseId];
      if (ex) counts.set(ex.bodyPart, (counts.get(ex.bodyPart) ?? 0) + 1);
    }
    return [...counts.entries()].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]));
  }, [items, details]);

  if (!ready) {
    return <p className="message">Loading your workout…</p>;
  }

  if (items.length === 0) {
    return (
      <div>
        <div className="empty">
          <h2 className="h2">Your workout is empty</h2>
          <p>Start from a ready-made workout below, or add exercises from the library.</p>
          <Link href="/exercises" className="btn btn--primary btn--lg">
            Browse exercises
          </Link>
        </div>
        <section className="section" aria-labelledby="presets">
          <div className="section-head">
            <h2 id="presets" className="h2">
              Ready-made workouts
            </h2>
          </div>
          <PresetPicker />
        </section>
      </div>
    );
  }

  const minutes = Math.max(1, Math.round(estimateWorkoutSeconds(items) / 60));
  const setsTotal = items.reduce((sum, i) => sum + i.sets, 0);

  return (
    <div>
      <div className="builder">
        <aside className="summary" aria-label="Workout summary">
          <p className="summary-title">This workout</p>
          <p className="summary-time display">
            {minutes}
            <small>minutes</small>
          </p>
          <div className="summary-stats">
            <div>
              <span className="stat-value display">{items.length}</span>
              <span className="stat-label">exercises</span>
            </div>
            <div>
              <span className="stat-value display">{setsTotal}</span>
              <span className="stat-label">{totalSetsLabel(items).replace(/^\d+\s/, "")}</span>
            </div>
          </div>

          {muscles.length > 0 && (
            <ul className="summary-muscles" aria-label="Muscle groups in this workout">
              {muscles.map(([bp, n]) => (
                <li key={bp}>
                  <Plate bodyPart={bp} size={18} />
                  {bp}
                  <b>{n}</b>
                </li>
              ))}
            </ul>
          )}

          <Link href="/workout/play" className="btn btn--primary btn--lg btn--block">
            <Icon name="play" size={18} />
            Start workout
          </Link>
          <div className="summary-links">
            <Link href="/exercises" className="btn btn--quiet btn--block">
              <Icon name="plus" size={16} />
              Add exercises
            </Link>
            <button
              type="button"
              className="btn btn--danger btn--block"
              onClick={() => {
                if (window.confirm("Remove every exercise from this workout?")) clear();
              }}
            >
              Clear workout
            </button>
          </div>
        </aside>

        <ol className="rows">
          {items.map((item, i) => {
            const ex = details[item.exerciseId];
            return (
              <ItemRow
                key={item.exerciseId}
                item={item}
                index={i}
                count={items.length}
                name={ex ? titleCase(ex.name) : null}
                image={ex ? ex.image : null}
                bodyPart={ex ? ex.bodyPart : null}
                target={ex ? ex.target : null}
              />
            );
          })}
        </ol>
      </div>

      <details className="panel">
        <summary>Replace with a ready-made workout</summary>
        <PresetPicker />
      </details>
    </div>
  );
}
