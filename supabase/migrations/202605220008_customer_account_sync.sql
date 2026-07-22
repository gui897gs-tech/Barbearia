alter table public.customer_history add column if not exists appointment_id text unique;

create or replace function public.prepare_new_account()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  new.raw_app_meta_data := coalesce(new.raw_app_meta_data, '{}'::jsonb)
    || jsonb_build_object('role', coalesce(new.raw_app_meta_data ->> 'role', 'client'));
  return new;
end;
$$;

drop trigger if exists prepare_new_account_role on auth.users;
create trigger prepare_new_account_role
before insert on auth.users
for each row execute function public.prepare_new_account();

create or replace function public.create_customer_for_account()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if coalesce(new.raw_app_meta_data ->> 'role', 'client') = 'client' then
    insert into public.customers (id, name, whatsapp, email)
    values (
      new.id,
      coalesce(nullif(trim(new.raw_user_meta_data ->> 'full_name'), ''), split_part(new.email, '@', 1)),
      coalesce(new.raw_user_meta_data ->> 'phone', ''),
      new.email
    )
    on conflict (id) do update set
      name = excluded.name,
      whatsapp = excluded.whatsapp,
      email = excluded.email,
      updated_at = now();
  end if;
  return new;
end;
$$;

drop trigger if exists create_customer_after_signup on auth.users;
create trigger create_customer_after_signup
after insert on auth.users
for each row execute function public.create_customer_for_account();

insert into public.customers (id, name, whatsapp, email)
select
  account.id,
  coalesce(nullif(trim(account.raw_user_meta_data ->> 'full_name'), ''), split_part(account.email, '@', 1)),
  coalesce(account.raw_user_meta_data ->> 'phone', ''),
  account.email
from auth.users as account
where coalesce(account.raw_app_meta_data ->> 'role', 'client') = 'client'
on conflict (id) do nothing;

update auth.users
set raw_app_meta_data = coalesce(raw_app_meta_data, '{}'::jsonb) || '{"role":"client"}'::jsonb
where raw_app_meta_data ->> 'role' is null;

drop policy if exists "client reads own customer profile" on public.customers;
create policy "client reads own customer profile"
on public.customers for select
to authenticated
using (id = auth.uid());

create or replace function public.update_client_profile(
  p_name text,
  p_phone text,
  p_birth_date date
)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() is null
    or coalesce(auth.jwt() -> 'app_metadata' ->> 'role', 'client') <> 'client'
  then
    raise exception 'Only client users can update a client profile';
  end if;

  if length(trim(p_name)) < 3 or length(regexp_replace(p_phone, '\D', '', 'g')) < 10 then
    raise exception 'Valid name and phone are required';
  end if;

  insert into public.customers (id, name, whatsapp, email, birth_date)
  values (auth.uid(), trim(p_name), trim(p_phone), auth.jwt() ->> 'email', p_birth_date)
  on conflict (id) do update set
    name = excluded.name,
    whatsapp = excluded.whatsapp,
    email = excluded.email,
    birth_date = excluded.birth_date,
    updated_at = now();

  return true;
end;
$$;

revoke all on function public.update_client_profile(text, text, date) from public;
grant execute on function public.update_client_profile(text, text, date) to authenticated;

create or replace function public.refresh_customer_metrics(p_customer_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  completed_visits integer;
  completed_spend numeric;
  latest_visit date;
  upcoming timestamptz;
begin
  if p_customer_id is null then return; end if;

  select
    count(*)::integer,
    coalesce(sum(price), 0),
    max(appointment_date)
  into completed_visits, completed_spend, latest_visit
  from public.appointments
  where customer_id = p_customer_id
    and status in ('Concluído', 'Concluido');

  select min(starts_at)
  into upcoming
  from public.appointments
  where customer_id = p_customer_id
    and starts_at > now()
    and status not in ('Cancelado', 'Cancelado pelo cliente', 'Concluído', 'Concluido');

  update public.customers
  set
    visits = completed_visits,
    total_spent = completed_spend,
    average_ticket = case when completed_visits > 0 then completed_spend / completed_visits else 0 end,
    last_visit = latest_visit,
    next_appointment = upcoming,
    status = case
      when completed_spend >= 1000 then 'vip'
      when latest_visit is null then 'active'
      when latest_visit < current_date - 90 then 'inactive'
      when latest_visit < current_date - 30 then 'missing'
      else 'active'
    end,
    updated_at = now()
  where id = p_customer_id;
end;
$$;

create or replace function public.sync_customer_from_appointment()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  affected_customer uuid;
begin
  if tg_op = 'DELETE' then
    affected_customer := old.customer_id;
  else
    affected_customer := new.customer_id;
  end if;

  if tg_op <> 'DELETE' and new.status in ('Concluído', 'Concluido') and new.customer_id is not null then
    insert into public.customer_history (
      appointment_id, customer_id, visited_at, service, barber, paid
    ) values (
      new.id, new.customer_id, new.appointment_date, new.service_name, new.barber_name, new.price
    ) on conflict (appointment_id) do update set
      visited_at = excluded.visited_at,
      service = excluded.service,
      barber = excluded.barber,
      paid = excluded.paid;
  elsif tg_op <> 'DELETE' then
    delete from public.customer_history where appointment_id = new.id;
  else
    delete from public.customer_history where appointment_id = old.id;
  end if;

  perform public.refresh_customer_metrics(affected_customer);

  if tg_op = 'UPDATE' and old.customer_id is distinct from new.customer_id then
    perform public.refresh_customer_metrics(old.customer_id);
  end if;

  if tg_op = 'DELETE' then return old; end if;
  return new;
end;
$$;

drop trigger if exists sync_customer_metrics_after_appointment on public.appointments;
create trigger sync_customer_metrics_after_appointment
after insert or update or delete on public.appointments
for each row execute function public.sync_customer_from_appointment();
