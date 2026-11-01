# Admin dashboard, API and database

```
Browser ──► spectra-cse-club.pages.dev
              ├─ /*       Next.js static export (out/)                         Cloudflare Pages
              └─ /api/*   Hono API (functions/api/[[route]].ts -> server/)     Cloudflare Pages Functions
                            ├─ D1        : admins, sessions, team, faculty, gallery, events, media records
                            └─ ImageKit  : photos and videos (browser uploads straight to ImageKit; served from its CDN)
```

Everything is on one origin, so the admin session cookie is first-party (`__Host-` prefixed in production) and no CORS setup is needed.

## Where things are
| Path | What |
|---|---|
| `app/`, `components/`, `lib/`, `content/` | The website and the admin UI (`/admin`) |
| `functions/api/[[route]].ts` | Pages Function entry; hands every `/api/*` request to the Hono app |
| `server/` | The API: routes, auth, validation, ImageKit client (`server/lib/imagekit.ts`) |
| `migrations/` | D1 schema, applied with `npm run db:migrate:*` |
| `scripts/db/` | `create-admin.ts`, `seed.ts` |
| `wrangler.toml` | Pages project config: D1 binding, public variables |
| `public/_headers`, `public/_routes.json` | Security/caching headers; makes Functions run only for `/api/*` |

## How uploads work
1. The dashboard asks `POST /api/admin/uploads`. The server checks type and size, reserves a path under `/spectra/...` and returns a **signed, 20-minute** ImageKit upload form (the private key never leaves the server).
2. The browser posts the file straight to ImageKit (no size limit from Cloudflare, real progress bar).
3. The browser calls `POST /api/admin/uploads/:id/complete` with the ImageKit `fileId`. The server does not trust it: it fetches the file's details from ImageKit and requires the exact reserved path, the exact declared size, and a real file signature (JPEG/PNG/WebP/MP4/WebM). Anything else is deleted and rejected.
4. Replacing or deleting a record deletes the file from ImageKit.

Pages has no cron triggers, so cleanup of abandoned uploads runs after an admin request, at most every 6 hours.

**Privacy note:** files are served from the ImageKit CDN, so a file's URL works for anyone who has it, even if its record is hidden in the dashboard. URLs contain random IDs and are never listed publicly for hidden items.

## Local development
```bash
npm install
cp .dev.vars.example .dev.vars          # put your ImageKit PRIVATE key in it; edit wrangler.toml public values
npm run db:migrate:local
npm run admin:create:local              # asks for email, name, password (min 12 chars)
npm run preview                         # build + site + API + local D1 at http://localhost:8788
```
Local data lives in `.wrangler/state`. After changing front-end code run `npm run preview` again (it rebuilds). `npm run dev` runs only the front end at :3000 (no `/api`).

## Importing the content from `content/*.ts` (optional)
```bash
export IMAGEKIT_PRIVATE_KEY=private_...   # only needed when files under public/ are imported
npm run db:seed:remote                    # or db:seed:local
```
Each item is imported at most once (tracked in `seed_log`), so re-running never duplicates records or resurrects something an admin deleted. `isPlaceholder` entries are skipped (`-- --include-placeholders` to override).

## Security summary
PBKDF2-SHA256 (100k iterations, the Workers maximum) with per-password salt · random 256-bit session tokens, only their SHA-256 stored · 7-day absolute and 24 h idle expiry · login limits (5 failures per IP+email and 30 attempts per IP per 15 min) · every `/api/admin/*` and `/api/auth` mutation requires a valid session **and** a same-origin (or allow-listed) `Origin` **and** the `X-Requested-With` header · uploads validated on the server (type allow-list, size limit, real file signature, exact declared size); no SVG/HTML · parameterized SQL everywhere · `/admin` is `noindex` and disallowed in robots.txt · maximum of 3 admin accounts (database trigger).

## Tests
```bash
npm test                  # unit tests
bash tests/run-e2e.sh     # 19 API tests against the real Pages Functions runtime + local D1 + a mock ImageKit
```
