import { Link } from "react-router-dom";
import EditableText from "../common/EditableText.jsx";
import BlocCarousel from "../common/BlocCarousel.jsx";
import { getCountdown } from "../../lib/format.js";

export default function EndingSoon({ blocs }) {

  // Active blocs ending within 24h
  const urgent = blocs.filter((b) => {
    if (b.status !== "active") return false;
    const { h, expired } = getCountdown(b.endTime);
    return !expired && h < 24;
  });

  // Non-active blocs sorted by most recent — fills remaining slots
  const nonActive = blocs
    .filter((b) => b.status !== "active")
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

  const isUrgent = urgent.length > 0;

  // Non-urgent active blocs (ending > 24h)
  const nonUrgentActive = blocs.filter((b) => b.status === "active" && !urgent.includes(b));

  // Urgent first → remaining active → expired fills to 8
  const items = [...urgent, ...nonUrgentActive, ...nonActive].slice(0, 8);

  if (items.length === 0) return null;

  return (
    <section className="mx-auto max-w-7xl px-6 py-12">
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="animate-soft-pulse text-brand">⏱</span>
          <h2 className="text-2xl font-bold text-ink">
            <EditableText keyName="endingSoon.title" fallback="Ending Soon" />
          </h2>
          {isUrgent && <span className="rounded-full bg-danger/10 px-2.5 py-0.5 text-[11px] font-bold text-danger">&lt; 24 HRS</span>}
        </div>
        <Link to="/blocs" className="text-xs font-bold tracking-wide text-brand hover:underline">
          <EditableText keyName="endingSoon.viewAll" fallback="VIEW ALL" /> →
        </Link>
      </div>
      <BlocCarousel blocs={items} />
    </section>
  );
}
