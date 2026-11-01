import { spawnSync } from "node:child_process";
import { mkdtempSync, writeFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

// Run wrangler through node directly (no shell), so arguments containing spaces, like SQL, stay intact on Windows.
const WRANGLER_JS = join(dirname(fileURLToPath(import.meta.url)), "../../node_modules/wrangler/bin/wrangler.js");

export const DB_NAME = process.env.D1_DATABASE_NAME ?? "spectra-db";

export function target(argv: string[]) {
  const remote = argv.includes("--remote");
  if (remote && argv.includes("--local")) throw new Error("Choose either --local or --remote, not both.");
  return remote ? "--remote" : "--local";
}

export function wrangler(args: string[]) {
  const r = spawnSync(process.execPath, [WRANGLER_JS, ...args], { encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] });
  if (r.status !== 0) throw new Error(`wrangler ${args.slice(0, 3).join(" ")} failed:\n${r.stdout}\n${r.stderr}`);
  return r.stdout;
}

export function d1Sql(sql: string, tgt: string) {
  const dir = mkdtempSync(join(tmpdir(), "spectra-"));
  const file = join(dir, "q.sql");
  writeFileSync(file, sql);
  try {
    return wrangler(["d1", "execute", DB_NAME, tgt, "--file", file, "--yes"]);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
}

export function d1Json<T = Record<string, unknown>>(sql: string, tgt: string): T[] {
  const out = wrangler(["d1", "execute", DB_NAME, tgt, "--command", sql, "--json", "--yes"]);
  const start = out.indexOf("[");
  return (JSON.parse(out.slice(start))[0]?.results ?? []) as T[];
}

export const q = (s: string | null | undefined) => (s == null ? "NULL" : `'${String(s).replace(/'/g, "''")}'`);