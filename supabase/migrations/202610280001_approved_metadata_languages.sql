begin;

-- Administrators may correct the public language facets of a reviewable work.
-- Keep the existing RPC signature out of circulation by replacing it in place.
create or replace function public.review_work_metadata(
  p_work uuid,
  p_title text,
  p_alt text,
  p_format text,
  p_languages text[],
  p_categories text[],
  p_tags text[]
) returns void
language plpgsql security definer set search_path='' as $$
begin
  if not private.admin_fresh() then raise exception 'Fresh admin TOTP required'; end if;
  if cardinality(p_languages) is null or cardinality(p_languages)=0 or
    exists(select 1 from unnest(p_languages) language where language not in ('English','Hindi','Bengali','Malayalam')) then
    raise exception 'Canonical language required';
  end if;
  perform 1 from public.works where id=p_work and
    (status in ('pending','changes_requested') or
     (status='approved' and publication_state in ('published','failed'))) for update;
  if not found then raise exception 'Reviewable work required'; end if;
  update public.works set title=p_title,alt=p_alt,format_slug=p_format,languages=array(select distinct unnest(p_languages)) where id=p_work;
  perform public.save_work_facets(p_work,p_categories,p_tags);
end $$;

revoke all on function public.review_work_metadata(uuid,text,text,text,text[],text[],text[]) from public,anon;
grant execute on function public.review_work_metadata(uuid,text,text,text,text[],text[],text[]) to authenticated;

commit;
