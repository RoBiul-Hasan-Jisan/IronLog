"use client";

import { useState, type FormEvent } from "react";
import { api, errorMessage } from "@/lib/api";
import {
  CLASS_CATEGORIES,
  CLASS_LEVELS,
  type Booking,
  type ClassSession,
  type Lead,
  type Paged,
  type Profile,
  type Trainer,
} from "@/lib/apiTypes";
import { CATEGORY_LABEL } from "@/lib/gym";
import { formatDate, formatDay, formatTime } from "@/lib/money";
import { useFetch } from "@/lib/useFetch";
import { AdminPage } from "./AdminKit";
import { trainerName } from "./ClassTimetable";

/** ISO string -> value for <input type="datetime-local"> in the browser's time zone. */
const toLocalInput = (iso: string): string => {
  const d = new Date(iso);
  const p = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}T${p(d.getHours())}:${p(d.getMinutes())}`;
};

// ------------------------------------------------------------------ front desk
interface CheckInResult {
  duplicate: boolean;
  member: { _id: string; name: string; email: string; membership?: { planName?: string; expiresAt?: string }; active: boolean };
}
interface TodayCheckIn {
  _id: string;
  at: string;
  override: boolean;
  user: { name: string; email: string } | null;
}

export function AdminFrontDesk() {
  const today = useFetch<TodayCheckIn[]>("/admin/checkins");
  const [code, setCode] = useState("");
  const [q, setQ] = useState("");
  const found = useFetch<Paged<Profile>>(q.trim().length >= 2 ? `/admin/users?q=${encodeURIComponent(q.trim())}&limit=6` : null);
  const [result, setResult] = useState<{ tone: "ok" | "warn" | "bad"; text: string; override?: { userId?: string; code?: string } } | null>(null);
  const [busy, setBusy] = useState(false);

  const checkIn = async (target: { code?: string; userId?: string }, override = false) => {
    setBusy(true);
    setResult(null);
    try {
      const r = await api<CheckInResult>("/admin/checkin", { method: "POST", body: { ...target, override } });
      setResult({
        tone: r.duplicate ? "warn" : "ok",
        text: r.duplicate ? `${r.member.name} was already checked in within the last 2 hours.` : `${r.member.name} is checked in.${r.member.active ? "" : " (Membership override)"}`,
      });
      setCode("");
      await today.reload();
    } catch (e) {
      const body = e as { status?: number; message?: string };
      setResult({
        tone: "bad",
        text: errorMessage(e),
        override: body.status === 409 ? target : undefined,
      });
    } finally {
      setBusy(false);
    }
  };

  const submitCode = (e: FormEvent) => {
    e.preventDefault();
    if (code.trim()) void checkIn({ code: code.trim() });
  };

  return (
    <AdminPage title="Front desk">
      <div className="two-col">
        <section className="panel-box">
          <h2 className="h2">Check in a member</h2>
          <form className="form" onSubmit={submitCode}>
            <label className="form-field">
              Member code
              <input className="input desk-code" value={code} onChange={(e) => setCode(e.target.value.toUpperCase())} maxLength={12} autoFocus autoComplete="off" placeholder="e.g. K7M2QX" />
            </label>
            <button type="submit" className="btn btn--primary btn--lg" disabled={busy || !code.trim()}>
              Check in
            </button>
          </form>

          {result && (
            <div className={`desk-result desk-result--${result.tone}`} role="status">
              <p>{result.text}</p>
              {result.override && (
                <button type="button" className="btn btn--secondary btn--sm" onClick={() => void checkIn(result.override!, true)}>
                  Check in anyway
                </button>
              )}
            </div>
          )}

          <h3 className="fgroup-title" style={{ marginTop: 24 }}>
            No code? Find the member
          </h3>
          <input className="input" type="search" placeholder="Search name or email" aria-label="Search members" value={q} onChange={(e) => setQ(e.target.value)} />
          <ul className="admin-list">
            {found.data?.items.map((u) => {
              const active = Boolean(u.membership?.expiresAt && new Date(u.membership.expiresAt) > new Date());
              return (
                <li key={u._id}>
                  <span>
                    <strong>{u.name || u.email}</strong> <span className="muted">{u.email}</span>
                    <br />
                    <span className={`badge ${active ? "badge--completed" : "badge--cancelled"}`}>{active ? "active" : "no membership"}</span>
                  </span>
                  <button type="button" className="btn btn--secondary btn--sm" disabled={busy} onClick={() => void checkIn({ userId: u._id })}>
                    Check in
                  </button>
                </li>
              );
            })}
          </ul>
        </section>

        <section className="panel-box">
          <h2 className="h2">Today ({today.data?.length ?? 0})</h2>
          {today.error && <p className="form-error">{today.error}</p>}
          {today.data?.length === 0 && <p>No check-ins yet today.</p>}
          <ul className="kv">
            {today.data?.map((c) => (
              <li key={c._id}>
                <span>
                  {c.user?.name || c.user?.email || "Deleted member"}
                  {c.override && <span className="badge badge--pending" style={{ marginLeft: 8 }}>override</span>}
                </span>
                <strong>{formatTime(c.at)}</strong>
              </li>
            ))}
          </ul>
        </section>
      </div>
    </AdminPage>
  );
}

// ------------------------------------------------------------------ classes
interface ClassForm {
  title: string;
  description: string;
  category: string;
  level: string;
  trainer: string;
  startsAt: string;
  durationMin: string;
  capacity: string;
  room: string;
  repeatWeeks: string;
}
const EMPTY_CLASS: ClassForm = { title: "", description: "", category: "strength", level: "all", trainer: "", startsAt: "", durationMin: "60", capacity: "16", room: "Studio", repeatWeeks: "1" };

export function AdminClasses() {
  const classes = useFetch<ClassSession[]>("/admin/classes?days=21");
  const trainers = useFetch<Trainer[]>("/admin/trainers");
  const [editing, setEditing] = useState<string | "new" | null>(null);
  const [form, setForm] = useState<ClassForm>(EMPTY_CLASS);
  const [roster, setRoster] = useState<{ session: ClassSession; bookings: Booking[] & { user?: { name: string; email: string } }[] } | null>(null);
  const [err, setErr] = useState("");
  const set = <K extends keyof ClassForm>(k: K, v: string) => setForm((f) => ({ ...f, [k]: v }));

  const open = (c?: ClassSession) => {
    setErr("");
    setEditing(c ? c._id : "new");
    setForm(
      c
        ? {
            title: c.title,
            description: c.description,
            category: c.category,
            level: c.level,
            trainer: c.trainer && typeof c.trainer === "object" ? c.trainer._id : "",
            startsAt: toLocalInput(c.startsAt),
            durationMin: String(c.durationMin),
            capacity: String(c.capacity),
            room: c.room,
            repeatWeeks: "1",
          }
        : EMPTY_CLASS,
    );
  };

  const save = async (e: FormEvent) => {
    e.preventDefault();
    setErr("");
    const body = {
      title: form.title,
      description: form.description,
      category: form.category,
      level: form.level,
      trainer: form.trainer,
      startsAt: new Date(form.startsAt).toISOString(),
      durationMin: Math.floor(Number(form.durationMin)),
      capacity: Math.floor(Number(form.capacity)),
      room: form.room,
      active: true,
      ...(editing === "new" ? { repeatWeeks: Number(form.repeatWeeks) } : {}),
    };
    try {
      if (editing === "new") await api("/admin/classes", { method: "POST", body });
      else await api(`/admin/classes/${editing}`, { method: "PUT", body });
      setEditing(null);
      await classes.reload();
    } catch (x) {
      setErr(errorMessage(x));
    }
  };

  const cancelClass = async (c: ClassSession) => {
    if (!window.confirm(`Cancel "${c.title}" on ${formatDay(c.startsAt)}? ${c.bookedCount} booking(s) will be cancelled.`)) return;
    try {
      await api(`/admin/classes/${c._id}`, { method: "DELETE" });
      await classes.reload();
    } catch (x) {
      setErr(errorMessage(x));
    }
  };

  const showRoster = async (c: ClassSession) => {
    setErr("");
    try {
      setRoster({ session: c, bookings: await api(`/admin/classes/${c._id}/bookings`) });
    } catch (x) {
      setErr(errorMessage(x));
    }
  };

  const mark = async (id: string, status: string) => {
    try {
      await api(`/admin/bookings/${id}`, { method: "PATCH", body: { status } });
      if (roster) await showRoster(roster.session);
      await classes.reload();
    } catch (x) {
      setErr(errorMessage(x));
    }
  };

  return (
    <AdminPage title="Classes" actions={<button type="button" className="btn btn--primary" onClick={() => open()}>Add class</button>}>
      {(err || classes.error) && <p className="form-error" role="alert">{err || classes.error}</p>}

      {editing && (
        <form className="form panel-box" onSubmit={save}>
          <h2 className="h2">{editing === "new" ? "New class" : "Edit class"}</h2>
          <label className="form-field">Title<input className="input" value={form.title} onChange={(e) => set("title", e.target.value)} required maxLength={80} /></label>
          <label className="form-field">Description<input className="input" value={form.description} onChange={(e) => set("description", e.target.value)} maxLength={600} /></label>
          <div className="form-row">
            <label className="form-field">Category<select className="select" value={form.category} onChange={(e) => set("category", e.target.value)}>{CLASS_CATEGORIES.map((c) => <option key={c} value={c}>{CATEGORY_LABEL[c]}</option>)}</select></label>
            <label className="form-field">Level<select className="select" value={form.level} onChange={(e) => set("level", e.target.value)}>{CLASS_LEVELS.map((l) => <option key={l}>{l}</option>)}</select></label>
            <label className="form-field">Trainer<select className="select" value={form.trainer} onChange={(e) => set("trainer", e.target.value)}><option value="">(none)</option>{trainers.data?.map((t) => <option key={t._id} value={t._id}>{t.name}</option>)}</select></label>
          </div>
          <div className="form-row">
            <label className="form-field">Starts<input className="input" type="datetime-local" value={form.startsAt} onChange={(e) => set("startsAt", e.target.value)} required /></label>
            <label className="form-field">Minutes<input className="input" type="number" min="10" max="240" value={form.durationMin} onChange={(e) => set("durationMin", e.target.value)} required /></label>
            <label className="form-field">Capacity<input className="input" type="number" min="1" max="500" value={form.capacity} onChange={(e) => set("capacity", e.target.value)} required /></label>
            <label className="form-field">Room<input className="input" value={form.room} onChange={(e) => set("room", e.target.value)} maxLength={40} /></label>
          </div>
          {editing === "new" && (
            <label className="form-field">
              Repeat weekly for (weeks)
              <input className="input" type="number" min="1" max="26" value={form.repeatWeeks} onChange={(e) => set("repeatWeeks", e.target.value)} />
              <span className="form-hint">1 creates just this class. 8 creates the same class every week for 8 weeks.</span>
            </label>
          )}
          <div className="form-actions">
            <button type="submit" className="btn btn--primary">Save</button>
            <button type="button" className="btn btn--secondary" onClick={() => setEditing(null)}>Cancel</button>
          </div>
        </form>
      )}

      {roster && (
        <section className="panel-box">
          <div className="order-head">
            <h2 className="h2">
              {roster.session.title} · {formatDay(roster.session.startsAt)} {formatTime(roster.session.startsAt)}
            </h2>
            <button type="button" className="btn btn--quiet btn--sm" onClick={() => setRoster(null)}>Close</button>
          </div>
          {roster.bookings.length === 0 && <p>Nobody is booked yet.</p>}
          <ul className="kv">
            {(roster.bookings as unknown as (Booking & { user: { name: string; email: string } })[]).map((b) => (
              <li key={b._id}>
                <span>{b.user?.name || b.user?.email} <span className={`badge badge--${b.status === "attended" ? "completed" : b.status === "noshow" ? "cancelled" : "paid"}`}>{b.status}</span></span>
                <span>
                  <button type="button" className="btn btn--secondary btn--sm" onClick={() => void mark(b._id, "attended")}>Attended</button>{" "}
                  <button type="button" className="btn btn--quiet btn--sm" onClick={() => void mark(b._id, "noshow")}>No-show</button>{" "}
                  <button type="button" className="btn btn--danger btn--sm" onClick={() => void mark(b._id, "cancelled")}>Remove</button>
                </span>
              </li>
            ))}
          </ul>
        </section>
      )}

      <div className="table-wrap">
        <table className="table">
          <thead><tr><th>When</th><th>Class</th><th>Trainer</th><th>Booked</th><th>Status</th><th /></tr></thead>
          <tbody>
            {classes.data?.map((c) => (
              <tr key={c._id}>
                <td>{formatDay(c.startsAt)}<br /><span className="muted">{formatTime(c.startsAt)} · {c.durationMin} min</span></td>
                <td><strong>{c.title}</strong><br /><span className={`cat cat--${c.category}`}>{CATEGORY_LABEL[c.category]}</span></td>
                <td>{trainerName(c) || "-"}</td>
                <td>{c.bookedCount} / {c.capacity}</td>
                <td><span className={`badge ${c.active ? "badge--completed" : "badge--cancelled"}`}>{c.active ? "scheduled" : "cancelled"}</span></td>
                <td className="row-end">
                  <button type="button" className="btn btn--secondary btn--sm" onClick={() => void showRoster(c)}>Roster</button>{" "}
                  <button type="button" className="btn btn--secondary btn--sm" onClick={() => open(c)}>Edit</button>{" "}
                  {c.active && <button type="button" className="btn btn--danger btn--sm" onClick={() => void cancelClass(c)}>Cancel</button>}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {classes.data?.length === 0 && <p>No classes in the next 3 weeks. Add one above.</p>}
    </AdminPage>
  );
}

// ------------------------------------------------------------------ trainers
interface TrainerForm {
  name: string;
  title: string;
  bio: string;
  specialties: string;
  photoUrl: string;
  active: boolean;
}
const EMPTY_TRAINER: TrainerForm = { name: "", title: "", bio: "", specialties: "", photoUrl: "", active: true };

export function AdminTrainers() {
  const { data, error, reload } = useFetch<Trainer[]>("/admin/trainers");
  const [editing, setEditing] = useState<string | "new" | null>(null);
  const [form, setForm] = useState<TrainerForm>(EMPTY_TRAINER);
  const [err, setErr] = useState("");
  const set = <K extends keyof TrainerForm>(k: K, v: TrainerForm[K]) => setForm((f) => ({ ...f, [k]: v }));

  const open = (t?: Trainer) => {
    setErr("");
    setEditing(t ? t._id : "new");
    setForm(t ? { name: t.name, title: t.title, bio: t.bio, specialties: t.specialties.join(", "), photoUrl: t.photoUrl, active: t.active } : EMPTY_TRAINER);
  };
  const save = async (e: FormEvent) => {
    e.preventDefault();
    setErr("");
    const body = { ...form, specialties: form.specialties.split(",").map((s) => s.trim()).filter(Boolean) };
    try {
      if (editing === "new") await api("/admin/trainers", { method: "POST", body });
      else await api(`/admin/trainers/${editing}`, { method: "PUT", body });
      setEditing(null);
      await reload();
    } catch (x) {
      setErr(errorMessage(x));
    }
  };
  const remove = async (t: Trainer) => {
    if (!window.confirm(`Remove ${t.name}? Their classes stay, without a named trainer.`)) return;
    try {
      await api(`/admin/trainers/${t._id}`, { method: "DELETE" });
      await reload();
    } catch (x) {
      setErr(errorMessage(x));
    }
  };

  return (
    <AdminPage title="Trainers" actions={<button type="button" className="btn btn--primary" onClick={() => open()}>Add trainer</button>}>
      {(error || err) && <p className="form-error" role="alert">{error || err}</p>}
      {editing && (
        <form className="form panel-box" onSubmit={save}>
          <h2 className="h2">{editing === "new" ? "New trainer" : "Edit trainer"}</h2>
          <div className="form-row">
            <label className="form-field">Name<input className="input" value={form.name} onChange={(e) => set("name", e.target.value)} required maxLength={80} /></label>
            <label className="form-field">Role / title<input className="input" value={form.title} onChange={(e) => set("title", e.target.value)} maxLength={80} /></label>
          </div>
          <label className="form-field">Bio<textarea className="input" rows={3} value={form.bio} onChange={(e) => set("bio", e.target.value)} maxLength={1000} /></label>
          <label className="form-field">Specialties (comma separated)<input className="input" value={form.specialties} onChange={(e) => set("specialties", e.target.value)} /></label>
          <label className="form-field">Photo URL (optional)<input className="input" type="url" value={form.photoUrl} onChange={(e) => set("photoUrl", e.target.value)} /></label>
          <label className="check"><input type="checkbox" checked={form.active} onChange={(e) => set("active", e.target.checked)} /> Shown on the website</label>
          <div className="form-actions">
            <button type="submit" className="btn btn--primary">Save</button>
            <button type="button" className="btn btn--secondary" onClick={() => setEditing(null)}>Cancel</button>
          </div>
        </form>
      )}
      <ul className="admin-list">
        {data?.map((t) => (
          <li key={t._id}>
            <span><strong>{t.name}</strong> <span className="muted">{t.title}</span> {!t.active && <span className="badge badge--cancelled">hidden</span>}</span>
            <span>
              <button type="button" className="btn btn--secondary btn--sm" onClick={() => open(t)}>Edit</button>{" "}
              <button type="button" className="btn btn--danger btn--sm" onClick={() => void remove(t)}>Delete</button>
            </span>
          </li>
        ))}
      </ul>
    </AdminPage>
  );
}

// ------------------------------------------------------------------ leads
const LEAD_STATUSES = ["new", "contacted", "closed"] as const;

export function AdminLeads() {
  const [status, setStatus] = useState("");
  const { data, error, reload } = useFetch<Lead[]>(`/admin/leads?status=${status}`);
  const [err, setErr] = useState("");

  const setLeadStatus = async (id: string, next: string) => {
    try {
      await api(`/admin/leads/${id}`, { method: "PATCH", body: { status: next } });
      await reload();
    } catch (x) {
      setErr(errorMessage(x));
    }
  };
  const remove = async (id: string) => {
    if (!window.confirm("Delete this enquiry?")) return;
    try {
      await api(`/admin/leads/${id}`, { method: "DELETE" });
      await reload();
    } catch (x) {
      setErr(errorMessage(x));
    }
  };

  return (
    <AdminPage title="Enquiries">
      <div className="chips" style={{ marginBottom: 16 }}>
        {["", ...LEAD_STATUSES].map((s) => (
          <button key={s || "all"} type="button" className={`chip${status === s ? " chip--on" : ""}`} aria-pressed={status === s} onClick={() => setStatus(s)}>
            <span className="capitalize">{s || "All"}</span>
          </button>
        ))}
      </div>
      {(error || err) && <p className="form-error" role="alert">{error || err}</p>}
      <div className="table-wrap">
        <table className="table">
          <thead><tr><th>Received</th><th>Contact</th><th>Interest</th><th>Message</th><th>Status</th><th /></tr></thead>
          <tbody>
            {data?.map((l) => (
              <tr key={l._id}>
                <td>{formatDate(l.createdAt)}</td>
                <td><strong>{l.name}</strong><br /><a href={`mailto:${l.email}`}>{l.email}</a>{l.phone && <><br /><span className="muted">{l.phone}</span></>}</td>
                <td className="capitalize">{l.interest.replace("-", " ")}</td>
                <td>{l.message || <span className="muted">-</span>}</td>
                <td>
                  <select className="select select--sm" value={l.status} aria-label={`Status of ${l.name}`} onChange={(e) => void setLeadStatus(l._id, e.target.value)}>
                    {LEAD_STATUSES.map((s) => <option key={s}>{s}</option>)}
                  </select>
                </td>
                <td className="row-end"><button type="button" className="btn btn--quiet btn--sm" onClick={() => void remove(l._id)}>Delete</button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {data?.length === 0 && <p>No enquiries.</p>}
    </AdminPage>
  );
}
