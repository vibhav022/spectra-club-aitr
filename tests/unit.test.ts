import { test } from "node:test";
import assert from "node:assert/strict";
import { hashPassword, passwordProblem, verifyPassword } from "../server/lib/crypto.ts";
import { sniff } from "../server/lib/media.ts";
import { isValidDate, isValidTime, toIstIso } from "../server/lib/time.ts";

test("password hashes are salted, verifiable and reject wrong passwords", async () => {
  const a = await hashPassword("Correct-Horse-Battery-1"); const b = await hashPassword("Correct-Horse-Battery-1");
  assert.notEqual(a, b); assert.match(a, /^pbkdf2-sha256\$100000\$/);
  assert.equal(await verifyPassword("Correct-Horse-Battery-1", a), true);
  assert.equal(await verifyPassword("Correct-Horse-Battery-2", a), false);
  assert.equal(await verifyPassword("x", "garbage"), false);
});
test("password policy", () => {
  assert.ok(passwordProblem("short")); assert.ok(passwordProblem("aaaaaaaaaaaaaaaa")); assert.ok(passwordProblem("my-name-is-vibhav-1", "vibhav@x.com"));
  assert.equal(passwordProblem("Correct-Horse-Battery-1", "a@b.com"), null);
});
test("file signature sniffing", () => {
  assert.equal(sniff(Uint8Array.from([0xff, 0xd8, 0xff, 0xe0]), "image/jpeg"), true);
  assert.equal(sniff(new TextEncoder().encode("<html>"), "image/png"), false);
  assert.equal(sniff(new TextEncoder().encode("\0\0\0\x18ftypisom"), "video/mp4"), true);
  assert.equal(sniff(new TextEncoder().encode("RIFF\0\0\0\0WEBP"), "image/webp"), true);
  assert.equal(sniff(Uint8Array.from([1, 2, 3, 4]), "video/webm"), false);
});
test("IST date/time validation", () => {
  assert.equal(isValidDate("2026-02-28"), true); assert.equal(isValidDate("2026-02-30"), false); assert.equal(isValidDate("26-1-1"), false);
  assert.equal(isValidTime("00:00"), true); assert.equal(isValidTime("24:00"), false); assert.equal(isValidTime("9:05"), false);
  assert.equal(toIstIso("2026-11-15", "10:00"), "2026-11-15T10:00:00+05:30");
});
