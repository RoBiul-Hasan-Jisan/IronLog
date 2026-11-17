"use client";

import Link from "next/link";
import { useState, type FormEvent } from "react";
import { api, errorMessage } from "@/lib/api";
import type { Order } from "@/lib/apiTypes";
import { formatDate, formatMoney } from "@/lib/money";
import { useFetch } from "@/lib/useFetch";
import { useAuth } from "./AuthProvider";

export function OrderStatusBadge({ status }: { status: string }) {
  return <span className={`badge badge--${status}`}>{status}</span>;
}

export function AccountView() {
  const { profile, firebaseUser, setName, logout, resendVerification, refresh } = useAuth();
  const orders = useFetch<Order[]>("/orders");
  const [name, setNameValue] = useState(profile?.name ?? "");
  const [msg, setMsg] = useState("");
  const [err, setErr] = useState("");

  if (!profile) return null;
  const expires = profile.membership?.expiresAt;
  const active = expires ? new Date(expires) > new Date() : false;
  const ordered = typeof window !== "undefined" && new URLSearchParams(window.location.search).has("ordered");

  const save = async (e: FormEvent) => {
    e.preventDefault();
    setErr("");
    try {
      await setName(name.trim());
      setMsg("Saved.");
    } catch (x) {
      setErr(errorMessage(x));
    }
  };
  const cancel = async (id: string) => {
    if (!window.confirm("Cancel this order?")) return;
    try {
      await api(`/orders/${id}/cancel`, { method: "POST" });
      await orders.reload();
    } catch (x) {
      setErr(errorMessage(x));
    }
  };

  return (
    <div>
      <div className="page-head">
        <h1 className="page-title">Account</h1>
        <div className="form-actions">
          {profile.role === "admin" && (
            <Link href="/admin" className="btn btn--primary">
              Admin panel
            </Link>
          )}
          <button type="button" className="btn btn--secondary" onClick={() => void logout()}>
            Sign out
          </button>
        </div>
      </div>
      {ordered && <p className="form-info">Order placed. Thank you!</p>}

      <div className="two-col">
        <section className="panel-box">
          <h2 className="h2">Profile</h2>
          <form className="form" onSubmit={save}>
            <label className="form-field">
              Name
              <input className="input" value={name} onChange={(e) => setNameValue(e.target.value)} required maxLength={80} />
            </label>
            <p className="form-hint">
              {profile.email} · <span className="capitalize">{profile.role}</span>
            </p>
            {!firebaseUser?.emailVerified && (
              <p className="form-hint">
                Email not verified.{" "}
                <button type="button" className="linkbtn" onClick={() => void resendVerification().then(() => setMsg("Verification email sent."))}>
                  Resend
                </button>{" "}
                ·{" "}
                <button type="button" className="linkbtn" onClick={() => void refresh()}>
                  I verified it
                </button>
              </p>
            )}
            {err && <p className="form-error" role="alert">{err}</p>}
            {msg && <p className="form-info" role="status">{msg}</p>}
            <button type="submit" className="btn btn--primary">
              Save
            </button>
          </form>
        </section>

        <section className="panel-box">
          <h2 className="h2">Membership</h2>
          {active ? (
            <p>
              <strong>{profile.membership?.planName}</strong>
              <br />
              Active until {formatDate(expires)}
            </p>
          ) : (
            <p>{expires ? `Expired on ${formatDate(expires)}.` : "You do not have a membership yet."}</p>
          )}
          <div className="form-actions">
            <Link href="/membership" className="btn btn--secondary">
              {active ? "Extend" : "See plans"}
            </Link>
            <Link href="/checkin" className="btn btn--secondary">
              Check-in code
            </Link>
            <Link href="/bookings" className="btn btn--secondary">
              My bookings
            </Link>
          </div>
        </section>
      </div>

      <section className="section">
        <div className="section-head">
          <h2 className="h2">Orders</h2>
        </div>
        {orders.data && orders.data.length === 0 && <p>No orders yet.</p>}
        <ul className="order-list">
          {orders.data?.map((o) => (
            <li key={o._id} className="order">
              <div className="order-head">
                <span>
                  {formatDate(o.createdAt)} · #{o._id.slice(-6)}
                </span>
                <OrderStatusBadge status={o.status} />
              </div>
              <ul className="order-items">
                {o.items.map((i, idx) => (
                  <li key={idx}>
                    {i.qty} × {i.name}
                  </li>
                ))}
              </ul>
              <div className="order-foot">
                <strong className="display">{formatMoney(o.totalCents)}</strong>
                {o.status === "pending" && (
                  <button type="button" className="btn btn--danger btn--sm" onClick={() => void cancel(o._id)}>
                    Cancel order
                  </button>
                )}
              </div>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
