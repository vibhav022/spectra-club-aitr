import { visible } from "./visibility";
import { gallery } from "@/content/gallery";
import { team } from "@/content/team";
export interface NavLink {
  label: string; href: string; id: string;
  /** Links whose page depends on live content. `fallback` is used until/unless the API answers; `always` keeps the link regardless. */
  live?: "gallery" | "team"; fallback?: boolean; always?: boolean;
}
/** Every page is its own link. Gallery and Team appear only when they have something to show (decided live, see useLiveLinks). */
export function getNavLinks(): NavLink[] {
  return [
    { label: "Home", href: "/", id: "home", always: true },
    { label: "Events", href: "/events", id: "events" },
    { label: "Gallery", href: "/gallery", id: "gallery", live: "gallery", fallback: visible(gallery).length > 0 },
    { label: "Team", href: "/team", id: "team", live: "team", fallback: visible(team).length > 0 },
    { label: "About", href: "/about", id: "about" },
  ];
}
