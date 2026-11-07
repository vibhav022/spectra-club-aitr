"use client";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight, User } from "lucide-react";
import { RevealGroup, RevealItem, RevealImage } from "./Reveal";
import { SectionHead } from "./SectionHead";
import { useLive, type ApiMember } from "@/lib/live";
import { mediaSrc } from "@/lib/api";

/** How many empty cards to show while no faculty have been added. */
const EMPTY_CARDS = 3;

/**
 * Home-page faculty strip: photo and name only. "View Full Team & Faculty" opens /team.
 * Faculty come live from the admin dashboard (Faculty section). Until some are added, the cards stay in place
 * as blank tiles (no photo, no name), so the layout is ready and nothing is invented.
 */
export function FacultySection() {
  const live = useLive<{ items: ApiMember[] }>("/api/public/faculty");
  const faculty = live.status === "ok" ? live.data.items : [];   // an API error shows the empty tiles too; nothing is invented
  const cards: (ApiMember | null)[] = faculty.length ? faculty : Array.from({ length: EMPTY_CARDS }, () => null);
  return (
    <section id="faculty" aria-labelledby="faculty-title" className="section-y border-t border-white/10">
      <div className="container-x">
        <div className="text-center">
          <SectionHead id="faculty-title" eyebrow="Leadership" title="Meet our faculty" className="flex flex-col items-center" />
        </div>
        <RevealGroup as="ul" className={`mx-auto mt-10 grid max-w-4xl gap-5 sm:mt-14 sm:grid-cols-3 ${live.status === "loading" ? "invisible" : ""}`}>
          {cards.map((m, i) => (
            <RevealItem as="li" key={m?.id ?? i} className="list-none">
              <div className="glass flex h-full min-h-[13rem] flex-col items-center rounded-[var(--radius-card)] px-4 py-8 text-center">
                <div className="relative flex h-28 w-28 items-center justify-center overflow-hidden rounded-full border border-white/15 bg-surface">
                  {m?.photo ? (
                    <RevealImage className="absolute inset-0">
                      <Image src={mediaSrc(m.photo)!} alt={`Photo of ${m.name}`} fill sizes="112px" className="object-cover" />
                    </RevealImage>
                  ) : (
                    <User className="h-1/3 w-1/3 text-white/25" strokeWidth={1.25} aria-hidden="true" />
                  )}
                </div>
              {m && (
  <div className="mt-5 space-y-2">
    <h3 className="text-lg font-semibold tracking-tight text-ink">
      {m.name}
    </h3>
    <p className="text-sm font-medium tracking-wide text-cyan-300">
      {m.role}
    </p>
  </div>
)}
              </div>
            </RevealItem>
          ))}
        </RevealGroup>
        <div className="mt-10 text-center">
          <Link href="/team/" className="btn btn-ghost">
            View Full Team &amp; Faculty <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </Link>
        </div>
      </div>
    </section>
  );
}