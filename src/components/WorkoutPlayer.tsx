"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import type { Exercise, WorkoutItem } from "@/lib/types";
import {
  addRest,
  completeSet,
  endRest,
  initialState,
  playable,
  previousExercise,
  progress,
  skipExercise,
  tick,
  totalSets,
  type PlayerState,
} from "@/lib/player";
import { estimateWorkoutSeconds } from "@/lib/prescription";
import { formatClock, formatDuration, titleCase } from "@/lib/format";
import { ExerciseMedia } from "./ExerciseMedia";
import { useBeep } from "./useBeep";
import { useExerciseDetails } from "./useExerciseDetails";
import { useWorkout } from "./WorkoutProvider";

const primaryBtn =
  "rounded-2xl bg-lime-400 px-8 py-4 text-lg font-black text-zinc-950 hover:bg-lime-300 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-lime-300";
const ghostBtn =
  "rounded-xl border border-zinc-700 px-4 py-2.5 text-sm font-semibold hover:bg-zinc-900 disabled:opacity-30 focus-visible:outline-2 focus-visible:outline-lime-300";

function Message({ title, children }: { title: string; children?: ReactNode }) {
  return (
    <div className="py-20 text-center">
      <h1 className="text-2xl font-black">{title}</h1>
      <div className="mt-3 text-zinc-400">{children}</div>
    </div>
  );
}

/** Keeps the screen on while a workout is running (where the browser supports it). */
function useWakeLock() {
  const lockRef = useRef<WakeLockSentinel | null>(null);
  useEffect(() => {
    let cancelled = false;
    const request = async () => {
      try {
        if (!("wakeLock" in navigator)) return;
        const sentinel = await navigator.wakeLock.request("screen");
        if (cancelled) {
          sentinel.release().catch(() => {});
        } else {
          lockRef.current = sentinel;
        }
      } catch {
        /* not allowed / not supported — fine */
      }
    };
    void request();
    const onVisible = () => {
      if (document.visibilityState === "visible") void request();
    };
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      cancelled = true;
      document.removeEventListener("visibilitychange", onVisible);
      lockRef.current?.release().catch(() => {});
      lockRef.current = null;
    };
  }, []);
}

function Target({ item }: { item: WorkoutItem }) {
  return item.mode === "time" ? (
    <span>{item.holdSec} sec</span>
  ) : (
    <span>{item.reps} reps</span>
  );
}

function Session({
  items,
  details,
  beep,
  onRestart,
}: {
  items: WorkoutItem[];
  details: Record<string, Exercise>;
  beep: (frequency?: number, durationMs?: number) => void;
  onRestart: () => void;
}) {
  const [state, setState] = useState<PlayerState>(() => initialState(items));
  const [paused, setPaused] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [confirmEnd, setConfirmEnd] = useState(false);
  const prev = useRef<PlayerState>(state);

  useWakeLock();

  // One clock drives both the total timer and the set/rest countdown.
  useEffect(() => {
    if (paused || state.phase === "done") return;
    const id = window.setInterval(() => {
      setElapsed((e) => e + 1);
      setState((s) => tick(items, s));
    }, 1000);
    return () => window.clearInterval(id);
  }, [paused, state.phase, items]);

  // Sounds: 3-2-1 countdown beeps, a long beep when a phase changes, a jingle at the end.
  useEffect(() => {
    const before = prev.current;
    prev.current = state;

    if (state.phase === "done" && before.phase !== "done") {
      beep(660, 150);
      window.setTimeout(() => beep(880, 150), 200);
      window.setTimeout(() => beep(1100, 350), 420);
      return;
    }
    if (state.phase === "work" && before.phase === "rest") beep(1000, 250);
    if (state.phase === "rest" && before.phase === "work") beep(500, 150);

    const counting = state.phase === "rest" || items[state.itemIndex]?.mode === "time";
    if (counting && state.remaining > 0 && state.remaining <= 3 && state.remaining !== before.remaining) {
      beep(660, 90);
    }
  }, [state, items, beep]);

  const sets = totalSets(items);
  const fraction = progress(items, state);
  const item = items[state.itemIndex];
  const ex = item ? details[item.exerciseId] : undefined;

  // ---------- finished ----------
  if (state.phase === "done") {
    return (
      <div className="mx-auto flex max-w-md flex-col items-center gap-6 py-10 text-center">
        <p className="text-6xl" aria-hidden>
          🏁
        </p>
        <h1 className="text-4xl font-black">Workout complete</h1>
        <dl className="grid w-full grid-cols-3 gap-3">
          {[
            ["Time", formatClock(elapsed)],
            ["Sets done", `${state.completedSets}/${sets}`],
            ["Exercises", String(items.length)],
          ].map(([k, v]) => (
            <div key={k} className="rounded-2xl bg-zinc-900 p-4">
              <dt className="text-[11px] font-semibold uppercase tracking-wider text-zinc-500">{k}</dt>
              <dd className="tabular mt-1 text-2xl font-black">{v}</dd>
            </div>
          ))}
        </dl>
        <div className="flex flex-wrap justify-center gap-3">
          <button type="button" className={primaryBtn} onClick={onRestart}>
            Do it again
          </button>
          <Link href="/workout" className={`${ghostBtn} flex items-center`}>
            Back to workout
          </Link>
        </div>
      </div>
    );
  }

  if (!item || !ex) return <Message title="Something went wrong">Please go back and try again.</Message>;

  const name = titleCase(ex.name);
  const resting = state.phase === "rest";
  const timed = item.mode === "time";
  const setLabel = `Set ${state.setIndex + 1} of ${item.sets}`;

  return (
    <div className="flex flex-col gap-5">
      {/* progress + controls */}
      <div className="flex flex-col gap-3">
        <div
          role="progressbar"
          aria-label="Workout progress"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={Math.round(fraction * 100)}
          className="h-2 overflow-hidden rounded-full bg-zinc-800"
        >
          <div className="bar-fill h-full rounded-full bg-lime-400" style={{ width: `${fraction * 100}%` }} />
        </div>
        <div className="flex flex-wrap items-center justify-between gap-2 text-sm text-zinc-400">
          <span>
            Exercise {state.itemIndex + 1} of {items.length} · {state.completedSets}/{sets} sets
          </span>
          <span className="tabular font-bold text-zinc-200" aria-label="Elapsed time">
            {formatClock(elapsed)}
          </span>
          <span className="flex gap-2">
            <button type="button" className={ghostBtn} onClick={() => setPaused((p) => !p)}>
              {paused ? "Resume" : "Pause"}
            </button>
            {confirmEnd ? (
              <>
                <button type="button" className={`${ghostBtn} text-red-400`} onClick={() => setState((s) => ({ ...s, phase: "done", remaining: 0 }))}>
                  End now
                </button>
                <button type="button" className={ghostBtn} onClick={() => setConfirmEnd(false)}>
                  Keep going
                </button>
              </>
            ) : (
              <button type="button" className={ghostBtn} onClick={() => setConfirmEnd(true)}>
                End
              </button>
            )}
          </span>
        </div>
      </div>

      {paused && (
        <p role="status" className="rounded-xl bg-amber-950 px-4 py-3 text-center font-bold text-amber-300">
          Paused — timers are stopped
        </p>
      )}

      {resting ? (
        <section aria-label="Rest" className="grid items-center gap-6 md:grid-cols-2">
          <div className="text-center md:text-left">
            <p className="text-sm font-semibold uppercase tracking-widest text-sky-300">Rest</p>
            <p className="tabular text-8xl font-black leading-none text-sky-300 sm:text-9xl" aria-live="off">
              {formatClock(state.remaining)}
            </p>
            <div className="mt-6 flex flex-wrap justify-center gap-3 md:justify-start">
              <button type="button" className={ghostBtn} onClick={() => setState((s) => addRest(s, 15))}>
                +15 sec
              </button>
              <button type="button" className={primaryBtn} onClick={() => setState((s) => endRest(items, s))}>
                Skip rest
              </button>
            </div>
          </div>
          <div className="flex items-center gap-4 rounded-2xl border border-zinc-800 bg-zinc-900 p-4">
            <ExerciseMedia path={ex.gif} alt={`${name} demonstration`} className="size-28 shrink-0 rounded-xl sm:size-36" />
            <div className="min-w-0">
              <p className="text-xs font-semibold uppercase tracking-wider text-zinc-500">Up next</p>
              <p className="text-lg font-black leading-6">{name}</p>
              <p className="mt-1 text-sm text-zinc-400">
                {setLabel} · <Target item={item} />
              </p>
            </div>
          </div>
        </section>
      ) : (
        <section aria-label="Current exercise" className="grid gap-6 md:grid-cols-[minmax(0,360px)_1fr]">
          <ExerciseMedia path={ex.gif} alt={`${name} demonstration`} eager className="aspect-square w-full max-w-sm rounded-3xl" />
          <div className="flex flex-col gap-5">
            <div>
              <p className="text-sm font-semibold uppercase tracking-widest text-lime-400">{setLabel}</p>
              <h1 className="text-3xl font-black leading-tight">{name}</h1>
              <p className="mt-1 text-sm capitalize text-zinc-400">
                {ex.target} · {ex.equipment}
              </p>
            </div>

            <p className="tabular text-7xl font-black leading-none sm:text-8xl" aria-live="off">
              {timed ? formatClock(state.remaining) : item.reps}
              {!timed && <span className="ml-3 text-2xl font-bold text-zinc-400">reps</span>}
            </p>

            <div className="flex flex-wrap gap-3">
              <button type="button" className={primaryBtn} onClick={() => setState((s) => completeSet(items, s))}>
                {timed ? "Finish set early" : "Done ✓"}
              </button>
              <button type="button" className={ghostBtn} onClick={() => setState((s) => previousExercise(items, s))}>
                ← Back
              </button>
              <button type="button" className={ghostBtn} onClick={() => setState((s) => skipExercise(items, s))}>
                Skip exercise →
              </button>
            </div>

            <details open className="rounded-2xl border border-zinc-800 bg-zinc-900 p-4">
              <summary className="cursor-pointer font-bold">Steps</summary>
              <ol className="mt-3 list-decimal space-y-2 pl-5 leading-7 text-zinc-200 marker:font-bold marker:text-lime-400">
                {ex.steps.map((s, i) => (
                  <li key={i}>{s}</li>
                ))}
              </ol>
            </details>
          </div>
        </section>
      )}
    </div>
  );
}

export function WorkoutPlayer() {
  const { items, ready } = useWorkout();
  const { unlock, beep } = useBeep();
  const queue = useMemo(() => playable(items), [items]);
  const ids = useMemo(() => queue.map((i) => i.exerciseId), [queue]);
  const { details, loading, error } = useExerciseDetails(ids);
  const [running, setRunning] = useState<WorkoutItem[] | null>(null);

  if (!ready) return <Message title="Loading…" />;
  if (queue.length === 0) {
    return (
      <Message title="Nothing to play yet">
        <p>Add a few exercises first.</p>
        <Link href="/workout" className="mt-5 inline-block rounded-xl bg-lime-400 px-6 py-3 font-bold text-zinc-950 hover:bg-lime-300">
          Build a workout
        </Link>
      </Message>
    );
  }
  if (error) return <Message title="Couldn't load the exercises">Check your connection and reload the page.</Message>;
  if (loading) return <Message title="Loading exercises…" />;

  const playableNow = queue.filter((i) => details[i.exerciseId]);
  if (playableNow.length === 0) return <Message title="Those exercises are no longer available" />;

  if (running) {
    return <Session items={running} details={details} beep={beep} onRestart={() => setRunning(null)} />;
  }

  return (
    <div className="mx-auto flex max-w-md flex-col items-center gap-5 py-10 text-center">
      <h1 className="text-4xl font-black">Ready?</h1>
      <p className="text-zinc-400">
        {playableNow.length} exercises · {totalSets(playableNow)} sets · about{" "}
        <strong className="text-lime-300">{formatDuration(estimateWorkoutSeconds(playableNow))}</strong>
      </p>
      <p className="text-sm text-zinc-500">
        Set and rest timers run automatically with a 3-2-1 beep. Your screen stays on while you train.
      </p>
      <button
        type="button"
        className={primaryBtn}
        onClick={() => {
          unlock(); // browsers only allow sound after a tap
          setRunning(playableNow);
        }}
      >
        Start workout
      </button>
      <Link href="/workout" className="text-sm font-semibold text-zinc-400 hover:text-lime-300">
        ← Edit workout
      </Link>
    </div>
  );
}
