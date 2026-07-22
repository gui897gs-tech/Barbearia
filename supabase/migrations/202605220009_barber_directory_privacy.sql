drop policy if exists "public can read active barbers" on public.barbers;

drop policy if exists "barber reads own profile" on public.barbers;
create policy "barber reads own profile"
on public.barbers for select
to authenticated
using (
  (auth.jwt() -> 'app_metadata' ->> 'role') = 'barber'
  and access_user_id = auth.uid()
);

drop view if exists public.barber_directory;
create view public.barber_directory
with (security_barrier = true)
as
select id, name, title, rating, image, active
from public.barbers
where active = true;

revoke all on public.barber_directory from public;
grant select on public.barber_directory to anon, authenticated;

comment on view public.barber_directory is
  'Public-safe barber fields. Internal access, commission and contact fields are intentionally omitted.';
