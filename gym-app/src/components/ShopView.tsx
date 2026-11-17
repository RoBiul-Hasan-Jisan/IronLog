"use client";

import Link from "next/link";
import { useState } from "react";
import { PRODUCT_CATEGORIES, type Product, type ProductCategory } from "@/lib/apiTypes";
import { formatMoney } from "@/lib/money";
import { useFetch } from "@/lib/useFetch";
import { useCart } from "./CartProvider";
import { Icon } from "./icons";

export function ProductImage({ product }: { product: Pick<Product, "imageUrl" | "name"> }) {
  const [failed, setFailed] = useState(false);
  if (!product.imageUrl || failed) return <div className="product-img product-img--empty">{product.name.slice(0, 1)}</div>;
  // eslint-disable-next-line @next/next/no-img-element
  return <img className="product-img" src={product.imageUrl} alt="" onError={() => setFailed(true)} />;
}

export function ShopView() {
  const [category, setCategory] = useState<ProductCategory | "">("");
  const [q, setQ] = useState("");
  const params = new URLSearchParams();
  if (category) params.set("category", category);
  if (q.trim()) params.set("q", q.trim());
  const { data, error, loading } = useFetch<Product[]>(`/products?${params}`);
  const { add, lines, count: cartCount } = useCart();

  return (
    <div>
      <div className="page-head">
        <h1 className="page-title">Shop</h1>
        <Link href="/cart" className="btn btn--secondary">
          Cart{cartCount > 0 ? ` (${cartCount})` : ""}
        </Link>
      </div>
      <div className="toolbar">
        <input className="input" type="search" placeholder="Search products" aria-label="Search products" value={q} onChange={(e) => setQ(e.target.value)} />
        <div className="chips">
          <button type="button" className={`chip${category === "" ? " chip--on" : ""}`} aria-pressed={category === ""} onClick={() => setCategory("")}>
            All
          </button>
          {PRODUCT_CATEGORIES.map((c) => (
            <button key={c} type="button" className={`chip${category === c ? " chip--on" : ""}`} aria-pressed={category === c} onClick={() => setCategory(c)}>
              <span className="capitalize">{c}</span>
            </button>
          ))}
        </div>
      </div>

      {error && <p className="form-error">{error}</p>}
      {loading && !data && <p className="message">Loading…</p>}
      {data && data.length === 0 && (
        <div className="empty">
          <h2 className="h2">Nothing here yet</h2>
          <p>No products match. Try another category.</p>
        </div>
      )}
      {data && data.length > 0 && (
        <ul className="products">
          {data.map((p) => {
            const inCart = lines.find((l) => l.productId === p._id)?.qty ?? 0;
            const out = p.stock <= 0;
            return (
              <li key={p._id} className="product">
                <ProductImage product={p} />
                <div className="product-body">
                  <span className="product-cat capitalize">{p.category}</span>
                  <h2 className="product-name">{p.name}</h2>
                  <p className="product-desc">{p.description}</p>
                  <div className="product-foot">
                    <span className="product-price display">{formatMoney(p.priceCents)}</span>
                    <button type="button" className="btn btn--primary btn--sm" disabled={out || inCart >= Math.min(20, p.stock)} onClick={() => add(p)}>
                      <Icon name="plus" size={14} />
                      {out ? "Sold out" : inCart > 0 ? `In cart (${inCart})` : "Add"}
                    </button>
                  </div>
                  {!out && p.stock <= 5 && <p className="product-low">Only {p.stock} left</p>}
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
