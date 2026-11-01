"use client";
import { useRef } from "react";
import { m, useReducedMotion, useScroll, useTransform } from "framer-motion";

/** Giant word that drifts sideways as you scroll. Decorative. tone="light" = solid dark tint for white panels. */
export function BigWord({ word, className = "top-6", tone = "outline", sep = "·" }: { word: string; className?: string; tone?: "outline" | "light"; sep?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const reduce = useReducedMotion();
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start end", "end start"] });
  const x = useTransform(scrollYProgress, [0, 1], reduce ? ["0%", "0%"] : ["4%", "-22%"]);
  const look = tone === "light" ? "text-black/[0.08]" : "text-transparent [-webkit-text-stroke:1px_rgba(255,255,255,0.09)]";
  return (
    <div ref={ref} aria-hidden="true" className={`pointer-events-none absolute inset-x-0 select-none overflow-hidden ${className}`}>
      <m.p style={{ x }} className={`whitespace-nowrap font-headline uppercase leading-[0.85] text-[clamp(6rem,22vw,19rem)] ${look}`}>
        {word} {sep} {word} {sep} {word} {sep} {word}
      </m.p>
    </div>
  );
}
