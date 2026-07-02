# P3-5 — TeX audit + reader polish

**Phase**: P3 · **Sequence**: 14 · **Executor**: Opus 4.8 · **Prerequisites**: P3-4.

## Read first

- `/Users/roman/Developer/physics/docs/ios/04-block-rendering-spec.md` §5 (TeX policy + audit gate), §7 (P3 acceptance)
- `/Users/roman/Developer/physics/docs/ios/02-api-contracts.md` §1 (anon REST patterns for pulling TeX corpus)
- `/Users/roman/Developer/physics/docs/ios/08-risk-register.md` (R3 SwiftMath gaps)

## Task

1. Build the TeX audit: a script or test-target executable (`Tests/PXModelTests/TeXAudit` or a small macOS-runnable SPM executable target — choose the simplest that can import SwiftMath) that (a) pulls every `equation.tex` + `formula.tex` string from live `content_entries` via anon REST (all locales, paginated) into a cached JSON corpus file, (b) runs each through SwiftMath parsing, (c) emits `tex-audit-report.json`: total, parsed, failed (with strings).
2. Triage failures: classify (unsupported macro / environment / genuine typo). For each class decide per 04 §5: acceptable fallback vs upstream fix suggestion. Write results into `docs/ios/P3-TEX-AUDIT.md`.
3. Reader polish pass: scroll performance on the longest live topic (fix any formula-cache misses, image sizing jank), dynamic type sanity check at XL, dark/light sweep of all block types.
4. Update the Gallery TeX corpus section (P3-1) to include every *failing* string rendering its fallback — the failure modes stay visible.

## Do NOT

- Do not edit web content to fix TeX this session — record suggestions only.
- Do not switch renderer or add a WebView fallback (that's a doc-level decision; escalate if failure rate >5%).

## Acceptance criteria

- Audit report exists: 0 crashes, failure rate documented; every failure has a designed fallback visible in Gallery.
- P3 phase acceptance in `07-implementation-phases.md` all pass; `docs/ios/P3-TEX-AUDIT.md` committed.
- Longest topic scrolls without visible hitches on simulator (spot Instruments run if in doubt).

## Verify

```bash
swift test --package-path ios/PhysicsPackages
# run the audit target (exact invocation depends on step 1's choice; document it in P3-TEX-AUDIT.md)
cat docs/ios/P3-TEX-AUDIT.md
```
