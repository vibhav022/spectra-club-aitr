"use client";
import Image from "next/image";
import { useId, useState, useSyncExternalStore } from "react";
import { ChevronDown, User } from "lucide-react";
import { Spot } from "./Spot";
import { RevealGroup, RevealItem, RevealImage } from "./Reveal";
import { SectionHead } from "./SectionHead";
import { PlaceholderBadge } from "./PlaceholderBadge";
import { ComingSoon } from "./ComingSoon";
import { team, type Member } from "@/content/team";
import { visible } from "@/lib/visibility";
import { mediaSrc } from "@/lib/api";
import { useLive, type ApiMember } from "@/lib/live";

/** Committee from the live database (team + faculty). Falls back to the bundled content only if the API genuinely fails. */
function useMembers(): { state: "loading" | "ok" | "error"; list: Member[] } {
  const t = useLive<{ items: ApiMember[] }>("/api/public/team");
  const f = useLive<{ items: ApiMember[] }>("/api/public/faculty");
  if (t.status === "loading" || f.status === "loading") return { state: "loading", list: [] };
  if (t.status === "error" || f.status === "error") return { state: "error", list: visible(team) };
  const map = (m: ApiMember): Member => ({ id: m.id, name: m.name, role: m.role, tier: m.tier, photo: mediaSrc(m.photo), instagram: m.instagram ?? undefined, linkedin: m.linkedin ?? undefined, bio: m.bio ?? undefined, specialization: m.specialization ?? undefined, contributions: m.contributions ?? undefined, department: m.department ?? undefined });
  return { state: "ok", list: [...t.data.items, ...f.data.items].map(map) };
}

function Avatar({ m, className, zoom = false }: { m: Member; className: string; zoom?: boolean }) {
  const base = `${className} relative shrink-0 overflow-hidden rounded-[var(--radius-image)] border border-white/10 bg-surface transition group-hover:border-white/50`;
  if (m.photo) return (
    <div className={base}>
      <RevealImage className="absolute inset-0">
        <Image src={m.photo} alt={`Photo of ${m.name}`} fill sizes="(min-width:768px) 20vw, 45vw" className={`spot-img object-cover transition-transform duration-500 ease-out ${zoom ? "scale-[1.04]" : ""}`} />
      </RevealImage>
    </div>
  );
  return (
    <div role="img" aria-label={`${m.role} (photo to be added)`} className={`${base} flex items-center justify-center`}>
      <User className="h-1/3 w-1/3 text-white/25" strokeWidth={1.25} aria-hidden="true" />
    </div>
  );
}
function Name({ m, className }: { m: Member; className: string }) {
  return m.isPlaceholder
    ? <p className="mt-1 flex flex-wrap items-center gap-2 text-sm italic text-ink-soft/60">{m.name} <PlaceholderBadge show /></p>
    : <h3 className={className}>{m.name}</h3>;
}
const role = "text-[0.7rem] font-medium uppercase tracking-[0.16em] text-accent-gold";

/* This lucide version ships no brand icons, so these are simple inline SVGs (same as the footer). */
const svg = { viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: 1.8, strokeLinecap: "round", strokeLinejoin: "round", className: "h-5 w-5", "aria-hidden": true } as const;
const InstagramIcon = () => <svg {...svg}><rect x="3" y="3" width="18" height="18" rx="5" /><circle cx="12" cy="12" r="4" /><circle cx="17.5" cy="6.5" r="0.6" fill="currentColor" /></svg>;
const LinkedinIcon = () => <svg {...svg}><rect x="3" y="3" width="18" height="18" rx="3" /><path d="M8 11v5M8 8v.01M12 16v-5M12 13a2.5 2.5 0 0 1 5 0v3" /></svg>;

/** Hover-style reveal only where a real hover exists (mouse, desktop-width). Everything else gets tap-to-expand. */
const HOVER_PROFILES = "(hover: hover) and (pointer: fine) and (min-width: 768px)";
const subscribeHover = (cb: () => void) => { const q = window.matchMedia(HOVER_PROFILES); q.addEventListener("change", cb); return () => q.removeEventListener("change", cb); };
const useHoverProfiles = () => useSyncExternalStore(subscribeHover, () => window.matchMedia(HOVER_PROFILES).matches, () => false);

const isHttp = (u?: string) => !!u && /^https?:\/\//i.test(u);
const subLabel = "text-[0.62rem] font-medium uppercase tracking-[0.16em] text-ink-soft/70";
const ease = "ease-[cubic-bezier(0.22,1,0.36,1)]"; // decelerates and settles; no overshoot

/** Only fields that actually have content; empty ones render nothing (no headings, no placeholders). */
function detailsOf(m: Member) {
  const f: { key: string; label?: string; text: string }[] = [];
  if (m.bio?.trim()) f.push({ key: "bio", text: m.bio.trim() });
  if (m.specialization?.trim()) f.push({ key: "spec", label: "Specialization", text: m.specialization.trim() });
  if (m.contributions?.trim()) f.push({ key: "contrib", label: "Contributions", text: m.contributions.trim() });
  return f;
}
function socialsOf(m: Member) {
  const s: { key: string; href: string; label: string; icon: React.ReactNode }[] = [];
  if (isHttp(m.instagram)) s.push({ key: "ig", href: m.instagram!, label: `${m.name} on Instagram`, icon: <InstagramIcon /> });
  if (isHttp(m.linkedin)) s.push({ key: "in", href: m.linkedin!, label: `${m.name} on LinkedIn`, icon: <LinkedinIcon /> });
  return s;
}

/**
 * Image-first profile card (leadership and core), wrapped in your existing <Spot/> lighting.
 * Name and role always sit on the photo. If the person has any extra details or links:
 *  - hover-capable desktops reveal them upward over the photo on hover / keyboard focus;
 *  - touch (and narrow) screens get a real button that expands them under the photo (aria-expanded, Escape closes).
 */
function Profile({ m, variant }: { m: Member; variant: "lead" | "core" }) {
  const lead = variant === "lead";
  const hoverMode = useHoverProfiles();
  const panelId = useId();
  const [pinned, setPinned] = useState(false);
  const [hovered, setHovered] = useState(false);
  const [focused, setFocused] = useState(false);
  const fields = detailsOf(m); const socials = socialsOf(m);
  const hasPanel = fields.length > 0 || socials.length > 0;
  const open = hasPanel && (pinned || (hoverMode && (hovered || focused)));
  // Over the photo, keep the panel compact so most of the portrait stays visible; the full text is in the DOM and shown when expanded on touch.
  const clampOf = (key: string) => (!hoverMode ? "" : key === "bio" || lead ? "line-clamp-2" : "line-clamp-1");
  const icon = hoverMode ? (lead ? "h-10 w-10" : "h-9 w-9") : "h-11 w-11";

  const panel = (
    <div className={`grid transition-[grid-template-rows,opacity,visibility] duration-[380ms] ${ease} ${open ? "visible grid-rows-[1fr] opacity-100" : "invisible grid-rows-[0fr] opacity-0"}`}>
      <div className="min-h-0 overflow-hidden">
        <div id={panelId} className={`-m-1 space-y-2.5 p-1 pt-3 transition-transform duration-[380ms] ${ease} ${open ? "translate-y-0" : "translate-y-3"}`}>
          {fields.map((f) => (
            <div key={f.key}>
              {f.label && <p className={subLabel}>{f.label}</p>}
              <p className={`${f.label ? "mt-0.5" : ""} text-xs leading-relaxed text-ink-soft ${clampOf(f.key)}`}>{f.text}</p>
            </div>
          ))}
          {socials.length > 0 && (
            <ul className="pointer-events-auto flex gap-2 pt-0.5">
              {socials.map((s, i) => (
                <li key={s.key} style={{ "--d": `${120 + i * 70}ms` } as React.CSSProperties}
                  className={`transition-[opacity,transform] duration-300 ${ease} [transition-delay:var(--d)] motion-reduce:[transition-delay:0ms] ${open ? "translate-y-0 opacity-100" : "translate-y-2 opacity-0"}`}>
                  <a href={s.href} target="_blank" rel="noopener noreferrer" aria-label={`${s.label} (opens in new tab)`}
                    className={`inline-flex ${icon} items-center justify-center rounded-full border border-white/15 bg-white/5 text-ink transition-colors hover:border-white/40 hover:bg-white/10`}>
                    {s.icon}
                  </a>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );

  return (
    // Spot keeps the cursor-following light. The border lights up while the profile is open (has-[...] reads the button's aria-expanded).
    <Spot tap={lead ? undefined : false} className={`group glass h-full rounded-[var(--radius-card)] ${lead ? "p-4" : "p-3"} transition-colors duration-300 hover:border-white/25 has-[button[aria-expanded=true]]:border-accent/45!`}>
      <div
        onPointerEnter={(e) => { if (e.pointerType === "mouse") setHovered(true); }}
        onPointerLeave={() => setHovered(false)}
        onFocus={(e) => setFocused(e.target.matches(":focus-visible"))}
        onBlur={(e) => { if (!e.currentTarget.contains(e.relatedTarget as Node | null)) setFocused(false); }}
        onKeyDown={(e) => { if (e.key === "Escape" && open) { setPinned(false); setHovered(false); setFocused(false); } }}
      >
        <div className="relative">
          <Avatar m={m} zoom={open && hoverMode} className={lead ? "aspect-[5/4] w-full sm:aspect-[4/5]" : "aspect-[3/4] w-full"} />
          {hoverMode && hasPanel && <div aria-hidden="true" className={`pointer-events-none absolute inset-0 rounded-[var(--radius-image)] bg-bg-deep/30 transition-opacity duration-300 ${open ? "opacity-100" : "opacity-0"}`} />}
          {hasPanel && (
            <button type="button" aria-expanded={open} aria-controls={panelId} aria-label={`${m.name}, ${m.role}. ${open ? "Hide" : "Show"} profile details`}
              onClick={() => setPinned((v) => !v)} className="absolute inset-0 z-10 rounded-[var(--radius-image)]" />
          )}
          {!hoverMode && hasPanel && (
            <span aria-hidden="true" className="pointer-events-none absolute right-2 top-2 z-20 grid h-8 w-8 place-items-center rounded-full border border-white/15 bg-bg-deep/70 text-ink">
              <ChevronDown className={`h-4 w-4 transition-transform duration-300 ${open ? "rotate-180" : ""}`} />
            </span>
          )}
          <div className={`pointer-events-none absolute inset-x-0 bottom-0 z-20 flex max-h-[88%] flex-col justify-end rounded-b-[var(--radius-image)] bg-gradient-to-t from-bg-deep/95 via-bg-deep/60 to-transparent px-3 pb-3 ${lead ? "pt-16" : "pt-12"}`}>
            <p className={`${role} spot-shift-sm`}>{m.role}</p>
            <Name m={m} className={`spot-shift ${lead ? "mt-1 text-xl font-semibold tracking-tight text-ink" : "mt-0.5 text-base font-bold text-ink"}`} />
            {hoverMode && hasPanel && panel}
          </div>
        </div>
        {!hoverMode && hasPanel && <div className="px-1">{panel}</div>}
      </div>
    </Spot>
  );
}

/** Faculty: a compact horizontal card so it never towers over the rest of the grid. (Unchanged from your version.) */
function Faculty({ m }: { m: Member }) {
  return (
    <Spot tap={false} className="group glass flex h-full items-center gap-4 rounded-[var(--radius-card)] p-3 pr-6">
      <Avatar m={m} className="h-20 w-20 sm:h-24 sm:w-24" />
      <div className="spot-shift min-w-0">
        <p className={role}>{m.role}</p>
        <Name m={m} className="mt-1 text-lg font-semibold tracking-tight text-ink" />
        {m.department && <p className="mt-0.5 text-sm text-ink-soft">{m.department}</p>}
      </div>
    </Spot>
  );
}

export function Team({ asPage = false }: { asPage?: boolean }) {
  const { state, list } = useMembers();
  if (state === "loading") return <section id="team" aria-busy="true" aria-label="Loading team" className={`section-y ${asPage ? "min-h-[70svh] pt-32" : ""}`} />;
  if (!list.length) return asPage ? <ComingSoon eyebrow="Team" title="Committee coming soon" text="We're updating our committee page. Check back soon." /> : null;
  const by = (t: Member["tier"]) => list.filter((x) => x.tier === t);
  return (
    <section id="team" aria-labelledby="team-title" className={`section-y ${asPage ? "pt-32" : ""}`}>
      <div className="container-x space-y-10">
        <SectionHead id="team-title" eyebrow="Team" title={by("leadership").length + by("core").length ? "Meet the core committee" : "Meet our faculty"} as={asPage ? "h1" : "h2"} />
        {asPage && <h2 className="sr-only">Committee members</h2>}
        {by("leadership").length > 0 && (
          <RevealGroup as="ul" className="grid items-start gap-5 sm:grid-cols-3">
            {by("leadership").map((m, i) => <RevealItem as="li" key={m.id ?? i} className="list-none"><Profile m={m} variant="lead" /></RevealItem>)}
          </RevealGroup>
        )}
        {by("core").length > 0 && (
          <RevealGroup as="ul" className="grid grid-cols-2 items-start gap-4 md:grid-cols-4">
            {by("core").map((m, i) => <RevealItem as="li" key={m.id ?? i} className="list-none"><Profile m={m} variant="core" /></RevealItem>)}
          </RevealGroup>
        )}
        {by("faculty").length > 0 && (
          <RevealGroup as="ul" className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {by("faculty").map((m, i) => <RevealItem as="li" key={m.id ?? i} className="list-none"><Faculty m={m} /></RevealItem>)}
          </RevealGroup>
        )}
      </div>
    </section>
  );
}