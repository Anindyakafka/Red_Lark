-- Historical archive state is public only after a work was once published.
-- Pending, rejected and never-published records remain private under existing RLS.
alter table public.works add column if not exists archive_status text not null default 'usable'
  check (archive_status in ('usable','archive_only'));
alter table public.works add column if not exists was_published boolean not null default false;
alter table public.works add column if not exists details_missing boolean not null default false;

update public.works set was_published=true where status='approved' and publication_state='published';

create or replace function private.mark_published_history() returns trigger language plpgsql security definer set search_path='' as $$
begin
  if new.status='approved' and new.publication_state='published' then new.was_published=true; end if;
  return new;
end $$;
drop trigger if exists works_mark_published_history on public.works;
create trigger works_mark_published_history before insert or update on public.works
for each row execute function private.mark_published_history();

-- Existing public catalogue remains usable-only. A future static archive fetch may use this
-- view without exposing private records or removed file keys.
create or replace view public.archive_works with (security_invoker=true) as
select id,slug,title,artist_name,caption,alt,source,licence_id,format_slug,languages,tags,created_at,
       archive_status,status,publication_state,was_published,public_preview_url
from public.works
where was_published=true;
grant select on public.archive_works to anon, authenticated;
