begin;
-- A delayed notification must describe its own decision, even after another review.
alter table public.work_notifications add column work_title text not null default '';
alter table public.work_notifications add column feedback text not null default '';
update public.work_notifications n set work_title=w.title,feedback=w.feedback from public.works w where w.id=n.work_id;
create or replace function private.queue_work_notification() returns trigger language plpgsql security definer set search_path='' as $$
begin
 if new.status in ('pending','approved','changes_requested','rejected') and (TG_OP='INSERT' or old.status<>new.status) then
  if new.status='pending' or exists(select 1 from auth.users where id=new.owner_id and email_confirmed_at is not null) then
   insert into public.work_notifications(work_id,event,work_title,feedback) values(new.id,new.status,new.title,new.feedback);
  end if;
 end if;
 return new;
end $$;
commit;
