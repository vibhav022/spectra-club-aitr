import { createHash } from "node:crypto";
import { readdir, readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";

async function collectHashes(directory, hashes) {
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const path = join(directory, entry.name);
    if (entry.isDirectory()) {
      await collectHashes(path, hashes);
    } else if (entry.name.endsWith(".html")) {
      const html = (await readFile(path, "utf8")).replace(/\r\n?/g, "\n");
      for (const [, script] of html.matchAll(/<script\b[^>]*>([\s\S]*?)<\/script>/gi)) {
        if (script) hashes.add(`'sha256-${createHash("sha256").update(script).digest("base64")}'`);
      }
    }
  }
}

// Next reads .env files during its build. Load the same public settings for this step.
const { loadEnvConfig } = (await import("@next/env")).default;
loadEnvConfig(process.cwd());

const hashes = new Set();
await collectHashes("out", hashes);
const analytics = new URL(process.env.NEXT_PUBLIC_ANALYTICS_SRC || "https://plausible.io").origin;
const apiSetting = process.env.NEXT_PUBLIC_API_URL;
const apiOrigin = apiSetting ? new URL(apiSetting, "https://relative.invalid").origin : "";
const api = apiOrigin === "https://relative.invalid" ? "" : apiOrigin;
const joinSources = (...values) => values.filter(Boolean).join(" ");
const policy = [
  "default-src 'self'",
  joinSources("script-src 'self'", analytics, ...[...hashes].sort()),
  "script-src-attr 'none'",
  "style-src 'self' 'unsafe-inline'",
  joinSources("img-src 'self' data: blob:", api),
  joinSources("media-src 'self' blob:", api),
  joinSources("connect-src 'self' https://upload.imagekit.io", analytics, api),
  "font-src 'self'",
  "object-src 'none'",
  "base-uri 'none'",
  "frame-ancestors 'self'",
  "form-action 'self'",
].join("; ");

const header = `  Content-Security-Policy: ${policy}`;
if (Buffer.byteLength(header) > 2000) throw new Error("Cloudflare Pages CSP header exceeds the 2,000-character rule limit.");
const headers = await readFile("public/_headers", "utf8");
await writeFile("out/_headers", headers.replace("/*\n", `/*\n${header}\n`));
await writeFile("out/security-policy.txt", policy);
