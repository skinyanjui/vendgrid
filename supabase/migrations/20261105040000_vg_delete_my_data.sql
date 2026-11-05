-- Self-service deletion of everything VendGrid holds for the signed-in person.
-- The sign-in itself (auth.users) is kept, because it may be shared with other apps on this project;
-- support can remove it on request. The app deletes the person's stored files first, then calls this.
create or replace function public.vg_delete_my_data() returns void
language plpgsql security definer set search_path = '' as $$
declare me uuid := auth.uid();
begin
  if me is null then raise exception 'Sign in first' using errcode = '42501'; end if;
  delete from public.vg_doc_views where viewer = me;
  delete from public.vg_doc_access where buyer = me;
  delete from public.vg_conversations where buyer = me;           -- conversations they started, with all messages
  delete from public.vg_listings where owner = me;                -- cascades rooms, requests, conversations on them
  delete from public.vg_messages where sender = me;               -- anything left
  delete from public.vg_favorites where user_id = me;
  delete from public.vg_saved_searches where user_id = me;
  delete from public.vg_reports where reporter = me;
  delete from public.vg_verification where submitted_by = me;
  delete from public.vg_notifications where user_id = me;
  update public.vg_support set user_id = null where user_id = me;
  delete from public.vg_profiles where user_id = me;
  delete from public.vg_orgs where owner = me;
end $$;
revoke execute on function public.vg_delete_my_data() from public, anon;
grant execute on function public.vg_delete_my_data() to authenticated;
