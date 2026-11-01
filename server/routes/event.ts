import { Hono } from "hono";
import { z } from "zod";
import type { AppEnv, Env } from "../env";
import { body, HttpError, newId, notFound, nowIso } from "../lib/http";
import { isValidDate, isValidTime, toIstIso } from "../lib/time";
import { id as idSchema, optText, optUrl, text } from "../lib/validate";

/** Upcoming events: any number can exist; the hero shows the visible ones as a slider, soonest first. */
export const MAX_EVENTS = 12;
interface Row { id: string; title: string; event_slug: string | null; event_date: string; start_time: string; venue: string | null; registration_url: string | null; cta_text: string; visible: number; created_at: string; updated_at: string }
export const shape = (r: Row) => ({
  id: r.id, title: r.title, eventSlug: r.event_slug, date: r.event_date, time: r.start_time, startsAt: toIstIso(r.event_date, r.start_time),
  venue: r.venue, registrationUrl: r.registration_url, ctaText: r.cta_text, visible: !!r.visible, createdAt: r.created_at, updatedAt: r.updated_at,
});
export const listEvents = async (env: Env) =>
  (await env.DB.prepare("SELECT * FROM upcoming_events ORDER BY event_date, start_time, created_at").all<Row>()).results;
const load = async (env: Env, id: string) => {
  const r = await env.DB.prepare("SELECT * FROM upcoming_events WHERE id = ?").bind(id).first<Row>();
  if (!r) throw notFound("Event not found");
  return r;
};

const schema = z.object({
  title: text(120),
  eventSlug: z.string().trim().max(80).regex(/^[a-z0-9-]*$/, "Lowercase letters, digits and dashes only").nullish().transform((v) => v || null),
  date: z.string().refine(isValidDate, "Enter a valid date (YYYY-MM-DD)"),
  time: z.string().refine(isValidTime, "Enter a valid time (HH:MM, 24-hour)"),
  venue: optText(160),
  registrationUrl: optUrl,
  ctaText: z.string().trim().min(1, "Required").max(40, "Max 40 characters").default("Participate now"),
  visible: z.boolean(),
});
const visibilityOnly = z.object({ visible: z.boolean() }).strict();

export const event = new Hono<AppEnv>();
event.get("/", async (c) => c.json({ items: (await listEvents(c.env)).map(shape) }));

event.post("/", async (c) => {
  const d = await body(c, schema);
  const n = (await c.env.DB.prepare("SELECT COUNT(*) n FROM upcoming_events").first<{ n: number }>())!.n;
  if (n >= MAX_EVENTS) throw new HttpError(400, "limit_reached", `You can keep up to ${MAX_EVENTS} events. Delete an old one first.`);
  const id = newId();
  try {
    await c.env.DB.prepare(
      `INSERT INTO upcoming_events (id, title, event_slug, event_date, start_time, venue, registration_url, cta_text, visible, updated_by)
       VALUES (?,?,?,?,?,?,?,?,?,?)`,
    ).bind(id, d.title, d.eventSlug, d.date, d.time, d.venue ?? null, d.registrationUrl ?? null, d.ctaText, d.visible ? 1 : 0, c.get("admin").id).run();
  } catch (e) { console.error(e); throw new HttpError(500, "db_error", "Could not save the event. Nothing was changed."); }
  return c.json({ item: shape(await load(c.env, id)) }, 201);
});

event.patch("/:id", async (c) => {
  const existing = await load(c.env, idSchema.parse(c.req.param("id")));
  // A body holding only `visible` is the show/hide toggle; anything else is a full edit validated field by field.
  const raw = await c.req.json().catch(() => null) as Record<string, unknown> | null;
  const toggle = !!raw && typeof raw === "object" && Object.keys(raw).length === 1 && "visible" in raw;
  const d = toggle ? { ...(await body(c, visibilityOnly)), title: undefined } : await body(c, schema);
  try {
    if (d.title === undefined) {   // visibility-only toggle: every other detail is kept
      await c.env.DB.prepare("UPDATE upcoming_events SET visible = ?, updated_at = ?, updated_by = ? WHERE id = ?").bind(d.visible ? 1 : 0, nowIso(), c.get("admin").id, existing.id).run();
    } else {
      await c.env.DB.prepare(
        `UPDATE upcoming_events SET title=?, event_slug=?, event_date=?, start_time=?, venue=?, registration_url=?, cta_text=?, visible=?, updated_at=?, updated_by=? WHERE id=?`,
      ).bind(d.title, d.eventSlug, d.date, d.time, d.venue ?? null, d.registrationUrl ?? null, d.ctaText, d.visible ? 1 : 0, nowIso(), c.get("admin").id, existing.id).run();
    }
  } catch (e) { console.error(e); throw new HttpError(500, "db_error", "Could not save the event. Nothing was changed."); }
  return c.json({ item: shape(await load(c.env, existing.id)) });
});

event.delete("/:id", async (c) => {
  const existing = await load(c.env, idSchema.parse(c.req.param("id")));
  await c.env.DB.prepare("DELETE FROM upcoming_events WHERE id = ?").bind(existing.id).run();
  return c.json({ ok: true });
});
