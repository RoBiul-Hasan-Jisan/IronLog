"use client";

import { useMemo, useState, type FormEvent } from "react";
import index from "@/data/exercises-index.json";
import { api, errorMessage } from "@/lib/api";
import type { CustomExercise } from "@/lib/apiTypes";
import { titleCase } from "@/lib/format";
import type { ExerciseSummary } from "@/lib/types";
import { useFetch } from "@/lib/useFetch";
import { AdminPage } from "./AdminKit";

const LIBRARY = index as ExerciseSummary[];

interface Form {
  name: string;
  bodyPart: string;
  equipment: string;
  target: string;
  secondary: string;
  steps: string;
  imageUrl: string;
  gifUrl: string;
}
const EMPTY: Form = { name: "", bodyPart: "", equipment: "", target: "", secondary: "", steps: "", imageUrl: "", gifUrl: "" };
const lines = (s: string, sep: RegExp) => s.split(sep).map((x) => x.trim()).filter(Boolean);

export function AdminExercises() {
  const custom = useFetch<CustomExercise[]>("/admin/exercises/custom");
  const hiddenFetch = useFetch<string[]>("/admin/exercises/hidden");
  const [q, setQ] = useState("");
  const [editing, setEditing] = useState<string | "new" | null>(null);
  const [form, setForm] = useState<Form>(EMPTY);
  const [err, setErr] = useState("");

  const hidden = useMemo(() => new Set(hiddenFetch.data ?? []), [hiddenFetch.data]);
  const matches = useMemo(() => {
    const t = q.trim().toLowerCase();
    if (!t) return [];
    return LIBRARY.filter((e) => e.name.toLowerCase().includes(t)).slice(0, 15);
  }, [q]);
  const hiddenList = LIBRARY.filter((e) => hidden.has(e.id));
  const set = <K extends keyof Form>(k: K, v: string) => setForm((f) => ({ ...f, [k]: v }));

  const toggle = async (id: string, next: boolean) => {
    setErr("");
    try {
      await api(`/admin/exercises/hidden/${id}`, { method: "PUT", body: { hidden: next } });
      await hiddenFetch.reload();
    } catch (e) {
      setErr(errorMessage(e));
    }
  };

  const open = (c?: CustomExercise) => {
    setErr("");
    setEditing(c ? c._id : "new");
    setForm(c ? { name: c.name, bodyPart: c.bodyPart, equipment: c.equipment, target: c.target, secondary: c.secondary.join(", "), steps: c.steps.join("\n"), imageUrl: c.imageUrl, gifUrl: c.gifUrl } : EMPTY);
  };

  const save = async (e: FormEvent) => {
    e.preventDefault();
    setErr("");
    const body = {
      name: form.name,
      bodyPart: form.bodyPart,
      equipment: form.equipment,
      target: form.target,
      secondary: lines(form.secondary, /,/),
      steps: lines(form.steps, /\n/),
      imageUrl: form.imageUrl,
      gifUrl: form.gifUrl,
    };
    try {
      if (editing === "new") await api("/admin/exercises/custom", { method: "POST", body });
      else await api(`/admin/exercises/custom/${editing}`, { method: "PUT", body });
      setEditing(null);
      await custom.reload();
    } catch (x) {
      setErr(errorMessage(x));
    }
  };

  const remove = async (c: CustomExercise) => {
    if (!window.confirm(`Delete ${c.name}?`)) return;
    try {
      await api(`/admin/exercises/custom/${c._id}`, { method: "DELETE" });
      await custom.reload();
    } catch (x) {
      setErr(errorMessage(x));
    }
  };

  return (
    <AdminPage title="Exercises" actions={<button type="button" className="btn btn--primary" onClick={() => open()}>Add custom exercise</button>}>
      {(err || custom.error || hiddenFetch.error) && <p className="form-error" role="alert">{err || custom.error || hiddenFetch.error}</p>}
      <p className="form-hint">Changes show up in the library the next time it loads. Hiding removes an exercise from lists and search; its page still opens by direct link.</p>

      {editing && (
        <form className="form panel-box" onSubmit={save}>
          <h2 className="h2">{editing === "new" ? "New custom exercise" : "Edit exercise"}</h2>
          <label className="form-field">Name<input className="input" value={form.name} onChange={(e) => set("name", e.target.value)} required maxLength={120} /></label>
          <div className="form-row">
            <label className="form-field">Body part<input className="input" value={form.bodyPart} onChange={(e) => set("bodyPart", e.target.value)} required placeholder="chest, back, waist…" /></label>
            <label className="form-field">Equipment<input className="input" value={form.equipment} onChange={(e) => set("equipment", e.target.value)} required placeholder="dumbbell, body weight…" /></label>
            <label className="form-field">Target muscle<input className="input" value={form.target} onChange={(e) => set("target", e.target.value)} required placeholder="pectorals…" /></label>
          </div>
          <label className="form-field">Also works (comma separated)<input className="input" value={form.secondary} onChange={(e) => set("secondary", e.target.value)} /></label>
          <label className="form-field">Steps (one per line)<textarea className="input" rows={6} value={form.steps} onChange={(e) => set("steps", e.target.value)} required /></label>
          <div className="form-row">
            <label className="form-field">Image URL<input className="input" type="url" value={form.imageUrl} onChange={(e) => set("imageUrl", e.target.value)} /></label>
            <label className="form-field">Animation (GIF) URL<input className="input" type="url" value={form.gifUrl} onChange={(e) => set("gifUrl", e.target.value)} /></label>
          </div>
          <div className="form-actions">
            <button type="submit" className="btn btn--primary">Save</button>
            <button type="button" className="btn btn--secondary" onClick={() => setEditing(null)}>Cancel</button>
          </div>
        </form>
      )}

      <section className="section" style={{ marginTop: 24 }}>
        <div className="section-head"><h2 className="h2">Custom exercises</h2></div>
        {custom.data?.length === 0 && <p>None yet.</p>}
        <ul className="admin-list">
          {custom.data?.map((c) => (
            <li key={c._id}>
              <span><strong>{titleCase(c.name)}</strong> <span className="muted">{c.bodyPart} · {c.equipment}</span></span>
              <span>
                <button type="button" className="btn btn--secondary btn--sm" onClick={() => open(c)}>Edit</button>{" "}
                <button type="button" className="btn btn--danger btn--sm" onClick={() => void remove(c)}>Delete</button>
              </span>
            </li>
          ))}
        </ul>
      </section>

      <section className="section" style={{ marginTop: 40 }}>
        <div className="section-head"><h2 className="h2">Library visibility</h2></div>
        <input className="input toolbar-input" type="search" placeholder="Search the library to hide an exercise" aria-label="Search library" value={q} onChange={(e) => setQ(e.target.value)} />
        <ul className="admin-list">
          {matches.map((e) => (
            <li key={e.id}>
              <span><strong>{titleCase(e.name)}</strong> <span className="muted">{e.bodyPart} · {e.equipment}</span></span>
              <button type="button" className="btn btn--secondary btn--sm" onClick={() => void toggle(e.id, !hidden.has(e.id))}>
                {hidden.has(e.id) ? "Show" : "Hide"}
              </button>
            </li>
          ))}
        </ul>
        {hiddenList.length > 0 && (
          <>
            <h3 className="fgroup-title" style={{ marginTop: 24 }}>Currently hidden ({hiddenList.length})</h3>
            <ul className="admin-list">
              {hiddenList.map((e) => (
                <li key={e.id}>
                  <span>{titleCase(e.name)}</span>
                  <button type="button" className="btn btn--secondary btn--sm" onClick={() => void toggle(e.id, false)}>Show</button>
                </li>
              ))}
            </ul>
          </>
        )}
      </section>
    </AdminPage>
  );
}
