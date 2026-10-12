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
      setError("Couldn't build that workout. Check your connection and try again.");
    } finally {
      setBusy(null);
    }
  }

  return (
    <div>
      <ul className="presets">
        {PRESETS.map((p) => (
          <li key={p.id}>
            <button type="button" className="preset" onClick={() => pick(p.id)} disabled={busy !== null}>
              <b>{busy === p.id ? `Building ${p.title.toLowerCase()}…` : p.title}</b>
              <span>
                {p.subtitle}, {p.count} exercises
              </span>
            </button>
          </li>
        ))}
      </ul>
      {error && (
        <p role="alert" className="error">
          {error}
        </p>
      )}
    </div>
  );
}
