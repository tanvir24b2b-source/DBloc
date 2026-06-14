import { useEffect, useRef, useState, useCallback } from "react";
import { useContent } from "../../store/ContentContext.jsx";
import EditableText from "../common/EditableText.jsx";
import { useReveal } from "../../hooks/useReveal.js";

const REVIEW_KEYS = [
  { t: "reviews.r1Text", n: "reviews.r1Name", tf: "Got my soundbar at almost half price. The Bloc filled up in hours!",  nf: "Rahim, Dhaka",      ago: "2 weeks ago" },
  { t: "reviews.r2Text", n: "reviews.r2Name", tf: "So simple. Joined a Bloc, paid wholesale, delivered in 3 days.",      nf: "Sadia, Chittagong", ago: "1 month ago" },
  { t: "reviews.r3Text", n: "reviews.r3Name", tf: "Best prices in Bangladesh. No middleman markup at all.",              nf: "Karim, Sylhet",     ago: "3 weeks ago" },
  { t: "reviews.r4Text", n: "reviews.r4Name", tf: "Ordered the air fryer with friends. Got it at almost wholesale.",     nf: "Fatema, Rajshahi",  ago: "5 days ago" },
  { t: "reviews.r5Text", n: "reviews.r5Name", tf: "Already joined 3 blocs this month. The deals are real!",             nf: "Arif, Comilla",     ago: "2 months ago" },
  { t: "reviews.r6Text", n: "reviews.r6Name", tf: "Never thought I could afford noise-cancelling headphones.",           nf: "Mitu, Khulna",      ago: "1 week ago" },
];

const VISIBLE = 3;
const INTERVAL = 4500;

function getPerView(w) {
  if (w >= 1024) return VISIBLE;
  if (w >= 640) return 2;
  return 1;
}

export default function Reviews() {
  const revealRef = useReveal();
  const { map } = useContent();
  const [perView, setPerView] = useState(getPerView(typeof window !== "undefined" ? window.innerWidth : 1280));
  const [index, setIndex] = useState(0);
  const [animate, setAnimate] = useState(true);
  const pausedRef = useRef(false);

  useEffect(() => {
    const onResize = () => { setPerView(getPerView(window.innerWidth)); setIndex(0); };
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  const total = REVIEW_KEYS.length;
  const step = 100 / perView;

  const next = useCallback(() => {
    setAnimate(true);
    setIndex((i) => i + 1);
  }, []);

  const prev = useCallback(() => {
    if (index === 0) {
      setAnimate(false);
      setIndex(total);
      requestAnimationFrame(() => requestAnimationFrame(() => { setAnimate(true); setIndex(total - 1); }));
    } else {
      setAnimate(true);
      setIndex((i) => i - 1);
    }
  }, [index, total]);

  useEffect(() => {
    const id = setInterval(() => { if (!pausedRef.current) next(); }, INTERVAL);
    return () => clearInterval(id);
  }, [next]);

  const onTransitionEnd = () => {
    if (index >= total) {
      setAnimate(false);
      setIndex(0);
    }
  };

  useEffect(() => {
    if (!animate) {
      const t = requestAnimationFrame(() => setAnimate(true));
      return () => cancelAnimationFrame(t);
    }
  }, [animate]);

  const items = [...REVIEW_KEYS, ...REVIEW_KEYS];

  return (
    <section ref={revealRef} className="reveal bg-white py-14">
      <div className="mx-auto max-w-6xl px-6">
        <h2 className="mb-10 text-center text-2xl font-bold text-ink">
          <EditableText keyName="reviews.title" fallback="What Our Customers Say" />
        </h2>

        <div
          className="group relative"
          onMouseEnter={() => (pausedRef.current = true)}
          onMouseLeave={() => (pausedRef.current = false)}
        >
          <div className="overflow-hidden">
            <div
              className="flex"
              style={{
                transform: `translateX(-${index * step}%)`,
                transition: animate ? "transform 600ms cubic-bezier(0.22, 1, 0.36, 1)" : "none",
              }}
              onTransitionEnd={onTransitionEnd}
            >
              {items.map((r, i) => {
                const text = map[r.t] ?? r.tf;
                const name = map[r.n] ?? r.nf;
                return (
                  <div key={i} className="shrink-0 px-2" style={{ width: `${step}%` }}>
                    <div className="rounded-xl border border-line bg-white p-5 h-full flex flex-col gap-3">
                      <div className="text-2xl text-brand leading-none">★</div>
                      <p className="text-sm leading-relaxed text-ink/80 flex-1">
                        <EditableText keyName={r.t} fallback={r.tf} />
                      </p>
                      <div className="border-t border-line pt-3 flex items-center gap-2.5">
                        <div className="h-8 w-8 rounded-full bg-brand/10 flex items-center justify-center text-xs font-bold text-brand flex-shrink-0">
                          {(map[r.n] ?? r.nf).charAt(0)}
                        </div>
                        <div className="min-w-0">
                          <p className="text-xs font-semibold text-ink truncate"><EditableText keyName={r.n} fallback={r.nf} /></p>
                          <p className="text-[10px] text-muted">{r.ago}</p>
                        </div>
                        <div className="ml-auto text-brand text-[10px] tracking-tight flex-shrink-0">★★★★★</div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

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
      </div>
    </section>
  );
}
