import type { Env } from "../env";
import { HttpError, newId, nowSec } from "./http";
import { cdnUrl, deleteFile, findByPath } from "./imagekit";
import { rateHit } from "./auth";

export const TYPES: Record<string, { kind: "image" | "video"; ext: string }> = {
  "image/jpeg": { kind: "image", ext: "jpg" },
  "image/png": { kind: "image", ext: "png" },
  "image/webp": { kind: "image", ext: "webp" },
  "video/mp4": { kind: "video", ext: "mp4" },
  "video/webm": { kind: "video", ext: "webm" },
};
/** Public ImageKit URL of a stored file. The endpoint is the same for every request, so it is kept at module level. */
let endpoint = "";
export const setMediaEndpoint = (env: Env) => { endpoint = env.IMAGEKIT_URL_ENDPOINT; };
export const mediaUrl = (key: string) => cdnUrl({ IMAGEKIT_URL_ENDPOINT: endpoint }, key);
export const limitBytes = (env: Env, kind: "image" | "video") =>
  Math.max(1, Number(kind === "image" ? env.MAX_IMAGE_MB ?? 10 : env.MAX_VIDEO_MB ?? 100)) * 1024 * 1024;

/** Check the real file signature so a renamed file cannot masquerade as an image or video. */
export function sniff(bytes: Uint8Array, contentType: string): boolean {
  const s = (o: number, str: string) => [...str].every((c, i) => bytes[o + i] === c.charCodeAt(0));
  switch (contentType) {
    case "image/jpeg": return bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff;
    case "image/png": return bytes[0] === 0x89 && s(1, "PNG");
    case "image/webp": return s(0, "RIFF") && s(8, "WEBP");
    case "video/mp4": return s(4, "ftyp");
    case "video/webm": return bytes[0] === 0x1a && bytes[1] === 0x45 && bytes[2] === 0xdf && bytes[3] === 0xa3;
    default: return false;
  }
}
export function newKey(contentType: string, purpose: string) {
  const d = new Date();
  return `${purpose}/${d.getUTCFullYear()}/${String(d.getUTCMonth() + 1).padStart(2, "0")}/${newId()}.${TYPES[contentType].ext}`;
}

/** Make sure a media row can be attached to a record: ready, right kind, and not already used elsewhere. */
export async function assertAttachable(env: Env, mediaId: string, kind: "image" | "video", exceptTable?: string, exceptId?: string) {
  const m = await env.DB.prepare("SELECT id, kind, status FROM media WHERE id = ?").bind(mediaId).first<{ id: string; kind: string; status: string }>();
  if (!m || m.status !== "ready") throw new HttpError(422, "bad_media", "That upload is missing or not finished. Please upload it again.");
  if (m.kind !== kind) throw new HttpError(422, "bad_media", `Expected a ${kind} file.`);
  const used = await env.DB.prepare(
    `SELECT 1 AS x FROM team_members WHERE photo_media_id = ?1 AND NOT (?2 = 'team_members' AND id = ?3)
     UNION ALL SELECT 1 FROM faculty WHERE photo_media_id = ?1 AND NOT (?2 = 'faculty' AND id = ?3)
     UNION ALL SELECT 1 FROM gallery_items WHERE (media_id = ?1 OR thumb_media_id = ?1) AND NOT (?2 = 'gallery_items' AND id = ?3) LIMIT 1`,
  ).bind(mediaId, exceptTable ?? "", exceptId ?? "").first();
  if (used) throw new HttpError(409, "media_in_use", "That file is already used by another record.");
}

/** Remove a file from ImageKit: by its stored id, or (for uploads we never got an id for) by looking it up by path. */
export async function removeRemote(env: Env, key: string, fileId: string | null) {
  const id = fileId ?? (await findByPath(env, key))?.fileId;
  if (id) await deleteFile(env, id);
}

/** Queue files for removal and delete them. Anything that fails stays 'deleting' and is retried by the next cleanup. */
export async function purgeMedia(env: Env, ids: (string | null | undefined)[]) {
  const list = [...new Set(ids.filter((x): x is string => !!x))];
  if (!list.length) return;
  const q = list.map(() => "?").join(",");
  await env.DB.prepare(`UPDATE media SET status='deleting', updated_at=? WHERE id IN (${q})`).bind(nowSec(), ...list).run();
  const rows = (await env.DB.prepare(`SELECT id, object_key, provider_file_id FROM media WHERE id IN (${q})`).bind(...list).all<{ id: string; object_key: string; provider_file_id: string | null }>()).results;
  for (const r of rows) {
    try { await removeRemote(env, r.object_key, r.provider_file_id); await env.DB.prepare("DELETE FROM media WHERE id = ?").bind(r.id).run(); }
    catch (e) { console.error("ImageKit delete failed, will retry in cleanup", r.object_key, e); }
  }
}

/**
 * Pages Functions have no cron triggers, so cleanup piggybacks on admin activity: at most once every 6 hours
 * (the counter lives in D1), it runs after the response is sent. Call as `maybeCleanup(env, c.executionCtx)`.
 */
export async function maybeCleanup(env: Env, ctx: { waitUntil(p: Promise<unknown>): void }) {
  try {
    const hit = await rateHit(env, "cleanup:last", 6 * 3600);
    if (hit.count === 1) ctx.waitUntil(cleanupMedia(env).catch((e) => console.error("cleanup failed", e)));
  } catch (e) { console.error("cleanup scheduling failed", e); }
}

/** Maintenance: abandoned uploads, never-attached files, and deletions that previously failed. */
export async function cleanupMedia(env: Env) {
  const now = nowSec();
  const stale = await env.DB.prepare(
    `SELECT id FROM media WHERE status = 'deleting'
       OR (status = 'pending' AND created_at < ?1)
       OR (status = 'ready' AND created_at < ?2
           AND NOT EXISTS (SELECT 1 FROM team_members t WHERE t.photo_media_id = media.id)
           AND NOT EXISTS (SELECT 1 FROM faculty f WHERE f.photo_media_id = media.id)
           AND NOT EXISTS (SELECT 1 FROM gallery_items g WHERE g.media_id = media.id OR g.thumb_media_id = media.id))`,
  ).bind(now - 2 * 3600, now - 6 * 3600).all<{ id: string }>();
  await purgeMedia(env, stale.results.map((r) => r.id));
  await env.DB.prepare("DELETE FROM sessions WHERE expires_at < ?").bind(now).run();
  await env.DB.prepare("DELETE FROM rate_limits WHERE window_start < ?").bind(now - 86400).run();
  return stale.results.length;
}
