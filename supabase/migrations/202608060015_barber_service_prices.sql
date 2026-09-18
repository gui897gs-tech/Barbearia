create table if not exists public.barber_service_prices (
  barber_id text not null references public.barbers(id) on delete cascade,
  service_id text not null references public.services(id) on delete cascade,
  price numeric not null check (price >= 0),
  updated_at timestamptz not null default now(),
  primary key (barber_id, service_id)
);

alter table public.barber_service_prices enable row level security;

drop policy if exists "authenticated reads barber service prices" on public.barber_service_prices;
create policy "authenticated reads barber service prices"
on public.barber_service_prices for select
to authenticated
using (true);

drop policy if exists "owner manages barber service prices" on public.barber_service_prices;
create policy "owner manages barber service prices"
on public.barber_service_prices for all
to authenticated
using ((auth.jwt() -> 'app_metadata' ->> 'role') = 'owner')
with check ((auth.jwt() -> 'app_metadata' ->> 'role') = 'owner');

create index if not exists barber_service_prices_service_id_idx
  on public.barber_service_prices (service_id);

create or replace function public.book_appointment(
  p_barber_id text,
  p_service_id text,
  p_date date,
  p_time text,
  p_notes text default null
)
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  requested_service public.services%rowtype;
  requested_barber public.barbers%rowtype;
  requested_start timestamptz;
  appointment_id text := gen_random_uuid()::text;
  customer_name text;
  appointment_price numeric;
begin
  if auth.uid() is null then
    raise exception 'Authentication required';
  end if;

  if coalesce(auth.jwt() -> 'app_metadata' ->> 'role', 'client') <> 'client' then
    raise exception 'Only client accounts can use online booking';
  end if;

  select * into strict requested_service
  from public.services
  where id = p_service_id and active = true;

  select * into strict requested_barber
  from public.barbers
  where id = p_barber_id and active = true;

  select coalesce(
    (select price from public.barber_service_prices
      where barber_id = p_barber_id and service_id = p_service_id),
    requested_service.price
  ) into appointment_price;

  requested_start := (
    (p_date::text || ' ' || p_time)::timestamp
    at time zone 'America/Sao_Paulo'
  );

  if requested_start < now() then
    raise exception 'Appointment must be in the future';
  end if;

  if (requested_start at time zone 'America/Sao_Paulo')::time < time '09:00'
    or (
      (requested_start + make_interval(mins => requested_service.duration))
      at time zone 'America/Sao_Paulo'
    ) > p_date::timestamp + time '19:00'
  then
    raise exception 'Appointment is outside business hours';
  end if;

  customer_name := coalesce(
    auth.jwt() -> 'user_metadata' ->> 'full_name',
    auth.jwt() ->> 'email',
    'Cliente'
  );

  insert into public.appointments (
    id, appointment_date, time, starts_at, duration_minutes, customer_id,
    barber_id, service_id, client_name, service_name, barber_name, status, price, notes
  ) values (
    appointment_id, p_date,
    to_char(requested_start at time zone 'America/Sao_Paulo', 'HH24:MI'),
    requested_start, requested_service.duration, auth.uid(), requested_barber.id,
    requested_service.id, customer_name, requested_service.name, requested_barber.name,
    'Confirmado', appointment_price, nullif(trim(p_notes), '')
  );

  return appointment_id;
exception
  when exclusion_violation then
    raise exception 'Este horário acabou de ser reservado. Escolha outro.';
end;
$$;

revoke all on function public.book_appointment(text, text, date, text, text) from public;
grant execute on function public.book_appointment(text, text, date, text, text) to authenticated;

comment on table public.barber_service_prices is
  'Optional price override for a barber and service. Missing rows use services.price.';
