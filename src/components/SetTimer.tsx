"use client";

import { useEffect, useRef, useState } from "react";
import { formatClock } from "@/lib/format";
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
  const btn =
    "rounded-lg px-4 py-2 text-sm font-semibold transition-colors focus-visible:outline-2 focus-visible:outline-lime-300";

  return (
    <section aria-label="Timers" className="grid gap-4 sm:grid-cols-2">
      <div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-4">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-zinc-400">Set timer</h3>
        <p className="tabular my-2 text-5xl font-black" aria-live="off">
          {formatClock(elapsedMs / 1000)}
        </p>
        <div className="flex gap-2">
          <button
            type="button"
            className={`${btn} ${running ? "bg-zinc-700 hover:bg-zinc-600" : "bg-lime-400 text-zinc-950 hover:bg-lime-300"}`}
            onClick={() => {
              unlock();
              setRunning((r) => !r);
            }}
          >
            {running ? "Pause" : elapsedMs > 0 ? "Resume" : "Start"}
          </button>
          <button
            type="button"
            className={`${btn} bg-zinc-800 hover:bg-zinc-700`}
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

      <div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-4">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-zinc-400">Rest timer</h3>
        <p className={`tabular my-2 text-5xl font-black ${resting ? "text-lime-300" : ""}`} aria-live="off">
          {formatClock(resting ? left : restTotal)}
        </p>
        <div className="mb-3 flex flex-wrap gap-1.5">
          {REST_CHOICES.map((s) => (
            <button
              key={s}
              type="button"
              disabled={resting}
              onClick={() => {
                setRestTotal(s);
                setLeft(s);
              }}
              className={`rounded-full px-3 py-1 text-xs font-semibold disabled:opacity-40 ${
                restTotal === s ? "bg-lime-400 text-zinc-950" : "bg-zinc-800 text-zinc-300 hover:bg-zinc-700"
              }`}
            >
              {s}s
            </button>
          ))}
        </div>
        <button
          type="button"
          className={`${btn} ${resting ? "bg-zinc-700 hover:bg-zinc-600" : "bg-lime-400 text-zinc-950 hover:bg-lime-300"}`}
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
    </section>
  );
}
