-- Document room for route sales, live support requests, and verification documents.

-- Files a route seller shares privately. Stored in the private vg-docs bucket at <owner>/rooms/<listing_id>/<file>.
create table public.vg_doc_files (
  id bigint generated always as identity primary key,
  listing_id bigint not null references public.vg_listings(id) on delete cascade,
  owner uuid not null default auth.uid() references auth.users(id) on delete cascade,
  path text not null unique,
  name text not null check (char_length(name) between 1 and 200),
  size integer not null check (size between 1 and 20971520),
  mime text not null default 'application/octet-stream',
  created_at timestamptz not null default now()
);
create index vg_doc_files_listing on public.vg_doc_files (listing_id);
create index vg_doc_files_owner on public.vg_doc_files (owner);

-- A buyer's request to see a listing's documents. One per buyer per listing.
create table public.vg_doc_access (
  listing_id bigint not null references public.vg_listings(id) on delete cascade,
  buyer uuid not null default auth.uid() references auth.users(id) on delete cascade,
  buyer_email text,
  status text not null default 'requested' check (status in ('requested','granted','declined','revoked')),
  nda_at timestamptz not null default now(),
  note text check (note is null or char_length(note) <= 1000),
  created_at timestamptz not null default now(),
  decided_at timestamptz,
  primary key (listing_id, buyer)
);
create index vg_doc_access_buyer on public.vg_doc_access (buyer);

-- Every time someone opens a document.
create table public.vg_doc_views (
  id bigint generated always as identity primary key,
  file_id bigint not null references public.vg_doc_files(id) on delete cascade,
  viewer uuid not null default auth.uid() references auth.users(id) on delete cascade,
  at timestamptz not null default now()
);
create index vg_doc_views_file on public.vg_doc_views (file_id);
create index vg_doc_views_viewer on public.vg_doc_views (viewer);

-- Support requests (anyone can send one; only staff can read them).
create table public.vg_support (
  id bigint generated always as identity primary key,
  user_id uuid default auth.uid() references auth.users(id) on delete set null,
  email text not null check (email ~ '^\S+@\S+\.\S+$' and char_length(email) <= 254),
  topic text not null check (topic in ('Question','Billing or refund','Report a problem','Delete my data')),
  message text not null check (char_length(message) between 10 and 4000),
  status text not null default 'open' check (status in ('open','closed')),
  created_at timestamptz not null default now()
);
create index vg_support_user on public.vg_support (user_id);

-- helpers (private schema: not callable through the API)
create or replace function vg_private.vg_owns_listing(p_listing bigint) returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (select 1 from public.vg_listings l where l.id = p_listing and l.owner = auth.uid());
$$;
create or replace function vg_private.vg_has_doc_access(p_listing bigint) returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (select 1 from public.vg_doc_access a where a.listing_id = p_listing and a.buyer = auth.uid() and a.status = 'granted');
$$;
create or replace function vg_private.vg_can_read_doc(p_path text) returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (select 1 from public.vg_doc_files f where f.path = p_path
                 and (f.owner = auth.uid() or vg_private.vg_has_doc_access(f.listing_id)));
$$;

-- Public, count-only summary so buyers know a room exists before they ask.
create or replace function public.vg_doc_count(p_listing bigint) returns integer
language sql stable security definer set search_path = '' as $$
  select count(*)::int from public.vg_doc_files f join public.vg_listings l on l.id = f.listing_id
  where f.listing_id = p_listing and l.status = 'published';
$$;
grant execute on function public.vg_doc_count(bigint) to anon, authenticated;

-- guards
create or replace function public.vg_doc_file_guard() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  if not exists (select 1 from public.vg_listings l where l.id = new.listing_id and l.owner = auth.uid() and l.type = 'routes') then
    raise exception 'Only the seller of a route listing can add documents' using errcode = 'P0001';
  end if;
  new.owner := auth.uid(); new.created_at := now();
  if split_part(new.path, '/', 1) <> auth.uid()::text or split_part(new.path, '/', 3) <> new.listing_id::text then
    raise exception 'Bad document path' using errcode = 'P0001';
  end if;
  return new;
end $$;
create trigger vg_doc_file_guard before insert on public.vg_doc_files for each row execute function public.vg_doc_file_guard();

create or replace function public.vg_doc_access_guard() returns trigger
language plpgsql security definer set search_path = '' as $$
declare is_owner boolean := vg_private.vg_owns_listing(coalesce(new.listing_id, old.listing_id));
begin
  if tg_op = 'INSERT' then
    if is_owner then raise exception 'You can''t request access to your own listing' using errcode = 'P0001'; end if;
    if not exists (select 1 from public.vg_listings l where l.id = new.listing_id and l.status = 'published' and l.type = 'routes') then
      raise exception 'This listing isn''t taking document requests' using errcode = 'P0001'; end if;
    new.buyer := auth.uid(); new.status := 'requested'; new.nda_at := now(); new.created_at := now(); new.decided_at := null;
    new.buyer_email := (select u.email from auth.users u where u.id = auth.uid());
    return new;
  end if;
  -- UPDATE
  new.listing_id := old.listing_id; new.buyer := old.buyer; new.buyer_email := old.buyer_email; new.created_at := old.created_at;
  if is_owner then
    if new.status not in ('granted','declined','revoked') then raise exception 'Choose grant, decline or revoke' using errcode = 'P0001'; end if;
    new.nda_at := old.nda_at; new.note := old.note; new.decided_at := now();
  elsif old.buyer = auth.uid() then
    -- a buyer can ask again after a decline or revoke; that re-accepts the confidentiality terms
    if old.status not in ('declined','revoked') or new.status <> 'requested' then raise exception 'Your request is already with the seller' using errcode = 'P0001'; end if;
    new.nda_at := now(); new.decided_at := null;
  else
    raise exception 'Not allowed' using errcode = '42501';
  end if;
  return new;
end $$;
create trigger vg_doc_access_guard before insert or update on public.vg_doc_access for each row execute function public.vg_doc_access_guard();

create or replace function public.vg_doc_view_guard() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  new.viewer := auth.uid(); new.at := now();
  if not exists (select 1 from public.vg_doc_files f where f.id = new.file_id and (f.owner = auth.uid() or vg_private.vg_has_doc_access(f.listing_id))) then
    raise exception 'Not allowed' using errcode = '42501'; end if;
  return new;
end $$;
create trigger vg_doc_view_guard before insert on public.vg_doc_views for each row execute function public.vg_doc_view_guard();

create or replace function public.vg_support_guard() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  if tg_op = 'INSERT' then new.user_id := auth.uid(); new.status := 'open'; new.created_at := now(); end if;
  return new;
end $$;
create trigger vg_support_guard before insert on public.vg_support for each row execute function public.vg_support_guard();

revoke execute on function public.vg_doc_file_guard(), public.vg_doc_access_guard(), public.vg_doc_view_guard(), public.vg_support_guard() from public, anon, authenticated;

-- row-level security
alter table public.vg_doc_files enable row level security;
alter table public.vg_doc_access enable row level security;
alter table public.vg_doc_views enable row level security;
alter table public.vg_support enable row level security;

create policy vg_doc_files_read on public.vg_doc_files for select to authenticated
  using (owner = (select auth.uid()) or (select vg_private.vg_has_doc_access(listing_id)) or (select vg_private.vg_is_admin()));
create policy vg_doc_files_insert on public.vg_doc_files for insert to authenticated with check (owner = (select auth.uid()));
create policy vg_doc_files_delete on public.vg_doc_files for delete to authenticated using (owner = (select auth.uid()));

create policy vg_doc_access_read on public.vg_doc_access for select to authenticated
  using (buyer = (select auth.uid()) or (select vg_private.vg_owns_listing(listing_id)) or (select vg_private.vg_is_admin()));
create policy vg_doc_access_insert on public.vg_doc_access for insert to authenticated with check (buyer = (select auth.uid()));
create policy vg_doc_access_update on public.vg_doc_access for update to authenticated
  using (buyer = (select auth.uid()) or (select vg_private.vg_owns_listing(listing_id)));

create policy vg_doc_views_read on public.vg_doc_views for select to authenticated
  using (viewer = (select auth.uid()) or exists (select 1 from public.vg_doc_files f where f.id = file_id and f.owner = (select auth.uid())));
create policy vg_doc_views_insert on public.vg_doc_views for insert to authenticated with check (viewer = (select auth.uid()));

create policy vg_support_insert on public.vg_support for insert to anon, authenticated with check (true);
create policy vg_support_read on public.vg_support for select to authenticated using ((select vg_private.vg_is_admin()));
create policy vg_support_update on public.vg_support for update to authenticated using ((select vg_private.vg_is_admin()));

-- storage: buyers with granted access can read room files; owners and staff as before
drop policy if exists vg_docs_read on storage.objects;
create policy vg_docs_read on storage.objects for select to authenticated
  using (bucket_id = 'vg-docs' and (owner = (select auth.uid()) or (select vg_private.vg_is_admin()) or (select vg_private.vg_can_read_doc(name))));
create policy vg_docs_delete on storage.objects for delete to authenticated
  using (bucket_id = 'vg-docs' and owner = (select auth.uid()));

-- Route financials are often spreadsheets: widen what the private documents bucket accepts.
update storage.buckets set file_size_limit = 20971520, allowed_mime_types = array['application/pdf','image/jpeg','image/png','image/webp','image/heic','image/heif','text/plain','text/csv','application/vnd.openxmlformats-officedocument.spreadsheetml.sheet','application/vnd.ms-excel','application/vnd.openxmlformats-officedocument.wordprocessingml.document','application/msword'] where id = 'vg-docs';
