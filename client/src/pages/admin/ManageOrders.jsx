import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import api from "../../lib/api.js";
import { formatPrice } from "../../lib/format.js";
import { useBlocs } from "../../hooks/useBlocs.js";

const ALL_STATUSES = ["pending", "confirmed", "processing", "shipped", "delivered", "cancelled", "pending_return", "returned"];
const PRE_SHIP     = ["pending", "confirmed", "processing", "cancelled"];
const POST_SHIP    = ["pending_return", "returned"];

const statusColors = {
  pending:        "bg-yellow-100 text-yellow-700",
  confirmed:      "bg-blue-100 text-blue-700",
  processing:     "bg-orange-100 text-orange-700",
  shipped:        "bg-purple-100 text-purple-700",
  delivered:      "bg-green-100 text-green-700",
  cancelled:      "bg-red-100 text-red-700",
  pending_return: "bg-pink-100 text-pink-700",
  returned:       "bg-gray-100 text-gray-600",
};

const ZONE_LABELS = { inside_dhaka: "Inside Dhaka", outside_dhaka: "Outside Dhaka", free: "Free Delivery" };

function fmt(dateStr) {
  if (!dateStr) return "—";
  return new Date(dateStr).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
}

function isOnlinePaid(paymentMethod) {
  return paymentMethod && paymentMethod !== "cod";
}

function OrderEditPanel({ order, onClose, onUpdated }) {
  const { data: allBlocs = [] } = useBlocs();

  const [form, setForm] = useState({
    customerName:   order.customerName || "",
    mobile:         order.mobile || "",
    email:          order.email || "",
    address:        order.address || "",
    deliveryZone:   order.deliveryZone || "inside_dhaka",
    deliveryCharge: order.deliveryCharge ?? 0,
    discount:       order.discount ?? 0,
    note:           order.note || "",
    courierName:    order.courierName || "",
    bloc:           order.bloc?._id || order.bloc || "",
  });
  const [busy, setBusy]         = useState(false);
  const [msg, setMsg]           = useState("");
  const [shipping, setShipping] = useState(false);
  const [blocking, setBlocking] = useState(false);
  const [blocSearch, setBlocSearch] = useState(order.bloc?.title || "");
  const [blocDropOpen, setBlocDropOpen] = useState(false);
  const [dangerOpen, setDangerOpen] = useState(false);

  const isShipped = ["shipped", "delivered", "pending_return", "returned"].includes(order.status);
  const canShip   = ["confirmed", "processing"].includes(order.status);

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const productPrice  = order.amount ?? 0;
  const delivery      = Number(form.deliveryCharge) || 0;
  const discount      = Number(form.discount) || 0;
  const total         = productPrice + delivery - discount;

  const blocChanged = form.bloc && form.bloc !== String(order.bloc?._id || order.bloc);

  async function save(e) {
    e.preventDefault();
    setBusy(true); setMsg("");
    try {
      const payload = { ...form };
      if (!blocChanged) delete payload.bloc;
      const { data } = await api.put(`/orders/${order._id}/edit`, payload);
      setMsg("✓ Saved");
      onUpdated(data);
      setTimeout(() => setMsg(""), 2500);
    } catch (err) {
      setMsg(err.response?.data?.message || "Failed to save");
    } finally { setBusy(false); }
  }

  async function updateNote() {
    setBusy(true); setMsg("");
    try {
      const { data } = await api.put(`/admin/orders/${order._id}/note`, { note: form.note });
      setMsg("✓ Note saved");
      onUpdated(data);
      setTimeout(() => setMsg(""), 2500);
    } catch { setMsg("Failed to save note"); }
    finally { setBusy(false); }
  }

  async function ship() {
    setShipping(true); setMsg("");
    try {
      const { data } = await api.post(`/admin/orders/${order._id}/ship`, { courierName: form.courierName });
      setMsg("✓ Shipped — consignment created");
      onUpdated(data);
    } catch (err) {
      setMsg(err.response?.data?.message || "Failed to ship");
    } finally { setShipping(false); }
  }

  async function blockCustomer() {
    if (!window.confirm(`Block ${order.customerName} (${order.mobile})? They won't be able to place orders.`)) return;
    setBlocking(true);
    try {
      await api.put(`/admin/users/${order.user}`, { banned: true, bannedIp: order.clientIp || undefined });
      setMsg("✓ Customer blocked");
    } catch { setMsg("Failed to block customer"); }
    finally { setBlocking(false); }
  }

  const INP = "w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-brand disabled:bg-gray-50 disabled:text-gray-400";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={onClose}>
      <div className="w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl bg-white shadow-2xl" onClick={(e) => e.stopPropagation()}>

        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-100 bg-gray-50 px-6 py-4 rounded-t-2xl">
          <div>
            <p className="font-bold text-gray-900 text-lg">{order.orderId}</p>
            <p className="text-xs text-gray-400">{fmt(order.createdAt)}</p>
          </div>
          <div className="flex items-center gap-3">
            <span className={`rounded-full px-3 py-1 text-xs font-bold uppercase ${statusColors[order.status] || "bg-gray-100 text-gray-600"}`}>
              {order.status?.replace("_", " ")}
            </span>
            {isOnlinePaid(order.paymentMethod) ? (
              <span className="rounded-full bg-green-100 px-2.5 py-1 text-xs font-bold text-green-700">Online Paid</span>
            ) : (
              <span className="rounded-full bg-gray-100 px-2.5 py-1 text-xs font-semibold text-gray-600">COD</span>
            )}
            <button onClick={onClose} className="text-2xl leading-none text-gray-400 hover:text-gray-700">×</button>
          </div>
        </div>

        <div className="p-6 space-y-6">

          {/* Product card */}
          <div className="flex gap-4 rounded-xl border border-gray-100 bg-gray-50 p-4">
            {order.bloc?.image && (
              <img src={order.bloc.image} alt={order.bloc.title} className="h-20 w-20 rounded-lg object-cover flex-shrink-0 border border-gray-200" />
            )}
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-gray-900 text-base leading-tight">{order.bloc?.title || "—"}</p>
              {order.bloc?.blocPrice && (
                <p className="text-xs text-gray-500 mt-0.5">Bloc price: ৳{formatPrice(order.bloc.blocPrice)} × {order.quantity ?? 1}</p>
              )}
              <div className="mt-3 space-y-0.5 text-xs text-gray-600">
                <div className="flex justify-between"><span>Product</span><span>৳{formatPrice(productPrice)}</span></div>
                <div className="flex justify-between"><span>Delivery</span><span>+৳{formatPrice(delivery)}</span></div>
                {discount > 0 && <div className="flex justify-between text-green-600"><span>Discount</span><span>−৳{formatPrice(discount)}</span></div>}
                <div className="flex justify-between font-bold text-gray-900 border-t border-gray-200 pt-1 mt-1">
                  <span>Total</span><span>৳{formatPrice(total)}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Consignment info */}
          {order.consignmentId && (
            <div className="rounded-lg bg-purple-50 border border-purple-200 px-4 py-3">
              <p className="text-[10px] font-bold uppercase text-purple-400 mb-1">Courier</p>
              <p className="text-sm font-semibold text-purple-800 capitalize">{order.courierName} — {order.consignmentId}</p>
              {order.trackingStatus && <p className="text-xs text-purple-600 mt-0.5">Status: {order.trackingStatus}</p>}
            </div>
          )}

          {order.transactionId && (
            <p className="text-xs font-mono text-purple-600">TrxID: {order.transactionId}</p>
          )}

          {/* Edit form */}
          <form onSubmit={save} className="space-y-4">
            <p className="text-[10px] font-bold uppercase text-gray-400">Customer Details</p>
            <div className="grid grid-cols-2 gap-3">
              {[["customerName","Full Name","text"],["mobile","Mobile","tel"],["email","Email","email"]].map(([k, label, type]) => (
                <div key={k}>
                  <label className="block text-[10px] font-semibold uppercase text-gray-400 mb-1">{label}</label>
                  <input type={type} value={form[k]} onChange={set(k)} disabled={isShipped} className={INP} />
                </div>
              ))}
              <div className="col-span-2">
                <label className="block text-[10px] font-semibold uppercase text-gray-400 mb-1">Address</label>
                <input type="text" value={form.address} onChange={set("address")} disabled={isShipped} className={INP} />
              </div>
            </div>

            <p className="text-[10px] font-bold uppercase text-gray-400 pt-1">Delivery & Pricing</p>
            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="block text-[10px] font-semibold uppercase text-gray-400 mb-1">Zone</label>
                <select value={form.deliveryZone} onChange={set("deliveryZone")} disabled={isShipped} className={INP}>
                  <option value="inside_dhaka">Inside Dhaka</option>
                  <option value="outside_dhaka">Outside Dhaka</option>
                  <option value="free">Free</option>
                </select>
              </div>
              <div>
                <label className="block text-[10px] font-semibold uppercase text-gray-400 mb-1">Delivery (৳)</label>
                <input type="number" min="0" value={form.deliveryCharge} onChange={set("deliveryCharge")} disabled={isShipped} className={INP} />
              </div>
              <div>
                <label className="block text-[10px] font-semibold uppercase text-gray-400 mb-1">Discount (৳)</label>
                <input type="number" min="0" value={form.discount} onChange={set("discount")} disabled={isShipped} className={INP} />
              </div>
            </div>

            {/* Product change — searchable */}
            {!isShipped && (
              <div className="relative">
                <label className="block text-[10px] font-semibold uppercase text-gray-400 mb-1">Change Product</label>
                <input
                  type="text"
                  value={blocSearch}
                  onChange={(e) => { setBlocSearch(e.target.value); setBlocDropOpen(true); }}
                  onFocus={() => setBlocDropOpen(true)}
                  placeholder="Search product name..."
                  className={INP}
                />
                {blocDropOpen && blocSearch.length > 0 && (
                  <div className="absolute z-10 mt-1 w-full rounded-lg border border-gray-200 bg-white shadow-lg max-h-52 overflow-y-auto">
                    {allBlocs
                      .filter((b) => b.title.toLowerCase().includes(blocSearch.toLowerCase()))
                      .slice(0, 8)
                      .map((b) => (
                        <button
                          key={b._id}
                          type="button"
                          className="flex w-full items-center gap-3 px-3 py-2 text-left hover:bg-gray-50 border-b border-gray-100 last:border-0"
                          onClick={() => {
                            setForm((f) => ({ ...f, bloc: b._id }));
                            setBlocSearch(b.title);
                            setBlocDropOpen(false);
                          }}
                        >
                          {b.image && <img src={b.image} alt={b.title} className="h-9 w-9 rounded object-cover flex-shrink-0 border border-gray-100" />}
                          <div className="min-w-0">
                            <p className="text-sm font-medium text-gray-800 truncate">{b.title}</p>
                            <p className="text-xs text-gray-400">৳{formatPrice(b.blocPrice)} {b.status !== "active" ? `· ${b.status}` : ""}</p>
                          </div>
                        </button>
                      ))}
                    {allBlocs.filter((b) => b.title.toLowerCase().includes(blocSearch.toLowerCase())).length === 0 && (
                      <p className="px-3 py-2 text-xs text-gray-400">No products found</p>
                    )}
                  </div>
                )}
                {blocChanged && (
                  <p className="mt-1 text-xs text-orange-500">Product will be changed. This will be logged in change history.</p>
                )}
              </div>
            )}

            {/* Courier selection */}
            {!isShipped && (
              <div>
                <label className="block text-[10px] font-semibold uppercase text-gray-400 mb-1">Courier</label>
                <select value={form.courierName} onChange={set("courierName")} className={INP}>
                  <option value="">— Use Default —</option>
                  <option value="steadfast">Steadfast</option>
                  <option value="pathao">Pathao</option>
                </select>
              </div>
            )}

            {!isShipped && (
              <>
                {msg && <p className={`text-xs ${msg.startsWith("✓") ? "text-green-600" : "text-red-500"}`}>{msg}</p>}
                <button type="submit" disabled={busy}
                  className="w-full rounded-lg bg-brand py-2.5 text-sm font-bold text-white disabled:opacity-50">
                  {busy ? "Saving..." : "Save Changes"}
                </button>
              </>
            )}
          </form>

          {/* Note */}
          <div>
            <label className="block text-[10px] font-semibold uppercase text-gray-400 mb-1">
              Note {isShipped && <span className="text-purple-500">(syncs to courier)</span>}
            </label>
            <textarea rows={3} value={form.note} onChange={set("note")}
              placeholder="Internal note or delivery instruction..."
              className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-brand" />
            <button type="button" onClick={updateNote} disabled={busy}
              className="mt-1.5 rounded-lg border border-gray-200 px-4 py-1.5 text-xs font-semibold text-gray-700 hover:border-brand hover:text-brand disabled:opacity-50">
              Save Note
            </button>
          </div>

          {isShipped && msg && (
            <p className={`text-xs ${msg.startsWith("✓") ? "text-green-600" : "text-red-500"}`}>{msg}</p>
          )}

          {/* Ship button */}
          {canShip && (
            <button onClick={ship} disabled={shipping}
              className="w-full rounded-lg bg-purple-600 py-2.5 text-sm font-bold text-white hover:bg-purple-700 disabled:opacity-50">
              {shipping ? "Creating consignment..." : "🚚 Ship Order"}
            </button>
          )}

          {/* Change log */}
          {order.changeLog?.length > 0 && (
            <div className="border-t border-gray-100 pt-4">
              <p className="text-[10px] font-bold uppercase text-gray-400 mb-2">Change History</p>
              <div className="space-y-1.5">
                {order.changeLog.map((log, i) => (
                  <div key={i} className="rounded-lg bg-yellow-50 border border-yellow-100 px-3 py-2 text-xs text-gray-700">
                    <span className="font-semibold capitalize">{log.field}</span> changed
                    {log.field === "bloc"
                      ? <span> — product updated</span>
                      : <span> from <span className="font-mono">{log.from}</span> to <span className="font-mono">{log.to}</span></span>
                    }
                    {log.at && <span className="ml-2 text-gray-400">{fmt(log.at)}</span>}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Danger zone — collapsible */}
          {order.user && (
            <div className="border-t border-gray-100 pt-4">
              <button
                type="button"
                onClick={() => setDangerOpen((v) => !v)}
                className="flex items-center gap-1.5 text-xs font-semibold text-gray-400 hover:text-red-400"
              >
                <span>{dangerOpen ? "▾" : "▸"}</span> Danger Zone
              </button>
              {dangerOpen && (
                <div className="mt-3 rounded-lg border border-red-100 bg-red-50 p-3">
                  <p className="text-xs text-red-500 mb-2">This will block the customer from placing future orders.</p>
                  <button onClick={blockCustomer} disabled={blocking}
                    className="rounded-lg border border-red-300 px-4 py-1.5 text-xs font-semibold text-red-600 hover:bg-red-100 disabled:opacity-50">
                    {blocking ? "Blocking..." : "🚫 Block This Customer"}
                  </button>
                </div>
              )}
            </div>
          )}

        </div>
      </div>
    </div>
  );
}

export default function ManageOrders() {
  const qc = useQueryClient();
  const [search, setSearch]       = useState("");
  const [updating, setUpdating]   = useState({});
  const [selectedOrder, setSelectedOrder] = useState(null);

  const { data: ordersData } = useQuery({
    queryKey: ["admin-orders"],
    queryFn: async () => (await api.get("/orders")).data,
  });
  const orders = ordersData?.orders ?? ordersData ?? [];

  async function setStatus(id, status) {
    setUpdating((p) => ({ ...p, [id]: status }));
    await api.put(`/orders/${id}/status`, { status });
    qc.invalidateQueries({ queryKey: ["admin-orders"] });
    setUpdating((p) => { const n = { ...p }; delete n[id]; return n; });
  }

  function onUpdated(updated) {
    qc.setQueryData(["admin-orders"], (old) => {
      if (!old) return old;
      const orders = old?.orders ?? old;
      const next = orders.map((o) => o._id === updated._id ? { ...o, ...updated } : o);
      return old?.orders ? { ...old, orders: next } : next;
    });
    setSelectedOrder((prev) => prev?._id === updated._id ? { ...prev, ...updated } : prev);
  }

  const filtered = orders.filter((o) => {
    const q = search.toLowerCase();
    return (
      o.orderId?.toLowerCase().includes(q) ||
      o.mobile?.toLowerCase().includes(q) ||
      o.customerName?.toLowerCase().includes(q) ||
      o.bloc?.title?.toLowerCase().includes(q)
    );
  });

  function statusOptions(current) {
    const shipped = ["shipped", "delivered", "pending_return", "returned"].includes(current);
    return shipped ? ["shipped", ...POST_SHIP, "delivered"] : PRE_SHIP;
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-ink">Orders</h1>

      <div className="mt-4 rounded-xl border border-line bg-white p-3">
        <div className="flex items-center gap-2">
          <span className="text-lg text-muted">⌕</span>
          <input type="text" value={search} onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by Order ID, mobile number, customer name, or product..."
            className="flex-1 bg-transparent text-sm outline-none placeholder-muted" />
          {search && (
            <button onClick={() => setSearch("")} className="text-xs font-semibold text-muted hover:text-ink">✕ Clear</button>
          )}
        </div>
      </div>

      <div className="mt-6 overflow-hidden rounded-xl border border-line bg-white">
        <table className="w-full text-sm">
          <thead className="bg-cream text-left text-xs uppercase text-muted">
            <tr>
              <th className="p-3">Order ID</th>
              <th className="p-3">Date</th>
              <th className="p-3">Customer</th>
              <th className="p-3">Product</th>
              <th className="p-3">Amount</th>
              <th className="p-3">Payment</th>
              <th className="p-3">TrxID</th>
              <th className="p-3">Status</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((o) => {
              const currentStatus = updating[o._id] ?? o.status;
              return (
                <tr key={o._id} className="border-t border-line hover:bg-cream/50 cursor-pointer"
                  onClick={() => setSelectedOrder(o)}>
                  <td className="p-3 font-mono text-xs font-semibold text-ink">{o.orderId}</td>
                  <td className="p-3 text-xs text-muted whitespace-nowrap">{fmt(o.createdAt)}</td>
                  <td className="p-3">
                    {o.customerName}
                    <br />
                    <span className="text-xs text-muted">{o.mobile}</span>
                  </td>
                  <td className="p-3">{o.bloc?.title}</td>
                  <td className="p-3">
                    ৳{formatPrice(o.amount + (o.deliveryCharge || 0) - (o.discount || 0))}
                    {o.deliveryCharge > 0 && (
                      <span className="block text-[10px] text-muted">+৳{o.deliveryCharge} delivery</span>
                    )}
                  </td>
                  <td className="p-3">
                    {isOnlinePaid(o.paymentMethod) ? (
                      <span className="rounded-full bg-green-100 px-2 py-0.5 text-[10px] font-bold text-green-700">🟢 Online Paid</span>
                    ) : (
                      <span className="rounded-full bg-gray-100 px-2 py-0.5 text-[10px] font-semibold text-gray-500">💵 COD</span>
                    )}
                  </td>
                  <td className="p-3 font-mono text-xs text-purple-700" onClick={(e) => e.stopPropagation()}>
                    {o.transactionId || <span className="text-muted">—</span>}
                  </td>
                  <td className="p-3" onClick={(e) => e.stopPropagation()}>
                    <select
                      value={currentStatus}
                      onChange={(e) => setStatus(o._id, e.target.value)}
                      className={`rounded-full border-0 px-3 py-1 text-xs font-semibold capitalize outline-none cursor-pointer ${statusColors[currentStatus] ?? "bg-gray-100 text-gray-600"}`}
                    >
                      {statusOptions(currentStatus).map((s) => (
                        <option key={s} value={s}>{s.replace("_", " ")}</option>
                      ))}
                    </select>
                  </td>
                </tr>
              );
            })}
            {filtered.length === 0 && (
              <tr>
                <td colSpan="8" className="p-6 text-center text-muted">
                  {search ? "No orders match your search." : "No orders yet."}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {selectedOrder && (
        <OrderEditPanel
          order={selectedOrder}
          onClose={() => setSelectedOrder(null)}
          onUpdated={onUpdated}
        />
      )}
    </div>
  );
}
