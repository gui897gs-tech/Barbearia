create table if not exists public.monthly_memberships (
  id uuid primary key default gen_random_uuid(),
  customer_name text not null check (length(trim(customer_name)) >= 2),
  whatsapp text not null default '',
  plan_name text not null default 'Pacote mensal',
  monthly_amount numeric(12, 2) not null default 0 check (monthly_amount >= 0),
  due_day integer not null default 10 check (due_day between 1 and 28),
  active boolean not null default true,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.monthly_membership_payments (
  id uuid primary key default gen_random_uuid(),
  membership_id uuid not null references public.monthly_memberships(id) on delete cascade,
  reference_month date not null,
  amount numeric(12, 2) not null check (amount >= 0),
  paid_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  unique (membership_id, reference_month),
  check (extract(day from reference_month) = 1)
);

create index if not exists monthly_memberships_active_idx
  on public.monthly_memberships (active, due_day, customer_name);

create index if not exists monthly_membership_payments_month_idx
  on public.monthly_membership_payments (reference_month, membership_id);

alter table public.monthly_memberships enable row level security;
alter table public.monthly_membership_payments enable row level security;

drop policy if exists "owner manages monthly memberships" on public.monthly_memberships;
create policy "owner manages monthly memberships"
  on public.monthly_memberships for all to authenticated
  using ((auth.jwt() -> 'app_metadata' ->> 'role') = 'owner')
  with check ((auth.jwt() -> 'app_metadata' ->> 'role') = 'owner');

drop policy if exists "owner manages monthly membership payments"
  on public.monthly_membership_payments;
create policy "owner manages monthly membership payments"
  on public.monthly_membership_payments for all to authenticated
  using ((auth.jwt() -> 'app_metadata' ->> 'role') = 'owner')
  with check ((auth.jwt() -> 'app_metadata' ->> 'role') = 'owner');

revoke all on table public.monthly_memberships from anon;
revoke all on table public.monthly_membership_payments from anon;
grant select, insert, update, delete on table public.monthly_memberships to authenticated;
grant select, insert, update, delete on table public.monthly_membership_payments to authenticated;
