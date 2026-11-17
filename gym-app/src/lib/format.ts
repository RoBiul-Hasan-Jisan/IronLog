const DEFAULT_MEDIA_BASE =
  "https://raw.githubusercontent.com/plataformafitness/exercises-library/main";

export const ATTRIBUTION = "© Gym visual — https://gymvisual.com/";

/** "barbell bench press" -> "Barbell Bench Press" */
export function titleCase(text: string): string {
  return text
    .replace(/\b([a-z])([a-z']*)/gi, (_m, first: string, rest: string) => first.toUpperCase() + rest.toLowerCase())
    .replace(/\bEz\b/g, "EZ");
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

/** "images/0001-abc.jpg" -> "videos/0001-abc.gif" (the animation that matches a thumbnail). */
export function gifPathFor(imagePath: string): string {
  return imagePath.replace(/^images\//, "videos/").replace(/\.jpe?g$/i, ".gif");
}

/** Resolves a library-relative media path to a URL. */
export function mediaUrl(path: string): string {
  // Custom exercises added by an admin carry full URLs.
  if (/^https?:\/\//i.test(path)) return path;
  const base = (process.env.NEXT_PUBLIC_MEDIA_BASE || DEFAULT_MEDIA_BASE).replace(/\/+$/, "");
  return `${base}/${path.replace(/^\/+/, "")}`;
}
