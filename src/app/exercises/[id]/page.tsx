import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getExercise, relatedExercises } from "@/lib/data";
import { formatDuration, titleCase } from "@/lib/format";
import { defaultPrescription, describePrescription, estimateItemSeconds, isTimed } from "@/lib/prescription";
import type { WorkoutItem } from "@/lib/types";
import { AddToWorkoutButton } from "@/components/AddToWorkoutButton";
import { ExerciseCard } from "@/components/ExerciseCard";
import { ExerciseMedia } from "@/components/ExerciseMedia";
import { SetTimer } from "@/components/SetTimer";

type Props = { params: Promise<{ id: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const ex = getExercise(id);
  return { title: ex ? titleCase(ex.name) : "Exercise not found" };
}

function Fact({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl bg-zinc-900 px-4 py-3">
      <dt className="text-[11px] font-semibold uppercase tracking-wider text-zinc-500">{label}</dt>
      <dd className="mt-0.5 font-bold capitalize">{value}</dd>
    </div>
  );
}

export default async function ExercisePage({ params }: Props) {
  const { id } = await params;
  const ex = getExercise(id);
  if (!ex) return notFound();

  const name = titleCase(ex.name);
  const item: WorkoutItem = { exerciseId: ex.id, ...defaultPrescription(ex) };
  const total = estimateItemSeconds(item);
  const related = relatedExercises(ex, 6);

  return (
    <article className="flex flex-col gap-8">
      <nav aria-label="Breadcrumb" className="text-sm text-zinc-400">
        <Link href="/exercises" className="hover:text-lime-300">
          Exercises
        </Link>
        <span className="mx-2">/</span>
        <Link
          href={`/exercises?bodyPart=${encodeURIComponent(ex.bodyPart)}`}
          className="capitalize hover:text-lime-300"
        >
          {ex.bodyPart}
        </Link>
      </nav>

      <div className="grid gap-8 md:grid-cols-[minmax(0,360px)_1fr]">
        <ExerciseMedia
          path={ex.gif}
          alt={`${name} demonstration`}
          eager
          className="aspect-square w-full max-w-sm rounded-3xl"
        />

        <div className="flex flex-col gap-5">
          <div>
            <h1 className="text-3xl font-black leading-tight sm:text-4xl">{name}</h1>
            {isTimed(ex) && (
              <span className="mt-2 inline-block rounded-full bg-sky-950 px-3 py-1 text-xs font-semibold text-sky-300">
                Done for time
              </span>
            )}
          </div>

          <dl className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            <Fact label="Target" value={ex.target} />
            <Fact label="Body part" value={ex.bodyPart} />
            <Fact label="Equipment" value={ex.equipment} />
          </dl>

          {ex.secondary.length > 0 && (
            <div>
              <h2 className="mb-2 text-xs font-semibold uppercase tracking-wider text-zinc-500">
                Also works
              </h2>
              <ul className="flex flex-wrap gap-2">
                {ex.secondary.map((m) => (
                  <li key={m} className="rounded-full bg-zinc-800 px-3 py-1 text-sm capitalize">
                    {m}
                  </li>
                ))}
              </ul>
            </div>
          )}

          <section aria-label="Suggested time" className="rounded-2xl border border-lime-400/30 bg-lime-400/5 p-4">
            <h2 className="text-xs font-semibold uppercase tracking-wider text-lime-300">Suggested</h2>
            <p className="mt-1 text-2xl font-black">{describePrescription(item)}</p>
            <p className="mt-1 text-sm text-zinc-400">
              Rest {item.restSec} sec between sets · about {formatDuration(total)} in total
            </p>
          </section>

          <div>
            <AddToWorkoutButton exercise={ex} size="full" />
          </div>
        </div>
      </div>

      <section aria-labelledby="steps">
        <h2 id="steps" className="mb-4 text-2xl font-black">
          How to do it
        </h2>
        <ol className="flex flex-col gap-3">
          {ex.steps.map((step, i) => (
            <li key={i} className="flex gap-4 rounded-2xl border border-zinc-800 bg-zinc-900 p-4">
              <span
                aria-hidden
                className="flex size-8 shrink-0 items-center justify-center rounded-full bg-lime-400 text-sm font-black text-zinc-950"
              >
                {i + 1}
              </span>
              <p className="pt-0.5 leading-7">
                <span className="sr-only">Step {i + 1}: </span>
                {step}
              </p>
            </li>
          ))}
        </ol>
      </section>

      <SetTimer suggestedRestSec={item.restSec} />

      {related.length > 0 && (
        <section aria-labelledby="related">
          <h2 id="related" className="mb-4 text-2xl font-black">
            Similar exercises
          </h2>
          <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
            {related.map((r) => (
              <ExerciseCard key={r.id} exercise={r} />
            ))}
          </ul>
        </section>
      )}
    </article>
  );
}
