-- Physics.explained — idempotency column for receipt emails.
-- sendReceiptForOrder() guards on this so webhook + order-status fallback
-- can't double-send.

alter table public.billing_orders
  add column if not exists receipt_sent_at timestamptz;
