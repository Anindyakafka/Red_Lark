-- Supabase Auth + Postgres only. ALL files live in Cloudflare R2.
begin;
create schema if not exists private;
revoke all on schema private from public;
grant usage on schema private to authenticated, service_role;

create table public.roles (
  user_id uuid references auth.users(id) on delete cascade,
  role text not null check (role in ('contributor','admin')),
  primary key (user_id, role)
);
create function private.is_admin() returns boolean language sql stable security definer
set search_path = '' as $$
  select coalesce((auth.jwt()->>'aal') = 'aal2', false)
    and exists(select 1 from public.roles where user_id=auth.uid() and role='admin');
$$;
revoke all on function private.is_admin() from public;
grant execute on function private.is_admin() to authenticated, service_role;
create function private.admin_fresh() returns boolean language sql stable security definer set search_path='' as $$
  select private.is_admin() and exists (
    select 1 from jsonb_array_elements(coalesce(auth.jwt()->'amr','[]')) m
    where m->>'method'='totp' and (m->>'timestamp')::numeric >= extract(epoch from now())-600
      and (m->>'timestamp')::numeric <= extract(epoch from now())+30
  );
$$;
revoke all on function private.admin_fresh() from public;
grant execute on function private.admin_fresh() to authenticated,service_role;

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  artist_name text not null default '' check(length(artist_name)<=120),
  bio text not null default '' check(length(bio)<=3000),
  contact text not null default '' check(length(contact)<=254),
  contact_public boolean not null default false,
  upi text not null default '' check(length(upi)<=150),
  upi_public boolean not null default false,
  created_at timestamptz not null default now()
);
create table public.categories (slug text primary key, label text not null unique);
create table public.formats (slug text primary key, label text not null unique);
create table public.licences (
  id text primary key, url text not null, derivatives boolean not null,
  commercial boolean not null, share_alike boolean not null
);
create table public.works (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid references auth.users(id) on delete set null,
  slug text not null unique check(slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  title text not null check(length(title) between 1 and 200),
  artist_name text not null check(length(artist_name) between 1 and 120),
  caption text not null default '' check(length(caption)<=5000),
  alt text not null check(length(alt) between 10 and 1000),
  source text not null check(source ~ '^https://'),
  licence_id text not null references public.licences(id) default 'CC-BY-SA-4.0',
  remixable boolean not null default true,
  format_slug text not null references public.formats(slug),
  languages text[] not null default array['English'],
  translations jsonb not null default '{}',
  tags text[] not null default '{}',
  ai_use text not null default 'none' check(ai_use in ('none','minimal-assisted','generated')),
  ai_disclosure text not null default '' check(length(ai_disclosure)<=2000),
  consent_contact text not null default '',
  consent_upi text not null default '',
  placeholder boolean not null default false,
  status text not null default 'draft' check(status in ('draft','pending','approved','changes_requested','rejected','taken_down')),
  feedback text not null default '',
  public_url text,
  public_preview_url text,
  publication_state text not null default 'private' check(publication_state in ('private','copying','published','removing','failed')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create table public.work_files (
  id uuid primary key default gen_random_uuid(),
  work_id uuid not null references public.works(id) on delete cascade,
  object_key text not null unique,
  public_key text unique,
  kind text not null check(kind in ('original','sanitized','preview','pdf-a4','pdf-a2')),
  mime text not null,
  bytes bigint not null check(bytes>0),
  width integer, height integer, dpi numeric,
  sha256 text,
  created_at timestamptz not null default now()
);
create table public.work_categories (
  work_id uuid references public.works(id) on delete cascade,
  category_slug text references public.categories(slug),
  primary key(work_id,category_slug)
);
create table public.tags (slug text primary key, label text not null);
create table public.work_tags (
  work_id uuid references public.works(id) on delete cascade,
  tag_slug text references public.tags(slug), primary key(work_id,tag_slug)
);
create table public.images (code text primary key, work_id uuid references public.works(id) on delete cascade, layer_data jsonb not null default '[]');
create table public.captions (code text primary key, work_id uuid references public.works(id) on delete cascade, text text not null);
create table public.messages (
  id uuid primary key default gen_random_uuid(),
  submission_key uuid not null unique,
  topic text not null, body text not null check(length(body) between 10 and 3000),
  reply_email text not null default '',
  locale text not null default 'en' check(locale in ('en','hi','bn','ml')),
  status text not null default 'new' check(status in ('new','resolved')),
  created_at timestamptz not null default now()
);
create table public.takedown_requests (
  id uuid primary key default gen_random_uuid(),
  message_id uuid not null unique references public.messages(id) on delete cascade,
  work_url text not null, status text not null default 'new',
  created_at timestamptz not null default now()
);
create table public.reports (
  id uuid primary key default gen_random_uuid(), message_id uuid references public.messages(id) on delete cascade,
  status text not null default 'new', created_at timestamptz not null default now()
);
create table public.audit_log (
  id bigint generated always as identity primary key,
  actor_id uuid, action text not null, target_id text, detail jsonb not null default '{}',
  created_at timestamptz not null default now()
);
create table public.rate_limits (
  key_hash text primary key check(length(key_hash)=64), count integer not null default 1,
  expires_at timestamptz not null
);
create table public.app_sessions (
  token_hash text primary key check(length(token_hash)=64),
  user_id uuid not null references auth.users(id) on delete cascade,
  encrypted_auth text not null,
  expires_at timestamptz not null,
  fresh_until timestamptz,
  created_at timestamptz not null default now()
);
create table public.uploads (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  work_id uuid not null references public.works(id) on delete cascade,
  object_key text not null unique,
  mime text not null check(mime in ('image/jpeg','image/png')),
  bytes integer not null check(bytes between 1 and 26214400),
  expires_at timestamptz not null,
  state text not null default 'issued' check(state in ('issued','processing','complete','failed')),
  created_at timestamptz not null default now()
);
create table public.mail_jobs (
  id uuid primary key default gen_random_uuid(),
  message_id uuid references public.messages(id) on delete cascade,
  kind text not null check(kind in ('team','ack')),
  state text not null default 'pending' check(state in ('pending','sending','sent','failed')),
  attempts integer not null default 0,
  provider_id text, last_error text,
  next_attempt timestamptz not null default now(),
  lease_until timestamptz,
  unique(message_id,kind)
);

-- No table is left outside RLS. Server-only tables intentionally have no client policies.
do $$ declare t text; begin
  foreach t in array array['roles','profiles','categories','formats','licences','works','work_files','work_categories','tags','work_tags','images','captions','messages','takedown_requests','reports','audit_log','rate_limits','app_sessions','uploads','mail_jobs'] loop
    execute format('alter table public.%I enable row level security',t);
    execute format('revoke all on public.%I from public, anon, authenticated',t);
    execute format('grant all on public.%I to service_role',t);
  end loop;
end $$;
grant usage, select on sequence public.audit_log_id_seq to service_role;
grant select on public.roles to authenticated;
create policy own_roles on public.roles for select to authenticated using(user_id=auth.uid());
grant select,insert,update on public.profiles to authenticated;
create policy profile_read on public.profiles for select to authenticated using(id=auth.uid() or private.is_admin());
create policy profile_create on public.profiles for insert to authenticated with check(id=auth.uid());
create policy profile_edit on public.profiles for update to authenticated using(id=auth.uid()) with check(id=auth.uid());

do $$ declare t text; begin
  foreach t in array array['categories','formats','licences','tags'] loop
    execute format('grant select on public.%I to anon, authenticated',t);
    execute format('create policy reference_read on public.%I for select to anon, authenticated using(true)',t);
    execute format('grant insert, update, delete on public.%I to authenticated',t);
    execute format('create policy reference_admin on public.%I for all to authenticated using(private.admin_fresh()) with check(private.admin_fresh())',t);
  end loop;
end $$;
grant select(id,slug,title,artist_name,caption,alt,source,licence_id,remixable,format_slug,languages,translations,tags,ai_use,ai_disclosure,placeholder,status,publication_state,public_url,public_preview_url,created_at) on public.works to anon;
create policy approved_public on public.works for select to anon using(status='approved' and publication_state='published');
grant select,insert,update,delete on public.works to authenticated;
create policy own_work_read on public.works for select to authenticated using(owner_id=auth.uid() or private.is_admin());
create policy own_work_create on public.works for insert to authenticated with check(owner_id=auth.uid() and status='draft' and publication_state='private' and public_url is null and public_preview_url is null);
create policy own_work_edit on public.works for update to authenticated using((owner_id=auth.uid() and status in ('draft','changes_requested')) or private.is_admin()) with check(owner_id=auth.uid() or private.is_admin());
create policy own_work_delete on public.works for delete to authenticated using(owner_id=auth.uid() and status='draft');

create function private.guard_work() returns trigger language plpgsql security definer set search_path='' as $$
declare allowed boolean; begin
  select derivatives into allowed from public.licences where id=new.licence_id;
  if new.remixable and not coalesce(allowed,false) then raise exception 'Licence prohibits derivatives'; end if;
  if private.is_admin() and not private.admin_fresh() then raise exception 'Fresh TOTP required'; end if;
  if TG_OP='UPDATE' and (auth.jwt()->>'role') is distinct from 'service_role' and not private.is_admin() then
    if new.owner_id is distinct from old.owner_id or new.public_url is distinct from old.public_url
       or new.public_preview_url is distinct from old.public_preview_url or new.publication_state<>old.publication_state
       or new.feedback<>old.feedback or new.placeholder<>old.placeholder then raise exception 'Protected publication fields'; end if;
    if new.status not in ('draft','pending') or old.status not in ('draft','changes_requested') then raise exception 'Invalid contributor transition'; end if;
    if new.consent_contact<>'' or new.consent_upi<>'' then
      if not exists(select 1 from public.profiles where id=auth.uid()
        and (new.consent_contact='' or (contact_public and contact=new.consent_contact))
        and (new.consent_upi='' or (upi_public and upi=new.consent_upi))) then raise exception 'Explicit field consent required'; end if;
    end if;
  end if;
  if TG_OP='INSERT' and (auth.jwt()->>'role') is distinct from 'service_role' then
    if new.placeholder or new.consent_contact<>'' or new.consent_upi<>'' then raise exception 'Protected initial fields'; end if;
  end if;
  new.updated_at=now(); return new;
end $$;
create trigger guard_work before insert or update on public.works for each row execute function private.guard_work();

create function private.audit_change() returns trigger language plpgsql security definer set search_path='' as $$
begin
  if private.is_admin() then
    insert into public.audit_log(actor_id,action,target_id,detail) values(auth.uid(),TG_TABLE_NAME||':'||TG_OP,
      coalesce(to_jsonb(new)->>'id',to_jsonb(new)->>'slug',to_jsonb(old)->>'id',to_jsonb(old)->>'slug'),
      jsonb_build_object('table',TG_TABLE_NAME));
  end if;
  return coalesce(new,old);
end $$;
do $$ declare t text; begin
  foreach t in array array['works','profiles','categories','formats','licences','tags','messages','takedown_requests','reports'] loop
    execute format('create trigger audit_change after insert or update or delete on public.%I for each row execute function private.audit_change()',t);
  end loop;
end $$;

-- Only sanitized approved file metadata is anonymous. Private keys never leave owner/admin APIs.
grant select(id,work_id,public_key,kind,mime,bytes,width,height,dpi,sha256) on public.work_files to anon;
create policy public_files on public.work_files for select to anon using(public_key is not null and exists(select 1 from public.works w where w.id=work_id and w.status='approved' and w.publication_state='published'));
grant select on public.work_files, public.uploads to authenticated;
create policy own_files on public.work_files for select to authenticated using(exists(select 1 from public.works w where w.id=work_id and w.owner_id=auth.uid()) or private.is_admin());
create policy own_uploads on public.uploads for select to authenticated using(user_id=auth.uid() or private.is_admin());
do $$ declare t text; begin
  foreach t in array array['work_categories','work_tags','images','captions'] loop
    execute format('grant select on public.%I to anon, authenticated',t);
    execute format('create policy published_reference on public.%I for select to anon using(exists(select 1 from public.works w where w.id=work_id and w.status=''approved'' and w.publication_state=''published''))',t);
    execute format('create policy owned_reference on public.%I for select to authenticated using(exists(select 1 from public.works w where w.id=work_id and w.owner_id=auth.uid()) or private.is_admin())',t);
  end loop;
end $$;
grant insert,update,delete on public.work_categories,public.work_tags to authenticated;
create policy own_category_edit on public.work_categories for all to authenticated using(exists(select 1 from public.works w where w.id=work_id and w.owner_id=auth.uid() and w.status in ('draft','changes_requested'))) with check(exists(select 1 from public.works w where w.id=work_id and w.owner_id=auth.uid() and w.status in ('draft','changes_requested')));
create policy own_tag_edit on public.work_tags for all to authenticated using(exists(select 1 from public.works w where w.id=work_id and w.owner_id=auth.uid() and w.status in ('draft','changes_requested'))) with check(exists(select 1 from public.works w where w.id=work_id and w.owner_id=auth.uid() and w.status in ('draft','changes_requested')));
do $$ declare t text; begin
  foreach t in array array['messages','takedown_requests','reports'] loop
    execute format('grant select, update on public.%I to authenticated',t);
    execute format('create policy admin_inbox on public.%I for all to authenticated using(private.admin_fresh()) with check(private.admin_fresh())',t);
  end loop;
end $$;
grant select on public.audit_log to authenticated;
create policy admin_audit on public.audit_log for select to authenticated using(private.is_admin());

create function public.consume_rate_limit(p_key text,p_limit integer,p_expires timestamptz) returns boolean
language plpgsql security definer set search_path='' as $$ declare n integer; begin
  delete from public.rate_limits where expires_at<now();
  insert into public.rate_limits(key_hash,count,expires_at) values(p_key,1,p_expires)
  on conflict(key_hash) do update set count=public.rate_limits.count+1 returning count into n;
  return n<=p_limit;
end $$;
revoke all on function public.consume_rate_limit(text,integer,timestamptz) from public,anon,authenticated;
grant execute on function public.consume_rate_limit(text,integer,timestamptz) to service_role;

create function public.bootstrap_admin(p_email text) returns uuid language plpgsql security definer set search_path='' as $$
declare target uuid; inserted integer; begin
  select u.id into target from auth.users u where lower(u.email)=lower(p_email)
    and u.email_confirmed_at is not null and u.last_sign_in_at is not null
    and exists(select 1 from auth.mfa_factors f where f.user_id=u.id and f.factor_type='totp' and f.status='verified');
  if target is null then raise exception 'Verified email, real login and verified TOTP required'; end if;
  insert into public.roles(user_id,role) values(target,'admin') on conflict do nothing;
  get diagnostics inserted = row_count;
  if inserted>0 then insert into public.audit_log(actor_id,action,target_id) values(target,'admin_bootstrap',target::text); end if;
  return target;
end $$;
revoke all on function public.bootstrap_admin(text) from public,anon,authenticated;
grant execute on function public.bootstrap_admin(text) to service_role;

create function public.public_catalogue() returns jsonb language sql stable security definer set search_path='' as $$
 select coalesce(jsonb_agg(jsonb_build_object(
   'id',w.id,'slug',w.slug,'title',w.title,'artist_name',w.artist_name,
   'artist_id','artist-'||substr(md5(coalesce(w.owner_id::text,w.artist_name)),1,16),
   'caption',w.caption,'alt',w.alt,'source',w.source,'licence_id',w.licence_id,
   'remixable',w.remixable,'format_slug',w.format_slug,'languages',w.languages,
   'translations',w.translations,'tags',w.tags,'ai_use',w.ai_use,'ai_disclosure',w.ai_disclosure,
   'placeholder',w.placeholder,'public_url',w.public_url,'public_preview_url',w.public_preview_url,
   'created_at',w.created_at,
   'contact',case when p.contact_public and p.contact=w.consent_contact then p.contact else '' end,
   'upi',case when p.upi_public and p.upi=w.consent_upi then p.upi else '' end,
   'categories',coalesce((select jsonb_agg(category_slug) from public.work_categories where work_id=w.id),'[]'),
   'files',coalesce((select jsonb_agg(jsonb_build_object('kind',f.kind,'key',f.public_key,'mime',f.mime,'bytes',f.bytes,'width',f.width,'height',f.height,'dpi',f.dpi)) from public.work_files f where f.work_id=w.id and f.public_key is not null),'[]')
 ) order by w.created_at desc),'[]') from public.works w left join public.profiles p on p.id=w.owner_id
 where w.status='approved' and w.publication_state='published';
$$;
revoke all on function public.public_catalogue() from public;
grant execute on function public.public_catalogue() to anon,authenticated,service_role;

create function public.audit_admin_access(p_action text,p_target text default null) returns void language plpgsql security definer set search_path='' as $$
begin
 if not private.is_admin() then raise exception 'Admin MFA required'; end if;
 if p_action not in ('review_queue','inbox','audit_read','review_file','users_read','export_review') then raise exception 'Unknown audit action'; end if;
 insert into public.audit_log(actor_id,action,target_id) values(auth.uid(),p_action,left(p_target,200));
end $$;
revoke all on function public.audit_admin_access(text,text) from public;
grant execute on function public.audit_admin_access(text,text) to authenticated;

-- Append-only audit/session/mail tables have no general client write privileges.
revoke all on all functions in schema private from public,anon;
grant execute on function private.is_admin() to authenticated,service_role;
grant execute on function private.admin_fresh() to authenticated,service_role;
commit;
