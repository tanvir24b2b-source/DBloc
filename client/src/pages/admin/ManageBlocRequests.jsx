import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "../../lib/api.js";
import { formatPrice } from "../../lib/format.js";

const STATUS_COLORS = {
  pending:  "bg-yellow-50 text-yellow-700 border-yellow-200",
  reviewed: "bg-blue-50 text-blue-700 border-blue-200",
  launched: "bg-green-50 text-green-700 border-green-200",
  rejected: "bg-red-50 text-red-500 border-red-200",
};

function timeAgo(date) {
  const m = Math.round((Date.now() - new Date(date)) / 60000);
  if (m < 1) return "just now";
  if (m < 60) return `${m}m ago`;
  if (m < 1440) return `${Math.round(m / 60)}h ago`;
  return `${Math.round(m / 1440)}d ago`;
}

export default function ManageBlocRequests() {
  const qc = useQueryClient();
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

  const summary = data?.summary || [];
  const total = data?.total || 0;

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-extrabold tracking-tight text-gray-900">Bloc Requests</h1>
          <p className="mt-0.5 text-sm text-gray-500">
            Products customers are requesting — sorted by popularity.
          </p>
        </div>
        <span className="rounded-full bg-brand/10 px-4 py-1.5 text-sm font-bold text-brand">
          {total} total request{total !== 1 ? "s" : ""}
        </span>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-20 animate-pulse rounded-xl bg-gray-100" />
          ))}
        </div>
      ) : summary.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-gray-200 py-20 text-center">
          <p className="text-3xl">📭</p>
          <p className="font-semibold text-gray-700">No requests yet</p>
          <p className="text-sm text-gray-400">Customer deal requests will appear here</p>
        </div>
      ) : (
        <div className="space-y-3">
          {summary.map((group, idx) => {
            const bloc = group.bloc;
            const isOpen = expanded === idx;
            return (
              <div key={idx} className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
                <button
                  onClick={() => setExpanded(isOpen ? null : idx)}
                  className="flex w-full items-center gap-4 px-4 py-3 text-left hover:bg-gray-50 transition"
                >
                  <img
                    src={bloc?.image || ""}
                    alt={bloc?.title || ""}
                    className="h-12 w-12 shrink-0 rounded-lg object-cover border border-gray-100"
                  />
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-gray-900 truncate">{bloc?.title || "Unknown product"}</p>
                    <p className="text-xs text-gray-400">
                      Bloc price: ৳{formatPrice(bloc?.blocPrice)} · Original: ৳{formatPrice(bloc?.originalPrice)}
                    </p>
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    <div className="text-right">
                      <p className="text-2xl font-extrabold text-brand">{group.count}</p>
                      <p className="text-[10px] uppercase tracking-wide text-gray-400">
                        request{group.count !== 1 ? "s" : ""}
                      </p>
                    </div>
                    <span className="text-gray-400 text-sm">{isOpen ? "▴" : "▾"}</span>
                  </div>
                </button>

                {isOpen && (
                  <div className="border-t border-gray-100 overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-gray-100 bg-gray-50 text-[11px] uppercase tracking-wider text-gray-400">
                          <th className="px-4 py-2 text-left">Customer</th>
                          <th className="px-4 py-2 text-left">Mobile</th>
                          <th className="px-4 py-2 text-left">Note</th>
                          <th className="px-4 py-2 text-left">When</th>
                          <th className="px-4 py-2 text-left">Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {group.requests.map((r) => (
                          <tr key={r._id} className="border-b border-gray-50 last:border-0 hover:bg-gray-50/50 transition">
                            <td className="px-4 py-2.5 font-medium text-gray-800">
                              {r.customerName || r.user?.name || "—"}
                            </td>
                            <td className="px-4 py-2.5 text-gray-500">{r.mobile || r.user?.mobile || "—"}</td>
                            <td className="px-4 py-2.5 text-gray-500 max-w-[200px] truncate">
                              {r.note || <span className="text-gray-300 italic">no note</span>}
                            </td>
                            <td className="px-4 py-2.5 text-gray-400 whitespace-nowrap">{timeAgo(r.createdAt)}</td>
                            <td className="px-4 py-2.5">
                              <select
                                value={r.status}
                                onChange={(e) => updateStatus.mutate({ id: r._id, status: e.target.value })}
                                className={`rounded-full border px-2.5 py-0.5 text-[11px] font-bold outline-none cursor-pointer ${STATUS_COLORS[r.status]}`}
                              >
                                <option value="pending">Pending</option>
                                <option value="reviewed">Reviewed</option>
                                <option value="launched">Launched</option>
                                <option value="rejected">Rejected</option>
                              </select>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
