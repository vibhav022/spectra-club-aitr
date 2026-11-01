/** Decorative scrolling bands. Words are the club's own pillars and flagship names. */
const ROW_A = ["Tech", "Culture", "Innovation", "Community"];
const ROW_B = ["Thirak", "Sur Sangram", "Cyber Awareness", "Nexus"];

function Tri() {
  return (
    <svg viewBox="0 0 32 32" className="h-[0.55em] w-[0.55em] shrink-0 text-white" aria-hidden="true">
      <path d="M2 28 16 4l14 24z" fill="none" stroke="currentColor" strokeWidth="3" strokeLinejoin="round" />
    </svg>
  );
}
function Track({ words, offset = 0 }: { words: string[]; offset?: number }) {
  return (
    <div className="marquee-track">
      {[...words, ...words].map((w, i) => (
        <span key={i} className="flex items-center gap-10">
          <span className={`marquee-item ${(i + offset) % 2 ? "marquee-outline" : "text-ink"}`}>{w}</span>
          <Tri />
        </span>
      ))}
    </div>
  );
}
export function Marquee() {
  return (
    <div aria-hidden="true" className="space-y-4 border-y border-white/10 bg-bg-base py-6">
      <div className="marquee"><Track words={ROW_A} /><Track words={ROW_A} /></div>
      <div className="marquee reverse"><Track words={ROW_B} offset={1} /><Track words={ROW_B} offset={1} /></div>
    </div>
  );
}
