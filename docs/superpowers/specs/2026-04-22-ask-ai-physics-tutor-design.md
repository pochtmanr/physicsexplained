# `/ask` — AI Physics Tutor (v1 design)

**Date:** 2026-04-22
**Status:** proposed, pending implementation plan
**Repo:** `/Users/romanpochtman/Developer/physics` (Next.js 15 + MDX + Supabase)

## 1. Goal

Add an auth-gated chat page at `/[locale]/ask` where users ask physics questions and receive grounded answers that can:

- Cite existing site content (topics, physicists, glossary entries) stored in Supabase.
- Render existing interactive scenes inline (one of 121 registered scenes) with AI-chosen parameters.
- Plot arbitrary math expressions inline using the existing `mathjs` + JSXGraph stack.
- Use external web search / URL fetch for topics the site doesn't cover yet.

Shipping constraints:

- Token-conscious (explicit user priority). Defense-in-depth cost controls.
- Built-in and safe: the AI **never** emits executable UI code; it only calls typed tools against a known catalog.
- v1 is English-only; i18n wiring stays in place so RU/HE/etc. can be flipped on later without code changes.
- Provider-abstracted from day one, but only Anthropic is wired in v1.

Out of scope (each becomes its own spec): exercise generation, adaptive persona (high-school ↔ professor), image/voice input, user-editable past messages, shared conversations, paid-tier enforcement, non-Anthropic providers.

## 2. Feature surface

- **Route:** `/[locale]/ask` (dedicated page; no sidebar/companion inside article pages in v1).
- **Access:** auth required. Unauth'd users redirected to sign-in with `?next=/ask`.
- **Layout:** chat transcript in the main column; collapsible left rail (desktop) / drawer (mobile) listing the user's last 20 conversations. No Scene side-panel — scenes and plots render **inline in assistant bubbles** like code blocks.
- **Empty state:** 6 example prompts tied to live branches ("Explain Noether's theorem like I'm 16", "Show me a pendulum losing energy to damping", etc.).

## 3. System overview

```
user msg
   │
   ▼
[Classifier — Haiku 4.5, ≤64 tokens out]
   │  → label ∈ { glossary-lookup | article-pointer |
   │             conceptual-explain | calculation |
   │             viz-request | off-topic }
   ▼
[Router]
   ├─ off-topic           → canned refusal, no paid call
   ├─ glossary-lookup     → Haiku 4.5 (small, cheap)
   └─ everything else     → Sonnet 4.6 (primary answerer)
   │
   ▼
[Answerer — agentic tool loop, hop cap = 6]
   ├─ cached system prompt + ToC + tool defs
   ├─ tool calls: content search, scene search, plot, web search
   └─ streams deltas via SSE
   │
   ▼
[Client]
   ├─ parses :::scene{}, :::plot{}, :::cite{} fences
   ├─ renders via SIMULATION_REGISTRY, <MathPlot/>, <Cite/>
   └─ writes usage + message rows to Supabase
```

## 4. Toolset (contract the AI sees)

Typed strictly in TS + JSON Schema. This is the most important part of the design — it's the contract every future model answers against.

```ts
// --- Content retrieval ---

searchSiteContent(q: string, kind?: "topic"|"physicist"|"glossary", limit?: 5)
  → [{kind, slug, title, subtitle, snippet}]

getContentEntry(kind, slug, locale)
  → ContentEntry | null

searchGlossary(q, limit?: 10)
  → [{slug, term, shortDefinition, category}]

listGlossaryByCategory(category)
  → [{slug, term, shortDefinition}]

// --- Visualization (inline render) ---

searchScenes(q, limit?: 5)
  → [{id, label, description, paramsSchema}]

showScene(sceneId, params: Record<string, number|string|boolean>)
  → {ok: true, sceneId, params, fence: string}   // AI emits `fence` verbatim in prose

plotFunction({
  expr: string,                     // mathjs expression, e.g. "A*cos(w*t)"
  variable: "t"|"x"|"theta",
  domain: [number, number],
  params?: Record<string, number>,  // e.g. {A:1, w:2}
  ylabel?: string, xlabel?: string,
  overlays?: Array<{expr, params?}> // comparison curves
})
  → {ok: true, plotId, fence: string}   // AI emits `fence` verbatim in prose

plotParametric({ x: string, y: string, /* same shape as plotFunction */ })
  → {ok: true, plotId, fence: string}

// --- External knowledge ---

webSearch(q, limit?: 5)
  → [{url, title, snippet}]

fetchUrl(url)                        // allowlisted domains only
  → {title, text_excerpt}
```

**Hard constraints on tool execution**:

- `showScene`: `sceneId` must exist in `SIMULATION_REGISTRY`; `params` validated against the scene's zod schema (stored as JSON Schema in `scene_catalog.params_schema`). Invalid → retryable error, not silent.
- `plotFunction` / `plotParametric`: `expr` parsed by `mathjs` with node allowlist — reject `ImportNode`, `FunctionAssignmentNode`, `AssignmentNode`, etc. `expr.length ≤ 200`. Parsing happens server-side.
- `webSearch`: single provider, server-side key, per-user daily cap.
- `fetchUrl`: allowlisted domains only (wikipedia.org, arxiv.org, nist.gov, `*.edu`); response capped at 8KB.
- **Max tool-call hops per user message: 6.** Past that, the pipeline forces a final answer.

## 5. Data model (Supabase)

All additive. No change to existing tables beyond one generated column on `content_entries`.

```sql
-- 5a. FTS on existing content
ALTER TABLE content_entries
  ADD COLUMN search_doc tsvector
  GENERATED ALWAYS AS (
    setweight(to_tsvector('simple', coalesce(title,'')),    'A') ||
    setweight(to_tsvector('simple', coalesce(subtitle,'')), 'B') ||
    setweight(to_tsvector('simple', coalesce(blocks::text,'')), 'C')
  ) STORED;

CREATE INDEX content_entries_search_idx
  ON content_entries USING GIN (search_doc);

-- 5b. Scene catalog — AI's source of truth for viz tools
CREATE TABLE scene_catalog (
  id             text PRIMARY KEY,              -- e.g. "PendulumScene"
  label          text NOT NULL,
  description    text NOT NULL,
  topic_slugs    text[] NOT NULL DEFAULT '{}',
  params_schema  jsonb NOT NULL,                -- zod-derived JSON Schema
  tags           text[] NOT NULL DEFAULT '{}',
  search_doc     tsvector GENERATED ALWAYS AS (
    setweight(to_tsvector('simple', label),       'A') ||
    setweight(to_tsvector('simple', description), 'B') ||
    setweight(to_tsvector('simple', array_to_string(tags,' ')), 'C')
  ) STORED
);
CREATE INDEX scene_catalog_search_idx ON scene_catalog USING GIN (search_doc);

-- 5c. Conversations
CREATE TABLE ask_conversations (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  locale      text NOT NULL,
  title       text,                             -- auto-summarized after 1st reply
  summary     text,                             -- rolling summary of aged-out turns
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX ask_conversations_user_idx
  ON ask_conversations(user_id, updated_at DESC);

-- 5d. Messages (one row per turn)
CREATE TABLE ask_messages (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id  uuid NOT NULL REFERENCES ask_conversations(id) ON DELETE CASCADE,
  role             text NOT NULL CHECK (role IN ('user','assistant','tool')),
  content          jsonb NOT NULL,              -- {text, toolCalls[], toolResults[], renderRefs[]}
  model            text,                        -- "sonnet-4-6" | "haiku-4-5" | ...
  input_tokens     int,
  output_tokens    int,
  cached_tokens    int,
  cost_usd_micros  bigint,
  meta             jsonb,                       -- {flagged?:bool, classifier_label?:string, ...}
  created_at       timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX ask_messages_conv_idx ON ask_messages(conversation_id, created_at);

-- 5e. Per-user rate limit / usage
CREATE TABLE ask_usage_daily (
  user_id            uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  day                date NOT NULL,
  message_count      int  NOT NULL DEFAULT 0,
  tokens_in          bigint NOT NULL DEFAULT 0,
  tokens_out         bigint NOT NULL DEFAULT 0,
  cost_micros        bigint NOT NULL DEFAULT 0,
  web_search_count   int  NOT NULL DEFAULT 0,
  fetch_url_count    int  NOT NULL DEFAULT 0,
  -- `cost_micros` is USD × 1_000_000 (i.e. micro-dollars), same unit as ask_messages.cost_usd_micros
  PRIMARY KEY (user_id, day)
);
```

**RLS policies**:
- `ask_conversations`, `ask_messages`: users can `select`/`insert` only their own rows (by `user_id` via `auth.uid()` check on the parent conversation for messages).
- `scene_catalog`: world-readable.
- `ask_usage_daily`: users can read their own row; writes are service-role only.

**`scene_catalog` population**: a build-time script (`scripts/content/sync-scene-catalog.ts`) imports each scene's zod param schema from `components/physics/*-scene.tsx` and upserts catalog rows. Keeps the AI's view of scenes in lockstep with code. CI fails if a scene is in `SIMULATION_REGISTRY` but missing a catalog row.

## 6. Model routing

| Stage       | Model           | Max tokens out | Purpose                                   |
|-------------|-----------------|----------------|-------------------------------------------|
| Classifier  | Haiku 4.5       | 64             | Label the query, detect off-topic         |
| Answerer    | Sonnet 4.6      | 1500           | Primary answers, conceptual reasoning     |
| Answerer    | Haiku 4.5       | 800            | Glossary-lookup short-path                |
| Title       | Haiku 4.5       | 16             | One-shot conversation title summarizer    |

Everything sits behind an `LLMProvider` interface so OpenAI / Gemini adapters can be added as a config change. v1 wires only the Anthropic adapter.

**Prompt caching**: system prompt + ToC + tool definitions are marked `cache_control: ephemeral` (5-min TTL). Warm requests pay ~10% of cold cost. This is the single biggest cost lever.

### ToC strategy (matches real content volume)

Scale: ~50 topics, ~17 physicists, ~1k glossary entries.

Preloaded (cached) in system prompt:
- All topics: `slug + title + subtitle` (~50 entries × ~80 bytes).
- All physicists: `slug + name + oneLiner` (~17 × ~80 bytes).
- Glossary **categories only** with counts (4–6 categories).
- All scenes: `id + label + one-line description` (~121 × ~60 bytes).

Total cached ToC ≈ 3–5k tokens. Full glossary is *not* preloaded — AI uses `searchGlossary` / `listGlossaryByCategory` on demand.

## 7. Cost controls (defense in depth)

1. **Prompt caching** — biggest lever. `cache_control: ephemeral` on system prompt + ToC + tool defs.
2. **Per-user daily caps** (`ask_usage_daily`), checked *before* any paid call:

   | Tier  | Msgs/day | Tokens in | Tokens out | Hard cost cap/day |
   |-------|----------|-----------|------------|-------------------|
   | free  | 20       | 60k       | 20k        | ~$0.30            |
   | pro   | 200      | 600k      | 200k       | ~$3               |
   | admin | ∞        | —         | —          | —                 |

   v1 ships everyone as `free`. `pro` schema is ready; UX to upgrade is out of scope.

3. **Per-request caps** (hardcoded):
   - `max_tokens` classifier 64, answerer 1500 (800 for Haiku path).
   - Max tool-call hops: 6.
   - Max assembled input per request: 12k tokens. Oldest history gets rolled into `ask_conversations.summary` first.

4. **Global kill switch**: env `ASK_ENABLED=false` → UI renders maintenance banner, `/api/ask/*` returns 503.

5. **Web search / fetch caps** per user per day: `webSearch` ≤ 10, `fetchUrl` ≤ 5 (tracked in dedicated columns).

6. **Observability**: every call writes token + cost rows; materialized view `ask_usage_rollup_daily` rolls up per user per day; admin-only `/api/admin/ask-usage` endpoint surfaces top spenders + global trend.

**Budget sanity check at 1k chats/day**:
~$0.005 avg per chat (Sonnet with warm cache) = **$5/day ≈ $150/month** on models, plus ~$2.50/day web search = **~$200–250/month** steady state.

## 8. UX details

### Page shell (`app/[locale]/ask/page.tsx`, server component)
- Auth gate; redirect unauth'd to `/sign-in?next=/ask`.
- Loads last 20 conversations into collapsible left rail / mobile drawer.
- Empty state: 6 example prompts tied to live branches.

### Transcript & composer
- Transcript: server-rendered list of past messages + client island for streaming the current reply.
- Composer: multi-line textarea, Enter to send, Shift+Enter newline, character counter.
- Assistant messages support prose with inline KaTeX + fenced embeds + citation pills:

  ```
  :::scene{id="DampedPendulumScene" gamma=0.2 omega0=2}
  :::

  :::plot{expr="A*cos(w*t)" var="t" domain="[0,10]" params={"A":1,"w":2} ylabel="x(t)"}
  :::

  :::cite{kind="topic" slug="the-simple-pendulum"}
  :::
  ```

  Parser in `lib/ask/render.ts` produces React nodes: scenes via `SIMULATION_REGISTRY`, plots via `<MathPlot/>` (new, JSXGraph-backed), cites as `Link` chips.

### Streaming — `/api/ask/stream`
- SSE. Client sees: `typing...` → compact tool-call badges ("Searching site…", "Rendering pendulum…") → streamed prose → final render.
- Tool rounds run server-side and do not stream raw tool JSON to the client.

### History / context window
- Last 6 user+assistant turns (≤12 messages) included verbatim.
- Older turns replaced by a rolling summary (Haiku, one-shot, stored on `ask_conversations.summary`). Keeps input budget predictable.

### Conversation title
- After first assistant reply, a fire-and-forget Haiku call summarizes the thread in ≤6 words and sets `ask_conversations.title`. Silent on failure.

### Controls (on the last assistant message)
- **Stop** — cancels in-flight stream.
- **Regenerate** — re-runs the last user turn (charges tokens again).
- **Copy** — copies rendered text, strips fences, preserves LaTeX.

### Persistence
- Every turn writes to `ask_messages`. Deletes cascade. No soft delete in v1.
- **No editing past messages** in v1. Regenerate is the only way to branch.

## 9. i18n

- v1 ships English only. Non-`en` locales on `/ask` redirect to `/en/ask`.
- Route is locale-aware; tool layer passes locale through to Supabase; `ContentEntry` already does locale-fallback to `en`. Flipping on other languages later is a redirect removal, not code changes.
- System prompt injects `answerInLocale: "en"` in v1.
- UI strings live in `messages/en.json` (and can be added to `messages/*.json` when enabling other locales).

## 10. Auth

- Supabase Auth. Email + Google OAuth minimum.
- `middleware.ts` gates `/[locale]/ask/*` and `/api/ask/*`. Unauth'd → `/sign-in?next=<orig>`.
- Server route handlers pull `user_id` from the session cookie only — never request body. RLS enforces ownership as defense-in-depth.
- Tier resolved from `auth.users` metadata (`free`/`pro`/`admin`). v1 → everyone `free`.

## 11. Error handling & guardrails

### Refusal behavior (canned, not model-generated — saves tokens)
- Classifier returns `off-topic` → short-circuit with: *"I only answer physics questions — and I try to ground them in the site. Ask me something physics-y!"*
- Prompt-injection attempts ("ignore previous instructions", system-prompt exfil patterns) → same refusal; log `ask_messages.meta.flagged = true`.

### Tool-call validation
- Every tool result is validated against its output schema before return to the model. Invalid → `{error, hint}` to the model (retryable within hop cap).
- `showScene` params validated against `scene_catalog.params_schema`.
- `plotFunction`/`plotParametric` expression passed through `mathjs` with node allowlist; reject dangerous nodes; reject inputs > 200 chars.

### Failure modes
- Upstream 429/5xx → one retry with 500ms backoff, then user-facing "Model is busy, try again in a moment." Do **not** charge user's count for failed call.
- Classifier fails → default to Sonnet (degrade gracefully, not silently fail).
- Web search provider down → tool returns `{ok:false, reason:"unavailable"}`; AI handles in prose.
- DB write failure on `ask_messages` → do not block the user's stream; log to Sentry; reconcile from provider usage logs.

### Logging
Structured JSON per call: `user_id, conversation_id, classifier_label, model, hops, latency_ms, input/output/cached tokens, cost_micros, web_searches, flagged`. Required for the first month of tuning.

## 12. Testing

- **Vitest unit** (fast, no network):
  - `lib/ask/toolset.test.ts` — each tool validates schemas, rejects bad params, handles empty DB, sanitizes `mathjs` expressions (injection attempts).
  - `lib/ask/render.test.ts` — fence parser round-trips edge cases (nested braces, missing close fence, empty params).
  - `lib/ask/rate-limit.test.ts` — cap increments correctly, 429 at boundary, reset on day rollover.
  - `lib/ask/context.test.ts` — rolling summary triggers at right threshold; assembled input stays ≤12k.
- **Integration** (mock Anthropic SDK; Supabase via test branch or `pglite`):
  - Full round-trip: user msg → classifier → tool calls → DB writes → streamed reply. Assert token + cost rows.
  - Prompt-injection → canned refusal path, no Sonnet call.
  - Scene validation: bad params → retryable error back to model.
- **Contract**: `scene_catalog.params_schema` rows match the zod schema in each actual component file. CI fails on drift.
- **Eval** (`scripts/ask/eval.ts`, manual, real Anthropic):
  - 30 seed questions across branches + skill levels.
  - Scored on: grounding (cites site when applicable), correctness (manual review or LLM-as-judge), tool choice, token cost.
  - Run before each prompt / model change.

## 13. File map (what gets created vs edited)

**New files**:
- `lib/ask/provider.ts` — `LLMProvider` interface + Anthropic adapter.
- `lib/ask/toolset.ts` — all tools in §4, pure functions hitting Supabase / mathjs / web search.
- `lib/ask/pipeline.ts` — classifier → router → answerer → tool loop.
- `lib/ask/rate-limit.ts` — check + increment.
- `lib/ask/render.ts` — fence parser → React nodes.
- `lib/ask/context.ts` — history assembly + rolling summary.
- `lib/ask/prompts.ts` — system prompts, classifier prompt, title prompt.
- `app/api/ask/stream/route.ts` — SSE endpoint.
- `app/api/ask/conversations/route.ts` — list / create / delete.
- `app/api/admin/ask-usage/route.ts` — admin usage rollup.
- `app/[locale]/ask/page.tsx` — page shell.
- `app/[locale]/ask/layout.tsx` — conversation rail layout.
- `components/ask/chat-transcript.tsx`, `composer.tsx`, `message.tsx`, `conversation-rail.tsx`, `tool-badge.tsx`, `empty-state.tsx`.
- `components/ask/math-plot.tsx` — JSXGraph-backed plotter (function + parametric).
- `components/ask/cite.tsx` — citation chip.
- `scripts/content/sync-scene-catalog.ts` — build-time sync.
- `supabase/migrations/<ts>_ask_infra.sql` — all §5 migrations.
- `tests/ask/*.test.ts` — unit + integration suites.
- `scripts/ask/eval.ts` — eval harness.
- `docs/ask/README.md` — pipeline overview + how to add a scene to the catalog.

**Edited files**:
- `middleware.ts` — auth gate for `/ask/*` and `/api/ask/*`.
- `components/layout/nav.tsx` — add "Ask" entry (auth-gated visibility).
- `lib/supabase-server.ts` — helper if not already present for service-role ops in `/api/ask/stream`.
- `messages/en.json` — new UI strings.
- `next.config.mjs` — only if we need to allowlist a new image/search domain (likely not).
- `package.json` — add web-search provider SDK (TBD between Brave / Tavily / SerpAPI).

## 14. Build order (implementation waves)

**Wave 0 — Infrastructure**
1. Supabase migrations (§5). RLS policies. Seed `scene_catalog` from script.
2. `search_doc` GIN index on `content_entries`.
3. Env vars: `ANTHROPIC_API_KEY`, `ASK_ENABLED`, `WEB_SEARCH_API_KEY`, `ASK_RATE_LIMIT_TIER_DEFAULTS_JSON`.

**Wave 1 — Server core**
4. `lib/ask/provider.ts` + Anthropic adapter.
5. `lib/ask/toolset.ts` with all §4 tools.
6. `lib/ask/pipeline.ts` (classifier → router → answerer → tool loop).
7. `lib/ask/rate-limit.ts`.
8. `app/api/ask/stream/route.ts` (SSE).

**Wave 2 — Client**
9. `app/[locale]/ask/page.tsx` + layout + conversation rail.
10. `chat-transcript.tsx`, `composer.tsx`, `message.tsx`.
11. `lib/ask/render.ts` — fence parser.
12. `components/ask/math-plot.tsx`.

**Wave 3 — Polish & guardrails**
13. Off-topic short-circuit. Prompt-injection flag. Global kill switch.
14. Title summarizer.
15. Regenerate / Stop / Copy controls.
16. Error boundaries on scene / plot render.

**Wave 4 — Tests + eval**
17. Vitest unit + integration suites.
18. Eval script + 30 seed questions.
19. `docs/ask/README.md`.

## 15. Open decisions (to resolve during implementation planning)

- Web search provider: **Brave Search API** vs **Tavily** vs **SerpAPI**. Pick during Wave 0 based on pricing + allowlist flexibility. All have trial tiers.
- Whether to co-locate the answerer's tool execution in the same edge function as the SSE route, or split to a Node runtime. SSE + long-running tool loops favor Node runtime.
- Prompt cache key discipline: ensure system prompt + ToC + tool defs are byte-identical across requests so cache actually hits.

## 16. Risk notes

- **Prompt injection via user content**: users can paste malicious instructions in their question. Mitigations: classifier off-topic detection, system prompt hardening, `fetchUrl` allowlist, `mathjs` node allowlist, tool-call validation. Won't block 100% but reduces blast radius to "model answers oddly once"; it cannot call tools with arbitrary args because tool args are always re-validated.
- **Scene param drift**: adding a new scene without updating `scene_catalog` would let AI either miss the scene or pass bad params. Mitigated by the CI contract check + the sync script.
- **Cache misses on system-prompt drift**: accidentally varying the system prompt (e.g., injecting today's date) busts the cache. System prompt must be immutable per deployment. Dynamic per-user context goes *after* the cache marker.
- **FTS recall on paraphrased queries**: user asks "why does a grandfather clock keep time?" — FTS may miss "isochronism". Mitigation in v1: answerer model is good at rephrasing queries; measure recall in logs; upgrade to pgvector if data justifies it.
- **Cost runaway from one power user**: capped by `ask_usage_daily` + hard per-request caps. Global kill switch for emergencies.
