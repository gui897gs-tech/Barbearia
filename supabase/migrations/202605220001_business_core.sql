create extension if not exists "pgcrypto";

create table if not exists public.services (
  id text primary key,
  name text not null,
  category text not null default 'Cabelo',
  duration integer not null default 30,
  price numeric not null default 0,
  active boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists public.products (
  id text primary key,
  name text not null,
  price numeric not null default 0,
  stock integer not null default 0,
  sold integer not null default 0,
  active boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists public.barbers (
  id text primary key,
  name text not null,
  title text not null default 'Barbeiro',
  image text,
  rating numeric not null default 5,
  revenue numeric not null default 0,
  appts integer not null default 0,
  commission numeric not null default 0,
  email text,
  access_status text not null default 'local',
  access_user_id uuid references auth.users(id) on delete set null,
  active boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists public.appointments (
  id text primary key,
  appointment_date date not null,
  time text not null,
  customer_id uuid references auth.users(id) on delete set null,
  barber_id text references public.barbers(id) on delete set null,
  service_id text references public.services(id) on delete set null,
  client_name text not null,
  service_name text not null,
  barber_name text not null,
  status text not null default 'Pendente',
  price numeric not null default 0,
  notes text,
  created_at timestamptz not null default now()
);

alter table public.services add column if not exists category text not null default 'Cabelo';
alter table public.services add column if not exists duration integer not null default 30;
alter table public.services add column if not exists price numeric not null default 0;
alter table public.services add column if not exists active boolean not null default true;
alter table public.services add column if not exists created_at timestamptz not null default now();

alter table public.products add column if not exists price numeric not null default 0;
alter table public.products add column if not exists stock integer not null default 0;
alter table public.products add column if not exists sold integer not null default 0;
alter table public.products add column if not exists active boolean not null default true;
alter table public.products add column if not exists created_at timestamptz not null default now();

alter table public.barbers add column if not exists title text not null default 'Barbeiro';
alter table public.barbers add column if not exists image text;
alter table public.barbers add column if not exists rating numeric not null default 5;
alter table public.barbers add column if not exists revenue numeric not null default 0;
alter table public.barbers add column if not exists appts integer not null default 0;
alter table public.barbers add column if not exists commission numeric not null default 0;
alter table public.barbers add column if not exists email text;
alter table public.barbers add column if not exists access_status text not null default 'local';
alter table public.barbers add column if not exists access_user_id uuid references auth.users(id) on delete set null;
alter table public.barbers add column if not exists active boolean not null default true;
alter table public.barbers add column if not exists created_at timestamptz not null default now();

alter table public.appointments add column if not exists appointment_date date not null default current_date;
alter table public.appointments add column if not exists time text not null default '09:00';
alter table public.appointments add column if not exists customer_id uuid references auth.users(id) on delete set null;
alter table public.appointments add column if not exists barber_id text references public.barbers(id) on delete set null;
alter table public.appointments add column if not exists service_id text references public.services(id) on delete set null;
alter table public.appointments add column if not exists client_name text not null default 'Cliente';
alter table public.appointments add column if not exists service_name text not null default 'Servico';
alter table public.appointments add column if not exists barber_name text not null default 'Barbeiro';
alter table public.appointments add column if not exists status text not null default 'Pendente';
alter table public.appointments add column if not exists price numeric not null default 0;
alter table public.appointments add column if not exists notes text;
alter table public.appointments add column if not exists created_at timestamptz not null default now();

alter table public.services enable row level security;
alter table public.products enable row level security;
alter table public.barbers enable row level security;
alter table public.appointments enable row level security;

drop policy if exists "public can read active services" on public.services;
create policy "public can read active services"
on public.services for select
using (active = true);

drop policy if exists "public can read active barbers" on public.barbers;
create policy "public can read active barbers"
on public.barbers for select
using (active = true);

drop policy if exists "owner manages services" on public.services;
create policy "owner manages services"
on public.services for all
using ((auth.jwt() -> 'app_metadata' ->> 'role') = 'owner')
with check ((auth.jwt() -> 'app_metadata' ->> 'role') = 'owner');

drop policy if exists "owner manages products" on public.products;
create policy "owner manages products"
on public.products for all
using ((auth.jwt() -> 'app_metadata' ->> 'role') = 'owner')
with check ((auth.jwt() -> 'app_metadata' ->> 'role') = 'owner');

drop policy if exists "owner manages barbers" on public.barbers;
create policy "owner manages barbers"
on public.barbers for all
using ((auth.jwt() -> 'app_metadata' ->> 'role') = 'owner')
with check ((auth.jwt() -> 'app_metadata' ->> 'role') = 'owner');

drop policy if exists "owner manages appointments" on public.appointments;
create policy "owner manages appointments"
on public.appointments for all
using ((auth.jwt() -> 'app_metadata' ->> 'role') = 'owner')
with check ((auth.jwt() -> 'app_metadata' ->> 'role') = 'owner');

drop policy if exists "barber reads own appointments" on public.appointments;
create policy "barber reads own appointments"
on public.appointments for select
using (
  (auth.jwt() -> 'app_metadata' ->> 'role') = 'barber'
  and barber_id::text in (select id::text from public.barbers where access_user_id::text = auth.uid()::text)
);

drop policy if exists "client reads own appointments" on public.appointments;
create policy "client reads own appointments"
on public.appointments for select
using (
  customer_id = auth.uid()
);

drop policy if exists "client creates own appointments" on public.appointments;
create policy "client creates own appointments"
on public.appointments for insert
with check (
  customer_id = auth.uid()
);
