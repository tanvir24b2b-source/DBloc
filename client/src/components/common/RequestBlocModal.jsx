import { useState } from "react";
import { createPortal } from "react-dom";
import { useAuthStore } from "../../store/useAuthStore.js";
import api from "../../lib/api.js";

export default function RequestBlocModal({ onClose }) {
  const { user } = useAuthStore();
  const [form, setForm] = useState({
    productName: "",
    category: "",
    description: "",
    name: user?.name || "",
    mobile: user?.mobile || "",
    email: user?.email || "",
  });
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState("");

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  async function submit(e) {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      await api.post("/bloc-requests", form);
      setDone(true);
    } catch (err) {
      setError(err.response?.data?.message || "Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return createPortal(
    <div
      className="modal-fade fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      onClick={onClose}
    >
      <div
        className="modal-pop w-full max-w-md overflow-y-auto rounded-2xl bg-white p-6 max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {done ? (
          <div className="py-8 text-center space-y-3">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-green-100 text-2xl">✓</div>
            <h3 className="text-lg font-bold text-ink">Request Submitted!</h3>
            <p className="text-sm text-muted">
              Thanks! We'll review your request and try to launch this Bloc soon.
            </p>
            <button
              onClick={onClose}
              className="mt-2 w-full rounded-full bg-brand py-3 text-sm font-bold text-white hover:bg-brand-hover transition"
            >
              Close
            </button>
          </div>
        ) : (
          <>
            <div className="mb-5 flex items-center justify-between">
              <div>
                <h3 className="text-lg font-bold text-ink">Request a Bloc</h3>
                <p className="text-xs text-muted mt-0.5">Tell us what deal you want next</p>
              </div>
              <button onClick={onClose} className="text-xl text-muted hover:text-ink leading-none">×</button>
            </div>

            <form onSubmit={submit} className="space-y-3">
              <div>
                <label className="mb-1 block text-[11px] font-semibold uppercase tracking-wide text-muted">
                  Product Name <span className="text-danger">*</span>
                </label>
                <input
                  required value={form.productName} onChange={set("productName")}
                  placeholder="e.g. iPhone 15, Sony Headphones..."
                  className="w-full rounded-lg border border-line px-3 py-2 text-sm outline-none focus:border-brand"
                />
              </div>

              <div>
                <label className="mb-1 block text-[11px] font-semibold uppercase tracking-wide text-muted">Category</label>
                <input
                  value={form.category} onChange={set("category")}
                  placeholder="e.g. Electronics, Home & Kitchen..."
                  className="w-full rounded-lg border border-line px-3 py-2 text-sm outline-none focus:border-brand"
                />
              </div>

              <div>
                <label className="mb-1 block text-[11px] font-semibold uppercase tracking-wide text-muted">
                  Why do you want this? <span className="text-danger">*</span>
                </label>
                <textarea
                  required rows={3} value={form.description} onChange={set("description")}
                  placeholder="Tell us why this would make a great Bloc deal..."
                  className="w-full rounded-lg border border-line px-3 py-2 text-sm outline-none focus:border-brand resize-none"
                />
              </div>

              <div className="border-t border-line pt-3">
                <p className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-muted">Your Contact</p>
                <div className="space-y-2">
                  <input
                    required value={form.name} onChange={set("name")}
                    placeholder="Your name"
                    className="w-full rounded-lg border border-line px-3 py-2 text-sm outline-none focus:border-brand"
                  />
                  <input
                    type="tel" value={form.mobile} onChange={set("mobile")}
                    placeholder="Mobile number"
                    className="w-full rounded-lg border border-line px-3 py-2 text-sm outline-none focus:border-brand"
                  />
                  <input
                    type="email" value={form.email} onChange={set("email")}
                    placeholder="Email (optional)"
                    className="w-full rounded-lg border border-line px-3 py-2 text-sm outline-none focus:border-brand"
                  />
                </div>
              </div>

              {error && <p className="text-sm text-danger">{error}</p>}

              <button
                disabled={loading}
                className="w-full rounded-full bg-brand py-3 text-sm font-bold text-white transition hover:bg-brand-hover disabled:opacity-60"
              >
                {loading ? "Submitting..." : "Submit Request →"}
              </button>
            </form>
          </>
        )}
      </div>
    </div>,
    document.body
  );
}
