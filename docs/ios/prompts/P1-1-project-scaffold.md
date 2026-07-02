# P1-1 — Xcode project + package scaffold

**Phase**: P1 · **Sequence**: 5 · **Executor**: Fable · **Prerequisites**: P0-4 (bundle id decided).

## Read first

- `/Users/roman/Developer/physics/docs/ios/01-architecture.md` — ALL of it (repo layout §1, targets + dependency flow §2, pinned deps §3, testing §6)
- `/Users/roman/Developer/physics/docs/ios/P0-COMPLETION.md` (bundle id)
- `/Users/roman/Developer/physics/docs/ios/03-design-system.md` §8 (Gallery — placeholder only this session)

## Task

1. Install XcodeGen if absent (`brew install xcodegen`). Create `ios/project.yml` defining: app target `PhysicsExplained` (iOS 26.0 deployment target, iPhone+iPad, SwiftUI lifecycle, the agreed bundle id, `App/` as a synchronized folder source), dependency on the local package, a DEBUG-only Swift flag for Gallery, and the scheme. Generate: `xcodegen generate --spec ios/project.yml`. **`project.yml` is committed and is the only way the project file is ever changed** (add this note as a comment at its top). Add `ios/.gitignore` (DerivedData, xcuserdata).
2. Create `ios/PhysicsPackages/Package.swift`: swift-tools 6.x, platform `.iOS(.v26)`, all 8 targets + 4 test targets per `01-architecture.md` §1–2, dependency flow EXACTLY per §2 (PXScenes must not depend on PXAPI, etc.), external products pinned per §3 (supabase-swift, GRDB, Nuke, SwiftMath, swift-math-parser) attached only to the targets §2 lists.
3. Minimal compiling sources: each target gets one real file (e.g. `PXFoundation/AppEnvironment.swift` with the config loader reading `PhysicsConfig.plist` — Supabase URL, anon key, API base URL; create the plist in `App/` with real values from the web repo's `.env.local`), others get a placeholder type. Each test target: one trivial passing test.
4. `App/`: `PhysicsExplainedApp.swift` (@main), `RootView.swift` — TabView with Browse/Ask/Play/Settings placeholder screens (SF Symbols, Liquid Glass default tab bar), and `Gallery/GalleryView.swift` placeholder reachable in DEBUG via a toolbar button on Settings.
5. Register the `physicsexplained://` URL scheme in `project.yml` (`CFBundleURLTypes` info properties) and add an `onOpenURL` handler in `RootView.swift` that routes `physicsexplained://gallery/scene/<id>` to the Gallery (per `01-architecture.md` §7) — a stub print/no-op destination is fine this session.
6. Boot it: build for simulator, launch, screenshot the tab shell.

## Do NOT

- No feature code, no design tokens (P1-2), no networking.
- Do not hand-edit the generated `.xcodeproj` — fix `project.yml` and regenerate instead.
- Do not commit the anon key anywhere outside `App/PhysicsConfig.plist` (it is a public key; the plist is fine).

## Acceptance criteria

- `swift build --package-path ios/PhysicsPackages` and `swift test --package-path ios/PhysicsPackages` green.
- `xcodebuild -project ios/PhysicsExplained.xcodeproj -scheme PhysicsExplained -destination 'platform=iOS Simulator,name=iPhone 17 Pro' build` green (adjust simulator to `xcrun simctl list devices available`).
- App launches in simulator showing 4 tabs; screenshot captured.
- Dependency-flow violations impossible: e.g. adding `import PXAPI` to a PXScenes file fails to build.

## Verify

```bash
swift test --package-path ios/PhysicsPackages
xcodegen generate --spec ios/project.yml && xcodebuild -project ios/PhysicsExplained.xcodeproj \
  -scheme PhysicsExplained -destination 'platform=iOS Simulator,name=iPhone 17 Pro' build
xcrun simctl boot "iPhone 17 Pro" 2>/dev/null; xcrun simctl install booted <app path>; xcrun simctl launch booted <bundle id>
xcrun simctl io booted screenshot /tmp/p1-1-tabs.png
```
