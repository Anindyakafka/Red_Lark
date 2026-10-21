begin;
-- Custom labels are contributor content, not automatically a public dictionary.
-- The definer checks membership without recursively applying tags/work_tags policies.
create function public.tag_visible(p_slug text) returns boolean language sql stable security definer set search_path='' as $$
 select exists(
  select 1 from public.tags t where t.slug=p_slug and (
   not t.custom or exists(
    select 1 from public.work_tags wt join public.works w on w.id=wt.work_id
    where wt.tag_slug=t.slug and (
     (w.status='approved' and w.publication_state='published') or w.owner_id=auth.uid()
    )
   )
  )
 );
$$;
revoke all on function public.tag_visible(text) from public;
grant execute on function public.tag_visible(text) to anon,authenticated,service_role;
drop policy reference_read on public.tags;
create policy reference_read on public.tags for select to anon,authenticated using(public.tag_visible(slug));
-- Existing reference_admin policy retains fresh-MFA review access.
commit;
