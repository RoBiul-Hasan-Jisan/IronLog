"use client";

import { useState, type FormEvent } from "react";
import { api, errorMessage } from "@/lib/api";
import { PRODUCT_CATEGORIES, type Plan, type Product } from "@/lib/apiTypes";
import { formatMoney } from "@/lib/money";
import { useFetch } from "@/lib/useFetch";
import { AdminPage } from "./AdminKit";

interface ProductForm {
  name: string;
  description: string;
  category: string;
  price: string;
  stock: string;
  imageUrl: string;
  active: boolean;
}
const EMPTY: ProductForm = { name: "", description: "", category: "supplements", price: "", stock: "0", imageUrl: "", active: true };

export function AdminProducts() {
  const { data, error, reload } = useFetch<Product[]>("/admin/products");
  const [editing, setEditing] = useState<string | "new" | null>(null);
  const [form, setForm] = useState<ProductForm>(EMPTY);
  const [err, setErr] = useState("");

  const open = (p?: Product) => {
    setErr("");
    setEditing(p ? p._id : "new");
    setForm(
      p
        ? { name: p.name, description: p.description, category: p.category, price: (p.priceCents / 100).toFixed(2), stock: String(p.stock), imageUrl: p.imageUrl, active: p.active }
        : EMPTY,
    );
  };

  const save = async (e: FormEvent) => {
    e.preventDefault();
    setErr("");
    const body = {
      name: form.name,
      description: form.description,
      category: form.category,
      priceCents: Math.round(Number(form.price) * 100),
      stock: Math.floor(Number(form.stock)),
      imageUrl: form.imageUrl,
      active: form.active,
    };
    try {
      if (editing === "new") await api("/admin/products", { method: "POST", body });
      else await api(`/admin/products/${editing}`, { method: "PUT", body });
      setEditing(null);
      await reload();
    } catch (x) {
      setErr(errorMessage(x));
    }
  };

  const remove = async (p: Product) => {
    if (!window.confirm(`Delete ${p.name}? Past orders keep their record.`)) return;
    try {
      await api(`/admin/products/${p._id}`, { method: "DELETE" });
      await reload();
    } catch (x) {
      setErr(errorMessage(x));
    }
  };

  const set = <K extends keyof ProductForm>(k: K, v: ProductForm[K]) => setForm((f) => ({ ...f, [k]: v }));

  return (
    <AdminPage
      title="Products"
      actions={
        <button type="button" className="btn btn--primary" onClick={() => open()}>
          Add product
        </button>
      }
    >
      {(error || err) && <p className="form-error" role="alert">{error || err}</p>}

      {editing && (
        <form className="form panel-box" onSubmit={save}>
          <h2 className="h2">{editing === "new" ? "New product" : "Edit product"}</h2>
          <label className="form-field">Name<input className="input" value={form.name} onChange={(e) => set("name", e.target.value)} required maxLength={120} /></label>
          <label className="form-field">Description<textarea className="input" rows={3} value={form.description} onChange={(e) => set("description", e.target.value)} maxLength={2000} /></label>
          <div className="form-row">
            <label className="form-field">
              Category
              <select className="select" value={form.category} onChange={(e) => set("category", e.target.value)}>
                {PRODUCT_CATEGORIES.map((c) => (
                  <option key={c}>{c}</option>
                ))}
              </select>
            </label>
            <label className="form-field">Price (USD)<input className="input" type="number" min="0" step="0.01" value={form.price} onChange={(e) => set("price", e.target.value)} required /></label>
            <label className="form-field">Stock<input className="input" type="number" min="0" step="1" value={form.stock} onChange={(e) => set("stock", e.target.value)} required /></label>
          </div>
          <label className="form-field">Image URL (optional)<input className="input" type="url" value={form.imageUrl} onChange={(e) => set("imageUrl", e.target.value)} /></label>
          <label className="check"><input type="checkbox" checked={form.active} onChange={(e) => set("active", e.target.checked)} /> Visible in the shop</label>
          <div className="form-actions">
            <button type="submit" className="btn btn--primary">Save</button>
            <button type="button" className="btn btn--secondary" onClick={() => setEditing(null)}>Cancel</button>
          </div>
        </form>
      )}

      <div className="table-wrap">
        <table className="table">
          <thead>
            <tr><th>Product</th><th>Category</th><th>Price</th><th>Stock</th><th>Status</th><th /></tr>
          </thead>
          <tbody>
            {data?.map((p) => (
              <tr key={p._id}>
                <td><strong>{p.name}</strong></td>
                <td className="capitalize">{p.category}</td>
                <td>{formatMoney(p.priceCents)}</td>
                <td>{p.stock}</td>
                <td><span className={`badge ${p.active ? "badge--completed" : "badge--cancelled"}`}>{p.active ? "live" : "hidden"}</span></td>
                <td className="row-end">
                  <button type="button" className="btn btn--secondary btn--sm" onClick={() => open(p)}>Edit</button>{" "}
                  <button type="button" className="btn btn--danger btn--sm" onClick={() => void remove(p)}>Delete</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </AdminPage>
  );
}

interface PlanForm {
  name: string;
  description: string;
  price: string;
  durationDays: string;
  features: string;
  active: boolean;
}
const EMPTY_PLAN: PlanForm = { name: "", description: "", price: "", durationDays: "30", features: "", active: true };

export function AdminPlans() {
  const { data, error, reload } = useFetch<Plan[]>("/admin/plans");
  const [editing, setEditing] = useState<string | "new" | null>(null);
  const [form, setForm] = useState<PlanForm>(EMPTY_PLAN);
  const [err, setErr] = useState("");

  const open = (p?: Plan) => {
    setErr("");
    setEditing(p ? p._id : "new");
    setForm(p ? { name: p.name, description: p.description, price: (p.priceCents / 100).toFixed(2), durationDays: String(p.durationDays), features: p.features.join("\n"), active: p.active } : EMPTY_PLAN);
  };
  const set = <K extends keyof PlanForm>(k: K, v: PlanForm[K]) => setForm((f) => ({ ...f, [k]: v }));

  const save = async (e: FormEvent) => {
    e.preventDefault();
    setErr("");
    const body = {
      name: form.name,
      description: form.description,
      priceCents: Math.round(Number(form.price) * 100),
      durationDays: Math.floor(Number(form.durationDays)),
      features: form.features.split("\n").map((s) => s.trim()).filter(Boolean),
      active: form.active,
    };
    try {
      if (editing === "new") await api("/admin/plans", { method: "POST", body });
      else await api(`/admin/plans/${editing}`, { method: "PUT", body });
      setEditing(null);
      await reload();
    } catch (x) {
      setErr(errorMessage(x));
    }
  };
  const remove = async (p: Plan) => {
    if (!window.confirm(`Delete the ${p.name} plan? Existing members keep their time.`)) return;
    try {
      await api(`/admin/plans/${p._id}`, { method: "DELETE" });
      await reload();
    } catch (x) {
      setErr(errorMessage(x));
    }
  };

  return (
    <AdminPage title="Plans" actions={<button type="button" className="btn btn--primary" onClick={() => open()}>Add plan</button>}>
      {(error || err) && <p className="form-error" role="alert">{error || err}</p>}
      {editing && (
        <form className="form panel-box" onSubmit={save}>
          <h2 className="h2">{editing === "new" ? "New plan" : "Edit plan"}</h2>
          <label className="form-field">Name<input className="input" value={form.name} onChange={(e) => set("name", e.target.value)} required maxLength={80} /></label>
          <label className="form-field">Short description<input className="input" value={form.description} onChange={(e) => set("description", e.target.value)} maxLength={500} /></label>
          <div className="form-row">
            <label className="form-field">Price (USD)<input className="input" type="number" min="0" step="0.01" value={form.price} onChange={(e) => set("price", e.target.value)} required /></label>
            <label className="form-field">Duration (days)<input className="input" type="number" min="1" step="1" value={form.durationDays} onChange={(e) => set("durationDays", e.target.value)} required /></label>
          </div>
          <label className="form-field">Features (one per line)<textarea className="input" rows={4} value={form.features} onChange={(e) => set("features", e.target.value)} /></label>
          <label className="check"><input type="checkbox" checked={form.active} onChange={(e) => set("active", e.target.checked)} /> Available to buy</label>
          <div className="form-actions">
            <button type="submit" className="btn btn--primary">Save</button>
            <button type="button" className="btn btn--secondary" onClick={() => setEditing(null)}>Cancel</button>
          </div>
        </form>
      )}
      <div className="table-wrap">
        <table className="table">
          <thead><tr><th>Plan</th><th>Price</th><th>Duration</th><th>Status</th><th /></tr></thead>
          <tbody>
            {data?.map((p) => (
              <tr key={p._id}>
                <td><strong>{p.name}</strong><br /><span className="muted">{p.description}</span></td>
                <td>{formatMoney(p.priceCents)}</td>
                <td>{p.durationDays} days</td>
                <td><span className={`badge ${p.active ? "badge--completed" : "badge--cancelled"}`}>{p.active ? "on sale" : "hidden"}</span></td>
                <td className="row-end">
                  <button type="button" className="btn btn--secondary btn--sm" onClick={() => open(p)}>Edit</button>{" "}
                  <button type="button" className="btn btn--danger btn--sm" onClick={() => void remove(p)}>Delete</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </AdminPage>
  );
}
