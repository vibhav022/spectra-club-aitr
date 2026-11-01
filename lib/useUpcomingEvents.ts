"use client";
import { useEffect, useState } from "react";
import { nextEvent } from "@/content/nextEvent";
import { events } from "@/content/events";
import { visible } from "./visibility";
import { useLive, type ApiNextEvent } from "./live";

/* Fixed-format IST dates. Intl/toLocale* output differs between Node and browsers, which breaks hydration. */
export const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
export const ist = (iso: string) => { const d = new Date(new Date(iso).getTime() + 19800000); return { y: d.getUTCFullYear(), m: d.getUTCMonth(), d: d.getUTCDate(), h: d.getUTCHours(), min: d.getUTCMinutes() }; };
export const dateLabel = (iso: string) => { const t = ist(iso); return `${t.d} ${MONTHS[t.m]} ${t.y}`; };
export const timeLabel = (iso: string) => { const t = ist(iso); return `${t.h % 12 || 12}:${String(t.min).padStart(2, "0")} ${t.h < 12 ? "am" : "pm"}`; };
export const DAY = 864e5;

export function useNow(tickMs = 1000) {
  const [now, setNow] = useState<number | null>(null);
  useEffect(() => {
    // First reading is deferred one tick (state is set from a callback, never synchronously in the effect body); null until then keeps hydration markup stable.
    const first = setTimeout(() => setNow(Date.now()), 0);
    const id = setInterval(() => setNow(Date.now()), tickMs);
    return () => { clearTimeout(first); clearInterval(id); };
  }, [tickMs]);
  return now;
}

export interface UpcomingEvent { key: string; title: string; slug?: string | null; startsAt: string; venue?: string | null; registrationUrl?: string | null; cta: string; isPlaceholder?: boolean }

/**
 * Visible, not-yet-over events, soonest first. Single source for the hero widget (NextEvent) and the mobile menu shortcut.
 * Driven by the admin dashboard via /api/public/next-events; content/nextEvent.ts is only a fallback for a genuine API failure.
 * An empty list is a real "no event" answer. `tickMs` is how often `now` refreshes (the countdown needs 1s, a label does not).
 */
export function useUpcomingEvents(max = 5, tickMs = 1000): { cfgs: UpcomingEvent[]; now: number | null; loading: boolean } {
  const now = useNow(tickMs);
  const feed = useLive<{ events: ApiNextEvent[] }>("/api/public/next-events");
  let all: UpcomingEvent[] = [];
  if (feed.status === "ok") {
    all = feed.data.events.map((e) => ({ key: e.id, title: e.title, slug: e.slug, startsAt: e.startsAt, venue: e.venue, registrationUrl: e.registrationUrl, cta: e.ctaText }));
  } else if (feed.status === "error" && nextEvent && visible([nextEvent]).length) {
    const fb = events.find((x) => x.slug === nextEvent!.eventSlug);
    if (fb) all = [{ key: "fallback", title: fb.title, slug: fb.slug, startsAt: nextEvent!.startsAt, venue: nextEvent!.venue, registrationUrl: nextEvent!.registrationUrl, cta: "Participate now", isPlaceholder: nextEvent!.isPlaceholder }];
  }
  const cfgs = all
    .filter((c) => { const t = new Date(c.startsAt).getTime(); return !Number.isNaN(t) && !(now !== null && now - t > DAY); }) // over a day ago: hide
    .sort((a, b) => new Date(a.startsAt).getTime() - new Date(b.startsAt).getTime())
    .slice(0, max);
  return { cfgs, now, loading: feed.status === "loading" };
}

/** Existing event detail page when the event has one that is visible, otherwise the events index. */
export function eventHref(c: UpcomingEvent): string {
  const ev = c.slug ? visible(events).find((e) => e.slug === c.slug) : undefined;
  return ev ? `/events/${ev.slug}/` : "/events/";
}