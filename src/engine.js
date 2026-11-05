// Mock "server": search, ranking, intent parsing, suggestions, geo matching.
// Everything here would be an API call in production (GET /api/v1/listings).
import { TYPES, TYPE_KEYS, CITIES, REGIONS, dist, resolveLocation, FMT, optionsFor } from './data.js';

export const PAGE = 12;
const STOP = new Set(['in', 'near', 'under', 'for', 'the', 'a', 'an', 'and', 'to', 'of', 'vending', 'machines', 'with', 'me']);
const stem = (w) => (w.length > 3 && w.endsWith('s') ? w.slice(0, -1) : w);
const tokens = (s) => (s || '').toLowerCase().split(/[^a-z0-9$]+/).filter(Boolean).map(stem).filter((w) => !STOP.has(w));

export const SORTS = {
  relevance: 'Relevance', newest: 'Newest', updated: 'Recently updated', oldest: 'Oldest', 'price-asc': 'Price: Low to High', 'price-desc': 'Price: High to Low', distance: 'Distance', verified: 'Verified sellers first', title: 'Title: A to Z',
};

export const DEFAULT_QUERY = { q: '', cat: 'all', loc: '', r: '', sort: '', f: {}, pmin: '', pmax: '', np: '', verified: '', view: '', n: 1 };

export function sortOptions(query) {
  const hasPrice = query.cat === 'all' || TYPES[query.cat].hasPrice;
  const point = resolveLocation(query.loc);
  const out = [];
  if (query.q) out.push('relevance');
  out.push('newest', 'updated', 'oldest');
  if (hasPrice) out.push('price-asc', 'price-desc');
  if (point && point.kind === 'city') out.push('distance');
  out.push('verified', 'title');
  return out;
}
export const effectiveSort = (query) => {
  const opts = sortOptions(query);
  if (query.sort && opts.includes(query.sort)) return query.sort;
  return query.q ? 'relevance' : 'newest';
};

// Light natural-language intent: "route under $100,000", "repair near Evansville".
export function parseIntent(raw, current) {
  let q = raw, out = { ...current };
  let m = q.match(/\bunder\s+\$?([\d,.]+)\s*(k)?\b/i);
  if (m) {
    let v = parseFloat(m[1].replace(/,/g, ''));
    if (m[2]) v *= 1000;
    if (v > 0) { out.pmax = String(Math.round(v)); q = q.replace(m[0], ' '); }
  }
  m = q.match(/\b(?:in|near)\s+([a-z.\s,]+?)\s*$/i);
  if (m) {
    const hit = resolveLocation(m[1]);
    if (hit) { if (!out.loc) out.loc = hit.label; q = q.replace(m[0], ' '); }
  }
  if (out.cat === 'all') {
    if (/\b(wanted|looking for|wtb)\b/i.test(q)) out.cat = 'wanted';
    else if (/\b(parts?|coin mech|bill validator|validator|spirals?|coils?|control board|keypad|compressor)\b/i.test(q)) out.cat = 'parts';
    else if (/\broutes?\b/i.test(q)) out.cat = 'routes';
    else if (/\b(placements?|operator|location opportunit)/i.test(q)) out.cat = 'locations';
    else if (/\b(repair|installation|technician|retrofit)\b/i.test(q)) out.cat = 'services';
  }
  out.q = q.replace(/\s+/g, ' ').trim();
  return out;
}

const hay = (l) => {
  const fv = Object.entries(l.f).filter(([k]) => k !== 'address').map(([, v]) => (Array.isArray(v) ? v.join(' ') : String(v))).join(' ');
  return { title: l.title.toLowerCase(), f: fv.toLowerCase(), other: `${l.desc} ${l.orgName} ${l.geo.city} ${l.geo.st} ${TYPES[l.type].label} ${TYPES[l.type].singular}`.toLowerCase() };
};

function geoOk(l, point, radius) {
  if (!point) return { ok: true, d: null };
  if (point.kind === 'region') {
    const r = REGIONS.find((x) => x.name === point.name);
    return { ok: !!r && r.test(l.geo), d: null };
  }
  const d = dist(point, l.geo);
  const rad = radius === '' || radius == null ? 100 : radius === 'any' ? Infinity : +radius;
  if (l.type === 'services') return { ok: d <= Math.max(+l.f.coverage || 0, rad === Infinity ? Infinity : 0) || d <= (+l.f.coverage || 0), d };
  if (l.type === 'routes') return { ok: d <= rad + 40, d };
  return { ok: d <= rad, d };
}

/* ───────────── search engine ─────────────
   One indexed pass answers everything the browse screen needs: the ranked results, how many listings each
   filter option would give (counts for every other filter held fixed), and the price spread. Results are cached
   per (listings, orgs, query), so paging, the map and the filter panel all share one computation. */
const INDEX = new WeakMap(); // listings array -> { orgs, rows, last }
function indexFor(listings, orgs) {
  const hit = INDEX.get(listings);
  if (hit && hit.orgs === orgs) return hit;
  const rows = [];
  for (const raw of listings) {
    if (raw.status !== 'published') continue; // sold / paused / withdrawn never appear
    const l = { ...raw, orgName: orgs[raw.org].name };
    const filled = Object.values(l.f).filter((v) => v !== '' && v != null && !(Array.isArray(v) && !v.length)).length;
    rows.push({ l, h: hay(l), complete: Math.min(1, filled / 8) });
  }
  const idx = { orgs, rows, last: null, band: {} };
  INDEX.set(listings, idx);
  return idx;
}
const valuesOf = (l, def, opts) => {
  if (def.test) return opts.filter((o) => def.test(l, o)); // a computed filter: which of its options this listing satisfies
  const v = l.f[def.key];
  if (Array.isArray(v)) return v.map(String);
  return v === '' || v == null ? [] : [String(v)];
};
const only = (F, x) => F.length === 0 || (F.length === 1 && F[0] === x);

function compute(idx, orgs, query) {
  const point = resolveLocation(query.loc);
  const qt = tokens(query.q);
  const sort = effectiveSort(query);
  const cat = query.cat;
  const fdefs = cat === 'all' ? [] : TYPES[cat].filters.filter((d) => d.kind !== 'price');
  const active = Object.entries(query.f).filter(([, v]) => v && !(Array.isArray(v) && !v.length));
  const hasPrice = query.pmin !== '' || query.pmax !== '';
  const now = Date.now();
  const counts = {}, optsOf = {};
  fdefs.forEach((d) => { counts[d.key] = new Map(); optsOf[d.key] = d.options || optionsFor(cat, d.key) || []; });
  const catCounts = {}; let verifiedCount = 0; const prices = [];
  const rows = [];
  for (const row of idx.rows) {
    const l = row.l;
    const g = geoOk(l, point, query.r);
    if (!g.ok) continue;
    let score = 0;
    if (qt.length) {
      for (const t of qt) {
        let s = 0;
        if (row.h.title.includes(t)) s += 3;
        if (row.h.f.includes(t)) s += 2;
        if (row.h.other.includes(t)) s += 1;
        if (!s) { score = -1; break; }
        score += s;
      }
      if (score < 0) continue;
    }
    const F = []; // which filters this listing fails (a missing price is never zero: it fails a price filter unless included)
    if (cat !== 'all' && l.type !== cat) F.push('cat');
    const ver = !!orgs[l.org].verified;
    if (query.verified && !ver) F.push('ver');
    if (hasPrice) {
      if (l.price == null) { if (!query.np) F.push('price'); }
      else if ((query.pmin !== '' && l.price < +query.pmin) || (query.pmax !== '' && l.price > +query.pmax)) F.push('price');
    }
    for (const [k, v] of active) {
      const def = TYPES[l.type].filters.find((x) => x.key === k);
      if (!def) { if (cat === 'all') F.push('f:' + k); continue; }
      let ok;
      if (def.test) ok = def.test(l, v);
      else { const have = l.f[k]; ok = Array.isArray(v) ? v.every((x) => (Array.isArray(have) ? have.includes(x) : have === x)) : Array.isArray(have) ? have.includes(v) : have === v; }
      if (!ok) F.push('f:' + k);
    }
    if (F.length > 1) continue; // fails two or more: matters to no count
    if (only(F, 'cat')) catCounts[l.type] = (catCounts[l.type] || 0) + 1;
    if (ver && only(F, 'ver')) verifiedCount++;
    if (l.price != null && only(F, 'price')) prices.push(l.price);
    for (const d of fdefs) {
      if (!only(F, 'f:' + d.key)) continue;
      const m = counts[d.key];
      for (const x of valuesOf(l, d, optsOf[d.key])) m.set(x, (m.get(x) || 0) + 1);
    }
    if (F.length) continue;
    // freshness, proximity, completeness, active availability
    const age = (now - l.updatedAt) / 864e5;
    const fresh = Math.max(0, 2 - age / 15);
    const prox = g.d == null ? 0 : Math.max(0, 2 - g.d / 60);
    rows.push({ l, score: score + fresh + prox + row.complete, d: g.d, text: score });
  }
  const cmp = {
    relevance: (a, b) => b.score - a.score,
    newest: (a, b) => b.l.createdAt - a.l.createdAt,
    'price-asc': (a, b) => (a.l.price == null) - (b.l.price == null) || a.l.price - b.l.price,
    'price-desc': (a, b) => (a.l.price == null) - (b.l.price == null) || b.l.price - a.l.price,
    distance: (a, b) => (a.d ?? 1e9) - (b.d ?? 1e9),
    updated: (a, b) => b.l.updatedAt - a.l.updatedAt,
    oldest: (a, b) => a.l.createdAt - b.l.createdAt,
    title: (a, b) => a.l.title.localeCompare(b.l.title),
    verified: (a, b) => (orgs[b.l.org].verified ? 1 : 0) - (orgs[a.l.org].verified ? 1 : 0) || b.l.createdAt - a.l.createdAt,
  }[sort];
  rows.sort((a, b) => cmp(a, b) || a.l.id - b.l.id); // id tiebreak => stable pagination
  let items = rows.map((r) => r.l);
  const total = items.length;
  // Sponsored: explicitly labeled, drawn from the matching set, never changes verification or organic order of the rest.
  if (sort === 'newest' || sort === 'relevance') {
    // fixed slots: at most 2, and with a keyword they must be a decent match (>=60% of the best organic score)
    let top = 0; for (const r of rows) if (r.score > top) top = r.score;
    const sp = rows.filter((r) => r.l.sponsored && (!qt.length || r.score >= top * 0.6)).slice(0, 2).map((r) => r.l);
    items = [...sp, ...items.filter((l) => !sp.includes(l))];
  }
  const facets = {};
  fdefs.forEach((d) => { facets[d.key] = [...counts[d.key]].sort((a, b) => b[1] - a[1] || String(a[0]).localeCompare(String(b[0]))); });
  prices.sort((a, b) => a - b);
  // Price bands come from the whole category (not the filtered set), so the quick picks stay put while the counts move.
  if (cat !== 'all' && !idx.band[cat]) idx.band[cat] = idx.rows.filter((r) => r.l.type === cat && r.l.price != null).map((r) => r.l.price).sort((a, b) => a - b);
  return { total, items, facets, catCounts, verifiedCount, prices, bandPrices: cat === 'all' ? [] : idx.band[cat] };
}

/** Everything for a query: all matching listings in order plus the live counts. Cached; paging never recomputes. */
export function searchFull(listings, orgs, query) {
  const idx = indexFor(listings, orgs);
  const ck = JSON.stringify({ ...query, n: 0, view: '' });
  if (idx.last && idx.last.ck === ck) return idx.last.res;
  const res = compute(idx, orgs, query);
  idx.last = { ck, res };
  return res;
}

export function runSearch(listings, orgs, query) {
  const r = searchFull(listings, orgs, query);
  const end = query.n * PAGE;
  return { total: r.total, items: r.items.slice(0, end), hasMore: r.items.length > end };
}

export function suggest(listings, orgs, text) {
  const t = text.trim().toLowerCase();
  if (t.length < 2) return [];
  const out = [];
  TYPE_KEYS.forEach((k) => TYPES[k].label.toLowerCase().startsWith(t) && out.push({ kind: 'Category', label: TYPES[k].label, apply: { cat: k, q: '' } }));
  const equip = new Set();
  TYPES.machines.fields.find((f) => f.key === 'machineType').options.forEach((o) => equip.add(o + ' machine'));
  [...equip].filter((e) => e.toLowerCase().includes(t)).slice(0, 2).forEach((e) => out.push({ kind: 'Equipment', label: e, apply: { cat: 'machines', q: e.replace(' machine', '') } }));
  TYPES.machines.fields.find((f) => f.key === 'manufacturer').options.filter((o) => o !== 'Other' && o.toLowerCase().startsWith(t)).forEach((m) => out.push({ kind: 'Manufacturer', label: m, apply: { cat: 'machines', q: '', f: { manufacturer: m } } }));
  CITIES.filter((c) => c.city.toLowerCase().startsWith(t)).slice(0, 2).forEach((c) => out.push({ kind: 'Place', label: `${c.city}, ${c.st}`, apply: { loc: `${c.city}, ${c.st}`, q: '' } }));
  listings.filter((l) => l.status === 'published' && (l.title.toLowerCase().includes(t) || orgs[l.org].name.toLowerCase().includes(t))).slice(0, 3).forEach((l) => out.push({ kind: TYPES[l.type].singular, label: l.title, listing: l }));
  return out.slice(0, 8);
}

export function describeQuery(query) {
  const bits = [];
  if (query.cat !== 'all') bits.push(TYPES[query.cat].label);
  return bits;
}

export const priceText = (l) => (l.type === 'wanted' ? (l.price != null ? 'Budget ' + FMT(l.price) : 'Budget open') : l.price != null ? FMT(l.price) : l.priceType === 'negotiable' ? 'Negotiable' : l.type === 'locations' ? (l.f && +l.f.commission ? `${+l.f.commission}% commission` : l.f && +l.f.rent ? `${FMT(+l.f.rent)}/mo rent asked` : l.f && l.f.terms === 'Free placement' ? 'Free placement' : 'Accepting proposals') : l.type === 'services' ? (l.f.rate || 'Request quote') : TYPES[l.type].noPriceText);
