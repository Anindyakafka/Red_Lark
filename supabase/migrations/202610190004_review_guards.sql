begin;
create function private.guard_review() returns trigger language plpgsql security definer set search_path='' as $$
begin
 if private.is_admin() and new.status<>old.status then
   if not ((old.status='pending' and new.status in ('approved','changes_requested','rejected')) or (old.status='approved' and new.status='taken_down')) then raise exception 'Invalid review transition'; end if;
   if old.publication_state='copying' and new.status<>'approved' then raise exception 'Publication already claimed'; end if;
 end if;
 return new;
end $$;
revoke all on function private.guard_review() from public,anon,authenticated;
create trigger guard_review before update on public.works for each row execute function private.guard_review();

create function public.audit_admin_operation(p_action text,p_target text default null) returns void language plpgsql security definer set search_path='' as $$
begin
 if not private.admin_fresh() then raise exception 'Fresh administrator TOTP required'; end if;
 if p_action not in ('retry_publish','retry_mail') then raise exception 'Unknown admin operation'; end if;
 insert into public.audit_log(actor_id,action,target_id) values(auth.uid(),p_action,left(p_target,200));
end $$;
revoke all on function public.audit_admin_operation(text,text) from public,anon;
grant execute on function public.audit_admin_operation(text,text) to authenticated;
commit;
