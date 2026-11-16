-- Booking options remain public, but creating an appointment now requires an
-- authenticated account. The function still links client accounts to their
-- customer record and accepts owner/barber sessions for assisted bookings.

revoke execute on function public.book_public_appointment(text, text, date, text, text, text, text)
  from anon;
grant execute on function public.book_public_appointment(text, text, date, text, text, text, text)
  to authenticated;

comment on function public.book_public_appointment(text, text, date, text, text, text, text) is
  'Validates and creates an authenticated booking without granting direct table insert access.';
