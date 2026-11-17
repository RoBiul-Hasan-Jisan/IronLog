"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, type ReactNode } from "react";
import { useAuth } from "./AuthProvider";
import { SetupNotice } from "./SetupNotice";

/** Gate for pages that need a signed-in user, optionally an admin. */
export function RequireAuth({ role, children }: { role?: "admin"; children: ReactNode }) {
  const { status, isAdmin, profile } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (status === "anonymous") {
      router.replace(`/login?next=${encodeURIComponent(window.location.pathname)}`);
    }
  }, [status, router]);

  if (status === "unconfigured") return <SetupNotice />;
  if (status === "loading" || status === "anonymous" || (status === "authenticated" && !profile)) {
    return <p className="message">Loading…</p>;
  }
  if (role === "admin" && !isAdmin) {
    return (
      <div className="message">
        <h1>Admins only</h1>
        <p>Your account does not have access to this area.</p>
        <Link href="/train" className="btn btn--primary">
          Back to home
        </Link>
      </div>
    );
  }
  return <>{children}</>;
}
