"use client";
import { useState } from "react";
import { EventCard } from "./EventCard";
import type { Event } from "@/content/events";
import { RevealItem } from "./Reveal";

export function EventsExplorer({ events }: { events: Event[] }) {
  const cats = ["All", ...Array.from(new Set(events.map((e) => e.category)))];
  const [cat, setCat] = useState("All");
  const shown = cat === "All" ? events : events.filter((e) => e.category === cat);
  return (
    <>
      <div role="group" aria-label="Filter events by category" className="no-scrollbar -mx-[var(--gutter)] mt-8 flex gap-2 overflow-x-auto px-[var(--gutter)] pb-1 sm:mx-0 sm:flex-wrap sm:overflow-visible sm:px-0">
        {cats.map((c) => (
          <button key={c} type="button" aria-pressed={cat === c} onClick={() => setCat(c)}
            className="min-h-[44px] rounded-full shrink-0 border border-white/12 px-5 text-sm font-medium text-ink-soft transition-colors hover:text-ink aria-pressed:border-white aria-pressed:bg-white aria-pressed:text-bg-deep">{c}</button>
        ))}
      </div>
      <p className="sr-only" role="status" aria-live="polite">{shown.length} events shown</p>
      <h2 className="sr-only">Event list</h2>
      <ul className="mt-8 grid gap-5 md:grid-cols-2">
        {shown.map((e, i) => <RevealItem as="li" key={e.slug} delay={(i % 2) * 0.07} className="list-none"><EventCard event={e} /></RevealItem>)}
      </ul>
    </>
  );
}
