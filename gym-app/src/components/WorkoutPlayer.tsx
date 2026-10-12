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
  skipExercise,
  tick,
  totalSets,
  type PlayerState,
} from "@/lib/player";
import { describePrescription, estimateWorkoutSeconds } from "@/lib/prescription";
import { formatDuration, titleCase } from "@/lib/format";
import { ExerciseMedia } from "./ExerciseMedia";
import { Icon } from "./icons";
import { Plate } from "./Plate";
import { PlayerView } from "./PlayerView";
import { useBeep } from "./useBeep";
import { useExerciseDetails } from "./useExerciseDetails";
import { useWorkout } from "./WorkoutProvider";

function Message({ title, children }: { title: string; children?: ReactNode }) {
  return (
    <div className="night">
      <div className="message">
        <h1>{title}</h1>
        {children}
      </div>
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

  return (
    <PlayerView
      items={items}
      details={details}
      state={state}
      elapsed={elapsed}
      paused={paused}
      confirmEnd={confirmEnd}
      onDone={() => setState((s) => completeSet(items, s))}
      onBack={() => setState((s) => previousExercise(items, s))}
      onSkip={() => setState((s) => skipExercise(items, s))}
      onAddRest={() => setState((s) => addRest(s, 15))}
      onSkipRest={() => setState((s) => endRest(items, s))}
      onTogglePause={() => setPaused((x) => !x)}
      onAskEnd={() => setConfirmEnd(true)}
      onConfirmEnd={() => setState((s) => ({ ...s, phase: "done", remaining: 0 }))}
      onCancelEnd={() => setConfirmEnd(false)}
      onRestart={onRestart}
    />
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
        <p>Add a few exercises to your workout first.</p>
        <Link href="/workout" className="btn btn--primary btn--lg">
          Build a workout
        </Link>
      </Message>
    );
  }
  if (error) {
    return (
      <Message title="Couldn't load the exercises">
        <p>Check your connection, then reload the page.</p>
      </Message>
    );
  }
  if (loading) return <Message title="Loading exercises…" />;

  const playableNow = queue.filter((i) => details[i.exerciseId]);
  if (playableNow.length === 0) {
    return (
      <Message title="Those exercises are no longer available">
        <Link href="/workout" className="btn btn--primary btn--lg">
          Back to workout
        </Link>
      </Message>
    );
  }

  if (running) {
    return <Session items={running} details={details} beep={beep} onRestart={() => setRunning(null)} />;
  }

  return (
    <div className="night">
      <div className="player">
        <div className="intro">
          <h1>Ready to train?</h1>
          <p className="center-note">
            {playableNow.length} exercises, {totalSets(playableNow)} sets, about{" "}
            {formatDuration(estimateWorkoutSeconds(playableNow))}. Timers run on their own and beep for the last three
            seconds. Your screen stays on.
          </p>

          <ul className="intro-list" aria-label="Exercises in this workout">
            {playableNow.map((it) => {
              const ex = details[it.exerciseId];
              return (
                <li key={it.exerciseId} className="intro-item">
                  <ExerciseMedia path={ex.image} alt="" />
                  <div>
                    <b>{titleCase(ex.name)}</b>
                    <span style={{ display: "inline-flex", alignItems: "center", gap: 6, textTransform: "capitalize" }}>
                      <Plate bodyPart={ex.bodyPart} size={12} hole="var(--night)" />
                      {ex.target}
                    </span>
                  </div>
                  <span className="rx-chip">{describePrescription(it)}</span>
                </li>
              );
            })}
          </ul>

          <div className="player-actions" style={{ justifyContent: "center" }}>
            <button
              type="button"
              className="btn btn--primary btn--lg"
              onClick={() => {
                unlock(); // browsers only allow sound after a tap
                setRunning(playableNow);
              }}
            >
              <Icon name="play" size={20} />
              Start workout
            </button>
            <Link href="/workout" className="btn btn--quiet btn--lg">
              Edit workout
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
