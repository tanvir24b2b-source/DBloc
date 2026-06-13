import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { useAuthStore } from "../store/useAuthStore.js";
import api from "../lib/api.js";
import { formatPrice } from "../lib/format.js";

const STATUS_COLORS = {
  pending:    "bg-yellow-50 text-yellow-700 border-yellow-200",
  confirmed:  "bg-blue-50 text-blue-700 border-blue-200",
  processing: "bg-purple-50 text-purple-700 border-purple-200",
  shipped:    "bg-indigo-50 text-indigo-700 border-indigo-200",
  delivered:  "bg-green-50 text-green-700 border-green-200",
  cancelled:  "bg-red-50 text-red-600 border-red-200",
};

function fmt(dateStr) {
  if (!dateStr) return "—";
  return new Date(dateStr).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
}

export default function Profile() {
  const { user, logout, setAuth } = useAuthStore();
  const navigate = useNavigate();

  const [tab, setTab] = useState("orders");
  const [form, setForm] = useState({ name: "", email: "", mobile: "", address: "", password: "", newPassword: "", confirmNew: "" });
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState(null); // { type: "ok"|"err", text }

  // Redirect if not logged in
  useEffect(() => {
    if (user === null) navigate("/login");
  }, [user, navigate]);

  // Populate form from user
  useEffect(() => {
    if (user) setForm(f => ({ ...f, name: user.name || "", email: user.email || "", mobile: user.mobile || "", address: user.address || "" }));
  }, [user]);

  const { data: orders = [], isLoading: ordersLoading } = useQuery({
    queryKey: ["my-orders"],
    queryFn: () => api.get("/orders/my").then(r => r.data),
    enabled: !!user,
  });

  async function saveProfile(e) {
    e.preventDefault();
    if (form.newPassword && form.newPassword !== form.confirmNew) {
      setMsg({ type: "err", text: "New passwords do not match." });
      return;
    }
    setSaving(true); setMsg(null);
    try {
      const payload = { name: form.name, email: form.email, mobile: form.mobile, address: form.address };
      if (form.newPassword) { payload.password = form.password; payload.newPassword = form.newPassword; }
      const { data } = await api.put("/auth/profile", payload);
      setAuth({ user: data.user });
      setMsg({ type: "ok", text: "Profile updated successfully." });
      setForm(f => ({ ...f, password: "", newPassword: "", confirmNew: "" }));
    } catch (err) {
      setMsg({ type: "err", text: err.response?.data?.message || "Update failed." });
    } finally {
      setSaving(false);
    }
  }

  if (!user) return null;

  const latest = orders[0];

  return (
    <div className="mx-auto max-w-4xl px-6 py-10">
      {/* Header */}
      <div className="mb-8 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="grid h-14 w-14 place-items-center rounded-full bg-brand text-xl font-extrabold text-white">
            {user.name?.[0]?.toUpperCase() || "U"}
          </div>
          <div>
            <h1 className="text-xl font-bold text-ink">{user.name}</h1>
            <p className="text-sm text-muted">{user.email}</p>
          </div>
        </div>
        <button
          onClick={() => { logout(); navigate("/"); }}
          className="rounded-full border border-line px-4 py-1.5 text-xs font-bold text-muted hover:border-danger hover:text-danger transition"
        >
          Logout
        </button>
      </div>

      {/* Latest order banner */}
      {latest && (
        <div className="mb-6 flex items-center justify-between rounded-xl border border-line bg-white px-5 py-4">
          <div>
            <p className="text-xs text-muted">Latest Order</p>
            <p className="mt-0.5 font-bold text-ink">{latest.orderId}</p>
            <p className="text-sm text-muted">{latest.bloc?.title}</p>
          </div>
          <div className="text-right">
            <span className={`inline-block rounded-full border px-3 py-0.5 text-xs font-semibold ${STATUS_COLORS[latest.status] || "bg-gray-100 text-gray-600"}`}>
              {latest.status}
            </span>
            <p className="mt-1 text-xs text-muted">{fmt(latest.createdAt)}</p>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="mb-6 flex gap-1 rounded-xl border border-line bg-white p-1">
        {[["orders", "Order History"], ["profile", "Edit Profile"]].map(([key, label]) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className={`flex-1 rounded-lg py-2 text-sm font-semibold transition ${tab === key ? "bg-brand text-white" : "text-muted hover:text-ink"}`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Orders tab */}
      {tab === "orders" && (
        <div className="rounded-xl border border-line bg-white overflow-hidden">
          {ordersLoading ? (
            <p className="p-6 text-sm text-muted">Loading orders...</p>
          ) : orders.length === 0 ? (
            <div className="p-10 text-center">
              <p className="text-muted">You haven't placed any orders yet.</p>
              <Link to="/categories" className="mt-3 inline-block rounded-full bg-brand px-5 py-2 text-sm font-bold text-white">
                Browse Blocs
              </Link>
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-line bg-cream text-left text-xs font-bold uppercase tracking-wide text-muted">
                  <th className="px-4 py-3">Order</th>
                  <th className="px-4 py-3">Product</th>
                  <th className="px-4 py-3">Date</th>
                  <th className="px-4 py-3">Amount</th>
                  <th className="px-4 py-3">Status</th>
                </tr>
              </thead>
              <tbody>
                {orders.map((o, i) => (
                  <tr key={o._id} className={`border-b border-line last:border-0 ${i % 2 === 1 ? "bg-cream/40" : ""}`}>
                    <td className="px-4 py-3 font-bold text-brand">{o.orderId}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        {o.bloc?.image && (
                          <img src={o.bloc.image} alt="" className="h-9 w-9 rounded-lg object-cover border border-line shrink-0" />
                        )}
                        <span className="line-clamp-1 font-medium text-ink">{o.bloc?.title || "—"}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-muted">{fmt(o.createdAt)}</td>
                    <td className="px-4 py-3 font-semibold text-ink">৳{formatPrice(o.amount)}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-block rounded-full border px-2.5 py-0.5 text-xs font-semibold ${STATUS_COLORS[o.status] || "bg-gray-100 text-gray-600"}`}>
                        {o.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {/* Edit Profile tab */}
      {tab === "profile" && (
        <form onSubmit={saveProfile} className="rounded-xl border border-line bg-white p-6 space-y-5">
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-xs font-semibold text-muted">Full Name</label>
              <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                className="w-full rounded-lg border border-line px-3 py-2.5 text-sm outline-none focus:border-brand" required />
            </div>
            <div>
              <label className="mb-1 block text-xs font-semibold text-muted">Email</label>
              <input type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                className="w-full rounded-lg border border-line px-3 py-2.5 text-sm outline-none focus:border-brand" required />
            </div>
            <div>
              <label className="mb-1 block text-xs font-semibold text-muted">Mobile</label>
              <input value={form.mobile} onChange={e => setForm(f => ({ ...f, mobile: e.target.value }))}
                className="w-full rounded-lg border border-line px-3 py-2.5 text-sm outline-none focus:border-brand" />
            </div>
            <div>
              <label className="mb-1 block text-xs font-semibold text-muted">Delivery Address</label>
              <input value={form.address} onChange={e => setForm(f => ({ ...f, address: e.target.value }))}
                className="w-full rounded-lg border border-line px-3 py-2.5 text-sm outline-none focus:border-brand" />
            </div>
          </div>

          <div className="border-t border-line pt-4">
            <p className="mb-3 text-xs font-bold uppercase tracking-wide text-muted">Change Password <span className="normal-case font-normal">(leave blank to keep current)</span></p>
            <div className="grid gap-4 sm:grid-cols-3">
              <div>
                <label className="mb-1 block text-xs font-semibold text-muted">Current Password</label>
                <input type="password" value={form.password} onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                  className="w-full rounded-lg border border-line px-3 py-2.5 text-sm outline-none focus:border-brand" autoComplete="current-password" />
              </div>
              <div>
                <label className="mb-1 block text-xs font-semibold text-muted">New Password</label>
                <input type="password" value={form.newPassword} onChange={e => setForm(f => ({ ...f, newPassword: e.target.value }))}
                  className="w-full rounded-lg border border-line px-3 py-2.5 text-sm outline-none focus:border-brand" autoComplete="new-password" />
              </div>
              <div>
                <label className="mb-1 block text-xs font-semibold text-muted">Confirm New</label>
                <input type="password" value={form.confirmNew} onChange={e => setForm(f => ({ ...f, confirmNew: e.target.value }))}
                  className="w-full rounded-lg border border-line px-3 py-2.5 text-sm outline-none focus:border-brand" autoComplete="new-password" />
              </div>
            </div>
          </div>

          {msg && (
            <p className={`rounded-lg px-4 py-2 text-sm font-semibold ${msg.type === "ok" ? "bg-green-50 text-green-700" : "bg-red-50 text-danger"}`}>
              {msg.text}
            </p>
          )}

          <button disabled={saving}
            className="rounded-full bg-brand px-8 py-2.5 text-sm font-bold text-white hover:bg-brand-hover disabled:opacity-60 transition">
            {saving ? "Saving..." : "Save Changes"}
          </button>
        </form>
      )}
    </div>
  );
}
