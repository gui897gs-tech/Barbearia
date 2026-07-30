alter table public.barbers
  add column if not exists fixed_fee numeric not null default 0;

alter table public.barbers
  drop constraint if exists barbers_fixed_fee_check;

alter table public.barbers
  add constraint barbers_fixed_fee_check check (fixed_fee >= 0);

comment on column public.barbers.fixed_fee is
  'Monthly fixed amount paid by the barber to the barbershop. No percentage commission is used.';

update public.barbers
set commission_rate = 0,
    commission = 0;
