insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('product-images', 'product-images', true, 2097152, array['image/jpeg'])
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "owner selects own product images" on storage.objects;
create policy "owner selects own product images" on storage.objects for select to authenticated
using (bucket_id = 'product-images' and (storage.foldername(name))[1] = (select auth.uid()::text)
  and (select auth.jwt() -> 'app_metadata' ->> 'role') = 'owner');

drop policy if exists "owner uploads own product images" on storage.objects;
create policy "owner uploads own product images" on storage.objects for insert to authenticated
with check (bucket_id = 'product-images' and (storage.foldername(name))[1] = (select auth.uid()::text)
  and (select auth.jwt() -> 'app_metadata' ->> 'role') = 'owner');

drop policy if exists "owner updates own product images" on storage.objects;
create policy "owner updates own product images" on storage.objects for update to authenticated
using (bucket_id = 'product-images' and (storage.foldername(name))[1] = (select auth.uid()::text)
  and (select auth.jwt() -> 'app_metadata' ->> 'role') = 'owner')
with check (bucket_id = 'product-images' and (storage.foldername(name))[1] = (select auth.uid()::text)
  and (select auth.jwt() -> 'app_metadata' ->> 'role') = 'owner');

drop policy if exists "owner deletes own product images" on storage.objects;
create policy "owner deletes own product images" on storage.objects for delete to authenticated
using (bucket_id = 'product-images' and (storage.foldername(name))[1] = (select auth.uid()::text)
  and (select auth.jwt() -> 'app_metadata' ->> 'role') = 'owner');
