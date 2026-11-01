# PLACEHOLDERS.md

Everything below is unresolved. Nothing here has been invented. Placeholder entries are hidden in production builds
and show a red "placeholder" badge in `npm run dev`. `npm run build` prints a warning listing them.

## content/site.ts
- [ ] `foundedYear` (unset, so the "EST." badge and `foundingDate` JSON-LD are hidden)
- [ ] `email` (unset, so it is hidden in the footer and JSON-LD)
- [ ] `socials.linkedin`, `socials.youtube` (optional; only shown if set)
- [ ] `instagramPosts[]` (empty; 3-6 post URLs. The Instagram strip is not built yet, see README "Known gaps")

## content/events.ts (4 seed events, descriptions from the brief)
- [ ] `year` for each event (script year tag hidden until set)
- [ ] `date` (ISO, e.g. `2026-03-14T18:00:00+05:30`) for real events. Setting it enables Event JSON-LD
- [ ] `venue`, `image` (poster), `highlights` and outcomes for Thirak, Sur Sangram and Nexus
- [ ] `instagramUrl` for each event (currently links to the profile)

## content/timeline.ts (About page "Our journey"; wording from the brief, nothing invented)
- [ ] Years appear automatically once `site.foundedYear` and each event's `year` are set. Add real milestones (member counts, new events, awards) as the club confirms them

## content/team.ts (all 7 entries are placeholders and hidden in production)
- [ ] Chairperson, Vice President, Secretary (name, photo, optional Instagram)
- [ ] Core committee members (name, role, photo)
- [ ] Faculty Coordinator (name, photo)
- When real entries exist (without `isPlaceholder`), /team and the homepage Team section appear automatically.

## content/stats.ts (all `null`, hidden; the band needs 2+ real values)
- [ ] Active Members, Events Hosted, Students Reached, Schools Reached

## content/gallery.ts (6 placeholder tiles, hidden in production)
- [ ] Real photos: `src` (in `public/`), `width`, `height`, descriptive `alt`, `category`
- [ ] Replace the About-section group photo (currently a designed placeholder in `components/About.tsx`) and hero poster collage (`components/Hero.tsx`)

## content/workshops.ts (empty, section and nav link hidden)
- [ ] Workshop title, eyebrow, 3-4 line description, tags, image

## content/testimonials.ts (empty, not rendered anywhere yet)
- [ ] Real quotes with permission

## Deployment
- [ ] `NEXT_PUBLIC_SITE_URL`: the real domain (sitemap, canonicals and OG URLs currently say http://localhost:3000)
- [ ] `NEXT_PUBLIC_FORM_ENDPOINT`: Formspree URL
