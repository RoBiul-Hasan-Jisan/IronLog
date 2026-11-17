"use client";

import Link from "next/link";
import { useState } from "react";
import { api, errorMessage } from "@/lib/api";
import type { Booking } from "@/lib/apiTypes";
import { CATEGORY_LABEL } from "@/lib/gym";
import { formatDay, formatTime } from "@/lib/money";
import { useFetch } from "@/lib/useFetch";
import { trainerName } from "./ClassTimetable";

const CANCEL_WINDOW_MS = 2 * 3_600_000;

export function BookingsView() {
  const { data, error, reload } = useFetch<Booking[]>("/me/bookings");
  const [err, setErr] = useState("");
  const now = Date.now();

  const rows = (data ?? []).filter((b) => b.session);
  const upcoming = rows.filter((b) => b.status === "booked" && new Date(b.session.startsAt).getTime() > now).sort((a, b) => +new Date(a.session.startsAt) - +new Date(b.session.startsAt));
  const past = rows.filter((b) => !upcoming.includes(b)).sort((a, b) => +new Date(b.session.startsAt) - +new Date(a.session.startsAt)).slice(0, 15);

  const cancel = async (id: string) => {
    setErr("");
    try {
      await api(`/bookings/${id}/cancel`, { method: "POST" });
      await reload();
    } catch (e) {
      setErr(errorMessage(e));
    }
  };

  return (
    <div>
      <div className="page-head">
        <h1 className="page-title">Bookings</h1>
        <Link href="/classes" className="btn btn--primary">
          Book a class
        </Link>
      </div>
      {(error || err) && (
        <p className="form-error" role="alert">
          {error || err}
        </p>
      )}

      <section aria-labelledby="up">
        <div className="section-head">
          <h2 id="up" className="h2">
            Upcoming
          </h2>
        </div>
        {data && upcoming.length === 0 && (
          <div className="empty">
            <h3 className="h2">Nothing booked</h3>
            <p>Pick a class from the timetable and it will show up here.</p>
          </div>
        )}
        <ul className="order-list">
          {upcoming.map((b) => {
            const s = b.session;
            const canCancel = new Date(s.startsAt).getTime() - now >= CANCEL_WINDOW_MS;
            return (
              <li key={b._id} className="order">
                <div className="order-head">
                  <span>
                    {formatDay(s.startsAt)} · {formatTime(s.startsAt)} · {s.durationMin} min
                  </span>
                  <span className={`cat cat--${s.category}`}>{CATEGORY_LABEL[s.category]}</span>
                </div>
                <p className="tt-title" style={{ margin: "6px 0" }}>
                  {s.title}
                </p>
                <div className="order-foot">
                  <span>
                    {s.room}
                    {trainerName(s) ? ` · with ${trainerName(s)}` : ""}
                  </span>
                  {canCancel ? (
                    <button type="button" className="btn btn--danger btn--sm" onClick={() => void cancel(b._id)}>
                      Cancel booking
                    </button>
                  ) : (
                    <span className="muted">Cancellation closed</span>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      </section>

      {past.length > 0 && (
        <section className="section" aria-labelledby="past">
          <div className="section-head">
            <h2 id="past" className="h2">
              Past classes
            </h2>
          </div>
          <ul className="admin-list">
            {past.map((b) => (
              <li key={b._id}>
                <span>
                  <strong>{b.session.title}</strong> <span className="muted">{formatDay(b.session.startsAt)}</span>
                </span>
                <span className={`badge badge--${b.status === "attended" ? "completed" : b.status === "noshow" ? "cancelled" : "paid"}`}>{b.status === "booked" ? "booked" : b.status === "noshow" ? "no-show" : b.status}</span>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
