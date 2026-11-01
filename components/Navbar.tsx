"use client";
import { useEffect, useRef, useState, useCallback } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { m, AnimatePresence, useReducedMotion, type Variants } from "framer-motion";
import { ArrowUpRight, Menu, X } from "lucide-react";
import { Logo } from "./Logo";
import type { NavLink } from "@/lib/nav";
import { useLiveLinks } from "@/lib/useLiveLinks";
import { useUpcomingEvents, eventHref, dateLabel, timeLabel } from "@/lib/useUpcomingEvents";
import { PlaceholderBadge } from "./PlaceholderBadge";

export function Navbar({ links: allLinks }: { links: NavLink[] }) {
  const links = useLiveLinks(allLinks);
  const pathname = usePathname();
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const activeId = links.find((l) => pathname === l.href || pathname.startsWith(`${l.href}/`))?.id ?? "";
  const toggleRef = useRef<HTMLButtonElement>(null);
  const drawerRef = useRef<HTMLDivElement>(null);
  const reduce = useReducedMotion();
  const v = drawerVariants(!!reduce);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 80);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const close = useCallback(() => { setOpen(false); toggleRef.current?.focus(); }, []);

  // The drawer is lg:hidden: if the viewport grows past that while it is open (rotation, resize), close it so the scroll lock is released.
  useEffect(() => {
    const mq = window.matchMedia("(min-width: 1024px)");
    const onChange = (e: MediaQueryListEvent) => { if (e.matches) setOpen(false); };
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);

  // Drawer: scroll lock, ESC, focus trap
  useEffect(() => {
    if (!open) return;
    document.body.style.overflow = "hidden";
    const root = drawerRef.current;
    const focusables = () => root?.querySelectorAll<HTMLElement>("a[href],button:not([disabled])") ?? [];
    focusables()[0]?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") return close();
      if (e.key !== "Tab") return;
      const f = Array.from(focusables());
      if (!f.length) return;
      const first = f[0], last = f[f.length - 1];
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    };
    document.addEventListener("keydown", onKey);
    return () => { document.body.style.overflow = ""; document.removeEventListener("keydown", onKey); };
  }, [open, close]);

  return (
    <>
    <header className="fixed inset-x-0 top-0 z-50 px-3 pt-3 sm:px-5 sm:pt-4">
      <nav aria-label="Primary" className={`relative mx-auto flex h-14 max-w-[var(--container-max)] items-center justify-between gap-4 rounded-full border pl-5 pr-2 backdrop-blur-xl transition-colors duration-300 lg:grid lg:grid-cols-[1fr_auto_1fr] ${scrolled ? "border-white/15 bg-black/70" : "border-white/10 bg-black/35"}`}>
        <Link href="/" aria-label="Spectra, home" className="justify-self-start rounded-md"><Logo className="h-8" /></Link>

        <ul className="hidden items-center gap-0.5 lg:flex">
          {links.map((l) => (
            <li key={l.id}>
              <Link href={l.href} aria-current={activeId === l.id ? "true" : undefined}
                className="relative isolate inline-flex min-h-[40px] items-center rounded-full px-3.5 text-sm text-ink-soft transition-colors hover:text-ink aria-[current=true]:text-ink">
                {l.label}
                {activeId === l.id && <m.span layoutId="nav-underline" className="absolute inset-x-3.5 bottom-1 h-px bg-gradient-to-r from-[var(--color-accent)] to-[var(--color-accent-2)]" />}
              </Link>
            </li>
          ))}
        </ul>

        <div className="ml-auto flex items-center gap-2 lg:justify-self-end">
          <button ref={toggleRef} type="button" className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-white/12 bg-white/5 text-ink lg:hidden"
            aria-label="Open menu" aria-expanded={open} aria-controls="mobile-drawer" onClick={() => setOpen(true)}>
            <Menu aria-hidden="true" />
          </button>
        </div>
      </nav>
    </header>

      <AnimatePresence>
        {open && (
          <m.div id="mobile-drawer" ref={drawerRef} role="dialog" aria-modal="true" aria-label="Menu"
            variants={v.overlay} initial="closed" animate="open" exit="closed"
            className="fixed inset-0 z-50 flex flex-col overflow-y-auto overscroll-contain bg-bg-deep lg:hidden">
            {/* Header stays pinned so the close button is always reachable, even when the list scrolls on short phones. */}
            <m.div variants={v.fade} className="sticky top-0 z-10 bg-bg-deep pl-[max(var(--gutter),env(safe-area-inset-left))] pr-[max(var(--gutter),env(safe-area-inset-right))] pt-[max(1rem,env(safe-area-inset-top))]">
              <div className="relative flex h-16 items-center justify-between">
                <Logo className="h-10" />
                <button type="button" aria-label="Close menu" onClick={close} className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-white/15 bg-white/5 text-ink transition-colors hover:border-white/35 hover:bg-white/10 active:bg-white/15"><X aria-hidden="true" /></button>
              </div>
            </m.div>

            <div className="flex flex-1 flex-col pb-[max(1.5rem,env(safe-area-inset-bottom))] pl-[max(var(--gutter),env(safe-area-inset-left))] pr-[max(var(--gutter),env(safe-area-inset-right))]">
              <m.ul variants={v.list} className="mt-6 flex flex-col gap-1">
                {links.map((l) => {
                  const active = activeId === l.id;
                  return (
                    <m.li key={l.id} variants={v.item}>
                      <Link href={l.href} onClick={close} aria-current={active ? "true" : undefined}
                        className="group relative flex min-h-[56px] items-center rounded-2xl px-4 text-3xl font-semibold tracking-tight text-ink-soft transition-[color,background-color] duration-200 hover:bg-white/[0.04] hover:text-ink focus-visible:bg-white/[0.06] focus-visible:text-ink active:bg-white/[0.08] aria-[current=true]:bg-accent/[0.07] aria-[current=true]:text-ink">
                        {/* Teal side indicator: full height for the current page, a short hint on hover/focus. */}
                        <span aria-hidden="true" className={`absolute left-0 top-1/2 h-7 w-[3px] -translate-y-1/2 rounded-full bg-accent transition-[transform,opacity] duration-300 motion-reduce:transition-none ${active ? "scale-y-100 opacity-100" : "scale-y-50 opacity-0 group-hover:opacity-70 group-focus-visible:opacity-70"}`} />
                        {l.label}
                      </Link>
                    </m.li>
                  );
                })}
              </m.ul>

              <MenuEvent variants={v.item} onNavigate={close} />
            </div>
          </m.div>
        )}
      </AnimatePresence>
    </>
  );
}

/** Overlay fades; the logo/close row fades in first, links stagger ~65ms apart, and closing reverses it faster and quieter. Reduced motion: opacity only, no offsets or stagger. */
function drawerVariants(reduce: boolean): Record<"overlay" | "fade" | "list" | "item", Variants> {
  const y = reduce ? 0 : 14;
  return {
    overlay: {
      closed: { opacity: 0, transition: { duration: 0.22, ease: "easeIn", when: "afterChildren" } },
      open: { opacity: 1, transition: { duration: 0.25, ease: "easeOut" } },
    },
    fade: {
      closed: { opacity: 0, y: reduce ? 0 : -6, transition: { duration: 0.16, ease: "easeIn" } },
      open: { opacity: 1, y: 0, transition: { duration: 0.35, ease: "easeOut", delay: 0.05 } },
    },
    list: {
      closed: { transition: { staggerChildren: reduce ? 0 : 0.025, staggerDirection: -1 } },
      open: { transition: { staggerChildren: reduce ? 0 : 0.065, delayChildren: reduce ? 0 : 0.12 } },
    },
    item: {
      closed: { opacity: 0, y: -y / 2, transition: { duration: 0.16, ease: "easeIn" } },
      open: { opacity: 1, y: 0, transition: { duration: 0.45, ease: [0.22, 0.8, 0.3, 1] } },
    },
  };
}

/**
 * Compact "Upcoming Event" shortcut for the mobile menu. Same live source as the hero widget (useUpcomingEvents),
 * so nothing is hardcoded. Renders nothing while loading or when no event is configured (no empty card).
 * It sits at the bottom of the drawer, so it appearing after the fetch never moves the links.
 */
function MenuEvent({ variants, onNavigate }: { variants: Variants; onNavigate: () => void }) {
  const { cfgs, now, loading } = useUpcomingEvents(1, 60_000);
  const c = cfgs[0];
  if (loading || !c) return null;
  const live = now !== null && now >= new Date(c.startsAt).getTime();
  return (
    <m.div variants={variants} className="mt-auto pt-8">
      <Link href={eventHref(c)} onClick={onNavigate}
        className="group relative flex min-h-[44px] items-center justify-between gap-4 overflow-hidden rounded-2xl border border-white/12 bg-[#0C1214]/85 p-4 transition-colors duration-200 hover:border-accent/40 active:bg-white/[0.06]">
        <span aria-hidden="true" className="pointer-events-none absolute inset-x-6 top-0 h-px bg-gradient-to-r from-transparent via-white/30 to-transparent" />
        <span className="min-w-0">
          <span className="flex items-center gap-2 text-[0.68rem] font-medium uppercase tracking-[0.18em] text-accent-gold">
            <span aria-hidden="true" className="badge-dot" />{live ? "Happening now" : "Upcoming Event"}
            <PlaceholderBadge show={c.isPlaceholder} />
          </span>
          <span className="mt-1.5 block truncate text-lg font-semibold tracking-tight text-ink">{c.title}</span>
          <span className="block truncate text-sm text-ink-soft">{dateLabel(c.startsAt)} · {timeLabel(c.startsAt)}{c.venue ? ` · ${c.venue}` : ""}</span>
        </span>
        <span aria-hidden="true" className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-white/12 bg-white/[0.05] text-ink transition-transform duration-200 group-hover:-translate-y-0.5 group-hover:translate-x-0.5 motion-reduce:transform-none">
          <ArrowUpRight className="h-4 w-4" />
        </span>
      </Link>
    </m.div>
  );
}