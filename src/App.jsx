import { createPortal } from 'react-dom';
import React, { useState, useEffect, useRef, useMemo, useCallback, createContext, useContext } from 'react';
import { POLICIES, LEGAL } from './legal.js';
import { INFO, INFO_KEYS, INFO_LABELS, INFO_CTA } from './info.js';
import { pathToRoute, listingPath } from './seo.js';
import { TYPES, TYPE_KEYS, CITIES, dist, ORGS, SEED, PRIVATE_SEED, DEMO_ROOMS, TRANSITIONS, STATUS_LABEL, FMT, resolveLocation, suggestLocations, hrefFor, slugify, optionsFor } from './data.js';
import { PAGE, SORTS, DEFAULT_QUERY, sortOptions, effectiveSort, parseIntent, runSearch, suggest, priceText } from './engine.js';
import { CSS } from './styles.js';
import * as api from './backend.js';
import L from 'leaflet';
import LEAFLET_CSS from 'leaflet/dist/leaflet.css';
import { PanelLeft, Search, MapPin, Heart, Menu, X, Plus, Check, ArrowLeft, Share2, ChevronRight, ChevronLeft, Flag, SlidersHorizontal, Send, User, Package, Route as RouteIcon, Refrigerator, Wrench, ImagePlus, Trash2, Eye, Info, Building2, Sun, Moon, Monitor, Lock, EyeOff, BarChart3, Circle, Cog, BookOpen, AlertTriangle, Megaphone, Map as MapIcon, LayoutGrid, Paperclip, FileText, Clock, ExternalLink, Bell, ArrowUpDown } from 'lucide-react';

/* ───────────── icons (Lucide) ───────────── */
const LI = { panel: PanelLeft, sort: ArrowUpDown, search: Search, pin: MapPin, heart: Heart, menu: Menu, x: X, plus: Plus, check: Check, back: ArrowLeft, share: Share2, chev: ChevronRight, left: ChevronLeft, flag: Flag, sliders: SlidersHorizontal, send: Send, user: User, box: Package, route: RouteIcon, machine: Refrigerator, wrench: Wrench, image: ImagePlus, trash: Trash2, eye: Eye, info: Info, building: Building2, sun: Sun, moon: Moon, auto: Monitor, cog: Cog, book: BookOpen, alert: AlertTriangle, megaphone: Megaphone, map: MapIcon, grid: LayoutGrid, clip: Paperclip, lock: Lock, eyeoff: EyeOff, chart: BarChart3, circle: Circle, file: FileText, clock: Clock, ext: ExternalLink, bell: Bell };
const CAT_ICON = { wanted: 'megaphone', machines: 'machine', parts: 'cog', locations: 'building', routes: 'route', services: 'wrench' };
const Icon = ({ n, size = 20, stroke = 2 }) => { const C = LI[n]; return C ? <C className={'icon i-' + n} size={size} strokeWidth={stroke} aria-hidden="true" style={{ width: size, height: size }} /> : null; };

/* ───────────── router (hash-based, state mirrored in URL) ───────────── */
const enc = encodeURIComponent;
export function encodeQuery(q) {
  const p = [];
  if (q.q) p.push('q=' + enc(q.q));
  if (q.cat && q.cat !== 'all') p.push('cat=' + q.cat);
  if (q.loc) p.push('loc=' + enc(q.loc));
  if (q.r) p.push('r=' + q.r);
  if (q.sort) p.push('sort=' + q.sort);
  if (q.pmin !== '') p.push('pmin=' + q.pmin);
  if (q.pmax !== '') p.push('pmax=' + q.pmax);
  if (q.np) p.push('np=1');
  if (q.view === 'map') p.push('view=map');
  if (q.verified) p.push('verified=1');
  if (q.n > 1) p.push('n=' + q.n);
  Object.entries(q.f).forEach(([k, v]) => { const s = Array.isArray(v) ? v.join('|') : v; if (s) p.push('f.' + k + '=' + enc(s)); });
  return '#/' + (p.length ? '?' + p.join('&') : '');
}
function decodeQuery(search) {
  const q = { ...DEFAULT_QUERY, f: {} };
  new URLSearchParams(search).forEach((v, k) => {
    if (k === 'q') q.q = v; else if (k === 'cat' && TYPES[v]) q.cat = v; else if (k === 'loc') q.loc = v; else if (k === 'r' && ['25', '50', '250', 'any'].includes(v)) q.r = v;
    else if (k === 'sort' && SORTS[v]) q.sort = v; else if (k === 'pmin' && v !== '' && !isNaN(+v)) q.pmin = v; else if (k === 'pmax' && v !== '' && !isNaN(+v)) q.pmax = v;
    else if (k === 'verified') q.verified = '1'; else if (k === 'np') q.np = '1'; else if (k === 'view' && v === 'map') q.view = 'map'; else if (k === 'n') q.n = Math.max(1, Math.min(20, parseInt(v) || 1));
    else if (k.startsWith('f.')) q.f[k.slice(2)] = v.includes('|') || k === 'f.requirements' ? v.split('|').filter(Boolean) : v;
  });
  return q;
}
export function parseHash(h) {
  const raw = (h || '').replace(/^#/, '') || '/';
  const [path, search = ''] = raw.split('?');
  const seg = path.split('/').filter(Boolean);
  const sp = new URLSearchParams(search);
  if (!seg.length) return { name: 'browse', query: decodeQuery(search) };
  switch (seg[0]) {
    case 'listing': return seg[2] === 'inquire' ? { name: 'inquire', id: +seg[1] } : { name: 'listing', id: +seg[1] };
    case 'post': return { name: 'post', type: sp.get('type') || '', edit: sp.get('edit') ? +sp.get('edit') : null };
    case 'saved': return { name: 'saved', tab: sp.get('tab') || 'listings' };
    case 'messages': return { name: 'messages', tab: sp.get('tab') || 'conversations', c: sp.get('c') || '' };
    case 'my-listings': return { name: 'mine' };
    case 'business': return { name: 'business', slug: seg[1] };
    case 'login': return { name: 'login', next: sp.get('next') || '#/' };
    case 'legal': return { name: 'legal', doc: sp.get('doc') || 'terms' };
    case 'billing': return { name: 'billing' };
    case 'business-settings': return { name: 'bizsettings' };
    case 'admin': return { name: 'admin', tab: sp.get('tab') || 'verification' };
    case 'account': case 'menu': return { name: 'account' };
    case 'guide': return { name: 'guide', topic: sp.get('t') || 'machines' };
    case 'activity': return { name: 'activity' };
    case 'settings': return { name: 'settings' };
    case 'about': case 'seller-guide': case 'pricing': case 'safety': return { name: 'info', doc: seg[0] };
    case 'support': return { name: 'legal', doc: 'support' };
    case 'sellers': return { name: 'sellers' };
    default: return { name: 'notfound' };
  }
}

/* The published page only passes plain #names through the address bar, so the internal
   #/path routes are mapped to #name addresses (and back) at the edge. */
const toHex = (s) => Array.from(unescape(encodeURIComponent(s))).map((c) => c.charCodeAt(0).toString(16).padStart(2, '0')).join('');
const fromHex = (h) => { try { return decodeURIComponent(escape(((h.match(/../g)) || []).map((x) => String.fromCharCode(parseInt(x, 16))).join(''))); } catch (e) { return ''; } };
export function toAddr(h) {
  const r = parseHash(h);
  switch (r.name) {
    case 'listing': return '#listing-' + r.id;
    case 'inquire': return '#inquire-' + r.id;
    case 'business': return '#business-' + r.slug;
    case 'browse': { const s = h.split('?')[1] || ''; return s ? '#s-' + toHex(s) : '#'; }
    case 'mine': return '#my-listings';
    case 'bizsettings': return '#business-settings';
    case 'notfound': return '#404';
    case 'info': return '#' + r.doc;
    case 'legal': return r.doc === 'support' ? '#support' : '#legal';
    default: return '#' + r.name;
  }
}
export function fromAddr(a) {
  const s = (a || '').replace(/^#/, '');
  if (!s) return '#/';
  if (s.startsWith('/')) return a;
  let m;
  if ((m = s.match(/^listing-(\d+)$/))) return '#/listing/' + m[1] + '/x';
  if ((m = s.match(/^inquire-(\d+)$/))) return '#/listing/' + m[1] + '/inquire';
  if (s === 'business-settings') return '#/business-settings';
  if ((m = s.match(/^business-([a-z0-9-]+)$/))) return '#/business/' + m[1];
  if ((m = s.match(/^s-([0-9a-f]+)$/))) return '#/?' + fromHex(m[1]);
  if (s === 'menu') return '#/account';
  if (s === '404') return '#/404';
  if (INFO_KEYS.includes(s) || s === 'support' || s === 'sellers') return '#/' + s;
  if (s === 'my-listings') return '#/my-listings';
  if (['post', 'saved', 'messages', 'login', 'account', 'billing', 'admin', 'legal', 'guide', 'activity', 'settings'].includes(s)) return '#/' + s;
  return '#/';
}

const Ctx = createContext(null);
const useApp = () => useContext(Ctx);

/* ───────────── small shared components ───────────── */
function Skeleton({ w = '100%', h = 16, r }) { return <div className="skel" style={{ width: w, height: h, borderRadius: r }} />; }
function CardSkeleton() {
  return (
    <div className="card" aria-hidden="true">
      <div className="thumb skel" style={{ borderRadius: 0 }} />
      <div className="cbody"><Skeleton h={24} w="40%" /><Skeleton h={16} /><Skeleton h={16} w="60%" /><Skeleton h={12} w="70%" /></div>
    </div>
  );
}
const Token = ({ label, onRemove }) => (
  <span className="chip">{label}<button className="x" onClick={onRemove} aria-label={`Remove filter: ${label}`}><Icon n="x" size={14} /></button></span>
);
function Verified({ org }) {
  return org.verified ? <span className="badge ok"><Icon n="check" size={12} />Verified business</span> : null;
}
function Thumb({ l, large }) {
  const t = TYPES[l.type];
  return (
    <div className="thumb">
      {l.photos[0] ? <img src={l.photos[0]} alt={`${l.title} photo`} loading={large ? 'eager' : 'lazy'} /> : (
        <div className="fallback" role="img" aria-label={`${t.singular} listing, no photo yet`}><span className="g"><Icon n={CAT_ICON[l.type]} size={22} stroke={1.75} /></span>No photo yet</div>
      )}
    </div>
  );
}

const METRIC_LABELS = { search_results: 'Searches with results', search_zero_results: 'Searches with no results', primary_action_click: 'Contact button taps', inquiry_sent: 'Inquiries sent', listing_published: 'Listings published', listing_view: 'Listing views', signup: 'Sign-ins', save: 'Saves' };
const metricLabel = (k) => METRIC_LABELS[k] || k.replace(/_/g, ' ').replace(/^./, (c) => c.toUpperCase());

/* Brand mark: a vending machine — glass front with a 3×3 product grid, keypad column and pickup slot */
const BrandMark = () => (
  <svg className="bmark" viewBox="0 0 32 32" aria-hidden="true">
    <rect x="4" y="1.500" width="24" height="29" rx="4" className="bm-body" />
    <rect x="7.500" y="5" width="12.500" height="15.500" rx="1.500" className="bm-glass" />
    {[0, 1, 2].map((r) => [0, 1, 2].map((c) => <rect key={r + '' + c} x={9 + c * 3.600} y={6.800 + r * 4.800} width="2.400" height="3" rx=".600" className={'bm-item c' + ((r * 3 + c) % 5)} />))}
    <rect x="22" y="5" width="3" height="4" rx="1" className="bm-key" />
    {[0, 1, 2].map((k) => <circle key={k} cx="23.500" cy={12 + k * 2.800} r="1" className="bm-key" />)}
    <rect x="7.500" y="23.500" width="12.500" height="3.500" rx="1.200" className="bm-slot" />
    <rect x="22" y="23.500" width="3" height="3.500" rx="1" className="bm-key" />
  </svg>
);

/* Device storage: keeps the demo's state across reloads on this browser only. Bump STORE_V when seed data changes. */
const STORE_V = 'vg-44';
const store = {
  get(k) { try { const raw = localStorage.getItem('vg:' + k); if (raw == null) return undefined; const o = JSON.parse(raw); return o && o.v === STORE_V ? o.d : undefined; } catch (e) { return undefined; } },
  set(k, d) { try { localStorage.setItem('vg:' + k, JSON.stringify({ v: STORE_V, d })); return true; } catch (e) { return false; } },
  clear() { try { Object.keys(localStorage).filter((k) => k.startsWith('vg:')).forEach((k) => localStorage.removeItem(k)); } catch (e) { /* storage unavailable */ } },
};
function usePersist(key, init, ser, de) {
  const [v, setV] = useState(() => { const got = store.get(key); return got !== undefined ? (de ? de(got) : got) : typeof init === 'function' ? init() : init; });
  useEffect(() => { store.set(key, ser ? ser(v) : v); }, [v]);
  return [v, setV];
}
/* Shrink an uploaded photo to a JPEG data URL so it survives a reload */
const shrinkPhoto = (file) => new Promise((res) => {
  const url = URL.createObjectURL(file); const img = new Image();
  img.onload = () => { try { const k = Math.min(1, 900 / Math.max(img.width, img.height)); const c = document.createElement('canvas'); c.width = Math.max(1, Math.round(img.width * k)); c.height = Math.max(1, Math.round(img.height * k)); c.getContext('2d').drawImage(img, 0, 0, c.width, c.height); res(c.toDataURL('image/jpeg', 0.75)); } catch (e) { res(url); } };
  img.onerror = () => res(url); img.src = url;
});

/* OpenStreetMap via Leaflet. Points are city centres only. If tiles can't load (offline, or a host
   that blocks third-party images) it falls back to the built-in drawing passed as `fallback`. */
const OSM_TILES = 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';
const OSM_ATTR = '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener">OpenStreetMap</a> contributors';
let leafletCssIn = false;
function OsmMap({ points, circles = [], selected, onPick, height = 340, zoom, label, fallback }) {
  const el = useRef(null), map = useRef(null), layer = useRef(null), fitKey = useRef('');
  const [state, setState] = useState('loading');
  useEffect(() => {
    if (!leafletCssIn && typeof document !== 'undefined') { const st = document.createElement('style'); st.textContent = LEAFLET_CSS; document.head.appendChild(st); leafletCssIn = true; }
    let loaded = false, t;
    try {
      const m = L.map(el.current, { scrollWheelZoom: false, attributionControl: true, zoomControl: true });
      m.attributionControl.setPrefix('<a href="https://leafletjs.com" target="_blank" rel="noopener">Leaflet</a>');
      L.tileLayer(OSM_TILES, { maxZoom: 18, attribution: OSM_ATTR, crossOrigin: true })
        .on('tileload', () => { if (!loaded) { loaded = true; setState('ok'); } })
        .addTo(m);
      layer.current = L.layerGroup().addTo(m);
      map.current = m;
      t = setTimeout(() => { if (!loaded) setState('failed'); }, 5000);
    } catch (e) { setState('failed'); }
    return () => { clearTimeout(t); try { map.current && map.current.remove(); } catch (e) { /* already gone */ } map.current = null; };
  }, []);
  useEffect(() => {
    const m = map.current, g = layer.current; if (!m || !g) return;
    g.clearLayers();
    circles.forEach((c) => L.circle([c.lat, c.lng], { radius: c.radius, color: '#007AFF', weight: 2, dashArray: '6 4', fillOpacity: 0.08 }).addTo(g));
    points.forEach((p) => {
      const on = selected != null && p.key === selected;
      const size = p.count ? Math.round(26 + Math.sqrt(p.count) * 6) : 14;
      const icon = L.divIcon({ className: 'osm-ico', html: `<span class="osm-pin${on ? ' on' : ''}${p.count ? '' : ' dot'}" style="width:${size}px;height:${size}px">${p.count || ''}</span>`, iconSize: [size, size], iconAnchor: [size / 2, size / 2] });
      const mk = L.marker([p.lat, p.lng], { icon, keyboard: !!onPick, title: p.label, alt: p.label }).addTo(g);
      if (p.label) mk.bindTooltip(p.label, { direction: 'bottom', offset: [0, size / 2], permanent: !!p.count || !!p.always, className: 'osm-tip' });
      if (onPick) mk.on('click', () => onPick(p.key));
    });
    const all = [...points.map((p) => [p.lat, p.lng]), ...circles.flatMap((c) => { const d = c.radius / 111320; return [[c.lat + d, c.lng], [c.lat - d, c.lng]]; })];
    // Only re-frame when the set of places changes, never on selection or re-render, so panning and zooming stick.
    const key = all.map((x) => x.join(',')).join('|');
    if (key !== fitKey.current) {
      fitKey.current = key;
      if (all.length === 1 || zoom) m.setView(all[0], zoom || 10); else if (all.length) m.fitBounds(all, { padding: [36, 36], maxZoom: 10 });
    }
  }, [points, circles, selected]);
  if (state === 'failed' && fallback) return fallback;
  return <div className="osm" style={{ height }}><div ref={el} className="osm-map" role="region" aria-label={label} /></div>;
}

/* Results map: a real OpenStreetMap with one pin per city (listings never show exact addresses). Nearby pins merge into
   numbered clusters that open up as you zoom; the cards underneath always show what's in view, or the pin you picked. */
function ClusterMap({ points, selected, onPick, onHover, onView, apiRef, height = 420, label, fallback }) {
  const el = useRef(null), map = useRef(null), layer = useRef(null), fitKey = useRef(''), lastSel = useRef(null), draw = useRef(() => {});
  const [state, setState] = useState('loading');
  const live = useRef({ points, selected, onPick, onHover, onView }); live.current = { points, selected, onPick, onHover, onView };
  useEffect(() => {
    if (!leafletCssIn && typeof document !== 'undefined') { const st = document.createElement('style'); st.textContent = LEAFLET_CSS; document.head.appendChild(st); leafletCssIn = true; }
    let loaded = false, t, timer, ro;
    try {
      const m = L.map(el.current, { scrollWheelZoom: false, attributionControl: true, zoomControl: true });
      m.attributionControl.setPrefix('<a href="https://leafletjs.com" target="_blank" rel="noopener">Leaflet</a>');
      L.tileLayer(OSM_TILES, { maxZoom: 18, attribution: OSM_ATTR, crossOrigin: true }).on('tileload', () => { if (!loaded) { loaded = true; setState('ok'); } }).addTo(m);
      layer.current = L.layerGroup().addTo(m); map.current = m;
      if (apiRef) apiRef.current = { point: (k) => { const p = live.current.points.find((x) => x.key === k); if (!p || !map.current) return null; const c = map.current.latLngToContainerPoint([p.lat, p.lng]); const sz = map.current.getSize(); return { x: c.x, y: c.y, w: sz.x, h: sz.y }; } };
      const again = () => { clearTimeout(timer); timer = setTimeout(() => draw.current(), 60); };
      m.on('zoomend moveend', again);
      if (typeof ResizeObserver !== 'undefined') { ro = new ResizeObserver(() => { try { m.invalidateSize(); again(); } catch (e) { /* map gone */ } }); ro.observe(el.current); }
      m.on('movestart', () => live.current.onHover(null, true));
      t = setTimeout(() => { if (!loaded) setState('failed'); }, 5000);
    } catch (e) { setState('failed'); }
    return () => { clearTimeout(t); clearTimeout(timer); if (ro) ro.disconnect(); if (apiRef) apiRef.current = null; try { map.current && map.current.remove(); } catch (e) { /* already gone */ } map.current = null; };
  }, []);
  draw.current = () => {
    const m = map.current, g = layer.current; if (!m || !g) return;
    const { points: pts, selected: sel, onPick: pick, onHover: hover, onView: view } = live.current;
    g.clearLayers();
    // Greedy clustering by on-screen distance: biggest pins first, anything within 46px joins it.
    const px = pts.map((p) => ({ p, pt: m.latLngToContainerPoint([p.lat, p.lng]) })).sort((x, y) => y.p.count - x.p.count);
    const used = new Set(), groups = [];
    px.forEach((a) => { if (used.has(a.p.key)) return; const mem = [a]; used.add(a.p.key); px.forEach((b) => { if (!used.has(b.p.key) && Math.hypot(a.pt.x - b.pt.x, a.pt.y - b.pt.y) < 46) { mem.push(b); used.add(b.p.key); } }); groups.push(mem); });
    let selShown = false;
    groups.forEach((mem) => {
      const count = mem.reduce((n, x) => n + x.p.count, 0);
      const lat = mem.reduce((n, x) => n + x.p.lat * x.p.count, 0) / count, lng = mem.reduce((n, x) => n + x.p.lng * x.p.count, 0) / count;
      const single = mem.length === 1, on = single && mem[0].p.key === sel; if (on) selShown = true;
      const size = Math.round(30 + Math.sqrt(count) * 5);
      const name = single ? `${mem[0].p.label}, ${count} ${count === 1 ? 'listing' : 'listings'}` : `${count} listings in ${mem.length} cities. Zoom in.`;
      const icon = L.divIcon({ className: 'osm-ico', html: `<span class="cpin${single ? '' : ' cl'}${on ? ' on' : ''}" style="width:${size}px;height:${size}px">${count}</span>`, iconSize: [size, size], iconAnchor: [size / 2, size / 2] });
      const mk = L.marker([lat, lng], { icon, keyboard: true, title: name, alt: name, riseOnHover: true }).addTo(g);
      if (single) {
        mk.on('mouseover focus', () => hover(mem[0].p.key));
        mk.on('mouseout', () => hover(null));
        mk.on('click keypress', (e) => { if (e.type === 'keypress' && !['Enter', ' '].includes(e.originalEvent && e.originalEvent.key)) return; pick(mem[0].p.key); });
      } else {
        mk.bindTooltip(name, { direction: 'top', offset: [0, -size / 2], className: 'osm-tip' });
        mk.on('click keypress', (e) => { if (e.type === 'keypress' && !['Enter', ' '].includes(e.originalEvent && e.originalEvent.key)) return; hover(null, true); m.fitBounds(L.latLngBounds(mem.map((x) => [x.p.lat, x.p.lng])), { padding: [60, 60], maxZoom: 12 }); });
      }
    });
    const b = m.getBounds();
    view(pts.filter((p) => b.contains([p.lat, p.lng])).map((p) => p.key));
    // A pick from the city chips: zoom in until that city stands alone, then keep it in view.
    if (sel && sel !== lastSel.current) { lastSel.current = sel; const p = pts.find((x) => x.key === sel); if (p && !selShown) m.setView([p.lat, p.lng], Math.min(Math.max(m.getZoom() + 3, 8), 11)); else if (p && !b.contains([p.lat, p.lng])) m.panTo([p.lat, p.lng]); }
    if (!sel) lastSel.current = null;
  };
  useEffect(() => {
    const m = map.current; if (!m) return;
    const key = points.map((p) => p.key + p.lat + p.lng).join('|');
    if (key !== fitKey.current) { fitKey.current = key; const all = points.map((p) => [p.lat, p.lng]); if (all.length === 1) m.setView(all[0], 9); else if (all.length) m.fitBounds(all, { padding: [40, 40], maxZoom: 10 }); }
    draw.current();
  }, [points, selected]);
  if (state === 'failed' && fallback) return fallback;
  return <div className="osm" style={{ height }}><div ref={el} className="osm-map" role="region" aria-label={label} /></div>;
}

/* The card preview that opens over a pin: hover it on a desktop, tap it on a phone. */
function PinCard({ group, anchor, sheet, pinned, onClose, onEnter, onLeave, showType }) {
  const W = 548;
  let style;
  if (sheet || !anchor) style = {};
  else { const w = Math.min(W, anchor.w - 16); const left = Math.max(8, Math.min(anchor.w - w - 8, anchor.x - w / 2)); const below = anchor.y < 330; style = { width: w, left, [below ? 'top' : 'bottom']: below ? anchor.y + 26 : anchor.h - anchor.y + 26 }; }
  return (
    <div className={'pincard' + (sheet || !anchor ? ' sheet' : '')} style={style} role="dialog" aria-label={`${group.city} listings`} onMouseEnter={onEnter} onMouseLeave={onLeave}>
      <div className="pincard-h"><b>{group.city}, {group.key.split(', ')[1]}</b><span className="muted">{group.items.length} {group.items.length === 1 ? 'listing' : 'listings'}</span><button type="button" className="iconbtn" aria-label="Close preview" onClick={onClose}><Icon n="x" size={18} /></button></div>
      <div className="pinstrip">{group.items.map((l) => <ListingCard key={l.id} l={l} showType={showType} />)}</div>
    </div>
  );
}

function ResultsMap({ items, showType }) {
  const { mapFull, setMapFull } = useApp();
  const groups = useMemo(() => {
    const m = {};
    items.forEach((l) => { const k = l.geo.city + ', ' + l.geo.st; (m[k] ??= { key: k, city: l.geo.city, lat: l.geo.lat, lng: l.geo.lng, items: [] }).items.push(l); });
    return Object.values(m).sort((a, b) => b.items.length - a.items.length);
  }, [items]);
  const [pin, setPin] = useState(null);     // city the person tapped or clicked: stays open
  const [hov, setHov] = useState(null);     // city under the pointer: open while hovering
  const [, setView] = useState(null);
  const api = useRef(null), leave = useRef(null);
  const pts = useMemo(() => groups.map((g) => ({ key: g.key, lat: g.lat, lng: g.lng, count: g.items.length, label: g.city })), [groups]);
  useEffect(() => { if (pin && !groups.some((g) => g.key === pin)) setPin(null); }, [groups]);
  useEffect(() => () => setMapFull(false), []);
  const openRef = useRef(null); openRef.current = pin || hov;
  useEffect(() => { const k = (e) => { if (e.key !== 'Escape') return; if (openRef.current) { setPin(null); setHov(null); } else setMapFull(false); }; document.addEventListener('keydown', k); return () => document.removeEventListener('keydown', k); }, []);
  if (!groups.length) return null;
  const hover = (k, hard) => { clearTimeout(leave.current); if (k) setHov(k); else if (hard) setHov(null); else leave.current = setTimeout(() => setHov(null), 220); };
  const narrow = typeof window !== 'undefined' && window.innerWidth < 600;
  const W = narrow ? 360 : 640, H = narrow ? 300 : 340, pad = narrow ? 40 : 48;
  const lat0 = Math.min(...groups.map((g) => g.lat)), lat1 = Math.max(...groups.map((g) => g.lat));
  const lng0 = Math.min(...groups.map((g) => g.lng)), lng1 = Math.max(...groups.map((g) => g.lng));
  const kx = Math.cos(((lat0 + lat1) / 2) * Math.PI / 180);
  const spanX = Math.max(1.5, (lng1 - lng0) * kx), spanY = Math.max(1.5, lat1 - lat0);
  const sc = Math.min((W - pad * 2) / spanX, (H - pad * 2) / spanY);
  const cx = (lng0 + lng1) / 2, cy = (lat0 + lat1) / 2;
  const pos = (g) => ({ x: W / 2 + (g.lng - cx) * kx * sc, y: H / 2 - (g.lat - cy) * sc });
  const openKey = pin || hov;
  const open = groups.find((g) => g.key === openKey);
  const anchor = open && api.current ? api.current.point(open.key) : null;
  const choose = (k) => { setPin((c) => (c === k ? null : k)); setHov(null); };
  return (
    <div className="rmap">
      <div className="rmap-frame">
        <button type="button" className="mapfs" aria-pressed={mapFull} onClick={() => setMapFull(!mapFull)}><Icon n="panel" size={16} />{mapFull ? 'Exit full screen' : 'Full screen'}</button>
        <ClusterMap label={`Map of ${items.length} listings across ${groups.length} cities`} height={narrow ? 'min(66vh, 520px)' : 'min(72vh, 680px)'} selected={pin} onPick={choose} onHover={hover} onView={setView} apiRef={api} points={pts}
          fallback={<svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label={`Map of ${items.length} listings across ${groups.length} cities`}>
          <rect width={W} height={H} className="am-bg" />
          {Array.from({ length: 9 }, (_, i) => <line key={'v' + i} x1={(W / 8) * i} y1="0" x2={(W / 8) * i} y2={H} className="rm-grid" />)}
          {Array.from({ length: 5 }, (_, i) => <line key={'h' + i} x1="0" y1={(H / 4) * i} x2={W} y2={(H / 4) * i} className="rm-grid" />)}
          {groups.map((g, gi) => { const p = pos(g), r = (narrow ? 10 : 12) + Math.sqrt(g.items.length) * (narrow ? 3 : 5), on = g.key === pin;
            const crowded = groups.slice(0, gi).some((o) => { const q = pos(o); return Math.hypot(q.x - p.x, q.y - p.y) < 44; });
            const ly = crowded ? p.y - r - 6 : p.y + r + 14; return (
            <g key={g.key} className={'rm-pt' + (on ? ' on' : '')} onClick={() => choose(g.key)} aria-hidden="true">
              <circle cx={p.x} cy={p.y} r={r} />
              <text x={p.x} y={p.y + 4} textAnchor="middle" className="rm-n">{g.items.length}</text>
              <text x={p.x} y={ly} textAnchor="middle" className="rm-l">{g.city}</text>
            </g>); })}
        </svg>} />
        {open && <PinCard group={open} anchor={anchor} sheet={narrow} pinned={!!pin} showType={showType} onClose={() => { setPin(null); setHov(null); }} onEnter={() => clearTimeout(leave.current)} onLeave={() => hover(null)} />}
      </div>
      <div className="mapcities"><Seg label="City" size="wrap" options={groups.map((g) => [g.key, `${g.city} · ${g.items.length}`])} value={pin || ''} onChange={(k) => choose(k)} /></div>
      <p className="muted iconline" style={{ fontSize: 12 }}><Icon n="pin" size={13} />{items.length} listings · {narrow ? 'Tap' : 'Hover or click'} a pin to preview its listings. Pins sit at the city centre; exact addresses are never shown.</p>
    </div>
  );
}

/* Price context: what similar machines on VendGrid are listed for, and a nudge when a price is far below them */
const priced = (ls) => ls.filter((x) => x.status === 'published' && x.price != null);
const median = (a) => { const b = [...a].sort((x, y) => x - y); const m = Math.floor(b.length / 2); return b.length % 2 ? b[m] : (b[m - 1] + b[m]) / 2; };
function PriceCheck({ l, listings }) {
  if (l.type !== 'machines' || l.price == null) return null;
  const others = priced(listings).filter((x) => x.type === 'machines' && x.id !== l.id && x.f.condition !== 'For parts');
  const typed = others.filter((x) => x.f.machineType === l.f.machineType);
  const same = typed.length >= 2 ? typed : others, kind = typed.length >= 2 ? l.f.machineType.toLowerCase() + ' ' : '';
  if (same.length < 2) return null;
  const ps = same.map((x) => x.price), lo = Math.min(...ps), hi = Math.max(...ps), med = median(ps);
  const low = l.f.condition !== 'For parts' && l.price < med * 0.4;
  return (
    <div className={'pricecheck' + (low ? ' warn' : '')}>
      {low && <p className="iconline" style={{ margin: 0 }}><Icon n="alert" size={16} /><b>Priced well below similar listings.</b> See it working before you pay.</p>}
      <div className="pc-bar" aria-label={`Other ${kind}machines on VendGrid are listed from ${FMT(lo)} to ${FMT(hi)}`}>
        <span className="pc-range" /><span className="pc-me" style={{ left: `${Math.max(0, Math.min(100, ((l.price - lo) / Math.max(1, hi - lo)) * 100))}%` }} title="This listing" />
      </div>
      <div className="pc-legend"><span>{FMT(lo)}</span><span className="muted">This listing vs {same.length} other {kind}machines</span><span>{FMT(hi)}</span></div>
    </div>
  );
}

/* What a buyer should confirm before paying — shows which items this listing already answers */
function BuyerChecklist({ l, onAsk }) {
  if (l.type === 'machines') {
    const items = [['Condition', l.f.condition], ['Age', l.f.year ? `Built ${l.f.year}` : ''], ['Payment system', [l.f.payment, l.f.cardReader && `card reader ${l.f.cardReader.toLowerCase()}`].filter(Boolean).join(' · ')], ['Size & weight', [l.f.dims, l.f.weight && `${l.f.weight} lb`].filter(Boolean).join(' · ')], ['Repair & service history', l.f.service], ['Warranty', l.f.warranty], ['Returns', l.f.returns], ['Delivery cost', l.f.shipCost]];
    const missing = items.filter(([, v]) => !v).length;
    return (
      <section className="panel checkpanel">
        <div className="row2" style={{ justifyContent: 'space-between' }}><h3>Before you buy</h3><a className="btn ghost sm" href="#/guide?t=machines"><Icon n="book" size={16} />Buyer’s guide</a></div>
        <ul className="checklist wide">{items.map(([k, v]) => <li key={k} className={v ? 'ok' : ''}><Icon n={v ? 'check' : 'circle'} size={16} /><span><b>{k}</b>{v ? <span className="muted">{String(v)}</span> : <span className="muted">Not stated</span>}</span></li>)}</ul>
        {missing > 0 && onAsk && <button className="btn secondary sm" onClick={onAsk}>Ask the seller about {missing === 1 ? 'this' : `these ${missing}`}</button>}
      </section>
    );
  }
  if (l.type === 'routes') {
    const items = [['Financials', l.f.revenueBand && l.f.revenueBand !== 'Not disclosed' ? `${l.f.revenueBand} revenue${l.f.cashFlow && l.f.cashFlow !== 'Not disclosed' ? ` · ${l.f.cashFlow} cash flow` : ''} (seller-reported)` : ''], ['Location agreements', l.f.contracts], ['Equipment', (l.f.equipment || []).join(', ')], ['Machine ownership', l.f.ownership], ['Reason for selling', l.f.reason], ['Training & handover', l.f.transition]];
    return (
      <section className="panel checkpanel">
        <div className="row2" style={{ justifyContent: 'space-between' }}><h3>Before you buy this route</h3><a className="btn ghost sm" href="#/guide?t=routes"><Icon n="book" size={16} />Route guide</a></div>
        <ul className="checklist wide">{items.map(([k, v]) => <li key={k} className={v ? 'ok' : ''}><Icon n={v ? 'check' : 'circle'} size={16} /><span><b>{k}</b><span className="muted">{v || 'Not stated'}</span></span></li>)}</ul>
        <p className="muted iconline" style={{ fontSize: 12 }}><Icon n="alert" size={14} />Don’t contact the route’s locations or customers until the seller says you can. Verify every figure, contract and expense yourself.</p>
      </section>
    );
  }
  return null;
}

/* Buyer's guide: each common question answered with live numbers and a link to the matching search */
function Guide({ route, go }) {
  const { listings, orgs } = useApp();
  const topic = route.topic === 'routes' ? 'routes' : 'machines';
  const M = priced(listings).filter((x) => x.type === 'machines');
  const by = (c) => M.filter((x) => x.f.condition === c).map((x) => x.price);
  const rng = (a) => (a.length ? (a.length === 1 ? FMT(a[0]) : `${FMT(Math.min(...a))}–${FMT(Math.max(...a))}`) : '—');
  const count = (pred) => listings.filter((x) => x.status === 'published' && pred(x)).length;
  const q = (f, extra = {}) => encodeQuery({ ...DEFAULT_QUERY, f, cat: 'machines', ...extra });
  const QA = ({ title, children }) => <section className="qa"><h2>{title}</h2>{children}</section>;
  const Go = ({ href, n, children }) => <a className="btn secondary sm" href={href}>{children}{n != null && <span className="fcount" style={{ marginLeft: 6 }}>{n}</span>}</a>;
  return (
    <div className="page guide">
      <div><h1>Buyer’s guide</h1><Seg label="Guide" options={[['machines', 'Machines'], ['routes', 'Routes']]} value={topic} onChange={(v) => go('#/guide?t=' + v, true)} /></div>
      {topic === 'machines' ? (<>
        <QA title="What does a vending machine cost?">
          <div className="pricegrid">{['New', 'Refurbished', 'Used', 'For parts'].map((c) => <a key={c} className="pg" href={q({ condition: c })}><span className="muted">{c}</span><b>{rng(by(c))}</b><small>{by(c).length} listed</small></a>)}</div>
          <p className="muted" style={{ margin: 0, fontSize: 12 }}>Asking prices on VendGrid right now. Prices change as listings come and go.</p>
        </QA>
        <QA title="New, refurbished or used?">
          <p>New machines cost the most but come with a manufacturer warranty and the latest payment options. Refurbished units are cleaned, repaired and tested by a pro, often with a short warranty. Used machines cost least and may need repairs.</p>
          <div className="row2" style={{ flexWrap: 'wrap' }}><Go href={q({ condition: 'New' })} n={count((x) => x.type === 'machines' && x.f.condition === 'New')}>New</Go><Go href={q({ condition: 'Refurbished' })} n={count((x) => x.type === 'machines' && x.f.condition === 'Refurbished')}>Refurbished</Go><Go href={q({ condition: 'Used' })} n={count((x) => x.type === 'machines' && x.f.condition === 'Used')}>Used</Go></div>
        </QA>
        <QA title="Where do I find a seller I can trust?">
          <p>Look for the green check: that business passed VendGrid’s checks. You can also filter by who’s selling.</p>
          <div className="row2" style={{ flexWrap: 'wrap' }}><Go href={q({}, { verified: '1' })} n={count((x) => x.type === 'machines' && orgs[x.org].verified)}><Icon n="check" size={14} />Verified sellers</Go><Go href={q({ sellerType: 'Manufacturer / authorized dealer' })}>Dealers</Go><Go href={q({ sellerType: 'Refurbisher' })}>Refurbishers</Go><Go href={q({ sellerType: 'Operator' })}>Other operators</Go></div>
        </QA>
        <QA title="What should I check on a used machine?">
          <ul className="checklist wide">{['Condition and age', 'Payment system (cash, card reader, cashless ready)', 'Repair and service history', 'Warranty or service contract', 'Returns and delivery cost'].map((x) => <li key={x} className="ok"><Icon n="check" size={16} /><span>{x}</span></li>)}</ul>
          <p className="muted" style={{ margin: 0 }}>Every machine listing shows these as a “Before you buy” checklist, and marks anything the seller hasn’t stated.</p>
        </QA>
        <QA title="Do machines come with a warranty?">
          <p>New machines usually do. Refurbished machines may include limited cover. Used machines are often sold as-is.</p>
          <Go href={q({ hasWarranty: 'Includes a warranty' })} n={count((x) => x.type === 'machines' && x.f.warranty)}>Machines with a warranty</Go>
        </QA>
        <QA title="Can I negotiate?">
          <p>Often, especially with operators and refurbishers. Choose “Make an offer” when you contact a seller.</p>
        </QA>
        <QA title="Is buying online safe?">
          <ul className="checklist wide">{['Message through VendGrid so there’s a record', 'See the machine working before you pay', 'Never wire money or pay with gift cards', 'Be wary of prices far below similar listings', 'Report anything that looks wrong'].map((x) => <li key={x} className="ok"><Icon n="check" size={16} /><span>{x}</span></li>)}</ul>
        </QA>
        <QA title="Can I buy locally, or from another operator?">
          <div className="row2" style={{ flexWrap: 'wrap' }}><Go href={q({}, { view: 'map' })}><Icon n="map" size={14} />Machines on the map</Go><Go href={q({ sellerType: 'Operator' })} n={count((x) => x.type === 'machines' && x.f.sellerType === 'Operator')}>From operators</Go><Go href={encodeQuery({ ...DEFAULT_QUERY, f: {}, cat: 'services', q: 'delivery' })}>Delivery services</Go></div>
        </QA>
      </>) : (<>
        <QA title="Why buy an existing route?">
          <p>You start with placed machines, location agreements and revenue from day one, instead of finding locations one by one.</p>
          <Go href={encodeQuery({ ...DEFAULT_QUERY, f: {}, cat: 'routes' })} n={count((x) => x.type === 'routes')}>Routes for sale</Go>
        </QA>
        <QA title="What should I verify?">
          <ul className="checklist wide">{['Revenue and cash flow, against bank statements', 'Location agreements: written, and transferable to you', 'Equipment age, condition and ownership (owned or leased)', 'Expenses: product, fuel, card fees, commissions', 'Why the owner is selling, and what training they’ll give'].map((x) => <li key={x} className="ok"><Icon n="check" size={16} /><span>{x}</span></li>)}</ul>
          <p className="muted" style={{ margin: 0 }}>Revenue on VendGrid is reported by the seller and isn’t verified. Ask for documents under a confidentiality agreement.</p>
        </QA>
        <QA title="Can I contact the locations?">
          <p>Not until the seller agrees. Reaching out to a route’s customers early can cost the seller the account.</p>
        </QA>
        <QA title="Single location or many?">
          <div className="row2" style={{ flexWrap: 'wrap' }}>{[['1–10', 'Up to 10 machines'], ['11–25', '11–25 machines'], ['26+', '26+ machines']].map(([v, t]) => <Go key={v} href={encodeQuery({ ...DEFAULT_QUERY, f: { machineBand: v }, cat: 'routes' })}>{t}</Go>)}</div>
        </QA>
      </>)}
    </div>
  );
}

/* BizQuest-style money panel for routes. Every figure is seller-reported; the multiple is our arithmetic on them. */
function RouteFinancials({ l }) {
  if (l.type !== 'routes') return null;
  const f = l.f, gross = +f.grossExact || 0, cash = +f.cashExact || 0;
  const cells = [['Asking price', l.price != null ? FMT(l.price) : 'On request'], ['Gross revenue', gross ? FMT(gross) : f.revenueBand || 'Not disclosed'], ['Cash flow', cash ? FMT(cash) : f.cashFlow || 'Not disclosed'], ['Equipment (FF&E)', f.ffe ? FMT(+f.ffe) : '—'], ['Inventory', f.invValue ? FMT(+f.invValue) : f.inventory || '—'], ['Established', f.established || '—'], ['Employees', f.employees != null && f.employees !== '' ? String(f.employees) : '—'], ['Seller financing', f.financing || '—']];
  const mult = l.price != null && cash ? (l.price / cash) : null;
  return (
    <section className="panel finpanel" aria-labelledby="fin-h">
      <div className="row2" style={{ justifyContent: 'space-between', flexWrap: 'wrap' }}><h3 id="fin-h">Financial snapshot</h3><span className="badge">Seller-reported</span></div>
      <dl className="fingrid">{cells.map(([k, v]) => <div key={k}><dt>{k}</dt><dd>{v}</dd></div>)}</dl>
      {mult && <p className="muted" style={{ margin: 0, fontSize: 13 }}>Asking price is <b style={{ color: 'var(--foreground)' }}>{mult.toFixed(1)}×</b> the reported cash flow{gross ? `, and ${(cash / gross * 100).toFixed(0)}% of revenue is cash flow` : ''}. Our math on the seller’s numbers, not a valuation.</p>}
      {f.growth && <p style={{ margin: 0 }}><b>Growth: </b>{f.growth}</p>}
    </section>
  );
}

/* VendPlacer-style "browse by city": real counts for the current category, one tap to filter */
function CityRow({ items, query, set }) {
  const counts = {};
  items.forEach((l) => { const k = `${l.geo.city}, ${l.geo.st}`; counts[k] = (counts[k] || 0) + 1; });
  const rows = Object.entries(counts).sort((a, b) => b[1] - a[1]).slice(0, 10);
  if (rows.length < 2 || query.loc) return null;
  return (
    <div className="cityrow" aria-label="Browse by city">
      <div className="cities">{rows.map(([c, n]) => <button key={c} className="chip" onClick={() => set({ ...query, loc: c, r: '', n: 1 })}>{c.split(',')[0]} <span className="muted">{n}</span></button>)}</div>
    </div>
  );
}

/* Photo gallery: swipe on touch, arrows + thumbnails on wide screens, dots and a count everywhere */
function Gallery({ l }) {
  const ref = useRef(null);
  const [i, setI] = useState(0);
  const n = l.photos.length;
  if (!n) return <div className="gallery" aria-label="Photos"><Thumb l={l} large /></div>;
  const goTo = (k) => { const el = ref.current; if (!el) return; const j = Math.max(0, Math.min(n - 1, k)); el.scrollTo({ left: j * el.clientWidth, behavior: 'smooth' }); setI(j); };
  const onScroll = (e) => { const el = e.currentTarget; const j = Math.round(el.scrollLeft / Math.max(1, el.clientWidth)); if (j !== i) setI(j); };
  const onKey = (e) => { if (e.key === 'ArrowRight') { e.preventDefault(); goTo(i + 1); } else if (e.key === 'ArrowLeft') { e.preventDefault(); goTo(i - 1); } };
  return (
    <div className="gwrap">
      <div className="gallery" ref={ref} tabIndex={0} role="group" aria-roledescription="carousel" aria-label={`Photos, ${i + 1} of ${n}`} onScroll={onScroll} onKeyDown={onKey}>
        {l.photos.map((p, k) => <div className="thumb" key={k}><img src={p} alt={`${l.title}, photo ${k + 1} of ${n}`} loading={k ? 'lazy' : 'eager'} /></div>)}
      </div>
      {n > 1 && (
        <>
          <span className="gcount" aria-hidden="true">{i + 1} / {n}</span>
          <button className="gnav prev" aria-label="Previous photo" disabled={i === 0} onClick={() => goTo(i - 1)}><Icon n="chev" size={20} /></button>
          <button className="gnav next" aria-label="Next photo" disabled={i === n - 1} onClick={() => goTo(i + 1)}><Icon n="chev" size={20} /></button>
          <div className="gdots" role="tablist" aria-label="Choose photo">{l.photos.map((_, k) => <button key={k} role="tab" aria-selected={k === i} aria-label={`Photo ${k + 1}`} className={k === i ? 'on' : ''} onClick={() => goTo(k)}><i /></button>)}</div>
        </>
      )}
    </div>
  );
}

/* Approximate-area map drawn from real city coordinates. No tiles, no exact address: only the city centre and nearby cities. */
function AreaMap({ l }) {
  const g = l.geo;
  const cov = l.type === 'services' && l.f.coverage ? Number(l.f.coverage) : 0;
  const mePts = useMemo(() => [{ key: 'me', lat: g.lat, lng: g.lng, label: `${g.city}, ${g.st}`, always: true }], [g.lat, g.lng]);
  const meCirc = useMemo(() => [{ lat: g.lat, lng: g.lng, radius: cov ? cov * 1609.34 : 12000 }], [g.lat, g.lng, cov]);
  const near = CITIES.filter((c) => !(c.city === g.city && c.st === g.st)).map((c) => ({ c, d: dist(g, c) })).sort((a, b) => a.d - b.d).slice(0, 4);
  const span = Math.max(40, cov * 1.15, ...near.map((x) => x.d)) * 1.1;
  const W = 320, H = 180, k = (Math.min(W, H) / 2 - 14) / span, mi = Math.cos(g.lat * Math.PI / 180) * 69.17;
  const pos = (c) => ({ x: W / 2 + (c.lng - g.lng) * mi * k, y: H / 2 - (c.lat - g.lat) * 69 * k });
  const label = cov ? `Service area: about ${cov} miles around ${g.city}, ${g.st}` : `Approximate area: ${g.city}, ${g.st}`;
  return (
    g.lat == null || g.lng == null ? null : <figure className="areamap">
      <OsmMap label={label} height={240} zoom={cov ? undefined : 9}
        points={mePts} circles={meCirc}
        fallback={<svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label={`${label}. Nearest cities: ${near.map((x) => `${x.c.city} ${Math.round(x.d)} miles`).join(', ')}.`}>
        <rect width={W} height={H} className="am-bg" />
        {[0.5, 1].map((f) => <circle key={f} cx={W / 2} cy={H / 2} r={Math.min(W, H) / 2 * 0.86 * f} className="am-ring" />)}
        {cov > 0 && <circle cx={W / 2} cy={H / 2} r={cov * k} className="am-cov" />}
        {near.map(({ c, d }) => { const q = pos(c); return q.x > 8 && q.x < W - 8 && q.y > 8 && q.y < H - 8 ? <g key={c.city}><circle cx={q.x} cy={q.y} r="3" className="am-dot" /><text x={q.x + 6} y={q.y + 3.500} className="am-txt">{c.city} · {Math.round(d)} mi</text></g> : null; })}
        <circle cx={W / 2} cy={H / 2} r="7" className="am-me" /><circle cx={W / 2} cy={H / 2} r="2.500" className="am-mec" />
      </svg>} />
      <figcaption><b>{label}</b><span className="muted">{l.type === 'locations' ? 'The street address is shared by the host after they respond.' : 'Shown at the city centre, not an exact address.'}</span></figcaption>
    </figure>
  );
}

/* One ListingCard for all four categories; per-type metadata comes from TYPES[type].meta */
function ListingCard({ l, showType }) {
  const { orgs, favs, toggleFav } = useApp();
  const t = TYPES[l.type], org = orgs[l.org], saved = favs.has(l.id);
  const fact = t.meta(l).filter(Boolean)[0]; // one key fact; everything else is on the detail page
  return (
    <article className="card">
      <div className="thumb">
        {l.photos[0] ? <img src={l.photos[0]} alt="" loading="lazy" /> : <div className="fallback" aria-hidden="true"><span className="g"><Icon n={CAT_ICON[l.type]} size={22} stroke={1.75} /></span>No photo yet</div>}
        {showType && <span className="badge cat">{t.singular}</span>}
        {org.verified && <span className="vbadge" role="img" aria-label="Verified business" title="Verified business"><Icon n="check" size={14} /></span>}
        {l.sponsored && <span className="badge sp onphoto">Sponsored</span>}
        <div className="peek" aria-hidden="true">{l.desc}</div>
        <button className="save" aria-pressed={saved} aria-label={saved ? `Remove ${l.title} from saved` : `Save ${l.title}`} onClick={() => toggleFav(l.id)}><span><Icon n="heart" size={16} /></span></button>
      </div>
      <div className="cbody">
        <div className={'cprice' + (/^(\$|From|Call-out|Install)/.test(priceText(l)) ? '' : ' txt')}>{priceText(l)}</div>
        <a className="ctitle" href={hrefFor(l)}>{l.title}</a>
        <div className="cloc"><Icon n="pin" size={13} /><span>{l.geo.city}, {l.geo.st}{fact ? ` · ${fact}` : ''}</span></div>
      </div>
    </article>
  );
}

function Field({ id, label, hint, error, children, required }) {
  return (
    <div className="field">
      <label htmlFor={id}>{label}{required ? <span aria-hidden="true"> *</span> : null}</label>
      {children}
      {error ? <div className="err" id={id + '-e'} role="alert">{error}</div> : hint ? <div className="hint">{hint}</div> : null}
    </div>
  );
}

/* Segmented control: shows every choice at once instead of hiding them in a menu */
function Seg({ id, label, options, value, onChange, invalid, size }) {
  const ref = useRef(null);
  const idx = Math.max(0, options.findIndex(([v]) => v === value));
  const onKey = (e) => {
    const d = e.key === 'ArrowRight' || e.key === 'ArrowDown' ? 1 : e.key === 'ArrowLeft' || e.key === 'ArrowUp' ? -1 : 0;
    if (!d) return; e.preventDefault();
    const n = (idx + d + options.length) % options.length; onChange(options[n][0]);
    requestAnimationFrame(() => ref.current?.querySelectorAll('[role=radio]')[n]?.focus());
  };
  return (
    <div className={'seg' + (size ? ' ' + size : '') + (invalid ? ' bad' : '')} role="radiogroup" aria-label={label} id={id} ref={ref} onKeyDown={onKey} tabIndex={-1}>
      {options.map(([v, l, ic], k) => <button type="button" key={v || 'any'} role="radio" aria-checked={v === value} tabIndex={k === idx ? 0 : -1} onClick={() => onChange(v)}>{ic && <Icon n={ic} size={16} />}<span>{l}</span></button>)}
    </div>
  );
}
/* On/off switch */
function Switch({ checked, onChange, label, id }) {
  return <button type="button" role="switch" id={id} aria-checked={!!checked} aria-label={label} className="switch" onClick={() => onChange(!checked)}><i /></button>;
}
const showAsChips = (def) => def.kind === 'select' && !def.allowOther && (def.options || []).length <= 6 && def.options.every((o) => o.length <= 28);

function FieldInput({ def, value, onChange, error, idp = 'f' }) {
  const id = `${idp}-${def.key}`;
  const common = { id, 'aria-invalid': !!error, 'aria-describedby': error ? id + '-e' : undefined };
  const opts = def.options || [];
  const known = opts.includes(value);
  let ctl;
  if (showAsChips(def)) {
    ctl = <Seg id={id} label={def.label} size="wrap" invalid={!!error} options={opts.map((o) => [o, o])} value={value || ''} onChange={onChange} />;
  } else if (def.kind === 'select') {
    const other = def.allowOther && value && !known && value !== '';
    ctl = (
      <>
        <select {...common} className={'select' + (error ? ' bad' : '')} value={other ? 'Other' : value || ''} onChange={(e) => onChange(e.target.value === 'Other' ? 'Other' : e.target.value)}>
          <option value="">Select…</option>
          {opts.map((o) => <option key={o} value={o}>{o}</option>)}
        </select>
        {(other || value === 'Other') && <input className="input" aria-label={`${def.label}, other`} placeholder="Type the name" value={value === 'Other' ? '' : value} onChange={(e) => onChange(e.target.value || 'Other')} />}
      </>
    );
  } else if (def.kind === 'multi') {
    const arr = value || [];
    ctl = <div className="checks" role="group" aria-label={def.label}>{opts.map((o) => <button type="button" key={o} className={'chip' + (arr.includes(o) ? ' on' : '')} aria-pressed={arr.includes(o)} onClick={() => onChange(arr.includes(o) ? arr.filter((x) => x !== o) : [...arr, o])}>{o}</button>)}</div>;
  } else if (def.kind === 'textarea') {
    ctl = <textarea {...common} className={'textarea' + (error ? ' bad' : '')} value={value || ''} onChange={(e) => onChange(e.target.value)} />;
  } else {
    ctl = <input {...common} className={'input' + (error ? ' bad' : '')} type={def.kind === 'number' ? 'number' : 'text'} inputMode={def.kind === 'number' ? 'numeric' : undefined} min={def.min} value={value ?? ''} onChange={(e) => onChange(e.target.value)} style={def.kind === 'number' ? { width: 160 } : { width: '100%' }} />;
  }
  return <Field id={id} label={def.label} required={def.required} error={error} hint={def.hint || (def.hostReported ? 'Reported by the seller, not verified by VendGrid' : def.private ? <><Icon n="lock" size={13} />Never shown publicly</> : '')}>{ctl}</Field>;
}

/* ───────────── location picker ───────────── */
function LocationInput({ value, onPick, placeholder = 'City, ZIP or region', autoFocus, cityOnly, id = 'loc-in' }) {
  const [text, setText] = useState(value || '');
  const [err, setErr] = useState('');
  const [open, setOpen] = useState(false);
  const sug = useMemo(() => suggestLocations(text).filter((s) => !cityOnly || resolveLocation(s)?.kind === 'city'), [text, cityOnly]);
  useEffect(() => setText(value || ''), [value]);
  const commit = (t) => {
    const hit = resolveLocation(t);
    if (!hit || (cityOnly && hit.kind !== 'city')) { setErr('Enter a city or ZIP we recognize, like Evansville or 47708.'); return; }
    setErr(''); setOpen(false); setText(hit.label); onPick(hit.label);
  };
  return (
    <div className="field" style={{ position: 'relative' }}>
      <input id={id} className={'input full' + (err ? ' bad' : '')} autoFocus={autoFocus} placeholder={placeholder} value={text} aria-invalid={!!err} aria-describedby={err ? id + '-e' : undefined}
        onChange={(e) => { setText(e.target.value); setErr(''); setOpen(true); }}
        onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); commit(sug[0] && !resolveLocation(text) ? sug[0] : text); } }} autoComplete="off" />
      {err && <div className="err" id={id + '-e'} role="alert">{err}</div>}
      {open && sug.length > 0 && !err && (
        <div className="pop" style={{ top: 44, left: 0, right: 0, width: 'auto', padding: 4, gap: 0 }} role="listbox" aria-label="Location suggestions">
          <div className="opts">{sug.map((s) => <button type="button" role="option" aria-selected="false" key={s} onClick={() => commit(s)}>{s}</button>)}</div>
        </div>
      )}
    </div>
  );
}
function LocationPicker({ value, onPick, compact }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  useEffect(() => {
    if (!open) return;
    const h = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    const k = (e) => e.key === 'Escape' && setOpen(false);
    document.addEventListener('mousedown', h); document.addEventListener('keydown', k);
    return () => { document.removeEventListener('mousedown', h); document.removeEventListener('keydown', k); };
  }, [open]);
  return (
    <div className="locwrap" ref={ref}>
      <button className="btn secondary" style={compact ? undefined : { height: 44 }} aria-expanded={open} aria-haspopup="dialog" onClick={() => setOpen(!open)} aria-label={`Location: ${value || 'Nationwide'}. Change`}>
        <Icon n="pin" size={16} /><span className="llabel">{value || 'Nationwide'}</span>
      </button>
      {open && (
        <div className="pop" role="dialog" aria-label="Choose location">
          <LocationInput autoFocus value={value} onPick={(v) => { onPick(v); setOpen(false); }} />
          <div className="row2" style={{ justifyContent: 'space-between' }}>
            <span className="muted kbd-hint" style={{ fontSize: 12 }}><kbd>Enter</kbd> to apply</span>
            <button className="btn secondary sm" onClick={() => { onPick(''); setOpen(false); }}>Nationwide</button>
          </div>
        </div>
      )}
    </div>
  );
}

/* ───────────── search box with suggestions ───────────── */
function SearchBox({ route, go, query }) {
  const { listings, orgs, searchFromText } = useApp();
  const [text, setText] = useState(query ? query.q : '');
  // a phone-width search box can't fit the long hint, so shorten it instead of cutting it mid-word
  const [narrow, setNarrow] = useState(() => typeof matchMedia !== 'undefined' && matchMedia('(max-width:640px)').matches);
  useEffect(() => { if (typeof matchMedia === 'undefined') return; const m = matchMedia('(max-width:640px)'); const h = () => setNarrow(m.matches); m.addEventListener ? m.addEventListener('change', h) : m.addListener(h); return () => { m.removeEventListener ? m.removeEventListener('change', h) : m.removeListener(h); }; }, []);
  const [open, setOpen] = useState(false);
  const [idx, setIdx] = useState(-1);
  const sugs = useMemo(() => (open ? suggest(listings, orgs, text) : []), [open, text, listings, orgs]);
  const wrap = useRef(null);
  useEffect(() => { if (query) setText(query.q); }, [query && query.q]);
  // debounce live filtering while on the results page
  const qref = useRef(query); qref.current = query;
  const timer = useRef(null);
  useEffect(() => {
    const cur = qref.current;
    if (!cur || text === cur.q) return;
    timer.current = setTimeout(() => { const c = qref.current; if (c && text !== c.q) go(encodeQuery({ ...c, q: text, n: 1 }), true); }, 280);
    return () => clearTimeout(timer.current);
  }, [text]);
  useEffect(() => {
    const h = (e) => wrap.current && !wrap.current.contains(e.target) && setOpen(false);
    document.addEventListener('mousedown', h); return () => document.removeEventListener('mousedown', h);
  }, []);
  const choose = (s) => {
    clearTimeout(timer.current);
    setOpen(false); setIdx(-1);
    if (s.listing) { go(hrefFor(s.listing)); return; }
    const base = query || { ...DEFAULT_QUERY, f: {} };
    const next = { ...base, ...s.apply, f: { ...(s.apply.f || {}) }, n: 1, pmin: '', pmax: '' };
    if (s.apply.loc == null) next.loc = base.loc;
    setText(next.q);
    go(encodeQuery(next));
  };
  const submit = () => { clearTimeout(timer.current); setOpen(false); searchFromText(text); };
  return (
    <div className="sbox" ref={wrap} role="search">
      <span className="sicon"><Icon n="search" size={18} /></span>
      <input className="input" type="search" placeholder={narrow ? "Search listings" : "Search machines, parts, locations, routes, services"} aria-label="Search VendGrid" role="combobox" aria-expanded={open && sugs.length > 0} aria-controls="sug-list" aria-autocomplete="list" aria-activedescendant={idx >= 0 ? 'sug-' + idx : undefined}
        value={text} onChange={(e) => { setText(e.target.value); setOpen(true); setIdx(-1); }} onFocus={() => setOpen(true)}
        onKeyDown={(e) => {
          if (e.key === 'ArrowDown') { e.preventDefault(); setIdx((i) => Math.min(sugs.length - 1, i + 1)); }
          else if (e.key === 'ArrowUp') { e.preventDefault(); setIdx((i) => Math.max(-1, i - 1)); }
          else if (e.key === 'Escape') { setOpen(false); setIdx(-1); }
          else if (e.key === 'Enter') { e.preventDefault(); if (idx >= 0 && sugs[idx]) choose(sugs[idx]); else submit(); }
        }} />
      {open && sugs.length > 0 && (
        <div className="sugg" id="sug-list" role="listbox" aria-label="Suggestions">
          {sugs.map((s, i) => (
            <div key={s.kind + s.label + i} id={'sug-' + i} role="option" aria-selected={i === idx} onMouseDown={(e) => { e.preventDefault(); choose(s); }}>
              <span>{s.label}</span><span className="kind">{s.kind}</span>
            </div>
          ))}
        </div>
      )}
      <div className="sr" role="status" aria-live="polite">{open && text.trim().length > 1 ? `${sugs.length} suggestions` : ''}</div>
    </div>
  );
}

/* ───────────── shell ───────────── */
const NAV = [
  ['', 'Explore', 'search'], ['machines', 'Machines', 'machine'], ['parts', 'Parts', 'cog'], ['locations', 'Locations', 'building'], ['routes', 'Routes', 'route'], ['services', 'Services', 'wrench'], ['wanted', 'Wanted', 'megaphone'],
];
/* A canceled plan or placement keeps working until the end of the month that was paid for; canceling only stops the next renewal. */
const PERIOD = 30 * 864e5;
const promoLive = (p) => p.status === 'active' || (p.status === 'canceled' && p.until > Date.now());
const TOP_LEVEL = ['browse', 'saved', 'messages', 'mine', 'account'];
const PUSHED_TITLES = { info: 'VendGrid', sellers: 'Sellers', settings: 'Settings', activity: 'Activity', listing: 'Listing', inquire: 'Contact seller', post: 'New listing', business: 'Seller', billing: 'Billing', bizsettings: 'Business settings', admin: 'Admin', legal: 'Help', guide: 'Buyer’s guide', login: 'Sign in', notfound: 'Not found' };
function Header({ route, go }) {
  const { user, prefLoc, setPrefLoc, theme, setTheme, signOut, unread, isAdmin, noteCount } = useApp();
  const [acct, setAcct] = useState(false);
  const query = route.name === 'browse' ? route.query : null;
  const loc = query ? query.loc : prefLoc;
  const aref = useRef(null);
  const pushed = !TOP_LEVEL.includes(route.name); // pushed screens get a Back control + title in the nav bar on phones
  const [scrolled, setScrolled] = useState(false); // the title appears once the page heading has scrolled away (iOS large-title behaviour)
  useEffect(() => {
    const f = () => setScrolled(window.scrollY > 56);
    f(); window.addEventListener('scroll', f, { passive: true }); return () => window.removeEventListener('scroll', f);
  }, [route.name, route.id]);
  useEffect(() => {
    if (!acct) return;
    const h = (e) => aref.current && !aref.current.contains(e.target) && setAcct(false);
    document.addEventListener('mousedown', h); return () => document.removeEventListener('mousedown', h);
  }, [acct]);
  return (
    <header className={'hdr' + (pushed ? ' pushed' : '')}>
      <button className="iconbtn backbtn" aria-label="Back" onClick={() => go('back')}><Icon n="back" /></button>
      <span className={'hdr-title' + (scrolled ? ' on' : '')} aria-hidden="true">{PUSHED_TITLES[route.name] || ''}</span>
      <a className="brand" aria-label="VendGrid home" href={encodeQuery({ ...DEFAULT_QUERY, f: {}, loc: prefLoc })}><BrandMark /><span className="bname">VendGrid</span></a>
      <SearchBox route={route} go={go} query={query} />
      <a className="iconbtn menubtn" href="#/post" aria-label="Post listing"><Icon n="plus" /></a>
      <div className="hdr-end">
      <div className="hdr-right" ref={aref} style={{ position: 'relative' }}>
        <button className="iconbtn themebtn" aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'} title={theme === 'dark' ? 'Light mode' : 'Dark mode'} onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}><Icon n={theme === 'dark' ? 'sun' : 'moon'} /></button>
        <a className="btn" href="#/post"><Icon n="plus" size={16} /><span className="plabel">Post listing</span></a>
        <button className="iconbtn" aria-label="Account menu" aria-expanded={acct} onClick={() => setAcct(!acct)}><Icon n="user" />{unread > 0 && <span className="sr">{unread} unread</span>}</button>
        {acct && (
          <div className="pop" style={{ width: 240 }}>
            {user ? <div><b>{user.name}</b><div className="muted" style={{ fontSize: 12 }}>{user.email}</div></div> : <div className="muted">Browsing as guest</div>}
            <div className="opts">
              {user && <><button role="menuitem" onClick={() => { setAcct(false); go('#/settings'); }}>Settings</button><button role="menuitem" onClick={() => { setAcct(false); go('#/billing'); }}>Billing</button><button role="menuitem" onClick={() => { setAcct(false); go('#/business-settings'); }}>Business settings</button>{isAdmin && <button role="menuitem" onClick={() => { setAcct(false); go('#/admin'); }}>Admin</button>}</>}
              {user ? <button role="menuitem" onClick={() => { signOut(); setAcct(false); go('#/'); }}>Sign out</button> : <button role="menuitem" onClick={() => { setAcct(false); go('#/login'); }}>Sign in</button>}
              <button role="menuitemcheckbox" aria-checked={theme === 'dark'} className="menuswitch mobonly" onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}><Icon n="moon" size={16} />Dark mode<span className="switch" aria-hidden="true"><i /></span></button>
            </div>
          </div>
        )}
      </div>
      </div>
    </header>
  );
}
function Sidebar({ route }) {
  const { user, unread, prefLoc, noteCount } = useApp();
  const cat = route.name === 'browse' ? route.query.cat : null;
  const link = (c) => encodeQuery({ ...DEFAULT_QUERY, f: {}, cat: c || 'all', loc: route.name === 'browse' ? route.query.loc : prefLoc });
  const cur = (ok) => (ok ? 'page' : undefined);
  return (
    <nav className="sidebar" aria-label="Primary">
      {NAV.map(([c, label, ic]) => <a key={label} href={link(c)} aria-current={cur(cat === (c || 'all'))}><Icon n={ic} size={18} /><span className="slabel">{label}</span></a>)}
      <a href={user ? '#/saved' : '#/login?next=' + enc('#/saved')} aria-current={cur(route.name === 'saved')}><Icon n="heart" size={18} /><span className="slabel">Saved</span></a>
      <a href={user ? '#/messages' : '#/login?next=' + enc('#/messages')} aria-current={cur(route.name === 'messages')}><Icon n="send" size={18} /><span className="slabel">Messages</span>{unread > 0 && <span className="count" aria-label={`${unread} unread`}>{unread}</span>}</a>
      <a href={user ? '#/my-listings' : '#/login?next=' + enc('#/my-listings')} aria-current={cur(route.name === 'mine')}><Icon n="box" size={18} /><span className="slabel">My Listings</span></a>
      {user && <a href="#/activity" aria-current={cur(route.name === 'activity')}><Icon n="bell" size={18} /><span className="slabel">Activity</span>{noteCount > 0 && <span className="count" aria-label={`${noteCount} new`}>{noteCount}</span>}</a>}
      {!user && <a href="#/login"><Icon n="user" size={18} /><span className="slabel">Sign in</span></a>}
    </nav>
  );
}
function TabBar({ route }) {
  const { user, unread, prefLoc, noteCount } = useApp();
  const [hide, setHide] = useState(false);
  // Hides while you scroll down to read, returns the moment you scroll up (or reach the top).
  useEffect(() => {
    let last = window.scrollY, tick = false;
    const f = () => { if (tick) return; tick = true; requestAnimationFrame(() => { const y = window.scrollY, d = y - last; if (y < 64 || d < -6) setHide(false); else if (d > 10) setHide(true); if (Math.abs(d) > 6) last = y; tick = false; }); };
    window.addEventListener('scroll', f, { passive: true }); return () => window.removeEventListener('scroll', f);
  }, []);
  useEffect(() => { setHide(false); }, [route.name]);
  if (!TOP_LEVEL.includes(route.name)) return null;
  const gate = (h) => (user ? h : '#/login?next=' + enc(h));
  const tabs = [
    ['browse', 'Explore', 'search', encodeQuery({ ...DEFAULT_QUERY, f: {}, loc: prefLoc })],
    ['saved', 'Saved', 'heart', gate('#/saved')],
    ['messages', 'Messages', 'send', gate('#/messages')],
    ['mine', 'Listings', 'box', gate('#/my-listings')],
    ['account', 'Account', 'user', '#/account'],
  ];
  return (
    <nav className={'tabbar' + (hide ? ' hide' : '')} aria-label="Primary" onFocus={() => setHide(false)}>
      {tabs.map(([n, label, ic, href]) => (
        <a key={n} href={href} aria-current={route.name === n ? 'page' : undefined}>
          <span className="ticon"><Icon n={ic} size={24} />{n === 'messages' && unread > 0 && <span className="tbadge" role="img" aria-label={`${unread} unread`}>{unread > 9 ? '9+' : unread}</span>}{n === 'account' && noteCount > 0 && <span className="tdot" role="img" aria-label={`${noteCount} new`} />}</span>
          <span className="tlabel">{label}</span>
        </a>
      ))}
    </nav>
  );
}
function ResetDemo() {
  const [armed, setArmed] = useState(false);
  return (
    <>
      <h2 className="sech">This device</h2>
      <div className="list"><button className="item" style={armed ? { color: 'var(--red)' } : undefined} onClick={() => { if (!armed) { setArmed(true); setTimeout(() => setArmed(false), 4000); return; } store.clear(); location.hash = ''; location.reload(); }}><span className="t"><b>{armed ? 'Tap again to reset' : 'Reset demo data'}</b><span className="muted">Clears saved listings, messages and sign-in on this browser</span></span></button></div>
    </>
  );
}
function Settings({ go }) {
  const { user, live, requireAuth, themeSel, setTheme, prefLoc, setPrefLoc, changeEmail, signOutAll, exportData, deleteData, notify } = useApp();
  const [em, setEm] = useState(''), [emOpen, setEmOpen] = useState(false), [emMsg, setEmMsg] = useState(null);
  const [loc, setLoc] = useState(prefLoc || '');
  const [del, setDel] = useState(false), [word, setWord] = useState('');
  const [busy, setBusy] = useState(''), [err, setErr] = useState({});
  useEffect(() => { if (!user) requireAuth({ type: 'go', href: '#/settings' }, go, true); }, [user]);
  useEffect(() => setLoc(prefLoc || ''), [prefLoc]);
  if (!user) return null;
  const run = async (k, fn) => { setBusy(k); setErr((e) => ({ ...e, [k]: '' })); try { await fn(); } catch (x) { setErr((e) => ({ ...e, [k]: String((x && x.message) || x).replace(/^.*?: /, '') })); } setBusy(''); };
  const locOk = !loc.trim() || !!resolveLocation(loc);
  return (
    <div className="page settings">
      <h1>Settings</h1>

      <section className="stack" aria-labelledby="st-in">
        <h2 id="st-in" className="sech">Sign-in</h2>
        <div className="list">
          <div className="item static"><span className="t"><b>Email</b><span className="muted" style={{ overflowWrap: 'anywhere' }}>{user.email}</span></span>{!emOpen && <button className="btn secondary sm" onClick={() => { setEmOpen(true); setEmMsg(null); }}>Change</button>}</div>
          {emOpen && (
            <form className="item static stack" style={{ alignItems: 'stretch' }} noValidate onSubmit={(e) => { e.preventDefault(); const v = em.trim(); if (!/^\S+@\S+\.\S+$/.test(v)) { setErr((x) => ({ ...x, em: 'That email doesn’t look right. Try name@example.com.' })); return; } if (v.toLowerCase() === user.email.toLowerCase()) { setErr((x) => ({ ...x, em: 'That’s already your email.' })); return; } run('em', async () => { await changeEmail(v); setEmMsg(v); setEm(''); setEmOpen(false); }); }}>
              <Field id="st-em" label="New email" error={err.em}><input id="st-em" className={'input full' + (err.em ? ' bad' : '')} type="email" autoComplete="email" value={em} onChange={(e) => { setEm(e.target.value); setErr((x) => ({ ...x, em: '' })); }} /></Field>
              <div className="row2"><button className="btn sm" disabled={busy === 'em'}>{busy === 'em' ? 'Sending…' : live ? 'Send confirmation' : 'Change email'}</button><button type="button" className="btn ghost sm" onClick={() => { setEmOpen(false); setErr((x) => ({ ...x, em: '' })); }}>Cancel</button></div>
            </form>
          )}
        </div>
        {emMsg && <div className="banner" role="status">{live ? <>Check <b>{emMsg}</b> for a confirmation link. Your email changes after you confirm. Until then, keep signing in with {user.email}.</> : <>Email changed to <b>{emMsg}</b>.</>}</div>}
        <p className="muted iconline" style={{ margin: 0, fontSize: 13 }}><Icon n="lock" size={14} />No password. Each sign-in uses a one-time link sent to this email.</p>
        <div className="list">
          <button className="item" disabled={busy === 'out'} onClick={() => run('out', async () => { await signOutAll(); go('#/', true); })}><span className="t"><b>Sign out on all devices</b><span className="muted">Ends every session, including this one</span></span></button>
        </div>
        {err.out && <div className="err" role="alert">{err.out}</div>}
      </section>

      <section className="stack" aria-labelledby="st-ap">
        <h2 id="st-ap" className="sech">Preferences</h2>
        <div className="list">
          <div className="item static pref"><span className="t"><b>Appearance</b></span><Seg label="Appearance" options={[['light', 'Light', 'sun'], ['dark', 'Dark', 'moon'], ['system', 'Auto', 'auto']]} value={themeSel} onChange={setTheme} /></div>
          <form className="item static stack" style={{ alignItems: 'stretch' }} noValidate onSubmit={(e) => { e.preventDefault(); if (!locOk) return; const r = loc.trim() ? resolveLocation(loc) : null; const v = r ? `${r.city}, ${r.st}` : ''; setPrefLoc(v); setLoc(v); notify(v ? `Searches start near ${v}` : 'Searches start everywhere'); }}>
            <Field id="st-loc" label="Default location" hint="Where searches start. Leave empty to search everywhere." error={locOk ? '' : 'We don’t know that place yet. Try a city and state, like Evansville, IN.'}>
              <input id="st-loc" className={'input full' + (locOk ? '' : ' bad')} list="st-cities" autoComplete="address-level2" value={loc} placeholder="City, state or ZIP" onChange={(e) => setLoc(e.target.value)} />
            </Field>
            <datalist id="st-cities">{CITIES.map((c) => <option key={c.city + c.st} value={`${c.city}, ${c.st}`} />)}</datalist>
            <button className="btn secondary sm" style={{ alignSelf: 'flex-start' }} disabled={loc === (prefLoc || '') || !locOk}>Save location</button>
          </form>
        </div>
      </section>

      <section className="stack" aria-labelledby="st-data">
        <h2 id="st-data" className="sech">Your data</h2>
        <div className="list">
          <button className="item" disabled={busy === 'ex'} onClick={() => run('ex', async () => {
            const data = await exportData();
            const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
            const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = `vendgrid-data-${new Date().toISOString().slice(0, 10)}.json`;
            document.body.appendChild(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(a.href), 4000); notify('Download started');
          })}><span className="t"><b>{busy === 'ex' ? 'Preparing…' : 'Download your data'}</b><span className="muted">Listings, business profile, messages, saved items and requests, as a JSON file</span></span></button>
        </div>
        {err.ex && <div className="err" role="alert">{err.ex}</div>}
        {!del ? (
          <div className="list"><button className="item danger" onClick={() => setDel(true)}><span className="t"><b>Delete your VendGrid data</b><span className="muted">Permanently, right away</span></span></button></div>
        ) : (
          <form className="panel dangerzone" noValidate onSubmit={(e) => { e.preventDefault(); if (word.trim().toUpperCase() !== 'DELETE') return; run('del', async () => { await deleteData(); go('#/', true); notify('Your VendGrid data was deleted'); }); }}>
            <h3 style={{ margin: 0 }}>This permanently deletes:</h3>
            <ul>
              <li>Every listing you posted, with its photos and document room</li>
              <li>Your business profile and verification</li>
              <li>Conversations you started, and your messages and photos in others</li>
              <li>Saved listings, saved searches, reports you filed and your Activity</li>
            </ul>
            <p className="muted" style={{ margin: 0 }}>{live ? 'Download a copy first if you want one. Your sign-in email is kept so you can come back; to remove it too, use Contact support.' : 'In this demo, this clears everything stored in this browser.'}</p>
            <Field id="st-del" label="Type DELETE to confirm"><input id="st-del" className="input full" autoComplete="off" autoCapitalize="characters" value={word} onChange={(e) => setWord(e.target.value)} /></Field>
            {err.del && <div className="err" role="alert">{err.del}</div>}
            <div className="row2"><button className="btn dangerbtn" disabled={word.trim().toUpperCase() !== 'DELETE' || busy === 'del'}>{busy === 'del' ? 'Deleting…' : 'Delete my data'}</button><button type="button" className="btn ghost" onClick={() => { setDel(false); setWord(''); }}>Cancel</button></div>
          </form>
        )}
      </section>
    </div>
  );
}

function Account({ go }) {
  const { live } = useApp();
  const { user, signOut, theme, themeSel, setTheme, isAdmin, noteCount } = useApp();
  const Row = ({ to, title, sub }) => <a className="item nav" href={to}><span className="t"><b>{title}</b>{sub && <span className="muted">{sub}</span>}</span></a>;
  return (
    <div className="page">
      <h1>Account</h1>
      <div className="list">
        {user ? <div className="item" style={{ cursor: 'default' }}><span className="t"><b>{user.name}</b><span className="muted">{user.email}</span></span></div> : <Row to="#/login" title="Sign in" sub="Save listings, message sellers and post" />}
      </div>
      <h2 className="sech">Selling</h2>
      <div className="list">
        {user && <Row to="#/activity" title="Activity" sub={noteCount ? `${noteCount} new` : 'Document requests, verification and listing updates'} />}
        <Row to="#/post" title="Post a listing" sub="Free for standard listings" />
        {user && <Row to="#/billing" title="Billing" sub="Plan, sponsored placements, invoices" />}
        {user && <Row to="#/business-settings" title="Business settings" sub="Profile and verification" />}
        {isAdmin && <Row to="#/admin" title="Admin" />}
      </div>
      <h2 className="sech">Preferences</h2>
      <div className="list">
        {user ? <Row to="#/settings" title="Settings" sub="Email, sign-out, appearance, location, your data" /> : <div className="item static pref"><span className="t"><b>Appearance</b></span><Seg label="Appearance" options={[['light', 'Light', 'sun'], ['dark', 'Dark', 'moon'], ['system', 'Auto', 'auto']]} value={themeSel} onChange={setTheme} /></div>}
      </div>
      {!live && !user && <ResetDemo />}
      <h2 className="sech">Help</h2>
      <div className="list">
        <Row to="#/guide" title="Buyer’s guide" sub="Prices, what to check, buying safely" /><Row to="#/legal?doc=terms" title="Terms" /><Row to="#/legal?doc=privacy" title="Privacy" /><Row to="#/legal?doc=refunds" title="Refunds" /><Row to="#/legal?doc=support" title="Contact support" />
      </div>
      {user && <div className="list"><button className="item" style={{ color: 'var(--red)' }} onClick={() => { signOut(); go('#/'); }}><span className="t"><b>Sign out</b></span></button></div>}
    </div>
  );
}

/* ───────────── browse ───────────── */
/* Modal behavior: focus moves in, Tab loops, Escape closes, page behind is inert, focus returns on close. */
function useTrap(ref, onClose) {
  useEffect(() => {
    const prev = document.activeElement;
    const bg = [...document.querySelectorAll('.hdr,.layout')];
    bg.forEach((e) => e.setAttribute('inert', ''));
    const items = () => (ref.current ? [...ref.current.querySelectorAll('a[href],button:not([disabled]),input,select,textarea')].filter((x) => x.getClientRects().length > 0) : []);
    const f = items(); if (f[0]) f[0].focus();
    const k = (e) => {
      if (e.key === 'Escape') { e.preventDefault(); onClose(); return; }
      if (e.key !== 'Tab') return;
      const l = items(); if (!l.length) return;
      const first = l[0], last = l[l.length - 1];
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    };
    document.addEventListener('keydown', k);
    return () => { document.removeEventListener('keydown', k); bg.forEach((e) => e.removeAttribute('inert')); prev && prev.focus && prev.focus(); };
  }, []);
}

function FilterDrawer({ query, setQuery, onClose }) {
  const { setPrefLoc } = useApp();
  const ref = useRef(null);
  useTrap(ref, onClose);
  const cat = query.cat;
  const defs = cat === 'all' ? [] : TYPES[cat].filters.filter((f) => f.kind !== 'price');
  const showPrice = cat === 'all' || TYPES[cat].filters.some((f) => f.kind === 'price');
  const point = resolveLocation(query.loc);
  const setF = (k, v) => setQuery({ ...query, f: { ...query.f, [k]: v }, n: 1 });
  return createPortal(
    <>
      <div className="scrim" onClick={onClose} />
      <div className="drawer" role="dialog" aria-modal="true" aria-label="Filters" ref={ref}>
        <header><h2>Filters</h2><button className="iconbtn" aria-label="Close filters" onClick={onClose}><Icon n="x" /></button></header>
        <div className="body">
          <Field id="fd-loc" label="Location"><LocationInput id="fd-loc" value={query.loc} onPick={(v) => { setPrefLoc(v); setQuery({ ...query, loc: v, r: v ? query.r : '', n: 1 }); }} /></Field>
          {point && point.kind === 'city' && (
            <div className="field"><span className="label" id="fd-r-l">Distance</span><Seg id="fd-r" label="Distance" size="wrap" options={[['25', '25 mi'], ['50', '50 mi'], ['', '100 mi'], ['250', '250 mi'], ['any', 'Any']]} value={query.r || ''} onChange={(v) => setQuery({ ...query, r: v, n: 1 })} /></div>
          )}
          {defs.map((d) => {
            const opts = d.options || optionsFor(cat, d.key);
            if (d.kind === 'multi') return <div className="field" key={d.key}><span className="label">{d.label}</span><FieldInput def={{ key: d.key, label: '', kind: 'multi', options: opts }} idp="flt" value={query.f[d.key] || []} onChange={(v) => setF(d.key, v)} /></div>;
            if (opts.length <= 6 && opts.every((o) => String(o).length <= 28)) return <div className="field" key={d.key}><span className="label">{d.label}</span><Seg id={'fd-' + d.key} label={d.label} size="wrap" options={[['', 'Any'], ...opts.map((o) => [o, o])]} value={query.f[d.key] || ''} onChange={(v) => setF(d.key, v)} /></div>;
            return <Field key={d.key} id={'fd-' + d.key} label={d.label}><select id={'fd-' + d.key} className="select" value={query.f[d.key] || ''} onChange={(e) => setF(d.key, e.target.value)}><option value="">Any</option>{opts.map((o) => <option key={o}>{o}</option>)}</select></Field>;
          })}
          {showPrice && (
            <div className="field"><span className="label">{TYPES[cat]?.priceLabel || (cat === 'routes' ? 'Asking price' : 'Price')}</span>
              <div className="row2">
                <input className="input" style={{ width: 130 }} inputMode="numeric" placeholder="Min $" aria-label="Minimum price" value={query.pmin} onChange={(e) => setQuery({ ...query, pmin: e.target.value.replace(/\D/g, ''), n: 1 })} />
                <span aria-hidden="true">–</span>
                <input className="input" style={{ width: 130 }} inputMode="numeric" placeholder="Max $" aria-label="Maximum price" value={query.pmax} onChange={(e) => setQuery({ ...query, pmax: e.target.value.replace(/\D/g, ''), n: 1 })} />
              </div>
              {(query.pmin !== '' || query.pmax !== '') && <div className="switchrow"><label htmlFor="fd-np">Include listings without a price</label><Switch id="fd-np" label="Include listings without a price" checked={!!query.np} onChange={(on) => setQuery({ ...query, np: on ? '1' : '', n: 1 })} /></div>}
            </div>
          )}
        </div>
        <footer>
          <button className="btn secondary" onClick={() => setQuery({ ...query, f: {}, pmin: '', pmax: '', verified: '', r: '', n: 1 })}>Clear all</button>
          <button className="btn" onClick={onClose}>Show results</button>
        </footer>
      </div>
    </>,
    document.body
  );
}

function Browse({ route, go }) {
  const { listings, orgs, user, searches, saveSearch, requireAuth, notify, prefLoc, track, trackImpr } = useApp();
  const query = route.query;
  const [state, setState] = useState({ status: 'loading', items: [], total: 0, hasMore: false });
  const [drawer, setDrawer] = useState(false);
  const lastKey = useRef('');
  const key = JSON.stringify({ ...query, n: 0 });
  const set = (q, replace = true) => go(encodeQuery(q), replace);
  const sort = effectiveSort(query);

  const load = useCallback(() => {
    const ac = new AbortController();
    const same = lastKey.current === key;
    setState((s) => ({ ...s, status: same && s.items.length ? 'more' : 'loading' }));
    lastKey.current = key;
    const t = setTimeout(() => {
      if (ac.signal.aborted) return;
      try {
        if (typeof navigator !== 'undefined' && navigator.onLine === false) throw new Error('offline');
        setState({ status: 'ok', ...runSearch(listings, orgs, query) });
      } catch (e) { setState((s) => ({ ...s, status: 'error' })); }
    }, same ? 120 : 320);
    return () => { ac.abort(); clearTimeout(t); };
  }, [key, query.n, listings, orgs]);
  useEffect(() => load(), [load]);

  // restore scroll after returning from a listing
  const scrollKey = 'sc:' + (typeof location !== 'undefined' ? location.hash : '');
  useEffect(() => {
    const save = () => { try { sessionStorage.setItem(scrollKey, String(window.scrollY)); } catch (e) {} };
    window.addEventListener('pagehide', save);
    return () => { save(); window.removeEventListener('pagehide', save); };
  }, [scrollKey]);
  useEffect(() => {
    if (state.status !== 'ok') return;
    try { const y = sessionStorage.getItem(scrollKey); if (y) { window.scrollTo(0, +y); sessionStorage.removeItem(scrollKey); } } catch (e) {}
  }, [state.status]);

  useEffect(() => {
    if (state.status !== 'ok') return;
    trackImpr(key + ':' + query.n, state.items.filter((l) => l.sponsored).map((l) => l.id));
    track(state.total === 0 ? 'search_zero_results' : 'search_results');
  }, [state.status, state.items]);
  const setCat = (cat) => {
    const next = { ...query, cat, n: 1, sort: '' };
    const removed = [];
    const allowed = cat === 'all' ? [] : TYPES[cat].filters.map((f) => f.key);
    next.f = {};
    Object.entries(query.f).forEach(([k, v]) => { if (cat !== 'all' && allowed.includes(k)) next.f[k] = v; else removed.push(k); });
    if (cat !== 'all' && !TYPES[cat].hasPrice && (query.pmin !== '' || query.pmax !== '')) { next.pmin = next.pmax = ''; removed.push('price'); }
    if (cat !== 'all' && cat !== 'services' && query.verified) { next.verified = ''; removed.push('verified'); }
    set(next, false);
    if (removed.length) notify(`Removed filters that don't apply to ${cat === 'all' ? 'All' : TYPES[cat].label}: ${removed.join(', ')}`);
  };
  const tokens = [];
  if (query.loc) tokens.push([query.loc, () => set({ ...query, loc: '', r: '', n: 1 })]);
  if (query.loc && query.r) tokens.push([query.r === 'any' ? 'Any distance' : `Within ${query.r} mi`, () => set({ ...query, r: '', n: 1 })]);
  if (query.pmin !== '' || query.pmax !== '') tokens.push([query.pmin !== '' && query.pmax !== '' ? `${FMT(query.pmin)}–${FMT(query.pmax)}` : query.pmax !== '' ? `Under ${FMT(query.pmax)}` : `${FMT(query.pmin)}+`, () => set({ ...query, pmin: '', pmax: '', n: 1 })]);
  Object.entries(query.f).forEach(([k, v]) => { (Array.isArray(v) ? v : [v]).filter(Boolean).forEach((x) => tokens.push([x, () => set({ ...query, n: 1, f: { ...query.f, [k]: Array.isArray(v) ? v.filter((y) => y !== x) : '' } })])); });
  const nFilters = tokens.length;
  const sorts = sortOptions(query);
  const mapItems = useMemo(() => runSearch(listings, orgs, { ...query, n: 99 }).items, [listings, orgs, JSON.stringify(query)]);
  const clearAll = () => set({ ...DEFAULT_QUERY, f: {}, cat: query.cat, q: query.q, loc: query.loc });
  const label = query.cat === 'all' ? 'All listings' : TYPES[query.cat].label;
  const savedAlready = searches.some((s) => s.href === encodeQuery({ ...query, n: 1 }));

  return (
    <>
      <h1 className="sr">{label}{query.q ? ` matching “${query.q}”` : ''}{query.loc ? ` near ${query.loc}` : ''}</h1>
      <div className="toprow">
      <div className="chips" role="tablist" aria-label="Category">
        {['all', ...TYPE_KEYS].map((c) => (
          <button key={c} role="tab" aria-selected={query.cat === c} className={'chip catchip' + (query.cat === c ? ' on' : '')} onClick={() => setCat(c)}>{c === 'all' ? 'All' : TYPES[c].label}</button>
        ))}
      </div>
      <div className="bar">
        <button className="btn secondary" aria-label={`Filters${nFilters ? `, ${nFilters} active` : ''}`} onClick={() => setDrawer(true)}><Icon n="sliders" size={16} /><span className="flabel">Filters</span>{nFilters ? <span className="fcount" aria-hidden="true">{nFilters}</span> : null}</button>
        <button type="button" role="switch" aria-checked={!!query.verified} className="btn secondary vtoggle" onClick={() => set({ ...query, verified: query.verified ? '' : '1', n: 1 })}>Verified<span className="switch mini" aria-hidden="true"><i /></span></button>
        <span className="grow" />
        <div className="viewtgl" role="radiogroup" aria-label="View">
          <button type="button" role="radio" aria-checked={query.view !== 'map'} aria-label="Grid view" onClick={() => set({ ...query, view: '' })}><Icon n="grid" size={16} /></button>
          <button type="button" role="radio" aria-checked={query.view === 'map'} aria-label="Map view" onClick={() => set({ ...query, view: 'map' })}><Icon n="map" size={16} /></button>
        </div>
        <label className="row2 sortwrap"><span className="sr">Sort by</span><span className="sorticon" aria-hidden="true"><Icon n="sort" size={18} /></span>
          <select className="select" aria-label="Sort by" value={sort} onChange={(e) => set({ ...query, sort: e.target.value, n: 1 }, false)}>
            {sorts.map((s) => <option key={s} value={s}>{SORTS[s]}</option>)}
          </select>
        </label>
        <button className="btn secondary savebtn" disabled={savedAlready} onClick={() => (user ? saveSearch(query) : requireAuth({ type: 'saveSearch', query }, go))}>{savedAlready ? 'Search saved' : 'Save search'}</button>
      </div>
      </div>
      {tokens.length > 0 && (
        <div className="tokens" aria-label="Active filters">
          {tokens.map(([l, rm], i) => <Token key={l + i} label={l} onRemove={rm} />)}
          {tokens.length > 1 && <button className="btn ghost sm" onClick={clearAll}>Clear all</button>}
        </div>
      )}
      {state.status !== 'loading' && query.view !== 'map' && <CityRow items={mapItems} query={query} set={set} />}
      <div className="ctx" role="status" aria-live="polite">
        <span><b>{label}</b>{query.loc ? ` · ${query.loc}` : <span className="nophone"> · Nationwide</span>}{state.status !== 'loading' && state.status !== 'error' ? ` · ${state.total} ${state.total === 1 ? 'result' : 'results'}` : ''}</span>
        <button className="btn ghost sm savectx" disabled={savedAlready} onClick={() => (user ? saveSearch(query) : requireAuth({ type: 'saveSearch', query }, go))}>{savedAlready ? 'Search saved' : 'Save search'}</button>
      </div>

      {state.status === 'error' ? (
        <div className="alert" role="alert"><span>We couldn't load listings. Your filters are kept.</span><button className="btn secondary sm" onClick={load}>Retry</button></div>
      ) : state.status === 'loading' ? (
        <div className="grid" aria-busy="true">{Array.from({ length: 8 }, (_, i) => <CardSkeleton key={i} />)}</div>
      ) : state.items.length === 0 ? (
        <div className="empty">
          <h2>{listings.filter((l) => l.status === 'published').length === 0 ? 'Nothing here yet' : 'No matches yet'}</h2>
          {!(tokens.length || query.q) && <p>Be the first to post in this category.</p>}
          <div className="row2" style={{ flexWrap: 'wrap', justifyContent: 'center' }}>
            {query.loc && query.r !== 'any' && <button className="btn secondary" onClick={() => set({ ...query, r: 'any', n: 1 })}><Icon n="pin" size={16} />Search any distance</button>}
            {(query.pmin !== '' || query.pmax !== '') && !query.np && <button className="btn secondary" onClick={() => set({ ...query, np: '1', n: 1 })}>Include unpriced listings</button>}
            {(tokens.length > 0 || query.q) && <button className="btn secondary" onClick={clearAll}><Icon n="x" size={16} />Clear filters</button>}<a className="btn" href={'#/post' + (query.cat !== 'all' ? '?type=' + query.cat : '')}>Post a listing</a></div>
        </div>
      ) : (
        <>
          {query.view === 'map' ? <ResultsMap items={mapItems} showType={query.cat === 'all'} /> : <div className="grid">{state.items.map((l) => <ListingCard key={l.id} l={l} showType={query.cat === 'all'} />)}</div>}
          {query.view !== 'map' && state.hasMore && <div style={{ display: 'flex', justifyContent: 'center', marginTop: 24 }}><button className="btn secondary" disabled={state.status === 'more'} onClick={() => set({ ...query, n: query.n + 1 })}>{state.status === 'more' ? 'Loading…' : 'Load more'}</button></div>}
        </>
      )}
      {drawer && <FilterDrawer query={query} setQuery={(q) => set(q)} onClose={() => setDrawer(false)} />}
    </>
  );
}

/* ───────────── listing detail ───────────── */
function Detail({ route, go }) {
  const { listings, orgs, favs, toggleFav, user, requireAuth, notify, report, setStatus, bumpView, track, saveSearch, live } = useApp();
  const l = listings.find((x) => x.id === route.id);
  useEffect(() => { bumpView(route.id); }, [route.id]);
  const [rep, setRep] = useState(false);
  const [reason, setReason] = useState('');
  useEffect(() => { if (l) document.title = `${l.title} · VendGrid`; window.scrollTo(0, 0); }, [route.id]);
  if (!l) return <div className="empty"><h1>That listing is no longer here</h1><p>It may have been removed, or the link has a typo.</p><a className="btn" href="#/">Keep browsing</a></div>;
  const t = TYPES[l.type], org = orgs[l.org];
  const own = l.mine && user;
  const open = l.status === 'published';
  const saved = favs.has(l.id);
  const facts = t.fields.filter((f) => !f.private && l.f[f.key] !== undefined && l.f[f.key] !== '' && !(Array.isArray(l.f[f.key]) && !l.f[f.key].length));
  const primary = facts.filter((f) => f.essential), more = facts.filter((f) => !f.essential);
  const row = (f) => <div className="r" key={f.key}><dt>{f.label}{f.hostReported && <span className="badge" style={{ marginLeft: 8 }}>Seller-reported</span>}</dt><dd>{Array.isArray(l.f[f.key]) ? l.f[f.key].join(', ') : f.key === 'traffic' ? `${l.f[f.key]} / day` : f.key === 'coverage' ? `${l.f[f.key]} mi` : String(l.f[f.key])}</dd></div>;
  const related = listings.filter((x) => x.id !== l.id && x.type === l.type && x.status === 'published').slice(0, 4);
  const movers = l.type === 'machines' || l.type === 'routes' ? listings.filter((x) => x.type === 'services' && x.status === 'published' && /Delivery|Installation/.test(x.f.serviceType || '') && dist(x.geo, l.geo) <= (+x.f.coverage || 0)).slice(0, 3) : [];
  const fitParts = l.type === 'machines' ? listings.filter((x) => x.type === 'parts' && x.status === 'published' && (x.f.brands || []).some((b) => b === l.f.manufacturer || b === 'Universal')).slice(0, 4) : [];
  const act = () => {
    if (!open || own) return;
    track('primary_action_click');
    if (!user) requireAuth({ type: 'go', href: `#/listing/${l.id}/inquire` }, go); else go(`#/listing/${l.id}/inquire`);
  };
  const share = async () => {
    const url = live ? location.origin + listingPath(l) : (location.href || '').split('#')[0] + toAddr(hrefFor(l));
    try { await navigator.clipboard.writeText(url); notify('Link copied'); } catch (e) { notify(url); }
  };
  return (
    <div>
      <nav className="crumbs" aria-label="Breadcrumb">
        <a className="btn ghost sm" href="#/" onClick={(e) => { e.preventDefault(); go('back'); }}><Icon n="back" size={16} />Back</a>
        <a href={encodeQuery({ ...DEFAULT_QUERY, f: {}, cat: l.type })}>{t.label}</a>
      </nav>
      {!open && (
        <div className="banner" role="status" style={{ marginBottom: 16 }}>
          <b>{l.status === 'sold' ? 'This item has been sold.' : l.status === 'filled' ? 'This opportunity has been filled.' : `This listing is ${STATUS_LABEL[l.status].toLowerCase()} and not accepting inquiries.`}</b>{' '}
          <a href={encodeQuery({ ...DEFAULT_QUERY, f: {}, cat: l.type, loc: l.geo.city + ', ' + l.geo.st })}><u>See similar {t.label.toLowerCase()} near {l.geo.city}</u></a>{' '}<button className="btn secondary sm" style={{ marginLeft: 8 }} onClick={() => { const sq = { ...DEFAULT_QUERY, f: l.type === 'machines' && l.f.machineType ? { machineType: l.f.machineType } : {}, cat: l.type }; user ? saveSearch(sq) : requireAuth({ type: 'saveSearch', query: sq }, go); }}><Icon n="send" size={14} />Alert me to similar</button>
        </div>
      )}
      <div className="detail">
        <div className="stack" style={{ gap: 24 }}>
          <Gallery l={l} />
          <div className="sect">
            <div className="row2" style={{ flexWrap: 'wrap' }}><span className="badge">{t.singular}</span>{l.sponsored && <span className="badge sp">Sponsored</span>}{!open && <span className="badge warn">{STATUS_LABEL[l.status]}</span>}</div>
            <h1>{l.title}</h1>
            <p className="muted" style={{ margin: 0 }}>{l.type === 'services' ? `Serves ${l.f.coverage} mi around ${l.geo.city}, ${l.geo.st}` : l.type === 'routes' ? `Operating around ${l.geo.city}, ${l.geo.st}` : `${l.geo.city}, ${l.geo.st}`} · Updated {new Date(l.updatedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</p>
          </div>
          <div className="row2 hide-d" style={{ gap: 8 }}>
            <button className="btn secondary" aria-pressed={saved} onClick={() => toggleFav(l.id)}><Icon n="heart" size={16} />{saved ? 'Saved' : 'Save'}</button>
            <button className="btn secondary" onClick={share}><Icon n="share" size={16} />Share</button>
          </div>
          <RouteFinancials l={l} />
          <dl className="facts" style={{ margin: 0 }}>{primary.map(row)}</dl>
          <div className="sect"><h2>Description</h2><p style={{ margin: 0, maxWidth: 680, fontSize: 16, lineHeight: '24px' }}>{l.desc}</p></div>
          {l.type === 'routes' && <p className="muted" style={{ margin: 0 }}>Financial figures are reported by the seller and are not independently verified. VendGrid does not estimate returns.</p>}
          {l.type === 'locations' && <p className="muted" style={{ margin: 0 }}>The street address is private and is shared by the host after they respond.</p>}
          {more.length > 0 && <details className="disc"><summary>More specifications</summary><dl className="facts" style={{ margin: 0, border: 0, borderRadius: 0 }}>{more.map(row)}</dl></details>}
          <PriceCheck l={l} listings={listings} />
          <BuyerChecklist l={l} onAsk={own ? null : act} />
          {l.type === 'routes' && <DocRoom l={l} own={!!own} go={go} />}
          {(l.type === 'locations' || l.type === 'routes' || l.type === 'services') && <AreaMap l={l} />}
          <div className="panel">
            <h3>Seller</h3>
            <div className="row2" style={{ justifyContent: 'space-between', flexWrap: 'wrap' }}>
              <a className="sellerlink" href={`#/business/${org.slug}`}><b><u>{org.name}</u></b><div className="muted">{org.city}</div></a>
              {org.verified ? <Verified org={org} /> : <span className="badge">Not verified</span>}
            </div>
            <p className="muted" style={{ margin: 0 }}>{org.about}</p>
            <div>
              {!rep ? <button className="btn ghost sm" onClick={() => setRep(true)}><Icon n="flag" size={16} />Report listing</button> : (
                <form className="stack" onSubmit={(e) => { e.preventDefault(); if (!reason) return; report(l.id, reason); setRep(false); setReason(''); }}>
                  <Field id="rep" label="Why are you reporting this listing?"><select id="rep" className="select" value={reason} onChange={(e) => setReason(e.target.value)}><option value="">Select…</option><option>Spam or duplicate</option><option>Misleading information</option><option>Prohibited item</option><option>Suspected fraud</option></select></Field>
                  <div className="row2"><button className="btn sm" disabled={!reason}>Submit report</button><button type="button" className="btn ghost sm" onClick={() => setRep(false)}>Cancel</button></div>
                </form>
              )}
            </div>
          </div>
          <p className="muted hide-d" style={{ margin: 0, fontSize: 12, lineHeight: '16px' }}>VendGrid connects buyers and sellers. It doesn’t hold funds, provide escrow or verify condition or revenue.</p>
        </div>
        <aside className="panel actionpanel" aria-label="Contact">
          <div className="pv">
            <div className="price-lg">{priceText(l)}</div>
            {l.priceType === 'negotiable' && <div className="muted">{l.type === 'wanted' ? 'Budget is flexible' : 'Negotiable'}</div>}
            {l.type === 'machines' && <div className="muted extra" style={{ display: undefined }}>{l.f.condition} · {l.geo.city}, {l.geo.st}</div>}
          </div>
          {own ? (
            <a className="btn" href="#/my-listings">Manage listing</a>
          ) : open ? (
            <button className="btn block" onClick={act}>{t.action}</button>
          ) : <button className="btn block" disabled>No longer available</button>}
          <div className="extra row2" style={{ justifyContent: 'space-between' }}>
            <button className="btn secondary sm" aria-pressed={saved} onClick={() => toggleFav(l.id)}><Icon n="heart" size={16} />{saved ? 'Saved' : 'Save'}</button>
            <button className="btn secondary sm" onClick={share}><Icon n="share" size={16} />Share</button>
          </div>
          <div className="extra muted" style={{ fontSize: 12, lineHeight: '16px' }}>VendGrid connects buyers and sellers. It doesn't hold funds, provide escrow or verify condition or revenue.</div>
        </aside>
      </div>
      {movers.length > 0 && <section className="sect" style={{ marginTop: 48 }}><h2>Move it</h2>{l.f.weight > 0 && <p className="muted iconline" style={{ margin: '0 0 8px' }}><Icon n="alert" size={14} />About {l.f.weight} lb{l.f.dims ? `, ${l.f.dims}` : ''}. Plan for a liftgate or pallet jack and measure doorways.</p>}<div className="list">{movers.map((x) => <a className="item nav" key={x.id} href={hrefFor(x)}><span className="iq-photo sm">{x.photos[0] ? <img src={x.photos[0]} alt="" /> : <Icon n="wrench" size={20} />}</span><span className="t"><b>{x.title}</b><span className="muted">{orgs[x.org].name} · {x.f.rate || 'Request quote'} · serves {l.geo.city}</span></span></a>)}</div></section>}
      {fitParts.length > 0 && <section className="sect" style={{ marginTop: 48 }}><div className="row2" style={{ justifyContent: 'space-between' }}><h2>Parts that fit {l.f.manufacturer}</h2><a className="btn ghost sm" href={encodeQuery({ ...DEFAULT_QUERY, f: { brands: l.f.manufacturer }, cat: 'parts' })}>See all<Icon n="chev" size={16} /></a></div><div className="grid">{fitParts.map((x) => <ListingCard key={x.id} l={x} />)}</div></section>}
      {related.length > 0 && <section className="sect" style={{ marginTop: 48 }}><h2>More {t.label.toLowerCase()}</h2><div className="grid">{related.map((x) => <ListingCard key={x.id} l={x} />)}</div></section>}
    </div>
  );
}

/* ───────────── inquiry ───────────── */
function Inquire({ route, go }) {
  const { listings, orgs, user, requireAuth, startInquiry, convs, myOrg } = useApp();
  const l = listings.find((x) => x.id === route.id);
  // Prefill what we already know so the buyer only types what's new.
  const [vals, setVals] = useState(() => {
    const lx = listings.find((x) => x.id === route.id);
    const out = {};
    if (lx) TYPES[lx.type].inquiry.fields.forEach((f) => {
      if (f.def) out[f.key] = f.def;
      if (f.prefill === 'city') out[f.key] = `${lx.geo.city}, ${lx.geo.st}`;
      if (f.prefill === 'org' && myOrg) out[f.key] = myOrg.name;
    });
    return out;
  });
  const [errs, setErrs] = useState({});
  const [busy, setBusy] = useState(false);
  const [fail, setFail] = useState('');
  useEffect(() => { if (!user) requireAuth({ type: 'go', href: `#/listing/${route.id}/inquire` }, go, true); }, [user]);
  if (!l || !user) return null;
  const t = TYPES[l.type];
  const existing = convs.find((c) => c.listingId === l.id && c.me === 'buyer');
  if (l.mine) return <div className="page"><div className="empty"><h2>This is your listing</h2><a className="btn" href="#/my-listings">Manage listings</a></div></div>;
  const submit = (e) => {
    e.preventDefault();
    if (busy) return; // prevent double submit
    const er = {};
    t.inquiry.fields.forEach((f) => { if (f.required && !String(vals[f.key] || '').trim()) er[f.key] = 'Please fill this in.'; });
    setErrs(er);
    if (Object.keys(er).length) { const first = t.inquiry.fields.find((f) => er[f.key]); document.getElementById('q-' + first.key)?.focus(); return; }
    setBusy(true);
    setTimeout(async () => {
      const r = await startInquiry(l.id, vals);
      setBusy(false);
      if (r.error) { setFail(r.error); return; }
      go(`#/messages?c=${r.convId}`);
    }, 400);
  };
  return (
    <form className="page" onSubmit={submit} noValidate>
      <a className="btn ghost sm hide-compact" style={{ alignSelf: 'flex-start' }} href={hrefFor(l)}><Icon n="back" size={16} />Back to listing</a>
      <h1>{t.inquiry.title}</h1>
      <a className="inqcard" href={hrefFor(l)}>
        <span className="iq-photo">{l.photos[0] ? <img src={l.photos[0]} alt="" /> : <Icon n={CAT_ICON[l.type]} size={24} stroke={1.75} />}</span>
        <span className="iq-text"><b>{l.title}</b><span className="muted">{orgs[l.org].name}</span><span className="muted"><Icon n="pin" size={13} />{l.geo.city}, {l.geo.st} · {priceText(l)}</span></span>
      </a>
      {l.photos.length > 1 && <div className="iq-strip" aria-label="More photos of this space">{l.photos.slice(1, 4).map((p, i) => <img key={i} src={p} alt={`${l.title}, photo ${i + 2}`} />)}</div>}
      {existing && <div className="banner" role="status">{existing.status === 'open' ? <>You already have a conversation about this listing. Sending adds your message to it. <a href={`#/messages?c=${existing.id}`}><u>Open it</u></a></> : <>Your earlier conversation about this listing is {existing.status}. <a href={`#/messages?c=${existing.id}`}><u>View it</u></a></>}</div>}
      {fail && <div className="alert" role="alert"><span>{fail}</span><a className="btn secondary sm" href={encodeQuery({ ...DEFAULT_QUERY, f: {}, cat: l.type })}>Find alternatives</a></div>}
      {t.inquiry.fields.map((f) => <FieldInput key={f.key} def={f} idp="q" value={vals[f.key]} onChange={(v) => setVals({ ...vals, [f.key]: v })} error={errs[f.key]} />)}
      <p className="muted iconline"><Icon n="lock" size={14} />Only this seller sees your message. Your email stays hidden.</p>
      <button className="btn block" disabled={busy}>{busy ? 'Sending…' : 'Send message'}</button>
    </form>
  );
}

/* ───────────── post / edit listing ───────────── */
const blankDraft = (type) => ({ type, step: type ? 2 : 1, title: '', desc: '', priceType: 'fixed', price: '', city: '', f: {}, photos: [] });
const CAT_BLURB = { wanted: 'Tell sellers what you’re looking for', machines: 'Sell or lease vending equipment', parts: 'Sell coin mechs, readers, boards and more', locations: 'Offer a spot for a machine', routes: 'Sell a vending business', services: 'Offer repair, delivery or supply' };
const TITLE_TIP = { wanted: 'What you need and where, e.g. “Wanted: AMS 39 snack machine, Columbus”', parts: 'Part, brand and condition, e.g. “Coinco coin mech, refurbished, fits AMS”', machines: 'Make, model and condition, e.g. “AMS 39 snack machine, cashless ready”', locations: 'Venue and foot traffic, e.g. “Office lobby, 200 staff, no vending”', routes: 'Size and area, e.g. “18-machine snack route, Louisville”', services: 'What and where, e.g. “Vending machine repair, Evansville + 50 mi”' };

function PostPreview({ draft, t }) {
  const loc = resolveLocation(draft.city);
  const price = t.hasPrice && draft.priceType !== 'undisclosed' && +draft.price > 0 ? (draft.type === 'wanted' ? 'Budget ' : '') + FMT(+draft.price) + (draft.priceType === 'negotiable' ? ' · Negotiable' : '') : t.noPriceText;
  return (
    <aside className="postpreview" aria-label="Preview">
      <span className="label">Preview</span>
      <div className="card" aria-hidden="true">
        <div className="thumb">{draft.photos[0] ? <img src={draft.photos[0]} alt="" /> : <div className="fallback"><span className="g"><Icon n={CAT_ICON[draft.type]} size={22} stroke={1.75} /></span>No photo yet</div>}</div>
        <div className="cbody">
          <div className="cprice">{price}</div>
          <div className="ctitle">{draft.title.trim() || 'Your title appears here'}</div>
          <div className="cloc">{loc ? `${loc.city}, ${loc.st}` : 'City'}</div>
        </div>
      </div>
      <p className="muted" style={{ margin: 0, fontSize: 12, lineHeight: '16px' }}>This is how your listing looks in search.</p>
    </aside>
  );
}

function Post({ route, go }) {
  const { user, requireAuth, listings, drafts, setDraft, publish, notify, priv, prefLoc } = useApp();
  const editing = route.edit ? listings.find((l) => l.id === route.edit && l.mine) : null;
  const dk = editing ? 'edit' + editing.id : 'new';
  const draft = drafts[dk] || (editing ? { type: editing.type, step: 2, title: editing.title, desc: editing.desc, priceType: editing.priceType === 'none' ? 'undisclosed' : editing.priceType, price: editing.price ?? '', city: `${editing.geo.city}, ${editing.geo.st}`, f: { ...editing.f, address: priv[editing.id] || '' }, photos: [...editing.photos] } : blankDraft(route.type && TYPES[route.type] ? route.type : ''));
  const [errs, setErrs] = useState({});
  const [busy, setBusy] = useState(false);
  const [savedAt, setSavedAt] = useState(null);
  const upd = (patch) => { setDraft(dk, { ...draft, ...patch }); setSavedAt(Date.now()); };
  const setF = (k, v) => upd({ f: { ...draft.f, [k]: v } });
  const t = draft.type ? TYPES[draft.type] : null;

  if (!draft.type || draft.step === 1) {
    return (
      <div className="page">
        <h1>What are you posting?</h1>
        <div className="catgrid">
          {TYPE_KEYS.map((k) => (
            <button key={k} className="catcard" onClick={() => upd({ type: k, step: 2, f: {}, city: draft.city || (resolveLocation(prefLoc)?.kind === 'city' ? prefLoc : '') })}>
              <span className="caticon"><Icon n={CAT_ICON[k]} size={24} stroke={1.75} /></span>
              <span className="cattext"><b>{TYPES[k].label}</b><small>{CAT_BLURB[k]}</small></span>
              <Icon n="chev" size={18} />
            </button>
          ))}
        </div>
        <ul className="postnotes">
          <li><Icon n="check" size={16} />Free to post. No card needed.</li>
          <li><Icon n="eye" size={16} />Only your city is shown. Street addresses stay private.</li>
          <li><Icon n="send" size={16} />Buyers contact you through VendGrid messages.</li>
        </ul>
      </div>
    );
  }
  const validate = () => {
    const e = {};
    if (draft.title.trim().length < 8) e.title = 'Give your listing a title (at least 8 characters).';
    if (draft.desc.trim().length < 30) e.desc = 'Tell buyers a bit more (at least 30 characters).';
    if (!resolveLocation(draft.city)) e.city = 'Pick a city from the suggestions.';
    t.fields.forEach((f) => { if (f.required && !String(draft.f[f.key] ?? '').trim()) e[f.key] = 'Please fill this in.'; });
    if (t.hasPrice && draft.priceType === 'fixed' && !(+draft.price > 0)) e.price = 'Add a price above $0, or choose Negotiable.';
    if ((draft.type === 'machines' || draft.type === 'parts') && draft.photos.length < 1) e.photos = `Add a photo of the actual ${draft.type === 'parts' ? 'part' : 'machine'}.`;
    return e;
  };
  const submit = (e) => {
    e.preventDefault();
    if (busy) return;
    const er = validate(); setErrs(er);
    if (Object.keys(er).length) { const ids = Object.keys(er).map((k) => document.getElementById('p-' + k)).filter(Boolean).sort((x, y) => (x.compareDocumentPosition(y) & 4 ? -1 : 1)); (ids[0] || document.getElementById('p-photos'))?.focus(); ids[0]?.scrollIntoView?.({ block: 'center' }); notify(`Almost there. ${Object.keys(er).length === 1 ? 'One field needs' : Object.keys(er).length + ' fields need'} attention.`); return; }
    if (!user) { requireAuth({ type: 'go', href: '#/post' }, go); return; } // sign in only at the moment it's needed; the draft is kept
    setBusy(true);
    setTimeout(async () => { const l = await publish(draft, editing); setBusy(false); if (!l) return; setDraft(dk, null); go(hrefFor(l)); }, 500);
  };
  const addPhotos = async (files) => {
    const list = [...files].filter((f) => f.type.startsWith('image/')).slice(0, 8 - draft.photos.length);
    const urls = await Promise.all(list.map(shrinkPhoto));
    upd({ photos: [...draft.photos, ...urls] });
  };
  const move = (i, d) => { const p = [...draft.photos]; const j = i + d; if (j < 0 || j >= p.length) return; [p[i], p[j]] = [p[j], p[i]]; upd({ photos: p }); };
  const essentials = t.fields.filter((f) => f.essential), optional = t.fields.filter((f) => !f.essential);
  const sc = { id: 'p-' };
  return (
    <div className="postlayout">
    <form className="page" onSubmit={submit} noValidate>
      <div>
        {!editing && <ol className="stepper" aria-label="Progress"><li className="done"><button type="button" onClick={() => upd({ step: 1 })}><Icon n="check" size={14} />{t.label}</button></li><li aria-current="step"><span>2</span>Details</li></ol>}
        <h1>{editing ? 'Edit listing' : `Tell buyers about your ${t.singular.toLowerCase()}`}</h1>
        {savedAt && <p className="saved" role="status"><Icon n="check" size={14} />Draft saved</p>}
      </div>
      <section className="psec" aria-labelledby="ph-l">
        <h2 id="ph-l">Photos {draft.type === 'machines' || draft.type === 'parts' ? <span className="req">Required</span> : <span className="opt">Optional</span>}</h2>
        <div className="photos">
          {draft.photos.map((p, i) => (
            <div className="ph" key={p}><img src={p} alt={`Photo ${i + 1}`} />{i === 0 && <span className="cover">Cover</span>}
              <div className="tools">
                {i > 0 && <button type="button" aria-label={`Move photo ${i + 1} earlier`} onClick={() => move(i, -1)}><Icon n="left" size={16} /></button>}
                {i < draft.photos.length - 1 && <button type="button" aria-label={`Move photo ${i + 1} later`} onClick={() => move(i, 1)}><Icon n="chev" size={16} /></button>}
                <button type="button" aria-label={`Remove photo ${i + 1}`} onClick={() => upd({ photos: draft.photos.filter((_, k) => k !== i) })}><Icon n="trash" size={16} /></button>
              </div>
            </div>
          ))}
          {draft.photos.length < 8 && (
            <label className={'addph' + (errs.photos ? ' bad' : '')} onDragOver={(e) => e.preventDefault()} onDrop={(e) => { e.preventDefault(); addPhotos(e.dataTransfer.files); }}>
              <Icon n="image" size={24} stroke={1.75} /><span>Add photos</span>
              <input id="p-photos" type="file" accept="image/*" multiple className="sr" onChange={(e) => { addPhotos(e.target.files); e.target.value = ''; }} />
            </label>
          )}
        </div>
        {errs.photos && <div className="err" role="alert">{errs.photos}</div>}
        <div className="hint muted">{draft.type === 'machines' ? 'Show the actual machine. ' : draft.type === 'parts' ? 'Show the actual part and any part number. ' : ''}The first photo is the cover. Up to 8.</div>
      </section>
      <section className="psec"><h2>Basics</h2>
      <Field id="p-title" label="Title" required error={errs.title} hint={`${TITLE_TIP[draft.type]} · ${draft.title.length}/90`}><input id="p-title" className={'input full' + (errs.title ? ' bad' : '')} value={draft.title} onChange={(e) => upd({ title: e.target.value })} maxLength={90} aria-invalid={!!errs.title} /></Field>
      <Field id="p-city" label={draft.type === 'services' ? 'Based in' : draft.type === 'routes' ? 'Operating area' : 'Location'} required error={errs.city} hint={<><Icon n="eyeoff" size={13} />Only the city is shown publicly</>}>
        <LocationInput id="p-city" cityOnly value={draft.city} placeholder="City or ZIP" onPick={(v) => upd({ city: v })} />
      </Field>
      </section>
      <section className="psec"><h2>Details</h2>
      {essentials.map((f) => <FieldInput key={f.key} def={f} idp="p" value={draft.f[f.key]} onChange={(v) => setF(f.key, v)} error={errs[f.key]} />)}
      {t.hasPrice && (
        <div className="field"><span className="label">{t.priceLabel || (draft.type === 'routes' ? 'Asking price' : 'Price')}</span>
          <div className="row2" style={{ flexWrap: 'wrap' }}>
            <Seg label="Price type" options={(draft.type === 'wanted' ? [['fixed', 'Up to'], ['negotiable', 'Flexible'], ['undisclosed', 'Open']] : [['fixed', 'Fixed'], ['negotiable', 'Negotiable'], ['undisclosed', draft.type === 'routes' ? 'On request' : 'Hidden']])} value={draft.priceType} onChange={(v) => upd({ priceType: v })} />
            {draft.priceType !== 'undisclosed' && <span className="money"><span aria-hidden="true">$</span><input id="p-price" className={'input' + (errs.price ? ' bad' : '')} inputMode="numeric" placeholder="0" aria-label="Price in US dollars" value={draft.price ? Number(draft.price).toLocaleString('en-US') : ''} onChange={(e) => upd({ price: e.target.value.replace(/\D/g, '') })} /></span>}
          </div>
          {errs.price && <div className="err" role="alert">{errs.price}</div>}
        </div>
      )}
      <Field id="p-desc" label="Description" required error={errs.desc} hint={draft.desc.trim().length < 30 ? `${30 - draft.desc.trim().length} more characters to go` : `${draft.desc.length} characters`}><textarea id="p-desc" className={'textarea' + (errs.desc ? ' bad' : '')} value={draft.desc} onChange={(e) => upd({ desc: e.target.value })} /></Field>
      {optional.length > 0 && <details className="disc"><summary>More details (optional)</summary><div className="stack" style={{ padding: 16 }}>{optional.map((f) => <FieldInput key={f.key} def={f} idp="p" value={draft.f[f.key]} onChange={(v) => setF(f.key, v)} error={errs[f.key]} />)}</div></details>}
      </section>
      <div className="publishbar">
        <button className="btn block" disabled={busy}>{busy ? 'Publishing…' : editing ? 'Save changes' : user ? 'Publish listing' : 'Continue to publish'}</button>
        {!user && !editing && <p className="muted" style={{ margin: 0, fontSize: 12, lineHeight: '16px', textAlign: 'center' }}>You’ll sign in next. Your draft is kept.</p>}
      </div>
    </form>
    <PostPreview draft={draft} t={t} />
    </div>
  );
}

/* ───────────── list pages ───────────── */
function Tabs({ tabs, value, onChange }) {
  const ref = useRef(null);
  useEffect(() => { const el = ref.current && ref.current.querySelector('[aria-selected="true"]'); if (el && ref.current.scrollWidth > ref.current.clientWidth) ref.current.scrollLeft = Math.max(0, el.offsetLeft - 16); }, [value]);
  return <div className="tabs" role="tablist" ref={ref}>{tabs.map(([k, l]) => <button key={k} role="tab" className="tab" aria-selected={value === k} onClick={() => onChange(k)}>{l}</button>)}</div>;
}
function Saved({ route, go }) {
  const { user, requireAuth, listings, favs, searches, removeSearch, seeSearch, orgs } = useApp();
  const fresh = (x) => (x.q ? runSearch(listings, orgs, { ...x.q, n: 99 }).items.filter((l) => l.createdAt > (x.seenAt || 0)).length : 0);
  useEffect(() => { if (!user) requireAuth({ type: 'go', href: '#/saved' }, go, true); }, [user]);
  if (!user) return null;
  const items = listings.filter((l) => favs.has(l.id));
  return (
    <div className="page wide">
      <h1>Saved</h1>
      <Tabs tabs={[['listings', `Listings (${items.length})`], ['searches', `Searches (${searches.length})${searches.reduce((a, x) => a + fresh(x), 0) ? ' •' : ''}`]]} value={route.tab} onChange={(t) => go('#/saved?tab=' + t, true)} />
      {route.tab === 'listings' ? (items.length ? <div className="grid">{items.map((l) => <ListingCard key={l.id} l={l} />)}</div> : <div className="empty"><h2>Nothing saved yet</h2><p className="inlineicon">Tap <span className="heartdemo" role="img" aria-label="the heart button"><Icon n="heart" size={14} /></span> on any listing to keep it here.</p><a className="btn" href="#/">Start exploring</a></div>)
        : searches.length ? <div className="list">{searches.map((s) => { const n = fresh(s); return <div className="item" key={s.href} style={{ cursor: 'default' }}><a className="t" href={s.href} onClick={() => seeSearch(s.href)}><b>{s.name}</b><span className="muted">{s.sub}</span></a>{n > 0 && <span className="newbadge">{n} new</span>}<button className="btn ghost sm" onClick={() => removeSearch(s)}>Remove</button></div>; })}</div>
          : <div className="empty"><h2>No saved searches</h2><p>Run a search, then choose Save search to come back to it.</p><a className="btn" href="#/">Start searching</a></div>}
    </div>
  );
}

function Messages({ route, go }) {
  const { user, requireAuth, convs, listings, orgs, sendMsg, markRead, setConvStatus, blockConv, notify, report } = useApp();
  useEffect(() => { if (!user) requireAuth({ type: 'go', href: '#/messages' }, go, true); }, [user]);
  const [text, setText] = useState('');
  const owner = convs.filter((c) => c.me === 'owner');
  const list = route.tab === 'inquiries' ? owner : convs;
  const conv = convs.find((c) => c.id === route.c);
  useEffect(() => { if (conv && conv.unread) markRead(conv.id); }, [route.c, conv && conv.unread]);
  if (!user) return null;
  const l = conv && listings.find((x) => x.id === conv.listingId);
  const [pics, setPics] = useState([]);
  const addPics = async (files) => { const list = [...files].filter((f) => f.type.startsWith('image/')).slice(0, 4 - pics.length); const urls = await Promise.all(list.map(shrinkPhoto)); setPics((p) => [...p, ...urls].slice(0, 4)); };
  const send = (e) => { e.preventDefault(); if (!text.trim() && !pics.length) return; sendMsg(conv.id, text.trim(), pics); setText(''); setPics([]); };
  const statusBadge = (s) => <span className={'badge' + (s === 'open' ? '' : s === 'declined' ? ' bad' : ' ok')}>{{ open: 'Open', completed: 'Completed', declined: 'Declined', closed: 'Closed' }[s]}</span>;
  return (
    <div className="page wide">
      <h1>Messages</h1>
      <Tabs tabs={[['conversations', 'Conversations'], ['inquiries', `Inquiries${owner.filter((c) => c.status === 'open').length ? ` (${owner.filter((c) => c.status === 'open').length})` : ''}`]]} value={route.tab} onChange={(t) => go('#/messages?tab=' + t, true)} />
      <div className="msgs-layout">
        <div style={{ display: conv ? undefined : 'block' }} className={conv ? 'hide-m' : ''}>
          {list.length ? <div className="list">{list.map((c) => {
            const lx = listings.find((x) => x.id === c.listingId);
            return <button key={c.id} className="item" onClick={() => go(`#/messages?tab=${route.tab}&c=${c.id}`)} aria-current={conv && conv.id === c.id ? 'true' : undefined} style={conv && conv.id === c.id ? { background: 'var(--gray-100)' } : null}>
              <div className="t"><b>{c.other}</b><span className="muted">{lx ? lx.title : 'Listing removed'}</span><span className="muted">{(() => { const m = c.msgs[c.msgs.length - 1]; return m.text || (m.imgs ? `📷 ${m.imgs.length === 1 ? 'Photo' : m.imgs.length + ' photos'}` : ''); })()}</span></div>
              {c.unread > 0 ? <span className="count" aria-label={`${c.unread} unread`}>{c.unread}</span> : statusBadge(c.status)}
            </button>;
          })}</div> : <div className="empty"><h2>{route.tab === 'inquiries' ? 'No inquiries yet' : 'No messages yet'}</h2><p>{route.tab === 'inquiries' ? 'When someone contacts you about a listing, you’ll see it here.' : 'Message a seller from any listing and your conversation will show up here.'}</p><a className="btn" href="#/">Start exploring</a></div>}
        </div>
        {!conv && list.length > 0 && <div className="empty hide-m" style={{ alignSelf: 'start' }}><Icon n="send" size={28} stroke={1.5} /><p>Your conversation opens here</p></div>}
        {conv && l && (
          <div className="stack" style={{ gap: 12 }}>
            <button className="btn ghost sm back-m" style={{ alignSelf: 'flex-start' }} onClick={() => go('#/messages?tab=' + route.tab)}><Icon n="back" size={16} />All conversations</button>
            <div className="panel" style={{ gap: 8 }}>
              <div className="row2" style={{ justifyContent: 'space-between', flexWrap: 'wrap' }}>
                <div><b>{conv.other}</b><div><a href={hrefFor(l)}><u>{l.title}</u></a></div></div>
                <div className="row2">{l.status !== 'published' && <span className="badge warn">Listing {STATUS_LABEL[l.status].toLowerCase()}</span>}{statusBadge(conv.status)}</div>
              </div>
              <div className="row2" style={{ flexWrap: 'wrap' }}>
                {conv.me === 'owner' && conv.status === 'open' && <><button className="btn secondary sm" onClick={() => setConvStatus(conv.id, 'completed')}>Mark completed</button><button className="btn secondary sm" onClick={() => setConvStatus(conv.id, 'declined')}>Decline</button></>}
                {conv.status === 'open' && conv.me === 'buyer' && <button className="btn secondary sm" onClick={() => setConvStatus(conv.id, 'closed')}>Close</button>}
                <button className="btn ghost sm" onClick={() => { report(l.id, 'Spam or abusive message'); }}><Icon n="flag" size={14} />Report</button>
                {!conv.blocked && <button className="btn ghost sm" onClick={() => blockConv(conv.id)}>Block</button>}
              </div>
            </div>
            <p className="safety"><Icon n="lock" size={14} />Pay only after you’ve seen the item. Never wire money or use gift cards.</p>
            <div className="thread" aria-live="polite">{conv.msgs.map((m, i) => <div key={i} className={'msg' + (m.from === 'me' ? ' me' : '')}><small>{m.from === 'me' ? 'You' : conv.other} · {new Date(m.at).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })}</small>{m.imgs && m.imgs.length > 0 && <span className="msgpics">{m.imgs.map((u, k) => <img key={k} src={u} alt={`Photo ${k + 1} from ${m.from === 'me' ? 'you' : conv.other}`} />)}</span>}{m.text}</div>)}</div>
            {conv.blocked ? <p className="muted">You blocked this person. They can't message you through this conversation.</p> : conv.status !== 'open' ? <p className="muted">This conversation is {conv.status}.</p> : (
              <form className="composer" onSubmit={send}>
                {pics.length > 0 && <div className="pendpics">{pics.map((u, k) => <span key={k} className="pp"><img src={u} alt={`Attachment ${k + 1}`} /><button type="button" aria-label={`Remove photo ${k + 1}`} onClick={() => setPics(pics.filter((_, j) => j !== k))}><Icon n="x" size={14} /></button></span>)}</div>}
                <div className="row2">
                  <label className="btn secondary attach" aria-label="Attach photos"><Icon n="clip" size={18} /><input id="msg-pics" type="file" accept="image/*" multiple className="sr" onChange={(e) => { addPics(e.target.files); e.target.value = ''; }} /></label>
                  <label className="sr" htmlFor="msg-in">Message</label><input id="msg-in" className="input" style={{ flex: 1, minWidth: 0 }} placeholder={pics.length ? 'Add a caption' : 'Write a message'} value={text} onChange={(e) => setText(e.target.value)} />
                  <button className="btn" aria-label="Send message"><Icon n="send" size={16} /></button>
                </div>
              </form>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function Mine({ go }) {
  const { user, requireAuth, listings, setStatus, isPro, views, convs, promos, promote, cancelPromo, live, stats } = useApp();
  useEffect(() => { if (!user) requireAuth({ type: 'go', href: '#/my-listings' }, go, true); }, [user]);
  if (!user) return null;
  const mine = listings.filter((l) => l.mine);
  const active = mine.filter((l) => l.status === 'published');
  const inq = (l) => (live && stats[l.id] ? stats[l.id].inquiries : convs.filter((c) => c.listingId === l.id && c.me === 'owner').length);
  const vw = (l) => (live ? (stats[l.id] || {}).views || 0 : views[l.id] || 0);
  const sv = (l) => (live ? (stats[l.id] || {}).saves || 0 : 0);
  const totalInq = active.reduce((n, l) => n + inq(l), 0);
  return (
    <div className="page wide">
      <div className="row2" style={{ justifyContent: 'space-between' }}><h1>My listings</h1><a className="btn hide-d" href="#/post"><Icon n="plus" size={16} />Post listing</a></div>
      {isPro ? (
        <div className="panel" aria-label="Analytics"><h3>Analytics</h3>
          <div className="row2" style={{ gap: 32, flexWrap: 'wrap' }}>
            <div><div className="price-lg">{active.length ? (totalInq / active.length).toFixed(1) : '0'}</div><div className="muted">Inquiries per active listing</div></div>
            <div><div className="price-lg">{active.reduce((n, l) => n + vw(l), 0)}</div><div className="muted">{live ? 'Views, last 30 days' : 'Listing views'}</div></div>
            {live && <div><div className="price-lg">{active.reduce((n, l) => n + sv(l), 0)}</div><div className="muted">Saves</div></div>}
          </div>
          <div className="muted" style={{ fontSize: 12 }}>{live ? 'Views count each visitor once per visit and leave out your own. They’re approximate: repeat visits and automated traffic can add to them.' : 'Counts come from this demo session and include your own views.'}</div>
        </div>
      ) : <a className="lockedstats" href="#/billing" aria-label="Listing analytics, available with Professional"><span className="ls-v"><b>—</b><small>Inquiries per listing</small></span><span className="ls-v"><b>—</b><small>Listing views</small></span><span className="ls-cta"><Icon n="lock" size={14} />Unlock with Professional</span></a>}
      {mine.length ? <div className="list">{mine.map((l) => {
        const next = TRANSITIONS[l.status];
        const promo = promos.find((p) => p.listingId === l.id && ['pending', 'active', 'suspended'].includes(p.status));
        return (
          <div className="item" key={l.id} style={{ cursor: 'default', flexWrap: 'wrap' }}>
            <div className="t" style={{ minWidth: 200 }}><a href={hrefFor(l)}><b><u>{l.title}</u></b></a><span className="muted">{TYPES[l.type].label} · {priceText(l)} · {l.geo.city}, {l.geo.st}{isPro ? ` · ${vw(l)} views${live ? ` · ${sv(l)} saves` : ''} · ${inq(l)} inquiries` : ''}</span></div>
            <span className={'badge' + (l.status === 'published' ? ' ok' : l.status === 'sold' || l.status === 'filled' ? ' info' : ' warn')}>{STATUS_LABEL[l.status]}</span>
            {promo && <span className="badge sp">{promo.status === 'active' ? 'Sponsored' : promo.status === 'suspended' ? 'Sponsorship paused' : 'Sponsorship pending payment'}</span>}
            {(['published', 'paused'].includes(l.status) || next.length > 0) && <div className="ractions">
            {['published', 'paused'].includes(l.status) && <a className="btn secondary sm" href={`#/post?edit=${l.id}`}>Edit</a>}
            {l.status === 'published' && (promo ? <button className="btn ghost sm" onClick={() => cancelPromo(promo.id)}>Cancel promotion</button> : <button className="btn secondary sm" onClick={() => { promote(l.id); go('#/billing'); }}>Promote · $29/mo</button>)}
            {next.length > 0 && <select className="select" aria-label={`Change status of ${l.title}`} value="" onChange={(e) => e.target.value && setStatus(l.id, e.target.value)}>
              <option value="">Update status…</option>{next.map((s) => <option key={s} value={s}>{{ published: l.status === 'expired' ? 'Renew (publish)' : 'Resume (publish)', paused: 'Pause', sold: 'Mark sold', filled: 'Mark filled', expired: 'Expire', withdrawn: 'Withdraw', pending_review: 'Submit for review' }[s]}</option>)}
            </select>}
            </div>}
          </div>
        );
      })}</div> : <div className="empty"><h2>Nothing posted yet</h2><p>Post a machine, a part, a placement, a route or a service. It’s free.</p><a className="btn" href="#/post">Post your first listing</a></div>}
    </div>
  );
}

/* ───────────── document room (route sales) ───────────── */
const NDA_TERMS = ['Keep these documents and what they show confidential.', 'Use them only to decide whether to buy this route.', 'Don’t contact the route’s locations or staff without the seller’s permission.', 'Delete your copies if you don’t buy.'];
const fmtSize = (n) => (n >= 1048576 ? (n / 1048576).toFixed(1) + ' MB' : Math.max(1, Math.round(n / 1024)) + ' KB');
const DOC_ACCEPT = 'application/pdf,image/*,.csv,.xlsx,.xls,.docx,.doc,text/plain';
const ACCESS_LABEL = { requested: 'Waiting for you', granted: 'Has access', declined: 'Declined', revoked: 'Access removed' };

function DocRoom({ l, own, go }) {
  const { user, requireAuth, room, notify } = useApp();
  const [st, setSt] = useState({ loading: true, count: 0, files: [], access: [] });
  const [busy, setBusy] = useState('');
  const [agree, setAgree] = useState(false);
  const [note, setNote] = useState('');
  const [links, setLinks] = useState({});
  const [err, setErr] = useState('');
  const uid = user && (user.id || user.email);
  const reload = useCallback(() => room.load(l.id).then((r) => setSt({ loading: false, ...r })).catch(() => setSt((s) => ({ ...s, loading: false }))), [l.id, uid]);
  useEffect(() => { reload(); }, [reload]);
  if (st.loading) return null;
  const mine = st.access.find((a) => a.buyer === uid);
  const count = own ? st.files.length : Math.max(st.count, st.files.length);
  if (!own && !count) return null;
  const run = async (key, fn) => { setBusy(key); setErr(''); try { await fn(); await reload(); } catch (e) { setErr(String(e.message || e).replace(/^.*?: /, '')); } setBusy(''); };
  const open = async (f) => {
    const w = (() => { try { return window.open('', '_blank'); } catch (e) { return null; } })();
    try {
      const url = await room.open(f);
      if (w && url) { w.location.href = url; } else setLinks((x) => ({ ...x, [f.id]: url }));
      reload();
    } catch (e) { if (w) w.close(); setErr(String(e.message || e).replace(/^.*?: /, '')); }
  };
  const fileRow = (f) => (
    <li key={f.id} className="docrow">
      <span className="docicon"><Icon n="file" size={18} /></span>
      <span className="t"><b>{f.name}</b><span className="muted">{fmtSize(f.size)} · added {fmtDate(f.at)}{own ? ` · ${f.views.length ? `opened ${f.views.length} ${f.views.length === 1 ? 'time' : 'times'}, last ${fmtDate(f.views[f.views.length - 1].at)}` : 'not opened yet'}` : ''}</span></span>
      {own ? <button className="btn ghost sm" disabled={busy === 'rm' + f.id} aria-label={`Remove ${f.name}`} onClick={() => run('rm' + f.id, () => room.remove(f))}>Remove</button>
        : links[f.id] ? <a className="btn secondary sm" href={links[f.id]} target="_blank" rel="noopener noreferrer">Open</a>
        : <button className="btn secondary sm" onClick={() => open(f)} aria-label={`Open ${f.name}`}>Open</button>}
    </li>
  );
  return (
    <section className="panel docroom" aria-labelledby="dr-h">
      <div className="row2" style={{ justifyContent: 'space-between', flexWrap: 'wrap' }}>
        <h2 id="dr-h" className="iconline" style={{ margin: 0 }}><Icon n="lock" size={18} />Document room</h2>
        <span className="badge">{count} {count === 1 ? 'document' : 'documents'}</span>
      </div>
      {own ? (
        <>
          <p className="muted" style={{ margin: 0 }}>Share P&amp;Ls, location agreements and tax returns only with buyers you approve. Buyers accept confidentiality terms before they can ask, and you see each time a file is opened.</p>
          {st.files.length > 0 && <ul className="doclist">{st.files.map(fileRow)}</ul>}
          <label className={'btn secondary' + (busy === 'up' ? ' disabled' : '')} style={{ alignSelf: 'flex-start' }}>
            <Icon n="plus" size={16} />{busy === 'up' ? 'Uploading…' : 'Add documents'}
            <input type="file" multiple accept={DOC_ACCEPT} className="sr" disabled={busy === 'up'} onChange={(e) => { const fs = [...e.target.files]; e.target.value = ''; const big = fs.find((f) => f.size > 20971520); if (big) { setErr(`${big.name} is over 20 MB. Split it or compress it first.`); return; } run('up', async () => { for (const f of fs) await room.upload(l.id, f); notify(fs.length === 1 ? 'Document added' : `${fs.length} documents added`); }); }} />
          </label>
          <p className="muted" style={{ margin: 0, fontSize: 12 }}>PDF, images, spreadsheets or Word files, up to 20 MB each. Private: never shown on the public listing.</p>
          <h3 style={{ margin: '8px 0 0' }}>Access requests</h3>
          {st.access.length ? <ul className="doclist">{st.access.map((a) => (
            <li key={a.buyer} className="docrow">
              <span className="t"><b>{a.email}</b><span className="muted">Accepted confidentiality terms {fmtDate(a.ndaAt)}{a.note ? ` · “${a.note}”` : ''}</span></span>
              <span className={'badge' + (a.status === 'granted' ? ' ok' : a.status === 'requested' ? ' warn' : '')}>{ACCESS_LABEL[a.status]}</span>
              <span className="row2" style={{ gap: 8 }}>
                {a.status !== 'granted' && <button className="btn sm" disabled={!!busy} onClick={() => run('g' + a.buyer, () => room.decide(l.id, a.buyer, 'granted').then(() => notify('Access granted')))}>Grant</button>}
                {a.status === 'requested' && <button className="btn ghost sm" disabled={!!busy} onClick={() => run('d' + a.buyer, () => room.decide(l.id, a.buyer, 'declined'))}>Decline</button>}
                {a.status === 'granted' && <button className="btn ghost sm" disabled={!!busy} onClick={() => run('r' + a.buyer, () => room.decide(l.id, a.buyer, 'revoked').then(() => notify('Access removed')))}>Remove access</button>}
              </span>
            </li>))}</ul> : <p className="muted" style={{ margin: 0 }}>No requests yet. Buyers see that this listing has {count || 'no'} {count === 1 ? 'document' : 'documents'} and can ask for access.</p>}
        </>
      ) : !user ? (
        <>
          <p style={{ margin: 0 }}>The seller shares financials and location agreements privately with serious buyers.</p>
          <button className="btn secondary" style={{ alignSelf: 'flex-start' }} onClick={() => requireAuth({ type: 'go', href: hrefFor(l) }, go)}>Sign in to request access</button>
        </>
      ) : mine && mine.status === 'granted' ? (
        <>
          <p className="muted" style={{ margin: 0 }}>The seller gave you access. Each time you open a file, the seller can see it. Links expire after five minutes.</p>
          <ul className="doclist">{st.files.map(fileRow)}</ul>
        </>
      ) : mine && mine.status === 'requested' ? (
        <p className="iconline" style={{ margin: 0 }}><Icon n="clock" size={16} />Request sent {fmtDate(mine.at)}. You’ll see the documents here when the seller grants access.</p>
      ) : (
        <form className="stack" style={{ gap: 12 }} noValidate onSubmit={(e) => { e.preventDefault(); if (!agree) { setErr('Accept the confidentiality terms to send your request.'); return; } run('req', () => room.request(l.id, note.trim(), !!mine).then(() => { notify('Request sent to the seller'); setNote(''); setAgree(false); })); }}>
          {mine && <p className="muted" style={{ margin: 0 }}>{mine.status === 'revoked' ? 'The seller removed your access.' : 'The seller declined your last request.'} You can ask again.</p>}
          <div className="ndabox">
            <b>Confidentiality terms</b>
            <p className="muted" style={{ margin: 0 }}>Between you and the seller. If you get access, you agree to:</p>
            <ul>{NDA_TERMS.map((x) => <li key={x}>{x}</li>)}</ul>
            <p className="muted" style={{ margin: 0, fontSize: 12 }}>VendGrid records when you agree and shows the seller your email and when you open each file. The seller may also ask you to sign their own NDA.</p>
          </div>
          <label className="checkrow"><input type="checkbox" checked={agree} onChange={(e) => { setAgree(e.target.checked); setErr(''); }} />I agree to these confidentiality terms</label>
          <Field id="dr-note" label="Note to the seller (optional)" hint="For example, your experience or how you plan to finance it"><textarea id="dr-note" className="textarea" maxLength={1000} value={note} onChange={(e) => setNote(e.target.value)} /></Field>
          <button className="btn" style={{ alignSelf: 'flex-start' }} disabled={busy === 'req'}>{busy === 'req' ? 'Sending…' : 'Request access'}</button>
        </form>
      )}
      {!own && mine && mine.status === 'requested' && room.sandboxGrant && <button className="btn ghost sm" style={{ alignSelf: 'flex-start' }} onClick={() => run('sg', () => room.sandboxGrant(l.id))}>Sandbox: seller grants access</button>}
      {err && <div className="err" role="alert">{err}</div>}
    </section>
  );
}

const NOTE_ICON = { doc_request: 'lock', doc_granted: 'file', doc_declined: 'lock', doc_revoked: 'lock', verif_ok: 'check', verif_no: 'alert', report_actioned: 'flag' };
const ago = (t) => { const m = Math.round((Date.now() - t) / 6e4); return m < 1 ? 'Just now' : m < 60 ? `${m} min ago` : m < 1440 ? `${Math.round(m / 60)} h ago` : fmtDate(t); };
function Activity({ go }) {
  const { user, requireAuth, notes, markNotesRead } = useApp();
  const [seen] = useState(() => new Set(notes.filter((n) => !n.read).map((n) => n.id)));
  useEffect(() => { if (!user) requireAuth({ type: 'go', href: '#/activity' }, go, true); }, [user]);
  useEffect(() => { if (user && notes.some((n) => !n.read)) { const t = setTimeout(markNotesRead, 1200); return () => clearTimeout(t); } }, [user, notes.length]);
  if (!user) return null;
  return (
    <div className="page">
      <h1>Activity</h1>
      {notes.length ? <ul className="notes">{notes.map((n) => (
        <li key={n.id}><a className={'note' + (seen.has(n.id) ? ' new' : '')} href={n.href}>
          <span className="docicon"><Icon n={NOTE_ICON[n.kind] || 'bell'} size={18} /></span>
          <span className="t"><b>{n.title}</b>{n.body && <span className="muted">{n.body}</span>}<span className="muted when">{seen.has(n.id) && <span className="sr">New. </span>}{ago(n.at)}</span></span>
          {seen.has(n.id) && <span className="ndot" aria-hidden="true" />}
        </a></li>))}</ul>
        : <div className="empty"><span className="caticon" style={{ background: 'var(--gray-100)' }}><Icon n="bell" size={24} /></span><h2>Nothing yet</h2><p>Document requests on your routes, answers to your requests, verification results and listing updates show up here. Messages stay in Messages.</p></div>}
    </div>
  );
}

function Legal({ route }) {
  const { addTicket, user } = useApp();
  const [f, setF] = useState({ email: user ? user.email : '', topic: 'Question', message: '' });
  const [err, setErr] = useState('');
  const doc = route.doc;
  return (
    <div className="page">
      <div className="tabs" role="tablist" aria-label="Help and policies">{[['terms', 'Terms'], ['privacy', 'Privacy'], ['refunds', 'Refunds'], ['support', 'Contact support']].map(([k, l]) => <a key={k} role="tab" aria-selected={doc === k} className="tab" style={{ display: 'inline-flex', alignItems: 'center' }} href={'#/legal?doc=' + k}>{l}</a>)}</div>
      {doc === 'support' ? (
        <form className="stack" noValidate onSubmit={(e) => { e.preventDefault(); if (!/^\S+@\S+\.\S+$/.test(f.email) || f.message.trim().length < 10) { setErr('Add your email and a short message (10+ characters) so we can help.'); return; } setErr(''); addTicket(f); setF({ ...f, message: '' }); }}>
          <h1>Contact support</h1>
          <Field id="sp-e" label="Email"><input id="sp-e" className="input full" type="email" value={f.email} onChange={(e) => setF({ ...f, email: e.target.value })} /></Field>
          <Field id="sp-t" label="Topic"><select id="sp-t" className="select" value={f.topic} onChange={(e) => setF({ ...f, topic: e.target.value })}><option>Question</option><option>Billing or refund</option><option>Report a problem</option><option>Delete my data</option></select></Field>
          <Field id="sp-m" label="Message"><textarea id="sp-m" className="textarea" value={f.message} onChange={(e) => setF({ ...f, message: e.target.value })} /></Field>
          {err && <div className="err" role="alert">{err}</div>}
          <button className="btn">Send message</button>
        </form>
      ) : (
        (() => { const P = POLICIES[doc] || POLICIES.terms; return (
          <article className="policy">
            <header><h1>{P.title}</h1><p className="muted">Last updated {LEGAL.updated}</p></header>
            <p className="lead">{P.intro}</p>
            {P.sections.length > 4 && <nav aria-label="On this page" className="toc"><ol>{P.sections.map(([h], i) => <li key={h}><a href={'#pol-' + i} onClick={(e) => { e.preventDefault(); const el = document.getElementById('pol-' + i); if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' }); }}>{h}</a></li>)}</ol></nav>}
            {P.sections.map(([h, ps], i) => <section key={h} id={'pol-' + i}><h2>{h}</h2>{ps.map((x) => { const m = x.match(/^([A-Z][^:.]{2,40}): (.*)$/); return <p key={x}>{m ? <><b>{m[1]}:</b> {m[2]}</> : x}</p>; })}</section>)}
          </article>); })()
      )}
    </div>
  );
}
function Footer() {
  const { live } = useApp();
  const groups = [
    ['VendGrid', [['About', '#/about'], ['Sellers', '#/sellers'], ['Pricing', '#/pricing']]],
    ['Help', [['Buyer’s guide', '#/guide'], ['Seller guide', '#/seller-guide'], ['Safety', '#/safety'], ['Contact support', '#/support']]],
    ['Legal', [['Terms', '#/legal?doc=terms'], ['Privacy', '#/legal?doc=privacy'], ['Refunds', '#/legal?doc=refunds']]],
  ];
  return (
    <footer className="foot">
      <div className="footcols">{groups.map(([h, links]) => <nav key={h} aria-label={h}><b>{h}</b>{links.map(([l, to]) => <a key={l} href={to}>{l}</a>)}</nav>)}</div>
      <span className="muted">{live ? 'Sample listings from demo businesses are mixed in while VendGrid launches.' : 'Demo inventory. Listings are sample data, not live offers.'}</span>
    </footer>
  );
}

/* Public information pages (About, Seller guide, Pricing, Safety): the same content the server renders for search engines */
function InfoPage({ route }) {
  const P = INFO[route.doc] || INFO.about;
  const cta = INFO_CTA[route.doc] || [];
  return (
    <div className="page">
      <article className="policy">
        <header><h1>{P.title}</h1></header>
        <p className="lead">{P.intro}</p>
        {P.sections.length > 4 && <nav aria-label="On this page" className="toc"><ol>{P.sections.map(([h], i) => <li key={h}><a href={'#pol-' + i} onClick={(e) => { e.preventDefault(); const el = document.getElementById('pol-' + i); if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' }); }}>{h}</a></li>)}</ol></nav>}
        {P.sections.map(([h, ps], i) => <section key={h} id={'pol-' + i}><h2>{h}</h2>{ps.map((x) => { const m = x.match(/^([A-Z][^:.]{2,40}): (.*)$/); return <p key={x}>{m ? <><b>{m[1]}:</b> {m[2]}</> : x}</p>; })}</section>)}
      </article>
      {cta.length > 0 && <div className="row2" style={{ flexWrap: 'wrap' }}>{cta.map(([l, to], i) => <a key={l} className={'btn' + (i ? ' secondary' : '')} href={to}>{l}</a>)}</div>}
      <nav className="infonav" aria-label="More about VendGrid">{INFO_KEYS.filter((k) => k !== route.doc).map((k) => <a key={k} className="chip" href={'#/' + k}>{INFO_LABELS[k]}</a>)}</nav>
    </div>
  );
}

/* Seller directory: every business with something live, verified ones first */
function Sellers() {
  const { orgs, listings } = useApp();
  const [q, setQ] = useState('');
  const rows = useMemo(() => {
    const n = {};
    listings.forEach((l) => { if (l.status === 'published' && l.org && l.org !== 'unknown') n[l.org] = (n[l.org] || 0) + 1; });
    const all = Object.values(orgs).filter((o) => o && o.id !== 'unknown' && n[o.id]).map((o) => ({ ...o, n: n[o.id] }));
    all.sort((a, b) => (b.verified - a.verified) || (b.n - a.n) || a.name.localeCompare(b.name));
    return all;
  }, [orgs, listings]);
  const shown = rows.filter((o) => !q.trim() || (o.name + ' ' + (o.city || '')).toLowerCase().includes(q.trim().toLowerCase()));
  return (
    <div className="page wide">
      <div><h1>Sellers</h1><p className="muted" style={{ margin: '4px 0 0' }}>Businesses with listings on VendGrid. Verified businesses passed our review; it isn’t a guarantee about any listing.</p></div>
      <Field id="sl-q" label="Find a seller"><input id="sl-q" className="input full" type="search" placeholder="Name or city" value={q} onChange={(e) => setQ(e.target.value)} /></Field>
      <p className="muted" role="status" style={{ margin: 0 }}>{shown.length} {shown.length === 1 ? 'seller' : 'sellers'}</p>
      {shown.length ? <ul className="sellerlist">{shown.map((o) => (
        <li key={o.id}><a className="sellercard" href={`#/business/${o.slug}`}>
          <span><b>{o.name}</b><span className="muted">{[o.city, `${o.n} ${o.n === 1 ? 'listing' : 'listings'}`].filter(Boolean).join(' · ')}</span></span>
          {o.verified ? <span className="badge ok"><Icon n="check" size={12} />Verified</span> : <span className="badge">Not verified</span>}
        </a></li>))}</ul>
        : <div className="empty"><p>No sellers match “{q}”.</p></div>}
    </div>
  );
}

function NotFound({ go }) {
  const [q, setQ] = useState('');
  return (
    <div className="page" style={{ maxWidth: 520, margin: '0 auto' }}>
      <div><h1>We couldn’t find that page</h1><p className="muted" style={{ margin: '4px 0 0' }}>The link may be old or mistyped. Search for what you need, or pick a place to start.</p></div>
      <form role="search" className="row2" onSubmit={(e) => { e.preventDefault(); go(encodeQuery({ ...DEFAULT_QUERY, f: {}, q: q.trim() })); }}>
        <input className="input full" type="search" aria-label="Search VendGrid" placeholder="Search machines, parts, locations, routes" value={q} onChange={(e) => setQ(e.target.value)} />
        <button className="btn">Search</button>
      </form>
      <div className="row2" style={{ flexWrap: 'wrap' }}>
        <a className="btn" href="#/">Browse listings</a>
        <a className="btn secondary" href="#/about">About VendGrid</a>
        <a className="btn secondary" href="#/support">Contact support</a>
      </div>
    </div>
  );
}

const fmtDate = (t) => new Date(t).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

function Billing({ go }) {
  const { user, requireAuth, plan, isPro, subscribe, cancelPlan, promos, listings, cancelPromo, confirmPayment, invoices, events, promote } = useApp();
  useEffect(() => { if (!user) requireAuth({ type: 'go', href: '#/billing' }, go, true); }, [user]);
  if (!user) return null;
  const title = (id) => (listings.find((l) => l.id === id) || {}).title || 'Listing';
  const visible = promos.filter((p) => p.status !== 'canceled' || promoLive(p));
  const endsOn = plan.status === 'canceled' && plan.until > Date.now() ? plan.until : 0;
  return (
    <div className="page">
      <h1>Billing</h1>
      <div className="banner" role="note"><b>Paid plans aren’t available yet.</b> This screen is a preview: nothing here can be bought, and no card is charged today.</div>
      <div className="plans">
        <div className={'plan' + (!isPro ? ' current' : '')}>
          <div className="plan-h"><b>Standard</b><span>Free</span></div>
          <ul>{['Post unlimited listings', 'Save listings and searches', 'Message buyers and sellers', 'Apply for the Verified badge'].map((x) => <li key={x}><Icon n="check" size={16} />{x}</li>)}</ul>
          {!isPro && <span className="badge">Your plan</span>}
        </div>
        <div className={'plan' + (isPro ? ' current' : '')}>
          <div className="plan-h"><b>Professional</b><span>$49 / mo</span></div>
          <ul>{['Everything in Standard', 'Views and inquiries per listing', 'Business tools'].map((x) => <li key={x}><Icon n="check" size={16} />{x}</li>)}<li className="no"><Icon n="x" size={16} />Doesn’t add a Verified badge</li></ul>
          {isPro ? <span className="badge ok">{endsOn ? `Active until ${fmtDate(endsOn)}` : 'Your plan'}</span> : (plan.status === 'none' || plan.status === 'canceled') && <button className="btn" onClick={subscribe}>Start Professional</button>}
        </div>
      </div>
      {plan.status !== 'none' && (plan.status !== 'canceled' || endsOn > 0) && <section className="panel" aria-labelledby="pl">
        <div className="row2" style={{ justifyContent: 'space-between', flexWrap: 'wrap' }}>
          <h2 id="pl">Professional</h2>
          {plan.status !== 'none' && <span className={'badge' + (plan.status === 'active' ? ' ok' : plan.status === 'pending' ? ' warn' : '')}>{{ pending: 'Waiting for payment confirmation', active: 'Active, renews monthly', canceled: 'Canceled' }[plan.status]}</span>}
        </div>
        {endsOn > 0 && <p className="muted" style={{ margin: 0 }}>Canceled. It won’t renew and stays active until {fmtDate(endsOn)}.</p>}
        {plan.status === 'pending' && <p className="muted" style={{ margin: 0 }}>Features unlock only after the payment provider confirms. Nothing is granted from this screen.</p>}
        <div className="row2" style={{ flexWrap: 'wrap' }}>
          {plan.status === 'pending' && <button className="btn secondary" onClick={() => confirmPayment('plan', plan.ref)}>Sandbox: send payment confirmation</button>}
          {plan.status === 'active' && <button className="btn secondary" onClick={cancelPlan}>Cancel plan</button>}
        </div>
      </section>}
      <section className="stack" aria-labelledby="sp">
        <div><h2 id="sp">Sponsored placements</h2><div className="muted">$29 / month per listing · always labeled Sponsored · pauses when the listing isn’t published</div></div>
        {visible.length ? <div className="list">{visible.map((p) => (
          <div className="item" key={p.id} style={{ cursor: 'default', flexWrap: 'wrap' }}>
            <div className="t"><b>{title(p.listingId)}</b><span className="muted">{p.status === 'canceled' ? `Canceled. It won’t renew and stays active until ${fmtDate(p.until)}.` : p.status === 'active' ? (p.until ? `Active, renews monthly` : 'Active') : p.status === 'suspended' ? 'Paused. Billing stops while the listing isn’t published.' : 'Waiting for payment confirmation'}</span></div>
            {p.status === 'pending' && <button className="btn secondary sm" onClick={() => confirmPayment('promo', p.id)}>Sandbox: send payment confirmation</button>}
            {p.status !== 'canceled' && <button className="btn ghost sm" onClick={() => cancelPromo(p.id)}>Cancel</button>}
          </div>))}</div> : (() => { const can = listings.filter((l) => l.mine && l.status === 'published' && !promos.some((p) => p.listingId === l.id && (p.status !== 'canceled' || promoLive(p)))); return can.length ? <div className="list">{can.map((l) => <div className="item static" key={l.id}><div className="t"><b>{l.title}</b><span className="muted">{priceText(l)} · {l.geo.city}, {l.geo.st}</span></div><button className="btn secondary sm" onClick={() => promote(l.id)}>Promote · $29/mo</button></div>)}</div> : <div className="empty"><p>Publish a listing first, then promote it here.</p><a className="btn secondary" href="#/post">Post a listing</a></div>; })()}
      </section>
      <section className="stack" aria-labelledby="iv"><h2 id="iv">Invoices</h2>
        {invoices.length ? <div className="list">{invoices.map((i) => <div className="item" key={i.id} style={{ cursor: 'default' }}><div className="t"><b>{i.desc}</b><span className="muted">{fmtDate(i.at)} · {i.id}</span></div><b>{FMT(i.amount)}</b></div>)}</div> : <p className="muted" style={{ margin: 0 }}>Invoices appear here after a payment is confirmed.</p>}
        {events.length > 0 && <button className="btn ghost sm" style={{ alignSelf: 'flex-start' }} onClick={() => confirmPayment(events[0].type === 'subscription.changed' ? 'plan' : 'promo', events[0].id.replace('evt_', ''))}>Sandbox: replay last payment event</button>}
      </section>
      <p className="muted" style={{ margin: 0, fontSize: 12 }}>The price is shown before you pay. Plans renew monthly until you cancel, and canceling stops the next renewal. <a className="u" href="#/legal?doc=refunds">Refunds and cancellation</a></p>
    </div>
  );
}

function BusinessSettings({ go }) {
  const { user, requireAuth, myOrg, verif, submitVerif, saveOrg } = useApp();
  const [v, setV] = useState({ legal: '', phone: '', domain: '', doc: '' });
  const [file, setFile] = useState(null);
  const [p, setP] = useState(null);
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState('');
  useEffect(() => { if (!user) requireAuth({ type: 'go', href: '#/business-settings' }, go, true); }, [user]);
  useEffect(() => { setP(myOrg ? { name: myOrg.name, city: myOrg.city || '', about: myOrg.about || '' } : { name: '', city: '', about: '' }); }, [myOrg && myOrg.id, myOrg && myOrg.name]);
  useEffect(() => { if (verif.status === 'rejected' && verif.data) setV((x) => ({ ...x, legal: verif.data.legal || '', phone: verif.data.phone || '', domain: verif.data.domain || '' })); }, [verif.status]);
  if (!user || !p) return null;
  const form = verif.status === 'none' || verif.status === 'rejected';
  const locked = verif.status === 'verified' || verif.status === 'submitted';
  const dirty = !myOrg || p.name !== myOrg.name || p.city !== (myOrg.city || '') || p.about !== (myOrg.about || '');
  return (
    <div className="page">
      <div><h1>Business settings</h1><p className="muted" style={{ margin: '4px 0 0' }}>{myOrg ? myOrg.name : 'Set up the name buyers see on your listings.'}</p></div>
      <form className="panel" noValidate onSubmit={async (e) => { e.preventDefault(); if (p.name.trim().length < 2) { setErr('Add a business name buyers will recognise.'); return; } setBusy('org'); setErr(''); try { await saveOrg({ name: p.name.trim(), city: p.city.trim(), about: p.about.trim() }); } catch (x) { setErr(String(x.message || x)); } setBusy(''); }}>
        <h2>Public profile</h2>
        <Field id="bp-n" label="Business name" hint={locked ? <><Icon n="lock" size={13} />Locked while verified or in review. Ask Contact support to change it.</> : 'Shown on every listing you post'}><input id="bp-n" className="input full" value={p.name} disabled={locked} maxLength={80} onChange={(e) => setP({ ...p, name: e.target.value })} /></Field>
        <Field id="bp-c" label="City"><input id="bp-c" className="input full" value={p.city} maxLength={60} placeholder="Evansville, IN" onChange={(e) => setP({ ...p, city: e.target.value })} /></Field>
        <Field id="bp-a" label="About" hint="What you sell or service, and the area you cover"><textarea id="bp-a" className="textarea" value={p.about} maxLength={600} onChange={(e) => setP({ ...p, about: e.target.value })} /></Field>
        <button className="btn secondary" style={{ alignSelf: 'flex-start' }} disabled={!dirty || busy === 'org'}>{busy === 'org' ? 'Saving…' : 'Save profile'}</button>
      </form>
      <section className="panel">
        <div className="row2" style={{ justifyContent: 'space-between', flexWrap: 'wrap' }}><h2>Verified business</h2>
          <span className={'badge' + (verif.status === 'verified' ? ' ok' : verif.status === 'submitted' ? ' warn' : verif.status === 'rejected' ? ' bad' : '')}>{{ none: 'Not verified', submitted: 'In review', verified: 'Verified', rejected: 'Not approved' }[verif.status]}</span></div>
        {form && <ul className="checklist" aria-label="Verification checks">{[['Legal name', v.legal.trim()], ['Business phone', v.phone.trim()], ['Website or domain', v.domain.trim()], ['Registration document', v.doc]].map(([k, ok]) => <li key={k} className={ok ? 'ok' : ''}><Icon n={ok ? 'check' : 'circle'} size={16} />{k}</li>)}</ul>}
        <p className="muted" style={{ margin: 0, fontSize: 12, lineHeight: '16px' }}>Earned by passing checks. It can't be bought, and paid plans don't speed it up.</p>
        {verif.status === 'verified' && <><ul style={{ margin: 0, paddingLeft: 20 }}>{verif.checks.map((c) => <li key={c}>{c}</li>)}</ul>{verif.expires && <p className="muted" style={{ margin: 0 }}>Valid until {fmtDate(verif.expires)}.</p>}</>}
        {verif.status === 'submitted' && <p style={{ margin: 0 }}>We're reviewing your documents. You'll see the result here.</p>}
        {verif.status === 'rejected' && <div className="alert" role="alert"><span>{verif.reason} Update your details and submit again.</span></div>}
        {form && (
          <form className="stack" noValidate onSubmit={async (e) => { e.preventDefault(); if (!v.legal.trim() || !v.phone.trim() || !v.domain.trim() || !v.doc) { setErr('Fill in every field and attach your registration document.'); return; } setErr(''); setBusy('v'); try { await submitVerif(v, file); } catch (x) { setErr(String(x.message || x)); } setBusy(''); }}>
            <Field id="vb-l" label="Legal business name" required><input id="vb-l" className="input full" value={v.legal} onChange={(e) => setV({ ...v, legal: e.target.value })} /></Field>
            <Field id="vb-p" label="Business phone" required hint={<><Icon n="lock" size={13} />Used once to confirm. Never shown publicly</>}><input id="vb-p" className="input full" inputMode="tel" value={v.phone} onChange={(e) => setV({ ...v, phone: e.target.value })} /></Field>
            <Field id="vb-d" label="Business website or email domain" required><input id="vb-d" className="input full" value={v.domain} onChange={(e) => setV({ ...v, domain: e.target.value })} /></Field>
            <Field id="vb-f" label="Registration document" required hint={v.doc ? `Selected: ${v.doc}. Private, reviewed by staff only.` : 'Articles of organization, state registration or business licence. PDF or photo, up to 20 MB. Private, reviewed by staff only.'}><input id="vb-f" type="file" accept="application/pdf,image/*" onChange={(e) => { const f = e.target.files[0]; if (f && f.size > 20971520) { setErr('That file is over 20 MB.'); e.target.value = ''; return; } setFile(f || null); setV({ ...v, doc: f ? f.name : '' }); }} /></Field>
            {err && <div className="err" role="alert">{err}</div>}
            <button className="btn" disabled={busy === 'v'}>{busy === 'v' ? 'Submitting…' : 'Submit for review'}</button>
          </form>
        )}
        {!form && err && <div className="err" role="alert">{err}</div>}
      </section>
    </div>
  );
}

function Admin({ route, go }) {
  const { user, requireAuth, isAdmin, verifQueue, decideVerif, openVerifDoc, reports, decideReport, listings, orgs, events, invoices, audit, plan, promos, convs, metrics, impr, tickets, closeTicket, live } = useApp();
  const [reason, setReason] = useState({});
  useEffect(() => { if (!user) requireAuth({ type: 'go', href: '#/admin' }, go, true); }, [user]);
  if (!user) return null;
  if (!isAdmin) return <div className="page"><div className="empty"><h2>Admin only</h2><p>PERMISSION_DENIED. This area is limited to staff accounts. In this demo, sign in with an email that contains "admin" (for example admin@vendgrid.test).</p><a className="btn" href="#/">Back to marketplace</a></div></div>;
  const open = reports.filter((r) => r.status === 'open');
  const pendingVerif = verifQueue.filter((q) => q.status === 'submitted').length;
  const L = (id) => listings.find((l) => l.id === id);
  const tabs = [['verification', `Verification (${pendingVerif})`], ['reports', `Reports (${open.length})`], ['billing', 'Billing'], ['metrics', 'Metrics'], ['audit', 'Audit']];
  return (
    <div className="page wide">
      <h1>Admin</h1>
      <div className="row2" style={{ gap: 32, flexWrap: 'wrap' }}>
        <div><div className="price-lg">{listings.filter((l) => l.status === 'published').length}</div><div className="muted">Active listings</div></div>
        <div><div className="price-lg">{convs.length}</div><div className="muted">Conversations</div></div>
        <div><div className="price-lg">{open.length}</div><div className="muted">Open reports</div></div>
      </div>
      <Tabs tabs={tabs} value={route.tab} onChange={(t) => go('#/admin?tab=' + t, true)} />
      {route.tab === 'verification' && (verifQueue.length ? <div className="stack">{verifQueue.map((q) => (
        <div className="panel" key={q.orgId}>
          <div className="row2" style={{ justifyContent: 'space-between', flexWrap: 'wrap' }}><h3 style={{ margin: 0 }}>{(orgs[q.orgId] || {}).name || q.orgId}</h3><span className={'badge' + (q.status === 'verified' ? ' ok' : q.status === 'submitted' ? ' warn' : ' bad')}>{{ submitted: 'Waiting for review', verified: 'Verified', rejected: 'Not approved' }[q.status]}</span></div>
          <dl className="facts" style={{ margin: 0 }}>{[['Legal name', q.legal], ['Phone', q.phone], ['Domain', q.domain], ['Submitted', fmtDate(q.at)]].map(([k, x]) => <div className="r" key={k}><dt>{k}</dt><dd>{x}</dd></div>)}</dl>
          {q.docPath || q.docName ? <button className="btn secondary sm" style={{ alignSelf: 'flex-start' }} onClick={() => openVerifDoc(q)}><Icon n="file" size={16} />Open registration document</button> : <p className="muted" style={{ margin: 0 }}>No document attached.</p>}
          {q.status === 'submitted' ? <>
            <Field id={'rj-' + q.orgId} label="Reason if not approved" hint="The business sees this"><input id={'rj-' + q.orgId} className="input full" value={reason[q.orgId] || ''} onChange={(e) => setReason({ ...reason, [q.orgId]: e.target.value })} /></Field>
            <div className="row2"><button className="btn" onClick={() => decideVerif(q.orgId, true)}>Approve</button><button className="btn secondary" onClick={() => decideVerif(q.orgId, false, reason[q.orgId])}>Not approved</button></div>
          </> : q.status === 'rejected' && q.reason ? <p className="muted" style={{ margin: 0 }}>Reason given: {q.reason}</p> : q.expires ? <p className="muted" style={{ margin: 0 }}>Valid until {fmtDate(q.expires)}</p> : null}
        </div>))}</div> : <div className="empty"><p>No verification requests yet. Businesses apply from Business settings.</p></div>)}
      {route.tab === 'reports' && tickets.length > 0 && <div className="stack"><h3>Support requests</h3><div className="list">{tickets.map((t) => <div className="item" key={t.id} style={{ cursor: 'default', flexWrap: 'wrap' }}><div className="t"><b>{t.topic}{t.status === 'closed' ? ' · closed' : ''}</b><span className="muted">{t.email}{t.at ? ' · ' + fmtDate(t.at) : ''} · {t.message}</span></div>{t.status !== 'closed' && closeTicket && <button className="btn ghost sm" onClick={() => closeTicket(t.id)}>Mark done</button>}</div>)}</div><h3>Listing reports</h3></div>}
      {route.tab === 'reports' && (reports.length ? <div className="list">{reports.map((r) => (
        <div className="item" key={r.id} style={{ cursor: 'default', flexWrap: 'wrap' }}>
          <div className="t"><b>{(L(r.listingId) || {}).title || 'Listing'}</b><span className="muted">{r.reason} · by {r.by} · {r.status}</span></div>
          {r.status === 'open' && <><button className="btn secondary sm" onClick={() => decideReport(r.id, 'withdraw')}>Withdraw listing</button><button className="btn ghost sm" onClick={() => decideReport(r.id, 'dismiss')}>Dismiss</button></>}
        </div>))}</div> : <div className="empty"><p>No reports. Use Report listing on any detail page to create one.</p></div>)}
      {route.tab === 'billing' && (
        <div className="stack"><div className="panel"><b>Professional:</b> {plan.status} · <b>Sponsored placements:</b> {promos.filter((p) => p.status === 'active').length} active, {promos.filter((p) => p.status === 'pending').length} pending</div>
          <h3>Processed payment events</h3>
          {events.length ? <div className="list">{events.map((e) => <div className="item" key={e.id} style={{ cursor: 'default' }}><div className="t"><b>{e.type}</b><span className="muted">{e.id} · {new Date(e.at).toLocaleTimeString()}</span></div></div>)}</div> : <p className="muted" style={{ margin: 0 }}>No events yet. {invoices.length} invoices.</p>}
        </div>)}
      {route.tab === 'metrics' && (
        <div className="stack">
          <div className="list">{Object.keys(metrics).length ? Object.entries(metrics).map(([k, v]) => <div className="item" key={k} style={{ cursor: 'default' }}><div className="t"><b>{metricLabel(k)}</b><span className="muted">{k}</span></div><b>{v.toLocaleString('en-US')}</b></div>) : <div className="item" style={{ cursor: 'default' }}><span className="muted">No activity yet. Browse, search or send an inquiry to see counts here.</span></div>}</div>
          <h3>Sponsored placements</h3>
          {listings.filter((l) => l.sponsored).length ? <div className="list">{listings.filter((l) => l.sponsored).map((l) => { const im = impr[l.id] || 0, iq = convs.filter((c) => c.listingId === l.id).length; return <div className="item" key={l.id} style={{ cursor: 'default' }}><div className="t"><b>{l.title}</b><span className="muted">{im} {im === 1 ? 'impression' : 'impressions'} · {iq} {iq === 1 ? 'inquiry' : 'inquiries'}{im ? ` · ${((iq / im) * 100).toFixed(1)}% inquiry rate` : ''}</span></div></div>; })}</div> : <p className="muted" style={{ margin: 0 }}>No sponsored listings are live.</p>}
        </div>)}
      {route.tab === 'audit' && (audit.length ? <div className="list">{audit.map((a, i) => <div className="item" key={i} style={{ cursor: 'default' }}><div className="t"><b>{a.msg}</b><span className="muted">{a.by} · {new Date(a.at).toLocaleString()}</span></div></div>)}</div> : <div className="empty"><p>No audit events yet.</p></div>)}
      <p className="muted" style={{ margin: 0, fontSize: 12 }}>{live ? 'Verification, reports and support requests are live, and the database enforces staff access. Billing, metrics and audit are still sample data.' : 'Demo only: in production these roles are enforced on the server and every admin read is logged.'}</p>
    </div>
  );
}

function Business({ route }) {
  const { orgs, listings } = useApp();
  const org = Object.values(orgs).find((o) => o.slug === route.slug);
  if (!org) return <div className="empty"><h1>We couldn’t find that seller</h1><a className="btn" href="#/">Keep browsing</a></div>;
  const items = listings.filter((l) => l.org === org.id && l.status === 'published');
  return (
    <div className="page wide">
      <div className="stack" style={{ gap: 8 }}><h1>{org.name}</h1><div className="row2">{org.verified ? <Verified org={org} /> : <span className="badge">Not verified</span>}<span className="muted">{org.city}</span></div><p className="muted" style={{ margin: 0 }}>{org.about}</p></div>
      <h2>Active listings</h2>
      {items.length ? <div className="grid">{items.map((l) => <ListingCard key={l.id} l={l} />)}</div> : <div className="empty"><p>No active listings right now.</p></div>}
    </div>
  );
}

/* A sign-in can finish in another tab or app, so what the person was doing waits in localStorage for up to an hour. */
const PEND = 'vgPending';
const safeNext = (n) => (typeof n === 'string' && /^#\/[^\s]*$/.test(n) ? n : '');
const keepPending = (a, next) => { try { localStorage.setItem(PEND, JSON.stringify({ a: a || null, next: safeNext(next), t: Date.now() })); } catch (e) { /* storage blocked */ } };
const takePending = () => { try { const r = JSON.parse(localStorage.getItem(PEND) || 'null'); localStorage.removeItem(PEND); return r && Date.now() - r.t < 36e5 ? r : null; } catch (e) { return null; } };
const MAIL_APPS = { 'gmail.com': ['Gmail', 'https://mail.google.com/'], 'googlemail.com': ['Gmail', 'https://mail.google.com/'], 'outlook.com': ['Outlook', 'https://outlook.live.com/mail/'], 'hotmail.com': ['Outlook', 'https://outlook.live.com/mail/'], 'live.com': ['Outlook', 'https://outlook.live.com/mail/'], 'yahoo.com': ['Yahoo Mail', 'https://mail.yahoo.com/'], 'icloud.com': ['iCloud Mail', 'https://www.icloud.com/mail'], 'me.com': ['iCloud Mail', 'https://www.icloud.com/mail'], 'proton.me': ['Proton Mail', 'https://mail.proton.me/'], 'protonmail.com': ['Proton Mail', 'https://mail.proton.me/'] };
const TYPOS = { 'gmial.com': 'gmail.com', 'gmai.com': 'gmail.com', 'gmail.co': 'gmail.com', 'gmail.con': 'gmail.com', 'gamil.com': 'gmail.com', 'hotmial.com': 'hotmail.com', 'hotmail.con': 'hotmail.com', 'outlok.com': 'outlook.com', 'outlook.con': 'outlook.com', 'yaho.com': 'yahoo.com', 'yahoo.con': 'yahoo.com', 'icloud.con': 'icloud.com' };
const emailTypo = (e) => { const [u, d] = e.trim().toLowerCase().split('@'); return d && TYPOS[d] ? `${u}@${TYPOS[d]}` : ''; };

function Login({ route, go }) {
  const { signIn, live, sendMagicLink, user, authFail } = useApp();
  const [email, setEmail] = useState('');
  const [err, setErr] = useState('');
  const [sent, setSent] = useState(false);
  const [busy, setBusy] = useState(false);
  const [wait, setWait] = useState(0);
  useEffect(() => { if (wait <= 0) return; const t = setTimeout(() => setWait(wait - 1), 1000); return () => clearTimeout(t); }, [wait]);
  const linkErr = useMemo(() => { try { const h = new URLSearchParams((location.hash || '').replace(/^#\/?/, '').replace(/^[^&=]*(?=&)/, '')); const q = new URLSearchParams(location.search); return h.get('error_description') || q.get('error_description') || ''; } catch (e) { return ''; } }, []);
  const send = async () => { setBusy(true); setErr(''); try { await sendMagicLink(email.trim().toLowerCase(), route.next); setSent(true); setWait(30); } catch (x) { setErr(/rate|seconds|too many/i.test(x.message) ? 'Too many links requested. Wait a minute and try again.' : 'We couldn’t send the link. Try again in a moment.'); } setBusy(false); };
  if (live) {
    if (user) return <div className="page" style={{ maxWidth: 420, margin: '0 auto' }}><h1>You’re signed in</h1><p className="muted" style={{ margin: 0 }}>{user.email}</p><a className="btn" href={route.next || '#/'}>Continue</a></div>;
    if (sent) return (
      <div className="page" style={{ maxWidth: 420, margin: '0 auto' }}>
        <span className="caticon" style={{ background: 'var(--gray-100)' }}><Icon n="send" size={24} /></span>
        <h1>Check your email</h1>
        <p style={{ margin: 0 }}>We sent a sign-in link to <b>{email}</b>. Open it on this device to finish signing in.</p>
        <p className="muted" style={{ margin: 0 }}>It can take a minute. Check your spam folder too. The link works once and expires in an hour.</p>
        {MAIL_APPS[email.trim().toLowerCase().split('@')[1]] && <a className="btn secondary" href={MAIL_APPS[email.trim().toLowerCase().split('@')[1]][1]} target="_blank" rel="noopener noreferrer"><Icon n="ext" size={16} />Open {MAIL_APPS[email.trim().toLowerCase().split('@')[1]][0]}</a>}
        <div className="row2" style={{ flexWrap: 'wrap' }}>
          <button className="btn secondary" disabled={wait > 0 || busy} onClick={send}>{busy ? 'Sending…' : wait > 0 ? `Send again in ${wait}s` : 'Send again'}</button>
          <button className="btn ghost" onClick={() => { setSent(false); setErr(''); }}>Use a different email</button>
        </div>
        {err && <div className="err" role="alert">{err}</div>}
      </div>
    );
    return (
      <form className="page" style={{ maxWidth: 420, margin: '0 auto' }} noValidate onSubmit={(e) => { e.preventDefault(); if (!/^\S+@\S+\.\S+$/.test(email)) { setErr('That email doesn’t look right. Try name@example.com.'); return; } send(); }}>
        <div><h1>Welcome to VendGrid</h1><p className="muted" style={{ margin: '4px 0 0' }}>Browse freely. Sign in when you’re ready to save, message or post.</p></div>
        {authFail && !linkErr && !err && <div className="alert" role="alert"><span>That link couldn’t sign you in here. Links only work in the browser where you asked for them, and only once. Enter your email to get a new one, then open it in this browser.</span></div>}
        {linkErr && !err && <div className="alert" role="alert"><span>{/expired|invalid/i.test(linkErr) ? 'That sign-in link expired or was already used. Enter your email for a new one.' : linkErr.replace(/\+/g, ' ')}</span></div>}
        <Field id="em" label="Email" error={err}><input id="em" className={'input full' + (err ? ' bad' : '')} type="email" autoComplete="email" inputMode="email" autoFocus value={email} onChange={(e) => { setEmail(e.target.value); setErr(''); }} /></Field>
        {emailTypo(email) && <p className="muted" style={{ margin: 0 }} role="status">Did you mean <button type="button" className="linkbtn" onClick={() => { setEmail(emailTypo(email)); setErr(''); }}>{emailTypo(email)}</button>?</p>}
        <button className="btn block" disabled={busy}>{busy ? 'Sending…' : 'Email me a sign-in link'}</button>
        <p className="muted iconline" style={{ fontSize: 12 }}><Icon n="lock" size={14} />No password needed. The link signs you in on this device.</p>
        <p className="muted" style={{ margin: 0, fontSize: 12 }}>By continuing you confirm you’re 18 or older and agree to the <a className="u" href="#/legal?doc=terms">Terms</a> and <a className="u" href="#/legal?doc=privacy">Privacy policy</a>.</p>
      </form>
    );
  }
  return (
    <form className="page" style={{ maxWidth: 420, margin: '0 auto' }} noValidate onSubmit={(e) => { e.preventDefault(); if (!/^\S+@\S+\.\S+$/.test(email)) { setErr('That email doesn’t look right. Try name@example.com.'); return; } const nx = signIn(email); go(nx || route.next || '#/', true); }}>
      <div><h1>Welcome to VendGrid</h1><p className="muted" style={{ margin: '4px 0 0' }}>Browse freely. Sign in when you’re ready to save, message or post.</p></div>
      <Field id="em" label="Email" error={err}><input id="em" className={'input full' + (err ? ' bad' : '')} type="email" autoComplete="email" value={email} onChange={(e) => { setEmail(e.target.value); setErr(''); }} /></Field>
      <button className="btn block">Continue</button>
      <p className="muted" style={{ margin: 0, fontSize: 12 }}>Demo sign-in: no password or email is sent. Production uses managed authentication.</p>
      <p className="muted" style={{ margin: 0, fontSize: 12 }}>By continuing you confirm you’re 18 or older and agree to the <a className="u" href="#/legal?doc=terms">Terms</a> and <a className="u" href="#/legal?doc=privacy">Privacy policy</a>.</p>
    </form>
  );
}

/* ───────────── app ───────────── */
// A crawlable path (/listing/12-…, /vending-routes-for-sale, /terms) opens the matching screen, then the
// address bar moves to the app's own form so in-app navigation keeps working from the site root.
let BOOT = null;
function bootAddr() {
  if (BOOT) return BOOT;
  if (typeof location === 'undefined') return (BOOT = '#/');
  const fromHash = fromAddr(location.hash);
  const fromPath = !location.hash || location.hash === '#' ? pathToRoute(location.pathname) : null;
  const unknownPath = !fromPath && (!location.hash || location.hash === '#') && !['/', '/index.html', ''].includes(location.pathname.replace(/\/+$/, '') || '/');
  BOOT = fromPath || (unknownPath ? '#/404' : fromHash);
  if (fromPath || unknownPath) { try { history.replaceState(null, '', '/' + location.search + toAddr(fromPath)); } catch (e) { /* sandboxed */ } }
  return BOOT;
}
const UNKNOWN_ORG = { id: 'unknown', name: 'Independent seller', slug: '', city: '', about: '', verified: false };
const withFallbackOrg = (o) => new Proxy(o, { get: (t, k) => (k in t || typeof k !== 'string' ? t[k] : UNKNOWN_ORG) });

export default function App() {
  const [hash, setHash] = useState(bootAddr);
  const [listings, setListings] = usePersist('listings', SEED);
  const [user, setUser] = usePersist('user', null);
  const [mapFull, setMapFull] = useState(false); // desktop map only: hides the side menu for a full-width map; never remembered, and ends when you leave the map
  const [favs, setFavs] = usePersist('favs', () => new Set(), (x) => [...x], (a) => new Set(a));
  const [searches, setSearches] = usePersist('searches', []);
  const [convs, setConvs] = usePersist('convs', []);
  const [drafts, setDrafts] = usePersist('drafts', {});
  const [prefLoc, setPrefLoc] = usePersist('prefLoc', '');
  const [themeSel, setThemeS] = usePersist('themeSel', 'system');
  const sysDark = typeof window !== 'undefined' && window.matchMedia ? window.matchMedia('(prefers-color-scheme: dark)').matches : false;
  const theme = themeSel === 'system' ? (sysDark ? 'dark' : 'light') : themeSel;
  const [toast, setToast] = useState(null);
  const [plan, setPlan] = usePersist('plan', { status: 'none', ref: null });
  const [promos, setPromos] = usePersist('promos', []);
  const [verif, setVerif] = usePersist('verif', { status: 'none' });
  const [reports, setReports] = usePersist('reports', []);
  const [events, setEvents] = usePersist('events', []);
  const [invoices, setInvoices] = usePersist('invoices', []);
  const [audit, setAudit] = usePersist('audit', []);
  const [views, setViews] = usePersist('views', {});
  const [priv, setPriv] = usePersist('priv', PRIVATE_SEED);
  const [metrics, setMetrics] = usePersist('metrics', {});
  const [impr, setImpr] = usePersist('impr', {});
  const [tickets, setTickets] = usePersist('tickets', []);
  // ── live backend (Supabase). 'checking' until we know; 'live' or 'demo' after. ──
  const [mode, setMode] = useState('checking');
  const [liveListings, setLiveListings] = useState([]);
  const [liveOrgs, setLiveOrgs] = useState({});
  const [liveUser, setLiveUser] = useState(null);
  const [liveFavs, setLiveFavs] = useState(new Set());
  const [liveSearches, setLiveSearches] = useState([]);
  const [liveConvs, setLiveConvs] = useState([]);
  const [profile, setProfile] = useState(null);
  const live = mode === 'live';
  const [seenAt, setSeenAt] = usePersist('seenAt', {});
  const [liveReports, setLiveReports] = useState([]);
  const [liveVerif, setLiveVerif] = useState(null);
  const [liveVerifQueue, setLiveVerifQueue] = useState([]);
  const [liveTickets, setLiveTickets] = useState([]);
  const [liveNotes, setLiveNotes] = useState([]);
  const [liveStats, setLiveStats] = useState({});
  const [demoNotes, setDemoNotes] = usePersist('notes', []);
  const [dmOrg, setDmOrg] = usePersist('dmOrg', {});
  const [rooms, setRooms] = usePersist('rooms', DEMO_ROOMS);
  const roomsRef = useRef(rooms); roomsRef.current = rooms;
  const blobs = useRef({});
  const seenImpr = useRef(new Set());
  const pending = useRef(null);
  const hadCode = useRef(false);
  const userOut = useRef(false);
  const liveUserRef = useRef(null);
  const [authFail, setAuthFail] = useState(false);
  const stack = useRef([bootAddr()]);
  const toastT = useRef(null);
  const nextId = useRef(Math.max(1000, ...listings.map((l) => (typeof l.id === 'number' ? l.id : 0))));
  const route = useMemo(() => parseHash(hash), [hash]);

  useEffect(() => {
    const h = () => { const st = stack.current; const norm = (x) => (x || '').replace(/^#/, ''); if (norm(toAddr(st[st.length - 1])) === norm(location.hash)) return; /* our own navigation: keep full in-memory route (query params) */ const n = fromAddr(location.hash); if (st[st.length - 2] === n) st.pop(); else if (st[st.length - 1] !== n) st.push(n); setHash(n); };
    window.addEventListener('hashchange', h); window.addEventListener('popstate', h);
    return () => { window.removeEventListener('hashchange', h); window.removeEventListener('popstate', h); };
  }, []);
  const go = useCallback((to, replace) => {
    const st = stack.current;
    if (to === 'back') { st.pop(); const prev = st[st.length - 1] || '#/'; setHash(prev); try { history.replaceState(null, '', toAddr(prev)); } catch (e) {} window.scrollTo(0, 0); return; }
    if (replace) st[st.length - 1] = to; else st.push(to);
    if (st.length > 50) st.shift();
    setHash(to);
    try { if (replace) history.replaceState(null, '', toAddr(to)); else location.hash = toAddr(to); } catch (e) { /* sandboxed: state still works in memory */ }
    if (!replace) window.scrollTo(0, 0);
  }, []);
  useEffect(() => { if (themeSel !== 'system') document.documentElement.setAttribute('data-theme', themeSel); }, []);
  const setTheme = (t) => { setThemeS(t); if (t === 'system') document.documentElement.removeAttribute('data-theme'); else document.documentElement.setAttribute('data-theme', t); };
  useEffect(() => {
    const T = { settings: 'Settings', activity: 'Activity', browse: route.query && route.query.cat !== 'all' ? `${TYPES[route.query.cat].label} for sale & lease` : 'Vending machines, parts, locations, routes & services', post: 'Post a listing', saved: 'Saved', messages: 'Messages', mine: 'My listings', account: 'Account', billing: 'Billing', bizsettings: 'Business settings', admin: 'Admin', login: 'Sign in', legal: 'Help & policies', inquire: 'Contact seller' };
    if (route.name === 'info') { const t = (INFO[route.doc] || INFO.about).title; document.title = /VendGrid/.test(t) ? t : t + ' · VendGrid'; }
    else if (route.name === 'legal' && route.doc === 'support') document.title = 'Contact support · VendGrid';
    else if (route.name === 'sellers') document.title = 'Sellers · VendGrid';
    else if (route.name === 'notfound') document.title = 'Page not found · VendGrid';
    else if (route.name !== 'listing' && route.name !== 'business') document.title = (T[route.name] || 'VendGrid') + ' · VendGrid';
  }, [route.name, route.doc, route.query && route.query.cat]);

  const orgs = useMemo(() => withFallbackOrg(live ? liveOrgs : { ...ORGS, dm: { ...ORGS.dm, ...dmOrg, verified: verif.status === 'verified' } }), [live, liveOrgs, verif.status, dmOrg]);
  const myOrg = live ? (profile && profile.org_id && liveOrgs[profile.org_id]) || null : orgs.dm;
  const srcListings = live ? liveListings : listings;
  const liveConvsSeen = useMemo(() => liveConvs.map((c) => ({ ...c, unread: c.msgs.filter((m) => m.from === 'them' && m.at > (seenAt[c.id] || 0)).length })), [liveConvs, seenAt]);
  const curUser = live ? liveUser : user, curFavs = live ? liveFavs : favs, curSearches = live ? liveSearches : searches, curConvs = live ? liveConvsSeen : convs;
  const allListings = useMemo(() => srcListings.map((l) => (l.status === 'published' && promos.some((p) => p.listingId === l.id && promoLive(p)) ? { ...l, sponsored: true } : l)), [srcListings, promos]);
  const promosView = useMemo(() => promos.map((p) => { const l = listings.find((x) => x.id === p.listingId); return p.status === 'active' && (!l || l.status !== 'published') ? { ...p, status: 'suspended' } : p; }), [promos, listings]);
  const isPro = plan.status === 'active' || (plan.status === 'canceled' && plan.until > Date.now());
  const isAdmin = live ? !!profile && profile.role === 'admin' : !!user && /admin/i.test(user.email.split('@')[0]);
  const log = (msg) => setAudit((x) => [{ at: Date.now(), by: user ? user.email : 'system', msg }, ...x]);
  const notify = useCallback((msg, undo) => {
    clearTimeout(toastT.current);
    setToast({ msg, undo });
    toastT.current = setTimeout(() => setToast(null), undo ? 6000 : 3500);
  }, []);
  const unread = curConvs.reduce((n, c) => n + (c.unread || 0), 0);

  const liveErr = (e) => notify(String(e && e.message || e).replace(/^.*?: /, '') || 'Something went wrong. Try again.');
  const refreshCatalog = async (uid) => { const c = await api.loadCatalog(uid); setLiveOrgs(c.orgs); setLiveListings(c.listings); return c; };
  const refreshConvs = async (uid, c) => { try { setLiveConvs(await api.loadConversations(uid, c ? c.orgs : liveOrgs, c ? c.listings : liveListings)); } catch (e) { /* keep last good copy */ } };
  const loadStaff = () => { api.loadReports().then(setLiveReports).catch(() => {}); api.loadVerifQueue().then(setLiveVerifQueue).catch(() => {}); api.loadSupport().then(setLiveTickets).catch(() => {}); };
  const onSession = async (session) => {
    const u = session && session.user ? { id: session.user.id, email: session.user.email, name: (session.user.email || '').split('@')[0] } : null;
    setLiveUser(u); liveUserRef.current = u;
    const c = await refreshCatalog(u && u.id).catch(() => null);
    if (!u) { setLiveFavs(new Set()); setLiveSearches([]); setLiveConvs([]); setProfile(null); setLiveVerif(null); setLiveVerifQueue([]); setLiveTickets([]); setLiveReports([]); setLiveNotes([]); setLiveStats({}); return; }
    try { const m = await api.loadMine(u.id); setProfile(m.profile); setLiveFavs(m.favs); setLiveSearches(m.searches); if (m.profile && m.profile.role === 'admin') loadStaff(); if (m.profile && m.profile.org_id) api.loadVerification(m.profile.org_id).then(setLiveVerif).catch(() => {}); else setLiveVerif(null); } catch (e) { /* signed in, but extras failed */ }
    await refreshConvs(u.id, c);
    api.loadNotes().then(setLiveNotes).catch(() => {});
    api.loadStats().then(setLiveStats).catch(() => {});
    const stored = takePending();
    const p = pending.current || (stored && stored.a) || null; pending.current = null;
    const back = (stored && stored.next) || (p && p.next) || '';
    if (p && p.type === 'save') { setLiveFavs((f) => new Set(f).add(p.id)); api.addFav(u.id, p.id).catch(liveErr); }
    if (p && p.type === 'saveSearch') saveSearch(p.query, true);
    const top = stack.current[stack.current.length - 1] || '#/';
    if (p && p.type === 'go') go(p.href, true); else if (top.startsWith('#/login')) go(back || '#/', true); else if (back && top === '#/' && stored) go(back, true);
    if (hadCode.current) { hadCode.current = false; notify(`Signed in as ${u.email}`); }
  };
  useEffect(() => {
    let off = null, alive = true;
    api.probe().then(async (ok) => {
      if (!alive) return;
      if (!ok) { setMode('demo'); return; }
      try {
        const cameWithCode = new URL(location.href).searchParams.has('code');
        hadCode.current = cameWithCode;
        const { data } = await api.sb().auth.getSession();
        if (cameWithCode && !data.session) { hadCode.current = false; setAuthFail(true); if (!location.hash || location.hash === '#' || location.hash === '#/') go('#/login', true); }
        await onSession(data.session);
        try { const u = new URL(location.href); if (u.searchParams.has('code')) { u.searchParams.delete('code'); history.replaceState(null, '', u.pathname + u.search + u.hash); } } catch (e) { /* ignore */ }
        setMode('live');
        off = api.sb().auth.onAuthStateChange((ev, session) => {
          if (ev === 'SIGNED_OUT' && liveUserRef.current && !userOut.current) notify('You were signed out. Sign in again to continue.');
          if (ev === 'SIGNED_OUT') userOut.current = false;
          if (ev === 'SIGNED_IN' || ev === 'SIGNED_OUT') onSession(session);
        }).data.subscription;
      } catch (e) { setMode('demo'); }
    });
    return () => { alive = false; off && off.unsubscribe(); };
  }, []);
  // light polling for new messages while signed in
  useEffect(() => { if (!live || !liveUser) return; const t = setInterval(() => { refreshConvs(liveUser.id); api.loadNotes().then(setLiveNotes).catch(() => {}); api.loadStats().then(setLiveStats).catch(() => {}); }, 20000); return () => clearInterval(t); }, [live, liveUser, liveOrgs, liveListings]);

  const act = (a) => {
    if (a.type === 'save') setFavs((f) => new Set(f).add(a.id));
    if (a.type === 'saveSearch') saveSearch(a.query, true);
  };
  const requireAuth = (action, goFn, silent) => {
    pending.current = action;
    const here = action.type === 'go' ? action.href : stack.current[stack.current.length - 1] || '#/';
    keepPending(action, here);
    goFn(`#/login?next=${enc(here)}`, !!silent);
  };
  const sendMagicLink = async (email, next) => {
    if (!pending.current && safeNext(next)) keepPending(null, next);
    const { error } = await api.sb().auth.signInWithOtp({ email, options: { emailRedirectTo: location.origin + location.pathname } });
    if (error) throw error;
  };
  const signIn = (email) => {
    const u = { email, name: email.split('@')[0] };
    setUser(u);
    // seed one inbound inquiry so owner flows are testable
    setConvs((c) => c.length ? c : [{ id: 'c-seed', listingId: 104, me: 'owner', other: 'Hoosier Vend Supply', status: 'open', unread: 1, blocked: false, msgs: [{ from: 'them', at: Date.now() - 3 * 36e5, text: 'Is the Vendo 721 still available? Could you do $550 if I pick it up this week?' }] }]);
    const p = pending.current; pending.current = null;
    if (p && p.type !== 'go') { if (p.type === 'save') setFavs((f) => new Set(f).add(p.id)); if (p.type === 'saveSearch') saveSearch(p.query, true); return p.type === 'saveSearch' ? encodeQuery(p.query) : null; }
    return p && p.type === 'go' ? p.href : null;
  };
  const changeEmail = async (email) => { if (live) { await api.changeEmail(email); return; } setUser((u) => ({ ...u, email, name: email.split('@')[0] })); };
  const signOutAll = async () => { if (live) { userOut.current = true; try { await api.signOutEverywhere(); } catch (e) { userOut.current = false; throw e; } return; } setUser(null); setFavs(new Set()); setConvs([]); setSearches([]); };
  const exportData = async () => {
    if (live) return api.exportMyData(liveUser);
    return { exported_at: new Date().toISOString(), account: user, listings: listings.filter((l) => l.mine), saved_listings: [...favs], saved_searches: searches, conversations: convs, document_room: rooms, notifications: demoNotes };
  };
  const deleteData = async () => {
    if (live) { await api.deleteMyData(liveUser); setLiveUser(null); setLiveFavs(new Set()); setLiveSearches([]); setLiveConvs([]); setProfile(null); setLiveVerif(null); setLiveNotes([]); await refreshCatalog(null).catch(() => {}); return; }
    store.clear(); location.hash = ''; location.reload();
  };
  const signOut = () => { try { localStorage.removeItem('vgPending'); } catch (e) { /* storage blocked */ } if (live) { userOut.current = true; api.sb().auth.signOut().catch(() => { userOut.current = false; }); notify('Signed out'); return; } setUser(null); setFavs(new Set()); setConvs([]); setSearches([]); notify('Signed out'); };
  const toggleFav = (id) => {
    if (!curUser) { pending.current = { type: 'save', id }; go(`#/login?next=${enc(stack.current[stack.current.length - 1] || '#/')}`); return; }
    if (live) { const had = liveFavs.has(id); setLiveFavs((f) => { const n = new Set(f); had ? n.delete(id) : n.add(id); return n; }); (had ? api.removeFav(liveUser.id, id) : api.addFav(liveUser.id, id)).catch((e) => { setLiveFavs((f) => { const n = new Set(f); had ? n.add(id) : n.delete(id); return n; }); liveErr(e); }); return; }
    setFavs((f) => { const n = new Set(f); n.has(id) ? n.delete(id) : n.add(id); return n; });
  };
  const saveSearch = (q, quiet) => {
    const href = encodeQuery({ ...q, n: 1 });
    const bits = [q.q && `“${q.q}”`, q.cat !== 'all' && TYPES[q.cat].label, q.loc, ...Object.values(q.f).flat().filter(Boolean)].filter(Boolean);
    const name = bits.join(' · ') || 'All listings';
    if (live) { if (liveSearches.some((x) => x.href === href)) return; const row = { href, q: { ...q, n: 1 }, seenAt: Date.now(), name, sub: 'Saved just now' }; setLiveSearches((s) => [row, ...s]); api.addSearch(name, href, row.q).then((id) => setLiveSearches((s) => s.map((x) => (x === row ? { ...x, id } : x)))).catch(liveErr); if (!quiet) notify('Search saved'); return; }
    setSearches((s) => (s.some((x) => x.href === href) ? s : [{ href, q: { ...q, n: 1 }, seenAt: Date.now(), name: bits.join(' · ') || 'All listings', sub: `Saved ${new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}` }, ...s]));
    if (!quiet) notify('Search saved');
  };
  const seeSearch = (href) => live ? (setLiveSearches((x) => x.map((y) => (y.href === href ? { ...y, seenAt: Date.now() } : y))), (liveSearches.find((y) => y.href === href)?.id && api.seeSearchRow(liveSearches.find((y) => y.href === href).id).catch(() => {}))) : setSearches((x) => x.map((y) => (y.href === href ? { ...y, seenAt: Date.now() } : y)));
  const removeSearch = (s) => { if (live) { setLiveSearches((x) => x.filter((y) => y !== s)); if (s.id) api.deleteSearch(s.id).catch(liveErr); notify('Search removed'); return; } setSearches((x) => x.filter((y) => y !== s)); notify('Search removed', () => setSearches((x) => [s, ...x])); };
  const searchFromText = (text) => {
    const base = route.name === 'browse' ? route.query : { ...DEFAULT_QUERY, f: {}, loc: prefLoc };
    const next = parseIntent(text, { ...base, q: text, n: 1 });
    go(encodeQuery(next));
  };
  const startInquiry = (listingId, vals) => {
    const l = srcListings.find((x) => x.id === listingId);
    if (live) {
      if (!l || l.status !== 'published') return { error: 'LISTING_UNAVAILABLE: this listing was just closed, so new inquiries can’t be sent.' };
      const body = TYPES[l.type].inquiry.fields.filter((f) => vals[f.key]).map((f) => `${f.label}: ${vals[f.key]}`).join('\n');
      return api.openConversation(listingId).then(async (cid) => { await api.postMessage(liveUser.id, cid, body); track('inquiry_sent'); await refreshConvs(liveUser.id); return { convId: cid }; }).catch((e) => ({ error: String(e.message || e) }));
    }
    if (!l || l.status !== 'published') return { error: 'LISTING_UNAVAILABLE: this listing was just closed, so new inquiries can’t be sent.' };
    const t = TYPES[l.type];
    const body = t.inquiry.fields.filter((f) => vals[f.key]).map((f) => `${f.label}: ${vals[f.key]}`).join('\n');
    const dup = convs.find((c) => c.listingId === listingId && c.me === 'buyer'); // one conversation per listing
    if (dup) {
      if (dup.status !== 'open') return { error: `CONFLICT: your earlier conversation about this listing is ${dup.status}.` };
      setConvs((c) => c.map((x) => (x.id === dup.id ? { ...x, msgs: [...x.msgs, { from: 'me', at: Date.now(), text: body }] } : x)));
      track('inquiry_sent');
      return { convId: dup.id };
    }
    track('inquiry_sent');
    const id = 'c-' + Date.now();
    setConvs((c) => [{ id, listingId, me: 'buyer', other: orgs[l.org].name, status: 'open', unread: 0, blocked: false, msgs: [{ from: 'me', at: Date.now(), text: body }] }, ...c]);
    return { convId: id };
  };
  const sendMsg = (id, text, imgs) => live ? (setLiveConvs((c) => c.map((x) => (x.id === id ? { ...x, msgs: [...x.msgs, { from: 'me', at: Date.now(), text, ...(imgs && imgs.length ? { imgs } : {}) }] } : x))), api.postMessage(liveUser.id, id, text, imgs).then(() => refreshConvs(liveUser.id)).catch(liveErr)) : setConvs((c) => c.map((x) => (x.id === id && !x.blocked ? { ...x, msgs: [...x.msgs, { from: 'me', at: Date.now(), text, ...(imgs && imgs.length ? { imgs } : {}) }] } : x)));
  const markRead = (id) => live ? setSeenAt((s) => ({ ...s, [id]: Date.now() })) : setConvs((c) => c.map((x) => (x.id === id ? { ...x, unread: 0 } : x)));
  const setConvStatus = (id, s) => { if (live) api.setConversation(id, { status: s }).catch(liveErr); (live ? setLiveConvs : setConvs)((c) => c.map((x) => (x.id === id ? { ...x, status: s } : x))); };
  const blockConv = (id) => { if (live) api.setConversation(id, { blocked_by: liveUser.id, status: 'closed' }).catch(liveErr); (live ? setLiveConvs : setConvs)((c) => c.map((x) => (x.id === id ? { ...x, blocked: true, status: 'closed' } : x))); notify('Person blocked'); };
  const report = (id, reason) => { if (live) { if (!liveUser) { notify('Sign in to report a listing.'); return; } api.addReport(id, reason).then(() => notify('Report sent. Thanks, we’ll review it.')).catch(liveErr); return; } setReports((r) => [{ id: 'r-' + Date.now(), listingId: id, reason, by: user ? user.email : 'guest', at: Date.now(), status: 'open' }, ...r]); notify('Report sent. Thanks, we’ll review it.'); };
  const setStatus = (id, to) => {
    const l = srcListings.find((x) => x.id === id);
    if (!l || !TRANSITIONS[l.status].includes(to)) { notify('That status change isn’t available.'); return; }
    if (live) { setLiveListings((ls) => ls.map((x) => (x.id === id ? { ...x, status: to } : x))); api.setListingStatus(id, to).then(() => notify(`Listing ${STATUS_LABEL[to].toLowerCase()}`)).catch((e) => { setLiveListings((ls) => ls.map((x) => (x.id === id ? { ...x, status: l.status } : x))); liveErr(e); }); return; }
    const prev = l.status;
    setListings((ls) => ls.map((x) => (x.id === id ? { ...x, status: to, updatedAt: Date.now(), history: [...x.history, { at: Date.now(), to }] } : x)));
    notify(`Listing ${STATUS_LABEL[to].toLowerCase()}`, () => setListings((ls) => ls.map((x) => (x.id === id ? { ...x, status: prev } : x))));
  };
  const publish = (d, editing) => {
    const geo = resolveLocation(d.city);
    const { address, ...restF } = d.f;
    const price = d.priceType !== 'undisclosed' && TYPES[d.type].hasPrice && +d.price > 0 ? +d.price : null;
    if (live) {
      const draftL = { type: d.type, title: d.title.trim(), desc: d.desc.trim(), geo: { city: geo.city, st: geo.st, lat: geo.lat, lng: geo.lng }, price, priceType: TYPES[d.type].hasPrice ? d.priceType : 'none', f: restF, photos: d.photos };
      const job = editing ? api.updateListing(liveUser, editing.id, draftL, address).then((x) => { setLiveListings((ls) => ls.map((y) => (y.id === x.id ? x : y))); notify('Changes saved'); return x; })
        : api.insertListing(liveUser, profile, draftL, address).then(({ listing, org_id }) => { setLiveListings((ls) => [listing, ...ls]); if (!profile || !profile.org_id) { setProfile((p) => ({ ...(p || {}), org_id })); refreshCatalog(liveUser.id).catch(() => {}); } track('listing_published'); notify('Your listing is live'); return listing; });
      return job.catch((e) => { liveErr(e); return null; });
    }
    const base = { type: d.type, title: d.title.trim(), desc: d.desc.trim(), geo: { city: geo.city, st: geo.st, lat: geo.lat, lng: geo.lng }, price, priceType: TYPES[d.type].hasPrice ? d.priceType : 'none', f: restF, photos: d.photos, updatedAt: Date.now() };
    if (editing) { setPriv((p) => ({ ...p, [editing.id]: address || '' })); setListings((ls) => ls.map((x) => (x.id === editing.id ? { ...x, ...base, history: [...x.history, { at: Date.now(), to: 'edited' }] } : x))); notify('Changes saved'); return { ...editing, ...base }; }
    const l = { id: ++nextId.current, org: 'dm', mine: true, status: 'published', sponsored: false, createdAt: Date.now(), history: [{ at: Date.now(), to: 'draft' }, { at: Date.now(), to: 'pending_review' }, { at: Date.now(), to: 'published' }], ...base };
    setListings((ls) => [l, ...ls]);
    if (address) setPriv((p) => ({ ...p, [l.id]: address }));
    track('listing_published');
    notify('Your listing is live');
    return l;
  };
  const track = (n) => setMetrics((m) => ({ ...m, [n]: (m[n] || 0) + 1 }));
  const trackImpr = (key, ids) => ids.forEach((id) => { const k = key + ':' + id; if (seenImpr.current.has(k)) return; seenImpr.current.add(k); setImpr((m) => ({ ...m, [id]: (m[id] || 0) + 1 })); });
  const addTicket = (t) => { if (live) { return api.addSupport(t).then(() => notify('Request sent. We’ll reply by email.')).catch(liveErr); } setTickets((x) => [{ id: 't-' + Date.now(), at: Date.now(), ...t }, ...x]); log('Support request received'); notify('Request sent. We’ll reply by email.'); };
  const nid = () => Math.random().toString(36).slice(2, 8);
  const processEvent = (id, type, apply) => {
    if (events.some((e) => e.id === id)) { notify('Duplicate payment event ignored. It was already processed.'); return; }
    setEvents((e) => [{ id, type, at: Date.now() }, ...e]);
    apply();
  };
  const subscribe = () => { setPlan({ status: 'pending', ref: 'sub_' + nid() }); log('Started Professional checkout'); };
  const cancelPlan = () => { setPlan((p) => ({ ...p, status: 'canceled' })); log('Canceled Professional plan'); notify(plan.until > Date.now() ? `Professional canceled. It won’t renew, and stays active until ${fmtDate(plan.until)}.` : 'Professional canceled. Your listings stay published.'); };
  const promote = (listingId) => {
    const l = listings.find((x) => x.id === listingId);
    if (!l || l.status !== 'published') { notify('Only published listings can be promoted.'); return; }
    if (promos.some((p) => p.listingId === listingId && (['pending', 'active'].includes(p.status) || promoLive(p)))) { notify('This listing already has a promotion.'); return; }
    setPromos((p) => [{ id: 'promo_' + nid(), listingId, status: 'pending' }, ...p]); log(`Started sponsored checkout for listing ${listingId}`);
  };
  const cancelPromo = (id) => { const cur = promos.find((x) => x.id === id); const live = cur && cur.status === 'active' && cur.until > Date.now(); setPromos((p) => p.map((x) => (x.id === id ? { ...x, status: 'canceled' } : x))); log('Canceled sponsored placement'); notify(live ? `Sponsored placement canceled. It won’t renew, and stays active until ${fmtDate(cur.until)}.` : 'Sponsored placement canceled. It stops appearing in paid slots.'); };
  const confirmPayment = (kind, ref) => {
    if (kind === 'promo') {
      const p = promos.find((x) => x.id === ref); const l = p && listings.find((x) => x.id === p.listingId);
      if (!l || l.status !== 'published') { setPromos((ps) => ps.map((x) => (x.id === ref ? { ...x, status: 'canceled' } : x))); notify('That listing is no longer published, so the promotion was canceled and not charged.'); return; }
    }
    processEvent('evt_' + ref, kind === 'plan' ? 'subscription.changed' : 'promotion.activated', () => {
    if (kind === 'plan') { setPlan((p) => ({ ...p, status: 'active', until: Date.now() + PERIOD })); setInvoices((i) => [{ id: 'in_' + nid(), desc: 'Professional, monthly', amount: 49, at: Date.now() }, ...i]); }
    else { setPromos((p) => p.map((x) => (x.id === ref ? { ...x, status: 'active', until: Date.now() + PERIOD } : x))); setInvoices((i) => [{ id: 'in_' + nid(), desc: 'Sponsored listing, monthly', amount: 29, at: Date.now() }, ...i]); }
    log(`Billing confirmed for ${ref}`);
    });
  };
  const pushNote = (kind, title, body, href) => setDemoNotes((x) => [{ id: 'n' + Date.now() + Math.random().toString(36).slice(2, 5), kind, title, body, href, at: Date.now(), read: false }, ...x].slice(0, 100));
  const notes = live ? liveNotes : curUser ? demoNotes : [];
  const noteCount = notes.filter((n) => !n.read).length;
  const markNotesRead = () => { if (live) { setLiveNotes((x) => x.map((n) => ({ ...n, read: true }))); api.readNotes().catch(() => {}); } else setDemoNotes((x) => x.map((n) => ({ ...n, read: true }))); };
  const closeTicket = (id) => { if (live) { setLiveTickets((x) => x.map((t) => (t.id === id ? { ...t, status: 'closed' } : t))); api.closeSupport(id).catch(liveErr); return; } setTickets((x) => x.map((t) => (t.id === id ? { ...t, status: 'closed' } : t))); };
  const VERIF_CHECKS = ['Registration document reviewed', 'Business phone confirmed', 'Website domain matches contact email'];
  const verifView = live ? (liveVerif ? { status: liveVerif.status, data: { legal: liveVerif.legal, phone: liveVerif.phone, domain: liveVerif.domain }, reason: liveVerif.reason, expires: liveVerif.expires, checks: VERIF_CHECKS } : { status: 'none' }) : verif;
  const verifQueue = live ? liveVerifQueue : verif.status !== 'none' && verif.data ? [{ orgId: 'dm', status: verif.status, legal: verif.data.legal, phone: verif.data.phone, domain: verif.data.domain, docName: verif.data.doc, at: verif.at || Date.now(), reason: verif.reason, expires: verif.expires }] : [];
  const saveOrg = async (patch) => {
    if (!live) { setDmOrg((o) => ({ ...o, ...patch })); notify('Profile saved'); return; }
    const id = (profile && profile.org_id) || (await api.ensureOrg(liveUser, profile));
    if (!profile || !profile.org_id) setProfile((pr) => ({ ...(pr || {}), org_id: id }));
    const o = await api.updateOrg(id, patch);
    setLiveOrgs((os) => ({ ...os, [id]: o })); notify('Profile saved');
  };
  const submitVerif = async (data, file) => {
    if (live) {
      const r = await api.submitVerification(liveUser, profile, data, file, !!liveVerif && liveVerif.status === 'rejected');
      if (!profile || !profile.org_id) { setProfile((pr) => ({ ...(pr || {}), org_id: r.org_id })); refreshCatalog(liveUser.id).catch(() => {}); }
      setLiveVerif(r.verif); notify('Sent for review'); return;
    }
    setVerif({ status: 'submitted', data, at: Date.now() }); log('Submitted verification documents');
  };
  const openVerifDoc = async (q) => {
    if (!live) { notify(`Demo: ${q.docName || 'the document'} stays on your device. In the live app this opens a private link that expires in five minutes.`); return; }
    const w = (() => { try { return window.open('', '_blank'); } catch (e) { return null; } })();
    try { const url = await api.signDoc(q.docPath); if (w) w.location.href = url; else location.assign(url); } catch (e) { if (w) w.close(); liveErr(e); }
  };
  const room = live ? {
    load: (id) => api.loadDocRoom(id),
    upload: (id, f) => api.uploadDoc(liveUser.id, id, f),
    remove: (f) => api.removeDoc(f),
    request: (id, note, again) => api.requestDocs(id, note, again),
    decide: (id, buyer, status) => api.decideDocs(id, buyer, status),
    open: (f) => api.openDoc(f),
  } : {
    load: async (id) => { const r = roomsRef.current[id] || { files: [], access: [] }; return { count: r.files.length, files: r.files, access: r.access }; },
    upload: async (id, f) => { const fid = 'd' + Date.now() + Math.random().toString(36).slice(2, 5); blobs.current[fid] = f; const next = { ...roomsRef.current }; const r = next[id] || { files: [], access: [] }; next[id] = { ...r, files: [...r.files, { id: fid, name: f.name, size: f.size, mime: f.type, at: Date.now(), views: [] }] }; roomsRef.current = next; setRooms(next); },
    remove: async (f) => { const next = {}; Object.entries(roomsRef.current).forEach(([k, r]) => { next[k] = { ...r, files: r.files.filter((x) => x.id !== f.id) }; }); roomsRef.current = next; setRooms(next); },
    request: async (id, note) => { if (!curUser) throw new Error('Sign in first'); const next = { ...roomsRef.current }; const r = next[id] || { files: [], access: [] }; next[id] = { ...r, access: [{ buyer: curUser.email, email: curUser.email, status: 'requested', ndaAt: Date.now(), note, at: Date.now() }, ...r.access.filter((a) => a.buyer !== curUser.email)] }; roomsRef.current = next; setRooms(next); },
    decide: async (id, buyer, status) => { const next = { ...roomsRef.current }; const r = next[id]; next[id] = { ...r, access: r.access.map((a) => (a.buyer === buyer ? { ...a, status, decidedAt: Date.now() } : a)) }; roomsRef.current = next; setRooms(next); },
    open: async (f) => {
      const next = {}; Object.entries(roomsRef.current).forEach(([k, r]) => { next[k] = { ...r, files: r.files.map((x) => (x.id === f.id ? { ...x, views: [...x.views, { by: curUser && curUser.email, at: Date.now() }] } : x)) }; }); roomsRef.current = next; setRooms(next);
      const b = blobs.current[f.id] || new Blob([`${f.name}\n\nSample document for the VendGrid demo.\nIn the live app this is the seller's file, opened through a private link that expires after five minutes.\n`], { type: 'text/plain' });
      return URL.createObjectURL(b);
    },
    sandboxGrant: async (id) => { const r = roomsRef.current[id]; const a = r && r.access.find((x) => curUser && x.buyer === curUser.email); if (a) { await room.decide(id, a.buyer, 'granted'); const l = listings.find((x) => x.id === id); pushNote('doc_granted', 'You can now open the documents for ' + (l ? l.title : 'this route'), 'Links expire after five minutes, and the seller sees when you open each file.', '#/listing/' + id + '/x'); } },
  };
  const decideVerif = (orgId, ok, reason) => {
    if (!isAdmin) { notify('PERMISSION_DENIED'); return; }
    if (live) { api.decideVerification(orgId, ok, reason).then(() => { notify(ok ? 'Business verified' : 'Marked not approved'); loadStaff(); refreshCatalog(liveUser.id).catch(() => {}); }).catch(liveErr); return; }
    pushNote(ok ? 'verif_ok' : 'verif_no', ok ? `${orgs.dm.name} is now a Verified business` : `Verification for ${orgs.dm.name} wasn’t approved`, ok ? 'The badge shows on your listings for one year.' : reason || 'Details could not be confirmed.', '#/business-settings');
    setVerif((v) => (ok ? { status: 'verified', data: v.data, at: Date.now(), expires: Date.now() + 365 * 864e5, checks: ['Registration document reviewed', 'Business phone confirmed', 'Website domain matches contact email'] } : { status: 'rejected', data: v.data, reason: reason || 'Details could not be confirmed.' }));
    log(ok ? 'Approved business verification' : 'Rejected business verification');
  };
  const decideReport = (id, action) => {
    if (!isAdmin) return;
    if (live) {
      const r = liveReports.find((x) => x.id === id);
      setLiveReports((rs) => rs.map((x) => (x.id === id ? { ...x, status: action === 'withdraw' ? 'actioned' : 'dismissed' } : x)));
      api.setReport(id, action === 'withdraw' ? 'actioned' : 'dismissed').then(() => (action === 'withdraw' && r ? api.setListingStatus(r.listingId, 'withdrawn').then(() => setLiveListings((ls) => ls.map((l) => (l.id === r.listingId ? { ...l, status: 'withdrawn' } : l)))) : null)).catch(liveErr);
      return;
    }
    const r = reports.find((x) => x.id === id);
    setReports((rs) => rs.map((x) => (x.id === id ? { ...x, status: action === 'withdraw' ? 'actioned' : 'dismissed' } : x)));
    if (action === 'withdraw' && r) { const l = listings.find((x) => x.id === r.listingId); if (l && l.mine) pushNote('report_actioned', `${l.title} was withdrawn after a report`, `Reason given: ${r.reason}. If you think this is a mistake, use Contact support.`, '#/my-listings'); }
    if (action === 'withdraw' && r) setListings((ls) => ls.map((l) => (l.id === r.listingId && TRANSITIONS[l.status].includes('withdrawn') ? { ...l, status: 'withdrawn', history: [...l.history, { at: Date.now(), to: 'withdrawn' }] } : l)));
    log(`Report ${id}: ${action}`);
  };
  const bumpView = (id) => { if (live) api.countView(id); else setViews((v) => ({ ...v, [id]: (v[id] || 0) + 1 })); };
  const setDraft = (k, v) => setDrafts((d) => { const n = { ...d }; if (v) n[k] = v; else delete n[k]; return n; });

  useEffect(() => {
    const h = (e) => { const el = e.target.closest && e.target.closest('a[href^="#/"]'); if (!el || e.defaultPrevented || e.metaKey || e.ctrlKey || e.button) return; e.preventDefault(); go(el.getAttribute('href')); };
    document.addEventListener('click', h); return () => document.removeEventListener('click', h);
  }, [go]);
  const ctx = { mapFull, setMapFull, authFail, themeSel, seeSearch, listings: allListings, priv, metrics, impr, tickets: live ? liveTickets : tickets, track, trackImpr, addTicket, isPro, isAdmin, plan, stats: liveStats, promos: promosView, changeEmail, signOutAll, exportData, deleteData, notes, noteCount, markNotesRead, verif: verifView, verifQueue, openVerifDoc, myOrg, saveOrg, room, closeTicket, reports: live ? liveReports : reports, events, invoices, audit, views, subscribe, cancelPlan, promote, cancelPromo, confirmPayment, processEvent, submitVerif, decideVerif, decideReport, bumpView, orgs, user: curUser, favs: curFavs, searches: curSearches, convs: curConvs, live, mode, sendMagicLink, drafts, prefLoc, setPrefLoc, theme, setTheme, unread, notify, requireAuth, signIn, signOut, toggleFav, saveSearch, removeSearch, searchFromText, startInquiry, sendMsg, markRead, setConvStatus, blockConv, report, setStatus, publish, setDraft };

  let view;
  switch (route.name) {
    case 'browse': view = <Browse route={route} go={go} />; break;
    case 'listing': view = <Detail route={route} go={go} />; break;
    case 'inquire': view = <Inquire route={route} go={go} />; break;
    case 'post': view = <Post route={route} go={go} />; break;
    case 'saved': view = <Saved route={route} go={go} />; break;
    case 'messages': view = <Messages route={route} go={go} />; break;
    case 'mine': view = <Mine go={go} />; break;
    case 'business': view = <Business route={route} />; break;
    case 'login': view = <Login route={route} go={go} />; break;
    case 'legal': view = <Legal route={route} />; break;
    case 'billing': view = <Billing go={go} />; break;
    case 'bizsettings': view = <BusinessSettings go={go} />; break;
    case 'admin': view = <Admin route={route} go={go} />; break;
    case 'account': view = <Account go={go} />; break;
    case 'guide': view = <Guide route={route} go={go} />; break;
    case 'activity': view = <Activity go={go} />; break;
    case 'settings': view = <Settings go={go} />; break;
    case 'info': view = <InfoPage route={route} />; break;
    case 'sellers': view = <Sellers />; break;
    default: view = <NotFound go={go} />;
  }
  if (mode === 'checking') view = <div className="grid" aria-busy="true" aria-label="Loading listings">{Array.from({ length: 8 }, (_, i) => <CardSkeleton key={i} />)}</div>;
  return (
    <Ctx.Provider value={ctx}>
      <style>{CSS}</style>
      <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Geist:wght@400;500;600&display=swap" />
      <button className="skip" onClick={() => { const m = document.getElementById('main'); if (m) m.focus(); }}>Skip to content</button>
      <Header route={route} go={go} />
      <div className={'layout' + (mapFull ? ' navoff' : '')}>
        <Sidebar route={route} />
        <main className="main" id="main" tabIndex={-1}>{view}<Footer /></main>
      </div>
      <TabBar route={route} />
      {toast && <div className="toast" role="status"><span>{toast.msg}</span>{toast.undo && <button onClick={() => { toast.undo(); setToast(null); }}>Undo</button>}</div>}
    </Ctx.Provider>
  );
}
