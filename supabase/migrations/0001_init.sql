-- Physics.explained — initial schema
-- Two tables for operational state. Article content stays in MDX.
--
-- Run this once in the Supabase SQL editor for the dedicated `physics` project,
-- or apply via `supabase db push` if you use the local CLI.

--------------------------------------------------------------------------------
-- 1. contact_messages
--    Submissions from the /about page contact form.
--------------------------------------------------------------------------------

create table if not exists public.contact_messages (
  id          uuid        primary key default gen_random_uuid(),
  created_at  timestamptz not null default now(),
  name        text        not null check (char_length(name)    between 2 and 200),
  email       text        not null check (char_length(email)   between 3 and 320),
  message     text        not null check (char_length(message) between 10 and 5000),
  user_agent  text,
  ip_hash     text  -- sha256 of client IP, used for abuse rate-limiting only
);

create index if not exists contact_messages_created_at_idx
  on public.contact_messages (created_at desc);

alter table public.contact_messages enable row level security;

-- Anonymous visitors may INSERT their own message.
create policy "anon can submit contact message"
  on public.contact_messages
  for insert
  to anon
  with check (true);

-- Nobody but the service_role can SELECT / UPDATE / DELETE.
-- (service_role bypasses RLS, so no explicit policy needed.)


--------------------------------------------------------------------------------
-- 2. email_signups
--    "Notify me when this branch is live" signups on coming-soon branches.
--------------------------------------------------------------------------------

create table if not exists public.email_signups (
  id          uuid        primary key default gen_random_uuid(),
  created_at  timestamptz not null default now(),
  email       text        not null check (char_length(email) between 3 and 320),
  branch_slug text        not null check (char_length(branch_slug) between 1 and 80),
  unique (email, branch_slug)
);

create index if not exists email_signups_branch_slug_idx
  on public.email_signups (branch_slug);

alter table public.email_signups enable row level security;

-- Anonymous visitors may INSERT themselves.
create policy "anon can sign up for branch updates"
  on public.email_signups
  for insert
  to anon
  with check (true);

-- Reads / admin remain service_role only.


--------------------------------------------------------------------------------
-- Notes
--
-- * Translations are NOT in this schema on purpose. Article prose lives in
--   per-locale MDX files; UI strings live in per-topic JSON message files.
--   See app/(topics)/*/messages.<locale>.json — loaded lazily per route.
--
-- * When translation scope grows (UGC corrections, community-sourced locales,
--   etc.), add a `translations` table here. Don't pre-build it.
--
-- * Abuse protection: contact_messages has no rate limit at DB level. Enforce
--   that in the server action (IP hash + sliding window) before inserting.
--------------------------------------------------------------------------------
