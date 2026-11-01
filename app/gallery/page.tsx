import type { Metadata } from "next";
import { GalleryLive } from "@/components/GalleryLive";

export const metadata: Metadata = {
  alternates: { canonical: "/gallery/" },
  title: "Gallery — Spectra, CSE Club, AITR Indore",
  description: "Moments from Spectra events: tech sessions, cultural nights and community drives at AITR, Indore.",
};
export default function GalleryPage() {
  return <GalleryLive />;
}
