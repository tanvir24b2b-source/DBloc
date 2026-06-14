import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "../../lib/api.js";
import { formatPrice } from "../../lib/format.js";

const TABS = ["pending", "reviewed", "launched", "rejected"];

const TAB_STYLE = {
  pending:  { active: "border-yellow-500 text-yellow-600", dot: "bg-yellow-400", badge: "bg-yellow-50 text-yellow-700 border-yellow-200" },
  reviewed: { active: "border-blue-500 text-blue-600",    dot: "bg-blue-400",   badge: "bg-blue-50 text-blue-700 border-blue-200" },
  launched: { active: "border-green-500 text-green-600",  dot: "bg-green-400",  badge: "bg-green-50 text-green-700 border-green-200" },
  rejected: { active: "border-red-500 text-red-600",      dot: "bg-red-400",    badge: "bg-red-50 text-red-500 border-red-200" },
};

function formatDate(date) {
  return new Date(date).toLocaleString("en-GB", {
    day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit",
  });
}

export default function ManageBlocRequests() {
  const qc = useQueryClient();
  const [tab, setTab] = useState("pending");
  const [expanded, setExpanded] = useState(null);

  const { data, isLoading } = useQuery({
    queryKey: ["bloc-requests"],
    queryFn: () => api.get("/bloc-requests").then((r) => r.data),
    refetchInterval: 30_000,
  });

  const updateStatus = useMutation({
    mutationFn: ({ id, status }) => api.put(`/bloc-requests/${id}`, { status }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["bloc-requests"] }),
  });

  const allRequests = [];
  for (const group of data?.summary || []) {
    for (const r of group.requests) {
      allRequests.push({ ...r, bloc: group.bloc });
    }
  }

  const byStatus = {};
  for (const t of TABS) byStatus[t] = allRequests.filter((r) => r.status === t);
  const visible = byStatus[tab] || [];

  const toggle = (id) => setExpanded((prev) => (prev === id ? null : id));

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-extrabold tracking-tight text-gray-900">Bloc Requests</h1>
          <p className="mt-0.5 text-sm text-gray-500">Products customers are requesting.</p>
        </div>
        <span className="rounded-full bg-brand/10 px-4 py-1.5 text-sm font-bold text-brand">
          {allRequests.length} total
        </span>
      </div>

      {/* Tabs */}
      <div className="mb-0 flex gap-0 border-b border-gray-200">
        {TABS.map((t) => {
          const count = byStatus[t]?.length || 0;
          const s = TAB_STYLE[t];
          const isActive = tab === t;
          return (
            <button
              key={t}
              onClick={() => { setTab(t); setExpanded(null); }}
              className={`flex items-center gap-2 border-b-2 px-5 py-2.5 text-sm font-semibold capitalize transition ${
                isActive ? `${s.active} bg-white` : "border-transparent text-gray-400 hover:text-gray-700"
              }`}
            >
              <span className={`h-2 w-2 rounded-full ${s.dot}`} />
              {t}
              <span className={`rounded-full border px-2 py-0.5 text-[10px] font-bold ${isActive ? s.badge : "bg-gray-100 text-gray-400 border-gray-200"}`}>
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Table */}
      <div className="rounded-b-xl border border-t-0 border-gray-200 bg-white shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="space-y-px p-4">
            {[1, 2, 3].map((i) => <div key={i} className="h-12 animate-pulse rounded bg-gray-100" />)}
          </div>
        ) : visible.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-2 py-20 text-center">
            <p className="text-3xl">📭</p>
            <p className="font-semibold text-gray-700">No {tab} requests</p>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50 text-[11px] uppercase tracking-wider text-gray-400">
                <th className="px-4 py-3 text-left">Product</th>
                <th className="px-4 py-3 text-left">Date & Time</th>
                <th className="px-4 py-3 text-left">Status</th>
                <th className="px-4 py-3 text-left w-8"></th>
              </tr>
            </thead>
            <tbody>
              {visible.map((r) => {
                const s = TAB_STYLE[r.status];
                const isOpen = expanded === r._id;
                const name = r.customerName || r.user?.name || "Unknown";
                const mobile = r.mobile || r.user?.mobile || "—";
                return (
                  <>
                    <tr
                      key={r._id}
                      onClick={() => toggle(r._id)}
                      className={`border-b border-gray-100 cursor-pointer transition ${isOpen ? "bg-orange-50/50" : "hover:bg-gray-50"}`}
                    >
                      {/* Product */}
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          {r.bloc?.image && (
                            <img src={r.bloc.image} alt="" className="h-9 w-9 rounded-lg object-cover border border-gray-100 shrink-0" />
                          )}
                          <div className="min-w-0">
                            <p className="font-semibold text-gray-800 truncate max-w-[220px]">{r.bloc?.title || "Unknown"}</p>
                            {r.bloc?.blocPrice && (
                              <p className="text-[11px] text-gray-400">৳{formatPrice(r.bloc.blocPrice)}</p>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Date */}
                      <td className="px-4 py-3 text-gray-500 whitespace-nowrap text-xs">
                        {formatDate(r.createdAt)}
                      </td>

                      {/* Status */}
                      <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                        <select
                          value={r.status}
                          onChange={(e) => updateStatus.mutate({ id: r._id, status: e.target.value })}
                          className={`rounded-full border px-2.5 py-0.5 text-[11px] font-bold outline-none cursor-pointer ${s.badge}`}
                        >
                          <option value="pending">Pending</option>
                          <option value="reviewed">Reviewed</option>
                          <option value="launched">Launched</option>
                          <option value="rejected">Rejected</option>
                        </select>
                      </td>

                      {/* Expand chevron */}
                      <td className="px-4 py-3 text-gray-400 text-xs">{isOpen ? "▴" : "▾"}</td>
                    </tr>

                    {/* Expanded: customer name + phone */}
                    {isOpen && (
                      <tr key={`${r._id}-expand`} className="bg-orange-50/40 border-b border-orange-100">
                        <td colSpan={4} className="px-6 py-3">
                          <div className="flex items-center gap-6 text-sm">
                            <div className="flex items-center gap-2">
                              <div className="grid h-7 w-7 place-items-center rounded-full bg-brand/10 text-xs font-bold text-brand shrink-0">
                                {name[0]?.toUpperCase()}
                              </div>
                              <span className="font-semibold text-gray-800">{name}</span>
                            </div>
                            <span className="text-gray-400">·</span>
                            <span className="text-gray-600">📱 {mobile}</span>
                            {r.note && (
                              <>
                                <span className="text-gray-400">·</span>
                                <span className="text-gray-400 italic">"{r.note}"</span>
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    )}
                  </>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
