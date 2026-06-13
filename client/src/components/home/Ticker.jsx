import { useText } from "../../store/ContentContext.jsx";
import EditableText from "../common/EditableText.jsx";

export default function Ticker() {
  const text = useText("ticker.text", "Wholesale Price · Limited Spots · Ending Soon · Join a Bloc");
  const items = text.split("·").map((s) => s.trim()).filter(Boolean);
  const filled = items.length < 6 ? Array(Math.ceil(6 / items.length)).fill(items).flat() : items;
  const doubled = [...filled, ...filled];

  return (
    <div className="relative overflow-hidden bg-ink py-2.5">
      {/* Edit overlay — visible only in CMS edit mode, doesn't affect layout */}
      <span className="absolute right-3 top-1/2 z-20 -translate-y-1/2 hidden [.cms-editable-context_&]:block">
        <EditableText keyName="ticker.text" fallback="" className="cursor-pointer rounded bg-brand/80 px-2 py-0.5 text-[10px] font-bold text-white" />
      </span>
      {/* Clickable edit handle in edit mode */}
      <EditableText
        keyName="ticker.text"
        fallback=""
        className="absolute left-2 top-1/2 z-20 hidden -translate-y-1/2 cursor-pointer rounded bg-brand px-2 py-0.5 text-[10px] font-bold text-white [.editMode_&]:block"
      />

      <div className="flex w-max animate-marquee gap-10 whitespace-nowrap">
        {doubled.map((item, i) => (
          <span key={i} className="flex items-center gap-2 text-xs font-semibold tracking-wide text-gray-200">
            <span className="text-brand">⚡</span> {item}
          </span>
        ))}
      </div>
    </div>
  );
}
