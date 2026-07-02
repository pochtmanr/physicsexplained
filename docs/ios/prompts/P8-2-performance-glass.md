# P8-2 — Performance + Liquid Glass refinement

Phase P8, prompt 2 of 4. Executor: Opus 4.8. Prerequisites: P8-1.

## Read first
- `/Users/roman/Developer/physics/docs/ios/03-design-system.md` (glass placement rules — binding; glass is chrome-only, the reading surface stays flat)
- `/Users/roman/Developer/physics/docs/ios/08-risk-register.md` (streaming-perf and formula-cache rows)
- `/Users/roman/Developer/physics/docs/ios/07-implementation-phases.md` §P8 acceptance

## Task
1. Glass pass: audit every screen against 03's placement rules — tab bar/sidebar, nav bars, Ask composer, playground floating controls, sheets get glass treatments; reader body, scene canvases, chat bubbles stay flat. Fix legibility violations (text over glass must use the specified vibrancy styles). Remove any ad-hoc materials added during earlier phases.
2. Formula cache audit: instrument `FormulaView` cache (hits/misses via `os.Logger` DEBUG counters); scroll the 5 reference topics end-to-end → steady-state hit rate ≥ 95%, no re-typesetting on scroll-back. Fix by widening the cache key/size if needed.
3. Reader scroll: Instruments (Hangs + Animation Hitches) over the longest live essay — no hang > 100 ms, hitch ratio < 5 ms/s. Lazy-mount scenes offscreen (verify `LazyVStack`/`onAppear` gating actually defers scene ticker start; paused scenes must do zero frame work).
4. Scenes: on an iPad simulator profile build, spot-check 5 animated scenes for dropped frames; on-device 120 Hz ProMotion verification is a listed manual step for the user — prepare the checklist.
5. Launch: cold start to interactive Browse < 1.5 s on simulator profile build (measure with `os_signpost`); defer non-critical init (Nuke config, catalog refresh) off the launch path.
6. Memory: reader + 20 scenes scrolled, chat with 50 messages → no unbounded growth (Instruments Allocations; snapshot cache caps respected).

## Do NOT
- No functional changes disguised as perf work; no new dependencies.
- Do not disable animations to pass hitch targets.

## Acceptance criteria
- Instruments traces meet the numbers above (attach summaries to the report).
- Glass audit checklist: every screen ✓ against 03's rules, dark + light screenshots.
- Formula cache ≥ 95% steady-state hit rate on the reference-topic scroll.

## Verify
```bash
xcodebuild -project ios/PhysicsExplained.xcodeproj -scheme PhysicsExplained \
  -configuration Release -destination 'platform=iOS Simulator,name=iPhone 17 Pro' build
# Instruments runs are manual: Product > Profile equivalents via xctrace:
xcrun xctrace record --template 'Animation Hitches' --launch -- <app-path>   # summarize in report
```
Report: per-metric table (target vs measured) + before/after for anything fixed.
