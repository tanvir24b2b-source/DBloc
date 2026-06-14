import { useState } from "react";
import { useText } from "../store/ContentContext.jsx";
import api from "../lib/api.js";
import { formatPrice } from "../lib/format.js";
import EditableText from "../components/common/EditableText.jsx";

const statusSteps = ["pending", "confirmed", "processing", "shipped", "delivered"];

export default function TrackOrder() {
  const placeholder = useText("track.placeholder", "Order ID or Mobile");
  const currency = useText("site.currency", "৳");
  const [q, setQ] = useState("");
  const [orders, setOrders] = useState(null);
  const [error, setError] = useState("");

  async function search(e) {
    e.preventDefault();
    setError(""); setOrders(null);
    const isOrderId = /^DB/i.test(q.trim());
    const params = isOrderId ? { orderId: q.trim() } : { mobile: q.trim() };
    try {
      const { data } = await api.get("/orders/track", { params });
      setOrders(data);
    } catch (err) {
      setError(err.response?.data?.message || "No orders found");
    }
  }

  return (
    <div className="mx-auto max-w-2xl px-6 py-12">
      <h1 className="text-center text-3xl font-bold text-ink">
        <EditableText keyName="track.title" fallback="Track Your Order" />
      </h1>
      <p className="mt-2 text-center text-muted">
        <EditableText keyName="track.subtitle" fallback="Enter your Order ID or mobile number" />
      </p>

      <form onSubmit={search} className="mx-auto mt-8 flex max-w-md gap-2">
        <input value={q} onChange={(e) => setQ(e.target.value)} required placeholder={placeholder}
          className="flex-1 rounded-full border border-line bg-white px-5 py-3 text-sm outline-none focus:border-brand" />
        <button className="rounded-full bg-brand px-6 py-3 text-sm font-bold text-white hover:bg-brand-hover">
          <EditableText keyName="track.ctaText" fallback="Track Order" />
        </button>
      </form>

      {error && <p className="mt-6 text-center text-danger">{error}</p>}

      {orders?.map((o) => {
        const stepIdx = statusSteps.indexOf(o.status);
        return (
          <div key={o._id} className="mt-6 rounded-xl border border-line bg-white p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-bold text-ink">{o.bloc?.title}</p>
                <p className="text-xs text-muted">Order {o.orderId}</p>
              </div>
              <p className="font-bold text-brand">{currency}{formatPrice(o.amount + (o.deliveryCharge || 0))}</p>
            </div>

            {o.status === "cancelled" ? (
              <p className="mt-4 font-semibold text-danger">Cancelled</p>
            ) : (
              <div className="mt-5 flex justify-between">
                {statusSteps.map((s, i) => (
                  <div key={s} className="flex flex-1 flex-col items-center">
                    <div className={`grid h-7 w-7 place-items-center rounded-full text-xs ${i <= stepIdx ? "bg-brand text-white" : "bg-line text-muted"}`}>
                      {i <= stepIdx ? "✓" : i + 1}
                    </div>
                    <span className="mt-1 text-[10px] capitalize text-muted">{s}</span>
                  </div>
                ))}
              </div>
            )}
            {o.trackingStatus && (
              <div className="mt-3 rounded-lg bg-purple-50 border border-purple-200 px-3 py-2">
                <p className="text-[10px] font-bold uppercase text-purple-400">Delivery Update</p>
                <p className="text-sm font-semibold text-purple-800">{o.trackingStatus}</p>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
