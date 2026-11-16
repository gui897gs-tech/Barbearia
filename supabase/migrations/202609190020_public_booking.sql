-- Public booking keeps the appointments table private and exposes only two
-- narrowly-scoped operations: reading available slots and reserving one slot.

alter table public.appointments
  add column if not exists client_phone text;

alter table public.appointments
  drop constraint if exists appointments_client_phone_check;

alter table public.appointments
  add constraint appointments_client_phone_check
  check (client_phone is null or client_phone ~ '^[0-9]{10,13}$');

create index if not exists appointments_client_phone_created_at_idx
  on public.appointments (client_phone, created_at desc)
  where client_phone is not null;

-- Prices are part of the public catalogue. No internal barber fields are exposed.
drop policy if exists "authenticated reads barber service prices"
  on public.barber_service_prices;
drop policy if exists "public reads barber service prices"
  on public.barber_service_prices;
create policy "public reads barber service prices"
on public.barber_service_prices for select
to anon, authenticated
using (true);

revoke all on function public.get_available_slots(text, text, date) from public;
grant execute on function public.get_available_slots(text, text, date) to anon, authenticated;

create or replace function public.book_public_appointment(
  p_barber_id text,
  p_service_id text,
  p_date date,
  p_time text,
  p_client_name text,
  p_client_phone text,
  p_notes text default null
)
returns text
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  requested_service public.services%rowtype;
  requested_barber public.barbers%rowtype;
  requested_start timestamptz;
  appointment_id text := gen_random_uuid()::text;
  appointment_price numeric;
  normalized_name text := trim(coalesce(p_client_name, ''));
  normalized_phone text := regexp_replace(coalesce(p_client_phone, ''), '[^0-9]', '', 'g');
  normalized_notes text := nullif(trim(coalesce(p_notes, '')), '');
  normalized_time text := trim(coalesce(p_time, ''));
  booking_customer_id uuid := null;
  recent_bookings integer;
begin
  if char_length(normalized_name) < 2 or char_length(normalized_name) > 80 then
    raise exception 'Informe seu nome completo.';
  end if;

  if normalized_phone !~ '^[0-9]{10,13}$' then
    raise exception 'Informe um WhatsApp válido com DDD.';
  end if;

  if normalized_time !~ '^(?:[01][0-9]|2[0-3]):[0-5][0-9]$' then
    raise exception 'Horário inválido.';
  end if;

  if normalized_notes is not null and char_length(normalized_notes) > 500 then
    raise exception 'As observações devem ter no máximo 500 caracteres.';
  end if;

  if p_date is null or p_date < current_date or p_date > current_date + 60 then
    raise exception 'Escolha uma data válida nos próximos 60 dias.';
  end if;

  select * into requested_service
  from public.services
  where id = p_service_id and active = true;

  if not found then
    raise exception 'Este serviço não está disponível.';
  end if;

  select * into requested_barber
  from public.barbers
  where id = p_barber_id and active = true;

  if not found then
    raise exception 'Este barbeiro não está disponível.';
  end if;

  if not exists (
    select 1
    from public.get_available_slots(p_barber_id, p_service_id, p_date) as available
    where available.slot = normalized_time
  ) then
    raise exception 'Este horário não está mais disponível. Escolha outro.';
  end if;

  -- Serialize bookings for the same phone so the quota cannot be bypassed by
  -- simultaneous requests. The public API never exposes this phone to clients.
  perform pg_advisory_xact_lock(hashtext(normalized_phone));

  select count(*) into recent_bookings
  from public.appointments
  where client_phone = normalized_phone
    and created_at > now() - interval '1 hour';

  if recent_bookings >= 3 then
    raise exception 'Muitas tentativas para este WhatsApp. Aguarde uma hora e tente novamente.';
  end if;

  select coalesce(
    (select price
      from public.barber_service_prices
      where barber_id = p_barber_id and service_id = p_service_id),
    requested_service.price
  ) into appointment_price;

  requested_start := (
    (p_date::text || ' ' || normalized_time)::timestamp
    at time zone 'America/Sao_Paulo'
  );

  if auth.uid() is not null
    and coalesce(auth.jwt() -> 'app_metadata' ->> 'role', 'client') = 'client'
  then
    booking_customer_id := auth.uid();
  end if;

  insert into public.appointments (
    id,
    appointment_date,
    time,
    starts_at,
    duration_minutes,
    customer_id,
    barber_id,
    service_id,
    client_name,
    client_phone,
    service_name,
    barber_name,
    status,
    price,
    notes
  ) values (
    appointment_id,
    p_date,
    normalized_time,
    requested_start,
    requested_service.duration,
    booking_customer_id,
    requested_barber.id,
    requested_service.id,
    normalized_name,
    normalized_phone,
    requested_service.name,
    requested_barber.name,
    'Confirmado',
    appointment_price,
    normalized_notes
  );

  return appointment_id;
exception
  when exclusion_violation then
    raise exception 'Este horário acabou de ser reservado. Escolha outro.';
end;
$$;

revoke all on function public.book_public_appointment(text, text, date, text, text, text, text)
  from public;
grant execute on function public.book_public_appointment(text, text, date, text, text, text, text)
  to anon, authenticated;

comment on column public.appointments.client_phone is
  'Normalized WhatsApp number supplied for appointment contact; private under appointment RLS.';
comment on function public.book_public_appointment(text, text, date, text, text, text, text) is
  'Validates and creates a public booking without granting direct table insert access.';
