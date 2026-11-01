import { z } from "zod";

export const text = (max: number) => z.string().trim().min(1, "Required").max(max, `Max ${max} characters`);
/** Optional text: "" and null become null, undefined stays undefined (so PATCH can omit it). */
export const optText = (max: number) =>
  z.string().trim().max(max, `Max ${max} characters`).nullish().transform((v) => (v === undefined ? undefined : v || null));
export const optUrl = z.string().trim().max(500, "Max 500 characters").nullish()
  .refine((v) => !v || /^https?:\/\/[^\s]+$/i.test(v) && URL.canParse(v), "Must be a full http(s) link")
  .transform((v) => (v === undefined ? undefined : v || null));
export const id = z.string().min(1).max(80);
export const reorder = z.object({ ids: z.array(id).min(1).max(500) });
