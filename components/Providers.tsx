"use client";
import { LazyMotion, MotionConfig } from "framer-motion";
/** Marks <html> once the motion features have loaded; until then (or if they never do) globals.css reveals hidden content on a timer. */
const loadFeatures = () => import("@/lib/motionFeatures").then((m) => { document.documentElement.classList.add("motion-ready"); return m.default; });
export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <LazyMotion features={loadFeatures} strict>
      <MotionConfig reducedMotion="user">{children}</MotionConfig>
    </LazyMotion>
  );
}
