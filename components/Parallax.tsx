"use client";
import { useEffect, useRef, useState } from "react";
import { m, useReducedMotion, useScroll, useTransform } from "framer-motion";

/** Vertical parallax while the element crosses the viewport. Off on phones and under reduced motion. */
export function Parallax({ children, distance = 40, className = "" }: { children: React.ReactNode; distance?: number; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const reduce = useReducedMotion();
  const [wide, setWide] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia("(min-width: 768px)");
    const on = () => setWide(mq.matches);
    on();
    mq.addEventListener("change", on);
    return () => mq.removeEventListener("change", on);
  }, []);
  const d = reduce || !wide ? 0 : distance;
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start end", "end start"] });
  const y = useTransform(scrollYProgress, [0, 1], [d, -d]);
  return (
    <div ref={ref} className={`h-full ${className}`}>
      <m.div style={{ y }} className="h-full">{children}</m.div>
    </div>
  );
}
