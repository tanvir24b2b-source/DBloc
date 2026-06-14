import { useEffect, useRef } from "react";

export function useReveal(options = {}) {
  const ref = useRef(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    // Already in viewport on mount — reveal instantly, no animation delay
    const rect = el.getBoundingClientRect();
    if (rect.top < window.innerHeight) {
      el.classList.add("revealed");
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          el.classList.add("revealed");
          observer.disconnect();
        }
      },
      { threshold: 0.05, ...options }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return ref;
}
