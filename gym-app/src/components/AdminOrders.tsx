"use client";

import { useState } from "react";
import { api, errorMessage } from "@/lib/api";
import { ORDER_STATUSES, type Order, type Paged } from "@/lib/apiTypes";
import { formatDate, formatMoney } from "@/lib/money";
import { useFetch } from "@/lib/useFetch";
import { AdminPage, Pager } from "./AdminKit";

export function AdminOrders() {
  const [status, setStatus] = useState("");
  const [page, setPage] = useState(1);
  const { data, error, reload } = useFetch<Paged<Order>>(`/admin/orders?page=${page}&status=${status}`);
  const [err, setErr] = useState("");

  const setOrderStatus = async (id: string, next: string) => {
    setErr("");
    try {
      await api(`/admin/orders/${id}`, { method: "PATCH", body: { status: next } });
      await reload();
    } catch (e) {
      setErr(errorMessage(e));
    }
  };

  return (
    <AdminPage title="Orders">
      <div className="chips" style={{ marginBottom: 16 }}>
        {["", ...ORDER_STATUSES].map((s) => (
          <button key={s || "all"} type="button" className={`chip${status === s ? " chip--on" : ""}`} aria-pressed={status === s} onClick={() => { setStatus(s); setPage(1); }}>
            <span className="capitalize">{s || "All"}</span>
          </button>
        ))}
      </div>
      {(error || err) && <p className="form-error" role="alert">{error || err}</p>}
      <div className="table-wrap">
        <table className="table">
          <thead>
            <tr>
              <th>Order</th>
              <th>Customer</th>
              <th>Items</th>
              <th>Total</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {data?.items.map((o) => {
              const locked = o.status === "cancelled" || o.status === "completed";
              return (
                <tr key={o._id}>
                  <td>
                    #{o._id.slice(-6)}
                    <br />
                    <span className="muted">{formatDate(o.createdAt)} · {o.kind}</span>
                  </td>
                  <td>
                    {typeof o.user === "object" ? o.user.email : "-"}
                    {o.shipping && (
                      <>
                        <br />
                        <span className="muted">
                          {o.shipping.name}, {o.shipping.phone}
                          <br />
                          {o.shipping.address}, {o.shipping.city}
                        </span>
                      </>
                    )}
                  </td>
                  <td>
                    {o.items.map((i, n) => (
                      <div key={n}>
                        {i.qty} × {i.name}
                      </div>
                    ))}
                  </td>
                  <td>{formatMoney(o.totalCents)}</td>
                  <td>
                    <select className="select select--sm" value={o.status} disabled={locked} aria-label={`Status of order ${o._id.slice(-6)}`} onChange={(e) => void setOrderStatus(o._id, e.target.value)}>
                      {ORDER_STATUSES.map((s) => (
                        <option key={s} value={s}>
                          {s}
                        </option>
                      ))}
                    </select>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      {data && data.items.length === 0 && <p>No orders.</p>}
      {data && <Pager page={data.page} pages={data.pages} onPage={setPage} />}
    </AdminPage>
  );
}
