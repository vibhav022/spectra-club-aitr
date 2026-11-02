
// import type { EventCategory, Placeholderable } from "./types";

// export interface Event extends Placeholderable {
//   slug: string;
//   title: string;
//   category: EventCategory;
//   year?: number;
//   description: string;
//   instagramUrl?: string;
//   date?: string;
//   venue?: string;
//   image?: string;
//   video?: string;
//   highlights?: string[];
//   wash: "magenta" | "blue" | "teal" | "green";
// }

// export const events: Event[] = [
//   {
//     slug: "thirak",
//     title: "Thirak",
//     category: "Cultural",
//     wash: "magenta",
//     description:
//       "Our high-voltage dance competition, a stage for the campus's best performers, packed with energy, colour and lights.",
//     // image: "/events/Goonj 2026.jpeg",
//     // video: "/videos/thirak.mp",
//   },

//   {
//     slug: "sur-sangram",
//     title: "Sur Sangram",
//     category: "Cultural",
//     wash: "blue",
//     description:
//       "A singing showcase where voices take the spotlight, from soulful solos to crowd-roaring group acts.",
//     // image: "/events/sur-sangram.jpg",
//     // video: "/videos/sursangam.mp4",
//   },

//   {
//     slug: "cyber-crime-awareness-drive",
//     title: "Cyber Crime Awareness Drive",
//     category: "Community / Outreach",
//     wash: "teal",
//     description:
//       "An awareness campaign taken to government schools, teaching safe internet practices, scam prevention and digital safety.",
//     // image: "/events/cyber-crime-awareness-drive.jpg",
//     // video: "/videos/cyber-crime-awareness-drive.mp4",
//   },

//   {
//     slug: "nexus-welcome-orientation",
//     title: "Nexus / Welcome Orientation",
//     category: "Club Onboarding",
//     wash: "green",
//     description:
//       "Spectra's welcome event: meet the committee, meet the community, and see what the year ahead holds.",
//     // image: "/events/nexus-welcome-orientation.jpg",
//     // video: "/videos/nexus-welcome-orientation.mp4",
//   },
// ];









import type { EventCategory, Placeholderable } from "./types";

export interface Event extends Placeholderable {
  slug: string;
  title: string;
  category: EventCategory;
  year?: number;
  description: string;
  instagramUrl?: string;
  date?: string;
  venue?: string;
  image?: string;
  video?: string;
  highlights?: string[];
  wash: "magenta" | "blue" | "teal" | "green";
}

export const events: Event[] = [
  {
    slug: "thirak",
    title: "Thirak",
    category: "Cultural",
    wash: "magenta",
    description:
      "Our high-voltage dance competition, a stage for the campus's best performers, packed with energy, colour and lights.",
    image: "/events/thirak-poster.jpg",
    video: "/videos/thirak.mp4",
  },

  {
    slug: "sur-sangram",
    title: "Sur Sangram",
    category: "Cultural",
    wash: "blue",
    description:
      "A singing showcase where voices take the spotlight, from soulful solos to crowd-roaring group acts.",
    image: "/events/sur-sangram-poster.jpg",
    video: "/videos/Sur-Sangam.mp4",
  },

  {
    slug: "cyber-crime-awareness-drive",
    title: "Cyber Crime Awareness Drive",
    category: "Community / Outreach",
    wash: "teal",
    description:
      "An awareness campaign taken to government schools, teaching safe internet practices, scam prevention and digital safety.",
    image: "/events/cyber-crime-awareness-poster.jpg",
    video: "/videos/cyber-crime-awareness-drive.mp4",
  },

  {
    slug: "nexus-welcome-orientation",
    title: "Nexus / Welcome Orientation",
    category: "Club Onboarding",
    wash: "green",
    description:
      "Spectra's welcome event: meet the committee, meet the community, and see what the year ahead holds.",
    image: "/events/nexus-poster.jpg",
    video: "/videos/nexus-welcome-orientation.mp4",
  },
];
