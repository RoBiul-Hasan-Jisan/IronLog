import Link from "next/link";

export default function ExerciseNotFound() {
  return (
    <div className="message">
      <h1>Exercise not found</h1>
      <p>That exercise isn&apos;t in the library. It may have been removed or the link may be wrong.</p>
      <Link href="/exercises" className="btn btn--primary btn--lg">
        Browse exercises
      </Link>
    </div>
  );
}
