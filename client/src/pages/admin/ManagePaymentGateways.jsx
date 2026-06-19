import { useEffect, useRef, useState } from "react";
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
    { key: "number",       label: "Your Nagad Number", placeholder: "01XXXXXXXXX", type: "text" },
    { key: "instructions", label: "Instructions for Customer", placeholder: "Send money to our Nagad account and enter your TrxID below.", type: "text" },
  ],
  cod: [],
};

const INP = "w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-brand";

function GatewayCard({ gw, onSaved }) {
  const [open, setOpen] = useState(false);
  const [creds, setCreds] = useState(gw.credentials || {});
  const [name, setName] = useState(gw.displayName);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");
  const fileRef = useRef();

  const fields = CREDENTIAL_FIELDS[gw.type] || [];

  async function toggle(field, value) {
    setBusy(true);
    try {
      const { data } = await api.put(`/admin/payment-gateways/${gw._id}`, { [field]: value });
      onSaved(data.gateway);
    } finally { setBusy(false); }
  }

  async function saveSettings(e) {
    e.preventDefault();
    setBusy(true); setMsg("");
    try {
      const { data } = await api.put(`/admin/payment-gateways/${gw._id}`, { displayName: name, credentials: creds });
      onSaved(data.gateway);
      setMsg("✓ Saved");
      setTimeout(() => setMsg(""), 2000);
    } catch {
      setMsg("Failed to save");
    } finally { setBusy(false); }
  }

  function handleLogo(e) {
    const file = e.target.files[0];
    if (!file) return;
    e.target.value = "";
    const ALLOWED = ["image/jpeg", "image/png", "image/webp", "image/svg+xml"];
    if (!ALLOWED.includes(file.type)) { setMsg("Logo must be JPG, PNG, WebP or SVG"); return; }
    if (file.size > 150 * 1024) { setMsg("Logo must be under 150 KB"); return; }
    const reader = new FileReader();
    reader.onload = (ev) => setCreds((c) => ({ ...c, logo: ev.target.result }));
    reader.readAsDataURL(file);
  }

  const logo = creds.logo || gw.credentials?.logo;
  const ICONS = { sslcommerz: "💳", bkash: "🟣", bkashmanual: "💜", nagad: "🟠", cod: "💵" };

  return (
    <div className={`rounded-2xl border bg-white shadow-sm overflow-hidden ${gw.enabled ? "border-brand/30" : "border-gray-200"}`}>
      <div className="flex items-center gap-4 px-5 py-4">
        {/* Logo / icon */}
        <div className="h-12 w-12 shrink-0 overflow-hidden rounded-xl border border-gray-100 bg-gray-50 flex items-center justify-center">
          {logo
            ? <img src={logo} alt={name} className="h-full w-full object-contain p-1" />
            : <span className="text-2xl">{ICONS[gw.type] || "💳"}</span>
          }
        </div>
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
          <button
            disabled={busy || gw.isDefault}
            onClick={() => toggle("enabled", !gw.enabled)}
            title={gw.isDefault ? "Default gateway cannot be disabled" : ""}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${gw.enabled ? "bg-brand" : "bg-gray-300"} disabled:opacity-50`}
          >
            <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${gw.enabled ? "translate-x-6" : "translate-x-1"}`} />
          </button>
          {!gw.isDefault && gw.enabled && (
            <button disabled={busy} onClick={() => toggle("isDefault", true)}
              className="text-xs text-gray-500 hover:text-brand font-semibold border border-gray-200 rounded-lg px-2 py-1 transition">
              Set Default
            </button>
          )}
          <button onClick={() => setOpen((o) => !o)} className="text-xs text-brand hover:underline font-semibold">
            {open ? "Hide" : "Settings"}
          </button>
        </div>
      </div>

      {open && (
        <form onSubmit={saveSettings} className="border-t border-gray-100 bg-orange-50 px-5 py-4 space-y-3">
          {/* Display name */}
          <div>
            <label className="block text-[10px] font-semibold uppercase text-gray-400 mb-1">Display Name (shown to customers)</label>
            <input type="text" value={name} onChange={(e) => setName(e.target.value)}
              className={INP} placeholder="e.g. bKash Personal" />
          </div>

          {/* Logo upload */}
          <div>
            <label className="block text-[10px] font-semibold uppercase text-gray-400 mb-1">Logo — recommended 48 × 48 px square PNG</label>
            <div className="flex items-center gap-3">
              <div className="h-12 w-12 shrink-0 overflow-hidden rounded-lg border-2 border-dashed border-gray-300 bg-white flex items-center justify-center">
                {logo
                  ? <img src={logo} alt="logo" className="h-full w-full object-contain p-1" />
                  : <span className="text-xs text-gray-400">Logo</span>
                }
              </div>
              <div className="flex gap-2">
                <button type="button" onClick={() => fileRef.current?.click()}
                  className="rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-xs font-semibold text-gray-700 hover:border-brand hover:text-brand">
                  Upload Logo
                </button>
                {logo && (
                  <button type="button" onClick={() => setCreds((c) => ({ ...c, logo: "" }))}
                    className="rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-xs font-semibold text-red-500 hover:border-red-300">
                    Remove
                  </button>
                )}
              </div>
              <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleLogo} />
            </div>
          </div>

          {/* Credential fields (API keys, number, etc.) */}
          {fields.length > 0 && (
            <div className="space-y-3 border-t border-gray-200 pt-3">
              <p className="text-[10px] font-bold uppercase text-gray-400">{["bkashmanual", "nagad"].includes(gw.type) ? "Payment Details" : "API Credentials"}</p>
              {["sslcommerz", "bkash"].includes(gw.type) && (
                <p className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
                  API keys for this gateway must be set in the server <code>.env</code> file — they are never stored in the database.
                </p>
              )}
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
            </div>
          )}

          {msg && <p className={`text-xs ${msg.startsWith("✓") ? "text-green-600" : "text-red-500"}`}>{msg}</p>}
          <button type="submit" disabled={busy} className="rounded-lg bg-brand px-4 py-2 text-sm font-semibold text-white disabled:opacity-50">
            {busy ? "Saving..." : "Save"}
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
