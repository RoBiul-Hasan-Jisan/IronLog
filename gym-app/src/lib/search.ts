import type { ExerciseSummary } from "./types";

export interface Filters {
  q: string;
  bodyPart: string; // "" = all
  equipment: string; // "" = all
  target: string; // "" = all
}

export const EMPTY_FILTERS: Filters = { q: "", bodyPart: "", equipment: "", target: "" };

export interface Facet {
  name: string;
  count: number;
}

export interface Facets {
  bodyParts: Facet[];
  equipment: Facet[];
  targets: Facet[];
}

function tally(values: string[]): Facet[] {
  const counts = new Map<string, number>();
  for (const v of values) counts.set(v, (counts.get(v) ?? 0) + 1);
  return [...counts.entries()]
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name));
}

export function buildFacets(items: ExerciseSummary[]): Facets {
  return {
    bodyParts: tally(items.map((e) => e.bodyPart)),
    equipment: tally(items.map((e) => e.equipment)),
    targets: tally(items.map((e) => e.target)),
  };
}

/**
 * Filters and sorts exercises. Every word typed in the search box must appear
 * somewhere in the name, target, equipment or body part (order does not matter).
 * Results whose name starts with the query come first, then alphabetical.
 */
export function filterExercises(items: ExerciseSummary[], f: Filters): ExerciseSummary[] {
  const tokens = f.q.toLowerCase().split(/\s+/).filter(Boolean);
  const out = items.filter((e) => {
    if (f.bodyPart && e.bodyPart !== f.bodyPart) return false;
    if (f.equipment && e.equipment !== f.equipment) return false;
    if (f.target && e.target !== f.target) return false;
    if (tokens.length === 0) return true;
    const hay = `${e.name} ${e.target} ${e.equipment} ${e.bodyPart}`.toLowerCase();
    return tokens.every((t) => hay.includes(t));
  });

  const first = tokens[0] ?? "";
  return out.sort((a, b) => {
    if (first) {
      const aStarts = a.name.toLowerCase().startsWith(first) ? 0 : 1;
      const bStarts = b.name.toLowerCase().startsWith(first) ? 0 : 1;
      if (aStarts !== bStarts) return aStarts - bStarts;
    }
    return a.name.localeCompare(b.name);
  });
}
