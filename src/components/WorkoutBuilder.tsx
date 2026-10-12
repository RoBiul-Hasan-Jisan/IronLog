"use client";

import Link from "next/link";
import { useMemo } from "react";
import type { WorkoutItem } from "@/lib/types";
import { LIMITS, clampField, type NumericField } from "@/lib/workoutStorage";
import { estimateItemSeconds, estimateWorkoutSeconds, totalSetsLabel } from "@/lib/prescription";
import { formatDuration, titleCase } from "@/lib/format";
import { ExerciseMedia } from "./ExerciseMedia";
import { PresetPicker } from "./PresetPicker";
import { useExerciseDetails } from "./useExerciseDetails";
import { useWorkout } from "./WorkoutProvider";

function Stepper({
  label,
  field,
  value,
  step,
  suffix = "",
  onChange,
}: {
  label: string;
  field: NumericField;
  value: number;
  step: number;
  suffix?: string;
  onChange: (next: number) => void;
}) {
  const { min, max } = LIMITS[field];
  const btn =
    "flex size-8 items-center justify-center rounded-lg bg-zinc-800 text-lg font-bold leading-none hover:bg-zinc-700 disabled:opacity-30 focus-visible:outline-2 focus-visible:outline-lime-300";
  return (
    <div className="flex flex-col items-center gap-1">
      <span className="text-[11px] font-semibold uppercase tracking-wider text-zinc-500">{label}</span>
      <div className="flex items-center gap-2">
        <button
          type="button"
          className={btn}
          aria-label={`Decrease ${label}`}
          disabled={value <= min}
          onClick={() => onChange(clampField(field, value - step))}
        >
          −
        </button>
        <span className="tabular w-14 text-center text-lg font-black">
          {value}
          {suffix}
        </span>
        <button
          type="button"
          className={btn}
          aria-label={`Increase ${label}`}
          disabled={value >= max}
          onClick={() => onChange(clampField(field, value + step))}
        >
          +
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
}: {
  item: WorkoutItem;
  index: number;
  count: number;
  name: string | null;
  image: string | null;
}) {
  const { update, remove, move } = useWorkout();
  const id = item.exerciseId;
  const timed = item.mode === "time";

  const small =
    "rounded-lg px-2.5 py-1.5 text-xs font-semibold hover:bg-zinc-800 disabled:opacity-30 focus-visible:outline-2 focus-visible:outline-lime-300";

  return (
    <li className="rounded-2xl border border-zinc-800 bg-zinc-900 p-3 sm:p-4">
      <div className="flex gap-3">
        <span className="hidden w-6 shrink-0 pt-1 text-center text-lg font-black text-zinc-600 sm:block">
          {index + 1}
        </span>
        {image ? (
          <Link href={`/exercises/${id}`} className="shrink-0" aria-label={`${name ?? "Exercise"} details`}>
            <ExerciseMedia path={image} alt="" className="size-20 rounded-xl sm:size-24" />
          </Link>
        ) : (
          <div className="size-20 shrink-0 animate-pulse rounded-xl bg-zinc-800 sm:size-24" />
        )}
        <div className="min-w-0 flex-1">
          <Link
            href={`/exercises/${id}`}
            className="line-clamp-2 font-bold leading-5 hover:text-lime-300"
          >
            {name ?? "Loading…"}
          </Link>
          <p className="mt-1 text-sm text-zinc-400">About {formatDuration(estimateItemSeconds(item))}</p>
          <div className="mt-2 inline-flex rounded-lg bg-zinc-800 p-0.5 text-xs font-semibold" role="group" aria-label="Count by">
            <button
              type="button"
              aria-pressed={!timed}
              onClick={() => update(id, { mode: "reps", reps: 12, holdSec: 0 })}
              className={`rounded-md px-3 py-1 ${!timed ? "bg-lime-400 text-zinc-950" : "text-zinc-300"}`}
            >
              Reps
            </button>
            <button
              type="button"
              aria-pressed={timed}
              onClick={() => update(id, { mode: "time", reps: 0, holdSec: 30 })}
              className={`rounded-md px-3 py-1 ${timed ? "bg-lime-400 text-zinc-950" : "text-zinc-300"}`}
            >
              Timed
            </button>
          </div>
        </div>
      </div>

      <div className="mt-4 flex flex-wrap items-end justify-between gap-x-4 gap-y-3 border-t border-zinc-800 pt-3">
        <div className="flex flex-wrap gap-x-5 gap-y-3">
          <Stepper label="Sets" field="sets" value={item.sets} step={1} onChange={(v) => update(id, { sets: v })} />
          {timed ? (
            <Stepper label="Seconds" field="holdSec" value={item.holdSec} step={5} onChange={(v) => update(id, { holdSec: v })} />
          ) : (
            <Stepper label="Reps" field="reps" value={item.reps} step={1} onChange={(v) => update(id, { reps: v })} />
          )}
          <Stepper label="Rest" field="restSec" value={item.restSec} step={15} suffix="s" onChange={(v) => update(id, { restSec: v })} />
        </div>
        <div className="flex gap-1">
          <button type="button" className={small} disabled={index === 0} onClick={() => move(id, -1)} aria-label="Move up">
            ↑ Up
          </button>
          <button type="button" className={small} disabled={index === count - 1} onClick={() => move(id, 1)} aria-label="Move down">
            ↓ Down
          </button>
          <button type="button" className={`${small} text-red-400`} onClick={() => remove(id)} aria-label="Remove from workout">
            Remove
          </button>
        </div>
      </div>
    </li>
  );
}

export function WorkoutBuilder() {
  const { items, ready, clear } = useWorkout();
  const ids = useMemo(() => items.map((i) => i.exerciseId), [items]);
  const { details } = useExerciseDetails(ids);

  if (!ready) {
    return <p className="py-20 text-center text-zinc-400">Loading your workout…</p>;
  }

  if (items.length === 0) {
    return (
      <div className="flex flex-col gap-8">
        <div className="rounded-3xl border border-dashed border-zinc-700 p-8 text-center sm:p-12">
          <h2 className="text-2xl font-black">Your workout is empty</h2>
          <p className="mx-auto mt-2 max-w-md text-zinc-400">
            Pick a ready-made workout below, or browse the library and tap “Add to workout” on the
            exercises you like.
          </p>
          <Link
            href="/exercises"
            className="mt-5 inline-block rounded-xl bg-lime-400 px-6 py-3 font-bold text-zinc-950 hover:bg-lime-300"
          >
            Browse exercises
          </Link>
        </div>
        <section aria-labelledby="presets">
          <h2 id="presets" className="mb-4 text-xl font-black">
            Or start from a preset
          </h2>
          <PresetPicker />
        </section>
      </div>
    );
  }

  const totalSeconds = estimateWorkoutSeconds(items);

  return (
    <div className="flex flex-col gap-6">
      <section
        aria-label="Workout summary"
        className="sticky top-14 z-20 -mx-4 flex flex-wrap items-center justify-between gap-3 border-b border-zinc-800 bg-zinc-950/95 px-4 py-3 backdrop-blur"
      >
        <p className="text-sm text-zinc-300">
          <strong className="text-lg font-black text-white">{items.length}</strong> exercises ·{" "}
          <strong className="text-lg font-black text-white">{totalSetsLabel(items)}</strong> ·{" "}
          about <strong className="text-lg font-black text-lime-300">{formatDuration(totalSeconds)}</strong>
        </p>
        <Link
          href="/workout/play"
          className="rounded-xl bg-lime-400 px-6 py-2.5 font-bold text-zinc-950 hover:bg-lime-300"
        >
          Start workout
        </Link>
      </section>

      <ol className="flex flex-col gap-3">
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
            />
          );
        })}
      </ol>

      <div className="flex flex-wrap gap-3">
        <Link href="/exercises" className="rounded-xl border border-zinc-700 px-5 py-2.5 text-sm font-bold hover:bg-zinc-900">
          + Add more exercises
        </Link>
        <button
          type="button"
          onClick={() => {
            if (window.confirm("Remove every exercise from this workout?")) clear();
          }}
          className="rounded-xl px-5 py-2.5 text-sm font-bold text-red-400 hover:bg-zinc-900"
        >
          Clear workout
        </button>
      </div>

      <details className="rounded-2xl border border-zinc-800 bg-zinc-900/50 p-4">
        <summary className="cursor-pointer font-bold">Replace with a preset workout</summary>
        <div className="mt-4">
          <PresetPicker />
        </div>
      </details>
    </div>
  );
}
