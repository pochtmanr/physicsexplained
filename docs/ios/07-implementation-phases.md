# Implementation Phases — Physics.explained iOS MVP

Prompt files live in `docs/ios/prompts/` and are named `P<phase>-<n>-<slug>.md`; scene waves in `prompts/scene-waves/`. Phases P0 and P1 are executed by **Fable** (ground-laying); P2 onward by **Opus 4.8**. Every phase ends in a runnable, demonstrable state. Session estimates assume one prompt ≈ one focused session.

Verification loops per `01-architecture.md` §6: `swift test` (fast), `xcodebuild` + Gallery screenshots (visual).

## P0 — Backend prep (web repo + Supabase) — Fable, 3–4 sessions

Everything the iOS app needs from the backend that doesn't exist yet. Spec: `06-backend-changes.md`.

Deliverables:
1. **Taxonomy migration** (`supabase/migrations/0013_*.sql`): `taxonomy_branches`, `taxonomy_modules`, `taxonomy_topics` (status, eyebrow, reading_minutes, ordering) + anon-readable **live-only view** (or RLS) so clients can't see drafts.
2. **Publish-script sync**: extend `scripts/content/publish.ts` (or a new `scripts/content/publish-taxonomy.ts`) to upsert the tables from `lib/content/branches.ts`. Repo stays source of truth.
3. **Bearer auth**: additive `Authorization: Bearer <supabase JWT>` support in `middleware.ts` and the `/api/ask/*` route handlers (cookie path untouched).
4. **Snapshot pipeline**: standalone Playwright script `scripts/ios/snapshot-scenes.ts` (`pnpm ios:snapshots`) rendering every registered scene (dark theme, 2x) via a new guarded `/dev/scene/[id]` route → Supabase storage `scene-snapshots` bucket; add `snapshot_url` to `scene_catalog` (spec: `06-backend-changes.md` §4).
5. **CAPTCHA check**: verify Supabase Auth dashboard CAPTCHA is off (or plan for it) — blocks P5 OTP if on (Risk R9, Assumption A8).

Prompts: `P0-1-taxonomy-migration.md`, `P0-2-bearer-auth.md`, `P0-3-scene-snapshots.md`, `P0-4-verification.md`.

Acceptance (checkable):
- `curl` with anon key on the live-taxonomy view returns exactly the 4 live branches in order, with modules/topics ordered and reading minutes present; a known non-live slug returns zero rows from that view.
- `curl -N -H "Authorization: Bearer <jwt>"` on `/api/ask/stream` (with a real Supabase session JWT) streams `meta` → `text` → `done`.
- Cookie-based web chat still works in the browser (regression).
- ≥ 95% of registered scenes have a non-null `snapshot_url` resolving to an image.
- CAPTCHA setting documented in the P0 completion note.

## P1 — Scaffold + design system — Fable, 2 sessions

Deliverables: `ios/` Xcode project + SPM package skeleton (all 8 targets compiling empty), PXFoundation config plumbing, **complete PXDesign** (tokens, bundled fonts, text styles, SceneCard chrome, callout container, glass nav treatments per `03-design-system.md`), tabbed App shell (Browse/Ask/Play/Settings placeholders), Gallery with tokens + components sections.

Prompts: `P1-1-project-scaffold.md`, `P1-2-design-system.md`.

Acceptance: `xcodebuild … build` green; `swift test` green (even if trivial); Gallery screenshot shows color ladder, all three font families rendering (not fallback system font), SceneCard frame with corner brackets, all callout variants — in dark and light.

## P2 — Content client + browse — Opus, 3 sessions

Deliverables: PXModel Codable for taxonomy + `ContentEntry`/`Block`/`Inline` with decode-fixture tests from real rows; PXAPI `SupabaseService` + `ContentRepository` (GRDB cache-then-network); Browse UI (branches → modules → topics), coming-soon states, physicist/glossary index screens.

Prompts: `P2-1-models-fixtures.md`, `P2-2-content-repository.md`, `P2-3-browse-ui.md`.

Acceptance: `swift test` decodes all fixtures incl. at least one row of every block type and every inline type; app on simulator browses the live taxonomy with correct ordering/eyebrows/minutes; airplane-mode relaunch still browses (cache hit); a draft slug deep-link shows "not found".

## P3 — Reader — Opus, 4–5 sessions

Deliverables: PXBlocks full renderer (every block + inline type per `04-block-rendering-spec.md`), `FormulaView` with SwiftMath + `(tex,size,color)` image cache, TeX audit runner (a test that pipes every `formula`/`equation` TeX string from fixtures/live content through SwiftMath), figure rendering as snapshots (native scenes come in P4), term/physicist sheets, aside placement (iPhone trailing / iPad sidebar), prev/next topic nav, topic screen chrome.

Prompts: `P3-1-formula-view.md`, `P3-2-block-renderer-core.md`, `P3-3-figures-tables-callouts.md`, `P3-4-topic-screen.md`, `P3-5-tex-audit-and-polish.md`.

Acceptance: 5 designated reference topics (list pinned in P3-4: one per live branch + one equation-heavy) render with zero missing blocks; TeX audit = 0 hard failures (fallbacks documented); side-by-side vs web screenshots reviewed; term/physicist sheets open from inline links.

## P4 — Scene toolkit + curated scenes — Opus, 4 sessions

Deliverables: PXScenes core (`SceneTokens`, GraphicsContext helper extensions, `PXScene` protocol, `SceneRegistry`, `SceneTicker`), `SpacetimeDiagramCanvas` + `ManifoldCanvas` ports, the **11 portable curated catalog scenes** with param support (the catalog in `lib/ask/scene-catalog.ts` has 15 entries: 3 are JSXGraph plots that wait for the native `PlotView` (Wave 2+), 1 is `OrbitalMechanicsPlayground` (built in P7); P4-3 ports the 6 mechanics scenes, P4-4 the 5 EM scenes), `FigureView` upgraded to prefer native registry entries, fullscreen expand, Gallery scene browser.

Prompts: `P4-1-scene-toolkit.md`, `P4-2-shared-canvases.md`, `P4-3-curated-scenes-a.md`, `P4-4-curated-scenes-b.md`.

Acceptance: Gallery lists ≥ 11 native scenes; each compared side-by-side with web (checklist in playbook §8); animated ones hold 60fps on simulator profile build; sliders work; fullscreen works; `FigureView` picks native over snapshot when registered.

## P5 — Auth + Ask — Opus, 5–6 sessions

Deliverables: sign-in (Apple + Google + OTP via supabase-swift) with contextual gate on Ask; `AskClient` SSE actor + replay tests; streaming chat UI with incremental text/LaTeX; fence-parser port (parity tests vs `lib/ask/render.ts` cases incl. `[[scene:id]]` fallback); native `PlotView` + `ExpressionEvaluating` goldens; cite/sources cards via glossary-batch; conversations list/rename/star/delete; model picker; the full pre-stream error matrix + mid-stream `flag`/`error`; connectivity resilience (watchdog, truncation-retry); progress tree.

Prompts: `P5-1-auth.md`, `P5-2-sse-client.md`, `P5-3-fence-parser-and-plots.md`, `P5-4-chat-ui.md`, `P5-5-conversations-and-errors.md`, `P5-6-resilience-polish.md`.

Acceptance: `swift test` passes SSE replay + fence parity + plot goldens; on device: live chat triggering scene+plot+cite renders all three; 402 (force via test account) and 429 show designed walls; kill network mid-stream → truncation notice + successful retry; sign out and back in preserves conversations.

## P6 — Scene Wave 1 — Opus, 4–5 sessions

Deliverables: the 22 SpacetimeDiagram/Manifold-dependent scenes as thin config wrappers, then ~60 static scenes prioritized by live-topic traffic, each session porting 15–20 scenes off a wave manifest (`prompts/scene-waves/wave-01.md`…) with per-scene math deps landed in PXMath first.

Prompts: `P6-1-wave-runner.md` (repeatable wave-session orchestrator + `COVERAGE.md` tracker) with manifests in `prompts/scene-waves/`: `wave-template.md`, `wave-01.md` (the 22 shared-canvas scenes), `wave-02.md` (18 static classical-mechanics scenes); later manifests are self-authored per the template.

Acceptance per wave: registry count increases by the manifest size; Gallery screenshot per scene vs `snapshot_url` reference; `swift test` green (math goldens).

## P7 — Orbital-mechanics playground — Opus, 3 sessions

Deliverables: `NBody` port in PXMath (goldens vs `lib/physics/n-body.ts` including collision merging); playground screen with camera (pan/pinch), body drag-to-fling with vector preview, trails, presets from the web schema, play/pause/reset/speed, HUD readouts.

Prompts: `P7-1-nbody-port.md`, `P7-2-playground-canvas.md`, `P7-3-gestures-presets.md`.

Acceptance: preset orbits qualitatively match web (screen-recording comparison); 50 bodies + trails ≥ 60fps on device profile; gestures pass a manual checklist (fling vector matches drag, zoom anchors under fingers).

## P8 — Polish + iPad + Store prep — Opus (+ user for signing/ASC), 3–4 sessions

Deliverables: iPad `NavigationSplitView` layouts (browse/reader split, wider measure, Ask sidebar), Liquid Glass refinement pass, performance pass (formula cache hit rate, scroll hitches via Instruments), **account deletion** end-to-end, privacy manifest + nutrition labels, App Review notes (AI content: model disclosure, report mechanism per Risk R15), TestFlight build.

Prompts: `P8-1-ipad-layouts.md`, `P8-2-performance-glass.md`, `P8-3-account-deletion-privacy.md`, `P8-4-store-prep.md`.

Acceptance: no layout regressions iPhone; iPad screenshots reviewed; Instruments trace shows no >100ms hangs in reader scroll; account deletion round-trip verified against Supabase; archive + TestFlight upload succeeds.

## Post-MVP backlog (documented, not built)

Hebrew + RTL (content exists in `content_entries` locale `he`), scene waves 2…N to full ~500 coverage, JSXGraph-scene reimplementations (11), DOM-table scenes (~20), StoreKit IAP + plan reconciliation, playground state sharing, problems/equations surfaces, widgets/App Intents, **learning app** (lessons + exams — new PRD).

## Total estimate

≈ 30–35 executor sessions to TestFlight. The long pole is P5 (Ask) and the scene waves; P0's backend work de-risks everything else and must land first.
