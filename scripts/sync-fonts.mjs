// Copies the Latin subsets from the @fontsource packages into public/fonts (self-hosted, preloadable).
import { copyFileSync, mkdirSync } from "node:fs";
const src = [
  ["@fontsource/lilita-one", "lilita-one-latin-400-normal.woff2"],
  ["@fontsource/anton", "anton-latin-400-normal.woff2"],
  ["@fontsource/great-vibes", "great-vibes-latin-400-normal.woff2"],
  ["@fontsource-variable/inter", "inter-latin-wght-normal.woff2"],
];
mkdirSync("public/fonts", { recursive: true });
for (const [pkg, file] of src) copyFileSync(`node_modules/${pkg}/files/${file}`, `public/fonts/${file}`);
console.log(`synced ${src.length} fonts to public/fonts`);
