create table if not exists public.business_settings (
  id boolean primary key default true check (id),
  name text not null default 'King''s Barber',
  address text not null default '',
  phone text not null default '',
  email text not null default '',
  timezone text not null default 'America/Sao_Paulo',
  weekday_start time not null default time '09:00',
  weekday_end time not null default time '19:00',
  saturday_start time not null default time '09:00',
  saturday_end time not null default time '19:00',
  sunday_closed boolean not null default true,
  cancellation_hours integer not null default 12 check (cancellation_hours between 0 and 168),
  updated_at timestamptz not null default now()
);

insert into public.business_settings (id) values (true) on conflict (id) do nothing;

alter table public.business_settings enable row level security;

drop policy if exists "authenticated reads business settings" on public.business_settings;
create policy "authenticated reads business settings"
on public.business_settings for select
to authenticated
using (true);

drop policy if exists "owner manages business settings" on public.business_settings;
create policy "owner manages business settings"
on public.business_settings for all
to authenticated
using ((auth.jwt() -> 'app_metadata' ->> 'role') = 'owner')
with check ((auth.jwt() -> 'app_metadata' ->> 'role') = 'owner');

create or replace function public.get_available_slots(
  p_barber_id text,
  p_service_id text,
  p_date date
)
returns table (slot text)
language plpgsql
security definer
set search_path = public
stable
as $$
declare
  opens_at time;
  closes_at time;
  is_closed boolean := false;
begin
  select
    case when extract(isodow from p_date) = 6 then saturday_start else weekday_start end,
    case when extract(isodow from p_date) = 6 then saturday_end else weekday_end end,
    extract(isodow from p_date) = 7 and sunday_closed
  into opens_at, closes_at, is_closed
  from public.business_settings
  where id = true;

  if coalesce(is_closed, false) then
    return;
  end if;

  opens_at := coalesce(opens_at, time '09:00');
  closes_at := coalesce(closes_at, time '19:00');

  return query
  with requested_service as (
    select duration
    from public.services
    where id = p_service_id and active = true
  ),
  candidate_slots as (
    select candidate as starts_at
    from requested_service,
      generate_series(
        (p_date::timestamp + opens_at) at time zone 'America/Sao_Paulo',
        (p_date::timestamp + closes_at - interval '30 minutes') at time zone 'America/Sao_Paulo',
        interval '30 minutes'
      ) as candidate
  )
  select to_char(candidate.starts_at at time zone 'America/Sao_Paulo', 'HH24:MI')
  from candidate_slots as candidate
  cross join requested_service as service
  where p_date >= current_date
    and candidate.starts_at > now()
    and exists (select 1 from public.barbers where id = p_barber_id and active = true)
    and candidate.starts_at + make_interval(mins => service.duration)
      <= (p_date::timestamp + closes_at) at time zone 'America/Sao_Paulo'
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
  notice_hours integer := 12;
begin
  if auth.uid() is null then
    raise exception 'Authentication required';
  end if;

  select cancellation_hours into notice_hours
  from public.business_settings
  where id = true;

  update public.appointments
  set status = 'Cancelado pelo cliente'
  where id = p_appointment_id
    and customer_id = auth.uid()
    and starts_at > now() + make_interval(hours => coalesce(notice_hours, 12))
    and status not in ('Cancelado', 'Cancelado pelo cliente', 'Concluído')
  returning id into canceled_id;

  if canceled_id is null then
    raise exception 'Este agendamento já não pode ser cancelado online.';
  end if;

  return true;
end;
$$;

revoke all on function public.get_available_slots(text, text, date) from public;
grant execute on function public.get_available_slots(text, text, date) to authenticated;
revoke all on function public.cancel_appointment(text) from public;
grant execute on function public.cancel_appointment(text) to authenticated;
