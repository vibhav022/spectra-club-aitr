import Image from "next/image";
import Link from "next/link";
import { ArrowUp, Mail } from "lucide-react";
import { LOGO } from "@/lib/logo";
import { site, INSTAGRAM_HANDLE } from "@/content/site";
import { events } from "@/content/events";
import { visible } from "@/lib/visibility";
import type { NavLink } from "@/lib/nav";
import { QuickLinks } from "./QuickLinks";

/* This lucide version ships no brand icons, so these are simple inline SVGs. */
const svg = { viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: 1.8, strokeLinecap: "round", strokeLinejoin: "round", className: "h-5 w-5", "aria-hidden": true } as const;
const Instagram = () => <svg {...svg}><rect x="3" y="3" width="18" height="18" rx="5" /><circle cx="12" cy="12" r="4" /><circle cx="17.5" cy="6.5" r="0.6" fill="currentColor" /></svg>;
const Linkedin = () => <svg {...svg}><rect x="3" y="3" width="18" height="18" rx="3" /><path d="M8 11v5M8 8v.01M12 16v-5M12 13a2.5 2.5 0 0 1 5 0v3" /></svg>;
const Youtube = () => <svg {...svg}><rect x="2.5" y="5.5" width="19" height="13" rx="4" /><path d="m10 9.5 5 2.5-5 2.5z" fill="currentColor" /></svg>;

const ext = { target: "_blank", rel: "noopener noreferrer" } as const;
const head = "text-[0.7rem] font-medium uppercase tracking-[0.2em] text-accent";
const link = "inline-flex min-h-[36px] items-center text-sm text-ink-soft transition-colors hover:text-ink";
const icon = "inline-flex h-11 w-11 items-center justify-center rounded-full border border-white/15 text-ink transition-colors hover:border-white/40 hover:bg-white/10";

export function Footer({ links }: { links: NavLink[] }) {
  const { socials, email } = site;
  const flagships = visible(events).slice(0, 5);
  return (
    <footer className="px-3 pb-3 pt-4 sm:px-5 sm:pb-5">
      <div className="relative isolate mx-auto max-w-[1400px] overflow-hidden rounded-[2rem] border border-white/10 bg-[#090F11]">
        <div aria-hidden="true" className="absolute inset-0 -z-10 [background:radial-gradient(55%_70%_at_100%_0%,rgba(94, 224, 208,0.14),transparent_70%),radial-gradient(40%_50%_at_0%_100%,rgba(233, 163, 107,0.06),transparent_70%)]" />

        <div className="grid grid-cols-2 gap-x-6 gap-y-10 px-6 py-12 sm:px-12 sm:py-14 lg:grid-cols-[1.5fr_1fr_1.2fr_1.3fr] lg:gap-10">
          <div className="col-span-2 max-w-sm lg:col-span-1">
            <Link href="/" aria-label="Spectra, home" className="inline-block rounded-md">
              <Image src={LOGO.navSrc} alt="Spectra" width={LOGO.navWidth} height={LOGO.navHeight} className="h-14 w-auto" />
            </Link>
            <p className="mt-5 text-base leading-relaxed text-ink-soft sm:mt-6 sm:text-lg">The official CSE student club of Acropolis Institute of Technology &amp; Research, Indore.</p>
            <ul className="mt-7 flex gap-3" aria-label="Social links">
              <li><a href={socials.instagram} className={icon} {...ext} aria-label="Instagram (opens in new tab)"><Instagram /></a></li>
              {socials.linkedin && <li><a href={socials.linkedin} className={icon} {...ext} aria-label="LinkedIn (opens in new tab)"><Linkedin /></a></li>}
              {socials.youtube && <li><a href={socials.youtube} className={icon} {...ext} aria-label="YouTube (opens in new tab)"><Youtube /></a></li>}
              {email && <li><a href={`mailto:${email}`} className={icon} aria-label="Email Spectra"><Mail className="h-5 w-5" aria-hidden="true" /></a></li>}
            </ul>
          </div>

          <nav aria-label="Footer">
            <p className={head}>Quick links</p>
            <QuickLinks links={links} className="mt-5 space-y-1" linkClassName={link} />
          </nav>

          {flagships.length > 0 && (
            <div className="min-w-0">
              <p className={head}>Flagship events</p>
              <ul className="mt-5 space-y-1">
                {flagships.map((e) => <li key={e.slug}><Link href={`/events/${e.slug}/`} className={link}>{e.title}</Link></li>)}
              </ul>
            </div>
          )}

          <div className="col-span-2 lg:col-span-1">
            <p className={head}>Club &amp; contact</p>
            <p className="mt-6 text-base font-medium text-ink">Spectra, CSE Club</p>
            <p className="mt-1 text-[0.7rem] uppercase tracking-[0.16em] text-ink-soft/70">AITR · Indore, India</p>
            <ul className="mt-5 space-y-1.5">
              <li><a href={socials.instagram} className={link} {...ext}>{INSTAGRAM_HANDLE}<span className="sr-only"> on Instagram (opens in new tab)</span></a></li>
              {email && <li><a href={`mailto:${email}`} className={link}>{email}</a></li>}
            </ul>
          </div>
        </div>

        <div className="border-t border-white/10">
          <div className="grid items-center gap-2 px-6 py-5 text-[0.7rem] uppercase tracking-[0.14em] text-ink-soft/70 sm:px-12 md:grid-cols-3">
            <p>© {new Date().getFullYear()} Spectra, CSE Club, AITR. All rights reserved.</p>
            <p className="md:text-center">Tech · Culture · Innovation</p>
            <a href="#top" className="inline-flex min-h-[36px] items-center gap-1 hover:text-ink md:justify-self-end">Back to top <ArrowUp className="h-3 w-3" aria-hidden="true" /></a>
          </div>
        </div>
      </div>
    </footer>
  );
}
