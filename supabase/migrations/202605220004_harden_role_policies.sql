-- Apply the same hardening to databases where earlier migrations already ran.
-- Authorization roles must live in app_metadata because users cannot edit it.

drop policy if exists "owner manages services" on public.services;
create policy "owner manages services" on public.services for all
using ((auth.jwt() -> 'app_metadata' ->> 'role') = 'owner')
with check ((auth.jwt() -> 'app_metadata' ->> 'role') = 'owner');

drop policy if exists "owner manages products" on public.products;
create policy "owner manages products" on public.products for all
using ((auth.jwt() -> 'app_metadata' ->> 'role') = 'owner')
with check ((auth.jwt() -> 'app_metadata' ->> 'role') = 'owner');

drop policy if exists "owner manages barbers" on public.barbers;
create policy "owner manages barbers" on public.barbers for all
using ((auth.jwt() -> 'app_metadata' ->> 'role') = 'owner')
with check ((auth.jwt() -> 'app_metadata' ->> 'role') = 'owner');

drop policy if exists "owner manages appointments" on public.appointments;
create policy "owner manages appointments" on public.appointments for all
using ((auth.jwt() -> 'app_metadata' ->> 'role') = 'owner')
with check ((auth.jwt() -> 'app_metadata' ->> 'role') = 'owner');

drop policy if exists "barber reads own appointments" on public.appointments;
create policy "barber reads own appointments" on public.appointments for select
using (
  (auth.jwt() -> 'app_metadata' ->> 'role') = 'barber'
  and barber_id in (select id from public.barbers where access_user_id = auth.uid())
);

drop policy if exists "client reads own appointments" on public.appointments;
create policy "client reads own appointments" on public.appointments for select
using (customer_id = auth.uid());

drop policy if exists "client creates own appointments" on public.appointments;
create policy "client creates own appointments" on public.appointments for insert
with check (customer_id = auth.uid());

drop policy if exists "Authenticated users can manage customers" on public.customers;
drop policy if exists "Authenticated users can manage customer history" on public.customer_history;
drop policy if exists "Authenticated users can manage customer notes" on public.customer_notes;
drop policy if exists "Authenticated users can manage customer preferences" on public.customer_preferences;
drop policy if exists "Authenticated users can manage customer loyalty" on public.customer_loyalty;

drop policy if exists "owner manages customers" on public.customers;
create policy "owner manages customers" on public.customers for all
using ((auth.jwt() -> 'app_metadata' ->> 'role') = 'owner')
with check ((auth.jwt() -> 'app_metadata' ->> 'role') = 'owner');

drop policy if exists "owner manages customer history" on public.customer_history;
create policy "owner manages customer history" on public.customer_history for all
using ((auth.jwt() -> 'app_metadata' ->> 'role') = 'owner')
with check ((auth.jwt() -> 'app_metadata' ->> 'role') = 'owner');

drop policy if exists "owner manages customer notes" on public.customer_notes;
create policy "owner manages customer notes" on public.customer_notes for all
using ((auth.jwt() -> 'app_metadata' ->> 'role') = 'owner')
with check ((auth.jwt() -> 'app_metadata' ->> 'role') = 'owner');

drop policy if exists "owner manages customer preferences" on public.customer_preferences;
create policy "owner manages customer preferences" on public.customer_preferences for all
using ((auth.jwt() -> 'app_metadata' ->> 'role') = 'owner')
with check ((auth.jwt() -> 'app_metadata' ->> 'role') = 'owner');

drop policy if exists "owner manages customer loyalty" on public.customer_loyalty;
create policy "owner manages customer loyalty" on public.customer_loyalty for all
using ((auth.jwt() -> 'app_metadata' ->> 'role') = 'owner')
with check ((auth.jwt() -> 'app_metadata' ->> 'role') = 'owner');
