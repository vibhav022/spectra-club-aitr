// "use client";
// import { useState } from "react";
// import { EventCard } from "./EventCard";
// import type { Event } from "@/content/events";
// import { RevealItem } from "./Reveal";

// export function EventsExplorer({ events }: { events: Event[] }) {
//   const cats = ["All", ...Array.from(new Set(events.map((e) => e.category)))];
//   const [cat, setCat] = useState("All");
//   const shown = cat === "All" ? events : events.filter((e) => e.category === cat);
//   return (
//     <>
//       <div role="group" aria-label="Filter events by category" className="no-scrollbar -mx-[var(--gutter)] mt-8 flex gap-2 overflow-x-auto px-[var(--gutter)] pb-1 sm:mx-0 sm:flex-wrap sm:overflow-visible sm:px-0">
//         {cats.map((c) => (
//           <button key={c} type="button" aria-pressed={cat === c} onClick={() => setCat(c)}
//             className="min-h-[44px] rounded-full shrink-0 border border-white/12 px-5 text-sm font-medium text-ink-soft transition-colors hover:text-ink aria-pressed:border-white aria-pressed:bg-white aria-pressed:text-bg-deep">{c}</button>
//         ))}
//       </div>
//       <p className="sr-only" role="status" aria-live="polite">{shown.length} events shown</p>
//       <h2 className="sr-only">Event list</h2>
//       <ul className="mt-8 grid gap-5 md:grid-cols-2">
//         {shown.map((e, i) => <RevealItem as="li" key={e.slug} delay={(i % 2) * 0.07} className="list-none"><EventCard event={e} /></RevealItem>)}
//       </ul>
//     </>
//   );
// }




"use client";

import { useState } from "react";
import { EventCard } from "./EventCard";
import type { Event } from "@/content/events";
import { RevealItem } from "./Reveal";

function getEventYear(event: Event): number | null {
  if (typeof event.year === "number" && Number.isFinite(event.year)) {
    return event.year;
  }

  if (event.date) {
    const year = Number(event.date.slice(0, 4));
    return Number.isInteger(year) ? year : null;
  }

  return null;
}

export function EventsExplorer({ events }: { events: Event[] }) {
  const mainEvents = events.filter((event) => !event.parentEventId);

  const categories = [
    "All",
    ...Array.from(new Set(mainEvents.map((e) => e.category))),
  ];

  const years = Array.from(
    new Set(
      mainEvents
        .map(getEventYear)
        .filter((year): year is number => year !== null),
    ),
  ).sort((a, b) => b - a);

  const [category, setCategory] = useState("All");
  const [selectedYear, setSelectedYear] = useState<number | "all">("all");

  const shown = mainEvents.filter((event) => {
    const matchesCategory =
      category === "All" || event.category === category;

    const matchesYear =
      selectedYear === "all" || getEventYear(event) === selectedYear;

    return matchesCategory && matchesYear;
  });

  return (
    <>
      {/* YEAR TIMELINE */}
      <div className="mt-9">
        <p className="mb-5 text-xs font-semibold uppercase tracking-[0.18em] text-ink-soft">
          Explore by year
        </p>

        <div
          role="group"
          aria-label="Filter events by year"
          className="relative overflow-x-auto pb-3"
        >
          <div
            aria-hidden="true"
            className="absolute left-5 right-5 top-[7px] h-px bg-white/20"
          />

          <div className="relative flex w-max min-w-full items-start gap-9">
            <button
              type="button"
              aria-pressed={selectedYear === "all"}
              onClick={() => setSelectedYear("all")}
              className="group flex min-w-12 flex-col items-center gap-3"
            >
              <span
                className={`h-4 w-4 rounded-full border-2 transition ${
                  selectedYear === "all"
                    ? "border-accent bg-accent shadow-[0_0_14px_rgba(45,212,191,0.65)]"
                    : "border-white/40 bg-bg-deep group-hover:border-accent"
                }`}
              />
              <span
                className={`text-sm font-semibold ${
                  selectedYear === "all" ? "text-accent" : "text-ink-soft"
                }`}
              >
                All
              </span>
            </button>

            {years.map((year) => (
              <button
                key={year}
                type="button"
                aria-pressed={selectedYear === year}
                onClick={() => setSelectedYear(year)}
                className="group flex min-w-12 flex-col items-center gap-3"
              >
                <span
                  className={`h-4 w-4 rounded-full border-2 transition ${
                    selectedYear === year
                      ? "border-accent bg-accent shadow-[0_0_14px_rgba(45,212,191,0.65)]"
                      : "border-white/40 bg-bg-deep group-hover:border-accent"
                  }`}
                />
                <span
                  className={`text-sm font-semibold ${
                    selectedYear === year
                      ? "text-accent"
                      : "text-ink-soft group-hover:text-ink"
                  }`}
                >
                  {year}
                </span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* CATEGORY FILTER */}
      <div
        role="group"
        aria-label="Filter events by category"
        className="no-scrollbar -mx-[var(--gutter)] mt-7 flex gap-2 overflow-x-auto px-[var(--gutter)] pb-1 sm:mx-0 sm:flex-wrap sm:overflow-visible sm:px-0"
      >
        {categories.map((c) => (
          <button
            key={c}
            type="button"
            aria-pressed={category === c}
            onClick={() => setCategory(c)}
            className="min-h-[44px] shrink-0 rounded-full border border-white/12 px-5 text-sm font-medium text-ink-soft transition-colors hover:text-ink aria-pressed:border-white aria-pressed:bg-white aria-pressed:text-bg-deep"
          >
            {c}
          </button>
        ))}
      </div>

      <p
        className="sr-only"
        role="status"
        aria-live="polite"
      >
        {shown.length} events shown
      </p>

      <h2 className="sr-only">Event list</h2>

      {shown.length > 0 ? (
        <ul className="mt-8 grid gap-5 md:grid-cols-2">
          {shown.map((event, i) => (
            <RevealItem
              as="li"
              key={event.slug}
              delay={(i % 2) * 0.07}
              className="list-none"
            >
              <EventCard event={event} />
            </RevealItem>
          ))}
        </ul>
      ) : (
        <p className="mt-10 text-center text-ink-soft">
          No events found for the selected filters.
        </p>
      )}
    </>
  );
}

