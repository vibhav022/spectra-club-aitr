import { Hono } from "hono";
import type { AppEnv } from "../env";
import { mediaUrl } from "../lib/media";
import { listEvents, shape as eventShape } from "./event";
import { team } from "./team";
import { faculty } from "./faculty";
import { SELECT as GALLERY_SELECT, shape as galleryShape } from "./gallery";

export const publicApi = new Hono<AppEnv>();
// Always revalidate: a saved change must show on the next page refresh.
publicApi.use("*", async (c, next) => { await next(); c.header("Cache-Control", "no-store"); });

publicApi.get("/team", async (c) => {
  const rows = (await c.env.DB.prepare(`${team.select} WHERE t.visible = 1 ORDER BY t.sort_order, t.created_at`).all<Record<string, unknown> & { object_key: string | null }>()).results;
    return c.json({ items: rows.map((r) => ({ id: r.id, name: r.name, role: r.role, tier: r.tier, instagram: r.instagram, linkedin: r.linkedin ?? null, bio: r.bio ?? null, specialization: r.specialization ?? null, contributions: r.contributions ?? null, photo: r.object_key ? mediaUrl(r.object_key) : null })) });
});
publicApi.get("/faculty", async (c) => {
  const rows = (await c.env.DB.prepare(`${faculty.select} WHERE t.visible = 1 ORDER BY t.sort_order, t.created_at`).all<Record<string, unknown> & { object_key: string | null }>()).results;
  return c.json({ items: rows.map((r) => ({ id: r.id, name: r.name, role: r.designation, department: r.department, tier: "faculty", photo: r.object_key ? mediaUrl(r.object_key) : null })) });
});
publicApi.get("/gallery", async (c) => {
  const eventSlug = c.req.query("event");

  const rows = (
    await c.env.DB.prepare(`
      ${GALLERY_SELECT}
      LEFT JOIN site_events e ON e.id = g.event_id
      WHERE g.visible = 1
      ${eventSlug ? "AND e.slug = ?" : ""}
      ORDER BY g.sort_order, g.created_at DESC
    `)
      .bind(...(eventSlug ? [eventSlug] : []))
      .all<Parameters<typeof galleryShape>[0]>()
  ).results;

  const cats = (
    await c.env.DB.prepare(
      "SELECT name FROM gallery_categories ORDER BY sort_order, name",
    ).all<{ name: string }>()
  ).results;

  return c.json({
    categories: cats.map((x) => x.name),
    items: rows.map((r) => {
      const s = galleryShape(r);
      return {
        id: s.id,
        title: s.title,
        caption: s.caption,
        category: s.category,
        kind: s.kind,
        src: s.src,
        thumb: s.thumb,
        width: s.width,
        height: s.height,
      };
    }),
  });
});
/** Visible upcoming events, soonest first. An event drops off 24 h after it starts (same rule as the website card). */
publicApi.get("/next-events", async (c) => {
  const cutoff = Date.now() - 864e5;
  const events = (await listEvents(c.env)).filter((r) => r.visible).map(eventShape)
    .filter((e) => new Date(e.startsAt).getTime() > cutoff)
    .map((e) => ({ id: e.id, title: e.title, slug: e.eventSlug, startsAt: e.startsAt, venue: e.venue, registrationUrl: e.registrationUrl, ctaText: e.ctaText }));
  return c.json({ events });
});
publicApi.get("/counts", async (c) => {
  const n = async (sql: string) => (await c.env.DB.prepare(sql).first<{ n: number }>())!.n;
  return c.json({
    team: (await n("SELECT COUNT(*) n FROM team_members WHERE visible = 1")) + (await n("SELECT COUNT(*) n FROM faculty WHERE visible = 1")),
    gallery: await n("SELECT COUNT(*) n FROM gallery_items WHERE visible = 1"),
  });
});
