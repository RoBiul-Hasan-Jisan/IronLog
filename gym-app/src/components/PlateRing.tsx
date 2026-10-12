import type { ReactNode } from "react";

export type RingMode =
  /** A single ring that unwinds as time runs out. `fraction` is 1 → 0. */
  | { kind: "countdown"; fraction: number }
  /** One arc per set: finished sets are filled, the current one is highlighted. */
  | { kind: "sets"; done: number; total: number };

const SIZE = 320;
const STROKE = 26;
const R = (SIZE - STROKE) / 2 - 10;
const C = 2 * Math.PI * R;

/**
 * The timer, drawn as a weight plate: a thick ring with a knurled outer edge and
 * the number sitting in the centre hole.
 */
export function PlateRing({
  mode,
  color,
  track = "var(--night-3)",
  label,
  children,
}: {
  mode: RingMode;
  color: string;
  track?: string;
  /** Accessible description of what the ring shows. */
  label: string;
  children?: ReactNode;
}) {
  let arcs: ReactNode;

  if (mode.kind === "countdown") {
    const f = Math.min(1, Math.max(0, mode.fraction));
    arcs = (
      <>
        <circle cx={SIZE / 2} cy={SIZE / 2} r={R} fill="none" stroke={track} strokeWidth={STROKE} />
        {f > 0 && (
          <circle
            className="ring-progress"
            cx={SIZE / 2}
            cy={SIZE / 2}
            r={R}
            fill="none"
            stroke={color}
            strokeWidth={STROKE}
            strokeLinecap="butt"
            strokeDasharray={`${C * f} ${C}`}
          />
        )}
      </>
    );
  } else {
    const n = Math.max(1, mode.total);
    const gap = n === 1 ? 0 : 10;
    const seg = C / n - gap;
    arcs = Array.from({ length: n }, (_, i) => {
      const finished = i < mode.done;
      const current = i === mode.done;
      return (
        <circle
          key={i}
          cx={SIZE / 2}
          cy={SIZE / 2}
          r={R}
          fill="none"
          stroke={finished || current ? color : track}
          strokeOpacity={finished ? 1 : current ? 0.55 : 1}
          strokeWidth={STROKE}
          strokeDasharray={`${seg} ${C - seg}`}
          strokeDashoffset={-(i * (C / n) + gap / 2)}
        />
      );
    });
  }

  return (
    <div className="ring" role="img" aria-label={label}>
      <svg viewBox={`0 0 ${SIZE} ${SIZE}`} aria-hidden="true" focusable="false">
        {/* knurled outer edge */}
        <circle
          cx={SIZE / 2}
          cy={SIZE / 2}
          r={SIZE / 2 - 4}
          fill="none"
          stroke="var(--night-3)"
          strokeWidth="3"
          strokeDasharray="1.5 7"
        />
        <g transform={`rotate(-90 ${SIZE / 2} ${SIZE / 2})`}>{arcs}</g>
      </svg>
      <div className="ring-center">{children}</div>
    </div>
  );
}
