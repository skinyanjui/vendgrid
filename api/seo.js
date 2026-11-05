// Server-rendered, crawlable pages for VendGrid (Vercel serverless function).
// /listing/:id-:slug, category pages, /terms /privacy /refunds, /sitemap.xml and /robots.txt.
// Each HTML page is the normal app shell with real title, description, canonical link, Open Graph,
// structured data and readable content inside #root. The app then boots on top of it.
import fs from 'node:fs';
import path from 'node:path';
import { TYPES, TYPE_KEYS } from '../src/data.js';
import { priceText } from '../src/engine.js';
import { POLICIES, LEGAL } from '../src/legal.js';
import { CAT_PATHS, CAT_SEO, listingPath, POLICY_PATHS } from '../src/seo.js';

const SB = 'https://bfovgafcfetfeqykjfco.supabase.co';
const KEY = 'sb_publishable_FfVpTa_cEtn_LRJ5FNc-VQ_8bvPbVZx'; // publishable; row-level security applies
const PUBLIC_STATUSES = ['published', 'sold', 'filled', 'expired'];

const esc = (s) => String(s == null ? '' : s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const clip = (s, n) => { const t = String(s || '').replace(/\s+/g, ' ').trim(); return t.length > n ? t.slice(0, n - 1).replace(/\s+\S*$/, '') + '…' : t; };
const ld = (o) => `<script type="application/ld+json">${JSON.stringify(o).replace(/</g, '\\u003c')}</script>`;

async function rest(q) {
  const r = await fetch(`${SB}/rest/v1/${q}`, { headers: { apikey: KEY, Authorization: `Bearer ${KEY}` } });
  if (!r.ok) throw new Error(`supabase ${r.status}`);
  return r.json();
}

let shellCache = null;
async function shell(origin) {
  if (shellCache) return shellCache;
  for (const p of [path.join(process.cwd(), 'dist', 'index.html'), path.join(process.cwd(), 'index.html')]) {
    try { shellCache = fs.readFileSync(p, 'utf8'); return shellCache; } catch (e) { /* try next */ }
  }
  const r = await fetch(origin + '/index.html');
  shellCache = await r.text();
  return shellCache;
}

const SSR_CSS = `<style>.ssr{font:16px/1.5 system-ui,-apple-system,"Segoe UI",sans-serif;max-width:760px;margin:0 auto;padding:24px max(16px,env(safe-area-inset-left,0px));color:#171717}.ssr a{color:inherit}.ssr img{max-width:100%;height:auto;border-radius:8px}.ssr dl{display:grid;grid-template-columns:minmax(0,1fr) minmax(0,2fr);gap:4px 16px}.ssr dt{color:#666}.ssr dd{margin:0}.ssr ul{padding-left:20px}.ssr nav{font-size:14px;color:#666}@media (prefers-color-scheme:dark){.ssr{color:#ededed}.ssr dt,.ssr nav{color:#a1a1a1}}</style>`;

function page(html, { title, desc, canonical, robots, image, type = 'website', jsonld = [], body }) {
  const head = [
    `<link rel="canonical" href="${esc(canonical)}">`,
    robots ? `<meta name="robots" content="${robots}">` : '',
    `<meta property="og:site_name" content="VendGrid">`,
    `<meta property="og:type" content="${type}">`,
    `<meta property="og:title" content="${esc(title)}">`,
    `<meta property="og:description" content="${esc(desc)}">`,
    `<meta property="og:url" content="${esc(canonical)}">`,
    image ? `<meta property="og:image" content="${esc(image)}">` : '',
    `<meta name="twitter:card" content="${image ? 'summary_large_image' : 'summary'}">`,
    ...jsonld.map(ld),
    SSR_CSS,
  ].filter(Boolean).join('\n');
  return html
    .replace(/<title>[^<]*<\/title>/, `<title>${esc(title)}</title>`)
    .replace(/<meta name="description"[^>]*>/, `<meta name="description" content="${esc(desc)}">`)
    .replace('</head>', head + '\n</head>')
    .replace('<div id="root"></div>', `<div id="root"><main class="ssr">${body}</main></div>`);
}

const crumbs = (origin, items) => ({
  '@context': 'https://schema.org', '@type': 'BreadcrumbList',
  itemListElement: items.map(([name, url], i) => ({ '@type': 'ListItem', position: i + 1, name, item: origin + url })),
});

const toListing = (r) => ({ id: r.id, type: r.type, title: r.title, desc: r.description, price: r.price == null ? null : Number(r.price), priceType: r.price_type, f: r.fields || {}, photos: r.photos || [], status: r.status, geo: { city: r.city, st: r.st }, org: r.org_id, updatedAt: r.updated_at, createdAt: r.created_at });
const abs = (origin, p) => (/^https?:/.test(p) ? p : origin + '/' + String(p).replace(/^\//, ''));
const condition = (c) => (/new/i.test(c) ? 'NewCondition' : /refurb/i.test(c) ? 'RefurbishedCondition' : /parts/i.test(c) ? 'DamagedCondition' : 'UsedCondition');
const where = (l) => (l.type === 'services' ? `Serves ${l.f.coverage || ''} mi around ${l.geo.city}, ${l.geo.st}` : l.type === 'routes' ? `Operating around ${l.geo.city}, ${l.geo.st}` : `${l.geo.city}, ${l.geo.st}`);
const fmtVal = (f, v) => (Array.isArray(v) ? v.join(', ') : f.key === 'traffic' ? `${v} / day` : f.key === 'coverage' ? `${v} mi` : typeof v === 'boolean' ? (v ? 'Yes' : 'No') : String(v));

async function listingPage(origin, canonOrigin, slug, html, indexable) {
  const id = parseInt(slug, 10);
  if (!id) return { status: 404, html: page(html, { title: 'Listing not found · VendGrid', desc: 'This listing is no longer on VendGrid.', canonical: canonOrigin + '/', robots: 'noindex', body: '<h1>Listing not found</h1><p><a href="/">Browse VendGrid</a></p>' }) };
  const [row] = await rest(`vg_listings?id=eq.${id}&select=*`);
  if (!row || !PUBLIC_STATUSES.includes(row.status) || !TYPES[row.type]) {
    return { status: 404, html: page(html, { title: 'Listing not found · VendGrid', desc: 'This listing is no longer on VendGrid.', canonical: canonOrigin + '/', robots: 'noindex', body: '<h1>That listing is no longer here</h1><p><a href="/">Browse VendGrid</a></p>' }) };
  }
  const l = toListing(row);
  const want = listingPath(l);
  if ('/listing/' + slug !== want) return { redirect: want };
  const t = TYPES[l.type];
  const [org] = row.org_id ? await rest(`vg_orgs?id=eq.${encodeURIComponent(row.org_id)}&select=name,slug,verified,city`) : [];
  const related = await rest(`vg_listings?type=eq.${l.type}&status=eq.published&id=neq.${l.id}&select=id,title,type,price,price_type,city,st,fields&order=created_at.desc&limit=6`).catch(() => []);
  const canonical = canonOrigin + want;
  const price = priceText(l);
  const sellerName = org ? org.name : 'Independent seller';
  const open = l.status === 'published';
  const title = clip(`${l.title} · ${price}${l.type === 'services' ? '' : ' · ' + l.geo.city + ', ' + l.geo.st}`, 70) + ' | VendGrid';
  const desc = clip(`${t.singular} in ${l.geo.city}, ${l.geo.st}. ${price}. ${l.desc}`, 158);
  const images = l.photos.slice(0, 6).map((p) => abs(origin, p));
  const facts = t.fields.filter((f) => !f.private && l.f[f.key] !== undefined && l.f[f.key] !== '' && !(Array.isArray(l.f[f.key]) && !l.f[f.key].length));
  const catPath = '/' + CAT_PATHS[l.type];
  const jsonld = [crumbs(canonOrigin, [['VendGrid', '/'], [t.label, catPath], [l.title, want]])];
  if ((l.type === 'machines' || l.type === 'parts') && l.price != null) {
    jsonld.push({
      '@context': 'https://schema.org', '@type': 'Product', name: l.title, description: clip(l.desc, 5000), image: images,
      ...(l.f.manufacturer ? { brand: { '@type': 'Brand', name: l.f.manufacturer } } : {}),
      ...(l.f.model ? { model: String(l.f.model) } : {}),
      offers: {
        '@type': 'Offer', url: canonical, priceCurrency: 'USD', price: l.price,
        availability: open ? 'https://schema.org/InStock' : l.status === 'sold' ? 'https://schema.org/SoldOut' : 'https://schema.org/Discontinued',
        ...(l.f.condition ? { itemCondition: 'https://schema.org/' + condition(l.f.condition) } : {}),
        seller: { '@type': 'Organization', name: sellerName },
      },
    });
  }
  const body = [
    `<nav aria-label="Breadcrumb"><a href="/">VendGrid</a> › <a href="${catPath}">${esc(t.label)}</a></nav>`,
    `<h1>${esc(l.title)}</h1>`,
    `<p><strong>${esc(price)}</strong>${l.priceType === 'negotiable' ? ' · Negotiable' : ''} · ${esc(where(l))}</p>`,
    open ? '' : `<p><strong>${l.status === 'sold' ? 'This item has been sold.' : l.status === 'filled' ? 'This opportunity has been filled.' : 'This listing has expired.'}</strong></p>`,
    images[0] ? `<img src="${esc(images[0])}" alt="${esc(l.title)}" width="760" height="570">` : '',
    `<h2>Description</h2><p>${esc(l.desc)}</p>`,
    facts.length ? `<h2>Details</h2><dl>${facts.map((f) => `<dt>${esc(f.label)}${f.hostReported ? ' (seller-reported)' : ''}</dt><dd>${esc(fmtVal(f, l.f[f.key]))}</dd>`).join('')}</dl>` : '',
    l.type === 'routes' ? '<p>Financial figures are reported by the seller and are not independently verified by VendGrid.</p>' : '',
    `<h2>Seller</h2><p>${org && org.slug ? `<a href="/#business-${esc(org.slug)}">${esc(sellerName)}</a>` : esc(sellerName)}${org && org.verified ? ' · Verified business' : ''}${org && org.city ? ' · ' + esc(org.city) : ''}</p>`,
    `<p>VendGrid connects buyers and sellers. It doesn’t hold funds, provide escrow or verify condition or revenue.</p>`,
    related.length ? `<h2>More ${esc(t.label.toLowerCase())}</h2><ul>${related.map((r) => { const x = toListing(r); return `<li><a href="${listingPath(x)}">${esc(x.title)}</a> · ${esc(priceText(x))} · ${esc(x.geo.city)}, ${esc(x.geo.st)}</li>`; }).join('')}</ul>` : '',
  ].join('\n');
  return { status: 200, html: page(html, { title, desc, canonical, robots: indexable && open ? '' : 'noindex', image: images[0], type: l.type === 'machines' || l.type === 'parts' ? 'product' : 'article', jsonld, body }) };
}

async function catPage(origin, canonOrigin, cat, html, indexable) {
  const t = TYPES[cat];
  const [h1, intro] = CAT_SEO[cat];
  const rows = await rest(`vg_listings?type=eq.${cat}&status=eq.published&select=id,title,type,price,price_type,city,st,fields&order=created_at.desc&limit=60`);
  const p = '/' + CAT_PATHS[cat];
  const body = [
    `<nav aria-label="Breadcrumb"><a href="/">VendGrid</a></nav>`,
    `<h1>${esc(h1)}</h1><p>${esc(intro)}</p>`,
    rows.length ? `<ul>${rows.map((r) => { const x = toListing(r); return `<li><a href="${listingPath(x)}">${esc(x.title)}</a> · ${esc(priceText(x))} · ${esc(x.geo.city)}, ${esc(x.geo.st)}</li>`; }).join('')}</ul>` : `<p>No ${esc(t.label.toLowerCase())} are listed right now.</p>`,
    `<h2>Browse more</h2><ul>${TYPE_KEYS.filter((k) => k !== cat).map((k) => `<li><a href="/${CAT_PATHS[k]}">${esc(CAT_SEO[k][0])}</a></li>`).join('')}</ul>`,
  ].join('\n');
  return { status: 200, html: page(html, { title: `${h1} | VendGrid`, desc: clip(intro + ` ${rows.length} listed now.`, 158), canonical: canonOrigin + p, robots: indexable ? '' : 'noindex', jsonld: [crumbs(canonOrigin, [['VendGrid', '/'], [t.label, p]])], body }) };
}

function policyPage(canonOrigin, doc, html, indexable) {
  const P = POLICIES[doc];
  const body = [`<h1>${esc(P.title)}</h1><p>Last updated ${esc(LEGAL.updated)}</p><p>${esc(P.intro)}</p>`, ...P.sections.map(([h, ps]) => `<h2>${esc(h)}</h2>${ps.map((x) => { const m = x.match(/^([A-Z][^:.]{2,40}): (.*)$/); return m ? `<p><strong>${esc(m[1])}:</strong> ${esc(m[2])}</p>` : `<p>${esc(x)}</p>`; }).join('')}`)].join('\n');
  return { status: 200, html: page(html, { title: `${P.title} | VendGrid`, desc: clip(P.intro, 158), canonical: canonOrigin + POLICY_PATHS[doc], robots: indexable ? '' : 'noindex', body }) };
}

async function sitemap(canonOrigin) {
  const rows = await rest('vg_listings?status=eq.published&select=id,title,updated_at&order=updated_at.desc&limit=5000');
  const urls = [
    ['/', null], ...TYPE_KEYS.map((k) => ['/' + CAT_PATHS[k], null]), ['/terms', null], ['/privacy', null],
    ...rows.map((r) => [listingPath(r), r.updated_at]),
  ];
  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.map(([u, m]) => `<url><loc>${esc(canonOrigin + u)}</loc>${m ? `<lastmod>${new Date(m).toISOString().slice(0, 10)}</lastmod>` : ''}</url>`).join('\n')}\n</urlset>\n`;
}

export default async function handler(req, res) {
  const q = req.query || {};
  const host = req.headers['x-forwarded-host'] || req.headers.host || 'localhost';
  const origin = (host.startsWith('localhost') ? 'http://' : 'https://') + host;
  const indexable = process.env.VERCEL_ENV ? process.env.VERCEL_ENV === 'production' : true;
  const prod = process.env.VERCEL_PROJECT_PRODUCTION_URL;
  const canonOrigin = indexable && prod ? 'https://' + prod : origin;
  try {
    if (q.kind === 'robots') {
      res.setHeader('Content-Type', 'text/plain; charset=utf-8');
      res.setHeader('Cache-Control', 'public, s-maxage=3600');
      return res.status(200).send(indexable ? `User-agent: *\nAllow: /\nDisallow: /api/\n\nSitemap: ${canonOrigin}/sitemap.xml\n` : 'User-agent: *\nDisallow: /\n');
    }
    if (q.kind === 'sitemap') {
      res.setHeader('Content-Type', 'application/xml; charset=utf-8');
      res.setHeader('Cache-Control', 'public, s-maxage=900, stale-while-revalidate=86400');
      return res.status(200).send(await sitemap(canonOrigin));
    }
    const html = await shell(origin);
    let out;
    if (q.kind === 'listing') out = await listingPage(origin, canonOrigin, String(q.slug || ''), html, indexable);
    else if (q.kind === 'cat' && TYPES[Object.keys(CAT_PATHS).find((k) => CAT_PATHS[k] === q.c)]) out = await catPage(origin, canonOrigin, Object.keys(CAT_PATHS).find((k) => CAT_PATHS[k] === q.c), html, indexable);
    else if (q.kind === 'policy' && POLICIES[q.doc]) out = policyPage(canonOrigin, q.doc, html, indexable);
    else out = { status: 404, html };
    if (out.redirect) { res.setHeader('Location', out.redirect); res.setHeader('Cache-Control', 'public, s-maxage=300'); return res.status(301).end(); }
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.setHeader('Cache-Control', out.status === 200 ? 'public, s-maxage=300, stale-while-revalidate=86400' : 'public, s-maxage=60');
    return res.status(out.status).send(out.html);
  } catch (e) {
    // Data unavailable: still serve the app, and tell crawlers to come back later.
    res.setHeader('Retry-After', '120');
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.setHeader('Cache-Control', 'no-store');
    try { return res.status(503).send(await shell(origin)); } catch (x) { return res.status(503).send('VendGrid is temporarily unavailable. Try again in a few minutes.'); }
  }
}

