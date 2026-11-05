-- VendGrid marketplace schema (final state of the migrations applied to Supabase on 2026-11-05).
-- Every object is prefixed vg_ so it can live alongside other apps in a shared project.
-- Server-side rules: users cannot self-sponsor, self-verify, become admin, post as a business
-- they don't own, edit others' listings, or read other people's messages or private addresses.

create schema if not exists vg_private;
revoke all on schema vg_private from public;
grant usage on schema vg_private to anon, authenticated;

create table public.vg_orgs (
  id text primary key,
  name text not null check (length(name) between 2 and 120),
  slug text not null unique,
  city text,
  about text check (length(about) <= 1000),
  verified boolean not null default false,
  owner uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now()
);

create table public.vg_profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  name text check (length(name) <= 80),
  org_id text references public.vg_orgs(id) on delete set null,
  role text not null default 'member' check (role in ('member','admin')),
  created_at timestamptz not null default now()
);

create or replace function vg_private.vg_is_admin() returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (select 1 from public.vg_profiles p where p.user_id = auth.uid() and p.role = 'admin');
$$;

create or replace function vg_private.vg_owns_org(p_org text) returns boolean
language sql stable security definer set search_path = '' as $$
  select p_org is null or exists (select 1 from public.vg_orgs o where o.id = p_org and o.owner = auth.uid());
$$;
grant execute on function vg_private.vg_is_admin(), vg_private.vg_owns_org(text) to anon, authenticated;

create table public.vg_listings (
  id bigserial primary key,
  type text not null check (type in ('machines','parts','locations','routes','services','wanted')),
  org_id text references public.vg_orgs(id) on delete set null,
  owner uuid references auth.users(id) on delete cascade default auth.uid(),
  title text not null check (length(title) between 8 and 90),
  description text not null check (length(description) between 10 and 5000),
  city text not null, st text not null, lat double precision, lng double precision,
  price numeric check (price is null or price > 0),
  price_type text not null default 'fixed' check (price_type in ('fixed','negotiable','undisclosed','none')),
  fields jsonb not null default '{}'::jsonb,
  photos text[] not null default '{}' check (cardinality(photos) <= 8),
  status text not null default 'published' check (status in ('draft','pending_review','published','paused','sold','filled','expired','withdrawn','removed')),
  sponsored boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index vg_listings_type_status on public.vg_listings (type, status, created_at desc);
create index vg_listings_owner on public.vg_listings (owner);
create index vg_listings_org on public.vg_listings (org_id);

create table public.vg_listing_private (
  listing_id bigint primary key references public.vg_listings(id) on delete cascade,
  address text check (length(address) <= 200)
);

create table public.vg_favorites (
  user_id uuid not null references auth.users(id) on delete cascade default auth.uid(),
  listing_id bigint not null references public.vg_listings(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, listing_id)
);
create index vg_favorites_listing on public.vg_favorites (listing_id);

create table public.vg_saved_searches (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade default auth.uid(),
  name text not null check (length(name) <= 200),
  query jsonb not null,
  seen_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);
create index vg_saved_searches_user on public.vg_saved_searches (user_id);

create table public.vg_conversations (
  id uuid primary key default gen_random_uuid(),
  listing_id bigint not null references public.vg_listings(id) on delete cascade,
  buyer uuid not null references auth.users(id) on delete cascade default auth.uid(),
  seller uuid references auth.users(id) on delete set null,
  status text not null default 'open' check (status in ('open','closed')),
  blocked_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  unique (listing_id, buyer)
);
create index vg_conversations_seller on public.vg_conversations (seller);
create index vg_conversations_buyer on public.vg_conversations (buyer);
create index vg_conversations_blocked_by on public.vg_conversations (blocked_by);

create table public.vg_messages (
  id bigserial primary key,
  conversation_id uuid not null references public.vg_conversations(id) on delete cascade,
  sender uuid not null references auth.users(id) on delete cascade default auth.uid(),
  body text not null default '' check (length(body) <= 4000),
  images text[] not null default '{}' check (cardinality(images) <= 4),
  created_at timestamptz not null default now(),
  check (length(body) > 0 or cardinality(images) > 0)
);
create index vg_messages_conv on public.vg_messages (conversation_id, created_at);
create index vg_messages_sender on public.vg_messages (sender, created_at);

create table public.vg_reports (
  id bigserial primary key,
  listing_id bigint not null references public.vg_listings(id) on delete cascade,
  reporter uuid not null references auth.users(id) on delete cascade default auth.uid(),
  reason text not null check (length(reason) <= 200),
  status text not null default 'open' check (status in ('open','dismissed','actioned')),
  created_at timestamptz not null default now()
);
create index vg_reports_listing on public.vg_reports (listing_id);
create index vg_reports_reporter on public.vg_reports (reporter);

create table public.vg_verification (
  org_id text primary key references public.vg_orgs(id) on delete cascade,
  status text not null default 'submitted' check (status in ('submitted','verified','rejected')),
  legal_name text not null, phone text not null, domain text not null, doc_path text,
  submitted_by uuid not null references auth.users(id) on delete cascade default auth.uid(),
  reason text, expires_at timestamptz,
  created_at timestamptz not null default now()
);
create index vg_verification_submitted_by on public.vg_verification (submitted_by);
create index vg_orgs_owner on public.vg_orgs (owner);
create index vg_profiles_org on public.vg_profiles (org_id);

-- ── guards ──
create or replace function public.vg_listing_guard() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  if tg_op = 'INSERT' then
    if not vg_private.vg_is_admin() then
      new.owner := auth.uid();
      new.sponsored := false;
      if new.status not in ('draft','published') then new.status := 'published'; end if;
      if not vg_private.vg_owns_org(new.org_id) then raise exception 'You can only post as your own business' using errcode = 'P0001'; end if;
      if (select count(*) from public.vg_listings l where l.owner = auth.uid() and l.created_at > now() - interval '1 day') >= 20 then
        raise exception 'Daily listing limit reached' using errcode = 'P0001';
      end if;
    end if;
  else
    if not vg_private.vg_is_admin() then
      new.owner := old.owner; new.sponsored := old.sponsored; new.created_at := old.created_at;
      if new.org_id is distinct from old.org_id and not vg_private.vg_owns_org(new.org_id) then raise exception 'You can only post as your own business' using errcode = 'P0001'; end if;
      if new.status = 'removed' or old.status = 'removed' then raise exception 'Only staff can change removed listings' using errcode = 'P0001'; end if;
    end if;
    new.updated_at := now();
  end if;
  return new;
end $$;
create trigger vg_listing_guard before insert or update on public.vg_listings for each row execute function public.vg_listing_guard();

create or replace function public.vg_conversation_guard() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  if tg_op = 'INSERT' then
    new.buyer := auth.uid();
    select l.owner into new.seller from public.vg_listings l where l.id = new.listing_id and l.status = 'published';
    if not found then raise exception 'Listing is not accepting messages' using errcode = 'P0001'; end if;
    if new.seller = new.buyer then raise exception 'You cannot message your own listing' using errcode = 'P0001'; end if;
    new.status := 'open'; new.blocked_by := null;
  else
    new.listing_id := old.listing_id; new.buyer := old.buyer; new.seller := old.seller; new.created_at := old.created_at;
    if new.blocked_by is not null and new.blocked_by <> auth.uid() and new.blocked_by is distinct from old.blocked_by then new.blocked_by := old.blocked_by; end if;
  end if;
  return new;
end $$;
create trigger vg_conversation_guard before insert or update on public.vg_conversations for each row execute function public.vg_conversation_guard();

create or replace function public.vg_message_guard() returns trigger
language plpgsql security definer set search_path = '' as $$
declare c public.vg_conversations;
begin
  new.sender := auth.uid(); new.created_at := now();
  select * into c from public.vg_conversations where id = new.conversation_id;
  if c.id is null or auth.uid() not in (c.buyer, coalesce(c.seller, c.buyer)) then raise exception 'Not part of this conversation' using errcode = 'P0001'; end if;
  if c.status <> 'open' or c.blocked_by is not null then raise exception 'This conversation is closed' using errcode = 'P0001'; end if;
  if (select count(*) from public.vg_messages m where m.sender = auth.uid() and m.created_at > now() - interval '1 hour') >= 120 then
    raise exception 'Too many messages, try again later' using errcode = 'P0001';
  end if;
  return new;
end $$;
create trigger vg_message_guard before insert on public.vg_messages for each row execute function public.vg_message_guard();

create or replace function public.vg_profile_guard() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  if not vg_private.vg_is_admin() then
    if tg_op = 'INSERT' then new.role := 'member'; new.user_id := auth.uid();
    else new.role := old.role; new.user_id := old.user_id; end if;
    if new.org_id is not null and new.org_id is distinct from (case when tg_op = 'UPDATE' then old.org_id end) and not vg_private.vg_owns_org(new.org_id) then
      raise exception 'You can only link a business you own' using errcode = 'P0001';
    end if;
  end if;
  return new;
end $$;
create trigger vg_profile_guard before insert or update on public.vg_profiles for each row execute function public.vg_profile_guard();

create or replace function public.vg_verification_guard() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  if not vg_private.vg_is_admin() then
    if tg_op = 'INSERT' then
      if not exists (select 1 from public.vg_orgs o where o.id = new.org_id and o.owner = auth.uid()) then raise exception 'Only the business owner can apply' using errcode = 'P0001'; end if;
      new.status := 'submitted'; new.submitted_by := auth.uid(); new.reason := null; new.expires_at := null;
    else
      if old.status <> 'rejected' then raise exception 'Already under review' using errcode = 'P0001'; end if;
      new.status := 'submitted'; new.reason := null; new.expires_at := null; new.submitted_by := auth.uid();
    end if;
  elsif tg_op = 'UPDATE' and new.status is distinct from old.status then
    update public.vg_orgs set verified = (new.status = 'verified') where id = new.org_id;
    if new.status = 'verified' and new.expires_at is null then new.expires_at := now() + interval '1 year'; end if;
  end if;
  return new;
end $$;
create trigger vg_verification_guard before insert or update on public.vg_verification for each row execute function public.vg_verification_guard();

create or replace function public.vg_org_guard() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  if not vg_private.vg_is_admin() then
    if tg_op = 'INSERT' then new.owner := auth.uid(); new.verified := false;
    else new.owner := old.owner; new.verified := old.verified; new.id := old.id; end if;
  end if;
  return new;
end $$;
create trigger vg_org_guard before insert or update on public.vg_orgs for each row execute function public.vg_org_guard();

revoke execute on function public.vg_listing_guard(), public.vg_conversation_guard(), public.vg_message_guard(),
  public.vg_profile_guard(), public.vg_verification_guard(), public.vg_org_guard() from public, anon, authenticated;

-- ── row-level security ──
alter table public.vg_orgs enable row level security;
alter table public.vg_profiles enable row level security;
alter table public.vg_listings enable row level security;
alter table public.vg_listing_private enable row level security;
alter table public.vg_favorites enable row level security;
alter table public.vg_saved_searches enable row level security;
alter table public.vg_conversations enable row level security;
alter table public.vg_messages enable row level security;
alter table public.vg_reports enable row level security;
alter table public.vg_verification enable row level security;

create policy vg_orgs_read on public.vg_orgs for select using (true);
create policy vg_orgs_insert on public.vg_orgs for insert to authenticated with check (true);
create policy vg_orgs_update on public.vg_orgs for update to authenticated using (owner = (select auth.uid()) or (select vg_private.vg_is_admin()));

create policy vg_profiles_own on public.vg_profiles for select to authenticated using (user_id = (select auth.uid()) or (select vg_private.vg_is_admin()));
create policy vg_profiles_insert on public.vg_profiles for insert to authenticated with check (user_id = (select auth.uid()));
create policy vg_profiles_update on public.vg_profiles for update to authenticated using (user_id = (select auth.uid()) or (select vg_private.vg_is_admin()));

create policy vg_listings_read on public.vg_listings for select using (status in ('published','sold','filled') or owner = (select auth.uid()) or (select vg_private.vg_is_admin()));
create policy vg_listings_insert on public.vg_listings for insert to authenticated with check (true);
create policy vg_listings_update on public.vg_listings for update to authenticated using (owner = (select auth.uid()) or (select vg_private.vg_is_admin()));
create policy vg_listings_delete on public.vg_listings for delete to authenticated using (owner = (select auth.uid()) or (select vg_private.vg_is_admin()));

create policy vg_private_rw on public.vg_listing_private for all to authenticated
  using (exists (select 1 from public.vg_listings l where l.id = listing_id and (l.owner = (select auth.uid()) or (select vg_private.vg_is_admin()))))
  with check (exists (select 1 from public.vg_listings l where l.id = listing_id and l.owner = (select auth.uid())));

create policy vg_favorites_own on public.vg_favorites for all to authenticated using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));
create policy vg_searches_own on public.vg_saved_searches for all to authenticated using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));

create policy vg_conv_read on public.vg_conversations for select to authenticated using ((select auth.uid()) in (buyer, seller) or (select vg_private.vg_is_admin()));
create policy vg_conv_insert on public.vg_conversations for insert to authenticated with check (true);
create policy vg_conv_update on public.vg_conversations for update to authenticated using ((select auth.uid()) in (buyer, seller));

create policy vg_msg_read on public.vg_messages for select to authenticated using (exists (select 1 from public.vg_conversations c where c.id = conversation_id and ((select auth.uid()) in (c.buyer, c.seller) or (select vg_private.vg_is_admin()))));
create policy vg_msg_insert on public.vg_messages for insert to authenticated with check (true);

create policy vg_reports_insert on public.vg_reports for insert to authenticated with check (reporter = (select auth.uid()));
create policy vg_reports_read on public.vg_reports for select to authenticated using (reporter = (select auth.uid()) or (select vg_private.vg_is_admin()));
create policy vg_reports_admin on public.vg_reports for update to authenticated using ((select vg_private.vg_is_admin()));

create policy vg_verif_read on public.vg_verification for select to authenticated using (submitted_by = (select auth.uid()) or (select vg_private.vg_is_admin()));
create policy vg_verif_insert on public.vg_verification for insert to authenticated with check (true);
create policy vg_verif_update on public.vg_verification for update to authenticated using (submitted_by = (select auth.uid()) or (select vg_private.vg_is_admin()));

-- ── storage ──
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('vg-photos', 'vg-photos', true, 5242880, array['image/jpeg','image/png','image/webp'])
on conflict (id) do nothing;
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('vg-docs', 'vg-docs', false, 10485760, array['application/pdf','image/jpeg','image/png'])
on conflict (id) do nothing;

create policy vg_photos_insert on storage.objects for insert to authenticated with check (bucket_id = 'vg-photos' and (storage.foldername(name))[1] = (select auth.uid())::text);
create policy vg_photos_delete on storage.objects for delete to authenticated using (bucket_id = 'vg-photos' and owner = (select auth.uid()));
create policy vg_docs_insert on storage.objects for insert to authenticated with check (bucket_id = 'vg-docs' and (storage.foldername(name))[1] = (select auth.uid())::text);
create policy vg_docs_read on storage.objects for select to authenticated using (bucket_id = 'vg-docs' and (owner = (select auth.uid()) or (select vg_private.vg_is_admin())));
