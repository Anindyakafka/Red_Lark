-- A deliberately narrow historical snapshot for the static Archive build.
-- It contains only records explicitly retained as archive-only after publication.
-- Private ownership, contact/UPI consent fields, storage keys and unpublished work stay private.
create or replace function public.archive_catalogue() returns jsonb language sql stable security definer set search_path='' as $$
 select coalesce(jsonb_agg(jsonb_build_object(
   'id',w.id,
   'slug',w.slug,
   'title',w.title,
   'artist_name',w.artist_name,
   'artist_id','artist-'||substr(md5(coalesce(w.owner_id::text,w.artist_name)),1,16),
   'caption',w.caption,
   'alt',w.alt,
   'source',w.source,
   'licence_id',w.licence_id,
   'format_slug',w.format_slug,
   'languages',w.languages,
   'translations',w.translations,
   'tags',w.tags,
   'ai_use',w.ai_use,
   'ai_disclosure',w.ai_disclosure,
   'placeholder',w.placeholder,
   'public_preview_url',w.public_preview_url,
   'created_at',w.created_at,
   'categories',coalesce((select jsonb_agg(category_slug) from public.work_categories where work_id=w.id),'[]'),
   'archive_status','archive-only'
 ) order by w.created_at desc),'[]')
 from public.works w
 where w.was_published=true
   and w.archive_status='archive_only'
   and nullif(w.public_preview_url,'') is not null;
$$;
revoke all on function public.archive_catalogue() from public;
grant execute on function public.archive_catalogue() to anon,authenticated,service_role;

-- The view predates the purpose-built snapshot and is not a public API.
revoke all on public.archive_works from anon, authenticated;
