"use client";
import { Gallery } from "./Gallery";
import { ComingSoon } from "./ComingSoon";
import { gallery } from "@/content/gallery";
import { visible } from "@/lib/visibility";
import { mediaSrc } from "@/lib/api";
import { useLive, type ApiGalleryItem } from "@/lib/live";
import type { GalleryItem } from "@/content/gallery";

const toItem = (g: ApiGalleryItem): GalleryItem => ({ id: g.id, alt: g.title, caption: g.caption ?? undefined, category: g.category, kind: g.kind, src: mediaSrc(g.src), thumb: mediaSrc(g.thumb), width: g.width, height: g.height });

/** Gallery page body: live photos/videos from the database. Bundled content is used only if the API genuinely fails. */
export function GalleryLive() {
  const live = useLive<{ items: ApiGalleryItem[]; categories: string[] }>("/api/public/gallery");
  if (live.status === "loading") return <section aria-busy="true" aria-label="Loading gallery" className="section-y min-h-[70svh] pt-32" />;
  const items = live.status === "ok" ? live.data.items.map(toItem) : visible(gallery);
  const categories = live.status === "ok" ? live.data.categories : undefined;
  if (!items.length) return <ComingSoon eyebrow="Gallery" title="Photos coming soon" text="Event photos will land here. Follow @cse_spectra for the latest moments." />;
  return <Gallery items={items} categories={categories} asPage />;
}
