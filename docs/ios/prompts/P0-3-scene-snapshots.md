# P0-3 — Scene snapshot pipeline

**Phase**: P0 · **Sequence**: 3 · **Executor**: Fable · **Prerequisites**: P0-1 (adds `scene_catalog.snapshot_url`).

## Read first

- `/Users/roman/Developer/physics/docs/ios/06-backend-changes.md` §4 (render surface + script spec + acceptance)
- `/Users/roman/Developer/physics/lib/content/simulation-registry.ts` (the 503 registered ids; lazy import pattern)
- `/Users/roman/Developer/physics/lib/ask/scene-meta.generated.ts` (defaultProps per id — first ~80 lines for shape)
- `/Users/roman/Developer/physics/scripts/ask/generate-scene-catalog.ts` (how scene_catalog rows are upserted today)
- `/Users/roman/Developer/physics/components/layout/scene-card.tsx` (what chrome to EXCLUDE from snapshots)

## Task

1. Create the dev-only render surface `app/dev/scene/[id]/page.tsx` per `06-backend-changes.md` §4.1: renders exactly one registry scene by id with its `defaultProps` from generated meta, dark theme forced, no SceneCard chrome, fixed 720px-wide container, `notFound()` in production (`process.env.NODE_ENV === "production"` guard or env flag as §4.1 specifies).
2. Create `scripts/ios/snapshot-scenes.ts` per §4.2: Playwright (add as devDependency if absent — this is a web-repo devDep, allowed), iterate all registry ids, wait for canvas paint (fixed settle delay + rAF flush), screenshot at deviceScaleFactor 2, upload to new **public** storage bucket `scene-snapshots` (create via storage API if missing), update `scene_catalog.snapshot_url`. Skip-and-report failures; write `scripts/ios/snapshot-report.json`.
3. Animated scenes: capture at the settle delay (a representative mid-animation frame is fine; determinism not required).
4. Add `"ios:snapshots": "tsx scripts/ios/snapshot-scenes.ts"` to package.json. Run the full sweep.

## Do NOT

- Do not modify any scene component to make it "snapshot friendly".
- Do not make `/dev/scene/[id]` reachable in production builds.
- Do not block the sweep on individual failures — skip, record, continue.

## Acceptance criteria

- ≥95% of registered ids have a non-null `snapshot_url` whose URL returns HTTP 200 image/png.
- `snapshot-report.json` lists every skipped id with a reason; total failures <5%.
- Spot-check 5 snapshots visually (one per branch + one animated): correct dark theme, no chrome, legible.

## Verify

```bash
npx tsc --noEmit
pnpm dev &  # dev server for Playwright
pnpm ios:snapshots
node -e "const r=require('./scripts/ios/snapshot-report.json');console.log(r.ok.length, r.skipped.length)"
# Coverage query:
curl -s "https://cpcgkkedcfbnlfpzutrc.supabase.co/rest/v1/scene_catalog?select=id&snapshot_url=is.null" \
  -H "apikey: $ANON" -H "Authorization: Bearer $ANON" | node -e "process.stdin.on('data',d=>console.log(JSON.parse(d).length))"
curl -sI "$(curl -s '.../rest/v1/scene_catalog?select=snapshot_url&limit=1' -H "apikey: $ANON" -H "Authorization: Bearer $ANON" | node -pe 'JSON.parse(require("fs").readFileSync(0))[0].snapshot_url')" | head -1
```
