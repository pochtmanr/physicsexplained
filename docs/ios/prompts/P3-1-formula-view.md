# P3-1 — FormulaView (SwiftMath) + cache

**Phase**: P3 · **Sequence**: 10 · **Executor**: Opus 4.8 · **Prerequisites**: P2-1 (P2-2/2-3 not required).

## Read first

- `/Users/roman/Developer/physics/docs/ios/04-block-rendering-spec.md` §5 (TeX policy: fallbacks, cache key, empty-tex rule)
- `/Users/roman/Developer/physics/docs/ios/03-design-system.md` §1–2 (colors/typography formulas must match)
- `/Users/roman/Developer/physics/docs/ios/02-api-contracts.md` §3 (where `tex` appears: `equation` blocks, `formula` inlines)

## Task

1. `FormulaView` in PXBlocks: two modes — `display` (block equations, centered, larger) and `inline` (baseline-aligned within text runs). SwiftMath renders to an image; cache keyed `(tex, pointSize, colorSchemeResolvedColor)` (NSCache + optional disk tier). Render OFF the main thread; placeholder box while rendering.
2. Failure path per §5: SwiftMath parse failure → mono `code`-styled literal of the TeX, `os.Logger` warning. Empty `tex` with non-empty `prose` → render `prose` as styled text (fixture case from P2-1).
3. `EquationBlockView`: display formula + optional `id` eyebrow (e.g. "EQ.01") + optional prose caption, styled per `03-design-system.md` (mirror the web's `components/math/equation-block.tsx` presentation as spec'd in 04 §2).
4. Gallery section: a TeX sample corpus (hardcode ~15 representative strings pulled from the fixtures: fractions, vectors, integrals, Greek, aligned envs) rendered in both modes and both appearances.
5. PXAskTests/PXModelTests-adjacent unit test: cache hit behavior (same key → same instance), fallback path (invalid TeX doesn't crash, returns fallback).

## Do NOT

- No WebView/KaTeX. No main-thread rendering. No per-frame re-render of already-cached formulas.
- Do not normalize/alter TeX strings beyond what §5 allows (trim only).

## Acceptance criteria

- Gallery corpus renders correctly in dark/light, inline formulas baseline-align inside a sample sentence.
- Invalid TeX shows the designed mono fallback, logged, no crash.
- Scrolling a screen of 30 formulas shows no hitching after first render (cache works).

## Verify

```bash
swift test --package-path ios/PhysicsPackages
xcodebuild -project ios/PhysicsExplained.xcodeproj -scheme PhysicsExplained \
  -destination 'platform=iOS Simulator,name=iPhone 17 Pro' build
xcrun simctl io booted screenshot /tmp/p3-1-formulas.png
```
