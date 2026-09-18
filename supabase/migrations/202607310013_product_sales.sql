alter table public.products
  drop constraint if exists products_stock_nonnegative;
alter table public.products
  add constraint products_stock_nonnegative check (stock >= 0);

alter table public.products
  drop constraint if exists products_sold_nonnegative;
alter table public.products
  add constraint products_sold_nonnegative check (sold >= 0);

create table if not exists public.product_sales (
  id uuid primary key default gen_random_uuid(),
  product_id text not null references public.products(id) on delete restrict,
  quantity integer not null check (quantity > 0),
  unit_price numeric not null check (unit_price >= 0),
  total numeric generated always as (quantity * unit_price) stored,
  sold_at timestamptz not null default now()
);

alter table public.product_sales enable row level security;

drop policy if exists "owner manages product sales" on public.product_sales;
create policy "owner manages product sales"
on public.product_sales for all
using ((auth.jwt() -> 'app_metadata' ->> 'role') = 'owner')
with check ((auth.jwt() -> 'app_metadata' ->> 'role') = 'owner');

create or replace function public.record_product_sale(
  p_product_id text,
  p_quantity integer default 1
)
returns public.products
language plpgsql
security definer
set search_path = public
as $$
declare
  sold_product public.products%rowtype;
begin
  if (auth.jwt() -> 'app_metadata' ->> 'role') <> 'owner' then
    raise exception 'Only owners can record product sales.' using errcode = '42501';
  end if;

  if p_quantity is null or p_quantity <= 0 then
    raise exception 'Sale quantity must be greater than zero.' using errcode = '22023';
  end if;

  update public.products
  set
    stock = stock - p_quantity,
    sold = sold + p_quantity
  where id = p_product_id
    and active = true
    and stock >= p_quantity
  returning * into sold_product;

  if not found then
    if not exists (select 1 from public.products where id = p_product_id and active = true) then
      raise exception 'Product not found.' using errcode = 'P0002';
    end if;
    raise exception 'Insufficient product stock.' using errcode = 'P0001';
  end if;

  insert into public.product_sales (product_id, quantity, unit_price)
  values (sold_product.id, p_quantity, sold_product.price);

  return sold_product;
end;
$$;

revoke all on function public.record_product_sale(text, integer) from public;
grant execute on function public.record_product_sale(text, integer) to authenticated;
