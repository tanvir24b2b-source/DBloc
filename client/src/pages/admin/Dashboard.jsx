import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import api from "../../lib/api.js";
import { formatPrice } from "../../lib/format.js";

const SUB_RANGES = [
  { key: "today",      label: "Today" },
  { key: "yesterday",  label: "Yesterday" },
  { key: "week",       label: "This Week" },
  { key: "month",      label: "This Month" },
  { key: "lastmonth",  label: "Last Month" },
];

function subRangeStart(key) {
  const now = new Date();
  const sod = (d) => { d.setHours(0,0,0,0); return d; };
  if (key === "today")     { return sod(new Date(now)); }
  if (key === "yesterday") { const d = sod(new Date(now)); d.setDate(d.getDate()-1); return d; }
  if (key === "week")      { const d = sod(new Date(now)); d.setDate(d.getDate()-d.getDay()); return d; }
  if (key === "month")     { return new Date(now.getFullYear(), now.getMonth(), 1); }
  if (key === "lastmonth") { return new Date(now.getFullYear(), now.getMonth()-1, 1); }
  return sod(new Date(now));
}
function subRangeEnd(key) {
  const now = new Date();
  if (key === "yesterday") { const d = new Date(now); d.setHours(0,0,0,0); return d; }
  if (key === "lastmonth") { return new Date(now.getFullYear(), now.getMonth(), 1); }
  return now;
}

function SubscriberWidget() {
  const [subRange, setSubRange] = useState("today");

  const { data, isLoading } = useQuery({
    queryKey: ["subscribers"],
    queryFn: () => api.get("/subscribers").then(r => r.data),
    staleTime: 60_000,
  });

  const count = (() => {
    if (!data?.subscribers) return 0;
    const from = subRangeStart(subRange).getTime();
    const to   = subRangeEnd(subRange).getTime();
    return data.subscribers.filter(s => {
      const t = new Date(s.createdAt).getTime();
      return t >= from && t <= to;
    }).length;
  })();

  const total = data?.total ?? 0;

  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-5">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-sm font-bold uppercase tracking-wider text-gray-500">Subscribers</h2>
        <select
          value={subRange}
          onChange={e => setSubRange(e.target.value)}
          className="rounded-lg border border-gray-200 px-2 py-1 text-xs font-semibold text-gray-600 outline-none focus:border-brand"
        >
          {SUB_RANGES.map(r => <option key={r.key} value={r.key}>{r.label}</option>)}
        </select>
      </div>

      <div className="flex items-end gap-3">
        <span className="text-4xl font-extrabold text-brand">{isLoading ? "—" : count}</span>
        <span className="mb-1 text-sm text-gray-400">new {SUB_RANGES.find(r=>r.key===subRange)?.label.toLowerCase()}</span>
      </div>

      <div className="mt-4 flex items-center justify-between rounded-xl bg-gray-50 px-4 py-3">
        <span className="text-xs font-semibold text-gray-500">Total all-time</span>
        <span className="text-lg font-extrabold text-gray-900">{isLoading ? "—" : total}</span>
      </div>

      <Link to="/admin/subscribers" className="mt-3 block text-center text-[11px] font-bold text-brand hover:underline">
        Manage subscribers →
      </Link>
    </div>
  );
}

// ── status meta ───────────────────────────────────────────────────────────────
const STATUS = [
  { key: "pending", label: "Pending", color: "#f59e0b" },
  { key: "confirmed", label: "Confirmed", color: "#3b82f6" },
  { key: "processing", label: "Processing", color: "#8b5cf6" },
  { key: "shipped", label: "Shipped", color: "#06b6d4" },
  { key: "delivered", label: "Delivered", color: "#22c55e" },
  { key: "cancelled", label: "Cancelled", color: "#ef4444" },
];

const RANGES = [
  { key: "today", label: "Today" },
  { key: "yesterday", label: "Yesterday" },
  { key: "week", label: "This Week" },
  { key: "month", label: "This Month" },
  { key: "custom", label: "Custom" },
];

// ── donut/pie chart (pure SVG) ────────────────────────────────────────────────
function DonutChart({ data, total }) {
  const size = 180, r = 70, cx = size / 2, cy = size / 2, stroke = 26;
  const circ = 2 * Math.PI * r;
  let offset = 0;
  const segments = data.filter((d) => d.value > 0);

  return (
    <div className="flex items-center gap-6">
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="-rotate-90">
        <circle cx={cx} cy={cy} r={r} fill="none" stroke="#f1f1ef" strokeWidth={stroke} />
        {total > 0 && segments.map((d, i) => {
          const frac = d.value / total;
          const dash = frac * circ;
          const el = (
            <circle key={i} cx={cx} cy={cy} r={r} fill="none" stroke={d.color}
              strokeWidth={stroke} strokeDasharray={`${dash} ${circ - dash}`}
              strokeDashoffset={-offset} />
          );
          offset += dash;
          return el;
        })}
      </svg>
      <div className="space-y-1.5">
        {data.map((d) => (
          <div key={d.key} className="flex items-center gap-2 text-xs">
            <span className="h-2.5 w-2.5 rounded-sm" style={{ background: d.color }} />
            <span className="w-20 text-gray-600">{d.label}</span>
            <span className="font-bold text-gray-900">{d.value}</span>
            <span className="text-gray-400">({total ? Math.round((d.value / total) * 100) : 0}%)</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── hourly bar chart (find peak hour) ─────────────────────────────────────────
function HourlyBars({ byHour, peakHour }) {
  const max = Math.max(1, ...byHour.map((h) => h.count));
  const fmtHour = (h) => {
    const am = h < 12 ? "AM" : "PM";
    const hr = h % 12 === 0 ? 12 : h % 12;
    return `${hr}${am}`;
  };
  return (
    <div>
      <div className="flex h-32 items-end gap-[2px]">
        {byHour.map((h) => (
          <div key={h.hour} className="group relative flex flex-1 flex-col items-center justify-end">
            <div
              className={`w-full rounded-t-sm transition-all ${h.hour === peakHour ? "bg-brand" : "bg-gray-200 group-hover:bg-gray-300"}`}
              style={{ height: `${(h.count / max) * 100}%`, minHeight: h.count > 0 ? 3 : 0 }}
            />
            <div className="pointer-events-none absolute -top-7 z-10 hidden whitespace-nowrap rounded bg-gray-900 px-2 py-1 text-[10px] font-bold text-white group-hover:block">
              {fmtHour(h.hour)}: {h.count}
            </div>
          </div>
        ))}
      </div>
      <div className="mt-1 flex justify-between text-[9px] text-gray-400">
        <span>12AM</span><span>6AM</span><span>12PM</span><span>6PM</span><span>11PM</span>
      </div>
    </div>
  );
}

// ── volume sparkline (real orders/day) ────────────────────────────────────────
function Sparkline({ series }) {
  if (!series.length) return <p className="py-6 text-center text-xs text-gray-400">No orders in this range</p>;
  const w = 280, h = 70, pad = 6;
  const max = Math.max(1, ...series.map((s) => s.count));
  const step = series.length > 1 ? (w - pad * 2) / (series.length - 1) : 0;
  const pts = series.map((s, i) => [pad + i * step, h - pad - (s.count / max) * (h - pad * 2)]);
  const line = pts.map((p, i) => `${i === 0 ? "M" : "L"}${p[0]},${p[1]}`).join(" ");
  const area = `${line} L${pts[pts.length - 1][0]},${h - pad} L${pts[0][0]},${h - pad} Z`;
  return (
    <svg width="100%" viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="none" className="h-[70px] w-full">
      <path d={area} fill="#f9731622" />
      <path d={line} fill="none" stroke="#f97316" strokeWidth="2" strokeLinejoin="round" />
      {pts.map((p, i) => <circle key={i} cx={p[0]} cy={p[1]} r="2.5" fill="#f97316" />)}
    </svg>
  );
}

const fmtTime = (d) => new Date(d).toLocaleString("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" });
const fmtHourLabel = (h) => {
  if (h == null) return "—";
  const am = h < 12 ? "AM" : "PM";
  const hr = h % 12 === 0 ? 12 : h % 12;
  return `${hr}:00 ${am}`;
};

export default function Dashboard() {
  const [range, setRange] = useState("today");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");

  const params = range === "custom" && from
    ? `?range=custom&from=${from}${to ? `&to=${to}` : ""}`
    : `?range=${range}`;

  const { data, isLoading } = useQuery({
    queryKey: ["admin-analytics", range, from, to],
    queryFn: () => api.get(`/admin/analytics${params}`).then((r) => r.data),
    refetchInterval: 30000, // live refresh
  });

  const sc = data?.statusCounts || {};
  const pieData = STATUS.map((s) => ({ ...s, value: sc[s.key] || 0 }));

  return (
    <div className="space-y-5">
      {/* Header + range filter */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-extrabold tracking-tight text-gray-900">Dashboard</h1>
          <p className="mt-0.5 text-sm text-gray-500">Real-time order analytics · auto-refreshes every 30s</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex rounded-xl border border-gray-200 bg-white p-1">
            {RANGES.map((r) => (
              <button key={r.key} onClick={() => setRange(r.key)}
                className={`rounded-lg px-3 py-1.5 text-xs font-bold transition ${range === r.key ? "bg-brand text-white" : "text-gray-500 hover:bg-gray-50"}`}>
                {r.label}
              </button>
            ))}
          </div>
          {range === "custom" && (
            <div className="flex items-center gap-1.5">
              <input type="date" value={from} onChange={(e) => setFrom(e.target.value)}
                className="rounded-lg border border-gray-200 px-2 py-1.5 text-xs outline-none focus:border-brand" />
              <span className="text-xs text-gray-400">→</span>
              <input type="date" value={to} onChange={(e) => setTo(e.target.value)}
                className="rounded-lg border border-gray-200 px-2 py-1.5 text-xs outline-none focus:border-brand" />
            </div>
          )}
        </div>
      </div>

      {/* Status cards */}
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4 lg:grid-cols-7">
        <div className="rounded-xl border border-gray-200 bg-gray-900 px-4 py-3 text-white">
          <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Total Orders</p>
          <p className="mt-1 text-2xl font-extrabold">{isLoading ? "—" : sc.total ?? 0}</p>
        </div>
        {STATUS.map((s) => (
          <div key={s.key} className="rounded-xl border border-gray-200 bg-white px-4 py-3">
            <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400">{s.label}</p>
            <p className="mt-1 text-2xl font-extrabold" style={{ color: s.color }}>{isLoading ? "—" : sc[s.key] ?? 0}</p>
          </div>
        ))}
      </div>

      {/* Main grid */}
      <div className="grid gap-5 lg:grid-cols-3">
        {/* Left 2/3 */}
        <div className="space-y-5 lg:col-span-2">
          {/* Orders pie */}
          <div className="rounded-2xl border border-gray-200 bg-white p-5">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-sm font-bold uppercase tracking-wider text-gray-500">Orders by Status</h2>
              <span className="rounded-full bg-gray-100 px-2.5 py-0.5 text-[11px] font-bold text-gray-500">
                {RANGES.find((r) => r.key === range)?.label}
              </span>
            </div>
            <DonutChart data={pieData} total={sc.total || 0} />
          </div>

          {/* Hourly */}
          <div className="rounded-2xl border border-gray-200 bg-white p-5">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-sm font-bold uppercase tracking-wider text-gray-500">Orders by Hour</h2>
              <span className="text-[11px] font-bold text-brand">
                Peak: {fmtHourLabel(data?.peakHour)}
              </span>
            </div>
            <HourlyBars byHour={data?.byHour || Array.from({ length: 24 }, (_, h) => ({ hour: h, count: 0 }))} peakHour={data?.peakHour} />
          </div>

          {/* Recent orders */}
          <div className="rounded-2xl border border-gray-200 bg-white overflow-hidden">
            <div className="flex items-center justify-between border-b border-gray-100 px-5 py-3">
              <h2 className="text-sm font-bold uppercase tracking-wider text-gray-500">Recent Orders</h2>
              <Link to="/admin/orders" className="text-[11px] font-bold text-brand hover:underline">View all →</Link>
            </div>
            <table className="w-full text-sm">
              <tbody>
                {(data?.recentOrders || []).map((o) => {
                  const meta = STATUS.find((s) => s.key === o.status);
                  return (
                    <tr key={o.orderId} className="border-b border-gray-50 last:border-0">
                      <td className="px-5 py-2.5">
                        <p className="font-semibold text-gray-900">{o.customerName}</p>
                        <p className="font-mono text-[10px] text-gray-400">{o.orderId}</p>
                      </td>
                      <td className="px-5 py-2.5 text-xs text-gray-500">{o.product}</td>
                      <td className="px-5 py-2.5 font-bold text-brand">৳{formatPrice(o.amount)}</td>
                      <td className="px-5 py-2.5">
                        <span className="rounded-full px-2 py-0.5 text-[10px] font-bold capitalize"
                          style={{ background: (meta?.color || "#999") + "20", color: meta?.color || "#999" }}>
                          {o.status}
                        </span>
                      </td>
                      <td className="px-5 py-2.5 text-right text-[11px] text-gray-400">{fmtTime(o.createdAt)}</td>
                    </tr>
                  );
                })}
                {(!data?.recentOrders || data.recentOrders.length === 0) && (
                  <tr><td className="px-5 py-8 text-center text-sm text-gray-400">No orders in this range.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Right 1/3 */}
        <div className="space-y-5">
          {/* Order volume */}
          <div className="rounded-2xl border border-gray-200 bg-white p-5">
            <div className="mb-2 flex items-center justify-between">
              <h2 className="text-sm font-bold uppercase tracking-wider text-gray-500">Order Volume</h2>
              <span className="text-[11px] font-bold text-gray-400">{sc.total ?? 0} orders</span>
            </div>
            <Sparkline series={data?.volumeSeries || []} />
          </div>

          {/* Revenue + active blocs */}
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-2xl border border-gray-200 bg-white p-4">
              <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Revenue</p>
              <p className="mt-1 text-xl font-extrabold text-emerald-600">৳{formatPrice(data?.revenue || 0)}</p>
            </div>
            <div className="rounded-2xl border border-gray-200 bg-white p-4">
              <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Active Blocs</p>
              <p className="mt-1 text-xl font-extrabold text-brand">{data?.activeBlocs ?? 0}</p>
            </div>
          </div>

          {/* Subscriber count */}
          <SubscriberWidget />

          {/* Top selling */}
          <div className="rounded-2xl border border-gray-200 bg-white p-5">
            <h2 className="mb-3 text-sm font-bold uppercase tracking-wider text-gray-500">Top Selling Products</h2>
            <div className="space-y-3">
              {(data?.topProducts || []).map((p, i) => {
                const max = data.topProducts[0]?.count || 1;
                return (
                  <div key={p.title}>
                    <div className="mb-1 flex items-center justify-between text-xs">
                      <span className="flex items-center gap-2 font-semibold text-gray-700">
                        <span className="grid h-5 w-5 place-items-center rounded-md bg-brand/10 text-[10px] font-bold text-brand">{i + 1}</span>
                        <span className="line-clamp-1">{p.title}</span>
                      </span>
                      <span className="shrink-0 font-bold text-gray-900">{p.count} sold</span>
                    </div>
                    <div className="h-1.5 w-full overflow-hidden rounded-full bg-gray-100">
                      <div className="h-full rounded-full bg-brand" style={{ width: `${(p.count / max) * 100}%` }} />
                    </div>
                  </div>
                );
              })}
              {(!data?.topProducts || data.topProducts.length === 0) && (
                <p className="py-4 text-center text-xs text-gray-400">No sales in this range.</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
