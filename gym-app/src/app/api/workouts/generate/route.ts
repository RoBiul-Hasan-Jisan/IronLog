import { NextResponse } from "next/server";
import { exerciseIndex } from "@/lib/data";
import { PRESETS, generateWorkout } from "@/lib/workouts";

/** GET /api/workouts/generate?preset=push&seed=123  ->  WorkoutItem[] */
export function GET(request: Request) {
  const params = new URL(request.url).searchParams;
  const preset = PRESETS.find((p) => p.id === params.get("preset"));
  if (!preset) {
    return NextResponse.json(
      { error: `Unknown preset. Use one of: ${PRESETS.map((p) => p.id).join(", ")}` },
      { status: 400 },
    );
  }
  const seedParam = Number(params.get("seed"));
  const seed = Number.isFinite(seedParam) && params.get("seed") !== null ? seedParam : Date.now();
  return NextResponse.json(generateWorkout(exerciseIndex, preset, seed));
}
