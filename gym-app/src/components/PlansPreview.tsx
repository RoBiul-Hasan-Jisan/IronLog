"use client";

import Link from "next/link";
import type { Plan } from "@/lib/apiTypes";
import { formatMoney } from "@/lib/money";
import { useFetch } from "@/lib/useFetch";

export function PlansPreview() {
  const { data, error } = useFetch<Plan[]>("/plans");
  if (error) return <p className="form-error">{error}</p>;
  if (!data) return <p className="message">Loading…</p>;
  if (data.length === 0) return <p>Plans will be listed here soon.</p>;
  return (
    <ul className="plans">
      {data.map((p) => (
        <li key={p._id} className="plan">
          <h3 className="plan-name">{p.name}</h3>
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
          <Link href="/membership" className="btn btn--primary btn--block">
            Choose plan
          </Link>
        </li>
      ))}
    </ul>
  );
}
