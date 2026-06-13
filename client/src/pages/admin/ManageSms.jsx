import { useEffect, useState } from "react";
import api from "../../lib/api.js";

const INP = "w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-brand bg-white";
const LABEL = "block text-[10px] font-semibold uppercase tracking-wide text-gray-400 mb-1";

const TEMPLATE_LABELS = {
  orderConfirmed:    { label: "Order Confirmed", vars: ["name", "orderId", "amount"] },
  orderShipped:      { label: "Order Shipped",   vars: ["name", "orderId"] },
  orderDelivered:    { label: "Order Delivered", vars: ["name", "orderId"] },
  otpForgotPassword: { label: "Forgot Password OTP", vars: ["otp"] },
};

const PROVIDERS = [
  { value: "revesms", label: "REVE SMS", url: "https://revesms.com/api/v2/SendSMS" },
  { value: "custom",  label: "Custom / Other", url: "" },
];

export default function ManageSms() {
  const [s, setS] = useState(null);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");
  const [testMobile, setTestMobile] = useState("");
  const [testBusy, setTestBusy] = useState(false);
  const [testMsg, setTestMsg] = useState("");
  const [activeTab, setActiveTab] = useState("connection");

  useEffect(() => {
    api.get("/admin/sms").then(({ data }) => setS(data.settings));
  }, []);

  function set(key, val) {
    setS((prev) => ({ ...prev, [key]: val }));
  }

  function setTemplate(key, val) {
    setS((prev) => ({ ...prev, templates: { ...prev.templates, [key]: val } }));
  }

  function selectProvider(value) {
    const def = PROVIDERS.find((p) => p.value === value);
    setS((prev) => ({ ...prev, provider: value, apiUrl: def?.url || prev.apiUrl }));
  }

  async function save(e) {
    e.preventDefault();
    setBusy(true); setMsg("");
    try {
      await api.put("/admin/sms", s);
      setMsg("✓ Settings saved");
      setTimeout(() => setMsg(""), 2500);
    } catch {
      setMsg("Failed to save");
    } finally { setBusy(false); }
  }

  async function sendTest(e) {
    e.preventDefault();
    setTestBusy(true); setTestMsg("");
    try {
      await api.post("/admin/sms/test", { mobile: testMobile });
      setTestMsg("✓ Test SMS sent — check your phone");
    } catch (err) {
      setTestMsg(err.response?.data?.message || "Failed to send test SMS");
    } finally { setTestBusy(false); }
  }

  if (!s) return <div className="p-8 text-sm text-gray-400">Loading...</div>;

  const TAB = (id, label) => (
    <button
      onClick={() => setActiveTab(id)}
      className={`px-4 py-2 text-sm font-semibold rounded-lg transition ${activeTab === id ? "bg-brand text-white" : "text-gray-500 hover:text-gray-800"}`}
    >{label}</button>
  );

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">SMS Notifications</h1>
          <p className="text-sm text-gray-500 mt-0.5">Connect any SMS provider and control notification messages.</p>
        </div>
        {/* Master enable toggle */}
        <label className="flex items-center gap-2 cursor-pointer">
          <span className="text-sm font-semibold text-gray-700">{s.enabled ? "Enabled" : "Disabled"}</span>
          <button
            type="button"
            onClick={() => set("enabled", !s.enabled)}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${s.enabled ? "bg-brand" : "bg-gray-300"}`}
          >
            <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${s.enabled ? "translate-x-6" : "translate-x-1"}`} />
          </button>
        </label>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-100 rounded-xl p-1">
        {TAB("connection", "Connection")}
        {TAB("templates", "SMS Templates")}
        {TAB("test", "Send Test")}
      </div>

      <form onSubmit={save} className="space-y-4">
        {/* CONNECTION TAB */}
        {activeTab === "connection" && (
          <div className="rounded-2xl border border-gray-200 bg-white p-6 space-y-4">
            <div>
              <label className={LABEL}>SMS Provider</label>
              <select value={s.provider} onChange={(e) => selectProvider(e.target.value)} className={INP}>
                {PROVIDERS.map((p) => <option key={p.value} value={p.value}>{p.label}</option>)}
              </select>
            </div>
            <div>
              <label className={LABEL}>API Endpoint URL</label>
              <input value={s.apiUrl} onChange={(e) => set("apiUrl", e.target.value)} placeholder="https://provider.com/api/SendSMS" className={INP} />
              {s.provider === "revesms" && (
                <p className="mt-1 text-[11px] text-gray-400">Pre-filled for REVE SMS. Get your API key from revesms.com dashboard.</p>
              )}
            </div>
            <div>
              <label className={LABEL}>API Key</label>
              <input type="password" value={s.apiKey} onChange={(e) => set("apiKey", e.target.value)} placeholder="Enter your API key" className={INP} />
            </div>
            <div>
              <label className={LABEL}>Sender ID / Sender Name</label>
              <input value={s.senderId} onChange={(e) => set("senderId", e.target.value)} placeholder="e.g. DBLOC" className={INP} />
            </div>

            {/* Custom field mapping — only show for custom providers */}
            {s.provider === "custom" && (
              <div className="rounded-xl bg-gray-50 p-4 space-y-3">
                <p className="text-xs font-bold text-gray-700">API Parameter Names</p>
                <p className="text-[11px] text-gray-500">Match the parameter names your provider expects in the URL query string.</p>
                {[
                  ["apiKeyField",   "API Key field name",    "apikey"],
                  ["senderField",   "Sender ID field name",  "senderid"],
                  ["numberField",   "Phone number field name","number"],
                  ["messageField",  "Message field name",    "message"],
                ].map(([key, label, ph]) => (
                  <div key={key}>
                    <label className={LABEL}>{label}</label>
                    <input value={s[key] || ""} onChange={(e) => set(key, e.target.value)} placeholder={ph} className={INP} />
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* TEMPLATES TAB */}
        {activeTab === "templates" && (
          <div className="space-y-4">
            {Object.entries(TEMPLATE_LABELS).map(([key, { label, vars }]) => (
              <div key={key} className="rounded-2xl border border-gray-200 bg-white p-5 space-y-2">
                <p className="text-sm font-bold text-gray-800">{label}</p>
                <p className="text-[11px] text-gray-400">
                  Available placeholders: {vars.map((v) => <code key={v} className="mx-0.5 rounded bg-gray-100 px-1 text-brand">{`{{${v}}}`}</code>)}
                </p>
                <textarea
                  rows={3}
                  value={s.templates?.[key] || ""}
                  onChange={(e) => setTemplate(key, e.target.value)}
                  className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-brand resize-none"
                />
                <p className="text-[10px] text-gray-400 text-right">{s.templates?.[key]?.length || 0} chars</p>
              </div>
            ))}
          </div>
        )}

        {msg && <p className={`text-sm ${msg.startsWith("✓") ? "text-green-600" : "text-red-500"}`}>{msg}</p>}

        {activeTab !== "test" && (
          <button type="submit" disabled={busy} className="rounded-lg bg-brand px-6 py-2.5 text-sm font-semibold text-white hover:bg-brand-hover disabled:opacity-50">
            {busy ? "Saving..." : "Save Settings"}
          </button>
        )}
      </form>

      {/* TEST TAB */}
      {activeTab === "test" && (
        <form onSubmit={sendTest} className="rounded-2xl border border-gray-200 bg-white p-6 space-y-4">
          <p className="text-sm font-bold text-gray-800">Send a Test SMS</p>
          <p className="text-[11px] text-gray-500">Sends a sample "Order Confirmed" message to verify your connection is working.</p>
          <div>
            <label className={LABEL}>Your Mobile Number</label>
            <div className="flex rounded-lg border border-gray-200 overflow-hidden focus-within:border-brand">
              <span className="flex items-center gap-1 bg-gray-100 px-3 text-sm font-semibold text-gray-600 border-r border-gray-200 shrink-0">🇧🇩 +880</span>
              <input
                type="tel" required placeholder="01700000000" value={testMobile}
                onChange={(e) => setTestMobile(e.target.value.replace(/\D/g, "").slice(0, 11))}
                className="flex-1 px-3 py-2 text-sm outline-none"
              />
            </div>
          </div>
          {testMsg && <p className={`text-sm ${testMsg.startsWith("✓") ? "text-green-600" : "text-red-500"}`}>{testMsg}</p>}
          <button type="submit" disabled={testBusy || !s.enabled} className="rounded-lg bg-brand px-6 py-2.5 text-sm font-semibold text-white disabled:opacity-50">
            {testBusy ? "Sending..." : "Send Test SMS"}
          </button>
          {!s.enabled && <p className="text-[11px] text-red-400">Enable SMS above and save first before testing.</p>}
        </form>
      )}
    </div>
  );
}
