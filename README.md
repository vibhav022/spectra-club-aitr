# Spectra — CSE Club, AITR Indore

Next.js 16 (App Router, static export) · TypeScript · Tailwind CSS v4 · Framer Motion · lucide-react.

## Setup
```bash
npm install
cp .env.example .env.local   # then fill in the values (see below)
npm run dev                  # http://localhost:3000
```

## Environment variables
| Variable | Purpose |
|---|---|
| `NEXT_PUBLIC_SITE_URL` | Deployed origin, e.g. `https://spectra-cse-club.pages.dev`. Used for canonicals, sitemap, OG and JSON-LD. |
| `NEXT_PUBLIC_ANALYTICS_DOMAIN` | Optional. Enables Plausible. Off when empty. |
| `NEXT_PUBLIC_ANALYTICS_SRC` | Optional. Override the analytics script URL. |

These are baked in at build time: restart `dev` or rebuild after changing them.

## Editing content
All text and data live in `content/`. Components only render it.
- `site.ts`: socials, email, founded year, Instagram post URLs
- `events.ts`: add an event object and its page `/events/<slug>` is generated automatically
- `team.ts`, `gallery.ts`, `stats.ts`, `workshops.ts`, `testimonials.ts`
- Put images in `public/` and reference them by path (e.g. `/gallery/thirak-1.jpg`).
- Entries with `isPlaceholder: true` are hidden in production. Remove the flag once the data is real.
- Empty sections hide themselves, and so do their nav links. See `PLACEHOLDERS.md` for everything still needed.

Brand tokens (colours, fonts, radii, shadows) live in `app/tokens.css`. Do not hardcode values elsewhere.

**Theme:** black and white to match the logo (`public/logo.png`, white line-art on transparent). Token names are unchanged, so `primary` is now white and `accent-gold` is a mid grey. To change the logo, replace `public/logo.png` and `public/logo-nav.png` and update the sizes in `lib/logo.ts`; also replace `public/icon.png`, `public/apple-touch-icon.png`, `public/icons/*` and `app/opengraph-image.png`.

## Scripts
| Command | What it does |
|---|---|
| `npm run dev` / `npm run build` | Develop the front end / production build (static export to `out/`) |
| `npm run preview` | Build, then run site + `/api/*` Functions + local D1 together at http://localhost:8788 |
| `npm run deploy` | Build and upload `out/` + `functions/` to Cloudflare Pages with wrangler |
| `npm run db:migrate:local` / `:remote` | Apply `migrations/` to the local / production D1 database |
| `npm run admin:create:local` / `:remote` | Create an admin account (or reset a password) |
| `npm test` / `npm run test:e2e` | Unit tests / end-to-end API tests (`bash tests/run-e2e.sh`, uses a mock ImageKit) |
| `npm run check` | Typecheck + ESLint + WCAG contrast audit of the colour tokens |
| `npm run contrast` | Contrast audit only |
| `npm run fonts` | Re-copy Latin font subsets from `@fontsource` into `public/fonts` |
| `npm run placeholders` | List unresolved placeholders |

## Deploy
Cloudflare Pages (static site) + Pages Functions (`/api/*`) + D1 + ImageKit. Follow **DEPLOY.md** step by step.

## Measuring performance (do this on the deployed build)
```bash
npx lighthouse https://YOUR-URL --form-factor=mobile --view
```
Targets: Performance ≥ 90, Accessibility ≥ 95, SEO ≥ 95, Best Practices ≥ 90, LCP < 2.5 s, CLS < 0.1.
Homepage first-load JS (module scripts only) measured at build time: about 173 KB gzipped against a 170 KB target.

## Known gaps
- Instagram lite-embed strip is not built (needs real post URLs in `site.ts`).
- Countdown for future-dated events is not built (no event has a date yet).
- `/events/[slug]` "related" and Event JSON-LD activate only with real data.

## Admin dashboard
See **README.admin.md** for the admin dashboard, API, database and deployment guide.
