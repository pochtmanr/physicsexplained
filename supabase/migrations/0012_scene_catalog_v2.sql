-- Scene catalog v2 — full-arsenal catalog generated from MDX figures.
-- Adds figure metadata columns and folds the source-essay title into the FTS
-- document: figure captions rarely contain the concept name (FIG.13b's caption
-- never says "Biot-Savart"), so label-only search misses most natural queries.

alter table public.scene_catalog
  add column if not exists default_props jsonb   not null default '{}'::jsonb,
  add column if not exists fig_label     text,
  add column if not exists source_title  text,
  add column if not exists curated       boolean not null default false;

-- array_to_string is only STABLE, which Postgres rejects inside a generated
-- column (42P17). For text[] with a constant separator it is de-facto
-- immutable, so wrap it — the standard workaround.
create or replace function public.immutable_array_to_string(text[], text)
returns text language sql immutable parallel safe
as $$ select array_to_string($1, $2) $$;

-- search_doc is a stored generated column: the expression can only be changed
-- by dropping and re-adding it (this also drops the old GIN index).
alter table public.scene_catalog drop column if exists search_doc;
alter table public.scene_catalog add column search_doc tsvector generated always as (
  setweight(to_tsvector('simple'::regconfig, label),                                              'A') ||
  setweight(to_tsvector('simple'::regconfig, coalesce(source_title, '')),                         'A') ||
  setweight(to_tsvector('simple'::regconfig, description),                                        'B') ||
  setweight(to_tsvector('simple'::regconfig, coalesce(public.immutable_array_to_string(tags, ' '), '')), 'C')
) stored;

create index if not exists scene_catalog_search_idx
  on public.scene_catalog using gin (search_doc);
