# P1-2 — PXDesign + Gallery

**Phase**: P1 · **Sequence**: 6 · **Executor**: Fable · **Prerequisites**: P1-1.

## Read first

- `/Users/roman/Developer/physics/docs/ios/03-design-system.md` — ALL of it (tokens §1, typography §2, SceneCard chrome §3, glass rules §4, controls/spacing §5, Gallery spec §8, drift table)
- `/Users/roman/Developer/physics/app/globals.css` (cross-check any hex you're unsure of — production truth)
- `/Users/roman/Developer/physics/components/layout/scene-card.tsx` + `components/layout/corner-frame.module.css` (chrome geometry)

## Task

1. Fonts: download OFL static TTFs — Inter (400/500/600/700), JetBrains Mono (400/500/700), Archivo Narrow (500 + 600 italic) — into `ios/App/Fonts/`, register via `UIAppFonts` in `project.yml` (regenerate) — per `03-design-system.md` §2.1.
2. Implement PXDesign per the doc, matching its Swift API names exactly: `PXColors` (§1.2 — full dark+light ladders, accents, scene palette contract §1.3), `PXTypography` (§2.2 — every text style incl. eyebrow/HUD mono styles with tracking and uppercase modifiers), spacing/radii constants (§5), motion constants (§4).
3. Components: `SceneCardFrame` (§3 — corner brackets, FIG eyebrow, expand affordance slot; geometry exact), `CalloutContainer` (all 5 variants), `PXBadge`, `HUDText`, glass helpers (§4 — toolbar/tab-bar/input-bar treatments).
4. Build the real Gallery (App target, DEBUG): sections for color ladder (dark+light swatches side by side), every text style with sample strings, all three font families rendering, SceneCardFrame with placeholder content, all callout variants, glass samples. Deep-link scheme `physicsexplained://gallery/...` registered (scene deep links wired in P4).
5. Screenshot the Gallery in dark AND light (simulator appearance toggle).

## Do NOT

- No hardcoded hex outside `PXColors`. No system-font fallbacks silently passing for the three families (assert custom fonts load: `UIFont(name:)` non-nil in a debug check).
- Scene palette values come from §1.3, not from the web's `use-theme-colors.ts` fallbacks.
- Do not restyle the default Liquid Glass tab bar into an opaque bar — glass stays (§4).

## Acceptance criteria

- Gallery shows: complete fg ladder, all accents, all text styles in the correct families (visibly not SF), SceneCard corner brackets matching §3 geometry, 5 callout variants — in both appearances.
- `swift test` + xcodebuild green; screenshots `/tmp/p1-2-gallery-{dark,light}.png` captured.
- Phase P1 acceptance in `07-implementation-phases.md` fully met.

## Verify

```bash
swift build --package-path ios/PhysicsPackages && swift test --package-path ios/PhysicsPackages
xcodebuild -project ios/PhysicsExplained.xcodeproj -scheme PhysicsExplained \
  -destination 'platform=iOS Simulator,name=iPhone 17 Pro' build
xcrun simctl io booted screenshot /tmp/p1-2-gallery-dark.png   # + light via appearance override
```
