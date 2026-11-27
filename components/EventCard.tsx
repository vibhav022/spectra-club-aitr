// import Link from "next/link";
// import { ArrowUpRight, CalendarDays } from "lucide-react";
// import { PlaceholderBadge } from "./PlaceholderBadge";
// import { Spot } from "./Spot";
// import { Press } from "./Press";

// import { site } from "@/content/site";
// import type { Event } from "@/content/events";

// /** Kept for existing imports; the theme uses no tinted washes. */
// export const washOf = (_w?: Event["wash"]) => { void _w; return "none"; };

// /** Shared by the homepage flagships, /events and related-events. */
// export function EventCard({ event: e }: { event: Event }) {
//   return (
//     <Press className="h-full">
//       <Spot className="glass h-full rounded-[var(--radius-card)]">
//         <article className="group flex h-full flex-col p-5 sm:p-7">
//           <div className="spot-shift-sm flex flex-wrap items-center gap-2 text-xs">
//             <span className="rounded-full border border-white/10 bg-white/[0.05] px-3 py-1 font-medium text-ink-soft">{e.category}</span>
//             {e.year && <span className="text-ink-soft/70">{e.year}</span>}
//             <PlaceholderBadge show={e.isPlaceholder} />
//           </div>
//           <h3 className="spot-shift mt-5 text-xl sm:mt-6 sm:text-2xl">{e.title}</h3>
//           <p className="spot-shift-sm mt-3 line-clamp-3 flex-1 sm:line-clamp-2 text-base">{e.description}</p>
//           <div className="mt-5 flex items-center sm:mt-7 justify-between gap-4">
//             <Link href={`/events/${e.slug}/`} className="inline-flex min-h-[44px] items-center gap-2 text-sm font-medium text-ink">
//               Details<span className="sr-only"> about {e.title}</span>
//               <span aria-hidden="true" className="transition-transform group-hover:translate-x-1 motion-reduce:transform-none">→</span>
//             </Link>
//             <a href={e.instagramUrl ?? site.socials.instagram} target="_blank" rel="noopener noreferrer"
//               className="inline-flex min-h-[44px] items-center gap-1 text-sm text-ink-soft transition-colors hover:text-ink">
//               Instagram <ArrowUpRight className="spot-arrow h-4 w-4" aria-hidden="true" /><span className="sr-only"> ({e.title}, opens in new tab)</span>
//             </a>
//           </div>
//         </article>
//       </Spot>
//     </Press>
//   );
// }/













"use client";

import { useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowUpRight, CalendarDays } from "lucide-react";
import { useReducedMotion } from "framer-motion";

import { PlaceholderBadge } from "./PlaceholderBadge";
import { Spot } from "./Spot";
import { Press } from "./Press";

import { site } from "@/content/site";
import type { Event } from "@/content/events";

/** Kept for compatibility with existing imports. */
export const washOf = (_w?: Event["wash"]) => {
  void _w;
  return "none";
};

const eventDate = new Intl.DateTimeFormat("en-GB", { dateStyle: "medium", timeZone: "UTC" });

export function EventCard({ event: e }: { event: Event }) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const reduceMotion = useReducedMotion();
  const date = e.date ? new Date(e.date) : null;
  const dateLabel = date && Number.isFinite(date.getTime()) ? eventDate.format(date) : null;

  const startPreview = (event: React.PointerEvent<HTMLElement>) => {
    const video = videoRef.current;
    if (!video || reduceMotion || event.pointerType !== "mouse") return;

    video.currentTime = 0;
    void video.play().catch(() => {});
  };

  const stopPreview = () => {
    const video = videoRef.current;
    if (!video) return;

    video.pause();
    if (video.readyState >= 1) video.currentTime = 0;
  };

  const loopShortPreview = () => {
    const video = videoRef.current;
    if (video && video.currentTime >= 6) video.currentTime = 0;
  };

  return (
    <Press className="h-full">
      <Spot className="glass h-full rounded-[var(--radius-card)]">
        <article
          className="group relative flex h-full flex-col"
          onPointerEnter={startPreview}
          onPointerLeave={stopPreview}
        >
          <div aria-hidden="true" className="relative grid aspect-video place-items-center overflow-hidden border-b border-white/10 bg-bg-deep/70">
            {e.image ? (
              <Image
                src={e.image}
                alt=""
                fill
                sizes="(min-width: 768px) 50vw, 100vw"
                className="spot-img object-cover"
              />
            ) : (
              <CalendarDays className="h-10 w-10 text-accent/40" />
            )}

            {e.video && !reduceMotion && (
              <video
                ref={videoRef}
                src={e.video}
                poster={e.image}
                muted
                playsInline
                preload="none"
                disablePictureInPicture
                tabIndex={-1}
                onTimeUpdate={loopShortPreview}
                className="spot-img absolute inset-0 h-full w-full object-cover opacity-0 transition-opacity duration-300 [@media(hover:hover)]:group-hover:opacity-100"
              />
            )}
          </div>

          <div className="flex flex-1 flex-col px-5 pt-4 pb-2 sm:px-6">
            <p className="flex flex-wrap items-center gap-x-2 gap-y-1 text-sm font-medium text-accent">
              {dateLabel ? <time dateTime={e.date}>{dateLabel}</time> : e.year}
              {(dateLabel || e.year) && <span aria-hidden="true">·</span>}
              <span>{e.category}</span>
              <PlaceholderBadge show={e.isPlaceholder} />
            </p>
            <h3 className="mt-1 text-xl font-semibold text-ink sm:text-2xl">{e.title}</h3>
            {e.description && <p className="mt-2 line-clamp-2 text-sm text-ink-soft">{e.description}</p>}

            <div className="mt-auto flex flex-wrap items-center justify-between gap-x-4 pt-2">
              <Link
                href={`/events/${e.slug}/`}
                className="inline-flex min-h-11 items-center gap-1.5 text-sm font-semibold text-ink after:absolute after:inset-0 after:z-10 after:rounded-[var(--radius-card)] focus-visible:outline-none focus-visible:after:ring-2 focus-visible:after:ring-inset focus-visible:after:ring-accent"
              >
                View event<span className="sr-only">: {e.title}</span>
                <ArrowUpRight className="spot-arrow h-4 w-4" aria-hidden="true" />
              </Link>
              <a
                href={e.instagramUrl ?? site.socials.instagram}
                target="_blank"
                rel="noopener noreferrer"
                className="relative z-20 inline-flex min-h-11 items-center gap-1 text-sm text-ink-soft transition-colors hover:text-ink"
              >
                Instagram
                <ArrowUpRight className="h-4 w-4" aria-hidden="true" />
                <span className="sr-only"> ({e.title}, opens in new tab)</span>
              </a>
            </div>
          </div>
        </article>
      </Spot>
    </Press>
  );
}
