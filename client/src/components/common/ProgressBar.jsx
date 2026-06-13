export default function ProgressBar({ filled, max, showLabels = true }) {
  const pct = Math.min(100, Math.round((filled / max) * 100));
  const spotsLeft = Math.max(0, max - filled);

  return (
    <div className="w-full">
      {showLabels && (
        <div className="mb-1 flex items-center justify-between gap-1 text-[11px] font-semibold">
          <span className="whitespace-nowrap text-brand">{pct}% FULL</span>
          <span className="whitespace-nowrap text-muted">{spotsLeft} LEFT</span>
        </div>
      )}
      <div className="h-1.5 w-full overflow-hidden rounded-full bg-line">
        <div className="bar-shimmer h-full rounded-full bg-brand transition-all" style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}
