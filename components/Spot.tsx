"use client";
import { useEffect, useRef } from "react";

/** Peak tilt in degrees. Kept tiny on purpose. */
const MAX_TILT = 1.25;

type SpotProps = {
  children: React.ReactNode;
  className?: string;
  /** Tiny cursor-based 3D tilt (mouse only). */
  tilt?: boolean;
  /** Lift the card ~5px on hover (mouse only). */
  lift?: boolean;
  /** Quick 0.985 press scale on touch. Turn off for cards that aren't tappable. */
  tap?: boolean;
};

/**
 * Shared card interaction: cursor-following spotlight + teal border light (--x/--y), elevation, tilt, and touch press feedback.
 * The visuals live in globals.css (.spot*). Inside a Spot, opt elements in with:
 *   .spot-img (image zoom, put it on the img/next-image), .spot-shift / .spot-shift-sm (text drifts up), .spot-arrow (arrow moves up-right).
 * Pointer moves write CSS variables straight to the DOM (one rAF per frame): no React state, no re-renders.
 * Touch and pen get no cursor effects; hover styling is also gated by media queries in CSS.
 */
export function Spot({ children, className = "", tilt = true, lift = true, tap = true }: SpotProps) {
  const card = useRef<HTMLDivElement>(null);
  const frame = useRef(0);
  useEffect(() => () => cancelAnimationFrame(frame.current), []);

  const onMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (e.pointerType !== "mouse") return;
    const host = e.currentTarget;
    const { clientX, clientY } = e;
    cancelAnimationFrame(frame.current);
    frame.current = requestAnimationFrame(() => {
      const el = card.current;
      if (!el) return;
      const r = host.getBoundingClientRect();
      el.style.setProperty("--x", `${clientX - r.left}px`);
      el.style.setProperty("--y", `${clientY - r.top}px`);
      if (!tilt || !r.width || !r.height) return;
      const px = Math.min(1, Math.max(0, (clientX - r.left) / r.width));
      const py = Math.min(1, Math.max(0, (clientY - r.top) / r.height));
      el.style.setProperty("--rx", `${((0.5 - py) * 2 * MAX_TILT).toFixed(2)}deg`);
      el.style.setProperty("--ry", `${((px - 0.5) * 2 * MAX_TILT).toFixed(2)}deg`);
    });
  };
  const onLeave = (e: React.PointerEvent<HTMLDivElement>) => {
    if (e.pointerType !== "mouse") return;
    cancelAnimationFrame(frame.current);
    card.current?.style.removeProperty("--rx");
    card.current?.style.removeProperty("--ry");
  };

  return (
    <div className="spot-wrap" onPointerMove={onMove} onPointerLeave={onLeave}>
      <div ref={card} className={`spot ${className}`} data-lift={lift || undefined} data-tilt={tilt || undefined} data-tap={tap || undefined}>
        {children}
      </div>
    </div>
  );
}