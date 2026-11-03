
"use client";

import { useEffect, useState } from "react";
import { EventsExplorer } from "./EventsExplorer";
import { ComingSoon } from "./ComingSoon";
import type { Event } from "@/content/events";
import { apiUrl } from "@/lib/api";

type EventsResponse = {
  items: Event[];
};

export function DynamicEventsExplorer() {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;

    async function loadEvents() {
      try {
        const response = await fetch(apiUrl("/api/public/events"), {
          cache: "no-store",
        });

        if (!response.ok) {
          throw new Error("Unable to load events. Please try again.");
        }

        const data: EventsResponse = await response.json();

        if (active) {
          setEvents(data.items);
        }
      } catch (err) {
        if (active) {
          setError(
            err instanceof Error
              ? err.message
              : "Something went wrong."
          );
        }
      } finally {
        if (active) setLoading(false);
      }
    }

    void loadEvents();

    return () => {
      active = false;
    };
  }, []);

  if (loading) {
    return (
      <p className="mt-8 animate-pulse text-ink-soft">
        Loading events...
      </p>
    );
  }

  if (error) {
    return (
      <p className="mt-8 text-ink-soft" role="alert">
        {error}
      </p>
    );
  }

  if (!events.length) {
    return (
      <ComingSoon
        eyebrow="Events"
        title="Events coming soon"
        text="We're lining up the next stage. Follow @cse_spectra to hear first."
      />
    );
  }

  return <EventsExplorer events={events} />;
}
