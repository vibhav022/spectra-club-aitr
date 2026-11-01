import { Hono } from "hono";
import { z } from "zod";
import type { AppEnv, Env } from "../env";
import { body, HttpError, nowSec, newId } from "../lib/http";
import { limitBytes, newKey, removeRemote, sniff, TYPES } from "../lib/media";
import { cdnUrl, deleteFile, fileNameOf, folderOf, firstBytes, getFile, pathOf, uploadUrl, uploadAuth } from "../lib/imagekit";

export const uploads = new Hono<AppEnv>();

const init = z.object({
  filename: z.string().trim().max(200).default("upload"),
  contentType: z.string().refine((t) => t in TYPES, "Unsupported file type. Use JPEG, PNG, WebP, MP4 or WebM."),
  size: z.number().int().positive(),
  purpose: z.enum(["gallery", "photo", "thumb"]),
  width: z.number().int().min(1).max(20000).optional(),
  height: z.number().int().min(1).max(20000).optional(),
});

/**
 * Step 1: validate the request on the server, reserve a storage key and sign a one-off ImageKit upload.
 * The browser then sends the bytes straight to ImageKit (they never pass through this API, so there is no body-size limit here).
 */
uploads.post("/", async (c) => {
  const d = await body(c, init);
  const kind = TYPES[d.contentType].kind;
  if (d.purpose !== "gallery" && kind !== "image") throw new HttpError(422, "bad_type", "Photos and thumbnails must be images.");
  const max = limitBytes(c.env, kind);
  if (d.size > max) throw new HttpError(413, "too_large", `${kind === "image" ? "Images" : "Videos"} can be at most ${Math.round(max / 1048576)} MB.`);
  const id = newId(); const key = newKey(d.contentType, d.purpose); const now = nowSec();
  await c.env.DB.prepare(
    `INSERT INTO media (id, object_key, kind, content_type, declared_size, width, height, original_name, status, created_by, created_at, updated_at)
     VALUES (?,?,?,?,?,?,?,?, 'pending', ?,?,?)`,
  ).bind(id, key, kind, d.contentType, d.size, d.width ?? null, d.height ?? null, d.filename, c.get("admin").id, now, now).run();

  const auth = await uploadAuth(c.env);
  return c.json({
    id, url: uploadUrl(c.env),
    // Sent by the browser as multipart form fields (the file itself goes in the "file" field).
    fields: { publicKey: auth.publicKey, signature: auth.signature, expire: String(auth.expire), token: auth.token,
      fileName: fileNameOf(key), folder: folderOf(key), useUniqueFileName: "false", overwriteFile: "false" },
  }, 201);
});

async function pending(c: { env: Env; get: (k: "admin") => { id: string } }, id: string) {
  const m = await c.env.DB.prepare("SELECT * FROM media WHERE id = ? AND status = 'pending'").bind(id).first<{ id: string; object_key: string; kind: "image" | "video"; content_type: string; declared_size: number; width: number | null; height: number | null; created_by: string }>();
  if (!m || m.created_by !== c.get("admin").id) throw new HttpError(404, "not_found", "Upload not found or already completed.");
  return m;
}

/**
 * Step 2: the browser reports the ImageKit fileId. We do NOT trust it: the file is looked up at ImageKit and must sit at the exact
 * path we reserved, have the declared size, and start with the right file signature. Only then is it marked ready.
 */
uploads.post("/:id/complete", async (c) => {
  const m = await pending(c, c.req.param("id"));
  const { fileId } = await body(c, z.object({ fileId: z.string().min(6).max(64) }));
  const bad = async (status: number, code: string, msg: string, remoteId?: string) => {
    await discard(c.env, m.id, m.object_key, remoteId ?? null); throw new HttpError(status, code, msg);
  };
  const file = await getFile(c.env, fileId).catch(() => null);
  if (!file) return bad(422, "missing", "The file did not arrive in storage. Please upload it again.");
  if (file.filePath !== pathOf(m.object_key)) return bad(422, "bad_file", "Uploaded file does not match this upload.");
  if (file.size !== m.declared_size || file.size > limitBytes(c.env, m.kind)) return bad(422, "bad_length", "Uploaded file size is wrong or over the limit.", file.fileId);
  let bytes: Uint8Array;
  try { bytes = await firstBytes(cdnUrl(c.env, m.object_key)); } catch { return bad(502, "storage_error", "Could not verify the uploaded file. Please try again.", file.fileId); }
  if (!sniff(bytes, m.content_type)) return bad(422, "bad_file", `That file is not a valid ${m.content_type}.`, file.fileId);
  await c.env.DB.prepare("UPDATE media SET status = 'ready', size_bytes = ?, provider_file_id = ?, updated_at = ? WHERE id = ?").bind(file.size, file.fileId, nowSec(), m.id).run();
  return c.json({ media: { id: m.id, kind: m.kind, url: cdnUrl(c.env, m.object_key), width: m.width, height: m.height, size: file.size } });
});

/** Abort a pending upload (also removes the file from ImageKit if it already arrived). */
uploads.delete("/:id", async (c) => {
  const m = await pending(c, c.req.param("id"));
  await discard(c.env, m.id, m.object_key, null);
  return c.json({ ok: true });
});

async function discard(env: Env, id: string, key: string, fileId: string | null) {
  try {
    if (fileId) await deleteFile(env, fileId); else await removeRemote(env, key, null);
    await env.DB.prepare("DELETE FROM media WHERE id = ?").bind(id).run();
  } catch (e) { console.error("discard failed; cleanup will retry", e); await env.DB.prepare("UPDATE media SET status='deleting' WHERE id = ?").bind(id).run().catch(() => {}); }
}
