import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuthStore } from "../store/useAuthStore.js";
import api from "../lib/api.js";
import Logo from "../components/common/Logo.jsx";

export default function Login() {
  const { setAuth } = useAuthStore();
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit(e) {
    e.preventDefault();
    setLoading(true); setError("");
    try {
      const { data } = await api.post("/auth/login", form);
      // Customer site is for customers only — staff/admin must use the admin panel.
      if (data.user?.role !== "user") {
        setError("This account is a staff account. Please use the admin panel to sign in.");
        setLoading(false);
        return;
      }
      setAuth({ user: data.user, accessToken: data.accessToken });
      navigate("/");
    } catch (err) {
      setError(err.response?.data?.message || "Login failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto max-w-sm px-6 py-16">
      <div className="mb-6 flex justify-center"><Logo /></div>
      <h1 className="text-center text-2xl font-bold text-ink">Welcome back</h1>
      <form onSubmit={submit} className="mt-6 space-y-3">
        <input type="email" required placeholder="Email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })}
          className="w-full rounded-lg border border-line px-4 py-2.5 text-sm outline-none focus:border-brand" />
        <input type="password" required placeholder="Password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })}
          className="w-full rounded-lg border border-line px-4 py-2.5 text-sm outline-none focus:border-brand" />
        {error && <p className="text-sm text-danger">{error}</p>}
        <button disabled={loading} className="w-full rounded-full bg-brand py-2.5 text-sm font-bold text-white hover:bg-brand-hover disabled:opacity-60">
          {loading ? "..." : "Log In"}
        </button>
      </form>
      <p className="mt-3 text-center text-sm">
        <Link to="/forgot-password" className="font-semibold text-brand hover:underline">Forgot password?</Link>
      </p>
      <p className="mt-2 text-center text-sm text-muted">
        No account? <Link to="/register" className="font-semibold text-brand">Register</Link>
      </p>
    </div>
  );
}
