import { useEffect, useRef, useState } from "react";
import api from "../../lib/api.js";

function HeroBgImageUpload({ items, onSaved }) {
  const fileRef = useRef();
  const item = items.find((i) => i.key === "hero.bgImage");
  const [preview, setPreview] = useState(item?.value || "");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setPreview(items.find((i) => i.key === "hero.bgImage")?.value || "");
  }, [items]);

  function pick() { fileRef.current?.click(); }

  async function handleFile(e) {
    const file = e.target.files[0];
    if (!file) return;
    e.target.value = "";
    const reader = new FileReader();
    reader.onload = async (ev) => {
      const val = ev.target.result;
      setPreview(val);
      setSaving(true);
      await api.put("/content/hero.bgImage", { value: val });
      setSaving(false);
      onSaved("hero.bgImage", val);
    };
    reader.readAsDataURL(file);
  }

  async function remove() {
    setPreview("");
    setSaving(true);
    await api.put("/content/hero.bgImage", { value: "" });
    setSaving(false);
    onSaved("hero.bgImage", "");
  }

  return (
    <div className="mb-3 rounded-xl border border-line bg-white p-4">
      <div className="mb-2 flex items-center justify-between">
        <div>
          <p className="text-sm font-bold text-ink">Hero Background Image</p>
          <p className="text-[11px] text-muted">Recommended: 1440 × 700 px · Replaces the dark background color</p>
        </div>
        {saving && <span className="text-[11px] text-muted">Saving…</span>}
      </div>
      {preview ? (
        <div className="relative overflow-hidden rounded-lg" style={{ height: 100 }}>
          <img src={preview} alt="Hero bg" className="h-full w-full object-cover" />
          <button
            onClick={remove}
            className="absolute right-2 top-2 rounded-full bg-black/60 px-3 py-1 text-[11px] font-bold text-white hover:bg-danger"
          >
            Remove
          </button>
        </div>
      ) : (
        <div
          onClick={pick}
          className="flex h-20 cursor-pointer items-center justify-center rounded-lg border-2 border-dashed border-line bg-cream text-sm text-muted transition hover:border-brand hover:text-brand"
        >
          + Upload banner image
        </div>
      )}
      <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleFile} />
    </div>
  );
}

// Pages shown in iframe preview (click-to-edit)
const PREVIEW_PAGES = [
  { id: "home",       label: "🏠 Homepage",    path: "/" },
  { id: "allblocs",   label: "📦 All Blocs",   path: "/blocs" },
  { id: "categories", label: "📂 Categories",  path: "/categories" },
  { id: "blocdetail", label: "🛍 Product Page", path: null }, // path resolved at runtime — previews the first bloc
  { id: "trackorder", label: "🔍 Track Order", path: "/track-order" },
];

// Static pages — direct title + body editor (no iframe needed)
const STATIC_PAGES = [
  { id: "about",        label: "🏢 About Us",        slug: "about",        titleKey: "page.about.title",      bodyKey: "page.about.body" },
  { id: "helpcenter",   label: "❓ Help Center",      slug: "help-center",  titleKey: "page.helpcenter.title", bodyKey: "page.helpcenter.body" },
  { id: "refund",       label: "↩ Refund Policy",    slug: "refund-policy",titleKey: "page.refund.title",     bodyKey: "page.refund.body" },
  { id: "delivery",     label: "🚚 Delivery Info",    slug: "delivery-info",titleKey: "page.delivery.title",   bodyKey: "page.delivery.body" },
  { id: "terms",        label: "📋 Terms of Service", slug: "terms",        titleKey: "page.terms.title",      bodyKey: "page.terms.body" },
  { id: "privacy",      label: "🔒 Privacy Policy",  slug: "privacy-policy",titleKey: "page.privacy.title",   bodyKey: "page.privacy.body" },
];

function StaticPageEditor({ page }) {
  const [title, setTitle] = useState("");
  const [body, setBody]   = useState("");
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    api.get(`/content?page=${page.id}`).then(({ data }) => {
      const items = data.items || [];
      const get = (k) => items.find((i) => i.key === k)?.value || "";
      setTitle(get(page.titleKey));
      setBody(get(page.bodyKey));
      setLoading(false);
    });
  }, [page.id]);

  async function save() {
    await Promise.all([
      api.put(`/content/${page.titleKey}`, { value: title }),
      api.put(`/content/${page.bodyKey}`,  { value: body }),
    ]);
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  }

  if (loading) return <div className="flex-1 flex items-center justify-center text-muted text-sm">Loading...</div>;

  return (
    <div className="flex-1 min-w-0 space-y-4">
      <div className="rounded-xl border border-line bg-white p-5">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h2 className="font-bold text-ink">{page.label}</h2>
            <a href={`http://localhost:5173/${page.slug}`} target="_blank" rel="noreferrer"
              className="text-xs text-brand hover:underline">
              ↗ View live page: /{page.slug}
            </a>
          </div>
          <button onClick={save}
            className="rounded-xl bg-brand px-5 py-2 text-sm font-bold text-white hover:bg-brand-hover">
            {saved ? "✓ Saved" : "Save Changes"}
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="mb-1 block text-[11px] font-bold uppercase tracking-wider text-muted">Page Title</label>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full rounded-lg border border-line px-3 py-2 text-sm font-semibold text-ink outline-none focus:border-brand"
            />
          </div>

          <div>
            <label className="mb-1 block text-[11px] font-bold uppercase tracking-wider text-muted">
              Page Content
              <span className="ml-2 normal-case font-normal text-gray-400">— use **bold** for headings, blank line for paragraphs</span>
            </label>
            <textarea
              value={body}
              onChange={(e) => setBody(e.target.value)}
              rows={20}
              className="w-full rounded-lg border border-line px-3 py-2 text-sm leading-relaxed text-ink outline-none focus:border-brand font-mono"
            />
          </div>
        </div>
      </div>
    </div>
  );
}

export default function ContentEditor() {
  const [activePage, setActivePage]   = useState(PREVIEW_PAGES[0]);
  const [activeStatic, setActiveStatic] = useState(null);
  const [items, setItems]   = useState([]);
  const [editKey, setEditKey]   = useState(null);
  const [editValue, setEditValue] = useState("");
  const [toast, setToast] = useState("");
  const [firstBlocPath, setFirstBlocPath] = useState(null);
  const iframeRef = useRef(null);

  useEffect(() => {
    api.get("/content").then(({ data }) => setItems(data.items));
    // Product Page preview needs a real bloc — use the first one
    api.get("/blocs").then(({ data }) => {
      const first = Array.isArray(data) ? data[0] : data?.[0];
      if (first?._id) setFirstBlocPath(`/blocs/${first._id}`);
    });
  }, []);

  useEffect(() => {
    function onMessage(e) {
      if (e.data?.type === "cms-edit-request") {
        const item = items.find((i) => i.key === e.data.key);
        setEditKey(e.data.key);
        setEditValue(item?.value ?? "");
      }
    }
    window.addEventListener("message", onMessage);
    return () => window.removeEventListener("message", onMessage);
  }, [items]);

  const currentItem = items.find((i) => i.key === editKey);

  async function save() {
    await api.put(`/content/${editKey}`, { value: editValue });
    setItems((arr) => arr.map((i) => (i.key === editKey ? { ...i, value: editValue } : i)));
    iframeRef.current?.contentWindow?.postMessage({ type: "cms-updated", key: editKey, value: editValue }, "*");
    setToast("Saved — live site updated");
    setEditKey(null);
    setTimeout(() => setToast(""), 2500);
  }

  function onHeroImageSaved(key, value) {
    setItems((arr) => arr.map((i) => (i.key === key ? { ...i, value } : i)));
    iframeRef.current?.contentWindow?.postMessage({ type: "cms-updated", key, value }, "*");
    setToast("Saved — live site updated");
    setTimeout(() => setToast(""), 2500);
  }

  function selectPreview(p) {
    setActivePage(p);
    setActiveStatic(null);
  }

  function selectStatic(p) {
    setActiveStatic(p);
    setActivePage(null);
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-ink">Content Editor</h1>
      <p className="mt-1 text-sm text-muted">
        Pick a page to edit. For live pages — <span className="font-semibold text-brand">click any highlighted text</span> in the preview. For static pages — edit directly.
      </p>

      <div className="mt-6 flex gap-4">
        {/* Sidebar */}
        <aside className="w-52 shrink-0 space-y-3">
          <div className="rounded-xl border border-line bg-white p-2">
            <p className="px-2 py-1 text-[10px] font-bold uppercase text-muted">Live Pages</p>
            {PREVIEW_PAGES.map((p) => (
              <button key={p.id} onClick={() => selectPreview(p)}
                className={`block w-full rounded-lg px-3 py-2 text-left text-sm ${!activeStatic && activePage?.id === p.id ? "bg-brand text-white" : "text-ink hover:bg-cream"}`}>
                {p.label}
              </button>
            ))}
          </div>

          <div className="rounded-xl border border-line bg-white p-2">
            <p className="px-2 py-1 text-[10px] font-bold uppercase text-muted">Static Pages</p>
            {STATIC_PAGES.map((p) => (
              <button key={p.id} onClick={() => selectStatic(p)}
                className={`block w-full rounded-lg px-3 py-2 text-left text-sm ${activeStatic?.id === p.id ? "bg-brand text-white" : "text-ink hover:bg-cream"}`}>
                {p.label}
              </button>
            ))}
          </div>

          <p className="px-1 text-xs text-muted">
            Edit site name, logo & contacts from <span className="font-semibold">Site Settings</span>.
          </p>
        </aside>

        {/* Main panel */}
        {activeStatic ? (
          <StaticPageEditor key={activeStatic.id} page={activeStatic} />
        ) : (
          <div className="flex-1">
            {activePage?.id === "home" && (
              <HeroBgImageUpload items={items} onSaved={onHeroImageSaved} />
            )}
            <div className="overflow-hidden rounded-xl border-2 border-brand bg-white shadow-sm">
              <div className="flex items-center gap-2 border-b border-line bg-cream px-4 py-2 text-xs text-muted">
                <span className="h-2.5 w-2.5 rounded-full bg-danger/60" />
                <span className="h-2.5 w-2.5 rounded-full bg-brand/60" />
                <span className="h-2.5 w-2.5 rounded-full bg-success/60" />
                <span className="ml-2 font-mono">{activePage?.path ?? firstBlocPath ?? "..."} — edit mode</span>
              </div>
              {(activePage?.path ?? firstBlocPath) ? (
                <iframe
                  ref={iframeRef}
                  key={activePage?.id}
                  src={`${activePage?.path ?? firstBlocPath}?editMode=true`}
                  title="preview"
                  className="h-[70vh] w-full"
                />
              ) : (
                <div className="flex h-[70vh] w-full items-center justify-center text-sm text-muted">
                  No blocs yet — add a product first to preview this page.
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Edit popover (for iframe click-to-edit) */}
      {editKey && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={() => setEditKey(null)}>
          <div className="w-full max-w-md rounded-2xl bg-white p-6" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-sm font-bold text-ink">{currentItem?.label || editKey}</h3>
            <p className="mb-3 text-[11px] text-muted">{editKey}</p>
            {currentItem?.type === "richtext" ? (
              <textarea rows="4" value={editValue} onChange={(e) => setEditValue(e.target.value)}
                className="w-full rounded-lg border border-line px-3 py-2 text-sm" autoFocus />
            ) : currentItem?.type === "color" ? (
              <input type="color" value={editValue} onChange={(e) => setEditValue(e.target.value)}
                className="h-10 w-24 rounded border border-line" />
            ) : (
              <input value={editValue} onChange={(e) => setEditValue(e.target.value)}
                className="w-full rounded-lg border border-line px-3 py-2 text-sm" autoFocus />
            )}
            <div className="mt-4 flex gap-2">
              <button onClick={save} className="flex-1 rounded-full bg-brand py-2.5 text-sm font-bold text-white hover:bg-brand-hover">Save</button>
              <button onClick={() => setEditKey(null)} className="rounded-full border border-line px-5 py-2.5 text-sm">Cancel</button>
            </div>
          </div>
        </div>
      )}

      {toast && (
        <div className="fixed bottom-6 right-6 z-50 rounded-lg bg-ink px-4 py-2 text-sm text-white shadow-lg">✓ {toast}</div>
      )}
    </div>
  );
}
