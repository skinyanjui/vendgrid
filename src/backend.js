// Supabase data layer for VendGrid. The app runs in "live" mode when the project is reachable,
// and falls back to the in-browser demo otherwise (offline, tests, or hosts that block it).
import { createClient } from '@supabase/supabase-js';

// Publishable values only. These are safe in a browser; row-level security protects the data.
export const SUPABASE_URL = 'https://bfovgafcfetfeqykjfco.supabase.co';
export const SUPABASE_KEY = 'sb_publishable_FfVpTa_cEtn_LRJ5FNc-VQ_8bvPbVZx';

let client = null;
export const sb = () => client;

/** Resolve true if the Supabase API answers within `ms`. Never throws. */
export async function probe(ms = 3500) {
  if (typeof fetch !== 'function' || typeof AbortController !== 'function') return false;
  const ctl = new AbortController();
  const t = setTimeout(() => ctl.abort(), ms);
  try {
    const r = await fetch(`${SUPABASE_URL}/rest/v1/vg_orgs?select=id&limit=1`, { headers: { apikey: SUPABASE_KEY }, signal: ctl.signal });
    if (!r.ok) return false;
    client = createClient(SUPABASE_URL, SUPABASE_KEY, { auth: { flowType: 'pkce', detectSessionInUrl: true, persistSession: true, autoRefreshToken: true } });
    return true;
  } catch (e) {
    return false;
  } finally {
    clearTimeout(t);
  }
}

const ts = (v) => (v ? Date.parse(v) : Date.now());

export const rowToOrg = (o) => ({ id: o.id, name: o.name, slug: o.slug, city: o.city || '', about: o.about || '', verified: !!o.verified, owner: o.owner });

export const rowToListing = (r, uid) => ({
  id: r.id, type: r.type, org: r.org_id || 'unknown', owner: r.owner, title: r.title, desc: r.description,
  geo: { city: r.city, st: r.st, lat: r.lat, lng: r.lng },
  price: r.price == null ? null : Number(r.price), priceType: r.price_type, f: r.fields || {}, photos: r.photos || [],
  status: r.status, sponsored: !!r.sponsored, createdAt: ts(r.created_at), updatedAt: ts(r.updated_at),
  history: [{ at: ts(r.created_at), to: r.status }], mine: !!uid && r.owner === uid,
});

const listingToRow = (l) => ({
  type: l.type, title: l.title, description: l.desc, city: l.geo.city, st: l.geo.st, lat: l.geo.lat, lng: l.geo.lng,
  price: l.price, price_type: l.priceType, fields: l.f, photos: l.photos,
});

const fail = (error) => { if (error) throw new Error(error.message || String(error)); };

export async function loadCatalog(uid) {
  const [o, l] = await Promise.all([
    client.from('vg_orgs').select('*'),
    client.from('vg_listings').select('*').order('created_at', { ascending: false }).limit(1000),
  ]);
  fail(o.error); fail(l.error);
  const orgs = Object.fromEntries(o.data.map((x) => [x.id, rowToOrg(x)]));
  return { orgs, listings: l.data.map((x) => rowToListing(x, uid)) };
}

export async function loadMine(uid) {
  const [p, f, s] = await Promise.all([
    client.from('vg_profiles').select('*').eq('user_id', uid).maybeSingle(),
    client.from('vg_favorites').select('listing_id').eq('user_id', uid),
    client.from('vg_saved_searches').select('*').eq('user_id', uid).order('created_at', { ascending: false }),
  ]);
  fail(f.error); fail(s.error);
  let profile = p.data;
  if (!profile) {
    const ins = await client.from('vg_profiles').insert({ user_id: uid }).select().single();
    profile = ins.data || { user_id: uid, role: 'member', org_id: null };
  }
  return {
    profile,
    favs: new Set(f.data.map((x) => x.listing_id)),
    searches: s.data.map((x) => ({ id: x.id, href: x.query.href, q: x.query.q, name: x.name, seenAt: ts(x.seen_at), sub: `Saved ${new Date(x.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}` })),
  };
}

export async function loadConversations(uid, orgs, listings) {
  const c = await client.from('vg_conversations').select('*, vg_messages(*)').order('created_at', { ascending: false });
  fail(c.error);
  const list = c.data.map((x) => {
    const l = listings.find((y) => y.id === x.listing_id);
    const me = x.buyer === uid ? 'buyer' : 'owner';
    const msgs = (x.vg_messages || []).sort((a, b) => a.id - b.id).map((m) => ({ id: m.id, from: m.sender === uid ? 'me' : 'them', at: ts(m.created_at), text: m.body, ...(m.images && m.images.length ? { imgs: m.images } : {}) }));
    return { id: x.id, listingId: x.listing_id, me, other: me === 'buyer' ? (l && orgs[l.org] ? orgs[l.org].name : 'Seller') : 'Buyer', status: x.status, blocked: !!x.blocked_by, unread: 0, msgs };
  });
  const signed = await signMessagePhotos(list).catch(() => ({}));
  list.forEach((cv) => cv.msgs.forEach((m) => { if (m.imgs) m.imgs = m.imgs.map((u) => signed[u] || u).filter((u) => !u.startsWith('vg-msg:')); }));
  return list;
}

/** Upload data-URL photos to the user's folder and return public URLs. Existing URLs pass through. */
export async function uploadPhotos(uid, photos) {
  const out = [];
  for (let i = 0; i < photos.length; i++) {
    const p = photos[i];
    if (!/^data:|^blob:/.test(p)) { out.push(p); continue; }
    const blob = await (await fetch(p)).blob();
    const path = `${uid}/${Date.now()}-${i}.jpg`;
    const up = await client.storage.from('vg-photos').upload(path, blob, { contentType: blob.type || 'image/jpeg', upsert: false });
    fail(up.error);
    out.push(client.storage.from('vg-photos').getPublicUrl(path).data.publicUrl);
  }
  return out;
}

/** Make sure the user owns a business record to post under; create one from their email if not. */
export async function ensureOrg(user, profile) {
  if (profile && profile.org_id) return profile.org_id;
  const base = (user.email.split('@')[0] || 'seller').replace(/[^a-z0-9]+/gi, '-').toLowerCase().slice(0, 30) || 'seller';
  const id = 'u-' + user.id.slice(0, 8);
  const name = base.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()) + ' (seller)';
  const ins = await client.from('vg_orgs').upsert({ id, name, slug: `${base}-${user.id.slice(0, 6)}`, city: '' }, { onConflict: 'id', ignoreDuplicates: true });
  fail(ins.error);
  const up = await client.from('vg_profiles').update({ org_id: id }).eq('user_id', user.id);
  fail(up.error);
  return id;
}

export async function insertListing(user, profile, l, address) {
  const org_id = await ensureOrg(user, profile);
  const photos = await uploadPhotos(user.id, l.photos);
  const r = await client.from('vg_listings').insert({ ...listingToRow({ ...l, photos }), org_id, status: 'published' }).select().single();
  fail(r.error);
  if (address) { const a = await client.from('vg_listing_private').insert({ listing_id: r.data.id, address }); fail(a.error); }
  return { listing: rowToListing(r.data, user.id), org_id };
}

export async function updateListing(user, id, l, address) {
  const photos = await uploadPhotos(user.id, l.photos);
  const r = await client.from('vg_listings').update(listingToRow({ ...l, photos })).eq('id', id).select().single();
  fail(r.error);
  const a = await client.from('vg_listing_private').upsert({ listing_id: id, address: address || '' }); fail(a.error);
  return rowToListing(r.data, user.id);
}

export async function setListingStatus(id, status) { const r = await client.from('vg_listings').update({ status }).eq('id', id); fail(r.error); }
export async function addFav(uid, id) { const r = await client.from('vg_favorites').upsert({ user_id: uid, listing_id: id }); fail(r.error); }
export async function removeFav(uid, id) { const r = await client.from('vg_favorites').delete().eq('user_id', uid).eq('listing_id', id); fail(r.error); }
export async function addSearch(name, href, q) { const r = await client.from('vg_saved_searches').insert({ name, query: { href, q } }).select().single(); fail(r.error); return r.data.id; }
export async function seeSearchRow(id) { const r = await client.from('vg_saved_searches').update({ seen_at: new Date().toISOString() }).eq('id', id); fail(r.error); }
export async function deleteSearch(id) { const r = await client.from('vg_saved_searches').delete().eq('id', id); fail(r.error); }

export async function openConversation(listingId) {
  const ins = await client.from('vg_conversations').insert({ listing_id: listingId }).select().single();
  if (!ins.error) return ins.data.id;
  if (ins.error.code === '23505') { // already have one for this listing
    const ex = await client.from('vg_conversations').select('id,status').eq('listing_id', listingId).maybeSingle();
    fail(ex.error); return ex.data.id;
  }
  fail(ins.error);
}
/** Message photos: private bucket, stored as `vg-msg:<path>` and shown through short-lived signed URLs. */
async function uploadMessagePhotos(convId, imgs) {
  const out = [];
  for (let i = 0; i < imgs.length; i++) {
    const blob = await (await fetch(imgs[i])).blob();
    const path = `${convId}/${Date.now()}-${i}.jpg`;
    const up = await client.storage.from('vg-msg').upload(path, blob, { contentType: blob.type || 'image/jpeg' });
    fail(up.error);
    out.push('vg-msg:' + path);
  }
  return out;
}
export async function signMessagePhotos(convs) {
  const paths = [...new Set(convs.flatMap((c) => c.msgs.flatMap((m) => (m.imgs || []).filter((u) => u.startsWith('vg-msg:')).map((u) => u.slice(7)))))];
  if (!paths.length) return {};
  const r = await client.storage.from('vg-msg').createSignedUrls(paths, 3600);
  if (r.error) return {};
  return Object.fromEntries(r.data.filter((x) => x.signedUrl).map((x) => ['vg-msg:' + x.path, x.signedUrl]));
}
export async function postMessage(uid, convId, body, imgs) {
  const images = imgs && imgs.length ? await uploadMessagePhotos(convId, imgs) : [];
  const r = await client.from('vg_messages').insert({ conversation_id: convId, body: body || '', images }).select().single();
  fail(r.error);
  return images;
}
export async function setConversation(id, patch) { const r = await client.from('vg_conversations').update(patch).eq('id', id); fail(r.error); }
export async function addReport(listingId, reason) { const r = await client.from('vg_reports').insert({ listing_id: listingId, reason }); fail(r.error); }

export async function loadReports() {
  const r = await client.from('vg_reports').select('*').order('created_at', { ascending: false }).limit(200);
  fail(r.error);
  return r.data.map((x) => ({ id: x.id, listingId: x.listing_id, reason: x.reason, by: 'member ' + String(x.reporter).slice(0, 8), at: ts(x.created_at), status: x.status }));
}
export async function setReport(id, status) { const r = await client.from('vg_reports').update({ status }).eq('id', id); fail(r.error); }
