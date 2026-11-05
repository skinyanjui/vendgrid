-- Message photos live in a private bucket and are shown through short-lived signed URLs.
insert into storage.buckets (id, name, public) values ('vg-msg', 'vg-msg', false) on conflict (id) do nothing;

create or replace function vg_private.vg_in_conversation(p_conv text)
returns boolean language sql stable security definer set search_path = '' as $$
  select exists (select 1 from public.vg_conversations c
                 where c.id::text = p_conv and auth.uid() in (c.buyer, c.seller));
$$;

create policy vg_msg_photos_insert on storage.objects for insert to authenticated
  with check (bucket_id = 'vg-msg' and (select vg_private.vg_in_conversation((storage.foldername(name))[1])));
create policy vg_msg_photos_read on storage.objects for select to authenticated
  using (bucket_id = 'vg-msg' and ((select vg_private.vg_in_conversation((storage.foldername(name))[1])) or (select vg_private.vg_is_admin())));
