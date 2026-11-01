"use client";
import { m, useReducedMotion } from "framer-motion";
import { EASE } from "@/lib/motionProfile";

/**
 * Touch feedback for tappable cards: a quick press to ~0.985 and a smooth release. It never hides or gates anything
 * behind a hover, and links inside keep working exactly as before. No press under reduced motion.
 */
export function Press({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  const reduce = useReducedMotion();
  return (
    <m.div className={className} whileTap={reduce ? undefined : { scale: 0.985 }} transition={{ duration: 0.2, ease: EASE }}>
      {children}
    </m.div>
  );
}