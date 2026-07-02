# P3-4 — Topic screen, sheets, asides, nav

**Phase**: P3 · **Sequence**: 13 · **Executor**: Opus 4.8 · **Prerequisites**: P3-3, P2-3.

## Read first

- `/Users/roman/Developer/physics/docs/ios/04-block-rendering-spec.md` §6 (asides — note: sidebar links live in `meta.aside`, NOT `aside_blocks`), §7 (the 5 acceptance topics)
- `/Users/roman/Developer/physics/docs/ios/00-prd.md` §3.2 (Reader acceptance detail)
- `/Users/roman/Developer/physics/docs/ios/03-design-system.md` §6 (iPhone/iPad layout)
- Web reference: `/Users/roman/Developer/physics/components/layout/topic-page-layout.tsx` + `components/layout/aside-links.tsx`

## Task

1. `TopicScreen`: breadcrumb eyebrow (branch › module), title/subtitle header, `BlockListView` body, `localeFallback` banner when the repository flags it, prev/next topic nav footer (order from taxonomy), scroll-position-independent toolbar with glass treatment.
2. Asides per 04 §6: `meta.aside` link groups → iPad (regular width): trailing sidebar column; iPhone: collapsible "Related" section after the article. Aside links navigate to topics/physicists/glossary in-app.
3. Term/physicist sheets: tapping an inline `term`/`physicist` (callback from P3-2) presents a sheet fetching `content_entries` (kind glossary/physicist) via the repository — title, blocks via `BlockListView`, "open full page" where a full screen exists (physicist screen may just be the sheet at MVP per PRD).
4. Replace the P2-3 topic placeholder; full flow Browse → topic → sheets → next topic.
5. Pin the 5 reference topics from 04 §7 in a Gallery "acceptance" section (deep links).

## Do NOT

- No web-parity pixel obsession on iPhone layout — follow the design doc, not the desktop site; parity target is content completeness.
- Do not fetch aside content eagerly — sheets fetch on demand.

## Acceptance criteria

- All 5 reference topics render with zero missing/placeholder blocks (except native scenes pending P4 — snapshots OK), correct asides, working sheets, working prev/next.
- Locale fallback banner logic verified (force `he` via debug toggle → English content + banner).
- Screenshots of the 5 topics captured for the side-by-side review vs web (record in `/tmp/p3-4/`).

## Verify

```bash
swift test --package-path ios/PhysicsPackages
xcodebuild -project ios/PhysicsExplained.xcodeproj -scheme PhysicsExplained \
  -destination 'platform=iOS Simulator,name=iPhone 17 Pro' build
for t in pendulum gauss gr-time-dilation entropy energy; do xcrun simctl io booted screenshot /tmp/p3-4/$t.png; done
```
