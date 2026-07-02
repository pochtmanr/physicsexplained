# P3-2 — Block renderer core

**Phase**: P3 · **Sequence**: 11 · **Executor**: Opus 4.8 · **Prerequisites**: P3-1, P2-2.

## Read first

- `/Users/roman/Developer/physics/docs/ios/04-block-rendering-spec.md` §2 (mapping table), §3 (inline runs)
- `/Users/roman/Developer/physics/docs/ios/03-design-system.md` §2 (type scale), §5 (spacing)
- `/Users/roman/Developer/physics/components/content/content-blocks.tsx` (web reference renderer — section numbering, list/table nuances)

## Task

1. `BlockListView(blocks:[Block])` in PXBlocks rendering, per the §2 mapping table: `section` (numbered header + recursive children), `heading` (levels 3/4), `paragraph` (inline runs), `list` (ordered/unordered, correct markers + spacing), `table` (header + rows, horizontal scroll when wide per §2), `equation` (EquationBlockView from P3-1). `figure` and `callout` get placeholder views this session (P3-3).
2. Inline run builder per §3: concatenated `Text` where possible (string/em/strong/code with recursive emphasis), breaking out to HStack-flow only when a run contains `formula` inlines (inline FormulaView). `link` → accent-styled, opens `SFSafariViewController`/`openURL`. `term`/`physicist` → accent-tinted tappable spans that emit a callback (sheets wired in P3-4); unknown term slugs degrade to plain text per 04 §3.
3. Reading-width and margins per `03-design-system.md` §5–6 (max measure, 18pt body, 1.65 line height).
4. Tests: golden-ish structural tests — feed the P2-1 fixtures through a render-model layer (block → view-model structs) and assert counts/types/order; inline run builder unit tests (recursive em, mixed formula runs).

## Do NOT

- No AttributedString HTML parsing; build runs from the typed Inline tree only.
- Do not render figures/callouts yet beyond placeholders. Do not special-case specific slugs.

## Acceptance criteria

- A debug Gallery entry renders the full pendulum fixture (`classical-mechanics/the-simple-pendulum`) end-to-end with correct hierarchy, numbered sections, working inline emphasis/code/links, inline formulas aligned.
- `swift test` green including inline-run tests.

## Verify

```bash
swift test --package-path ios/PhysicsPackages --filter PXModelTests   # + new render-model tests
xcodebuild -project ios/PhysicsExplained.xcodeproj -scheme PhysicsExplained \
  -destination 'platform=iOS Simulator,name=iPhone 17 Pro' build
xcrun simctl io booted screenshot /tmp/p3-2-blocks.png
```
