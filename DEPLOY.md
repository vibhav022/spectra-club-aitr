# Deploy to Cloudflare Pages (spectra-cse-club.pages.dev)

Architecture: **Next.js static site** (Pages) + **API at `/api/*`** (Pages Functions, same domain) + **D1** (database) + **ImageKit** (photos/videos).

You need: Node.js 22+, a free Cloudflare account, a free ImageKit account, (recommended) a GitHub account.

---
## 1. ImageKit
1. Sign up at https://imagekit.io and finish the first-time setup.
2. Dashboard → **Developer options → API keys** (or https://imagekit.io/dashboard/developer/api-keys). Copy:
   - **URL endpoint**, like `https://ik.imagekit.io/abcd1234`
   - **Public key**, `public_...`
   - **Private key**, `private_...` (secret, never put in Git)
3. Nothing else to configure: the site creates the `/spectra` folder itself.
   If uploads of big videos are rejected, your plan's file-size limit is lower than `MAX_VIDEO_MB` in `wrangler.toml`: lower it.

## 2. Install and log in to Cloudflare
```bash
npm install
npx wrangler login
```

## 3. Create the D1 database
```bash
npx wrangler d1 create spectra-db
```
Copy the printed `database_id` into **`wrangler.toml`** (`database_id = "..."`).
In the same file set `IMAGEKIT_URL_ENDPOINT` and `IMAGEKIT_PUBLIC_KEY` to your values from step 1.

## 4. Create the tables
```bash
npm run db:migrate:remote
```
(answer `y`). This creates every table and the default gallery categories.

## 5. Create the Pages project and deploy

### Option A: from GitHub (recommended, auto-deploys on every push)
1. Put this folder in a GitHub repo and push it (`.gitignore` already excludes secrets and `node_modules`).
2. Cloudflare dashboard → **Workers & Pages → Create → Pages → Connect to Git** → pick the repo.
3. **Project name: `spectra-cse-club`** (this gives `spectra-cse-club.pages.dev`; if the name is taken, pick another and use it everywhere below).
4. Build settings:
   - Framework preset: **None** (or Next.js static export)
   - Build command: `npm run build`
   - Build output directory: `out`
5. **Environment variables (build)**: `NODE_VERSION` = `22`, and `NEXT_PUBLIC_SITE_URL` = `https://spectra-cse-club.pages.dev`
6. **Save and Deploy**. The first deploy will work for the website; the admin needs step 6.

### Option B: direct upload from your computer (no GitHub)
```bash
npx wrangler pages project create spectra-cse-club --production-branch main
NEXT_PUBLIC_SITE_URL=https://spectra-cse-club.pages.dev npm run deploy
```
(On Windows PowerShell: `$env:NEXT_PUBLIC_SITE_URL="https://spectra-cse-club.pages.dev"; npm run deploy`)

## 6. Add the ImageKit private key as a secret
Dashboard → Workers & Pages → **spectra-cse-club → Settings → Variables and Secrets → Add** → type **Secret**, name `IMAGEKIT_PRIVATE_KEY`, value = your `private_...` key, environment **Production** (add to Preview too if you use preview deployments).
Or from the terminal:
```bash
npx wrangler pages secret put IMAGEKIT_PRIVATE_KEY --project-name spectra-cse-club
```
Then **redeploy** (Option A: Deployments → latest → Retry deployment, or push a commit. Option B: run `npm run deploy` again). Secrets only apply to new deployments.

> Bindings (D1) and variables come from `wrangler.toml`, so they show as read-only in the dashboard. Change them in the file and redeploy.

## 7. Create the administrator accounts (max 3)
```bash
npm run admin:create:remote
```
It asks for email, display name and a password (min 12 characters, hidden while typing). Run again for each admin; running it for an existing email resets that password.

## 8. (Optional) Import the existing content
Only if you want what is in `content/*.ts` copied into the database:
```bash
npm run db:seed:remote
```
(If it imports files from `public/`, first set `IMAGEKIT_PRIVATE_KEY` in your shell. Placeholders are skipped.)

## 9. Check it works
1. https://spectra-cse-club.pages.dev/api/health → `{"ok":true}`
2. https://spectra-cse-club.pages.dev/admin → sign in.
3. Upload a team photo and a gallery photo/video. They should appear on the public pages after a refresh, with URLs starting with your ImageKit endpoint.

## Custom domain (later)
Pages project → **Custom domains → Set up a domain**. Then change `NEXT_PUBLIC_SITE_URL` to the new domain and redeploy (it feeds canonical links, sitemap and social previews). Nothing in the API needs changing: it is same-origin.

## Updating the site later
- Option A: `git push`. Option B: `npm run deploy`.
- Database changes: add a new file in `migrations/` and run `npm run db:migrate:remote`.

## Troubleshooting
| Symptom | Fix |
|---|---|
| `/api/health` returns 404 or the site HTML | `functions/` was not deployed. Option A: make sure the repo root contains `functions/` and `wrangler.toml`. Option B: run `npm run deploy` from the project root. |
| `/api/health` returns 500 | D1 not bound or tables missing: check `database_id` in `wrangler.toml`, run `npm run db:migrate:remote`, redeploy. |
| Login works but upload fails with 500 | `IMAGEKIT_PRIVATE_KEY` secret missing (step 6) or deployed before it was added: redeploy. |
| Upload says "Storage rejected the upload" | Wrong `IMAGEKIT_PUBLIC_KEY` or private key (they must be from the same ImageKit account), or the file is over your ImageKit plan's limit. |
| Images upload but do not show | `IMAGEKIT_URL_ENDPOINT` in `wrangler.toml` is wrong (must be your exact `https://ik.imagekit.io/<id>`). |
| "Request origin is not allowed" | You are calling the API from another domain. Same-origin and `*.pages.dev` preview URLs of the same deployment are allowed automatically; for a separate domain add it to `ALLOWED_ORIGINS`. |
| Build fails: Node version | Set build variable `NODE_VERSION=22`. |
