update public.barbers set active = false where id not in ('paulo', 'felipe');

insert into public.barbers (id, name, title, rating, image, revenue, appts, commission, access_status, active)
values
  ('paulo', 'Paulo', 'Barbeiro', 5, '/paulo.jfif', 0, 0, 0, 'local', true),
  ('felipe', 'Felipe', 'Barbeiro', 5, 'https://images.unsplash.com/photo-1503443207922-dff7d543fd0e?w=400&q=80', 0, 0, 0, 'local', true)
on conflict (id) do update set
  name = excluded.name,
  title = excluded.title,
  rating = excluded.rating,
  image = excluded.image,
  revenue = excluded.revenue,
  appts = excluded.appts,
  commission = excluded.commission,
  active = true;

insert into public.services (id, name, category, duration, price, active)
values
  ('s1', 'Corte Degradê', 'Cabelo', 45, 35, true),
  ('s2', 'Barba', 'Barba', 40, 20, true),
  ('s3', 'Modelagem de Barba', 'Barba', 30, 65, true),
  ('s4', 'Toalha Quente', 'Tratamento', 25, 55, true),
  ('s5', 'Cabelo e Barba', 'Combo', 90, 50, true),
  ('s6', 'Corte Infantil', 'Cabelo', 30, 25, true)
on conflict (id) do update set
  name = excluded.name,
  category = excluded.category,
  duration = excluded.duration,
  price = excluded.price,
  active = true;
