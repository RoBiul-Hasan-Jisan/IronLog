"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { WorkoutItem } from "@/lib/types";
import { PRESETS } from "@/lib/workouts";
import { useWorkout } from "./WorkoutProvider";

/** Ready-made workouts: picks a fresh random set of exercises each time. */
export function PresetPicker({ goToBuilder = false }: { goToBuilder?: boolean }) {
  const { replace } = useWorkout();
  const router = useRouter();
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function pick(id: string) {
    setBusy(id);
    setError(null);
    try {
      const res = await fetch(`/api/workouts/generate?preset=${encodeURIComponent(id)}&seed=${Date.now()}`);
      if (!res.ok) throw new Error(String(res.status));
      const items = (await res.json()) as WorkoutItem[];
      replace(items);
      if (goToBuilder) router.push("/workout");
    } catch {
      setError("Couldn't build that workout. Please try again.");
    } finally {
      setBusy(null);
    }
  }

  return (
    <div>
      <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {PRESETS.map((p) => (
          <li key={p.id}>
            <button
              type="button"
              onClick={() => pick(p.id)}
              disabled={busy !== null}
              className="flex h-full w-full flex-col items-start gap-1 rounded-2xl border border-zinc-800 bg-zinc-900 p-4 text-left transition-colors hover:border-lime-400/60 hover:bg-zinc-800/80 disabled:opacity-60 focus-visible:outline-2 focus-visible:outline-lime-300"
            >
              <span className="text-lg font-bold">{p.title}</span>
              <span className="text-sm text-zinc-400">{p.subtitle}</span>
              <span className="mt-2 text-xs font-semibold text-lime-300">
                {busy === p.id ? "Building…" : `${p.count} exercises`}
              </span>
            </button>
          </li>
        ))}
      </ul>
      {error && (
        <p role="alert" className="mt-3 text-sm text-red-400">
          {error}
        </p>
      )}
    </div>
  );
}
