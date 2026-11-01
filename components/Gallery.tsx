"use client";
import { useCallback, useEffect, useMemo, useRef, useState, useSyncExternalStore } from "react";
import dynamic from "next/dynamic";
import Image from "next/image";
import { AnimatePresence, m, useReducedMotion, type Variants } from "framer-motion";
import Link from "next/link";
import { Expand, Play } from "lucide-react";
import { SectionHead } from "./SectionHead";
import { Slot } from "./Slot";
import { Spot } from "./Spot";
import { site, INSTAGRAM_HANDLE } from "@/content/site";
import { galleryKey, mediaLayoutId, type GalleryItem } from "@/content/gallery";

// Held in a variable so a thumbnail can warm the chunk on hover/focus/touch; the click then opens instantly.
const loadLightbox = () => import("./Lightbox");
const preloadLightbox = () => { void loadLightbox(); };
const Lightbox = dynamic(loadLightbox, { ssr: false });
const DEFAULT_CATEGORIES = ["Tech", "Cultural", "Community", "Recap"];
const isRecapCategory = (name: string) => name.trim().toLocaleLowerCase() === "recap";
type Filter = string;

const EASE: [number, number, number, number] = [0.22, 1, 0.36, 1];
/** Desktop gets a longer, wider reveal; phones get a shorter, lighter one. `step`/`cap` bound the stagger (max delay = step × cap). */
const DESKTOP = { step: 0.07, cap: 6, dur: 0.85, clip: 14, from: 1.08 };
const PHONE = { step: 0.045, cap: 4, dur: 0.55, clip: 8, from: 1.04 };
/** Above this many visible items, skip per-item layout/exit animation so very large galleries stay cheap. Reveals still run (only for items in view). */
const RICH_LIMIT = 48;

const WIDE = "(min-width: 768px)";
function useWide() {
  return useSyncExternalStore(
    (notify) => { const mq = window.matchMedia(WIDE); mq.addEventListener("change", notify); return () => mq.removeEventListener("change", notify); },
    () => window.matchMedia(WIDE).matches,
    () => false,
  );
}

/** Tile fade/stagger lives on the outer item; the clip-path + settle-scale lives on the image so the border and rounded corners stay crisp. */
function makeVariants(wide: boolean, reduce: boolean): { item: Variants; media: Variants } {
  const p = wide ? DESKTOP : PHONE;
  return {
    item: {
      hidden: { opacity: 0 },
      show: (delay: number) => ({ opacity: 1, transition: { duration: reduce ? 0.2 : p.dur * 0.55, delay: reduce ? 0 : delay, ease: "easeOut" } }),
      exit: reduce ? { opacity: 0, transition: { duration: 0.15 } } : { opacity: 0, scale: 0.97, transition: { duration: 0.28, ease: "easeIn" } },
    },
    media: {
      hidden: { clipPath: `inset(${p.clip}% 0% 0% 0%)`, scale: p.from },
      show: (delay: number) => ({ clipPath: "inset(0% 0% 0% 0%)", scale: 1, transition: { duration: p.dur, delay, ease: EASE } }),
    },
  };
}

/** Grid tile. Photos use their thumbnail when there is one; videos show their poster. Missing or failed media falls back to the designed tile. */
function Thumb({ it }: { it: GalleryItem }) {
  const [failed, setFailed] = useState(false);
  const src = it.kind === "video" ? it.thumb : (it.thumb ?? it.src);
  if (src && !failed) return <Image src={src} alt="" width={it.width} height={it.height} sizes="(min-width:1024px) 33vw, 50vw" loading="lazy" onError={() => setFailed(true)} className="spot-img h-auto w-full" />;
  return <div aria-hidden="true" style={{ aspectRatio: `${it.width}/${it.height}` }} className="spot-img flex w-full items-center justify-center bg-gradient-to-br from-surface to-bg-deep"><Slot /></div>;
}

export function Gallery({ items, categories = DEFAULT_CATEGORIES, limit, asPage = false }: { items: GalleryItem[]; categories?: string[]; limit?: number; asPage?: boolean }) {
  const [filter, setFilter] = useState<Filter>(items.length ? "All" : "Recap");
  // Recap is a dedicated public view, not a second ordinary category chip.
  const normalCategories = categories.filter((category, index, all) =>
    !isRecapCategory(category) && all.findIndex((candidate) => candidate.toLocaleLowerCase() === category.toLocaleLowerCase()) === index,
  );
  const hasRecap = categories.some(isRecapCategory) || items.some((item) => isRecapCategory(item.category));
  const filters: Filter[] = ["All", ...normalCategories, ...(hasRecap ? ["Recap"] : [])];
  // The viewer is tracked by stable item id, never by array index, so filters/reordering can't make it show the wrong item.
  const [openId, setOpenId] = useState<string | null>(null);
  const [staggering, setStaggering] = useState(true);
  const [lockH, setLockH] = useState<number | undefined>(undefined);
  const grid = useRef<HTMLDivElement>(null);
  const thumbs = useRef(new Map<string, HTMLElement>());
  const trigger = useRef<HTMLElement | null>(null);
  const lastId = useRef<string | null>(null);
  const reduce = !!useReducedMotion();
  const wide = useWide();
  const showRecap = filter === "Recap";
  const shown = useMemo(() => {
    const list = filter === "All" ? items : filter === "Recap" ? items.filter((item) => isRecapCategory(item.category)) : items.filter((i) => i.category === filter);
    return list.slice(0, limit);
  }, [items, filter, limit]);
  const variants = useMemo(() => makeVariants(wide, reduce), [wide, reduce]);
  const openItem = openId === null ? undefined : shown.find((it) => galleryKey(it) === openId);
  // The open item left the current list (filter/data changed): close rather than show something else.
  if (openId !== null && !openItem) setOpenId(null);
  const p = wide ? DESKTOP : PHONE;
  const rich = shown.length <= RICH_LIMIT;

  // Stagger only the first moments after load / a filter change; items scrolled into view later reveal without waiting.
  useEffect(() => { const t = setTimeout(() => setStaggering(false), 1400); return () => clearTimeout(t); }, [filter]);
  // Holds the grid's height while old items leave, then eases it down, so the page below doesn't jump.
  useEffect(() => { if (lockH === undefined) return; const t = setTimeout(() => setLockH(undefined), 700); return () => clearTimeout(t); }, [lockH]);

  const changeFilter = (f: Filter) => {
    if (f === filter) return;
    setLockH(grid.current?.offsetHeight);
    setStaggering(true);
    setFilter(f);
  };
  const openViewer = (id: string, el: HTMLElement) => { trigger.current = el; lastId.current = id; setOpenId(id); };
  const changeViewer = useCallback((id: string) => { lastId.current = id; setOpenId(id); }, []);
  const close = useCallback(() => setOpenId(null), []);
  // Runs once the viewer has finished animating out. Focus returns to the thumbnail of the item that was on screen (the opener unless the user navigated).
  const restoreFocus = useCallback(() => {
    const el = (lastId.current !== null ? thumbs.current.get(lastId.current) : undefined) ?? (trigger.current?.isConnected ? trigger.current : null);
    el?.focus();
  }, []);

  if (!items.length) return null;
  return (
    <section id="gallery" aria-labelledby="gallery-title" className={`section-y border-b border-white/10 ${asPage ? "pt-32" : ""}`}>
      <div className="container-x">
        <SectionHead id="gallery-title" eyebrow="Gallery" title="Moments from the stage" as={asPage ? "h1" : "h2"} />
        <div role="group" aria-label="Filter gallery" className="no-scrollbar -mx-[var(--gutter)] mt-8 flex gap-2 overflow-x-auto px-[var(--gutter)] pb-1 sm:mx-0 sm:flex-wrap sm:overflow-visible sm:px-0">
          {filters.map((f) => (
            <button key={f} type="button" aria-pressed={filter === f} onClick={() => changeFilter(f)}
              className="min-h-[44px] rounded-full shrink-0 border border-white/12 px-5 text-sm font-medium text-ink-soft transition-colors hover:text-ink aria-pressed:border-white aria-pressed:bg-white aria-pressed:text-bg-deep">{f}</button>
          ))}
        </div>
        {shown.length > 0 ? (
          /* `relative` is required: popLayout pins leaving items with position:absolute against this container. */
          <div ref={grid} style={{ minHeight: lockH }} className="relative mt-8 columns-2 gap-4 transition-[min-height] duration-500 ease-out lg:columns-3">
            <AnimatePresence mode="popLayout">
              {shown.map((it, i) => {
                const key = galleryKey(it);
                const delay = staggering ? Math.min(i, p.cap) * p.step : 0;
                return (
                  <m.div key={key} data-reveal="" layout={rich ? "position" : false} custom={delay} variants={variants.item} initial="hidden" whileInView="show" exit={rich ? "exit" : undefined} viewport={{ once: true, amount: 0.15 }} className="mb-4 break-inside-avoid">
                    <Spot tilt={false} lift={false} className="rounded-[var(--radius-image)]">
                      <button type="button" data-gallery-key={key} ref={(el) => { if (el) thumbs.current.set(key, el); else thumbs.current.delete(key); }}
                        aria-label={`${it.kind === "video" ? "Play video" : "View photo"}: ${it.alt}`}
                        onPointerEnter={preloadLightbox} onFocus={preloadLightbox} onTouchStart={preloadLightbox}
                        onClick={(e) => openViewer(key, e.currentTarget)}
                        className="group relative block w-full overflow-hidden rounded-[var(--radius-image)] border border-white/10 transition-[border-color,scale] duration-300 [@media(hover:none)_and_(prefers-reduced-motion:no-preference)]:active:scale-[0.98]">
                        {/* Shared-layout partner of the lightbox image. While a viewer is open its flight is instant, so browsing inside the viewer never makes thumbnails drift behind it. */}
                        <m.div layoutId={mediaLayoutId(key)} transition={{ layout: { duration: openId !== null ? 0 : 0.5, ease: EASE } }} className="relative">
                          <m.div data-reveal="" custom={delay} variants={reduce ? undefined : variants.media}>
                            <Thumb it={it} />
                          </m.div>
                        </m.div>
                        {it.kind === "video" && <span aria-hidden="true" className="absolute left-3 top-3 inline-flex h-9 w-9 items-center justify-center rounded-full bg-bg-deep/70 text-ink backdrop-blur"><Play className="h-4 w-4" fill="currentColor" /></span>}
                        {/* Small corner badge instead of a full-tile dim, so the photograph is never obscured. Always visible on touch devices; on hover devices it appears on hover/focus. */}
                        <span aria-hidden="true" className="pointer-events-none absolute bottom-3 right-3 inline-flex h-9 w-9 items-center justify-center rounded-full bg-bg-deep/70 text-primary opacity-100 transition duration-300 ease-out group-focus-visible:translate-y-0 group-focus-visible:opacity-100 [@media(hover:hover)]:opacity-0 [@media(hover:hover)]:group-hover:opacity-100 [@media(hover:hover)_and_(prefers-reduced-motion:no-preference)]:translate-y-1 [@media(hover:hover)_and_(prefers-reduced-motion:no-preference)]:group-hover:translate-y-0"><Expand className="h-4 w-4" /></span>
                      </button>
                    </Spot>
                  </m.div>
                );
              })}
            </AnimatePresence>
          </div>
        ) : (
          <p className="mt-8 text-center text-sm text-ink-soft">No {showRecap ? "Recap photos or videos" : `${filter} photos or videos`} have been uploaded yet.</p>
        )}
        <div className="mt-10 flex flex-wrap justify-center gap-3">
          {!showRecap && limit && items.length > limit && <Link href="/gallery" className="btn btn-primary">View full gallery</Link>}
          <a href={site.socials.instagram} target="_blank" rel="noopener noreferrer" className="btn btn-ghost">Follow us on Instagram {INSTAGRAM_HANDLE}</a>
        </div>
      </div>
      <AnimatePresence onExitComplete={restoreFocus}>
        {openItem && <Lightbox key="gallery-viewer" items={shown} activeId={galleryKey(openItem)} onChange={changeViewer} onClose={close} />}
      </AnimatePresence>
    </section>
  );
}