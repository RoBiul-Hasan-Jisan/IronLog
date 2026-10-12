"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import { ATTRIBUTION } from "@/lib/format";
import { estimateWorkoutSeconds, totalSetsLabel } from "@/lib/prescription";
import { Icon, type IconName } from "./icons";
import { Plate } from "./Plate";
import { useWorkout } from "./WorkoutProvider";

const LINKS: { href: string; label: string; icon: IconName }[] = [
  { href: "/", label: "Home", icon: "home" },
  { href: "/exercises", label: "Exercises", icon: "grid" },
  { href: "/workout", label: "My workout", icon: "dumbbell" },
];

function isActive(pathname: string, href: string): boolean {
  return href === "/" ? pathname === "/" : pathname === href || pathname.startsWith(`${href}/`);
}

function Brand({ hole }: { hole: string }) {
  return (
    <Link href="/" className="brand" aria-label="IronLog home">
      <Plate color="#17202B" size={28} hole={hole} />
      IronLog
    </Link>
  );
}

/** Sidebar card showing the workout that is currently being built. */
function Queue() {
  const { items, ready } = useWorkout();
  const count = ready ? items.length : 0;

  if (count === 0) {
    return (
      <section className="queue" aria-label="Current workout">
        <p className="queue-title">Current workout</p>
        <p className="queue-meta" style={{ marginTop: 8 }}>
          Nothing added yet.
        </p>
        <div className="queue-actions">
          <Link href="/exercises" className="btn btn--secondary btn--sm">
            Browse exercises
          </Link>
        </div>
      </section>
    );
  }

  const minutes = Math.max(1, Math.round(estimateWorkoutSeconds(items) / 60));
  return (
    <section className="queue" aria-label="Current workout">
      <p className="queue-title">Current workout</p>
      <p className="queue-time display">
        {minutes}
        <small>min</small>
      </p>
      <p className="queue-meta">
        {count} {count === 1 ? "exercise" : "exercises"}, {totalSetsLabel(items)}
      </p>
      <div className="queue-actions">
        <Link href="/workout/play" className="btn btn--primary btn--sm">
          <Icon name="play" size={14} />
          Start
        </Link>
        <Link href="/workout" className="btn btn--secondary btn--sm">
          Edit
        </Link>
      </div>
    </section>
  );
}

/**
 * Desktop: sidebar + content. Phone: top bar + bottom tab bar.
 * The workout player (/workout/play) gets the whole screen with no navigation.
 */
export function AppShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const { items, ready } = useWorkout();
  const count = ready ? items.length : 0;

  if (pathname.startsWith("/workout/play")) return <>{children}</>;

  return (
    <div className="shell">
      <aside className="sidebar">
        <Brand hole="var(--paper)" />
        <nav className="nav" aria-label="Main">
          {LINKS.map((l) => (
            <Link key={l.href} href={l.href} className="nav-link" aria-current={isActive(pathname, l.href) ? "page" : undefined}>
              <Icon name={l.icon} />
              {l.label}
              {l.href === "/workout" && count > 0 ? <span className="nav-badge">{count}</span> : null}
            </Link>
          ))}
        </nav>
        <Queue />
      </aside>

      <div className="content">
        <header className="topbar">
          <Brand hole="var(--floor)" />
        </header>
        <main className="main">{children}</main>
        <footer className="footer">
          <p>
            Exercise animations and images {ATTRIBUTION}. Exercise data from{" "}
            <a href="https://github.com/plataformafitness/exercises-library" target="_blank" rel="noreferrer">
              plataformafitness/exercises-library
            </a>
            .
          </p>
        </footer>
      </div>

      <nav className="tabbar" aria-label="Main">
        {LINKS.map((l) => (
          <Link key={l.href} href={l.href} className="tab" aria-current={isActive(pathname, l.href) ? "page" : undefined}>
            <Icon name={l.icon} size={22} />
            {l.label}
            {l.href === "/workout" && count > 0 ? <span className="nav-badge">{count}</span> : null}
          </Link>
        ))}
      </nav>
    </div>
  );
}
