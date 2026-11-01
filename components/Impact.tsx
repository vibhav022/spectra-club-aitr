import { CountUp } from "./CountUp";
import { RevealGroup, RevealItem } from "./Reveal";
import { stats } from "@/content/stats";
export function Impact() {
  const real = stats.filter((s) => s.value !== null);
  if (real.length < 2) return null;
  return (
    <section aria-label="Spectra impact" className="border-b border-white/10 py-16">
      <RevealGroup as="ul" className="container-x grid grid-cols-2 gap-8 text-left lg:grid-cols-4">
        {real.map((s) => (
          <RevealItem as="li" key={s.key} className="list-none">
            <p className="text-[length:var(--fs-stat)] font-semibold leading-none tracking-tight text-ink"><CountUp value={s.value as number} suffix={s.suffix} /></p>
            <p className="mt-3 text-sm text-accent-gold">{s.label}</p>
          </RevealItem>
        ))}
      </RevealGroup>
    </section>
  );
}
