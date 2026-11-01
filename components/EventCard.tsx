import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { PlaceholderBadge } from "./PlaceholderBadge";
import { Spot } from "./Spot";
import { Press } from "./Press";

import { site } from "@/content/site";
import type { Event } from "@/content/events";

/** Kept for existing imports; the theme uses no tinted washes. */
export const washOf = (_w?: Event["wash"]) => { void _w; return "none"; };

/** Shared by the homepage flagships, /events and related-events. */
export function EventCard({ event: e }: { event: Event }) {
  return (
    <Press className="h-full">
      <Spot className="glass h-full rounded-[var(--radius-card)]">
        <article className="group flex h-full flex-col p-5 sm:p-7">
          <div className="spot-shift-sm flex flex-wrap items-center gap-2 text-xs">
            <span className="rounded-full border border-white/10 bg-white/[0.05] px-3 py-1 font-medium text-ink-soft">{e.category}</span>
            {e.year && <span className="text-ink-soft/70">{e.year}</span>}
            <PlaceholderBadge show={e.isPlaceholder} />
          </div>
          <h3 className="spot-shift mt-5 text-xl sm:mt-6 sm:text-2xl">{e.title}</h3>
          <p className="spot-shift-sm mt-3 line-clamp-3 flex-1 sm:line-clamp-2 text-base">{e.description}</p>
          <div className="mt-5 flex items-center sm:mt-7 justify-between gap-4">
            <Link href={`/events/${e.slug}/`} className="inline-flex min-h-[44px] items-center gap-2 text-sm font-medium text-ink">
              Details<span className="sr-only"> about {e.title}</span>
              <span aria-hidden="true" className="transition-transform group-hover:translate-x-1 motion-reduce:transform-none">→</span>
            </Link>
            <a href={e.instagramUrl ?? site.socials.instagram} target="_blank" rel="noopener noreferrer"
              className="inline-flex min-h-[44px] items-center gap-1 text-sm text-ink-soft transition-colors hover:text-ink">
              Instagram <ArrowUpRight className="spot-arrow h-4 w-4" aria-hidden="true" /><span className="sr-only"> ({e.title}, opens in new tab)</span>
            </a>
          </div>
        </article>
      </Spot>
    </Press>
  );
}