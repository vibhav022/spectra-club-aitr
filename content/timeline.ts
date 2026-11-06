
import { site } from "./site";
import { events } from "./events";

export interface Milestone {
  key: string;
  stage: string;
  title: string;
  description: string;
  year?: number;
  eventSlugs?: string[];
  image?: string;
  imageAlt?: string;
}

const yearOf = (slug: string) =>
  events.find((e) => e.slug === slug)?.year;

export const timeline: Milestone[] = [
  {
    key: "founded",
    stage: "Founded",
    title: "Spectra begins",
    description:
      "Created as the official student activity club of the CSE Department at AITR, with one vision: meaningful involvement beyond the classroom through technical learning, cultural expression and community service.",
    year: site.foundedYear,
    image: "/about/spectra.png",
    imageAlt: "Spectra CSE Club at AITR",
  },
  {
    key: "first-events",
    stage: "First events",
    title: "Meeting the community",
    description:
      "Our welcome orientation brought students together to meet the committee, meet the community and see what the year ahead holds.",
    year: yearOf("nexus-welcome-orientation"),
    eventSlugs: ["nexus-welcome-orientation"],
    image: "/about/Goonj 2026.jpeg",
    imageAlt: "Spectra welcome orientation",
  },
  {
    key: "flagships",
    stage: "Flagships",
    title: "Thirak and Sur Sangram take the stage",
    description:
      "Two high-energy cultural showcases became our signatures: a dance competition full of colour and lights, and a singing showcase where voices take the spotlight.",
    year: yearOf("thirak") ?? yearOf("sur-sangram"),
    eventSlugs: ["thirak", "sur-sangram"],
    image: "/about/thirak-poster.jpg",
    imageAlt: "Thirak and Sur Sangram cultural events",
  },
  {
    key: "outreach",
    stage: "Milestone",
    title: "Taking Spectra to government schools",
    description:
      "The Cyber Crime Awareness Drive carried safe internet practices, scam prevention and digital responsibility beyond our campus.",
    year: yearOf("cyber-crime-awareness-drive"),
    eventSlugs: ["cyber-crime-awareness-drive"],
    image: "/about/cyber-crime-awareness-poster.jpg",
    imageAlt: "Cyber Crime Awareness Drive",
  },
];
