/**
 * Import the content that currently lives in ../content/*.ts into the database. Safe to run repeatedly:
 *  - every item has a stable key recorded in seed_log, so it is imported at most once;
 *  - an item an administrator later deletes is NOT brought back by running the seed again.
 * Placeholder entries (isPlaceholder: true) are skipped, because the public site never shows them in production.
 *   npm run seed -- --local [--include-placeholders] [--content-dir ../content] [--public-dir ../public]
 */
import { existsSync, readFileSync, statSync } from "node:fs";
import { extname, join, resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { d1Sql, q, target } from "./wrangler.ts";

const argv = process.argv.slice(2);
const flag = (n: string, d: string) => { const i = argv.indexOf(n); return i >= 0 ? argv[i + 1] : d; };
const tgt = target(argv);
const contentDir = resolve(flag("--content-dir", "content"));
const publicDir = resolve(flag("--public-dir", "public"));
const includePlaceholders = argv.includes("--include-placeholders");
const load = async (f: string) => import(pathToFileURL(join(contentDir, f)).href);
const { team } = await load("team.ts"); const { gallery } = await load("gallery.ts");
const { nextEvent } = await load("nextEvent.ts"); const { events } = await load("events.ts");

const TYPES: Record<string, string> = { ".jpg": "image/jpeg", ".jpeg": "image/jpeg", ".png": "image/png", ".webp": "image/webp", ".mp4": "video/mp4", ".webm": "video/webm" };
const EXT: Record<string, string> = { "image/jpeg": "jpg", "image/png": "png", "image/webp": "webp", "video/mp4": "mp4", "video/webm": "webm" };
const sql: string[] = []; const notes: string[] = [];
const slug = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
const want = (x: { isPlaceholder?: boolean }) => includePlaceholders || !x.isPlaceholder;
const once = (key: string, insert: string) => sql.push(`${insert.replace(/;\s*$/, "")} ${/WHERE/i.test(insert) ? "AND" : "WHERE"} NOT EXISTS (SELECT 1 FROM seed_log WHERE seed_key = ${q(key)});`, `INSERT OR IGNORE INTO seed_log (seed_key) VALUES (${q(key)});`);

const IK_KEY = process.env.IMAGEKIT_PRIVATE_KEY;
/** Upload one file to ImageKit (server-side upload with the private key). Returns ImageKit's fileId. */
async function ikUpload(file: string, objectKey: string, ct: string): Promise<string> {
  const form = new FormData();
  form.append("file", new Blob([readFileSync(file)], { type: ct }), objectKey.split("/").pop()!);
  form.append("fileName", objectKey.split("/").pop()!);
  form.append("folder", `/spectra/${objectKey.split("/").slice(0, -1).join("/")}`);
  form.append("useUniqueFileName", "false"); form.append("overwriteFile", "true");
  const r = await fetch("https://upload.imagekit.io/api/v1/files/upload", { method: "POST", headers: { Authorization: `Basic ${Buffer.from(`${IK_KEY}:`).toString("base64")}` }, body: form });
  const data = await r.json().catch(() => ({})) as { fileId?: string; message?: string };
  if (!r.ok || !data.fileId) throw new Error(`ImageKit upload of ${objectKey} failed (${r.status}): ${data.message ?? "unknown error"}`);
  return data.fileId;
}

/** Upload a file from /public into ImageKit and register it in the media table. Returns the media id (or null). */
async function importFile(src: string | undefined, key: string, dims?: { w: number; h: number }): Promise<string | null> {
  if (!src) return null;
  const file = join(publicDir, src.replace(/^\//, ""));
  const ct = TYPES[extname(file).toLowerCase()];
  if (!existsSync(file) || !ct) { notes.push(`Skipped ${src}: file not found in ${publicDir} or unsupported type; upload it from the dashboard.`); return null; }
  const id = `seed-media-${slug(key)}`; const objectKey = `seed/${slug(key)}.${EXT[ct]}`;
  if (!IK_KEY) throw new Error("Set IMAGEKIT_PRIVATE_KEY in your shell before seeding files (see README).");
  const fileId = await ikUpload(file, objectKey, ct);
  const now = Math.floor(Date.now() / 1000);
  sql.push(`INSERT OR IGNORE INTO media (id, object_key, kind, content_type, size_bytes, declared_size, width, height, original_name, status, provider_file_id, created_at, updated_at)
    VALUES (${q(id)}, ${q(objectKey)}, ${q(ct.startsWith("video") ? "video" : "image")}, ${q(ct)}, ${statSync(file).size}, ${statSync(file).size}, ${dims?.w ?? "NULL"}, ${dims?.h ?? "NULL"}, ${q(src)}, 'ready', ${q(fileId)}, ${now}, ${now});`);
  return id;
}

// Team + faculty
for (const [i, m] of (team as any[]).entries()) {
  if (!want(m)) continue;
  const key = `${m.tier === "faculty" ? "faculty" : "team"}:${i}:${slug(m.name)}-${slug(m.role)}`;
  const photo = m.photo ? await importFile(m.photo, key) : null;
  // Only import a photo the first time; the media row must exist before the item row.
  if (m.tier === "faculty") once(key, `INSERT INTO faculty (id, name, designation, photo_media_id, sort_order, visible) SELECT ${q("seed-" + slug(key))}, ${q(m.name)}, ${q(m.role)}, ${q(photo)}, ${i}, 1`);
  else once(key, `INSERT INTO team_members (id, name, role, tier, instagram, photo_media_id, sort_order, visible) SELECT ${q("seed-" + slug(key))}, ${q(m.name)}, ${q(m.role)}, ${q(m.tier)}, ${q(m.instagram)}, ${q(photo)}, ${i}, 1`);
}
// Gallery: an item needs a real file, so tiles without `src` cannot be imported.
for (const [i, g] of (gallery as any[]).entries()) {
  if (!want(g)) continue;
  if (!g.src) { notes.push(`Skipped gallery tile "${g.alt}": it has no image file.`); continue; }
  const key = `gallery:${i}:${slug(g.alt)}`; const media = await importFile(g.src, key, { w: g.width, h: g.height });
  if (!media) continue;
  once(key, `INSERT INTO gallery_items (id, title, category_id, media_id, kind, width, height, sort_order, visible)
    SELECT ${q("seed-" + slug(key))}, ${q(g.alt)}, (SELECT id FROM gallery_categories WHERE name = ${q(g.category)}), ${q(media)}, 'image', ${g.width}, ${g.height}, ${i}, 1`);
}
// Next event: imported hidden when the source entry is a placeholder, so nothing invented goes live.
if (nextEvent) {
  const ev = events.find((e: any) => e.slug === nextEvent.eventSlug);
  const m = /^(\d{4}-\d{2}-\d{2})T(\d{2}:\d{2})/.exec(nextEvent.startsAt);
  if (ev && m) once("next_event", `INSERT INTO upcoming_events (id, title, event_slug, event_date, start_time, venue, registration_url, cta_text, visible)
    SELECT ${q("seed-next-event")}, ${q(ev.title)}, ${q(ev.slug)}, ${q(m[1])}, ${q(m[2])}, ${q(nextEvent.venue)}, ${q(nextEvent.registrationUrl)}, 'Participate now', ${nextEvent.isPlaceholder ? 0 : 1}`);
  else notes.push("Next event: could not read the entry; set it from the dashboard.");
}
d1Sql(sql.join("\n"), tgt);
console.log(`Seed finished (${tgt.slice(2)}). Run it again any time; nothing is duplicated or restored.`);
notes.forEach((n) => console.log("  note:", n));
