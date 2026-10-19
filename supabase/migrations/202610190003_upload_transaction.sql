begin;
create function public.finish_upload(p_ticket uuid,p_user uuid,p_updated timestamptz,p_files jsonb) returns jsonb
language plpgsql security definer set search_path='' as $$
declare ticket public.uploads; work public.works; previous jsonb; begin
 select * into ticket from public.uploads where id=p_ticket and user_id=p_user and state='processing' for update;
 if not found then raise exception 'Upload ticket unavailable'; end if;
 select * into work from public.works where id=ticket.work_id and owner_id=p_user and status in ('draft','changes_requested') and updated_at=p_updated for update;
 if not found then raise exception 'Draft changed during processing'; end if;
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
revoke all on function public.finish_upload(uuid,uuid,timestamptz,jsonb) from public,anon,authenticated;
grant execute on function public.finish_upload(uuid,uuid,timestamptz,jsonb) to service_role;

create or replace function private.guard_pending() returns trigger language plpgsql security definer set search_path='' as $$
begin
 if new.status='pending' and old.status is distinct from 'pending' and (auth.jwt()->>'role') is distinct from 'service_role' then
   if not exists(select 1 from public.work_files where work_id=new.id and kind='sanitized') then raise exception 'Sanitized file required'; end if;
   if exists(select 1 from public.uploads where work_id=new.id and state='processing') then raise exception 'Image processing in progress'; end if;
 end if;
 return new;
end $$;
commit;
