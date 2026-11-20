import { Hono } from "hono";
import { z } from "zod";
import type { AppEnv } from "../env";
import { body, HttpError, nowIso, nowSec } from "../lib/http";
import { hashPassword, passwordProblem, randomToken, sha256Hex, verifyPassword } from "../lib/crypto";
import { clearSessionCookie, clientIp, rateHit, ratePeek, readSession, requireAdmin, sessionDays, setSessionCookie, tooMany } from "../lib/auth";

import { adminTotpSecret, matchTotpStep, totpSessionPrefix } from "../lib/totp";

export const auth = new Hono<AppEnv>();
const WINDOW = 15 * 60;
const MAX_FAILS = 5;       // failed attempts per IP + email per 15 minutes
const MAX_PER_IP = 30;     // all attempts per IP per 15 minutes

let dummy: Promise<string> | undefined; // verified against when the email is unknown, so timing doesn't reveal which emails exist
const dummyHash = () => (dummy ??= hashPassword("not-a-real-password"));

auth.post("/login", async (c) => {
  const { email, password, code } = await body(c, z.object({ email: z.string().trim().toLowerCase().email().max(254), password: z.string().min(1).max(200), code: z.string().trim().max(6).optional() }));
  const ip = clientIp(c);
  const failKey = `login:fail:${ip}:${await sha256Hex(email)}`;
  const ipHit = await rateHit(c.env, `login:ip:${ip}`, WINDOW);
  if (ipHit.count > MAX_PER_IP) throw tooMany(ipHit.retryAfter);
  const fails = await ratePeek(c.env, failKey, WINDOW);
  if (fails.count >= MAX_FAILS) throw tooMany(fails.retryAfter);

  const admin = await c.env.DB.prepare("SELECT id, email, name, password_hash, disabled FROM admins WHERE email = ?")
    .bind(email).first<{ id: string; email: string; name: string; password_hash: string; disabled: number }>();
  const ok = await verifyPassword(password, admin?.password_hash ?? (await dummyHash()));
  if (!admin || !ok || admin.disabled) {
    const f = await rateHit(c.env, failKey, WINDOW);
    if (f.count >= MAX_FAILS) throw tooMany(f.retryAfter);
    throw new HttpError(401, "invalid_credentials", "Incorrect email or password.");
  }
  const now = nowSec();
  let token = randomToken();
  if (c.env.ADMIN_TOTP_SECRETS !== undefined) {
    const secret = adminTotpSecret(c.env.ADMIN_TOTP_SECRETS, admin.email);
    if (!secret) throw new HttpError(503, "totp_not_configured", "Two-step verification is not set up for this account. Contact the site owner.");
    if (!code) throw new HttpError(401, "totp_required", "Enter the six-digit code from your authenticator app.");

    const attempts = await rateHit(c.env, `totp:attempt:${admin.id}`, WINDOW);
    if (attempts.count > MAX_FAILS) throw tooMany(attempts.retryAfter);
    const step = await matchTotpStep(secret, code, now);
    if (step === null) throw new HttpError(401, "invalid_totp", "That code is invalid or has expired.");

    const prefix = await totpSessionPrefix(secret);
    const used = await c.env.DB.prepare(
      "INSERT OR IGNORE INTO rate_limits (key, window_start, count) VALUES (?, ?, 1)",
    ).bind(`totp:used:${admin.id}:${prefix}:${step}`, now).run();
    if (!used.meta.changes) throw new HttpError(401, "invalid_totp", "That code was already used. Wait for a new code.");
    token = prefix + token;
    await c.env.DB.prepare("DELETE FROM rate_limits WHERE key = ?").bind(`totp:attempt:${admin.id}`).run();
  }
  await c.env.DB.prepare("DELETE FROM rate_limits WHERE key = ?").bind(failKey).run();
  await c.env.DB.batch([
    c.env.DB.prepare("INSERT INTO sessions (id, admin_id, created_at, expires_at, last_seen_at, user_agent, ip) VALUES (?,?,?,?,?,?,?)")
      .bind(await sha256Hex(token), admin.id, now, now + sessionDays(c.env) * 86400, now, (c.req.header("User-Agent") ?? "").slice(0, 200), ip),
    c.env.DB.prepare("UPDATE admins SET last_login_at = ? WHERE id = ?").bind(nowIso(), admin.id),
    c.env.DB.prepare("DELETE FROM sessions WHERE expires_at < ?").bind(now),
  ]);
  setSessionCookie(c, token);
  return c.json({ admin: { id: admin.id, email: admin.email, name: admin.name } });
});

auth.post("/logout", async (c) => {
  const s = await readSession(c);
  if (s) await c.env.DB.prepare("DELETE FROM sessions WHERE id = ?").bind(s.sessionId).run();
  clearSessionCookie(c);
  return c.json({ ok: true });
});

auth.get("/me", async (c) => {
  const s = await readSession(c);
  if (!s) throw new HttpError(401, "unauthorized", "Not signed in.");
  return c.json({ admin: s.admin });
});

auth.use("/password", requireAdmin);
auth.use("/sessions", requireAdmin);
auth.use("/sessions/*", requireAdmin);

auth.post("/password", async (c) => {
  const { currentPassword, newPassword } = await body(c, z.object({ currentPassword: z.string().min(1).max(200), newPassword: z.string().max(200) }));
  const admin = c.get("admin");
  const rl = await rateHit(c.env, `pw:${admin.id}`, WINDOW);
  if (rl.count > 10) throw tooMany(rl.retryAfter);
  const row = await c.env.DB.prepare("SELECT password_hash FROM admins WHERE id = ?").bind(admin.id).first<{ password_hash: string }>();
  if (!row || !(await verifyPassword(currentPassword, row.password_hash))) throw new HttpError(403, "wrong_password", "Current password is incorrect.", { currentPassword: "Current password is incorrect." });
  const problem = passwordProblem(newPassword, admin.email);
  if (problem) throw new HttpError(400, "weak_password", problem, { newPassword: problem });
  if (newPassword === currentPassword) throw new HttpError(400, "same_password", "Choose a different password.", { newPassword: "Choose a different password." });
  await c.env.DB.batch([
    c.env.DB.prepare("UPDATE admins SET password_hash = ?, updated_at = ? WHERE id = ?").bind(await hashPassword(newPassword), nowIso(), admin.id),
    c.env.DB.prepare("DELETE FROM sessions WHERE admin_id = ? AND id != ?").bind(admin.id, c.get("sessionId")),
  ]);
  return c.json({ ok: true });
});

auth.get("/sessions", async (c) => {
  const rows = (await c.env.DB.prepare("SELECT id, created_at, last_seen_at, expires_at, user_agent, ip FROM sessions WHERE admin_id = ? AND expires_at > ? ORDER BY last_seen_at DESC")
    .bind(c.get("admin").id, nowSec()).all<{ id: string; created_at: number; last_seen_at: number; expires_at: number; user_agent: string; ip: string }>()).results;
  return c.json({ sessions: rows.map((r) => ({ id: r.id.slice(0, 16), createdAt: r.created_at, lastSeenAt: r.last_seen_at, expiresAt: r.expires_at, userAgent: r.user_agent, ip: r.ip, current: r.id === c.get("sessionId") })) });
});
auth.delete("/sessions/others", async (c) => {
  await c.env.DB.prepare("DELETE FROM sessions WHERE admin_id = ? AND id != ?").bind(c.get("admin").id, c.get("sessionId")).run();
  return c.json({ ok: true });
});
auth.delete("/sessions/:id", async (c) => {
  const prefix = c.req.param("id");
  if (!/^[0-9a-f]{16}$/.test(prefix)) throw new HttpError(400, "invalid_request", "Bad session id.");
  const r = await c.env.DB.prepare("DELETE FROM sessions WHERE admin_id = ? AND id LIKE ? AND id != ?").bind(c.get("admin").id, `${prefix}%`, c.get("sessionId")).run();
  if (!r.meta.changes) throw new HttpError(404, "not_found", "Session not found (or it is your current session; use Sign out).");
  return c.json({ ok: true });
});
