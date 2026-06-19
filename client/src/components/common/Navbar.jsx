import { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { useText } from "../../store/ContentContext.jsx";
import { useAuthStore } from "../../store/useAuthStore.js";
import { useCategories } from "../../hooks/useBlocs.js";
import EditableText from "./EditableText.jsx";
import Logo from "./Logo.jsx";
import api from "../../lib/api.js";
import { formatPrice } from "../../lib/format.js";

function useDebounce(value, delay = 300) {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return debounced;
}

/* ── Search dropdown (module-scope to avoid re-creating the component type on every render) ── */
function SearchDropdown({ showDrop, matchedCats, searchBlocs, hasResults, dq, q, currency, go, formatPrice }) {
  if (!showDrop) return null;
  return (
    <div className="absolute top-full left-0 right-0 mt-2 rounded-xl border border-line bg-white shadow-xl overflow-hidden z-50">
      {matchedCats.length > 0 && (
        <div>
          <p className="px-4 pt-3 pb-1 text-[10px] font-bold uppercase tracking-widest text-muted">Categories</p>
          {matchedCats.map(c => (
            <button key={c._id} type="button" onClick={() => go("/categories")}
              className="flex w-full items-center gap-3 px-4 py-2.5 text-left hover:bg-cream transition">
              <div className="h-8 w-8 rounded-lg overflow-hidden bg-gray-100 flex items-center justify-center shrink-0">
                {c.image ? <img src={c.image} alt={c.name} className="w-full h-full object-cover" /> : <span className="text-base">📦</span>}
              </div>
              <span className="text-sm font-semibold text-ink">{c.name}</span>
              <span className="ml-auto text-[11px] text-muted">category</span>
            </button>
          ))}
        </div>
      )}
      {searchBlocs.length > 0 && (
        <div>
          {matchedCats.length > 0 && <div className="border-t border-line mx-3" />}
          <p className="px-4 pt-3 pb-1 text-[10px] font-bold uppercase tracking-widest text-muted">Products</p>
          {searchBlocs.slice(0, 5).map(b => (
            <button key={b._id} type="button" onClick={() => go(`/blocs/${b._id}`)}
              className="flex w-full items-center gap-3 px-4 py-2.5 text-left hover:bg-cream transition">
              <img src={b.image} alt={b.title} className="h-10 w-10 rounded-lg object-cover shrink-0 border border-line" />
              <div className="flex-1 min-w-0">
                <p className="truncate text-sm font-semibold text-ink">{b.title}</p>
                <p className="text-[11px] text-muted">{b.category?.name ?? ""}</p>
              </div>
              <span className="shrink-0 text-sm font-bold text-brand">{currency}{formatPrice(b.blocPrice)}</span>
            </button>
          ))}
        </div>
      )}
      {!hasResults && dq.trim().length >= 2 && (
        <p className="px-4 py-4 text-sm text-muted">No results for "{dq}"</p>
      )}
      {hasResults && (
        <button type="submit"
          className="flex w-full items-center justify-center gap-1 border-t border-line bg-cream px-4 py-3 text-xs font-bold text-brand hover:text-brand-hover transition">
          See all results for "{q}" →
        </button>
      )}
    </div>
  );
}

export default function Navbar() {
  const searchPh = useText("nav.searchPlaceholder", "Search deals, products...");
  const { user, logout } = useAuthStore();
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");
  const [showDrop, setShowDrop] = useState(false);
  const [catOpen, setCatOpen] = useState(false); // mobile All Blocs expand
  const [hovering, setHovering] = useState(false); // desktop hover
  const hoverTimer = useRef(null);
  const navigate = useNavigate();
  const wrapRef = useRef(null);
  const currency = useText("site.currency", "৳");

  const dq = useDebounce(q, 280);

  const { data: cats = [] } = useCategories();

  const { data: searchBlocs = [] } = useQuery({
    queryKey: ["search", dq],
    queryFn: () => api.get("/blocs", { params: { q: dq, limit: 6 } }).then(r => r.data),
    enabled: dq.trim().length >= 2,
    staleTime: 30_000,
  });

  // Category matches
  const matchedCats = dq.trim().length >= 2
    ? cats.filter(c => c.name.toLowerCase().includes(dq.toLowerCase()))
    : [];

  const hasResults = matchedCats.length > 0 || searchBlocs.length > 0;

  // Close dropdown on outside click
  useEffect(() => {
    function handle(e) {
      if (wrapRef.current && !wrapRef.current.contains(e.target)) setShowDrop(false);
    }
    document.addEventListener("mousedown", handle);
    return () => document.removeEventListener("mousedown", handle);
  }, []);

  // Show dropdown when we have results
  useEffect(() => {
    if (dq.trim().length >= 2) setShowDrop(true);
    else setShowDrop(false);
  }, [dq, hasResults]);

  function handleSearch(e) {
    e.preventDefault();
    const term = q.trim();
    setShowDrop(false);
    navigate(term ? `/categories?q=${encodeURIComponent(term)}` : "/categories");
    setQ("");
    setOpen(false);
  }

  function go(path) {
    setShowDrop(false);
    setQ("");
    navigate(path);
  }

  /* SearchDropdown is defined at module scope to avoid re-creating component type on each render */
  const dropProps = { showDrop, matchedCats, searchBlocs, hasResults, dq, q, currency, go, formatPrice };

  return (
    <>
    <header className="sticky top-0 z-40 border-b border-line bg-white text-ink shadow-sm">

      {/* ═══ MOBILE TOP BAR ═══ */}
      <div className="flex items-center justify-between px-3 py-2.5 md:hidden">
        {/* Hamburger left */}
        <button onClick={() => setOpen((o) => !o)} className="grid h-9 w-9 place-items-center rounded-lg text-ink/70 hover:bg-cream text-lg">
          {open ? "✕" : "☰"}
        </button>

        {/* Logo center */}
        <Link to="/"><Logo /></Link>

        {/* Icons right */}
        <div className="flex items-center gap-1">
          {user?.role === "user" ? (
            <Link to="/profile" className="grid h-9 w-9 place-items-center rounded-full bg-brand text-[11px] font-extrabold text-white">
              {user.name?.[0]?.toUpperCase()}
            </Link>
          ) : (
            <Link to="/login" className="grid h-9 w-9 place-items-center rounded-lg text-ink/70 hover:text-brand">
              <span className="text-xl">👤</span>
            </Link>
          )}
          <button
            onClick={() => { setOpen(true); }}
            className="grid h-9 w-9 place-items-center rounded-lg text-ink/70 hover:bg-cream"
          >
            <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" />
            </svg>
          </button>
        </div>
      </div>

      {/* ═══ DESKTOP TOP BAR ═══ */}
      <div className="mx-auto hidden max-w-7xl items-center gap-4 px-4 py-3 md:flex">
        <Link to="/"><Logo /></Link>

        <nav className="ml-4 flex items-center gap-1 text-xs font-bold tracking-wide text-ink/70">
          {/* ALL BLOCS with hover category dropdown */}
          <div
            className="relative"
            onMouseEnter={() => { clearTimeout(hoverTimer.current); setHovering(true); }}
            onMouseLeave={() => { hoverTimer.current = setTimeout(() => setHovering(false), 150); }}
          >
            <Link to="/categories" className="flex items-center gap-1 rounded-lg px-3 py-2 hover:bg-cream hover:text-brand transition-colors">
              <EditableText keyName="nav.link1" fallback="ALL BLOCS" />
              <span className={`text-[10px] transition-transform duration-200 ${hovering ? "rotate-180" : ""}`}>▾</span>
            </Link>
            {hovering && cats.length > 0 && (
              <div className="absolute left-0 top-full z-50 mt-1 min-w-[180px] overflow-hidden rounded-xl border border-line bg-white shadow-xl">
                {cats.map(c => (
                  <Link key={c._id} to={`/categories?cat=${c._id}`}
                    onClick={() => setHovering(false)}
                    className="flex items-center gap-2.5 px-4 py-2.5 text-sm font-medium text-ink hover:bg-cream hover:text-brand transition">
                    {c.image
                      ? <img src={c.image} alt={c.name} className="h-5 w-5 rounded object-cover shrink-0" />
                      : <span className="text-base">📦</span>}
                    {c.name}
                  </Link>
                ))}
              </div>
            )}
          </div>
          <Link to="/categories" className="rounded-lg px-3 py-2 hover:bg-cream hover:text-brand transition-colors">
            <EditableText keyName="nav.link2" fallback="CATEGORIES" />
          </Link>
          <Link to="/track-order" className="rounded-lg px-3 py-2 hover:bg-cream hover:text-brand transition-colors">
            <EditableText keyName="nav.link3" fallback="TRACK ORDER" />
          </Link>
          <Link to="/request-bloc" className="rounded-lg px-3 py-2 hover:bg-cream hover:text-brand transition-colors whitespace-nowrap">
            REQUEST BLOC
          </Link>
        </nav>

        {/* Desktop search */}
        <form onSubmit={handleSearch} className="flex flex-1 justify-center px-4">
          <div className="relative w-full max-w-md" ref={wrapRef}>
            <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-muted text-sm">⌕</span>
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              onFocus={() => { if (dq.trim().length >= 2) setShowDrop(true); }}
              onKeyDown={(e) => { if (e.key === "Escape") { setShowDrop(false); setQ(""); } }}
              placeholder={searchPh}
              className="w-full rounded-full border border-line bg-cream px-10 py-2 text-sm text-ink placeholder-muted outline-none focus:border-brand"
              autoComplete="off"
            />
            <SearchDropdown {...dropProps} />
          </div>
        </form>

        {/* Desktop auth */}
        <div className="flex items-center gap-3 text-xs font-bold">
          {user ? (
            user.role === "user" ? (
              <>
                <Link to="/profile" className="flex items-center gap-1.5 text-ink/80 hover:text-brand">
                  <span className="grid h-7 w-7 place-items-center rounded-full bg-brand text-[11px] font-extrabold text-white">
                    {user.name?.[0]?.toUpperCase()}
                  </span>
                  <span>{user.name.split(" ")[0]}</span>
                </Link>
                <button onClick={() => { logout(); navigate("/"); }} className="text-ink/70 hover:text-brand">LOGOUT</button>
              </>
            ) : (
              <>
                <span className="text-muted">Hi, {user.name.split(" ")[0]}</span>
                <button onClick={() => { logout(); navigate("/"); }} className="text-ink/70 hover:text-brand">LOGOUT</button>
              </>
            )
          ) : (
            <Link to="/login" className="flex items-center gap-1 text-ink/80 hover:text-brand">
              <span>👤</span><EditableText keyName="nav.login" fallback="LOGIN" />
            </Link>
          )}
        </div>
      </div>

      {/* ═══ MOBILE MENU DRAWER ═══ */}
      {open && (
        <div className="border-t border-line bg-white md:hidden">
          {/* Mobile search */}
          <div className="px-4 pt-3 pb-2" ref={wrapRef}>
            <form onSubmit={handleSearch} className="relative">
              <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-muted text-sm">⌕</span>
              <input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                onFocus={() => { if (dq.trim().length >= 2) setShowDrop(true); }}
                onKeyDown={(e) => { if (e.key === "Escape") { setShowDrop(false); setQ(""); } }}
                placeholder={searchPh}
                className="w-full rounded-full border border-line bg-cream px-10 py-2.5 text-sm outline-none focus:border-brand"
                autoComplete="off"
              />
              <SearchDropdown {...dropProps} />
            </form>
          </div>

          {/* Nav links */}
          <nav className="flex flex-col px-4 pb-3">
            {/* All Blocs — tap to expand categories */}
            <div className="border-b border-line/60">
              <button
                onClick={() => setCatOpen(o => !o)}
                className="flex w-full items-center justify-between py-3 text-sm font-medium text-ink hover:text-brand"
              >
                <span>All Blocs</span>
                <span className={`text-xs transition-transform duration-200 ${catOpen ? "rotate-180" : ""}`}>▾</span>
              </button>
              {catOpen && cats.length > 0 && (
                <div className="mb-2 ml-2 flex flex-col gap-0.5">
                  {cats.map(c => (
                    <Link key={c._id} to={`/categories?cat=${c._id}`}
                      onClick={() => { setOpen(false); setCatOpen(false); }}
                      className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm text-ink/80 hover:bg-cream hover:text-brand transition">
                      {c.image
                        ? <img src={c.image} alt={c.name} className="h-5 w-5 rounded object-cover shrink-0" />
                        : <span>📦</span>}
                      {c.name}
                    </Link>
                  ))}
                </div>
              )}
            </div>
            {[
              ["Categories", "/categories"],
              ["Track Order", "/track-order"],
            ].map(([label, to]) => (
              <Link key={label} to={to} onClick={() => setOpen(false)}
                className="flex items-center gap-3 border-b border-line/60 py-3 text-sm font-medium text-ink hover:text-brand">
                {label}
              </Link>
            ))}
            <Link to="/request-bloc" onClick={() => setOpen(false)}
              className="flex items-center gap-3 border-b border-line/60 py-3 text-sm font-medium text-brand hover:text-brand-hover">
              ✦ Request a Bloc
            </Link>
            {user?.role === "user" && (
              <Link to="/profile" onClick={() => setOpen(false)}
                className="flex items-center gap-3 border-b border-line/60 py-3 text-sm font-semibold text-brand">
                My Profile
              </Link>
            )}
            {user ? (
              <button onClick={() => { logout(); navigate("/"); setOpen(false); }}
                className="mt-2 w-full rounded-full border border-line py-2.5 text-sm font-bold text-ink/70 hover:border-brand hover:text-brand">
                Logout
              </button>
            ) : (
              <Link to="/login" onClick={() => setOpen(false)}
                className="mt-2 block w-full rounded-full bg-brand py-2.5 text-center text-sm font-bold text-white">
                Login / Register
              </Link>
            )}
          </nav>
        </div>
      )}
    </header>

    </>
  );
}
