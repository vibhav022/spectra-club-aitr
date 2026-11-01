import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/site-url";
import { events } from "@/content/events";
import { visible } from "@/lib/visibility";
export const dynamic = "force-static";

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();
  // Gallery and Team are filled from the live database, which a static build cannot see, so both are always listed.
  const routes = ["/", "/about/", "/events/", "/gallery/", "/team/"];
  const eventRoutes = visible(events).map((e) => `/events/${e.slug}/`);
  return [...routes, ...eventRoutes].map((r) => ({ url: `${SITE_URL}${r}`, lastModified: now, priority: r === "/" ? 1 : 0.7 }));
}
