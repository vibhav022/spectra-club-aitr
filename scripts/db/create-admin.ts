/**
 * Create (or reset the password of) one administrator account.
 *   npm run admin:create -- --local          (local dev database)
 *   npm run admin:create -- --remote         (production database)
 * Credentials are typed into the prompt (password input is hidden) and are never written to the repository.
 * Only the salted PBKDF2 hash is stored. For automation you may set ADMIN_EMAIL, ADMIN_NAME and ADMIN_PASSWORD in the shell.
 */
import { createInterface } from "node:readline";
import { Writable } from "node:stream";
import { hashPassword, passwordProblem } from "../../server/lib/crypto.ts";
import { d1Json, d1Sql, q, target } from "./wrangler.ts";

function ask(prompt: string, hidden = false): Promise<string> {
  let muted = false;
  const out = new Writable({ write(chunk, _e, cb) { if (!muted) process.stdout.write(chunk); cb(); } });
  const rl = createInterface({ input: process.stdin, output: out, terminal: true });
  return new Promise((resolve) => {
    rl.question(prompt, (a) => { rl.close(); if (hidden) process.stdout.write("\n"); resolve(a); });
    muted = hidden;
  });
}

const tgt = target(process.argv);
const email = (process.env.ADMIN_EMAIL ?? (await ask("Admin email: "))).trim().toLowerCase();
if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw new Error("That does not look like an email address.");
const existing = d1Json<{ id: string }>(`SELECT id FROM admins WHERE email = ${q(email)}`, tgt)[0];
const count = d1Json<{ n: number }>("SELECT COUNT(*) AS n FROM admins", tgt)[0].n;
if (!existing && count >= 3) throw new Error("There are already 3 administrator accounts. Remove one first, or reset an existing account's password.");
const name = (process.env.ADMIN_NAME ?? (existing ? "" : await ask("Display name: "))).trim();
if (!existing && !name) throw new Error("Display name is required.");

let password = process.env.ADMIN_PASSWORD;
if (!password) {
  password = await ask("Password (min 12 characters): ", true);
  if (password !== (await ask("Repeat password: ", true))) throw new Error("Passwords did not match.");
}
const problem = passwordProblem(password, email);
if (problem) throw new Error(problem);
const hash = await hashPassword(password);

if (existing) {
  d1Sql(`UPDATE admins SET password_hash = ${q(hash)}, disabled = 0, updated_at = strftime('%Y-%m-%dT%H:%M:%fZ','now') WHERE id = ${q(existing.id)};
         DELETE FROM sessions WHERE admin_id = ${q(existing.id)};`, tgt);
  console.log(`Password reset for ${email}. All of their sessions were signed out.`);
} else {
  d1Sql(`INSERT INTO admins (id, email, name, password_hash) VALUES (${q(crypto.randomUUID())}, ${q(email)}, ${q(name)}, ${q(hash)});`, tgt);
  console.log(`Created administrator ${email} (${count + 1}/3).`);
}
