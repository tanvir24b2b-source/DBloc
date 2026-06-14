import { Link } from "react-router-dom";
import EditableText from "../common/EditableText.jsx";
import BlocCarousel from "../common/BlocCarousel.jsx";
import { useReveal } from "../../hooks/useReveal.js";

export default function ActiveBlocs({ blocs }) {
  const ref = useReveal();
  return (
    <section ref={ref} className="reveal mx-auto max-w-7xl px-4 py-8 md:px-6 md:py-12">
      <div className="mb-4 flex items-center justify-between md:mb-6">
        <h2 className="text-xl font-bold text-ink md:text-2xl">
          <EditableText keyName="activeBlocs.title" fallback="ACTIVE BLOCS" />
        </h2>
        <Link to="/categories" className="text-xs font-bold tracking-wide text-brand hover:underline">
          <EditableText keyName="activeBlocs.viewAll" fallback="VIEW ALL BLOCS" /> →
        </Link>
      </div>
      <BlocCarousel blocs={blocs} />
    </section>
  );
}
