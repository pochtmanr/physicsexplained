# P2-3 — Browse UI

**Phase**: P2 · **Sequence**: 9 · **Executor**: Opus 4.8 · **Prerequisites**: P2-2.

## Read first

- `/Users/roman/Developer/physics/docs/ios/00-prd.md` §3.1 (Browse acceptance detail)
- `/Users/roman/Developer/physics/docs/ios/03-design-system.md` §2 (type styles), §4 (glass), §6 (iPhone/iPad)
- `/Users/roman/Developer/physics/docs/ios/01-architecture.md` §4 (`@Observable` view models)
- Web reference for tone: `/Users/roman/Developer/physics/app/[locale]/page.tsx` (how branches/topics present: eyebrows, § numbering, reading minutes)

## Task

1. `BrowseModel` (@MainActor @Observable) over `ContentRepository`: branches → modules → topics, live-only by construction, ordered.
2. Screens (App target or PXBlocks-adjacent feature files per architecture): **BranchListView** (branch cards: eyebrow `§ NN`, title uppercase, subtitle, topic count; coming-soon branches from the registry are NOT in taxonomy_live — don't fake them), **BranchView** (modules as sections, topic rows: FIG eyebrow, title, reading minutes badge), **TopicScreen placeholder** (title + "reader lands in P3"), navigation via `NavigationStack` path (iPad split view comes in P8).
3. Physicist + glossary index screens: flat searchable lists from `content_entries` metadata queries (kind-filtered, title+slug only — per `02-api-contracts.md` §2.1 select patterns); detail screens are P3 sheets.
4. Loading/empty/error states per `01-architecture.md` §5 (typed UI states, no raw errors).
5. Wire into the Browse tab; add a Gallery section snapshotting BranchListView with fixture data.

## Do NOT

- No `content_entries` full-row fetches for lists (title/slug/meta columns only).
- No pull-to-refresh custom spinners — system defaults.
- Do not build search-across-content (post-MVP); the physicist/glossary lists filter client-side only.

## Acceptance criteria

- Simulator: Browse shows exactly the live branches, ordered, with eyebrows and minutes matching the web registry; deep navigation branch → module section → topic placeholder works.
- Airplane-mode relaunch still browses (cache).
- A known coming-soon topic slug is absent everywhere.
- `swift test` green; screenshots of the three levels captured.

## Verify

```bash
swift test --package-path ios/PhysicsPackages
xcodebuild -project ios/PhysicsExplained.xcodeproj -scheme PhysicsExplained \
  -destination 'platform=iOS Simulator,name=iPhone 17 Pro' build
xcrun simctl io booted screenshot /tmp/p2-3-browse.png
```
