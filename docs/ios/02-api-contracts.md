# 02 — API Contracts (the contract bible)

Every Swift `Codable` model, PostgREST query, and network client in the iOS app is written against THIS document. All schemas below were transcribed from the actual source files named in each section — when in doubt, the named source file wins. Cross-references: architecture in `01-architecture.md`, rendering rules in `04-block-rendering-spec.md`, backend changes that create the taxonomy tables and bearer auth in `06-backend-changes.md`.

Fixtures marked **[LIVE]** were fetched from the production database on 2026-07-02 via anon-key PostgREST. Nothing here is invented.

---

## 1. Supabase basics

- Project URL: `https://cpcgkkedcfbnlfpzutrc.supabase.co`
- **Anon key**: read `NEXT_PUBLIC_SUPABASE_ANON_KEY` from `/Users/roman/Developer/physics/.env.local`. Never commit it into the iOS repo source; inject via xcconfig/Info.plist at build time. The anon key is a *public* key (it ships in the web bundle), but keep the habit.
- REST base: `https://cpcgkkedcfbnlfpzutrc.supabase.co/rest/v1/<table>?...` with headers `apikey: <anon>` and `Authorization: Bearer <anon-or-user-jwt>`. Use `supabase-swift`'s PostgREST client rather than raw URLs.
- Storage public URL pattern (verified in `/Users/roman/Developer/physics/lib/supabase.ts` `storageUrl()`):
  ```
  https://cpcgkkedcfbnlfpzutrc.supabase.co/storage/v1/object/public/images/<path>
  ```
  e.g. `.../public/images/physicists/isaac-newton.avif`.
- Auth: Supabase Auth (`supabase-swift` `auth`). Content reads need NO user session — anon key only. Ask endpoints need a signed-in user (section 6).

---

## 2. Content tables (public-read, anon key)

### 2.1 `content_entries` — source: `supabase/migrations/0002_content.sql` (+ `search_doc` added in `0003_ask_infra.sql`)

| column | type | notes |
|---|---|---|
| `kind` | text | `'topic' \| 'physicist' \| 'glossary'` (CHECK) — part of PK |
| `slug` | text | PK part. Topics: `"<branch>/<topic>"` e.g. `classical-mechanics/the-simple-pendulum`. Physicist/glossary: bare kebab slug |
| `locale` | text | PK part. `en`, `he` exist today |
| `title` | text | NOT NULL. Topics store UPPERCASE titles |
| `subtitle` | text | nullable |
| `blocks` | jsonb | `Block[]` — see section 3. Default `[]` |
| `aside_blocks` | jsonb | `Block[]`. Default `[]`. Often empty — the sidebar links usually live in `meta.aside` instead |
| `meta` | jsonb | per-kind extras, see 2.1.1. Default `{}` |
| `source_hash` | text | pipeline bookkeeping, ignore |
| `updated_at` | timestamptz | |
| `search_doc` | tsvector | generated; not selectable as JSON — never `select=*` includes it fine but don't model it |

RLS: `SELECT` open to `anon, authenticated` (`using (true)`). **There is no published/status column — see the draft-leakage warning in section 4.**

**Queries the app uses** (mirroring `/Users/roman/Developer/physics/lib/content/fetch.ts`):

- Single entry:
  `GET /rest/v1/content_entries?kind=eq.topic&slug=eq.<slug>&locale=eq.<locale>&select=kind,slug,locale,title,subtitle,blocks,aside_blocks,meta,updated_at` → 0 or 1 row (`maybeSingle`).
  **Locale fallback rule** (`getContentEntry`): if locale ≠ `en` and the row is missing, re-query with `locale=eq.en` and set a `localeFallback = true` flag on the result (web shows "Translation pending. Showing English."). MVP is English-only, but keep the parameter plumbed.
- Listing (index grids) — never fetch blocks for lists:
  `?kind=eq.<kind>&locale=eq.<locale>&select=kind,slug,locale,title,subtitle,meta,updated_at`.

**2.1.1 `meta` shapes by kind** (observed [LIVE]):

- `topic`: `{ "aside": [{ "href": "/physicists/galileo-galilei", "type": "physicist" | "term", "label": "Galileo Galilei" }, ...], "eyebrow"?: string, seo keys... }` — `aside` drives the sidebar "related" links. Hrefs are web paths (`/physicists/<slug>`, `/dictionary/<slug>`) — map to native navigation, do not open URLs.
- `physicist`: `{ "born": "1642", "died": "1727", "nationality"?: string, "shortName": "Newton", "image": "https://cpcgkkedcfbnlfpzutrc.supabase.co/storage/v1/object/public/images/physicists/isaac-newton.avif", "sameAs": [url...], "majorWorks": [{ "year": "1687", "title": "...", "description": "..." }], "contributions"?: [...], "relatedTopics"?: [...] }` — `image` is a FULL absolute storage URL [LIVE].
- `glossary`: `{ "category": "concept" | "instrument" | "unit" | "phenomenon", "shortDefinition"?: string, "relatedTopics": [{ "topicSlug": "energy-and-work", "branchSlug": "classical-mechanics" }], "relatedPhysicists": ["james-prescott-joule", ...], "visualization"?: string (scene id), "illustration"?: string \| null, "images": [], "imageCaptions": [], "history": string \| null }` [LIVE].

Model `meta` as a lenient struct: every field optional, unknown fields ignored.

### 2.2 `scene_catalog` — source: `0003_ask_infra.sql` + `0012_scene_catalog_v2.sql`

| column | type | notes |
|---|---|---|
| `id` | text PK | PascalCase scene id, e.g. `ActionReactionScene` — matches the simulation registry / `figure.content.component` |
| `label` | text | short human label |
| `description` | text | |
| `topic_slugs` | text[] | topics that embed this scene |
| `params_schema` | jsonb | JSON Schema for AI-suppliable params (usually empty `properties`) |
| `tags` | text[] | |
| `default_props` | jsonb | props the scene is embedded with in the essay |
| `fig_label` | text | e.g. `FIG.03c` |
| `source_title` | text | source essay title |
| `curated` | boolean | true for the ~16 hand-curated entries |
| `updated_at` | timestamptz | |
| `snapshot_url` | text | **added by migration 0013 (P0)** — public PNG snapshot; see `06-backend-changes.md` §4 |

RLS: public SELECT. **[LIVE] fixture:**

```json
{
  "id": "ActionReactionScene",
  "label": "Action-reaction pair",
  "description": "Newton's third law visualized with two bodies.",
  "topic_slugs": ["classical-mechanics/newtons-three-laws"],
  "params_schema": { "type": "object", "$schema": "https://json-schema.org/draft/2020-12/schema", "properties": {}, "additionalProperties": false },
  "tags": ["newton", "forces", "mechanics"],
  "default_props": {},
  "fig_label": "FIG.03c",
  "source_title": "NEWTON'S THREE LAWS",
  "curated": true,
  "updated_at": "2026-07-02T20:13:28.067+00:00"
}
```

### 2.3 `equations` / `equation_strings` — source: `0010_problems_and_equations.sql`

- `equations`: `slug text PK`, `latex text`, `related_topic_slugs text[]`, `updated_at`.
- `equation_strings`: PK `(slug, locale)`; `name`, `what_it_solves`, `when_to_use`, `when_not_to`, `common_mistakes` (all text, NOT NULL).
- Both public-read. Used by the web `/equations` section; OPTIONAL for iOS MVP (not in the three MVP surfaces) — contract included for the later learning app.

### 2.4 `problems` / `problem_strings` / `problem_topic_links` — source: `0010`

Public-read. NOT in iOS MVP scope; schema available in the migration if needed later. Per-user tables (`problem_attempts`, `ask_*`, `user_billing`) are RLS-scoped to `auth.uid()` — a signed-in supabase-swift client can read its own rows (e.g. `user_billing` for showing plan status; columns used by the web: `plan, status, tokens_allowance, tokens_used, free_questions_used, cycle_end`).

---

## 3. `Block[]` JSON schema — source: `/Users/roman/Developer/physics/lib/content/blocks.ts` (transcribed verbatim)

```ts
type CalloutVariant = "intuition" | "math" | "warning" | "info" | "note";

type Inline =
  | string                                                  // plain text run
  | { kind: "em";        inlines: Inline[] }                // RECURSIVE — not a text field
  | { kind: "strong";    inlines: Inline[] }                // RECURSIVE
  | { kind: "code";      text: string }
  | { kind: "formula";   tex: string }                      // inline LaTeX
  | { kind: "link";      href: string; text: string }       // href is a web path or URL
  | { kind: "term";      slug: string; text?: string }      // glossary cross-link
  | { kind: "physicist"; slug: string; text?: string };

type FigureContent =
  | { kind: "image";      src: string; alt: string }
  | { kind: "simulation"; component: string; props?: Record<string, unknown> };

type Block =
  | { type: "section";   index: number; title: string; children: Block[] }
  | { type: "heading";   level: 3 | 4; text: string }
  | { type: "paragraph"; inlines: Inline[] }
  | { type: "equation";  id?: string; tex: string; prose?: string }
  | { type: "figure";    caption?: string; content: FigureContent }
  | { type: "callout";   variant: CalloutVariant; children: Block[] }
  | { type: "list";      ordered: boolean; items: Inline[][] }
  | { type: "table";     header?: Inline[][]; rows: Inline[][][] };
```

Swift decoding notes:
- `Inline` is a string-or-object union → custom `init(from:)` that tries `String` first, then keyed decode on `kind`.
- `em`/`strong` carry `inlines` (recursive array), **not** `text` — easy to get wrong.
- Top-level `blocks` is almost always an array of `section` blocks; recurse through `children`.
- Decode must be tolerant: unknown `type`/`kind` → render as plain text of any string content found, never fail the whole entry.

**Known data quirk [LIVE]:** early rows contain equation blocks with EMPTY `tex` and the formula as plain Unicode in `prose`:
```json
{ "id": "EQ.01", "tex": "", "type": "equation", "prose": "F = −kx" }
```
Rendering rule: if `tex` is non-empty render LaTeX with `prose` as annotation below; if `tex` is empty and `prose` exists, render `prose` as the equation body in mono/math styling. See `04-block-rendering-spec.md`.

**[LIVE] fixtures** (from `classical-mechanics/the-simple-pendulum`, `electromagnetism/gauss-law`, `thermodynamics/brownian-motion`):

```json
{ "type": "paragraph", "inlines": [
    { "kind": "physicist", "slug": "galileo-galilei", "text": "Galileo" },
    " timed the swings against his own pulse. No matter how wide the chandelier swung, each full cycle took the same amount of time."
] }
```
```json
{ "type": "paragraph", "inlines": [ { "tex": "\\langle x^2 \\rangle = 2 D t", "kind": "formula" } ] }
```
```json
{ "id": "EQ.01", "tex": "\\Phi_E \\;=\\; \\int_S \\mathbf{E} \\cdot d\\mathbf{A}", "type": "equation" }
```
```json
{ "type": "figure", "caption": "FIG.01 — the pendulum",
  "content": { "kind": "simulation", "component": "PendulumScene", "props": { "length": 1.2, "theta0": 0.3 } } }
```
```json
{ "type": "callout", "variant": "math",
  "children": [ { "type": "paragraph", "inlines": ["sin θ = θ − θ³/6 + θ⁵/120 − …"] } ] }
```
```json
{ "kind": "em", "inlines": ["Clarkia pulchella"] }
```
```json
{ "href": "/thermodynamics/the-maxwell-boltzmann-distribution", "kind": "link", "text": "Maxwell–Boltzmann distribution" }
```
Entry envelope [LIVE]: `{ "kind": "topic", "slug": "classical-mechanics/the-simple-pendulum", "locale": "en", "title": "THE SIMPLE PENDULUM", "subtitle": "Why every clock that ever ticked ticked the same way.", "blocks": [8 section blocks], "aside_blocks": [], "meta": { "aside": [...] } }`.

---

## 4. Taxonomy tables — **created in P0, do not exist yet** (spec: `06-backend-changes.md` §1)

The branch → module → topic hierarchy, ordering, eyebrows, reading minutes, and publish status live ONLY in `/Users/roman/Developer/physics/lib/content/branches.ts` today. Migration 0013 mirrors them into Supabase. The iOS app lists content EXCLUSIVELY through these tables — **never enumerate `content_entries` to build navigation; that leaks drafts** (no status column there).

```
taxonomy_branches:  slug text PK, index int, title text, eyebrow text, subtitle text,
                    description text, status text check in ('live','coming-soon'), updated_at
taxonomy_modules:   branch_slug text, slug text, title text, index int,
                    PK (branch_slug, slug)
taxonomy_topics:    branch_slug text, module_slug text, slug text,          -- slug is the BARE topic slug
                    title text, eyebrow text, subtitle text,
                    reading_minutes int, index int,
                    status text check in ('live','draft','coming-soon'), updated_at,
                    PK (branch_slug, slug)
```

RLS for anon/authenticated exposes **only `status='live'`** branches/topics (modules visible when their branch is live). So plain `GET /rest/v1/taxonomy_topics?branch_slug=eq.classical-mechanics&order=index` returns only publishable content — the client needs no extra filtering, but defensive clients may still add `status=eq.live`.

Joining to content: `content_entries.slug` for a topic = `branch_slug + "/" + taxonomy_topics.slug`.

Field semantics (from `lib/content/types.ts`): `eyebrow` e.g. `"FIG.16 · OSCILLATIONS"`; `reading_minutes` int; `index` is display order; titles are stored UPPERCASE.

---

## 5. Ask streaming protocol

### 5.1 Request — source: `app/api/ask/stream/route.ts` (zod `BodySchema`)

```
POST https://<web-origin>/api/ask/stream
Content-Type: application/json
Authorization: Bearer <supabase access_token>        ← P0 bearer path (§7)

{
  "conversationId": "<uuid>" | null,   // optional; omit or null to start a new conversation
  "message": "string, 1..4000 chars",  // required
  "locale": "en",                      // optional, default "en"
  "modelId": "claude-sonnet-4-6"       // optional, default "claude-sonnet-4-6"
}
```

`modelId` must be one of (source `lib/ask/types.ts` `AVAILABLE_MODELS`): `claude-sonnet-4-6` (default), `claude-haiku-4-5`, `gpt-5`, `gpt-5-mini`. Web persists the choice in localStorage; iOS should persist in UserDefaults.

Server-side dedup: an identical first message from the same user within 10 s reuses the existing conversation — a double-send is safe.

### 5.2 Response — custom SSE

Headers: `Content-Type: text/event-stream`, `Cache-Control: no-cache, no-transform`, `Connection: keep-alive`.

Framing (source `lib/ask/sse.ts`): each event is exactly
```
event: <name>\n
data: <compact JSON>\n
\n
```
plus keepalive comment lines **`: ping\n\n` every 15 s** — skip any block starting with `:`.

Client algorithm (port of `components/ask/streaming-message.tsx:54-105`): read raw bytes (`URLSession.bytes(for:)` — `EventSource` cannot POST), buffer, split on `\n\n`, match `^event: (\w[\w-]*)\ndata: (.*)$` (multiline), JSON-decode `data`.

### 5.3 Event table (exact payloads, source: route + `lib/ask/types.ts`)

| event | data | when / client action |
|---|---|---|
| `meta` | `{ "conversationId": "<uuid>" }` | Always first. Persist the id for follow-ups |
| `text` | `{ "delta": "string" }` | Append to the assistant message |
| `tool-start` | `{ "name": "searchScenes", "id": "<toolCallId>" }` | Add a running step to the progress tree. **No args yet** |
| `tool-args` | `{ "id": "<toolCallId>", "args": { ... } }` | Attach finalized args to the step |
| `tool-end` | `{ "id": "<toolCallId>", "ok": true, "preview": "short human hint" }` | Mark step ok/error; `preview` optional |
| `flag` | `{ "reason": "anthropic-max-tokens-exhausted" \| "openai-max-completion-tokens-exhausted" \| "empty-completion" \| "injection-heuristic" \| ... }` | If reason contains `"max"`: show "model hit its output budget" note (append if text exists, show as error if bubble empty). Else show `Model flagged: <reason>` |
| `error` | `{ "message": "string", "code"?: "UPSTREAM_STALL" }` | Fatal. `UPSTREAM_STALL` = server watchdog fired after 20 s of provider silence — offer retry |
| `done` | `{ "conversationId": "<uuid>" }` | Terminal. Emitted only AFTER usage/billing DB writes commit — safe point to refresh quota/conversation list |

Notes:
- Usage/token counts are **never** sent to the client.
- The stream may end without `done` (abort, network drop) — treat reader EOF without `done` as a truncated answer; keep partial text, offer retry.
- Tool names you may see (source `lib/ask/tool-schemas.ts`): `searchSiteContent`, `getContentEntry`, `searchGlossary`, `listGlossaryByCategory`, `searchScenes`, `showScene`, `plotFunction`, `plotParametric`, `webSearch`, `fetchUrl`.
- Server heartbeat means a healthy idle stream still delivers bytes every ≤15 s. Recommended client watchdog: if no bytes at all for ~30 s, fail with a retryable error.

### 5.4 Annotated example transcript

*(Synthesized from `lib/ask/sse.ts` + `app/api/ask/stream/route.ts` source — not a live capture. Wire format, ordering, and payload shapes are exact; prose content is illustrative.)*

```
event: meta
data: {"conversationId":"1f3a2b4c-9d8e-4f70-a1b2-c3d4e5f60718"}

event: tool-start
data: {"name":"searchScenes","id":"toolu_01AbC"}

event: tool-args
data: {"id":"toolu_01AbC","args":{"query":"pendulum period"}}

event: tool-end
data: {"id":"toolu_01AbC","ok":true,"preview":"3 scenes: PendulumScene, …"}

event: text
data: {"delta":"A pendulum's period depends only on its length"}

event: text
data: {"delta":" and gravity: $T = 2\\pi\\sqrt{L/g}$.\n\n"}

: ping

event: text
data: {"delta":":::scene{id=\"PendulumScene\" length=1.2 theta0=0.3}\n:::\n\nFor small angles the restoring force is linear, so"}

event: text
data: {"delta":" the motion is simple harmonic.\n\n:::plot{kind=\"function\" plotId=\"period\" expr=\"2*pi*sqrt(L/9.81)\" variable=\"x\" domain=[0.1,3] xlabel=\"L (m)\" ylabel=\"T (s)\"}\n:::\n\n:::cite{kind=\"topic\" slug=\"classical-mechanics/the-simple-pendulum\"}\n:::"}

event: done
data: {"conversationId":"1f3a2b4c-9d8e-4f70-a1b2-c3d4e5f60718"}
```

Note how fences arrive INSIDE `text` deltas, possibly split across deltas — parse fences on the accumulated text, not per-delta (see §8).

### 5.5 Pre-stream JSON errors (returned instead of the SSE stream)

All from `app/api/ask/stream/route.ts`; middleware adds one more (marked *mw*).

| status | body | client behavior |
|---|---|---|
| 503 | `{"error":"ASK_DISABLED"}` | "Ask is temporarily offline" state; hide composer |
| 401 *mw or route* | `{"error":"UNAUTHENTICATED"}` | Refresh Supabase session; if still failing, sign-in screen |
| 429 | `{"error":"RATE_LIMITED","reason":"Too many requests from your network. Try again later."}` + `retry-after: <seconds>` header (IP throttle: 30/h per IP) | Show reason + countdown from `retry-after`; disable send until elapsed |
| 429 | `{"error":"RATE_LIMITED","reason":"Daily message limit reached (20/day)"}` (free-tier daily bucket, `lib/ask/rate-limit.ts`: 20 msgs / 60k in-tokens / 20k out-tokens per day; no retry-after header) | Show reason; suggest tomorrow |
| 402 | `{"error":"QUOTA_EXHAUSTED","reason":"free_quota_exhausted" \| "tokens_exhausted" \| "past_due"}` (source `lib/billing/quota.ts`; free plan = 3 lifetime questions) | **Graceful quota wall** per `00-prd.md`: neutral "quota reached" card, NO purchase links, NO price mention. `past_due` → "billing issue — manage your account on the web" without a link |
| 400 | `{"error":"BAD_REQUEST","message":"<zod message>"}` | Programming error; log + generic failure bubble |
| 500 | `{"error":"DB_ERR","message":"..."}` | Generic retryable failure |

---

## 6. Conversations & sources APIs

All under `https://<web-origin>`; auth same as §7. Sources in `app/api/ask/conversations/route.ts`, `app/api/ask/conversations/[id]/route.ts`, `app/api/ask/glossary-batch/route.ts`.

- `GET /api/ask/conversations` → `200 {"conversations":[{"id":"<uuid>","title":"string|null","updated_at":"<iso>"}]}` — latest 20, ordered by `updated_at` desc. 401 `{"error":"UNAUTHENTICATED"}`; 500 `{"error":"<pg message>"}`.
- `PATCH /api/ask/conversations/<id>` body `{"title"?: "1..120 chars trimmed", "starred"?: bool}` (at least one) → `{"ok":true}`. 400 with zod message if neither.
- `DELETE /api/ask/conversations/<id>` → `{"ok":true}`. Both PATCH/DELETE rely on RLS for ownership — a foreign id "succeeds" with no effect.
- Message history for a conversation: there is NO web API route; the web reads `ask_messages` server-side. iOS reads it **directly from Supabase** with the user's session (RLS lets users read own messages):
  `from("ask_messages").select("role,content,created_at,meta").eq("conversation_id", id).order("created_at")`.
  `content` is `{"text": "..."}`; assistant `meta` may contain `{"flagged": true, "tools": [{"id","name","status":"ok"|"error"|"running","args"?,"preview"?,"startedAt","endedAt"?}]}` — render the same fence parsing + tools tree as live streaming.
- `POST /api/ask/glossary-batch` — hydrates "Sources" cards after parsing `cite` fences. Unauthenticated but IP-throttled (60/h → 429 + retry-after).
  Body: `{"topics"?: [slug≤20], "physicists"?: [slug≤20], "glossary"?: [slug≤20], "locale":"en"}` (at least one non-empty; legacy `slugs` = glossary).
  Response `200`:
  ```json
  { "sources": {
      "topics":     [{ "slug": "...", "title": "...", "subtitle": "...|null" }],
      "physicists": [{ "slug": "...", "title": "...", "subtitle": "...|null" }],
      "glossary":   [{ "slug": "...", "term": "...", "shortDefinition": "...", "category": "concept",
                       "relatedTopics": [{ "branchSlug": "...", "topicSlug": "...", "title": "...|null" }],
                       "relatedPhysicists": [{ "slug": "...", "title": "...|null" }] }]
    },
    "cards": [ ...legacy glossary array... ] }
  ```
  Results preserve request order; missing slugs are silently absent; non-`en` locales fall back to `en` per slug.

---

## 7. Auth: bearer tokens (P0 addition) — spec in `06-backend-changes.md` §3

Today (`middleware.ts:10-26`) `/api/ask/*` is pre-gated by a **cookie presence check** (`sb-<ref>-auth-token`), and routes resolve the user via `@supabase/ssr` cookies — a native client cannot authenticate. P0 adds an ADDITIVE bearer path; after it ships:

- iOS signs in with supabase-swift (Sign in with Apple / Google / email OTP) and holds `session.accessToken` (JWT, ~1 h expiry) + refresh token.
- Every `/api/ask/*` request carries `Authorization: Bearer <accessToken>`.
- supabase-swift auto-refreshes; on 401 from the API, force `auth.refreshSession()` once and retry once; if still 401 → sign-in screen.
- Content reads (§2) don't need this — anon key suffices; per-user Supabase table reads (`ask_messages`, `user_billing`) use the supabase-swift session automatically.
- Cookie behavior for browsers is untouched.

---

## 8. Fence grammar — source: `/Users/roman/Developer/physics/lib/ask/render.ts` (port verbatim, including fallbacks)

Assistant text mixes prose, LaTeX, and three fence kinds. Parse the ACCUMULATED text (fences can be split across `text` deltas). Result type:

```ts
type FencePart =
  | { kind: "text";  text: string }
  | { kind: "scene"; id: string; params: Record<string, unknown> }
  | { kind: "plot";  plotId: string; args: Record<string, unknown> }
  | { kind: "cite";  targetKind: "topic" | "physicist" | "glossary"; slug: string };
```

Regexes (copy exactly):
```
FENCE_RE            = /:::(scene|plot|cite)\{([^}]*)\}(?:\s|\\n)*:::/g
BRACKET_FALLBACK_RE = /\[\[(scene|plot):\s*([A-Za-z0-9_\-]+)\s*\]\]/g          // applied to non-fence text
ATTR_RE             = /(\w+)=("(?:[^"\\]|\\.)*"|true|false|-?\d+(?:\.\d+)?|\[[^\]]*\]|\{[^}]*\})/g
```
Rules (from `parseFences`/`parseOne`):
- `FENCE_RE` tolerates model variants: `\n:::`, `:::` immediately, or literal `\n` escape before the closing `:::`.
- Attributes: each `key=value` where value is JSON (quoted string, bool, number, array, or object) — `JSON.parse` each value; ANY parse failure → the whole fence renders as literal text (never crash).
- `scene`: requires string `id`; all other attrs become `params`. Example: `:::scene{id="PendulumScene" length=1.2}\n:::`.
- `plot`: requires string `plotId`; other attrs become `args`. Args shape (source `components/ask/math-plot.tsx`):
  ```ts
  // kind="function"
  { kind: "function", expr: string, variable: "t" | "x" | "theta",
    domain: [number, number], params?: Record<string, number>,
    xlabel?: string, ylabel?: string,
    overlays?: Array<{ expr: string, params?: Record<string, number> }> }
  // kind="parametric"
  { kind: "parametric", x: string, y: string, variable: "t",
    domain: [number, number], params?: Record<string, number> }
  ```
  Expressions are mathjs syntax (`sin`, `cos`, `sqrt`, `pi`, `^`, implicit `*` NOT guaranteed — evaluate with the PXMath expression evaluator; sample ~200 points across `domain`; auto-derive y-range from sampled finite values; clip non-finite samples).
- `cite`: requires `kind` ∈ {`topic`,`physicist`,`glossary`} and `slug`. Collect all cites; render "Sources" cards at the END of the message via glossary-batch (§6). Glossary cites are expected last in the prose by prompt convention, but don't rely on it.
- `[[scene: Id]]` / `[[plot: id]]` bracket fallback (hallucination tolerance): scene → `{id, params:{}}`; plot → `{plotId, args:{}}` (unrenderable without args — show "plot unavailable" card).
- Scene id validation: look up `scene_catalog` (or the bundled generated meta) — unknown id → render nothing or the snapshot if present, never a broken canvas. Merge order for props: `default_props` ← fence `params` (validated against `params_schema` for curated scenes).
- LaTeX in text runs: `$...$` inline, `$$...$$` display. **Chat prose is NOT markdown** — the web renders it as pre-wrapped plain text with only math extracted. Do not run a markdown parser over it; preserve newlines.

---

## 9. Image URL resolution

Single resolver (PXAPI `ImageURLResolver`), rule order:
1. Absolute `http(s)://` → use as-is (physicist `meta.image` is already a full storage URL [LIVE]).
2. Leading `/` (e.g. `/images/...`) → `https://<web-origin><path>` — served by the Next.js app's `public/` dir, NOT Supabase.
3. Otherwise treat as a storage path → `https://cpcgkkedcfbnlfpzutrc.supabase.co/storage/v1/object/public/images/<path>`.

`<web-origin>` is a build config value (production: the deployed site origin; keep it in the same xcconfig as the Supabase URL). Note: no `figure` blocks with `kind:"image"` were found in the sampled live topics (figures are overwhelmingly simulations); the resolver mainly serves physicist portraits and glossary images.

---

## 10. Quick reference — what talks to what

| iOS need | transport | auth |
|---|---|---|
| Taxonomy (browse) | Supabase PostgREST `taxonomy_*` (P0) | anon |
| Essays / physicists / glossary | Supabase PostgREST `content_entries` | anon |
| Scene metadata + snapshots | Supabase `scene_catalog` + storage | anon |
| Ask chat | `POST <web>/api/ask/stream` SSE | Bearer (P0) |
| Conversation list/rename/delete | `<web>/api/ask/conversations*` | Bearer (P0) |
| Conversation message history | Supabase `ask_messages` direct | user session (RLS) |
| Sources cards | `POST <web>/api/ask/glossary-batch` | none (IP-throttled) |
| Plan/quota display | Supabase `user_billing` direct (read-own) | user session (RLS) |
