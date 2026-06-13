import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import api from "../lib/api.js";
import Logo from "../components/common/Logo.jsx";

export default function ForgotPassword() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: "", mobile: "", newPassword: "", confirm: "" });
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);
  const [loading, setLoading] = useState(false);

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  async function submit(e) {
    e.preventDefault();
    setError("");
    if (form.newPassword !== form.confirm) {
      setError("New passwords do not match.");
      return;
    }
    setLoading(true);
    try {
      await api.post("/auth/forgot-password", {
        email: form.email,
        mobile: form.mobile,
        newPassword: form.newPassword,
      });
      setDone(true);
      setTimeout(() => navigate("/login"), 2000);
    } catch (err) {
      setError(err.response?.data?.message || "Reset failed. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto max-w-sm px-6 py-16">
      <div className="mb-6 flex justify-center"><Logo /></div>
      <h1 className="text-center text-2xl font-bold text-ink">Reset Password</h1>
      <p className="mt-2 text-center text-sm text-muted">
        Verify your identity with the email and mobile number on your account.
      </p>

      {done ? (
        <div className="mt-6 rounded-lg bg-green-50 px-4 py-4 text-center text-sm font-semibold text-green-700">
          ✓ Password reset successful! Redirecting to login...
        </div>
      ) : (
        <form onSubmit={submit} className="mt-6 space-y-3">
          <input type="email" required placeholder="Account email" value={form.email} onChange={set("email")}
            className="w-full rounded-lg border border-line px-4 py-2.5 text-sm outline-none focus:border-brand" />
          <input type="tel" required placeholder="Registered mobile number" value={form.mobile} onChange={set("mobile")}
            className="w-full rounded-lg border border-line px-4 py-2.5 text-sm outline-none focus:border-brand" />
          <input type="password" required placeholder="New password (min. 6 chars)" value={form.newPassword} onChange={set("newPassword")}
            className="w-full rounded-lg border border-line px-4 py-2.5 text-sm outline-none focus:border-brand" autoComplete="new-password" />
          <input type="password" required placeholder="Confirm new password" value={form.confirm} onChange={set("confirm")}
            className="w-full rounded-lg border border-line px-4 py-2.5 text-sm outline-none focus:border-brand" autoComplete="new-password" />
          {error && <p className="text-sm text-danger">{error}</p>}
          <button disabled={loading} className="w-full rounded-full bg-brand py-2.5 text-sm font-bold text-white hover:bg-brand-hover disabled:opacity-60">
            {loading ? "..." : "Reset Password"}
          </button>
        </form>
      )}

      <p className="mt-4 text-center text-sm text-muted">
        Remembered it? <Link to="/login" className="font-semibold text-brand">Back to login</Link>
      </p>
    </div>
  );
}
