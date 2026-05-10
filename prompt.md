Start RT Session 5 — ship §09 Schwarzschild + Classical Tests of GR + §10 Black Holes (11 topics, FIG.39–49). RELATIVITY branch is at 38/61 (62%) — Sessions 1–4 closed SR + GR foundations + tensor calculus + Einstein's field equations. This is the densest visualization session of the branch: Schwarzschild metric, Mercury perihelion (§09 money shot — rosette precession overlaid on Le Verrier 1859 data), light deflection, Shapiro delay, event horizon, Kerr ergosphere (§10 money shot — frame-dragging streamlines + Penrose energy extraction), Penrose diagrams, no-hair theorem, BH thermodynamics, Hawking radiation. After this session, GR is fully cashed out; Sessions 6 cleans up (GW, cosmology, frontiers).

Spec: docs/superpowers/specs/2026-04-29-relativity-branch-design.md — READ §09 + §10 + Voice + Calculus policy + Integration checklist + Risk Notes + Slug-collision watch.

## ⚠ READ BEFORE BUILDING ANY SCENE — non-negotiable

The Canvas-2D scene design language was finalized 2026-05-10. Every new scene MUST follow it from the start; no more "we'll fix the chrome later" — the relativity branch already paid that cost (~88 scenes migrated in one session). Before writing a single scene file, read:

- `components/physics/_shared/README.md` — rules + skeleton + anti-patterns list
- `components/physics/_shared/scene-tokens.ts` — `useSceneTokens`, `useSceneSize`, `useSceneTick`, `applyDpr`, `SCENE_CANVAS_CLASS`, `hexToRgba`, `drawArrow`, `drawSectionTitle`, `drawHudReadout`, `drawDivider`
- `components/physics/maxwell-and-the-speed-of-light/foucault-rotating-mirror-scene.tsx` — gold-standard animated RT scene
- `components/physics/einsteins-field-equations/efe-split-screen-scene.tsx` — gold-standard responsive split-panel
- `components/physics/dielectric-capacitor-scene.tsx` — gold-standard EM scene with slider + toggle
- MemPalace drawer `physics/decisions` → "CANONICAL CANVAS-2D SCENE PATTERN" — same content, indexed for search

The six rules: (1) tokens not hex literals, (2) don't double the SceneCard frame — canvas is `className={SCENE_CANVAS_CLASS}` only, (3) responsive width via `useSceneSize`, never `width={720}`, (4) DPR via `applyDpr`, (5) controls use CSS-var theme accents `style={{ accentColor: 'var(--color-cyan)' }}`, never `accent-cyan-400`, (6) use `useSceneTick` for ref-based animation. Module-level color constants like `const BG = "#0A0C12"` are forbidden — they freeze at parse time and ignore theme flips. Light theme test every scene before claiming it's done.

## Workflow

Same as Session 4: write Session 5 plan via /superpowers:writing-plans (5-wave). Wave 0: promote-to-live + check for any new shared primitives needed (likely a `SchwarzschildEmbeddingCanvas` for §09.1 + §09.2 + §10.1 — funnel surface visualization; assess at plan time). Wave 1: seed-rt-05.ts with new physicists (Schwarzschild, Kerr, Penrose, Hawking, Bekenstein) + ~15 glossary terms (schwarzschild-radius, event-horizon, ergosphere, penrose-diagram, kerr-metric, no-hair-theorem, surface-gravity, hawking-radiation, bekenstein-bound, isco, ringdown, photon-sphere, frame-dragging, shapiro-delay, gravitational-deflection). Wave 2: dispatch 11 parallel per-topic agents — each agent gets the canonical-pattern reference paragraph at the top of its prompt, no exceptions. Wave 2.5: orchestrator publish+commit FIG.39→49. Wave 3: seed + smoke + spec + MemPalace log.

Then execute via /superpowers:subagent-driven-development token-saving variant, no per-task review.

## Topics (per spec)

§09: the-schwarzschild-metric, mercury-perihelion (money shot), gravitational-deflection-of-light, shapiro-delay, photon-sphere-and-isco.
§10: event-horizons, kerr-and-the-ergosphere (money shot), penrose-diagrams, no-hair-theorem, bh-thermodynamics, hawking-radiation.

## Slug-collision watch
- `event-horizon` (§10.1) is a glossary term AND a topic root — different but adjacent. Use `event-horizons` (plural) for the topic slug, `event-horizon` for the glossary. Same precedent as RT §05.
- `kerr-metric` glossary vs `kerr-and-the-ergosphere` topic — different roots, no collision.
- `hawking-radiation` glossary vs `hawking-radiation` topic — give the topic an article: `hawking-radiation-and-bh-evaporation`.
- `schwarzschild-radius` (glossary) is fine alongside `the-schwarzschild-metric` (topic).

## Critical voice

§09.2 mercury-perihelion is the **first quantitative confirmation of GR** — Le Verrier observed the 43"/century anomaly in 1859, Einstein derived it from the Schwarzschild geodesic in November 1915 (literally the same week as the field equations, before the paper went to press). That timing is the lede. §10.7 hawking-radiation must NOT oversell — semiclassical, not quantum-gravity; the temperature formula is the deliverable. Honest moment: §10 is the place GR's predictions get exotic, but every prediction here has been observationally confirmed (event horizon imaged 2019, gravitational waves 2015, Shapiro delay 1964, Mercury 1859→1915).

## Critical gotchas (carried forward)

- `paragraphsToBlocks` MUST be flat string[]. HTML entities don't decode inside `$...$`. `<Term>`/`<PhysicistLink>` MUST be inline, never block. Pre-emit a scene-name lint at Wave 2 dispatch — `EventHorizonScene`, `KerrScene`, `PenroseDiagramScene` could clash with future astro topics; namespace per-topic.
- Pre-existing dirty files (`components/layout/mobile-nav.tsx`, sometimes prompt.md, sometimes ascii-spiral.avif) — DO NOT touch unless task-relevant.
- Branch is main; commit directly. Token-saving variant of subagent-driven-development.

## End-of-session deliverables

11 topics live at FIG.39–49; Schwarzschild + Kerr + Penrose + Hawking + Bekenstein in PHYSICISTS; ~15 new glossary entries; any shared primitives shipped to `components/physics/_shared/`; spec 49/61 (80%); MemPalace log to `wing=physics, room=decisions, file=implementation_log_rt_session_5_schwarzschild_black_holes.md`.

## Next session after this

§11 Gravitational Waves + §12 Cosmology + §13 Frontiers (12 topics, FIG.50–61). Closes the relativity branch. After that, RT is shipped at 61/61 (100%) and the next branch to plan is Quantum Mechanics or Statistical Mechanics.
