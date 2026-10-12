import { NextResponse } from "next/server";
import { getExercises } from "@/lib/data";

/** GET /api/exercises?ids=0001,0025  ->  full exercise records, in the same order. */
export function GET(request: Request) {
  const raw = new URL(request.url).searchParams.get("ids") ?? "";
  const ids = raw
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean)
    .slice(0, 100);

  if (ids.length === 0) {
    return NextResponse.json({ error: "Provide ?ids=comma,separated,ids" }, { status: 400 });
  }
  return NextResponse.json(getExercises(ids));
}
