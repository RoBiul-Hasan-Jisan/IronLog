"use client";

import Link from "next/link";
import type { ClassSession } from "@/lib/apiTypes";
import { CATEGORY_LABEL } from "@/lib/gym";
import { formatDay, formatTime } from "@/lib/money";
import { useFetch } from "@/lib/useFetch";
import { trainerName } from "./ClassTimetable";

/** Small live list of the next few classes (used in the landing hero). */
export function NextClasses({ limit = 4 }: { limit?: number }) {
  const { data, error } = useFetch<ClassSession[]>("/classes?days=3");
  return (
    <div className="hero-card">
      <p className="hero-card-title">Coming up</p>
      {error && <p className="muted">Timetable unavailable right now.</p>}
      {!data && !error && <p className="muted">Loading…</p>}
      {data && data.length === 0 && <p className="muted">No classes in the next few days.</p>}
      <ul className="hero-classes">
        {data?.slice(0, limit).map((c) => (
          <li key={c._id}>
            <span className="hero-time">
              {formatTime(c.startsAt)}
              <small>{formatDay(c.startsAt)}</small>
            </span>
            <span>
              <strong>{c.title}</strong>
              <small>
                {CATEGORY_LABEL[c.category]}
                {trainerName(c) ? ` · ${trainerName(c)}` : ""}
              </small>
            </span>
          </li>
        ))}
      </ul>
      <Link href="/classes" className="btn btn--secondary btn--block">
        Full timetable
      </Link>
    </div>
  );
}
