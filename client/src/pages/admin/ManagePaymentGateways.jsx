import { useEffect, useState } from "react";
import api from "../../lib/api.js";

const CREDENTIAL_FIELDS = {
  sslcommerz: [
    { key: "storeId",   label: "Store ID" },
    { key: "storePass", label: "Store Password" },
  ],
  bkash: [
    { key: "appKey",    label: "App Key" },
    { key: "appSecret", label: "App Secret" },
    { key: "username",  label: "Username" },
    { key: "password",  label: "Password" },
  ],
  bkashmanual: [
    { key: "number",       label: "Your bKash Number", placeholder: "01XXXXXXXXX", type: "text" },
    { key: "instructions", label: "Instructions for Customer", placeholder: "Send money to our bKash account and enter your TrxID below.", type: "text" },
  ],
  nagad: [
    { key: "merchantId",  label: "Merchant ID" },
    { key: "merchantKey", label: "Merchant Key" },
  ],
  cod: [],
};

const INP = "w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-brand";

function GatewayCard({ gw, onSaved }) {
  const [open, setOpen] = useState(false);
  const [creds, setCreds] = useState(gw.credentials || {});
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");

  const fields = CREDENTIAL_FIELDS[gw.type] || [];

  async function toggle(field, value) {
    setBusy(true);
    try {
      const { data } = await api.put(`/admin/payment-gateways/${gw._id}`, { [field]: value });
      onSaved(data.gateway);
    } finally { setBusy(false); }
  }

  async function saveCredentials(e) {
    e.preventDefault();
    setBusy(true); setMsg("");
    try {
      const { data } = await api.put(`/admin/payment-gateways/${gw._id}`, { credentials: creds });
      onSaved(data.gateway);
      setMsg("✓ Saved");
      setTimeout(() => setMsg(""), 2000);
    } catch {
      setMsg("Failed to save");
    } finally { setBusy(false); }
  }

  const ICONS = { sslcommerz: "💳", bkash: "🟣", bkashmanual: "💜", nagad: "🟠", cod: "💵" };

  return (
    <div className={`rounded-2xl border bg-white shadow-sm overflow-hidden ${gw.enabled ? "border-brand/30" : "border-gray-200"}`}>
      <div className="flex items-center gap-4 px-5 py-4">
        <span className="text-2xl">{ICONS[gw.type] || "💳"}</span>
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-gray-900">{gw.displayName}</p>
          <div className="flex gap-2 mt-1 flex-wrap">
            {gw.isDefault && (
              <span className="rounded-full bg-brand/10 px-2 py-0.5 text-[10px] font-bold text-brand uppercase tracking-wide">Default</span>
            )}
            <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${gw.enabled ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"}`}>
              {gw.enabled ? "Enabled" : "Disabled"}
            </span>
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {/* Enable toggle */}
          <button
            disabled={busy || gw.isDefault}
            onClick={() => toggle("enabled", !gw.enabled)}
            title={gw.isDefault ? "Default gateway cannot be disabled" : ""}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${gw.enabled ? "bg-brand" : "bg-gray-300"} disabled:opacity-50`}
          >
            <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${gw.enabled ? "translate-x-6" : "translate-x-1"}`} />
          </button>
          {/* Set default */}
          {!gw.isDefault && gw.enabled && (
            <button
              disabled={busy}
              onClick={() => toggle("isDefault", true)}
              className="text-xs text-gray-500 hover:text-brand font-semibold border border-gray-200 rounded-lg px-2 py-1 transition"
            >
              Set Default
            </button>
          )}
          {/* Credentials expand */}
          {fields.length > 0 && (
            <button onClick={() => setOpen((o) => !o)} className="text-xs text-brand hover:underline font-semibold">
              {open ? "Hide" : "Credentials"}
            </button>
          )}
        </div>
      </div>

      {open && fields.length > 0 && (
        <form onSubmit={saveCredentials} className="border-t border-gray-100 bg-orange-50 px-5 py-4 space-y-3">
          <p className="text-xs font-bold text-gray-700">{gw.type === "bkashmanual" ? "Payment Settings" : "API Credentials"}</p>
          {fields.map(({ key, label, placeholder, type: ftype }) => (
            <div key={key}>
              <label className="block text-[10px] font-semibold uppercase text-gray-400 mb-1">{label}</label>
              <input
                type={ftype || "password"}
                placeholder={placeholder || `Enter ${label}`}
                value={creds[key] || ""}
                onChange={(e) => setCreds((c) => ({ ...c, [key]: e.target.value }))}
                className={INP}
              />
            </div>
          ))}
          {msg && <p className={`text-xs ${msg.startsWith("✓") ? "text-green-600" : "text-red-500"}`}>{msg}</p>}
          <button type="submit" disabled={busy} className="rounded-lg bg-brand px-4 py-2 text-sm font-semibold text-white disabled:opacity-50">
            {busy ? "Saving..." : "Save Credentials"}
          </button>
        </form>
      )}
    </div>
  );
}

export default function ManagePaymentGateways() {
  const [gateways, setGateways] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [newGw, setNewGw] = useState({ type: "", displayName: "" });
  const [addBusy, setAddBusy] = useState(false);

  useEffect(() => {
    api.get("/admin/payment-gateways").then(({ data }) => {
      setGateways(data.gateways);
      setLoading(false);
    });
  }, []);

  function onSaved(updated) {
    setGateways((prev) => prev.map((g) =>
      g._id === updated._id ? updated :
      updated.isDefault ? { ...g, isDefault: false } : g
    ));
  }

  async function addCustom(e) {
    e.preventDefault();
    setAddBusy(true);
    try {
      const { data } = await api.post("/admin/payment-gateways", newGw);
      setGateways((prev) => [...prev, data.gateway]);
      setNewGw({ type: "", displayName: "" });
      setShowAdd(false);
    } catch (err) {
      alert(err.response?.data?.message || "Failed to add gateway");
    } finally { setAddBusy(false); }
  }

  if (loading) return <div className="p-8 text-sm text-gray-400">Loading...</div>;

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Payment Gateways</h1>
          <p className="text-sm text-gray-500 mt-0.5">Enable gateways and set which one is shown by default at checkout.</p>
        </div>
        <button onClick={() => setShowAdd((o) => !o)} className="rounded-lg bg-brand px-4 py-2 text-sm font-semibold text-white hover:bg-brand-hover">
          + Add Gateway
        </button>
      </div>

      {showAdd && (
        <form onSubmit={addCustom} className="rounded-2xl border border-brand/20 bg-orange-50 p-5 space-y-3">
          <p className="text-sm font-bold text-gray-800">Add Custom Gateway</p>
          <div>
            <label className="block text-[10px] font-semibold uppercase text-gray-400 mb-1">Gateway Type (slug, no spaces)</label>
            <input required placeholder="e.g. upay" value={newGw.type} onChange={(e) => setNewGw((n) => ({ ...n, type: e.target.value.toLowerCase().replace(/\s/g, "_") }))} className={INP} />
          </div>
          <div>
            <label className="block text-[10px] font-semibold uppercase text-gray-400 mb-1">Display Name</label>
            <input required placeholder="e.g. uPay" value={newGw.displayName} onChange={(e) => setNewGw((n) => ({ ...n, displayName: e.target.value }))} className={INP} />
          </div>
          <div className="flex gap-2">
            <button type="submit" disabled={addBusy} className="rounded-lg bg-brand px-4 py-2 text-sm font-semibold text-white disabled:opacity-50">{addBusy ? "Adding..." : "Add"}</button>
            <button type="button" onClick={() => setShowAdd(false)} className="rounded-lg border border-gray-200 px-4 py-2 text-sm text-gray-500">Cancel</button>
          </div>
        </form>
      )}

      <div className="space-y-3">
        {gateways.map((gw) => (
          <GatewayCard key={gw._id} gw={gw} onSaved={onSaved} />
        ))}
      </div>
    </div>
  );
}
