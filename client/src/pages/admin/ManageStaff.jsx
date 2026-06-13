import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuthStore } from "../../store/useAuthStore.js";
import api from "../../lib/api.js";

const ROLES = ["moderator", "subadmin", "admin"];
const ROLE_LABELS = { moderator: "Moderator", subadmin: "Sub Admin", admin: "Administrator", master_admin: "Master Admin" };
const ROLE_COLORS = {
  master_admin: "bg-purple-100 text-purple-700",
  admin: "bg-orange-100 text-orange-700",
  subadmin: "bg-blue-100 text-blue-700",
  moderator: "bg-gray-100 text-gray-600",
};

const PERMISSIONS = [
  { key: "orders",    label: "Orders",          desc: "View & update order status" },
  { key: "products",  label: "Products & Blocs", desc: "Add/edit products, launch blocs" },
  { key: "customers", label: "Customers",        desc: "View & manage customers" },
  { key: "content",   label: "Content (CMS)",    desc: "Edit site text & images" },
  { key: "settings",  label: "Site Settings",    desc: "Change site configuration" },
];

const emptyForm = { name: "", email: "", password: "", role: "moderator", permissions: [] };

function togglePerm(perms, key) {
  return perms.includes(key) ? perms.filter((p) => p !== key) : [...perms, key];
}

function PermCheckboxes({ perms, onChange }) {
  return (
    <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
      {PERMISSIONS.map((p) => (
        <label key={p.key} className={`flex cursor-pointer items-start gap-2 rounded-lg border p-2.5 text-xs transition
          ${perms.includes(p.key) ? "border-brand bg-brand/[0.04]" : "border-gray-200 hover:border-gray-300"}`}>
          <input type="checkbox" checked={perms.includes(p.key)} onChange={() => onChange(p.key)} className="mt-0.5 accent-brand" />
          <span>
            <span className="block font-semibold text-gray-800">{p.label}</span>
            <span className="block text-[11px] text-gray-400">{p.desc}</span>
          </span>
        </label>
      ))}
    </div>
  );
}

export default function ManageStaff() {
  const { user: me } = useAuthStore();
  const qc = useQueryClient();
  const [form, setForm] = useState(emptyForm);
  const [formErr, setFormErr] = useState("");
  const [formOk, setFormOk] = useState("");
  const [editing, setEditing] = useState(null); // { id, name, email, password, role, permissions }

  const { data: staff = [], isLoading } = useQuery({
    queryKey: ["staff"],
    queryFn: () => api.get("/admin/staff").then((r) => r.data),
  });

  const createMut = useMutation({
    mutationFn: (body) => api.post("/admin/staff", body),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["staff"] });
      setForm(emptyForm);
      setFormErr("");
      setFormOk("User created successfully.");
      setTimeout(() => setFormOk(""), 3000);
    },
    onError: (e) => setFormErr(e.response?.data?.message || "Failed to create user"),
  });

  const updateMut = useMutation({
    mutationFn: ({ id, ...body }) => api.put(`/admin/staff/${id}`, body),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["staff"] }); setEditing(null); },
  });

  const deleteMut = useMutation({
    mutationFn: (id) => api.delete(`/admin/staff/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["staff"] }),
  });

  const setF = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));
  const setE = (k) => (e) => setEditing((f) => ({ ...f, [k]: e.target.value }));

  function startEdit(s) {
    setEditing({ id: s._id, name: s.name, email: s.email, password: "", role: s.role, permissions: s.permissions || [] });
  }

  function saveEdit() {
    const body = { name: editing.name, role: editing.role, permissions: editing.permissions };
    if (editing.password) body.password = editing.password;
    updateMut.mutate({ id: editing.id, ...body });
  }

  const fieldCls = "w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm outline-none focus:border-brand";
  const labelCls = "mb-1 block text-[11px] font-bold uppercase tracking-wider text-gray-400";

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-xl font-extrabold tracking-tight text-gray-900">Users &amp; Permissions</h1>
        <p className="mt-1 text-sm text-gray-500">Add staff accounts and control exactly what each person can access in the admin panel.</p>
      </div>

      {/* Two-panel layout */}
      <div className="flex gap-6 flex-col lg:flex-row">

        {/* LEFT — Add User form */}
        <div className="w-full lg:w-80 shrink-0">
          <div className="rounded-2xl border border-gray-200 bg-white p-5">
            <h2 className="mb-4 text-sm font-bold uppercase tracking-wider text-gray-500">Add New User</h2>
            <form onSubmit={(e) => { e.preventDefault(); setFormErr(""); createMut.mutate(form); }} className="space-y-3">

              <div>
                <label className={labelCls}>Full Name</label>
                <input required value={form.name} onChange={setF("name")} placeholder="e.g. Rahim Uddin" className={fieldCls} />
              </div>

              <div>
                <label className={labelCls}>Email</label>
                <input required type="email" value={form.email} onChange={setF("email")} placeholder="staff@dblock.bd" className={fieldCls} />
              </div>

              <div>
                <label className={labelCls}>Password</label>
                <input required type="password" value={form.password} onChange={setF("password")} placeholder="Min. 6 characters" className={fieldCls} />
              </div>

              <div>
                <label className={labelCls}>Role</label>
                <select value={form.role} onChange={setF("role")} className={fieldCls}>
                  {ROLES.map((r) => <option key={r} value={r}>{ROLE_LABELS[r]}</option>)}
                </select>
              </div>

              <div>
                <label className={labelCls}>Permissions</label>
                <PermCheckboxes perms={form.permissions} onChange={(k) => setForm((f) => ({ ...f, permissions: togglePerm(f.permissions, k) }))} />
              </div>

              <button disabled={createMut.isPending}
                className="w-full rounded-xl bg-brand py-2.5 text-sm font-bold text-white hover:bg-brand-hover disabled:opacity-60">
                {createMut.isPending ? "Creating..." : "Create User"}
              </button>

              {formErr && <p className="text-xs text-red-500">{formErr}</p>}
              {formOk  && <p className="text-xs text-green-600">{formOk}</p>}
            </form>
          </div>
        </div>

        {/* RIGHT — User list */}
        <div className="flex-1 min-w-0">
          <div className="rounded-2xl border border-gray-200 bg-white overflow-hidden">
            <div className="border-b border-gray-100 px-5 py-3 flex items-center justify-between">
              <h2 className="text-sm font-bold uppercase tracking-wider text-gray-500">Staff Accounts</h2>
              <span className="text-xs text-gray-400">{staff.length} user{staff.length !== 1 ? "s" : ""}</span>
            </div>

            {isLoading ? (
              <p className="px-5 py-8 text-center text-sm text-gray-400">Loading...</p>
            ) : staff.length === 0 ? (
              <p className="px-5 py-8 text-center text-sm text-gray-400">No staff accounts yet.</p>
            ) : (
              <div className="divide-y divide-gray-100">
                {staff.map((s) => {
                  const isSelf = s._id === me?._id;
                  const isMaster = s.role === "master_admin";
                  const isEditing = editing?.id === s._id;

                  return (
                    <div key={s._id} className="px-5 py-4">
                      {/* Row summary */}
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex items-center gap-3 min-w-0">
                          {/* Avatar */}
                          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gray-100 text-sm font-bold text-gray-500 uppercase">
                            {s.name?.[0] || "?"}
                          </div>
                          <div className="min-w-0">
                            <p className="text-sm font-semibold text-gray-900 truncate">
                              {s.name}
                              {isSelf && <span className="ml-2 text-[10px] font-bold text-brand">(you)</span>}
                            </p>
                            <p className="text-xs text-gray-400 truncate">{s.email}</p>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          <span className={`rounded-full px-2.5 py-0.5 text-[11px] font-bold ${ROLE_COLORS[s.role] || "bg-gray-100 text-gray-600"}`}>
                            {ROLE_LABELS[s.role] || s.role}
                          </span>
                          {s.banned && <span className="rounded-full bg-red-50 px-2 py-0.5 text-[11px] font-bold text-red-500">Suspended</span>}
                        </div>
                      </div>

                      {/* Permissions badges (collapsed view) */}
                      {!isEditing && !isMaster && (
                        <div className="mt-2 flex flex-wrap gap-1 pl-12">
                          {(s.permissions?.length ? s.permissions : []).map((pk) => {
                            const p = PERMISSIONS.find((x) => x.key === pk);
                            return <span key={pk} className="rounded-md bg-gray-100 px-1.5 py-0.5 text-[10px] font-semibold text-gray-600">{p?.label || pk}</span>;
                          })}
                          {(!s.permissions || s.permissions.length === 0) && (
                            <span className="text-[11px] text-gray-300">No permissions assigned</span>
                          )}
                        </div>
                      )}
                      {!isEditing && isMaster && (
                        <p className="mt-1 pl-12 text-[11px] font-semibold text-purple-500">Full access — all permissions</p>
                      )}

                      {/* Action buttons */}
                      {!isMaster && !isSelf && !isEditing && (
                        <div className="mt-3 flex gap-2 pl-12">
                          <button onClick={() => startEdit(s)}
                            className="rounded-lg border border-gray-200 px-3 py-1 text-xs font-semibold text-gray-600 hover:border-brand hover:text-brand">
                            Edit
                          </button>
                          <button onClick={() => updateMut.mutate({ id: s._id, banned: !s.banned })}
                            className="rounded-lg border border-gray-200 px-3 py-1 text-xs font-semibold text-gray-600 hover:border-brand hover:text-brand">
                            {s.banned ? "Unsuspend" : "Suspend"}
                          </button>
                          <button onClick={() => { if (confirm(`Remove ${s.name}?`)) deleteMut.mutate(s._id); }}
                            className="rounded-lg border border-red-200 px-3 py-1 text-xs font-semibold text-red-500 hover:bg-red-50">
                            Remove
                          </button>
                        </div>
                      )}

                      {/* Inline edit panel */}
                      {isEditing && (
                        <div className="mt-4 rounded-xl border border-brand/30 bg-brand/[0.02] p-4 space-y-3">
                          <p className="text-xs font-bold uppercase tracking-wider text-brand">Editing — {s.name}</p>

                          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                            <div>
                              <label className={labelCls}>Full Name</label>
                              <input value={editing.name} onChange={setE("name")} className={fieldCls} />
                            </div>
                            <div>
                              <label className={labelCls}>Email</label>
                              <input type="email" value={editing.email} onChange={setE("email")} className={fieldCls} disabled
                                title="Email cannot be changed" />
                            </div>
                            <div>
                              <label className={labelCls}>New Password <span className="normal-case font-normal text-gray-400">(leave blank to keep)</span></label>
                              <input type="password" value={editing.password} onChange={setE("password")} placeholder="Enter new password" className={fieldCls} />
                            </div>
                            <div>
                              <label className={labelCls}>Role</label>
                              <select value={editing.role} onChange={setE("role")} className={fieldCls}>
                                {ROLES.map((r) => <option key={r} value={r}>{ROLE_LABELS[r]}</option>)}
                              </select>
                            </div>
                          </div>

                          <div>
                            <label className={labelCls}>Permissions</label>
                            <PermCheckboxes
                              perms={editing.permissions}
                              onChange={(k) => setEditing((f) => ({ ...f, permissions: togglePerm(f.permissions, k) }))}
                            />
                          </div>

                          <div className="flex gap-2 pt-1">
                            <button onClick={saveEdit} disabled={updateMut.isPending}
                              className="rounded-lg bg-brand px-4 py-1.5 text-xs font-bold text-white hover:bg-brand-hover disabled:opacity-60">
                              {updateMut.isPending ? "Saving..." : "Save Changes"}
                            </button>
                            <button onClick={() => setEditing(null)}
                              className="rounded-lg border border-gray-200 px-4 py-1.5 text-xs font-semibold text-gray-500 hover:border-gray-400">
                              Cancel
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
