--------------------------------------------------------------------------------
-- 0017_deleted_account_usage
--   Free-plan usage carried across an account deletion, so deleting and
--   recreating an account does not reset the monthly free questions.
--   Holds a peppered hash of the email (the address itself is not stored), the
--   questions used and the cycle end. Rows are removed when picked up by a new
--   account or once cycle_end has passed (lib/billing/deleted-usage.ts), so
--   nothing is kept longer than one billing month.
--   Service role only: RLS on, no policies.
--------------------------------------------------------------------------------
create table if not exists public.deleted_account_usage (
  identity_hash       text        primary key check (char_length(identity_hash) = 64),
  free_questions_used int         not null check (free_questions_used > 0),
  cycle_end           timestamptz not null,
  created_at          timestamptz not null default now()
);

create index if not exists deleted_account_usage_cycle_end_idx
  on public.deleted_account_usage (cycle_end);

alter table public.deleted_account_usage enable row level security;
revoke all on table public.deleted_account_usage from anon, authenticated;
