import { Code2, Music, Rocket } from "lucide-react";
import { SectionHead } from "./SectionHead";
import { RevealGroup, RevealItem } from "./Reveal";
import { Spot } from "./Spot";
const pillars = [
  { icon: Code2, title: "Tech", text: "Workshops, coding sessions, hackathon prep and tech drives. We build practical skills that classrooms don't always teach." },
  { icon: Music, title: "Culture", text: "Our cultural flagships, Thirak (dance) and Sur Sangram (singing), give the campus a stage and give students a voice." },
  { icon: Rocket, title: "Innovation", text: "Competitions, ideathons, awareness campaigns and community projects that turn ideas into action." },
];
export function Pillars() {
  return (
    <section id="pillars" aria-labelledby="pillars-title" className="section-y relative isolate overflow-hidden">
      <div aria-hidden="true" className="pointer-events-none absolute -left-40 top-1/3 -z-10 h-[28rem] w-[28rem] rounded-full bg-[radial-gradient(closest-side,rgba(94, 224, 208,0.13),transparent)] blur-2xl" />
      <div className="container-x">
        <SectionHead id="pillars-title" eyebrow="What we do" title="Three pillars, one club" />
        <RevealGroup as="ul" className="mt-10 grid gap-4 sm:mt-14 sm:gap-5 md:grid-cols-3">
          {pillars.map(({ icon: Icon, title, text }, i) => (
            <RevealItem as="li" key={title} className="h-full list-none">
              <Spot tap={false} className="glass h-full rounded-[var(--radius-card)] p-6 sm:p-8">
                <div className="flex items-center justify-between">
                  <span className="icon-tile"><Icon className="h-5 w-5" aria-hidden="true" /></span>
                  <span className="font-mono text-xs text-accent-gold">0{i + 1}</span>
                </div>
                <h3 className="spot-shift mt-7 text-xl sm:mt-10">{title}</h3>
                <p className="spot-shift-sm mt-3 text-base">{text}</p>
              </Spot>
            </RevealItem>
          ))}
        </RevealGroup>
      </div>
    </section>
  );
}