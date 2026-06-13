import { useState, useEffect, useRef } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import api from "../../lib/api.js";

// ── helpers ──────────────────────────────────────────────────────────────────

function Section({ num, title, children }) {
  return (
    <div className="rounded-2xl border border-gray-200 bg-white">
      <div className="border-b border-gray-100 px-6 py-4">
        <span className="mr-3 text-xs font-black tracking-widest text-gray-300">{String(num).padStart(2, "0")}</span>
        <span className="text-xs font-black uppercase tracking-widest text-gray-600">{title}</span>
      </div>
      <div className="p-6">{children}</div>
    </div>
  );
}

function Field({ label, hint, children }) {
  return (
    <div>
      <label className="mb-1.5 flex items-center justify-between text-[10px] font-black uppercase tracking-widest text-gray-400">
        <span>{label}</span>
        {hint && <span className="normal-case tracking-normal font-normal text-gray-400">{hint}</span>}
      </label>
      {children}
    </div>
  );
}

const INPUT = "w-full rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm text-gray-900 outline-none focus:border-brand transition";

const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp"];
const MAX_BYTES = 200 * 1024; // 200 KB

function ImagePicker({ value, onChange, label }) {
  const ref = useRef();
  const [err, setErr] = useState("");

  function pick(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!ALLOWED_TYPES.includes(file.type)) { setErr("JPG, PNG or WebP only"); return; }
    if (file.size > MAX_BYTES) { setErr(`Max 200 KB (this file is ${Math.round(file.size / 1024)} KB)`); return; }
    setErr("");
    const reader = new FileReader();
    reader.onload = () => onChange(reader.result);
    reader.readAsDataURL(file);
  }

  return (
    <div>
      <p className="mb-2 text-[10px] font-black uppercase tracking-widest text-gray-400">{label}</p>
      <div
        onClick={() => ref.current.click()}
        className="group relative cursor-pointer overflow-hidden rounded-xl border-2 border-dashed border-gray-200 bg-gray-50 hover:border-brand transition"
        style={{ aspectRatio: "1 / 1", maxWidth: 200 }}
      >
        {value ? (
          <>
            <img src={value} alt="" className="h-full w-full object-cover" />
            <div className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 group-hover:opacity-100 transition">
              <span className="text-xs font-bold text-white">Change</span>
            </div>
          </>
        ) : (
          <div className="flex h-full flex-col items-center justify-center gap-2 p-4">
            <span className="text-2xl text-gray-300">📷</span>
            <span className="text-center text-xs text-gray-400">Click to upload<br />JPG, PNG or WebP · max 200 KB</span>
          </div>
        )}
      </div>
      {value && <p className="mt-1 max-w-[200px] truncate text-[10px] text-gray-400">{value.slice(0, 60)}...</p>}
      {err && <p className="mt-1 text-xs text-red-500">{err}</p>}
      <input ref={ref} type="file" accept=".jpg,.jpeg,.png,.webp" className="hidden" onChange={pick} />
    </div>
  );
}

// ── Toggle ────────────────────────────────────────────────────────────────────
function Toggle({ checked, onChange }) {
  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      className={`relative inline-flex h-6 w-11 shrink-0 rounded-full transition ${checked ? "bg-brand" : "bg-gray-200"}`}
    >
      <span className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform ${checked ? "translate-x-5" : "translate-x-0.5"}`} />
    </button>
  );
}

// ── defaults ──────────────────────────────────────────────────────────────────
const defaultEnd = () => new Date(Date.now() + 24 * 3.6e6).toISOString().slice(0, 16);

const EMPTY = {
  title: "", sku: "", description: "", shortDescription: "", fullDescription: "",
  image: "", gallery: [],
  originalPrice: "", blocPrice: "",
  priceTiers: [
    { min: 1, max: 29, price: "" },
    { min: 30, max: 49, price: "" },
    { min: 50, max: null, price: "" },
  ],
  category: "", tags: [], relatedProducts: [],
  maxSpots: 100, goal: 50, filledSpots: 0,
  hidden: false, featured: false, shippingException: false,
  endTime: defaultEnd(), countdownEnabled: true,
  variants: [],
  reviews: [],
};

// ── main component ────────────────────────────────────────────────────────────
export default function ProductEditor() {
  const { id } = useParams();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const isNew = !id || id === "new";

  const { data: existing, isLoading } = useQuery({
    queryKey: ["bloc", id],
    queryFn: () => api.get(`/blocs/${id}`).then((r) => r.data),
    enabled: !isNew,
  });

  const { data: categories = [] } = useQuery({
    queryKey: ["categories"],
    queryFn: () => api.get("/categories").then((r) => r.data),
  });

  const { data: allProducts = [] } = useQuery({
    queryKey: ["admin-products"],
    queryFn: () => api.get("/blocs").then((r) => r.data),
  });

  const [form, setForm] = useState(EMPTY);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [tagInput, setTagInput] = useState("");
  const [relSearch, setRelSearch] = useState("");
  const [galleryUrl, setGalleryUrl] = useState("");

  useEffect(() => {
    if (existing) {
      setForm({
        ...EMPTY,
        ...existing,
        category: existing.category?._id || existing.category || "",
        endTime: new Date(existing.endTime).toISOString().slice(0, 16),
        priceTiers: existing.priceTiers?.length ? existing.priceTiers : EMPTY.priceTiers,
        gallery: existing.gallery || [],
        tags: existing.tags || [],
        variants: existing.variants || [],
        reviews: existing.reviews || [],
      });
    }
  }, [existing]);

  const set = (k) => (v) => setForm((s) => ({ ...s, [k]: v }));
  const setE = (k) => (e) => set(k)(e.target.type === "checkbox" ? e.target.checked : e.target.value);

  // Tags
  function addTag(e) {
    if ((e.key === "Enter" || e.key === ",") && tagInput.trim()) {
      e.preventDefault();
      const tag = tagInput.trim().toUpperCase().replace(/,/g, "");
      if (!form.tags.includes(tag)) set("tags")([...form.tags, tag]);
      setTagInput("");
    }
  }
  function removeTag(t) { set("tags")(form.tags.filter((x) => x !== t)); }

  // Gallery
  const galleryRef = useRef();
  function pickGallery(e) {
    const files = [...(e.target.files || [])];
    const remaining = 5 - form.gallery.length;
    files.slice(0, remaining).forEach((file) => {
      if (!ALLOWED_TYPES.includes(file.type) || file.size > MAX_BYTES) return;
      const reader = new FileReader();
      reader.onload = () => set("gallery")([...form.gallery, reader.result]);
      reader.readAsDataURL(file);
    });
  }
  function attachGalleryUrl() {
    if (!galleryUrl.trim() || form.gallery.length >= 5) return;
    set("gallery")([...form.gallery, galleryUrl.trim()]);
    setGalleryUrl("");
  }

  // Price tiers
  function setTier(i, k, v) {
    const tiers = form.priceTiers.map((t, idx) => idx === i ? { ...t, [k]: v } : t);
    set("priceTiers")(tiers);
  }
  function addTier() {
    set("priceTiers")([...form.priceTiers, { min: "", max: null, price: "" }]);
  }
  function removeTier(i) {
    set("priceTiers")(form.priceTiers.filter((_, idx) => idx !== i));
  }

  // Variants
  function addVariantGroup() {
    set("variants")([...form.variants, { group: "Color", options: [] }]);
  }
  function setVariantGroup(i, k, v) {
    set("variants")(form.variants.map((vg, idx) => idx === i ? { ...vg, [k]: v } : vg));
  }
  function addOption(vi) {
    set("variants")(form.variants.map((vg, idx) =>
      idx === vi ? { ...vg, options: [...vg.options, { name: "", image: "", price: "" }] } : vg
    ));
  }
  function setOption(vi, oi, k, v) {
    set("variants")(form.variants.map((vg, idx) =>
      idx !== vi ? vg : {
        ...vg,
        options: vg.options.map((o, oidx) => oidx === oi ? { ...o, [k]: v } : o),
      }
    ));
  }
  function removeVariantGroup(i) { set("variants")(form.variants.filter((_, idx) => idx !== i)); }
  function removeOption(vi, oi) {
    set("variants")(form.variants.map((vg, idx) =>
      idx !== vi ? vg : { ...vg, options: vg.options.filter((_, oidx) => oidx !== oi) }
    ));
  }

  // Reviews
  function addReview() {
    set("reviews")([...form.reviews, { author: "", rating: 5, text: "", verified: false }]);
  }
  function setReview(i, k, v) {
    set("reviews")(form.reviews.map((r, idx) => idx === i ? { ...r, [k]: v } : r));
  }
  function removeReview(i) { set("reviews")(form.reviews.filter((_, idx) => idx !== i)); }

  // Related
  function toggleRelated(bid) {
    const rel = form.relatedProducts || [];
    if (rel.includes(bid)) set("relatedProducts")(rel.filter((x) => x !== bid));
    else set("relatedProducts")([...rel, bid]);
  }

  async function handleSave(e) {
    e?.preventDefault();
    setSaving(true);
    const { filledSpots: _ignored, ...rest } = form; // never overwrite join count from editor
    const payload = {
      ...rest,
      originalPrice: Number(form.originalPrice),
      blocPrice: Number(form.blocPrice),
      maxSpots: Number(form.maxSpots),
      goal: Number(form.goal) || Math.round(Number(form.maxSpots) * 0.5),
      ...(isNew ? { filledSpots: 0 } : {}), // new products always start at 0
      priceTiers: form.priceTiers.map((t) => ({ ...t, price: Number(t.price), min: Number(t.min) })),
    };
    if (!payload.endTime) payload.endTime = new Date(Date.now() + 24 * 3.6e6).toISOString();
    try {
      if (isNew) await api.post("/blocs", payload);
      else await api.put(`/blocs/${id}`, payload);
      qc.invalidateQueries({ queryKey: ["admin-products"] });
      qc.invalidateQueries({ queryKey: ["admin-blocs"] });
      qc.invalidateQueries({ queryKey: ["blocs"] });
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
      if (isNew) navigate("/admin/products");
    } finally {
      setSaving(false);
    }
  }

  if (!isNew && isLoading) return <p className="p-10 text-center text-sm text-gray-400">Loading...</p>;

  const relFiltered = allProducts.filter(
    (p) => p._id !== id && (!relSearch || p.title.toLowerCase().includes(relSearch.toLowerCase()))
  );

  return (
    <div className="space-y-0">
      {/* ── Top bar ── */}
      <div className="sticky top-0 z-20 mb-5 flex items-center gap-4 rounded-2xl border border-gray-200 bg-white px-5 py-3 shadow-sm">
        <button type="button" onClick={() => navigate("/admin/products")}
          className="grid h-9 w-9 place-items-center rounded-xl border border-gray-200 text-sm text-gray-500 hover:bg-gray-50">
          ←
        </button>
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <h1 className="text-base font-extrabold uppercase tracking-wider text-gray-900">
              {isNew ? "New Product" : "Edit Product"}
            </h1>
            {!isNew && <span className="rounded-md bg-gray-100 px-2 py-0.5 text-[10px] font-bold text-gray-400 font-mono">ID: {id.slice(-6).toUpperCase()}</span>}
          </div>
          <p className="text-[9px] font-bold uppercase tracking-widest text-gray-400">Enterprise Content Management Suite</p>
        </div>
        <button type="button" onClick={() => navigate("/admin/products")}
          className="rounded-xl border border-gray-200 px-4 py-2 text-xs font-bold text-gray-500 hover:bg-gray-50">
          CANCEL
        </button>
        <button type="button" onClick={handleSave} disabled={saving}
          className="flex items-center gap-2 rounded-xl bg-gray-900 px-5 py-2 text-xs font-bold text-white hover:bg-black disabled:opacity-60">
          <span>💾</span>
          {saving ? "SAVING..." : saved ? "✓ SAVED" : "SAVE CHANGES"}
        </button>
      </div>

      <div className="grid grid-cols-[1fr_280px] items-start gap-5">
        {/* ── Left column ── */}
        <div className="space-y-5">

          {/* 01 Basic Info */}
          <Section num={1} title="Basic Information">
            <div className="space-y-4">
              <Field label="Product Title *">
                <input value={form.title} onChange={setE("title")} placeholder="e.g. Pro Wireless Soundbar" className={INPUT} required />
              </Field>
              <div className="grid grid-cols-2 gap-4">
                <Field label="SKU Identifier">
                  <input value={form.sku} onChange={setE("sku")} placeholder="e.g. DB-SB-001" className={INPUT} />
                </Field>
                <Field label="Short Description">
                  <input value={form.description} onChange={setE("description")} placeholder="One-line tagline" className={INPUT} />
                </Field>
              </div>
              <Field label="Full Description" hint="Supports rich logic">
                <textarea
                  value={form.fullDescription} onChange={setE("fullDescription")}
                  rows={5} placeholder="Detailed product description..."
                  className={INPUT + " resize-none"}
                />
              </Field>
            </div>
          </Section>

          {/* 02 Related Products */}
          <Section num={2} title="Related Products">
            <div className="relative mb-3">
              <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-sm text-gray-400">⌕</span>
              <input
                value={relSearch}
                onChange={(e) => setRelSearch(e.target.value)}
                placeholder="Search products to link..."
                className={INPUT + " pl-10"}
              />
            </div>
            {(form.relatedProducts?.length > 0) && (
              <div className="mb-3 flex flex-wrap gap-2">
                {form.relatedProducts.map((rid) => {
                  const p = allProducts.find((x) => x._id === rid);
                  return p ? (
                    <div key={rid} className="flex items-center gap-2 rounded-full border border-gray-200 bg-gray-50 px-3 py-1 text-xs font-semibold">
                      {p.title}
                      <button onClick={() => toggleRelated(rid)} className="text-gray-400 hover:text-red-500">×</button>
                    </div>
                  ) : null;
                })}
              </div>
            )}
            {relSearch && (
              <div className="max-h-40 space-y-1 overflow-y-auto rounded-xl border border-gray-100">
                {relFiltered.slice(0, 8).map((p) => (
                  <button key={p._id} type="button" onClick={() => { toggleRelated(p._id); setRelSearch(""); }}
                    className="flex w-full items-center gap-3 px-4 py-2 text-left text-sm hover:bg-gray-50">
                    <img src={p.image} alt="" className="h-7 w-7 rounded-lg object-cover" />
                    <span className="flex-1 font-medium">{p.title}</span>
                    {form.relatedProducts?.includes(p._id) && <span className="text-brand">✓</span>}
                  </button>
                ))}
                {relFiltered.length === 0 && <p className="px-4 py-3 text-xs text-gray-400">No products found</p>}
              </div>
            )}
            {!relSearch && form.relatedProducts?.length === 0 && (
              <p className="py-4 text-center text-xs text-gray-400">No operational links defined</p>
            )}
          </Section>

          {/* 03 Product Media */}
          <Section num={3} title="Product Media">
            <div className="grid grid-cols-2 gap-6">
              <ImagePicker label="Main Hero Visual" value={form.image} onChange={set("image")} />
              <div>
                <p className="mb-2 text-[10px] font-black uppercase tracking-widest text-gray-400">
                  Resource Gallery <span className="text-gray-300">({form.gallery.length} Assets)</span>
                </p>
                <div className="flex flex-wrap gap-2">
                  {form.gallery.map((src, i) => (
                    <div key={i} className="group relative h-16 w-16 overflow-hidden rounded-xl border border-gray-200">
                      <img src={src} alt="" className="h-full w-full object-cover" />
                      <button
                        type="button"
                        onClick={() => set("gallery")(form.gallery.filter((_, idx) => idx !== i))}
                        className="absolute inset-0 flex items-center justify-center bg-black/50 opacity-0 group-hover:opacity-100 text-white text-xs font-bold transition"
                      >×</button>
                    </div>
                  ))}
                  {form.gallery.length < 5 && (
                    <button type="button" onClick={() => galleryRef.current.click()}
                      className="flex h-16 w-16 flex-col items-center justify-center rounded-xl border-2 border-dashed border-gray-200 text-gray-400 hover:border-brand hover:text-brand transition">
                      <span className="text-lg">+</span>
                      <span className="text-[9px] font-bold">ADD</span>
                    </button>
                  )}
                </div>
                <input ref={galleryRef} type="file" multiple accept=".jpg,.jpeg,.png,.webp" className="hidden" onChange={pickGallery} />
                <div className="mt-3 flex gap-2">
                  <input
                    value={galleryUrl}
                    onChange={(e) => setGalleryUrl(e.target.value)}
                    placeholder="URL for gallery..."
                    className="flex-1 rounded-xl border border-gray-200 px-3 py-2 text-xs outline-none focus:border-brand"
                  />
                  <button type="button" onClick={attachGalleryUrl}
                    className="rounded-xl bg-gray-900 px-4 py-2 text-xs font-bold text-white hover:bg-black">
                    ATTACH URL
                  </button>
                </div>
              </div>
            </div>
          </Section>

          {/* 04 Pricing Economics */}
          <Section num={4} title="Pricing Economics">
            <div className="grid grid-cols-2 gap-4">
              <div className="rounded-xl border border-gray-200 p-4">
                <p className="mb-2 text-[10px] font-black uppercase tracking-widest text-gray-400">Market Regular Price</p>
                <div className="flex items-center gap-1">
                  <span className="text-gray-400 text-sm">৳</span>
                  <input type="number" value={form.originalPrice} onChange={setE("originalPrice")} placeholder="0"
                    className="flex-1 border-0 bg-transparent text-2xl font-extrabold text-gray-400 outline-none line-through" />
                </div>
              </div>
              <div className="rounded-xl border-2 border-brand/30 bg-brand/[0.03] p-4">
                <p className="mb-2 text-[10px] font-black uppercase tracking-widest text-brand">D-Bloc Special Price</p>
                <div className="flex items-center gap-1">
                  <span className="text-brand text-sm">৳</span>
                  <input type="number" value={form.blocPrice} onChange={setE("blocPrice")} placeholder="0"
                    className="flex-1 border-0 bg-transparent text-2xl font-extrabold text-gray-900 outline-none" />
                </div>
              </div>
            </div>

            {/* Price tiers */}
            <div className="mt-5">
              <div className="mb-3 flex items-center justify-between">
                <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">Volume Tiers</p>
                <button type="button" onClick={addTier} className="text-[10px] font-bold text-brand hover:underline">+ Add Tier</button>
              </div>
              <div className="grid gap-3 sm:grid-cols-3">
                {form.priceTiers.map((tier, i) => (
                  <div key={i} className="relative rounded-xl border border-gray-200 p-3">
                    <button type="button" onClick={() => removeTier(i)}
                      className="absolute right-2 top-2 text-xs text-gray-300 hover:text-red-400">×</button>
                    <div className="mb-2 flex gap-1 text-[10px]">
                      <input type="number" value={tier.min} onChange={(e) => setTier(i, "min", e.target.value)}
                        className="w-12 rounded-lg border border-gray-200 px-2 py-1 text-center text-xs outline-none focus:border-brand" placeholder="min" />
                      <span className="text-gray-400 self-center">–</span>
                      <input type="number" value={tier.max ?? ""} onChange={(e) => setTier(i, "max", e.target.value || null)}
                        placeholder="∞" className="w-12 rounded-lg border border-gray-200 px-2 py-1 text-center text-xs outline-none focus:border-brand" />
                      <span className="text-gray-400 self-center text-[9px]">UNITS</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <span className="text-[10px] text-gray-400">৳</span>
                      <input type="number" value={tier.price} onChange={(e) => setTier(i, "price", e.target.value)}
                        placeholder="0" className="flex-1 text-lg font-extrabold text-gray-700 border-0 bg-transparent outline-none" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </Section>

          {/* 05 Variants */}
          <Section num={5} title="Variants">
            <div className="mb-4 flex justify-end">
              <button type="button" onClick={addVariantGroup}
                className="rounded-xl border border-gray-200 px-4 py-2 text-xs font-bold text-gray-600 hover:bg-gray-50">
                + Add Variant Group
              </button>
            </div>
            {form.variants.length === 0 && (
              <p className="py-4 text-center text-xs text-gray-400">No variants. Add a color, size or style group.</p>
            )}
            {form.variants.map((vg, vi) => (
              <div key={vi} className="mb-4 rounded-xl border border-gray-200 p-4">
                <div className="mb-3 flex items-center justify-between">
                  <input
                    value={vg.group}
                    onChange={(e) => setVariantGroup(vi, "group", e.target.value)}
                    className="border-0 bg-transparent text-sm font-bold uppercase text-gray-700 outline-none"
                    placeholder="Group name (e.g. Color)"
                  />
                  <div className="flex gap-2">
                    <button type="button" onClick={() => addOption(vi)}
                      className="rounded-xl bg-gray-900 px-3 py-1.5 text-[10px] font-bold text-white hover:bg-black">
                      + Add Option
                    </button>
                    <button type="button" onClick={() => removeVariantGroup(vi)}
                      className="grid h-7 w-7 place-items-center rounded-lg border border-red-100 text-red-400 hover:bg-red-50">🗑</button>
                  </div>
                </div>
                <div className="space-y-2">
                  {vg.options.map((opt, oi) => (
                    <div key={oi} className="flex items-center gap-3 rounded-lg border border-gray-100 bg-gray-50 px-3 py-2">
                      <div className="h-8 w-8 shrink-0 overflow-hidden rounded-lg border border-gray-200 bg-white">
                        {opt.image ? <img src={opt.image} alt="" className="h-full w-full object-cover" /> : <span className="flex h-full items-center justify-center text-gray-300 text-xs">+</span>}
                      </div>
                      <input
                        value={opt.name}
                        onChange={(e) => setOption(vi, oi, "name", e.target.value)}
                        placeholder="Option name"
                        className="flex-1 bg-transparent text-sm font-semibold text-gray-700 outline-none placeholder-gray-400"
                      />
                      <div className="flex items-center gap-1">
                        <span className="text-xs text-gray-400">৳</span>
                        <input
                          type="number"
                          value={opt.price}
                          onChange={(e) => setOption(vi, oi, "price", e.target.value)}
                          placeholder="0"
                          className="w-20 bg-transparent text-sm font-bold text-gray-700 outline-none"
                        />
                      </div>
                      <button type="button" onClick={() => removeOption(vi, oi)}
                        className="grid h-7 w-7 place-items-center rounded-lg text-gray-300 hover:text-red-400">🗑</button>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </Section>

          {/* 06 Customer Reviews */}
          <Section num={6} title="Customer Reviews">
            <div className="mb-4 flex justify-end">
              <button type="button" onClick={addReview}
                className="flex items-center gap-2 rounded-xl bg-gray-900 px-4 py-2.5 text-xs font-bold text-white hover:bg-black">
                💬 Add New Review
              </button>
            </div>
            {form.reviews.length === 0 && (
              <p className="py-4 text-center text-xs text-gray-400">No reviews yet.</p>
            )}
            <div className="space-y-3">
              {form.reviews.map((r, i) => (
                <div key={i} className="rounded-xl border border-gray-200 p-4">
                  <div className="mb-3 grid grid-cols-3 gap-3">
                    <input value={r.author} onChange={(e) => setReview(i, "author", e.target.value)}
                      placeholder="Reviewer name" className={INPUT} />
                    <select value={r.rating} onChange={(e) => setReview(i, "rating", Number(e.target.value))} className={INPUT}>
                      {[5,4,3,2,1].map((n) => <option key={n} value={n}>{"★".repeat(n)} {n}/5</option>)}
                    </select>
                    <label className="flex items-center gap-2 text-sm text-gray-600">
                      <input type="checkbox" checked={r.verified} onChange={(e) => setReview(i, "verified", e.target.checked)} className="accent-brand" />
                      Verified
                    </label>
                  </div>
                  <div className="flex gap-3">
                    <textarea value={r.text} onChange={(e) => setReview(i, "text", e.target.value)}
                      rows={2} placeholder="Review text..." className={INPUT + " flex-1 resize-none"} />
                    <button type="button" onClick={() => removeReview(i)}
                      className="self-start rounded-lg border border-red-100 px-3 py-2 text-xs text-red-400 hover:bg-red-50">Remove</button>
                  </div>
                </div>
              ))}
            </div>
          </Section>
        </div>

        {/* ── Right sidebar ── */}
        <div className="space-y-4">
          {/* Product Status */}
          <div className="rounded-2xl border border-gray-200 bg-white p-5">
            <p className="mb-3 text-[10px] font-black uppercase tracking-widest text-gray-500">Product Status</p>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => set("hidden")(false)}
                className={`rounded-xl py-2.5 text-xs font-bold transition ${!form.hidden ? "bg-brand text-white shadow-sm" : "border border-gray-200 text-gray-500 hover:bg-gray-50"}`}
              >
                ACTIVE
              </button>
              <button
                type="button"
                onClick={() => set("hidden")(true)}
                className={`rounded-xl py-2.5 text-xs font-bold transition ${form.hidden ? "bg-gray-800 text-white" : "border border-gray-200 text-gray-500 hover:bg-gray-50"}`}
              >
                HIDDEN
              </button>
            </div>
          </div>

          {/* Stock & Goal */}
          <div className="rounded-2xl border border-gray-200 bg-white p-5">
            <p className="mb-3 text-[10px] font-black uppercase tracking-widest text-gray-500">Stock & Goal</p>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <p className="mb-1 text-[9px] font-bold uppercase tracking-wider text-gray-400">Stock (Capacity)</p>
                <div className="flex items-center gap-1 rounded-xl border border-gray-200 px-3 py-2">
                  <span className="text-xs text-gray-400">📦</span>
                  <input type="number" min="1" value={form.maxSpots} onChange={setE("maxSpots")}
                    className="w-full bg-transparent text-sm font-bold text-gray-700 outline-none" />
                </div>
              </div>
              <div>
                <p className="mb-1 text-[9px] font-bold uppercase tracking-wider text-gray-400">Goal (Unlock)</p>
                <div className="flex items-center gap-1 rounded-xl border border-gray-200 px-3 py-2">
                  <span className="text-xs text-brand">🎯</span>
                  <input type="number" min="1" value={form.goal} onChange={setE("goal")}
                    className="w-full bg-transparent text-sm font-bold text-gray-700 outline-none" />
                </div>
              </div>
            </div>
            <p className="mt-2 text-[10px] leading-relaxed text-gray-400">
              <strong className="text-gray-500">Stock</strong> = total capacity (Capacity Status bar).
              <strong className="text-gray-500"> Goal</strong> = orders needed to unlock the D-Bloc special price.
            </p>
          </div>

          {/* Shipping Exception */}
          <div className="rounded-2xl border border-gray-200 bg-white p-5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-base">🚚</span>
                <p className="text-[10px] font-black uppercase tracking-widest text-gray-600">Shipping Exception</p>
              </div>
              <Toggle checked={form.shippingException} onChange={set("shippingException")} />
            </div>
            {form.shippingException && (
              <p className="mt-2 text-[10px] leading-relaxed text-emerald-600">
                Enable this to provide <strong>FREE DELIVERY</strong> for this specific product, overriding all other logistics rules.
              </p>
            )}
          </div>

          {/* Launch Countdown */}
          <div className="rounded-2xl border border-gray-200 bg-white p-5">
            <div className="mb-3 flex items-center justify-between">
              <p className="text-[10px] font-black uppercase tracking-widest text-gray-600">Launch Countdown</p>
              <Toggle checked={form.countdownEnabled !== false} onChange={set("countdownEnabled")} />
            </div>
            {form.countdownEnabled !== false && (
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <p className="mb-1 text-[9px] font-bold uppercase tracking-wider text-gray-400">End Date</p>
                  <input
                    type="date"
                    value={form.endTime?.slice(0, 10)}
                    onChange={(e) => set("endTime")(e.target.value + "T" + (form.endTime?.slice(11, 16) || "00:00"))}
                    className="w-full rounded-xl border border-gray-200 px-3 py-2 text-xs outline-none focus:border-brand"
                  />
                </div>
                <div>
                  <p className="mb-1 text-[9px] font-bold uppercase tracking-wider text-gray-400">End Time</p>
                  <input
                    type="time"
                    value={form.endTime?.slice(11, 16)}
                    onChange={(e) => set("endTime")((form.endTime?.slice(0, 10) || new Date().toISOString().slice(0, 10)) + "T" + e.target.value)}
                    className="w-full rounded-xl border border-gray-200 px-3 py-2 text-xs outline-none focus:border-brand"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Category & Keywords */}
          <div className="rounded-2xl border border-gray-200 bg-white p-5">
            <p className="mb-3 text-[10px] font-black uppercase tracking-widest text-gray-500">Category & Keywords</p>
            <div>
              <p className="mb-1 text-[9px] font-bold uppercase tracking-wider text-gray-400">Category *</p>
              <select value={form.category} onChange={setE("category")}
                className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm text-gray-700 outline-none focus:border-brand">
                <option value="">— Select —</option>
                {categories.map((c) => <option key={c._id} value={c._id}>{c.name.toUpperCase()}</option>)}
              </select>
            </div>
            <div className="mt-4">
              <p className="mb-2 text-[9px] font-bold uppercase tracking-wider text-gray-400">Tags</p>
              <div className="flex flex-wrap gap-1.5 rounded-xl border border-gray-200 p-2">
                {form.tags.map((t) => (
                  <span key={t} className="flex items-center gap-1 rounded-full bg-gray-900 px-2.5 py-1 text-[10px] font-bold text-white">
                    {t}
                    <button type="button" onClick={() => removeTag(t)} className="text-gray-400 hover:text-white">×</button>
                  </span>
                ))}
                <input
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  onKeyDown={addTag}
                  placeholder="Add tag + Enter..."
                  className="min-w-[100px] flex-1 bg-transparent text-xs text-gray-600 outline-none placeholder-gray-400"
                />
              </div>
            </div>
            <div className="mt-4">
              <p className="mb-1 text-[9px] font-bold uppercase tracking-wider text-gray-400">Featured on Homepage</p>
              <label className="flex items-center gap-2 text-sm text-gray-600">
                <Toggle checked={form.featured} onChange={set("featured")} />
                <span className="text-xs">{form.featured ? "Yes" : "No"}</span>
              </label>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
