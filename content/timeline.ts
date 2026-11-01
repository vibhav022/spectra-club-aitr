import { site } from "./site";
import { events } from "./events";

/**
 * "Our journey" timeline on the About page, oldest first.
 * Wording comes from the club brief; nothing is invented. `year` stays hidden until the club confirms it
 * (the founding year reads from site.foundedYear, the rest from each event's `year` in events.ts).
 * Add or reorder entries freely: the page renders whatever is here.
 */
export interface Milestone {
  key: string;
  /** Short stage label shown above the title, e.g. "Flagships". */
  stage: string;
  title: string;
  description: string;
  year?: number;
  /** Events this stage links to, shown as small tags. */
  eventSlugs?: string[];
}

const yearOf = (slug: string) => events.find((e) => e.slug === slug)?.year;

export const timeline: Milestone[] = [
  {
    key: "founded", stage: "Founded", title: "Spectra begins",
    description: "Created as the official student activity club of the CSE Department at AITR, with one vision: meaningful involvement beyond the classroom through technical learning, cultural expression and community service.",
    year: site.foundedYear,
  },
  {
    key: "first-events", stage: "First events", title: "Meeting the community",
    description: "Our welcome orientation brought students together to meet the committee, meet the community and see what the year ahead holds.",
    year: yearOf("nexus-welcome-orientation"), eventSlugs: ["nexus-welcome-orientation"],
  },
  {
    key: "flagships", stage: "Flagships", title: "Thirak and Sur Sangram take the stage",
    description: "Two high-energy cultural showcases became our signatures: a dance competition full of colour and lights, and a singing showcase where voices take the spotlight.",
    year: yearOf("thirak") ?? yearOf("sur-sangram"), eventSlugs: ["thirak", "sur-sangram"],
  },
  {
    key: "outreach", stage: "Milestone", title: "Taking Spectra to government schools",
    description: "The Cyber Crime Awareness Drive carried safe internet practices, scam prevention and digital responsibility beyond our campus.",
    year: yearOf("cyber-crime-awareness-drive"), eventSlugs: ["cyber-crime-awareness-drive"],
  },
];
