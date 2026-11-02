import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import { ArrowLeft, ArrowUpRight, CalendarDays, MapPin } from "lucide-react";
import { Poster } from "@/components/Poster";
import { EventCard } from "@/components/EventCard";
import { RevealGroup, RevealItem } from "@/components/Reveal";
import { events } from "@/content/events";
import { site } from "@/content/site";
import { visible } from "@/lib/visibility";
import { JsonLd } from "@/components/JsonLd";
import { eventLd } from "@/lib/jsonld";

export const dynamicParams = false;
export function generateStaticParams() { return visible(events).map((e) => ({ slug: e.slug })); }

type Props = { params: Promise<{ slug: string }> };
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const e = visible(events).find((x) => x.slug === slug);
  if (!e) return {};
  return { title: `${e.title} — Spectra, CSE Club, AITR`, description: e.description, alternates: { canonical: `/events/${e.slug}/` } };
}

export default async function EventPage({ params }: Props) {
  const { slug } = await params;
  const pool = visible(events);
  const e = pool.find((x) => x.slug === slug);
  if (!e) notFound();
  const others = pool.filter((x) => x.slug !== e.slug);
  const related = [...others.filter((x) => x.category === e.category), ...others.filter((x) => x.category !== e.category)].slice(0, 3);
  const outreach = e.category === "Community / Outreach";

  return (
    <>
      <JsonLd data={eventLd(e)} />
      <article aria-labelledby="event-title" className="border-b border-white/10 pb-20 pt-32">
        <div className="container-x grid items-start gap-10 lg:grid-cols-[1.2fr_0.8fr]">
          <div>
            <Link href="/events/" className="mb-6 inline-flex min-h-[44px] items-center gap-2 text-sm font-medium text-ink-soft hover:text-ink">
              <ArrowLeft className="h-4 w-4" aria-hidden="true" /> All events
            </Link>
            <div className="flex flex-wrap items-center gap-3">
              <span className="text-xs font-medium uppercase tracking-[0.14em] text-accent-gold">{e.category}</span>
              {e.year && <span className="text-sm text-ink-soft/70">{e.year}</span>}
            </div>
            <h1 id="event-title" className="mt-4 text-[length:var(--fs-h1)] leading-[1.02]">{e.title}</h1>
            <p className="mt-5 max-w-2xl">{e.description}</p>

            {(e.date || e.venue) && (
              <dl className="mt-6 flex flex-wrap gap-x-8 gap-y-3 text-sm">
                {e.date && <div className="flex items-center gap-2"><CalendarDays className="h-4 w-4 text-primary" aria-hidden="true" /><dt className="sr-only">Date</dt><dd>{e.date}</dd></div>}
                {e.venue && <div className="flex items-center gap-2"><MapPin className="h-4 w-4 text-primary" aria-hidden="true" /><dt className="sr-only">Venue</dt><dd>{e.venue}</dd></div>}
              </dl>
            )}

            {e.highlights && e.highlights.length > 0 && (
              <div className="mt-8">
                <h2 className="text-xl text-ink">{outreach ? "Poster themes" : "Highlights"}</h2>
                <ul className="mt-4 flex flex-wrap gap-2">
                  {e.highlights.map((h) => <li key={h} className="rounded-full border border-white/12 px-4 py-2 text-sm text-ink">{h}</li>)}
                </ul>
              </div>
            )}
            {outreach && <p className="mt-8 border-l border-white/20 pl-5 text-ink">Together, let&apos;s build a safer digital future for every student.</p>}

            <a href={e.instagramUrl ?? site.socials.instagram} target="_blank" rel="noopener noreferrer" className="btn btn-primary mt-8">
              View on Instagram <ArrowUpRight className="h-4 w-4" aria-hidden="true" /><span className="sr-only"> (opens in new tab)</span>
            </a>
          </div>
         
{e.video ? (
  <div className="relative mx-auto w-full max-w-[360px] aspect-[9/16] overflow-hidden rounded-[var(--radius-poster)] border border-white/10 bg-black lg:ml-auto lg:mr-0">

    <video
      autoPlay
      muted
      loop
      playsInline
      preload="metadata"
      poster={e.image}
      disablePictureInPicture
      controls={false}
      aria-label={`${e.title} event highlights`}
      className="absolute inset-0 h-full w-full object-contain"
    >
      <source src={e.video} type="video/mp4" />
      Your browser does not support HTML video.
    </video>

  </div>
) : e.image ? (
  <Image
    src={e.image}
    alt={`${e.title} poster`}
    width={800}
    height={1000}
    priority
    sizes="(min-width:1024px) 30vw, 90vw"
    className="img-reveal-in h-auto w-full rounded-[var(--radius-poster)] border border-white/10"
  />
) : (
  <Poster
    label={`${e.title} poster`}
    className="img-reveal-in aspect-[16/10] w-full md:aspect-[4/5]"
  />
)}

        </div>
      </article>

      {related.length > 0 && (
        <section aria-labelledby="related-title" className="section-y">
          <div className="container-x">
            <h2 id="related-title">Related events</h2>
            <RevealGroup as="ul" className="mt-8 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
              {related.map((r) => <RevealItem as="li" key={r.slug} className="list-none"><EventCard event={r} /></RevealItem>)}
            </RevealGroup>
          </div>
        </section>
      )}
    </>
  );
}