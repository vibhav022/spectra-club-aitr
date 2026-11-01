import type { Metadata } from "next";
import { SectionHead } from "@/components/SectionHead";
import { EventsExplorer } from "@/components/EventsExplorer";
import { ComingSoon } from "@/components/ComingSoon";
import { Workshops } from "@/components/Workshops";
import { events } from "@/content/events";
import { visible } from "@/lib/visibility";

export const metadata: Metadata = {
  alternates: { canonical: "/events/" },
  title: "Events — Spectra, CSE Club, AITR Indore",
  description: "Spectra's flagship events: Thirak, Sur Sangram, the Cyber Crime Awareness Drive and the Nexus welcome orientation.",
};
export default function EventsPage() {
  const list = visible(events);
  if (!list.length) return <ComingSoon eyebrow="Events" title="Events coming soon" text="We're lining up the next stage. Follow @cse_spectra to hear first." />;
  return (<>
    <section aria-labelledby="events-title" className="section-y pt-32 sm:pt-36">
      <div className="container-x">
        <SectionHead id="events-title" eyebrow="Events" title="All events" as="h1" />
        <EventsExplorer events={list} />
      </div>
    </section>
    <Workshops />
  </>);
}
