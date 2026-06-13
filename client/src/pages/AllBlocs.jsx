import { useState } from "react";
import { useBlocs, useCategories } from "../hooks/useBlocs.js";
import { useText } from "../store/ContentContext.jsx";
import EditableText from "../components/common/EditableText.jsx";
import BlocCard from "../components/common/BlocCard.jsx";

export default function AllBlocs() {
  const [category, setCategory] = useState("");
  const { data: blocs = [], isLoading } = useBlocs(category ? { category } : {});
  const { data: cats = [] } = useCategories();
  const emptyText = useText("allblocs.empty", "No active Blocs right now.");

  return (
    <div className="mx-auto max-w-7xl px-6 py-10">
      <h1 className="text-3xl font-bold text-ink">
        <EditableText keyName="allblocs.title" fallback="All Blocs" />
      </h1>
      <p className="mt-1 text-muted">
        <EditableText keyName="allblocs.subtitle" fallback="Join a group-buy and unlock wholesale prices" />
      </p>

      {/* Category filter */}
      <div className="mt-6 flex flex-wrap gap-2">
        <button onClick={() => setCategory("")} className={`rounded-full px-4 py-1.5 text-xs font-semibold ${!category ? "bg-brand text-white" : "border border-line bg-white text-ink"}`}>All</button>
        {cats.map((c) => (
          <button key={c._id} onClick={() => setCategory(c._id)} className={`rounded-full px-4 py-1.5 text-xs font-semibold ${category === c._id ? "bg-brand text-white" : "border border-line bg-white text-ink"}`}>
            {c.name}
          </button>
        ))}
      </div>

      {isLoading ? (
        <p className="mt-10 text-muted">Loading...</p>
      ) : blocs.length === 0 ? (
        <p className="mt-10 text-muted">{emptyText}</p>
      ) : (
        <div className="mt-8 grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
          {blocs.map((b) => <BlocCard key={b._id} bloc={b} />)}
        </div>
      )}
    </div>
  );
}
