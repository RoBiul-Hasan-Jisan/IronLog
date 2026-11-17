"use client";

import type { Trainer } from "@/lib/apiTypes";
import { useFetch } from "@/lib/useFetch";

export function TrainerAvatar({ trainer }: { trainer: Pick<Trainer, "name" | "photoUrl"> }) {
  const initials = trainer.name
    .split(/\s+/)
    .map((p) => p[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
  return trainer.photoUrl ? (
    // eslint-disable-next-line @next/next/no-img-element
    <img className="avatar" src={trainer.photoUrl} alt="" />
  ) : (
    <span className="avatar avatar--initials" aria-hidden="true">
      {initials}
    </span>
  );
}

export function TrainerCards({ limit }: { limit?: number }) {
  const { data, error, loading } = useFetch<Trainer[]>("/trainers");
  const list = limit ? (data ?? []).slice(0, limit) : (data ?? []);
  return (
    <div>
      {error && <p className="form-error">{error}</p>}
      {loading && !data && <p className="message">Loading…</p>}
      {data && data.length === 0 && <p>Our coaching team will be listed here soon.</p>}
      <ul className="trainers">
        {list.map((t) => (
          <li key={t._id} className="trainer">
            <TrainerAvatar trainer={t} />
            <h3 className="trainer-name">{t.name}</h3>
            <p className="trainer-title">{t.title}</p>
            <p className="trainer-bio">{t.bio}</p>
            <p className="trainer-tags">
              {t.specialties.map((s) => (
                <span key={s} className="chip chip--static">
                  {s}
                </span>
              ))}
            </p>
          </li>
        ))}
      </ul>
    </div>
  );
}
