"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

import { SectionHead } from "./SectionHead";
import {
  TimelineFade,
  TimelineImage,
  TimelineItem,
  TimelineTag,
  TimelineTags,
  TimelineYear,
} from "./TimelineMotion";

import { timeline } from "@/content/timeline";
import type { Event } from "@/content/events";
import { apiUrl } from "@/lib/api";

type EventsResponse = {
  items: Event[];
};

export function Timeline() {
  const [catalogueEvents, setCatalogueEvents] = useState<Event[]>([]);

  useEffect(() => {
    let active = true;

    async function loadEvents() {
      try {
        const response = await fetch(apiUrl("/api/public/events"), {
          cache: "no-store",
        });

        if (!response.ok) return;

        const data: EventsResponse = await response.json();

        if (active) {
          setCatalogueEvents(data.items);
        }
      } catch {
        if (active) {
          setCatalogueEvents([]);
        }
      }
    }

    void loadEvents();

    return () => {
      active = false;
    };
  }, []);

  if (!timeline.length) return null;

  return (
    <section
      id="journey"
      aria-labelledby="journey-title"
      className="section-y border-t border-white/10"
    >
      <div className="container-x">
        <SectionHead
          id="journey-title"
          eyebrow="Our journey"
          title="How far we've come"
        />

        <ul className="relative mt-12 max-w-3xl lg:mt-16 lg:max-w-none">
          {timeline.map((t, i) => {
            const flip = i % 2 === 1;

            const linked = (t.eventSlugs ?? [])
              .map((slug) =>
                catalogueEvents.find((event) => event.slug === slug)
              )
              .filter(
                (event): event is Event => Boolean(event)
              );

            const displayYear =
              t.year ??
              linked.find((event) => typeof event.year === "number")?.year;

            return (
              <TimelineItem
                key={t.key}
                flip={flip}
                last={i === timeline.length - 1}
              >
                <div
                  className={`min-w-0 lg:row-start-1 lg:w-full lg:max-w-[30rem] ${
                    flip
                      ? "lg:col-start-1 lg:justify-self-end"
                      : "lg:col-start-2 lg:justify-self-start"
                  }`}
                >
                  <p className="flex flex-wrap items-center gap-x-3 gap-y-2 text-xs font-medium uppercase tracking-[0.16em] text-ink-soft">
                    <TimelineFade as="span">{t.stage}</TimelineFade>

                    {displayYear ? (
                      <TimelineYear className="rounded-full border border-white/12 px-2.5 py-0.5 tracking-normal text-ink">
                        {displayYear}
                      </TimelineYear>
                    ) : null}
                  </p>

                  <TimelineFade
                    as="h3"
                    className="mt-2 text-xl font-semibold tracking-tight text-ink sm:text-2xl"
                  >
                    {t.title}
                  </TimelineFade>

                  <TimelineFade as="p" className="mt-2 max-w-prose">
                    {t.description}
                  </TimelineFade>

                  {linked.length > 0 && (
                    <TimelineTags className="mt-4 flex flex-wrap gap-2">
                      {linked.map((event) => (
                        <TimelineTag
                          key={event.slug}
                          className="list-none min-w-0 max-w-full"
                        >
                          <Link
                            href={`/events/view/?slug=${encodeURIComponent(event.slug)}`}
                            className="inline-flex min-h-[44px] max-w-full items-center rounded-full border border-white/12 px-4 py-1 text-sm font-medium text-ink-soft transition-colors hover:border-white/35 hover:text-ink"
                          >
                            {event.title}
                          </Link>
                        </TimelineTag>
                      ))}
                    </TimelineTags>
                  )}
                </div>

                {t.image ? (
                  <div
                    className={`mt-6 w-full max-w-[18rem] sm:max-w-xs lg:row-start-1 lg:mt-0 lg:max-w-[22rem] ${
                      flip
                        ? "lg:col-start-2 lg:justify-self-start"
                        : "lg:col-start-1 lg:justify-self-end"
                    }`}
                  >
                    <TimelineImage
                      src={t.image}
                      alt={t.imageAlt ?? `${t.title} image`}
                    />
                  </div>
                ) : null}
              </TimelineItem>
            );
          })}
        </ul>
      </div>
    </section>
  );
}