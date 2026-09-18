-- Indexes for the most frequent dashboard, history and authorization queries.
-- They are intentionally created with IF NOT EXISTS so the migration is safe to retry.
create index if not exists appointments_starts_at_idx
  on public.appointments (starts_at desc);

create index if not exists appointments_customer_starts_at_idx
  on public.appointments (customer_id, starts_at desc)
  where customer_id is not null;

create index if not exists appointments_barber_starts_at_idx
  on public.appointments (barber_id, starts_at desc)
  where barber_id is not null;

create index if not exists barbers_access_user_id_idx
  on public.barbers (access_user_id)
  where access_user_id is not null;

create index if not exists customers_created_at_idx
  on public.customers (created_at desc);

create index if not exists customer_history_customer_visited_at_idx
  on public.customer_history (customer_id, visited_at desc);

create index if not exists customer_notes_customer_created_at_idx
  on public.customer_notes (customer_id, created_at desc);

create index if not exists product_sales_sold_at_idx
  on public.product_sales (sold_at desc);

create index if not exists product_sales_product_sold_at_idx
  on public.product_sales (product_id, sold_at desc);
