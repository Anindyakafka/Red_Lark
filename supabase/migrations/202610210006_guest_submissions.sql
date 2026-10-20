begin;

-- No auth.users row is created for a guest. Only a hash of the private receipt is stored.
create table public.guest_submissions (
  token_hash text primary key check (length(token_hash)=64),
  work_id uuid not null unique references public.works(id) on delete cascade,
  contact text not null default '',
  upi text not null default '',
  contact_public boolean not null default false,
  upi_public boolean not null default false,
  created_at timestamptz not null default now(),
  expires_at timestamptz not null default (now()+interval '90 days')
);
alter table public.guest_submissions enable row level security;
revoke all on public.guest_submissions from public,anon,authenticated;
grant all on public.guest_submissions to service_role;
grant select on public.guest_submissions to authenticated;
create policy guest_review on public.guest_submissions for select to authenticated
using (private.admin_fresh());

alter table public.uploads alter column user_id drop not null;
-- A guest ticket must still point to a single work and is never exposed via RLS.
create function public.finish_guest_upload(p_ticket uuid,p_work uuid,p_updated timestamptz,p_files jsonb) returns jsonb
language plpgsql security definer set search_path='' as $$
declare ticket public.uploads; work public.works; previous jsonb; begin
 select * into ticket from public.uploads where id=p_ticket and work_id=p_work and user_id is null and state='processing' for update;
 if not found then raise exception 'Guest upload ticket unavailable'; end if;
 select * into work from public.works where id=p_work and owner_id is null and status='draft' and updated_at=p_updated for update;
 if not found or not exists(select 1 from public.guest_submissions where work_id=p_work and expires_at>now()) then raise exception 'Guest draft unavailable'; end if;
 if jsonb_array_length(p_files)<>4 or exists(select 1 from jsonb_array_elements(p_files) f where f->>'kind' not in ('sanitized','preview','pdf-a4','pdf-a2'))
   or (select count(distinct f->>'kind') from jsonb_array_elements(p_files) f)<>4 then raise exception 'Sanitized output set required'; end if;
 select coalesce(jsonb_agg(object_key),'[]') into previous from public.work_files where work_id=work.id;
 delete from public.work_files where work_id=work.id;
 insert into public.work_files(work_id,object_key,kind,mime,bytes,width,height,dpi,sha256)
 select work.id,f.object_key,f.kind,f.mime,f.bytes,f.width,f.height,f.dpi,f.sha256
 from jsonb_to_recordset(p_files) as f(object_key text,kind text,mime text,bytes bigint,width int,height int,dpi numeric,sha256 text);
 update public.uploads set state='complete' where id=p_ticket;
 return previous;
end $$;
revoke all on function public.finish_guest_upload(uuid,uuid,timestamptz,jsonb) from public,anon,authenticated;
grant execute on function public.finish_guest_upload(uuid,uuid,timestamptz,jsonb) to service_role;
commit;
