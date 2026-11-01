"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import Image from "next/image";
import { m, useIsPresent } from "framer-motion";
import { ChevronLeft, ChevronRight, X } from "lucide-react";
import { Slot } from "./Slot";
import { galleryKey, mediaLayoutId, type GalleryItem } from "@/content/gallery";

interface Props { items: GalleryItem[]; activeId: string; onChange: (id: string) => void; onClose: () => void }

const EASE: [number, number, number, number] = [0.22, 1, 0.36, 1];
const INSET = { t: "env(safe-area-inset-top, 0px)", b: "env(safe-area-inset-bottom, 0px)", l: "env(safe-area-inset-left, 0px)", r: "env(safe-area-inset-right, 0px)" };
/** The media box is sized from the item's own aspect ratio (not from the file loading), so it is stable at mount, never overflows a phone, and clears the notch/home bar. */
const MAX_W = `min(56rem, calc(100vw - 2rem - ${INSET.l} - ${INSET.r}))`;
const MAX_H = `calc(100svh - 11rem - ${INSET.t} - ${INSET.b})`;
const fade = { initial: { opacity: 0 }, animate: { opacity: 1 }, exit: { opacity: 0 }, transition: { duration: 0.25 } };

export default function Lightbox({ items, activeId, onChange, onClose }: Props) {
  const root = useRef<HTMLDivElement>(null);
  const touchX = useRef<number | null>(null);
  const isPresent = useIsPresent();
  // After the first prev/next the shared thumbnail flight is retired for good: moving between images is a quiet crossfade, not a flight from the grid.
  const [navigated, setNavigated] = useState(false);
  const [failedKey, setFailedKey] = useState<string | null>(null);
  const index = items.findIndex((it) => galleryKey(it) === activeId);
  const item: GalleryItem | undefined = items[index];

  const go = useCallback((d: number) => {
    if (!isPresent || index < 0 || items.length < 2) return;
    setNavigated(true);
    onChange(galleryKey(items[(index + d + items.length) % items.length]));
  }, [isPresent, index, items, onChange]);

  // Scroll lock lasts until the viewer has fully animated out (cleanup runs on real unmount).
  useEffect(() => {
    document.body.style.overflow = "hidden";
    root.current?.querySelector<HTMLElement>("button")?.focus();
    return () => { document.body.style.overflow = ""; };
  }, []);

  useEffect(() => {
    if (!isPresent) return; // while animating out, keys must not navigate or re-open anything
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") return onClose();
      if (e.key === "ArrowLeft") return go(-1);
      if (e.key === "ArrowRight") return go(1);
      if (e.key !== "Tab") return;
      const f = Array.from(root.current?.querySelectorAll<HTMLElement>("button") ?? []);
      const first = f[0], last = f[f.length - 1];
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [isPresent, go, onClose]);

  if (!item) return null;
  const key = galleryKey(item);
  const failed = failedKey === key;
  const markFailed = () => setFailedKey(key);
  const isVideo = item.kind === "video";
  const ratio = item.width > 0 && item.height > 0 ? item.width / item.height : 4 / 3;
  const hasMedia = !!item.src && !failed;
  // Only a still photo opened straight from the grid can fly out of its thumbnail; videos get a fade + scale.
  const shared = hasMedia && !isVideo && !navigated;
  const mediaMotion = shared
    ? { layoutId: mediaLayoutId(key), transition: { layout: { duration: 0.5, ease: EASE } } }
    : { initial: { opacity: 0, scale: 0.96 }, animate: { opacity: 1, scale: 1 }, exit: { opacity: 0, scale: 0.97, transition: { duration: 0.25, ease: "easeIn" as const } }, transition: { duration: 0.3, ease: EASE } };

  const btn = "z-20 inline-flex h-11 w-11 items-center justify-center rounded-full bg-white/10 text-ink hover:bg-white/20";
  return (
    <div ref={root} role="dialog" aria-modal="true" aria-label="Gallery viewer"
      className="fixed inset-0 z-[65] flex items-center justify-center p-4"
      onClick={(e) => e.target === e.currentTarget && onClose()}
      onTouchStart={(e) => (touchX.current = (e.target as HTMLElement).closest("video") ? null : e.touches[0].clientX)}
      onTouchEnd={(e) => { if (touchX.current === null) return; const dx = e.changedTouches[0].clientX - touchX.current; if (Math.abs(dx) > 50) go(dx < 0 ? 1 : -1); touchX.current = null; }}>
      {/* Backdrop animates on its own, independent of the image. */}
      <m.div aria-hidden="true" onClick={onClose} className="absolute inset-0 bg-bg-deep/80 backdrop-blur-md" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.35, ease: "easeOut" }} />
      <m.button type="button" aria-label="Close viewer" onClick={onClose} {...fade} className={`${btn} absolute right-[max(1rem,env(safe-area-inset-right))] top-[max(1rem,env(safe-area-inset-top))]`}><X aria-hidden="true" /></m.button>
      <m.button type="button" aria-label="Previous item" onClick={() => go(-1)} {...fade} className={`${btn} absolute left-[max(0.75rem,env(safe-area-inset-left))] top-1/2 -translate-y-1/2`}><ChevronLeft aria-hidden="true" /></m.button>
      <m.button type="button" aria-label="Next item" onClick={() => go(1)} {...fade} className={`${btn} absolute right-[max(0.75rem,env(safe-area-inset-right))] top-1/2 -translate-y-1/2`}><ChevronRight aria-hidden="true" /></m.button>
      <figure className="relative z-10 flex max-w-full flex-col items-center">
        <m.div key={`${key}:${shared ? "shared" : "fade"}`} {...mediaMotion} className="relative">
          {hasMedia ? (
            <div style={{ width: `min(${MAX_W}, calc(${MAX_H} * ${ratio}))`, aspectRatio: ratio }} className="relative overflow-hidden rounded-[var(--radius-image)]">
              {isVideo ? (
                <video key={item.id ?? item.src} src={item.src} poster={item.thumb} controls playsInline preload="metadata" autoPlay onError={markFailed} aria-label={item.alt} className="h-full w-full bg-black object-contain" />
              ) : (
                <>
                  {/* The grid thumbnail is already cached: it stays underneath so the flight never shows an empty frame while the full-size file loads. */}
                  {item.thumb && item.thumb !== item.src && <Image src={item.thumb} alt="" aria-hidden="true" fill sizes="90vw" className="object-contain" />}
                  <Image src={item.src!} alt={item.alt} fill sizes="90vw" loading="eager" onError={markFailed} className="object-contain" />
                </>
              )}
            </div>
          ) : (
            <div role="img" aria-label={item.alt} className="flex h-[min(60svh,calc(100svh-11rem))] w-[min(80vw,40rem)] flex-col items-center justify-center gap-3 rounded-[var(--radius-image)] bg-gradient-to-br from-surface to-bg-deep"><Slot />{failed && <p className="text-sm text-ink-soft">This file could not be loaded.</p>}</div>
          )}
        </m.div>
        <m.figcaption initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.25, delay: 0.15 }} className="mt-3 max-h-[4.5rem] max-w-full overflow-y-auto text-center text-sm" aria-live="polite">{item.alt} · {index + 1} / {items.length}{item.caption && <span className="mx-auto mt-1 block max-w-xl text-ink-soft">{item.caption}</span>}</m.figcaption>
      </figure>
    </div>
  );
}
