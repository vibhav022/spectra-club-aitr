"use client";
import { useEffect, useRef } from "react";
/** Three drifting blobs (green, gold, magenta) at ~10% opacity. Decorative; paused when off-screen. */
export function StageLights() {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(([e]) => el.setAttribute("data-stage-paused", String(!e.isIntersecting)));
    io.observe(el);
    return () => io.disconnect();
  }, []);
  return (
    <div ref={ref} aria-hidden="true" className="pointer-events-none absolute inset-0 overflow-hidden">
      <div className="stage-blob left-[-10%] top-[5%] h-[38rem] w-[38rem] bg-primary" style={{ opacity: 0.07 }} />
      <div className="stage-blob right-[-8%] top-[30%] h-[30rem] w-[30rem] bg-accent-gold" style={{ animationDelay: "-6s", opacity: 0.08 }} />
      <div className="stage-blob bottom-[-10%] left-[30%] h-[34rem] w-[34rem]" style={{ background: "#E9A36B", animationDelay: "-12s", opacity: 0.1 }} />
    </div>
  );
}
