import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useText } from "../../store/ContentContext.jsx";
import EditableText from "../common/EditableText.jsx";
import { formatPrice, getCountdown, pad } from "../../lib/format.js";

function FloatingIcons() {
  const common = "absolute text-white/[0.06] animate-drift pointer-events-none";
  return (
    <div className="absolute inset-0 overflow-hidden">
      <svg className={`${common} left-[6%] top-[30%] h-24 w-24`} style={{ animationDelay: "0s" }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
        <path d="M12 3v9m0 0l-6 9m6-9l6 9M9 6h6" />
      </svg>
      <svg className={`${common} left-[3%] top-[55%] h-20 w-20`} style={{ animationDelay: "1.5s" }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
        <path d="M4 14v-2a8 8 0 0116 0v2M4 14a2 2 0 012 2v2a2 2 0 01-2 2 2 2 0 01-2-2v-2a2 2 0 012-2zm16 0a2 2 0 00-2 2v2a2 2 0 002 2 2 2 0 002-2v-2a2 2 0 00-2-2z" />
      </svg>
      <svg className={`${common} right-[6%] top-[20%] h-24 w-24`} style={{ animationDelay: "0.8s" }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
        <path d="M3 8a2 2 0 012-2h2l1.5-2h7L18 6h2a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V8z" />
        <circle cx="12" cy="12.5" r="3.5" />
      </svg>
      <svg className={`${common} right-[18%] top-[60%] h-16 w-16`} style={{ animationDelay: "2.2s" }} viewBox="0 0 24 24" fill="currentColor">
        <path d="M13 2L3 14h7l-1 8 11-14h-7l1-6z" />
      </svg>
      <svg className={`${common} left-[40%] top-[12%] h-14 w-14`} style={{ animationDelay: "1s" }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
        <path d="M3 8l9-5 9 5v8l-9 5-9-5V8z M3 8l9 5 9-5M12 13v8" />
      </svg>
    </div>
  );
}

/* ── Mobile countdown (matches reference image exactly) ── */
function MobileCountdown({ t, spotsLeft }) {
  return (
    <div className="mt-3">
      <p className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-widest text-brand">
        <span>⚡</span> BLOC CLOSES IN
      </p>
      {/* DAY box */}
      <div className="mt-1.5 rounded-xl bg-white/10 py-2 text-center ring-1 ring-white/10">
        <span className="text-2xl font-extrabold tabular-nums text-white">{pad(t.d)} DAY</span>
      </div>
      {/* HRS : MIN : SEC — centered under DAY box */}
      <div className="mt-2 flex items-end justify-center gap-1.5">
        <div className="w-8 text-center">
          <span key={t.h} className="text-xl font-extrabold tabular-nums text-white" style={{ display: "inline-block", animation: "tickIn 200ms ease-out" }}>{pad(t.h)}</span>
          <p className="text-[8px] font-bold tracking-widest text-gray-400">HRS</p>
        </div>
        <span className="pb-3 text-base font-bold text-gray-500">:</span>
        <div className="w-8 text-center">
          <span key={t.m} className="text-xl font-extrabold tabular-nums text-white" style={{ display: "inline-block", animation: "tickIn 200ms ease-out" }}>{pad(t.m)}</span>
          <p className="text-[8px] font-bold tracking-widest text-gray-400">MIN</p>
        </div>
        <span className="pb-3 text-base font-bold text-gray-500">:</span>
        <div className="w-8 text-center">
          <span key={t.s} className="text-xl font-extrabold tabular-nums text-white" style={{ display: "inline-block", animation: "tickIn 200ms ease-out" }}>{pad(t.s)}</span>
          <p className="text-[8px] font-bold tracking-widest text-gray-400">SEC</p>
        </div>
      </div>
      <p className="mt-2 text-[11px] font-semibold text-brand animate-soft-pulse">
        Hurry! Only {spotsLeft} spots remaining
      </p>
    </div>
  );
}

/* ── Desktop countdown (original flip cells) ── */
function FlipCell({ value, label }) {
  return (
    <div className="flex flex-col items-center">
      <div className="relative w-14 overflow-hidden rounded-xl bg-white/[0.07] py-2 text-center shadow-lg ring-1 ring-white/10 backdrop-blur">
        <span key={value} className="text-3xl font-extrabold tabular-nums text-white" style={{ display: "inline-block", animation: "tickIn 200ms ease-out" }}>{pad(value)}</span>
        <span className="absolute inset-x-0 top-1/2 h-px bg-black/30" />
      </div>
      <span className="mt-1 text-[10px] font-semibold tracking-widest text-gray-400">{label}</span>
    </div>
  );
}

/* ── "Zoom in" launch: the clicked element scales up toward the viewer and fades,
   then navigates. Used by the BROWSE BLOCS button. ── */
function launchZoom(el, navigate, to) {
  if (!el || window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
    navigate(to);
    return;
  }
  el.style.position = "relative";
  el.style.zIndex = "50";
  el.style.transformOrigin = "center center";
  el.style.willChange = "transform, filter";
  el.animate(
    [
      { transform: "scale(1)", opacity: 1, filter: "blur(0px)" },
      { transform: "scale(1.12)", opacity: 1, offset: 0.25 },
      { transform: "scale(2.4)", opacity: 0, filter: "blur(6px)" },
    ],
    { duration: 500, easing: "cubic-bezier(0.4, 0, 0.2, 1)", fill: "forwards" }
  );
  setTimeout(() => navigate(to), 440);
}

/* ── Mini product card for mobile hero ── */
function MiniCard({ top, t, spotsLeft, currency }) {
  const navigate = useNavigate();

  const handleClick = (e) => {
    e.preventDefault();
    launchZoom(e.currentTarget, navigate, `/blocs/${top._id}`);
  };

  return (
    <div style={{ perspective: "900px" }}>
      <p className="mb-1 text-[9px] font-bold uppercase tracking-widest text-gray-400">
        DEAL OF THE DAY
      </p>
      <Link
        to={`/blocs/${top._id}`}
        onClick={handleClick}
        className="group block overflow-hidden rounded-2xl bg-white text-ink shadow-2xl transition-transform duration-300 hover:-translate-y-1 hover:shadow-[0_20px_40px_rgba(0,0,0,0.25)]"
      >
        <div className="relative">
          {top.discount > 0 && (
            <span className="absolute left-2 top-2 z-10 rounded-full bg-brand px-2 py-0.5 text-[10px] font-bold text-white">
              {top.discount}% OFF
            </span>
          )}
          <img src={top.image} alt={top.title} className="aspect-square w-full object-cover" />
          <span className="absolute bottom-1 right-1 rounded bg-black/70 px-1.5 py-0.5 text-[9px] font-semibold tabular-nums text-white">
            {pad(t.h)}:{pad(t.m)}:{pad(t.s)}
          </span>
        </div>
        <div className="p-2.5">
          <p className="truncate text-[11px] font-bold uppercase tracking-wide">{top.title}</p>
          <div className="mt-0.5 flex items-baseline gap-1.5">
            <span className="text-sm font-bold text-brand">{currency}{formatPrice(top.blocPrice)}</span>
            <span className="text-[10px] text-muted line-through">{currency}{formatPrice(top.originalPrice)}</span>
          </div>
          <div className="mt-2">
            <div className="mb-1 flex items-center justify-between gap-1 text-[9px] font-bold">
              <span className="whitespace-nowrap text-brand">{top.progress}% FULL</span>
              <span className="whitespace-nowrap text-muted">{spotsLeft} LEFT</span>
            </div>
            <div className="h-1.5 w-full overflow-hidden rounded-full bg-gray-200">
              <div className="h-full rounded-full bg-brand" style={{ width: `${top.progress}%` }} />
            </div>
          </div>
          <div className="btn-shine mt-2 w-full rounded-lg bg-ink py-1.5 text-center text-[11px] font-bold tracking-wide text-white transition-colors duration-200 group-hover:bg-brand">
            JOIN BLOC
          </div>
        </div>
      </Link>
    </div>
  );
}

const TICK_STYLE = (
  <style>{`@keyframes tickIn{from{opacity:0;transform:translateY(-5px)}to{opacity:1;transform:translateY(0)}}`}</style>
);

export default function Hero({ featured }) {
  const bg = useText("hero.bgColor", "#111827");
  const bgImage = useText("hero.bgImage", "");
  const ctaUrl = useText("hero.ctaUrl", "/categories");
  const currency = useText("site.currency", "৳");
  const top = featured?.[0];
  const navigate = useNavigate();
  const onCta = (e) => {
    e.preventDefault();
    launchZoom(e.currentTarget, navigate, ctaUrl);
  };

  const [t, setT] = useState(getCountdown(top?.endTime));
  useEffect(() => {
    if (!top) return;
    const id = setInterval(() => setT(getCountdown(top.endTime)), 1000);
    return () => clearInterval(id);
  }, [top]);

  const spotsLeft = top ? Math.max(0, top.maxSpots - top.filledSpots) : 0;

  const sectionStyle = bgImage
    ? { backgroundImage: `url(${bgImage})`, backgroundSize: "cover", backgroundPosition: "center" }
    : { backgroundColor: bg };

  return (
    <section className="relative overflow-hidden text-white" style={sectionStyle}>
      {TICK_STYLE}
      {/* Dark overlay when bgImage is set */}
      {bgImage && (
        <div className="pointer-events-none absolute inset-0" style={{ background: "rgba(0,0,0,0.55)" }} />
      )}
      {/* Glow + grid texture */}
      <div className="pointer-events-none absolute inset-0">
        <div className="animate-hero-glow absolute -left-20 top-0 h-72 w-72 rounded-full bg-brand/20 blur-3xl" />
        <div className="animate-hero-glow absolute right-0 top-20 h-80 w-80 rounded-full bg-sky-500/10 blur-3xl" style={{ animationDelay: "3s" }} />
        <div className="absolute inset-0 opacity-[0.04]" style={{ backgroundImage: "radial-gradient(circle, #fff 1px, transparent 1px)", backgroundSize: "26px 26px" }} />
      </div>
      <FloatingIcons />

      {/* ═══════ MOBILE LAYOUT (< md) ═══════ */}
      <div className="relative md:hidden">
        {/* 2-col: text+countdown | product card */}
        <div className="grid grid-cols-2 gap-3 px-4 pt-8">
          {/* Left */}
          <div className="flex flex-col">
            <h1 className="text-2xl font-extrabold leading-tight">
              <EditableText keyName="hero.headline1" fallback="Buy Together," as="span" className="block text-white" />
              <EditableText keyName="hero.headline2" fallback="Save More." as="span" className="block text-brand" />
            </h1>
            <p className="mt-1.5 text-xs text-gray-300">
              <EditableText keyName="hero.subtext" fallback="Wholesale price. No middleman." />
            </p>
            {top && <div className="mt-auto"><MobileCountdown t={t} spotsLeft={spotsLeft} /></div>}
          </div>

          {/* Right: product card */}
          {top && <MiniCard top={top} t={t} spotsLeft={spotsLeft} currency={currency} />}
        </div>

        {/* Full-width CTA */}
        <div className="px-4 pb-10 pt-5">
          <Link
            to={ctaUrl}
            onClick={onCta}
            className="btn-shine block w-full rounded-full bg-brand py-4 text-center text-sm font-bold tracking-widest text-white shadow-lg shadow-brand/30 transition-all duration-300 hover:bg-brand-hover hover:scale-[1.02] hover:shadow-xl hover:shadow-brand/40 active:scale-[0.98]"
          >
            <EditableText keyName="hero.ctaText" fallback="BROWSE BLOCS" /> →
          </Link>
          <p className="mt-3 text-center text-[10px] font-semibold tracking-widest text-gray-500">
            SECURE PAYMENTS &bull; 50K+ SHOPPERS
          </p>
        </div>
      </div>

      {/* ═══════ DESKTOP LAYOUT (md+) ═══════ */}
      <div className="relative mx-auto hidden max-w-7xl items-center gap-10 px-10 pb-24 pt-16 md:grid md:grid-cols-[1fr_auto_300px]">
        {/* Left: headline + button */}
        <div className="flex flex-col">
          <h1 className="text-5xl font-extrabold leading-[1.05] lg:text-6xl">
            <EditableText keyName="hero.headline1" fallback="Buy Together," as="span" className="block" />
            <EditableText keyName="hero.headline2" fallback="Save More." as="span" className="block text-brand" />
          </h1>
          <p className="mt-4 text-lg text-gray-300">
            <EditableText keyName="hero.subtext" fallback="Wholesale price. No middleman." />
          </p>
          {/* Same button style as mobile — sized to the headline text, not full column */}
          <div className="mt-8 flex w-fit flex-col">
            <Link
              to={ctaUrl}
              onClick={onCta}
              className="btn-shine block rounded-full bg-brand px-16 py-3.5 text-center text-sm font-bold tracking-widest text-white shadow-lg shadow-brand/30 transition-all duration-300 hover:bg-brand-hover hover:scale-[1.02] hover:shadow-xl hover:shadow-brand/40 active:scale-[0.98]"
            >
              <EditableText keyName="hero.ctaText" fallback="BROWSE BLOCS" /> →
            </Link>
            <p className="mt-3 text-center text-[10px] font-semibold tracking-widest text-gray-500">
              SECURE PAYMENTS &bull; 50K+ SHOPPERS
            </p>
          </div>
        </div>

        {/* Middle: countdown */}
        {top && (
          <div className="animate-float-bob-slow flex flex-col items-center">
            <div className="mb-3 flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-widest text-brand">
              <span>⚡</span>
              <EditableText keyName="hero.countdownLabel" fallback="BLOC CLOSES IN" />
            </div>
            <div className="rounded-xl bg-white/10 px-6 py-2 text-center ring-1 ring-white/10">
              <span className="text-2xl font-extrabold tabular-nums text-white">{pad(t.d)} DAY</span>
            </div>
            <div className="mt-2 flex items-end justify-center gap-1.5">
              <FlipCell value={t.h} label="HRS" />
              <span className="pb-4 text-xl font-bold text-gray-500">:</span>
              <FlipCell value={t.m} label="MIN" />
              <span className="pb-4 text-xl font-bold text-gray-500">:</span>
              <FlipCell value={t.s} label="SEC" />
            </div>
            <div className="mt-3 h-px w-40 bg-gradient-to-r from-transparent via-brand to-transparent" />
            <p className="animate-soft-pulse mt-2 text-xs font-semibold text-brand">
              Hurry! Only {spotsLeft} spots remaining
            </p>
          </div>
        )}

        {/* Right: same MiniCard as mobile */}
        {top && <MiniCard top={top} t={t} spotsLeft={spotsLeft} currency={currency} />}
      </div>

      {/* Ocean-tide — gentle swell, recedes down fast, rises back up slowly */}
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-24 overflow-hidden md:h-32">
        <svg className="absolute bottom-0 left-0 h-full w-full" viewBox="0 0 1440 120" preserveAspectRatio="none">
          {/* Main wave — broad smooth swell */}
          <path fill="var(--color-cream)">
            <animate
              attributeName="d"
              dur="9s"
              repeatCount="indefinite"
              calcMode="spline"
              keyTimes="0;0.38;1"
              keySplines="0.55 0 0.45 1; 0.25 0.8 0.55 1"
              values="
                M0,46 C360,30 720,30 1080,42 C1260,48 1380,50 1440,46 L1440,120 L0,120 Z;
                M0,106 C360,106 720,106 1080,106 C1260,106 1380,106 1440,106 L1440,120 L0,120 Z;
                M0,46 C360,30 720,30 1080,42 C1260,48 1380,50 1440,46 L1440,120 L0,120 Z
              "
            />
          </path>
          {/* Foam bubbles — appear at peak, fade as wave recedes */}
          {[120,310,520,720,920,1120,1320].map((cx, i) => {
            const r = [3.5,2,4,2.5,3,2,3.5][i];
            const peakY = [42,36,38,34,40,36,44][i];
            return (
              <circle key={i} cx={cx} r={r} fill="var(--color-cream)">
                <animate attributeName="cy" dur="9s" repeatCount="indefinite"
                  calcMode="spline" keyTimes="0;0.38;1"
                  keySplines="0.55 0 0.45 1; 0.25 0.8 0.55 1"
                  values={`${peakY};114;${peakY}`} />
                <animate attributeName="opacity" dur="9s" repeatCount="indefinite"
                  calcMode="spline" keyTimes="0;0.08;0.32;0.5;1"
                  keySplines="0.4 0 0.6 1;0.4 0 0.6 1;0.4 0 0.6 1;0.4 0 0.6 1"
                  values="0.8;0.9;0.7;0;0" />
              </circle>
            );
          })}
        </svg>
      </div>
    </section>
  );
}
