Start RT Session 4 — ship §07 Curved Spacetime + Tensor Calculus + §08 Riemann Curvature + Einstein's Field Equations (10 topics, FIG.29–38). RELATIVITY branch is half-shipped (Sessions 1–3 closed SR fully — 28/61 = 46%; FIG.01–28 live). This is the fourth of six RT sessions; **Session 4 is the densest math of the entire branch — tensor calculus from manifolds → Christoffels → Riemann → Einstein's equations across 10 topics**. After this session, GR's mathematical machinery is fully built; Sessions 5+6 cash it out (Schwarzschild, black holes, GW, cosmology, frontiers). The pair this session — §07 (the math machinery without which §08 is unreadable) and §08 (the Riemann tensor → Einstein tensor → field equations → Newtonian limit chain) — is the GR-foundations module + the emotional apex `G_{μν} = (8πG/c⁴) T_{μν}`.

Spec: docs/superpowers/specs/2026-04-29-relativity-branch-design.md — READ §07 + §08 + Voice + Calculus policy + Integration checklist + Risk notes + Slug-collision watch first. Especially the calculus-policy section on tensor index notation escape rules and the Risk Notes call-out that **§07 is the densest math the site has shipped — test one representative covariant-derivative equation through the publish CLI before authoring all 5 §07 topics**.
Spec progress is 28/61 (46%) entering this session; update to 38/61 (62%) at session end.

Workflow: write Session 4 plan via /superpowers:writing-plans mirroring RT-Session-3 (5-wave structure: Wave 0 promote-to-live + types decision; Wave 1 seed-rt-04.ts with Riemann + Levi-Civita + ~14 glossary terms; **Wave 1.5 BUILD the ManifoldCanvas shared primitive — 5 §07 topics + likely 3+ §08 topics will amortize it; Session 3 log explicitly recommended this**; Wave 2 dispatch 10 parallel per-topic agents; Wave 2.5 orchestrator publish+commit FIG.29→38; Wave 3 seed + smoke + spec + MemPalace log). Then execute via /superpowers:subagent-driven-development token-saving variant, no per-task review. Pre-emit a scene-name lint at Wave 2 dispatch time per Session 3 log's `TwoRocketsScene` collision lesson.

Topics:
§07: manifolds-and-tangent-spaces, tensors-on-curved-space, the-metric-tensor, christoffels-and-parallel-transport (§07 money shot — spherical-triangle holonomy reveal), geodesics.
§08: the-riemann-tensor, ricci-and-the-einstein-tensor, the-stress-energy-tensor, einsteins-field-equations (§08 money shot — split-screen `G_{μν} = (8πG/c⁴) T_{μν}` with mass-density slider — emotional apex of the GR half), the-newtonian-limit.

New physicists: Bernhard Riemann (1826–1866) for §07.1 + §08.1; Tullio Levi-Civita (1873–1941) for §07.4 (parallel transport / connection). ~2 new entries; Élie Cartan optional (defer if §07 prose carries him as plain text). Hilbert + Klein already exist (used in §08.4 for the November-1915 publication-priority footnote).

New glossary terms (~14): manifold, tangent-space, metric-tensor, christoffel-symbols, parallel-transport, holonomy, geodesic-equation, riemann-tensor, ricci-tensor, ricci-scalar, einstein-tensor, stress-energy-tensor, einstein-field-equations, newtonian-limit. Decide at seed-write time whether `bianchi-identity` is its own term or absorbed into `einstein-tensor`'s description (default: absorbed).

Critical voice: §07 is the longest math sit-down of the branch — patient, careful, every tensor-index symbol explained in plain words on first introduction (per spec calculus policy). §07.5 geodesics is the geometric reveal that ties §06.4's "free-fall is the natural state" to §07's machinery. §08 is the dynamics emerging from the geometry — §08.4 einsteins-field-equations is the **emotional apex of the entire GR half**; same role §11.4 played in EM. Don't undersell. The closing of §08.5 the-newtonian-limit must show explicitly how `G_{μν} = (8πG/c⁴) T_{μν}` reduces to `∇²Φ = 4πGρ` (Poisson's equation) in the weak-field static-source limit, and then forward-link to §09.1 the-schwarzschild-metric as plain Markdown. The bridge from "the equations" to "the first exact solution."

Money shots:
— §07.4 christoffels-and-parallel-transport: vector parallel-transported along three sides of a spherical triangle (equator → 90°-meridian → equator), arriving rotated by an angle equal to the enclosed area. The holonomy reveal: curvature shows up as a rotation that flat spaces can't produce.
— §08.4 einsteins-field-equations: split-screen with matter distribution (mass sphere) on one side, Ricci-scalar curvature on the other, `G_{μν} = (8πG/c⁴) T_{μν}` between them. Slider on T (mass density); curvature responds in real time. The single most quoted equation in 20th-century physics, finally readable.

Honest moment: §07.5 geodesics — "What we called 'falling' is just following the straightest possible line in curved spacetime. The apple isn't pulled by a force; it's running along a geodesic. Newton's gravity wasn't wrong — it was the Newtonian limit of a deeper geometric statement, which §08.5 will recover explicitly."

Slug-collision watch:
— `gravitational-redshift` (RT Session 3 topic) is NOT a glossary slug yet. If a Wave 2 agent in §08 wants `<Term slug="gravitational-redshift">`, EITHER use plain Markdown link to /relativity/gravitational-redshift OR add the glossary entry as part of seed-rt-04 (small alias entry, safe).
— `manifold` could clash with future ML/AI usage — keep relativity-specific in the glossary entry.
— `riemann-tensor` vs `riemann-curvature-tensor` — settle on `riemann-tensor` for the glossary slug, `the-riemann-tensor` for the topic slug. Same kind-namespaced precedent as Sessions 1–3.
— `einstein-tensor` glossary slug + `einsteins-field-equations` topic slug — different roots, no collision.
— `einstein-field-equations` glossary slug vs `einsteins-field-equations` topic slug — different (one possessive, one not). Keep this distinction; cross-reference in glossary entry.

CRITICAL gotchas (carried forward from Sessions 1+3 — still active):
— `paragraphsToBlocks` MUST be flat string[] — copy verbatim from seed-rt-03.ts.
— HTML entities (`&gt;`, `&lt;`, `&amp;`) DON'T decode inside `$...$` math — use literal characters.
— `<Term>` and `<PhysicistLink>` MUST be inline in a paragraph, NEVER block-level.
— `\begin{pmatrix}`, `\begin{aligned}`, `\Lambda^\mu{}_\nu`, `\nabla_\mu T^{\mu\nu}` confirmed clean across Sessions 1–3 — use freely. **TEST a covariant-derivative equation `\\nabla_\\mu V^\\nu = \\partial_\\mu V^\\nu + \\Gamma^\\nu{}_{\\mu\\rho} V^\\rho` through `pnpm content:publish` BEFORE authoring §07's 5 topics** per spec Risk Notes — if it parses empty, fall back to `\begin{aligned}` per-line form for the rest of the session.
— Multi-line tensor-equation environments (Bianchi identities, Einstein-tensor derivation) may need single-line `$$...$$` per equation OR `\begin{aligned}` row form. Don't fight micromark; one EquationBlock per identity.
— Pre-emit a scene-name lint at Wave 2 dispatch — Session 3 hit `TwoRocketsScene` colliding with §02 velocity-addition; ManifoldCanvas-using scenes will tempt names like `SphereManifoldScene` that could clash. Cheap to prevent.
— Pre-existing dirty files (`components/layout/mobile-nav.tsx`, sometimes prompt.md) — DO NOT touch unless task-relevant.
— Branch is main; commit directly per `feedback_execution_style.md`. Token-saving variant of subagent-driven-development.

End-of-session deliverables: 10 topics live at FIG.29–38; Riemann + Levi-Civita in PHYSICISTS; ~14 glossary entries; ManifoldCanvas shared primitive shipped to `components/physics/_shared/`; spec 38/61 (62%); MemPalace log to `wing=physics, room=decisions, file=implementation_log_rt_session_4_tensor_calculus_efe.md`.

Next session after this: §09 Schwarzschild + Classical Tests + §10 Black Holes (11 topics, FIG.39–49). Densest visualization session of the branch — Schwarzschild metric, Mercury's perihelion (§09 money shot — rosette precession), light deflection, Shapiro delay, event horizon, Kerr ergosphere (§10 money shot — frame-dragging streamlines), Penrose diagrams, Hawking radiation. ManifoldCanvas built in Session 4 will pay off here.
