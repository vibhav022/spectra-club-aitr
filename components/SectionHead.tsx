"use client";
import { Fragment, useContext, useMemo, useRef } from "react";
import { m, useReducedMotion, type Variants } from "framer-motion";
import { RevealContext } from "./Reveal";
import { EASE, useIsoLayoutEffect, useMotionProfile } from "@/lib/motionProfile";

const VIEWPORT = { once: true, amount: 0.6 } as const;

/**
 * Eyebrow + heading. h2s reveal word by word: each word rises out of its own clipping mask, staggered, while the
 * eyebrow fades in just ahead of it. h1 page titles render plainly for fast LCP. Reduced motion gets the plain heading.
 *
 * .text-grad paints one vertical gradient over the whole heading with background-clip:text, and that clip cannot
 * survive transformed children (the words would turn transparent). So each word carries the same gradient itself,
 * sized and offset to the full heading box (see the layout effect), which looks identical to the single block.
 */
export function SectionHead({ id, eyebrow, title, as: H = "h2", className = "" }: { id: string; eyebrow: string; title: string; as?: "h1" | "h2"; className?: string }) {
  const reduce = useReducedMotion();
  const inGroup = useContext(RevealContext);
  const p = useMotionProfile();
  const heading = useRef<HTMLHeadingElement>(null);

  const frame = useMemo<Variants>(() => ({ hidden: {}, show: {} }), []);
  const lead = useMemo<Variants>(() => ({
    hidden: { opacity: 0, y: p.y * 0.6 },
    show: { opacity: 1, y: 0, transition: { duration: p.duration, ease: EASE } },
  }), [p]);
  const words = useMemo<Variants>(() => ({ hidden: {}, show: { transition: { delayChildren: p.wordDelay, staggerChildren: p.wordStagger } } }), [p]);
  const word = useMemo<Variants>(() => ({
    hidden: { y: "108%" },
    show: { y: "0%", transition: { duration: p.wordDuration, ease: EASE } },
  }), [p]);

  // Keep every word's gradient aligned with the heading as a whole, including when it wraps onto several lines.
  useIsoLayoutEffect(() => {
    const h = heading.current;
    if (!h || reduce || H === "h1") return;
    const sync = () => {
      const box = h.getBoundingClientRect();
      h.querySelectorAll<HTMLElement>("[data-word]").forEach((w) => {
        const face = w.firstElementChild as HTMLElement | null;
        if (!face) return;
        face.style.backgroundSize = `100% ${box.height}px`;
        face.style.backgroundPosition = `0 ${-(w.getBoundingClientRect().top - box.top)}px`;
      });
    };
    sync();
    const ro = new ResizeObserver(sync);
    ro.observe(h);
    return () => ro.disconnect();
  }, [reduce, title, H]);

  // h1 page titles: unchanged from your original, plain for fast LCP.
  if (H === "h1") {
    return (
      <div className={className}>
        <p className="eyebrow">{eyebrow}</p>
        <h1 id={id} className="text-grad mt-4 text-[length:var(--fs-h2)] leading-[1.1]">{title}</h1>
      </div>
    );
  }

  // Inside a RevealGroup the heading inherits the group's trigger; on its own it watches the viewport itself.
  const own = inGroup ? {} : ({ initial: "hidden", whileInView: "show", viewport: VIEWPORT } as const);

  // Reduced motion: your original fade-up behaviour with the plain gradient heading, no word splitting.
  if (reduce) {
    return (
      <m.div className={className} data-reveal="" variants={lead} {...own}>
        <p className="eyebrow">{eyebrow}</p>
        <h2 id={id} className="text-grad mt-4">{title}</h2>
      </m.div>
    );
  }

  return (
    <m.div className={className} variants={frame} {...own}>
      <m.p className="eyebrow" data-reveal="" variants={lead}>{eyebrow}</m.p>
      <m.h2 ref={heading} id={id} className="mt-4" variants={words}>
        {title.split(" ").map((w, i) => (
          <Fragment key={i}>
            {i > 0 && " "}
            {/* The mask: clips the word while it rises. Padding + matching negative margin keep descenders and tight letter-spacing from being cut without moving the layout. */}
            <span data-word="" className="-mx-[0.05em] -mb-[0.16em] inline-block overflow-hidden px-[0.05em] pb-[0.16em] align-top">
              <m.span data-reveal="" variants={word} className="text-grad inline-block">{w}</m.span>
            </span>
          </Fragment>
        ))}
      </m.h2>
    </m.div>
  );
}