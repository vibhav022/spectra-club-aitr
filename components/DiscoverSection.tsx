import Link from "next/link";
import { ArrowUpRight } from "lucide-react";

/** Homepage closing section: points visitors to Events and the Gallery. */
export function DiscoverSection() {
  return (
    <section aria-labelledby="discover-title" className="px-[var(--gutter)] py-[clamp(4rem,8vw,6.5rem)]">
      <div className="relative isolate mx-auto max-w-[var(--container-max)] overflow-hidden rounded-[1.75rem] border border-[rgba(94, 224, 208,0.14)] bg-surface px-5 py-12 text-center sm:rounded-[2rem] sm:px-16 sm:py-20">
        <div aria-hidden="true" className="aurora absolute inset-0 -z-10" />
        <div aria-hidden="true" className="dots absolute inset-0 -z-10 opacity-30" />
        <p className="eyebrow">Discover Spectra</p>
        <h2 id="discover-title" className="mx-auto mt-5 max-w-3xl text-[clamp(1.9rem,5vw,3.25rem)] font-bold leading-[1.08] text-ink">There&apos;s more to Spectra.</h2>
        <p className="text-accent-grad mx-auto mt-3 text-[clamp(1.05rem,2.2vw,1.3rem)] font-semibold">Come see what we create.</p>
        <p className="mx-auto mt-5 max-w-xl text-[0.95rem] sm:mt-6 sm:text-lg">Explore our events, discover the people behind the ideas, and see how technology meets culture at AITR.</p>
        <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:mt-10 sm:flex-row">
          <Link href="/events" className="group btn btn-primary w-full sm:w-auto">
            Explore Events <ArrowUpRight className="h-4 w-4 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5 motion-reduce:transform-none" aria-hidden="true" />
          </Link>
          <Link href="/gallery" className="btn btn-ghost w-full sm:w-auto">View Gallery</Link>
        </div>
        <p className="mt-8 text-[0.7rem] uppercase tracking-[0.18em] text-accent-gold">Tech · Culture · Innovation</p>
      </div>
    </section>
  );
}
