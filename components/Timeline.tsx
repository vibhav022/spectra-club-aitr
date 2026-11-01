import Link from "next/link";
import { SectionHead } from "./SectionHead";
import {
  TimelineFade,
  TimelineImage,
  TimelineItem,
  TimelineTag,
  TimelineTags,
  TimelineYear,}  from "./TimelineMotion";

import { timeline } from "@/content/timeline";
import { events } from "@/content/events";

/**
 * "Our journey": a scroll-driven vertical timeline. Content lives in content/timeline.ts and stays server-rendered;
 * the rail fill, glowing dots and reveals are small client islands in TimelineMotion.tsx.
 * Phones: one column with the rail on the left. lg+: centred rail, content alternating sides, event poster opposite when one exists.
 */
export function Timeline() {
  if (!timeline.length) return null;
  return (
    <section id="journey" aria-labelledby="journey-title" className="section-y border-t border-white/10">
      <div className="container-x">
        <SectionHead id="journey-title" eyebrow="Our journey" title="How far we've come" />
        <ul className="relative mt-12 max-w-3xl lg:mt-16 lg:max-w-none">
          {timeline.map((t, i) => {
            const flip = i % 2 === 1;
            const linked = (t.eventSlugs ?? []).map((slug) => events.find((e) => e.slug === slug)).filter((e): e is NonNullable<typeof e> => Boolean(e));
            // Only real, existing event imagery is shown; with none, the column is simply left open (no placeholder).
            const withImage = linked.find((e) => e.image);
            return (
              <TimelineItem key={t.key} flip={flip} last={i === timeline.length - 1}>
                <div className={`min-w-0 lg:row-start-1 lg:w-full lg:max-w-[30rem] ${flip ? "lg:col-start-1 lg:justify-self-end" : "lg:col-start-2 lg:justify-self-start"}`}>
                  <p className="flex flex-wrap items-center gap-x-3 gap-y-2 text-xs font-medium uppercase tracking-[0.16em] text-ink-soft">
                    <TimelineFade as="span">{t.stage}</TimelineFade>
                    {t.year ? <TimelineYear className="rounded-full border border-white/12 px-2.5 py-0.5 tracking-normal text-ink">{t.year}</TimelineYear> : null}
                  </p>
                  <TimelineFade as="h3" className="mt-2 text-xl font-semibold tracking-tight text-ink sm:text-2xl">{t.title}</TimelineFade>
                  <TimelineFade as="p" className="mt-2 max-w-prose">{t.description}</TimelineFade>
                  {linked.length ? (
                    <TimelineTags className="mt-4 flex flex-wrap gap-2">
                      {linked.map((ev) => (
                        <TimelineTag key={ev.slug} className="list-none min-w-0 max-w-full">
                          <Link href={`/events/${ev.slug}/`} className="inline-flex min-h-[44px] max-w-full items-center rounded-full border border-white/12 px-4 py-1 text-sm font-medium text-ink-soft transition-colors hover:border-white/35 hover:text-ink">{ev.title}</Link>
                        </TimelineTag>
                      ))}
                    </TimelineTags>
                  ) : null}
                </div>
                {withImage?.image ? (
                  <div className={`mt-6 w-full max-w-[18rem] sm:max-w-xs lg:row-start-1 lg:mt-0 lg:max-w-[22rem] ${flip ? "lg:col-start-2 lg:justify-self-start" : "lg:col-start-1 lg:justify-self-end"}`}>
                    <TimelineImage src={withImage.image} alt={`${withImage.title} poster`} />
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
