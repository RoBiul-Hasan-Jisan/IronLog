"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import type { Product } from "@/lib/apiTypes";

export interface CartLine {
  productId: string;
  name: string;
  priceCents: number;
  imageUrl: string;
  qty: number;
  /** Stock when it was added; the server re-checks at checkout. */
  max: number;
}

interface CartValue {
  lines: CartLine[];
  count: number;
  totalCents: number;
  add: (product: Product) => void;
  setQty: (productId: string, qty: number) => void;
  remove: (productId: string) => void;
  clear: () => void;
}

const KEY = "gym.cart.v1";
const CartContext = createContext<CartValue | null>(null);

function load(): CartLine[] {
  try {
    const raw = JSON.parse(window.localStorage.getItem(KEY) ?? "[]");
    if (!Array.isArray(raw)) return [];
    return raw
      .filter((l) => l && typeof l.productId === "string" && Number.isInteger(l.qty) && l.qty > 0)
      .map((l) => ({
        productId: l.productId,
        name: String(l.name ?? ""),
        priceCents: Number(l.priceCents) || 0,
        imageUrl: String(l.imageUrl ?? ""),
        qty: Math.min(20, l.qty),
        max: Math.max(1, Number(l.max) || 20),
      }));
  } catch {
    return [];
  }
}

export function CartProvider({ children }: { children: ReactNode }) {
  const [lines, setLines] = useState<CartLine[]>([]);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    setLines(load());
    setReady(true);
  }, []);
  useEffect(() => {
    if (!ready) return;
    try {
      window.localStorage.setItem(KEY, JSON.stringify(lines));
    } catch {
      /* ignore */
    }
  }, [lines, ready]);

  const add = useCallback((p: Product) => {
    setLines((cur) => {
      const max = Math.min(20, p.stock);
      const found = cur.find((l) => l.productId === p._id);
      if (found) return cur.map((l) => (l === found ? { ...l, qty: Math.min(max, l.qty + 1), max } : l));
      return [...cur, { productId: p._id, name: p.name, priceCents: p.priceCents, imageUrl: p.imageUrl, qty: 1, max }];
    });
  }, []);
  const setQty = useCallback((id: string, qty: number) => {
    setLines((cur) =>
      cur.flatMap((l) => (l.productId !== id ? [l] : qty <= 0 ? [] : [{ ...l, qty: Math.min(l.max, qty) }])),
    );
  }, []);
  const remove = useCallback((id: string) => setLines((cur) => cur.filter((l) => l.productId !== id)), []);
  const clear = useCallback(() => setLines([]), []);

  const value = useMemo<CartValue>(
    () => ({
      lines,
      count: lines.reduce((n, l) => n + l.qty, 0),
      totalCents: lines.reduce((n, l) => n + l.qty * l.priceCents, 0),
      add,
      setQty,
      remove,
      clear,
    }),
    [lines, add, setQty, remove, clear],
  );
  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart(): CartValue {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used inside <CartProvider>");
  return ctx;
}
