# P6-1 — Scene Wave runner (repeatable session)

Phase P6, repeatable prompt. Executor: Opus 4.8. Prerequisites: P4 complete. Each P6 session runs ONE wave (or a documented sub-split of one) through `scene-waves/wave-template.md`.

## Read first
- `/Users/roman/Developer/physics/docs/ios/prompts/scene-waves/wave-template.md` (the process — binding)
- The current wave manifest: lowest-numbered `wave-NN.md` in `/Users/roman/Developer/physics/docs/ios/prompts/scene-waves/` with unchecked items (start of MVP: `wave-01.md`, then `wave-02.md`)
- `/Users/roman/Developer/physics/docs/ios/prompts/scene-waves/COVERAGE.md` (create on first run)

## Task
1. Identify the active wave (first manifest with unchecked scenes). If its suggested split says so, take only the next chunk (15–20 scenes max per session).
2. Execute `wave-template.md` against those entries end-to-end (math deps → scenes → register → verify per scene).
3. Maintain `COVERAGE.md`: a table `wave | scenes | ported | date | notes` plus a running total line `Native: <n> / 503 registered web scenes`. Update after the session.
4. If ALL checked-in manifests are complete and more coverage is requested: author `wave-NN+1.md` yourself — pick the next ~15–20 scenes by walking `taxonomy_topics` order for live branches (topics whose figures are still snapshot-only), resolve each scene per the manifest-authoring notes in playbook §9.3 (recursive glob, exclude `_shared/`, the registries, and playbook §10 JSXGraph scenes; verify export names in `lib/content/simulation-registry.ts`; list `lib/physics` imports as `mathDeps`). Commit the manifest BEFORE porting from it.

## Do NOT
- Never port more than 20 scenes in one session.
- Do not reorder or skip manifest entries without a note.
- Do not touch scenes belonging to a different wave's registration file.

## Acceptance criteria
- The session's chunk fully passes the template's acceptance list.
- `COVERAGE.md` updated and consistent with `SceneRegistry.registeredIds.count`.

## Verify
As in `wave-template.md`; additionally:
```bash
grep -c '"sceneId"' docs/ios/prompts/scene-waves/wave-*.md   # manifest sizes
```
Report: coverage delta (`Native: n → m`), per-scene table, any manifest corrections discovered (wrong path/export name — fix the manifest in the same session).
