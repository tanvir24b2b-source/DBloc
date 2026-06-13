import { useEffect, useRef, useState, useCallback } from "react";
import BlocCard from "./BlocCard.jsx";

function getPerView(w) {
  if (w >= 1024) return 4;
  if (w >= 768) return 3;
  return 2;
}

/**
 * Premium auto-advancing carousel.
 * - Slides one card right→left on an interval (one in from right, one out to left).
 * - Seamless infinite loop (list is duplicated; index resets silently at the seam).
 * - Manual prev/next buttons. Pauses on hover.
 */
export default function BlocCarousel({ blocs = [], interval = 3500 }) {
  const [perView, setPerView] = useState(getPerView(typeof window !== "undefined" ? window.innerWidth : 1280));
  const [index, setIndex] = useState(0);
  const [animate, setAnimate] = useState(true);
  const pausedRef = useRef(false);

  // Responsive perView
  useEffect(() => {
    const onResize = () => { setPerView(getPerView(window.innerWidth)); setIndex(0); };
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  const len = blocs.length;
  const canSlide = len > Math.floor(perView);

  // If not enough cards to slide, render a plain grid.
  const step = 100 / perView;

  const next = useCallback(() => {
    if (!canSlide) return;
    setAnimate(true);
    setIndex((i) => i + 1);
  }, [canSlide]);

  const prev = useCallback(() => {
    if (!canSlide) return;
    if (index === 0) {
      // jump to the mirrored end without animation, then step back
      setAnimate(false);
      setIndex(len);
      requestAnimationFrame(() => requestAnimationFrame(() => { setAnimate(true); setIndex(len - 1); }));
    } else {
      setAnimate(true);
      setIndex((i) => i - 1);
    }
  }, [index, len, canSlide]);

  // Auto-advance
  useEffect(() => {
    if (!canSlide) return;
    const id = setInterval(() => { if (!pausedRef.current) next(); }, interval);
    return () => clearInterval(id);
  }, [next, interval, canSlide]);

  // Seamless reset when we pass the seam (index === len)
  const onTransitionEnd = () => {
    if (index >= len) {
      setAnimate(false);
      setIndex(0);
    }
  };
  // re-enable animation after a silent reset
  useEffect(() => {
    if (!animate) {
      const t = requestAnimationFrame(() => setAnimate(true));
      return () => cancelAnimationFrame(t);
    }
  }, [animate]);

  if (!canSlide) {
    return (
      <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
        {blocs.map((b) => <BlocCard key={b._id} bloc={b} />)}
      </div>
    );
  }

  const items = [...blocs, ...blocs]; // duplicate for infinite loop

  return (
    <div
      className="group relative"
      onMouseEnter={() => (pausedRef.current = true)}
      onMouseLeave={() => (pausedRef.current = false)}
    >
      {/* Track viewport */}
      <div className="overflow-hidden">
        <div
          className="flex"
          style={{
            transform: `translateX(-${index * step}%)`,
            transition: animate ? "transform 700ms cubic-bezier(0.22, 1, 0.36, 1)" : "none",
          }}
          onTransitionEnd={onTransitionEnd}
        >
          {items.map((b, i) => (
            <div key={i} className="shrink-0 px-2" style={{ width: `${step}%` }}>
              <BlocCard bloc={b} />
            </div>
          ))}
        </div>
      </div>

      {/* Prev / Next buttons */}
      <button
        onClick={prev}
        aria-label="Previous"
        className="absolute -left-3 top-1/2 z-10 grid h-10 w-10 -translate-y-1/2 place-items-center rounded-full border border-line bg-white text-ink shadow-lg transition hover:bg-brand hover:text-white"
      >
        ‹
      </button>
      <button
        onClick={next}
        aria-label="Next"
        className="absolute -right-3 top-1/2 z-10 grid h-10 w-10 -translate-y-1/2 place-items-center rounded-full border border-line bg-white text-ink shadow-lg transition hover:bg-brand hover:text-white"
      >
        ›
      </button>
    </div>
  );
}
