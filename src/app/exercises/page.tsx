import type { Metadata } from "next";
import { exerciseIndex } from "@/lib/data";
import { EMPTY_FILTERS, buildFacets, type Filters } from "@/lib/search";
import { ExerciseBrowser } from "@/components/ExerciseBrowser";

export const metadata: Metadata = { title: "Exercises" };

type SearchParams = Record<string, string | string[] | undefined>;

function first(value: string | string[] | undefined): string {
  return (Array.isArray(value) ? value[0] : value) ?? "";
}

export default async function ExercisesPage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const params = await searchParams;
  const facets = buildFacets(exerciseIndex);

  // Only accept filter values that really exist, so a bad link can't produce an empty page.
  const valid = (value: string, options: { name: string }[]) =>
    options.some((o) => o.name === value) ? value : "";

  const initial: Filters = {
    ...EMPTY_FILTERS,
    q: first(params.q),
    bodyPart: valid(first(params.bodyPart), facets.bodyParts),
    equipment: valid(first(params.equipment), facets.equipment),
    target: valid(first(params.target), facets.targets),
  };

  return (
    <div className="flex flex-col gap-5">
      <h1 className="text-3xl font-black">Exercises</h1>
      <ExerciseBrowser key={JSON.stringify(initial)} index={exerciseIndex} initialFilters={initial} />
    </div>
  );
}
