-- Priority 2 — problem sets, equations, attempt logs, diagnosis cache.
-- Spec: docs/superpowers/specs/2026-04-30-priority-2-problem-sets-ai-feedback-design.md §3.4

create extension if not exists pg_trgm;

--------------------------------------------------------------------------------
-- 1. problems — language-neutral problem metadata
--    Source: lib/content/problems.ts (PROBLEMS)
--    Synced via: pnpm content:publish-problems
--------------------------------------------------------------------------------
create table if not exists public.problems (
  id                 text primary key,
  primary_topic_slug text not null,
  difficulty         text not null check (difficulty in ('easy','medium','hard','challenge','exam')),
  equation_slugs     text[] not null default '{}',
  inputs_json        jsonb not null,
  steps_json         jsonb not null,
  solver_path        text not null,
  updated_at         timestamptz not null default now()
);
create index if not exists problems_primary_topic_idx on public.problems (primary_topic_slug);
create index if not exists problems_equation_slugs_gin on public.problems using gin (equation_slugs);

alter table public.problems enable row level security;
drop policy if exists "anyone reads problems" on public.problems;
create policy "anyone reads problems" on public.problems
  for select to anon, authenticated using (true);

--------------------------------------------------------------------------------
-- 2. problem_topic_links — many-to-many cross-tagging (primary + related topics)
--------------------------------------------------------------------------------
create table if not exists public.problem_topic_links (
  problem_id  text references public.problems(id) on delete cascade,
  topic_slug  text not null,
  role        text not null check (role in ('primary','related')),
  primary key (problem_id, topic_slug)
);
create index if not exists problem_topic_links_topic_idx on public.problem_topic_links (topic_slug);

alter table public.problem_topic_links enable row level security;
drop policy if exists "anyone reads problem_topic_links" on public.problem_topic_links;
create policy "anyone reads problem_topic_links" on public.problem_topic_links
  for select to anon, authenticated using (true);

--------------------------------------------------------------------------------
-- 3. problem_strings — localized prose (statement, step prompts, walkthrough)
--------------------------------------------------------------------------------
create table if not exists public.problem_strings (
  problem_id  text references public.problems(id) on delete cascade,
  locale      text not null,
  statement   text not null,
  steps_json  jsonb not null,
  walkthrough text not null,
  primary key (problem_id, locale)
);

alter table public.problem_strings enable row level security;
drop policy if exists "anyone reads problem_strings" on public.problem_strings;
create policy "anyone reads problem_strings" on public.problem_strings
  for select to anon, authenticated using (true);

--------------------------------------------------------------------------------
-- 4. equations — language-neutral equation metadata
--    Source: lib/content/equations.ts (EQUATIONS)
--------------------------------------------------------------------------------
create table if not exists public.equations (
  slug                  text primary key,
  latex                 text not null,
  related_topic_slugs   text[] not null default '{}',
  updated_at            timestamptz not null default now()
);

alter table public.equations enable row level security;
drop policy if exists "anyone reads equations" on public.equations;
create policy "anyone reads equations" on public.equations
  for select to anon, authenticated using (true);

--------------------------------------------------------------------------------
-- 5. equation_strings — localized prose for the 4 narrative sections
--------------------------------------------------------------------------------
create table if not exists public.equation_strings (
  slug              text references public.equations(slug) on delete cascade,
  locale            text not null,
  name              text not null,
  what_it_solves    text not null,
  when_to_use       text not null,
  when_not_to       text not null,
  common_mistakes   text not null,
  primary key (slug, locale)
);

alter table public.equation_strings enable row level security;
drop policy if exists "anyone reads equation_strings" on public.equation_strings;
create policy "anyone reads equation_strings" on public.equation_strings
  for select to anon, authenticated using (true);

--------------------------------------------------------------------------------
-- 6. problem_attempts — per-user log of every step submission
--------------------------------------------------------------------------------
create table if not exists public.problem_attempts (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null references auth.users(id) on delete cascade,
  problem_id   text not null references public.problems(id) on delete cascade,
  step_id      text not null,
  student_expr text not null,
  correct      boolean not null,
  created_at   timestamptz not null default now()
);
create index if not exists problem_attempts_user_idx on public.problem_attempts (user_id, created_at desc);
create index if not exists problem_attempts_problem_idx on public.problem_attempts (problem_id, created_at desc);

alter table public.problem_attempts enable row level security;
drop policy if exists "users read own attempts" on public.problem_attempts;
create policy "users read own attempts" on public.problem_attempts
  for select using (auth.uid() = user_id);
drop policy if exists "users insert own attempts" on public.problem_attempts;
create policy "users insert own attempts" on public.problem_attempts
  for insert with check (auth.uid() = user_id);

--------------------------------------------------------------------------------
-- 7. diagnosis_cache — global, paid-once cache for LLM diagnosis prose
--    Same wrong answer never costs us twice across all users.
--------------------------------------------------------------------------------
create table if not exists public.diagnosis_cache (
  cache_key         text primary key,
  diagnosis_text    text not null,
  prompt_tokens     int  not null,
  completion_tokens int  not null,
  created_at        timestamptz not null default now()
);

alter table public.diagnosis_cache enable row level security;
drop policy if exists "anyone reads diagnosis_cache" on public.diagnosis_cache;
create policy "anyone reads diagnosis_cache" on public.diagnosis_cache
  for select to anon, authenticated using (true);
-- writes are service-role only.

--------------------------------------------------------------------------------
-- 8. problem_diagnoses — per-attempt link to the cached diagnosis
--------------------------------------------------------------------------------
create table if not exists public.problem_diagnoses (
  attempt_id  uuid primary key references public.problem_attempts(id) on delete cascade,
  cache_key   text not null references public.diagnosis_cache(cache_key),
  cache_hit   boolean not null,
  created_at  timestamptz not null default now()
);
create index if not exists problem_diagnoses_cache_key_idx on public.problem_diagnoses (cache_key);

alter table public.problem_diagnoses enable row level security;
drop policy if exists "users read own diagnoses" on public.problem_diagnoses;
create policy "users read own diagnoses" on public.problem_diagnoses
  for select using (
    exists (
      select 1 from public.problem_attempts pa
      where pa.id = problem_diagnoses.attempt_id and pa.user_id = auth.uid()
    )
  );

--------------------------------------------------------------------------------
-- 9. user_billing — daily quota counters for diagnoses + ocr
--------------------------------------------------------------------------------
alter table public.user_billing
  add column if not exists problem_diagnoses_used_today int not null default 0,
  add column if not exists problem_ocr_used_today       int not null default 0;

--------------------------------------------------------------------------------
-- 10. match_problem_from_ocr — fuzzy match against the problem catalog
--     Combines pg_trgm statement similarity (40%) + input-key overlap (30%)
--     + equation-slug overlap (30%).
--------------------------------------------------------------------------------
create or replace function public.match_problem_from_ocr(
  p_statement      text,
  p_input_keys     text[],
  p_equation_slugs text[],
  p_locale         text
) returns table (id text, primary_topic_slug text, score double precision)
language sql stable as $$
  select
    p.id,
    p.primary_topic_slug,
    (
      similarity(ps.statement, p_statement) * 0.4
      + (
          cardinality(array(select unnest(coalesce(p_input_keys,'{}'::text[])) intersect select jsonb_object_keys(p.inputs_json)))::float
          / greatest(cardinality(coalesce(p_input_keys,'{}'::text[]))::float, 1)
        ) * 0.3
      + (
          cardinality(array(select unnest(coalesce(p_equation_slugs,'{}'::text[])) intersect select unnest(p.equation_slugs)))::float
          / greatest(cardinality(coalesce(p_equation_slugs,'{}'::text[]))::float, 1)
        ) * 0.3
    ) as score
  from public.problems p
  join public.problem_strings ps
    on ps.problem_id = p.id and ps.locale = p_locale
  where ps.statement % p_statement
  order by score desc
  limit 5;
$$;

--------------------------------------------------------------------------------
-- 11. quota counter increments — atomic bumps for the API routes
--------------------------------------------------------------------------------
create or replace function public.increment_problem_diagnoses_used_today(p_user_id uuid)
returns void language sql as $$
  update public.user_billing
  set problem_diagnoses_used_today = problem_diagnoses_used_today + 1
  where user_id = p_user_id;
$$;

create or replace function public.increment_problem_ocr_used_today(p_user_id uuid)
returns void language sql as $$
  update public.user_billing
  set problem_ocr_used_today = problem_ocr_used_today + 1
  where user_id = p_user_id;
$$;
