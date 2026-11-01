// WCAG AA contrast check for every text/background token pair used on the site.
const hex = { deep: "050608", base: "080A10", surface: "11131D", primary: "F5F7FF", gold: "9AA0BE", teal: "62D9F2",
  ink: "F5F7FF", soft: "BEC3DA", danger: "e74c3c", dangerText: "ff8a7a" };
const rgb = (h) => [0, 2, 4].map((i) => parseInt(h.slice(i, i + 2), 16));
const lum = (h) => { const [r, g, b] = rgb(h).map((v) => { v /= 255; return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4; }); return 0.2126 * r + 0.7152 * g + 0.0722 * b; };
const ratio = (a, b) => { const [x, y] = [lum(a), lum(b)].sort((p, q) => q - p); return (x + 0.05) / (y + 0.05); };
const mix = (fg, bg, a) => rgb(fg).map((v, i) => Math.round(v * a + rgb(bg)[i] * (1 - a)).toString(16).padStart(2, "0")).join("");
const pairs = [
  ["body ink-soft on bg-deep", hex.soft, hex.deep], ["body ink-soft on bg-base", hex.soft, hex.base], ["body ink-soft on surface", hex.soft, hex.surface],
  ["headings ink on surface", hex.ink, hex.surface], ["eyebrow gold on bg-deep", hex.gold, hex.deep], ["eyebrow gold on bg-base", hex.gold, hex.base], ["gold on surface", hex.gold, hex.surface],
  ["links primary on bg-deep", hex.primary, hex.deep], ["links primary on bg-base", hex.primary, hex.base], ["primary on surface", hex.primary, hex.surface],
  ["button text bg-deep on primary", hex.deep, hex.primary], ["teal chip on surface", hex.teal, hex.surface],
  ["danger #E74C3C on bg-deep", hex.danger, hex.deep], ["error text tint on surface", hex.dangerText, hex.surface], ["error text tint on bg-deep", hex.dangerText, hex.deep],
  ["input placeholder (ink-soft 60%) on bg-deep", mix(hex.soft, hex.deep, 0.6), hex.deep],
];
let fail = 0;
for (const [n, f, b] of pairs) { const r = ratio(f, b); const ok = r >= 4.5; if (!ok) fail++; console.log(`${ok ? "PASS" : "FAIL"} ${r.toFixed(2)}  ${n}`); }
process.exit(fail ? 1 : 0);
