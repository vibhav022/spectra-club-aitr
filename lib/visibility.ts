import type { Placeholderable } from "@/content/types";
export const isProd = process.env.NODE_ENV === "production";
/** In production, placeholder entries never render. In dev they do (with a badge). */
export function visible<T extends Placeholderable>(items: T[]): T[] {
  return isProd ? items.filter((i) => !i.isPlaceholder) : items;
}
