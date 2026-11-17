"use client";

import { useState } from "react";
import { api, errorMessage } from "@/lib/api";
import type { Paged, Profile } from "@/lib/apiTypes";
import { formatDate } from "@/lib/money";
import { useFetch } from "@/lib/useFetch";
import { AdminPage, Pager } from "./AdminKit";
import { useAuth } from "./AuthProvider";

export function AdminUsers() {
  const { profile: me } = useAuth();
  const [q, setQ] = useState("");
  const [page, setPage] = useState(1);
  const { data, error, reload } = useFetch<Paged<Profile>>(`/admin/users?page=${page}&q=${encodeURIComponent(q)}`);
  const [err, setErr] = useState("");

  const act = async (fn: () => Promise<unknown>) => {
    setErr("");
    try {
      await fn();
      await reload();
    } catch (e) {
      setErr(errorMessage(e));
    }
  };

  return (
    <AdminPage title="Users">
      <input
        className="input toolbar-input"
        type="search"
        placeholder="Search name or email"
        aria-label="Search users"
        value={q}
        onChange={(e) => {
          setQ(e.target.value);
          setPage(1);
        }}
      />
      {(error || err) && <p className="form-error" role="alert">{error || err}</p>}
      <div className="table-wrap">
        <table className="table">
          <thead>
            <tr>
              <th>User</th>
              <th>Role</th>
              <th>Membership</th>
              <th>Joined</th>
              <th>Status</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {data?.items.map((u) => {
              const self = u._id === me?._id;
              const member = u.membership?.expiresAt && new Date(u.membership.expiresAt) > new Date();
              return (
                <tr key={u._id}>
                  <td>
                    <strong>{u.name || "(no name)"}</strong>
                    <br />
                    <span className="muted">{u.email}</span>
                  </td>
                  <td>
                    <select
                      className="select select--sm"
                      value={u.role}
                      disabled={self}
                      aria-label={`Role of ${u.email}`}
                      onChange={(e) => void act(() => api(`/admin/users/${u._id}`, { method: "PATCH", body: { role: e.target.value } }))}
                    >
                      <option value="user">user</option>
                      <option value="admin">admin</option>
                    </select>
                  </td>
                  <td>{member ? `${u.membership?.planName} until ${formatDate(u.membership?.expiresAt)}` : "-"}</td>
                  <td>{formatDate(u.createdAt)}</td>
                  <td>
                    <span className={`badge ${u.disabled ? "badge--cancelled" : "badge--completed"}`}>{u.disabled ? "disabled" : "active"}</span>
                  </td>
                  <td className="row-end">
                    <button
                      type="button"
                      className="btn btn--secondary btn--sm"
                      disabled={self}
                      onClick={() => void act(() => api(`/admin/users/${u._id}`, { method: "PATCH", body: { disabled: !u.disabled } }))}
                    >
                      {u.disabled ? "Enable" : "Disable"}
                    </button>{" "}
                    <button
                      type="button"
                      className="btn btn--danger btn--sm"
                      disabled={self}
                      onClick={() => {
                        if (window.confirm(`Delete ${u.email}? This removes the account permanently.`)) void act(() => api(`/admin/users/${u._id}`, { method: "DELETE" }));
                      }}
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      {data && data.items.length === 0 && <p>No users found.</p>}
      {data && <Pager page={data.page} pages={data.pages} onPage={setPage} />}
    </AdminPage>
  );
}
