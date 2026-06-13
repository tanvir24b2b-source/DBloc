import { useState } from "react";
import { Link } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import api from "../../lib/api.js";
import { formatPrice } from "../../lib/format.js";

const STATUS_COLORS = {
  active: "bg-emerald-50 text-emerald-700 border-emerald-200",
  full: "bg-blue-50 text-blue-700 border-blue-200",
  expired: "bg-gray-100 text-gray-500 border-gray-200",
};

const emptySession = {
  productId: "",
  originalPrice: "", blocPrice: "",
  maxSpots: 100, goal: 50,
  endTime: "", featured: false,
};

export default function ManageBlocs() {
  const qc = useQueryClient();
  const { data: blocs = [] } = useQuery({
    queryKey: ["admin-blocs"],
    queryFn: () => api.get("/blocs").then((r) => r.data),
  });

  const [modal, setModal] = useState(null); // null | "new" | "edit"
  const [form, setForm] = useState(emptySession);
  const [editId, setEditId] = useState(null);

  const defaultEnd = () => new Date(Date.now() + 24 * 3.6e6).toISOString().slice(0, 16);

  function openLaunch() {
    setForm({ ...emptySession, endTime: defaultEnd() });
    setEditId(null);
    setModal("new");
  }

  function openEdit(b) {
    setForm({
      productId: b._id,
      originalPrice: b.originalPrice,
      blocPrice: b.blocPrice,
      maxSpots: b.maxSpots,
      goal: b.goal || Math.round(b.maxSpots * 0.5),
      endTime: new Date(b.endTime).toISOString().slice(0, 16),
      featured: b.featured,
    });
    setEditId(b._id);
    setModal("edit");
  }

  // When a product is picked in the launch modal, pre-fill its pricing.
  function selectProduct(e) {
    const pid = e.target.value;
    const p = blocs.find((b) => b._id === pid);
    setForm((s) => ({
      ...s,
      productId: pid,
      originalPrice: p?.originalPrice ?? s.originalPrice,
      blocPrice: p?.blocPrice ?? s.blocPrice,
      maxSpots: p?.maxSpots ?? s.maxSpots,
      goal: p?.goal || Math.round((p?.maxSpots || 100) * 0.5),
    }));
  }

  const set = (k) => (e) =>
    setForm((s) => ({ ...s, [k]: e.target.type === "checkbox" ? e.target.checked : e.target.value }));

  async function save(e) {
    e.preventDefault();
    const targetId = editId || form.productId;
    if (!targetId) return;
    const payload = {
      originalPrice: Number(form.originalPrice),
      blocPrice: Number(form.blocPrice),
      maxSpots: Number(form.maxSpots),
      goal: Number(form.goal) || Math.round(Number(form.maxSpots) * 0.5),
      endTime: form.endTime,
      featured: form.featured,
    };
    await api.put(`/blocs/${targetId}`, payload);
    setModal(null);
    qc.invalidateQueries({ queryKey: ["admin-blocs"] });
    qc.invalidateQueries({ queryKey: ["admin-products"] });
    qc.invalidateQueries({ queryKey: ["blocs"] });
  }

  async function remove(id) {
    if (!confirm("Delete this bloc session?")) return;
    await api.delete(`/blocs/${id}`);
    qc.invalidateQueries({ queryKey: ["admin-blocs"] });
  }

  const active = blocs.filter((b) => b.status === "active");
  const others = blocs.filter((b) => b.status !== "active");
  const selectedProduct = blocs.find((b) => b._id === form.productId);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-extrabold tracking-tight text-gray-900">Active Blocs</h1>
          <p className="mt-0.5 text-sm text-gray-500">Launch and manage group-buy sessions — pick a product, set the timeframe, pricing & goal.</p>
        </div>
        <button
          onClick={openLaunch}
          className="rounded-xl bg-brand px-5 py-2.5 text-sm font-bold text-white shadow-sm shadow-brand/30 hover:bg-brand-hover"
        >
          ⚡ Launch New Bloc
        </button>
      </div>

      {/* Stats strip */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: "Active Sessions", value: active.length, color: "text-emerald-600" },
          { label: "Total Joined", value: blocs.reduce((s, b) => s + b.filledSpots, 0), color: "text-brand" },
          { label: "Spots Available", value: blocs.reduce((s, b) => s + Math.max(0, b.maxSpots - b.filledSpots), 0), color: "text-gray-700" },
        ].map((s) => (
          <div key={s.label} className="rounded-xl border border-gray-200 bg-white px-5 py-4">
            <p className={`text-2xl font-extrabold ${s.color}`}>{s.value}</p>
            <p className="mt-0.5 text-xs font-semibold uppercase tracking-wider text-gray-400">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Active blocs */}
      <div className="rounded-2xl border border-gray-200 bg-white overflow-hidden">
        <div className="border-b border-gray-100 px-5 py-3">
          <h2 className="text-sm font-bold uppercase tracking-wider text-gray-500">Live Sessions</h2>
        </div>
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-100 text-left text-[11px] font-bold uppercase tracking-wider text-gray-400">
              <th className="px-5 py-3">Product</th>
              <th className="px-5 py-3">D-Bloc Price</th>
              <th className="px-5 py-3">Joined / Goal</th>
              <th className="px-5 py-3">Ends</th>
              <th className="px-5 py-3">Status</th>
              <th className="px-5 py-3"></th>
            </tr>
          </thead>
          <tbody>
            {[...active, ...others].map((b) => {
              const end = new Date(b.endTime);
              const hoursLeft = Math.round((end - Date.now()) / 3.6e6);
              const goal = b.goal || Math.round(b.maxSpots * 0.5);
              return (
                <tr key={b._id} className="border-b border-gray-50 last:border-0 hover:bg-gray-50/50">
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-3">
                      {b.image && <img src={b.image} alt="" className="h-9 w-9 rounded-lg object-cover" />}
                      <div>
                        <p className="font-semibold text-gray-900">{b.title}</p>
                        {b.sku && <p className="text-[11px] text-gray-400">SKU: {b.sku}</p>}
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-3">
                    <p className="font-bold text-brand">৳{formatPrice(b.blocPrice)}</p>
                    <p className="text-[11px] text-gray-400 line-through">৳{formatPrice(b.originalPrice)}</p>
                  </td>
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-2">
                      <div className="h-1.5 w-20 overflow-hidden rounded-full bg-gray-100">
                        <div className="h-full rounded-full bg-brand" style={{ width: `${Math.min(100, Math.round((b.filledSpots / goal) * 100))}%` }} />
                      </div>
                      <span className="text-xs text-gray-500">{b.filledSpots}/{goal}</span>
                    </div>
                    <p className="mt-0.5 text-[10px] text-gray-400">cap {b.filledSpots}/{b.maxSpots}</p>
                  </td>
                  <td className="px-5 py-3 text-xs text-gray-500">
                    {b.status === "active" ? (
                      <span className="font-semibold text-amber-600">{hoursLeft > 0 ? `${hoursLeft}h left` : "Ending soon"}</span>
                    ) : (
                      end.toLocaleDateString()
                    )}
                  </td>
                  <td className="px-5 py-3">
                    <span className={`rounded-full border px-2.5 py-0.5 text-[11px] font-bold ${STATUS_COLORS[b.status] || STATUS_COLORS.expired}`}>
                      {b.status}
                    </span>
                  </td>
                  <td className="px-5 py-3 text-right">
                    <button onClick={() => openEdit(b)} className="mr-3 text-xs font-semibold text-brand hover:underline">Edit Session</button>
                    <button onClick={() => remove(b._id)} className="text-xs font-semibold text-red-400 hover:underline">Delete</button>
                  </td>
                </tr>
              );
            })}
            {blocs.length === 0 && (
              <tr><td colSpan={6} className="px-5 py-10 text-center text-sm text-gray-400">No products yet. <Link to="/admin/products/new" className="text-brand underline">Add a product</Link> first.</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Launch / Edit modal */}
      {modal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={() => setModal(null)}>
          <form onSubmit={save} className="max-h-[92vh] w-full max-w-lg overflow-y-auto rounded-2xl bg-white p-6 shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <h3 className="mb-1 text-lg font-extrabold text-gray-900">
              {modal === "new" ? "⚡ Launch New Bloc Session" : "Edit Bloc Session"}
            </h3>
            <p className="mb-5 text-xs text-gray-500">
              {modal === "new"
                ? "Select a product and configure its group-buy session."
                : "Update this product's group-buy session settings."}
            </p>

            <div className="space-y-4">
              {/* Product selector (launch only) */}
              {modal === "new" && (
                <div>
                  <label className="mb-1 block text-[11px] font-bold uppercase tracking-wider text-gray-400">Select Product *</label>
                  <select required value={form.productId} onChange={selectProduct}
                    className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm outline-none focus:border-brand">
                    <option value="">— Choose a product to launch —</option>
                    {blocs.map((b) => (
                      <option key={b._id} value={b._id}>{b.title}{b.sku ? ` (${b.sku})` : ""}</option>
                    ))}
                  </select>
                  <p className="mt-1 text-[11px] text-gray-400">
                    Don’t see it? <Link to="/admin/products/new" className="text-brand underline">Add a new product</Link> first.
                  </p>
                </div>
              )}

              {/* Selected product preview */}
              {selectedProduct && (
                <div className="flex items-center gap-3 rounded-xl border border-gray-100 bg-gray-50 p-3">
                  <img src={selectedProduct.image} alt="" className="h-12 w-12 rounded-lg object-cover" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-bold text-gray-900">{selectedProduct.title}</p>
                    <p className="truncate text-[11px] text-gray-400">{selectedProduct.description}</p>
                  </div>
                  <span className={`rounded-full border px-2 py-0.5 text-[10px] font-bold ${STATUS_COLORS[selectedProduct.status] || STATUS_COLORS.expired}`}>
                    {selectedProduct.status}
                  </span>
                </div>
              )}

              {/* Pricing */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-1 block text-[11px] font-bold uppercase tracking-wider text-gray-400">Regular Price ৳</label>
                  <input required type="number" value={form.originalPrice} onChange={set("originalPrice")}
                    className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm outline-none focus:border-brand" />
                </div>
                <div>
                  <label className="mb-1 block text-[11px] font-bold uppercase tracking-wider text-brand">D-Bloc Price ৳</label>
                  <input required type="number" value={form.blocPrice} onChange={set("blocPrice")}
                    className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm outline-none focus:border-brand" />
                </div>
              </div>

              {/* Stock + Goal */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-1 block text-[11px] font-bold uppercase tracking-wider text-gray-400">📦 Stock (Capacity)</label>
                  <input required type="number" min="1" value={form.maxSpots} onChange={set("maxSpots")}
                    className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm outline-none focus:border-brand" />
                </div>
                <div>
                  <label className="mb-1 block text-[11px] font-bold uppercase tracking-wider text-gray-400">🎯 Goal (Unlock)</label>
                  <input required type="number" min="1" value={form.goal} onChange={set("goal")}
                    className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm outline-none focus:border-brand" />
                </div>
              </div>
              <p className="-mt-1 text-[11px] text-gray-400">
                D-Bloc price unlocks when real joins reach the <strong className="text-gray-500">goal</strong>. Bloc fills up at <strong className="text-gray-500">stock</strong> capacity.
              </p>

              {/* End time */}
              <div>
                <label className="mb-1 block text-[11px] font-bold uppercase tracking-wider text-gray-400">⏱ End Date & Time</label>
                <input required type="datetime-local" value={form.endTime} onChange={set("endTime")}
                  className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm outline-none focus:border-brand" />
              </div>

              <label className="flex items-center gap-2 text-sm font-medium text-gray-600">
                <input type="checkbox" checked={form.featured} onChange={set("featured")} className="accent-brand" />
                Feature on homepage
              </label>
            </div>

            <div className="mt-6 flex gap-3">
              <button type="submit" className="flex-1 rounded-xl bg-brand py-3 text-sm font-bold text-white hover:bg-brand-hover">
                {modal === "new" ? "🚀 Launch Bloc" : "Save Changes"}
              </button>
              <button type="button" onClick={() => setModal(null)} className="rounded-xl border border-gray-200 px-5 py-3 text-sm font-semibold text-gray-500 hover:bg-gray-50">
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
