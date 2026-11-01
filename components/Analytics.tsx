import Script from "next/script";
/** Off by default. Set NEXT_PUBLIC_ANALYTICS_DOMAIN (Plausible) to enable; NEXT_PUBLIC_ANALYTICS_SRC overrides the script URL. */
export function Analytics() {
  const domain = process.env.NEXT_PUBLIC_ANALYTICS_DOMAIN;
  if (!domain) return null;
  return <Script defer data-domain={domain} src={process.env.NEXT_PUBLIC_ANALYTICS_SRC ?? "https://plausible.io/js/script.js"} strategy="afterInteractive" />;
}
