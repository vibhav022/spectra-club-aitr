import { sha256Hex, timingSafeEqual } from "./crypto";

const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";
const encoder = new TextEncoder();

export function adminTotpSecret(config: string, email: string): string | null {
  try {
    const accounts: unknown = JSON.parse(config);
    if (!accounts || typeof accounts !== "object" || Array.isArray(accounts) || !Object.hasOwn(accounts, email)) return null;
    const secret = (accounts as Record<string, unknown>)[email];
    return typeof secret === "string" && /^[A-Z2-7]{32}$/.test(secret) ? secret : null;
  } catch {
    return null;
  }
}

export async function totpSessionPrefix(secret: string) {
  return `totp.${(await sha256Hex(secret)).slice(0, 32)}.`;
}

/** RFC 6238, SHA-1, six digits and a 30-second time step. Returns the matched step for replay protection. */
export async function matchTotpStep(secret: string, code: string, nowSeconds: number): Promise<number | null> {
  if (!/^[A-Z2-7]{32}$/.test(secret) || !/^\d{6}$/.test(code)) return null;
  const bits = [...secret].map((character) => alphabet.indexOf(character).toString(2).padStart(5, "0")).join("");
  const bytes = Uint8Array.from(bits.match(/.{8}/g)!, (byte) => parseInt(byte, 2));
  const key = await crypto.subtle.importKey("raw", bytes, { name: "HMAC", hash: "SHA-1" }, false, ["sign"]);
  const step = Math.floor(nowSeconds / 30);
  const supplied = encoder.encode(code);
  const counter = new DataView(new ArrayBuffer(8));
  for (const candidate of [step, step - 1, step + 1]) {
    if (candidate < 0) continue;
    counter.setBigUint64(0, BigInt(candidate));
    const signature = new Uint8Array(await crypto.subtle.sign("HMAC", key, counter));
    const offset = signature[signature.length - 1] & 15;
    const value = new DataView(signature.buffer).getUint32(offset) & 0x7fffffff;
    const expected = encoder.encode(String(value % 1_000_000).padStart(6, "0"));
    if (timingSafeEqual(expected, supplied)) return candidate;
  }
  return null;
}
