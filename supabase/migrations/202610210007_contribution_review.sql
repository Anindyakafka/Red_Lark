begin;
-- Uploaded descriptions are optional. Archive files retain their stricter validator.
alter table public.works drop constraint works_alt_check;
alter table public.works alter column alt set default '';
alter table public.works add constraint works_alt_check check(length(alt)<=300) not valid;
alter table public.tags add column custom boolean not null default true;
do $$ declare suggested_label text; begin
 foreach suggested_label in array array['Protest','Placard','Satire','Solidarity','History','Women','Youth','Students','Labour','Land','Rights','Poem/Text','Hand-drawn','Linocut','Screenprint','Risograph','Digital collage','Photograph-based','Typography','Illustration'] loop
  if exists(select 1 from public.tags t where lower(t.label)=lower(suggested_label)) then
   update public.tags t set custom=false where lower(t.label)=lower(suggested_label);
  else
   insert into public.tags(slug,label,custom) values('tag-'||md5(lower(suggested_label)),suggested_label,false);
  end if;
 end loop;
end $$;

-- One transaction replaces BOTH facets and the public snapshot tag labels.
create function public.save_work_facets(p_work uuid,p_categories text[],p_tags text[]) returns void
language plpgsql security definer set search_path='' as $$
declare w public.works; v text; tag_id text; display_label text; labels text[]='{}'; ids text[]='{}';
begin
 select * into w from public.works where id=p_work for update;
 if not found or not (
   coalesce(auth.jwt()->>'role','')='service_role' or private.admin_fresh() or
   (coalesce(w.owner_id=auth.uid(),false) and w.status in ('draft','changes_requested'))
 ) then raise exception 'Work access denied'; end if;
 if w.status not in ('draft','changes_requested','pending') then raise exception 'Editable work required'; end if;
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
revoke all on function public.save_work_facets(uuid,text[],text[]) from public,anon;
grant execute on function public.save_work_facets(uuid,text[],text[]) to authenticated,service_role;

create function public.review_work_metadata(p_work uuid,p_title text,p_alt text,p_format text,p_categories text[],p_tags text[]) returns void
language plpgsql security definer set search_path='' as $$
begin
 if not private.admin_fresh() then raise exception 'Fresh admin TOTP required'; end if;
 perform 1 from public.works where id=p_work and status in ('pending','changes_requested') for update;
 if not found then raise exception 'Reviewable work required'; end if;
 update public.works set title=p_title,alt=p_alt,format_slug=p_format where id=p_work;
 perform public.save_work_facets(p_work,p_categories,p_tags);
end $$;
revoke all on function public.review_work_metadata(uuid,text,text,text,text[],text[]) from public,anon;
grant execute on function public.review_work_metadata(uuid,text,text,text,text[],text[]) to authenticated;

create function public.grant_admin(p_email text) returns void language plpgsql security definer set search_path='' as $$
declare target uuid; inserted integer;
begin
 select id into target from auth.users where lower(email)=lower(btrim(p_email)) and email_confirmed_at is not null;
 if target is null then raise exception 'Existing email-verified user required'; end if;
 insert into public.roles(user_id,role) values(target,'admin') on conflict do nothing;
 get diagnostics inserted=row_count;
 if inserted>0 then insert into public.audit_log(action,target_id) values('admin_grant',target::text); end if;
end $$;
revoke all on function public.grant_admin(text) from public,anon,authenticated;
grant execute on function public.grant_admin(text) to service_role;

-- Transactional outbox: decisions survive provider errors; never email unverified contacts.
create table public.work_notifications (
 id uuid primary key default gen_random_uuid(), work_id uuid not null references public.works(id) on delete cascade,
 event text not null check(event in ('pending','approved','changes_requested','rejected')),
 state text not null default 'pending' check(state in ('pending','sending','sent','failed')),
 attempts integer not null default 0, next_attempt timestamptz not null default now(),
 lease_until timestamptz, last_error text, created_at timestamptz not null default now()
);
alter table public.work_notifications enable row level security;
revoke all on public.work_notifications from public,anon,authenticated;
grant all on public.work_notifications to service_role;
grant select on public.work_notifications to authenticated;
create policy admin_notifications on public.work_notifications for select to authenticated using(private.admin_fresh());
create function private.queue_work_notification() returns trigger language plpgsql security definer set search_path='' as $$
begin
 if new.status in ('pending','approved','changes_requested','rejected') and (TG_OP='INSERT' or old.status<>new.status) then
  if new.status='pending' or exists(select 1 from auth.users where id=new.owner_id and email_confirmed_at is not null) then
   insert into public.work_notifications(work_id,event) values(new.id,new.status);
  end if;
 end if;
 return new;
end $$;
create trigger queue_work_notification after insert or update of status on public.works for each row execute function private.queue_work_notification();
commit;
