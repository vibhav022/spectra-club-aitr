import type { Metadata } from "next";
import { About } from "@/components/About";
import { Pillars } from "@/components/Pillars";
import { Impact } from "@/components/Impact";
import { Timeline } from "@/components/Timeline";

export const metadata: Metadata = {
  alternates: { canonical: "/about/" },
  title: "About — Spectra, CSE Club, AITR Indore",
  description: "Spectra is the official student activity club of the CSE Department at AITR, Indore: technical learning, cultural expression and community service.",
};
export default function AboutPage() {
  return (<><About asPage /><Timeline /><Pillars /><Impact /></>);
}
