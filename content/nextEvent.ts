import type { Placeholderable } from "./types";

/**
 * The small "Next event" countdown bar on the home page.
 * To use it: set `eventSlug` (an entry in events.ts) and `startsAt`, optionally `venue` and `registrationUrl`,
 * then remove `isPlaceholder`. Placeholder entries only show in dev. The bar hides itself 24h after the event starts.
 */
export interface NextEvent extends Placeholderable {
  eventSlug: string;
  /** e.g. "2026-11-15T10:00:00+05:30" (always include the +05:30 offset). */
  startsAt: string;
  venue?: string;
  /** Registration / participation link. Falls back to the event's Instagram page. */
  registrationUrl?: string;
}

export const nextEvent: NextEvent | null = {
  eventSlug: "thirak",
  startsAt: "2026-11-15T10:00:00+05:30",
  venue: "AITR Campus, Indore",
  isPlaceholder: true,
};
