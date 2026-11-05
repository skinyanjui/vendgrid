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

The app talks to Supabase (`src/backend.js`). On start it checks whether the project answers:

- **Live mode** (normal on the deployed site): listings and businesses come from the `vg_` tables; sign-in is by emailed magic link; saved listings, saved searches, posting (with photo upload to the `vg-photos` bucket), conversations and messages (with photos), listing status changes and reports are stored in the database.
- **Demo mode** (when Supabase can't be reached, e.g. in tests or sandboxed previews): everything runs on the sample data in `src/data.js` and is kept in the visitor's browser.

Still demo-only in both modes: billing/promotions (no Stripe yet), business verification review, and the admin area's data.

`src/backend.js` holds the project URL and **publishable** key, which are safe in a browser; row-level security protects the data. Never put a `service_role` key in this repo.

### Supabase setup

- `supabase/migrations/20261105000000_vg_schema.sql` — tables, row-level security, server-side guards and storage buckets (all prefixed `vg_`).
- `supabase/seed.sql` — the 35 demo listings and 10 sample businesses.
- In **Authentication → URL Configuration**, add the deployed site URL (for example `https://<your-app>.vercel.app`) to **Redirect URLs**, otherwise magic links return to the project's default Site URL.

## Layout

```
src/        App.jsx (all screens), data.js (categories, fields, sample data), engine.js (search), styles.js (CSS)
public/img/ demo photos
tests/      jsdom regression tests
supabase/   schema migration and seed
```
