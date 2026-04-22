-- Physics.explained — /ask AI tutor infrastructure
-- See docs/superpowers/specs/2026-04-22-ask-ai-physics-tutor-design.md §5

-- 1. FTS on existing content_entries
alter table public.content_entries
  add column if not exists search_doc tsvector
  generated always as (
    setweight(to_tsvector('simple'::regconfig, coalesce(title,'')),        'A') ||
    setweight(to_tsvector('simple'::regconfig, coalesce(subtitle,'')),     'B') ||
    setweight(to_tsvector('simple'::regconfig, coalesce(blocks::text,'')), 'C')
  ) stored;

create index if not exists content_entries_search_idx
  on public.content_entries using gin (search_doc);

-- 2. Scene catalog
create table if not exists public.scene_catalog (
  id             text        primary key,
  label          text        not null,
  description    text        not null,
  topic_slugs    text[]      not null default '{}',
  params_schema  jsonb       not null,
  tags           text[]      not null default '{}',
  updated_at     timestamptz not null default now(),
  search_doc     tsvector generated always as (
    setweight(to_tsvector('simple'::regconfig, label),       'A') ||
    setweight(to_tsvector('simple'::regconfig, description), 'B')
  ) stored
);
create index if not exists scene_catalog_search_idx
  on public.scene_catalog using gin (search_doc);

alter table public.scene_catalog enable row level security;
drop policy if exists "public reads scene catalog" on public.scene_catalog;
create policy "public reads scene catalog" on public.scene_catalog
  for select to anon, authenticated using (true);

-- 3. Conversations
create table if not exists public.ask_conversations (
  id          uuid        primary key default gen_random_uuid(),
  user_id     uuid        not null references auth.users(id) on delete cascade,
  locale      text        not null,
  title       text,
  summary     text,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);
create index if not exists ask_conversations_user_idx
  on public.ask_conversations (user_id, updated_at desc);

alter table public.ask_conversations enable row level security;
drop policy if exists "user reads own convs" on public.ask_conversations;
drop policy if exists "user inserts own convs" on public.ask_conversations;
drop policy if exists "user updates own convs" on public.ask_conversations;
drop policy if exists "user deletes own convs" on public.ask_conversations;
create policy "user reads own convs"   on public.ask_conversations for select to authenticated using (user_id = auth.uid());
create policy "user inserts own convs" on public.ask_conversations for insert to authenticated with check (user_id = auth.uid());
create policy "user updates own convs" on public.ask_conversations for update to authenticated using (user_id = auth.uid());
create policy "user deletes own convs" on public.ask_conversations for delete to authenticated using (user_id = auth.uid());

-- 4. Messages
create table if not exists public.ask_messages (
  id               uuid        primary key default gen_random_uuid(),
  conversation_id  uuid        not null references public.ask_conversations(id) on delete cascade,
  role             text        not null check (role in ('user','assistant','tool')),
  content          jsonb       not null,
  model            text,
  input_tokens     int,
  output_tokens    int,
  cached_tokens    int,
  cost_usd_micros  bigint,
  meta             jsonb,
  created_at       timestamptz not null default now()
);
create index if not exists ask_messages_conv_idx
  on public.ask_messages (conversation_id, created_at);

alter table public.ask_messages enable row level security;
drop policy if exists "user reads own msgs" on public.ask_messages;
create policy "user reads own msgs" on public.ask_messages
  for select to authenticated using (
    exists (select 1 from public.ask_conversations c
            where c.id = conversation_id and c.user_id = auth.uid())
  );

-- 5. Per-user daily usage
create table if not exists public.ask_usage_daily (
  user_id            uuid        not null references auth.users(id) on delete cascade,
  day                date        not null,
  message_count      int         not null default 0,
  tokens_in          bigint      not null default 0,
  tokens_out         bigint      not null default 0,
  cost_micros        bigint      not null default 0,
  web_search_count   int         not null default 0,
  fetch_url_count    int         not null default 0,
  primary key (user_id, day)
);
alter table public.ask_usage_daily enable row level security;
drop policy if exists "user reads own usage" on public.ask_usage_daily;
create policy "user reads own usage" on public.ask_usage_daily
  for select to authenticated using (user_id = auth.uid());

-- 6. Usage increment RPC (service role only)
create or replace function public.ask_increment_usage(
  p_user_id uuid, p_day date,
  p_messages int, p_tokens_in bigint, p_tokens_out bigint,
  p_web_searches int, p_fetches int, p_cost_micros bigint
) returns void language sql as $$
  insert into public.ask_usage_daily (user_id, day, message_count, tokens_in, tokens_out, web_search_count, fetch_url_count, cost_micros)
  values (p_user_id, p_day, p_messages, p_tokens_in, p_tokens_out, p_web_searches, p_fetches, p_cost_micros)
  on conflict (user_id, day) do update
    set message_count    = public.ask_usage_daily.message_count    + excluded.message_count,
        tokens_in        = public.ask_usage_daily.tokens_in        + excluded.tokens_in,
        tokens_out       = public.ask_usage_daily.tokens_out       + excluded.tokens_out,
        web_search_count = public.ask_usage_daily.web_search_count + excluded.web_search_count,
        fetch_url_count  = public.ask_usage_daily.fetch_url_count  + excluded.fetch_url_count,
        cost_micros      = public.ask_usage_daily.cost_micros      + excluded.cost_micros;
$$;
revoke all on function public.ask_increment_usage from public;
grant execute on function public.ask_increment_usage to service_role;
