import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import api from "../../lib/api.js";

function fmt(d) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
}

export default function ManageSubscribers() {
  const qc = useQueryClient();
  const { data, isLoading } = useQuery({
    queryKey: ["subscribers"],
    queryFn: () => api.get("/subscribers").then((r) => r.data),
  });
  const subscribers = data?.subscribers || [];

  const [copied, setCopied] = useState(false);
  const [compose, setCompose] = useState(false);
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");

  const emails = subscribers.map((s) => s.email);

  async function remove(id) {
    if (!confirm("Remove this subscriber?")) return;
    await api.delete(`/subscribers/${id}`);
    qc.invalidateQueries({ queryKey: ["subscribers"] });
  }

  function copyEmails() {
    navigator.clipboard.writeText(emails.join(", "));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  function exportCsv() {
    const rows = [["Email", "Joined"], ...subscribers.map((s) => [s.email, fmt(s.createdAt)])];
    const csv = rows.map((r) => r.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `dbloc-subscribers-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  function sendEmail() {
    // Opens the admin's own mail client with all subscribers as BCC.
    const bcc = emails.join(",");
    const url = `mailto:?bcc=${encodeURIComponent(bcc)}&subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    window.location.href = url;
  }

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-ink">Subscribers</h1>
          <p className="mt-1 text-sm text-muted">People who signed up via "Never miss a Bloc".</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button onClick={copyEmails} disabled={!emails.length}
            className="rounded-full border border-line bg-white px-4 py-2 text-xs font-bold text-ink hover:border-brand disabled:opacity-50">
            {copied ? "✓ Copied" : "Copy Emails"}
          </button>
          <button onClick={exportCsv} disabled={!emails.length}
            className="rounded-full border border-line bg-white px-4 py-2 text-xs font-bold text-ink hover:border-brand disabled:opacity-50">
            Export CSV
          </button>
          <button onClick={() => setCompose((c) => !c)} disabled={!emails.length}
            className="rounded-full bg-brand px-4 py-2 text-xs font-bold text-white hover:bg-brand-hover disabled:opacity-50">
            ✉ Notify All
          </button>
        </div>
      </div>

      {/* Summary card */}
      <div className="mt-6 flex gap-4">
        <div className="rounded-xl border border-line bg-white px-6 py-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted">Total Subscribers</p>
          <p className="mt-1 text-3xl font-bold text-brand">{data?.total ?? 0}</p>
        </div>
      </div>

      {/* Compose panel */}
      {compose && (
        <div className="mt-6 rounded-xl border border-brand bg-orange-50/40 p-5">
          <h2 className="mb-1 text-sm font-bold text-ink">Send Email to All {emails.length} Subscribers</h2>
          <p className="mb-4 text-xs text-muted">
            This opens your own email app (Gmail, Outlook, etc.) with every subscriber added as <b>BCC</b>, so you can review and send it yourself.
          </p>
          <input
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            placeholder="Subject — e.g. New Bloc just dropped: 50% off Air Fryer!"
            className="mb-3 w-full rounded-lg border border-line px-3 py-2 text-sm"
          />
          <textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            rows={5}
            placeholder="Write your message... e.g. Hurry! A new group-buy is live. Join now before spots fill up: http://localhost:5173/categories"
            className="mb-3 w-full rounded-lg border border-line px-3 py-2 text-sm"
          />
          <div className="flex items-center gap-3">
            <button onClick={sendEmail} className="rounded-full bg-brand px-6 py-2 text-sm font-bold text-white hover:bg-brand-hover">
              Open Email App →
            </button>
            <button onClick={() => setCompose(false)} className="text-sm text-muted hover:underline">Cancel</button>
          </div>
        </div>
      )}

      {/* List */}
      <div className="mt-6 overflow-hidden rounded-xl border border-line bg-white">
        {isLoading ? (
          <p className="p-6 text-sm text-muted">Loading...</p>
        ) : subscribers.length === 0 ? (
          <p className="p-10 text-center text-muted">No subscribers yet.</p>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-line bg-cream text-left text-xs font-bold uppercase tracking-wide text-muted">
                <th className="px-4 py-3">#</th>
                <th className="px-4 py-3">Email</th>
                <th className="px-4 py-3">Joined</th>
                <th className="px-4 py-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody>
              {subscribers.map((s, i) => (
                <tr key={s._id} className={`border-b border-line last:border-0 ${i % 2 === 1 ? "bg-cream/40" : ""}`}>
                  <td className="px-4 py-3 text-muted">{i + 1}</td>
                  <td className="px-4 py-3 font-medium text-ink">{s.email}</td>
                  <td className="px-4 py-3 text-muted">{fmt(s.createdAt)}</td>
                  <td className="px-4 py-3 text-right">
                    <button onClick={() => remove(s._id)} className="text-xs text-danger hover:underline">Remove</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
