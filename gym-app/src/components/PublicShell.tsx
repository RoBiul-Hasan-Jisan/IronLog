"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import { GYM } from "@/lib/gym";
import { useAuth } from "./AuthProvider";
import { useCart } from "./CartProvider";
import { Plate } from "./Plate";

const LINKS = [
  { href: "/classes", label: "Classes" },
  { href: "/trainers", label: "Trainers" },
  { href: "/membership", label: "Pricing" },
  { href: "/shop", label: "Shop" },
  { href: "/contact", label: "Contact" },
];

/** Public marketing pages: top header, full-width content, footer with the gym's details. */
export function PublicShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const { status, profile } = useAuth();
  const cart = useCart();
  const signedIn = status === "authenticated" && profile;

  const actions = (
    <>
      {cart.count > 0 && (
        <Link href="/cart" className="btn btn--quiet btn--sm">
          Cart ({cart.count})
        </Link>
      )}
      {signedIn ? (
        <Link href="/train" className="btn btn--primary btn--sm">
          Member area
        </Link>
      ) : (
        <>
          <Link href="/login" className="btn btn--quiet btn--sm">
            Sign in
          </Link>
          <Link href="/register" className="btn btn--primary btn--sm">
            Join now
          </Link>
        </>
      )}
    </>
  );

  return (
    <div className="pub">
      <header className="pub-header">
        <div className="pub-bar">
          <Link href="/" className="brand" aria-label={`${GYM.name} home`}>
            <Plate color="#17202B" size={28} hole="var(--paper)" />
            {GYM.name}
          </Link>
          <nav className="pub-nav" aria-label="Main">
            {LINKS.map((l) => (
              <Link key={l.href} href={l.href} aria-current={pathname === l.href ? "page" : undefined}>
                {l.label}
              </Link>
            ))}
          </nav>
          <div className="pub-actions">{actions}</div>
        </div>
        <nav className="pub-nav pub-nav--phone" aria-label="Main (phone)">
          {LINKS.map((l) => (
            <Link key={l.href} href={l.href} aria-current={pathname === l.href ? "page" : undefined}>
              {l.label}
            </Link>
          ))}
        </nav>
      </header>

      <main className="pub-main">{children}</main>

      <footer className="pub-footer">
        <div className="pub-footer-grid">
          <div>
            <p className="pub-footer-brand">{GYM.name}</p>
            <p>{GYM.tagline}</p>
          </div>
          <div>
            <p className="pub-footer-title">Visit</p>
            <p>{GYM.address}</p>
            <p>{GYM.phone}</p>
            <p>{GYM.email}</p>
          </div>
          <div>
            <p className="pub-footer-title">Opening hours</p>
            {GYM.hours.map((h) => (
              <p key={h.days}>
                {h.days}: {h.time}
              </p>
            ))}
          </div>
          <div>
            <p className="pub-footer-title">Members</p>
            <p>
              <Link href="/login">Sign in</Link>
            </p>
            <p>
              <Link href="/train">Workout library</Link>
            </p>
            <p>
              <Link href="/classes">Book a class</Link>
            </p>
          </div>
        </div>
        <p className="pub-footer-small">
          Exercise animations © Gym visual (https://gymvisual.com/). © {new Date().getFullYear()} {GYM.name}.
        </p>
      </footer>
    </div>
  );
}
