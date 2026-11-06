
"use client";

import { useSearchParams } from "next/navigation";
import { Gallery } from "./Gallery";
import { ComingSoon } from "./ComingSoon";
import { gallery } from "@/content/gallery";
import { visible } from "@/lib/visibility";
import { mediaSrc } from "@/lib/api";
import { useLive, type ApiGalleryItem } from "@/lib/live";
import type { GalleryItem } from "@/content/gallery";
import { Suspense } from "react";

const toItem = (g: ApiGalleryItem): GalleryItem => ({
  id: g.id,
  alt: g.title,
  caption: g.caption ?? undefined,
  category: g.category,
  kind: g.kind,
  src: mediaSrc(g.src),
  thumb: mediaSrc(g.thumb),
  width: g.width,
  height: g.height,
});

/** Gallery page body: live photos/videos from the database. */
function GalleryLiveContent() {
  const searchParams = useSearchParams();
  const eventSlug = searchParams.get("event");

  const endpoint = eventSlug
    ? `/api/public/gallery?event=${encodeURIComponent(eventSlug)}`
    : "/api/public/gallery";

  const live = useLive<{ items: ApiGalleryItem[]; categories: string[] }>(endpoint);

  if (live.status === "loading") {
    return (
      <section
        aria-busy="true"
        aria-label="Loading gallery"
        className="section-y min-h-[70svh] pt-32"
      />
    );
  }

  const items =
    live.status === "ok"
      ? live.data.items.map(toItem)
      : eventSlug
        ? []
        : visible(gallery);

  const categories = live.status === "ok" ? live.data.categories : undefined;

  if (!items.length) {
    return (
      <ComingSoon
        eyebrow="Gallery"
        title="Photos coming soon"
        text={
          eventSlug
            ? "Photos and videos for this event haven't been uploaded yet."
            : "Event photos will land here. Follow @cse_spectra for the latest moments."
        }
      />
    );
  }

  return <Gallery items={items} categories={categories} asPage />;
}
export function GalleryLive() {
  return (
    <Suspense
      fallback={
        <section
          aria-busy="true"
          aria-label="Loading gallery"
          className="section-y min-h-[70svh] pt-32"
        />
      }
    >
      <GalleryLiveContent />
    </Suspense>
  );
}