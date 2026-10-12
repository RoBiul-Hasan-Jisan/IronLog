"use client";

import { useDeferredValue, useMemo, useState } from "react";
import type { ExerciseSummary } from "@/lib/types";
import { EMPTY_FILTERS, buildFacets, filterExercises, type Facet, type Filters } from "@/lib/search";
import { titleCase } from "@/lib/format";
import { ExerciseCard } from "./ExerciseCard";

const PAGE_SIZE = 24;

function FilterSelect({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: string;
  options: Facet[];
  onChange: (value: string) => void;
}) {
  return (
    <label className="flex flex-col gap-1 text-xs font-medium text-zinc-400">
      {label}
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm capitalize text-zinc-100 focus-visible:outline-2 focus-visible:outline-lime-300"
      >
        <option value="">All</option>
        {options.map((o) => (
          <option key={o.name} value={o.name}>
            {titleCase(o.name)} ({o.count})
          </option>
        ))}
      </select>
    </label>
  );
}

export function ExerciseBrowser({
  index,
  initialFilters = EMPTY_FILTERS,
}: {
  index: ExerciseSummary[];
  initialFilters?: Filters;
}) {
  const [filters, setFilters] = useState<Filters>(initialFilters);
  const [limit, setLimit] = useState(PAGE_SIZE);

  const facets = useMemo(() => buildFacets(index), [index]);
  const deferredQuery = useDeferredValue(filters.q);
  const results = useMemo(
    () => filterExercises(index, { ...filters, q: deferredQuery }),
    [index, filters, deferredQuery],
  );

  const set = (patch: Partial<Filters>) => {
    setFilters((cur) => ({ ...cur, ...patch }));
    setLimit(PAGE_SIZE);
  };
  const active = filters.q || filters.bodyPart || filters.equipment || filters.target;
  const visible = results.slice(0, limit);

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-col gap-3 rounded-2xl border border-zinc-800 bg-zinc-900/60 p-4">
        <input
          type="search"
          value={filters.q}
          onChange={(e) => set({ q: e.target.value })}
          placeholder="Search 1,300+ exercises — try “bench press” or “biceps dumbbell”"
          aria-label="Search exercises"
          className="w-full rounded-xl border border-zinc-700 bg-zinc-950 px-4 py-3 text-base placeholder:text-zinc-500 focus-visible:outline-2 focus-visible:outline-lime-300"
        />
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <FilterSelect label="Body part" value={filters.bodyPart} options={facets.bodyParts} onChange={(v) => set({ bodyPart: v })} />
          <FilterSelect label="Equipment" value={filters.equipment} options={facets.equipment} onChange={(v) => set({ equipment: v })} />
          <FilterSelect label="Target muscle" value={filters.target} options={facets.targets} onChange={(v) => set({ target: v })} />
        </div>
        <div className="flex items-center justify-between text-sm text-zinc-400">
          <span aria-live="polite">
            {results.length.toLocaleString()} exercise{results.length === 1 ? "" : "s"}
          </span>
          {active ? (
            <button
              type="button"
              onClick={() => {
                setFilters(EMPTY_FILTERS);
                setLimit(PAGE_SIZE);
              }}
              className="font-semibold text-lime-300 hover:text-lime-200"
            >
              Clear filters
            </button>
          ) : null}
        </div>
      </div>

      {results.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-zinc-700 p-10 text-center text-zinc-400">
          No exercises match. Try fewer words or clear a filter.
        </p>
      ) : (
        <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6">
          {visible.map((ex) => (
            <ExerciseCard key={ex.id} exercise={ex} />
          ))}
        </ul>
      )}

      {visible.length < results.length && (
        <button
          type="button"
          onClick={() => setLimit((l) => l + PAGE_SIZE * 2)}
          className="mx-auto rounded-xl border border-zinc-700 px-6 py-3 text-sm font-semibold hover:bg-zinc-900"
        >
          Show more ({results.length - visible.length} left)
        </button>
      )}
    </div>
  );
}
