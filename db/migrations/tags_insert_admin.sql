drop policy if exists tags_insert_admin on public.tags;
create policy tags_insert_admin
  on public.tags
  for insert
  to authenticated
  with check (public.is_library_admin());
