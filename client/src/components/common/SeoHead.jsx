import { Helmet } from "react-helmet-async";
import { useQuery } from "@tanstack/react-query";
import api from "../../lib/api.js";

export default function SeoHead({ pageKey, title, description }) {
  const { data: seo } = useQuery({
    queryKey: ["seo-settings"],
    queryFn: async () => (await api.get("/seo")).data,
    staleTime: 5 * 60 * 1000,
  });

  const pageTitle = title
    || seo?.pages?.[pageKey]?.title
    || seo?.siteTitle
    || "D BLOC — Buy Together, Save More";

  const pageDesc = description
    || seo?.pages?.[pageKey]?.description
    || seo?.siteDescription
    || "Bangladesh's group-buy platform. Buy together, pay wholesale.";

  const ogImage = seo?.ogImage || "";
  const canonical = seo?.canonicalUrl ? `${seo.canonicalUrl}${window.location.pathname}` : "";

  return (
    <Helmet>
      <title>{pageTitle}</title>
      <meta name="description" content={pageDesc} />
      {seo?.siteKeywords && <meta name="keywords" content={seo.siteKeywords} />}
      <meta property="og:title" content={pageTitle} />
      <meta property="og:description" content={pageDesc} />
      <meta property="og:type" content="website" />
      {ogImage && <meta property="og:image" content={ogImage} />}
      {canonical && <link rel="canonical" href={canonical} />}
      {/* GTM — preferred, loads all tags */}
      {seo?.googleTagManagerId && (
        <script>{`(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src='https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);})(window,document,'script','dataLayer','${seo.googleTagManagerId}');`}</script>
      )}
      {/* Direct GA4 — only if no GTM */}
      {seo?.googleAnalyticsId && !seo?.googleTagManagerId && (
        <script async src={`https://www.googletagmanager.com/gtag/js?id=${seo.googleAnalyticsId}`} />
      )}
      {seo?.googleAnalyticsId && !seo?.googleTagManagerId && (
        <script>{`window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments)}gtag('js',new Date());gtag('config','${seo.googleAnalyticsId}');`}</script>
      )}
      {/* FB Pixel — only if no GTM */}
      {seo?.facebookPixelId && !seo?.googleTagManagerId && (
        <script>{`!function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?n.callMethod.apply(n,arguments):n.queue.push(arguments)};if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';n.queue=[];t=b.createElement(e);t.async=!0;t.src=v;s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)}(window,document,'script','https://connect.facebook.net/en_US/fbevents.js');fbq('init','${seo.facebookPixelId}');fbq('track','PageView');`}</script>
      )}
      {seo?.googleSearchConsoleCode && (
        <meta name="google-site-verification" content={seo.googleSearchConsoleCode} />
      )}
    </Helmet>
  );
}
