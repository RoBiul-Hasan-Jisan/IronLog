"use client";

import Link from "next/link";
import type { CheckInSummary } from "@/lib/apiTypes";
import { formatDay, formatTime } from "@/lib/money";
import { useFetch } from "@/lib/useFetch";

export function CheckInView() {
  const { data, error } = useFetch<CheckInSummary>("/me/checkin");
  return (
    <div>
      <div className="page-head">
        <h1 className="page-title">Check-in</h1>
      </div>
      {error && <p className="form-error">{error}</p>}
      {!data && !error && <p className="message">Loading…</p>}
      {data && (
        <>
          <section className="codecard" aria-labelledby="code-title">
            <p id="code-title" className="codecard-label">
              Your member code
            </p>
            <p className="codecard-code display" aria-label={`Code ${data.code.split("").join(" ")}`}>
              {data.code}
            </p>
            <p className="codecard-hint">Show this at the front desk when you arrive.</p>
            <p>
              <span className={`badge ${data.memberActive ? "badge--completed" : "badge--cancelled"}`}>{data.memberActive ? "Membership active" : "No active membership"}</span>
            </p>
            {!data.memberActive && (
              <Link href="/membership" className="btn btn--primary">
                Choose a plan
              </Link>
            )}
          </section>

          <div className="stat-tiles" style={{ marginTop: 24 }}>
            <div className="stat-tile">
              <span className="stat-tile-value display">{data.thisMonth}</span>
              <span className="stat-tile-label">Visits this month</span>
            </div>
            <div className="stat-tile">
              <span className="stat-tile-value display">{data.streakWeeks}</span>
              <span className="stat-tile-label">Week streak</span>
              <span className="stat-tile-sub">weeks in a row with a visit</span>
            </div>
            <div className="stat-tile">
              <span className="stat-tile-value display">{data.total}</span>
              <span className="stat-tile-label">Visits in the last year</span>
            </div>
          </div>

          <section className="section" aria-labelledby="hist">
            <div className="section-head">
              <h2 id="hist" className="h2">
                Recent visits
              </h2>
            </div>
            {data.recent.length === 0 ? (
              <p>No visits yet. Your first check-in will appear here.</p>
            ) : (
              <ul className="admin-list">
                {data.recent.map((iso) => (
                  <li key={iso}>
                    <span>{formatDay(iso)}</span>
                    <span className="muted">{formatTime(iso)}</span>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </>
      )}
    </div>
  );
}
