import type { Context } from "hono";
import type { ZodType } from "zod";

export class HttpError extends Error {
  constructor(public status: number, public code: string, message: string, public details?: unknown) { super(message); }
}
export const notFound = (what = "Not found") => new HttpError(404, "not_found", what);
export const bad = (message: string, details?: unknown) => new HttpError(400, "invalid_request", message, details);

/** Parse a JSON body with a zod schema; throws a 400 listing field errors. */
export async function body<T>(c: Context, schema: ZodType<T>): Promise<T> {
  const raw = await c.req.json().catch(() => undefined);
  if (raw === undefined) throw bad("Request body must be valid JSON.");
  const r = schema.safeParse(raw);
  if (!r.success) {
    const fields: Record<string, string> = {};
    for (const i of r.error.issues) fields[i.path.join(".") || "_"] ??= i.message;
    throw bad("Please correct the highlighted fields.", fields);
  }
  return r.data;
}
export const nowIso = () => new Date().toISOString();
export const nowSec = () => Math.floor(Date.now() / 1000);
export const newId = () => crypto.randomUUID();
