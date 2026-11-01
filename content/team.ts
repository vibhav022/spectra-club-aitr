import type { Placeholderable } from "./types";
export interface Member extends Placeholderable { id?: string; department?: string; name: string; role: string; tier: "leadership" | "core" | "faculty"; photo?: string; instagram?: string;
  /** Optional profile details (team members only). Empty fields are simply not rendered. */
  linkedin?: string; bio?: string; specialization?: string; contributions?: string }
/** Names/photos must be supplied by the club. Placeholders render initials avatars in dev only. */
export const team: Member[] = [
  { name: "Name to be added", role: "Chairperson", tier: "leadership", isPlaceholder: true },
  { name: "Name to be added", role: "Vice President", tier: "leadership", isPlaceholder: true },
  { name: "Name to be added", role: "Secretary", tier: "leadership", isPlaceholder: true },
  { name: "Name to be added", role: "Core Member", tier: "core", isPlaceholder: true },
  { name: "Name to be added", role: "Core Member", tier: "core", isPlaceholder: true },
  { name: "Name to be added", role: "Core Member", tier: "core", isPlaceholder: true },
  { name: "Name to be added", role: "Faculty Coordinator", tier: "faculty", isPlaceholder: true },
];