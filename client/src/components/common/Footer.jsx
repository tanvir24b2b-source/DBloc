import { Link } from "react-router-dom";
import { useText } from "../../store/ContentContext.jsx";
import EditableText from "./EditableText.jsx";
import Logo from "./Logo.jsx";
import { SocialIconSvg } from "../../lib/socialIcons.jsx";

// Maps footer link label → internal route
const LINK_ROUTES = {
  "All Blocs":       "/blocs",
  "Categories":      "/categories",
  "Track Order":     "/track-order",
  "How It Works":    "/#how-it-works",
  "Request a Bloc":  "/request-bloc",
  "Help Center":     "/help-center",
  "Refund Policy":   "/refund-policy",
  "Delivery Info":   "/delivery-info",
  "Terms of Service":"/terms",
  "Privacy Policy":  "/privacy-policy",
  "About Us":        "/about",
  "Privacy":         "/privacy-policy",
  "Terms":           "/terms",
  "Cookies":         "#",
};

function LinkCol({ titleKey, linksKey, titleFallback, linksFallback }) {
  const raw = useText(linksKey, linksFallback);
  const links = raw.split(",").map((s) => s.trim()).filter(Boolean);
  return (
    <div>
      <h4 className="mb-3 text-xs font-bold uppercase tracking-wider text-muted">
        <EditableText keyName={titleKey} fallback={titleFallback} />
      </h4>
      <ul className="space-y-2 text-sm text-ink/80">
        {links.map((label, i) => {
          const to = LINK_ROUTES[label] || "#";
          return (
            <li key={i}>
              <Link to={to} className="hover:text-brand transition-colors">{label}</Link>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

export default function Footer() {
  const hotline = useText("site.hotline", "16633");
  const email   = useText("site.email",   "support@dblock.bd");
  const hours   = useText("site.hours",   "9AM–9PM · Every day");
  const mainRaw  = useText("site.socialMain", "[]");
  const extraRaw = useText("site.socialExtra", "[]");
  let mainLinks = [];
  let extraLinks = [];
  try { mainLinks  = JSON.parse(mainRaw);  } catch { mainLinks  = []; }
  try { extraLinks = JSON.parse(extraRaw); } catch { extraLinks = []; }
  const allSocialLinks = [...mainLinks, ...extraLinks].filter(l => l.url);

  const legalRaw = useText("footer.legal", "Privacy, Terms, Cookies");
  const legalLinks = legalRaw.split(",").map((s) => s.trim()).filter(Boolean);

  const socialIcons = (
    <div className="flex flex-wrap gap-2">
      {allSocialLinks.map((l, i) => (
        <a key={i} href={l.url} target="_blank" rel="noopener noreferrer" title={l.label || ""}
          className="grid h-8 w-8 place-items-center rounded-lg border border-line bg-white overflow-hidden hover:border-brand transition">
          {l.iconKey
            ? <SocialIconSvg iconKey={l.iconKey} variant={l.variant || "black-on-white"} size={18} />
            : l.icon
              ? <img src={l.icon} alt={l.label || ""} className="h-4 w-4 object-contain" />
              : <span className="text-xs font-bold text-muted">{(l.label || "?").slice(0, 2)}</span>}
        </a>
      ))}
    </div>
  );

  return (
    <>
    <footer className="mt-8 border-t border-line bg-cream md:mt-16">

      {/* ══ MOBILE ══ */}
      <div className="md:hidden px-4 py-6 space-y-5">
        {/* Row 1: Brand + Contact side by side */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Logo />
            <p className="mt-2 text-xs text-muted">
              <EditableText keyName="footer.tagline" fallback="Bangladesh's group-buy platform." />
            </p>
            <div className="mt-3">{socialIcons}</div>
          </div>
          <div>
            <h4 className="mb-2 text-[10px] font-bold uppercase tracking-wider text-muted">
              <EditableText keyName="footer.col3Title" fallback="CONTACT" />
            </h4>
            <p className="text-lg font-bold text-brand">{hotline}</p>
            <p className="mt-1 text-xs text-ink/80 break-all">{email}</p>
            <p className="mt-1 text-[10px] text-muted">{hours}</p>
          </div>
        </div>

        {/* Row 2: Platform + Support side by side */}
        <div className="grid grid-cols-2 gap-4 border-t border-line pt-4">
          <LinkCol titleKey="footer.col1Title" linksKey="footer.col1Links" titleFallback="PLATFORM" linksFallback="All Blocs, Categories, Track Order, Request a Bloc" />
          <LinkCol titleKey="footer.col2Title" linksKey="footer.col2Links" titleFallback="SUPPORT" linksFallback="Help Center, Refund Policy, Delivery Info, Terms of Service, Privacy Policy" />

        </div>

        {/* Copyright */}
        <div className="border-t border-line pt-3 flex flex-wrap items-center justify-between gap-2 text-[10px] text-muted">
          <EditableText keyName="footer.copyright" fallback="© 2025 Digital Bloc BD" />
          <div className="flex gap-2">
            {legalLinks.map((label, i) => (
              <Link key={i} to={LINK_ROUTES[label] || "#"} className="hover:text-brand transition-colors">{label}</Link>
            ))}
          </div>
        </div>
      </div>

      {/* ══ DESKTOP ══ */}
      <div className="hidden md:block">
        <div className="mx-auto grid max-w-7xl grid-cols-4 gap-8 px-6 py-12">
          <div>
            <Logo />
            <p className="mt-3 max-w-xs text-sm text-muted">
              <EditableText keyName="footer.tagline" fallback="Bangladesh's group-buy platform." />
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              {allSocialLinks.map((l, i) => (
                <a key={i} href={l.url} target="_blank" rel="noopener noreferrer" title={l.label || ""}
                  className="grid h-9 w-9 place-items-center rounded-lg border border-line bg-white overflow-hidden hover:border-brand transition">
                  {l.icon
                    ? <img src={l.icon} alt={l.label || ""} className="h-5 w-5 object-contain" />
                    : <span className="text-xs font-bold text-muted">{(l.label || "?").slice(0, 2)}</span>}
                </a>
              ))}
            </div>
          </div>
          <LinkCol titleKey="footer.col1Title" linksKey="footer.col1Links" titleFallback="PLATFORM" linksFallback="All Blocs, Categories, Track Order, Request a Bloc" />
          <LinkCol titleKey="footer.col2Title" linksKey="footer.col2Links" titleFallback="SUPPORT" linksFallback="Help Center, Refund Policy, Delivery Info, Terms of Service, Privacy Policy" />
          <div>
            <h4 className="mb-3 text-xs font-bold uppercase tracking-wider text-muted">
              <EditableText keyName="footer.col3Title" fallback="CONTACT" />
            </h4>
            <p className="text-2xl font-bold text-brand">{hotline}</p>
            <p className="mt-2 text-sm text-ink/80">{email}</p>
            <p className="mt-1 text-xs text-muted">{hours}</p>
          </div>
        </div>
        <div className="border-t border-line">
          <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-2 px-6 py-4 text-xs text-muted sm:flex-row">
            <EditableText keyName="footer.copyright" fallback="© 2025 Digital Bloc BD" />
            <div className="flex gap-3">
              {legalLinks.map((label, i) => (
                <Link key={i} to={LINK_ROUTES[label] || "#"} className="hover:text-brand transition-colors">{label}</Link>
              ))}
            </div>
          </div>
        </div>
      </div>

    </footer>

    </>
  );
}
