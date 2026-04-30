# Priority 2 — Problem Sets per Topic with AI Feedback

**Date:** 2026-04-30
**Status:** Approved (brainstorm), pending implementation plan
**Brainstorm transcript:** in-conversation; key decisions captured in §0 below

---

## §0 Decisions captured during brainstorming

| # | Decision | Rationale |
|---|---|---|
| Q1 | **Scope = end-to-end seed branch** (vs SEO-first / moat-first) | Only path that yields a real, shippable conversion funnel for a paying user |
| Q2 | **Seed = `kinematics-newton` + `oscillations`** (8 topics × 5 problems = 40 problems) | Two modules stress the verifier across genuinely different solver shapes (kinematics ODEs vs SHO closed-form); 40 problems is a believable launch surface; the rest of CM and other branches fan out via the same playbook in future sessions |
| Q3 | **Verifier = deterministic checker + LLM only for diagnosis prose** | ~10× cheaper than LLM-driven verification; deterministic and reproducible (same wrong answer → same diagnosis prompt → cacheable); the moat against ChatGPT is verified-by-test ground truth |
| Q4 | **Step UX = guided named steps** (vs free-form pad) | Bounded parsing → verifier works reliably; uniform authoring; pedagogically defensible (Polya decomposition); free-form pad deferred to v2 |
| Q5 | **Storage = typed TS registry, parallel-agent authoring** (vs MDX-per-problem / Supabase-only) | Mirrors existing `lib/physics/*` + `lib/content/*` pattern; subagent fanout proven on this repo (RT Sessions 1–3 shipped 28 topics); verified-by-vitest ground truth IS the moat |
| Q6 | **Cross-topic = multi-tagged with one canonical home** (vs unique per topic) | One canonical URL per problem (no duplicate-content SEO penalty), but appears on every relevant topic page and every relevant equation index page; same authoring effort as unique-per-topic |
| — | **Supabase storage = TS source of truth + `pnpm content:publish` sync** (per existing pattern) | TS files vitest-validate the solver; publish syncs to Supabase tables so Ask, OCR matching, and analytics can query at runtime |
| — | **i18n = language-neutral physics + per-locale strings** | Mathematical notation needs no re-translation; only prose (statement, hints, common-mistakes) lives per-locale in `messages/<locale>/problems/**`; existing `pnpm content:translate` flow handles he pass |
| — | **OCR vendor default = Claude Sonnet 4.6 vision** (already in `package.json`) | No new vendor; clean abstraction in `lib/problems/ocr.ts` so Mathpix can swap in if handwritten quality is insufficient |
| — | **Diagnoser model = Claude Sonnet 4.6** (Anthropic SDK already in deps) | Same provider stack as Ask; Haiku 4.5 is the cheaper fallback if cost becomes a concern |
| — | **Paywall = free-tier deterministic verification stays unlimited; LLM diagnosis + photo OCR are gated** | Determinism is cheap (no LLM call); diagnosis prose is the upsell hook fired exactly when the student is stuck and motivated |

---

## §1 Goal

Ship the conversion funnel — problems + AI-verified step-by-step + equation index + photo OCR — **end-to-end on `kinematics-newton` + `oscillations`** (8 topics, 40 problems across 5 difficulty tiers per topic), plus a documented playbook so future sessions can fan the same recipe across the remaining 30 CM topics and the other 5 branches via parallel subagents.

This is the conversion feature. Without homework help, undergrads don't pay; with it, they do. The moat against ChatGPT is that physics steps are verified against unit-tested solvers, not against a language model's guess about whether the algebra checks out.

---

## §2 Runtime architecture

```
Topic page (/<locale>/classical-mechanics/<topic>)
  ├─ Existing prose + scenes (unchanged)
  ├─ NEW "Problems" section: 5 problem cards (difficulty + ~50-word teaser + status)
  ├─ NEW "Equations on this page" rail (links to equation index)
  └─ NEW cross-tagged related problems from other topics

Problem page (/<locale>/classical-mechanics/<topic>/problems/<id>)
  ├─ Statement (LaTeX-rendered, multi-locale)
  ├─ "Linked equations" rail: chips → equation index pages
  ├─ Step-by-step pad (guided named steps, one ACTIVE at a time)
  │    ├─ Student input → POST /api/problems/<id>/check
  │    │    ├─ Deterministic: parse w/ mathjs → numeric-probe vs canonical
  │    │    ├─ ✓ → reveal next step
  │    │    └─ ✗ → call LLM diagnoser → return one-paragraph feedback
  │    └─ "Show me" → reveals canonical expression, marks step SKIPPED
  ├─ "Try with AI" button → /<locale>/ask?seed=<problem_id>&topic=<slug>
  └─ "Solution walkthrough" (collapsed by default, full prose w/ all steps)

Equation index page (/<locale>/equations/<equation_slug>)
  ├─ Equation rendered prominently (KaTeX)
  ├─ "What it solves" — narrative
  ├─ "When to use it" / "When NOT to use it" / "Common mistakes" — 3 sections
  ├─ "Topics that use this equation" — auto-generated from problem.equationSlugs[]
  └─ "Problems using this equation" — auto-generated cross-list

Photo upload (inline button on /<locale>/ask, also bare /<locale>/upload page)
  ├─ Image → Claude Sonnet 4.6 vision (single multimodal call):
  │    ├─ OCR the problem statement
  │    ├─ Classify against problem catalog (fuzzy match by statement text +
  │    │   inputs/units overlap + equation-slug overlap, weighted)
  │    ├─ If match score > 0.7: deep-link to canonical /problems/<id>
  │    └─ Otherwise: fall through to Ask streaming with extracted text as seed
  └─ Quota: free 1/day, starter 10/day, pro unlimited
```

---

## §3 Data model

### §3.1 TypeScript source of truth

```
lib/problems/<branch>/<topic>/<id>.ts        // Problem solver: inputs → named
                                              // intermediates {vx, vy, t, range}
                                              // + final answer. Wraps existing
                                              // lib/physics/* solvers.
tests/problems/<branch>/<topic>/<id>.test.ts // Vitest: every named intermediate
                                              // numerically asserted vs solver.
lib/content/problems.ts                       // Registry: language-neutral entries
lib/content/equations.ts                      // NEW: equation registry
lib/problems/verify.ts                        // Shared: parse + numeric-probe +
                                              // tolerance + diagnostic payload
lib/problems/diagnoser.ts                     // Shared: LLM call w/ structured
                                              // prompt + cache by (stepId, hash)
lib/problems/ocr.ts                           // Shared: vision client wrapper +
                                              // catalog matcher
```

### §3.2 Type shapes (additions to `lib/content/types.ts`)

```ts
export type ProblemDifficulty = "easy" | "medium" | "hard" | "challenge" | "exam";

export interface ProblemStep {
  id: string;                  // stable, e.g. "vx", "t-flight", "range"
  varName: string;             // e.g. "v_x" — used in prompts and canonical exprs
  // localized prompt + hint + commonMistakes live in messages/<locale>/problems
  canonicalExpr: string;       // e.g. "v_0 * cos(theta)"
  units: string;               // e.g. "m/s" — used to detect dimensional errors
  inputDomain: Record<string, [number, number]>;
                               // sample ranges for numeric probing
  toleranceRel: number;        // e.g. 1e-6 — relative tolerance for probe
}

export interface Problem {
  id: string;                  // globally unique kebab-case, e.g. "projectile-range-easy-1"
  primaryTopicSlug: string;
  relatedTopicSlugs: readonly string[];
  difficulty: ProblemDifficulty;
  equationSlugs: readonly string[];
  inputs: Record<string, { value: number; units: string }>;
                               // canonical inputs used to compute final answer
  steps: readonly ProblemStep[];
  finalAnswerStepId: string;   // which step's value is the "answer"
  solverPath: string;          // e.g. "lib/problems/classical-mechanics/vectors-and-projectile-motion/projectile-range-easy-1.ts"
  // localized strings live in messages/<locale>/problems
}

export interface Equation {
  slug: string;                // kebab-case, e.g. "newtons-second-law"
  latex: string;               // e.g. "F = ma"
  relatedTopicSlugs: readonly string[];
  // localized strings live in messages/<locale>/equations
}
```

### §3.3 Per-locale message files

```
messages/<locale>/problems/<branch>/<topic>/<id>.json
{
  "statement": "A ball is launched at v₀ = 30 m/s at θ = 45° above the horizontal. ...",
  "steps": [
    { "id": "vx", "prompt": "Find the x-component of the initial velocity.",
      "hint": "Project v₀ onto the horizontal axis.",
      "commonMistakes": ["Using sin instead of cos.", "Forgetting to convert degrees."] },
    ...
  ],
  "finalAnswerProse": "The projectile lands ~91.8 m from the launch point.",
  "walkthrough": "Decompose the velocity into horizontal and vertical components ..."
}

messages/<locale>/equations/<slug>.json
{
  "name": "Newton's Second Law",
  "whatItSolves": "Relates net force, mass, and acceleration ...",
  "whenToUse": "Use when ...",
  "whenNotTo": "Avoid when relativistic effects are significant ...",
  "commonMistakes": ["Confusing weight with mass.", ...]
}
```

### §3.4 Supabase tables (new)

Populated by `pnpm content:publish` from the TS source of truth.

```sql
create table public.problems (
  id                 text primary key,
  primary_topic_slug text not null,
  difficulty         text not null check (difficulty in ('easy','medium','hard','challenge','exam')),
  equation_slugs     text[] not null default '{}',
  inputs_json        jsonb not null,
  steps_json         jsonb not null,           -- canonical exprs, units, tolerance
  solver_path        text not null,
  updated_at         timestamptz not null default now()
);
create index problems_primary_topic_idx on public.problems (primary_topic_slug);
create index problems_equation_slugs_gin on public.problems using gin (equation_slugs);

create table public.problem_topic_links (
  problem_id  text references public.problems(id) on delete cascade,
  topic_slug  text not null,
  role        text not null check (role in ('primary','related')),
  primary key (problem_id, topic_slug)
);
create index problem_topic_links_topic_idx on public.problem_topic_links (topic_slug);

create table public.problem_strings (
  problem_id  text references public.problems(id) on delete cascade,
  locale      text not null,
  statement   text not null,
  steps_json  jsonb not null,                  -- localized prompts/hints/mistakes
  walkthrough text not null,
  primary key (problem_id, locale)
);

create table public.equations (
  slug                  text primary key,
  latex                 text not null,
  related_topic_slugs   text[] not null default '{}',
  updated_at            timestamptz not null default now()
);

create table public.equation_strings (
  slug              text references public.equations(slug) on delete cascade,
  locale            text not null,
  name              text not null,
  what_it_solves    text not null,
  when_to_use       text not null,
  when_not_to       text not null,
  common_mistakes   text not null,
  primary key (slug, locale)
);

create table public.problem_attempts (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null references auth.users(id) on delete cascade,
  problem_id   text not null references public.problems(id) on delete cascade,
  step_id      text not null,
  student_expr text not null,
  correct      boolean not null,
  created_at   timestamptz not null default now()
);
alter table public.problem_attempts enable row level security;
create policy "users read own attempts" on public.problem_attempts
  for select using (auth.uid() = user_id);
create policy "users insert own attempts" on public.problem_attempts
  for insert with check (auth.uid() = user_id);

-- Global cache: each unique (step_id, normalized_student_expr) pays for an LLM
-- diagnosis exactly once across ALL users. Cache hits are free.
create table public.diagnosis_cache (
  cache_key         text primary key,          -- sha256(step_id + ":" + normalized_expr)
  diagnosis_text    text not null,
  prompt_tokens     int  not null,
  completion_tokens int  not null,
  created_at        timestamptz not null default now()
);

-- Per-attempt link to the cached diagnosis (or the one we just wrote).
-- Lets us reconstruct "what diagnosis did this user see" without duplicating prose.
create table public.problem_diagnoses (
  attempt_id  uuid primary key references public.problem_attempts(id) on delete cascade,
  cache_key   text not null references public.diagnosis_cache(cache_key),
  cache_hit   boolean not null,                -- true = served from cache, no LLM call
  created_at  timestamptz not null default now()
);
create index problem_diagnoses_cache_key_idx on public.problem_diagnoses (cache_key);
```

### §3.5 Billing additions

Two new columns on `user_billing` (pattern matches existing `free_questions_used`):

```sql
alter table public.user_billing
  add column if not exists problem_diagnoses_used_today int not null default 0,
  add column if not exists problem_ocr_used_today       int not null default 0;
```

Reset by the existing daily cron alongside `free_questions_used`.

---

## §4 The verifier (the moat)

### §4.1 `lib/problems/verify.ts`

```ts
export interface VerifyInput {
  problemId: string;
  stepId: string;
  studentExpr: string;
  locale: string;
}

export interface VerifyResult {
  ok: boolean;
  studentValue: number;       // probed at canonical inputs
  canonicalValue: number;
  diff: number;
  parseError?: string;        // mathjs threw — show "Try a different form"
  dimensionalError?: string;  // unit mismatch — show "Check your units"
}

export function verifyStep(input: VerifyInput): VerifyResult;
```

### §4.2 How probing works

1. Look up the step's `canonicalExpr` and `inputDomain` from the registry.
2. Sample **5 random tuples** of inputs within `inputDomain`. Use a deterministic seed derived from `(problemId, stepId)` so tests are reproducible.
3. Pre-normalize student input: insert implicit multiplication (`30sin x` → `30*sin(x)`), lowercase trig functions, accept both `^` and `**`, accept `pi`/`π`/`PI`.
4. Parse student expression with `mathjs.parse`. On parse failure → `parseError` set, `ok: false`.
5. Evaluate both expressions at each sample tuple. Compare with relative tolerance (default `1e-6`).
6. **Accept** iff all 5 samples agree → `ok: true`.
7. **Reject** if any sample disagrees → `ok: false` with `studentValue`/`canonicalValue` populated at the canonical (problem-default) input tuple for the diagnoser to use.

This catches `30 cos(45°)`, `cos(45°) * 30`, `30/√2`, `21.213` — all equivalent. Catches sign flips, swapped variables, missing factors, wrong-trig-function. False-positive rate <0.001% with 5 samples.

### §4.3 `lib/problems/diagnoser.ts`

Called only when `verifyStep` returns `ok: false`. Single Anthropic Sonnet 4.6 call.

**Cache key:** `sha256(stepId + ":" + normalizedStudentExpr)`. Lookup is against `diagnosis_cache` (the global, cross-user table). If hit → return cached `diagnosis_text`, no API call, write a `problem_diagnoses` row with `cache_hit = true`. If miss → call LLM, insert into `diagnosis_cache`, then insert `problem_diagnoses` row with `cache_hit = false`. Same wrong answer never costs twice across all users.

**Prompt structure:**
```
SYSTEM: You are a physics tutor diagnosing a single wrong step in a homework
problem. The student's algebra has been numerically verified as incorrect.
Write ONE paragraph (≤80 words), no LaTeX, no preamble, no encouragement
fluff. Identify what went wrong and what to try instead. Refer to common
mistakes if they match.

USER: Problem: <problem.statement (localized)>
Step <stepId>: <step.prompt (localized)>
Canonical expression: <canonicalExpr>
Student expression: <studentExpr>
Numeric values at default inputs: canonical = <canonicalValue>, student = <studentValue>
Common mistakes for this step: <commonMistakes (localized, joined)>
Locale: <locale>
```

Temperature 0.2. Max tokens 200. Token spend per failed step: ~400 input + ~150 output ≈ $0.003 on Sonnet 4.6, ~$0.0003 on Haiku 4.5 if we drop tier. At 1000 attempts/day × 30% wrong rate × 50% cache miss × $0.003 = **~$0.45/day worst case**.

### §4.4 API route `app/api/problems/[id]/check/route.ts`

```
POST /api/problems/<id>/check
body: { stepId: string, studentExpr: string, locale: string }

1. auth gate (existing getSsrClient pattern)
2. quota gate:
   - if free user has used ≥5 diagnoses today AND verify will return ok=false:
     return verify result with `quotaExhausted: true`, no diagnosis call
3. verifyStep() → VerifyResult
4. insert problem_attempts row → attemptId
5. if !result.ok and quota allows:
   - lookup diagnosis_cache by cache_key
   - if hit: insert problem_diagnoses { attemptId, cache_key, cache_hit: true } — DO NOT decrement quota
   - if miss: call diagnoser → insert diagnosis_cache → insert problem_diagnoses { attemptId, cache_key, cache_hit: false } → increment problem_diagnoses_used_today
6. return { verify: VerifyResult, diagnosis?: string, quotaExhausted?: boolean }
```

Edge: cache hits do NOT count against the user's daily quota (they cost us $0). This is a small but meaningful quality-of-life improvement that also rewards exploring the problem space.

---

## §5 Step UX state machine

```
LOCKED → ACTIVE → CHECKING → (CORRECT | WRONG → ACTIVE | SKIPPED via "Show me")
                              ↓
                              CORRECT → next step ACTIVE (or COMPLETE if final)
```

- Steps render top-to-bottom; only ACTIVE step has the input box visible.
- LOCKED steps show name + lock icon (greyed-out).
- CORRECT steps collapse into one-line summary with the student's accepted expression.
- WRONG steps stay ACTIVE; LLM diagnosis renders under the input box; student edits and re-submits.
- "Show me" reveals canonical expression, marks step SKIPPED, advances. Counts as not-mastered for analytics but doesn't block progress.
- Final step CORRECT → state = COMPLETE, "Solution walkthrough" auto-expands, success affordance (subtle, not confetti — match existing site tone).

Component breakdown:
- `components/problems/step-pad.tsx` — the only client component; manages local state, posts to `/api/problems/<id>/check`, renders all steps.
- `components/problems/step-row.tsx` — pure presentational; one row per step.
- `components/problems/equation-rail.tsx` — server component; renders linked-equation chips.
- `components/problems/problems-section.tsx` — server component; embedded on topic pages, lists 5 problems by difficulty.

---

## §6 Authoring pipeline (the playbook)

Mirrors the RT Session 2/3 token-saving subagent variant that already shipped 28 topics.

### §6.1 Wave 0 — orchestrator, serial, ~5 min

- Add `Problem`, `ProblemStep`, `Equation`, `ProblemDifficulty` types to `lib/content/types.ts`.
- Scaffold empty `lib/content/problems.ts` and `lib/content/equations.ts` (exporting empty arrays + helper getters mirroring `getAllPhysicists()` / `getAllGlossaryTerms()`).
- Apply migration `0010_problems_and_equations.sql` (the §3.4 + §3.5 schemas).
- Single commit.

### §6.2 Wave 1 — orchestrator, serial, ~25 min

- Build `lib/problems/verify.ts` with comprehensive vitest (≥30 cases: equivalent forms accepted, sign flips rejected, dimensional errors flagged, parser errors handled, deterministic sampling).
- Build `lib/problems/diagnoser.ts` with mocked-LLM vitest (cache hit/miss, prompt structure correctness, locale propagation).
- Build `lib/problems/ocr.ts` with mocked-vision vitest (match-score threshold, JSON-shape parsing).
- Build `app/api/problems/[id]/check/route.ts` (auth + quota + verify + diagnose + log).
- Build `app/api/problems/ocr/route.ts` (auth + quota + ocr + match + redirect-or-fallthrough).
- Build problem-page route: `app/[locale]/(topics)/<branch>/<topic>/problems/[problemId]/page.tsx` (SSG, generateStaticParams from problems registry, reads localized strings via next-intl).
- Build equation-index route: `app/[locale]/equations/[slug]/page.tsx` (SSG).
- Build all four React components from §5.
- Build `components/problems/photo-upload.tsx` (client component, integrates into existing `/ask` UI).
- Single commit.

### §6.3 Wave 2 — 8 parallel topic agents, ~15 min wall clock

Each agent gets:
- Topic slug, list of available `lib/physics/*.ts` solvers for that topic.
- Authoring spec: 5 problems per topic, one per difficulty, 30–80 word statement, 4–6 named steps each, 1–3 hints per step, 2–3 common-mistakes per step.
- Convention: problem id = `<topic-slug>-<difficulty>-<short-descriptor>`, e.g. `the-simple-pendulum-medium-period-from-length`.
- Required outputs:
  1. `lib/problems/<branch>/<topic>/<id>.ts` — solver wrapping existing `lib/physics/*` functions
  2. `tests/problems/<branch>/<topic>/<id>.test.ts` — every named intermediate has a numeric assertion
  3. `messages/en/problems/<branch>/<topic>/<id>.json` — localized strings
  4. **REGISTRY_BLOCK** in final report — Problem entries to be merged into `lib/content/problems.ts`
  5. **EQUATION_SLUGS** in final report — equations referenced (orchestrator collates for Wave 3)

### §6.4 Wave 2.5 — orchestrator, serial, ~10 min

- Merge REGISTRY_BLOCKs into `lib/content/problems.ts` in topic order.
- Run `pnpm tsc --noEmit`, `pnpm vitest run`, `pnpm build`.
- `pnpm content:publish --only problems` syncs to Supabase.
- Per-topic commit (8 commits).

### §6.5 Wave 3 — orchestrator, serial, ~15 min

- Author 8 equation-index pages (en strings only) for the equations these problems reference. Use a single subagent for all 8 since each is a short prose page with 4 sections.
- `pnpm content:translate --bundle problems` for he locale (machine pass).
- `pnpm content:translate --bundle equations` for he locale.
- `pnpm content:publish --only equations` syncs to Supabase.
- Implementation log → `docs/superpowers/plans/2026-04-30-priority-2-session-1-implementation-log.md` mirroring RT-session log structure.
- Update `docs/module-1-roadmap.md` with what shipped + the playbook for next sessions.
- Final commit.

### §6.6 Total session budget

~70 min wall clock for ~40 problems + 8 equation pages + verifier + diagnoser + OCR + paywall integration + tests + build + i18n.

---

## §7 Equation index pages (2.3)

Reuses the glossary pattern. New `lib/content/equations.ts`:
```ts
export const EQUATIONS: readonly Equation[] = [
  { slug: "newtons-second-law", latex: "F = ma",
    relatedTopicSlugs: ["newtons-three-laws", "friction-and-drag", ...] },
  { slug: "small-angle-pendulum-period", latex: "T = 2\\pi \\sqrt{L/g}",
    relatedTopicSlugs: ["the-simple-pendulum", "beyond-small-angles"] },
  ...
];
```

Page renders:
1. Equation prominently (KaTeX, large).
2. Four narrative sections from `messages/<locale>/equations/<slug>.json`: "What it solves" / "When to use it" / "When NOT to use it" / "Common mistakes".
3. Auto-generated **"Topics that use this equation"** — query `EQUATIONS[slug].relatedTopicSlugs` (compile time).
4. Auto-generated **"Problems using this equation"** — query Supabase `problems WHERE :slug = ANY(equation_slugs)` (server component).

Equation slugs use the existing `<Term>` MDX component on topic prose to backlink. **No MDX rewrites needed:** extend `<Term>` so an unknown glossary slug falls back to `EQUATIONS` lookup and links to `/equations/<slug>` instead of `/dictionary/<slug>`. If neither registry has the slug, throw at build time (preserves the existing fail-loud-on-typos invariant).

---

## §8 Photo OCR (2.4)

### §8.1 Provider

**Default:** Claude Sonnet 4.6 vision (Anthropic SDK already in `package.json`). No new vendor.

**Single multimodal call:**
```
SYSTEM: You are a physics homework parser. Given an image of a physics problem,
extract: (1) verbatim problem statement, (2) topic guess from this list:
[the-simple-pendulum, vectors-and-projectile-motion, newtons-three-laws, ...]
(3) inputs with units (e.g. {"v_0": "30 m/s", "theta": "45 deg"}),
(4) likely equations from this list:
[newtons-second-law, small-angle-pendulum-period, ...]
Return JSON exactly matching this schema: <inline JSON schema>.

USER: [image]
```

### §8.2 Matching

Result feeds a Supabase fuzzy match against `problems`:
```sql
select id, primary_topic_slug,
  (
    -- statement similarity (pg_trgm)
    similarity(ps.statement, $1) * 0.4 +
    -- input-units overlap
    cardinality(array(select unnest($2) intersect select jsonb_object_keys(p.inputs_json))) * 0.3 +
    -- equation-slug overlap
    cardinality(array(select unnest($3) intersect select unnest(p.equation_slugs))) * 0.3
  ) as score
from problems p
join problem_strings ps on ps.problem_id = p.id and ps.locale = $4
where ps.statement % $1                         -- pg_trgm prefilter
order by score desc
limit 5;
```

If top match `score > 0.7` → redirect to canonical `/problems/<id>` with banner "We recognized this problem — not the right one? [upload again]".
Otherwise → fall through to Ask streaming with extracted text as the seed message.

`pg_trgm` extension already enabled (used elsewhere — verify in Wave 0).

### §8.3 Quota

Free 1/day, starter 10/day, pro unlimited. Counted in `user_billing.problem_ocr_used_today`. 402 response on quota exhaustion (matches existing Ask quota error).

### §8.4 Vendor abstraction

`lib/problems/ocr.ts` exports `extractAndMatch(imageBytes, locale) → MatchResult`. Internals are vendor-private. Swap to Mathpix later by replacing the function body — tests mock at this boundary.

---

## §9 Paywall + quotas

Reuses existing `user_billing` (`free` / `starter` / `pro`):

| Feature | Free | Starter ($6) | Pro ($20) |
|---|---|---|---|
| Read problem, hints, walkthrough | ∞ | ∞ | ∞ |
| Deterministic step verification | ∞ | ∞ | ∞ |
| LLM diagnosis on wrong step | 5/day | ∞ | ∞ |
| "Try with AI" Physics.Ask deep-link | counts against existing Ask quota | same | same |
| Photo OCR upload | 1/day | 10/day | ∞ |

Why deterministic verification stays free: it's cheap (no LLM call), and "step 3 is wrong" without the diagnosis prose is still useful. The diagnosis prose is the upsell hook — fired exactly when the student is stuck and motivated.

Quota enforcement = additive to existing pattern (`free_questions_used` already exists). Two new columns on `user_billing` (§3.5), reset by the existing daily reset cron.

---

## §10 i18n flow

- Wave 2 agents author en strings only (`messages/en/problems/**`).
- Wave 3 runs `pnpm content:translate --bundle problems` to populate `messages/he/problems/**` via the existing translation script.
- Equation index strings (`messages/en/equations/**`) get the same treatment.
- **Step input is language-neutral** (mathematical notation), so the verifier needs no locale awareness.
- LLM diagnosis is generated in the user's locale at runtime — already how Ask works (no new infra).
- LaTeX rendering via existing KaTeX pipeline.

---

## §11 Test plan

- **Unit:** `tests/problems/<branch>/<topic>/<id>.test.ts` — every named intermediate of every problem has a numeric assertion against the solver. ~5 problems × 5 intermediates × 8 topics ≈ **200 new problem-solver test cases**. Plus verifier (~30) + diagnoser (~10) + ocr (~10) + routes (~20) ≈ **≥270 new test cases total**.
- **Verifier:** `tests/problems/verify.test.ts` — ≥30 cases: equivalent algebraic forms accepted, sign flips rejected, swapped variables rejected, dimensional mismatch flagged, parser errors handled, deterministic sampling reproducible.
- **Diagnoser:** `tests/problems/diagnoser.test.ts` — mocked Anthropic client, prompt structure assertions, cache key correctness, locale propagation.
- **OCR:** `tests/problems/ocr.test.ts` — mocked vision client, match-score threshold logic, JSON-schema parsing.
- **Routes:**
  - `tests/api/problems-check.test.ts` — auth gate, quota gate, happy path, malformed input, cache-hit-doesn't-decrement-quota.
  - `tests/api/problems-ocr.test.ts` — auth gate, quota gate, image-size cap, match-vs-fallthrough.
- **Build:** all problem pages prerender as SSG (en + he = **80 problem pages + 16 equation pages = 96 new SSG routes** for the seed scope), zero forward-ref placeholders.
- **Smoke:** existing `tests/smoke.test.ts` extended with one assertion that `/en/classical-mechanics/the-simple-pendulum/problems/<id>` returns 200 and contains the problem statement.

---

## §12 Out of scope (explicit)

Deferred to v2 / future specs / future sessions:

- Free-form derivation pad (Q4 option C) — defer until the verifier is proven on guided steps.
- Mathpix vendor — defer until Claude vision is empirically insufficient on handwritten work.
- Admin UI for non-developer authoring — defer; subagent fanout is faster than building an editor.
- Other 5 branches and the remaining 30 CM topics — explicit follow-up sessions; this session ships the playbook.
- "Daily problem of the day" / streak / gamification — separate spec.
- Spaced-repetition retry — separate spec.
- Problem search across full catalog — defer until catalog > 200 problems.
- Hint progressive-reveal (1 hint at a time vs all hints) — keep simple for now: one hint per step, shown on demand.
- Solution-by-video / scene-embedded walkthroughs — separate spec.
- Anonymous (logged-out) attempts — Wave 2 ships logged-in only; the read-only views (problem statement, hints, walkthrough) ARE indexable and served to logged-out visitors for SEO.

---

## §13 Risks and mitigations

| Risk | Mitigation |
|---|---|
| Mathjs parses some student input ambiguously (e.g. `sin x` vs `sinx`) | Pre-normalize input (insert implicit multiplication, lowercase trig functions, accept `^`/`**`/`pi`/`π`); maintain a corpus of known student-style inputs in `tests/problems/verify.test.ts` |
| LLM diagnosis prose drifts off-topic or hallucinates physics | Structured input with canonical/student values pre-computed, low temperature (0.2), ≤80 word cap, cache by `(stepId, normalized_expr)` so each unique mistake is diagnosed exactly once and we can manually review/edit cached entries |
| Photo OCR misclassifies similar problems (projectile vs falling-body) | Match score threshold of 0.7; banner says "We recognized this — not the right one? [upload again]"; falls through to Ask if no confident match |
| Authoring quality varies across subagents | Per-topic spec is uniform and explicit; vitest enforces solver correctness for every named intermediate; orchestrator manually reviews statement prose at commit time |
| Token cost spikes from a popular problem getting many wrong attempts | Cache by `(stepId, normalized_expr)` means each unique mistake is paid for exactly once across all users; expected steady-state cost <$1/day for the seed scope |
| Equation index pages thin-content / duplicate-content SEO penalty | 4 narrative sections + auto-generated "topics" + auto-generated "problems" lists ensures each page has unique substantive content; cross-listed problems have one canonical URL (Q6 decision) so no duplicate-content penalty |
| Free-tier abuse (creating accounts to farm 5 diagnoses/day) | Standard rate-limit on account creation already exists; cache hits still serve cached diagnoses without LLM cost so abuse is bounded by content surface, not by token spend |
| Hebrew translation of physics prose introduces LaTeX errors | Existing `pnpm content:translate` already handles MDX with LaTeX for the live topics; problem strings are simpler (no embedded JSX), lower risk |

---

## §14 Success criteria

This session is complete when:

1. 40 problems are live across 8 topics on `kinematics-newton` + `oscillations`, en + he, all SSG-rendered.
2. 8 equation-index pages are live, en + he, all SSG-rendered.
3. Step verification works deterministically: `pnpm vitest` passes ≥270 new cases.
4. LLM diagnosis fires on wrong steps for logged-in users with quota remaining; cached on second occurrence.
5. Photo OCR accepts an image, returns either a problem-page redirect or an Ask-streaming fallthrough.
6. All 96 new routes return 200 in the build artifact.
7. Implementation log committed to `docs/superpowers/plans/2026-04-30-priority-2-session-1-implementation-log.md`.
8. Roadmap updated with the playbook so the next session can ship the remaining 30 CM topics with a one-line invocation.

---

## §15 Future-session playbook (one-line)

Once this session ships, future sessions for the remaining 30 CM topics + 5 other branches follow:
> "Run the §6 pipeline against `<branch>/<module>` topics. Wave 0/1 are no-ops (already shipped). Wave 2 dispatches N parallel topic-agents. Wave 2.5 merges + publishes + commits per topic. Wave 3 translates + indexes + logs."

Each subsequent session adds ~40 problems and ~8 equation pages in ~50 min wall clock.
