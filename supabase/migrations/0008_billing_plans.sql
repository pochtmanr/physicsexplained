-- Physics.explained — billing_plans table + revolut_public_id column.
--
-- Motivation:
--   * H1: Plan prices were duplicated between lib/billing/plans.ts (Next.js)
--     and supabase/functions/billing-renew/index.ts (Deno edge function).
--     Edge functions can't import Next.js modules, so we centralize the
--     price in the database. Next.js side keeps PLANS as the compile-time
--     source of truth for tokens/label/blurb and has a runtime assertion
--     that the DB price matches.
--   * M3: Concurrent checkout deduplication needs to echo the Revolut
--     public/token id (used by the checkout widget) so a second call can
--     return the SAME checkout session instead of creating a duplicate
--     pending order.

-- 1. Plan price table
create table if not exists public.billing_plans (
  plan          text primary key check (plan in ('free','starter','pro')),
  amount_cents  int  not null check (amount_cents >= 0),
  currency      text not null default 'USD',
  updated_at    timestamptz not null default now()
);

-- Seed / upsert the three plans. Prices match lib/billing/plans.ts —
-- if you change them, change both places (plans.ts has an assertion that
-- will fail loudly in CI/startup if they drift).
insert into public.billing_plans (plan, amount_cents, currency) values
  ('free',    0,    'USD'),
  ('starter', 600,  'USD'),
  ('pro',     2000, 'USD')
on conflict (plan) do update
  set amount_cents = excluded.amount_cents,
      currency     = excluded.currency,
      updated_at   = now();

alter table public.billing_plans enable row level security;

-- Readable by anyone (prices are public). No write policies: service role only.
drop policy if exists "anyone reads billing_plans" on public.billing_plans;
create policy "anyone reads billing_plans" on public.billing_plans
  for select to anon, authenticated using (true);

-- 2. Store the Revolut public/token id on billing_orders so concurrent
--    checkout calls can short-circuit and return the existing session.
alter table public.billing_orders
  add column if not exists revolut_public_id text;

create index if not exists billing_orders_user_pending_idx
  on public.billing_orders (user_id, created_at desc)
  where state = 'pending';

-- 3. Atomic "schedule next charge" helper used by billing-renew.
--    Advancing next_charge_at immediately after a successful Revolut
--    /orders POST prevents the next cron tick from double-charging if
--    the webhook/ack is delayed. If Revolut later reports failure, the
--    existing markPastDue path takes over.
create or replace function public.billing_schedule_next_charge(
  p_user_id   uuid,
  p_next_at   timestamptz
) returns void language sql as $$
  update public.user_billing
     set next_charge_at = p_next_at
   where user_id = p_user_id
     and status  = 'active'
     and plan   <> 'free';
$$;
revoke all on function public.billing_schedule_next_charge(uuid, timestamptz) from public, anon, authenticated;
grant execute on function public.billing_schedule_next_charge(uuid, timestamptz) to service_role;
