"use client";

import { ORDER_STATUSES, type Order, type Product } from "@/lib/apiTypes";
import { formatDate, formatMoney } from "@/lib/money";
import { useFetch } from "@/lib/useFetch";
import { OrderStatusBadge } from "./AccountView";
import { AdminPage } from "./AdminKit";

interface Stats {
  users: number;
  admins: number;
  newUsers: number;
  members: number;
  products: number;
  orders: number;
  revenueCents: number;
  ordersByStatus: Record<string, number>;
  lowStock: Product[];
  recentOrders: Order[];
  customExercises: number;
  hiddenExercises: number;
}

interface GymStats {
  checkinsToday: number;
  upcomingBookings: number;
  newLeads: number;
  classesNext7: number;
  activeMembers: number;
  expiringSoon: { _id: string; name: string; email: string; membership?: { planName?: string; expiresAt?: string } }[];
}

export function AdminDashboard() {
  const { data, error } = useFetch<Stats>("/admin/stats");
  const gym = useFetch<GymStats>("/admin/gym-stats");
  const tile = (label: string, value: string | number, sub?: string) => (
    <div className="stat-tile">
      <span className="stat-tile-value display">{value}</span>
      <span className="stat-tile-label">{label}</span>
      {sub && <span className="stat-tile-sub">{sub}</span>}
    </div>
  );
  return (
    <AdminPage title="Dashboard">
      {error && <p className="form-error">{error}</p>}
      {!data && !error && <p className="message">Loading…</p>}
      {data && (
        <>
          <div className="stat-tiles">
            {tile("Users", data.users, `${data.newUsers} new this week · ${data.admins} admin`)}
            {tile("Active members", data.members)}
            {tile("Orders", data.orders)}
            {tile("Revenue", formatMoney(data.revenueCents), "excl. cancelled")}
            {tile("Products live", data.products)}
            {tile("Custom exercises", data.customExercises, `${data.hiddenExercises} library exercises hidden`)}
          </div>

          {gym.data && (
            <>
              <h2 className="h2" style={{ margin: "8px 0 12px" }}>
                Gym today
              </h2>
              <div className="stat-tiles">
                {tile("Check-ins today", gym.data.checkinsToday)}
                {tile("Active members", gym.data.activeMembers)}
                {tile("Classes next 7 days", gym.data.classesNext7, `${gym.data.upcomingBookings} bookings`)}
                {tile("New enquiries", gym.data.newLeads, "waiting for a reply")}
              </div>
              {gym.data.expiringSoon.length > 0 && (
                <section className="panel-box">
                  <h2 className="h2">Memberships ending within 7 days</h2>
                  <ul className="kv">
                    {gym.data.expiringSoon.map((u) => (
                      <li key={u._id}>
                        <span>
                          {u.name || u.email} <span className="muted">{u.membership?.planName}</span>
                        </span>
                        <strong>{formatDate(u.membership?.expiresAt)}</strong>
                      </li>
                    ))}
                  </ul>
                </section>
              )}
            </>
          )}

          <div className="two-col">
            <section className="panel-box">
              <h2 className="h2">Orders by status</h2>
              <ul className="kv">
                {ORDER_STATUSES.map((s) => (
                  <li key={s}>
                    <OrderStatusBadge status={s} />
                    <strong>{data.ordersByStatus[s] ?? 0}</strong>
                  </li>
                ))}
              </ul>
            </section>
            <section className="panel-box">
              <h2 className="h2">Low stock</h2>
              {data.lowStock.length === 0 ? (
                <p>Everything is well stocked.</p>
              ) : (
                <ul className="kv">
                  {data.lowStock.map((p) => (
                    <li key={p._id}>
                      <span>{p.name}</span>
                      <strong>{p.stock} left</strong>
                    </li>
                  ))}
                </ul>
              )}
            </section>
          </div>

          <section className="section">
            <div className="section-head">
              <h2 className="h2">Recent orders</h2>
            </div>
            <div className="table-wrap">
              <table className="table">
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Customer</th>
                    <th>Total</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {data.recentOrders.map((o) => (
                    <tr key={o._id}>
                      <td>{formatDate(o.createdAt)}</td>
                      <td>{typeof o.user === "object" ? o.user.email : "-"}</td>
                      <td>{formatMoney(o.totalCents)}</td>
                      <td>
                        <OrderStatusBadge status={o.status} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        </>
      )}
    </AdminPage>
  );
}
