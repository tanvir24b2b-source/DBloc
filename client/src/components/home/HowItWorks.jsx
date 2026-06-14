import EditableText from "../common/EditableText.jsx";
import { useReveal } from "../../hooks/useReveal.js";

const steps = [
  { icon: "🔍", t: "how.step1Title", d: "how.step1Desc", tf: "Find a Bloc", df: "Browse active group-buy deals." },
  { icon: "🤝", t: "how.step2Title", d: "how.step2Desc", tf: "Join the Bloc", df: "Reserve your spot before the timer ends." },
  { icon: "📦", t: "how.step3Title", d: "how.step3Desc", tf: "Get Wholesale Price", df: "Everyone pays the wholesale price." },
];

export default function HowItWorks() {
  const ref = useReveal();
  return (
    <section ref={ref} className="reveal bg-white py-10 md:py-14">
      <div className="mx-auto max-w-5xl px-4 md:px-6">
        <h2 className="mb-8 text-center text-xl font-bold text-ink md:mb-10 md:text-2xl">
          <EditableText keyName="how.title" fallback="How D Bloc Works" />
        </h2>
        <div className="grid grid-cols-3 gap-4 md:gap-8">
          {steps.map((s, i) => (
            <div key={i} className="text-center">
              <div className="mx-auto mb-3 grid h-10 w-10 place-items-center rounded-full bg-brand/10 text-xl md:mb-4 md:h-14 md:w-14 md:text-2xl">{s.icon}</div>
              <div className="mb-1 text-[9px] font-bold text-brand md:text-xs">STEP {i + 1}</div>
              <h3 className="mb-1 text-xs font-semibold text-ink md:mb-2 md:text-base">
                <EditableText keyName={s.t} fallback={s.tf} />
              </h3>
              <p className="hidden text-sm text-muted md:block">
                <EditableText keyName={s.d} fallback={s.df} />
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
