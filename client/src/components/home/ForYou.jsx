import EditableText from "../common/EditableText.jsx";
import BlocCard from "../common/BlocCard.jsx";
import { useReveal } from "../../hooks/useReveal.js";

export default function ForYou({ blocs }) {
  const ref = useReveal();
  return (
    <section ref={ref} className="reveal mx-auto max-w-7xl px-6 py-12">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-ink">
          <EditableText keyName="forYou.title" fallback="For You" />
        </h2>
        <p className="text-sm text-muted">
          <EditableText keyName="forYou.subtitle" fallback="Handpicked Blocs based on what's trending" />
        </p>
      </div>
      <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
        {blocs.slice(0, 4).map((b) => <BlocCard key={b._id} bloc={b} />)}
      </div>
    </section>
  );
}
