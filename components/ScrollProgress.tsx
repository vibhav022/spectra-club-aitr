"use client";
import { useEffect, useRef } from "react";
/** 3px green bar. Plain rAF + transform (scaleX): no Framer runtime needed on first load. Hidden under reduced motion. */
export function ScrollProgress() {
  const bar = useRef<HTMLDivElement>(null);
  useEffect(() => {
    let raf = 0;
    const update = () => {
      raf = 0;
      const max = document.documentElement.scrollHeight - window.innerHeight;
      bar.current?.style.setProperty("transform", `scaleX(${max > 0 ? Math.min(window.scrollY / max, 1) : 0})`);
    };
    const onScroll = () => { if (!raf) raf = requestAnimationFrame(update); };
    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => { window.removeEventListener("scroll", onScroll); window.removeEventListener("resize", onScroll); cancelAnimationFrame(raf); };
  }, []);
  return <div ref={bar} aria-hidden="true" className="fixed inset-x-0 top-0 z-[70] h-[2px] origin-left scale-x-0 bg-white/70 motion-reduce:hidden" />;
}
