
import { Hono } from "hono";
import { z } from "zod";

import type { AppEnv, Env } from "../env";
import { body, HttpError, newId, notFound, nowIso } from "../lib/http";
import { assertAttachable, mediaUrl, purgeMedia } from "../lib/media";
import { isValidDate } from "../lib/time";
import { optText, optUrl, text } from "../lib/validate";

interface EventRow {
  id: string;
  parent_event_id: string | null;
  slug: string;
  title: string;
  category: string;
  description: string;
  event_year: number | null;
  event_date: string | null;
  venue: string | null;
  instagram_url: string | null;
  highlights_json: string;
  wash: "magenta" | "blue" | "teal" | "green";
  poster_media_id: string | null;
  video_media_id: string | null;
  visible: number;
  sort_order: number;
  created_at: string;
  updated_at: string;
  poster_key: string | null;
  video_key: string | null;
}

const SELECT = `
  SELECT
    e.*,
    p.object_key AS poster_key,
    v.object_key AS video_key
  FROM site_events e
  LEFT JOIN media p ON p.id = e.poster_media_id
  LEFT JOIN media v ON v.id = e.video_media_id
`;

function parseHighlights(value: string): string[] {
  try {
    const parsed: unknown = JSON.parse(value);
    return Array.isArray(parsed)
      ? parsed.filter((x): x is string => typeof x === "string")
      : [];
  } catch {
    return [];
  }
}

export function shapeEvent(r: EventRow) {
  return {
    id: r.id,
    parentEventId: r.parent_event_id,
    slug: r.slug,
    title: r.title,
    category: r.category,
    description: r.description,
    year: r.event_year,
    date: r.event_date,
    venue: r.venue,
    instagramUrl: r.instagram_url,
    highlights: parseHighlights(r.highlights_json),
    wash: r.wash,
    posterMediaId: r.poster_media_id,
    videoMediaId: r.video_media_id,
    image: r.poster_key ? mediaUrl(r.poster_key) : null,
    video: r.video_key ? mediaUrl(r.video_key) : null,
    visible: Boolean(r.visible),
    sortOrder: r.sort_order,
    createdAt: r.created_at,
    updatedAt: r.updated_at,
  };
}

/** Public data does not expose administrative media IDs or visibility controls. */
function publicShape(r: EventRow) {
  const e = shapeEvent(r);

  return {
    slug: e.slug,
    parentEventId: e.parentEventId,
    title: e.title,
    category: e.category,
    description: e.description,
    year: e.year ?? undefined,
    date: e.date ?? undefined,
    venue: e.venue ?? undefined,
    instagramUrl: e.instagramUrl ?? undefined,
    highlights: e.highlights,
    wash: e.wash,
    image: e.image ?? undefined,
    video: e.video ?? undefined,
  };
}

// const categories = [
//   "Cultural",
//   "Community / Outreach",
//   "Club Onboarding",
//   "Tech",
//   "Sports",
//   "Literary",
// ] as const;

const schema = z.object({
  slug: z.string()
    .trim()
    .min(1, "Slug is required")
    .max(120)
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Use lowercase letters, numbers and dashes"),

  title: text(120),

  category: text(80),

  description: text(3000),

  year: z.number().int().min(1900).max(2100).nullable().optional(),

  date: optText(10).refine(
    (v) => v == null || isValidDate(v),
    "Enter a valid date (YYYY-MM-DD)",
  ),

  venue: optText(160),

  instagramUrl: optUrl,

  highlights: z.array(
    z.string().trim().min(1).max(100),
  ).max(20).default([]),

  wash: z.enum(["magenta", "blue", "teal", "green"]).default("teal"),

  posterMediaId: z.string().trim().min(1).max(80).nullable().optional(),

  videoMediaId: z.string().trim().min(1).max(80).nullable().optional(),

    visible: z.boolean().default(false),

  parentEventId: z.string().trim().min(1).max(80).nullable().optional(),
});
 

const visibilitySchema = z.object({
  visible: z.boolean(),
}).strict();

const duplicateError = (e: unknown) => {
  if (String(e).includes("UNIQUE")) {
    return new HttpError(
      409,
      "duplicate_slug",
      "An event with this URL slug already exists.",
      { slug: "This slug is already in use." },
    );
  }

  return new HttpError(
    500,
    "db_error",
    "Could not save the event. Nothing was changed.",
  );
};

async function load(env: Env, id: string) {
  const row = await env.DB.prepare(
    `${SELECT} WHERE e.id = ?`,
  ).bind(id).first<EventRow>();

  if (!row) throw notFound("Event not found.");

  return row;
}

async function assertEventMedia(
  env: Env,
  posterMediaId: string | null | undefined,
  videoMediaId: string | null | undefined,
  exceptId?: string,
) {
  if (
    posterMediaId &&
    videoMediaId &&
    posterMediaId === videoMediaId
  ) {
    throw new HttpError(
      422,
      "bad_media",
      "Poster and event video must be different files.",
    );
  }

  if (posterMediaId) {
    await assertAttachable(
      env,
      posterMediaId,
      "image",
      "site_events",
      exceptId,
    );
  }

  if (videoMediaId) {
    await assertAttachable(
      env,
      videoMediaId,
      "video",
      "site_events",
      exceptId,
    );
  }
}

async function assertParentEvent(
  env: Env,
  parentEventId: string | null | undefined,
  currentEventId?: string,
) {
  if (!parentEventId) return;

  if (parentEventId === currentEventId) {
    throw new HttpError(
      422,
      "bad_parent",
      "An event cannot be its own parent.",
    );
  }

  const parent = await env.DB.prepare(`
    SELECT id, parent_event_id
    FROM site_events
    WHERE id = ?
  `).bind(parentEventId).first<{
    id: string;
    parent_event_id: string | null;
  }>();

  if (!parent) {
    throw new HttpError(
      422,
      "bad_parent",
      "The selected parent event does not exist.",
    );
  }

  if (parent.parent_event_id) {
    throw new HttpError(
      422,
      "bad_parent",
      "Sub-events cannot have another parent event.",
    );
  }
}








/* ---------------- ADMIN API ---------------- */

export const catalogueEvents = new Hono<AppEnv>();

// List all events, including hidden events.
catalogueEvents.get("/", async (c) => {
  const rows = (
    await c.env.DB.prepare(
      `${SELECT} ORDER BY e.sort_order, e.created_at DESC`,
    ).all<EventRow>()
  ).results;

  return c.json({ items: rows.map(shapeEvent) });
});

// Create a new catalogue event.
catalogueEvents.post("/", async (c) => {
  const d = await body(c, schema);

  await assertEventMedia(
    c.env,
    d.posterMediaId,
    d.videoMediaId,
  );
    await assertParentEvent(c.env, d.parentEventId);

  const id = newId();

  try {
    await c.env.DB.prepare(`
            INSERT INTO site_events (
        id, slug, title, category, description,
        event_year, event_date, venue, instagram_url,
        highlights_json, wash,
        poster_media_id, video_media_id,
        visible, sort_order, parent_event_id
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?,
        (SELECT COALESCE(MAX(sort_order), -1) + 1 FROM site_events),
        ?
      )
    `).bind(
      id,
      d.slug,
      d.title,
      d.category,
      d.description,
      d.year ?? null,
      d.date ?? null,
      d.venue ?? null,
      d.instagramUrl ?? null,
      JSON.stringify(d.highlights),
      d.wash,
      d.posterMediaId ?? null,
      d.videoMediaId ?? null,
      d.visible ? 1 : 0,
      d.parentEventId ?? null,
    ).run();
  } catch (e) {
    throw duplicateError(e);
  }

  return c.json({
    item: shapeEvent(await load(c.env, id)),
  }, 201);
});

// Edit an existing event or change only its visibility.
catalogueEvents.patch("/:id", async (c) => {
  const id = c.req.param("id");
  const existing = await load(c.env, id);

  const raw = await c.req.json().catch(() => null) as
    Record<string, unknown> | null;

  const visibilityOnly =
    !!raw &&
    Object.keys(raw).length === 1 &&
    "visible" in raw;

  if (visibilityOnly) {
    const d = await body(c, visibilitySchema);

    await c.env.DB.prepare(`
      UPDATE site_events
      SET visible = ?, updated_at = ?
      WHERE id = ?
    `).bind(
      d.visible ? 1 : 0,
      nowIso(),
      id,
    ).run();

    return c.json({
      item: shapeEvent(await load(c.env, id)),
    });
  }

  const d = await body(c, schema);

  await assertEventMedia(
    c.env,
    d.posterMediaId,
    d.videoMediaId,
    id,
  );
    await assertParentEvent(c.env, d.parentEventId, id);

  try {
    await c.env.DB.prepare(`
      UPDATE site_events SET
        slug = ?,
        title = ?,
        category = ?,
        description = ?,
        event_year = ?,
        event_date = ?,
        venue = ?,
        instagram_url = ?,
        highlights_json = ?,
        wash = ?,
        poster_media_id = ?,
        video_media_id = ?,
        visible = ?,
        parent_event_id = ?,
        updated_at = ?
      WHERE id = ?
    `).bind(
      d.slug,
      d.title,
      d.category,
      d.description,
      d.year ?? null,
      d.date ?? null,
      d.venue ?? null,
      d.instagramUrl ?? null,
      JSON.stringify(d.highlights),
      d.wash,
      d.posterMediaId ?? null,
      d.videoMediaId ?? null,
      d.visible ? 1 : 0,
      d.parentEventId ?? null,
      nowIso(),
      id,
    ).run();
  } catch (e) {
    throw duplicateError(e);
  }

  // Remove replaced media only after the database update succeeds.
  const oldMedia = [
    existing.poster_media_id !== d.posterMediaId
      ? existing.poster_media_id
      : null,
    existing.video_media_id !== d.videoMediaId
      ? existing.video_media_id
      : null,
  ];

  await purgeMedia(c.env, oldMedia);

  return c.json({
    item: shapeEvent(await load(c.env, id)),
  });
});

// Permanently delete an event and its attached media.
catalogueEvents.delete("/:id", async (c) => {
  const id = c.req.param("id");
  const existing = await load(c.env, id);

  await c.env.DB.prepare(
    "DELETE FROM site_events WHERE id = ?",
  ).bind(id).run();

  await purgeMedia(c.env, [
    existing.poster_media_id,
    existing.video_media_id,
  ]);

  return c.json({ ok: true });
});

/* ---------------- PUBLIC API ---------------- */

export const publicCatalogueEvents = new Hono<AppEnv>();

// Public visitors only receive published events.
publicCatalogueEvents.get("/", async (c) => {
  const rows = (
    await c.env.DB.prepare(`
      ${SELECT}
      WHERE e.visible = 1
      ORDER BY e.sort_order, e.created_at DESC
    `).all<EventRow>()
  ).results;

  return c.json({
    items: rows.map(publicShape),
  });
});

// Fetch one published event by its slug.
// Fetch one published event and its published sub-events.
publicCatalogueEvents.get("/:slug", async (c) => {
  const row = await c.env.DB.prepare(`
    ${SELECT}
    WHERE e.slug = ? AND e.visible = 1
  `).bind(c.req.param("slug")).first<EventRow>();

  if (!row) throw notFound("Event not found.");

  const children = (
    await c.env.DB.prepare(`
      ${SELECT}
      WHERE e.parent_event_id = ?
        AND e.visible = 1
      ORDER BY e.sort_order, e.created_at DESC
    `).bind(row.id).all<EventRow>()
  ).results;

  return c.json({
    item: {
      ...publicShape(row),
      subEvents: children.map(publicShape),
    },
  });
});