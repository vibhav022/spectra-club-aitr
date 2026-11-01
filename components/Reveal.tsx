"use client";
import { Children, createContext, useContext, useMemo } from "react";
import { m, useReducedMotion, type Variants } from "framer-motion";
import { EASE, useMotionProfile } from "@/lib/motionProfile";

/**
 * Shared scroll-reveal system. One IntersectionObserver per group (not per card); children inherit it through variants,
 * so a card, the portrait inside it and the heading above it all run on a single timeline instead of competing.
 *
 * Everything hidden here carries `data-reveal`: if JavaScript or the motion features never arrive, globals.css and the
 * <noscript> rule in the layout put it back on screen, so content can never stay invisible.
 */

/** true inside a <RevealGroup>. Items and images use it to inherit the group's trigger instead of observing alone. */
export const RevealContext = createContext(false);

const GROUP_VIEWPORT = { once: true, amount: 0.15 } as const;
const ITEM_VIEWPORT = { once: true, amount: 0.2, margin: "0px 0px -6% 0px" } as const;
const IMAGE_VIEWPORT = { once: true, amount: 0.25 } as const;

/** Animate a group once as it enters the viewport; children use <RevealItem/> and stagger together. */
export function RevealGroup({ children, className, as = "div" }: { children: React.ReactNode; className?: string; as?: "div" | "ul" }) {
  const p = useMotionProfile();
  const count = Children.count(children);
  // Long lists get a tighter stagger so the last card never waits more than ~half a second.
  const stagger = count > 1 ? Math.min(p.stagger, p.maxStagger / (count - 1)) : p.stagger;
  const group = useMemo<Variants>(() => ({ hidden: {}, show: { transition: { staggerChildren: stagger } } }), [stagger]);
  const C = as === "ul" ? m.ul : m.div;
  return (
    <RevealContext.Provider value>
      <C className={className} variants={group} initial="hidden" whileInView="show" viewport={GROUP_VIEWPORT}>{children}</C>
    </RevealContext.Provider>
  );
}

/**
 * A card or block that fades in from a small offset. Inside a <RevealGroup> it staggers with its siblings; on its own
 * (a filtered list, a lone card) it watches the viewport itself, optionally after `delay` seconds.
 */
export function RevealItem({ children, className, as = "div", delay = 0 }: { children: React.ReactNode; className?: string; as?: "div" | "li"; delay?: number }) {
  const inGroup = useContext(RevealContext);
  const p = useMotionProfile();
  const item = useMemo<Variants>(() => ({
    hidden: { opacity: 0, y: p.y },
    show: { opacity: 1, y: 0, transition: { duration: p.duration, ease: EASE, delay } },
  }), [p, delay]);
  const C = as === "li" ? m.li : m.div;
  const own = inGroup ? {} : ({ initial: "hidden", whileInView: "show", viewport: ITEM_VIEWPORT } as const);
  return <C className={className} data-reveal="" variants={item} {...own}>{children}</C>;
}

/**
 * Image entrance: the frame opens with a soft clip-path while fading in, and the picture settles from a slightly
 * larger size. Inside a <RevealGroup> it joins the group's stagger; alone it watches the viewport. Use it on one
 * element per image, never nested inside another image reveal. The wrapper fills its parent when given h-full/w-full
 * or absolute inset-0 through `className`. Above-the-fold priority images should use the CSS-only `.img-reveal-in`.
 */
export function RevealImage({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  const inGroup = useContext(RevealContext);
  const reduce = useReducedMotion();
  const p = useMotionProfile();
  const frame = useMemo<Variants>(() => reduce
    ? { hidden: { opacity: 0 }, show: { opacity: 1, transition: { duration: 0.2 } } }
    : {
        hidden: { opacity: 0, clipPath: `inset(${p.imageInset}% ${p.imageInset}% ${p.imageInset}% ${p.imageInset}%)` },
        show: { opacity: 1, clipPath: "inset(0% 0% 0% 0%)", transition: { duration: p.imageDuration * 0.8, ease: EASE } },
      }, [reduce, p]);
  const inner = useMemo<Variants>(() => reduce
    ? { hidden: {}, show: {} }
    : { hidden: { scale: p.imageScale }, show: { scale: 1, transition: { duration: p.imageDuration, ease: EASE } } }, [reduce, p]);
  const own = inGroup ? {} : ({ initial: "hidden", whileInView: "show", viewport: IMAGE_VIEWPORT } as const);
  return (
    <m.div className={className} data-reveal="" variants={frame} {...own}>
      <m.div className="relative h-full w-full" data-reveal="" variants={inner}>{children}</m.div>
    </m.div>
  );
}