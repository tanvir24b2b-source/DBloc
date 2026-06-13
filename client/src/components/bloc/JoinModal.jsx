import { useState } from "react";
import { createPortal } from "react-dom";
import { useText } from "../../store/ContentContext.jsx";
import { useAuthStore } from "../../store/useAuthStore.js";
import api from "../../lib/api.js";
import { formatPrice } from "../../lib/format.js";

export default function JoinModal({ bloc, onClose, onSuccess, quantity = 1 }) {
  const title = useText("join.title", "Join This Bloc");
  const ctaText = useText("join.ctaText", "CREATE ACCOUNT AND JOIN BLOC");
  const currency = useText("site.currency", "৳");
  const { user, setAuth } = useAuthStore();

  const [form, setForm] = useState({
    customerName: user?.name || "",
    mobile: user?.mobile || "",
    email: user?.email || "",
    address: user?.address || "",
    password: "",
    paymentMethod: "cod",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  async function submit(e) {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const { data } = await api.post("/orders", { blocId: bloc._id, quantity, ...form });
      // If an account was created (password provided), log the customer in with their own name.
      if (data.accessToken) setAuth({ user: data.user, accessToken: data.accessToken });
      onSuccess(data.order);
    } catch (err) {
      setError(err.response?.data?.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  return createPortal(
    <div className="modal-fade fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={onClose}>
      <div className="modal-pop max-h-[90vh] w-full max-w-md overflow-y-auto rounded-2xl bg-white p-6" onClick={(e) => e.stopPropagation()}>
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-lg font-bold text-ink">{title}</h3>
          <button onClick={onClose} className="text-xl text-muted hover:text-ink">×</button>
        </div>

        <form onSubmit={submit} className="space-y-3">
          {[
            ["customerName", "Full Name", "text", "Your name"],
            ["mobile", "Mobile Number", "tel", "e.g. 01700000000"],
            ["email", "Email", "email", "Your email"],
            ["address", "Address", "text", "Full delivery address..."],
          ].map(([k, label, type, ph]) => (
            <div key={k}>
              <label className="mb-1 block text-[11px] font-semibold uppercase text-muted">{label}</label>
              <input
                type={type} required={k !== "email"} value={form[k]} onChange={set(k)} placeholder={ph}
                className="w-full rounded-lg border border-line px-3 py-2 text-sm outline-none focus:border-brand"
              />
            </div>
          ))}

          {!user && (
            <div>
              <label className="mb-1 block text-[11px] font-semibold uppercase text-muted">Password (creates account)</label>
              <input
                type="password" value={form.password} onChange={set("password")} placeholder="Min. 6 characters"
                className="w-full rounded-lg border border-line px-3 py-2 text-sm outline-none focus:border-brand"
              />
            </div>
          )}

          <div>
            <label className="mb-1 block text-[11px] font-semibold uppercase text-muted">Payment Method</label>
            <select value={form.paymentMethod} onChange={set("paymentMethod")} className="w-full rounded-lg border border-line px-3 py-2 text-sm outline-none focus:border-brand">
              <option value="cod">Cash on Delivery</option>
              <option value="bkash">bKash</option>
              <option value="sslcommerz">Card / SSLCommerz</option>
            </select>
          </div>

          <div className="flex items-center justify-between rounded-lg bg-cream px-3 py-2 text-sm">
            <span className="text-muted">Total</span>
            <span className="font-bold text-ink">{currency}{formatPrice(bloc.blocPrice)}</span>
          </div>

          {error && <p className="text-sm text-danger">{error}</p>}

          <button disabled={loading} className="w-full rounded-full bg-brand py-3 text-sm font-bold text-white transition hover:bg-brand-hover disabled:opacity-60">
            {loading ? "Processing..." : ctaText}
          </button>
        </form>
      </div>
    </div>,
    document.body
  );
}
