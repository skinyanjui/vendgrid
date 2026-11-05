-- In-app notifications. Written only by database triggers; each person reads and dismisses their own.
create table public.vg_notifications (
  id bigint generated always as identity primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  kind text not null check (kind in ('doc_request','doc_granted','doc_declined','doc_revoked','verif_ok','verif_no','report_actioned')),
  title text not null,
  body text,
  href text not null default '#/',
  created_at timestamptz not null default now(),
  read_at timestamptz
);
create index vg_notifications_user on public.vg_notifications (user_id, created_at desc);

alter table public.vg_notifications enable row level security;
create policy vg_notif_read on public.vg_notifications for select to authenticated using (user_id = (select auth.uid()));
create policy vg_notif_update on public.vg_notifications for update to authenticated using (user_id = (select auth.uid()));
create policy vg_notif_delete on public.vg_notifications for delete to authenticated using (user_id = (select auth.uid()));

-- People may only mark their own notifications read; nothing else changes.
create or replace function public.vg_notif_guard() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  new.id := old.id; new.user_id := old.user_id; new.kind := old.kind; new.title := old.title;
  new.body := old.body; new.href := old.href; new.created_at := old.created_at;
  return new;
end $$;
create trigger vg_notif_guard before update on public.vg_notifications for each row execute function public.vg_notif_guard();

create or replace function vg_private.vg_notify(p_user uuid, p_kind text, p_title text, p_body text, p_href text) returns void
language sql security definer set search_path = '' as $$
  insert into public.vg_notifications (user_id, kind, title, body, href)
  select p_user, p_kind, left(p_title, 200), left(p_body, 500), p_href where p_user is not null;
$$;

create or replace function public.vg_doc_access_notify() returns trigger
language plpgsql security definer set search_path = '' as $$
declare l record;
begin
  select id, title, owner into l from public.vg_listings where id = new.listing_id;
  if new.status = 'requested' and (tg_op = 'INSERT' or old.status is distinct from 'requested') then
    perform vg_private.vg_notify(l.owner, 'doc_request', coalesce(new.buyer_email, 'A buyer') || ' asked to see the documents for ' || l.title,
      case when new.note is not null and new.note <> '' then '“' || new.note || '”' else 'They accepted the confidentiality terms.' end, '#/listing/' || l.id || '/x');
  elsif tg_op = 'UPDATE' and new.status is distinct from old.status then
    perform vg_private.vg_notify(new.buyer,
      case new.status when 'granted' then 'doc_granted' when 'declined' then 'doc_declined' else 'doc_revoked' end,
      case new.status when 'granted' then 'You can now open the documents for ' || l.title
                      when 'declined' then 'The seller declined your document request for ' || l.title
                      else 'The seller removed your access to the documents for ' || l.title end,
      case new.status when 'granted' then 'Links expire after five minutes, and the seller sees when you open each file.' else 'You can ask again from the listing.' end,
      '#/listing/' || l.id || '/x');
  end if;
  return null;
end $$;
create trigger vg_doc_access_notify after insert or update on public.vg_doc_access for each row execute function public.vg_doc_access_notify();

create or replace function public.vg_verification_notify() returns trigger
language plpgsql security definer set search_path = '' as $$
declare o text;
begin
  if new.status is distinct from old.status and new.status in ('verified','rejected') then
    select name into o from public.vg_orgs where id = new.org_id;
    perform vg_private.vg_notify(new.submitted_by, case when new.status = 'verified' then 'verif_ok' else 'verif_no' end,
      case when new.status = 'verified' then o || ' is now a Verified business' else 'Verification for ' || o || ' wasn’t approved' end,
      case when new.status = 'verified' then 'The badge shows on your listings for one year.' else coalesce(new.reason, 'Update your details and submit again.') end,
      '#/business-settings');
  end if;
  return null;
end $$;
create trigger vg_verification_notify after update on public.vg_verification for each row execute function public.vg_verification_notify();

create or replace function public.vg_report_notify() returns trigger
language plpgsql security definer set search_path = '' as $$
declare l record;
begin
  if new.status = 'actioned' and old.status is distinct from 'actioned' then
    select id, title, owner into l from public.vg_listings where id = new.listing_id;
    perform vg_private.vg_notify(l.owner, 'report_actioned', l.title || ' was withdrawn after a report',
      'Reason given: ' || new.reason || '. If you think this is a mistake, use Contact support.', '#/my-listings');
  end if;
  return null;
end $$;
create trigger vg_report_notify after update on public.vg_reports for each row execute function public.vg_report_notify();

revoke execute on function public.vg_notif_guard(), public.vg_doc_access_notify(), public.vg_verification_notify(), public.vg_report_notify() from public, anon, authenticated;

-- Uploaders can delete their own message photos (needed for account deletion requests).
create policy vg_msg_photos_delete on storage.objects for delete to authenticated using (bucket_id = 'vg-msg' and owner = (select auth.uid()));

-- Owners can see (and so delete) their own listing photos; the bucket stays public for viewing.
create policy vg_photos_owner_read on storage.objects for select to authenticated using (bucket_id = 'vg-photos' and owner = (select auth.uid()));
