-- Quick contributions presented CC0 reuse and collected permission, but omitted
-- the remixable form field. Correct those existing CC0 records without widening
-- the licence gate for works under any other licence.
begin;

-- Database migrations run without an HTTP JWT; the guard otherwise treats a
-- maintenance update as a contributor editing a published work.
select set_config('request.jwt.claims', '{"role":"service_role"}', true);

update public.works
set remixable = true
where placeholder = false
  and licence_id = 'CC0-1.0'
  and remixable = false;

commit;
