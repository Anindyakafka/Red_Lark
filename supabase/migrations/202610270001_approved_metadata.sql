begin;

-- Keep owner edits limited to private drafts. Published facets are editable
-- only through the fresh-MFA administrator path.
create or replace function public.save_work_facets(p_work uuid,p_categories text[],p_tags text[]) returns void
language plpgsql security definer set search_path='' as $$
declare w public.works; v text; tag_id text; display_label text; labels text[]='{}'; ids text[]='{}';
begin
 select * into w from public.works where id=p_work for update;
 if not found or not (
   coalesce(auth.jwt()->>'role','')='service_role' or private.admin_fresh() or
   (coalesce(w.owner_id=auth.uid(),false) and w.status in ('draft','changes_requested'))
 ) then raise exception 'Work access denied'; end if;
 if w.status not in ('draft','changes_requested','pending') and
    not (w.status='approved' and w.publication_state in ('published','failed') and private.admin_fresh())
 then raise exception 'Editable work required'; end if;
 if exists(select 1 from unnest(p_categories) s where not exists(select 1 from public.categories c where c.slug=s)) then raise exception 'Canonical categories required'; end if;
 foreach v in array coalesce(p_tags,'{}') loop
  v=btrim(regexp_replace(regexp_replace(regexp_replace(v,'<[^>]*>','','g'),'[[:cntrl:]]','','g'),'\s+',' ','g'));
  if v='' then continue; end if;
  if length(v)>30 then raise exception 'Tag exceeds 30 characters'; end if;
  if exists(select 1 from unnest(labels) s where lower(s)=lower(v)) then continue; end if;
  select t.slug,t.label into tag_id,display_label from public.tags t where lower(t.label)=lower(v) order by t.custom,t.slug limit 1;
  if not found then
   tag_id='tag-'||md5(lower(v));
   insert into public.tags(slug,label,custom) values(tag_id,v,true) on conflict(slug) do nothing;
   select t.label into display_label from public.tags t where t.slug=tag_id;
  end if;
  labels=array_append(labels,display_label); ids=array_append(ids,tag_id);
  if cardinality(labels)>10 then raise exception 'At most 10 tags'; end if;
 end loop;
 delete from public.work_categories where work_id=p_work;
 insert into public.work_categories(work_id,category_slug) select p_work,s from unnest(p_categories) s on conflict do nothing;
 delete from public.work_tags where work_id=p_work;
 insert into public.work_tags(work_id,tag_slug) select p_work,s from unnest(ids) s on conflict do nothing;
 update public.works set tags=labels where id=p_work;
 if private.admin_fresh() then insert into public.audit_log(actor_id,action,target_id) values(auth.uid(),'review_metadata',p_work::text); end if;
end $$;

create or replace function public.review_work_metadata(p_work uuid,p_title text,p_alt text,p_format text,p_categories text[],p_tags text[]) returns void
language plpgsql security definer set search_path='' as $$
begin
 if not private.admin_fresh() then raise exception 'Fresh admin TOTP required'; end if;
 perform 1 from public.works where id=p_work and
   (status in ('pending','changes_requested') or
    (status='approved' and publication_state in ('published','failed'))) for update;
 if not found then raise exception 'Reviewable work required'; end if;
 update public.works set title=p_title,alt=p_alt,format_slug=p_format where id=p_work;
 perform public.save_work_facets(p_work,p_categories,p_tags);
end $$;

revoke all on function public.save_work_facets(uuid,text[],text[]) from public,anon;
revoke all on function public.review_work_metadata(uuid,text,text,text,text[],text[]) from public,anon;
grant execute on function public.save_work_facets(uuid,text[],text[]) to authenticated,service_role;
grant execute on function public.review_work_metadata(uuid,text,text,text,text[],text[]) to authenticated;

commit;
