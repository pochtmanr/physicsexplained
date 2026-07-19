--------------------------------------------------------------------------------
-- 0013_ios_taxonomy_and_snapshots
--   iOS support (docs/ios/06-backend-changes.md §1). Mirrors the compile-time
--   registry lib/content/branches.ts into Postgres so a native client can build
--   navigation without shipping the registry, and adds the scene snapshot column.
--
--   The registry stays the SOURCE OF TRUTH; these tables are a published
--   projection, rewritten by scripts/content/publish-taxonomy.ts. RLS exposes
--   only live rows to clients, so draft/coming-soon essays stay unlisted.
--
--   Writes are service-role only — no insert/update/delete policies exist, the
--   same pattern content_entries uses.
--------------------------------------------------------------------------------

--------------------------------------------------------------------------------
-- 1. taxonomy_branches
--------------------------------------------------------------------------------
create table if not exists public.taxonomy_branches (
  slug        text        primary key,
  index       int         not null,
  title       text        not null,
  eyebrow     text        not null,   -- "§ 01"
  subtitle    text        not null,
  description text        not null,
  status      text        not null check (status in ('live','coming-soon')),
  updated_at  timestamptz not null default now()
);

alter table public.taxonomy_branches enable row level security;
drop policy if exists "public reads live branches" on public.taxonomy_branches;
create policy "public reads live branches" on public.taxonomy_branches
  for select to anon, authenticated using (status = 'live');

--------------------------------------------------------------------------------
-- 2. taxonomy_modules
--------------------------------------------------------------------------------
create table if not exists public.taxonomy_modules (
  branch_slug text        not null references public.taxonomy_branches(slug) on delete cascade,
  slug        text        not null,
  title       text        not null,
  index       int         not null,
  updated_at  timestamptz not null default now(),
  primary key (branch_slug, slug)
);

create index if not exists taxonomy_modules_order_idx
  on public.taxonomy_modules (branch_slug, index);

alter table public.taxonomy_modules enable row level security;
drop policy if exists "public reads modules of live branches" on public.taxonomy_modules;
create policy "public reads modules of live branches" on public.taxonomy_modules
  for select to anon, authenticated using (
    exists (select 1 from public.taxonomy_branches b
            where b.slug = branch_slug and b.status = 'live')
  );

--------------------------------------------------------------------------------
-- 3. taxonomy_topics
--    slug is the BARE topic slug; content_entries.slug for a topic is
--    branch_slug || '/' || slug.
--    index has no registry equivalent (Topic carries no index field) — it is
--    derived by the publish script from the FIG.NN prefix in eyebrow, with array
--    position as fallback. The DB stays a dumb projection.
--------------------------------------------------------------------------------
create table if not exists public.taxonomy_topics (
  branch_slug     text        not null references public.taxonomy_branches(slug) on delete cascade,
  module_slug     text        not null,
  slug            text        not null,
  title           text        not null,
  eyebrow         text        not null,   -- "FIG.16 · OSCILLATIONS"
  subtitle        text        not null,
  reading_minutes int         not null,
  index           int         not null,
  status          text        not null check (status in ('live','draft','coming-soon')),
  updated_at      timestamptz not null default now(),
  primary key (branch_slug, slug)
);

create index if not exists taxonomy_topics_module_idx
  on public.taxonomy_topics (branch_slug, module_slug, index);

alter table public.taxonomy_topics enable row level security;
drop policy if exists "public reads live topics" on public.taxonomy_topics;
create policy "public reads live topics" on public.taxonomy_topics
  for select to anon, authenticated using (
    status = 'live'
    and exists (select 1 from public.taxonomy_branches b
                where b.slug = branch_slug and b.status = 'live')
  );

--------------------------------------------------------------------------------
-- 4. scene_catalog.snapshot_url
--    Pre-rendered PNG per registered scene, filled by scripts/ios/snapshot-scenes.ts
--    (P0-3). The iOS reader shows it for any figure without a native port.
--------------------------------------------------------------------------------
alter table public.scene_catalog
  add column if not exists snapshot_url text;
