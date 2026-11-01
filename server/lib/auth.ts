import type { Context, MiddlewareHandler } from "hono";
import { deleteCookie, getCookie, setCookie } from "hono/cookie";
import type { AppEnv, AdminUser, Env } from "../env";
import { HttpError, nowSec } from "./http";
import { sha256Hex } from "./crypto";

const IDLE_SECONDS = 24 * 3600; // a session unused for a day is dead, even if not yet at its absolute expiry
export const sessionDays = (env: Env) => Math.min(30, Math.max(1, Number(env.SESSION_DAYS ?? 7)));
const isSecure = (c: Context) => new URL(c.req.url).protocol === "https:";
const cookieName = (c: Context) => (isSecure(c) ? "__Host-spectra_session" : "spectra_session");

export const allowedOrigins = (env: Env) => (env.ALLOWED_ORIGINS ?? "").split(",").map((s) => s.trim().replace(/\/$/, "")).filter(Boolean);
export const clientIp = (c: Context) => c.req.header("CF-Connecting-IP") ?? "unknown";

export function setSessionCookie(c: Context<AppEnv>, token: string) {
  setCookie(c, cookieName(c), token, {
    httpOnly: true, secure: isSecure(c), sameSite: "Lax", path: "/", maxAge: sessionDays(c.env) * 86400,
  });
}
export const clearSessionCookie = (c: Context<AppEnv>) => deleteCookie(c, cookieName(c), { path: "/", secure: isSecure(c) });

export async function readSession(c: Context<AppEnv>): Promise<{ admin: AdminUser; sessionId: string } | null> {
  const token = getCookie(c, cookieName(c));
  if (!token || token.length > 128) return null;
  const sessionId = await sha256Hex(token);
  const now = nowSec();
  const row = await c.env.DB.prepare(
    `SELECT s.expires_at, s.last_seen_at, a.id, a.email, a.name, a.disabled
       FROM sessions s JOIN admins a ON a.id = s.admin_id WHERE s.id = ?`,
  ).bind(sessionId).first<{ expires_at: number; last_seen_at: number; id: string; email: string; name: string; disabled: number }>();
  if (!row) return null;
  if (row.expires_at <= now || row.disabled || now - row.last_seen_at > IDLE_SECONDS) {
    await c.env.DB.prepare("DELETE FROM sessions WHERE id = ?").bind(sessionId).run();
    return null;
  }
  if (now - row.last_seen_at > 60) await c.env.DB.prepare("UPDATE sessions SET last_seen_at = ? WHERE id = ?").bind(now, sessionId).run();
  return { admin: { id: row.id, email: row.email, name: row.name }, sessionId };
}

/** Every /api/admin route and every write goes through this. Authorization is enforced here, on the server. */
export const requireAdmin: MiddlewareHandler<AppEnv> = async (c, next) => {
  const s = await readSession(c);
  if (!s) throw new HttpError(401, "unauthorized", "Please sign in.");
  c.set("admin", s.admin);
  c.set("sessionId", s.sessionId);
  await next();
};

/** CSRF defence for state-changing requests: allowed Origin + custom header (plus SameSite=Lax cookies). */
export const csrfGuard: MiddlewareHandler<AppEnv> = async (c, next) => {
  if (["GET", "HEAD", "OPTIONS"].includes(c.req.method)) return next();
  const origin = c.req.header("Origin")?.replace(/\/$/, "");
  // The site and the API share one origin on Cloudflare Pages, so same-origin requests are always fine (this also covers preview URLs).
  const sameOrigin = origin === new URL(c.req.url).origin;
  if (!origin || !(sameOrigin || allowedOrigins(c.env).includes(origin))) throw new HttpError(403, "bad_origin", "Request origin is not allowed.");
  if (c.req.header("X-Requested-With") !== "spectra-admin") throw new HttpError(403, "csrf", "Missing security header.");
  await next();
};

/** Fixed-window counter in D1. Returns the count after this hit. */
export async function rateHit(env: Env, key: string, windowSec: number) {
  const now = nowSec();
  const r = await env.DB.prepare(
    `INSERT INTO rate_limits (key, window_start, count) VALUES (?1, ?2, 1)
     ON CONFLICT(key) DO UPDATE SET
       count = CASE WHEN window_start <= ?3 THEN 1 ELSE count + 1 END,
       window_start = CASE WHEN window_start <= ?3 THEN ?2 ELSE window_start END
     RETURNING count, window_start`,
  ).bind(key, now, now - windowSec).first<{ count: number; window_start: number }>();
  return { count: r!.count, retryAfter: Math.max(1, r!.window_start + windowSec - now) };
}
export async function ratePeek(env: Env, key: string, windowSec: number) {
  const now = nowSec();
  const r = await env.DB.prepare("SELECT count, window_start FROM rate_limits WHERE key = ?").bind(key).first<{ count: number; window_start: number }>();
  if (!r || r.window_start <= now - windowSec) return { count: 0, retryAfter: 0 };
  return { count: r.count, retryAfter: Math.max(1, r.window_start + windowSec - now) };
}
export const tooMany = (retryAfter: number) =>
  new HttpError(429, "rate_limited", `Too many attempts. Try again in ${Math.ceil(retryAfter / 60)} minute(s).`, { retryAfter });
