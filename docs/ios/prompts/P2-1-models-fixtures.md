# P2-1 — PXModel: domain types + decode fixtures

**Phase**: P2 · **Sequence**: 7 · **Executor**: Opus 4.8 · **Prerequisites**: P1-2.

## Read first

- `/Users/roman/Developer/physics/docs/ios/02-api-contracts.md` §3 (Block[] schema + fixtures), §4 (taxonomy), §2.1–2.2 (content_entries, scene_catalog columns)
- `/Users/roman/Developer/physics/docs/ios/04-block-rendering-spec.md` §1 + "Swift decoding" section (decoding rules)
- `/Users/roman/Developer/physics/docs/ios/01-architecture.md` §2 (PXModel responsibility — pure value types)

## Task

1. In `PXModel`, implement `Block`/`Inline` as enums with associated values, exactly mirroring `02-api-contracts.md` §3. Critical decoding facts: **`em`/`strong` are RECURSIVE containers** (`{kind, inlines: Inline[]}`); plain inlines are bare JSON strings (custom `init(from:)` handling string-or-object); `equation.tex` may be EMPTY with the formula in `prose` (fixture exists); unknown block/inline kinds decode to `.unknown(kind)` — never throw on future content.
2. Implement `ContentEntry` (kind/slug/locale/title/subtitle/blocks/asideBlocks/meta — meta as a typed struct with per-kind optionals per §2.1 incl. `aside` links), `TaxonomyBranch/Module/Topic` (§4), `SceneCatalogEntry` incl. `snapshotURL` (§2.2), `PlotSpec` (function/parametric per §8 grammar — the parse itself comes in P5).
3. Copy the `[LIVE]` fixtures from `02-api-contracts.md` into `Tests/PXModelTests/Fixtures/*.json` verbatim. Add decode tests: every fixture decodes; every Block variant and every Inline variant is asserted at least once; the empty-tex equation and a recursive `em` case are covered explicitly; unknown-kind tolerance is tested with a synthetic `{"type":"future-thing"}`.
4. Typed errors: `AskAPIError` per `01-architecture.md` §5 with `Decodable` conformance for the pre-stream JSON error bodies (§5.5 of the contracts doc).

## Do NOT

- No networking, no UI, no imports beyond Foundation in PXModel.
- Do not "simplify" the schema (e.g. flattening em/strong) — parity with the web contract is the point.
- Do not invent fixture JSON — use the doc's fixtures; if a variant lacks a fixture, extract one from the live DB via the curl patterns in `02-api-contracts.md` §1 and record it in the fixtures dir with a source comment.

## Acceptance criteria

- `swift test --package-path ios/PhysicsPackages` green; PXModelTests cover all 8 block types + all 8 inline kinds + unknown tolerance + empty-tex + recursive emphasis.
- `AskAPIError` decodes all six pre-stream error bodies from §5.5 (test each).

## Verify

```bash
swift build --package-path ios/PhysicsPackages   # after every 2-3 files
swift test --package-path ios/PhysicsPackages --filter PXModelTests
```
