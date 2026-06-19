import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuthStore } from "../store/useAuthStore.js";
import Logo from "../components/common/Logo.jsx";

export default function Register() {
  const { register } = useAuthStore();
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: "", email: "", mobile: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  async function submit(e) {
    e.preventDefault();
    if (!/^01[0-9]{9}$/.test(form.mobile)) {
      setError("Enter a valid 11-digit Bangladeshi mobile number");
      return;
    }
    setLoading(true); setError("");
    try {
      await register(form);
      navigate("/");
    } catch (err) {
      setError(err.response?.data?.message || "Registration failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto max-w-sm px-6 py-16">
      <div className="mb-6 flex justify-center"><Logo /></div>
      <h1 className="text-center text-2xl font-bold text-ink">Create account</h1>
      <form onSubmit={submit} className="mt-6 space-y-3">
        <input required placeholder="Full name" value={form.name} onChange={set("name")} className="w-full rounded-lg border border-line px-4 py-2.5 text-sm outline-none focus:border-brand" />
        <input type="email" required placeholder="Email" value={form.email} onChange={set("email")} className="w-full rounded-lg border border-line px-4 py-2.5 text-sm outline-none focus:border-brand" />
        <input type="tel" placeholder="Mobile (e.g. 01700000000)" value={form.mobile} onChange={set("mobile")} pattern="01[0-9]{9}" maxLength={11} className="w-full rounded-lg border border-line px-4 py-2.5 text-sm outline-none focus:border-brand" />
        <input type="password" required placeholder="Password" value={form.password} onChange={set("password")} className="w-full rounded-lg border border-line px-4 py-2.5 text-sm outline-none focus:border-brand" />
        {error && <p className="text-sm text-danger">{error}</p>}
        <button disabled={loading} className="w-full rounded-full bg-brand py-2.5 text-sm font-bold text-white hover:bg-brand-hover disabled:opacity-60">
          {loading ? "..." : "Create Account"}
        </button>
      </form>
      <p className="mt-4 text-center text-sm text-muted">
        Have an account? <Link to="/login" className="font-semibold text-brand">Log in</Link>
      </p>
    </div>
  );
}
