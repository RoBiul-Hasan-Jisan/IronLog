"use client";

import { useDeferredValue, useMemo, useState } from "react";
import type { ExerciseSummary } from "@/lib/types";
import { EMPTY_FILTERS, buildFacets, filterExercises, type Facets, type Filters } from "@/lib/search";
import { titleCase } from "@/lib/format";
import { ExerciseCard } from "./ExerciseCard";
import { Icon } from "./icons";
import { Plate } from "./Plate";

const PAGE_SIZE = 24;
const TOP_EQUIPMENT = 8;

function FilterPanel({
  idPrefix,
  filters,
  facets,
  onChange,
}: {
  /** The panel is rendered twice (desktop rail + phone drawer), so ids must differ. */
  idPrefix: string;
  filters: Filters;
  facets: Facets;
  onChange: (patch: Partial<Filters>) => void;
}) {
  // Show the most common equipment, plus whatever is currently selected.
  const visible = new Set(facets.equipment.slice(0, TOP_EQUIPMENT).map((f) => f.name));
  if (filters.equipment) visible.add(filters.equipment);
  const main = facets.equipment.filter((f) => visible.has(f.name));
  const rest = facets.equipment.filter((f) => !visible.has(f.name));

  const equipmentChip = (name: string, count: number) => (
    <button
      key={name}
      type="button"
      className={`chip${filters.equipment === name ? " chip--on" : ""}`}
      aria-pressed={filters.equipment === name}
      onClick={() => onChange({ equipment: filters.equipment === name ? "" : name })}
    >
      {name} ({count})
    </button>
  );

  return (
    <div>
      <section className="fgroup" aria-labelledby={`${idPrefix}-body`}>
        <h2 id={`${idPrefix}-body`} className="fgroup-title">
          Body part
        </h2>
        <div className="options">
          {facets.bodyParts.map((bp) => {
            const on = filters.bodyPart === bp.name;
            return (
              <button
                key={bp.name}
                type="button"
                className={`option${on ? " option--on" : ""}`}
                aria-pressed={on}
                onClick={() => onChange({ bodyPart: on ? "" : bp.name })}
              >
                <Plate bodyPart={bp.name} size={18} hole={on ? "var(--ink)" : "var(--paper)"} />
                {bp.name}
                <span className="option-count">{bp.count}</span>
              </button>
            );
          })}
        </div>
      </section>

      <section className="fgroup" aria-labelledby={`${idPrefix}-equip`}>
        <h2 id={`${idPrefix}-equip`} className="fgroup-title">
          Equipment
        </h2>
        <div className="chips">{main.map((f) => equipmentChip(f.name, f.count))}</div>
        {rest.length > 0 && (
          <details className="more">
            <summary>{rest.length} more types</summary>
            <div className="chips">{rest.map((f) => equipmentChip(f.name, f.count))}</div>
          </details>
        )}
      </section>

      <section className="fgroup">
        <label className="fgroup-title" htmlFor={`${idPrefix}-target`} style={{ display: "block" }}>
          Target muscle
        </label>
        <select
          id={`${idPrefix}-target`}
          className="select"
          value={filters.target}
          onChange={(e) => onChange({ target: e.target.value })}
        >
          <option value="">All muscles</option>
          {facets.targets.map((t) => (
            <option key={t.name} value={t.name}>
              {titleCase(t.name)} ({t.count})
            </option>
          ))}
        </select>
      </section>
    </div>
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

  const change = (patch: Partial<Filters>) => {
    setFilters((cur) => ({ ...cur, ...patch }));
    setLimit(PAGE_SIZE);
  };
  const clear = () => {
    setFilters(EMPTY_FILTERS);
    setLimit(PAGE_SIZE);
  };

  const activeCount = [filters.q, filters.bodyPart, filters.equipment, filters.target].filter(Boolean).length;
  const visible = results.slice(0, limit);

  return (
    <div className="library">
      <aside className="filters-desktop" aria-label="Filters">
        <FilterPanel idPrefix="d" filters={filters} facets={facets} onChange={change} />
      </aside>

      <div>
        <div className="searchbar">
          <span className="search-icon">
            <Icon name="search" size={20} />
          </span>
          <label htmlFor="q" className="sr-only">
            Search exercises
          </label>
          <input
            id="q"
            type="search"
            value={filters.q}
            onChange={(e) => change({ q: e.target.value })}
            placeholder="Search exercises"
            autoComplete="off"
          />
        </div>

        <details className="filters-mobile" style={{ marginTop: 12 }}>
          <summary className="btn btn--secondary">
            <Icon name="filter" size={18} />
            Filters{activeCount > 0 ? ` (${activeCount})` : ""}
          </summary>
          <div className="filters-mobile-body">
            <FilterPanel idPrefix="m" filters={filters} facets={facets} onChange={change} />
          </div>
        </details>

        <div className="results-head">
          <span aria-live="polite">
            {results.length.toLocaleString()} {results.length === 1 ? "exercise" : "exercises"}
          </span>
          {activeCount > 0 && (
            <button type="button" className="btn btn--quiet btn--sm" onClick={clear}>
              Clear filters
            </button>
          )}
        </div>

        {results.length === 0 ? (
          <div className="empty">
            <h2 className="h2">No exercises found</h2>
            <p>Try fewer words, or remove a filter.</p>
            <button type="button" className="btn btn--primary" onClick={clear}>
              Clear filters
            </button>
          </div>
        ) : (
          <ul className="tiles">
            {visible.map((ex) => (
              <ExerciseCard key={ex.id} exercise={ex} />
            ))}
          </ul>
        )}

        {visible.length < results.length && (
          <div style={{ marginTop: 32, textAlign: "center" }}>
            <button
              type="button"
              className="btn btn--secondary btn--lg"
              onClick={() => setLimit((l) => l + PAGE_SIZE * 2)}
            >
              Show more ({results.length - visible.length} left)
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
