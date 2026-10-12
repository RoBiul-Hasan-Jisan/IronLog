import Link from "next/link";

export default function ExerciseNotFound() {
  return (
    <div className="py-20 text-center">
      <h1 className="text-3xl font-black">Exercise not found</h1>
      <p className="mt-2 text-zinc-400">That exercise doesn&apos;t exist in the library.</p>
      <Link
        href="/exercises"
        className="mt-6 inline-block rounded-xl bg-lime-400 px-6 py-3 font-bold text-zinc-950 hover:bg-lime-300"
      >
        Browse exercises
      </Link>
    </div>
  );
}
