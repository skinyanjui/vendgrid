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
  const before = await client.from('vg_listings').select('photos').eq('id', id).maybeSingle();
  const photos = await uploadPhotos(user.id, l.photos);
  const r = await client.from('vg_listings').update(listingToRow({ ...l, photos })).eq('id', id).select().single();
  fail(r.error);
  const a = await client.from('vg_listing_private').upsert({ listing_id: id, address: address || '' }); fail(a.error);
  // photos the seller removed: delete the files too (only ones in their own folder)
  const base = client.storage.from('vg-photos').getPublicUrl('x').data.publicUrl.replace(/x$/, '');
  const gone = ((before.data && before.data.photos) || []).filter((u) => !photos.includes(u) && u.startsWith(base + user.id + '/')).map((u) => u.slice(base.length));
  if (gone.length) client.storage.from('vg-photos').remove(gone).catch(() => {});
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

/* ── document room (route sales) ── */
const safeName = (n) => String(n || 'file').replace(/[^\w.\- ]+/g, '_').slice(-120);
const docRow = (f) => ({ id: f.id, listingId: f.listing_id, name: f.name, size: f.size, mime: f.mime, path: f.path, at: ts(f.created_at), views: (f.vg_doc_views || []).map((v) => ({ by: v.viewer, at: ts(v.at) })) });
const accessRow = (a) => ({ listingId: a.listing_id, buyer: a.buyer, email: a.buyer_email || 'Buyer', status: a.status, ndaAt: ts(a.nda_at), note: a.note || '', at: ts(a.created_at), decidedAt: a.decided_at ? ts(a.decided_at) : null });

/** Everything the signed-in person may see about one listing's room. Never throws for a missing room. */
export async function loadDocRoom(listingId) {
  const [cnt, files, access] = await Promise.all([
    client.rpc('vg_doc_count', { p_listing: listingId }),
    client.from('vg_doc_files').select('*, vg_doc_views(viewer, at)').eq('listing_id', listingId).order('created_at'),
    client.from('vg_doc_access').select('*').eq('listing_id', listingId).order('created_at', { ascending: false }),
  ]);
  return { count: cnt.data || 0, files: (files.data || []).map(docRow), access: (access.data || []).map(accessRow) };
}
export async function docCount(listingId) { const r = await client.rpc('vg_doc_count', { p_listing: listingId }); return r.data || 0; }
export async function uploadDoc(uid, listingId, file) {
  const path = `${uid}/rooms/${listingId}/${Date.now()}-${safeName(file.name)}`;
  const up = await client.storage.from('vg-docs').upload(path, file, { contentType: file.type || 'application/octet-stream', upsert: false });
  fail(up.error);
  const r = await client.from('vg_doc_files').insert({ listing_id: listingId, path, name: String(file.name).slice(0, 200), size: file.size, mime: file.type || 'application/octet-stream' }).select().single();
  if (r.error) { await client.storage.from('vg-docs').remove([path]); fail(r.error); }
  return docRow(r.data);
}
export async function removeDoc(f) {
  const r = await client.from('vg_doc_files').delete().eq('id', f.id); fail(r.error);
  await client.storage.from('vg-docs').remove([f.path]);
}
export async function requestDocs(listingId, note, again) {
  const r = again
    ? await client.from('vg_doc_access').update({ status: 'requested', note: note || null }).eq('listing_id', listingId).eq('buyer', (await client.auth.getUser()).data.user.id)
    : await client.from('vg_doc_access').insert({ listing_id: listingId, note: note || null });
  fail(r.error);
}
export async function decideDocs(listingId, buyer, status) { const r = await client.from('vg_doc_access').update({ status }).eq('listing_id', listingId).eq('buyer', buyer); fail(r.error); }
/** Log the view, then hand back a five-minute link. */
export async function openDoc(f) {
  const v = await client.from('vg_doc_views').insert({ file_id: f.id }); fail(v.error);
  const s = await client.storage.from('vg-docs').createSignedUrl(f.path, 300); fail(s.error);
  return s.data.signedUrl;
}

/* ── business profile and verification ── */
export async function updateOrg(id, patch) { const r = await client.from('vg_orgs').update(patch).eq('id', id).select().single(); fail(r.error); return rowToOrg(r.data); }
const verifRow = (v) => ({ orgId: v.org_id, status: v.status, legal: v.legal_name, phone: v.phone, domain: v.domain, docPath: v.doc_path, reason: v.reason || '', expires: v.expires_at ? ts(v.expires_at) : null, at: ts(v.created_at) });
export async function loadVerification(orgId) {
  if (!orgId) return null;
  const r = await client.from('vg_verification').select('*').eq('org_id', orgId).maybeSingle(); fail(r.error);
  return r.data ? verifRow(r.data) : null;
}
export async function submitVerification(user, profile, v, file, again) {
  const org_id = await ensureOrg(user, profile);
  let doc_path = null;
  if (file) {
    doc_path = `${user.id}/verify/${Date.now()}-${safeName(file.name)}`;
    const up = await client.storage.from('vg-docs').upload(doc_path, file, { contentType: file.type || 'application/octet-stream' }); fail(up.error);
  }
  const row = { org_id, legal_name: v.legal.trim(), phone: v.phone.trim(), domain: v.domain.trim(), doc_path };
  const r = again ? await client.from('vg_verification').update(row).eq('org_id', org_id).select().single() : await client.from('vg_verification').insert(row).select().single();
  fail(r.error);
  return { org_id, verif: verifRow(r.data) };
}
export async function loadVerifQueue() {
  const r = await client.from('vg_verification').select('*').order('created_at', { ascending: false }).limit(200); fail(r.error);
  return r.data.map(verifRow);
}
export async function decideVerification(orgId, ok, reason) {
  const r = await client.from('vg_verification').update({ status: ok ? 'verified' : 'rejected', reason: ok ? null : (reason || 'Details could not be confirmed.') }).eq('org_id', orgId); fail(r.error);
}
export async function signDoc(path, secs = 300) { const s = await client.storage.from('vg-docs').createSignedUrl(path, secs); fail(s.error); return s.data.signedUrl; }

/* ── support requests ── */
export async function addSupport(t) { const r = await client.from('vg_support').insert({ email: t.email.trim(), topic: t.topic, message: t.message.trim() }); fail(r.error); }
export async function loadSupport() {
  const r = await client.from('vg_support').select('*').order('created_at', { ascending: false }).limit(200); fail(r.error);
  return r.data.map((x) => ({ id: x.id, email: x.email, topic: x.topic, message: x.message, status: x.status, at: ts(x.created_at) }));
}
export async function closeSupport(id) { const r = await client.from('vg_support').update({ status: 'closed' }).eq('id', id); fail(r.error); }

/* ── in-app notifications (written by database triggers) ── */
export async function loadNotes() {
  const r = await client.from('vg_notifications').select('*').order('created_at', { ascending: false }).limit(100); fail(r.error);
  return r.data.map((n) => ({ id: n.id, kind: n.kind, title: n.title, body: n.body || '', href: n.href, at: ts(n.created_at), read: !!n.read_at }));
}
export async function readNotes() { const r = await client.from('vg_notifications').update({ read_at: new Date().toISOString() }).is('read_at', null); fail(r.error); }
