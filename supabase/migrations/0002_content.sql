-- Physics.explained — content storage + embeddings scaffold
-- Long-form content moves out of per-locale MDX into Supabase.
-- English remains authored in MDX; this table holds the parsed blocks
-- plus machine-generated translations. See
-- docs/superpowers/specs/2026-04-20-content-to-supabase-hybrid-design.md

create extension if not exists vector;

--------------------------------------------------------------------------------
-- content_entries
--   One row per (kind, slug, locale). `blocks` and `aside_blocks` are Block[]
--   JSON validated client-side; Postgres treats them as opaque JSONB.
--------------------------------------------------------------------------------

create table if not exists public.content_entries (
  kind          text         not null check (kind in ('topic','physicist','glossary')),
  slug          text         not null,
  locale        text         not null,
  title         text         not null,
  subtitle      text,
  blocks        jsonb        not null default '[]'::jsonb,
  aside_blocks  jsonb        not null default '[]'::jsonb,
  meta          jsonb        not null default '{}'::jsonb,
  source_hash   text,
  updated_at    timestamptz  not null default now(),
  primary key (kind, slug, locale)
);

create index if not exists content_entries_kind_locale_idx
  on public.content_entries (kind, locale);

alter table public.content_entries enable row level security;

create policy "public can read content"
  on public.content_entries
  for select
  to anon, authenticated
  using (true);

-- Writes are service_role only (CLI pipelines). service_role bypasses RLS so
-- no explicit policy needed.

--------------------------------------------------------------------------------
-- content_embeddings
--   Scaffold for upcoming AI retrieval. No producer in this plan.
--------------------------------------------------------------------------------

create table if not exists public.content_embeddings (
  id           bigserial primary key,
  kind         text   not null,
  slug         text   not null,
  locale       text   not null,
  chunk_index  int    not null,
  chunk_text   text   not null,
  embedding    vector(1536),
  foreign key (kind, slug, locale)
    references public.content_entries (kind, slug, locale)
    on delete cascade
);

create index if not exists content_embeddings_vec_idx
  on public.content_embeddings
  using ivfflat (embedding vector_cosine_ops);

alter table public.content_embeddings enable row level security;

create policy "public can read embeddings"
  on public.content_embeddings
  for select
  to anon, authenticated
  using (true);
