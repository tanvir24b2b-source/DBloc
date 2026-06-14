import { useState, useRef } from "react";
import { Link } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import api from "../../lib/api.js";
import { formatPrice } from "../../lib/format.js";

const CSV_HEADERS = ["title","description","shortDescription","fullDescription","originalPrice","blocPrice","maxSpots","endTime","category","sku","featured","image","gallery1","gallery2","gallery3","gallery4","gallery5"];
const CSV_EXAMPLE = ["Sample Product","Short one-line description","Tagline / subheading","Full detailed description here","5000","4000","100","2026-12-31","Electronics","SKU-001","false","https://example.com/main.jpg","https://example.com/gallery1.jpg","","","",""];

export default function ManageProducts() {
  const qc = useQueryClient();
  const [search, setSearch] = useState("");
  const [importing, setImporting] = useState(false);
  const [importResult, setImportResult] = useState(null);
  const fileRef = useRef();

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

  function downloadTemplate() {
    const csv = [CSV_HEADERS.join(","), CSV_EXAMPLE.map((v) => `"${v}"`).join(",")].join("\n");
    const a = document.createElement("a");
    a.href = "data:text/csv," + encodeURIComponent(csv);
    a.download = "dbloc-import-template.csv";
    a.click();
  }

  async function handleImport(e) {
    const file = e.target.files[0];
    if (!file) return;
    setImportResult(null);
    setImporting(true);
    try {
      const text = await file.text();
      const { data } = await api.post("/blocs/import-csv", { csv: text });
      setImportResult(data);
      qc.invalidateQueries({ queryKey: ["admin-products"] });
      qc.invalidateQueries({ queryKey: ["admin-blocs"] });
    } catch (err) {
      setImportResult({ error: err.response?.data?.message || "Import failed" });
    } finally {
      setImporting(false);
      fileRef.current.value = "";
    }
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
        <div className="flex items-center gap-2">
          <button onClick={downloadTemplate} className="rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-xs font-bold text-gray-600 hover:bg-gray-50">
            ↓ Template
          </button>
          <button onClick={exportCSV} className="rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-xs font-bold text-gray-600 hover:bg-gray-50">
            ↓ Export CSV
          </button>
          <label className={`cursor-pointer rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-xs font-bold text-gray-600 hover:bg-gray-50 ${importing ? "opacity-50 pointer-events-none" : ""}`}>
            {importing ? "Importing..." : "↑ Import CSV"}
            <input ref={fileRef} type="file" accept=".csv" className="hidden" onChange={handleImport} />
          </label>
          <Link
            to="/admin/products/new"
            className="rounded-xl bg-brand px-5 py-2.5 text-sm font-bold text-white shadow-sm shadow-brand/30 hover:bg-brand-hover"
          >
            + Add Product
          </Link>
        </div>
      </div>

      {/* Import result */}
      {importResult && (
        <div className={`rounded-xl border px-5 py-4 text-sm ${importResult.error ? "border-red-200 bg-red-50 text-red-700" : "border-emerald-200 bg-emerald-50 text-emerald-800"}`}>
          {importResult.error ? (
            <p className="font-semibold">{importResult.error}</p>
          ) : (
            <>
              <p className="font-semibold">{importResult.created} created, {importResult.failed} failed</p>
              {importResult.details?.failed?.length > 0 && (
                <ul className="mt-2 space-y-0.5 text-xs text-red-700">
                  {importResult.details.failed.map((f, i) => (
                    <li key={i}>Row {f.row}{f.title ? ` (${f.title})` : ""}: {f.reason}</li>
                  ))}
                </ul>
              )}
            </>
          )}
          <button onClick={() => setImportResult(null)} className="mt-2 text-xs underline opacity-70 hover:opacity-100">Dismiss</button>
        </div>
      )}

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
