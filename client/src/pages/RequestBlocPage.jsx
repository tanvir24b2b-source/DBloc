import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useAuthStore } from "../store/useAuthStore.js";
import { formatPrice } from "../lib/format.js";
import api from "../lib/api.js";

function useInactiveBlocs() {
  return useQuery({
    queryKey: ["blocs-inactive"],
    queryFn: async () => {
      const { data } = await api.get("/blocs");
      return data.filter((b) => b.status !== "active");
    },
  });
}

const STATUS_LABEL = { expired: "Expired", full: "Full" };
const STATUS_COLOR = {
  expired: "bg-gray-100 text-gray-500",
  full:    "bg-orange-100 text-orange-600",
};

export default function RequestBlocPage() {
  const { user } = useAuthStore();
  const navigate = useNavigate();
  const { data: blocs = [], isLoading } = useInactiveBlocs();
  const [selected, setSelected] = useState(null);
  const [note, setNote] = useState("");
  const [done, setDone] = useState(false);

  const submit = useMutation({
    mutationFn: () => api.post("/bloc-requests", { blocId: selected._id, note }),
    onSuccess: () => setDone(true),
  });

  if (done) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 px-4 text-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-green-100 text-3xl">✓</div>
        <h2 className="text-xl font-bold text-ink">Request Submitted!</h2>
        <p className="max-w-sm text-sm text-muted">
          We've received your request for <span className="font-semibold text-ink">{selected.title}</span>.
          We'll notify you when a new Bloc launches for this product.
        </p>
        <div className="flex gap-3">
          <button
            onClick={() => { setSelected(null); setNote(""); setDone(false); }}
            className="rounded-full border border-line px-5 py-2.5 text-sm font-bold text-ink hover:border-brand hover:text-brand transition"
          >
            Request Another
          </button>
          <Link to="/" className="rounded-full bg-brand px-5 py-2.5 text-sm font-bold text-white hover:bg-brand-hover transition">
            Back to Home
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 pb-28 md:px-6 md:py-12">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-extrabold text-ink md:text-3xl">Request a Bloc Deal</h1>
        <p className="mt-1.5 text-sm text-muted">
          See a product you want at wholesale price? Select it below — we'll launch a new Bloc when enough people request it.
        </p>
      </div>

      {/* Login banner */}
      {!user && (
        <div className="mb-6 flex items-center justify-between gap-4 rounded-xl border border-brand/30 bg-brand/5 px-4 py-3">
          <p className="text-sm text-ink">
            <span className="font-semibold">Login required</span> to submit a request.
          </p>
          <Link
            to="/login"
            className="shrink-0 rounded-full bg-brand px-4 py-1.5 text-xs font-bold text-white hover:bg-brand-hover transition"
          >
            Login / Register
          </Link>
        </div>
      )}

      {/* Selected summary + submit */}
      {selected && user && (
        <div className="mb-6 flex flex-col gap-3 rounded-xl border border-brand bg-cream p-4 sm:flex-row sm:items-center">
          <img src={selected.image} alt={selected.title} className="h-12 w-12 rounded-lg object-cover border border-line shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-ink truncate">{selected.title}</p>
            <p className="text-xs text-muted">Selected for deal request</p>
          </div>
          <div className="flex flex-col gap-2 sm:items-end">
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Optional note (why you want this deal...)"
              rows={2}
              className="w-full rounded-lg border border-line px-3 py-1.5 text-sm outline-none focus:border-brand resize-none sm:w-64"
            />
            <div className="flex gap-2">
              <button
                onClick={() => setSelected(null)}
                className="rounded-full border border-line px-4 py-1.5 text-xs font-bold text-ink hover:border-brand hover:text-brand transition"
              >
                Cancel
              </button>
              <button
                disabled={submit.isPending}
                onClick={() => submit.mutate()}
                className="rounded-full bg-brand px-5 py-1.5 text-xs font-bold text-white hover:bg-brand-hover transition disabled:opacity-60"
              >
                {submit.isPending ? "Submitting..." : "Submit Request →"}
              </button>
            </div>
            {submit.isError && (
              <p className="text-xs text-danger">{submit.error?.response?.data?.message || "Something went wrong"}</p>
            )}
          </div>
        </div>
      )}

      {/* Grid */}
      {isLoading ? (
        <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="h-64 animate-pulse rounded-xl bg-gray-100" />
          ))}
        </div>
      ) : blocs.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-3 py-20 text-center">
          <p className="text-4xl">📦</p>
          <p className="font-semibold text-ink">No products available for request right now.</p>
          <p className="text-sm text-muted">All products currently have active Blocs!</p>
          <Link to="/categories" className="mt-2 rounded-full bg-brand px-6 py-2.5 text-sm font-bold text-white hover:bg-brand-hover transition">
            Browse Active Blocs →
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
          {blocs.map((bloc) => {
            const isSelected = selected?._id === bloc._id;
            const discount = bloc.discount ?? Math.round(((bloc.originalPrice - bloc.blocPrice) / bloc.originalPrice) * 100);
            return (
              <div
                key={bloc._id}
                onClick={() => {
                  if (!user) { navigate("/login"); return; }
                  setSelected(isSelected ? null : bloc);
                  setDone(false);
                  submit.reset();
                }}
                className={`group relative flex cursor-pointer flex-col overflow-hidden rounded-xl border bg-white shadow-sm transition-all duration-200
                  ${isSelected
                    ? "border-brand ring-2 ring-brand/30 shadow-md"
                    : "border-line hover:-translate-y-0.5 hover:shadow-md hover:border-brand/40"
                  }`}
              >
                {/* Status badge */}
                <span className={`absolute left-2 top-2 z-10 rounded-full px-2 py-0.5 text-[10px] font-bold ${STATUS_COLOR[bloc.status] || STATUS_COLOR.expired}`}>
                  {STATUS_LABEL[bloc.status] || bloc.status}
                </span>

                {/* Selected check */}
                {isSelected && (
                  <span className="absolute right-2 top-2 z-10 flex h-6 w-6 items-center justify-center rounded-full bg-brand text-white text-xs font-bold">✓</span>
                )}

                {/* Discount badge */}
                {discount > 0 && !isSelected && (
                  <span className="absolute right-2 top-2 z-10 rounded-full bg-brand/10 px-2 py-0.5 text-[10px] font-bold text-brand">
                    {discount}% OFF
                  </span>
                )}

                <img src={bloc.image} alt={bloc.title} className="aspect-square w-full object-cover" />

                <div className="flex flex-1 flex-col gap-1.5 p-3">
                  <p className="line-clamp-1 text-sm font-semibold text-ink">{bloc.title}</p>
                  <div className="flex items-baseline gap-1.5">
                    <span className="text-sm font-bold text-brand">৳{formatPrice(bloc.blocPrice)}</span>
                    <span className="text-xs text-muted line-through">৳{formatPrice(bloc.originalPrice)}</span>
                  </div>
                  <div className={`mt-auto rounded-lg py-1.5 text-center text-xs font-bold tracking-wide transition
                    ${isSelected ? "bg-brand text-white" : "bg-ink/5 text-ink group-hover:bg-brand group-hover:text-white"}`}>
                    {isSelected ? "✓ Selected" : "Request Deal →"}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
