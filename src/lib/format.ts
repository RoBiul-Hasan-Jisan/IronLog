const DEFAULT_MEDIA_BASE =
  "https://raw.githubusercontent.com/plataformafitness/exercises-library/main";

export const ATTRIBUTION = "© Gym visual — https://gymvisual.com/";

/** "barbell bench press" -> "Barbell Bench Press" */
export function titleCase(text: string): string {
  return text.replace(/\b([a-z])([a-z']*)/gi, (_m, first: string, rest: string) =>
    first.toUpperCase() + rest.toLowerCase(),
  );
}

/** 75 -> "1:15", 3725 -> "1:02:05" */
export function formatClock(totalSeconds: number): string {
  const s = Math.max(0, Math.round(totalSeconds));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  const pad = (n: number) => String(n).padStart(2, "0");
  return h > 0 ? `${h}:${pad(m)}:${pad(sec)}` : `${m}:${pad(sec)}`;
}

/** 45 -> "45 sec", 600 -> "10 min", 3900 -> "1 h 5 min" */
export function formatDuration(totalSeconds: number): string {
  const s = Math.max(0, Math.round(totalSeconds));
  if (s < 60) return `${s} sec`;
  const totalMin = Math.round(s / 60);
  if (totalMin < 60) return `${totalMin} min`;
  const h = Math.floor(totalMin / 60);
  const m = totalMin % 60;
  return m === 0 ? `${h} h` : `${h} h ${m} min`;
}

/** Resolves a library-relative media path to a URL. */
export function mediaUrl(path: string): string {
  const base = (process.env.NEXT_PUBLIC_MEDIA_BASE || DEFAULT_MEDIA_BASE).replace(/\/+$/, "");
  return `${base}/${path.replace(/^\/+/, "")}`;
}
