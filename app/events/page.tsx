
import type { Metadata } from "next";
import { SectionHead } from "@/components/SectionHead";
import { DynamicEventsExplorer } from "@/components/DynamicEventsExplorer";
import { Workshops } from "@/components/Workshops";

export const metadata: Metadata = {
  alternates: { canonical: "/events/" },
  title: "Events — Spectra, CSE Club, AITR Indore",
  description:
    "Explore Spectra's events, workshops, competitions and activities at AITR Indore.",
};

export default function EventsPage() {
  return (
    <>
      <section
        aria-labelledby="events-title"
        className="section-y pt-32 sm:pt-36"
      >
        <div className="container-x">
          <SectionHead
            id="events-title"
            eyebrow="Events"
            title="All events"
            as="h1"
          />
          <DynamicEventsExplorer />
        </div>
      </section>

      <Workshops />
    </>
  );
}
