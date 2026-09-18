-- Storage upserts need SELECT in addition to INSERT and UPDATE.
-- Keep access scoped to the authenticated user's own folder.
drop policy if exists "authenticated select own profile image" on storage.objects;
create policy "authenticated select own profile image"
on storage.objects for select to authenticated
using (
  bucket_id = 'profile-images'
  and (storage.foldername(name))[1] = (select auth.uid()::text)
);
