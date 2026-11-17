"use client";

import { useMemo, useState, type FormEvent } from "react";
import { api, errorMessage } from "@/lib/api";
import type { ProgressEntry, WorkoutLog } from "@/lib/apiTypes";
import { formatDuration } from "@/lib/format";
import { formatDate } from "@/lib/money";
import { METRICS, changeSince, seriesFor, weeklyCounts, type MetricKey } from "@/lib/progress";
import { useFetch } from "@/lib/useFetch";
import { LineChart } from "./LineChart";

const today = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
};

export function ProgressView() {
  const entries = useFetch<ProgressEntry[]>("/me/progress");
  const logs = useFetch<WorkoutLog[]>("/me/workout-logs");
  const [metric, setMetric] = useState<MetricKey>("weightKg");
  const [form, setForm] = useState<Record<string, string>>({ date: today() });
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");

  const def = METRICS.find((m) => m.key === metric)!;
  const series = useMemo(() => seriesFor(entries.data ?? [], metric), [entries.data, metric]);
  const change = changeSince(series);
  const weeks = useMemo(() => weeklyCounts((logs.data ?? []).map((l) => l.completedAt), new Date(), 8), [logs.data]);
  const maxWeek = Math.max(1, ...weeks.map((w) => w.count));

  const set = (k: string, v: string) => setForm((f) => ({ ...f, [k]: v }));

  const save = async (e: FormEvent) => {
    e.preventDefault();
    setErr("");
    setBusy(true);
    try {
      const body: Record<string, unknown> = { date: form.date, note: form.note ?? "" };
      for (const m of METRICS) if (form[m.key]) body[m.key] = Number(form[m.key]);
      await api("/me/progress", { method: "POST", body });
      setForm({ date: today() });
      await entries.reload();
    } catch (x) {
      setErr(errorMessage(x));
    } finally {
      setBusy(false);
    }
  };

  const remove = async (id: string) => {
    if (!window.confirm("Delete this entry?")) return;
    try {
      await api(`/me/progress/${id}`, { method: "DELETE" });
      await entries.reload();
    } catch (x) {
      setErr(errorMessage(x));
    }
  };

  return (
    <div>
      <div className="page-head">
        <h1 className="page-title">Progress</h1>
      </div>
      {(entries.error || err) && (
        <p className="form-error" role="alert">
          {entries.error || err}
        </p>
      )}

      <div className="progress-grid">
        <section className="panel-box" aria-labelledby="chart-title">
          <h2 id="chart-title" className="h2">
            Body measurements
          </h2>
          <div className="chips" style={{ margin: "12px 0" }}>
            {METRICS.map((m) => (
              <button key={m.key} type="button" className={`chip${metric === m.key ? " chip--on" : ""}`} aria-pressed={metric === m.key} onClick={() => setMetric(m.key)}>
                {m.label}
              </button>
            ))}
          </div>
          {change && (
            <p className="progress-change">
              <strong className="display">
                {change.last}
                {def.unit}
              </strong>
              {series.length > 1 && (
                <span className="muted">
                  {" "}
                  {change.delta > 0 ? "+" : ""}
                  {change.delta}
                  {def.unit} since {formatDate(new Date(series[0].t).toISOString())}
                </span>
              )}
            </p>
          )}
          <LineChart series={series} unit={def.unit} label={def.label} />
        </section>

        <form className="form panel-box" onSubmit={save}>
          <h2 className="h2">Add an entry</h2>
          <label className="form-field">
            Date
            <input className="input" type="date" value={form.date} max={today()} onChange={(e) => set("date", e.target.value)} required />
          </label>
          <div className="form-row">
            {METRICS.map((m) => (
              <label key={m.key} className="form-field metric-field">
                {m.label} ({m.unit})
                <input className="input" type="number" inputMode="decimal" step="0.1" min="0" value={form[m.key] ?? ""} onChange={(e) => set(m.key, e.target.value)} />
              </label>
            ))}
          </div>
          <label className="form-field">
            Note (optional)
            <input className="input" value={form.note ?? ""} onChange={(e) => set("note", e.target.value)} maxLength={300} />
          </label>
          <button type="submit" className="btn btn--primary" disabled={busy}>
            {busy ? "Saving…" : "Save entry"}
          </button>
          <p className="form-hint">Fill in whatever you measured. At least one value is needed.</p>
        </form>
      </div>

      {entries.data && entries.data.length > 0 && (
        <section className="section" aria-labelledby="entries">
          <div className="section-head">
            <h2 id="entries" className="h2">
              All entries
            </h2>
          </div>
          <div className="table-wrap">
            <table className="table">
              <thead>
                <tr>
                  <th>Date</th>
                  {METRICS.map((m) => (
                    <th key={m.key}>{m.label}</th>
                  ))}
                  <th />
                </tr>
              </thead>
              <tbody>
                {[...entries.data].reverse().map((e) => (
                  <tr key={e._id}>
                    <td>{formatDate(e.date)}</td>
                    {METRICS.map((m) => (
                      <td key={m.key}>{e[m.key] ?? "-"}</td>
                    ))}
                    <td className="row-end">
                      <button type="button" className="btn btn--quiet btn--sm" onClick={() => void remove(e._id)}>
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      <section className="section" aria-labelledby="wk">
        <div className="section-head">
          <h2 id="wk" className="h2">
            Workouts per week
          </h2>
          <p>Finished with the workout player while signed in.</p>
        </div>
        <ul className="bars" aria-label="Workouts finished in each of the last 8 weeks">
          {weeks.map((w, i) => (
            <li key={w.start} className="bar">
              <span className="bar-count">{w.count}</span>
              <span className="bar-fill" style={{ height: `${(w.count / maxWeek) * 100}%` }} />
              <span className="bar-label">{i === weeks.length - 1 ? "This wk" : new Date(w.start).toLocaleDateString("en-GB", { day: "numeric", month: "short" })}</span>
            </li>
          ))}
        </ul>

        {logs.data && logs.data.length > 0 && (
          <ul className="admin-list" style={{ marginTop: 24 }}>
            {logs.data.slice(0, 10).map((l) => (
              <li key={l._id}>
                <span>
                  <strong>{formatDate(l.completedAt)}</strong>{" "}
                  <span className="muted">
                    {l.exercises.length} {l.exercises.length === 1 ? "exercise" : "exercises"} · {l.totalSets} {l.totalSets === 1 ? "set" : "sets"} · {formatDuration(l.durationSec)}
                  </span>
                </span>
              </li>
            ))}
          </ul>
        )}
        {logs.data && logs.data.length === 0 && <p>No finished workouts yet. Complete one in the workout player and it will be counted here.</p>}
      </section>
    </div>
  );
}
