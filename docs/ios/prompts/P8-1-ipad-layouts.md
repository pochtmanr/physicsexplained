# P8-1 — iPad layouts (NavigationSplitView + size classes)

Phase P8, prompt 1 of 4. Executor: Opus 4.8. Prerequisites: P2–P7 features complete on iPhone.

## Read first
- `/Users/roman/Developer/physics/docs/ios/03-design-system.md` (iPad conventions: reading measure, aside placement)
- `/Users/roman/Developer/physics/docs/ios/04-block-rendering-spec.md` §6 (aside blocks iPad rule)
- `/Users/roman/Developer/physics/docs/ios/00-prd.md` §2 (platforms)
- `ios/App/RootView.swift`

## Task
1. `RootView`: regular-width → `NavigationSplitView` (sidebar: Browse tree + Ask conversations + Play + Settings; detail: content); compact stays the tab bar. One codebase, no iPad-only target.
2. Reader on iPad: max reading measure per design system (~70ch equivalent), aside content in the trailing column (04 §6), figures may exceed the text measure up to a cap; fullscreen scene expand uses the full display.
3. Ask on iPad: conversation list in the sidebar, chat as detail; composer width capped; sources cards two-up when space allows.
4. Playground on iPad: full-bleed canvas, floating glass control cluster; verify gestures with pointer/trackpad (indirect input) as well as touch.
5. Multitasking: verify Split View/Slide Over (1/3, 1/2, 2/3 widths) — layouts adapt via size classes only, no hardcoded device checks. Support all orientations on iPad.
6. Keyboard: ⌘N new chat, ⌘↩ send, arrows in Browse lists (`.keyboardShortcut`); hardware-keyboard focus ring visible.
7. Screenshot audit: every main screen at iPhone, iPad full, iPad 1/2 split — dark + light.

## Do NOT
- No layout forks on `UIDevice.userInterfaceIdiom` — size classes only.
- No iPhone regressions (re-run the P3/P5 screenshot comparisons at compact width).

## Acceptance criteria
- All P8-1 screenshots reviewed: no clipped/overlapping UI, no empty detail panes on first launch (sensible default selection).
- iPhone screenshots pixel-comparable to pre-P8 baselines (no regressions).
- Keyboard shortcuts work on iPad simulator with hardware keyboard.

## Verify
```bash
xcodebuild -project ios/PhysicsExplained.xcodeproj -scheme PhysicsExplained \
  -destination 'platform=iOS Simulator,name=iPad Pro 13-inch (M4)' build
xcrun simctl io booted screenshot /tmp/p8-1-ipad-reader.png
# repeat for browse/ask/play; adjust iPad simulator name to `xcrun simctl list devices available`
```
Report: the screenshot grid (screen × device × scheme) with pass/fail notes.
