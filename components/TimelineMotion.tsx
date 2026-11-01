"use client";
import { createContext, useContext, useMemo, useRef, useState, useSyncExternalStore } from "react";
import Image from "next/image";
import { m, useInView, useReducedMotion, useScroll, type Variants } from "framer-motion";

/**
 * Small client islands for the About timeline. The page and the timeline content stay server-rendered
 * (components/Timeline.tsx); only the scroll progress and reveal state live here.
 * Uses the shared LazyMotion `m` components, so no extra motion code is loaded.
 */

const EASE: [number, number, number, number] = [0.22, 1, 0.36, 1];
const DESKTOP = "(min-width: 1024px)";

const subscribe = (cb: () => void) => {
  const mq = window.matchMedia(DESKTOP);
  mq.addEventListener("change", cb);
  return () => mq.removeEventListener("change", cb);
};
const useWide = () => useSyncExternalStore(subscribe, () => window.matchMedia(DESKTOP).matches, () => false);

interface ItemState { flip: boolean; wide: boolean; reduce: boolean }
const ItemCtx = createContext<ItemState>({ flip: false, wide: false, reduce: false });

/** Shared fade-up: shorter and smaller on phones, instant (opacity only) under reduced motion. */
function useFade(extra?: { x?: number; y?: number; duration?: number }): Variants {
  const { wide, reduce } = useContext(ItemCtx);
  const x = extra?.x ?? 0;
  const y = extra?.y ?? (wide ? 16 : 10);
  const duration = extra?.duration ?? (wide ? 0.65 : 0.45);
  return useMemo<Variants>(
    () => reduce
      ? { hidden: { opacity: 0 }, show: { opacity: 1, transition: { duration: 0 } } }
      : { hidden: { opacity: 0, x, y }, show: { opacity: 1, x: 0, y: 0, transition: { duration, ease: EASE } } },
    [reduce, x, y, duration],
  );
}

/** One milestone <li>: owns its rail segment, glowing dot and the staggered reveal of everything inside it. */
export function TimelineItem({ flip, last, children }: { flip: boolean; last: boolean; children: React.ReactNode }) {
  const ref = useRef<HTMLLIElement>(null);
  const reduce = !!useReducedMotion();
  const wide = useWide();
  // Fires once, when the milestone's top crosses 65% of the viewport height. The dot and content stay "reached" afterwards.
  const reached = useInView(ref, { once: true, margin: "0px 0px -35% 0px" });
  // The segment fills from this milestone's dot to the next one, in step with the visitor's scroll position.
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start 65%", "end 65%"] });
  const state = useMemo(() => ({ flip, wide, reduce }), [flip, wide, reduce]);
  const stagger = useMemo<Variants>(() => ({ hidden: {}, show: { transition: { staggerChildren: reduce ? 0 : wide ? 0.09 : 0.06 } } }), [reduce, wide]);

  return (
    <ItemCtx.Provider value={state}>
      <m.li
        ref={ref}
        variants={stagger}
        initial="hidden"
        animate={reached ? "show" : "hidden"}
        className={`relative list-none pl-10 lg:grid lg:grid-cols-2 lg:items-start lg:gap-x-20 lg:pl-0 ${last ? "" : "pb-12 lg:pb-24"}`}
      >
        {/* Rail segment (dot centre to next dot centre). The last milestone has none, so the line stops at the final dot. */}
        {last ? null : (
          <span aria-hidden="true" className="absolute left-[0.4375rem] top-[0.84375rem] h-full w-px bg-white/10 lg:left-1/2 lg:-translate-x-1/2">
            <m.span
              className="absolute inset-0 origin-top bg-accent/80 will-change-transform"
              style={{ scaleY: reduce ? 1 : scrollYProgress }}
            />
          </span>
        )}
        <span
          aria-hidden="true"
          data-lit={reached}
          className="group/dot absolute left-0 top-1.5 z-10 h-[0.9375rem] w-[0.9375rem] rounded-full border-2 border-white/25 bg-bg-deep transition-[border-color,box-shadow] duration-700 motion-reduce:transition-none data-[lit=true]:border-accent data-[lit=true]:shadow-[0_0_14px_rgba(94,224,208,0.55)] lg:left-1/2 lg:-translate-x-1/2"
        >
          <span className="absolute inset-[2px] scale-50 rounded-full bg-accent opacity-0 transition-[opacity,transform] duration-700 motion-reduce:transition-none group-data-[lit=true]/dot:scale-100 group-data-[lit=true]/dot:opacity-100" />
        </span>
        {children}
      </m.li>
    </ItemCtx.Provider>
  );
}

const tags = { div: m.div, h3: m.h3, p: m.p, span: m.span } as unknown as Record<"div" | "h3" | "p" | "span", typeof m.div>;

/** Fade-up reveal for one piece of milestone content (stage label, heading, description). */
export function TimelineFade({ children, className, as = "div" }: { children: React.ReactNode; className?: string; as?: "div" | "h3" | "p" | "span" }) {
  const variants = useFade();
  const C = tags[as];
  return <C className={className} data-reveal="" variants={variants}>{children}</C>;
}

/** Year chip: slides a short distance from the rail side while fading in. Callers only render it when a year is confirmed. */
export function TimelineYear({ children, className }: { children: React.ReactNode; className?: string }) {
  const { flip, wide } = useContext(ItemCtx);
  const variants = useFade({ x: wide ? (flip ? 18 : -18) : -8, y: 0, duration: wide ? 0.7 : 0.45 });
  return <m.span className={className} data-reveal="" variants={variants}>{children}</m.span>;
}

/** Event tags: small staggered fade and upward movement. */
export function TimelineTags({ children, className }: { children: React.ReactNode; className?: string }) {
  const { reduce } = useContext(ItemCtx);
  const variants = useMemo<Variants>(() => ({ hidden: {}, show: { transition: { staggerChildren: reduce ? 0 : 0.07 } } }), [reduce]);
  return <m.ul className={className} variants={variants}>{children}</m.ul>;
}
export function TimelineTag({ children, className }: { children: React.ReactNode; className?: string }) {
  const variants = useFade({ y: 8, duration: 0.4 });
  return <m.li className={className} data-reveal="" variants={variants}>{children}</m.li>;
}

/** Event poster: clip-path reveal + fade + a very slight settle. Keeps its natural aspect ratio and the shared poster radius. Renders nothing if the file fails to load. */
export function TimelineImage({ src, alt, className = "" }: { src: string; alt: string; className?: string }) {
  const { reduce, wide } = useContext(ItemCtx);
  const [failed, setFailed] = useState(false);
  const wrap = useMemo<Variants>(
    () => reduce
      ? { hidden: { opacity: 0 }, show: { opacity: 1, transition: { duration: 0 } } }
      : { hidden: { opacity: 0, clipPath: "inset(0% 0% 100% 0%)" }, show: { opacity: 1, clipPath: "inset(0% 0% 0% 0%)", transition: { duration: wide ? 0.95 : 0.7, ease: EASE } } },
    [reduce, wide],
  );
  const settle = useMemo<Variants>(
    () => reduce ? { hidden: {}, show: {} } : { hidden: { scale: 1.05 }, show: { scale: 1, transition: { duration: wide ? 1.3 : 0.9, ease: EASE } } },
    [reduce, wide],
  );
  if (failed) return null;
  return (
    <m.div variants={wrap} data-reveal="" className={`overflow-hidden rounded-[var(--radius-poster)] border border-white/10 ${className}`}>
      <m.div variants={settle}>
        <Image src={src} alt={alt} width={800} height={1000} sizes="(min-width:1024px) 22rem, 80vw" onError={() => setFailed(true)} className="h-auto w-full" />
      </m.div>
    </m.div>
  );
}
