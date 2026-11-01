"use client";
/* eslint-disable @next/next/no-img-element -- admin previews load API/blob URLs that next/image cannot optimize */
import { useRef, useState } from "react";
import { ImagePlus, Trash2, User } from "lucide-react";
import { ApiError, mediaUrl, uploadFile } from "@/lib/admin/api";
import { btnSmall, Spinner } from "./ui";

const OK = ["image/jpeg", "image/png", "image/webp"];
/** Profile photo picker. Uploads immediately (with progress); the returned media id is saved with the form. */
export function PhotoField({ url, onChange, label = "Photo" }: { url: string | null; onChange: (m: { id: string | null; url: string | null }) => void; label?: string }) {
  const input = useRef<HTMLInputElement>(null);
  const [progress, setProgress] = useState<number | null>(null); const [error, setError] = useState("");
  const pick = async (f?: File) => {
    if (!f) return; setError("");
    if (!OK.includes(f.type)) return setError("Use a JPEG, PNG or WebP image.");
    if (f.size > 10 * 1024 * 1024) return setError("Image is larger than 10 MB.");
    setProgress(0);
    try { const m = await uploadFile(f, "photo", {}, setProgress); onChange({ id: m.id, url: mediaUrl(m.url) ?? null }); }
    catch (e) { setError(e instanceof ApiError ? e.message : "Upload failed."); }
    finally { setProgress(null); if (input.current) input.current.value = ""; }
  };
  return (
    <div>
      <span className="mb-1.5 block text-sm font-medium text-ink">{label}</span>
      <div className="flex items-center gap-4">
        <div className="relative flex h-24 w-24 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-white/15 bg-surface">
          {url ? <img src={url} alt="" className="h-full w-full object-cover" /> : <User className="h-8 w-8 text-white/25" aria-hidden="true" />}
          {progress !== null && <div role="progressbar" aria-valuenow={Math.round(progress * 100)} aria-valuemin={0} aria-valuemax={100} className="absolute inset-0 flex flex-col items-center justify-center bg-bg-deep/80 text-xs text-ink"><Spinner className="h-4 w-4" />{Math.round(progress * 100)}%</div>}
        </div>
        <div className="flex flex-wrap gap-2">
          <input ref={input} type="file" accept={OK.join(",")} className="sr-only" id="photo-input" onChange={(e) => pick(e.target.files?.[0])} />
          <label htmlFor="photo-input" className={`${btnSmall} cursor-pointer ${progress !== null ? "pointer-events-none opacity-50" : ""}`}><ImagePlus className="h-4 w-4" aria-hidden="true" />{url ? "Replace" : "Upload"}</label>
          {url && <button type="button" className={btnSmall} onClick={() => onChange({ id: null, url: null })} disabled={progress !== null}><Trash2 className="h-4 w-4" aria-hidden="true" />Remove</button>}
        </div>
      </div>
      {error && <p role="alert" className="mt-2 text-xs text-danger-text">{error}</p>}
    </div>
  );
}
