begin;
create function public.review_categories(p_work uuid,p_categories text[]) returns void language plpgsql security definer set search_path='' as $$
begin
 if not private.admin_fresh() then raise exception 'Fresh admin TOTP required'; end if;
 if not exists(select 1 from public.works where id=p_work and status in ('pending','changes_requested','approved')) then raise exception 'Reviewable work required'; end if;
 if cardinality(p_categories)>28 or exists(select 1 from unnest(p_categories) s where not exists(select 1 from public.categories c where c.slug=s)) then raise exception 'Canonical categories required'; end if;
 delete from public.work_categories where work_id=p_work;
 insert into public.work_categories(work_id,category_slug) select p_work,s from unnest(p_categories) s on conflict do nothing;
 insert into public.audit_log(actor_id,action,target_id) values(auth.uid(),'review_categories',p_work::text);
end $$;
revoke all on function public.review_categories(uuid,text[]) from public,anon;
grant execute on function public.review_categories(uuid,text[]) to authenticated;
commit;
