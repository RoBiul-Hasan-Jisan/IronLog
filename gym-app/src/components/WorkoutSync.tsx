"use client";

import { useEffect, useRef } from "react";
import { api } from "@/lib/api";
import type { WorkoutItem } from "@/lib/types";
import { useAuth } from "./AuthProvider";
import { useWorkout } from "./WorkoutProvider";

/**
 * Keeps the saved workout in step with the account: on sign-in the account's workout is loaded
 * if this browser has none; afterwards every change is saved (debounced). Anonymous use is unaffected.
 */
export function WorkoutSync() {
  const { status, profile } = useAuth();
  const { items, ready, replace } = useWorkout();
  const uid = status === "authenticated" ? profile?._id : undefined;
  const pulled = useRef<string | null>(null);
  /** Only true once the account's workout has been read, so an early save can't wipe it. */
  const synced = useRef<string | null>(null);

  useEffect(() => {
    if (!uid || !ready || pulled.current === uid) return;
    pulled.current = uid;
    api<{ items: WorkoutItem[] }>("/me/workout")
      .then((remote) => {
        synced.current = uid;
        if (items.length === 0 && remote.items.length > 0) replace(remote.items);
        else if (items.length > 0) void api("/me/workout", { method: "PUT", body: { items } }).catch(() => undefined);
      })
      .catch(() => {
        pulled.current = null;
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [uid, ready]);

  useEffect(() => {
    if (!uid || synced.current !== uid) return;
    const t = setTimeout(() => {
      void api("/me/workout", { method: "PUT", body: { items } }).catch(() => undefined);
    }, 1200);
    return () => clearTimeout(t);
  }, [items, uid]);

  return null;
}
