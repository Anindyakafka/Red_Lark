begin;

-- Administrator TOTP remains tied to AAL2, role and the last verification time.
-- The site cookie and stored app session use the same 30-day maximum for admins.
create or replace function private.admin_fresh() returns boolean
language sql stable security definer set search_path='' as $$
 select private.is_admin() and exists (
   select 1 from jsonb_array_elements(coalesce(auth.jwt()->'amr','[]')) m
   where m->>'method'='totp'
     and (m->>'timestamp')::numeric >= extract(epoch from now())-2592000
     and (m->>'timestamp')::numeric <= extract(epoch from now())+30
 );
$$;
revoke all on function private.admin_fresh() from public;
grant execute on function private.admin_fresh() to authenticated,service_role;

commit;
