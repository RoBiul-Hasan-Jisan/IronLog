"use client";

import { useEffect, useMemo, useState } from "react";
import type { Exercise } from "@/lib/types";

/**
 * Fetches full exercise records (steps, GIF) for the given ids from the API
 * and keeps them cached for the lifetime of the page. Ids the API doesn't know
 * (e.g. stale saved data) are marked as settled so `loading` can't hang.
 */
export function useExerciseDetails(ids: string[]): {
  details: Record<string, Exercise>;
  loading: boolean;
  error: boolean;
} {
  const [details, setDetails] = useState<Record<string, Exercise>>({});
  const [settled, setSettled] = useState<Record<string, true>>({});
  const [error, setError] = useState(false);

  const key = useMemo(() => ids.join(","), [ids]);

  useEffect(() => {
    const wanted = key ? key.split(",") : [];
    const missing = wanted.filter((id) => !details[id] && !settled[id]);
    if (missing.length === 0) return;

    let cancelled = false;
    fetch(`/api/exercises?ids=${encodeURIComponent(missing.join(","))}`)
      .then((res) => {
        if (!res.ok) throw new Error(String(res.status));
        return res.json() as Promise<Exercise[]>;
      })
      .then((list) => {
        if (cancelled) return;
        setDetails((cur) => {
          const next = { ...cur };
          for (const ex of list) next[ex.id] = ex;
          return next;
        });
        setSettled((cur) => {
          const next = { ...cur };
          for (const id of missing) next[id] = true;
          return next;
        });
      })
      .catch(() => {
        if (!cancelled) setError(true);
      });
    return () => {
      cancelled = true;
    };
    // Only refetch when the list of ids changes, not on every cache update.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  const wanted = key ? key.split(",") : [];
  const loading = !error && wanted.some((id) => !details[id] && !settled[id]);
  return { details, loading, error };
}
