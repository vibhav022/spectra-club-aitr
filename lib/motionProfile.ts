import { useEffect, useLayoutEffect, useSyncExternalStore } from "react";

/**
 * One motion language for the whole site. Every scroll reveal (Reveal, SectionHead, RevealImage, CountUp) reads its
 * easing, distances and timings from here, so desktop and mobile stay consistent and there is a single place to tune.
 */

/** Smooth ease-out with a long, soft tail. No overshoot, so nothing ever bounces. */
export const EASE = [0.22, 1, 0.36, 1] as const;

const WIDE = "(min-width: 768px)";
const subscribe = (notify: () => void) => {
  const mq = window.matchMedia(WIDE);
  mq.addEventListener("change", notify);
  return () => mq.removeEventListener("change", notify);
};
/**
 * true from tablet width up. The server snapshot is false (the lighter mobile profile), which is also what hydration
 * uses, so markup always matches; a wide screen then switches over right after hydration.
 */
export function useWide(): boolean {
  return useSyncExternalStore(subscribe, () => window.matchMedia(WIDE).matches, () => false);
}

/** One-off read for effects and handlers that must not re-run when the screen is resized. */
export const isWideNow = () => window.matchMedia(WIDE).matches;

/** useLayoutEffect on the client, useEffect on the server (avoids the SSR warning). */
export const useIsoLayoutEffect = typeof window !== "undefined" ? useLayoutEffect : useEffect;

export interface MotionProfile {
  /** Card / block entrance: vertical offset in px and duration in s. */
  y: number; duration: number;
  /** Delay between siblings in a group, and the most a whole group may spend staggering. */
  stagger: number; maxStagger: number;
  /** Heading words: stagger between words, duration, and how long the eyebrow leads. */
  wordStagger: number; wordDuration: number; wordDelay: number;
  /** Images: inner scale at the start, duration, and the clip-path inset (%) that opens up. */
  imageScale: number; imageDuration: number; imageInset: number;
  /** Number count-up duration in ms. */
  count: number;
}

const DESKTOP: MotionProfile = {
  y: 15, duration: 0.6, stagger: 0.08, maxStagger: 0.5,
  wordStagger: 0.06, wordDuration: 0.75, wordDelay: 0.08,
  imageScale: 1.06, imageDuration: 0.95, imageInset: 5,
  count: 1400,
};
/** Shorter, smaller, fewer things moving at once. */
const MOBILE: MotionProfile = {
  y: 10, duration: 0.45, stagger: 0.05, maxStagger: 0.3,
  wordStagger: 0.04, wordDuration: 0.55, wordDelay: 0.04,
  imageScale: 1.03, imageDuration: 0.7, imageInset: 4,
  count: 1100,
};
export const motionProfile = (wide: boolean): MotionProfile => (wide ? DESKTOP : MOBILE);
/** Convenience: the active profile for this screen size. */
export function useMotionProfile(): MotionProfile { return motionProfile(useWide()); }