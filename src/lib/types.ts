/** Lightweight record used for lists, search and the workout generator. */
export interface ExerciseSummary {
  id: string;
  name: string;
  bodyPart: string;
  equipment: string;
  target: string;
  /** Relative path inside the library, e.g. "images/0001-2gPfomN.jpg" */
  image: string;
}

/** Full record: adds steps, secondary muscles and the animation GIF. */
export interface Exercise extends ExerciseSummary {
  secondary: string[];
  steps: string[];
  /** Relative path inside the library, e.g. "videos/0001-2gPfomN.gif" */
  gif: string;
}

export type WorkoutMode = "reps" | "time";

/** One exercise inside a workout, with its prescription. */
export interface WorkoutItem {
  exerciseId: string;
  mode: WorkoutMode;
  sets: number;
  /** Used when mode === "reps" */
  reps: number;
  /** Seconds per set, used when mode === "time" */
  holdSec: number;
  /** Rest after each set, in seconds */
  restSec: number;
}
