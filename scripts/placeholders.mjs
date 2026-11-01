// Build-time warning: lists unresolved placeholder fields. Run via `npm run placeholders`.
import { readFileSync } from "node:fs";
const files = ["site", "events", "workshops", "team", "gallery", "stats", "testimonials"];
for (const f of files) {
  const src = readFileSync(`content/${f}.ts`, "utf8");
  const n = (src.match(/isPlaceholder: true/g) || []).length;
  const nulls = (src.match(/value: null/g) || []).length;
  const unset = (src.match(/(foundedYear|email): undefined/g) || []).length;
  if (n + nulls + unset) console.warn(`[placeholders] content/${f}.ts: ${n} placeholder entries, ${nulls} null stats, ${unset} unset fields`);
}
