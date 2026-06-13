import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import api from "../../lib/api.js";
import { formatPrice } from "../../lib/format.js";

const statuses = ["pending", "confirmed", "processing", "shipped", "delivered", "cancelled"];

const statusColors = {
  pending:    "bg-yellow-100 text-yellow-700",
  confirmed:  "bg-blue-100 text-blue-700",
  processing: "bg-orange-100 text-orange-700",
  shipped:    "bg-purple-100 text-purple-700",
  delivered:  "bg-green-100 text-green-700",
  cancelled:  "bg-red-100 text-red-700",
};

function fmt(dateStr) {
  if (!dateStr) return "—";
  const d = new Date(dateStr);
  return d.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
}

export default function ManageOrders() {
  const qc = useQueryClient();
  const [search, setSearch] = useState("");
  const [updating, setUpdating] = useState({});

  const { data: ordersData } = useQuery({
    queryKey: ["admin-orders"],
    queryFn: async () => (await api.get("/orders")).data,
  });
  const orders = ordersData?.orders ?? ordersData ?? [];

  async function setStatus(id, status) {
    setUpdating((p) => ({ ...p, [id]: status }));
    await api.put(`/orders/${id}/status`, { status });
    qc.invalidateQueries({ queryKey: ["admin-orders"] });
    setUpdating((p) => { const n = { ...p }; delete n[id]; return n; });
  }

  const filtered = orders.filter((o) => {
    const q = search.toLowerCase();
    return (
      o.orderId?.toLowerCase().includes(q) ||
      o.mobile?.toLowerCase().includes(q) ||
      o.customerName?.toLowerCase().includes(q) ||
      o.bloc?.title?.toLowerCase().includes(q)
    );
  });

  return (
    <div>
      <h1 className="text-2xl font-bold text-ink">Orders</h1>

      {/* Search bar */}
      <div className="mt-4 rounded-xl border border-line bg-white p-3">
        <div className="flex items-center gap-2">
          <span className="text-lg text-muted">⌕</span>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by Order ID, mobile number, customer name, or product..."
            className="flex-1 bg-transparent text-sm outline-none placeholder-muted"
          />
          {search && (
            <button onClick={() => setSearch("")} className="text-xs font-semibold text-muted hover:text-ink">
              ✕ Clear
            </button>
          )}
        </div>
      </div>

      <div className="mt-6 overflow-hidden rounded-xl border border-line bg-white">
        <table className="w-full text-sm">
          <thead className="bg-cream text-left text-xs uppercase text-muted">
            <tr>
              <th className="p-3">Order ID</th>
              <th className="p-3">Date</th>
              <th className="p-3">Customer</th>
              <th className="p-3">Product</th>
              <th className="p-3">Amount</th>
              <th className="p-3">Payment</th>
              <th className="p-3">Status</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((o) => {
              const currentStatus = updating[o._id] ?? o.status;
              return (
                <tr key={o._id} className="border-t border-line">
                  <td className="p-3 font-mono text-xs font-semibold text-ink">{o.orderId}</td>
                  <td className="p-3 text-xs text-muted whitespace-nowrap">{fmt(o.createdAt)}</td>
                  <td className="p-3">
                    {o.customerName}
                    <br />
                    <span className="text-xs text-muted">{o.mobile}</span>
                  </td>
                  <td className="p-3">{o.bloc?.title}</td>
                  <td className="p-3">৳{formatPrice(o.amount)}</td>
                  <td className="p-3 uppercase text-xs">{o.paymentMethod}</td>
                  <td className="p-3">
                    <select
                      value={currentStatus}
                      onChange={(e) => setStatus(o._id, e.target.value)}
                      className={`rounded-full border-0 px-3 py-1 text-xs font-semibold capitalize outline-none cursor-pointer ${statusColors[currentStatus] ?? "bg-gray-100 text-gray-600"}`}
                    >
                      {statuses.map((s) => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </td>
                </tr>
              );
            })}
            {filtered.length === 0 && (
              <tr>
                <td colSpan="7" className="p-6 text-center text-muted">
                  {search ? "No orders match your search." : "No orders yet."}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
