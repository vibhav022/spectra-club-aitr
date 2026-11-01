import type { Placeholderable } from "./types";
/** src omitted = designed placeholder tile. Real photos: add src + width/height + descriptive alt. */
export interface GalleryItem extends Placeholderable { id?: string; src?: string; thumb?: string; kind?: "image" | "video"; alt: string; caption?: string; category: string; width: number; height: number }
export const gallery: GalleryItem[] = [
  { alt: "Placeholder: cultural event photo", category: "Cultural", width: 800, height: 1000, isPlaceholder: true },
  { alt: "Placeholder: tech workshop photo", category: "Tech", width: 800, height: 600, isPlaceholder: true },
  { alt: "Placeholder: outreach drive photo", category: "Community", width: 800, height: 800, isPlaceholder: true },
  { alt: "Placeholder: dance competition photo", category: "Cultural", width: 800, height: 700, isPlaceholder: true },
  { alt: "Placeholder: hackathon photo", category: "Tech", width: 800, height: 1000, isPlaceholder: true },
  { alt: "Placeholder: school visit photo", category: "Community", width: 800, height: 600, isPlaceholder: true },
];

/** Stable identity for a gallery item. API items always have an id; bundled items fall back to their (unique) alt text. */
export const galleryKey = (it: GalleryItem): string => it.id ?? it.alt;
/** Shared-layout id that pairs a grid thumbnail with the lightbox image for the same item. */
export const mediaLayoutId = (key: string): string => `gallery-media-${key}`;