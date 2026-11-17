"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import { RequireAuth } from "./RequireAuth";

const TABS = [
  { href: "/admin", label: "Dashboard" },
  { href: "/admin/desk", label: "Front desk" },
  { href: "/admin/classes", label: "Classes" },
  { href: "/admin/trainers", label: "Trainers" },
  { href: "/admin/users", label: "Users" },
  { href: "/admin/products", label: "Products" },
  { href: "/admin/plans", label: "Plans" },
  { href: "/admin/orders", label: "Orders" },
  { href: "/admin/exercises", label: "Exercises" },
  { href: "/admin/leads", label: "Leads" },
];

export function AdminPage({ title, actions, children }: { title: string; actions?: ReactNode; children: ReactNode }) {
  const pathname = usePathname();
  return (
    <RequireAuth role="admin">
      <nav className="admin-tabs" aria-label="Admin">
        {TABS.map((t) => (
          <Link key={t.href} href={t.href} aria-current={pathname === t.href ? "page" : undefined}>
            {t.label}
          </Link>
        ))}
      </nav>
      <div className="page-head">
        <h1 className="page-title">{title}</h1>
        {actions}
      </div>
      {children}
    </RequireAuth>
  );
}

export function Pager({ page, pages, onPage }: { page: number; pages: number; onPage: (p: number) => void }) {
  if (pages <= 1) return null;
  return (
    <div className="pager">
      <button type="button" className="btn btn--secondary btn--sm" disabled={page <= 1} onClick={() => onPage(page - 1)}>
        Previous
      </button>
      <span>
        Page {page} of {pages}
      </span>
      <button type="button" className="btn btn--secondary btn--sm" disabled={page >= pages} onClick={() => onPage(page + 1)}>
        Next
      </button>
    </div>
  );
}
