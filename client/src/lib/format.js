export function formatPrice(n) {
  return new Intl.NumberFormat("en-US").format(n || 0);
}

// Returns { h, m, s, expired } countdown to a target date
export function getCountdown(endTime) {
  const diff = new Date(endTime).getTime() - Date.now();
  if (diff <= 0) return { d: 0, h: 0, m: 0, s: 0, expired: true };
  const d = Math.floor(diff / 864e5);
  const h = Math.floor((diff % 864e5) / 3.6e6);
  const m = Math.floor((diff % 3.6e6) / 6e4);
  const s = Math.floor((diff % 6e4) / 1000);
  return { d, h, m, s, expired: false };
}

export const pad = (n) => String(n).padStart(2, "0");
