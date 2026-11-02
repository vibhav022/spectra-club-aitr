// import Link from "next/link";
// import { ArrowUpRight } from "lucide-react";
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
import { ArrowUpRight, Play } from "lucide-react";
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

/** Event card with a real thumbnail and a short hover video preview. */
export function EventCard({ event: e }: { event: Event }) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const reduceMotion = useReducedMotion();

  const startPreview = () => {
    const video = videoRef.current;

    if (!video || reduceMotion) return;

    video.currentTime = 0;
    void video.play().catch(() => {
      // Browser may block playback; the thumbnail remains visible.
    });
  };

  const stopPreview = () => {
    const video = videoRef.current;

    if (!video) return;

    video.pause();

    if (video.readyState >= 1) {
      video.currentTime = 0;
    }
  };

  const loopShortPreview = () => {
    const video = videoRef.current;

    // Use only the first six seconds of the full event video.
    if (!video || video.currentTime < 6) return;

    video.currentTime = 0;
    void video.play().catch(() => {});
  };

  return (
    <Press className="h-full">
      <Spot className="glass h-full rounded-[var(--radius-card)]">
        <article
          className="group relative flex h-full min-h-[340px] flex-col overflow-hidden"
          onMouseEnter={startPreview}
          onMouseLeave={stopPreview}
        >
          {/* Event thumbnail and video background */}
          <div
            className="absolute inset-0 overflow-hidden"
            aria-hidden="true"
          >
            {e.image ? (
              <Image
                src={e.image}
                alt=""
                fill
                sizes="(min-width: 768px) 50vw, 100vw"
                className="spot-img object-cover opacity-80"
              />
            ) : (
              <div className="absolute inset-0 bg-[#0C1214]" />
            )}

            {/* Video appears only during hover preview */}
            {e.video && (
              <video
                ref={videoRef}
                src={e.video}
                poster={e.image}
                muted
                playsInline
                preload="none"
                disablePictureInPicture
                tabIndex={-1}
                aria-hidden="true"
                onTimeUpdate={loopShortPreview}
                className="spot-img absolute inset-0 h-full w-full object-cover opacity-0 transition-opacity duration-500 group-hover:opacity-100 motion-reduce:transition-none"
              />
            )}

            {/* Dark overlay keeps existing text colours readable */}
            <div className="absolute inset-0 bg-gradient-to-t from-[#04080A] via-[#04080A]/75 to-[#04080A]/25" />

            <div className="absolute inset-0 bg-gradient-to-r from-black/15 to-transparent" />
          </div>

          {/* Event content */}
          <div className="relative z-10 flex h-full flex-1 flex-col p-5 sm:p-7">

            {/* Category and preview label */}
            <div className="spot-shift-sm flex flex-wrap items-center gap-2 text-xs">

              <span className="rounded-full border border-white/15 bg-black/35 px-3 py-1 font-medium text-ink-soft backdrop-blur-md">
                {e.category}
              </span>

              {e.year && (
                <span className="text-ink-soft/80">{e.year}</span>
              )}

              <PlaceholderBadge show={e.isPlaceholder} />

              {e.video && (
                <span className="ml-auto hidden items-center gap-1.5 rounded-full border border-white/15 bg-black/35 px-3 py-1 text-ink-soft backdrop-blur-md sm:inline-flex">
                  <Play className="h-3 w-3" fill="currentColor" />
                  Preview on hover
                </span>
              )}
            </div>

            {/* Bottom content */}
            <div className="mt-auto pt-20">

              <h3 className="spot-shift text-xl text-ink sm:text-2xl">
                {e.title}
              </h3>

              <p className="spot-shift-sm mt-3 line-clamp-3 text-base text-ink-soft sm:line-clamp-2">
                {e.description}
              </p>

              {/* Card actions */}
              <div className="mt-5 flex items-center justify-between gap-4 sm:mt-7">

                <Link
                  href={`/events/${e.slug}/`}
                  className="inline-flex min-h-[44px] items-center gap-2 text-sm font-medium text-ink transition-colors hover:text-white"
                >
                  Details

                  <span className="transition-transform group-hover:translate-x-1 motion-reduce:transform-none">
                    →
                  </span>

                  <span className="sr-only"> about {e.title}</span>
                </Link>

                <a
                  href={e.instagramUrl ?? site.socials.instagram}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex min-h-[44px] items-center gap-1 text-sm text-ink-soft transition-colors hover:text-ink"
                >
                  Instagram

                  <ArrowUpRight
                    className="spot-arrow h-4 w-4"
                    aria-hidden="true"
                  />

                  <span className="sr-only">
                    ({e.title}, opens in new tab)
                  </span>
                </a>

              </div>
            </div>
          </div>
        </article>
      </Spot>
    </Press>
  );
}
