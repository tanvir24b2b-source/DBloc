import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuthStore } from "../../store/useAuthStore.js";
import api from "../../lib/api.js";

const STAFF_ROLES = ["moderator", "subadmin", "admin", "master_admin"];

const ROLE_LABELS = {
  moderator: "Moderator",
  subadmin: "Sub Admin",
  admin: "Administrator",
  master_admin: "Master Admin",
};

export default function AdminLogin() {
  const navigate = useNavigate();
  const { setAuth } = useAuthStore();
  const [form, setForm] = useState({ email: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  async function submit(e) {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const { data } = await api.post("/auth/login", form);
      if (!STAFF_ROLES.includes(data.user?.role)) {
        setError("This login is for staff only. Customers please use the main site login.");
        setLoading(false);
        return;
      }
      setAuth({ user: data.user, accessToken: data.accessToken });
      navigate("/admin");
    } catch (err) {
      setError(err.response?.data?.message || "Invalid credentials");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-dark px-4">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="mb-8 text-center">
          <div className="mb-3 inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-brand text-2xl font-extrabold text-white shadow-lg shadow-brand/40">D</div>
          <h1 className="text-2xl font-extrabold text-white">D BLOC Admin</h1>
          <p className="mt-1 text-sm text-gray-400">Staff access only</p>
        </div>

        <form onSubmit={submit} className="space-y-4 rounded-2xl bg-dark-soft p-6 shadow-xl">
          <div>
            <label className="mb-1 block text-[11px] font-bold uppercase tracking-wider text-gray-400">Email</label>
            <input
              type="email" required value={form.email} onChange={set("email")}
              placeholder="admin@dblock.bd"
              className="w-full rounded-xl border border-gray-700 bg-dark px-4 py-2.5 text-sm text-white placeholder-gray-600 outline-none focus:border-brand"
            />
          </div>
          <div>
            <label className="mb-1 block text-[11px] font-bold uppercase tracking-wider text-gray-400">Password</label>
            <input
              type="password" required value={form.password} onChange={set("password")}
              placeholder="••••••••"
              className="w-full rounded-xl border border-gray-700 bg-dark px-4 py-2.5 text-sm text-white placeholder-gray-600 outline-none focus:border-brand"
            />
          </div>

          {error && <p className="rounded-lg bg-red-900/30 px-3 py-2 text-sm text-red-400">{error}</p>}

          <button
            disabled={loading}
            className="w-full rounded-xl bg-brand py-3 text-sm font-bold text-white transition hover:bg-brand-hover disabled:opacity-60"
          >
            {loading ? "Signing in..." : "Sign In to Admin Panel"}
          </button>
        </form>

        <p className="mt-6 text-center text-xs text-gray-600">
          Not staff?{" "}
          <a href="/" className="text-gray-400 hover:text-white">← Back to store</a>
        </p>
      </div>
    </div>
  );
}
