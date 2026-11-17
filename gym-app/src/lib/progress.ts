import type { ProgressEntry } from "./apiTypes";

export type MetricKey = "weightKg" | "bodyFatPct" | "waistCm" | "chestCm" | "hipsCm" | "armCm" | "thighCm";

export const METRICS: { key: MetricKey; label: string; unit: string }[] = [
  { key: "weightKg", label: "Weight", unit: "kg" },
  { key: "bodyFatPct", label: "Body fat", unit: "%" },
  { key: "waistCm", label: "Waist", unit: "cm" },
  { key: "chestCm", label: "Chest", unit: "cm" },
  { key: "hipsCm", label: "Hips", unit: "cm" },
  { key: "armCm", label: "Arm", unit: "cm" },
  { key: "thighCm", label: "Thigh", unit: "cm" },
];

export interface SeriesPoint {
  t: number;
  v: number;
}

/** One measurement over time, oldest first. Entries without that measurement are skipped. */
export function seriesFor(entries: ProgressEntry[], key: MetricKey): SeriesPoint[] {
  return entries
    .flatMap((e) => (typeof e[key] === "number" ? [{ t: new Date(e.date).getTime(), v: e[key] as number }] : []))
    .sort((a, b) => a.t - b.t);
}

export interface ChartGeometry {
  points: { x: number; y: number; t: number; v: number }[];
  path: string;
  yTicks: { y: number; value: number }[];
  min: number;
  max: number;
}

/** Maps a series into SVG coordinates inside a w x h box with the given padding. */
export function chartGeometry(
  series: SeriesPoint[],
  w: number,
  h: number,
  pad: { top: number; right: number; bottom: number; left: number },
): ChartGeometry {
  if (series.length === 0) return { points: [], path: "", yTicks: [], min: 0, max: 0 };
  let lo = Math.min(...series.map((p) => p.v));
  let hi = Math.max(...series.map((p) => p.v));
  if (lo === hi) {
    lo -= 1;
    hi += 1;
  } else {
    const margin = (hi - lo) * 0.1;
    lo -= margin;
    hi += margin;
  }
  const t0 = series[0].t;
  const t1 = series[series.length - 1].t;
  const innerW = w - pad.left - pad.right;
  const innerH = h - pad.top - pad.bottom;
  const x = (t: number) => pad.left + (t1 === t0 ? innerW / 2 : ((t - t0) / (t1 - t0)) * innerW);
  const y = (v: number) => pad.top + (1 - (v - lo) / (hi - lo)) * innerH;
  const points = series.map((p) => ({ x: x(p.t), y: y(p.v), t: p.t, v: p.v }));
  const path = points.map((p, i) => `${i === 0 ? "M" : "L"}${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join(" ");
  const yTicks = [0, 1, 2, 3].map((i) => {
    const value = lo + ((hi - lo) * i) / 3;
    return { y: y(value), value };
  });
  return { points, path, yTicks, min: lo, max: hi };
}

/** Latest value and the change since the first entry; null with fewer than one point. */
export function changeSince(series: SeriesPoint[]): { first: number; last: number; delta: number } | null {
  if (series.length === 0) return null;
  const first = series[0].v;
  const last = series[series.length - 1].v;
  return { first, last, delta: Math.round((last - first) * 10) / 10 };
}

/** Monday 00:00 (local time) of the week containing `d`. */
export function weekStart(d: Date): Date {
  const out = new Date(d);
  out.setHours(0, 0, 0, 0);
  out.setDate(out.getDate() - ((out.getDay() + 6) % 7));
  return out;
}

/** Workouts finished per week for the last `weeks` weeks, oldest first (the last bar is this week). */
export function weeklyCounts(dates: string[], now: Date, weeks: number): { start: number; count: number }[] {
  const thisWeek = weekStart(now);
  const buckets = Array.from({ length: weeks }, (_, i) => {
    const s = new Date(thisWeek);
    s.setDate(s.getDate() - 7 * (weeks - 1 - i));
    return { start: s.getTime(), count: 0 };
  });
  const index = new Map(buckets.map((b, i) => [b.start, i]));
  for (const iso of dates) {
    const i = index.get(weekStart(new Date(iso)).getTime());
    if (i !== undefined) buckets[i].count += 1;
  }
  return buckets;
}
