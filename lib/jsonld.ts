import { SITE_URL } from "./site-url";
import { site } from "@/content/site";
import type { Event } from "@/content/events";

export function organizationLd() {
  const sameAs = [site.socials.instagram, site.socials.linkedin, site.socials.youtube].filter(Boolean);
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: "Spectra — CSE Club, AITR",
    alternateName: "Spectra",
    url: SITE_URL,
    logo: `${SITE_URL}/icons/icon-512.png`,
    description: site.description,
    sameAs,
    ...(site.email ? { email: site.email } : {}),
    ...(site.foundedYear ? { foundingDate: String(site.foundedYear) } : {}),
    parentOrganization: {
      "@type": "CollegeOrUniversity",
      name: "Acropolis Institute of Technology and Research",
      address: { "@type": "PostalAddress", addressLocality: "Indore", addressRegion: "Madhya Pradesh", addressCountry: "IN" },
    },
  };
}
/** Only for events with a real, parseable date. Returns null otherwise (nothing is invented). */
export function eventLd(e: Event) {
  if (!e.date || Number.isNaN(Date.parse(e.date))) return null;
  return {
    "@context": "https://schema.org",
    "@type": "Event",
    name: e.title,
    description: e.description,
    startDate: e.date,
    url: `${SITE_URL}/events/${e.slug}/`,
    organizer: { "@type": "Organization", name: "Spectra — CSE Club, AITR", url: SITE_URL },
    ...(e.venue ? { location: { "@type": "Place", name: e.venue } } : {}),
    ...(e.image ? { image: `${SITE_URL}${e.image}` } : {}),
  };
}
