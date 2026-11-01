import type { EventCategory, Placeholderable } from "./types";
export interface Event extends Placeholderable {
  slug: string; title: string; category: EventCategory;
  /** Year is unknown for seed events; never invented. */
  year?: number; description: string; instagramUrl?: string;
  date?: string; venue?: string; image?: string; highlights?: string[];
  wash: "magenta" | "blue" | "teal" | "green";
}
export const events: Event[] = [
  { slug: "thirak", title: "Thirak", category: "Cultural", wash: "magenta",
    description: "Our high-voltage dance competition, a stage for the campus's best performers, packed with energy, colour and lights." },
  { slug: "sur-sangram", title: "Sur Sangram", category: "Cultural", wash: "blue",
    description: "A singing showcase where voices take the spotlight, from soulful solos to crowd-roaring group acts." },
  { slug: "cyber-crime-awareness-drive", title: "Cyber Crime Awareness Drive", category: "Community / Outreach", wash: "teal",
    description: "An awareness campaign taken to government schools, teaching safe internet practices, scam prevention and digital responsibility to students.",
    highlights: ["Safe Internet Practices", "Cyber Crime Awareness", "Online Scam Prevention", "Social Media Safety", "Digital Responsibility"] },
  { slug: "nexus-welcome-orientation", title: "Nexus / Welcome Orientation", category: "Club Onboarding", wash: "green",
    description: "Spectra's welcome event: meet the committee, meet the community, and see what the year ahead holds." },
];
