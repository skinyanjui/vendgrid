# VendGrid

A marketplace for the vending business: buy and sell **machines** and **parts**, offer or find **locations**, sell **routes**, list **services**, and post **Wanted** requests.

## What's in the app

- One search across every category, with filters, sort, saved searches (with "new" badges), and a grid or map view.
- Maps use [OpenStreetMap](https://www.openstreetmap.org/copyright) tiles via Leaflet, with attribution. Pins are city centres only, never street addresses. Where tiles can't load, a built-in city map is shown instead. The public OSM tile servers are for light use; switch to a commercial tile provider before heavy traffic.
- One listing card for every category, with verified-business badges and clearly labelled **Sponsored** placements.
- Listing pages with a photo gallery, approximate-area map (city only, never a street address), "Parts that fit" and "Move it" (delivery services that cover the listing's city).
- Three-step posting with live preview; sign-in is only asked for at publish time.
- Listing-linked messaging with photo attachments and a pay-safely notice.
- Billing (Professional $49/mo, Sponsored $29/mo), business verification, and an admin area. Payments are **sandbox only** in this build.
- Apple HIG–style layout: tab bar and pushed headers on phones, icon rail on tablets, sidebar on desktop; light, dark and auto themes.

Trust rules: no fabricated ratings or reviews, Sponsored is always labelled, verification is earned (never bought), seller-reported figures are marked as such, and VendGrid does not hold funds.

## Run it

```bash
npm install
npm run build      # writes dist/index.html + dist/img/
npm test           # builds, then runs the jsdom flow tests in tests/
```

Serve `dist/` with any static host. On Vercel, `vercel.json` sets the build command and output directory.

## Data

The current front end runs on the sample data in `src/data.js` and keeps each visitor's changes in their browser (Account → Reset demo data clears it).

The Supabase backend lives in `supabase/`:

- `migrations/20261105000000_vg_schema.sql` — tables, row-level security, server-side guards, and storage buckets. All objects are prefixed `vg_`.
- `seed.sql` — the 35 demo listings and 10 sample businesses.

Wiring the screens to Supabase (magic-link sign-in, real posting with photo upload, real messaging) is the next step. Put the project URL and **publishable** key in `.env` (see `.env.example`); never commit a `service_role` key.

## Layout

```
src/        App.jsx (all screens), data.js (categories, fields, sample data), engine.js (search), styles.js (CSS)
public/img/ demo photos
tests/      jsdom regression tests
supabase/   schema migration and seed
```
