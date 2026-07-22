insert into public.barbers (id, name, title, rating, image, revenue, appts, commission, access_status, active)
values
  ('1', 'Lucas Moreau', 'Barbeiro Master', 4.9, 'https://images.unsplash.com/photo-1605497788044-5a32c7078486?w=400&q=80', 19680, 142, 5904, 'local', true),
  ('2', 'Adrian Cole', 'Estilista Senior', 4.8, 'https://images.unsplash.com/photo-1622286342621-4bd786c2447c?w=400&q=80', 16240, 128, 4872, 'local', true),
  ('3', 'Marco Silva', 'Especialista em Barba', 4.9, 'https://images.unsplash.com/photo-1503443207922-dff7d543fd0e?w=400&q=80', 15120, 119, 4536, 'local', true),
  ('4', 'Jordan Hayes', 'Barbeiro Junior', 4.7, 'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?w=400&q=80', 10480, 86, 3144, 'local', true)
on conflict (id) do update set
  name = excluded.name,
  title = excluded.title,
  rating = excluded.rating,
  image = excluded.image,
  revenue = excluded.revenue,
  appts = excluded.appts,
  commission = excluded.commission,
  active = true;
