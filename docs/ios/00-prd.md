# PRD — Physics.explained for iOS & iPadOS (MVP)

Status: approved 2026-07-02. Executor: Claude Code + Opus 4.8 (prompts P0-\*/P1-\* run by Fable). Sibling docs: `01-architecture.md` (how it's built), `02-api-contracts.md` (what it talks to), `03-design-system.md` (how it looks), `07-implementation-phases.md` (in what order).

## 1. Vision

A fully native SwiftUI companion to [physics.explained](https://physics.explained) — the same knowledge base, the same AI tutor, the same visual identity, rebuilt at best-in-class iOS quality. Not a wrapper: every figure that moves on the web moves natively here, every formula is typeset natively, and the app embraces iOS 26 Liquid Glass while keeping the product's own dark-first, instrument-panel aesthetic (see `03-design-system.md`). This app is also the beachhead for the future learning product (lessons + exams), which will be built on this codebase after MVP.

## 2. Users & platforms

- **Users**: self-learners, students, and physics-curious adults already served by the web app; English-speaking at MVP.
- **Platforms**: iPhone and iPad from **one app target**, iOS/iPadOS **26.0+** only. iPad is a first-class layout (`NavigationSplitView`, wider reader measure, side-by-side Ask), not a scaled-up phone UI.
- **Backend**: the existing Supabase project (anon-key reads for content) and the existing Next.js API for Ask. No new backend services; small additive changes only (see `06-backend-changes.md`).

## 3. MVP features

### 3.1 Browse (knowledge base navigation)
Branch → module → topic navigation mirroring the web taxonomy, sourced from the new `taxonomy_*` tables (P0 migration — repo file `lib/content/branches.ts` remains source of truth, synced by the publish script).

- Home shows the 4 live branches (`classical-mechanics`, `electromagnetism`, `relativity`, `thermodynamics`) with their `§ NN` eyebrows, titles, subtitles; the 2 coming-soon branches (`quantum`, `modern-physics`) appear as non-tappable "coming soon" cards.
- Branch screen lists modules in `index` order; topics within a module show eyebrow (e.g. `FIG.16 · OSCILLATIONS`), title, subtitle, and reading minutes.
- **Only `status = "live"` content is ever listed or reachable.** Draft/coming-soon topics must not leak (Risk R2 in `08-risk-register.md`).
- Physicists and glossary are browsable as flat indexes (they have no taxonomy) and reachable from term/physicist links inside essays.

Acceptance: taxonomy matches web ordering exactly; airplane-mode relaunch still shows previously loaded taxonomy (cache-then-network); a known draft slug is unreachable by navigation and by deep link.

### 3.2 Reader (essay rendering)
Full-fidelity rendering of `content_entries.blocks` (`Block[]` contract — see `04-block-rendering-spec.md`): sections, headings, paragraphs with inline em/strong/code/links, display equations and inline formulas (SwiftMath), callouts (intuition/math/warning/info/note variants), lists, tables, figures. Aside blocks render as a trailing section on iPhone and a sidebar column on iPad.

- `term{slug}` and `physicist{slug}` inlines are tappable → bottom sheet with the glossary/physicist entry (title + blocks), with a "read full entry" push.
- Figure images resolve via the single `ImageURLResolver` (web `/images/*` vs Supabase storage — `02-api-contracts.md` §images).
- Figure simulations render natively when the scene id is in the registry, else the scene's snapshot image — both inside identical SceneCard chrome (§3.3).
- Prev/next topic navigation at the article foot, matching taxonomy order.

Acceptance: the 5 designated reference topics (chosen in P3) render with no missing block types, no unrenderable TeX (audit script clean or documented fallbacks), and visually match web screenshots in structure and hierarchy.

### 3.3 Scenes (figures & animations)
Native SwiftUI `Canvas` ports of the web's Canvas-2D scene system, shipped in waves (playbook: `05-scene-porting-playbook.md`).

- **MVP native coverage ≈ 100 scenes**: the shared toolkit, the 11 portable curated catalog scenes (the 15-entry catalog minus 3 JSXGraph plots and the playground), the 22 SpacetimeDiagram/Manifold-based scenes, and Wave 1 (~60 high-traffic static scenes from live topics).
- **Every other figure shows its pre-rendered snapshot** (from `scene_catalog.snapshot_url`, generated in P0) inside the same SceneCard chrome with a small `STATIC FIGURE` HUD tag. No figure ever renders as "unavailable."
- SceneCard chrome everywhere: mono uppercase `FIG.NN — CAPTION`, corner-bracket frame, tap-to-fullscreen with pinch-zoom.
- Animated scenes run on `TimelineView`; target 60fps iPhone / 120fps ProMotion iPad; animations pause when off-screen.
- Scenes with parameter sliders keep them (native `Slider` styled per design system).

Acceptance: registry count ≥ 95 at MVP; Gallery debug screen renders every registered scene; side-by-side comparison with web for each ported scene signed off per wave.

### 3.4 Physics Ask (AI tutor chat)
Native streaming chat against the existing `POST /api/ask/stream` (contract: `02-api-contracts.md` §ask). Auth-gated.

- Streaming answer text renders incrementally; `$…$` / `$$…$$` typeset via SwiftMath; `:::scene:::` fences render the native scene (or snapshot), `:::plot:::` fences render on the native function/parametric plotter (expression evaluator, golden-tested against mathjs), `:::cite:::` fences hydrate "Sources" cards via `/api/ask/glossary-batch`.
- Tool activity (`tool-start/args/end` events) renders as a collapsible progress tree, matching the web's "chain of thought" affordance.
- Model picker: `claude-sonnet-4-6` (default), `claude-haiku-4-5`, `gpt-5`, `gpt-5-mini`; persisted locally.
- Conversations: list (latest 20), continue, rename, star, delete — via the conversations API.
- Full error matrix handled: 401 → sign-in; **402 → quota wall (§3.7)**; 429 → cooldown UI honoring `Retry-After`; 503 → "Ask is temporarily off"; mid-stream `error`/`flag` events → truncation notice with retry.
- Connectivity: stream survives short blips (`waitsForConnectivity`); app suspension marks the message truncated with a retry affordance; 60s no-event watchdog.

Acceptance: a live conversation that triggers at least one scene, one plot, and one cite renders all three correctly; forced 402 and 429 show their designed states; sign-out mid-stream does not crash.

### 3.5 Playground — Orbital Mechanics (native rewrite)
The one existing web playground (`orbital-mechanics`, BETA), rebuilt natively. Physics comes from the ported `lib/physics/n-body.ts` (PXMath); the interaction layer is new SwiftUI.

- N-body simulation with the web's presets; add/fling bodies via drag (velocity vector preview), pinch-zoom + pan camera, body trails, collision merging, play/pause/reset, speed control.
- HUD readouts (energy, body count, elapsed time) in mono per design system.
- No URL state sharing at MVP (web's blob-encoding deferred).

Acceptance: presets match web behavior qualitatively (stable orbits stay stable); 60fps with 50 bodies + trails on an A17-class iPhone; gestures feel native (no lag, correct hit-testing).

### 3.6 Auth & account
- Sign-in methods: **Sign in with Apple, Google, email OTP (6-digit code)** — all via supabase-swift against the existing Supabase Auth. (Apple is mandatory under App Review 4.8 once Google is offered.)
- The knowledge base and playground require **no account**; only Ask is gated. Sign-in is prompted contextually on first Ask use.
- Settings: appearance (dark/light/system), account info + plan display (read-only from `user_billing`), sign out, **account deletion** (App Review 5.1.1(v) — hard launch blocker; server support per `06-backend-changes.md`).

### 3.7 Quota wall (402) — no commerce
When the API returns `402 QUOTA_EXHAUSTED`, show a neutral, well-designed "You've used your included questions" state. **No purchase button, no external link, no pricing, no mention of the website's plans.** Users who upgraded on the web get their quota automatically (same Supabase account). StoreKit IAP is explicitly post-MVP.

## 4. Non-goals (MVP)

| Out | Why / when |
|---|---|
| Learning app (lessons, progression, exams) | Next product phase, built on this codebase; PRD to follow |
| In-app purchases / any commerce | Post-MVP; avoids IAP entitlement risk (Risk R7) |
| Hebrew / RTL / Russian | Post-MVP; `locale` plumbing kept throughout, hardcoded `"en"` |
| Problems & equations surfaces | Web-only for now (tables exist; no iOS UI) |
| Offline-first guarantees | Cache-then-network only; no sync engine, no downloads UI |
| Marketing/legal/blog pages, contact forms | Web-only |
| URL/blob state sharing for the playground | Post-MVP |
| Push notifications, widgets, App Intents | Post-MVP polish candidates |

## 5. Success criteria

1. A user can browse all live branches, read any live essay with full visual fidelity, and never see a broken figure — online or after having loaded it once.
2. Ask feels equal-or-better than web: time-to-first-token comparable, formulas/scenes/plots render inline, conversations persist across devices (same account).
3. The playground demonstrates "native is better": measurably smoother than the web version on iPad.
4. App Review passes first or second submission: Sign in with Apple present, account deletion present, no payment-rule violations, AI content policy addressed (Risk R15).
5. The scene-wave pipeline is proven: post-MVP waves land at ≥ 15 scenes/session with the playbook alone.

## 6. Assumptions log

| # | Assumption | Confirmed |
|---|---|---|
| A1 | MVP scope = Browse + Reader + Scenes + Ask + orbital playground | User Q&A 2026-07-02 |
| A2 | iOS 26+ only, Liquid Glass | User Q&A |
| A3 | English only at MVP; locale plumbing retained | User Q&A |
| A4 | Auth = Apple + Google + OTP | User Q&A |
| A5 | 402 = graceful wall, no selling | User Q&A |
| A6 | Executor = Claude Code + Opus 4.8 on user's Mac; P0/P1 by Fable | User Q&A |
| A7 | Offline cache is a nicety, not a requirement | User Q&A (offline not selected) |
| A8 | Supabase Auth CAPTCHA is OFF (must verify in P0 before P5) | **Unverified — P0 checklist** |
| A9 | supabase-swift supports Apple/Google native flows against current project config | Verify in P5-1 |
