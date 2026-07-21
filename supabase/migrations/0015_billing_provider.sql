-- P10-1 — Dual-provider billing (Revolut web + Apple/RevenueCat iOS).
--
-- Adds a `provider` discriminator to user_billing so a plan bought on either
-- platform lands in the same row, plus `apple_expires_at` for the App Store
-- entitlement expiry. Existing rows are all Revolut (implicit default). Only
-- service-role writes user_billing (see 0004); users still SELECT their own row
-- and simply see the two new columns.

alter table public.user_billing
  add column if not exists provider text not null default 'revolut'
    check (provider in ('revolut', 'apple'));

alter table public.user_billing
  add column if not exists apple_expires_at timestamptz;

-- Idempotency guard for the RevenueCat webhook: RevenueCat redelivers events
-- and retries hard on any 5xx, so we dedupe on the event id. The webhook does
-- an `insert ... on conflict do nothing` and treats a no-op insert as an
-- already-processed redelivery. Service-role only (RLS on, no policies).
create table if not exists public.billing_rc_events (
  event_id     text primary key,
  app_user_id  text,
  event_type   text,
  received_at  timestamptz not null default now()
);
alter table public.billing_rc_events enable row level security;
-- No insert/select/update/delete policies: only the service-role webhook writes.

-- Guard the renewal-scheduler RPC so it can never advance an Apple row's
-- next_charge_at — Apple owns auto-renewal for provider='apple'. Defense in
-- depth alongside the billing-renew cron's own `provider='revolut'` filters.
create or replace function public.billing_schedule_next_charge(
  p_user_id   uuid,
  p_next_at   timestamptz
) returns void language sql as $$
  update public.user_billing
     set next_charge_at = p_next_at
   where user_id  = p_user_id
     and status   = 'active'
     and plan    <> 'free'
     and provider = 'revolut';
$$;
revoke all on function public.billing_schedule_next_charge(uuid, timestamptz) from public, anon, authenticated;
grant execute on function public.billing_schedule_next_charge(uuid, timestamptz) to service_role;
