import { RevealGroup, RevealItem } from "./Reveal";
import { SectionHead } from "./SectionHead";

export function About({ asPage = false }: { asPage?: boolean }) {
  return (
    <section id="about" aria-labelledby="about-title" className={`section-y ${asPage ? "pt-32 sm:pt-36" : ""}`}>
      <RevealGroup className="container-x grid items-center gap-12 lg:grid-cols-[1.1fr_0.9fr] lg:gap-20">
        <RevealItem className="space-y-6">
          <SectionHead id="about-title" eyebrow="About" title="More than a club" as={asPage ? "h1" : "h2"} />
          <p className="lg:text-lg">Spectra is the official student activity club of the Computer Science &amp; Engineering Department at Acropolis Institute of Technology and Research (AITR), Indore. It was created with a simple vision: to give CSE students meaningful involvement beyond the classroom, through technical learning, cultural expression and community service.</p>
          <p className="lg:text-lg">From national-level thinking on our own campus to awareness drives in government schools, Spectra turns student energy into real impact.</p>
        </RevealItem>
        <RevealItem>
          <figure className="glass relative overflow-hidden rounded-[var(--radius-card)] p-8 sm:p-10">
            <div aria-hidden="true" className="absolute -right-16 -top-16 h-56 w-56 rounded-full bg-[radial-gradient(closest-side,rgba(94, 224, 208,0.3),transparent)] blur-xl" />
            <blockquote className="text-grad relative text-2xl font-semibold leading-snug tracking-tight sm:text-3xl">
              Where ideas meet opportunities, and every experience becomes a memory.
            </blockquote>
            <figcaption className="relative mt-8 flex flex-wrap gap-2">
              {["Tech", "Culture", "Innovation", "Community"].map((t) => <span key={t} className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-xs text-ink-soft">{t}</span>)}
            </figcaption>
          </figure>
        </RevealItem>
      </RevealGroup>
    </section>
  );
}
