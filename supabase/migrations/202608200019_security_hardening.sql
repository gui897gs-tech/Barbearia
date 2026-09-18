-- Security hardening for privileged functions and distributed invitation throttling.

create table if not exists public.owner_invite_rate_limits (
  owner_id uuid primary key references auth.users(id) on delete cascade,
  request_count integer not null default 0 check (request_count >= 0),
  window_started_at timestamptz not null default now()
);

alter table public.owner_invite_rate_limits enable row level security;

-- This table is intentionally inaccessible through PostgREST. Only the service-role
-- Edge Function can execute the quota function below.
revoke all on table public.owner_invite_rate_limits from anon, authenticated;

create or replace function public.consume_owner_invite_quota(
  p_owner_id uuid,
  p_limit integer default 5,
  p_window interval default interval '5 minutes'
)
returns boolean
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  allowed boolean;
begin
  if p_owner_id is null or p_limit < 1 or p_window <= interval '0 seconds' then
    return false;
  end if;

  insert into public.owner_invite_rate_limits as quota (
    owner_id,
    request_count,
    window_started_at
  ) values (
    p_owner_id,
    1,
    now()
  )
  on conflict (owner_id) do update
  set
    request_count = case
      when quota.window_started_at + p_window <= now() then 1
      else quota.request_count + 1
    end,
    window_started_at = case
      when quota.window_started_at + p_window <= now() then now()
      else quota.window_started_at
    end
  returning request_count <= p_limit into allowed;

  return allowed;
end;
$$;

revoke all on function public.consume_owner_invite_quota(uuid, integer, interval) from public;
revoke all on function public.consume_owner_invite_quota(uuid, integer, interval) from anon, authenticated;
grant execute on function public.consume_owner_invite_quota(uuid, integer, interval) to service_role;

-- Trigger helpers and maintenance functions must never be callable through the API.
revoke all on function public.prepare_new_account() from public, anon, authenticated;
revoke all on function public.create_customer_for_account() from public, anon, authenticated;
revoke all on function public.refresh_customer_metrics(uuid) from public, anon, authenticated;
revoke all on function public.sync_customer_from_appointment() from public, anon, authenticated;
revoke all on function public.sync_appointment_booking_window() from public, anon, authenticated;

comment on function public.consume_owner_invite_quota(uuid, integer, interval) is
  'Atomic, database-backed invitation quota callable only by the service role.';
