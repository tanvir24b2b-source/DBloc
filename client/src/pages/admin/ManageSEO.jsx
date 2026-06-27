import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuthStore } from "../../store/useAuthStore.js";
import api from "../../lib/api.js";

const AI_TOOLS = [
  { key: "aiClaudeConnected",  label: "Claude Pro",     desc: "Anthropic Claude Pro / Max subscription" },
  { key: "aiChatGPTConnected", label: "ChatGPT Plus",   desc: "OpenAI ChatGPT Plus / Pro subscription" },
  { key: "aiGeminiConnected",  label: "Google Gemini",  desc: "Google Gemini Advanced subscription" },
  { key: "aiOtherConnected",   label: "Other / Free API", desc: "OpenRouter or any free API key" },
];

export default function ManageSEO() {
  const qc = useQueryClient();
  const { user } = useAuthStore();
  const isMaster = user?.role === "master_admin";

  const TABS = ["Analytics & Tracking", "Meta Events", ...(isMaster ? ["Robots.txt"] : []), "ConnectAI"];

  const [tab, setTab] = useState("Analytics & Tracking");
  const [msg, setMsg] = useState("");
  const [mcpToken, setMcpToken] = useState("");
  const [generatingToken, setGeneratingToken] = useState(false);

  const { data: seo, isLoading } = useQuery({
    queryKey: ["seo-admin"],
    queryFn: async () => (await api.get("/seo/admin")).data,
  });

  const [form, setForm] = useState({});
  const merged = { ...seo, ...form };
  function set(key, val) { setForm((p) => ({ ...p, [key]: val })); }

  const saveMut = useMutation({
    mutationFn: () => api.put("/seo", form),
    onSuccess: () => {
      setMsg("Saved!");
      qc.invalidateQueries({ queryKey: ["seo-admin"] });
      qc.invalidateQueries({ queryKey: ["seo-settings"] });
      setForm({});
      setTimeout(() => setMsg(""), 3000);
    },
  });

  async function generateToken() {
    setGeneratingToken(true);
    try {
      const { data } = await api.post("/seo/mcp-token");
      setMcpToken(data.token);
    } finally {
      setGeneratingToken(false);
    }
  }

  const serverUrl = window.location.origin.includes("localhost")
    ? "http://localhost:5000"
    : window.location.origin;

  const mcpAddCommand = `claude mcp add dbloc --transport http ${serverUrl}/mcp --header "Authorization: Bearer ${mcpToken || "<your-token>"}"`;

  if (isLoading) return <p className="p-8 text-center text-muted">Loading...</p>;

  return (
    <div>
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-ink">Marketing</h1>
        {msg && <span className="rounded-full bg-green-100 px-3 py-1 text-xs font-semibold text-green-700">{msg}</span>}
      </div>

      <div className="mt-4 flex gap-1 border-b border-line">
        {TABS.map((t) => (
          <button key={t} onClick={() => setTab(t)}
            className={`px-4 py-2 text-sm font-medium transition ${tab === t ? "border-b-2 border-brand text-brand" : "text-muted hover:text-ink"}`}>
            {t}
          </button>
        ))}
      </div>

      <div className="mt-6 max-w-2xl space-y-5">

        {/* ANALYTICS */}
        {tab === "Analytics & Tracking" && (
          <>
            <div className="rounded-xl border border-line bg-white p-4">
              <p className="mb-1 text-sm font-bold text-ink">Google Tag Manager</p>
              <p className="mb-3 text-xs text-muted">Recommended — manages GA4, FB Pixel, and all other tags from one place.</p>
              <Field label="GTM Container ID">
                <input className={inp} value={merged.googleTagManagerId || ""} onChange={(e) => set("googleTagManagerId", e.target.value)} placeholder="GTM-XXXXXXX" />
              </Field>
            </div>

            <div className="rounded-xl border border-line bg-white p-4">
              <p className="mb-1 text-sm font-bold text-ink">Google Analytics 4</p>
              <p className="mb-3 text-xs text-muted">Direct GA4 — use only if not using GTM.</p>
              <Field label="Measurement ID">
                <input className={inp} value={merged.googleAnalyticsId || ""} onChange={(e) => set("googleAnalyticsId", e.target.value)} placeholder="G-XXXXXXXXXX" />
              </Field>
            </div>

            <div className="rounded-xl border border-line bg-white p-4">
              <p className="mb-1 text-sm font-bold text-ink">Google Search Console</p>
              <p className="mb-3 text-xs text-muted">Paste the verification code from Search Console → Settings → Ownership verification → HTML tag method.</p>
              <Field label="Verification Code">
                <input className={inp} value={merged.googleSearchConsoleCode || ""} onChange={(e) => set("googleSearchConsoleCode", e.target.value)} placeholder="Paste content= value here" />
              </Field>
            </div>

            <div className="rounded-xl border border-line bg-white p-4">
              <p className="mb-1 text-sm font-bold text-ink">Facebook Pixel & Conversion API</p>
              <p className="mb-3 text-xs text-muted">Pixel ID for browser events. CAPI token enables server-side conversion tracking (more accurate, cookieless).</p>
              <Field label="Pixel ID">
                <input className={inp} value={merged.facebookPixelId || ""} onChange={(e) => set("facebookPixelId", e.target.value)} placeholder="1234567890" />
              </Field>
              <div className="mt-3">
                <Field label="Conversion API Token">
                  <input className={inp} type="password" value={merged.facebookCapiToken || ""} onChange={(e) => set("facebookCapiToken", e.target.value)} placeholder="EAAxxxxxxx..." />
                </Field>
                {seo?.facebookCapiTokenSet && !form.facebookCapiToken && (
                  <p className="mt-1 text-[10px] text-green-600">✓ CAPI token is set</p>
                )}
              </div>
            </div>

            <button onClick={() => saveMut.mutate()} disabled={saveMut.isPending}
              className="rounded-lg bg-brand px-6 py-2.5 text-sm font-semibold text-white disabled:opacity-50">
              {saveMut.isPending ? "Saving..." : "Save Changes"}
            </button>
          </>
        )}

        {/* META EVENTS */}
        {tab === "Meta Events" && <MetaEventsTab seo={seo} merged={merged} set={set} saveMut={saveMut} />}

        {/* ROBOTS — master_admin only */}
        {tab === "Robots.txt" && isMaster && (
          <>
            <div className="rounded-xl border border-orange-200 bg-orange-50 px-4 py-3 text-xs text-orange-700 font-medium">
              ⚠ Master Admin only — changes here affect how Google crawls your site.
            </div>
            <div className="rounded-xl border border-line bg-white p-4">
              <p className="mb-1 text-xs text-muted">Live at <code className="text-brand">/robots.txt</code> — tells search engines what to crawl.</p>
              <textarea
                className="mt-2 w-full rounded-lg border border-line bg-cream p-3 font-mono text-xs outline-none focus:border-brand"
                rows={10}
                value={merged.robotsTxt || ""}
                onChange={(e) => set("robotsTxt", e.target.value)}
              />
            </div>
            <button onClick={() => saveMut.mutate()} disabled={saveMut.isPending}
              className="rounded-lg bg-brand px-6 py-2.5 text-sm font-semibold text-white disabled:opacity-50">
              {saveMut.isPending ? "Saving..." : "Save Changes"}
            </button>
          </>
        )}

        {/* CONNECT AI */}
        {tab === "ConnectAI" && (
          <>
            {/* AI Subscriptions */}
            <div className="space-y-3">
              <p className="text-sm font-bold text-ink">AI Subscriptions</p>
              <p className="text-xs text-muted">Mark which AI tools you have active. This helps track what's available for your team.</p>
              {AI_TOOLS.map(({ key, label, desc }) => {
                const connected = !!merged[key];
                return (
                  <div key={key} className="flex items-center justify-between rounded-xl border border-line bg-white px-4 py-3">
                    <div>
                      <p className="text-sm font-semibold text-ink">{label}</p>
                      <p className="text-xs text-muted">{desc}</p>
                      {key === "aiOtherConnected" && connected && (
                        <input
                          className="mt-2 w-full rounded-lg border border-line bg-gray-50 px-2 py-1 text-xs outline-none focus:border-brand"
                          placeholder="e.g. OpenRouter, Mistral..."
                          value={merged.aiOtherName || ""}
                          onChange={(e) => set("aiOtherName", e.target.value)}
                        />
                      )}
                    </div>
                    <div className="flex items-center gap-3 shrink-0 ml-4">
                      {connected
                        ? <span className="text-xs font-semibold text-green-600">✓ Connected</span>
                        : <span className="text-xs font-semibold text-red-400">✗ Disconnected</span>}
                      <button
                        onClick={() => { set(key, !connected); }}
                        className={`rounded-full px-3 py-1 text-xs font-semibold transition ${connected ? "bg-red-50 text-red-500 hover:bg-red-100" : "bg-green-50 text-green-600 hover:bg-green-100"}`}>
                        {connected ? "Disconnect" : "Connect"}
                      </button>
                    </div>
                  </div>
                );
              })}
              <button onClick={() => saveMut.mutate()} disabled={saveMut.isPending}
                className="rounded-lg bg-brand px-6 py-2.5 text-sm font-semibold text-white disabled:opacity-50">
                {saveMut.isPending ? "Saving..." : "Save Changes"}
              </button>
            </div>

            {/* Claude Code MCP */}
            <div className="rounded-xl border border-brand/30 bg-brand/5 p-5">
              <p className="text-sm font-bold text-ink">Claude Code Connect</p>
              <p className="mt-1 text-xs text-muted">
                Connect your Claude Code subscription to this website. Claude Code can then manage SEO, update content, and view stats — no API key or extra charges needed.
              </p>

              <div className="mt-4 space-y-2">
                <p className="text-xs font-semibold text-muted uppercase tracking-wide">Step 1 — Generate Access Token</p>
                <div className="flex items-center gap-3">
                  <button onClick={generateToken} disabled={generatingToken}
                    className="rounded-lg bg-ink px-4 py-2 text-xs font-semibold text-white disabled:opacity-40">
                    {generatingToken ? "Generating..." : seo?.mcpTokenSet ? "Regenerate Token" : "Generate Token"}
                  </button>
                  {seo?.mcpTokenSet && !mcpToken && (
                    <span className="text-xs text-green-600">✓ Token already set</span>
                  )}
                </div>
              </div>

              {mcpToken && (
                <div className="mt-4 space-y-2">
                  <p className="text-xs font-semibold text-muted uppercase tracking-wide">Step 2 — Copy your token</p>
                  <div className="flex items-center gap-2 rounded-lg border border-line bg-white p-2">
                    <code className="flex-1 break-all font-mono text-xs text-ink">{mcpToken}</code>
                    <button onClick={() => { navigator.clipboard.writeText(mcpToken); setMsg("Token copied!"); setTimeout(() => setMsg(""), 2000); }}
                      className="shrink-0 rounded px-2 py-1 text-[10px] font-semibold text-brand hover:bg-brand/10">
                      Copy
                    </button>
                  </div>
                  <p className="text-[10px] text-red-500">Save this token now — it won't be shown again after you leave this page.</p>
                </div>
              )}

              <div className="mt-4 space-y-2">
                <p className="text-xs font-semibold text-muted uppercase tracking-wide">Step 3 — Add to Claude Code</p>
                <p className="text-xs text-muted">Open your terminal and run this command once:</p>
                <div className="flex items-start gap-2 rounded-lg border border-line bg-white p-3">
                  <code className="flex-1 break-all font-mono text-[11px] text-ink leading-relaxed">{mcpAddCommand}</code>
                  <button onClick={() => { navigator.clipboard.writeText(mcpAddCommand); setMsg("Command copied!"); setTimeout(() => setMsg(""), 2000); }}
                    className="shrink-0 rounded px-2 py-1 text-[10px] font-semibold text-brand hover:bg-brand/10">
                    Copy
                  </button>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

const META_EVENTS = [
  { key: "viewContent",      label: "View Content",       desc: "Fires when a customer opens a product page" },
  { key: "addToCart",        label: "Add to Cart",        desc: "Fires when Join button is clicked" },
  { key: "initiateCheckout", label: "Initiate Checkout",  desc: "Fires when the join form is submitted" },
  { key: "purchase",         label: "Purchase",           desc: "Fires when order is confirmed" },
  { key: "lead",             label: "Lead",               desc: "Fires when someone signs up or subscribes" },
];

function MetaEventsTab({ seo, merged, set, saveMut }) {
  const [log, setLog] = useState([]);
  const [logLoading, setLogLoading] = useState(false);
  const [testMsg, setTestMsg] = useState("");
  const [testLoading, setTestLoading] = useState(false);

  useEffect(() => {
    setLogLoading(true);
    api.get("/seo/meta-log").then(({ data }) => setLog(data)).catch(() => {}).finally(() => setLogLoading(false));
  }, []);

  async function sendTest() {
    setTestLoading(true); setTestMsg("");
    try {
      const { data } = await api.post("/seo/meta-test");
      setTestMsg("✓ " + data.message);
      // Refresh log
      const { data: newLog } = await api.get("/seo/meta-log");
      setLog(newLog);
    } catch (e) {
      setTestMsg("❌ " + (e?.response?.data?.message || "Test failed"));
    } finally { setTestLoading(false); }
  }

  function setEventToggle(eventKey, side, val) {
    const current = merged.metaEvents || {};
    const updated = {
      ...current,
      [eventKey]: { ...(current[eventKey] || {}), [side]: val },
    };
    set("metaEvents", updated);
  }

  const events = merged.metaEvents || {};

  return (
    <div className="space-y-5">
      {/* Credentials */}
      <div className="rounded-xl border border-line bg-white p-4 space-y-3">
        <p className="text-sm font-bold text-ink">Meta Pixel & CAPI Credentials</p>
        <Field label="Pixel ID">
          <input className={inp} value={merged.facebookPixelId || ""} onChange={(e) => set("facebookPixelId", e.target.value)} placeholder="1234567890" />
        </Field>
        <Field label="CAPI Access Token">
          <input className={inp} type="password" value={merged.facebookCapiToken || ""} onChange={(e) => set("facebookCapiToken", e.target.value)} placeholder="EAAxxxxxxx..." />
          {seo?.facebookCapiTokenSet && !merged.facebookCapiToken && <p className="mt-1 text-[10px] text-green-600">✓ Token is set</p>}
        </Field>
        <Field label="Test Event Code (optional)">
          <input className={inp} value={merged.facebookTestEventCode || ""} onChange={(e) => set("facebookTestEventCode", e.target.value)} placeholder="TEST12345 — from Meta Events Manager" />
        </Field>
        <Field label="API Version">
          <input className={inp} value={merged.facebookApiVersion || "v21.0"} onChange={(e) => set("facebookApiVersion", e.target.value)} placeholder="v21.0" />
          <p className="mt-1 text-[10px] text-muted">Update when Meta releases a new version (e.g. v22.0). Check Meta's changelog.</p>
        </Field>
      </div>

      {/* Event toggles */}
      <div className="rounded-xl border border-line bg-white p-4">
        <p className="mb-3 text-sm font-bold text-ink">Event Toggles</p>
        <div className="mb-2 grid grid-cols-3 gap-2 text-[10px] font-bold uppercase tracking-wider text-muted px-1">
          <span>Event</span><span className="text-center">Browser (Pixel)</span><span className="text-center">Server (CAPI)</span>
        </div>
        <div className="space-y-2">
          {META_EVENTS.map(({ key, label, desc }) => (
            <div key={key} className="grid grid-cols-3 items-center gap-2 rounded-lg border border-line px-3 py-2.5">
              <div>
                <p className="text-xs font-semibold text-ink">{label}</p>
                <p className="text-[10px] text-muted">{desc}</p>
              </div>
              <div className="flex justify-center">
                <Toggle value={events[key]?.browser !== false} onChange={(v) => setEventToggle(key, "browser", v)} />
              </div>
              <div className="flex justify-center">
                <Toggle value={!!events[key]?.server} onChange={(v) => setEventToggle(key, "server", v)} />
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="flex gap-3">
        <button onClick={() => saveMut.mutate()} disabled={saveMut.isPending}
          className="rounded-lg bg-brand px-6 py-2.5 text-sm font-semibold text-white disabled:opacity-50">
          {saveMut.isPending ? "Saving..." : "Save Changes"}
        </button>
        <button onClick={sendTest} disabled={testLoading || !seo?.facebookCapiTokenSet}
          className="rounded-lg border border-brand px-5 py-2.5 text-sm font-semibold text-brand hover:bg-brand/5 disabled:opacity-40">
          {testLoading ? "Sending..." : "Send Test Event"}
        </button>
      </div>
      {testMsg && <p className="text-xs font-medium text-green-700">{testMsg}</p>}

      {/* Event log */}
      <div className="rounded-xl border border-line bg-white p-4">
        <p className="mb-3 text-sm font-bold text-ink">Recent CAPI Events (last 20)</p>
        {logLoading ? <p className="text-xs text-muted">Loading...</p> : log.length === 0 ? (
          <p className="text-xs text-muted">No events sent yet. Place a test order or click "Send Test Event".</p>
        ) : (
          <div className="space-y-1.5 max-h-64 overflow-y-auto">
            {log.map((e, i) => (
              <div key={i} className={`flex items-center gap-3 rounded-lg px-3 py-2 text-xs ${e.status === "ok" ? "bg-green-50" : "bg-red-50"}`}>
                <span className={`font-bold ${e.status === "ok" ? "text-green-600" : "text-red-500"}`}>{e.status === "ok" ? "✓" : "✗"}</span>
                <span className="font-semibold text-ink">{e.event}</span>
                {e.eventsReceived && <span className="text-muted">received: {e.eventsReceived}</span>}
                {e.error && <span className="text-red-500 truncate">{e.error}</span>}
                <span className="ml-auto text-muted shrink-0">{new Date(e.time).toLocaleTimeString()}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function Toggle({ value, onChange }) {
  return (
    <button
      type="button"
      onClick={() => onChange(!value)}
      className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${value ? "bg-brand" : "bg-line"}`}
    >
      <span className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white shadow transition-transform ${value ? "translate-x-4" : "translate-x-1"}`} />
    </button>
  );
}

const inp = "w-full rounded-lg border border-line bg-white px-3 py-2 text-sm outline-none focus:border-brand";

function Field({ label, children }) {
  return (
    <div>
      <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-muted">{label}</label>
      {children}
    </div>
  );
}
