create extension if not exists "btree_gist";

alter table public.appointments
  add column if not exists starts_at timestamptz,
  add column if not exists duration_minutes integer not null default 30;

update public.appointments
set starts_at = (
  (appointment_date::text || ' ' || time)::timestamp
  at time zone 'America/Sao_Paulo'
)
where starts_at is null;

update public.appointments as appointment
set duration_minutes = service.duration
from public.services as service
where appointment.service_id = service.id;

alter table public.appointments
  alter column starts_at set not null;

alter table public.appointments
  add column if not exists booking_window tstzrange;

update public.appointments
set booking_window = tstzrange(
  starts_at,
  starts_at + duration_minutes * interval '1 minute',
  '[)'
)
where booking_window is null;

alter table public.appointments
  alter column booking_window set not null;

create or replace function public.sync_appointment_booking_window()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  new.booking_window := tstzrange(
    new.starts_at,
    new.starts_at + new.duration_minutes * interval '1 minute',
    '[)'
  );
  return new;
end;
$$;

drop trigger if exists sync_appointment_booking_window on public.appointments;
create trigger sync_appointment_booking_window
before insert or update of starts_at, duration_minutes on public.appointments
for each row execute function public.sync_appointment_booking_window();

alter table public.appointments
  drop constraint if exists appointments_duration_minutes_check;
alter table public.appointments
  add constraint appointments_duration_minutes_check
  check (duration_minutes between 5 and 480);

alter table public.appointments
  drop constraint if exists appointments_no_barber_overlap;
alter table public.appointments
  add constraint appointments_no_barber_overlap
  exclude using gist (
    barber_id with =,
    booking_window with &&
  )
  where (barber_id is not null and status not in ('Cancelado', 'Cancelado pelo cliente'));

drop policy if exists "client creates own appointments" on public.appointments;

create or replace function public.get_available_slots(
  p_barber_id text,
  p_service_id text,
  p_date date
)
returns table (slot text)
language sql
security definer
set search_path = public
stable
as $$
  with requested_service as (
    select duration
    from public.services
    where id = p_service_id and active = true
  ),
  candidate_slots as (
    select candidate as starts_at
    from requested_service,
      generate_series(
        (p_date::timestamp + time '09:00') at time zone 'America/Sao_Paulo',
        (p_date::timestamp + time '18:30') at time zone 'America/Sao_Paulo',
        interval '30 minutes'
      ) as candidate
  )
  select to_char(candidate.starts_at at time zone 'America/Sao_Paulo', 'HH24:MI') as slot
  from candidate_slots as candidate
  cross join requested_service as service
  where p_date >= current_date
    and candidate.starts_at > now()
    and exists (
      select 1 from public.barbers
      where id = p_barber_id and active = true
    )
    and candidate.starts_at + make_interval(mins => service.duration)
      <= (p_date::timestamp + time '19:00') at time zone 'America/Sao_Paulo'
    and not exists (
      select 1
      from public.appointments as appointment
      where appointment.barber_id = p_barber_id
        and appointment.status not in ('Cancelado', 'Cancelado pelo cliente')
        and tstzrange(
          appointment.starts_at,
          appointment.starts_at + make_interval(mins => appointment.duration_minutes),
          '[)'
        ) && tstzrange(
          candidate.starts_at,
          candidate.starts_at + make_interval(mins => service.duration),
          '[)'
        )
    )
  order by candidate.starts_at;
$$;

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
    id,
    appointment_date,
    time,
    starts_at,
    duration_minutes,
    customer_id,
    barber_id,
    service_id,
    client_name,
    service_name,
    barber_name,
    status,
    price,
    notes
  ) values (
    appointment_id,
    p_date,
    to_char(requested_start at time zone 'America/Sao_Paulo', 'HH24:MI'),
    requested_start,
    requested_service.duration,
    auth.uid(),
    requested_barber.id,
    requested_service.id,
    customer_name,
    requested_service.name,
    requested_barber.name,
    'Confirmado',
    requested_service.price,
    nullif(trim(p_notes), '')
  );

  return appointment_id;
exception
  when exclusion_violation then
    raise exception 'Este horário acabou de ser reservado. Escolha outro.';
end;
$$;

create or replace function public.cancel_appointment(p_appointment_id text)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  canceled_id text;
begin
  if auth.uid() is null then
    raise exception 'Authentication required';
  end if;

  update public.appointments
  set status = 'Cancelado pelo cliente'
  where id = p_appointment_id
    and customer_id = auth.uid()
    and starts_at > now() + interval '12 hours'
    and status not in ('Cancelado', 'Cancelado pelo cliente', 'Concluído')
  returning id into canceled_id;

  if canceled_id is null then
    raise exception 'O cancelamento online encerra 12 horas antes do atendimento.';
  end if;

  return true;
end;
$$;

revoke all on function public.get_available_slots(text, text, date) from public;
grant execute on function public.get_available_slots(text, text, date) to authenticated;

revoke all on function public.book_appointment(text, text, date, text, text) from public;
grant execute on function public.book_appointment(text, text, date, text, text) to authenticated;

revoke all on function public.cancel_appointment(text) from public;
grant execute on function public.cancel_appointment(text) to authenticated;
