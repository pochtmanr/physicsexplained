# Scene Wave Template

Reusable prompt for porting a batch of scenes. Instantiate by pairing this file with a wave manifest (`wave-NN.md`). Executor: Opus 4.8. Prerequisites: P4 complete (PXScenes toolkit + SceneRegistry live).

## Read first
- `/Users/roman/Developer/physics/docs/ios/05-scene-porting-playbook.md` — §2 (toolkit mapping), §3 (translation table), §4–5 (worked examples), §6 (math porting), §7 (controls), §9 (registry, definition of done, workflow). This playbook is the ONLY porting guide; follow it exactly.
- `/Users/roman/Developer/physics/docs/ios/prompts/scene-waves/wave-NN.md` — this wave's manifest.
- The TSX source of each scene in the manifest (absolute path given per entry).

## Task (per playbook §9.4)
1. **Math first**: for every unique path in the manifest's `mathDeps`, port that `lib/physics` module to `PXMath` (playbook §6) if not already present — check `ios/PhysicsPackages/Sources/PXMath/` before writing. Golden tests: capture reference values by executing the TS original (`npx tsx -e '...'` from the web repo root) and assert the Swift port matches to 1e-9. `swift test` before touching any scene.
2. **Scenes in manifest order**: translate each TSX per the playbook (tokens via `SceneTokens`, drawing via the `GraphicsContext` helpers, sliders per §7, animated scenes per §2.5/§5). Target file per the manifest's `targetPath`.
3. **Register as you go** in this wave's `SceneRegistry+WaveNN.swift` — id must EXACTLY match the manifest `sceneId` (playbook §9.1).
4. **Build after every 2–3 files**: `swift build --package-path ios/PhysicsPackages`. Never batch.
5. **Verify each scene** against its per-scene definition of done (playbook §9.2): Gallery deep link `physicsexplained://gallery/scene/<id>`, screenshot, compare against the web reference (`scene_catalog.snapshot_url`; fetch via `curl -s "https://cpcgkkedcfbnlfpzutrc.supabase.co/rest/v1/scene_catalog?id=eq.<id>&select=snapshot_url" -H "apikey: $ANON"`), light + dark.
6. Track completion: check items off in the wave manifest's checklist section and append per-scene notes (intentional divergences).

## Do NOT
- No edits outside `PXScenes`, `PXMath`, their test targets, and the wave manifest file.
- No new dependencies; no chrome inside scenes (SceneCard owns it); no hardcoded colors — `SceneTokens` only.
- Do not port scenes listed in playbook §10 (JSXGraph) with this template.
- Do not "improve" physics constants or layout — copy rates/geometry verbatim; divergences only where the playbook mandates (e.g. DPR removal) and note them.

## Acceptance criteria
- `swift test` green (math goldens included).
- `SceneRegistry.registeredIds` grew by exactly the manifest size.
- Every manifest scene passes the §9.2 definition of done; screenshots captured per scene.
- Manifest checklist fully checked with notes.

## Verify
```bash
swift test --package-path ios/PhysicsPackages
xcodebuild -project ios/PhysicsExplained.xcodeproj -scheme PhysicsExplained \
  -destination 'platform=iOS Simulator,name=iPhone 17 Pro' build
xcrun simctl io booted screenshot /tmp/wave-NN-<sceneId>.png   # per scene via Gallery deep link
```
Report: manifest table with ✅/❌ per scene + divergence notes + updated coverage count.
