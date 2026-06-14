import { useState, useEffect } from "react";
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

  const [gateways, setGateways] = useState([]);
  useEffect(() => {
    api.get("/payment-gateways").then(({ data }) => {
      setGateways(data.gateways);
      const def = data.gateways.find((g) => g.isDefault) || data.gateways[0];
      if (def) setForm((f) => ({ ...f, paymentMethod: def.type }));
    }).catch(() => {});
  }, []);

  const stripCountryCode = (num = "") => num.replace(/^\+?880/, "0").replace(/\D/g, "").slice(0, 11);

  const [form, setForm] = useState({
    customerName: user?.name || "",
    mobile: stripCountryCode(user?.mobile || ""),
    email: user?.email || "",
    address: user?.address || "",
    password: "",
    paymentMethod: "cod",
    transactionId: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const selectedGateway = gateways.find((g) => g.type === form.paymentMethod);
  const isManual = selectedGateway?.type === "bkashmanual";

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  function handleMobile(e) {
    // Allow only digits, max 11
    const digits = e.target.value.replace(/\D/g, "").slice(0, 11);
    setForm((f) => ({ ...f, mobile: digits }));
  }

  async function submit(e) {
    e.preventDefault();
    if (form.mobile.length !== 11) {
      setError("Mobile number must be exactly 11 digits (e.g. 01700000000)");
      return;
    }
    if (isManual && !form.transactionId.trim()) {
      setError("Please enter your bKash Transaction ID");
      return;
    }
    setLoading(true);
    setError("");
    const payload = { ...form };
    try {
      const { data } = await api.post("/orders", { blocId: bloc._id, quantity, ...payload });
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

          {/* Bangladesh mobile field */}
          <div>
            <label className="mb-1 block text-[11px] font-semibold uppercase text-muted">Mobile Number</label>
            <div className="flex rounded-lg border border-line overflow-hidden focus-within:border-brand">
              <span className="flex items-center gap-1.5 bg-gray-100 px-3 text-sm font-semibold text-gray-600 border-r border-line shrink-0 select-none">
                🇧🇩 +880
              </span>
              <input
                type="tel"
                required
                value={form.mobile}
                onChange={handleMobile}
                placeholder="01700000000"
                maxLength={11}
                inputMode="numeric"
                className="flex-1 px-3 py-2 text-sm outline-none bg-white"
              />
              <span className={`flex items-center pr-3 text-xs font-semibold shrink-0 ${form.mobile.length === 11 ? "text-green-500" : "text-gray-400"}`}>
                {form.mobile.length}/11
              </span>
            </div>
            {form.mobile.length > 0 && form.mobile.length < 11 && (
              <p className="mt-1 text-[11px] text-red-500">{11 - form.mobile.length} more digit{11 - form.mobile.length !== 1 ? "s" : ""} needed</p>
            )}
          </div>

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
            <div className="space-y-2">
              {gateways.map((gw) => (
                <label key={gw.type} className={`flex items-center gap-3 rounded-lg border px-3 py-2.5 cursor-pointer transition ${form.paymentMethod === gw.type ? "border-brand bg-orange-50" : "border-line bg-white hover:border-brand/40"}`}>
                  <input type="radio" name="paymentMethod" value={gw.type} checked={form.paymentMethod === gw.type} onChange={set("paymentMethod")} className="accent-brand" />
                  <span className="text-sm font-medium text-ink">{gw.displayName}</span>
                  {gw.isDefault && <span className="ml-auto text-[10px] font-bold text-brand uppercase">Default</span>}
                </label>
              ))}
              {gateways.length === 0 && (
                <select value={form.paymentMethod} onChange={set("paymentMethod")} className="w-full rounded-lg border border-line px-3 py-2 text-sm outline-none focus:border-brand">
                  <option value="cod">Cash on Delivery</option>
                </select>
              )}
            </div>
          </div>

          {/* Manual bKash payment instructions */}
          {isManual && (
            <div className="rounded-xl border border-purple-200 bg-purple-50 p-4 space-y-3">
              <p className="text-xs font-bold text-purple-700 uppercase tracking-wide">💜 bKash Manual Payment</p>
              {selectedGateway.manualInstructions && (
                <p className="text-xs text-purple-800">{selectedGateway.manualInstructions}</p>
              )}
              {selectedGateway.manualNumber && (
                <div className="flex items-center gap-3">
                  <div className="flex-1 rounded-lg bg-white border border-purple-200 px-3 py-2">
                    <p className="text-[10px] font-semibold uppercase text-purple-400 mb-0.5">Send To</p>
                    <p className="text-base font-extrabold text-purple-700 tracking-wider">{selectedGateway.manualNumber}</p>
                  </div>
                  <a
                    href={`bkash://send?number=${selectedGateway.manualNumber}&amount=${bloc.blocPrice}`}
                    className="shrink-0 rounded-xl bg-purple-600 px-4 py-3 text-center text-xs font-bold text-white hover:bg-purple-700 active:scale-95 transition"
                  >
                    Open<br />bKash App
                  </a>
                </div>
              )}
              <div>
                <label className="mb-1 block text-[11px] font-semibold uppercase text-purple-600">Transaction ID (TrxID)</label>
                <input
                  type="text"
                  required
                  value={form.transactionId}
                  onChange={(e) => setForm((f) => ({ ...f, transactionId: e.target.value.trim() }))}
                  placeholder="e.g. 8N6A3XYZ12"
                  className="w-full rounded-lg border border-purple-300 px-3 py-2 text-sm outline-none focus:border-purple-500 bg-white font-mono"
                />
                <p className="mt-1 text-[10px] text-purple-500">Find TrxID in bKash app → Send Money → Transaction History</p>
              </div>
            </div>
          )}

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
