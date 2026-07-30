insert into public.products (id, name, stock, price, sold, active)
values
  ('p1', 'Pomada Modeladora', 24, 45, 142, true),
  ('p2', 'Gel de Cabelo', 18, 28, 98, true),
  ('p3', 'Laquê', 12, 35, 67, true)
on conflict (id) do update set
  name = excluded.name,
  stock = excluded.stock,
  price = excluded.price,
  active = true;

drop policy if exists "clients read active products" on public.products;
create policy "clients read active products"
on public.products for select
to authenticated
using (
  (auth.jwt() -> 'app_metadata' ->> 'role') = 'client'
  and active = true
);
