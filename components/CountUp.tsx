"use client";
import { useEffect, useRef } from "react";
import { useInView, useReducedMotion } from "framer-motion";
import { isWideNow, motionProfile, useIsoLayoutEffect } from "@/lib/motionProfile";

/**
 * Counts 0 → value once, the first time the number is half on screen (1.4s on desktop, 1.1s on phones, ease-out).
 * The server renders the real value, so without JavaScript, or under reduced motion, the final figure is simply shown.
 * With motion it is reset to 0 before first paint and then driven straight into the DOM from one requestAnimationFrame
 * loop that only runs while counting, so the component never re-renders per frame.
 */
export function CountUp({ value, suffix = "" }: { value: number; suffix?: string }) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, amount: 0.5 });
  const reduce = useReducedMotion();
  const done = `${value}${suffix}`;

  // Park at 0 before the number can be seen. If IntersectionObserver is missing, the real value stays put.
  useIsoLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.textContent = reduce || typeof IntersectionObserver === "undefined" ? done : `0${suffix}`;
  }, [reduce, done, suffix]);

  useEffect(() => {
    const el = ref.current;
    if (!el || !inView || reduce) return;
    let raf = 0;
    const count = motionProfile(isWideNow()).count;   // read once: resizing mid-way or afterwards never restarts the count
    const t0 = performance.now();
    const tick = (t: number) => {
      const p = Math.min((t - t0) / count, 1);
      el.textContent = `${Math.round(value * (1 - Math.pow(1 - p, 3)))}${suffix}`;
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => { cancelAnimationFrame(raf); el.textContent = done; };
  }, [inView, reduce, value, suffix, done]);

  // key: if the figure ever changes, React remounts the span instead of patching a text node we replaced by hand.
  return <span key={done} ref={ref}>{done}</span>;
}