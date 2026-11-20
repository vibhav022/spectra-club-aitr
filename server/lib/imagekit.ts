import type { Env } from "../env";

/**
 * Minimal ImageKit client (no SDK, so it runs in Pages Functions).
 *  - Browser uploads go straight to ImageKit with a short-lived signature made here (the private key never leaves the server).
 *  - The server then verifies the uploaded file through the Media API before it is ever used on the site.
 * Docs: https://imagekit.io/docs/api-reference/upload-file/upload-file  and  /docs/api-reference/digital-asset-management-dam/
 */
export const uploadUrl = (env: Env) => env.IMAGEKIT_UPLOAD_URL ?? "https://upload.imagekit.io/api/v1/files/upload";
const api = (env: Env) => env.IMAGEKIT_API_URL ?? "https://api.imagekit.io/v1";
/** Everything this site stores lives under one folder, so the ImageKit library stays tidy. */
export const ROOT_FOLDER = "/spectra";

const enc = new TextEncoder();
const hex = (buf: ArrayBuffer) => [...new Uint8Array(buf)].map((x) => x.toString(16).padStart(2, "0")).join("");

/** Auth parameters for one browser upload: HMAC-SHA1(token + expire) with the private key. Valid for 20 minutes. */
export async function uploadAuth(env: Env) {
  const token = crypto.randomUUID();
  const expire = Math.floor(Date.now() / 1000) + 20 * 60;
  const signature = await sign(env, token + expire);
  return { token, expire, signature, publicKey: env.IMAGEKIT_PUBLIC_KEY };
}

async function sign(env: Env, value: string) {
  const key = await crypto.subtle.importKey("raw", enc.encode(env.IMAGEKIT_PRIVATE_KEY), { name: "HMAC", hash: "SHA-1" }, false, ["sign"]);
  return hex(await crypto.subtle.sign("HMAC", key, enc.encode(value)));
}

const basic = (env: Env) => `Basic ${btoa(`${env.IMAGEKIT_PRIVATE_KEY}:`)}`;

/** Where a stored object key (e.g. "gallery/2026/11/abc.jpg") lives inside ImageKit. */
export const folderOf = (key: string) => `${ROOT_FOLDER}/${key.split("/").slice(0, -1).join("/")}`;
export const fileNameOf = (key: string) => key.split("/").pop()!;
export const pathOf = (key: string) => `${ROOT_FOLDER}/${key}`;
/** ImageKit signs the encoded path relative to the URL endpoint, without a leading slash. */
export async function signedMediaUrl(env: Env, key: string) {
  const path = pathOf(key).slice(1).split("/").map(encodeURIComponent).join("/");
  const expires = Math.floor(Date.now() / 1000) + 300;
  const signature = await sign(env, path + expires);
  return `${env.IMAGEKIT_URL_ENDPOINT.replace(/\/+$/, "")}/${path}?ik-t=${expires}&ik-s=${signature}`;
}

export interface IkFile { fileId: string; name: string; filePath: string; url: string; size: number; mime?: string; width?: number; height?: number }

/** Details of one uploaded file, or null if ImageKit has no such file. */
export async function getFile(env: Env, fileId: string): Promise<IkFile | null> {
  if (!/^[A-Za-z0-9_-]{6,64}$/.test(fileId)) return null;
  const r = await fetch(`${api(env)}/files/${fileId}/details`, { headers: { Authorization: basic(env) } });
  if (r.status === 404) return null;
  if (!r.ok) throw new Error(`ImageKit details failed: ${r.status}`);
  return (await r.json()) as IkFile;
}

/** Find a file by its exact path (used to clean up uploads whose id the server never learned). */
export async function findByPath(env: Env, key: string): Promise<IkFile | null> {
  const qs = new URLSearchParams({ path: folderOf(key), searchQuery: `name = "${fileNameOf(key)}"`, limit: "1" });
  const r = await fetch(`${api(env)}/files?${qs}`, { headers: { Authorization: basic(env) } });
  if (!r.ok) throw new Error(`ImageKit search failed: ${r.status}`);
  const list = (await r.json()) as IkFile[];
  return list.find((f) => f.filePath === pathOf(key)) ?? null;
}

/** Delete a file by id. A file that is already gone counts as success. */
export async function deleteFile(env: Env, fileId: string): Promise<void> {
  const r = await fetch(`${api(env)}/files/${fileId}`, { method: "DELETE", headers: { Authorization: basic(env) } });
  if (!r.ok && r.status !== 404) throw new Error(`ImageKit delete failed: ${r.status}`);
}

/** First bytes of a file from the CDN, to verify its real signature. */
export async function firstBytes(url: string, n = 16): Promise<Uint8Array> {
  const r = await fetch(url, { headers: { Range: `bytes=0-${n - 1}` } });
  if (!r.ok) throw new Error(`CDN fetch failed: ${r.status}`);
  return new Uint8Array((await r.arrayBuffer()).slice(0, n));
}
