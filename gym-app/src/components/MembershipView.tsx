"use client";

import Link from "next/link";
import { useState } from "react";
import { api, errorMessage } from "@/lib/api";
import type { Plan } from "@/lib/apiTypes";
import { formatDate, formatMoney } from "@/lib/money";
import { useFetch } from "@/lib/useFetch";
import { useAuth } from "./AuthProvider";

export function MembershipView() {
  const { data, error, loading } = useFetch<Plan[]>("/plans");
  const { status, profile, refresh } = useAuth();
  const [busy, setBusy] = useState("");
  const [message, setMessage] = useState("");
  const [problem, setProblem] = useState("");

  const expires = profile?.membership?.expiresAt;
  const active = expires ? new Date(expires) > new Date() : false;

  const buy = async (plan: Plan) => {
    setBusy(plan._id);
    setProblem("");
    setMessage("");
    try {
      await api("/membership", { method: "POST", body: { planId: plan._id } });
      await refresh();
      setMessage(`${plan.name} membership is active.`);
    } catch (e) {
      setProblem(errorMessage(e));
    } finally {
      setBusy("");
    }
  };

  return (
    <div>
      <div className="page-head">
        <h1 className="page-title">Membership</h1>
      </div>
      {active && (
        <p className="form-info">
          You are on <strong>{profile?.membership?.planName}</strong> until {formatDate(expires)}. Buying again extends it.
        </p>
      )}
      {message && <p className="form-info" role="status">{message}</p>}
      {(error || problem) && <p className="form-error" role="alert">{error || problem}</p>}
      {loading && !data && <p className="message">Loading…</p>}
      <ul className="plans">
        {data?.map((p) => (
          <li key={p._id} className="plan">
            <h2 className="plan-name">{p.name}</h2>
            <p className="plan-price display">
              {formatMoney(p.priceCents)}
              <small> / {p.durationDays} days</small>
            </p>
            <p className="plan-desc">{p.description}</p>
            <ul className="plan-features">
              {p.features.map((f) => (
                <li key={f}>{f}</li>
              ))}
            </ul>
            {status === "authenticated" ? (
              <button type="button" className="btn btn--primary btn--block" disabled={busy !== ""} onClick={() => void buy(p)}>
                {busy === p._id ? "Processing…" : active ? "Extend with this plan" : "Choose plan"}
              </button>
            ) : (
              <Link href="/login?next=/membership" className="btn btn--primary btn--block">
                Sign in to join
              </Link>
            )}
          </li>
        ))}
      </ul>
      <p className="form-hint">Demo checkout: no payment is taken.</p>
    </div>
  );
}
