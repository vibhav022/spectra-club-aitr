import { Hono } from "hono";
import type { AppEnv } from "../env";
import { readSession } from "../lib/auth";
import { HttpError, notFound } from "../lib/http";
import { signedMediaUrl } from "../lib/imagekit";
import { publicGalleryItem, TYPES } from "../lib/media";

export const media = new Hono<AppEnv>();

media.on(["GET", "HEAD"], "/:purpose/:year/:month/:file", async (c) => {
  const { purpose, year, month, file } = c.req.param();
  const key = `${purpose}/${year}/${month}/${file}`;
  const asset = await c.env.DB.prepare(`
    SELECT m.content_type,
      (EXISTS (SELECT 1 FROM team_members WHERE photo_media_id = m.id AND visible = 1)
        OR EXISTS (SELECT 1 FROM faculty WHERE photo_media_id = m.id AND visible = 1)
        OR EXISTS (SELECT 1 FROM gallery_items g LEFT JOIN site_events e ON e.id = g.event_id
          WHERE (g.media_id = m.id OR g.thumb_media_id = m.id) AND ${publicGalleryItem})
        OR EXISTS (SELECT 1 FROM site_events WHERE (poster_media_id = m.id OR video_media_id = m.id) AND visible = 1)
      ) AS is_public
    FROM media m WHERE m.object_key = ? AND m.status = 'ready'
  `).bind(key).first<{ content_type: string; is_public: number }>();

  if (!asset || !Object.hasOwn(TYPES, asset.content_type) || (!asset.is_public && !await readSession(c))) {
    throw notFound("Media not found.");
  }

  const headers = new Headers();
  const range = c.req.header("Range");
  if (range && /^bytes=(?:\d+-\d*|-\d+)$/.test(range)) headers.set("Range", range);
  const upstream = await fetch(await signedMediaUrl(c.env, key), {
    method: c.req.method, headers, redirect: "manual",
  });
  if (![200, 206, 416].includes(upstream.status)) {
    await upstream.body?.cancel();
    if (upstream.status === 404) throw notFound("Media not found.");
    throw new HttpError(502, "storage_error", "Media is temporarily unavailable.");
  }

  const responseHeaders = new Headers({
    "Cache-Control": "private, no-store",
    "Content-Type": asset.content_type,
  });
  for (const name of ["Accept-Ranges", "Content-Length", "Content-Range"]) {
    const value = upstream.headers.get(name);
    if (value) responseHeaders.set(name, value);
  }
  return new Response(upstream.body, { status: upstream.status, headers: responseHeaders });
});
