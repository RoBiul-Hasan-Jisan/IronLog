"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { api, errorMessage, ApiError } from "@/lib/api";
import { CLASS_CATEGORIES, type Booking, type ClassSession } from "@/lib/apiTypes";
import { CATEGORY_LABEL } from "@/lib/gym";
import { dayKey, formatDay, formatTime } from "@/lib/money";
import { useFetch } from "@/lib/useFetch";
import { useAuth } from "./AuthProvider";

export const trainerName = (s: ClassSession): string => (s.trainer && typeof s.trainer === "object" ? s.trainer.name : "");

/** Upcoming classes grouped by day, with booking when signed in. */
export function ClassTimetable({ days = 7, limit, filters = true }: { days?: number; limit?: number; filters?: boolean }) {
  const { status } = useAuth();
  const signedIn = status === "authenticated";
  const classes = useFetch<ClassSession[]>(`/classes?days=${days}`);
  const mine = useFetch<Booking[]>(signedIn ? "/me/bookings" : null);
  const [category, setCategory] = useState("");
  const [busy, setBusy] = useState("");
  const [error, setError] = useState("");
  const [needsPlan, setNeedsPlan] = useState(false);

  const bookingFor = useMemo(() => {
    const map = new Map<string, Booking>();
    for (const b of mine.data ?? []) if (b.status === "booked" && b.session) map.set(b.session._id, b);
    return map;
  }, [mine.data]);

  const visible = useMemo(() => {
    const list = (classes.data ?? []).filter((c) => !category || c.category === category);
    return limit ? list.slice(0, limit) : list;
  }, [classes.data, category, limit]);

  const groups = useMemo(() => {
    const m = new Map<string, ClassSession[]>();
    for (const c of visible) {
      const k = dayKey(c.startsAt);
      m.set(k, [...(m.get(k) ?? []), c]);
    }
    return [...m.entries()];
  }, [visible]);

  const act = async (id: string, fn: () => Promise<unknown>) => {
    setBusy(id);
    setError("");
    setNeedsPlan(false);
    try {
      await fn();
      await Promise.all([classes.reload(), mine.reload()]);
    } catch (e) {
      setError(errorMessage(e));
      setNeedsPlan(e instanceof ApiError && e.status === 402);
    } finally {
      setBusy("");
    }
  };

  return (
    <div>
      {filters && (
        <div className="chips" style={{ marginBottom: 20 }}>
          <button type="button" className={`chip${category === "" ? " chip--on" : ""}`} aria-pressed={category === ""} onClick={() => setCategory("")}>
            All classes
          </button>
          {CLASS_CATEGORIES.map((c) => (
            <button key={c} type="button" className={`chip${category === c ? " chip--on" : ""}`} aria-pressed={category === c} onClick={() => setCategory(c)}>
              {CATEGORY_LABEL[c]}
            </button>
          ))}
        </div>
      )}

      {error && (
        <p className="form-error" role="alert">
          {error} {needsPlan && <Link href="/membership">See pricing</Link>}
        </p>
      )}
      {classes.error && <p className="form-error">{classes.error}</p>}
      {classes.loading && !classes.data && <p className="message">Loading timetable…</p>}
      {classes.data && groups.length === 0 && (
        <div className="empty">
          <h2 className="h2">No classes scheduled</h2>
          <p>Check back soon, or try another category.</p>
        </div>
      )}

      {groups.map(([key, list]) => (
        <section key={key} className="tt-day" aria-label={formatDay(list[0].startsAt)}>
          <h3 className="tt-date">{formatDay(list[0].startsAt)}</h3>
          <ul className="tt-list">
            {list.map((c) => {
              const booked = bookingFor.get(c._id);
              const left = c.capacity - c.bookedCount;
              const full = left <= 0;
              return (
                <li key={c._id} className="tt-row">
                  <div className="tt-time">
                    <strong>{formatTime(c.startsAt)}</strong>
                    <span>{c.durationMin} min</span>
                  </div>
                  <div className="tt-main">
                    <p className="tt-title">{c.title}</p>
                    <p className="tt-sub">
                      <span className={`cat cat--${c.category}`}>{CATEGORY_LABEL[c.category]}</span>
                      <span className="capitalize">{c.level === "all" ? "All levels" : c.level}</span>
                      {trainerName(c) && <span>with {trainerName(c)}</span>}
                      <span>{c.room}</span>
                    </p>
                  </div>
                  <div className="tt-action">
                    <span className={`tt-spots${left <= 3 && !full ? " tt-spots--low" : ""}`}>{full ? "Full" : `${left} ${left === 1 ? "spot" : "spots"} left`}</span>
                    {!signedIn ? (
                      <Link href="/login?next=/classes" className="btn btn--secondary btn--sm">
                        Sign in to book
                      </Link>
                    ) : booked ? (
                      <button type="button" className="btn btn--secondary btn--sm" disabled={busy === c._id} onClick={() => act(c._id, () => api(`/bookings/${booked._id}/cancel`, { method: "POST" }))}>
                        Booked · Cancel
                      </button>
                    ) : (
                      <button type="button" className="btn btn--primary btn--sm" disabled={full || busy === c._id} onClick={() => act(c._id, () => api(`/classes/${c._id}/book`, { method: "POST" }))}>
                        {full ? "Full" : busy === c._id ? "Booking…" : "Book"}
                      </button>
                    )}
                  </div>
                </li>
              );
            })}
          </ul>
        </section>
      ))}
    </div>
  );
}
