"use client";
import { useEffect, useState } from "react";
import { apiUrl } from "./api";

export type Live<T> = { status: "loading" } | { status: "ok"; data: T } | { status: "error" };

export interface ApiMember { id: string; name: string; role: string; tier: "leadership" | "core" | "faculty"; instagram?: string | null; linkedin?: string | null; bio?: string | null; specialization?: string | null; contributions?: string | null; department?: string | null; photo: string | null }
export interface ApiGalleryItem { id: string; title: string; caption: string | null; category: string; kind: "image" | "video"; src: string; thumb: string | null; width: number; height: number }
export interface ApiNextEvent { id: string; title: string; slug: string | null; startsAt: string; venue: string | null; registrationUrl: string | null; ctaText: string }

/**
 * Fetch live public content from the API on every page view (no-store), so admin changes show after a refresh.
 * "ok" with an empty list is a real, successful answer; "error" is a genuine failure (callers may use the bundled fallback).
 */
export function useLive<T>(path: string): Live<T> {
  const [state, setState] = useState<Live<T>>({ status: "loading" });
  useEffect(() => {
    const ctl = new AbortController();
    fetch(apiUrl(path), { cache: "no-store", signal: ctl.signal })
      .then((r) => { if (!r.ok) throw new Error(String(r.status)); return r.json() as Promise<T>; })
      .then((data) => setState({ status: "ok", data }))
      .catch((e) => { if (!ctl.signal.aborted) { console.warn("Live content unavailable:", path, e); setState({ status: "error" }); } });
    return () => ctl.abort();
  }, [path]);
  return state;
}
