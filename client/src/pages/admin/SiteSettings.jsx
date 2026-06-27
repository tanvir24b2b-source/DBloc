import { useEffect, useRef, useState } from "react";
import api from "../../lib/api.js";
import { SOCIAL_ICON_DEFS, SocialIconSvg } from "../../lib/socialIcons.jsx";

function ImageUploadField({ value, onChange }) {
  const fileRef = useRef();

  function pick() { fileRef.current?.click(); }

  function handleFile(e) {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => onChange(ev.target.result);
    reader.readAsDataURL(file);
    e.target.value = "";
  }

  return (
    <div className="flex items-center gap-4">
      {/* Preview */}
      <div
        onClick={pick}
        className="flex h-20 w-20 shrink-0 cursor-pointer items-center justify-center overflow-hidden rounded-xl border-2 border-dashed border-line bg-cream transition hover:border-brand"
      >
        {value ? (
          <img src={value} alt="logo preview" className="h-full w-full object-contain" />
        ) : (
          <span className="text-center text-[10px] text-muted leading-tight px-1">Click to upload</span>
        )}
      </div>

      <div className="flex-1 text-sm text-muted">
        <button type="button" onClick={pick} className="font-semibold text-brand hover:underline">
          Choose image
        </button>
        <span className="ml-1">— PNG, JPG, SVG, WebP</span>
        {value && (
          <button
            type="button"
            onClick={() => onChange("")}
            className="ml-3 text-danger hover:underline text-xs"
          >
            Remove
          </button>
        )}
        <p className="mt-1 text-[11px]">Stored as base64 — no external hosting needed.</p>
      </div>

      <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleFile} />
    </div>
  );
}

function SocialLinksEditor({ value, onChange }) {
  const [openPicker, setOpenPicker] = useState(null); // idx of link whose picker is open
  let links = [];
  try { links = JSON.parse(value || "[]"); } catch { links = []; }

  function update(idx, field, val) {
    const next = links.map((l, i) => i === idx ? { ...l, [field]: val } : l);
    onChange(JSON.stringify(next));
  }

  function add() {
    onChange(JSON.stringify([...links, { iconKey: "", variant: "black-on-white", url: "", label: "" }]));
  }

  function remove(idx) {
    onChange(JSON.stringify(links.filter((_, i) => i !== idx)));
    if (openPicker === idx) setOpenPicker(null);
  }

  function selectIcon(idx, iconKey, variant) {
    const next = links.map((l, i) => i === idx ? { ...l, iconKey, variant } : l);
    onChange(JSON.stringify(next));
    setOpenPicker(null);
  }

  return (
    <div className="space-y-3">
      {links.map((link, idx) => (
        <div key={idx} className="rounded-xl border border-line bg-cream p-3 space-y-2">
          <div className="flex items-center gap-3">
            {/* Icon preview / picker toggle */}
            <button
              type="button"
              onClick={() => setOpenPicker(openPicker === idx ? null : idx)}
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border-2 border-dashed border-line bg-white hover:border-brand transition overflow-hidden"
              title="Pick icon"
            >
              {link.iconKey
                ? <SocialIconSvg iconKey={link.iconKey} variant={link.variant} size={20} />
                : <span className="text-[9px] text-muted text-center leading-tight">pick icon</span>}
            </button>

            {/* Label */}
            <input
              value={link.label || ""}
              onChange={(e) => update(idx, "label", e.target.value)}
              placeholder="Label (e.g. Facebook)"
              className="w-28 shrink-0 rounded-lg border border-line bg-white px-2 py-1.5 text-xs"
            />

            {/* URL */}
            <input
              value={link.url || ""}
              onChange={(e) => update(idx, "url", e.target.value)}
              placeholder="https://..."
              className="flex-1 rounded-lg border border-line bg-white px-2 py-1.5 text-xs"
            />

            <button type="button" onClick={() => remove(idx)} className="shrink-0 text-danger hover:text-red-700 text-lg leading-none">×</button>
          </div>

          {/* Icon picker panel */}
          {openPicker === idx && (
            <div className="rounded-xl border border-line bg-white p-3">
              <p className="mb-2 text-[10px] font-bold uppercase tracking-wider text-muted">Select Icon — Black on White / White on Black</p>
              <div className="flex flex-wrap gap-2">
                {SOCIAL_ICON_DEFS.map((def) => (
                  <div key={def.key} className="flex flex-col items-center gap-1">
                    {/* Black on white */}
                    <button
                      type="button"
                      onClick={() => selectIcon(idx, def.key, "black-on-white")}
                      className={`rounded-lg border-2 p-1 transition ${link.iconKey === def.key && link.variant === "black-on-white" ? "border-brand" : "border-line hover:border-gray-400"}`}
                      title={`${def.label} — black`}
                    >
                      <SocialIconSvg iconKey={def.key} variant="black-on-white" size={22} />
                    </button>
                    {/* White on black */}
                    <button
                      type="button"
                      onClick={() => selectIcon(idx, def.key, "white-on-black")}
                      className={`rounded-lg border-2 p-1 transition ${link.iconKey === def.key && link.variant === "white-on-black" ? "border-brand" : "border-line hover:border-gray-400"}`}
                      title={`${def.label} — white`}
                    >
                      <SocialIconSvg iconKey={def.key} variant="white-on-black" size={22} />
                    </button>
                    <span className="text-[8px] text-muted">{def.label}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      ))}
      <button
        type="button"
        onClick={add}
        className="flex items-center gap-2 rounded-full border border-dashed border-brand px-4 py-2 text-xs font-bold text-brand hover:bg-orange-50 transition"
      >
        + Add Link
      </button>
    </div>
  );
}

// Form-based editor for all GLOBAL content (site name, logo, contact, social, nav, footer).
export default function SiteSettings() {
  const [items, setItems] = useState([]);
  const [values, setValues] = useState({});
  const [saved, setSaved] = useState(false);
  const [saveError, setSaveError] = useState("");
  const [loading, setLoading] = useState(true);

  // SEO general fields (stored separately in SeoSettings model)
  const [seo, setSeo] = useState(null);
  const [seoForm, setSeoForm] = useState({});
  const [seoSaved, setSeoSaved] = useState(false);
  const seoMerged = { ...seo, ...seoForm };

  useEffect(() => {
    api.get("/content", { params: { page: "global" } }).then(({ data }) => {
      setItems(data.items.sort((a, b) => (a.group || "").localeCompare(b.group || "")));
      const v = {};
      data.items.forEach((i) => (v[i.key] = i.value));
      setValues(v);
      setLoading(false);
    });
    api.get("/seo/admin").then(({ data }) => setSeo(data)).catch(() => {});
  }, []);

  async function save() {
    setSaveError("");
    try {
      const updates = items.map((i) => ({ key: i.key, value: values[i.key] ?? "" }));
      await api.post("/content/bulk", { updates });
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (err) {
      setSaveError(err?.response?.data?.message || err?.message || "Save failed");
    }
  }

  async function saveSeo() {
    await api.put("/seo", seoForm);
    setSeo((p) => ({ ...p, ...seoForm }));
    setSeoForm({});
    setSeoSaved(true);
    setTimeout(() => setSeoSaved(false), 2000);
  }

  if (loading) return <p className="text-muted">Loading...</p>;

  // group items
  const groups = {};
  items.forEach((i) => { (groups[i.group || "Other"] ??= []).push(i); });

  return (
    <div className="max-w-3xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-ink">Site Settings</h1>
          <p className="mt-1 text-sm text-muted">Edit site name, logo, contact info, nav & footer — applies everywhere instantly.</p>
        </div>
        <button onClick={save} className="rounded-full bg-brand px-6 py-2 text-sm font-bold text-white hover:bg-brand-hover">
          {saved ? "✓ Saved" : "Save Changes"}
        </button>
      </div>
      {saveError && (
        <div className="mt-3 flex items-center justify-between rounded-xl bg-red-50 border border-red-200 px-4 py-3 text-sm font-semibold text-red-700">
          <span>❌ {saveError}</span>
          <button onClick={() => setSaveError("")} className="ml-4 text-red-400 hover:text-red-600">✕</button>
        </div>
      )}

      {/* SEO General */}
      {seo && (
        <section className="mt-6 rounded-xl border border-line bg-white p-5">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-xs font-bold uppercase tracking-wider text-brand">SEO</h2>
            <button onClick={saveSeo} className="rounded-full bg-brand px-4 py-1.5 text-xs font-bold text-white hover:bg-brand-hover">
              {seoSaved ? "✓ Saved" : "Save SEO"}
            </button>
          </div>
          <div className="space-y-3">
            <div>
              <label className="mb-1 block text-xs font-semibold text-muted">Site Title <span className="text-[10px] font-normal">(max 60 chars — shown in Google results)</span></label>
              <input value={seoMerged.siteTitle || ""} onChange={(e) => setSeoForm((p) => ({ ...p, siteTitle: e.target.value }))} maxLength={60} className="w-full rounded-lg border border-line px-3 py-2 text-sm" />
            </div>
            <div>
              <label className="mb-1 block text-xs font-semibold text-muted">Meta Description <span className="text-[10px] font-normal">(max 155 chars — shown under title in Google)</span></label>
              <textarea rows={2} value={seoMerged.siteDescription || ""} onChange={(e) => setSeoForm((p) => ({ ...p, siteDescription: e.target.value }))} maxLength={155} className="w-full resize-none rounded-lg border border-line px-3 py-2 text-sm" />
            </div>
            <div>
              <label className="mb-1 block text-xs font-semibold text-muted">Keywords <span className="text-[10px] font-normal">(comma separated)</span></label>
              <input value={seoMerged.siteKeywords || ""} onChange={(e) => setSeoForm((p) => ({ ...p, siteKeywords: e.target.value }))} className="w-full rounded-lg border border-line px-3 py-2 text-sm" />
            </div>
            <div>
              <label className="mb-1 block text-xs font-semibold text-muted">OG Image URL <span className="text-[10px] font-normal">(shown when shared on Facebook, WhatsApp)</span></label>
              <input value={seoMerged.ogImage || ""} onChange={(e) => setSeoForm((p) => ({ ...p, ogImage: e.target.value }))} placeholder="https://..." className="w-full rounded-lg border border-line px-3 py-2 text-sm" />
            </div>
            <div>
              <label className="mb-1 block text-xs font-semibold text-muted">Canonical Base URL <span className="text-[10px] font-normal">(your live domain)</span></label>
              <input value={seoMerged.canonicalUrl || ""} onChange={(e) => setSeoForm((p) => ({ ...p, canonicalUrl: e.target.value }))} placeholder="https://yourdomain.com" className="w-full rounded-lg border border-line px-3 py-2 text-sm" />
            </div>
          </div>
        </section>
      )}

      {Object.entries(groups).map(([group, gItems]) => (
        <section key={group} className="mt-6 rounded-xl border border-line bg-white p-5">
          <h2 className="mb-4 text-xs font-bold uppercase tracking-wider text-brand">{group}</h2>
          <div className="space-y-3">
            {gItems.map((i) => (
              <div key={i.key}>
                <label className="mb-1 block text-xs font-semibold text-muted">{i.label || i.key}</label>
                {i.type === "sociallinks" ? (
                  <SocialLinksEditor value={values[i.key] || "[]"} onChange={(v) => setValues((prev) => ({ ...prev, [i.key]: v }))} />
                ) : i.type === "image" ? (
                  <ImageUploadField value={values[i.key] || ""} onChange={(v) => setValues((prev) => ({ ...prev, [i.key]: v }))} />
                ) : i.type === "color" ? (
                  <input type="color" value={values[i.key] || "#000000"} onChange={(e) => setValues((v) => ({ ...v, [i.key]: e.target.value }))} className="h-9 w-20 rounded border border-line" />
                ) : i.type === "richtext" ? (
                  <textarea rows="2" value={values[i.key] || ""} onChange={(e) => setValues((v) => ({ ...v, [i.key]: e.target.value }))} className="w-full rounded-lg border border-line px-3 py-2 text-sm" />
                ) : (
                  <input value={values[i.key] || ""} onChange={(e) => setValues((v) => ({ ...v, [i.key]: e.target.value }))} className="w-full rounded-lg border border-line px-3 py-2 text-sm" />
                )}
              </div>
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}
