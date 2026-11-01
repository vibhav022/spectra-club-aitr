"use client";
import { useLive } from "./live";
import type { NavLink } from "./nav";

/** Hides Gallery / Team links when the live database has nothing visible for them. Uses the static guess until the API answers. */
export function useLiveLinks(links: NavLink[]): NavLink[] {
  const c = useLive<{ team: number; gallery: number }>("/api/public/counts");
  return links.filter((l) => {
    if (!l.live) return true;
    if (c.status !== "ok") return !!l.fallback;
    return l.always || c.data[l.live] > 0;
  });
}
