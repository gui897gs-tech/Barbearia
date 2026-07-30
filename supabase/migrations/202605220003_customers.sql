create table if not exists public.customers (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  whatsapp text not null,
  email text,
  instagram text,
  birth_date date,
  city text,
  avatar_url text,
  favorite_barber text,
  favorite_cut text,
  barber_notes text,
  internal_notes text,
  last_visit date,
  next_appointment timestamptz,
  total_spent numeric not null default 0,
  average_ticket numeric not null default 0,
  visits integer not null default 0,
  frequency_days integer not null default 30,
  status text not null default 'active' check (status in ('active', 'missing', 'inactive', 'vip')),
  loyalty_points integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.customer_history (
  id uuid primary key default gen_random_uuid(),
  customer_id uuid not null references public.customers(id) on delete cascade,
  visited_at date not null,
  service text not null,
  barber text not null,
  paid numeric not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists public.customer_notes (
  id uuid primary key default gen_random_uuid(),
  customer_id uuid not null references public.customers(id) on delete cascade,
  note text not null,
  created_at timestamptz not null default now()
);

create table if not exists public.customer_preferences (
  customer_id uuid primary key references public.customers(id) on delete cascade,
  favorite_barber text,
  favorite_cut text,
  barber_notes text,
  updated_at timestamptz not null default now()
);

create table if not exists public.customer_loyalty (
  customer_id uuid primary key references public.customers(id) on delete cascade,
  points integer not null default 0,
  target integer not null default 8,
  reward text not null default 'Barba gratis',
  updated_at timestamptz not null default now()
);

alter table public.customers enable row level security;
alter table public.customer_history enable row level security;
alter table public.customer_notes enable row level security;
alter table public.customer_preferences enable row level security;
alter table public.customer_loyalty enable row level security;

drop policy if exists "owner manages customers" on public.customers;
create policy "owner manages customers"
  on public.customers for all to authenticated
  using ((auth.jwt() -> 'app_metadata' ->> 'role') = 'owner')
  with check ((auth.jwt() -> 'app_metadata' ->> 'role') = 'owner');

drop policy if exists "owner manages customer history" on public.customer_history;
create policy "owner manages customer history"
  on public.customer_history for all to authenticated
  using ((auth.jwt() -> 'app_metadata' ->> 'role') = 'owner')
  with check ((auth.jwt() -> 'app_metadata' ->> 'role') = 'owner');

drop policy if exists "owner manages customer notes" on public.customer_notes;
create policy "owner manages customer notes"
  on public.customer_notes for all to authenticated
  using ((auth.jwt() -> 'app_metadata' ->> 'role') = 'owner')
  with check ((auth.jwt() -> 'app_metadata' ->> 'role') = 'owner');

drop policy if exists "owner manages customer preferences" on public.customer_preferences;
create policy "owner manages customer preferences"
  on public.customer_preferences for all to authenticated
  using ((auth.jwt() -> 'app_metadata' ->> 'role') = 'owner')
  with check ((auth.jwt() -> 'app_metadata' ->> 'role') = 'owner');

drop policy if exists "owner manages customer loyalty" on public.customer_loyalty;
create policy "owner manages customer loyalty"
  on public.customer_loyalty for all to authenticated
  using ((auth.jwt() -> 'app_metadata' ->> 'role') = 'owner')
  with check ((auth.jwt() -> 'app_metadata' ->> 'role') = 'owner');
