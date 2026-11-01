import { stats } from "@/content/stats";
export function HeroStats() {
  const real = stats.filter((s) => s.value !== null);
  if (!real.length) return null;
  return (
    <dl className="mt-16 flex flex-wrap gap-x-14 gap-y-6 border-t border-white/10 pt-8">
      {real.map((s) => (
        <div key={s.key}><dd className="text-3xl font-semibold tracking-tight text-ink">{s.value}{s.suffix}</dd><dt className="text-xs text-accent-gold">{s.label}</dt></div>
      ))}
    </dl>
  );
}
