import { useEffect, useState } from "react";
import api from "../../lib/api.js";

const INP = "w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-brand";

export default function ManageCouriers() {
  const [form, setForm] = useState(null);
  const [loadErr, setLoadErr] = useState(false);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg]   = useState("");

  useEffect(() => {
    api.get("/admin/courier-settings")
      .then(({ data }) => setForm(data))
      .catch(() => setLoadErr(true));
  }, []);

  function set(key, value) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function save(e) {
    e.preventDefault();
    setBusy(true); setMsg("");
    try {
      await api.put("/admin/courier-settings", form);
      setMsg("✓ Saved");
      setTimeout(() => setMsg(""), 2500);
    } catch {
      setMsg("Failed to save");
    } finally { setBusy(false); }
  }

  if (loadErr) return <div className="p-8 text-sm text-red-400">Failed to load courier settings. Check server connection.</div>;
  if (!form) return <div className="p-8 text-sm text-gray-400">Loading...</div>;

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-xl font-bold text-gray-900">Courier Settings</h1>
        <p className="text-sm text-gray-500 mt-0.5">Configure delivery charges and courier API credentials.</p>
      </div>

      <form onSubmit={save} className="space-y-5">

        {/* Delivery Charges */}
        <div className="rounded-2xl border border-gray-200 bg-white p-5 space-y-4">
          <p className="text-sm font-bold text-gray-800">Delivery Charges</p>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-[10px] font-semibold uppercase text-gray-400 mb-1">Inside Dhaka (৳)</label>
              <input type="number" min="0" value={form.insideDhakaCharge}
                onChange={(e) => set("insideDhakaCharge", Number(e.target.value))} className={INP} />
            </div>
            <div>
              <label className="block text-[10px] font-semibold uppercase text-gray-400 mb-1">Outside Dhaka (৳)</label>
              <input type="number" min="0" value={form.outsideDhakaCharge}
                onChange={(e) => set("outsideDhakaCharge", Number(e.target.value))} className={INP} />
            </div>
          </div>

          <label className="flex items-center gap-3 cursor-pointer">
            <div
              onClick={() => set("freeDeliveryAll", !form.freeDeliveryAll)}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${form.freeDeliveryAll ? "bg-brand" : "bg-gray-300"}`}
            >
              <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${form.freeDeliveryAll ? "translate-x-6" : "translate-x-1"}`} />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-800">Site-wide Free Delivery</p>
              <p className="text-[11px] text-gray-400">Overrides all charges — every product ships free</p>
            </div>
          </label>
        </div>

        {/* Default Courier */}
        <div className="rounded-2xl border border-gray-200 bg-white p-5 space-y-3">
          <p className="text-sm font-bold text-gray-800">Default Courier</p>
          <div className="flex gap-3">
            {["steadfast", "pathao"].map((c) => (
              <label key={c} className={`flex items-center gap-2 rounded-lg border px-4 py-2.5 cursor-pointer transition ${form.defaultCourier === c ? "border-brand bg-orange-50" : "border-gray-200"}`}>
                <input type="radio" name="defaultCourier" value={c} checked={form.defaultCourier === c}
                  onChange={() => set("defaultCourier", c)} className="accent-brand" />
                <span className="text-sm font-medium capitalize">{c}</span>
              </label>
            ))}
          </div>
        </div>

        {/* Steadfast */}
        <div className={`rounded-2xl border bg-white p-5 space-y-3 ${form.steadfastEnabled ? "border-brand/30" : "border-gray-200"}`}>
          <div className="flex items-center justify-between">
            <p className="text-sm font-bold text-gray-800">Steadfast</p>
            <button type="button"
              onClick={() => set("steadfastEnabled", !form.steadfastEnabled)}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${form.steadfastEnabled ? "bg-brand" : "bg-gray-300"}`}
            >
              <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${form.steadfastEnabled ? "translate-x-6" : "translate-x-1"}`} />
            </button>
          </div>
          <div>
            <label className="block text-[10px] font-semibold uppercase text-gray-400 mb-1">API Key</label>
            <input type="text" value={form.steadfastApiKey}
              onChange={(e) => set("steadfastApiKey", e.target.value)}
              placeholder="Enter Steadfast API Key" className={INP} />
          </div>
          <div>
            <label className="block text-[10px] font-semibold uppercase text-gray-400 mb-1">Secret Key</label>
            <input type="password" value={form.steadfastSecretKey}
              onChange={(e) => set("steadfastSecretKey", e.target.value)}
              placeholder="Enter Steadfast Secret Key" className={INP} />
          </div>
        </div>

        {/* Pathao */}
        <div className={`rounded-2xl border bg-white p-5 space-y-3 ${form.pathaoEnabled ? "border-brand/30" : "border-gray-200"}`}>
          <div className="flex items-center justify-between">
            <p className="text-sm font-bold text-gray-800">Pathao</p>
            <button type="button"
              onClick={() => set("pathaoEnabled", !form.pathaoEnabled)}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${form.pathaoEnabled ? "bg-brand" : "bg-gray-300"}`}
            >
              <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${form.pathaoEnabled ? "translate-x-6" : "translate-x-1"}`} />
            </button>
          </div>
          <div>
            <label className="block text-[10px] font-semibold uppercase text-gray-400 mb-1">API Key (Client ID)</label>
            <input type="text" value={form.pathaoApiKey}
              onChange={(e) => set("pathaoApiKey", e.target.value)}
              placeholder="Enter Pathao Client ID" className={INP} />
          </div>
          <div>
            <label className="block text-[10px] font-semibold uppercase text-gray-400 mb-1">Secret Key (Client Secret)</label>
            <input type="password" value={form.pathaoSecretKey}
              onChange={(e) => set("pathaoSecretKey", e.target.value)}
              placeholder="Enter Pathao Client Secret" className={INP} />
          </div>
        </div>

        {msg && <p className={`text-sm ${msg.startsWith("✓") ? "text-green-600" : "text-red-500"}`}>{msg}</p>}
        <button type="submit" disabled={busy}
          className="rounded-xl bg-brand px-6 py-2.5 text-sm font-bold text-white hover:bg-brand-hover disabled:opacity-50">
          {busy ? "Saving..." : "Save Settings"}
        </button>
      </form>
    </div>
  );
}
