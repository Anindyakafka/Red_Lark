begin;

-- The category is already shown by content/categories.json. Keep the review
-- RPC's canonical category table in sync with the public form.
insert into public.categories(slug,label) values('anti-fascism','Anti-Fascism')
on conflict(slug) do update set label=excluded.label;

-- Retire only the old in-house, unpublished draft studies. The one requested
-- retained example remains available; contributor works are never matched.
delete from public.works
where placeholder = true
  and owner_id is null
  and status = 'draft'
  and publication_state = 'private'
  and slug <> 'borders-are-lines';

commit;
