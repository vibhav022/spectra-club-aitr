/** Set NEXT_PUBLIC_SITE_URL to the deployed origin (no trailing slash needed). */
export const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL ?? "https://spectra-cse-club.pages.dev").replace(/\/$/, "");
