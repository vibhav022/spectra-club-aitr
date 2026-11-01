import type { Metadata } from "next";
import { Team } from "@/components/Team";

export const metadata: Metadata = {
  alternates: { canonical: "/team/" },
  title: "Team — Spectra, CSE Club, AITR Indore",
  description: "Meet the core committee and faculty coordinator behind Spectra, the CSE Department club at AITR, Indore.",
};
export default function TeamPage() {
  return <Team asPage />;
}
