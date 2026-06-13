import { useText } from "../../store/ContentContext.jsx";

export default function Logo({ light = false }) {
  const logoText = useText("site.logoText", "BLOC");
  const logoUrl = useText("site.logoUrl", "");

  if (logoUrl) {
    return <img src={logoUrl} alt="logo" className="h-8" />;
  }

  return (
    <div className="flex items-center gap-2">
      <span className="grid h-8 w-8 place-items-center rounded-md bg-brand text-base font-extrabold text-white">
        D
      </span>
      <span className={`text-lg font-extrabold tracking-tight ${light ? "text-white" : "text-ink"}`}>
        {logoText}
      </span>
    </div>
  );
}
