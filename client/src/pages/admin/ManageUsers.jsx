import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import api from "../../lib/api.js";
import { formatPrice } from "../../lib/format.js";

const RANGES = [
  { id: "all",       label: "All Time" },
  { id: "today",     label: "Today" },
  { id: "yesterday", label: "Yesterday" },
  { id: "custom",    label: "Custom" },
];

function SummaryCard({ label, value, sub }) {
  return (
    <div className="rounded-xl border border-line bg-white p-5">
      <p className="text-xs font-bold uppercase tracking-wider text-muted">{label}</p>
      <p className="mt-1 text-2xl font-extrabold text-ink">{value}</p>
      {sub && <p className="mt-0.5 text-xs text-muted">{sub}</p>}
    </div>
  );
}

function shortId(id) {
  return "#" + String(id).slice(-6).toUpperCase();
}

function fmtDate(d) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
}

export default function ManageUsers() {
  const qc = useQueryClient();
  const [range, setRange] = useState("all");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");

  const queryKey = ["admin-customers", range, from, to];
  const { data, isLoading } = useQuery({
    queryKey,
    queryFn: async () => {
      const params = new URLSearchParams({ range });
      if (range === "custom" && from) { params.set("from", from); if (to) params.set("to", to); }
      return (await api.get(`/admin/customers?${params}`)).data;
    },
  });

  const customers = data?.customers || [];
  const summary   = data?.summary   || { totalCustomers: 0, newToday: 0, totalRevenue: 0 };

  async function toggleBan(u) {
    await api.put(`/admin/users/${u._id}`, { banned: !u.banned });
    qc.invalidateQueries({ queryKey });
  }

  return (
    <div className="space-y-6">
      {/* Header + date filter */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-bold text-ink">Customers</h1>

        <div className="flex flex-wrap items-center gap-2">
          {RANGES.map((r) => (
            <button key={r.id} onClick={() => setRange(r.id)}
              className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition
                ${range === r.id ? "bg-brand text-white" : "border border-line bg-white text-ink hover:border-brand"}`}>
              {r.label}
            </button>
          ))}
          {range === "custom" && (
            <div className="flex items-center gap-2">
              <input type="date" value={from} onChange={(e) => setFrom(e.target.value)}
                className="rounded-lg border border-line px-2 py-1 text-xs outline-none focus:border-brand" />
              <span className="text-xs text-muted">to</span>
              <input type="date" value={to} onChange={(e) => setTo(e.target.value)}
                className="rounded-lg border border-line px-2 py-1 text-xs outline-none focus:border-brand" />
            </div>
          )}
        </div>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <SummaryCard label="Total Customers" value={summary.totalCustomers.toLocaleString()} sub="All registered customers" />
        <SummaryCard label="New Today" value={summary.newToday.toLocaleString()} sub="Joined since midnight" />
        <SummaryCard label="Total Revenue" value={`৳${formatPrice(summary.totalRevenue)}`} sub="All-time order revenue" />
      </div>

      {/* Customer table */}
      <div className="overflow-hidden rounded-xl border border-line bg-white">
        <div className="flex items-center justify-between border-b border-line px-5 py-3">
          <p className="text-xs font-bold uppercase tracking-wider text-muted">
            {customers.length} customer{customers.length !== 1 ? "s" : ""}
            {range !== "all" && ` — ${RANGES.find(r => r.id === range)?.label}`}
          </p>
        </div>

        {isLoading ? (
          <p className="py-10 text-center text-sm text-muted">Loading...</p>
        ) : customers.length === 0 ? (
          <p className="py-10 text-center text-sm text-muted">No customers found.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-cream text-left text-[11px] font-bold uppercase tracking-wider text-muted">
                <tr>
                  <th className="px-4 py-3">Customer</th>
                  <th className="px-4 py-3">User ID</th>
                  <th className="px-4 py-3">Mobile</th>
                  <th className="px-4 py-3">Orders</th>
                  <th className="px-4 py-3">Lifetime Spend</th>
                  <th className="px-4 py-3">Joined</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3"></th>
                </tr>
              </thead>
              <tbody>
                {customers.map((u) => (
                  <tr key={u._id} className="border-t border-line hover:bg-gray-50/50">
                    {/* Name + email */}
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2.5">
                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-brand/10 text-xs font-bold text-brand uppercase">
                          {u.name?.[0] || "?"}
                        </div>
                        <div>
                          <p className="font-semibold text-ink">{u.name}</p>
                          <p className="text-[11px] text-muted">{u.email}</p>
                        </div>
                      </div>
                    </td>
                    {/* User ID */}
                    <td className="px-4 py-3 font-mono text-xs text-muted">{shortId(u._id)}</td>
                    {/* Mobile */}
                    <td className="px-4 py-3 text-sm">{u.mobile || <span className="text-muted">—</span>}</td>
                    {/* Orders */}
                    <td className="px-4 py-3">
                      <span className="inline-flex items-center rounded-full bg-blue-50 px-2.5 py-0.5 text-xs font-bold text-blue-700">
                        {u.orderCount}
                      </span>
                    </td>
                    {/* Lifetime spend */}
                    <td className="px-4 py-3 font-semibold text-ink">
                      ৳{formatPrice(u.totalSpend)}
                    </td>
                    {/* Joined date */}
                    <td className="px-4 py-3 text-xs text-muted whitespace-nowrap">{fmtDate(u.createdAt)}</td>
                    {/* Status */}
                    <td className="px-4 py-3">
                      {u.banned
                        ? <span className="inline-block rounded-full bg-red-50 px-2.5 py-0.5 text-[11px] font-bold text-red-600">Banned</span>
                        : <span className="inline-block rounded-full bg-green-50 px-2.5 py-0.5 text-[11px] font-bold text-green-700">Active</span>}
                    </td>
                    {/* Action */}
                    <td className="px-4 py-3 text-right">
                      <button onClick={() => toggleBan(u)}
                        className={`rounded-lg border px-3 py-1 text-xs font-semibold transition
                          ${u.banned
                            ? "border-green-200 text-green-700 hover:bg-green-50"
                            : "border-red-200 text-red-600 hover:bg-red-50"}`}>
                        {u.banned ? "Unban" : "Ban"}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
