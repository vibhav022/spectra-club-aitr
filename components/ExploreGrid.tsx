import Link from "next/link";
import { ArrowUpRight, CalendarDays, Images, Sparkles, Users } from "lucide-react";
import { SectionHead } from "./SectionHead";
import { RevealGroup, RevealItem } from "./Reveal";
import { Spot } from "./Spot";
import { getNavLinks } from "@/lib/nav";

const CARDS = [
  { id: "about", icon: Sparkles, title: "About", text: "Who we are, our vision and the three pillars behind Spectra." },
  { id: "events", icon: CalendarDays, title: "Events", text: "Thirak, Sur Sangram, awareness drives and orientations." },
  { id: "gallery", icon: Images, title: "Gallery", text: "Photos and recap videos uploaded from our events." },
  { id: "team", icon: Users, title: "Team", text: "The students and faculty who make Spectra happen." },
];

/** Home-page doorway to the sub pages. Only pages that exist in the nav are shown. */
export function ExploreGrid() {
  const ids = new Set(getNavLinks().map((l) => l.id));
  const cards = CARDS.filter((c) => ids.has(c.id));
  return (
    <section aria-labelledby="explore-title" className="section-y">
      <div className="container-x">
        <SectionHead id="explore-title" eyebrow="Explore" title="Everything Spectra" />
        <RevealGroup as="ul" className={`mt-10 grid gap-4 sm:mt-14 sm:grid-cols-2 sm:gap-5 ${cards.length > 3 ? "lg:grid-cols-4" : "lg:grid-cols-3"}`}>
          {cards.map(({ id, icon: Icon, title, text }) => (
            <RevealItem as="li" key={id} className="h-full list-none">
              <Spot className="glass h-full rounded-[var(--radius-card)]">
                <Link href={`/${id}/`} className="group flex h-full flex-col p-5 sm:p-6">
                  <div className="flex items-center justify-between">
                    <span className="icon-tile"><Icon className="h-5 w-5" aria-hidden="true" /></span>
                    <ArrowUpRight className="spot-arrow h-5 w-5 text-ink-soft group-hover:text-ink" aria-hidden="true" />
                  </div>
                  <h3 className="spot-shift mt-5 text-xl sm:mt-8">{title}</h3>
                  <p className="spot-shift-sm mt-2 text-[0.95rem]">{text}</p>
                </Link>
              </Spot>
            </RevealItem>
          ))}
        </RevealGroup>
      </div>
    </section>
  );
}