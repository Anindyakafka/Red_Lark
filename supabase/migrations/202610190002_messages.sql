begin;
create function public.store_message(p_key uuid,p_topic text,p_body text,p_email text,p_locale text,p_work_url text default '') returns uuid
language plpgsql security definer set search_path='' as $$
declare mid uuid; previous public.messages; begin
 select * into previous from public.messages where submission_key=p_key;
 if found then
   if previous.body<>p_body or previous.reply_email<>p_email or previous.topic<>p_topic then raise exception 'Receipt conflict'; end if;
   return previous.id;
 end if;
 insert into public.messages(submission_key,topic,body,reply_email,locale) values(p_key,p_topic,p_body,p_email,p_locale) returning id into mid;
 if p_work_url<>'' then insert into public.takedown_requests(message_id,work_url) values(mid,p_work_url); end if;
 insert into public.mail_jobs(message_id,kind) values(mid,'team');
 if p_email<>'' then insert into public.mail_jobs(message_id,kind) values(mid,'ack'); end if;
 return mid;
end $$;
revoke all on function public.store_message(uuid,text,text,text,text,text) from public,anon,authenticated;
grant execute on function public.store_message(uuid,text,text,text,text,text) to service_role;

-- A contributor cannot bypass the server's required-file check through the REST API.
create function private.guard_pending() returns trigger language plpgsql security definer set search_path='' as $$
begin
 if new.status='pending' and old.status is distinct from 'pending' and (auth.jwt()->>'role') is distinct from 'service_role'
   and not exists(select 1 from public.work_files where work_id=new.id and kind='sanitized') then raise exception 'Sanitized file required'; end if;
 return new;
end $$;
revoke all on function private.guard_pending() from public,anon,authenticated;
create trigger guard_pending before update on public.works for each row execute function private.guard_pending();
commit;
