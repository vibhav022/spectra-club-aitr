"use client";
import { API_BASE } from "../api";

export class ApiError extends Error {
  constructor(public status: number, public code: string, message: string, public fields: Record<string, string> = {}) { super(message); }
}
const toError = (status: number, data: unknown) => {
  const e = (data as { error?: { code?: string; message?: string; details?: unknown } } | null)?.error;
  const fields = e?.details && typeof e.details === "object" ? (e.details as Record<string, string>) : {};
  return new ApiError(status, e?.code ?? "error", e?.message ?? `Request failed (${status}).`, fields);
};

/** JSON call to the admin API with the session cookie and the CSRF header. Throws ApiError on any non-2xx. */
export async function api<T = unknown>(path: string, opts: { method?: string; json?: unknown } = {}): Promise<T> {
  let res: Response;
  try {
    res = await fetch(`${API_BASE}${path}`, {
      method: opts.method ?? "GET", credentials: "include", cache: "no-store",
      headers: { "X-Requested-With": "spectra-admin", ...(opts.json !== undefined ? { "Content-Type": "application/json" } : {}) },
      body: opts.json !== undefined ? JSON.stringify(opts.json) : undefined,
    });
  } catch { throw new ApiError(0, "network", "Could not reach the server. Check your connection and try again."); }
  const data = await res.json().catch(() => null);
  if (!res.ok) throw toError(res.status, data);
  return data as T;
}

export interface UploadedMedia { id: string; kind: "image" | "video"; url: string; width: number | null; height: number | null; size: number }
export const mediaUrl = (u?: string | null) => (u ? (/^https?:/i.test(u) ? u : `${API_BASE}${u}`) : undefined);

/**
 * Upload one file: 1) ask our API to validate + reserve + sign, 2) send the bytes straight to ImageKit (multipart form),
 * 3) ask our API to verify the file at ImageKit and finalize. Reports progress 0..1.
 */
export async function uploadFile(file: Blob & { name?: string }, purpose: "gallery" | "photo" | "thumb", dims: { width?: number; height?: number }, onProgress?: (p: number) => void): Promise<UploadedMedia> {
  const init = await api<{ id: string; url: string; fields: Record<string, string> }>("/api/admin/uploads", {
    method: "POST", json: { filename: (file as File).name ?? "upload", contentType: file.type, size: file.size, purpose, ...dims },
  });
  try {
    const fileId = await new Promise<string>((resolve, reject) => {
      const form = new FormData();
      for (const [k, v] of Object.entries(init.fields)) form.append(k, v);
      form.append("file", file, init.fields.fileName);
      const xhr = new XMLHttpRequest();
      xhr.open("POST", init.url);
      xhr.upload.onprogress = (e) => e.lengthComputable && onProgress?.(e.loaded / e.total);
      xhr.onerror = () => reject(new ApiError(0, "network", "Upload interrupted. Check your connection and try again."));
      xhr.onload = () => {
        let data: { fileId?: string; message?: string } = {}; try { data = JSON.parse(xhr.responseText); } catch { /* not JSON */ }
        if (xhr.status >= 200 && xhr.status < 300 && data.fileId) return resolve(data.fileId);
        reject(new ApiError(xhr.status, "storage", data.message ? `Storage rejected the upload: ${data.message}` : "Storage rejected the upload."));
      };
      xhr.send(form);
    });
    onProgress?.(1);
    return (await api<{ media: UploadedMedia }>(`/api/admin/uploads/${init.id}/complete`, { method: "POST", json: { fileId } })).media;
  } catch (e) {
    api(`/api/admin/uploads/${init.id}`, { method: "DELETE" }).catch(() => {});  // best effort; the periodic cleanup also removes it
    throw e;
  }
}

/** Natural size and a small WebP thumbnail (photos: 480px wide; videos: a frame from the start). Failures are non-fatal. */
export async function inspectFile(file: File): Promise<{ width: number; height: number; thumb: Blob | null; preview: string }> {
  const preview = URL.createObjectURL(file);
  const shrink = (src: CanvasImageSource, w: number, h: number) => new Promise<Blob | null>((resolve) => {
    const scale = Math.min(1, 480 / w); const c = document.createElement("canvas");
    c.width = Math.max(1, Math.round(w * scale)); c.height = Math.max(1, Math.round(h * scale));
    c.getContext("2d")?.drawImage(src, 0, 0, c.width, c.height);
    c.toBlob((b) => resolve(b), "image/webp", 0.82);
  });
  try {
    if (file.type.startsWith("image/")) {
      const img = await new Promise<HTMLImageElement>((res, rej) => { const i = new Image(); i.onload = () => res(i); i.onerror = rej; i.src = preview; });
      return { width: img.naturalWidth, height: img.naturalHeight, thumb: await shrink(img, img.naturalWidth, img.naturalHeight), preview };
    }
    const v = document.createElement("video"); v.muted = true; v.playsInline = true; v.preload = "metadata"; v.src = preview;
    await new Promise<void>((res, rej) => { v.onloadeddata = () => res(); v.onerror = () => rej(new Error("video")); });
    v.currentTime = Math.min(1, (v.duration || 2) / 10);
    await new Promise<void>((res) => { v.onseeked = () => res(); setTimeout(res, 1500); });
    return { width: v.videoWidth || 1280, height: v.videoHeight || 720, thumb: v.videoWidth ? await shrink(v, v.videoWidth, v.videoHeight) : null, preview };
  } catch { return { width: 1280, height: 720, thumb: null, preview }; }
}
export const fmtBytes = (n: number) => (n > 1048576 ? `${(n / 1048576).toFixed(1)} MB` : `${Math.max(1, Math.round(n / 1024))} KB`);
