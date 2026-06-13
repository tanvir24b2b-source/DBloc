import { useState } from "react";
import { useLocation } from "react-router-dom";
import { useBlocs, useCategories } from "../hooks/useBlocs.js";
import BlocCard from "../components/common/BlocCard.jsx";
import SeoHead from "../components/common/SeoHead.jsx";

export default function Categories() {
  const { search: qs } = useLocation();
  const initialQ = new URLSearchParams(qs).get("q") ?? "";
  const [selected, setSelected] = useState("");
  const { data: cats = [] } = useCategories();
  const { data: allBlocs = [], isLoading } = useBlocs();

  const lq = initialQ.toLowerCase();
  const blocs = allBlocs.filter((b) => {
    if (selected && b.category?._id !== selected) return false;
    if (lq) {
      const inTitle = b.title?.toLowerCase().includes(lq);
      const inDesc = b.description?.toLowerCase().includes(lq);
      const inTags = b.tags?.some(t => t.toLowerCase().includes(lq));
      const inCat = b.category?.name?.toLowerCase().includes(lq);
      if (!inTitle && !inDesc && !inTags && !inCat) return false;
    }
    return true;
  });

  function countFor(catId) {
    return allBlocs.filter((b) => b.category?._id === catId).length;
  }

  return (
    <>
    <SeoHead pageKey="categories" />
    <div className="mx-auto max-w-7xl px-6 py-10">
      {/* Category icon grid — centered, max 10 per row, wraps to next row */}
      <div className="flex flex-wrap justify-center gap-3">
        {/* ALL card */}
        <button
          onClick={() => setSelected("")}
          className={`flex flex-col items-center justify-center gap-1.5 rounded-xl border-2 transition w-[100px] h-[100px] ${
            selected === "" ? "border-brand bg-orange-50" : "border-line bg-white hover:border-brand/50"
          }`}
        >
          <div className="h-10 w-10 rounded-lg bg-gray-100 flex items-center justify-center">
            <svg className="w-5 h-5 text-ink" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <rect x="3" y="3" width="7" height="7" rx="1" strokeLinecap="round" />
              <rect x="14" y="3" width="7" height="7" rx="1" strokeLinecap="round" />
              <rect x="3" y="14" width="7" height="7" rx="1" strokeLinecap="round" />
              <rect x="14" y="14" width="7" height="7" rx="1" strokeLinecap="round" />
            </svg>
          </div>
          <span className="text-[11px] font-bold text-ink uppercase tracking-wide">ALL</span>
          <span className="text-[10px] text-muted">all blocs</span>
        </button>

        {cats.map((c) => (
          <button
            key={c._id}
            onClick={() => setSelected(c._id)}
            className={`flex flex-col items-center justify-center gap-1.5 rounded-xl border-2 transition w-[100px] h-[100px] ${
              selected === c._id ? "border-brand bg-orange-50" : "border-line bg-white hover:border-brand/50"
            }`}
          >
            <div className="h-10 w-10 rounded-lg overflow-hidden bg-gray-100 flex items-center justify-center">
              {c.image ? (
                <img src={c.image} alt={c.name} className="w-full h-full object-cover" />
              ) : (
                <span className="text-xl">📦</span>
              )}
            </div>
            <span className="text-[11px] font-bold text-ink uppercase tracking-wide text-center leading-tight line-clamp-2 px-1">
              {c.name}
            </span>
            <span className="text-[10px] text-muted">{countFor(c._id)} blocs</span>
          </button>
        ))}
      </div>

      {/* Section heading */}
      <div className="mt-8 mb-4 flex items-center gap-3">
        <h2 className="text-xl font-bold text-ink uppercase tracking-wide">
          {initialQ
            ? `Search: "${initialQ}"`
            : selected
            ? cats.find((c) => c._id === selected)?.name ?? "Blocs"
            : "All Blocs"}
        </h2>
      </div>
      <div className="border-b border-line mb-6" />

      {/* Blocs grid */}
      {isLoading ? (
        <p className="py-10 text-muted">Loading...</p>
      ) : blocs.length === 0 ? (
        <p className="py-10 text-muted">No blocs in this category.</p>
      ) : (
        <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
          {blocs.map((b) => (
            <BlocCard key={b._id} bloc={b} />
          ))}
        </div>
      )}
    </div>
    </>
  );
}
