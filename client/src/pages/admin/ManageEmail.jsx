import { useEffect, useState } from "react";
import api from "../../lib/api.js";

const INP = "w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-brand bg-white";
const LABEL = "block text-[10px] font-semibold uppercase tracking-wide text-gray-400 mb-1";

const TEMPLATE_LABELS = {
  orderConfirmed:   { label: "Order Confirmed",     vars: ["name", "orderId", "amount"] },
  orderShipped:     { label: "Order Shipped",        vars: ["name", "orderId"] },
  orderDelivered:   { label: "Order Delivered",      vars: ["name", "orderId"] },
  passwordResetOtp: { label: "Password Reset OTP",   vars: ["name", "otp"] },
};

export default function ManageEmail() {
  const [s, setS] = useState(null);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");
  const [testEmail, setTestEmail] = useState("");
  const [testBusy, setTestBusy] = useState(false);
  const [testMsg, setTestMsg] = useState("");
  const [activeTab, setActiveTab] = useState("connection");

  useEffect(() => {
    api.get("/admin/email").then(({ data }) => setS(data.settings));
  }, []);

  function set(key, val) {
    setS((prev) => ({ ...prev, [key]: val }));
  }

  function setTemplate(key, val) {
    setS((prev) => ({ ...prev, templates: { ...prev.templates, [key]: val } }));
  }

  async function save(e) {
    e.preventDefault();
    setBusy(true); setMsg("");
    try {
      await api.put("/admin/email", s);
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
      await api.post("/admin/email/test", { to: testEmail });
      setTestMsg("✓ Test email sent — check your inbox");
    } catch (err) {
      setTestMsg(err.response?.data?.message || "Failed to send test email");
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
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Email Notifications</h1>
          <p className="text-sm text-gray-500 mt-0.5">Connect your hosting SMTP and control notification emails.</p>
        </div>
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

      <div className="flex gap-1 bg-gray-100 rounded-xl p-1">
        {TAB("connection", "Connection")}
        {TAB("templates", "Email Templates")}
        {TAB("test", "Send Test")}
      </div>

      <form onSubmit={save} className="space-y-4">
        {activeTab === "connection" && (
          <div className="rounded-2xl border border-gray-200 bg-white p-6 space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className={LABEL}>SMTP Host</label>
                <input value={s.host} onChange={(e) => set("host", e.target.value)} placeholder="mail.dbloc.com.bd" className={INP} />
              </div>
              <div>
                <label className={LABEL}>Port</label>
                <input type="number" value={s.port} onChange={(e) => set("port", Number(e.target.value))} placeholder="465" className={INP} />
              </div>
            </div>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => set("secure", !s.secure)}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${s.secure ? "bg-brand" : "bg-gray-300"}`}
              >
                <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${s.secure ? "translate-x-6" : "translate-x-1"}`} />
              </button>
              <span className="text-sm text-gray-700">Use SSL (port 465) — turn off for TLS/STARTTLS (port 587)</span>
            </div>
            <div>
              <label className={LABEL}>Email Address (Username)</label>
              <input type="email" value={s.user} onChange={(e) => set("user", e.target.value)} placeholder="noreply@dbloc.com.bd" className={INP} />
            </div>
            <div>
              <label className={LABEL}>Password</label>
              <input type="password" value={s.pass} onChange={(e) => set("pass", e.target.value)} placeholder="Your email password" className={INP} />
            </div>
            <div>
              <label className={LABEL}>From Name</label>
              <input value={s.fromName} onChange={(e) => set("fromName", e.target.value)} placeholder="D BLOC" className={INP} />
            </div>
            <div className="rounded-xl bg-blue-50 border border-blue-200 px-4 py-3 text-xs text-blue-700 space-y-1">
              <p className="font-bold">How to get these from Exon Host:</p>
              <p>cPanel → Email Accounts → Create email → Connect Devices → copy SMTP Host, Port, Username, Password</p>
            </div>
          </div>
        )}

        {activeTab === "templates" && (
          <div className="space-y-4">
            {Object.entries(TEMPLATE_LABELS).map(([key, { label, vars }]) => (
              <div key={key} className="rounded-2xl border border-gray-200 bg-white p-5 space-y-2">
                <p className="text-sm font-bold text-gray-800">{label}</p>
                <p className="text-[11px] text-gray-400">
                  Available placeholders: {vars.map((v) => <code key={v} className="mx-0.5 rounded bg-gray-100 px-1 text-brand">{`{{${v}}}`}</code>)}
                </p>
                <textarea
                  rows={4}
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

      {activeTab === "test" && (
        <form onSubmit={sendTest} className="rounded-2xl border border-gray-200 bg-white p-6 space-y-4">
          <p className="text-sm font-bold text-gray-800">Send a Test Email</p>
          <p className="text-[11px] text-gray-500">Sends a sample "Order Confirmed" email to verify your SMTP connection is working.</p>
          <div>
            <label className={LABEL}>Send To (Email Address)</label>
            <input
              type="email" required placeholder="you@example.com" value={testEmail}
              onChange={(e) => setTestEmail(e.target.value)}
              className={INP}
            />
          </div>
          {testMsg && <p className={`text-sm ${testMsg.startsWith("✓") ? "text-green-600" : "text-red-500"}`}>{testMsg}</p>}
          <button type="submit" disabled={testBusy || !s.enabled} className="rounded-lg bg-brand px-6 py-2.5 text-sm font-semibold text-white disabled:opacity-50">
            {testBusy ? "Sending..." : "Send Test Email"}
          </button>
          {!s.enabled && <p className="text-[11px] text-red-400">Enable email above and save first before testing.</p>}
        </form>
      )}
    </div>
  );
}
