"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type { ExerciseSummary, WorkoutItem } from "@/lib/types";
import { newWorkoutItem } from "@/lib/prescription";
import { STORAGE_KEY, parseWorkout, sanitizeItem, serializeWorkout } from "@/lib/workoutStorage";

interface WorkoutContextValue {
  /** The workout being built. Empty until `ready`. */
  items: WorkoutItem[];
  /** False during server render / first paint, true once localStorage has been read. */
  ready: boolean;
  has: (exerciseId: string) => boolean;
  add: (exercise: Pick<ExerciseSummary, "id" | "name" | "bodyPart">) => void;
  remove: (exerciseId: string) => void;
  update: (exerciseId: string, patch: Partial<WorkoutItem>) => void;
  move: (exerciseId: string, direction: -1 | 1) => void;
  replace: (items: WorkoutItem[]) => void;
  clear: () => void;
}

const WorkoutContext = createContext<WorkoutContextValue | null>(null);

export function WorkoutProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<WorkoutItem[]>([]);
  const [ready, setReady] = useState(false);

  // Load once on the client, and follow changes made in other tabs.
  useEffect(() => {
    try {
      setItems(parseWorkout(window.localStorage.getItem(STORAGE_KEY)));
    } catch {
      /* storage unavailable (private mode etc.) — start empty */
    }
    setReady(true);

    const onStorage = (e: StorageEvent) => {
      if (e.key === STORAGE_KEY) setItems(parseWorkout(e.newValue));
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  // Save after every change (but never before the first load finishes).
  useEffect(() => {
    if (!ready) return;
    try {
      window.localStorage.setItem(STORAGE_KEY, serializeWorkout(items));
    } catch {
      /* ignore */
    }
  }, [items, ready]);

  const has = useCallback((id: string) => items.some((i) => i.exerciseId === id), [items]);

  const add = useCallback((ex: Pick<ExerciseSummary, "id" | "name" | "bodyPart">) => {
    setItems((cur) => (cur.some((i) => i.exerciseId === ex.id) ? cur : [...cur, newWorkoutItem(ex)]));
  }, []);

  const remove = useCallback((id: string) => {
    setItems((cur) => cur.filter((i) => i.exerciseId !== id));
  }, []);

  const update = useCallback((id: string, patch: Partial<WorkoutItem>) => {
    setItems((cur) =>
      cur.map((i) => (i.exerciseId === id ? (sanitizeItem({ ...i, ...patch, exerciseId: id }) ?? i) : i)),
    );
  }, []);

  const move = useCallback((id: string, direction: -1 | 1) => {
    setItems((cur) => {
      const from = cur.findIndex((i) => i.exerciseId === id);
      const to = from + direction;
      if (from === -1 || to < 0 || to >= cur.length) return cur;
      const next = cur.slice();
      [next[from], next[to]] = [next[to], next[from]];
      return next;
    });
  }, []);

  const replace = useCallback((next: WorkoutItem[]) => {
    setItems(parseWorkout(serializeWorkout(next)));
  }, []);

  const clear = useCallback(() => setItems([]), []);

  const value = useMemo<WorkoutContextValue>(
    () => ({ items, ready, has, add, remove, update, move, replace, clear }),
    [items, ready, has, add, remove, update, move, replace, clear],
  );

  return <WorkoutContext.Provider value={value}>{children}</WorkoutContext.Provider>;
}

export function useWorkout(): WorkoutContextValue {
  const ctx = useContext(WorkoutContext);
  if (!ctx) throw new Error("useWorkout must be used inside <WorkoutProvider>");
  return ctx;
}
