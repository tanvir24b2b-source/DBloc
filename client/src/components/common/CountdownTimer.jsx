import { useEffect, useState } from "react";
import { getCountdown, pad } from "../../lib/format.js";

export default function CountdownTimer({ endTime, className = "", compact = false }) {
  const [t, setT] = useState(getCountdown(endTime));

  useEffect(() => {
    const id = setInterval(() => setT(getCountdown(endTime)), 1000);
    return () => clearInterval(id);
  }, [endTime]);

  if (t.expired) {
    return <span className={`font-semibold text-danger ${className}`}>Expired</span>;
  }

  if (compact) {
    return (
      <span className={`font-bold tabular-nums ${className}`}>
        <span key={`h-${t.h}`} className="animate-flip-tick inline-block">{pad(t.h)}</span>
        <span className="opacity-60">:</span>
        <span key={`m-${t.m}`} className="animate-flip-tick inline-block">{pad(t.m)}</span>
        <span className="opacity-60">:</span>
        <span key={`s-${t.s}`} className="animate-flip-tick inline-block">{pad(t.s)}</span>
      </span>
    );
  }

  return (
    <span className={`font-bold tabular-nums text-sm sm:text-base ${className}`}>
      {t.d}d {pad(t.h)}h {pad(t.m)}m {pad(t.s)}s
    </span>
  );
}
