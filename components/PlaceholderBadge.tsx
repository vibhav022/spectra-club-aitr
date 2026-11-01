import { isProd } from "@/lib/visibility";
/** Dev-only marker for placeholder content. Renders nothing in production. */
export function PlaceholderBadge({ show }: { show?: boolean }) {
  if (isProd || !show) return null;
  return <span className="rounded bg-danger px-2 py-0.5 text-[0.65rem] font-bold uppercase text-ink">placeholder</span>;
}
