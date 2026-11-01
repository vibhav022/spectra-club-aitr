import { Slot } from "./Slot";
/** Designed placeholder for missing imagery: navy gradient + watermark wordmark. */
export function Poster({ label, className = "", tilt = 0 }: { label: string; className?: string; tilt?: number }) {
  return (
    <div role="img" aria-label={label} style={{ transform: `rotate(${tilt}deg)` }}
      className={`relative flex items-center justify-center overflow-hidden rounded-[var(--radius-poster)] border border-white/10 bg-surface ${className}`}>
      <Slot />
    </div>
  );
}
