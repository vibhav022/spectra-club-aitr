"use client";
import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { m, useReducedMotion, useScroll, useTransform } from "framer-motion";

/**
 * The hero <h1>. The word-by-word reveal is pure CSS (see .hero-word in globals.css) so the heading is
 * visible and hydration-safe from first paint; this wrapper only adds a small scroll-linked drift:
 * the heading eases up a few px and fades very slightly as the visitor scrolls away. Nothing is pinned.
 *
 * Gradient note: background-clip:text on the <h1> does not paint through inline-block word masks, so each
 * [data-hero-grad] word carries the same .text-grad gradient, sized and offset here to the h1's box. The words
 * therefore read as one continuous gradient exactly as before, at any wrap.
 */
export function HeroTitle({ children, className, style }: { children: React.ReactNode; className?: string; style?: React.CSSProperties }) {
  const reduce = useReducedMotion();
  const ref = useRef<HTMLHeadingElement>(null);
  const [wide, setWide] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia("(min-width: 1024px)");
    const on = () => setWide(mq.matches);
    on();
    mq.addEventListener("change", on);
    return () => mq.removeEventListener("change", on);
  }, []);
  useLayoutEffect(() => {
    const h1 = ref.current;
    if (!h1) return;
    const sync = () => {
      const box = h1.getBoundingClientRect();
      h1.querySelectorAll<HTMLElement>("[data-hero-grad]").forEach((el) => {
        const mask = el.parentElement;
        if (!mask) return;
        const top = mask.getBoundingClientRect().top + parseFloat(getComputedStyle(mask).paddingTop) - box.top;
        el.style.backgroundSize = `100% ${box.height}px`;
        el.style.backgroundPosition = `0 ${-top}px`;
        el.style.backgroundRepeat = "no-repeat";
      });
    };
    sync();
    const ro = new ResizeObserver(sync);
    ro.observe(h1);
    return () => ro.disconnect();
  }, []);
  const lift = reduce ? 0 : wide ? -14 : -6;
  const { scrollY } = useScroll();
  const y = useTransform(scrollY, [0, 320], [0, lift]);
  const opacity = useTransform(scrollY, [0, 320], [1, reduce ? 1 : 0.82]);
  return (
    <m.h1 ref={ref} id="hero-title" className={className} style={{ ...style, y, opacity }}>
      {children}
    </m.h1>
  );
}