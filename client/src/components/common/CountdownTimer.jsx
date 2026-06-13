import { useEffect, useState } from "react";
import { getCountdown, pad } from "../../lib/format.js";

export default function CountdownTimer({ endTime, className = "", dark = false }) {
  const [t, setT] = useState(getCountdown(endTime));

  useEffect(() => {
    const id = setInterval(() => setT(getCountdown(endTime)), 1000);
    return () => clearInterval(id);
  }, [endTime]);

  if (t.expired) {
    return <span className={`font-semibold text-danger ${className}`}>Expired</span>;
  }

  const cell = dark
    ? "bg-dark text-white"
    : "bg-ink/90 text-white";

  return (
    <div className={`flex items-center gap-1 font-bold tabular-nums ${className}`}>
      <span key={`h-${t.h}`} className={`${cell} rounded px-1.5 py-0.5 animate-flip-tick`}>{pad(t.h)}</span>
      <span className="text-danger">:</span>
      <span key={`m-${t.m}`} className={`${cell} rounded px-1.5 py-0.5 animate-flip-tick`}>{pad(t.m)}</span>
      <span className="text-danger">:</span>
      <span key={`s-${t.s}`} className={`${cell} rounded px-1.5 py-0.5 animate-flip-tick`}>{pad(t.s)}</span>
    </div>
  );
}
