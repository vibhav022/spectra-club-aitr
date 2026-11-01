import Image from "next/image";

type Logo = { name: string; src: string; w: number; h: number } | { name: string; wordmark: true };

/**
 * Add or reorder logos here. Use a white-on-transparent PNG in /public/logos.
 * Acropolis is a text wordmark until a usable logo file is supplied (the file received was blank white).
 */
const LOGOS: Logo[] = [
  { name: "Spectra", src: "/logo-nav.png", w: 320, h: 193 },
  { name: "AITR Spectra", src: "/logos/aitr-spectra.png", w: 1993, h: 441 },
  { name: "Acropolis Institute of Technology & Research", wordmark: true },
];

function Item({ l }: { l: Logo }) {
  if ("wordmark" in l)
    return (
      <span className="logo-item flex flex-col leading-none text-white">
        <span className="text-lg font-bold uppercase tracking-[0.22em] sm:text-xl">Acropolis</span>
        <span className="mt-1 text-[0.55rem] font-medium uppercase tracking-[0.2em] sm:text-[0.65rem]">Institute of Technology &amp; Research</span>
      </span>
    );
  return <Image src={l.src} alt="" width={l.w} height={l.h} className="logo-item h-7 w-auto sm:h-9" />;
}

/** Infinite, seamless logo slider (pure CSS). Pauses on hover; static and scrollable with reduced motion. */
export function LogoMarquee() {
  const list = [...LOGOS, ...LOGOS, ...LOGOS];
  return (
    <div role="group" aria-label="Our logos" className="logo-marquee">
      <span className="sr-only">{LOGOS.map((l) => l.name).join(", ")}</span>
      <div aria-hidden="true" className="marquee">
        {[0, 1].map((t) => (
          <div key={t} className="marquee-track logo-track">
            {list.map((l, i) => <Item key={i} l={l} />)}
          </div>
        ))}
      </div>
    </div>
  );
}
