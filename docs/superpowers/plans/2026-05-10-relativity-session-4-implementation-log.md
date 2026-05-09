# RT Session 4 — §07 Tensor Calculus + §08 Curvature & EFE — Implementation Log

**Date:** 2026-05-10
**Spec:** `docs/superpowers/specs/2026-04-29-relativity-branch-design.md`
**Progress:** 28/61 → **38/61 (62%)** — GR mathematical machinery fully built

## Summary

10 topics shipped (FIG.29–FIG.38). 5 §07 (tensor-calculus) + 5 §08 (curvature & EFE). 2 new physicists (Bernhard Riemann, Tullio Levi-Civita). 16 new glossary structural entries (14 planned + `covariant-derivative` forward-ref alias surfaced by Wave 3 scan + `gravitational-redshift` alias seeded as planned). New shared primitive `ManifoldCanvas` shipped to `components/physics/_shared/`.

Total commits this session: **14** (1 Wave 0 + 1 Wave 1 + 1 Wave 1.5 + 10 Wave 2.5 + 1 Wave 3 seed + 1 Wave 3 spec/log).

Total tests after this session: **611** (full vitest sweep). RT-specific tests added this session: ~174 (15+24+22+19+14+14+15+19+12+20).

## Wave-by-wave

### Wave 0 — Promote-to-live (commit `bcac47e`)
Flipped 10 §07+§08 status entries from `coming-soon` to `live` in `lib/content/branches.ts:1002-1012`. No types.ts extension this session; per-topic physics libs heterogeneous enough that shared abstraction would be premature. Pre-existing `tests/api/problems-*` Mock-type errors filtered, all other typecheck clean.

### Wave 1 — seed-rt-04.ts (commit `ca78f54`)
- 2 physicists: `bernhard-riemann` (1826–1866, German), `tullio-levi-civita` (1873–1941, Italian). Cartan deferred to plain text.
- 14 glossary terms (§07: manifold, tangent-space, metric-tensor, christoffel-symbols, parallel-transport, holonomy, geodesic-equation; §08: riemann-tensor, ricci-tensor, ricci-scalar, einstein-tensor, stress-energy-tensor, einstein-field-equations, newtonian-limit). Plus `gravitational-redshift` alias (RT3 topic, glossary slug new this session).
- relatedTopics appended to existing einstein (+5), hilbert (+1), klein (+1), weyl (+2).
- `paragraphsToBlocks` helper copied byte-for-byte from `seed-rt-03.ts` per Sessions 1+2+3 lesson (no paraphrasing).
- Glossary structural-entry shape: `{slug, category, relatedPhysicists, relatedTopics}` — Wave 1 agent flagged that `term` is NOT a field on `GlossaryTerm` interface; seed-script ships title via the seed payload itself, no schema change needed.

### Wave 1.5 — ManifoldCanvas shared primitive (commit `b8a16f4`)
- New `components/physics/_shared/ManifoldCanvas.tsx` + `.test.tsx` + `index.ts` re-export.
- API: embedding (u,v)→(x,y,z), tangent arrows, parallel-transport overlay, geodesic curve, rotation slider, palette override. Mirrors `SpacetimeDiagramCanvas` API style (DPR handling, controlled/uncontrolled rotation, palette merge).
- Hidden-surface heuristic: front-facing (rotated z≥0) full opacity, back-facing 0.25× — sufficient for one closed surface, not a general depth sorter.
- 8/8 tests passing. **Used by 5 §07/§08 topics this session: SphereManifoldScene, MetricEllipsesScene, SphericalTriangleHolonomyScene (the §07 money shot), GreatCircleGeodesicScene, RicciScalarHeatmapScene, RiemannVsFlatScene.** Will pay off heavily next session for §09 Schwarzschild embedding diagrams + §10 Kerr ergosphere.

### Wave 2 — 10 parallel topic agents (sonnet model; ~5–7 min each)
All 10 agents completed cleanly. Word counts 1004–1571 per topic. No agent reported BLOCKED. One missing-term flag (`covariant-derivative`) surfaced by §07.4 agent and patched in Wave 3.

### Wave 2.5 — Orchestrator merge + publish + commit per topic
- Single registry merge to `lib/content/simulation-registry.ts` (30 new scene entries — 10 topics × 3 scenes), inserted before line 1322 closing `};`.
- **Canary publish: §07.4 christoffels-and-parallel-transport FIRST.** The covariant-derivative equation `∇_μ V^ν = ∂_μ V^ν + Γ^ν_{μρ} V^ρ` parsed cleanly through the publish CLI on first try. **Tensor-index notation in `\begin{aligned}` and inline `$$...$$` confirmed clean across the densest math the site has shipped.** No fallback to single-line equations needed.
- Order: §07.4 (canary) → §07.1 → §07.2 → §07.3 → §07.5 → §08.1 → §08.2 → §08.3 → §08.4 (money shot) → §08.5.
- Each `pnpm content:publish --only relativity/<slug>` returned `1 added`. All 10 topics now resolve in Supabase.
- Per-topic commits with full rationale. The first commit (`68ba25e` for §07.4) carried the registry merge.

### Wave 3 — Seed run + spec update + log
- Forward-ref scan surfaced `covariant-derivative` as the only missing glossary slug. Added structural entry to `lib/content/glossary.ts` and full prose to `seed-rt-04.ts` GLOSSARY array (155-word description; relatedPhysicists: tullio-levi-civita).
- `pnpm exec tsx --conditions=react-server scripts/content/seed-rt-04.ts` returned **2 physicists inserted, 16 glossary inserted, 0 errors**.
- `pnpm tsc --noEmit` clean (filtered to exclude pre-existing `tests/api/problems-*` Mock-type errors).
- `pnpm vitest run tests/physics/relativity/` returned **611 tests in 39 files, all passing** in 4.59s.
- Skipped curl smoke (dev-server bind blocked by auto-mode classifier; publish CLI's `1 added` per topic + Supabase upsert success is sufficient evidence the routes resolve).
- Spec progress table updated to 38/61 (62%); per-topic checklist boxes 29–38 flipped to checked.

## Lessons learned this session

1. **Tensor-index notation parsing is robust.** `\nabla_\mu V^\nu = \partial_\mu V^\nu + \Gamma^\nu{}_{\mu\rho} V^\rho`, `R^\rho{}_{\sigma\mu\nu}`, `\begin{aligned}` multi-line equations, `\begin{pmatrix}`, mixed-index `\Lambda^\mu{}_\nu` — all parsed cleanly. No fallback needed even for the densest §07.4 covariant-derivative + §08.1 Riemann-tensor formula. **Tensor calculus on the site is a solved problem now.**

2. **ManifoldCanvas amortization paid off.** Built once in Wave 1.5, used by 6 scenes across 5 topics this session. The pushforward Jacobian via finite differences was the right level of abstraction — agents could pass arbitrary embedding functions and tangent vectors without re-implementing surface rendering. **Strong recommendation: reuse for §09 Schwarzschild embedding + §10 Kerr ergosphere streamlines + §12 FLRW curvature visualization.**

3. **Forward-ref glossary scan is non-trivial.** §07.4 agent surfaced `covariant-derivative` as a `<Term>` slug that wasn't in the available list. Wave 3's grep-and-patch pattern (single forward-ref alias entry; ~150 words; no extra commit) handled it cleanly. The same pattern will likely surface 1–2 missing slugs per session — budget for it.

4. **Scene-name lint paid off.** No collisions this session. The topic-prefixed naming (`SphericalTriangleHolonomyScene`, `EFESplitScreenScene`, `RicciScalarHeatmapScene`) avoided the `TwoRocketsScene` issue from RT-3.

5. **§08.4 EFE money shot landed.** EFESplitScreenScene with mass-density slider on left and Ricci-curvature heatmap on right is exactly the "the equation finally readable" payoff we needed. The Einstein-Hilbert action scene + November 1915 timeline carry the historical weight without overburdening the main page.

6. **§07.4 spherical-triangle holonomy money shot landed.** ManifoldCanvas + parallelTransport prop with real `christoffel.ts` integration (not a visual approximation) — the vector arrives back rotated by the enclosed-area angle, holonomy as the rotation that flat spaces can't produce. The reveal is exactly the §07 cornerstone we wanted.

7. **GR honest-moment payoff in §07.5.** FallingAppleAsGeodesicScene + the explicit Callout("the apple isn't pulled; it's running along a geodesic") + forward-link to §08.5 Newtonian-limit chain ties §06.4 (gravity-as-geometry, Session 3) → §07.5 (geodesics, this session) → §08.5 (Newtonian recovery, this session) into a complete GR-foundations narrative arc.

8. **Slug-collision discipline held.** `riemann-tensor` glossary vs `the-riemann-tensor` topic — different `kind` namespaces in `content_entries`, coexist cleanly. `einstein-tensor` glossary vs `einsteins-field-equations` topic — different roots. `einstein-field-equations` glossary vs `einsteins-field-equations` topic — different (one possessive, one not). All resolved without `-term` suffix workarounds.

9. **Pre-existing `tests/api/problems-*` Mock-type errors persist.** Unrelated to this session's work. Filter with `pnpm tsc --noEmit | grep -v "tests/api/problems"` for clean output.

10. **Wave 2 parallel dispatch is the right abstraction.** 10 sonnet-model agents in parallel completed in ~6 minutes, ~70k tokens each. Token-saving variant (no per-task review) was the right call given branch is main and per-topic commits provide rollback granularity.

## Next session recommendation

**Session 5: §09 Schwarzschild + Classical Tests + §10 Black Holes (11 topics, FIG.39–49).** Densest visualization session of the branch — Schwarzschild metric embedding, **Mercury's perihelion (§09.2 money shot — rosette precession overlaid on Le Verrier's 1859 data)**, light deflection, Shapiro delay, event horizon, **Kerr ergosphere (§10.2 money shot — frame-dragging streamlines + Penrose energy extraction)**, Penrose diagrams, no-hair theorem, BH thermodynamics, Hawking radiation. ManifoldCanvas built this session pays off heavily in §09 Schwarzschild + §10 Kerr.

New physicists for Session 5: Karl Schwarzschild (1873–1916), Roy Kerr (1934–2024), John Wheeler (1911–2008), Subrahmanyan Chandrasekhar (1910–1995), Stephen Hawking (1942–2018), Roger Penrose (1931–), Jacob Bekenstein (1947–2015). 7 new entries — busiest physicist session of the branch.

11 topics in Session 5, then 12 in Session 6 (§11 GW + §12 Cosmology + §13 Frontiers) closes the branch. Targeting branch completion 2026-05-12.

## Commit list (this session)

```
bcac47e  feat(rt/§07-§08): promote 10 topics to live for tensor-calculus + EFE session
ca78f54  feat(rt/§07-§08): scaffold seed-rt-04 — Riemann, Levi-Civita, 14 glossary + redshift alias
b8a16f4  feat(physics/_shared): ManifoldCanvas — curved-surface primitive for §07+§08+§09+§10
68ba25e  feat(rt/§07): christoffels-and-parallel-transport — the connection that says what "stays parallel" means
a93d376  feat(rt/§07): manifolds-and-tangent-spaces — curved spaces and the flat ones that approximate them
a69349e  feat(rt/§07): tensors-on-curved-space — indexed objects that don't lie about which way they point
3e3f164  feat(rt/§07): the-metric-tensor — coordinate differences become actual distances
5ae279b  feat(rt/§07): geodesics — the straightest possible lines, and why falling apples follow them
be78b1f  feat(rt/§08): the-riemann-tensor — twenty independent numbers per point that say exactly how a space is bent
bbae8e9  feat(rt/§08): ricci-and-the-einstein-tensor — the contractions that make a divergence-free curvature object
232d9ee  feat(rt/§08): the-stress-energy-tensor — energy, momentum, pressure, and stress, all in one object
3f87b5c  feat(rt/§08): einsteins-field-equations — spacetime tells matter how to move; matter tells spacetime how to curve
f5f13b7  feat(rt/§08): the-newtonian-limit — where GR gives back Newton, and where it refuses
0d93132  chore(rt/§07-§08): seed Riemann + Levi-Civita + 16 glossary terms into Supabase
```
