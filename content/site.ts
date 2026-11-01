import type { Placeholderable } from "./types";
export interface InstagramPost extends Placeholderable { url: string; caption?: string; thumbnail?: string }
export interface SiteConfig {
  name: string; shortTag: string; tagline: string; description: string;
  /** Leave undefined until the club confirms the year; the EST badge is then hidden. */
  foundedYear?: number;
  email?: string;
  socials: { instagram: string; linkedin?: string; youtube?: string };
  instagramPosts: InstagramPost[];
}
export const site: SiteConfig = {
  name: "Spectra",
  shortTag: "CSE • AITR",
  tagline: "Tech · Culture · Innovation",
  description:
    "Official CSE Department student club of Acropolis Institute of Technology and Research, Indore.",
  foundedYear: undefined,
  email: undefined,
  socials: { instagram: "https://www.instagram.com/cse_spectra/" },
  instagramPosts: [],
};
export const INSTAGRAM_HANDLE = "@cse_spectra";
