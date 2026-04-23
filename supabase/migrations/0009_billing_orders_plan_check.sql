-- Physics.explained — defensive CHECK on billing_orders.plan.
--
-- Motivation (L5 from the 2026-04-23 billing audit):
--   `billing_orders.plan` is a free-form text column written by the webhook
--   handler and checkout route. If a typo or a future plan rename ever
--   slips a bad value into the column, RPC consumers (notably sendReceiptEmail)
--   fall back to the raw string and send a nonsense receipt. A CHECK
--   constraint is cheap insurance and fails the transaction loudly at
--   insert-time instead of propagating bad data.
--
-- 0008_billing_plans.sql introduced a `billing_plans` table with its own
-- CHECK on `plan` but did not constrain the existing `billing_orders.plan`
-- column. This migration closes that gap. Intentionally using CHECK rather
-- than a foreign key to keep the constraint local and avoid coupling order
-- inserts to the seed order of billing_plans.

alter table public.billing_orders
  drop constraint if exists billing_orders_plan_check;

alter table public.billing_orders
  add constraint billing_orders_plan_check
  check (plan in ('free', 'starter', 'pro'));
