import { useState } from "react";
import { NavLink, Outlet, useNavigate, useLocation } from "react-router-dom";
import { useAuthStore } from "../../store/useAuthStore.js";
import api from "../../lib/api.js";

const ROLE_LABELS = { moderator: "Moderator", subadmin: "Sub Admin", admin: "Administrator", master_admin: "Master Admin" };

const INP = "w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-brand";

function ProfileModal({ user, onClose, onUpdate }) {
  // "email" | "password" | null
  const [panel, setPanel] = useState(null);

  // Email panel state
  const [newEmail, setNewEmail] = useState("");
  const [emailBusy, setEmailBusy] = useState(false);
  const [emailMsg, setEmailMsg] = useState("");

  // Password panel state
  const [pw, setPw] = useState({ current: "", next: "", confirm: "" });
  const [pwBusy, setPwBusy] = useState(false);
  const [pwMsg, setPwMsg] = useState("");

  function openPanel(name) {
    setPanel(name);
    setNewEmail("");
    setEmailMsg("");
    setPw({ current: "", next: "", confirm: "" });
    setPwMsg("");
  }

  async function saveEmail(e) {
    e.preventDefault();
    if (!newEmail.trim()) return;
    setEmailBusy(true); setEmailMsg("");
    try {
      await api.put("/auth/profile", { email: newEmail.trim() });
      onUpdate({ email: newEmail.trim() });
      setEmailMsg("✓ Email updated successfully");
      setNewEmail("");
      setTimeout(() => setPanel(null), 1800);
    } catch (err) {
      setEmailMsg(err.response?.data?.message || "Failed to update email");
    } finally { setEmailBusy(false); }
  }

  async function savePassword(e) {
    e.preventDefault();
    if (pw.next !== pw.confirm) return setPwMsg("New passwords do not match");
    if (pw.next.length < 6) return setPwMsg("Minimum 6 characters required");
    setPwBusy(true); setPwMsg("");
    try {
      await api.put("/auth/profile", { password: pw.current, newPassword: pw.next });
      setPwMsg("✓ Password changed successfully");
      setTimeout(() => setPanel(null), 1800);
    } catch (err) {
      setPwMsg(err.response?.data?.message || "Failed to change password");
    } finally { setPwBusy(false); }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={onClose}>
      <div className="w-full max-w-sm rounded-2xl bg-white shadow-2xl overflow-hidden" onClick={(e) => e.stopPropagation()}>

        {/* Header */}
        <div className="bg-[#111] px-6 py-5 flex items-center gap-4">
          <div className="grid h-14 w-14 shrink-0 place-items-center rounded-full bg-brand text-xl font-extrabold text-white">
            {user?.name?.[0]?.toUpperCase()}
          </div>
          <div>
            <p className="text-base font-bold text-white">{user?.name}</p>
            <p className="text-xs text-gray-400 mt-0.5">{ROLE_LABELS[user?.role] || user?.role}</p>
          </div>
          <button onClick={onClose} className="ml-auto text-gray-500 hover:text-white text-2xl leading-none pb-1">×</button>
        </div>

        {/* Profile info (always visible) */}
        <div className="px-6 pt-5 pb-1 space-y-3">
          <div className="flex items-center justify-between rounded-xl bg-gray-50 px-4 py-3">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-wide text-gray-400 mb-0.5">Email Address</p>
              <p className="text-sm text-gray-800">{user?.email || "—"}</p>
            </div>
            {panel !== "email" && (
              <button onClick={() => openPanel("email")}
                className="text-xs font-semibold text-brand hover:underline shrink-0 ml-4">
                Change
              </button>
            )}
          </div>
          <div className="flex items-center justify-between rounded-xl bg-gray-50 px-4 py-3">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-wide text-gray-400 mb-0.5">Password</p>
              <p className="text-sm text-gray-400 tracking-widest">••••••••</p>
            </div>
            {panel !== "password" && (
              <button onClick={() => openPanel("password")}
                className="text-xs font-semibold text-brand hover:underline shrink-0 ml-4">
                Change
              </button>
            )}
          </div>
        </div>

        {/* Change Email panel */}
        {panel === "email" && (
          <form onSubmit={saveEmail} className="mx-6 mb-5 mt-3 rounded-xl border border-brand/20 bg-orange-50 p-4 space-y-3">
            <p className="text-xs font-bold text-ink">Change Email Address</p>
            <p className="text-[11px] text-gray-500">Enter your new email. You'll use it to log in.</p>
            <input type="email" required placeholder="New email address" value={newEmail}
              onChange={(e) => setNewEmail(e.target.value)} className={INP} />
            {emailMsg && <p className={`text-xs ${emailMsg.startsWith("✓") ? "text-green-600" : "text-red-500"}`}>{emailMsg}</p>}
            <div className="flex gap-2">
              <button type="submit" disabled={emailBusy}
                className="flex-1 rounded-lg bg-brand py-2 text-sm font-semibold text-white disabled:opacity-50">
                {emailBusy ? "Saving..." : "Update Email"}
              </button>
              <button type="button" onClick={() => setPanel(null)}
                className="flex-1 rounded-lg border border-gray-200 py-2 text-sm text-gray-500 hover:text-gray-800">
                Cancel
              </button>
            </div>
          </form>
        )}

        {/* Change Password panel */}
        {panel === "password" && (
          <form onSubmit={savePassword} className="mx-6 mb-5 mt-3 rounded-xl border border-brand/20 bg-orange-50 p-4 space-y-3">
            <p className="text-xs font-bold text-ink">Change Password</p>
            <p className="text-[11px] text-gray-500">Enter your current password to confirm your identity, then set a new one.</p>
            <input type="password" required placeholder="Current password" value={pw.current}
              onChange={(e) => setPw((p) => ({ ...p, current: e.target.value }))} className={INP} />
            <input type="password" required placeholder="New password (min. 6 characters)" value={pw.next}
              onChange={(e) => setPw((p) => ({ ...p, next: e.target.value }))} className={INP} />
            <input type="password" required placeholder="Confirm new password" value={pw.confirm}
              onChange={(e) => setPw((p) => ({ ...p, confirm: e.target.value }))} className={INP} />
            {pwMsg && <p className={`text-xs ${pwMsg.startsWith("✓") ? "text-green-600" : "text-red-500"}`}>{pwMsg}</p>}
            <div className="flex gap-2">
              <button type="submit" disabled={pwBusy}
                className="flex-1 rounded-lg bg-brand py-2 text-sm font-semibold text-white disabled:opacity-50">
                {pwBusy ? "Saving..." : "Update Password"}
              </button>
              <button type="button" onClick={() => setPanel(null)}
                className="flex-1 rounded-lg border border-gray-200 py-2 text-sm text-gray-500 hover:text-gray-800">
                Cancel
              </button>
            </div>
          </form>
        )}

        {!panel && <div className="pb-4" />}
      </div>
    </div>
  );
}

export default function AdminLayout() {
  const { user, logout, updateUser } = useAuthStore();
  const navigate = useNavigate();
  const location = useLocation();
  const [showProfile, setShowProfile] = useState(false);
  const [productsOpen, setProductsOpen] = useState(
    location.pathname.startsWith("/admin/products") ||
    location.pathname.startsWith("/admin/categories") ||
    location.pathname.startsWith("/admin/blocs")
  );
  const [settingsOpen, setSettingsOpen] = useState(
    location.pathname.startsWith("/admin/settings") ||
    location.pathname.startsWith("/admin/staff")
  );

  const isMaster = user?.role === "master_admin";

  const navCls = ({ isActive }) =>
    `flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition ${isActive ? "bg-brand text-white" : "text-gray-300 hover:bg-white/5"}`;

  return (
    <div className="flex min-h-screen bg-[#f0f0ee]">
      {/* Sidebar */}
      <aside className="flex w-52 flex-col bg-[#111] text-white">
        {/* Logo */}
        <div className="flex items-center gap-2.5 border-b border-white/10 px-4 py-4">
          <span className="grid h-8 w-8 place-items-center rounded-lg bg-brand text-base font-extrabold">D</span>
          <div>
            <p className="text-sm font-bold leading-none tracking-wide">PANEL</p>
            <p className="mt-0.5 text-[9px] uppercase tracking-widest text-gray-500">D Bloc Admin</p>
          </div>
        </div>

        <nav className="flex-1 space-y-0.5 px-2 py-3">
          <NavLink to="/admin" end className={navCls}>
            <span className="text-base">▦</span> Dashboard
          </NavLink>
          <NavLink to="/admin/orders" className={navCls}>
            <span className="text-base">🛒</span> Orders
          </NavLink>
          <NavLink to="/admin/users" className={navCls}>
            <span className="text-base">👤</span> Customers
          </NavLink>
          <NavLink to="/admin/subscribers" className={navCls}>
            <span className="text-base">✉️</span> Subscribers
          </NavLink>
          <NavLink to="/admin/bloc-requests" className={navCls}>
            <span className="text-base">📋</span> Bloc Requests
          </NavLink>

          {/* Products group */}
          <div className="mt-1">
            <button
              onClick={() => setProductsOpen((o) => !o)}
              className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-gray-300 hover:bg-white/5 transition"
            >
              <span className="text-base">📦</span>
              <span className="flex-1 text-left">Products</span>
              <span className="text-xs text-gray-500">{productsOpen ? "▴" : "▾"}</span>
            </button>
            {productsOpen && (
              <div className="ml-3 mt-0.5 space-y-0.5 border-l border-white/10 pl-3">
                <NavLink to="/admin/products" end className={navCls}>All Products</NavLink>
                <NavLink to="/admin/categories" className={navCls}>Categories</NavLink>
                <NavLink to="/admin/products/new" className={navCls}>+ Add Product</NavLink>
                <NavLink to="/admin/blocs" className={navCls}>⚡ Active Blocs</NavLink>
              </div>
            )}
          </div>

          <NavLink to="/admin/content" className={navCls}>
            <span className="text-base">✏️</span> Content
          </NavLink>
          <NavLink to="/admin/seo" className={navCls}>
            <span className="text-base">🔍</span> SEO
          </NavLink>

          {/* Settings group */}
          <div className="mt-1">
            <button
              onClick={() => setSettingsOpen((o) => !o)}
              className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-gray-300 hover:bg-white/5 transition"
            >
              <span className="text-base">⚙️</span>
              <span className="flex-1 text-left">Settings</span>
              <span className="text-xs text-gray-500">{settingsOpen ? "▴" : "▾"}</span>
            </button>
            {settingsOpen && (
              <div className="ml-3 mt-0.5 space-y-0.5 border-l border-white/10 pl-3">
                <NavLink to="/admin/settings" end className={navCls}>Site Settings</NavLink>
                {isMaster && (
                  <NavLink to="/admin/staff" className={navCls}>Users &amp; Permissions</NavLink>
                )}
              </div>
            )}
          </div>
        </nav>

        {/* User footer */}
        <div className="border-t border-white/10 px-4 py-3">
          <button
            onClick={() => setShowProfile(true)}
            className="flex w-full items-center gap-3 rounded-lg px-1 py-1 text-left hover:bg-white/5 transition"
          >
            <div className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-brand text-sm font-extrabold text-white">
              {user?.name?.[0]?.toUpperCase()}
            </div>
            <div className="min-w-0">
              <p className="truncate text-xs font-semibold text-white">{user?.name}</p>
              <p className="text-[10px] text-gray-500">{ROLE_LABELS[user?.role] || user?.role}</p>
            </div>
          </button>
          <button
            onClick={() => { logout(); navigate("/admin/login"); }}
            className="mt-2 flex items-center gap-1.5 text-xs text-gray-500 hover:text-brand transition"
          >
            <span>→</span> Logout
          </button>
        </div>
      </aside>

      {/* Main */}
      <div className="flex flex-1 flex-col">
        {/* Top bar */}
        <header className="flex items-center justify-between border-b border-gray-200 bg-white px-6 py-3">
          <div className="flex items-center gap-3">
            <div className="relative">
              <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-gray-400">⌕</span>
              <input placeholder="Search everything..." className="w-64 rounded-lg border border-gray-200 bg-gray-50 py-1.5 pl-8 pr-3 text-sm outline-none focus:border-brand" />
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="text-right">
              <p className="text-xs font-bold text-gray-800">{user?.name?.toUpperCase()}</p>
              <p className="text-[10px] text-gray-400">{ROLE_LABELS[user?.role] || user?.role}</p>
            </div>
            <div className="grid h-8 w-8 place-items-center rounded-full bg-brand/10 text-sm font-bold text-brand">
              {user?.name?.[0]?.toUpperCase()}
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-6">
          <Outlet />
        </main>
      </div>
      {showProfile && <ProfileModal user={user} onClose={() => setShowProfile(false)} onUpdate={updateUser} />}
    </div>
  );
}
