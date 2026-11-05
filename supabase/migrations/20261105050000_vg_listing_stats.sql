-- Real listing statistics. Views are a per-listing daily total (no per-person tracking) and never count the seller's own visits.
create table public.vg_listing_views (
  listing_id bigint not null references public.vg_listings(id) on delete cascade,
  day date not null default current_date,
  n integer not null default 0,
  primary key (listing_id, day)
);
alter table public.vg_listing_views enable row level security;

create or replace function public.vg_count_view(p_listing bigint) returns void
language sql security definer set search_path = '' as $$
  insert into public.vg_listing_views (listing_id, day, n)
  select l.id, current_date, 1 from public.vg_listings l
  where l.id = p_listing and l.status = 'published' and l.owner is distinct from auth.uid()
  on conflict (listing_id, day) do update set n = public.vg_listing_views.n + 1;
$$;
grant execute on function public.vg_count_view(bigint) to anon, authenticated;

-- Owners read their own numbers here; favorites of other people stay private.
create or replace function public.vg_my_stats() returns table (listing_id bigint, views integer, saves integer, inquiries integer)
language sql stable security definer set search_path = '' as $$
  select l.id,
    coalesce((select sum(v.n) from public.vg_listing_views v where v.listing_id = l.id and v.day >= current_date - 29), 0)::int,
    (select count(*) from public.vg_favorites f where f.listing_id = l.id)::int,
    (select count(*) from public.vg_conversations c where c.listing_id = l.id)::int
  from public.vg_listings l where l.owner = auth.uid();
$$;
revoke execute on function public.vg_my_stats() from public, anon;
grant execute on function public.vg_my_stats() to authenticated;
