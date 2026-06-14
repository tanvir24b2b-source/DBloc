import { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useParams, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { useBloc, useBlocs } from "../hooks/useBlocs.js";
import { useText } from "../store/ContentContext.jsx";
import { formatPrice, pad } from "../lib/format.js";
import JoinModal from "../components/bloc/JoinModal.jsx";
import EditableText from "../components/common/EditableText.jsx";
import BlocCarousel from "../components/common/BlocCarousel.jsx";
import SeoHead from "../components/common/SeoHead.jsx";
import api from "../lib/api.js";

/* ---------- small helpers ---------- */
function fullCountdown(endTime) {
  const diff = new Date(endTime).getTime() - Date.now();
  if (diff <= 0) return { d: 0, h: 0, m: 0, s: 0, expired: true };
  return {
    d: Math.floor(diff / 8.64e7),
    h: Math.floor((diff % 8.64e7) / 3.6e6),
    m: Math.floor((diff % 3.6e6) / 6e4),
    s: Math.floor((diff % 6e4) / 1000),
    expired: false,
  };
}

function FlipCell({ value, label }) {
  return (
    <div className="flex flex-col items-center">
      <div className="w-10 rounded-lg border border-line bg-white py-1 text-center shadow-sm overflow-hidden">
        <span key={value} className="animate-flip-tick block text-lg font-extrabold tabular-nums text-ink">{pad(value)}</span>
      </div>
      <span className="mt-0.5 text-[9px] font-semibold tracking-widest text-muted">{label}</span>
    </div>
  );
}

const DEFAULT_FEATURES = [
  { icon: "✅", title: "Verified Quality", desc: "Genuine product, quality-checked before dispatch." },
  { icon: "🤝", title: "Group Wholesale Price", desc: "The more people join, the lower the price drops." },
  { icon: "🔒", title: "Secure Checkout", desc: "Safe payment via bKash, card, or cash on delivery." },
  { icon: "🚚", title: "Fast Delivery", desc: "Dispatched as soon as the Bloc fills up." },
];

export default function BlocDetail() {
  const { id } = useParams();
  const { data: bloc, isLoading } = useBloc(id);
  const { data: allBlocs = [] } = useBlocs();
  const currency = useText("site.currency", "৳");
  const joinLabel = useText("join.detailCta", "JOIN THIS BLOC");

  const [active, setActive] = useState(0);
  const [qty, setQty] = useState(1);
  const [showModal, setShowModal] = useState(false);
  const [placed, setPlaced] = useState(null);
  const [t, setT] = useState(fullCountdown(bloc?.endTime));

  // Sticky bar: show only when the top Join button is out of view AND user isn't actively scrolling
  const topJoinRef = useRef(null);
  const [topJoinVisible, setTopJoinVisible] = useState(true);
  const [scrolling, setScrolling] = useState(false);

  useEffect(() => {
    let timer;
    const checkTopVisible = () => {
      const el = topJoinRef.current;
      if (!el) return;
      const r = el.getBoundingClientRect();
      setTopJoinVisible(r.bottom > 0 && r.top < window.innerHeight);
    };
    const onScroll = () => {
      setScrolling(true);
      checkTopVisible();
      clearTimeout(timer);
      timer = setTimeout(() => setScrolling(false), 140); // pops back instantly after scroll stops
    };
    checkTopVisible(); // initial
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", checkTopVisible);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", checkTopVisible);
      clearTimeout(timer);
    };
  }, [bloc]);

  const stickyVisible = !topJoinVisible && !scrolling;

  useEffect(() => {
    if (!bloc) return;
    setT(fullCountdown(bloc.endTime));
    const i = setInterval(() => setT(fullCountdown(bloc.endTime)), 1000);
    return () => clearInterval(i);
  }, [bloc]);

  // Gallery: use bloc.gallery if present, else build square variants
  const images = useMemo(() => {
    if (!bloc) return [];
    const list = bloc.gallery?.length ? [bloc.image, ...bloc.gallery].filter(Boolean) : [bloc.image].filter(Boolean);
    return list.slice(0, 6);
  }, [bloc]);

  // Real recent orders for this bloc — refreshes every 30s
  const { data: recentActivity = [] } = useQuery({
    queryKey: ["bloc-recent", id],
    queryFn: () => api.get(`/orders/bloc/${id}/recent`).then((r) => r.data),
    enabled: !!id,
    refetchInterval: 30000,
  });

  if (isLoading) return <p className="p-16 text-center text-muted">Loading...</p>;
  if (!bloc) return <p className="p-16 text-center text-muted">Bloc not found.</p>;

  const seoTitle = `${bloc.title} — D BLOC Group Buy`;
  const seoDesc = bloc.description || `Join the ${bloc.title} group buy on D BLOC. Save ${bloc.discount ?? 0}% off retail price.`;

  const discount = bloc.discount ?? 0;
  const save = bloc.originalPrice - bloc.blocPrice;
  const spotsLeft = Math.max(0, bloc.maxSpots - bloc.filledSpots);
  const capacityPct = Math.round((bloc.filledSpots / bloc.maxSpots) * 100);

  // Unlock goal = real admin-set threshold to unlock the D-Bloc special price
  const unlockGoal = bloc.goal && bloc.goal > 0 ? bloc.goal : Math.round(bloc.maxSpots * 0.5);
  const joined = bloc.filledSpots;
  const moreNeeded = Math.max(0, unlockGoal - joined);
  const unlockPct = Math.min(100, Math.round((joined / unlockGoal) * 100));

  // Pricing tiers
  const mid = Math.round(((bloc.originalPrice + bloc.blocPrice) / 2) / 10) * 10;
  const a = Math.max(2, Math.round(unlockGoal * 0.6));
  const tiers = [
    { range: `1–${a - 1} UNITS`, price: bloc.originalPrice },
    { range: `${a}–${unlockGoal - 1} UNITS`, price: mid },
    { range: `${unlockGoal}+ UNITS`, price: bloc.blocPrice, best: true },
  ];

  // Delivery dates
  const fmt = (addDays) => {
    const d = new Date(Date.now() + addDays * 8.64e7);
    return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  };

  const features = bloc.features?.length ? bloc.features : DEFAULT_FEATURES;
  const total = bloc.blocPrice * qty;
  const otherBlocs = allBlocs.filter((b) => b._id !== bloc._id);

  const Section = ({ children, className = "" }) => (
    <section className={`rounded-2xl border border-line bg-white p-6 ${className}`}>{children}</section>
  );

  return (
    <>
    <SeoHead title={seoTitle} description={seoDesc} />
    <div className="page-slide-in mx-auto max-w-6xl space-y-5 px-3 py-4 pb-28 md:px-6 md:py-8">
      {/* ===== TOP: gallery + info ===== */}
      <div className="grid items-start gap-4 md:gap-8 lg:grid-cols-2">
        {/* Gallery */}
        <div>
          {/* Tablet/desktop: main image LEFT, vertical thumb strip RIGHT. Hero capped on tablet. */}
          <div className="flex gap-3 md:mx-auto md:max-w-xl lg:max-w-none">
            {/* Main image */}
            <div className="relative min-w-0 flex-1 overflow-hidden rounded-2xl border border-line">
              {discount > 0 && (
                <span className="absolute left-3 top-3 z-10 rounded-full bg-brand px-3 py-1 text-xs font-bold text-white">{discount}% OFF</span>
              )}
              <img src={images[active]} alt={bloc.title} className="block aspect-square w-full object-cover" />
              <button
                onClick={() => setActive((i) => (i + 1) % images.length)}
                className="absolute right-3 top-1/2 grid h-9 w-9 -translate-y-1/2 place-items-center rounded-full bg-ink/70 text-white transition hover:bg-brand"
                aria-label="Next image"
              >›</button>
            </div>
            {/* Vertical thumbnails — desktop/tablet only */}
            <div className="hidden w-16 shrink-0 flex-col gap-2 md:flex">
              {images.slice(0, 4).map((src, i) => (
                <button
                  key={i}
                  onClick={() => setActive(i)}
                  className={`aspect-square w-full overflow-hidden rounded-lg border-2 ${active === i ? "border-brand" : "border-line"}`}
                >
                  <img src={src} alt="" className="block h-full w-full object-cover" />
                </button>
              ))}
            </div>
          </div>
          {/* Mobile: horizontal thumb row below */}
          <div className="mt-2 flex gap-2 md:hidden">
            {images.slice(0, 4).map((src, i) => (
              <button
                key={i}
                onClick={() => setActive(i)}
                className={`h-14 w-14 shrink-0 overflow-hidden rounded-lg border-2 ${active === i ? "border-brand" : "border-line"}`}
              >
                <img src={src} alt="" className="block h-full w-full object-cover" />
              </button>
            ))}
          </div>
        </div>

        {/* Info */}
        <div>
          <h1 className="text-3xl font-extrabold text-ink">{bloc.title}</h1>
          <p className="mt-1.5 line-clamp-1 text-sm text-muted">{bloc.description}</p>

          {/* Lowest price card */}
          <div className="mt-5 rounded-2xl border border-line bg-cream p-4">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-wider text-muted"><EditableText keyName="bloc.lowestLabel" fallback="Lowest Price Achieved" /></span>
              <span className="rounded-full bg-[#dcfce7] px-2.5 py-0.5 text-[11px] font-bold text-[#15803d]"><EditableText keyName="bloc.verifiedBadge" fallback="✓ Verified Deal" /></span>
            </div>
            <div className="mt-3 grid grid-cols-2 divide-x divide-line text-center">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-wider text-muted"><EditableText keyName="bloc.regularLabel" fallback="Regular" /></p>
                <p className="text-lg font-bold text-[#ef4444] line-through">{currency}{formatPrice(bloc.originalPrice)}</p>
              </div>
              <div>
                <p className="text-[10px] font-bold uppercase tracking-wider text-brand"><EditableText keyName="bloc.dblocLabel" fallback="D-Bloc Price" /></p>
                <p className="text-2xl font-extrabold text-ink">{currency}{formatPrice(bloc.blocPrice)}</p>
              </div>
            </div>
            <div className="mt-3 rounded-lg bg-[#dcfce7] py-2 text-center text-sm font-semibold text-[#15803d]">
              🎉 You Save {currency}{formatPrice(save)} — That's {discount}% OFF
            </div>
          </div>

          {/* Join button */}
          <button
            ref={topJoinRef}
            onClick={() => setShowModal(true)}
            disabled={bloc.status !== "active"}
            className="btn-shine mt-4 w-full rounded-xl bg-brand py-4 text-sm font-bold tracking-wide text-white shadow-lg shadow-brand/30 transition hover:bg-brand-hover disabled:bg-muted disabled:shadow-none"
          >
            {bloc.status === "active" ? `${joinLabel} NOW →` : bloc.status === "full" ? "BLOC FULL" : "BLOC EXPIRED"}
          </button>

          {/* Closing in */}
          <div className="mt-3 rounded-xl border border-brand/30 bg-brand/[0.04] px-3 py-2.5">
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-ink"><span className="text-brand">⚡</span> <EditableText keyName="bloc.closingLabel" fallback="Closing In" /></span>
              <span className="text-[10px] font-semibold text-brand">🔥 {spotsLeft} spots left</span>
            </div>
            <div className="mt-2 flex items-center justify-center gap-1">
              <FlipCell value={t.d} label="DAYS" /><span className="pb-3.5 text-xs font-bold text-muted">:</span>
              <FlipCell value={t.h} label="HRS" /><span className="pb-3.5 text-xs font-bold text-muted">:</span>
              <FlipCell value={t.m} label="MIN" /><span className="pb-3.5 text-xs font-bold text-muted">:</span>
              <FlipCell value={t.s} label="SEC" />
            </div>
            <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-line">
              <div className="h-full rounded-full bg-brand" style={{ width: `${capacityPct}%` }} />
            </div>
            <div className="mt-1.5 flex items-center justify-between text-[10px]">
              <span className="rounded-full border border-brand px-2 py-0.5 font-bold text-brand">ACTIVE</span>
              <span className="animate-hurry font-bold text-brand"><EditableText keyName="bloc.hurryText" fallback="Hurry — closes soon!" /></span>
              <span className="flex items-center gap-1 text-success"><span className="h-1.5 w-1.5 rounded-full bg-success" /> Live</span>
            </div>
          </div>
        </div>
      </div>

      {/* ===== Participation ===== */}
      <Section>
        <div className="flex items-start justify-between">
          <div>
            <p className="text-2xl font-extrabold text-ink">{joined} joined</p>
            <p className="text-[11px] font-bold uppercase tracking-wider text-muted"><EditableText keyName="bloc.participationLabel" fallback="Current Participation" /></p>
          </div>
          {moreNeeded > 0 ? (
            <span className="rounded-full bg-brand/10 px-3 py-1 text-xs font-bold text-brand">🎯 Only {moreNeeded} more needed</span>
          ) : (
            <span className="rounded-full bg-success/15 px-3 py-1 text-xs font-bold text-success">✓ Wholesale unlocked</span>
          )}
        </div>

        <div className="mt-5 space-y-4">
          <div>
            <div className="mb-1 flex justify-between text-xs font-semibold">
              <span className="text-ink"><EditableText keyName="bloc.unlockLabel" fallback="Unlock Progress" /></span>
              <span className="text-muted">{joined} / {unlockGoal} to goal</span>
            </div>
            <div className="h-2 w-full overflow-hidden rounded-full bg-line"><div className="h-full rounded-full bg-brand" style={{ width: `${unlockPct}%` }} /></div>
          </div>
          <div>
            <div className="mb-1 flex justify-between text-xs font-semibold">
              <span className="text-ink"><EditableText keyName="bloc.capacityLabel" fallback="Capacity Status" /></span>
              <span className="text-muted">{capacityPct}% filled</span>
            </div>
            <div className="h-2 w-full overflow-hidden rounded-full bg-line"><div className="h-full rounded-full bg-ink" style={{ width: `${capacityPct}%` }} /></div>
          </div>
        </div>

        <div className="mt-5 flex justify-between border-t border-line pt-4 text-sm">
          <div><p className="font-bold text-ink">{unlockGoal} Units</p><p className="text-[10px] font-bold uppercase tracking-wider text-muted">Min. Required</p></div>
          <div className="text-right"><p className="font-bold text-ink">{spotsLeft} Available</p><p className="text-[10px] font-bold uppercase tracking-wider text-muted">Remaining Spots</p></div>
        </div>
      </Section>

      {/* ===== Pricing tiers + quantity ===== */}
      <Section>
        <h2 className="flex items-center gap-2 text-base font-bold text-ink"><span className="text-brand">{currency}</span> <EditableText keyName="bloc.tiersTitle" fallback="Pricing Tiers" /></h2>
        <div className="mt-4 grid gap-3 md:grid-cols-3">
          {tiers.map((tier, i) => (
            <div key={i} className={`relative rounded-xl border p-4 text-center ${tier.best ? "border-brand bg-brand/[0.04]" : "border-line"}`}>
              {tier.best && <span className="absolute -top-2 left-1/2 -translate-x-1/2 rounded-full bg-brand px-2 py-0.5 text-[9px] font-bold text-white">BEST PRICE</span>}
              <p className="text-[10px] font-bold uppercase tracking-wider text-muted">{tier.range}</p>
              <p className={`mt-1 text-xl font-extrabold ${tier.best ? "text-brand" : "text-ink"}`}>{currency}{formatPrice(tier.price)}</p>
            </div>
          ))}
        </div>

        <div className="mt-5 flex items-center justify-between rounded-xl border border-line bg-cream p-4">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wider text-muted"><EditableText keyName="bloc.qtyLabel" fallback="Select Quantity" /></p>
            <div className="mt-1 flex items-center gap-3">
              <button onClick={() => setQty((q) => Math.max(1, q - 1))} className="grid h-9 w-9 place-items-center rounded-lg border border-line bg-white text-lg font-bold hover:border-brand">−</button>
              <span className="w-8 text-center text-lg font-bold">{qty}</span>
              <button onClick={() => setQty((q) => q + 1)} className="grid h-9 w-9 place-items-center rounded-lg border border-line bg-white text-lg font-bold hover:border-brand">+</button>
            </div>
          </div>
          <div className="text-right">
            <p className="text-[10px] font-bold uppercase tracking-wider text-muted"><EditableText keyName="bloc.totalLabel" fallback="Bloc Total" /></p>
            <p className="text-2xl font-extrabold text-brand">{currency}{formatPrice(total)}</p>
          </div>
        </div>
      </Section>

      {/* ===== Recent Joins + Delivery side by side ===== */}
      <Section className="!p-0 overflow-hidden">
        <div className="grid md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-line">
          {/* Left: Recent Joins */}
          <div className="p-5">
            <div className="flex items-center justify-between">
              <h2 className="flex items-center gap-2 text-base font-bold text-ink">
                <span className="h-2 w-2 animate-dot-pulse rounded-full bg-success" />
                <EditableText keyName="bloc.recentTitle" fallback="Recent Joins" />
              </h2>
              <span className="rounded-full bg-[#dcfce7] px-2.5 py-0.5 text-[10px] font-bold text-[#15803d]">Live</span>
            </div>
            <div className="mt-3 space-y-2">
              {recentActivity.map((r, i) => (
                <div key={i} className="flex items-center gap-2 rounded-lg bg-cream px-3 py-2">
                  <div className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-brand/10 text-xs font-bold text-brand">{r.name[0]}</div>
                  <span className="flex-1 text-sm font-semibold text-ink">{r.name}</span>
                  <span className="font-mono text-xs text-muted">{r.phone}</span>
                  <span className="text-[10px] text-muted">{r.time}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Right: Estimated Delivery */}
          <div className="p-5">
            <div className="flex items-center justify-between">
              <h2 className="flex items-center gap-2 text-base font-bold text-ink">📦 <EditableText keyName="bloc.deliveryTitle" fallback="Delivery" /></h2>
              <span className="rounded-full bg-brand/10 px-2.5 py-0.5 text-[10px] font-bold text-brand">FREE TRACKING</span>
            </div>
            <div className="mt-4 space-y-3">
              {[
                { t: "Bloc Fills", d: `Today · ${fmt(0)}` },
                { t: "Order Dispatched", d: `${fmt(1)}–${fmt(2)}` },
                { t: "Delivered to You", d: `${fmt(4)}–${fmt(7)} est.` },
              ].map((step, i, arr) => {
                // Live stage: active bloc → still filling (0); full → dispatching (1); completed → delivered (2)
                const stage = bloc.status === "completed" ? 2 : bloc.status === "full" ? 1 : 0;
                const done = i < stage;
                const current = i === stage;
                return (
                  <div key={i} className="flex gap-3">
                    <div className="flex flex-col items-center">
                      {current ? (
                        <span className="relative mt-1 h-3 w-3">
                          <span className="absolute inset-0 animate-ping rounded-full bg-brand opacity-60" />
                          <span className="absolute inset-0 rounded-full bg-brand" />
                        </span>
                      ) : (
                        <span className={`mt-1 h-3 w-3 rounded-full ${done ? "bg-success" : "bg-line border border-line"}`} />
                      )}
                      {i < arr.length - 1 && (
                        <span className={`my-1 w-px flex-1 ${done ? "bg-success" : current ? "flow-line bg-line" : "bg-line"}`} />
                      )}
                    </div>
                    <div>
                      <p className={`text-sm font-bold ${current ? "text-brand" : "text-ink"}`}>{step.t}</p>
                      <p className="text-xs text-muted">{step.d}</p>
                    </div>
                  </div>
                );
              })}
            </div>
            <div className="mt-4 rounded-lg bg-brand/[0.06] px-3 py-2 text-xs font-semibold text-brand"><EditableText keyName="bloc.deliveryNote" fallback="🚚 Dhaka 1–2d · Outside 3–5d after dispatch" /></div>
          </div>
        </div>
      </Section>

      {/* ===== Key features ===== */}
      <Section>
        <h2 className="flex items-center gap-2 text-base font-bold text-ink">✨ <EditableText keyName="bloc.featuresTitle" fallback="Key Features" /></h2>
        <p className="mt-1 text-sm italic text-muted"><EditableText keyName="bloc.featuresSubtitle" fallback="Everything you get when you join this Bloc." /></p>
        <div className="mt-4 divide-y divide-line">
          {features.map((f, i) => (
            <div key={i} className="flex items-start gap-4 py-4">
              <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-brand/10 text-lg">{f.icon || "•"}</span>
              <div><p className="font-bold text-ink">{f.title}</p><p className="text-sm text-muted">{f.desc}</p></div>
            </div>
          ))}
        </div>
      </Section>

      {/* Trust badges */}
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        {[["🛡", "Secure Payment"], ["✓", "Verified Product"], ["↺", "Easy Refund"], ["🚚", "Fast Delivery"]].map(([icon, label]) => (
          <div key={label} className="flex items-center gap-2 rounded-xl border border-line bg-white px-4 py-3 text-sm font-semibold text-ink"><span>{icon}</span> {label}</div>
        ))}
      </div>

      {/* More deals */}
      {otherBlocs.length > 0 && (
        <div className="pt-2">
          <h2 className="mb-1 flex items-center gap-2 text-base font-bold text-ink">🔥 <EditableText keyName="bloc.moreTitle" fallback="More Deals For You" /></h2>
          <p className="mb-4 text-[11px] font-bold uppercase tracking-wider text-muted"><EditableText keyName="bloc.moreSubtitle" fallback="Join more Blocs & save bigger" /></p>
          <BlocCarousel blocs={otherBlocs} />
        </div>
      )}

      {/* ===== Sticky join bar — pops up when top button is gone & scrolling stopped ===== */}
      <div
        className={`fixed inset-x-0 bottom-0 z-30 transition-transform duration-300 ease-out ${stickyVisible ? "translate-y-0" : "translate-y-full"}`}
      >
        <div className="mx-auto mb-3 flex max-w-3xl items-center justify-between gap-4 rounded-2xl border border-line bg-white px-5 py-3 shadow-2xl">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wider text-muted">Ends In</p>
            <p className="flex items-center gap-1.5 text-2xl font-extrabold tabular-nums text-brand">
              <span className="h-2 w-2 animate-dot-pulse rounded-full bg-brand" />
              {pad(t.h + t.d * 24)}:{pad(t.m)}:{pad(t.s)}
            </p>
          </div>
          <button
            onClick={() => setShowModal(true)}
            disabled={bloc.status !== "active"}
            className="btn-shine rounded-xl bg-brand px-8 py-3.5 text-sm font-bold tracking-wide text-white shadow-lg shadow-brand/40 transition hover:bg-brand-hover disabled:bg-muted disabled:shadow-none"
          >
            {joinLabel} →
          </button>
        </div>
      </div>

      {showModal && (
        <JoinModal bloc={bloc} quantity={qty} onClose={() => setShowModal(false)} onSuccess={(order) => { setShowModal(false); setPlaced(order); }} />
      )}
      {placed && createPortal(
        <div className="modal-fade fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={() => setPlaced(null)}>
          <div className="modal-pop w-full max-w-sm rounded-2xl bg-white p-6 text-center" onClick={(e) => e.stopPropagation()}>
            <div className="mb-3 text-4xl">🎉</div>
            <h3 className="text-lg font-bold text-ink">You joined the Bloc!</h3>
            <p className="mt-2 text-sm text-muted">Order ID</p>
            <p className="text-xl font-bold text-brand">{placed.orderId}</p>
            <Link to="/track-order" className="mt-5 block rounded-full bg-ink py-2.5 text-sm font-bold text-white">Track My Order</Link>
          </div>
        </div>,
        document.body
      )}
    </div>
    </>
  );
}
