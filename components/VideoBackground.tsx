"use client";
import { useEffect, useRef } from "react";

const SPEED = 1; // 1 = normal, 0.5 = half speed, 0.25 = quarter speed

/** Site-wide video, fixed behind all content. Decorative; hidden for reduced-motion users. */
export function VideoBackground() {
  const ref = useRef<HTMLVideoElement>(null);
  useEffect(() => {
    const v = ref.current;
    if (!v) return;
    const apply = () => { v.playbackRate = SPEED; };
    apply(); // video may already be loaded before hydration
    v.addEventListener("loadedmetadata", apply);
    v.addEventListener("play", apply);
    return () => { v.removeEventListener("loadedmetadata", apply); v.removeEventListener("play", apply); };
  }, []);
  return (
    <div aria-hidden="true" className="video-bg">
      <video ref={ref} autoPlay muted loop playsInline preload="auto" tabIndex={-1}>
        <source src="/videos/bg.mp4" type="video/mp4" />
      </video>
    </div>
  );
}
