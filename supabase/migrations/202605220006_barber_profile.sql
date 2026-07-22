alter table public.barbers add column if not exists bio text;
alter table public.barbers add column if not exists phone text;
alter table public.barbers add column if not exists specialties text[] not null default '{}';
alter table public.barbers add column if not exists commission_rate numeric not null default 30;

alter table public.barbers drop constraint if exists barbers_commission_rate_check;
alter table public.barbers
  add constraint barbers_commission_rate_check check (commission_rate between 0 and 100);

create or replace function public.update_barber_profile(
  p_name text,
  p_title text,
  p_image text,
  p_bio text,
  p_phone text,
  p_specialties text[]
)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() is null
    or (auth.jwt() -> 'app_metadata' ->> 'role') <> 'barber'
  then
    raise exception 'Only barber users can update a barber profile';
  end if;

  if length(trim(p_name)) < 3 or length(trim(p_title)) < 2 then
    raise exception 'Name and title are required';
  end if;

  if coalesce(array_length(p_specialties, 1), 0) > 10 then
    raise exception 'At most 10 specialties are allowed';
  end if;

  update public.barbers
  set
    name = trim(p_name),
    title = trim(p_title),
    image = nullif(trim(p_image), ''),
    bio = nullif(left(trim(p_bio), 600), ''),
    phone = nullif(left(trim(p_phone), 30), ''),
    specialties = coalesce(p_specialties, '{}')
  where access_user_id = auth.uid()
    and active = true;

  if not found then
    raise exception 'Barber profile not found';
  end if;

  return true;
end;
$$;

revoke all on function public.update_barber_profile(text, text, text, text, text, text[]) from public;
grant execute on function public.update_barber_profile(text, text, text, text, text, text[])
to authenticated;

create or replace function public.update_own_appointment_status(
  p_appointment_id text,
  p_status text
)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() is null
    or (auth.jwt() -> 'app_metadata' ->> 'role') <> 'barber'
  then
    raise exception 'Only barber users can update appointments';
  end if;

  if p_status not in ('Confirmado', 'Em atendimento', 'Concluído', 'Não compareceu') then
    raise exception 'Invalid appointment status';
  end if;

  update public.appointments as appointment
  set status = p_status
  where appointment.id = p_appointment_id
    and appointment.barber_id in (
      select barber.id
      from public.barbers as barber
      where barber.access_user_id = auth.uid()
        and barber.active = true
    )
    and appointment.status not in ('Cancelado', 'Cancelado pelo cliente');

  if not found then
    raise exception 'Appointment not found or cannot be updated';
  end if;

  return true;
end;
$$;

revoke all on function public.update_own_appointment_status(text, text) from public;
grant execute on function public.update_own_appointment_status(text, text) to authenticated;
