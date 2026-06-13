import { useEffect, useState } from "react";
import api from "../../lib/api.js";

const INP = "w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-brand bg-white";
const LABEL = "block text-[10px] font-semibold uppercase tracking-wide text-gray-400 mb-1";

const PRESETS = [
  { name: "EcomDrive",  webhookUrl: "", apiUrl: "", note: "Paste the Order Webhook URL from EcomDrive → Integrations → WooCommerce → Integration URLs & Keys" },
  { name: "Bismation",  webhookUrl: "", apiUrl: "" },
  { name: "Custom CRM", webhookUrl: "", apiUrl: "" },
];

const EMPTY = { name: "", apiUrl: "", apiKey: "", webhookUrl: "", webhookSecret: "", syncOrders: true, syncInventory: false, notes: "" };

function IntegrationCard({ item, onUpdate, onDelete }) {
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(item);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");

  function set(k, v) { setForm((f) => ({ ...f, [k]: v })); }

  async function save(e) {
    e.preventDefault();
    setBusy(true); setMsg("");
    try {
      const { data } = await api.put(`/admin/integrations/${item._id}`, form);
      onUpdate(data.integration);
      setMsg("✓ Saved");
      setTimeout(() => setMsg(""), 2000);
    } catch { setMsg("Failed to save"); }
    finally { setBusy(false); }
  }

  async function toggleEnabled() {
    const { data } = await api.put(`/admin/integrations/${item._id}`, { enabled: !item.enabled });
    onUpdate(data.integration);
  }

  async function del() {
    if (!confirm(`Delete "${item.name}"?`)) return;
    await api.delete(`/admin/integrations/${item._id}`);
    onDelete(item._id);
  }

  return (
    <div className={`rounded-2xl border bg-white shadow-sm overflow-hidden ${item.enabled ? "border-brand/30" : "border-gray-200"}`}>
      <div className="flex items-center gap-4 px-5 py-4">
        <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-gray-100 text-lg font-bold text-gray-500">
          {item.name[0]?.toUpperCase()}
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-gray-900">{item.name}</p>
          {item.apiUrl && <p className="text-[11px] text-gray-400 truncate">{item.apiUrl}</p>}
          <div className="flex gap-2 mt-1 flex-wrap">
            {item.syncOrders    && <span className="rounded-full bg-blue-50 px-2 py-0.5 text-[10px] font-semibold text-blue-600">Orders</span>}
            {item.syncInventory && <span className="rounded-full bg-purple-50 px-2 py-0.5 text-[10px] font-semibold text-purple-600">Inventory</span>}
            <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${item.enabled ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"}`}>
              {item.enabled ? "Active" : "Inactive"}
            </span>
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <button onClick={toggleEnabled}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${item.enabled ? "bg-brand" : "bg-gray-300"}`}>
            <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${item.enabled ? "translate-x-6" : "translate-x-1"}`} />
          </button>
          <button onClick={() => setOpen((o) => !o)} className="text-xs font-semibold text-brand hover:underline">
            {open ? "Close" : "Edit"}
          </button>
          <button onClick={del} className="text-xs text-red-400 hover:text-red-600">✕</button>
        </div>
      </div>

      {open && (
        <form onSubmit={save} className="border-t border-gray-100 bg-orange-50 px-5 py-5 space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2">
              <label className={LABEL}>Integration Name</label>
              <input value={form.name} onChange={(e) => set("name", e.target.value)} className={INP} />
            </div>
            <div className="col-span-2">
              <label className={LABEL}>Order Webhook URL <span className="text-brand normal-case font-normal">(paste from EcomDrive → Integration URLs & Keys)</span></label>
              <input value={form.webhookUrl} onChange={(e) => set("webhookUrl", e.target.value)} placeholder="https://1.ecomdrivebd.com/api/post-web-order?businessId=..." className={INP} />
            </div>
            <div className="col-span-2">
              <label className={LABEL}>API Key / EcomDrive API Key</label>
              <input type="password" value={form.apiKey} onChange={(e) => set("apiKey", e.target.value)} placeholder="Enter API key" className={INP} />
            </div>
            <div className="col-span-2">
              <label className={LABEL}>API Base URL (optional)</label>
              <input value={form.apiUrl} onChange={(e) => set("apiUrl", e.target.value)} placeholder="https://app.example.com/api" className={INP} />
            </div>
          </div>

          <div className="flex gap-4">
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={form.syncOrders} onChange={(e) => set("syncOrders", e.target.checked)} className="accent-brand" />
              <span className="text-sm text-gray-700">Sync Orders</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={form.syncInventory} onChange={(e) => set("syncInventory", e.target.checked)} className="accent-brand" />
              <span className="text-sm text-gray-700">Sync Inventory</span>
            </label>
          </div>

          <div>
            <label className={LABEL}>Notes (optional)</label>
            <textarea rows={2} value={form.notes} onChange={(e) => set("notes", e.target.value)} placeholder="Any notes about this integration..." className={INP + " resize-none"} />
          </div>

          {msg && <p className={`text-xs ${msg.startsWith("✓") ? "text-green-600" : "text-red-500"}`}>{msg}</p>}
          <button type="submit" disabled={busy} className="rounded-lg bg-brand px-5 py-2 text-sm font-semibold text-white disabled:opacity-50">
            {busy ? "Saving..." : "Save Changes"}
          </button>
        </form>
      )}
    </div>
  );
}

export default function ManageIntegrations() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState(EMPTY);
  const [addBusy, setAddBusy] = useState(false);
  const [addMsg, setAddMsg] = useState("");

  useEffect(() => {
    api.get("/admin/integrations").then(({ data }) => {
      setItems(data.integrations);
      setLoading(false);
    });
  }, []);

  function setF(k, v) { setForm((f) => ({ ...f, [k]: v })); }

  function pickPreset(preset) {
    setForm((f) => ({ ...f, name: preset.name, apiUrl: preset.apiUrl || "", webhookUrl: preset.webhookUrl || "" }));
    if (preset.note) alert(preset.note);
  }

  async function add(e) {
    e.preventDefault();
    setAddBusy(true); setAddMsg("");
    try {
      const { data } = await api.post("/admin/integrations", { ...form });
      setItems((prev) => [...prev, data.integration]);
      setForm(EMPTY);
      setShowAdd(false);
    } catch (err) {
      setAddMsg(err.response?.data?.message || "Failed to add");
    } finally { setAddBusy(false); }
  }

  if (loading) return <div className="p-8 text-sm text-gray-400">Loading...</div>;

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Integrations</h1>
          <p className="text-sm text-gray-500 mt-0.5">Connect CRM, order management, or inventory systems.</p>
        </div>
        <button onClick={() => setShowAdd((o) => !o)} className="rounded-lg bg-brand px-4 py-2 text-sm font-semibold text-white hover:bg-brand-hover">
          + Add Integration
        </button>
      </div>

      {showAdd && (
        <div className="rounded-2xl border border-brand/20 bg-orange-50 p-5 space-y-4">
          <p className="text-sm font-bold text-gray-800">Add New Integration</p>

          {/* Quick presets */}
          <div>
            <p className={LABEL}>Quick Select</p>
            <div className="flex gap-2 flex-wrap">
              {PRESETS.map((p) => (
                <button key={p.name} type="button" onClick={() => pickPreset(p)}
                  className="rounded-lg border border-brand/30 bg-white px-3 py-1.5 text-xs font-semibold text-brand hover:bg-brand hover:text-white transition">
                  {p.name}
                </button>
              ))}
            </div>
          </div>

          <form onSubmit={add} className="space-y-3">
            <div>
              <label className={LABEL}>Integration Name *</label>
              <input required value={form.name} onChange={(e) => setF("name", e.target.value)} placeholder="e.g. EcomDrive" className={INP} />
            </div>
            <div>
              <label className={LABEL}>Order Webhook URL <span className="text-brand normal-case font-normal">(from EcomDrive → Integration URLs & Keys)</span></label>
              <input value={form.webhookUrl} onChange={(e) => setF("webhookUrl", e.target.value)} placeholder="https://1.ecomdrivebd.com/api/post-web-order?businessId=..." className={INP} />
            </div>
            <div>
              <label className={LABEL}>API Key / EcomDrive API Key</label>
              <input type="password" value={form.apiKey} onChange={(e) => setF("apiKey", e.target.value)} placeholder="Enter API key" className={INP} />
            </div>
            <div>
              <label className={LABEL}>API Base URL (optional)</label>
              <input value={form.apiUrl} onChange={(e) => setF("apiUrl", e.target.value)} placeholder="https://app.example.com/api" className={INP} />
            </div>
            <div className="flex gap-4">
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={form.syncOrders} onChange={(e) => setF("syncOrders", e.target.checked)} className="accent-brand" />
                <span className="text-sm text-gray-700">Sync Orders</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={form.syncInventory} onChange={(e) => setF("syncInventory", e.target.checked)} className="accent-brand" />
                <span className="text-sm text-gray-700">Sync Inventory</span>
              </label>
            </div>
            <div>
              <label className={LABEL}>Notes (optional)</label>
              <textarea rows={2} value={form.notes} onChange={(e) => setF("notes", e.target.value)} placeholder="Any notes..." className={INP + " resize-none"} />
            </div>
            {addMsg && <p className="text-xs text-red-500">{addMsg}</p>}
            <div className="flex gap-2">
              <button type="submit" disabled={addBusy} className="rounded-lg bg-brand px-5 py-2 text-sm font-semibold text-white disabled:opacity-50">
                {addBusy ? "Adding..." : "Add Integration"}
              </button>
              <button type="button" onClick={() => setShowAdd(false)} className="rounded-lg border border-gray-200 px-4 py-2 text-sm text-gray-500">Cancel</button>
            </div>
          </form>
        </div>
      )}

      {items.length === 0 && !showAdd && (
        <div className="rounded-2xl border border-dashed border-gray-300 bg-white py-12 text-center">
          <p className="text-sm font-semibold text-gray-500">No integrations yet</p>
          <p className="text-xs text-gray-400 mt-1">Click "+ Add Integration" to connect EcomDrive, Bismation, or any CRM.</p>
        </div>
      )}

      <div className="space-y-3">
        {items.map((item) => (
          <IntegrationCard
            key={item._id}
            item={item}
            onUpdate={(updated) => setItems((prev) => prev.map((i) => i._id === updated._id ? updated : i))}
            onDelete={(id) => setItems((prev) => prev.filter((i) => i._id !== id))}
          />
        ))}
      </div>
    </div>
  );
}
