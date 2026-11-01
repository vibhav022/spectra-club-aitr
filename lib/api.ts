/** Where the admin API lives. Empty = same origin (/api/...). Set at build time via NEXT_PUBLIC_API_URL. */
export const API_BASE = (process.env.NEXT_PUBLIC_API_URL ?? "").replace(/\/+$/, "");
export const apiUrl = (path: string) => `${API_BASE}${path}`;
/** Media URLs come back from the API as /api/media/...; make them absolute when the API is on another origin. */
export const mediaSrc = (p?: string | null) => (p ? (/^https?:/i.test(p) ? p : `${API_BASE}${p}`) : undefined);
