--------------------------------------------------------------------------------
-- 0011_rate_limit
--   Generic per-IP request rate limiting for anonymous / expensive endpoints.
--   Mirrors the contact_messages sliding-window approach but as a dedicated,
--   route-keyed table so any endpoint can be throttled without overloading a
--   content table. Writes happen ONLY via the service role (lib/rate-limit.ts);
--   there is no anon policy, so the table is invisible to public clients.
--------------------------------------------------------------------------------

create table if not exists public.request_rate_limits (
  id          bigint      generated always as identity primary key,
  created_at  timestamptz not null default now(),
  route_key   text        not null check (char_length(route_key) between 1 and 80),
  ip_hash     text        not null  -- sha256 of client IP + pepper; no raw PII
);

-- Sliding-window counts filter by (route_key, ip_hash, created_at >= window).
create index if not exists request_rate_limits_lookup_idx
  on public.request_rate_limits (route_key, ip_hash, created_at desc);

-- Standalone index on created_at to support cheap retention pruning.
create index if not exists request_rate_limits_created_at_idx
  on public.request_rate_limits (created_at);

alter table public.request_rate_limits enable row level security;

-- No policies: anon/authenticated get zero access. The service_role bypasses
-- RLS, which is the only writer/reader.

--------------------------------------------------------------------------------
-- Retention: keep the table small. Anything older than 24h is irrelevant to a
-- sliding window measured in minutes/hours. Prune opportunistically from the
-- app (lib/rate-limit.ts deletes a small batch on a fraction of requests) and,
-- if pg_cron is available, on a schedule.
--------------------------------------------------------------------------------
do $$
begin
  if exists (select 1 from pg_extension where extname = 'pg_cron') then
    perform cron.schedule(
      'prune-request-rate-limits',
      '17 * * * *',
      $cron$ delete from public.request_rate_limits where created_at < now() - interval '24 hours' $cron$
    );
  end if;
exception when others then
  -- pg_cron not installed or no permission — app-side pruning still covers it.
  null;
end $$;
