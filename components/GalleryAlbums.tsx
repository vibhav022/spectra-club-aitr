import Image from "next/image";
import Link from "next/link";
import { ArrowUpRight, Images } from "lucide-react";
import type { GalleryItem } from "@/content/gallery";

function mediaCount(count: number, label: string) {
  return `${count} ${label}${count === 1 ? "" : "s"}`;
}

export function GalleryAlbums({ albums }: { albums: Map<string, GalleryItem[]> }) {
  return (
    <section aria-labelledby="gallery-albums-title" className="mt-7">
      <h2 id="gallery-albums-title" className="sr-only">Event albums</h2>
      <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from(albums, ([slug, items]) => {
          const cover = items.find((item) => item.kind !== "video" && (item.thumb || item.src))
            ?? items.find((item) => item.thumb);
          const coverSrc = cover?.thumb ?? cover?.src;
          const photos = items.filter((item) => item.kind !== "video").length;
          const videos = items.length - photos;
          const count = [photos ? mediaCount(photos, "photo") : "", videos ? mediaCount(videos, "video") : ""]
            .filter(Boolean).join(" · ");
          const title = items[0].event?.title;

          return (
            <li key={slug}>
              <Link
                href={`/gallery/?event=${encodeURIComponent(slug)}`}
                className="group flex h-full flex-col overflow-hidden rounded-[var(--radius-card)] border border-white/12 bg-bg-deep/70 transition-colors hover:border-accent/50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
              >
                <div className="relative grid aspect-video place-items-center overflow-hidden border-b border-white/10">
                  {coverSrc ? (
                    <Image src={coverSrc} alt="" fill sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw" className="object-cover" />
                  ) : <Images aria-hidden="true" className="h-10 w-10 text-accent/40" />}
                </div>
                <div className="flex flex-1 items-center justify-between gap-3 px-4 py-3.5">
                  <div className="min-w-0">
                    <h3 className="text-lg font-semibold leading-snug text-ink">{title}</h3>
                    <p className="mt-1 text-sm text-ink-soft">{count}</p>
                  </div>
                  <ArrowUpRight aria-hidden="true" className="h-5 w-5 shrink-0 text-accent" />
                </div>
              </Link>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
