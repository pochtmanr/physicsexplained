# RT Session 2 — §03 Spacetime Geometry + §04 Relativistic Dynamics Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (token-saving variant per `feedback_execution_style.md`) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ship the canonical SR-finishing pair on `physics.explained` — §03 Spacetime Geometry (Minkowski's 1908 geometric reformulation) + §04 Relativistic Dynamics (the 1905 sequel paper: four-momentum → E=mc² → Compton → pair production). 10 topics, FIG.11–FIG.20. Spec progress moves 10/61 → 20/61 (33%); SR is half-done after this session.

**Architecture:** Five waves (Session 1's six minus Wave 1.5 — `SpacetimeDiagramCanvas` already exists and amortizes cleanly across §03.1–§03.5). Wave 0 = serial promote-to-live + types extension. Wave 1 = serial seed scaffold (Arthur Compton + ~17 glossary terms). Wave 2 = 10 parallel per-topic subagents. Wave 2.5 = orchestrator-serial registry-merge + publish + per-topic commit. Wave 3 = seed run + curl smoke + spec progress update + MemPalace log. Pattern matches RT Session 1, but Wave 0 is a tenth the size (no module-array creation, no 51-stub topic table, no branch flip — branch is already live).

**Tech Stack:** Next.js 15 (App Router), React 19, TypeScript strict, Tailwind v4, MDX (`@next/mdx`), Canvas 2D for visualizations, Supabase `content_entries` (project `cpcgkkedcfbnlfpzutrc`), Vitest, KaTeX via rehype-katex.

**Spec:** `docs/superpowers/specs/2026-04-29-relativity-branch-design.md` — read §03 + §04 + Voice + Calculus policy + Integration checklist + Risk notes + Slug-collision watch before starting.

**Prerequisite reading for subagents:**
- `docs/superpowers/plans/2026-04-29-relativity-session-1-sr-foundations.md` — the Session 1 plan to mirror (same wave structure, slimmer Wave 0).
- `docs/superpowers/plans/2026-04-25-electromagnetism-session-7-em-relativity.md` — earlier SR-prerequisite work; canonical four-vector / four-current treatments live in EM §11 and the cross-refs from RT §03.4 + RT §04.1 point at them.
- `scripts/content/seed-rt-01.ts` — copy helpers byte-for-byte (`paragraphsToBlocks`, `parseMajorWork`, source-hash idempotency main()). Don't paraphrase.
- MemPalace `wing=physics, room=decisions`: `implementation_log_rt_session_1_sr_foundations_kinematics.md` (especially: `\begin{pmatrix}` confirmed clean; HTML entities don't decode inside KaTeX `$...$`; `<Term>` JSX must be inline not block-level), `implementation_log_em_session_7_em_relativity.md` (four-vector / four-current canonical treatments), `feedback_execution_style.md` (token-saving subagent dispatch).

---

## File structure

### Modified files (Wave 0)
- `lib/content/branches.ts` — flip 10 entries (slugs `spacetime-diagrams` … `threshold-energy-and-pair-production`, lines 980–990) from `status: "coming-soon"` → `status: "live"`. No other field changes.
- `lib/physics/relativity/types.ts` — extend with `intervalSquared(p1, p2, c?)`, `LightConeQuadrant` union, `FourMomentum` alias, `restMass(fourMomentum, c?)` helper.
- `tests/physics/relativity/types.test.ts` — append tests for the new helpers.

### New files (Wave 1)
- `scripts/content/seed-rt-02.ts` — mirrors `seed-rt-01.ts` byte-for-byte on helpers; 1 physicist (Arthur Compton) + ~17 net new glossary terms; append `relatedTopics` to existing Einstein, Minkowski, Dirac, Poincaré, Feynman.

### Modified files (Wave 1)
- `lib/content/physicists.ts` — append Compton; append RT §03/§04 `relatedTopics` to existing Einstein, Minkowski, Dirac, Poincaré, Feynman.
- `lib/content/glossary.ts` — append ~17 net new structural entries (slugs only — prose ships in `seed-rt-02.ts`).

### New files (Wave 2 — 10 topics × 5 files = ~50 new files + ~30 simulation scenes)

Per-topic shape (substitute `<slug>` per topic):
- `lib/physics/relativity/<topic>.ts`
- `tests/physics/relativity/<topic>.test.ts`
- `components/physics/<topic>/<Scene1>.tsx` × 3 scenes per topic
- `app/[locale]/(topics)/relativity/<slug>/page.tsx`
- `app/[locale]/(topics)/relativity/<slug>/content.en.mdx`

Topic slugs (FIG.11–20):

§03 Spacetime Geometry:
- FIG.11 `spacetime-diagrams` (uses `SpacetimeDiagramCanvas`)
- FIG.12 `the-invariant-interval` (uses `SpacetimeDiagramCanvas`)
- FIG.13 `light-cones-and-causality` (uses `SpacetimeDiagramCanvas`)
- FIG.14 `four-vectors-and-proper-time` (§03 honest-moment apex)
- FIG.15 `the-twin-paradox` (§03 money shot; uses `SpacetimeDiagramCanvas` with `accelerated: true`)

§04 Relativistic Dynamics:
- FIG.16 `four-momentum` (densest LaTeX of session — μν index gymnastics)
- FIG.17 `mass-energy-equivalence` (§04 money shot — binding-energy curve)
- FIG.18 `relativistic-collisions`
- FIG.19 `compton-scattering`
- FIG.20 `threshold-energy-and-pair-production` (§04 closer; bridges to §05+§06)

### Modified files (Wave 2.5)
- `lib/content/simulation-registry.ts` — append ~30 new scene entries (10 topics × 3 scenes), one section per topic.

### Modified files (Wave 3)
- `docs/superpowers/specs/2026-04-29-relativity-branch-design.md` — flip 10 checkboxes; update Module status table; update header status line; update Total to 20/61 (33%).

---

## Wave 0 — Promote-to-live + types extension (1 subagent, serial)

**Single agent. ~5 min runtime.**

### Task 1: Flip §03+§04 topic statuses + extend types.ts

**Files:**
- Modify: `/Users/romanpochtman/Developer/physics/lib/content/branches.ts`
- Modify: `/Users/romanpochtman/Developer/physics/lib/physics/relativity/types.ts`
- Modify: `/Users/romanpochtman/Developer/physics/tests/physics/relativity/types.test.ts`

- [ ] **Step 1: Flip 10 RT §03+§04 topic statuses to live**

Open `lib/content/branches.ts`. Locate the 10 entries at lines 980–990 (their slugs are `spacetime-diagrams`, `the-invariant-interval`, `light-cones-and-causality`, `four-vectors-and-proper-time`, `the-twin-paradox`, `four-momentum`, `mass-energy-equivalence`, `relativistic-collisions`, `compton-scattering`, `threshold-energy-and-pair-production`). For each, change `status: "coming-soon"` → `status: "live"`. Leave every other field (slug, title, eyebrow, subtitle, readingMinutes, module) untouched.

Verify with grep:

```bash
grep -nE 'slug: "(spacetime-diagrams|the-invariant-interval|light-cones-and-causality|four-vectors-and-proper-time|the-twin-paradox|four-momentum|mass-energy-equivalence|relativistic-collisions|compton-scattering|threshold-energy-and-pair-production)"' lib/content/branches.ts
```

Expected: all 10 lines appear with `status: "live"`.

- [ ] **Step 2: Verify `getAdjacentTopics()` threads correctly after flip**

Read `lib/content/branches.ts` near the `getAdjacentTopics()` definition. The function iterates `BRANCHES` in order skipping `coming-soon` topics. After Wave 0:
- Last RT §02 topic = `relativistic-doppler` (FIG.10). Its `next` should resolve to `spacetime-diagrams` (FIG.11), not whatever §03/§04 topic it currently threads to.
- `threshold-energy-and-pair-production` (FIG.20) should have `next: null` — no live branch follows (Thermo/Quantum/Modern still `coming-soon`).

No code changes expected — just a mental walk-through. If the function uses `topic.status === "live"` filtering, the flip in Step 1 is sufficient.

- [ ] **Step 3: Extend `lib/physics/relativity/types.ts`**

Open the file. After the existing `vec4ToPoint` export (last function), append:

```typescript
/** Quadrant classification of a Minkowski-interval relationship. */
export type LightConeQuadrant =
  | "timelike-future"
  | "timelike-past"
  | "spacelike"
  | "null-future"
  | "null-past"
  | "origin";

/** Minkowski norm-squared (mostly-minus signature) of a Vec4 (ct, x, y, z) or
 *  a four-momentum (E/c, p_x, p_y, p_z). Single source of truth — both
 *  four-vectors.ts and four-momentum.ts import from here, no duplicates. */
export function minkowskiNormSquared(v: Vec4): number {
  return v[0] * v[0] - v[1] * v[1] - v[2] * v[2] - v[3] * v[3];
}

/** Squared invariant interval s² = c²Δt² − Δx² − Δy² − Δz² between two events.
 *  Sign convention: timelike s² > 0, spacelike s² < 0, null s² = 0 (mostly-plus on the time component). */
export function intervalSquared(p1: MinkowskiPoint, p2: MinkowskiPoint, c: number): number {
  const dt = p1.t - p2.t;
  const dx = p1.x - p2.x;
  const dy = p1.y - p2.y;
  const dz = p1.z - p2.z;
  return c * c * dt * dt - dx * dx - dy * dy - dz * dz;
}

/** Classify the relationship between two events. `eps` is the absolute tolerance for null. */
export function classifyInterval(p1: MinkowskiPoint, p2: MinkowskiPoint, c: number, eps = 1e-12): LightConeQuadrant {
  const s2 = intervalSquared(p1, p2, c);
  const dt = p2.t - p1.t;
  if (Math.abs(s2) < eps && Math.abs(dt) < eps) return "origin";
  if (Math.abs(s2) < eps) return dt > 0 ? "null-future" : "null-past";
  if (s2 > 0) return dt > 0 ? "timelike-future" : "timelike-past";
  return "spacelike";
}

/** Semantic alias: a four-momentum is just a Vec4 with components (E/c, px, py, pz). */
export type FourMomentum = Vec4;

/** Rest mass m₀ recovered from a FourMomentum p^μ via the invariant
 *  m²c² = (E/c)² − |p|² (Griffiths convention). Returns m in kg if p is in SI units. */
export function restMass(p: FourMomentum, c: number): number {
  const E_over_c = p[0];
  const pSq = p[1] * p[1] + p[2] * p[2] + p[3] * p[3];
  const m2c2 = E_over_c * E_over_c - pSq;
  if (m2c2 < 0) {
    throw new RangeError(`restMass: spacelike four-momentum (m²c² = ${m2c2} < 0)`);
  }
  return Math.sqrt(m2c2) / c;
}
```

- [ ] **Step 4: Append tests to `tests/physics/relativity/types.test.ts`**

Open the test file. After the existing `pointToVec4 / vec4ToPoint round trip` describe block, append:

```typescript
import { intervalSquared, classifyInterval, restMass } from "@/lib/physics/relativity/types";
import type { FourMomentum } from "@/lib/physics/relativity/types";

describe("intervalSquared", () => {
  const c = 1; // natural units for the algebra checks
  it("vanishes for two coincident events", () => {
    const p = { t: 0.5, x: 0.2, y: -0.3, z: 1.7 };
    expect(intervalSquared(p, p, c)).toBeCloseTo(0, 12);
  });

  it("is positive for timelike separation", () => {
    const p1 = { t: 0, x: 0, y: 0, z: 0 };
    const p2 = { t: 2, x: 1, y: 0, z: 0 };
    expect(intervalSquared(p1, p2, c)).toBeCloseTo(3, 8); // 4 − 1 = 3
  });

  it("is negative for spacelike separation", () => {
    const p1 = { t: 0, x: 0, y: 0, z: 0 };
    const p2 = { t: 1, x: 2, y: 0, z: 0 };
    expect(intervalSquared(p1, p2, c)).toBeCloseTo(-3, 8); // 1 − 4 = −3
  });

  it("vanishes on the light cone", () => {
    const p1 = { t: 0, x: 0, y: 0, z: 0 };
    const p2 = { t: 5, x: 5, y: 0, z: 0 };
    expect(intervalSquared(p1, p2, c)).toBeCloseTo(0, 8);
  });
});

describe("classifyInterval", () => {
  const c = 1;
  it("classifies timelike-future", () => {
    expect(classifyInterval({ t: 0, x: 0, y: 0, z: 0 }, { t: 2, x: 1, y: 0, z: 0 }, c)).toBe("timelike-future");
  });
  it("classifies timelike-past", () => {
    expect(classifyInterval({ t: 2, x: 1, y: 0, z: 0 }, { t: 0, x: 0, y: 0, z: 0 }, c)).toBe("timelike-past");
  });
  it("classifies spacelike", () => {
    expect(classifyInterval({ t: 0, x: 0, y: 0, z: 0 }, { t: 1, x: 2, y: 0, z: 0 }, c)).toBe("spacelike");
  });
  it("classifies null-future on the light cone", () => {
    expect(classifyInterval({ t: 0, x: 0, y: 0, z: 0 }, { t: 5, x: 5, y: 0, z: 0 }, c)).toBe("null-future");
  });
});

describe("restMass", () => {
  it("recovers electron rest mass from its four-momentum at rest (E = mc², p = 0)", () => {
    const c = 2.99792458e8;
    const m = 9.1093837015e-31; // electron mass kg
    const E = m * c * c;
    const p: FourMomentum = [E / c, 0, 0, 0];
    // m is ~9e-31 kg; relative tolerance < 1e-12 of that is comfortably within double precision.
    expect(restMass(p, c) / m).toBeCloseTo(1, 12);
  });

  it("vanishes for a photon (null four-momentum)", () => {
    const c = 1;
    const p: FourMomentum = [1, 1, 0, 0]; // E/c = px = 1
    expect(restMass(p, c)).toBeCloseTo(0, 12);
  });

  it("throws on a spacelike four-momentum", () => {
    const c = 1;
    const p: FourMomentum = [1, 2, 0, 0]; // E²/c² − p² = 1 − 4 = −3 < 0
    expect(() => restMass(p, c)).toThrow(RangeError);
  });
});
```

- [ ] **Step 5: Run typecheck + tests**

```bash
pnpm tsc --noEmit
pnpm vitest run tests/physics/relativity/types.test.ts
```

Expected: clean tsc; existing 12 tests + new ~11 = ~23 tests, all green. If any literal arithmetic in the new tests fails, RECOMPUTE — Session 1 documented "treat plan literals with light scrutiny." The intent of each test is clear from the comments; trust the intent over the literal if they disagree.

- [ ] **Step 6: Commit**

```bash
git add lib/content/branches.ts lib/physics/relativity/types.ts tests/physics/relativity/types.test.ts
git commit -m "$(cat <<'EOF'
feat(rt/§03-§04): promote 10 topics to live, extend types with interval + four-momentum helpers

Flips 10 RT §03+§04 topic entries (FIG.11–FIG.20) from coming-soon to
live in lib/content/branches.ts. Spec progress: 10/61 → 20/61 staging.

Extends lib/physics/relativity/types.ts with:
  - intervalSquared(p1, p2, c) — Minkowski-metric scalar
  - classifyInterval / LightConeQuadrant — timelike/spacelike/null taxonomy
  - FourMomentum alias for Vec4
  - restMass(fourMomentum, c) — invariant rest-mass extraction

These are the helpers Wave 2 §03.2, §03.3, §03.4, §04.1, §04.5 import.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Wave 1 — Seed scaffold for Compton + glossary (1 subagent, serial)

**Single agent. Builds the seed script ONLY — does not run it (Wave 3 runs it).**

### Task 2: Scaffold seed-rt-02.ts

**Files:**
- Create: `/Users/romanpochtman/Developer/physics/scripts/content/seed-rt-02.ts`
- Modify: `/Users/romanpochtman/Developer/physics/lib/content/physicists.ts`
- Modify: `/Users/romanpochtman/Developer/physics/lib/content/glossary.ts`

- [ ] **Step 1: Read the precedent seed script verbatim**

Read `scripts/content/seed-rt-01.ts` end to end. Note: `PhysicistSeed` and `GlossarySeed` interfaces (lines 8–31), `parseMajorWork` and `paragraphsToBlocks` helpers (lines 33–45), main() loop with pre-fetch source-hash idempotency (lines ~210–340). **Copy these helpers byte-for-byte into `seed-rt-02.ts` — do not paraphrase.** RT Session 1 + EM Session 7 documented the lesson: paraphrasing `paragraphsToBlocks` introduces a renderer-incompatible block shape that 500s the page until corrected.

- [ ] **Step 2: Append Arthur Compton to PHYSICISTS**

Open `lib/content/physicists.ts`. Append after the existing entries (insertion point: end of array, before the closing `];`):

```typescript
{
  slug: "arthur-compton",
  born: "1892",
  died: "1962",
  nationality: "American",
  image: storageUrl("physicists/arthur-compton.avif"),
  relatedTopics: [
    { branchSlug: "relativity", topicSlug: "compton-scattering" },
    { branchSlug: "relativity", topicSlug: "four-momentum" },
  ],
},
```

**Decision: skip Carl Anderson for this session.** Default per prompt.md: Anderson optional. Dirac (existing) absorbs the §04.5 link via `relatedTopics` append. If Wave 2 §04.5 author flags during execution that the muon-vs-positron parallel demands Anderson as a distinct figure, flag for follow-up — do not split this session.

The image path follows the established convention `storageUrl("physicists/<slug>.avif")`. If the image file does not exist in storage at seed-run time, the fallback rendering is a placeholder; this is acceptable and unblocking — Roman uploads physicist portraits separately. Match the same shape as `albert-einstein` (line 365) for the image field.

- [ ] **Step 3: Append `relatedTopics` to existing physicists**

For each existing PHYSICISTS entry, append the listed `relatedTopics` to the array. Locate by slug; do not duplicate entries that may already point at one of these topic slugs.

- `albert-einstein` (line 361): append
  - `{ branchSlug: "relativity", topicSlug: "mass-energy-equivalence" }`
  - `{ branchSlug: "relativity", topicSlug: "relativistic-collisions" }`
- `hermann-minkowski` (line 1062): append
  - `{ branchSlug: "relativity", topicSlug: "spacetime-diagrams" }`
  - `{ branchSlug: "relativity", topicSlug: "the-invariant-interval" }`
  - `{ branchSlug: "relativity", topicSlug: "light-cones-and-causality" }`
  - `{ branchSlug: "relativity", topicSlug: "four-vectors-and-proper-time" }`
- `paul-dirac` (line 1051): append
  - `{ branchSlug: "relativity", topicSlug: "threshold-energy-and-pair-production" }`
- `henri-poincare` (line 183): append
  - `{ branchSlug: "relativity", topicSlug: "the-invariant-interval" }`
- `richard-feynman` (line 1106): append
  - `{ branchSlug: "relativity", topicSlug: "four-vectors-and-proper-time" }`

- [ ] **Step 4: Append glossary structural entries to GLOSSARY**

Open `lib/content/glossary.ts`. Verify-then-append (insertion point: end of array, before the closing `];`). Each new entry has only structural fields here (slug, term, category, optional `relatedPhysicists`, `relatedTopics`); the prose `description` ships in `seed-rt-02.ts` Step 5. Match the EXACT shape of any RT Session 1 glossary entry by reading lines around `slug: "time-dilation"` (line 2731). Each new entry should have the bare minimum: `slug`, `category`, `relatedPhysicists` (if any), `relatedTopics` (the topic the term first appears in, plus close cousins).

§03 NEW (8 terms):
- `spacetime` (concept)
- `world-line` (concept)
- `proper-time` (concept)
- `invariant-interval` (concept)
- `light-cone` (concept)
- `spacelike` (concept)
- `timelike` (concept)
- `null-interval` (concept)

§04 NEW (9 terms):
- `four-momentum` (concept)
- `four-velocity` (concept)
- `four-acceleration` (concept)
- `four-force` (concept)
- `rest-energy` (concept)
- `mass-energy-equivalence` (concept)
- `threshold-energy` (concept)
- `pair-production` (phenomenon)
- `compton-shift` (phenomenon)

**Total 17 net new.** Skip:
- `four-vector` — already exists at glossary.ts:2519 from EM §11.
- `lorentz-factor` — confirmed missing per RT Session 1 grep, but every RT §03/§04 topic that uses it can `<Term>` reference what's already in EM-Session-7's contributions if a slug surfaces; if it surfaces as missing in Wave 2, add via post-seed patch.
- `e-mc-squared` — duplicates `mass-energy-equivalence`. If Wave 2 §04.2 author flags they used `<Term slug="e-mc-squared">` in prose, add as a brief alias-only entry in Wave 3 forward-ref scan.
- `rapidity` — defer. If Wave 2 §03.4 author leans on hyperbolic-rotation parametrization (`tanh η = β`) and uses `<Term slug="rapidity">`, add as a forward-ref placeholder in Wave 3.

**SLUG-COLLISION DEFENCE:** the topic slug `four-momentum` (FIG.16) and the glossary slug `four-momentum` are intentionally identical. This is the same coexistence pattern as RT Session 1's `time-dilation` (topic slug + glossary slug) — it works cleanly because `content_entries` rows are keyed on `(kind, slug, locale)`, so `kind="topic"` and `kind="glossary"` rows live in different namespaces. Same pattern for `mass-energy-equivalence`. **Do NOT add a `-term` suffix.** RT Session 1 confirmed this coexistence works; Session 2 follows.

Also continue Lorenz/Lorentz spelling discipline. Verify by grep:

```bash
grep -nE 'lorentz|lorenz' lib/content/glossary.ts | head
```

Right state after Step 4: `lorenz-gauge` (existing, untouched, no T) + `lorentz-transformation` (existing from RT Session 1, with T) + the 17 new RT §03/§04 entries. No new Lorenz/Lorentz entries this session.

- [ ] **Step 5: Author `seed-rt-02.ts`**

Mirror `seed-rt-01.ts` structure exactly. Skeleton:

```typescript
// Seed RT §03 Spacetime Geometry + §04 Relativistic Dynamics
// 1 physicist (Arthur Compton) + 17 new structural glossary terms
// Run: pnpm exec tsx --conditions=react-server scripts/content/seed-rt-02.ts
import "dotenv/config";
import { createHash } from "node:crypto";
import { getServiceClient } from "@/lib/supabase-server";

interface PhysicistSeed { /* … copy from seed-rt-01 verbatim … */ }
interface GlossarySeed { /* … copy from seed-rt-01 verbatim … */ }
function parseMajorWork(s: string) { /* … copy verbatim … */ }
function paragraphsToBlocks(text: string) { /* … copy VERBATIM — flat string[] inlines … */ }

const PHYSICISTS: PhysicistSeed[] = [
  {
    slug: "arthur-compton",
    name: "Arthur Holly Compton",
    shortName: "Compton",
    born: "1892",
    died: "1962",
    nationality: "American",
    oneLiner: "American physicist, Nobel 1927. His 1923 X-ray-scattering experiment showed photons carry momentum p = h/λ and behave as particles in elastic collisions with electrons — completing the photon's mechanical legitimacy that Einstein's 1905 photoelectric paper had only hinted at. Later led the Manhattan Project's plutonium-production work at the Met Lab.",
    bio: `Arthur Holly Compton was born in Wooster, Ohio, in 1892, the son of a Presbyterian minister and college dean. He studied at the College of Wooster (BS 1913) and Princeton (PhD 1916, working on X-ray reflection from crystals), then took a research fellowship at the Cavendish Laboratory in Cambridge in 1919–1920 under J. J. Thomson and Ernest Rutherford. Returning to the United States, he joined Washington University in St. Louis in 1920, where over the next three years he carried out the experiments that would change the status of the photon.

By 1922 the wave nature of light was experimentally settled. Photons — Einstein's 1905 light quanta — were a theoretical proposal whose mechanical legitimacy was contested. Compton scattered monochromatic Mo Kα X-rays (λ ≈ 0.071 nm) off a graphite target and measured the wavelength of the scattered radiation as a function of scattering angle θ. He found the wavelength shifted: Δλ = λ' − λ = (h/m_e c)(1 − cos θ). The shift is angle-dependent and independent of the incident wavelength — exactly what falls out if one treats the photon as a particle with momentum p = h/λ and applies relativistic energy-momentum conservation to a billiard-ball collision with an electron. Classical wave theory predicted no wavelength shift at all. Compton's 1923 paper in *The Physical Review* was the experiment that finally established the photon as a mechanically legitimate particle. He shared the 1927 Nobel Prize with C. T. R. Wilson, whose cloud chamber had made the recoil electrons visible.

Compton's later career was dominated by World War II. From 1941 he led the Met Lab at the University of Chicago — the Manhattan Project arm responsible for plutonium production. He was the senior figure who hired Enrico Fermi, oversaw the construction of CP-1 (the world's first artificial nuclear reactor, achieving criticality on December 2, 1942), and managed the scale-up to the Hanford production reactors. After the war he served as chancellor of Washington University (1945–1953) and continued teaching there until his death in 1962. His monograph *X-rays and Electrons* (1926) and the late-career *Atomic Quest* (1956) bookend a career that began at the foundation of quantum kinematics and ended at the engineering of plutonium.`,
    contributions: [
      "1923 Compton effect — wavelength shift Δλ = (h/m_e c)(1 − cos θ) of X-rays scattered off electrons; the experiment that established photons as mechanically legitimate particles.",
      "Nobel Prize in Physics 1927 (shared with C. T. R. Wilson) — for the discovery of the effect named after him.",
      "Compton wavelength of the electron λ_C = h/(m_e c) ≈ 2.426 × 10⁻¹² m — the natural scattering length scale.",
      "1941–1945 director of the Manhattan Project's Met Lab at the University of Chicago — hired Fermi; oversaw CP-1 (first artificial reactor, 1942); scaled up to the Hanford plutonium-production reactors.",
      "Chancellor of Washington University in St. Louis, 1945–1953.",
    ],
    majorWorks: [
      "A Quantum Theory of the Scattering of X-rays by Light Elements (1923) — *Physical Review* paper deriving and confirming the Compton wavelength shift; the experimental foundation for photon mechanics.",
      "X-rays and Electrons (1926) — monograph synthesising the quantum kinematics of X-ray scattering; standard graduate-level reference for the next two decades.",
      "Atomic Quest: A Personal Narrative (1956) — late-career memoir of the Manhattan Project from the Met Lab perspective.",
    ],
    relatedTopics: [
      { branchSlug: "relativity", topicSlug: "compton-scattering" },
      { branchSlug: "relativity", topicSlug: "four-momentum" },
    ],
  },
];

const GLOSSARY: GlossarySeed[] = [
  // RT §03 ────────────────────────────────────────────────────────────────
  // 8 entries here: spacetime, world-line, proper-time, invariant-interval,
  // light-cone, spacelike, timelike, null-interval.
  // Each: shortDefinition ≤ 1 sentence; description 150–250 words, 1–2
  // paragraphs; relatedPhysicists; relatedTopics.
  // RT §04 ────────────────────────────────────────────────────────────────
  // 9 entries: four-momentum, four-velocity, four-acceleration, four-force,
  // rest-energy, mass-energy-equivalence, threshold-energy, pair-production,
  // compton-shift.
  // … fill in each per the prose guidelines below …
];

async function main() { /* … copy from seed-rt-01 verbatim — pre-fetch hash check, upsert, count inserted vs updated, log … */ }

main().catch((err) => { console.error(err); process.exit(1); });
```

**The full GLOSSARY array prose guidelines.** For each of the 17 entries, write 150–250 words of `description`, 1–2 paragraphs. Lean factual, no padding. Mirror voice from `seed-rt-01.ts` glossary entries (e.g., `lorentz-transformation` at lines ~167–182 — the disambiguation paragraph is the model for terms with historical pedigree). For each:
- `shortDefinition` ≤ 1 sentence.
- `description` 150–250 words, 1–2 paragraphs separated by `\n\n`.
- `relatedPhysicists` — slugs of relevant existing entries.
- `relatedTopics` — branch + topic slug pairs.
- `category` per the per-slug list in Step 4.

Per-slug content sketches (use as prompts; expand to full prose):

§03:
- **`spacetime`** — Minkowski's 1908 reformulation of SR as 4D pseudo-Euclidean geometry; quote Minkowski's "Henceforth space by itself, and time by itself, are doomed to fade away…" Cologne lecture; clarify that spacetime is a stage on which events live, not a substance.
- **`world-line`** — the worldline of a particle is the locus of events it occupies in spacetime; massive particles have timelike worldlines; photons have null worldlines; tachyons would have spacelike worldlines (and don't exist); proper time is the arc length along a timelike worldline in the Minkowski metric.
- **`proper-time`** — `dτ = dt/γ` integrated along a worldline; the time elapsed on a clock carried along that worldline; invariant under Lorentz transformations; the geometric content of time dilation.
- **`invariant-interval`** — the Lorentz scalar `s² = c²Δt² − Δx² − Δy² − Δz²`; preserved under Lorentz boosts and rotations; the SR analogue of Euclidean distance; sign distinguishes timelike (s² > 0), spacelike (s² < 0), null (s² = 0).
- **`light-cone`** — the locus of events null-separated from a given event, forming a 4D double cone; the boundary between causally accessible and causally inaccessible regions; everything inside is timelike (causal), everything outside is spacelike (uncorrelated).
- **`spacelike`** — interval s² < 0; events spacelike-separated cannot be causally connected; their temporal order is frame-dependent; the relativity of simultaneity lives here.
- **`timelike`** — interval s² > 0; events timelike-separated CAN be causally connected; their temporal order is frame-independent (timelike future and timelike past are absolute).
- **`null-interval`** — interval s² = 0; the path of light; the boundary on which signals propagate at c; both timelike and spacelike limits.

§04:
- **`four-momentum`** — the canonical SR-dynamics object `p^μ = (E/c, p_x, p_y, p_z)`; transforms as a Lorentz four-vector; norm-squared `p^μ p_μ = (E/c)² − |p|² = m²c²` is the energy-momentum-mass invariant; conserved in collisions.
- **`four-velocity`** — `u^μ = dx^μ/dτ = γ(c, v_x, v_y, v_z)`; the tangent vector to a timelike worldline parametrized by proper time; norm `u^μ u_μ = c²` (a constant of motion in any frame).
- **`four-acceleration`** — `a^μ = du^μ/dτ`; orthogonal to four-velocity (`a^μ u_μ = 0`) along any worldline; the relativistic generalisation of acceleration; non-zero only on accelerated (non-geodesic) worldlines.
- **`four-force`** — `F^μ = dp^μ/dτ = m·a^μ` for massive particles; the time-component is power transferred (rate of energy change); the spatial components are the relativistic generalisation of Newton's force; reduces to Newtonian force at low β.
- **`rest-energy`** — `E_0 = mc²`; the energy a massive particle has in its rest frame; the spatial part of the four-momentum vanishes in this frame, leaving E_0 as the only nonzero component (times c).
- **`mass-energy-equivalence`** — Einstein's 1905 sequel-paper result that mass m and energy E are the same physical quantity expressed in different units, with `c²` as the conversion factor; binding energies and kinetic energies show up on a balance as mass; the foundation of stellar fusion, nuclear fission, and particle production.
- **`threshold-energy`** — the minimum incoming particle energy needed to produce a given set of final-state particles in a collision; for pair production from a single photon (γ → e⁺ + e⁻ in vacuum), no threshold suffices because four-momentum conservation forbids it; with a third body, threshold is `2m_e c² = 1.022 MeV`.
- **`pair-production`** — the conversion of energy into matter-antimatter pairs (most commonly γ + nucleus → e⁺ + e⁻ + nucleus); requires energy ≥ `2m_e c²` and a third body (nucleus) to absorb momentum; first observed by Carl Anderson in 1932 cloud-chamber tracks of cosmic-ray-induced pairs, confirming Dirac's 1928 prediction.
- **`compton-shift`** — the wavelength shift `Δλ = (h/m_e c)(1 − cos θ)` of light scattered off electrons; angle-dependent, independent of incident wavelength; first measured by Arthur Compton in 1923 with X-rays on graphite; established photons as mechanically legitimate particles.

For each entry, set `relatedPhysicists` to the obvious credit (e.g., `["hermann-minkowski"]` for `spacetime`, `world-line`, `proper-time`, `invariant-interval`, `light-cone`, `spacelike`, `timelike`, `null-interval`; `["albert-einstein"]` for `mass-energy-equivalence`, `four-momentum`; `["arthur-compton"]` for `compton-shift`; `["paul-dirac", "arthur-compton"]` for `pair-production` if Anderson stays out; etc.). Set `relatedTopics` to the §03/§04 topics where the term first appears, plus close cousins from RT §02 where natural (e.g., `proper-time` → relatedTopics: `four-vectors-and-proper-time`, `the-twin-paradox`, `time-dilation`).

- [ ] **Step 6: Run a dry-test — make sure the file parses + tsc clean**

```bash
pnpm tsc --noEmit
```

Do NOT run the seed yet. Wave 3 runs it.

- [ ] **Step 7: Commit**

```bash
git add lib/content/physicists.ts lib/content/glossary.ts scripts/content/seed-rt-02.ts
git commit -m "$(cat <<'EOF'
feat(rt/§03-§04): scaffold seed-rt-02 — Compton, glossary, related-topic links

Adds Arthur Compton (Anderson deferred — Dirac existing entry absorbs
§04.5 link). Appends RT §03/§04 relatedTopics to existing Einstein
(+2), Minkowski (+4), Dirac (+1), Poincaré (+1), Feynman (+1).

Adds 17 net new glossary structural entries:
  §03: spacetime, world-line, proper-time, invariant-interval,
       light-cone, spacelike, timelike, null-interval.
  §04: four-momentum, four-velocity, four-acceleration, four-force,
       rest-energy, mass-energy-equivalence, threshold-energy,
       pair-production, compton-shift.
Skips four-vector (already from EM §11). Topic slugs four-momentum +
mass-energy-equivalence intentionally coexist with glossary slugs of
the same name (kind-namespaced; same pattern as time-dilation).

Authors scripts/content/seed-rt-02.ts mirroring seed-rt-01.ts byte-for-
byte on helpers (paragraphsToBlocks copied verbatim per Session 1
lesson). NOT executed yet — Wave 3 runs the seed.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Wave 1.5 — SKIP (decision documented)

**Decision: skip — `SpacetimeDiagramCanvas` already exists** (shipped Wave 1.5 of RT Session 1, commit f5da3c7). All 5 of §03's topics consume it directly via the established API; no primitive changes needed. None of §04's collision-diagram topics share a clean enough idiom to justify a `CollisionFourVectorCanvas` primitive — 3 of 5 §04 topics involve collision diagrams (§04.3, §04.4, §04.5), below the EM CircuitCanvas (7-topic) amortization threshold. Each §04 collision scene rolls its own inline Canvas 2D — same pattern as EM Session 4's RC-circuit one-offs.

Document the deferral in Wave 3's MemPalace log.

---

## Wave 2 — Per-topic authoring (10 parallel subagents)

**Dispatch ALL 10 in a single message** with multiple Agent tool calls in parallel. Each subagent runs to completion independently.

### Shared instructions for every Wave 2 task

These instructions are identical across all 10 topic tasks. Copy them into each agent's prompt verbatim.

**Parallel-safety contract (DO NOT VIOLATE):**

1. **DO NOT touch `lib/content/simulation-registry.ts`.** Return the 3 entries the orchestrator needs to append, in this exact format inside your final report:

```
REGISTRY_BLOCK:
  // RT §0X — <slug>
  <SceneOneName>: lazyScene(() =>
    import("@/components/physics/<slug>/<scene-one-name>-scene").then((m) => ({ default: m.<SceneOneName> })),
  ),
  <SceneTwoName>: lazyScene(() =>
    import("@/components/physics/<slug>/<scene-two-name>-scene").then((m) => ({ default: m.<SceneTwoName> })),
  ),
  <SceneThreeName>: lazyScene(() =>
    import("@/components/physics/<slug>/<scene-three-name>-scene").then((m) => ({ default: m.<SceneThreeName> })),
  ),
```

2. **DO NOT publish.** Do not run `pnpm content:publish`. The orchestrator publishes per-topic in Wave 2.5.
3. **DO NOT commit.** The orchestrator commits per-topic in Wave 2.5.
4. **`<Term slug="...">` MUST refer to a slug that exists in `lib/content/glossary.ts`** as of Wave 1's commit. Topic slugs are NOT auto-resolved as glossary terms. Glossary entries available after Wave 1 (relevant new ones for §03/§04): `spacetime`, `world-line`, `proper-time`, `invariant-interval`, `light-cone`, `spacelike`, `timelike`, `null-interval`, `four-momentum`, `four-velocity`, `four-acceleration`, `four-force`, `rest-energy`, `mass-energy-equivalence`, `threshold-energy`, `pair-production`, `compton-shift`. Plus from EM §11: `four-vector`, `gauge-transformation`, `four-current`, `four-potential`. Plus from RT Session 1: `time-dilation`, `length-contraction`, `lorentz-transformation`, `velocity-addition-relativistic`, `relativistic-doppler`, `transverse-doppler`, `galilean-invariance`, `aether-luminiferous`, `two-postulates`, `simultaneity-relative`. If a needed term is missing, either author plain text OR include the slug in your final report under `MISSING_TERMS:` so the orchestrator can patch the seed before Wave 3.
5. **`<PhysicistLink slug="...">` MUST refer to a slug that exists in `lib/content/physicists.ts`.** Arthur Compton is added in Wave 1; Albert Einstein, Hermann Minkowski, Paul Dirac, Henri Poincaré, Richard Feynman are pre-existing. Anyone else: plain text only. **Anderson is NOT added** — refer to him as plain text.
6. **`<Term slug="..." />` and `<PhysicistLink slug="..." />` MUST be inline inside a paragraph, NOT block-level standalone JSX nodes** (Session 1 §01.5 lesson — `<Term>` between blank lines at section level throws "unknown top-level JSX: <Term>" at MDX parse time). Embed every cross-ref node inside prose.

**Vertical slice every agent ships:**

1. `lib/physics/relativity/<topic>.ts` — pure TS, no React. Imports from `@/lib/physics/constants` (`SPEED_OF_LIGHT` always; `PLANCK_CONSTANT`, `H_BAR`, `ELECTRON_MASS` for §04.4 and §04.5) and `@/lib/physics/relativity/types`.
2. `tests/physics/relativity/<topic>.test.ts` — vitest. 6–12 test cases covering known-value spot checks, limit cases, and at least one invariant check (Lorentz-invariance for §03; conservation for §04 collision topics).
3. 3 simulation components in `components/physics/<topic>/`:
   - File names: `<scene-one-name>-scene.tsx`, etc. (kebab-case file → PascalCase export). PascalCase export name MUST be a valid JS identifier (no leading digits — Session 1 §02.3 had `4x4-matrix-scene.tsx` exporting `LorentzMatrixScene`).
   - Each is `"use client"`, imports React + `useRef`/`useEffect`/`useState` as needed.
   - **§03 topics** use the shared `SpacetimeDiagramCanvas` (`@/components/physics/_shared` index) for any Minkowski-diagram visualization. Wrap it in a topic-specific Scene component that constructs the `worldlines` array internally and passes the appropriate `lightCone`/`simultaneitySlice`/`boostBeta` props.
   - **§04 topics** typically use Canvas 2D for collision diagrams (no shared primitive). Match scene-color conventions: cyan/blue for stationary frame; magenta/red for boosted frame; amber for light/photon; orange for accelerated worldlines (§03.5 only); green-cyan for created particle pairs (§04.5).
   - Style: dark canvas (`bg-black/40` or `bg-[#0A0C12]`), HUD overlay with `font-mono text-xs text-white/70`.
4. `app/[locale]/(topics)/relativity/<slug>/page.tsx` — copy from any live RT topic (e.g., `app/[locale]/(topics)/relativity/the-lorentz-transformation/page.tsx`) verbatim and change ONLY the `SLUG` constant to `relativity/<topic-slug>`.
5. `app/[locale]/(topics)/relativity/<slug>/content.en.mdx` — compose from `<TopicPageLayout aside={[...]}>`, `<TopicHeader>`, numbered `<Section>`s, `<SceneCard>`, `<EquationBlock id="EQ.0X">$$ … $$</EquationBlock>` (CHILDREN form, single-backslash LaTeX), `<Callout variant="intuition|math|warning">`s, inline `<PhysicistLink>` and `<Term>`. Target word count: 1000–1400 per topic; §04.1 and §04.2 may run 1300–1500 (densest physics).

**SceneCard convention** (per RT Session 1 lesson + `scripts/content/parse-mdx.ts:181–202`): the registry key for a scene is the first-child JSX element name inside `<SceneCard>`, NOT a `component=` prop. Pattern:

```mdx
<SceneCard>
  <FourMomentumGeometryScene />
</SceneCard>
```

Don't use `<SceneCard component="FourMomentumGeometryScene" props={...}>`. Props are passed as JSX attributes on the inner element.

**MDX gotchas (carry forward all six from Session 1):**
- (i) NO nested JSX in `title="..."` attributes — keep human/term links to body prose.
- (ii) Multi-line `$$ ... \\\\<newline> ... $$` LaTeX may choke micromark — collapse to single-line `$$...$$` per equation, or break across multiple `<EquationBlock>`s.
- (iii) Bare `<` in prose can parse as JSX tag opener — escape as `&lt;` or reword.
- (iv) `<EquationBlock>$$...$$</EquationBlock>` uses CHILDREN form — single-backslash LaTeX (`\beta`, `\gamma`, `\Lambda^\mu{}_\nu`). Only the `tex={\`...\`}` template-literal prop form requires double-backslash.
- (v) HTML entities (`&gt;`, `&lt;`, `&amp;`) DO NOT decode inside `$...$` or `$$...$$` — KaTeX rejects them with "Expected 'EOF', got '&'." Use literal `>`, `<`, `&` characters inside math; KaTeX handles them natively. The JSX-tag risk applies only to bare prose, NOT to math context.
- (vi) `<Term>` and `<PhysicistLink>` MUST be inline inside a paragraph, NEVER block-level. Embed inside prose, not standalone between blank lines.

**LaTeX risk this session: §04.1 four-momentum.** The energy-momentum-mass triangle, μν index gymnastics, and the four-vector dot product `p^μ p_μ = m²c²` are the densest equations of the session. `\begin{pmatrix}` is now confirmed clean per Session 1 §02.3. Use freely. Lower-index forms `p_\mu`, raised-and-lowered `\Lambda^\mu{}_\nu`, and contractions `g_{\mu\nu} p^\mu p^\nu` are all expected. If any `pmatrix` or contraction parses empty at Wave 2.5 publish, fall back to `\begin{aligned} E &= ... \\\\ p &= ... \end{aligned}` row-stacked form.

**Voice (per spec + prompt.md "Voice reminder"):**
- §03 is the geometric reveal. The algebra of §02 was geometry all along. Minkowski 1908: "Henceforth space by itself, and time by itself, are doomed to fade away into mere shadows, and only a kind of union of the two will preserve an independent reality." Open §03.1 with this as the hook (Cologne lecture context).
- §03.4 is the honest-moment apex: insert a `<Callout variant="intuition">` after the four-velocity / proper-time integral derivation. The reader should feel the §02 algebra collapse into one geometric object. "Time, length, velocity, frequency, energy, momentum — they don't transform separately. They're shadows of one rotation in 4D pseudo-Euclidean spacetime. The Minkowski geometry IS the relativity. The algebra of §02 was the geometry all along." This is the topic that justifies the entire §03 module. Don't soften.
- §03.5 the-twin-paradox is the geometric payoff: the kinked worldline has shorter proper time because that's what the Minkowski metric measures along it — there is no "force" aging the traveler differently, just longer geodesic vs. broken geodesic.
- §04 is the dynamics emerging from the geometry. The four-momentum is the natural object that conserves; rest mass is the invariant; E=mc² is what falls out when you compute the four-momentum norm. §04.2's binding-energy curve is the universe's energy budget made visual.
- §04.5 closes the SR core on a quiet metaphysical note: matter and antimatter can be created from energy because energy and mass are the same currency, denominated in different units of c². The closing sentence sets up §05+§06 explicitly: "Mass becomes energy. Energy bends light. Light bends spacetime. The next module asks what happens when the geometry of §03 meets the gravity of every massive object — and the answer takes us all the way to general relativity."

**Cross-refs to EM (must include where natural):**
- RT §03.4 `four-vectors-and-proper-time` should reference EM §11.5 `four-potential-and-em-lagrangian` as "the EM application of the same four-vector machinery — A^μ as a four-potential is the canonical analogue." Use `<Term slug="four-potential" />` (glossary, exists from EM §11). For the topic itself, plain Markdown link: `[the EM application](/electromagnetism/four-potential-and-em-lagrangian)`. **`<Term>` is glossary-only; topic slugs are NOT auto-resolved.**
- RT §04.1 `four-momentum` should reference EM §11.3 `the-electromagnetic-field-tensor` as "the field-tensor application of the same algebra" via plain Markdown link, not `<Term>`.

**Cross-refs to RT Session 1 (must include where natural):**
- RT §03.5 `the-twin-paradox` extends RT §02.1 `time-dilation`'s muon picture (the muon's "biography" is the simplest twin paradox). Plain Markdown link `[time-dilation](/relativity/time-dilation)`.
- RT §03.1 `spacetime-diagrams` reuses the `SpacetimeDiagramCanvas` primitive shipped in Session 1.
- RT §04.2 `mass-energy-equivalence` references §02.1 + §02.2 implicitly via γ usage; plain prose, no link required.

**Forward-references:**
- §03 prose may reference: `bell-spaceship-paradox`, `barn-pole-paradox` (§05 topics — plain text, link via Markdown like `[Bell's spaceship](/relativity/bells-spaceship-paradox)`; the topics will resolve to their `coming-soon` stubs but the link won't 404 — branch hub keeps them indexed). Or write plain text without a link.
- §04 prose may reference: `gps-as-relativity` (§05), `gravitational-redshift` (§06). Same plain-text or stub-link treatment.
- If a Wave 2 agent finds itself wanting `<Term slug="rapidity">` (§03.4 only — hyperbolic-rotation parametrization `tanh(η) = β`) or `<Term slug="e-mc-squared">` (§04.2 only — alias for `mass-energy-equivalence`), include in the agent's `MISSING_TERMS:` report. The orchestrator patches the seed at Wave 3 forward-ref scan time.

**Final report format every Wave 2 agent returns:**

```
TOPIC: <slug>
WORD_COUNT: <n>
TESTS: <n_passed>/<n_total>
REGISTRY_BLOCK:
  // RT §0X — <slug>
  <SceneOneName>: lazyScene(() => import("@/components/physics/<slug>/<scene-one-name>-scene").then((m) => ({ default: m.<SceneOneName> }))),
  ...
PUBLISH_ARG: relativity/<slug>
COMMIT_SUBJECT: feat(rt/§0X): <slug> — <one-liner>
MISSING_TERMS: [<slug1>, <slug2>, …]
NOTES: <any deviations or surprises the orchestrator should know about>
```

---

### Task 3: Topic `spacetime-diagrams` (FIG.11)

**Goal:** Minkowski's 1908 reformulation as a way of drawing time. The reader should grasp: (1) ct on the vertical, x on the horizontal, in a 2D slice of 4D spacetime; (2) a particle's history is a single line — its worldline — through the diagram; (3) the slope tells you velocity (slope > 1 means subluminal in our axis convention); (4) light worldlines are at exactly 45°. This is the §03 setup topic — the diagrammatic vocabulary every later §03 topic uses.

**Files:**
- Create: `lib/physics/relativity/spacetime-diagram.ts`
- Create: `tests/physics/relativity/spacetime-diagram.test.ts`
- Create: `components/physics/spacetime-diagrams/minkowski-axes-scene.tsx` — uses `SpacetimeDiagramCanvas`. Two stationary worldlines (both vertical), one moving worldline tilted at slope 1/β. Light cone visible. Hub of the topic — read off the structure.
- Create: `components/physics/spacetime-diagrams/worldline-construction-scene.tsx` — interactive: click to add events; the scene draws straight-line segments connecting them. Speed of each segment displayed (slope to velocity).
- Create: `components/physics/spacetime-diagrams/boosted-frame-scene.tsx` — uses `SpacetimeDiagramCanvas` with `boostBeta` controlled by slider. Lab axes (cyan), boosted axes (magenta) overlay. Note: `ct'` axis tilts toward the light cone as β → 1 (closing in on the 45° line); `x'` axis tilts away from x-axis by the same angle. The scissor reveal.

**Physics lib:**

```typescript
import type { Worldline, MinkowskiPoint } from "@/lib/physics/relativity/types";
import { SPEED_OF_LIGHT } from "@/lib/physics/constants";

/** Build a stationary worldline at position x0, sampled from t=tMin to t=tMax in n+1 events.
 *  Each event has (t, x0, 0, 0). t values are in seconds; for plot use, callers convert to ct. */
export function stationaryWorldline(x0: number, tMin: number, tMax: number, n: number): Worldline {
  const events: MinkowskiPoint[] = [];
  for (let i = 0; i <= n; i++) {
    const t = tMin + (i / n) * (tMax - tMin);
    events.push({ t, x: x0, y: 0, z: 0 });
  }
  return { events, color: "#67E8F9", label: `x = ${x0}` };
}

/** Build a uniformly-moving worldline starting at (t=0, x=x0) with velocity v (m/s). */
export function uniformWorldline(x0: number, v: number, tMin: number, tMax: number, n: number): Worldline {
  const events: MinkowskiPoint[] = [];
  for (let i = 0; i <= n; i++) {
    const t = tMin + (i / n) * (tMax - tMin);
    events.push({ t, x: x0 + v * t, y: 0, z: 0 });
  }
  return { events, color: "#FF6ADE", label: `v = ${v.toFixed(2)} m/s` };
}

/** Slope (dx/d(ct)) of a worldline segment between two events. β = (1/c) · dx/dt. */
export function worldlineSlope(p1: MinkowskiPoint, p2: MinkowskiPoint): number {
  const dt = p2.t - p1.t;
  if (Math.abs(dt) < 1e-30) return Number.POSITIVE_INFINITY;
  return (p2.x - p1.x) / (SPEED_OF_LIGHT * dt);
}
```

**Test cases:** stationary worldline has slope 0 (β=0) between any two events; uniform worldline at v has slope v/c; light worldline at v=c has slope 1; uniform worldline event count matches n+1; events are monotonic in t.

**Prose outline (1000–1200 words):**
1. **§1 The reframing.** Cologne 1908. Minkowski's quote. The 4D union of space and time. 200 w.
2. **§2 The diagram.** SceneCard: `MinkowskiAxesScene`. Vertical = ct; horizontal = x. A particle is a line. EQ.01: nothing — just point at the scene. 200 w.
3. **§3 What slope tells you.** Slope = β. 0 = stationary; 1 = light. SceneCard: `WorldlineConstructionScene`. EQ.02: `\text{slope} = \frac{dx}{c\,dt} = \beta`. 200 w.
4. **§4 Light cones.** EQ.03: `ct = \pm x` from the origin. The 45° envelope is universal — no slope can exceed 1. The light cone IS the universal speed limit, drawn. 200 w.
5. **§5 The reveal that's coming.** SceneCard: `BoostedFrameScene`. Boost slider. Cyan lab axes, magenta boosted axes. As β → 1 they squeeze toward the light cone. The next four topics explore what this geometry demands. 100 w.
6. **§6 Closing.** §03.2 makes the invariant interval algebraic. §03.5 cashes the geometry as the twin paradox. 100 w.

**Aside:** `hermann-minkowski`, `albert-einstein`, `spacetime`, `world-line`, `light-cone`.

**Commit:** `feat(rt/§03): spacetime-diagrams — Minkowski's geometric reframing of SR`.

---

### Task 4: Topic `the-invariant-interval` (FIG.12)

**Goal:** the Lorentz scalar `s² = c²Δt² − Δx² − Δy² − Δz²`. The reader should grasp: (1) s² is preserved under Lorentz boosts and rotations — every observer agrees on it; (2) sign distinguishes timelike (s² > 0), spacelike (s² < 0), null (s² = 0); (3) the proper time `dτ = √(s²)/c` along a timelike worldline; (4) the invariant interval is the SR generalization of Pythagoras's theorem with one minus sign.

**Files:**
- Create: `lib/physics/relativity/invariant-interval.ts`
- Create: `tests/physics/relativity/invariant-interval.test.ts`
- Create: `components/physics/the-invariant-interval/interval-scene.tsx` — uses `SpacetimeDiagramCanvas`. Two events plotted, β slider boosts. The invariant `s²` displayed as a HUD numeric — stays constant as boost slider moves.
- Create: `components/physics/the-invariant-interval/three-cases-scene.tsx` — three event pairs: timelike (s²>0), spacelike (s²<0), null (s²=0). Each on its own mini-spacetime diagram, hatched per quadrant.
- Create: `components/physics/the-invariant-interval/proper-time-bar-scene.tsx` — a bar chart: lab time `Δt` for a moving clock between two events; γ; proper time `Δτ = √(s²)/c`. Each as a separate column. Slider for β; γ goes up, lab time stretches, proper time stays at the invariant value.

**Physics lib:**

```typescript
import { SPEED_OF_LIGHT } from "@/lib/physics/constants";
import { intervalSquared, classifyInterval } from "./types";
import type { MinkowskiPoint, LightConeQuadrant } from "./types";

/** Returns s² (signed) and the classification quadrant for two events. */
export function intervalReport(p1: MinkowskiPoint, p2: MinkowskiPoint, c = SPEED_OF_LIGHT): {
  s2: number;
  quadrant: LightConeQuadrant;
} {
  return { s2: intervalSquared(p1, p2, c), quadrant: classifyInterval(p1, p2, c) };
}

/** Proper-time elapsed along a *timelike* straight worldline between two events. Throws on
 *  spacelike intervals. */
export function properTimeStraightWorldline(p1: MinkowskiPoint, p2: MinkowskiPoint, c = SPEED_OF_LIGHT): number {
  const s2 = intervalSquared(p1, p2, c);
  if (s2 < 0) throw new RangeError(`spacelike interval (s² = ${s2}); proper time undefined`);
  return Math.sqrt(s2) / c;
}
```

**Test cases:** s² is invariant under `boostX(β)` for any β; s²=0 on the light cone for any (Δt, Δx) with Δx = c·Δt; proper time of a stationary clock equals the lab time; spacelike interval throws on `properTimeStraightWorldline`.

**Prose outline (1100–1300 words):**
1. **§1 The Pythagoras analog.** Euclid's theorem `d² = x² + y²` is invariant under rotation. SR's analog with a minus sign. 200 w.
2. **§2 The formula.** EQ.01: `s² = c²Δt² − Δx² − Δy² − Δz²`. SceneCard: `IntervalScene`. β slider — s² stays constant. 250 w.
3. **§3 Three quadrants.** SceneCard: `ThreeCasesScene`. Timelike, spacelike, null. EQ.02: classification table. 250 w.
4. **§4 Proper time as the invariant heartbeat.** `dτ = √(s²)/c`. SceneCard: `ProperTimeBarScene`. β slider; lab time stretches, proper time invariant. 200 w.
5. **§5 The geometric punchline.** Boosts are hyperbolic rotations; they preserve s² the way Euclidean rotations preserve `x² + y²`. Forward-link: §03.4 shows this is a Pythagoras in 4D pseudo-Euclidean space. 200 w.

**Aside:** `hermann-minkowski`, `henri-poincare`, `invariant-interval`, `proper-time`, `spacetime`.

**Commit:** `feat(rt/§03): the-invariant-interval — the one quantity every observer agrees on`.

---

### Task 5: Topic `light-cones-and-causality` (FIG.13)

**Goal:** light cones as the structure of "before, after, and elsewhere." The reader should grasp: (1) every event has a future light cone, a past light cone, and the elsewhere outside both; (2) only events inside a future light cone can be causally affected by you; (3) only events inside a past light cone can have causally affected you; (4) the elsewhere is causally disconnected — no signal can reach it without exceeding c.

**Files:**
- Create: `lib/physics/relativity/light-cone.ts`
- Create: `tests/physics/relativity/light-cone.test.ts`
- Create: `components/physics/light-cones-and-causality/light-cone-scene.tsx` — uses `SpacetimeDiagramCanvas`. Origin at center. Light cone shaded amber. Click to drop events; each event auto-classifies (timelike-future, timelike-past, spacelike, null).
- Create: `components/physics/light-cones-and-causality/causality-tilt-scene.tsx` — uses `SpacetimeDiagramCanvas` with `boostBeta`. Two events that are timelike-separated stay in each other's future/past in every frame; two spacelike-separated events have temporal order that flips with boost. Visual demonstration of the absolute future vs the relative elsewhere.
- Create: `components/physics/light-cones-and-causality/no-superluminal-signal-scene.tsx` — animated message attempt: a particle launched at v > c "appears" to travel from A to B, but in some boosted frame B precedes A. Cause-effect would invert. The scene shades the contradiction.

**Physics lib:** `quadrant(p1, p2, c)` wrapping `classifyInterval`; `isCausallyConnected(p1, p2, c)` returns `true` iff timelike or null with `p2.t > p1.t`; `lightConeBoundary(t, x)` for the 45° envelope helper.

**Test cases:** events inside future light cone have positive s² and forward Δt; spacelike-separated events have boost-frame in which Δt'=0; null worldline events satisfy `|Δx| = c·|Δt|`; causally-connected determination is invariant under Lorentz boosts.

**Prose outline (1000–1200 words):**
1. **§1 The cone shape.** Light flashes from a single event spread out at c in every direction. The locus is a 45° cone in spacetime. 200 w.
2. **§2 Future, past, elsewhere.** SceneCard: `LightConeScene`. Inside the upper cone = your absolute future. Inside the lower cone = your absolute past. Outside both = elsewhere. 250 w.
3. **§3 What spacelike means.** SceneCard: `CausalityTiltScene`. Spacelike events have no frame-independent temporal order — they're disconnected, the relativity of simultaneity living here. 250 w.
4. **§4 No superluminal signal.** SceneCard: `NoSuperluminalSignalScene`. A v>c signal would let you boost into a frame where it arrives before it was sent. Causality forbids it. 200 w.
5. **§5 The structure of "now."** There is no universal now. There IS a universal "future of yours" and "past of yours" — defined by your light cones. 100 w.

**Aside:** `hermann-minkowski`, `light-cone`, `spacelike`, `timelike`, `null-interval`.

**Commit:** `feat(rt/§03): light-cones-and-causality — before, after, and elsewhere`.

---

### Task 6: Topic `four-vectors-and-proper-time` (FIG.14) — **§03 HONEST-MOMENT APEX**

**Goal:** the four-vector formalism + proper time as the invariant parameter. The reader should grasp: (1) a four-vector is an object with 4 components that transforms under Lorentz boosts the same way (ct, x, y, z) does; (2) the four-velocity `u^μ = γ(c, v_x, v_y, v_z)` is the natural relativistic generalization of velocity; (3) proper time `dτ = dt/γ` integrates to the time elapsed on a clock carried along a worldline; (4) the algebra of §02 was the geometry of 4D pseudo-Euclidean rotations all along.

**Files:**
- Create: `lib/physics/relativity/four-vectors.ts`
- Create: `tests/physics/relativity/four-vectors.test.ts`
- Create: `components/physics/four-vectors-and-proper-time/four-velocity-scene.tsx` — Canvas 2D split panel: lab-frame 3-velocity vector on left; corresponding 4-velocity components (ct-component = γc; spatial = γv) on right. β slider; both update.
- Create: `components/physics/four-vectors-and-proper-time/proper-time-integral-scene.tsx` — uses `SpacetimeDiagramCanvas`. A worldline (possibly not straight); proper-time accumulator overlay shows running ∫dt/γ as the worldline is animated. β-of-worldline slider, animated step-by-step.
- Create: `components/physics/four-vectors-and-proper-time/algebra-becomes-geometry-scene.tsx` — Canvas 2D side-by-side: §02-algebra summary on the left (γ, β, time-dilation, length-contraction, velocity-addition, Doppler shift); a single 4D pseudo-Euclidean "rotation" diagram on the right. As β slider moves, the algebra columns light up one-by-one; the right-hand diagram rotates by the corresponding rapidity. The visual collapse of §02 algebra into one geometric object.

**Physics lib:**

```typescript
import { SPEED_OF_LIGHT } from "@/lib/physics/constants";
import { gamma, minkowskiNormSquared } from "./types";
import type { Vec4, MinkowskiPoint, Worldline } from "./types";

/** Four-velocity u^μ = γ(c, v_x, v_y, v_z) for a particle moving at 3-velocity v. */
export function fourVelocity(v: { x: number; y: number; z: number }, c = SPEED_OF_LIGHT): Vec4 {
  const vMag = Math.sqrt(v.x * v.x + v.y * v.y + v.z * v.z);
  const beta = vMag / c;
  const g = gamma(beta);
  return [g * c, g * v.x, g * v.y, g * v.z] as const;
}

/** Re-export so callers that import the four-vector module get the norm without
 *  needing a second import. */
export { minkowskiNormSquared };

/** Proper-time elapsed along a worldline by trapezoidal integration of dτ = dt·√(1−β²).
 *  Worldline events must be ordered by t. Computes |dx/dt| from successive events. */
export function properTimeAlongWorldline(events: readonly MinkowskiPoint[], c = SPEED_OF_LIGHT): number {
  if (events.length < 2) return 0;
  let tau = 0;
  for (let i = 1; i < events.length; i++) {
    const a = events[i - 1];
    const b = events[i];
    const dt = b.t - a.t;
    if (dt <= 0) continue;
    const dx = b.x - a.x, dy = b.y - a.y, dz = b.z - a.z;
    const beta = Math.sqrt(dx * dx + dy * dy + dz * dz) / (c * dt);
    if (beta >= 1) continue; // skip light or superluminal segments
    const oneOverGamma = Math.sqrt(1 - beta * beta);
    tau += dt * oneOverGamma;
  }
  return tau;
}
```

**Test cases:** four-velocity at rest is `(c, 0, 0, 0)`; minkowski-norm of any four-velocity equals `c²` exactly; proper-time of a stationary worldline equals lab time; proper-time of a uniform-velocity worldline equals lab time / γ.

**Prose outline (1200–1400 words):**
1. **§1 The lift.** The §02 algebra works. But why? Why does γ show up in time, length, velocity, frequency — different formulas, same factor? §03's answer: they're all manifestations of one rotation in 4D. 250 w.
2. **§2 The four-velocity.** EQ.01: `u^\mu = \gamma(c, v_x, v_y, v_z)`. SceneCard: `FourVelocityScene`. The natural relativistic generalization of velocity. 250 w.
3. **§3 Proper time as parameter.** EQ.02: `d\tau = dt/\gamma`. SceneCard: `ProperTimeIntegralScene`. The clock you carry. The §02 time-dilation result re-derived geometrically. 250 w.
4. **§4 Norm of u^μ.** EQ.03: `u^\mu u_\mu = c^2`. The four-velocity has constant norm — every observer's 4-velocity has the same length in the Minkowski metric. The geometric statement of "everyone moves through spacetime at c." 200 w.
5. **§5 The honest moment.** SceneCard: `AlgebraBecomesGeometryScene`. **Callout (intuition variant):** "Time, length, velocity, frequency, energy, momentum — they don't transform separately. They're shadows of one rotation in 4D pseudo-Euclidean spacetime. The Minkowski geometry IS the relativity. The algebra of §02 was the geometry all along." 200 w.
6. **§6 Forward.** §03.5 cashes this geometry as the twin paradox. §04 builds the dynamics: four-momentum is the next four-vector to inherit this machinery. EM §11.5 already used the same trick on the four-potential — link via plain Markdown to `/electromagnetism/four-potential-and-em-lagrangian`. 100 w.

**Aside:** `hermann-minkowski`, `albert-einstein`, `richard-feynman` (Feynman Lectures Vol I Ch 17 is the textbook treatment most readers know), `four-vector` (existing from EM §11), `four-velocity`, `proper-time`.

**Commit:** `feat(rt/§03): four-vectors-and-proper-time — the algebra was geometry all along`.

---

### Task 7: Topic `the-twin-paradox` (FIG.15) — **§03 MONEY SHOT**

**Goal:** the geometric proof that a kinked worldline accumulates less proper time than a straight one between the same endpoints. The reader should grasp: (1) the home twin's worldline is a vertical line; (2) the traveling twin's worldline is two timelike segments meeting at the turnaround; (3) the proper-time integral along each tallies less for the kinked one — `Δτ_traveler ≈ T_home / γ × 2` (plus small turnaround correction, which is honestly negligible at high γ); (4) acceleration is the bend in the line, not a fictitious aging force.

**Files:**
- Create: `lib/physics/relativity/twin-paradox.ts`
- Create: `tests/physics/relativity/twin-paradox.test.ts`
- Create: `components/physics/the-twin-paradox/kinked-worldline-scene.tsx` — uses `SpacetimeDiagramCanvas`. Home twin worldline (vertical, color cyan); traveling twin worldline (two segments meeting at turnaround, `accelerated: true` so the canvas paints orange). Proper-time tally on each twin's clock as a HUD overlay; traveling twin's clock shows running ∫dt/γ. Animation control: play/pause/reset.
- Create: `components/physics/the-twin-paradox/who-aged-less-scene.tsx` — bar chart at the end of the trip: home twin clock = T years; traveling twin clock = T/γ years. Slider for β; γ readout; visible disparity.
- Create: `components/physics/the-twin-paradox/the-bend-is-the-acceleration-scene.tsx` — annotated zoom on the turnaround event. The kinked worldline's "bend" labeled. Caption: this is the only place in the trip where the twins' frames differ in any meaningful way; everything else is symmetric. The asymmetry is the geometry of the kink, not a force.

**Physics lib:**

```typescript
import { SPEED_OF_LIGHT } from "@/lib/physics/constants";
import { gamma } from "./types";

/** Round-trip proper time for an idealised twin who travels outbound at βc, instantaneously
 *  reverses, and returns at βc, taking total lab-frame time T_home. */
export function travelerProperTime(THome: number, beta: number): number {
  return THome / gamma(beta);
}

/** Difference in clock readings (home minus traveler) at reunion. */
export function ageDifference(THome: number, beta: number): number {
  return THome - travelerProperTime(THome, beta);
}
```

**Test cases:** at β=0 traveler proper time equals home time (both ages identical); at β=0.6, γ=1.25, T_home=10 yr → traveler proper time = 8 yr; at β→1 traveler proper time → 0 (limit); ageDifference is non-negative for any subluminal β; throws on β ≥ 1.

**Prose outline (1100–1300 words):**
1. **§1 The puzzle.** Twin A stays home. Twin B leaves at β=0.8 to a star 4 ly away and returns. Reunion: A is older. Why isn't it symmetric? Special relativity says everyone's frame is equivalent — yet the twins disagree on who aged. 200 w.
2. **§2 The geometric answer.** SceneCard: `KinkedWorldlineScene`. The home twin's worldline is a straight line; the traveler's is kinked. Proper time = arc length in Minkowski metric. The kinked path is SHORTER in proper time. EQ.01: `\tau_{\text{traveler}} = T_{\text{home}}/\gamma`. 300 w.
3. **§3 Who aged less.** SceneCard: `WhoAgedLessScene`. Numerical: β=0.8, γ=1.667, T=10 yr round trip → traveler's clock reads 6 yr. The traveler is 4 yr younger at reunion. 200 w.
4. **§4 Acceleration is the bend.** SceneCard: `TheBendIsTheAccelerationScene`. The asymmetry isn't a force aging the traveler; it's the geometry. The home twin's worldline is geodesic; the traveler's is two geodesics joined at a kink. Geodesics maximize proper time between two events (in SR with mostly-plus convention; this is Hartle's "geodesic = longest-aging path"). 250 w.
5. **§5 Cross-link forward.** Bell's spaceship paradox (§05.2) is a related geometric story; barn-pole paradox (§05.1) is its sibling. Both stay paradoxes only as long as you cling to a single frame. The geometry resolves both. 150 w.

**Aside:** `albert-einstein`, `hermann-minkowski`, `proper-time`, `world-line`, `time-dilation` (existing).

**Commit:** `feat(rt/§03): the-twin-paradox — the kinked worldline ages less, by geometry`.

---

### Task 8: Topic `four-momentum` (FIG.16) — **DENSEST LATEX OF SESSION**

**Goal:** the four-momentum `p^μ = (E/c, p_x, p_y, p_z)`. The reader should grasp: (1) it's the natural four-vector built from energy + 3-momentum; (2) its norm-squared is the Lorentz invariant `p^μ p_μ = (E/c)² − |p|² = m²c²` — the energy-momentum-mass triangle; (3) it transforms under boosts the same way (ct, x, y, z) does; (4) it's the conserved object in collisions (§04.3). EM §11.3 used the same algebra on the field tensor; cross-link.

**Files:**
- Create: `lib/physics/relativity/four-momentum.ts`
- Create: `tests/physics/relativity/four-momentum.test.ts`
- Create: `components/physics/four-momentum/energy-momentum-triangle-scene.tsx` — Canvas 2D right triangle: vertical leg = mc² (rest energy), horizontal leg = pc (kinetic momentum × c), hypotenuse = E (total energy). β slider — at β=0 horizontal leg vanishes, hypotenuse = mc². At β→1 horizontal leg dominates, hypotenuse → pc. Visual proof that `E² = (pc)² + (mc²)²`.
- Create: `components/physics/four-momentum/four-momentum-boost-scene.tsx` — Canvas 2D: a particle's four-momentum in lab frame as a 4-component column; in a boosted frame; β slider boosts. The four components mix per the Lorentz boost matrix, but the Minkowski norm stays at `m²c²`. HUD displays the invariant.
- Create: `components/physics/four-momentum/photon-is-null-scene.tsx` — special case: photon has m=0 and `E = pc`. The energy-momentum triangle degenerates: hypotenuse equals horizontal leg; vertical leg vanishes. The four-momentum is null (`p^μ p_μ = 0`).

**Physics lib:**

```typescript
import { SPEED_OF_LIGHT } from "@/lib/physics/constants";
import { gamma, minkowskiNormSquared, boostX, applyMatrix } from "./types";
import type { FourMomentum } from "./types";

/** Build a four-momentum (E/c, p_x, p_y, p_z) for a particle of mass m moving at 3-velocity v. */
export function fourMomentum(m: number, v: { x: number; y: number; z: number }, c = SPEED_OF_LIGHT): FourMomentum {
  const vMag = Math.sqrt(v.x * v.x + v.y * v.y + v.z * v.z);
  const beta = vMag / c;
  const g = gamma(beta);
  return [g * m * c, g * m * v.x, g * m * v.y, g * m * v.z] as const;
}

/** Build a photon four-momentum with energy E moving in direction (nx, ny, nz). */
export function photonFourMomentum(E: number, n: { x: number; y: number; z: number }, c = SPEED_OF_LIGHT): FourMomentum {
  const nMag = Math.sqrt(n.x * n.x + n.y * n.y + n.z * n.z);
  if (Math.abs(nMag - 1) > 1e-9) throw new RangeError(`photonFourMomentum: direction must be unit vector, got |n| = ${nMag}`);
  return [E / c, (E / c) * n.x, (E / c) * n.y, (E / c) * n.z] as const;
}

/** Total energy E from four-momentum components. */
export function energyFromFourMomentum(p: FourMomentum, c = SPEED_OF_LIGHT): number {
  return p[0] * c;
}

/** Re-export so collision/Compton modules don't need a second import for the norm. */
export { minkowskiNormSquared };

/** Apply a Lorentz boost along +x to a four-momentum. */
export function boostFourMomentum(p: FourMomentum, beta: number): FourMomentum {
  return applyMatrix(boostX(beta), p);
}
```

**Test cases:** four-momentum of stationary particle is `(mc, 0, 0, 0)`; norm-squared equals `m²c²` exactly for any v < c; photon norm-squared = 0; norm-squared invariant under `boostFourMomentum` for any β; energy-momentum-mass triangle algebra `E² = (pc)² + (mc²)²` checks for known particle (1 GeV electron).

**Prose outline (1300–1500 words). Densest LaTeX of session.** Use `\begin{pmatrix}` freely (Session 1 confirmed clean). Voice: this is the 1905 sequel paper — Einstein wrote "Does the inertia of a body depend on its energy content?" three months after the kinematics paper. The answer is yes, packaged as `p^μ = (E/c, \vec p)`.
1. **§1 What's natural to package together?** Energy is conserved. Momentum is conserved. Under Galilean boost they don't mix. Under Lorentz boost they DO. So they belong in one four-vector. 250 w.
2. **§2 The definition.** EQ.01: `p^\mu = (E/c, p_x, p_y, p_z) = m\,u^\mu`. SceneCard: `EnergyMomentumTriangleScene`. 300 w.
3. **§3 The invariant.** EQ.02: `p^\mu p_\mu = (E/c)^2 - |\vec p|^2 = m^2 c^2`. The energy-momentum-mass triangle made geometric. 300 w.
4. **§4 Boosts mix the components.** EQ.03 (boost matrix): `p'^\mu = \Lambda^\mu{}_\nu p^\nu`, with `\Lambda` the same boostX matrix as §02.3 (`\begin{pmatrix}\gamma & -\gamma\beta & 0 & 0 \\\\ -\gamma\beta & \gamma & 0 & 0 \\\\ 0 & 0 & 1 & 0 \\\\ 0 & 0 & 0 & 1\end{pmatrix}`). SceneCard: `FourMomentumBoostScene`. 300 w.
5. **§5 The photon as null four-momentum.** SceneCard: `PhotonIsNullScene`. m=0 means the four-momentum is light-like (norm=0). EQ.04: `E = pc` for photons. 250 w.
6. **§6 Cross-links.** EM §11.3 the-electromagnetic-field-tensor uses the same machinery on field strengths via plain Markdown link. §04.3 conserves four-momentum in collisions. §04.4 watches Compton scattering enforce four-momentum balance and predict a wavelength shift. 150 w.

**Aside:** `albert-einstein`, `hermann-minkowski`, `four-vector` (existing), `four-momentum`, `rest-energy`, `mass-energy-equivalence`.

**Commit:** `feat(rt/§04): four-momentum — energy and momentum, packaged into one four-vector`.

---

### Task 9: Topic `mass-energy-equivalence` (FIG.17) — **§04 MONEY SHOT**

**Goal:** `E = mc²` as the deepest bookkeeping fact in physics. **Money shot: binding-energy-per-nucleon curve from H to U with iron at the peak.** The reader should grasp: (1) E=mc² isn't just "particles can become energy"; it's that mass IS a form of energy; (2) bound systems weigh less than their constituents — the binding energy comes off the balance; (3) the universe's energy budget — fusion (left of iron) and fission (right of iron) — is the area under the binding-energy curve.

**Files:**
- Create: `lib/physics/relativity/mass-energy.ts`
- Create: `tests/physics/relativity/mass-energy.test.ts`
- Create: `components/physics/mass-energy-equivalence/binding-energy-curve-scene.tsx` — **THE MONEY SHOT.** X-axis: nucleon number A from 1 to ~240. Y-axis: B/A in MeV from 0 to 9. Curve climbs steeply (H=0, He=7.07, …) up to iron-56 at the peak (~8.79 MeV/nucleon), then falls slowly to U-238 (~7.6). Annotations: "fusion releases energy here ↑" pointing at the rising left side; "fission releases energy here ↓" pointing at the descending right side. Iron-56 labeled as the universe's energy minimum per nucleon. Static SVG ok.
- Create: `components/physics/mass-energy-equivalence/coffee-cup-scene.tsx` — playful: a hot cup of coffee weighs `m + ΔE/c²` more than a cold one. Numerical: 1 cup of water 100°C → 20°C ≈ 280 kJ ≈ 3.1 × 10⁻¹² kg = 3.1 picograms. Real, measurable in principle.
- Create: `components/physics/mass-energy-equivalence/nuclear-balance-scene.tsx` — schematic: an alpha particle has 4 nucleons, each ~939 MeV/c². Total bare = 4 × 939 = 3756 MeV/c². Actual He-4 mass = 3727 MeV/c². The 28 MeV deficit is the binding energy — measurable on a balance.

**Physics lib:**

```typescript
import { SPEED_OF_LIGHT } from "@/lib/physics/constants";

/** Rest energy E = mc² (kg input, J output). */
export function restEnergy(m: number, c = SPEED_OF_LIGHT): number {
  return m * c * c;
}

/** Mass deficit Δm from a known binding-energy release ΔE (J input, kg output). */
export function massDeficitFromEnergy(deltaE: number, c = SPEED_OF_LIGHT): number {
  return deltaE / (c * c);
}

/** Binding-energy-per-nucleon curve, sample data: realistic values for representative isotopes.
 *  Returns array of { A, B_per_A_MeV } pairs. Data source: AME 2020 atomic mass evaluation. */
export function bindingEnergyCurve(): readonly { A: number; B_per_A_MeV: number; isotope: string }[] {
  return [
    { A: 1, B_per_A_MeV: 0, isotope: "H-1" },
    { A: 2, B_per_A_MeV: 1.11, isotope: "H-2" },
    { A: 4, B_per_A_MeV: 7.07, isotope: "He-4" },
    { A: 12, B_per_A_MeV: 7.68, isotope: "C-12" },
    { A: 16, B_per_A_MeV: 7.98, isotope: "O-16" },
    { A: 56, B_per_A_MeV: 8.79, isotope: "Fe-56" }, // peak
    { A: 84, B_per_A_MeV: 8.72, isotope: "Kr-84" },
    { A: 138, B_per_A_MeV: 8.39, isotope: "Ba-138" },
    { A: 208, B_per_A_MeV: 7.87, isotope: "Pb-208" },
    { A: 235, B_per_A_MeV: 7.59, isotope: "U-235" },
    { A: 238, B_per_A_MeV: 7.57, isotope: "U-238" },
  ] as const;
}
```

**Test cases:** rest energy of 1 kg = `c² ≈ 8.988e16 J`; mass deficit from 1 J = 1.113×10⁻¹⁷ kg; binding-energy-curve has Fe-56 as the maximum entry; curve is monotonic up to A=56 then monotonic down (modulo the He-4 island).

**Prose outline (1200–1400 words):**
1. **§1 The 1905 sequel.** Three months after the kinematics paper Einstein asked: does the inertia of a body depend on its energy content? Yes. The factor is c². 200 w.
2. **§2 What "equivalence" means.** Mass is a form of energy. Bound systems weigh less than their constituents. EQ.01: `E_0 = mc^2` (the rest-energy form). 250 w.
3. **§3 The cup of coffee.** SceneCard: `CoffeeCupScene`. 280 kJ of cooling = 3 picograms. Real, measurable in principle. 200 w.
4. **§4 The nuclear balance.** SceneCard: `NuclearBalanceScene`. Alpha particle 28 MeV underweight. The deficit IS the binding energy that holds the nucleus together. 200 w.
5. **§5 The energy budget of the universe.** SceneCard: `BindingEnergyCurveScene`. **THE MONEY SHOT.** From H to U, with Fe-56 at the peak. Stars run on fusion (climbing left of iron); reactors run on fission (descending right of iron). Every joule of energy ever liberated by a nucleus has been a movement on this curve. 350 w.
6. **§6 Forward.** §04.3 watches four-momentum conservation play out in collisions; §04.5 cashes E=mc² to make matter from energy. The full implication waits for §06 (gravitational redshift) and §12 (cosmology). 150 w.

**Aside:** `albert-einstein`, `mass-energy-equivalence`, `rest-energy`, `four-momentum`.

**Commit:** `feat(rt/§04): mass-energy-equivalence — the universe's energy budget, made visible`.

---

### Task 10: Topic `relativistic-collisions` (FIG.18)

**Goal:** four-momentum conservation in 1D and 2D collisions. The reader should grasp: (1) `Σ p^μ_in = Σ p^μ_out` at every vertex; (2) elastic collisions conserve both kinetic energy and momentum; (3) inelastic collisions conserve total four-momentum but rest mass changes (kinetic energy can convert to rest mass — an excited final state weighs more); (4) relativistic billiards diverges from Newtonian when momenta become comparable to mc.

**Files:**
- Create: `lib/physics/relativity/relativistic-collision.ts`
- Create: `tests/physics/relativity/relativistic-collision.test.ts`
- Create: `components/physics/relativistic-collisions/elastic-collision-scene.tsx` — Canvas 2D 1D head-on elastic. Two particles with adjustable mass + velocity; live readout of incoming and outgoing four-momenta. Conservation HUD: `Σ p^μ_in = Σ p^μ_out` to 6 decimal places.
- Create: `components/physics/relativistic-collisions/inelastic-merger-scene.tsx` — Canvas 2D: two particles of mass m collide head-on at β=0.5 each and merge into a single particle. Newtonian: m_final = 2m. Relativistic: m_final = 2γm > 2m — kinetic energy has become rest mass. HUD shows γ=1.155, mass excess 15.5%.
- Create: `components/physics/relativistic-collisions/2d-scattering-scene.tsx` — Canvas 2D: 2D scattering at angle θ. Stationary target struck by incoming projectile. Outgoing particles' angles obey four-momentum conservation. Slider for incoming β; the relativistic-vs-Newtonian outgoing angle diverges visibly.

**Physics lib:**

```typescript
import { SPEED_OF_LIGHT } from "@/lib/physics/constants";
import { fourMomentum, minkowskiNormSquared } from "./four-momentum";
import type { FourMomentum } from "./types";

/** Sum of an array of four-momenta — used to check conservation. */
export function totalFourMomentum(ps: readonly FourMomentum[]): FourMomentum {
  let s0 = 0, s1 = 0, s2 = 0, s3 = 0;
  for (const p of ps) {
    s0 += p[0]; s1 += p[1]; s2 += p[2]; s3 += p[3];
  }
  return [s0, s1, s2, s3] as const;
}

/** Whether two four-momentum sets are equal to within `eps` componentwise. */
export function fourMomentaEqual(a: FourMomentum, b: FourMomentum, eps = 1e-9): boolean {
  return (
    Math.abs(a[0] - b[0]) < eps &&
    Math.abs(a[1] - b[1]) < eps &&
    Math.abs(a[2] - b[2]) < eps &&
    Math.abs(a[3] - b[3]) < eps
  );
}

/** Final mass of an inelastic merger of two particles of mass m1, m2 colliding head-on at β1, β2.
 *  Returns the rest mass of the resulting single particle. */
export function inelasticMergerMass(m1: number, beta1: number, m2: number, beta2: number, c = SPEED_OF_LIGHT): number {
  const p1 = fourMomentum(m1, { x: beta1 * c, y: 0, z: 0 }, c);
  const p2 = fourMomentum(m2, { x: beta2 * c, y: 0, z: 0 }, c);
  const total = totalFourMomentum([p1, p2]);
  const m2c2 = minkowskiNormSquared(total);
  if (m2c2 < 0) throw new RangeError(`inelasticMergerMass: spacelike total p (impossible)`);
  return Math.sqrt(m2c2) / c;
}
```

**Test cases:** elastic head-on collision conserves four-momentum to numerical precision; inelastic merger of two equal-mass particles at β=0 gives total mass 2m (Newtonian limit); merger of two equal-mass at β=±0.5 gives final mass `2γm = 2.31m`; merger conservation invariant under boost.

**Prose outline (1100–1300 words):**
1. **§1 What conservation means.** Four-momentum conservation at every vertex. Newtonian momentum + kinetic energy are the low-β projections. 250 w.
2. **§2 Elastic 1D.** SceneCard: `ElasticCollisionScene`. The relativistic correction to the v=v₁−v₂ formula appears at order β². 250 w.
3. **§3 Inelastic merger.** SceneCard: `InelasticMergerScene`. Two particles → one. Final mass `> 2m` because kinetic energy became rest mass. The dramatic relativistic departure. 250 w.
4. **§4 2D scattering.** SceneCard: `2dScatteringScene`. Outgoing angle relativistic vs Newtonian. 200 w.
5. **§5 Forward.** §04.4 watches Compton enforce four-momentum balance on a photon-electron collision. §04.5 watches it forbid pair production from a single photon. 150 w.

**Aside:** `albert-einstein`, `four-momentum`, `mass-energy-equivalence`.

**Commit:** `feat(rt/§04): relativistic-collisions — four-momentum conservation, all the way down`.

---

### Task 11: Topic `compton-scattering` (FIG.19)

**Goal:** the 1923 X-ray scattering experiment that finally made photons mechanical. The reader should grasp: (1) the Compton wavelength shift `Δλ = (h/m_e c)(1 − cos θ)`; (2) it falls out of treating the photon as a particle with momentum `p = h/λ` and applying four-momentum conservation; (3) the angle dependence is the signature — wave theory predicts no shift; (4) historically: this is the experiment that established photons as mechanically legitimate.

**Files:**
- Create: `lib/physics/relativity/compton.ts`
- Create: `tests/physics/relativity/compton.test.ts`
- Create: `components/physics/compton-scattering/wavelength-shift-scene.tsx` — Canvas 2D: incoming photon (amber, λ=0.071 nm) + stationary electron. Photon scatters at angle θ; outgoing photon shifted to longer wavelength λ'. Slider for θ from 0 to 180°; readout `Δλ = (h/m_e c)(1 − cos θ)`. At θ=90°, Δλ = Compton wavelength (2.426 pm) exactly.
- Create: `components/physics/compton-scattering/four-momentum-balance-scene.tsx` — same scattering, but with the four-momentum vectors drawn before and after. Sum of incoming = sum of outgoing — visualised as vector addition. The conservation made geometric.
- Create: `components/physics/compton-scattering/compton-1923-data-scene.tsx` — the actual 1923 fringe-vs-angle data points (Mo Kα, graphite target). Curve `λ_0 = 0.071 nm` plus `Δλ = (h/m_e c)(1 − cos θ)` overlaid. Data tracks the prediction precisely.

**Physics lib:**

```typescript
import { SPEED_OF_LIGHT, PLANCK_CONSTANT, ELECTRON_MASS } from "@/lib/physics/constants";

/** Compton wavelength λ_C = h/(m_e c) ≈ 2.426 × 10⁻¹² m. */
export const COMPTON_WAVELENGTH = PLANCK_CONSTANT / (ELECTRON_MASS * SPEED_OF_LIGHT);

/** Compton shift Δλ = (h/m_e c)(1 − cos θ). θ in radians. */
export function comptonShift(theta: number): number {
  return COMPTON_WAVELENGTH * (1 - Math.cos(theta));
}

/** Outgoing wavelength after scattering at angle θ. */
export function scatteredWavelength(lambdaIn: number, theta: number): number {
  return lambdaIn + comptonShift(theta);
}
```

**Test cases:** Compton wavelength approximately `2.4263e-12` m to 4 significant figures; shift at θ=0 is 0; shift at θ=90° equals Compton wavelength; shift at θ=180° equals 2× Compton wavelength; scattered wavelength always ≥ incoming wavelength.

**Prose outline (1000–1200 words):**
1. **§1 The 1922 puzzle.** Wave theory predicts no shift in scattered light's wavelength. X-rays scatter off electrons with… a shift? 200 w.
2. **§2 Treat the photon as a particle.** EQ.01: `p = h/\lambda`. Apply four-momentum conservation to a photon-electron billiard collision. 250 w.
3. **§3 The shift formula.** EQ.02: `\Delta\lambda = \frac{h}{m_e c}(1 - \cos\theta)`. SceneCard: `WavelengthShiftScene`. Angle-dependent, independent of incoming wavelength. 250 w.
4. **§4 The 1923 data.** SceneCard: `Compton1923DataScene`. Mo Kα on graphite, fringes shifting exactly as predicted. The Nobel-shaped result. 200 w.
5. **§5 Why it mattered.** SceneCard: `FourMomentumBalanceScene`. The photon was a theoretical proposal until 1923. After Compton, it carries momentum, scatters, and obeys conservation laws — mechanically legitimate. 150 w.

**Aside:** `arthur-compton`, `albert-einstein`, `compton-shift`, `four-momentum`.

**Commit:** `feat(rt/§04): compton-scattering — the experiment that made photons mechanical`.

---

### Task 12: Topic `threshold-energy-and-pair-production` (FIG.20) — **§04 CLOSER + §05/§06 BRIDGE**

**Goal:** the threshold-energy concept and pair production. The reader should grasp: (1) creating a particle of mass m needs at least `mc²` of incoming energy, plus more if the final state has nonzero net momentum; (2) `γ → e⁺ + e⁻` from a single photon in vacuum is FORBIDDEN by four-momentum conservation; (3) with a third body (a nucleus), threshold is `2m_e c² = 1.022 MeV`; (4) Anderson 1932 confirmed Dirac's 1928 prediction.

**Files:**
- Create: `lib/physics/relativity/pair-production.ts`
- Create: `tests/physics/relativity/pair-production.test.ts`
- Create: `components/physics/threshold-energy-and-pair-production/why-single-photon-is-forbidden-scene.tsx` — Canvas 2D: a photon with E = 1 MeV approaches; tries to convert to e⁺ + e⁻. In the photon's hypothetical "rest frame" (which doesn't exist — photons have no rest frame), the pair would have zero net momentum but mass 2m_e — impossible because the photon already has E < 2m_e c². Even at higher E, four-momentum conservation can't be satisfied without a third body. Animated red-X.
- Create: `components/physics/threshold-energy-and-pair-production/with-nucleus-scene.tsx` — Canvas 2D: photon + nucleus → pair + nucleus. Threshold `E_γ ≥ 1.022 MeV`. Slider for photon energy. Below threshold: no pair. Above: e⁺ + e⁻ tracks emerge in opposite directions, slightly tilted because the nucleus carries some recoil.
- Create: `components/physics/threshold-energy-and-pair-production/anderson-1932-scene.tsx` — facsimile of Anderson's 1932 cloud-chamber photograph: a positron track curving the wrong way under the magnetic field, confirming the antimatter prediction. Dirac (1928 prediction) and Anderson (1932 observation) credited side-by-side.

**Physics lib:**

```typescript
import { SPEED_OF_LIGHT, ELECTRON_MASS } from "@/lib/physics/constants";

/** Threshold incoming-photon energy for γ + nucleus → e⁺ + e⁻ + nucleus. The nucleus is much
 *  heavier than the electron-positron pair, so to leading order threshold ≈ 2 m_e c². */
export function pairProductionThresholdLeadingOrder(c = SPEED_OF_LIGHT, me = ELECTRON_MASS): number {
  return 2 * me * c * c;
}

/** Whether a single-photon pair production γ → e⁺ + e⁻ is kinematically allowed in vacuum.
 *  Always false: forbidden by four-momentum conservation. */
export function singlePhotonPairProductionAllowed(): boolean {
  return false;
}

/** Threshold lab-frame energy for a head-on collision producing a final state of total rest mass M
 *  from initial particles of mass m1 (moving) and m2 (at rest), via four-momentum invariant.
 *  E_threshold = (M² − m1² − m2²) c² / (2 m2). */
export function thresholdHeadOnAtRestTarget(M: number, m1: number, m2: number, c = SPEED_OF_LIGHT): number {
  if (M < m1 + m2) throw new RangeError(`threshold: M (${M}) must exceed m1 + m2 (${m1 + m2})`);
  return ((M * M - m1 * m1 - m2 * m2) / (2 * m2)) * c * c;
}
```

**Test cases:** pair-production threshold leading-order ≈ `1.637e-13` J ≈ 1.022 MeV (compute exactly from `2 * ELECTRON_MASS * SPEED_OF_LIGHT**2`); single-photon pair production always forbidden; thresholdHeadOnAtRestTarget with `M=4 GeV/c², m1=m2=1 GeV/c²` gives 7 GeV (compute exactly from the closed-form formula); throws when M < m1 + m2.

**Prose outline (1100–1300 words):**
1. **§1 The question.** Can a 511 keV gamma ray make an electron? 200 w.
2. **§2 Why no single-photon pair production.** SceneCard: `WhySinglePhotonIsForbiddenScene`. Four-momentum conservation forbids it: photons have null four-momentum; pairs at rest have m²c² > 0. The norm-squared is invariant — you can't change it. 300 w.
3. **§3 With a nucleus, 1.022 MeV.** SceneCard: `WithNucleusScene`. The nucleus absorbs the recoil. EQ.01: `E_\gamma \geq 2 m_e c^2 = 1.022\,\text{MeV}` to leading order. 250 w.
4. **§4 Dirac 1928 and Anderson 1932.** SceneCard: `Anderson1932Scene`. Dirac's equation predicted the positron as an inevitable consequence; Anderson's cloud chamber found it 4 years later. The first antimatter particle. 250 w.
5. **§5 The closing argument.** Mass becomes energy. Energy bends light. Light bends spacetime. The next module asks what happens when the geometry of §03 meets the gravity of every massive object — and the answer takes us all the way to general relativity. 100 w.

**Aside:** `paul-dirac`, `albert-einstein`, `threshold-energy`, `pair-production`, `mass-energy-equivalence`.

**Commit:** `feat(rt/§04): threshold-energy-and-pair-production — energy becomes matter, and §05+§06 are next`.

---

## Wave 2.5 — Registry merge + publish + per-topic commit (orchestrator inline, serial)

**Order: §03.1 → §03.2 → §03.3 → §03.4 → §03.5 → §04.1 → §04.2 → §04.3 → §04.4 → §04.5.**

**Why this order:** sequential FIG order is natural; **§04.1 four-momentum is the riskiest publish** (densest LaTeX of session — μν index gymnastics, four-vector dot product, energy-momentum-mass triangle, boost matrix). When you reach it, publish first; if `0 inserted / 0 updated` returns, the LaTeX is parsing empty — switch to `\begin{aligned}` row form for the boost matrix or break each equation into a separate `<EquationBlock>` and republish before authoring §04.2. Session 1 confirmed `\begin{pmatrix}` clean — keep it as the preferred form, fall back only if needed.

**Secondary risk: §03.4 four-vectors-and-proper-time** (proper-time integral form `dτ = dt/γ` integrated along a worldline + four-vector-as-tangent-vector machinery). Publish as scheduled; if it parses empty, the likely culprit is a multi-line `\int` expression — collapse to one line per `<EquationBlock>`.

For each Wave 2 topic, in order:

- [ ] **Step 1:** Open `lib/content/simulation-registry.ts`. Append the agent's `REGISTRY_BLOCK:` content under the existing entries with a `// RT §0X — <slug>` section comment. Insert before the closing `};` and the `export type SimulationName` line.

- [ ] **Step 2:** Run typecheck.

```bash
pnpm tsc --noEmit
```

Expected: clean. If errors mention `lazyScene` or `import` paths, double-check the agent's REGISTRY_BLOCK was pasted with correct indentation and matching `m.<SceneName>` matches the file's actual export.

- [ ] **Step 3:** Publish the topic.

```bash
pnpm content:publish --only relativity/<slug>
```

Expected: `1 added` (first publish) or `1 updated`. **If `0 added / 0 updated`,** the MDX parsed empty — investigate. Check for: (a) bare `<` in prose, (b) multi-line `$$...$$`, (c) JSX inside `title=""` attribute, (d) `\begin{pmatrix}` failing for §04.1, (e) HTML entity inside math `&gt;` from Session 1's lesson, (f) `<Term>` or `<PhysicistLink>` placed block-level instead of inline.

- [ ] **Step 4:** Commit the topic.

```bash
git add lib/content/simulation-registry.ts \
  lib/physics/relativity/<topic>.ts \
  tests/physics/relativity/<topic>.test.ts \
  components/physics/<slug>/ \
  app/\[locale\]/\(topics\)/relativity/<slug>/
git commit -m "$(cat <<'EOF'
<COMMIT_SUBJECT from agent's report>

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

Repeat for all 10 topics.

---

## Wave 3 — Finalize (1 subagent, orchestrator inline)

### Task 13: Run seed, smoke-test, update spec, log

**Files:**
- Modify: `docs/superpowers/specs/2026-04-29-relativity-branch-design.md`

- [ ] **Step 1: Pre-seed forward-ref scan**

```bash
# Scan the 10 new MDX files for any <Term slug="..."> calls.
grep -rohE '<Term slug="[^"]+"' app/\[locale\]/\(topics\)/relativity/ | sort -u
# Compare against existing GLOSSARY.
grep -nE 'slug: "' lib/content/glossary.ts
```

For each `<Term>` slug not in glossary.ts, **add a forward-ref placeholder to `seed-rt-02.ts`'s GLOSSARY array** before running the seed. Pattern: `shortDefinition` says "placeholder, full treatment in §0X.Y," `description` is one paragraph explaining the term. Likely candidates this session if Wave 2 surfaces them: `rapidity` (§03.4), `e-mc-squared` (§04.2 alias), `lorentz-factor` (§02 carry-forward; was assumed-existing in Session 1 plan but missing in actual glossary). Skip placeholders that turned out unreferenced.

If placeholders are added, they fold into the seed commit — single Wave 3 seed commit. If a fix-up patch is needed AFTER seed-run (rare), it gets its own `fix(rt/§03-§04)` commit.

- [ ] **Step 2: Run the seed**

```bash
pnpm exec tsx --conditions=react-server scripts/content/seed-rt-02.ts
```

Expected: "physicists: 1 inserted (Compton), glossary: 17 inserted." On a clean first run + zero forward-ref placeholders. If forward-ref placeholders were added in Step 1, count goes higher.

If parse errors surface (esbuild reporting line:column), they're typically embedded backticks or unescaped quotes inside template-literal descriptions — fix in place, re-run. Lesson from EM Session 7 + RT Session 1.

- [ ] **Step 3: Run full test sweep**

```bash
pnpm tsc --noEmit
pnpm vitest run
```

Expected: clean tsc; all tests green. RT Session 1 closed at 146 RT tests; Session 2 should add ~100–150 more (10 topics × 8–12 tests + 11 new types tests). Record vitest count in the implementation log.

- [ ] **Step 4: Build smoke**

```bash
pnpm build 2>&1 | tail -50
```

Expected: clean. The 10 new `/en/relativity/<slug>` + 10 `/he/relativity/<slug>` routes appear in the SSG output.

- [ ] **Step 5: Curl smoke (10 topic URLs + Compton + new glossary)**

Start dev server on port 3001 (avoid stale port-3000 cache from earlier sessions per RT Session 1 lesson):

```bash
PORT=3001 pnpm dev &
sleep 5
for slug in spacetime-diagrams the-invariant-interval light-cones-and-causality four-vectors-and-proper-time the-twin-paradox four-momentum mass-energy-equivalence relativistic-collisions compton-scattering threshold-energy-and-pair-production; do
  echo "=== $slug ==="
  curl -s -o /dev/null -w "%{http_code}\n" http://localhost:3001/en/relativity/$slug
done
echo "=== arthur-compton ==="
curl -s -o /dev/null -w "%{http_code}\n" http://localhost:3001/en/physicists/arthur-compton
for term in spacetime world-line proper-time invariant-interval light-cone spacelike timelike null-interval four-momentum four-velocity four-acceleration four-force rest-energy mass-energy-equivalence threshold-energy pair-production compton-shift; do
  echo "=== /dictionary/$term ==="
  curl -s -o /dev/null -w "%{http_code}\n" http://localhost:3001/en/dictionary/$term
done
echo "=== /en/relativity (branch hub) ==="
curl -s http://localhost:3001/en/relativity | grep -oE "FIG.[0-9]+" | sort -u
kill %1 2>/dev/null
```

Expected: all 28 routes (10 topics + 1 physicist + 17 glossary) return 200; branch hub lists FIG.01 through FIG.20 as live (with FIG.21 onward also listed as `coming-soon` placeholders).

If any 500: the most common causes per Session 1:
- (a) `<Term>` block-level → make inline.
- (b) HTML entity inside `$...$` math → use literal character.
- (c) `paragraphsToBlocks` shape mismatch in seed → re-run with correct helper.
- (d) `<Term slug="...">` referencing a topic slug instead of glossary slug → fix MDX, re-publish.

Mid-flight fixes get their own commit (e.g., `fix(rt/§04): un-escape ... in <slug>`) — same pattern as Session 1's commit 7123d24.

- [ ] **Step 6: Update spec progress**

Open `docs/superpowers/specs/2026-04-29-relativity-branch-design.md`. Update:

- Status header (line 4): `**Status:** in progress — 20/61 topics shipped (33%); §01 + §02 + §03 + §04 shipped 2026-04-29`.
- Module status table:
  - `§03 Spacetime geometry | 5 | 5 | ☑ complete`
  - `§04 Relativistic dynamics | 5 | 5 | ☑ complete`
  - Total row: `**Total** | **61** | **20** | **33% complete**`.
- Per-topic checklist: flip 10 boxes 11–20.

- [ ] **Step 7: MemPalace implementation log**

Write to `wing=physics, room=decisions` via the `mempalace_kg_add` MCP tool with `room=decisions`, `kind=note`:

```
File name: implementation_log_rt_session_2_spacetime_geometry_dynamics.md
```

Mirror the structure of `implementation_log_rt_session_1_sr_foundations_kinematics.md`. Cover:
- Wave-by-wave summary (commits, file counts, runtime, deviations).
- (a) Did the §03.5 twin-paradox proper-time-integral money shot land — did the kinked-worldline / shorter-proper-time visual produce the "acceleration is geometry, not a force" click?
- (b) Did the §04.2 binding-energy curve money shot land — did the "iron peak as the universe's energy budget pivot" intuition land?
- (c) Did the §03.4 four-vectors honest moment land — did "the algebra was geometry all along" feel earned, or did it land too didactically?
- (d) Any §04.1 four-momentum LaTeX gotchas? Did `\begin{pmatrix}` for the boost matrix round-trip cleanly (Session 1 confirmed yes; verify Session 2 holds)? Did μν index notation `\Lambda^\mu{}_\nu` parse cleanly?
- (e) Any forward-refs to §05–§06 that became explicit `// FORWARD-REF` placeholders?
- (f) Hebrew translation policy (defer to bulk machine-translation pass after English ships, same as Session 1).
- (g) Did the RT §03.4 → EM §11.5 four-potential cross-ref land cleanly? Did §04.1 → EM §11.3 field-tensor cross-ref land?
- (h) Was the Compton-vs-Anderson combined/split decision the right call? Did §04.5 prose feel like Anderson needed his own physicist entry?
- (i) Did the slug-collision risk on `mass-energy-equivalence` and `four-momentum` (topic slug ↔ glossary slug coexistence) hold cleanly per the RT Session 1 `time-dilation` precedent?
- (j) `SpacetimeDiagramCanvas` reuse: 5 of 5 §03 topics — did it amortize cleanly, or did any §03 topic need a new prop / API change?

- [ ] **Step 8: Two final commits**

```bash
git add scripts/content/seed-rt-02.ts # only if modified post-seed-run for forward-ref placeholders
git add lib/content/glossary.ts # if new structural entries were added during forward-ref scan
git commit -m "$(cat <<'EOF'
chore(rt/§03-§04): seed Compton + 17 glossary terms into Supabase

[describe forward-ref placeholders added if any]

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"

git add docs/superpowers/specs/2026-04-29-relativity-branch-design.md docs/superpowers/plans/2026-04-29-relativity-session-2-spacetime-geometry-dynamics.md
git commit -m "$(cat <<'EOF'
docs(rt/§03-§04): mark spacetime geometry + relativistic dynamics complete — 20/61 (33%)

20 of 61 topics shipped. SR is half-done. Next session: §05 + §06
(SR applications + equivalence principle, the SR closer + GR bridge).

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

- [ ] **Step 9: Report back**

Report to Roman:
- 10 §03+§04 topics live at `/en/relativity/<slug>` (200 OK on all).
- Compton + 17 glossary terms in Supabase.
- `SpacetimeDiagramCanvas` reused unchanged across all 5 §03 topics.
- Spec progress: 20/61 (33%); SR half-done after Session 2.
- Total commits this session: target 14 (1 Wave 0 + 1 Wave 1 + 10 Wave 2.5 + 1 Wave 3 seed + 1 Wave 3 spec) — give-or-take 1 for forward-ref placeholders or mid-flight LaTeX fix.
- MemPalace log filed.
- Surprises / deviations.
- Recommended for Session 3: §05 + §06 (SR applications + equivalence principle, 8 topics).

---

## Definition of done

- [ ] 10 §03+§04 topic statuses flipped from `coming-soon` → `live` in `lib/content/branches.ts`.
- [ ] `lib/physics/relativity/types.ts` extended with `intervalSquared`, `classifyInterval`, `LightConeQuadrant`, `FourMomentum`, `restMass`.
- [ ] Per-topic vitest suites green for all 10 §03+§04 topics.
- [ ] All 10 §03+§04 topic pages render `200` at `/en/relativity/<slug>`.
- [ ] Branch hub `/en/relativity` lists FIG.01 through FIG.20 as live.
- [ ] Arthur Compton + 17 net new glossary entries live in Supabase via seed-rt-02.
- [ ] `pnpm build` clean.
- [ ] `pnpm tsc --noEmit` clean.
- [ ] `pnpm vitest run` green.
- [ ] Spec progress table updated to 20/61 (33%).
- [ ] MemPalace implementation log filed at `wing=physics, room=decisions, file=implementation_log_rt_session_2_spacetime_geometry_dynamics.md`.
- [ ] Total commits this session: 14 ± 1.

## Risk notes

- **§04.1 four-momentum LaTeX density** — μν index gymnastics, four-vector dot product, energy-momentum-mass triangle, boost matrix all in one topic. `\begin{pmatrix}` confirmed clean (Session 1 §02.3 lesson) — use freely; have `\begin{aligned}` row-stacked form as fallback if any single equation parses empty.
- **§03.4 honest-moment voice** — don't soften. The reader should feel the §02 algebra collapse into one geometric object. The Callout should produce a "huh — yeah, of course" reaction. If a Wave 2 agent over-academicizes, request a tone revision before commit.
- **§03.5 twin-paradox visual** — the kinked-worldline / shorter-proper-time visual is THE money shot. Get the orange `accelerated: true` palette working with the `SpacetimeDiagramCanvas`. The `properTimeAlongWorldline` integrator from §03.4 should produce numerically correct values that the §03.5 scene displays as a HUD running tally.
- **§04.2 binding-energy curve** — the actual money shot. Use the AME-2020 sample data; iron at the peak; annotate fusion/fission domains; integrate the metaphor (the universe's energy budget is the area under this curve).
- **Slug collision: `four-momentum` topic vs `four-momentum` glossary; `mass-energy-equivalence` topic vs same glossary** — coexist cleanly per Session 1's `time-dilation` precedent. **Do NOT add `-term` suffix.** `kind`-namespaced rows in `content_entries` keep them apart.
- **Forward-refs to §05/§06** — likely candidates: `bell-spaceship-paradox`, `barn-pole-paradox` (§05); `gps-as-relativity` (§05); `gravitational-redshift` (§06). Treat as plain Markdown links to the `coming-soon` stubs; do not author placeholder topics.
- **EM↔RT cross-refs** — RT §03.4 → EM §11.5 four-potential (`<Term slug="four-potential" />` for the glossary entry; plain Markdown link `[EM application](/electromagnetism/four-potential-and-em-lagrangian)` for the topic). RT §04.1 → EM §11.3 field-tensor (plain Markdown link only). DO NOT duplicate the EM treatments.
- **`paragraphsToBlocks` helper** — copy seed-rt-01 verbatim. Don't paraphrase.
- **Stale dev server cache on port 3000** — start curl-smoke server on port 3001 per RT Session 1 lesson.
- **Compton-vs-Anderson combined-vs-split** — default skip Anderson; Dirac (existing) absorbs the §04.5 link via relatedTopics append. If §04.5 author flags during Wave 2 that the muon-vs-positron parallel demands Anderson as a distinct figure, follow up — do not split this session.
- **HTML entity rejection inside KaTeX `$...$` math** — Session 1 §02.5 lesson; use literal `>`, `<`, `&`. The JSX-tag risk applies only to bare prose, NOT to math context.
- **`<Term>` and `<PhysicistLink>` MUST be inline** in a paragraph, never block-level standalone JSX. Session 1 §01.5 lesson.

## Spec self-review — done

**Coverage:** every §03 + §04 topic in spec maps to a Wave 2 task (Tasks 3–12). Status flips handled in Wave 0 Task 1 Step 1. Types extension handled in Wave 0 Task 1 Steps 3–4. Compton physicist + 17 glossary terms handled in Wave 1 Task 2. §03 money shot (twin-paradox) flagged in Task 7; §04 money shot (binding-energy curve) flagged in Task 9; honest moment (four-vectors-and-proper-time) flagged in Task 6; §04 closer / §05+§06 bridge flagged in Task 12. Voice reminders threaded through Wave 2 shared instructions. Cross-refs to EM §11.3 + §11.5 explicit in Tasks 6 + 8. Slug-collision watch (topic-vs-glossary on `four-momentum` + `mass-energy-equivalence`) called out in Wave 1 Step 4 + Risk notes. New physicist (Compton; Anderson skipped) handled in Wave 1 Step 2. Spec-progress update + MemPalace log handled in Wave 3.

**Type consistency:** `intervalSquared`, `classifyInterval`, `LightConeQuadrant` exported from `lib/physics/relativity/types.ts` Wave 0 — used by Tasks 4 (invariant-interval), 5 (light-cones-and-causality). `FourMomentum`, `restMass` exported same — used by Tasks 8 (four-momentum), 10 (relativistic-collisions), 11 (compton-scattering), 12 (threshold-energy-and-pair-production). `gamma`, `boostX`, `applyMatrix` carry forward from Session 1 — used by Tasks 6 (four-vectors-and-proper-time), 8 (four-momentum). `Worldline` used by Tasks 3 (spacetime-diagrams), 4 (the-invariant-interval), 5 (light-cones-and-causality), 6 (four-vectors-and-proper-time), 7 (the-twin-paradox via `accelerated: true`). `fourMomentum`, `minkowskiNormSquared`, `boostFourMomentum` Task 8 internals — used by Tasks 10, 11, 12. All consistent.

**Placeholder scan:** none. Every step has either complete code, a complete prose outline with section word counts, or a concrete shell command with expected output.

**Plan complete.**
