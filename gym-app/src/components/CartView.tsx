"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { api, errorMessage } from "@/lib/api";
import type { Order } from "@/lib/apiTypes";
import { formatMoney } from "@/lib/money";
import { useAuth } from "./AuthProvider";
import { useCart } from "./CartProvider";
import { Icon } from "./icons";

export function CartView() {
  const { lines, totalCents, setQty, remove, clear } = useCart();
  const { status, profile } = useAuth();
  const router = useRouter();
  const [shipping, setShipping] = useState({ name: "", phone: "", address: "", city: "" });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  if (lines.length === 0) {
    return (
      <div className="empty">
        <h1 className="h2">Your cart is empty</h1>
        <p>Add supplements, gear or apparel from the shop.</p>
        <Link href="/shop" className="btn btn--primary btn--lg">
          Go to the shop
        </Link>
      </div>
    );
  }

  const place = async (e: FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      await api<Order>("/orders", {
        method: "POST",
        body: { items: lines.map((l) => ({ productId: l.productId, qty: l.qty })), shipping },
      });
      clear();
      router.push("/account?ordered=1");
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  const field = (key: keyof typeof shipping, label: string, autoComplete: string) => (
    <label className="form-field">
      {label}
      <input className="input" value={shipping[key]} onChange={(e) => setShipping({ ...shipping, [key]: e.target.value })} required autoComplete={autoComplete} />
    </label>
  );

  return (
    <div>
      <div className="page-head">
        <h1 className="page-title">Cart</h1>
      </div>
      <div className="checkout">
        <ul className="cart-lines">
          {lines.map((l) => (
            <li key={l.productId} className="cart-line">
              <div>
                <p className="cart-name">{l.name}</p>
                <p className="cart-unit">{formatMoney(l.priceCents)} each</p>
              </div>
              <div className="stepper" role="group" aria-label={`Quantity of ${l.name}`}>
                <button type="button" className="stepper-btn" aria-label="Decrease quantity" onClick={() => setQty(l.productId, l.qty - 1)}>
                  <Icon name="minus" size={16} />
                </button>
                <span className="stepper-value display">{l.qty}</span>
                <button type="button" className="stepper-btn" aria-label="Increase quantity" disabled={l.qty >= l.max} onClick={() => setQty(l.productId, l.qty + 1)}>
                  <Icon name="plus" size={16} />
                </button>
              </div>
              <span className="cart-total display">{formatMoney(l.priceCents * l.qty)}</span>
              <button type="button" className="btn btn--quiet btn--icon" aria-label={`Remove ${l.name}`} onClick={() => remove(l.productId)}>
                <Icon name="trash" size={18} />
              </button>
            </li>
          ))}
        </ul>

        <form className="form panel-box" onSubmit={place}>
          <h2 className="h2">Delivery</h2>
          {status !== "authenticated" || !profile ? (
            <>
              <p>Sign in to place your order. Your cart will be kept.</p>
              <Link href="/login?next=/cart" className="btn btn--primary btn--lg btn--block">
                Sign in
              </Link>
            </>
          ) : (
            <>
              {field("name", "Full name", "name")}
              {field("phone", "Phone", "tel")}
              {field("address", "Address", "street-address")}
              {field("city", "City", "address-level2")}
              <div className="order-sum">
                <span>Total</span>
                <strong className="display">{formatMoney(totalCents)}</strong>
              </div>
              {error && <p className="form-error" role="alert">{error}</p>}
              <button type="submit" className="btn btn--primary btn--lg btn--block" disabled={busy}>
                {busy ? "Placing order…" : "Place order"}
              </button>
              <p className="form-hint">Demo checkout: no payment is taken.</p>
            </>
          )}
        </form>
      </div>
    </div>
  );
}
