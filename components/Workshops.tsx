import { RevealGroup, RevealItem, RevealImage } from "./Reveal";
import { SectionHead } from "./SectionHead";
import { Poster } from "./Poster";
import { workshops } from "@/content/workshops";
import { visible } from "@/lib/visibility";

export function Workshops() {
  const list = visible(workshops);
  if (!list.length) return null;
  return (
    <section id="workshops" aria-labelledby="workshops-title" className="section-y border-b border-white/10">
      <div className="container-x space-y-20">
        <SectionHead id="workshops-title" eyebrow="Workshops" title="Learn by building" />
        {list.map((w, i) => (
          <RevealGroup key={w.slug} className={`grid items-center gap-8 md:grid-cols-2 ${i % 2 ? "md:[&>*:first-child]:order-2" : ""}`}>
            <RevealImage><Poster label={`${w.title} workshop`} className="aspect-video w-full" /></RevealImage>
            <RevealItem className="space-y-3">
              <p className="eyebrow">{w.eyebrow}</p><h3>{w.title}</h3><p>{w.description}</p>
              <ul className="flex flex-wrap gap-2">{w.tags.map((t) => <li key={t} className="rounded-full border border-white/12 px-3 py-1 text-xs">{t}</li>)}</ul>
            </RevealItem>
          </RevealGroup>
        ))}
      </div>
    </section>
  );
}