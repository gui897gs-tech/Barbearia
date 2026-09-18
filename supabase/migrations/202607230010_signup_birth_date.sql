create or replace function public.create_customer_for_account()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  account_birth_date date;
begin
  if coalesce(new.raw_app_meta_data ->> 'role', 'client') = 'client' then
    begin
      account_birth_date := nullif(new.raw_user_meta_data ->> 'birth_date', '')::date;
    exception
      when invalid_datetime_format or datetime_field_overflow then
        account_birth_date := null;
    end;

    insert into public.customers (id, name, whatsapp, email, birth_date)
    values (
      new.id,
      coalesce(nullif(trim(new.raw_user_meta_data ->> 'full_name'), ''), split_part(new.email, '@', 1)),
      coalesce(new.raw_user_meta_data ->> 'phone', ''),
      new.email,
      account_birth_date
    )
    on conflict (id) do update set
      name = excluded.name,
      whatsapp = excluded.whatsapp,
      email = excluded.email,
      birth_date = coalesce(excluded.birth_date, public.customers.birth_date),
      updated_at = now();
  end if;
  return new;
end;
$$;
