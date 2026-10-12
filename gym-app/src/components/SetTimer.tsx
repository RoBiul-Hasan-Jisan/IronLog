"use client";

import { useEffect, useRef, useState } from "react";
import { formatClock } from "@/lib/format";
import { Icon } from "./icons";
import { useBeep } from "./useBeep";

const REST_CHOICES = [30, 45, 60, 90, 120];

/** Stopwatch for timing a set + a rest countdown, shown on each exercise page. */
export function SetTimer({ suggestedRestSec = 60 }: { suggestedRestSec?: number }) {
  const { unlock, beep } = useBeep();

  // --- stopwatch ---
  const [running, setRunning] = useState(false);
  const [elapsedMs, setElapsedMs] = useState(0);
  const elapsedRef = useRef(0);

  useEffect(() => {
    if (!running) return;
    const t0 = Date.now() - elapsedRef.current;
    const id = window.setInterval(() => {
      elapsedRef.current = Date.now() - t0;
      setElapsedMs(elapsedRef.current);
    }, 200);
    return () => window.clearInterval(id);
  }, [running]);

  // --- rest countdown ---
  const [restTotal, setRestTotal] = useState(suggestedRestSec);
  const [endAt, setEndAt] = useState<number | null>(null);
  const [left, setLeft] = useState(suggestedRestSec);

  useEffect(() => {
    if (endAt === null) return;
    const id = window.setInterval(() => {
      const remaining = Math.max(0, Math.ceil((endAt - Date.now()) / 1000));
      setLeft(remaining);
      if (remaining === 0) {
        setEndAt(null);
        beep(988, 400);
      }
    }, 200);
    return () => window.clearInterval(id);
  }, [endAt, beep]);

  const resting = endAt !== null;

  return (
    <section aria-label="Timers" className="timers">
      <div className="timer-box">
        <h3 className="timer-label">Set timer</h3>
        <span className="timer-value display" aria-live="off">
          {formatClock(elapsedMs / 1000)}
        </span>
        <div className="timer-actions">
          <button
            type="button"
            className={`btn ${running ? "btn--secondary" : "btn--primary"}`}
            onClick={() => {
              unlock();
              setRunning((r) => !r);
            }}
          >
            <Icon name={running ? "pause" : "play"} size={16} />
            {running ? "Pause" : elapsedMs > 0 ? "Resume" : "Start"}
          </button>
          <button
            type="button"
            className="btn btn--quiet"
            onClick={() => {
              setRunning(false);
              elapsedRef.current = 0;
              setElapsedMs(0);
            }}
          >
            Reset
          </button>
        </div>
      </div>

      <div className="timer-box">
        <h3 className="timer-label">Rest timer</h3>
        <span className={`timer-value display${resting ? " timer-value--live" : ""}`} aria-live="off">
          {formatClock(resting ? left : restTotal)}
        </span>
        <div className="timer-choices" role="group" aria-label="Rest length">
          {REST_CHOICES.map((s) => (
            <button
              key={s}
              type="button"
              disabled={resting}
              aria-pressed={restTotal === s}
              className={`chip${restTotal === s ? " chip--on" : ""}`}
              onClick={() => {
                setRestTotal(s);
                setLeft(s);
              }}
            >
              {s} sec
            </button>
          ))}
        </div>
        <div className="timer-actions">
          <button
            type="button"
            className={`btn ${resting ? "btn--secondary" : "btn--primary"}`}
            onClick={() => {
              if (resting) {
                setEndAt(null);
                setLeft(restTotal);
              } else {
                unlock();
                setLeft(restTotal);
                setEndAt(Date.now() + restTotal * 1000);
              }
            }}
          >
            {resting ? "Cancel" : "Start rest"}
          </button>
        </div>
      </div>
    </section>
  );
}
