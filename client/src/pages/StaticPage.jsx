import { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import api from "../lib/api.js";

// Map URL slug → content page name + content keys.
// `page` MUST match the `page` field in defaultContent.js (it differs from the URL slug).
const PAGE_MAP = {
  "about":          { page: "about",      titleKey: "page.about.title",      bodyKey: "page.about.body" },
  "help-center":    { page: "helpcenter", titleKey: "page.helpcenter.title", bodyKey: "page.helpcenter.body" },
  "refund-policy":  { page: "refund",     titleKey: "page.refund.title",     bodyKey: "page.refund.body" },
  "delivery-info":  { page: "delivery",   titleKey: "page.delivery.title",   bodyKey: "page.delivery.body" },
  "terms":          { page: "terms",      titleKey: "page.terms.title",      bodyKey: "page.terms.body" },
  "privacy-policy": { page: "privacy",    titleKey: "page.privacy.title",    bodyKey: "page.privacy.body" },
};

function renderBody(text) {
  // Convert **bold** and newlines to HTML
  return text
    .split("\n")
    .map((line, i) => {
      const html = line.replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>");
      if (!line.trim()) return <div key={i} className="h-3" />;
      if (html !== line || line.startsWith("**")) {
        return <p key={i} className="text-sm leading-relaxed text-ink/80" dangerouslySetInnerHTML={{ __html: html }} />;
      }
      return <p key={i} className="text-sm leading-relaxed text-ink/80" dangerouslySetInnerHTML={{ __html: html }} />;
    });
}

export default function StaticPage() {
  const { pathname } = useLocation();
  const slug = pathname.replace(/^\/+/, "").replace(/\/+$/, "");
  const cfg = PAGE_MAP[slug];
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!cfg) { setLoading(false); return; }
    api.get(`/content?page=${cfg.page}`).then(({ data }) => {
      const items = data.items || [];
      const get = (key) => items.find((i) => i.key === key)?.value || "";
      setTitle(get(cfg.titleKey));
      setBody(get(cfg.bodyKey));
      setLoading(false);
    });
  }, [slug]);

  if (!cfg) return (
    <div className="mx-auto max-w-2xl px-6 py-24 text-center">
      <h1 className="text-2xl font-bold text-ink">Page not found</h1>
    </div>
  );

  return (
    <div className="mx-auto max-w-3xl px-6 py-16">
      {loading ? (
        <div className="h-8 w-48 animate-pulse rounded bg-line" />
      ) : (
        <>
          <h1 className="mb-8 text-3xl font-extrabold tracking-tight text-ink">{title}</h1>
          <div className="space-y-1 rounded-2xl border border-line bg-white p-8">
            {renderBody(body)}
          </div>
        </>
      )}
    </div>
  );
}
