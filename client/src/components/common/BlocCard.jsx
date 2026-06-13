import { Link } from "react-router-dom";
import { useText } from "../../store/ContentContext.jsx";
import EditableText from "./EditableText.jsx";
import { formatPrice } from "../../lib/format.js";
import CountdownTimer from "./CountdownTimer.jsx";
import ProgressBar from "./ProgressBar.jsx";

export default function BlocCard({ bloc }) {
  const currency = useText("site.currency", "৳");
  const discount =
    bloc.discount ?? Math.round(((bloc.originalPrice - bloc.blocPrice) / bloc.originalPrice) * 100);

  return (
    <div className="group/card flex w-full flex-col overflow-hidden rounded-xl border border-line bg-white shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-lg">
      <Link to={`/blocs/${bloc._id}`} className="relative block">
        {discount > 0 && (
          <span className="absolute left-3 top-3 z-10 rounded-full bg-brand px-2.5 py-1 text-[11px] font-bold text-white">
            {discount}% OFF
          </span>
        )}
        <img src={bloc.image} alt={bloc.title} className="aspect-square w-full object-cover" />
        <span className="absolute bottom-2 left-2 flex items-center gap-1 rounded bg-black/70 px-2 py-0.5 text-[11px] font-semibold text-white">
          ⏱ <CountdownTimer endTime={bloc.endTime} className="text-[11px]" />
        </span>
      </Link>

      <div className="flex flex-1 flex-col gap-2 p-3">
        <Link to={`/blocs/${bloc._id}`} className="line-clamp-1 text-sm font-semibold text-ink hover:text-brand">
          {bloc.title}
        </Link>

        <div className="flex items-baseline gap-2">
          <span className="text-base font-bold text-brand">
            {currency}{formatPrice(bloc.blocPrice)}
          </span>
          <span className="text-xs text-muted line-through">
            {currency}{formatPrice(bloc.originalPrice)}
          </span>
        </div>

        <ProgressBar filled={bloc.filledSpots} max={bloc.maxSpots} />

        {bloc.status === "active" ? (
          <Link
            to={`/blocs/${bloc._id}`}
            className="btn-shine mt-1 rounded-lg bg-ink py-2 text-center text-xs font-bold tracking-wide text-white transition group-hover/card:bg-brand"
          >
            <EditableText keyName="join.detailCta" fallback="JOIN BLOC" />
          </Link>
        ) : (
          <div className="mt-1 rounded-lg bg-gray-200 py-2 text-center text-xs font-bold tracking-wide text-gray-400 cursor-not-allowed">
            {bloc.status === "full" ? "BLOC FULL" : "EXPIRED"}
          </div>
        )}
      </div>
    </div>
  );
}
