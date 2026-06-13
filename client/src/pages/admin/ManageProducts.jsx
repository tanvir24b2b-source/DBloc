import { useState } from "react";
import { Link } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import api from "../../lib/api.js";
import { formatPrice } from "../../lib/format.js";

export default function ManageProducts() {
  const qc = useQueryClient();
  const [search, setSearch] = useState("");

  const { data: blocs = [], isLoading } = useQuery({
    queryKey: ["admin-products"],
    queryFn: () => api.get("/blocs").then((r) => r.data),
  });

  const filtered = blocs.filter((b) =>
    !search || b.title.toLowerCase().includes(search.toLowerCase()) || b.sku?.toLowerCase().includes(search.toLowerCase())
  );

  async function remove(id) {
    if (!confirm("Delete this product?")) return;
    await api.delete(`/blocs/${id}`);
    qc.invalidateQueries({ queryKey: ["admin-products"] });
    qc.invalidateQueries({ queryKey: ["admin-blocs"] });
  }

  function exportCSV() {
    const headers = ["title", "sku", "originalPrice", "blocPrice", "maxSpots", "filledSpots", "status"];
    const rows = blocs.map((b) => headers.map((h) => JSON.stringify(b[h] ?? "")).join(","));
    const csv = [headers.join(","), ...rows].join("\n");
    const a = document.createElement("a");
    a.href = "data:text/csv," + encodeURIComponent(csv);
    a.download = "dbloc-products.csv";
    a.click();
  }

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-extrabold tracking-tight text-gray-900">Products</h1>
          <p className="mt-0.5 text-sm text-gray-500">{blocs.length} products in catalog</p>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={exportCSV} className="rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-xs font-bold text-gray-600 hover:bg-gray-50">
            ↓ Export CSV
          </button>
          <Link
            to="/admin/products/new"
            className="rounded-xl bg-brand px-5 py-2.5 text-sm font-bold text-white shadow-sm shadow-brand/30 hover:bg-brand-hover"
          >
            + Add Product
          </Link>
        </div>
      </div>

      {/* Search + filter bar */}
      <div className="flex items-center gap-3 rounded-xl border border-gray-200 bg-white px-4 py-2">
        <span className="text-gray-400">⌕</span>
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by title or SKU..."
          className="flex-1 bg-transparent py-1 text-sm outline-none placeholder-gray-400"
        />
        {search && <button onClick={() => setSearch("")} className="text-xs text-gray-400 hover:text-gray-600">✕</button>}
      </div>

      {/* Table */}
      <div className="rounded-2xl border border-gray-200 bg-white overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-100 text-left text-[11px] font-bold uppercase tracking-wider text-gray-400">
              <th className="px-5 py-3">Product</th>
              <th className="px-5 py-3">SKU</th>
              <th className="px-5 py-3">Price</th>
              <th className="px-5 py-3">Spots</th>
              <th className="px-5 py-3">Status</th>
              <th className="px-5 py-3"></th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr><td colSpan={6} className="px-5 py-10 text-center text-sm text-gray-400">Loading...</td></tr>
            ) : filtered.length === 0 ? (
              <tr><td colSpan={6} className="px-5 py-10 text-center text-sm text-gray-400">No products found.</td></tr>
            ) : filtered.map((b) => (
              <tr key={b._id} className="border-b border-gray-50 last:border-0 hover:bg-gray-50/50">
                <td className="px-5 py-3">
                  <div className="flex items-center gap-3">
                    <img
                      src={b.image || `https://picsum.photos/seed/${b._id}/80/80`}
                      alt=""
                      className="h-10 w-10 rounded-lg object-cover border border-gray-100"
                    />
                    <div>
                      <p className="font-semibold text-gray-900">{b.title}</p>
                      <p className="text-[11px] text-gray-400 line-clamp-1">{b.description}</p>
                    </div>
                  </div>
                </td>
                <td className="px-5 py-3 font-mono text-xs text-gray-500">{b.sku || "—"}</td>
                <td className="px-5 py-3">
                  <p className="font-bold text-brand">৳{formatPrice(b.blocPrice)}</p>
                  <p className="text-[11px] text-gray-400 line-through">৳{formatPrice(b.originalPrice)}</p>
                </td>
                <td className="px-5 py-3 text-xs text-gray-500">{b.filledSpots}/{b.maxSpots}</td>
                <td className="px-5 py-3">
                  <span className={`rounded-full border px-2.5 py-0.5 text-[11px] font-bold ${
                    b.status === "active" ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                    : b.hidden ? "border-gray-200 bg-gray-100 text-gray-500"
                    : "border-gray-200 bg-gray-100 text-gray-500"
                  }`}>
                    {b.hidden ? "hidden" : b.status}
                  </span>
                </td>
                <td className="px-5 py-3 text-right">
                  <Link to={`/admin/products/${b._id}`} className="mr-3 text-xs font-semibold text-brand hover:underline">Edit</Link>
                  <button onClick={() => remove(b._id)} className="text-xs font-semibold text-red-400 hover:underline">Delete</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
