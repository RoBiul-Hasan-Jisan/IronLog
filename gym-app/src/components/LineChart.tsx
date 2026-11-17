import { chartGeometry, type SeriesPoint } from "@/lib/progress";

const W = 640;
const H = 240;
const PAD = { top: 16, right: 16, bottom: 28, left: 44 };

const fmtDate = (t: number) => new Date(t).toLocaleDateString("en-GB", { day: "numeric", month: "short" });

/** Plain SVG line chart. The entries table next to it carries the exact numbers. */
export function LineChart({ series, unit, label }: { series: SeriesPoint[]; unit: string; label: string }) {
  if (series.length === 0) return <p className="muted">No {label.toLowerCase()} entries yet.</p>;
  const g = chartGeometry(series, W, H, PAD);
  const first = series[0];
  const last = series[series.length - 1];
  return (
    <svg className="linechart" viewBox={`0 0 ${W} ${H}`} role="img" aria-label={`${label} over time, from ${first.v}${unit} on ${fmtDate(first.t)} to ${last.v}${unit} on ${fmtDate(last.t)}`}>
      {g.yTicks.map((t) => (
        <g key={t.y}>
          <line x1={PAD.left} x2={W - PAD.right} y1={t.y} y2={t.y} className="lc-grid" />
          <text x={PAD.left - 8} y={t.y + 4} textAnchor="end" className="lc-label">
            {t.value.toFixed(1)}
          </text>
        </g>
      ))}
      <text x={PAD.left} y={H - 6} className="lc-label">
        {fmtDate(first.t)}
      </text>
      {series.length > 1 && (
        <text x={W - PAD.right} y={H - 6} textAnchor="end" className="lc-label">
          {fmtDate(last.t)}
        </text>
      )}
      <path d={g.path} className="lc-line" />
      {g.points.map((p) => (
        <circle key={p.t} cx={p.x} cy={p.y} r={4} className="lc-dot">
          <title>{`${fmtDate(p.t)}: ${p.v}${unit}`}</title>
        </circle>
      ))}
    </svg>
  );
}
