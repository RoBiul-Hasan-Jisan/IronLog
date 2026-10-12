import Link from "next/link";
import { exerciseIndex } from "@/lib/data";
import { buildFacets } from "@/lib/search";
import { titleCase } from "@/lib/format";
import { ExerciseMedia } from "@/components/ExerciseMedia";
import { PresetPicker } from "@/components/PresetPicker";

export default function HomePage() {
  const bodyParts = buildFacets(exerciseIndex).bodyParts;
  // One representative picture per body part.
  const cover = new Map<string, (typeof exerciseIndex)[number]>();
  for (const ex of exerciseIndex) if (!cover.has(ex.bodyPart)) cover.set(ex.bodyPart, ex);

  return (
    <div className="flex flex-col gap-12">
      <section className="rounded-3xl border border-zinc-800 bg-gradient-to-br from-zinc-900 to-zinc-950 p-6 sm:p-10">
        <p className="text-sm font-semibold uppercase tracking-widest text-lime-400">Train smarter</p>
        <h1 className="mt-2 max-w-2xl text-4xl font-black leading-tight tracking-tight sm:text-5xl">
          Every exercise. Every step. Every second timed.
        </h1>
        <p className="mt-4 max-w-xl text-zinc-400">
          Browse {exerciseIndex.length.toLocaleString()} exercises with animations and step-by-step
          instructions, build a workout, then follow it with automatic set and rest timers.
        </p>
        <div className="mt-6 flex flex-wrap gap-3">
          <Link
            href="/workout"
            className="rounded-xl bg-lime-400 px-6 py-3 font-bold text-zinc-950 hover:bg-lime-300"
          >
            Build a workout
          </Link>
          <Link
            href="/exercises"
            className="rounded-xl border border-zinc-700 px-6 py-3 font-bold hover:bg-zinc-900"
          >
            Browse exercises
          </Link>
        </div>
      </section>

      <section aria-labelledby="quick-start">
        <h2 id="quick-start" className="mb-1 text-2xl font-black">
          Quick start
        </h2>
        <p className="mb-4 text-sm text-zinc-400">
          Pick one and we&apos;ll put together a fresh workout you can tweak before you start.
        </p>
        <PresetPicker goToBuilder />
      </section>

      <section aria-labelledby="by-body-part">
        <h2 id="by-body-part" className="mb-4 text-2xl font-black">
          Train by body part
        </h2>
        <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
          {bodyParts.map((bp) => {
            const ex = cover.get(bp.name);
            return (
              <li key={bp.name}>
                <Link
                  href={`/exercises?bodyPart=${encodeURIComponent(bp.name)}`}
                  className="group flex items-center gap-3 rounded-2xl border border-zinc-800 bg-zinc-900 p-2 pr-3 transition-colors hover:border-lime-400/60"
                >
                  {ex ? (
                    <ExerciseMedia path={ex.image} alt="" className="size-14 shrink-0 rounded-xl" />
                  ) : null}
                  <span className="min-w-0">
                    <span className="block truncate font-bold group-hover:text-lime-300">
                      {titleCase(bp.name)}
                    </span>
                    <span className="text-xs text-zinc-400">{bp.count} exercises</span>
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>
      </section>
    </div>
  );
}
