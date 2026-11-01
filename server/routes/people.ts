import { Hono } from "hono";
import { z, type ZodRawShape } from "zod";
import type { AppEnv } from "../env";
import { body, HttpError, newId, notFound, nowIso } from "../lib/http";
import { assertAttachable, mediaUrl, purgeMedia } from "../lib/media";
import { id as idSchema, reorder } from "../lib/validate";

interface Spec {
  table: "team_members" | "faculty";
  /** camelCase API field -> snake_case column, for plain text columns */
  columns: Record<string, string>;
  shape: ZodRawShape;
}
type Row = Record<string, unknown> & { id: string; object_key: string | null; photo_media_id: string | null; sort_order: number; visible: number; created_at: string; updated_at: string };

/** Shared CRUD for team members and faculty: both are "a person with a photo, an order and a visibility flag". */
export function peopleRoutes(spec: Spec) {
  const r = new Hono<AppEnv>();
  const { table, columns } = spec;
  const photo = { photoMediaId: idSchema.nullish(), visible: z.boolean().optional() };
  const createSchema = z.object({ ...spec.shape, ...photo });
  const patchSchema = z.object({ ...spec.shape, ...photo }).partial();

  const select = `SELECT t.*, m.object_key FROM ${table} t LEFT JOIN media m ON m.id = t.photo_media_id`;
  const shape = (row: Row) => ({
    id: row.id,
    ...Object.fromEntries(Object.entries(columns).map(([api, col]) => [api, row[col] ?? null])),
    visible: !!row.visible, sortOrder: row.sort_order,
    photoMediaId: row.photo_media_id, photoUrl: row.object_key ? mediaUrl(row.object_key) : null,
    createdAt: row.created_at, updatedAt: row.updated_at,
  });
  const load = async (c: { env: AppEnv["Bindings"] }, id: string) => {
    const row = await c.env.DB.prepare(`${select} WHERE t.id = ?`).bind(id).first<Row>();
    if (!row) throw notFound();
    return row;
  };

  r.get("/", async (c) => {
    const rows = (await c.env.DB.prepare(`${select} ORDER BY t.sort_order, t.created_at`).all<Row>()).results;
    return c.json({ items: rows.map(shape) });
  });

  r.post("/", async (c) => {
    const data = (await body(c, createSchema)) as Record<string, unknown>;
    if (data.photoMediaId) await assertAttachable(c.env, data.photoMediaId as string, "image");
    const id = newId();
    const cols = Object.values(columns);
    await c.env.DB.prepare(
      `INSERT INTO ${table} (id, ${cols.join(", ")}, photo_media_id, visible, sort_order)
       VALUES (?, ${cols.map(() => "?").join(", ")}, ?, ?, (SELECT COALESCE(MAX(sort_order), -1) + 1 FROM ${table}))`,
    ).bind(id, ...Object.keys(columns).map((k) => data[k] ?? null), data.photoMediaId ?? null, data.visible === false ? 0 : 1).run();
    return c.json({ item: shape(await load(c, id)) }, 201);
  });

  r.post("/reorder", async (c) => {
    const { ids } = await body(c, reorder);
    await c.env.DB.batch(ids.map((id, i) => c.env.DB.prepare(`UPDATE ${table} SET sort_order = ? WHERE id = ?`).bind(i, id)));
    return c.json({ ok: true });
  });

  r.patch("/:id", async (c) => {
    const existing = await load(c, c.req.param("id"));
    const data = (await body(c, patchSchema)) as Record<string, unknown>;
    const sets: string[] = []; const vals: unknown[] = [];
    for (const [api, col] of Object.entries(columns)) if (data[api] !== undefined) { sets.push(`${col} = ?`); vals.push(data[api]); }
    if (data.visible !== undefined) { sets.push("visible = ?"); vals.push(data.visible ? 1 : 0); }
    let oldPhoto: string | null = null;
    if (data.photoMediaId !== undefined && data.photoMediaId !== existing.photo_media_id) {
      if (data.photoMediaId) await assertAttachable(c.env, data.photoMediaId as string, "image", table, existing.id);
      sets.push("photo_media_id = ?"); vals.push(data.photoMediaId ?? null);
      oldPhoto = existing.photo_media_id;
    }
    if (!sets.length) throw new HttpError(400, "invalid_request", "Nothing to update.");
    await c.env.DB.prepare(`UPDATE ${table} SET ${sets.join(", ")}, updated_at = ? WHERE id = ?`).bind(...vals, nowIso(), existing.id).run();
    await purgeMedia(c.env, [oldPhoto]);
    return c.json({ item: shape(await load(c, existing.id)) });
  });

  r.delete("/:id", async (c) => {
    const existing = await load(c, c.req.param("id"));
    await c.env.DB.prepare(`DELETE FROM ${table} WHERE id = ?`).bind(existing.id).run();
    await purgeMedia(c.env, [existing.photo_media_id]);
    return c.json({ ok: true });
  });

  return { admin: r, shape, select };
}
