import { Hono } from "hono";
import { z } from "zod";
import type { AppEnv, Env } from "../env";
import { body, HttpError, newId, notFound, nowIso } from "../lib/http";
import { assertAttachable, mediaUrl, purgeMedia } from "../lib/media";
import { id as idSchema, optText, reorder, text } from "../lib/validate";

export const SELECT = `SELECT g.*, c.name AS category_name, m.object_key, m.content_type, m.size_bytes, tm.object_key AS thumb_key
  FROM gallery_items g
  JOIN gallery_categories c ON c.id = g.category_id
  JOIN media m ON m.id = g.media_id
  LEFT JOIN media tm ON tm.id = g.thumb_media_id`;
type Row = { id: string; title: string; caption: string | null; category_id: string; category_name: string; media_id: string; thumb_media_id: string | null; kind: "image" | "video";
  width: number; height: number; sort_order: number; visible: number; object_key: string; content_type: string; size_bytes: number; thumb_key: string | null; created_at: string; updated_at: string };
export const shape = (r: Row) => ({
  id: r.id, title: r.title, caption: r.caption, categoryId: r.category_id, category: r.category_name, kind: r.kind,
  mediaId: r.media_id, thumbMediaId: r.thumb_media_id, src: mediaUrl(r.object_key), thumb: r.thumb_key ? mediaUrl(r.thumb_key) : null,
  contentType: r.content_type, sizeBytes: r.size_bytes, width: r.width, height: r.height,
  visible: !!r.visible, sortOrder: r.sort_order, createdAt: r.created_at, updatedAt: r.updated_at,
});

const item = z.object({ title: text(160), caption: optText(600), categoryId: idSchema, mediaId: idSchema, thumbMediaId: idSchema.nullish(), visible: z.boolean().optional() });

async function dims(env: Env, mediaId: string) {
  const m = await env.DB.prepare("SELECT kind, width, height FROM media WHERE id = ?").bind(mediaId).first<{ kind: "image" | "video"; width: number | null; height: number | null }>();
  return { kind: m!.kind, width: m!.width || 800, height: m!.height || 600 };
}
async function assertCategory(env: Env, id: string) {
  if (!(await env.DB.prepare("SELECT 1 AS x FROM gallery_categories WHERE id = ?").bind(id).first())) throw new HttpError(422, "bad_category", "That category does not exist.");
}

export const gallery = new Hono<AppEnv>();

gallery.get("/", async (c) => {
  const rows = (await c.env.DB.prepare(`${SELECT} ORDER BY g.sort_order, g.created_at DESC`).all<Row>()).results;
  const cats = (await c.env.DB.prepare("SELECT id, name, sort_order FROM gallery_categories ORDER BY sort_order, name").all<{ id: string; name: string; sort_order: number }>()).results;
  return c.json({ items: rows.map(shape), categories: cats.map((x) => ({ id: x.id, name: x.name, sortOrder: x.sort_order })) });
});

/** Create one or many items from files that were already uploaded. Items keep the order they are sent in. */
gallery.post("/", async (c) => {
  const { items } = await body(c, z.object({ items: z.array(item).min(1).max(50) }));
  const seen = new Set<string>();
  for (const it of items) {
    for (const mid of [it.mediaId, it.thumbMediaId].filter(Boolean) as string[]) { if (seen.has(mid)) throw new HttpError(422, "bad_media", "A file was used twice."); seen.add(mid); }
    await assertCategory(c.env, it.categoryId);
    const d = await dims(c.env, it.mediaId).catch(() => null);
    if (!d) throw new HttpError(422, "bad_media", "An upload is missing.");
    await assertAttachable(c.env, it.mediaId, d.kind);
    if (it.thumbMediaId) await assertAttachable(c.env, it.thumbMediaId, "image");
  }
  const min = (await c.env.DB.prepare("SELECT COALESCE(MIN(sort_order), 0) AS m FROM gallery_items").first<{ m: number }>())!.m;
  const ids: string[] = [];
  const stmts = [];
  for (const [i, it] of items.entries()) {
    const d = await dims(c.env, it.mediaId);
    const id = newId(); ids.push(id);
    stmts.push(c.env.DB.prepare(
      `INSERT INTO gallery_items (id, title, caption, category_id, media_id, thumb_media_id, kind, width, height, sort_order, visible) VALUES (?,?,?,?,?,?,?,?,?,?,?)`,
    ).bind(id, it.title, it.caption ?? null, it.categoryId, it.mediaId, it.thumbMediaId ?? null, d.kind, d.width, d.height, min - items.length + i, it.visible === false ? 0 : 1));
  }
  await c.env.DB.batch(stmts);
  const rows = (await c.env.DB.prepare(`${SELECT} WHERE g.id IN (${ids.map(() => "?").join(",")}) ORDER BY g.sort_order`).bind(...ids).all<Row>()).results;
  return c.json({ items: rows.map(shape) }, 201);
});

gallery.post("/reorder", async (c) => {
  const { ids } = await body(c, reorder);
  await c.env.DB.batch(ids.map((id, i) => c.env.DB.prepare("UPDATE gallery_items SET sort_order = ? WHERE id = ?").bind(i, id)));
  return c.json({ ok: true });
});

gallery.patch("/:id", async (c) => {
  const id = c.req.param("id");
  const cur = await c.env.DB.prepare("SELECT * FROM gallery_items WHERE id = ?").bind(id).first<Row>();
  if (!cur) throw notFound();
  const d = await body(c, item.partial());
  const sets: string[] = []; const vals: unknown[] = []; const toPurge: (string | null)[] = [];
  if (d.title !== undefined) { sets.push("title = ?"); vals.push(d.title); }
  if (d.caption !== undefined) { sets.push("caption = ?"); vals.push(d.caption); }
  if (d.visible !== undefined) { sets.push("visible = ?"); vals.push(d.visible ? 1 : 0); }
  if (d.categoryId !== undefined) { await assertCategory(c.env, d.categoryId); sets.push("category_id = ?"); vals.push(d.categoryId); }
  if (d.mediaId !== undefined && d.mediaId !== cur.media_id) {           // replacement media
    const dm = await dims(c.env, d.mediaId).catch(() => null);
    if (!dm) throw new HttpError(422, "bad_media", "The replacement upload is missing.");
    await assertAttachable(c.env, d.mediaId, dm.kind, "gallery_items", id);
    sets.push("media_id = ?", "kind = ?", "width = ?", "height = ?"); vals.push(d.mediaId, dm.kind, dm.width, dm.height);
    toPurge.push(cur.media_id);
    if (d.thumbMediaId === undefined && cur.thumb_media_id) { sets.push("thumb_media_id = NULL"); toPurge.push(cur.thumb_media_id); } // old thumbnail no longer matches
  }
  if (d.thumbMediaId !== undefined && d.thumbMediaId !== cur.thumb_media_id) {
    if (d.thumbMediaId) await assertAttachable(c.env, d.thumbMediaId, "image", "gallery_items", id);
    sets.push("thumb_media_id = ?"); vals.push(d.thumbMediaId ?? null);
    toPurge.push(cur.thumb_media_id);
  }
  if (!sets.length) throw new HttpError(400, "invalid_request", "Nothing to update.");
  await c.env.DB.prepare(`UPDATE gallery_items SET ${sets.join(", ")}, updated_at = ? WHERE id = ?`).bind(...vals, nowIso(), id).run();
  await purgeMedia(c.env, toPurge);
  return c.json({ item: shape((await c.env.DB.prepare(`${SELECT} WHERE g.id = ?`).bind(id).first<Row>())!) });
});

gallery.delete("/:id", async (c) => {
  const id = c.req.param("id");
  const cur = await c.env.DB.prepare("SELECT media_id, thumb_media_id FROM gallery_items WHERE id = ?").bind(id).first<{ media_id: string; thumb_media_id: string | null }>();
  if (!cur) throw notFound();
  await c.env.DB.prepare("DELETE FROM gallery_items WHERE id = ?").bind(id).run();
  await purgeMedia(c.env, [cur.media_id, cur.thumb_media_id]);
  return c.json({ ok: true });
});

export const categories = new Hono<AppEnv>();
const catName = z.object({ name: text(40) });
const dup = (e: unknown) => String(e).includes("UNIQUE") ? new HttpError(409, "duplicate", "A category with that name already exists.", { name: "Already exists" }) : e;

categories.post("/", async (c) => {
  const { name } = await body(c, catName);
  const id = newId();
  try { await c.env.DB.prepare("INSERT INTO gallery_categories (id, name, sort_order) VALUES (?,?,(SELECT COALESCE(MAX(sort_order),-1)+1 FROM gallery_categories))").bind(id, name).run(); }
  catch (e) { throw dup(e); }
  return c.json({ category: { id, name } }, 201);
});
categories.patch("/:id", async (c) => {
  const { name } = await body(c, catName);
  const current = await c.env.DB.prepare("SELECT name FROM gallery_categories WHERE id = ?").bind(c.req.param("id")).first<{ name: string }>();
  if (!current) throw notFound();
  if (current.name.trim().toLocaleLowerCase() === "recap" && name.trim().toLocaleLowerCase() !== "recap") {
    throw new HttpError(409, "reserved_category", "The Recap category is reserved for gallery recap media and cannot be renamed.");
  }
  try {
    const r = await c.env.DB.prepare("UPDATE gallery_categories SET name = ? WHERE id = ?").bind(name, c.req.param("id")).run();
    if (!r.meta.changes) throw notFound();
  } catch (e) { throw dup(e); }
  return c.json({ ok: true });
});
categories.delete("/:id", async (c) => {
  const id = c.req.param("id");
  const current = await c.env.DB.prepare("SELECT name FROM gallery_categories WHERE id = ?").bind(id).first<{ name: string }>();
  if (!current) throw notFound();
  if (current.name.trim().toLocaleLowerCase() === "recap") {
    throw new HttpError(409, "reserved_category", "The Recap category is reserved for recap media and cannot be deleted.");
  }
  const n = (await c.env.DB.prepare("SELECT COUNT(*) AS n FROM gallery_items WHERE category_id = ?").bind(id).first<{ n: number }>())!.n;
  if (n) throw new HttpError(409, "category_in_use", `${n} gallery item(s) still use this category. Move them first.`);
  const r = await c.env.DB.prepare("DELETE FROM gallery_categories WHERE id = ?").bind(id).run();
  if (!r.meta.changes) throw notFound();
  return c.json({ ok: true });
});
