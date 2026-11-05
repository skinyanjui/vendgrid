# VendGrid

A marketplace for the vending business: buy and sell **machines** and **parts**, offer or find **locations**, sell **routes**, list **services**, and post **Wanted** requests.

## What's in the app

- One search across every category, with filters, sort, saved searches (with "new" badges), and a grid or map view.
- Maps use [OpenStreetMap](https://www.openstreetmap.org/copyright) tiles via Leaflet, with attribution. Pins are city centres only, never street addresses. Where tiles can't load, a built-in city map is shown instead. The public OSM tile servers are for light use; switch to a commercial tile provider before heavy traffic.
- One listing card for every category, with verified-business badges and clearly labelled **Sponsored** placements.
- Listing pages with a photo gallery, approximate-area map (city only, never a street address), "Parts that fit" and "Move it" (delivery services that cover the listing's city).
- Three-step posting with live preview; sign-in is only asked for at publish time.
- Listing-linked messaging with photo attachments and a pay-safely notice.
- **Settings**: change sign-in email (confirmed by link), sign out on all devices, default location, download your data as JSON, and delete your VendGrid data (files first, then every row). Sign-in resend has a 30-second cooldown and expired links explain themselves.
- **Activity**: in-app notifications for document requests and answers, verification results and listings withdrawn after a report. Database triggers write them, so nobody can forge one.
- A private **document room** on route listings: the seller uploads P&Ls and agreements, buyers accept confidentiality terms and request access, the seller grants or removes it, and every open is logged for the seller.
- **Verified business** review: the business submits details and a registration document, staff approve or decline in Admin, and the badge lasts a year.
- Real **Terms**, **Privacy** and **Refunds** pages (`src/legal.js`), shared by the app and the server-rendered pages.
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

## Search engines

`api/seo.js` is a Vercel function that renders crawlable pages from the live data: `/listing/<id>-<slug>`, category pages (`/vending-machines`, `/vending-routes-for-sale`, …), `/terms`, `/privacy`, `/refunds`, plus `/sitemap.xml` and `/robots.txt`. Each page gets a real title, description, canonical link, Open Graph tags and structured data (Product for priced machines and parts, BreadcrumbList everywhere), with readable content in the HTML. The app then boots on top and opens the same screen. Preview deployments are `noindex`. Sold, filled and expired listings stay reachable but are `noindex`; anything else returns 404. Rewrites live in `vercel.json`.

## Data

The app talks to Supabase (`src/backend.js`). On start it checks whether the project answers:

- **Live mode** (normal on the deployed site): listings and businesses come from the `vg_` tables; sign-in is by emailed magic link; saved listings, saved searches, posting (with photo upload to the `vg-photos` bucket), conversations and messages (photos go to a private bucket and are shown via signed URLs), listing status changes and reports are stored in the database.
- **Demo mode** (when Supabase can't be reached, e.g. in tests or sandboxed previews): everything runs on the sample data in `src/data.js` and is kept in the visitor's browser.

Live for admin accounts: reports, verification review and support requests. Still demo-only: billing/promotions (no Stripe yet) and the admin metrics, billing and audit tabs.

`src/backend.js` holds the project URL and **publishable** key, which are safe in a browser; row-level security protects the data. Never put a `service_role` key in this repo.

### Supabase setup

- `supabase/migrations/20261105000000_vg_schema.sql` — tables, row-level security, server-side guards and storage buckets (all prefixed `vg_`).
- `supabase/migrations/20261105010000_vg_private_message_photos.sql` — private bucket for message photos.
- `supabase/migrations/20261105020000_vg_doc_room_support.sql` — document room, support requests, document storage rules.
- `supabase/migrations/20261105030000_vg_notifications.sql` — in-app notifications written by triggers; owner delete rules for photos.
- `supabase/migrations/20261105040000_vg_delete_my_data.sql` — self-service data deletion used by Settings.
- `supabase/migrations/20261105050000_vg_listing_stats.sql` — real view, save and inquiry counts for sellers.
- `supabase/seed.sql` — the 35 demo listings and 10 sample businesses.
- In **Authentication → URL Configuration**, add the deployed site URL (for example `https://<your-app>.vercel.app`) to **Redirect URLs**, otherwise magic links return to the project's default Site URL.

## Layout

```
src/        App.jsx (all screens), data.js (categories, fields, sample data), engine.js (search), legal.js (policies), seo.js (public paths), styles.js (CSS)
api/        seo.js (server-rendered pages, sitemap, robots)
public/img/ demo photos
tests/      jsdom regression tests
supabase/   schema migration and seed
```

## Public information pages

`src/info.js` holds the About, Seller guide, Pricing and Safety pages (same shape as `src/legal.js`). The app renders them at `#/about`, `#/seller-guide`, `#/pricing`, `#/safety`, and `api/seo.js` renders the same content at `/about`, `/seller-guide`, `/pricing` and `/safety` for search engines, with all four in the sitemap. `/support` and `/sellers` are app screens that get their own title and canonical link from the server (`/sellers` is noindex). Unknown addresses are served `dist/404.html` (a copy of the app) with a 404 status, and the app shows its not-found screen. Keep `src/info.js` true to how the product works, especially pricing and the trust rules.
