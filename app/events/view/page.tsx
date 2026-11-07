
"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  ArrowLeft,
  ArrowUpRight,
  CalendarDays,
  MapPin,
} from "lucide-react";

import { Poster } from "@/components/Poster";
import { EventCard } from "@/components/EventCard";
import { RevealGroup, RevealItem } from "@/components/Reveal";
import { site } from "@/content/site";
import type { Event } from "@/content/events";
import { apiUrl } from "@/lib/api";

type EventDetail = Event & {
  subEvents?: Event[];
};

type EventResponse = {
  item: EventDetail;
};
type EventsResponse = {
  items: Event[];
};

export default function EventViewPage() {
  const [event, setEvent] = useState<EventDetail | null>(null);
  const [related, setRelated] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;

    async function loadEvent() {
     const currentUrl = new URL(window.location.href);

const slug =
  currentUrl.searchParams.get("slug") ||
  currentUrl.pathname.split("/").filter(Boolean).pop() ||
  null;
      console.log("EVENT VIEW SLUG:", slug);
console.log("EVENT API URL:", apiUrl(`/api/public/events/${encodeURIComponent(slug ?? "")}`));

      if (!slug) {
        setError("Event not found.");
        setLoading(false);
        return;
      }

      try {
        const [eventResponse, listResponse] = await Promise.all([
          fetch(apiUrl(`/api/public/events/${encodeURIComponent(slug)}`), {
            cache: "no-store",
          }),
          fetch(apiUrl("/api/public/events"), {
            cache: "no-store",
          }),
        ]);

        if (!eventResponse.ok) {
          throw new Error(
            eventResponse.status === 404
              ? "This event does not exist or is no longer available."
              : "Unable to load this event. Please try again."
          );
        }

        if (!listResponse.ok) {
          throw new Error("Unable to load related events.");
        }

        const eventData: EventResponse = await eventResponse.json();
        const listData: EventsResponse = await listResponse.json();

        if (!active) return;

        const currentEvent = eventData.item;

        setEvent(currentEvent);

        const others = listData.items.filter(
          (item) => item.slug !== currentEvent.slug
        );

        const sorted = [
          ...others.filter((item) => item.category === currentEvent.category),
          ...others.filter((item) => item.category !== currentEvent.category),
        ];

        setRelated(sorted.slice(0, 3));
      } catch (err) {
        if (!active) return;

        setError(
          err instanceof Error
            ? err.message
            : "Something went wrong. Please try again."
        );
      } finally {
        if (active) setLoading(false);
      }
    }

    void loadEvent();

    return () => {
      active = false;
    };
  }, []);

  if (loading) {
    return (
      <main className="min-h-screen section-y pt-32">
        <div className="container-x">
          <p className="text-ink-soft animate-pulse">
            Loading event...
          </p>
        </div>
      </main>
    );
  }

  if (error || !event) {
    return (
      <main className="min-h-screen section-y pt-32">
        <div className="container-x">
          <Link
            href="/events/"
            className="inline-flex min-h-[44px] items-center gap-2 text-sm text-ink-soft hover:text-ink"
          >
            <ArrowLeft className="h-4 w-4" />
            All events
          </Link>

          <h1 className="mt-8 text-3xl text-ink">
            Event unavailable
          </h1>

          <p className="mt-4 text-ink-soft">
            {error || "This event could not be found."}
          </p>
        </div>
      </main>
    );
  }

  const outreach = event.category === "Community / Outreach";

  return (
    <>
      <article
        aria-labelledby="event-title"
        className="border-b border-white/10 pb-20 pt-32"
      >
        <div className="container-x grid items-start gap-10 lg:grid-cols-[1.2fr_0.8fr]">
          <div>
            <Link
              href="/events/"
              className="mb-6 inline-flex min-h-[44px] items-center gap-2 text-sm font-medium text-ink-soft hover:text-ink"
            >
              <ArrowLeft className="h-4 w-4" aria-hidden="true" />
              All events
            </Link>

            <div className="flex flex-wrap items-center gap-3">
              <span className="text-xs font-medium uppercase tracking-[0.14em] text-accent-gold">
                {event.category}
              </span>

              {event.year && (
                <span className="text-sm text-ink-soft/70">
                  {event.year}
                </span>
              )}
            </div>

            <h1
              id="event-title"
              className="mt-4 text-[length:var(--fs-h1)] leading-[1.02]"
            >
              {event.title}
            </h1>

            <p className="mt-5 max-w-2xl">
              {event.description}
            </p>

            {(event.date || event.venue) && (
              <dl className="mt-6 flex flex-wrap gap-x-8 gap-y-3 text-sm">
                {event.date && (
                  <div className="flex items-center gap-2">
                    <CalendarDays
                      className="h-4 w-4 text-primary"
                      aria-hidden="true"
                    />
                    <dt className="sr-only">Date</dt>
                    <dd>{event.date}</dd>
                  </div>
                )}

                {event.venue && (
                  <div className="flex items-center gap-2">
                    <MapPin
                      className="h-4 w-4 text-primary"
                      aria-hidden="true"
                    />
                    <dt className="sr-only">Venue</dt>
                    <dd>{event.venue}</dd>
                  </div>
                )}
              </dl>
            )}

            {event.highlights && event.highlights.length > 0 && (
              <div className="mt-8">
                <h2 className="text-xl text-ink">
                  {outreach ? "Poster themes" : "Highlights"}
                </h2>

                <ul className="mt-4 flex flex-wrap gap-2">
                  {event.highlights.map((highlight, index) => (
                    <li
                      key={`${highlight}-${index}`}
                      className="rounded-full border border-white/12 px-4 py-2 text-sm text-ink"
                    >
                      {highlight}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* {outreach && (
              <p className="mt-8 border-l border-white/20 pl-5 text-ink">
                Together, let&apos;s build a safer digital future for every
                student.
              </p>
            )} */}

            <div className="mt-8 flex flex-wrap gap-3">
  <Link
    href={`/gallery?event=${encodeURIComponent(event.slug)}`}
    className="btn btn-primary"
  >
    View Event Photos
  </Link>

  <a
    href={event.instagramUrl ?? site.socials.instagram}
    target="_blank"
    rel="noopener noreferrer"
    className="btn btn-ghost"
  >
    View on Instagram
    <ArrowUpRight className="h-4 w-4" aria-hidden="true" />
    <span className="sr-only"> (opens in new tab)</span>
  </a>
</div>
          </div>

          {event.video ? (
            <div className="relative mx-auto aspect-[9/16] w-full max-w-[360px] overflow-hidden rounded-[var(--radius-poster)] border border-white/10 bg-black lg:ml-auto lg:mr-0">
              <video
                autoPlay
                muted
                loop
                playsInline
                preload="metadata"
                poster={event.image}
                disablePictureInPicture
                controls={false}
                aria-label={`${event.title} event highlights`}
                className="absolute inset-0 h-full w-full object-cover"
              >
                <source src={event.video} />
                Your browser does not support HTML video.
              </video>
            </div>
          ) : event.image ? (
            <Image
              src={event.image}
              alt={`${event.title} poster`}
              width={800}
              height={1000}
              priority
              unoptimized
              sizes="(min-width:1024px) 30vw, 90vw"
              className="img-reveal-in h-auto w-full rounded-[var(--radius-poster)] border border-white/10"
            />
          ) : (
            <Poster
              label={`${event.title} poster`}
              className="img-reveal-in aspect-[16/10] w-full md:aspect-[4/5]"
            />
          )}
        </div>
           </article>

      {event.subEvents && event.subEvents.length > 0 && (
        <section aria-labelledby="sub-events-title" className="section-y">
          <div className="container-x">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-accent">
              Explore the activities
            </p>

            <h2 id="sub-events-title" className="mt-3">
              Activities at {event.title}
            </h2>

            <RevealGroup
              as="ul"
              className="mt-8 grid gap-5 md:grid-cols-2 lg:grid-cols-3"
            >
              {event.subEvents.map((item, index) => (
                <RevealItem
                  as="li"
                  key={item.slug}
                  delay={(index % 3) * 0.07}
                  className="list-none"
                >
                  <EventCard event={item} />
                </RevealItem>
              ))}
            </RevealGroup>
          </div>
        </section>
      )}

      {related.length > 0 && (
        <section aria-labelledby="related-title" className="section-y">
          <div className="container-x">
            <h2 id="related-title">Related events</h2>

            <RevealGroup
              as="ul"
              className="mt-8 grid gap-5 md:grid-cols-2 lg:grid-cols-3"
            >
              {related.map((item) => (
                <RevealItem
                  as="li"
                  key={item.slug}
                  className="list-none"
                >
                  <EventCard event={item} />
                </RevealItem>
              ))}
            </RevealGroup>
          </div>
        </section>
      )}
    </>
  );
}
