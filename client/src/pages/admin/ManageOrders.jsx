import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import api from "../../lib/api.js";
import { formatPrice } from "../../lib/format.js";

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
  });
  const [busy, setBusy]     = useState(false);
  const [msg, setMsg]       = useState("");
  const [shipping, setShipping] = useState(false);
  const [blocking, setBlocking] = useState(false);

  const isShipped = ["shipped", "delivered", "pending_return", "returned"].includes(order.status);
  const canShip   = ["confirmed", "processing"].includes(order.status);

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  async function save(e) {
    e.preventDefault();
    setBusy(true); setMsg("");
    try {
      const { data } = await api.put(`/orders/${order._id}/edit`, form);
      setMsg("✓ Saved");
      onUpdated(data);
      setTimeout(() => setMsg(""), 2000);
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
      setTimeout(() => setMsg(""), 2000);
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
    <div className="fixed inset-0 z-50 flex justify-end bg-black/40" onClick={onClose}>
      <div className="h-full w-full max-w-md overflow-y-auto bg-white shadow-2xl" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-100 bg-gray-50 px-5 py-4">
          <div>
            <p className="font-bold text-gray-900">{order.orderId}</p>
            <p className="text-xs text-gray-400">{fmt(order.createdAt)}</p>
          </div>
          <div className="flex items-center gap-2">
            <span className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase ${statusColors[order.status] || "bg-gray-100 text-gray-600"}`}>
              {order.status?.replace("_", " ")}
            </span>
            <button onClick={onClose} className="text-xl text-gray-400 hover:text-gray-700">×</button>
          </div>
        </div>

        <div className="p-5 space-y-5">
          {/* Payment badge */}
          <div className="flex items-center gap-2">
            {isOnlinePaid(order.paymentMethod) ? (
              <span className="rounded-full bg-green-100 px-3 py-1 text-xs font-bold text-green-700">🟢 Online Payment Received</span>
            ) : (
              <span className="rounded-full bg-gray-100 px-3 py-1 text-xs font-bold text-gray-600">💵 Cash on Delivery</span>
            )}
            {order.transactionId && (
              <span className="text-xs font-mono text-purple-600">TrxID: {order.transactionId}</span>
            )}
          </div>

          {/* Consignment info (after shipping) */}
          {order.consignmentId && (
            <div className="rounded-lg bg-purple-50 border border-purple-200 px-4 py-3">
              <p className="text-[10px] font-bold uppercase text-purple-400 mb-1">Courier</p>
              <p className="text-sm font-semibold text-purple-800 capitalize">{order.courierName} — {order.consignmentId}</p>
              {order.trackingStatus && (
                <p className="text-xs text-purple-600 mt-0.5">Status: {order.trackingStatus}</p>
              )}
            </div>
          )}

          {/* Edit form */}
          <form onSubmit={save} className="space-y-3">
            <p className="text-[10px] font-bold uppercase text-gray-400">Customer Details</p>
            {[
              ["customerName", "Full Name", "text"],
              ["mobile", "Mobile", "tel"],
              ["email", "Email", "email"],
              ["address", "Address", "text"],
            ].map(([k, label, type]) => (
              <div key={k}>
                <label className="block text-[10px] font-semibold uppercase text-gray-400 mb-1">{label}</label>
                <input type={type} value={form[k]} onChange={set(k)} disabled={isShipped} className={INP} />
              </div>
            ))}

            <p className="text-[10px] font-bold uppercase text-gray-400 pt-1">Delivery & Pricing</p>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[10px] font-semibold uppercase text-gray-400 mb-1">Delivery Zone</label>
                <select value={form.deliveryZone} onChange={set("deliveryZone")} disabled={isShipped} className={INP}>
                  <option value="inside_dhaka">Inside Dhaka</option>
                  <option value="outside_dhaka">Outside Dhaka</option>
                  <option value="free">Free Delivery</option>
                </select>
              </div>
              <div>
                <label className="block text-[10px] font-semibold uppercase text-gray-400 mb-1">Delivery Charge (৳)</label>
                <input type="number" min="0" value={form.deliveryCharge} onChange={set("deliveryCharge")} disabled={isShipped} className={INP} />
              </div>
            </div>
            <div>
              <label className="block text-[10px] font-semibold uppercase text-gray-400 mb-1">Discount (৳)</label>
              <input type="number" min="0" value={form.discount} onChange={set("discount")} disabled={isShipped} className={INP} />
            </div>

            {/* Courier selection (only before shipping) */}
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
                  className="w-full rounded-lg bg-brand py-2 text-sm font-bold text-white disabled:opacity-50">
                  {busy ? "Saving..." : "Save Changes"}
                </button>
              </>
            )}
          </form>

          {/* Note — always editable */}
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

          {/* Block customer */}
          {order.user && (
            <div className="border-t border-gray-100 pt-4">
              <button onClick={blockCustomer} disabled={blocking}
                className="w-full rounded-lg border border-red-200 py-2 text-sm font-semibold text-red-500 hover:bg-red-50 disabled:opacity-50">
                {blocking ? "Blocking..." : "🚫 Block This Customer"}
              </button>
              <p className="mt-1 text-center text-[10px] text-gray-400">Blocks phone number from placing future orders</p>
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
