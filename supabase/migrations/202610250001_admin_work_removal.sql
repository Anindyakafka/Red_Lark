begin;

create or replace function public.audit_admin_operation(p_action text,p_target text default null) returns void
language plpgsql security definer set search_path='' as $$
begin
 if not private.admin_fresh() then raise exception 'Fresh administrator TOTP required'; end if;
 if p_action not in ('retry_publish','retry_mail','take_down','remove_work') then
   raise exception 'Unknown admin operation';
 end if;
 insert into public.audit_log(actor_id,action,target_id) values(auth.uid(),p_action,left(p_target,200));
end $$;

revoke all on function public.audit_admin_operation(text,text) from public,anon;
grant execute on function public.audit_admin_operation(text,text) to authenticated;

commit;
