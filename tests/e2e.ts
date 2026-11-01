/**
 * End-to-end tests against the REAL Pages Functions (`wrangler pages dev`) with a migrated local D1 and a MOCK ImageKit.
 * Run with: bash tests/run-e2e.sh
 */
import { execFileSync } from "node:child_process";
import { randomBytes } from "node:crypto";
import { files, start } from "./mock-imagekit.ts";

const BASE = process.env.SITE ?? "http://127.0.0.1:8788";
const EMAIL = "admin1@test.invalid", PASSWORD = "Correct-Horse-Battery-1";
let pass = 0, fail = 0; const results: string[] = [];
async function test(name: string, fn: () => Promise<void>) { try { await fn(); pass++; results.push(`  PASS  ${name}`); } catch (e) { fail++; results.push(`  FAIL  ${name}\n        ${(e as Error).message}`); } }
const ok = (c: unknown, m: string) => { if (!c) throw new Error(m); };
const eq = (a: unknown, b: unknown, m = "") => { if (JSON.stringify(a) !== JSON.stringify(b)) throw new Error(`${m} expected ${JSON.stringify(b)} got ${JSON.stringify(a)}`); };

interface Opts { method?: string; json?: unknown; cookie?: string; origin?: string | null; csrf?: boolean }
async function call(path: string, o: Opts = {}) {
  const method = o.method ?? "GET"; const h: Record<string, string> = {};
  if (o.cookie) h.Cookie = o.cookie;
  if (method !== "GET" && o.origin !== null) h.Origin = o.origin ?? BASE;
  if (method !== "GET" && o.csrf !== false) h["X-Requested-With"] = "spectra-admin";
  let body: string | undefined; if (o.json !== undefined) { h["Content-Type"] = "application/json"; body = JSON.stringify(o.json); }
  const r = await fetch(BASE + path, { method, headers: h, body }); const t = await r.text(); let data: any; try { data = JSON.parse(t); } catch { data = t; }
  return { status: r.status, data, headers: r.headers };
}
const sql = (s: string) => JSON.parse(execFileSync("npx", ["wrangler", "d1", "execute", "spectra-db", "--local", "--command", s, "--json"], { encoding: "utf8" }))[0].results;
const count = (s: string) => sql(s)[0].n as number;

const PNG = Buffer.from("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==", "base64");
const JPG = Buffer.concat([Buffer.from([0xff, 0xd8, 0xff, 0xe0]), randomBytes(2000)]);
const MP4 = Buffer.concat([Buffer.from([0, 0, 0, 24]), Buffer.from("ftypisom"), randomBytes(50_000)]);

/** The same 3 steps the browser performs: reserve+sign, multipart POST to "ImageKit", verify+finalize. */
async function reserve(cookie: string, data: Buffer, contentType: string, purpose = "photo", declared = data.length) {
  const init = await call("/api/admin/uploads", { method: "POST", cookie, json: { filename: "x", contentType, size: declared, purpose, width: 640, height: 480 } });
  return init;
}
async function sendToIk(init: any, data: Buffer, contentType: string, tamper?: (f: Record<string, string>) => void) {
  const fields = { ...init.data.fields }; tamper?.(fields);
  const form = new FormData(); for (const [k, v] of Object.entries(fields)) form.append(k, v as string);
  form.append("file", new Blob([new Uint8Array(data)], { type: contentType }), fields.fileName);
  const r = await fetch(init.data.url, { method: "POST", body: form }); return { status: r.status, data: (await r.json()) as any };
}
async function upload(cookie: string, data: Buffer, contentType: string, purpose = "photo") {
  const init = await reserve(cookie, data, contentType, purpose); eq(init.status, 201, "init");
  const up = await sendToIk(init, data, contentType); eq(up.status, 200, "ik upload");
  const done = await call(`/api/admin/uploads/${init.data.id}/complete`, { method: "POST", cookie, json: { fileId: up.data.fileId } });
  if (done.status !== 200) throw new Error(`complete ${done.status} ${JSON.stringify(done.data)}`);
  return { ...(done.data.media as { id: string; url: string; kind: string }), fileId: up.data.fileId as string };
}

const mock = await start();
let cookie = "";
const cleanup = () => { mock.close(); };

await test("health check responds (D1 reachable through the Pages Function)", async () => eq((await call("/api/health")).data, { ok: true }));
await test("unknown API route is a JSON 404", async () => { const r = await call("/api/nope"); eq(r.status, 404); eq(r.data.error.code, "not_found"); });
await test("admin API requires a session", async () => { for (const p of ["/api/admin/team", "/api/admin/summary", "/api/admin/gallery"]) eq((await call(p)).status, 401, p); });

await test("login: foreign Origin and missing CSRF header are blocked; same-origin works and sets a cookie", async () => {
  const body = { email: EMAIL, password: PASSWORD };
  eq((await call("/api/auth/login", { method: "POST", json: body, origin: "https://evil.example" })).status, 403, "foreign origin");
  eq((await call("/api/auth/login", { method: "POST", json: body, csrf: false })).status, 403, "no csrf header");
  eq((await call("/api/auth/login", { method: "POST", json: { ...body, password: "wrong-password-123" } })).status, 401, "wrong password");
  const r = await call("/api/auth/login", { method: "POST", json: body }); eq(r.status, 200);
  cookie = r.headers.get("set-cookie")!.split(";")[0]; ok(/spectra_session=/.test(cookie), "cookie " + cookie);
  eq((await call("/api/auth/me", { cookie })).data.admin.email, EMAIL);
});

await test("upload init validation: bad type, oversize, video as photo", async () => {
  eq((await reserve(cookie, PNG, "text/html", "gallery")).status, 400);
  eq((await reserve(cookie, PNG, "image/png", "photo", 11 * 1024 * 1024)).status, 413);
  eq((await reserve(cookie, MP4, "video/mp4", "photo")).status, 422);
});
await test("upload init returns a signed ImageKit form (private key is never exposed)", async () => {
  const r = await reserve(cookie, PNG, "image/png"); eq(r.status, 201);
  const f = r.data.fields; ok(f.signature && f.token && f.expire && f.publicKey && f.folder.startsWith("/spectra/photo/"), "fields");
  ok(!JSON.stringify(r.data).includes("private_"), "no private key in response");
  await call(`/api/admin/uploads/${r.data.id}`, { method: "DELETE", cookie });
});
await test("ImageKit rejects an upload with a bad signature", async () => {
  const r = await reserve(cookie, PNG, "image/png"); const up = await sendToIk(r, PNG, "image/png", (f) => { f.signature = "0".repeat(40); });
  eq(up.status, 401); await call(`/api/admin/uploads/${r.data.id}`, { method: "DELETE", cookie });
});
await test("complete: a file that is not really a PNG is rejected and removed from ImageKit", async () => {
  const fake = Buffer.from("<html><script>alert(1)</script></html>"); const before = files.size;
  const init = await reserve(cookie, fake, "image/png"); const up = await sendToIk(init, fake, "image/png");
  const done = await call(`/api/admin/uploads/${init.data.id}/complete`, { method: "POST", cookie, json: { fileId: up.data.fileId } });
  eq(done.status, 422); eq(files.size, before, "file deleted from ImageKit"); eq(count(`SELECT COUNT(*) n FROM media WHERE id='${init.data.id}'`), 0, "row removed");
});
await test("complete: size different from the declared size is rejected", async () => {
  const before = files.size; const init = await reserve(cookie, PNG, "image/png", "photo", PNG.length + 7); const up = await sendToIk(init, PNG, "image/png");
  eq((await call(`/api/admin/uploads/${init.data.id}/complete`, { method: "POST", cookie, json: { fileId: up.data.fileId } })).status, 422); eq(files.size, before);
});
await test("complete: a fileId belonging to a different path cannot be attached (no spoofing)", async () => {
  const a = await upload(cookie, PNG, "image/png");
  const init = await reserve(cookie, PNG, "image/png");
  const r = await call(`/api/admin/uploads/${init.data.id}/complete`, { method: "POST", cookie, json: { fileId: a.fileId } });
  eq(r.status, 422); ok(files.has(a.fileId), "the legitimate file must be untouched");
  await call(`/api/admin/uploads/${a.id}`, { method: "DELETE", cookie }); // already complete -> 404, harmless
});
await test("complete: without uploading anything fails cleanly", async () => {
  const init = await reserve(cookie, PNG, "image/png");
  eq((await call(`/api/admin/uploads/${init.data.id}/complete`, { method: "POST", cookie, json: { fileId: "doesnotexist123" } })).status, 422);
});

let member: any, photo1: any;
await test("team: create with an uploaded photo; the public API serves the ImageKit CDN URL and it loads", async () => {
  photo1 = await upload(cookie, PNG, "image/png");
  ok(photo1.url.startsWith("http://127.0.0.1:9911/ik/test/spectra/photo/"), "url " + photo1.url);
  const c = await call("/api/admin/team", { method: "POST", cookie, json: { name: "Asha Rao", role: "President", tier: "leadership", photoMediaId: photo1.id } });
  eq(c.status, 201); member = c.data.item;
  const pub = await call("/api/public/team"); eq(pub.data.items.length, 1); eq(pub.data.items[0].photo, photo1.url);
  const img = await fetch(pub.data.items[0].photo); eq(img.status, 200);
});
await test("team: the same upload cannot be attached to two records", async () => {
  eq((await call("/api/admin/team", { method: "POST", cookie, json: { name: "Dup", role: "Core", tier: "core", photoMediaId: photo1.id } })).status, 409);
});
await test("team: replacing the photo deletes the old file from ImageKit", async () => {
  const p2 = await upload(cookie, JPG, "image/jpeg");
  eq((await call(`/api/admin/team/${member.id}`, { method: "PATCH", cookie, json: { photoMediaId: p2.id } })).status, 200);
  ok(!files.has(photo1.fileId), "old file gone"); ok(files.has(p2.fileId), "new file present"); photo1 = p2;
});
await test("team: deleting the member deletes the photo from ImageKit and the media row", async () => {
  eq((await call(`/api/admin/team/${member.id}`, { method: "DELETE", cookie })).status, 200);
  ok(!files.has(photo1.fileId), "file gone"); eq(count(`SELECT COUNT(*) n FROM media WHERE id='${photo1.id}'`), 0, "media row removed");
});

await test("gallery: image + video (with thumbnail) are created; public API exposes CDN URLs; hidden items stay hidden", async () => {
  const cats = (await call("/api/admin/gallery", { cookie })).data.categories; const tech = cats.find((c: any) => c.name === "Tech").id;
  const img = await upload(cookie, JPG, "image/jpeg", "gallery"), vid = await upload(cookie, MP4, "video/mp4", "gallery"), th = await upload(cookie, PNG, "image/png", "thumb");
  const hid = await upload(cookie, PNG, "image/png", "gallery");
  const r = await call("/api/admin/gallery", { method: "POST", cookie, json: { items: [
    { title: "Hack night", categoryId: tech, mediaId: img.id }, { title: "Reel", categoryId: tech, mediaId: vid.id, thumbMediaId: th.id }, { title: "Secret", categoryId: tech, mediaId: hid.id, visible: false } ] } });
  eq(r.status, 201, JSON.stringify(r.data));
  const pub = (await call("/api/public/gallery")).data; eq(pub.items.length, 2);
  const reel = pub.items.find((i: any) => i.kind === "video"); eq(reel.src, vid.url); eq(reel.thumb, th.url);
  eq((await call("/api/public/counts")).data.gallery, 2);
});

await test("upcoming events: create, list publicly, hide", async () => {
  const c = await call("/api/admin/events", { method: "POST", cookie, json: { title: "Hack Night", date: "2099-01-10", time: "10:00", visible: true } });
  eq(c.status, 201); eq((await call("/api/public/next-events")).data.events.length, 1);
  eq((await call(`/api/admin/events/${c.data.item.id}`, { method: "PATCH", cookie, json: { visible: false } })).status, 200);
  eq((await call("/api/public/next-events")).data.events.length, 0);
});

await test("opportunistic cleanup removes abandoned pending uploads and never-attached files, keeps attached ones", async () => {
  const keepRec = await upload(cookie, PNG, "image/png"); // attach to a faculty member so it must survive
  const fac = await call("/api/admin/faculty", { method: "POST", cookie, json: { name: "Dr. Rao", designation: "HOD", photoMediaId: keepRec.id } }); eq(fac.status, 201);
  const orphan = await upload(cookie, PNG, "image/png", "gallery");
  const pend = await reserve(cookie, PNG, "image/png"); const pendUp = await sendToIk(pend, PNG, "image/png");   // arrived at IK but never completed
  sql(`UPDATE media SET created_at = created_at - 86400 WHERE id IN ('${keepRec.id}','${orphan.id}','${pend.data.id}')`);
  sql("DELETE FROM rate_limits WHERE key='cleanup:last'");
  await call("/api/admin/summary", { cookie });                       // any admin call schedules the cleanup after the response
  for (let i = 0; i < 20 && (files.has(orphan.fileId) || files.has(pendUp.data.fileId)); i++) await new Promise((r) => setTimeout(r, 250));
  ok(!files.has(orphan.fileId), "orphan removed from ImageKit"); ok(!files.has(pendUp.data.fileId), "pending upload removed from ImageKit (found by path)");
  ok(files.has(keepRec.fileId), "attached file kept"); eq(count(`SELECT COUNT(*) n FROM media WHERE id IN ('${orphan.id}','${pend.data.id}')`), 0);
});

await test("logout invalidates the session cookie", async () => {
  eq((await call("/api/auth/logout", { method: "POST", cookie })).status, 200);
  eq((await call("/api/auth/me", { cookie })).status, 401);
});

mock.close();
console.log(results.join("\n")); console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
