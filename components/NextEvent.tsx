"use client";
import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { ArrowUpRight, ChevronLeft, ChevronRight } from "lucide-react";
import { PlaceholderBadge } from "./PlaceholderBadge";
import { events } from "@/content/events";
import { site } from "@/content/site";
import { visible } from "@/lib/visibility";
import { useUpcomingEvents, MONTHS, ist, dateLabel, timeLabel, DAY, type UpcomingEvent as Cfg } from "@/lib/useUpcomingEvents";

const pad = (n: number) => String(n).padStart(2, "0");
const AUTOPLAY_MS = 7000;
const MAX_SLIDES = 5;

/**
 * "Next event" widget with live countdowns. Lives in the hero (floating over the logo card on desktop, under the buttons on phones).
 * Driven by the admin dashboard (Upcoming events): every visible, not-yet-over event becomes one card of a swipeable slider, soonest first.
 * With a single event it looks exactly like a plain card. Renders nothing when no event is visible or all ended over a day ago.
 * content/nextEvent.ts is only a fallback for a genuine API failure.
 */
export function NextEvent({ className = "", style }: { className?: string; style?: React.CSSProperties }) {
  const { cfgs, now } = useUpcomingEvents(MAX_SLIDES);

  const scroller = useRef<HTMLDivElement>(null);
  const [idx, setIdx] = useState(0);
  const [paused, setPaused] = useState(false);
  const count = cfgs.length;
  const goTo = useCallback((i: number) => {
    const el = scroller.current; if (!el) return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    el.scrollTo({ left: i * el.clientWidth, behavior: reduce ? "auto" : "smooth" });
  }, []);
  const onScroll = () => { const el = scroller.current; if (el && el.clientWidth) setIdx(Math.round(el.scrollLeft / el.clientWidth)); };

  // Gentle autoplay; stops on hover/focus/touch and never runs for people who prefer reduced motion.
  useEffect(() => {
    if (count < 2 || paused || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const id = setInterval(() => goTo((idx + 1) % count), AUTOPLAY_MS);
    return () => clearInterval(id);
  }, [count, paused, idx, goTo]);
  // Keep position valid if the number of slides shrinks (an event just ended).
  useEffect(() => { if (idx > 0 && idx >= count) goTo(Math.max(0, count - 1)); }, [count, idx, goTo]);

  if (!count) return null;
  const many = count > 1;
  const cur = Math.min(idx, count - 1);

  return (
    <section id="next-event" aria-roledescription={many ? "carousel" : undefined} aria-label={many ? "Upcoming events" : "Next event"} style={style} className={`relative ${className}`}
      onMouseEnter={() => setPaused(true)} onMouseLeave={() => setPaused(false)} onFocusCapture={() => setPaused(true)} onBlurCapture={() => setPaused(false)} onTouchStart={() => setPaused(true)}>
      <div ref={scroller} onScroll={onScroll} tabIndex={-1}
        className="-my-3 flex w-0 min-w-full snap-x snap-mandatory items-start overflow-x-auto py-3 overscroll-x-contain [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {cfgs.map((c, i) => (
          <div key={c.key} role={many ? "group" : undefined} aria-roledescription={many ? "slide" : undefined} aria-label={many ? `${i + 1} of ${count}` : undefined}
            aria-hidden={many && i !== cur ? true : undefined} className="w-full shrink-0 snap-center">
            <EventCard cfg={c} now={now} first={i === 0} interactive={!many || i === cur} />
          </div>
        ))}
      </div>

      {many && (
        <div className="mt-3 flex items-center justify-center gap-3">
          <button type="button" onClick={() => goTo((cur - 1 + count) % count)} aria-label="Previous event" className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-white/15 bg-white/[0.05] text-ink hover:border-white/35 hover:bg-white/10"><ChevronLeft className="h-4 w-4" aria-hidden="true" /></button>
          <div className="flex items-center gap-2">
            {cfgs.map((c, i) => (
              <button key={c.key} type="button" onClick={() => goTo(i)} aria-label={`Show event ${i + 1}: ${c.title}`} aria-current={i === cur ? "true" : undefined}
                className="group flex h-6 items-center"><span className={`block h-1.5 rounded-full transition-all ${i === cur ? "w-6 bg-accent-gold" : "w-1.5 bg-white/30 group-hover:bg-white/60"}`} /></button>
            ))}
          </div>
          <button type="button" onClick={() => goTo((cur + 1) % count)} aria-label="Next event" className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-white/15 bg-white/[0.05] text-ink hover:border-white/35 hover:bg-white/10"><ChevronRight className="h-4 w-4" aria-hidden="true" /></button>
        </div>
      )}
    </section>
  );
}

function EventCard({ cfg, now, first, interactive }: { cfg: Cfg; now: number | null; first: boolean; interactive: boolean }) {
  const ev = cfg.slug ? visible(events).find((e) => e.slug === cfg.slug) : undefined;
  const start = new Date(cfg.startsAt).getTime();
  const live = now !== null && now >= start;
  const diff = now === null ? null : Math.max(0, start - now);
  const parts = [
    { v: diff === null ? null : Math.floor(diff / DAY), l: "Days" },
    { v: diff === null ? null : Math.floor((diff % DAY) / 36e5), l: "Hours" },
    { v: diff === null ? null : Math.floor((diff % 36e5) / 6e4), l: "Mins" },
    { v: diff === null ? null : Math.floor((diff % 6e4) / 1e3), l: "Secs" },
  ];
  const cta = cfg.registrationUrl ?? ev?.instagramUrl ?? site.socials.instagram;
  const tab = interactive ? undefined : -1;   // off-screen slides must not be reachable with the keyboard

  return (
    <article aria-label={`${first ? "Next event" : "Upcoming event"}: ${cfg.title}`}
      className="relative overflow-hidden rounded-3xl border border-white/12 bg-[#0C1214]/85 p-5 shadow-[0_24px_60px_-24px_rgba(0,0,0,0.9)] backdrop-blur-xl sm:p-6">
      <div aria-hidden="true" className="pointer-events-none absolute inset-x-8 top-0 h-px bg-gradient-to-r from-transparent via-white/40 to-transparent" />
      <div aria-hidden="true" className="pointer-events-none absolute -right-10 -top-12 h-32 w-32 rounded-full bg-[radial-gradient(closest-side,rgba(94, 224, 208,0.28),transparent)]" />

      <div className="relative flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="flex items-center gap-2 text-[0.68rem] font-medium uppercase tracking-[0.18em] text-accent-gold">
            <span aria-hidden="true" className="badge-dot" />{live ? "Happening now" : first ? "Next event" : "Upcoming event"}
            <PlaceholderBadge show={cfg.isPlaceholder} />
          </p>
          {ev
            ? <Link href={`/events/${ev.slug}/`} tabIndex={tab} className="mt-2 block truncate text-xl font-semibold tracking-tight text-ink hover:underline underline-offset-4">{cfg.title}</Link>
            : <p className="mt-2 truncate text-xl font-semibold tracking-tight text-ink">{cfg.title}</p>}
          <p className="mt-0.5 truncate text-sm text-ink-soft">{timeLabel(cfg.startsAt)}{cfg.venue ? ` · ${cfg.venue}` : ""}</p>
        </div>
        <div className="shrink-0 rounded-2xl border border-white/10 bg-white/[0.05] px-3 py-1.5 text-center leading-none">
          <span className="block text-xl font-semibold tabular-nums text-ink">{ist(cfg.startsAt).d}</span>
          <span className="mt-1 block text-[0.62rem] font-medium uppercase tracking-[0.16em] text-accent-gold">{MONTHS[ist(cfg.startsAt).m]}</span>
        </div>
      </div>

      {live ? (
        <p className="relative mt-5 rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-4 text-center text-base font-medium text-ink">It&apos;s happening, join us on campus.</p>
      ) : (
        <>
          <p className="sr-only">Starts {dateLabel(cfg.startsAt)} at {timeLabel(cfg.startsAt)}.</p>
          <div aria-hidden="true" className="relative mt-5 grid grid-cols-4 gap-2">
            {parts.map((p) => (
              <div key={p.l} className="rounded-2xl border border-white/10 bg-white/[0.045] py-3 text-center">
                <div className="text-grad text-2xl font-semibold tabular-nums leading-none tracking-tight sm:text-[1.7rem]">{p.v === null ? "--" : pad(p.v)}</div>
                <div className="mt-1.5 text-[0.6rem] font-medium uppercase tracking-[0.16em] text-accent-gold">{p.l}</div>
              </div>
            ))}
          </div>
        </>
      )}

      <a href={cta} target="_blank" rel="noopener noreferrer" tabIndex={tab} className="group btn btn-primary relative mt-4 w-full !min-h-11">
        {cfg.cta} <ArrowUpRight className="h-4 w-4 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5 motion-reduce:transform-none" aria-hidden="true" />
        <span className="sr-only"> for {cfg.title} (opens in new tab)</span>
      </a>
    </article>
  );
}