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

Prompts: `P8-1-ipad-layouts.md`, `P8-2-performance-glass.md`, `P8-3-account-deletion-privacy.md`, `P8-4-store-prep.md`, `P8-5-settings-tab.md`.

Acceptance: no layout regressions iPhone; iPad screenshots reviewed; Instruments trace shows no >100ms hangs in reader scroll; account deletion round-trip verified against Supabase; archive + TestFlight upload succeeds.

## P9 — Navigation shell rework — Opus, 3 sessions

Motivated by two tabs that *are* their own content: Play renders one playground directly (no index, no room for a second, no beta signal), and Ask renders the transcript with the Liquid Glass tab bar sitting under a floating composer. Signed-out Ask additionally shows a full-screen `AuthGate` wall, which contradicts PRD §3.6's "sign-in is prompted contextually on first Ask use".

Deliverables: a Play index list (beta badge + notice, playground descriptor/registry) with the playground opening chrome-free; Ask at compact width restructured to a conversation-list root with the transcript opening chrome-free; sign-in moved from the `AuthGate` wall to a bottom sheet raised at **send**, preserving the draft; playground state sharing (blob encoding interoperable with the web), Explain → Ask, and on-device saved setups. Also fixes a live bug: `AskWall.signInRequired` is never cleared after a successful sign-in, stranding the user with no composer.

Prompts: `P9-1-navigation-shell.md`, `P9-2-gate-at-send.md`, `P9-3-playground-state.md`.

Key decisions: the tab-bar-hiding mechanism — `.toolbarVisibility(.hidden, for: .tabBar)` on a push vs `fullScreenCover` — is **decided by a spike in P9-1 §0**, not on paper. The push keeps the transcript in the same `UINavigationController` (so composer keyboard behaviour is unchanged) and gives back-swipe for free, but its behaviour under `.tabViewStyle(.sidebarAdaptable)` at regular width is unmeasured; the cover is known-good at both widths but rebuilds the presentation context the composer's layout depends on. Ask changes at **compact width only** — P8-1's split view is untouched. Saved setups are **on-device only**, keeping the playground account-free per PRD §3.6.

Acceptance: no tab bar over the playground canvas or the Ask composer; keyboard raises the composer cleanly inside the cover; a signed-out question survives sign-in and sends itself; iPad layouts pixel-identical to P8-1; share links round-trip between iOS and web.

## P10 — Monetization: dual-provider subscriptions — Opus (+ user for ASC/RevenueCat), 3–4 sessions

The deliberate post-MVP pivot into commerce. The web already sells subscriptions via Revolut (`free/starter/pro`, token quotas, reconciling into `public.user_billing`); Apple requires in-app digital subscriptions go through Apple IAP. P10 adds **Apple IAP on iOS via RevenueCat** and makes both providers write the **same `user_billing` row** (new `provider` column), so a plan bought on either platform is honored on both. Setup is user-executed from `10-revenuecat-setup.md`; all app/backend code is specified in the prompts.

Prompts: `P10-1-billing-provider-and-revenuecat-webhook.md` (web: migration + RevenueCat webhook + cron guard + web billing UI), `P10-2-ios-revenuecat-paywall.md` (iOS: SDK, `Purchases.logIn(uid)`, offerings, `PaywallView`, purchase/restore), `P10-3-ios-account-profile.md` (iOS: Account tab mirrors the web profile, Inter font, Sign out moved last under Delete account), `P10-4-store-config-and-review.md` (`[USER]` ASC/RevenueCat + the R7 doc reversal + App Review prep).

This phase **supersedes Risk R7's "no commerce" stance for iOS IAP** (reversed in the docs by P10-4). The ban on *external/web payment links inside the app* stays in force; the system manage-subscriptions sheet is allowed. Key join key: the RevenueCat app-user-id **is** the Supabase uuid, so the webhook's `app_user_id` maps 1:1 to a `user_billing` row.

Acceptance: buy `pro` in iOS Sandbox → RevenueCat webhook fills `user_billing` (`provider='apple'`) → the same account's web profile shows `pro` with the "Managed via Apple" note; Restore Purchases works; the Revolut cron never touches Apple rows; the Account tab shows profile parity with the web (avatar, name, email, usage meter, User ID/Provider/Joined) in Inter, with Sign out as the final section under Delete account.

## Post-MVP backlog (documented, not built)

Hebrew + RTL (content exists in `content_entries` locale `he`), scene waves 2…N to full ~500 coverage, JSXGraph-scene reimplementations (11), DOM-table scenes (~20), unifying web billing onto RevenueCat Web Billing (P10 keeps Revolut on web), playground state sharing, problems/equations surfaces, widgets/App Intents, **learning app** (lessons + exams — new PRD).

## Total estimate

≈ 30–35 executor sessions to TestFlight. The long pole is P5 (Ask) and the scene waves; P0's backend work de-risks everything else and must land first.
