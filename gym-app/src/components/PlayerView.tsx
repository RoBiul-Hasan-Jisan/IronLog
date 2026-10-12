import Link from "next/link";
import type { Exercise, WorkoutItem } from "@/lib/types";
import { progress, segmentFill, totalSets, type PlayerState } from "@/lib/player";
import { describePrescription } from "@/lib/prescription";
import { formatClock, titleCase } from "@/lib/format";
import { plateColorOnDark } from "@/lib/plates";
import { ExerciseMedia } from "./ExerciseMedia";
import { Icon } from "./icons";
import { Plate } from "./Plate";
import { PlateRing } from "./PlateRing";

export interface PlayerViewProps {
  items: WorkoutItem[];
  details: Record<string, Exercise>;
  state: PlayerState;
  elapsed: number;
  paused: boolean;
  confirmEnd: boolean;
  onDone: () => void;
  onBack: () => void;
  onSkip: () => void;
  onAddRest: () => void;
  onSkipRest: () => void;
  onTogglePause: () => void;
  onAskEnd: () => void;
  onConfirmEnd: () => void;
  onCancelEnd: () => void;
  onRestart: () => void;
}

const DONE_GREEN = "#6fd08c";

/** Everything the player shows, as a pure function of its state (the logic lives in WorkoutPlayer). */
export function PlayerView(p: PlayerViewProps) {
  const { items, details, state } = p;
  const sets = totalSets(items);

  // ---------- finished ----------
  if (state.phase === "done") {
    return (
      <div className="night">
        <div className="player">
          <div className="done">
            <PlateRing mode={{ kind: "countdown", fraction: 1 }} color={DONE_GREEN} label="Workout complete">
              <span className="ring-value" style={{ color: DONE_GREEN, display: "flex" }}>
                <Icon name="check" size={96} />
              </span>
            </PlateRing>
            <h1>Workout complete</h1>
            <dl className="done-stats">
              <div>
                <dt>Time</dt>
                <dd className="display">{formatClock(p.elapsed)}</dd>
              </div>
              <div>
                <dt>Sets done</dt>
                <dd className="display">
                  {state.completedSets}/{sets}
                </dd>
              </div>
              <div>
                <dt>Exercises</dt>
                <dd className="display">{items.length}</dd>
              </div>
            </dl>
            <div className="player-actions" style={{ justifyContent: "center" }}>
              <button type="button" className="btn btn--primary btn--lg" onClick={p.onRestart}>
                Do it again
              </button>
              <Link href="/workout" className="btn btn--secondary btn--lg">
                Back to workout
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const item = items[state.itemIndex];
  const ex = item ? details[item.exerciseId] : undefined;
  if (!item || !ex) {
    return (
      <div className="night">
        <div className="message">
          <h1>Something went wrong</h1>
          <p>Go back to your workout and start again.</p>
          <Link href="/workout" className="btn btn--primary">
            Back to workout
          </Link>
        </div>
      </div>
    );
  }

  const name = titleCase(ex.name);
  const resting = state.phase === "rest";
  const timed = item.mode === "time";
  const color = plateColorOnDark(ex.bodyPart);
  const overall = Math.round(progress(items, state) * 100);

  // While resting, `state` already points at the upcoming set; the rest length belongs to the set just finished.
  const finishedItem = state.setIndex > 0 ? item : items[state.itemIndex - 1];
  const restTotal = Math.max(finishedItem?.restSec ?? 0, state.remaining, 1);

  return (
    <div className="night">
      <div className="player">
        <header className="player-top">
          <Link href="/workout" className="btn btn--quiet btn--sm">
            <Icon name="x" size={16} />
            Exit
          </Link>
          <div
            className="segs"
            role="progressbar"
            aria-label="Workout progress"
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={overall}
          >
            {items.map((it, i) => (
              <div key={it.exerciseId} className={`seg-bar${i === state.itemIndex ? " seg-bar--now" : ""}`}>
                <div className="seg-fill" style={{ width: `${segmentFill(items, state, i) * 100}%` }} />
              </div>
            ))}
          </div>
          <div className="player-top-tools">
            <span className="clock display" aria-label="Elapsed time">
              {formatClock(p.elapsed)}
            </span>
            <button
              type="button"
              className="btn btn--quiet btn--icon"
              onClick={p.onTogglePause}
              aria-label={p.paused ? "Resume" : "Pause"}
            >
              <Icon name={p.paused ? "play" : "pause"} size={20} />
            </button>
          </div>
        </header>

        {p.paused && (
          <p role="status" className="paused">
            Paused. Timers are stopped.
          </p>
        )}

        {resting ? (
          <section className="rest" aria-label="Rest">
            <div style={{ textAlign: "center" }}>
              <p className="rest-label">Rest</p>
              <PlateRing
                mode={{ kind: "countdown", fraction: state.remaining / restTotal }}
                color="var(--rest)"
                label={`Rest, ${state.remaining} seconds left`}
              >
                <span className="ring-value ring-value--time display">{formatClock(state.remaining)}</span>
                <span className="ring-unit">until next set</span>
              </PlateRing>
            </div>

            <div className="player-actions">
              <button type="button" className="btn btn--secondary btn--lg" onClick={p.onAddRest}>
                <Icon name="plus" size={18} />
                15 sec
              </button>
              <button type="button" className="btn btn--primary btn--lg" onClick={p.onSkipRest}>
                Skip rest
              </button>
            </div>

            <div className="upnext">
              <div className="upnext-media">
                <ExerciseMedia path={ex.gif} alt={`${name} demonstration`} />
              </div>
              <div className="upnext-text">
                <small>Up next</small>
                <b>{name}</b>
                <span>
                  Set {state.setIndex + 1} of {item.sets}, {describePrescription({ ...item, sets: 1 }).replace("1 × ", "")}
                </span>
              </div>
            </div>
          </section>
        ) : (
          <section className="stage" aria-label="Current exercise">
            <div className="stage-media">
              <ExerciseMedia path={ex.gif} alt={`${name} demonstration`} eager />
            </div>

            <div className="stage-info">
              <div>
                <p className="stage-kicker">
                  <Plate color={color} size={18} hole="var(--night)" />
                  {ex.bodyPart}
                </p>
                <h1 className="stage-title">{name}</h1>
                <p className="stage-sub">
                  {ex.target}, {ex.equipment}
                </p>
              </div>

              <div>
                <p className="set-label display">
                  Set {state.setIndex + 1} of {item.sets}
                </p>
                <PlateRing
                  mode={timed ? { kind: "countdown", fraction: state.remaining / Math.max(1, item.holdSec) } : { kind: "sets", done: state.setIndex, total: item.sets }}
                  color={color}
                  label={timed ? `${state.remaining} seconds left` : `${item.reps} reps, set ${state.setIndex + 1} of ${item.sets}`}
                >
                  <span className={`ring-value display${timed ? " ring-value--time" : ""}`}>
                    {timed ? formatClock(state.remaining) : item.reps}
                  </span>
                  <span className="ring-unit">{timed ? "left" : "reps"}</span>
                </PlateRing>
              </div>

              <div className="player-actions">
                <button type="button" className="btn btn--primary btn--lg" onClick={p.onDone}>
                  <Icon name="check" size={20} />
                  {timed ? "Finish set" : "Set done"}
                </button>
                <button type="button" className="btn btn--secondary btn--lg btn--icon" onClick={p.onBack} aria-label="Previous exercise" title="Previous exercise">
                  <Icon name="skipBack" size={20} />
                </button>
                <button type="button" className="btn btn--secondary btn--lg btn--icon" onClick={p.onSkip} aria-label="Skip exercise" title="Skip exercise">
                  <Icon name="skipForward" size={20} />
                </button>
              </div>

              <details open className="steps-panel">
                <summary>How to do it</summary>
                <ol>
                  {ex.steps.map((s, i) => (
                    <li key={i}>{s}</li>
                  ))}
                </ol>
              </details>
            </div>
          </section>
        )}

        <div className="player-actions" style={{ justifyContent: "center", marginTop: 36 }}>
          {p.confirmEnd ? (
            <>
              <span style={{ color: "var(--night-steel)" }}>End this workout now?</span>
              <button type="button" className="btn btn--danger btn--sm" onClick={p.onConfirmEnd}>
                End workout
              </button>
              <button type="button" className="btn btn--quiet btn--sm" onClick={p.onCancelEnd}>
                Keep going
              </button>
            </>
          ) : (
            <button type="button" className="btn btn--quiet btn--sm" onClick={p.onAskEnd}>
              End workout early
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
