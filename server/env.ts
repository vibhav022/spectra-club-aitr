/** Bindings available to the API (Cloudflare Pages Functions). Set in wrangler.toml, the dashboard, or .dev.vars locally. */
export interface Env {
  DB: D1Database;
  /** Extra origins (besides the site's own origin) allowed to call the admin API with cookies. Usually empty. */
  ALLOWED_ORIGINS?: string;
  MAX_IMAGE_MB?: string;
  MAX_VIDEO_MB?: string;
  SESSION_DAYS?: string;
  /** ImageKit: https://imagekit.io/dashboard/developer/api-keys */
  IMAGEKIT_URL_ENDPOINT: string;   // e.g. https://ik.imagekit.io/your_id
  IMAGEKIT_PUBLIC_KEY: string;     // public_...
  IMAGEKIT_PRIVATE_KEY: string;    // private_...  (SECRET: never put it in wrangler.toml)
  /** Test-only overrides so the test suite can run against a mock ImageKit. Leave unset in production. */
  IMAGEKIT_API_URL?: string;
  IMAGEKIT_UPLOAD_URL?: string;
}
export interface AdminUser { id: string; email: string; name: string }
export type AppEnv = { Bindings: Env; Variables: { admin: AdminUser; sessionId: string } };
