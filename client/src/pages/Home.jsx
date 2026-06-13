import { Link } from "react-router-dom";
import { useBlocs } from "../hooks/useBlocs.js";
import Hero from "../components/home/Hero.jsx";
import Ticker from "../components/home/Ticker.jsx";
import ActiveBlocs from "../components/home/ActiveBlocs.jsx";
import EndingSoon from "../components/home/EndingSoon.jsx";
import ForYou from "../components/home/ForYou.jsx";
import HowItWorks from "../components/home/HowItWorks.jsx";
import Reviews from "../components/home/Reviews.jsx";
import NotifyStrip from "../components/home/NotifyStrip.jsx";
import EditableText from "../components/common/EditableText.jsx";
import SeoHead from "../components/common/SeoHead.jsx";

export default function Home() {
  const { data: blocs = [] } = useBlocs();
  const activeBlocs = blocs.filter((b) => b.status === "active");
  const featured = activeBlocs.filter((b) => b.featured);
  const heroBlocs = featured.length ? featured : activeBlocs;

  return (
    <>
      <SeoHead pageKey="home" />
      <Hero featured={heroBlocs} />
      <Ticker />
      <ActiveBlocs blocs={activeBlocs} />
      <EndingSoon blocs={activeBlocs} />
      <HowItWorks />
      <ForYou blocs={heroBlocs} />

      {/* View all blocs CTA after all block sections */}
      <div className="flex justify-center pb-4">
        <Link
          to="/blocs"
          className="inline-flex items-center gap-2 rounded-full border-2 border-brand px-8 py-3 text-sm font-bold tracking-wide text-brand transition hover:bg-brand hover:text-white"
        >
          <EditableText keyName="home.viewAllBlocs" fallback="VIEW ALL BLOCS" /> →
        </Link>
      </div>

      <Reviews />
      <NotifyStrip />
    </>
  );
}
