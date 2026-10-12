"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useWorkout } from "./WorkoutProvider";

const LINKS = [
  { href: "/", label: "Home" },
  { href: "/exercises", label: "Exercises" },
  { href: "/workout", label: "My workout" },
] as const;

function isActive(pathname: string, href: string): boolean {
  return href === "/" ? pathname === "/" : pathname === href || pathname.startsWith(`${href}/`);
}

export function Nav() {
  const pathname = usePathname();
  const { items, ready } = useWorkout();
  const count = ready ? items.length : 0;

  const badge =
    count > 0 ? (
      <span className="ml-1.5 inline-flex min-w-5 items-center justify-center rounded-full bg-lime-400 px-1.5 text-[11px] font-bold text-zinc-950">
        {count}
      </span>
    ) : null;

  return (
    <>
      <header className="sticky top-0 z-30 border-b border-zinc-800 bg-zinc-950/90 backdrop-blur">
        <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4">
          <Link href="/" className="text-lg font-black uppercase tracking-tight">
            Iron<span className="text-lime-400">Log</span>
          </Link>
          <nav aria-label="Main" className="hidden gap-1 md:flex">
            {LINKS.map((l) => (
              <Link
                key={l.href}
                href={l.href}
                aria-current={isActive(pathname, l.href) ? "page" : undefined}
                className={`rounded-lg px-3 py-2 text-sm font-semibold transition-colors ${
                  isActive(pathname, l.href) ? "bg-zinc-800 text-lime-300" : "text-zinc-300 hover:bg-zinc-900"
                }`}
              >
                {l.label}
                {l.href === "/workout" ? badge : null}
              </Link>
            ))}
          </nav>
        </div>
      </header>

      {/* Phone-style bottom tab bar */}
      <nav
        aria-label="Main"
        className="fixed inset-x-0 bottom-0 z-30 grid grid-cols-3 border-t border-zinc-800 bg-zinc-950/95 backdrop-blur md:hidden"
      >
        {LINKS.map((l) => (
          <Link
            key={l.href}
            href={l.href}
            aria-current={isActive(pathname, l.href) ? "page" : undefined}
            className={`flex h-14 items-center justify-center text-sm font-semibold ${
              isActive(pathname, l.href) ? "text-lime-300" : "text-zinc-400"
            }`}
          >
            {l.label}
            {l.href === "/workout" ? badge : null}
          </Link>
        ))}
      </nav>
    </>
  );
}
