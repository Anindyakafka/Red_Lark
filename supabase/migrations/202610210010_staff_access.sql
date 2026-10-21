begin;
-- No address lookup or invitation capability is exposed to anonymous clients.
create function public.staff_email_allowed(p_email text) returns boolean
language sql stable security definer set search_path = '' as $$
 select exists(select 1 from auth.users u join public.roles r on r.user_id=u.id
 where lower(u.email)=lower(trim(p_email)) and r.role='admin' and u.email_confirmed_at is not null);
$$;
revoke all on function public.staff_email_allowed(text) from public, anon, authenticated;
grant execute on function public.staff_email_allowed(text) to service_role;

create function public.invite_staff(p_user uuid) returns void
language plpgsql security definer set search_path = '' as $$
begin
 if not exists(select 1 from auth.users where id=p_user) then raise exception 'unknown identity'; end if;
 insert into public.roles(user_id,role) values(p_user,'admin') on conflict do nothing;
 insert into public.audit_log(action,target_id) values('staff_invited',p_user::text);
end $$;
revoke all on function public.invite_staff(uuid) from public, anon, authenticated;
grant execute on function public.invite_staff(uuid) to service_role;
commit;
