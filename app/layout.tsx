import type { Metadata, Viewport } from "next";
import "./fonts.css";
import "./globals.css";
import { Providers } from "@/components/Providers";
import { Navbar } from "@/components/Navbar";
import { SiteChrome } from "@/components/SiteChrome";
import { Footer } from "@/components/Footer";
import { ScrollProgress } from "@/components/ScrollProgress";
import { getNavLinks } from "@/lib/nav";
import { JsonLd } from "@/components/JsonLd";
import { Analytics } from "@/components/Analytics";
import { VideoBackground } from "@/components/VideoBackground";
import { organizationLd } from "@/lib/jsonld";
import { SITE_URL } from "@/lib/site-url";

const TITLE = "Spectra — CSE Club, AITR Indore | Tech • Culture • Innovation";
const DESCRIPTION = "Official CSE Department student club of Acropolis Institute of Technology and Research, Indore. Events, workshops, competitions and community outreach. Discover the Spectra community.";
export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: TITLE,
  description: DESCRIPTION,
  keywords: ["Spectra", "CSE club", "AITR", "Acropolis Indore", "college tech club", "Thirak", "Sur Sangram", "hackathon", "student community"],
  alternates: { canonical: "/" },
  icons: { icon: "/icon.png", apple: "/apple-touch-icon.png" },
  openGraph: { type: "website", siteName: "Spectra — CSE Club, AITR", title: TITLE, description: DESCRIPTION, url: "/", locale: "en_IN" },
  twitter: { card: "summary_large_image", title: TITLE, description: DESCRIPTION },
};
export const viewport: Viewport = { themeColor: "#04080A", colorScheme: "dark" };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const links = getNavLinks();
  return (
    <html lang="en">
      <head>
        <link rel="preload" href="/fonts/inter-latin-wght-normal.woff2" as="font" type="font/woff2" crossOrigin="anonymous" />
        <JsonLd data={organizationLd()} />
        <noscript><style>{`[data-reveal]{opacity:1!important;transform:none!important;clip-path:none!important}`}</style></noscript>
      </head>
      <body id="top">
        <a href="#main-content" className="fixed left-4 top-4 z-[80] -translate-y-24 rounded-full bg-primary px-5 py-3 font-bold text-bg-deep focus:translate-y-0">Skip to content</a>
        <VideoBackground />
        <Providers>
          <SiteChrome top={<><ScrollProgress /><Navbar links={links} /></>} bottom={<Footer links={links} />}>{children}</SiteChrome>
        </Providers>
        <Analytics />
      </body>
    </html>
  );
}
