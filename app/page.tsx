import { Hero } from "@/components/Hero";
import { ExploreGrid } from "@/components/ExploreGrid";
import { LogoMarquee } from "@/components/LogoMarquee";
import { FacultySection } from "@/components/FacultySection";
import { DiscoverSection } from "@/components/DiscoverSection";
export default function Home() {
  return (<>
    <Hero />
    <section aria-label="Our institution and club" className="border-y border-white/10 bg-white/[0.015] py-8 sm:py-10">
      <LogoMarquee />
    </section>
    <ExploreGrid />
    <FacultySection />
    <DiscoverSection /></>);
}
