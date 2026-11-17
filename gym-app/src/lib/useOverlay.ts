"use client";

import { useEffect, useState } from "react";
import { api } from "./api";
import type { CustomExercise } from "./apiTypes";
import type { ExerciseSummary } from "./types";

export interface CustomRecord extends CustomExercise {
  id: string;
}
export interface Overlay {
  hidden: string[];
  custom: CustomRecord[];
}

const EMPTY: Overlay = { hidden: [], custom: [] };
let cached: Promise<Overlay> | null = null;

/** Admin-managed changes to the bundled library: hidden exercises and custom ones. Fails soft to "no changes". */
export function useOverlay(): Overlay {
  const [overlay, setOverlay] = useState<Overlay>(EMPTY);
  useEffect(() => {
    cached ??= api<Overlay>("/exercises/overlay").catch(() => {
      cached = null;
      return EMPTY;
    });
    let alive = true;
    void cached.then((o) => alive && setOverlay(o));
    return () => {
      alive = false;
    };
  }, []);
  return overlay;
}

export const isCustomId = (id: string) => id.startsWith("c_");

export function customToSummary(c: CustomRecord): ExerciseSummary {
  return { id: c.id, name: c.name, bodyPart: c.bodyPart, equipment: c.equipment, target: c.target, image: c.imageUrl || c.gifUrl };
}
