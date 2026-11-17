"use client";

import { useState, type FormEvent } from "react";
import { api, errorMessage } from "@/lib/api";

export function LeadForm({ defaultInterest = "trial" }: { defaultInterest?: string }) {
  const [form, setForm] = useState({ name: "", email: "", phone: "", interest: defaultInterest, message: "", website: "" });
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState("");
  const set = (k: keyof typeof form, v: string) => setForm((f) => ({ ...f, [k]: v }));

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      await api("/leads", { method: "POST", body: form });
      setDone(true);
    } catch (x) {
      setError(errorMessage(x));
    } finally {
      setBusy(false);
    }
  };

  if (done) {
    return (
      <div className="panel-box" role="status">
        <h2 className="h2">Thank you!</h2>
        <p>We received your message and will contact you shortly.</p>
      </div>
    );
  }

  return (
    <form className="form panel-box" onSubmit={submit}>
      <h2 className="h2">Book a free trial or ask a question</h2>
      <label className="form-field">
        Name
        <input className="input" value={form.name} onChange={(e) => set("name", e.target.value)} required maxLength={80} autoComplete="name" />
      </label>
      <div className="form-row">
        <label className="form-field">
          Email
          <input className="input" type="email" value={form.email} onChange={(e) => set("email", e.target.value)} required autoComplete="email" />
        </label>
        <label className="form-field">
          Phone (optional)
          <input className="input" type="tel" value={form.phone} onChange={(e) => set("phone", e.target.value)} maxLength={30} autoComplete="tel" />
        </label>
      </div>
      <label className="form-field">
        I am interested in
        <select className="select" value={form.interest} onChange={(e) => set("interest", e.target.value)}>
          <option value="trial">A free trial visit</option>
          <option value="membership">Membership</option>
          <option value="personal-training">Personal training</option>
          <option value="other">Something else</option>
        </select>
      </label>
      <label className="form-field">
        Message (optional)
        <textarea className="input" rows={4} value={form.message} onChange={(e) => set("message", e.target.value)} maxLength={1000} />
      </label>
      {/* Honeypot: hidden from people, filled in by simple bots. */}
      <input className="hp" tabIndex={-1} autoComplete="off" aria-hidden="true" value={form.website} onChange={(e) => set("website", e.target.value)} name="website" />
      {error && (
        <p className="form-error" role="alert">
          {error}
        </p>
      )}
      <button type="submit" className="btn btn--primary btn--lg" disabled={busy}>
        {busy ? "Sending…" : "Send"}
      </button>
    </form>
  );
}
