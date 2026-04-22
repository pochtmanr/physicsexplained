# EM Session 3 — §04 Magnetic Fields in Matter + §05 Electrodynamics & Induction Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ship 9 topics — §04 Magnetic Fields in Matter (4 topics, FIG.17–20) and §05 Electrodynamics & Induction (5 topics, FIG.21–25). Each topic renders at `/en/electromagnetism/<slug>` with bespoke visualizations, vector-calculus prose under Calculus Policy A, and a physicist/glossary cross-reference graph that resolves at build time against Supabase `content_entries`. After Session 3, the EM branch progress jumps from 16/66 (24%) to 25/66 (38%). This closes the statics era and opens the dynamic one.

**Architecture:** Five waves — the battle-tested Session 2 structure, carried forward unchanged:

1. **Wave 1** (serial, 1 agent) edits the data layer: `branches.ts`, `physicists.ts`, `glossary.ts`. One scaffolding commit.
2. **Wave 1.5** (inline, orchestrator) — *skipped this session*. The Session 2 log confirms `MU_0`, `SPEED_OF_LIGHT`, `BOHR_MAGNETON` already cover §04 + §05; no new constants are needed. (Boltzmann appears in paramagnetism's Curie law only as an equation-block symbol, not as a code constant the physics lib consumes; keep it inline.) The orchestrator should announce "Wave 1.5 skipped — no new constants" before dispatching Wave 2.
3. **Wave 2** (9 parallel agents) authors the full per-topic vertical slice — physics lib + vitest tests + scene components + `page.tsx` + `content.en.mdx` — but does NOT touch registries, does NOT publish, does NOT commit. Returns a structured handoff block to the orchestrator.
4. **Wave 2.5** (serial, orchestrator) merges registry entries + publishes + commits per topic (9 commits).
5. **Wave 3** (serial, 1 agent) writes `scripts/content/seed-em-03.ts` (the CRITICAL cross-ref gotcha from §01/§02) and runs it to seed prose for the new physicists + glossary terms into Supabase, then runs full build/curl smoke, updates the spec progress table to 25/66 (38%), and ships the session-end commits.

**Tech Stack:** Next.js 15 (App Router), React 19, TypeScript strict, Tailwind v4, MDX (`@next/mdx`), Canvas 2D for visualizations, Supabase `content_entries`, Vitest for physics-lib tests, KaTeX via rehype-katex.

**Spec:** `docs/superpowers/specs/2026-04-22-electromagnetism-branch-design.md` — read the §04 + §05 sections (lines 127–155), the "Voice, audience, and calculus policy" block (lines 36–52), and "Integration checklist (per topic)" (lines 422–455) before starting.

**Prerequisite reading for subagents:**
1. `docs/superpowers/plans/2026-04-22-electromagnetism-session-2-fields-in-matter-magnetostatics.md` — the exact precedent. This plan is a near-clone of that one's structure.
2. MemPalace: `mempalace_search "EM Session 2" --wing physics` returns `implementation_log_em_session_2_fields_in_matter_magnetostatics.md`. Read it for (a) the Vec3 race condition and its mitigation (local-fallback + canonical-import), (b) the `lib/physics/electromagnetism/` nested namespace convention, (c) the soft-hysteresis voice precedent for §04.3, (d) the fresnel-equations forward-ref placeholder pattern.
3. MemPalace: `mempalace_search "EM Session 1" --wing physics` — baseline gotchas (3 pre-existing test failures, parallel-safety contract, `visualization-registry.tsx` not touched).
4. An existing Session 2 topic under `app/[locale]/(topics)/electromagnetism/` — `the-lorentz-force/` and `piezo-and-ferroelectricity/` are the closest precedents for voice density, scene count, and aside-link style.
5. `scripts/content/seed-em-02.ts` — template for the Wave 3 seed script.

---

## File structure

### New files

**Physics libs (one per topic, pure TS, nested `lib/physics/electromagnetism/<topic>.ts`):**
- `lib/physics/electromagnetism/magnetization.ts`
- `lib/physics/electromagnetism/magnetic-materials.ts`
- `lib/physics/electromagnetism/ferromagnetism.ts`
- `lib/physics/electromagnetism/superconductivity.ts`
- `lib/physics/electromagnetism/faradays-law.ts`
- `lib/physics/electromagnetism/lenz-motional-emf.ts`
- `lib/physics/electromagnetism/inductance.ts`
- `lib/physics/electromagnetism/magnetic-energy.ts`
- `lib/physics/electromagnetism/eddy-currents.ts`

**Physics tests (one per physics lib):**
- `tests/physics/electromagnetism/magnetization.test.ts`
- `tests/physics/electromagnetism/magnetic-materials.test.ts`
- `tests/physics/electromagnetism/ferromagnetism.test.ts`
- `tests/physics/electromagnetism/superconductivity.test.ts`
- `tests/physics/electromagnetism/faradays-law.test.ts`
- `tests/physics/electromagnetism/lenz-motional-emf.test.ts`
- `tests/physics/electromagnetism/inductance.test.ts`
- `tests/physics/electromagnetism/magnetic-energy.test.ts`
- `tests/physics/electromagnetism/eddy-currents.test.ts`

**Simulation components (27 total — 3 per topic, floor; agents may add a 4th where the prose earns it):**

§04.1 Magnetization and the H field (FIG.17):
- `components/physics/magnetization-vectors-scene.tsx`
- `components/physics/h-vs-b-field-scene.tsx`
- `components/physics/chi-vs-temperature-scene.tsx`

§04.2 Dia- and paramagnetism (FIG.18):
- `components/physics/orbital-response-scene.tsx`
- `components/physics/paramagnet-alignment-scene.tsx`
- `components/physics/susceptibility-spectrum-scene.tsx`

§04.3 Ferromagnetism, domains, hysteresis (FIG.19, money shot):
- `components/physics/hysteresis-domain-scene.tsx` *(money shot — two synchronized panels)*
- `components/physics/curie-transition-scene.tsx`
- `components/physics/domain-wall-motion-scene.tsx`

§04.4 Superconductivity and the Meissner effect (FIG.20):
- `components/physics/meissner-expulsion-scene.tsx`
- `components/physics/levitation-scene.tsx`
- `components/physics/critical-temperature-scene.tsx`

§05.1 Faraday's law of induction (FIG.21):
- `components/physics/magnet-through-coil-scene.tsx`
- `components/physics/flux-change-area-scene.tsx`
- `components/physics/faraday-disk-scene.tsx`

§05.2 Lenz's law and motional EMF (FIG.22):
- `components/physics/lenz-opposition-scene.tsx`
- `components/physics/sliding-rod-emf-scene.tsx`
- `components/physics/jumping-ring-scene.tsx`

§05.3 Self and mutual inductance (FIG.23):
- `components/physics/inductor-current-buildup-scene.tsx`
- `components/physics/mutual-induction-scene.tsx`
- `components/physics/rl-time-constant-scene.tsx`

§05.4 Energy in magnetic fields (FIG.24):
- `components/physics/magnetic-energy-density-scene.tsx`
- `components/physics/inductor-energy-ramp-scene.tsx`
- `components/physics/capacitor-vs-inductor-scene.tsx`

§05.5 Eddy currents and magnetic braking (FIG.25, money shot):
- `components/physics/magnet-through-tube-scene.tsx` *(money shot — slow-mo falling magnet + induced current bands)*
- `components/physics/induction-heating-scene.tsx`
- `components/physics/magnetic-brake-scene.tsx`

**Content pages (one folder per topic, each containing `page.tsx` + `content.en.mdx`):**
- `app/[locale]/(topics)/electromagnetism/magnetization-and-the-h-field/`
- `app/[locale]/(topics)/electromagnetism/dia-and-paramagnetism/`
- `app/[locale]/(topics)/electromagnetism/ferromagnetism-and-hysteresis/`
- `app/[locale]/(topics)/electromagnetism/superconductivity-and-meissner/`
- `app/[locale]/(topics)/electromagnetism/faradays-law/`
- `app/[locale]/(topics)/electromagnetism/lenz-law-and-motional-emf/`
- `app/[locale]/(topics)/electromagnetism/self-and-mutual-inductance/`
- `app/[locale]/(topics)/electromagnetism/energy-in-magnetic-fields/`
- `app/[locale]/(topics)/electromagnetism/eddy-currents/`

**Seed script (Wave 3):**
- `scripts/content/seed-em-03.ts`

### Modified files

- `lib/content/branches.ts` — append 9 new topic entries to `ELECTROMAGNETISM_TOPICS` (FIG.17–FIG.25). `ELECTROMAGNETISM_MODULES` already contains `magnetism-in-matter` (index 4) and `induction` (index 5); no module-list edits needed.
- `lib/content/physicists.ts` — add 5 new physicists: `pierre-weiss`, `walther-meissner`, `heike-kamerlingh-onnes`, `joseph-henry`, `heinrich-lenz`. Append §04/§05 `relatedTopics` to existing `michael-faraday`, `pierre-curie`, `leon-foucault` entries.
- `lib/content/glossary.ts` — add 24 new terms (see Wave 1 Step 4 for the exact list).
- `lib/content/simulation-registry.ts` — register all 27 new sim components (orchestrator merges in Wave 2.5).
- `docs/superpowers/specs/2026-04-22-electromagnetism-branch-design.md` — check 9 boxes, update §04 row to 4/4, §05 row to 5/5, total to 25/66 (38%), update status line (Wave 3 Step 4).

### NOT modified
- `lib/physics/constants.ts` — no new constants this session (see Wave 1.5 note above).
- `components/physics/visualization-registry.tsx` — same policy as §01/§02: only glossary tile previews use it, and no new §04/§05 glossary term uses a `visualization` field, so leave untouched.

---

## Wave 1 — Data layer (serial, single subagent)

### Task 1: Scaffold §04 + §05 in `branches.ts`, add physicists, add glossary terms

**Files:**
- Modify: `/Users/romanpochtman/Developer/physics/lib/content/branches.ts`
- Modify: `/Users/romanpochtman/Developer/physics/lib/content/physicists.ts`
- Modify: `/Users/romanpochtman/Developer/physics/lib/content/glossary.ts`

- [ ] **Step 1: Append 9 new topic entries to `ELECTROMAGNETISM_TOPICS`**

Open `lib/content/branches.ts`. Find the `ELECTROMAGNETISM_TOPICS` array (currently 16 entries, ending at the `magnetic-dipoles` entry around line 496). Append 9 entries immediately after the last existing entry, preserving the existing trailing-comma style:

```typescript
  {
    slug: "magnetization-and-the-h-field",
    title: "MAGNETIZATION AND THE H FIELD",
    eyebrow: "FIG.17 · MAGNETIC FIELDS IN MATTER",
    subtitle: "Matter's answer to an applied magnetic field.",
    readingMinutes: 12,
    status: "live",
    module: "magnetism-in-matter",
  },
  {
    slug: "dia-and-paramagnetism",
    title: "DIAMAGNETISM AND PARAMAGNETISM",
    eyebrow: "FIG.18 · MAGNETIC FIELDS IN MATTER",
    subtitle: "The quiet magnets hiding in almost everything.",
    readingMinutes: 11,
    status: "live",
    module: "magnetism-in-matter",
  },
  {
    slug: "ferromagnetism-and-hysteresis",
    title: "FERROMAGNETISM, DOMAINS, AND HYSTERESIS",
    eyebrow: "FIG.19 · MAGNETIC FIELDS IN MATTER",
    subtitle: "Why iron remembers, and why the memory can be erased.",
    readingMinutes: 13,
    status: "live",
    module: "magnetism-in-matter",
  },
  {
    slug: "superconductivity-and-meissner",
    title: "SUPERCONDUCTIVITY AND THE MEISSNER EFFECT",
    eyebrow: "FIG.20 · MAGNETIC FIELDS IN MATTER",
    subtitle: "When the field is not just weakened — it is thrown out.",
    readingMinutes: 12,
    status: "live",
    module: "magnetism-in-matter",
  },
  {
    slug: "faradays-law",
    title: "FARADAY'S LAW OF INDUCTION",
    eyebrow: "FIG.21 · ELECTRODYNAMICS & INDUCTION",
    subtitle: "A changing magnetic field brings an electric field with it.",
    readingMinutes: 12,
    status: "live",
    module: "induction",
  },
  {
    slug: "lenz-law-and-motional-emf",
    title: "LENZ'S LAW AND MOTIONAL EMF",
    eyebrow: "FIG.22 · ELECTRODYNAMICS & INDUCTION",
    subtitle: "Nature pushes back against the change that caused it.",
    readingMinutes: 11,
    status: "live",
    module: "induction",
  },
  {
    slug: "self-and-mutual-inductance",
    title: "SELF AND MUTUAL INDUCTANCE",
    eyebrow: "FIG.23 · ELECTRODYNAMICS & INDUCTION",
    subtitle: "Why a coil resists its own changing current.",
    readingMinutes: 12,
    status: "live",
    module: "induction",
  },
  {
    slug: "energy-in-magnetic-fields",
    title: "ENERGY IN MAGNETIC FIELDS",
    eyebrow: "FIG.24 · ELECTRODYNAMICS & INDUCTION",
    subtitle: "Where the energy goes when the current ramps up.",
    readingMinutes: 11,
    status: "live",
    module: "induction",
  },
  {
    slug: "eddy-currents",
    title: "EDDY CURRENTS AND MAGNETIC BRAKING",
    eyebrow: "FIG.25 · ELECTRODYNAMICS & INDUCTION",
    subtitle: "The invisible circuits that stop a falling magnet.",
    readingMinutes: 11,
    status: "live",
    module: "induction",
  },
```

- [ ] **Step 2: Add 5 new physicists to `PHYSICISTS`**

Open `lib/content/physicists.ts`. Confirm none of the 5 slugs below already exist:

```bash
grep -nE 'slug: "(pierre-weiss|walther-meissner|heike-kamerlingh-onnes|joseph-henry|heinrich-lenz)"' lib/content/physicists.ts
```

Expected: no matches. Then append entries matching the existing structural-only shape (slug + born + died + nationality + image + relatedTopics). Insert them at the end of the array, just before the closing `];` (after the most recently added physicist from Session 2, `hendrik-antoon-lorentz`):

```typescript
  {
    slug: "pierre-weiss",
    born: "1865",
    died: "1940",
    nationality: "French",
    image: storageUrl("physicists/pierre-weiss.avif"),
    relatedTopics: [
      { branchSlug: "electromagnetism", topicSlug: "ferromagnetism-and-hysteresis" },
      { branchSlug: "electromagnetism", topicSlug: "dia-and-paramagnetism" },
    ],
  },
  {
    slug: "walther-meissner",
    born: "1882",
    died: "1974",
    nationality: "German",
    image: storageUrl("physicists/walther-meissner.avif"),
    relatedTopics: [
      { branchSlug: "electromagnetism", topicSlug: "superconductivity-and-meissner" },
    ],
  },
  {
    slug: "heike-kamerlingh-onnes",
    born: "1853",
    died: "1926",
    nationality: "Dutch",
    image: storageUrl("physicists/heike-kamerlingh-onnes.avif"),
    relatedTopics: [
      { branchSlug: "electromagnetism", topicSlug: "superconductivity-and-meissner" },
    ],
  },
  {
    slug: "joseph-henry",
    born: "1797",
    died: "1878",
    nationality: "American",
    image: storageUrl("physicists/joseph-henry.avif"),
    relatedTopics: [
      { branchSlug: "electromagnetism", topicSlug: "faradays-law" },
      { branchSlug: "electromagnetism", topicSlug: "self-and-mutual-inductance" },
    ],
  },
  {
    slug: "heinrich-lenz",
    born: "1804",
    died: "1865",
    nationality: "Russian",
    image: storageUrl("physicists/heinrich-lenz.avif"),
    relatedTopics: [
      { branchSlug: "electromagnetism", topicSlug: "lenz-law-and-motional-emf" },
    ],
  },
```

> **Image fallback:** if the storage bucket doesn't yet have AVIFs for one of these physicists, `<PhysicistLink>` falls back to a placeholder. Don't pre-upload; the orchestrator can sync images in a follow-up.

- [ ] **Step 3: Append §04/§05 `relatedTopics` to existing physicists**

Find each of the three entries below in `PHYSICISTS` and **append** the new related-topic refs to their existing `relatedTopics` arrays (do NOT replace):

- **`michael-faraday`** (line ~744). Currently has three `relatedTopics`: `the-electric-field`, `conductors-and-shielding`, `the-vector-potential`. Append all five §05 induction topics — Faraday is the anchor of the entire module:
  ```typescript
      { branchSlug: "electromagnetism", topicSlug: "faradays-law" },
      { branchSlug: "electromagnetism", topicSlug: "lenz-law-and-motional-emf" },
      { branchSlug: "electromagnetism", topicSlug: "self-and-mutual-inductance" },
      { branchSlug: "electromagnetism", topicSlug: "energy-in-magnetic-fields" },
      { branchSlug: "electromagnetism", topicSlug: "eddy-currents" },
  ```

- **`pierre-curie`** (line ~755). Currently has only `piezo-and-ferroelectricity`. Append:
  ```typescript
      { branchSlug: "electromagnetism", topicSlug: "ferromagnetism-and-hysteresis" },
      { branchSlug: "electromagnetism", topicSlug: "dia-and-paramagnetism" },
  ```
  Reason: the Curie temperature anchors the ferromagnetism phase transition, and Curie's law anchors paramagnetic susceptibility.

- **`leon-foucault`** (line ~44). Currently has only `the-simple-pendulum` from CM. Append:
  ```typescript
      { branchSlug: "electromagnetism", topicSlug: "eddy-currents" },
  ```
  Reason: "eddy currents" was known as "Foucault currents" for decades after Foucault demonstrated them with a swinging copper disk in 1855.

- [ ] **Step 4: Add 24 new glossary terms to `GLOSSARY`**

Open `lib/content/glossary.ts`. For each of the following slugs, confirm absence before adding. Append the entries at the end of the array, matching the existing structural-only shape (slug + category + optional relatedPhysicists + relatedTopics). A quick blanket-absence check:

```bash
grep -nE 'slug: "(magnetization|h-field|magnetic-susceptibility|magnetic-permeability|diamagnetism|paramagnetism|ferromagnetism|magnetic-domain|hysteresis-loop|coercivity|remanence|curie-temperature|superconductivity|meissner-effect|critical-temperature|electromagnetic-induction|faradays-law-term|lenzs-law-term|emf|motional-emf|self-inductance|mutual-inductance|henry-unit|back-emf|eddy-current|magnetic-energy-density|transformer|flux-linkage)"' lib/content/glossary.ts
```

Expected: no matches. (If any DO match, skip that slug in the list below.)

**§04 Magnetic fields in matter — 11 terms:**

```typescript
  {
    slug: "magnetization",
    category: "concept",
    relatedTopics: [
      { branchSlug: "electromagnetism", topicSlug: "magnetization-and-the-h-field" },
      { branchSlug: "electromagnetism", topicSlug: "dia-and-paramagnetism" },
      { branchSlug: "electromagnetism", topicSlug: "ferromagnetism-and-hysteresis" },
    ],
  },
  {
    slug: "h-field",
    category: "concept",
    relatedTopics: [
      { branchSlug: "electromagnetism", topicSlug: "magnetization-and-the-h-field" },
    ],
  },
  {
    slug: "magnetic-susceptibility",
    category: "concept",
    relatedTopics: [
      { branchSlug: "electromagnetism", topicSlug: "magnetization-and-the-h-field" },
      { branchSlug: "electromagnetism", topicSlug: "dia-and-paramagnetism" },
    ],
  },
  {
    slug: "magnetic-permeability",
    category: "concept",
    relatedTopics: [
      { branchSlug: "electromagnetism", topicSlug: "magnetization-and-the-h-field" },
    ],
  },
  {
    slug: "diamagnetism",
    category: "phenomenon",
    relatedTopics: [
      { branchSlug: "electromagnetism", topicSlug: "dia-and-paramagnetism" },
      { branchSlug: "electromagnetism", topicSlug: "superconductivity-and-meissner" },
    ],
  },
  {
    slug: "paramagnetism",
    category: "phenomenon",
    relatedPhysicists: ["pierre-curie"],
    relatedTopics: [
      { branchSlug: "electromagnetism", topicSlug: "dia-and-paramagnetism" },
    ],
  },
  {
    slug: "ferromagnetism",
    category: "phenomenon",
    relatedPhysicists: ["pierre-curie", "pierre-weiss"],
    relatedTopics: [
      { branchSlug: "electromagnetism", topicSlug: "ferromagnetism-and-hysteresis" },
    ],
  },
  {
    slug: "magnetic-domain",
    category: "concept",
    relatedPhysicists: ["pierre-weiss"],
    relatedTopics: [
      { branchSlug: "electromagnetism", topicSlug: "ferromagnetism-and-hysteresis" },
    ],
  },
  {
    slug: "hysteresis-loop",
    category: "concept",
    relatedTopics: [
      { branchSlug: "electromagnetism", topicSlug: "ferromagnetism-and-hysteresis" },
      { branchSlug: "electromagnetism", topicSlug: "piezo-and-ferroelectricity" },
    ],
  },
  {
    slug: "curie-temperature",
    category: "concept",
    relatedPhysicists: ["pierre-curie"],
    relatedTopics: [
      { branchSlug: "electromagnetism", topicSlug: "ferromagnetism-and-hysteresis" },
    ],
  },
  {
    slug: "meissner-effect",
    category: "phenomenon",
    relatedPhysicists: ["walther-meissner"],
    relatedTopics: [
      { branchSlug: "electromagnetism", topicSlug: "superconductivity-and-meissner" },
    ],
  },
  {
    slug: "critical-temperature",
    category: "concept",
    relatedPhysicists: ["heike-kamerlingh-onnes"],
    relatedTopics: [
      { branchSlug: "electromagnetism", topicSlug: "superconductivity-and-meissner" },
    ],
  },
```

That's 12 §04 terms (the grep list counted conservatively; we'll ship all 12 provided none collide).

**§05 Electrodynamics & induction — 12 terms:**

```typescript
  {
    slug: "electromagnetic-induction",
    category: "phenomenon",
    relatedPhysicists: ["michael-faraday", "joseph-henry"],
    relatedTopics: [
      { branchSlug: "electromagnetism", topicSlug: "faradays-law" },
    ],
  },
  {
    slug: "faradays-law-term",
    category: "concept",
    relatedPhysicists: ["michael-faraday"],
    relatedTopics: [
      { branchSlug: "electromagnetism", topicSlug: "faradays-law" },
    ],
  },
  {
    slug: "lenzs-law-term",
    category: "concept",
    relatedPhysicists: ["heinrich-lenz"],
    relatedTopics: [
      { branchSlug: "electromagnetism", topicSlug: "lenz-law-and-motional-emf" },
    ],
  },
  {
    slug: "emf",
    category: "concept",
    relatedTopics: [
      { branchSlug: "electromagnetism", topicSlug: "faradays-law" },
      { branchSlug: "electromagnetism", topicSlug: "lenz-law-and-motional-emf" },
    ],
  },
  {
    slug: "motional-emf",
    category: "concept",
    relatedTopics: [
      { branchSlug: "electromagnetism", topicSlug: "lenz-law-and-motional-emf" },
    ],
  },
  {
    slug: "self-inductance",
    category: "concept",
    relatedPhysicists: ["joseph-henry"],
    relatedTopics: [
      { branchSlug: "electromagnetism", topicSlug: "self-and-mutual-inductance" },
    ],
  },
  {
    slug: "mutual-inductance",
    category: "concept",
    relatedTopics: [
      { branchSlug: "electromagnetism", topicSlug: "self-and-mutual-inductance" },
    ],
  },
  {
    slug: "henry-unit",
    category: "unit",
    relatedPhysicists: ["joseph-henry"],
    relatedTopics: [
      { branchSlug: "electromagnetism", topicSlug: "self-and-mutual-inductance" },
    ],
  },
  {
    slug: "back-emf",
    category: "concept",
    relatedTopics: [
      { branchSlug: "electromagnetism", topicSlug: "self-and-mutual-inductance" },
    ],
  },
  {
    slug: "eddy-current",
    category: "phenomenon",
    relatedPhysicists: ["leon-foucault"],
    relatedTopics: [
      { branchSlug: "electromagnetism", topicSlug: "eddy-currents" },
    ],
  },
  {
    slug: "magnetic-energy-density",
    category: "concept",
    relatedTopics: [
      { branchSlug: "electromagnetism", topicSlug: "energy-in-magnetic-fields" },
    ],
  },
  {
    slug: "flux-linkage",
    category: "concept",
    relatedTopics: [
      { branchSlug: "electromagnetism", topicSlug: "faradays-law" },
      { branchSlug: "electromagnetism", topicSlug: "self-and-mutual-inductance" },
    ],
  },
```

> **Slug-collision policy carried over from §01/§02:** `faradays-law-term` and `lenzs-law-term` use the `-term` suffix because `faradays-law` is a topic slug (Session 3 ships it this session) and `lenzs-law` is close enough to the `lenz-law-and-motional-emf` topic slug to warrant disambiguation. Same precedent as `biot-savart-law-term` / `amperes-law-term`. **`eddy-current`** is singular so it does NOT collide with the plural topic slug `eddy-currents`; no suffix needed.

> **Intentional omissions this session (do NOT add):**
> - **`superconductivity`** — deferred because the topic slug `superconductivity-and-meissner` is close; revisit in a later session if needed (decision: don't add in structural TS this session, but Wave 3 *will* seed a `superconductivity` forward-ref placeholder if any Wave 2 MDX uses `<Term slug="superconductivity">`).
> - **`london-penetration-depth`** — only relevant if a Wave 2 agent chooses to mention it in prose; treat as forward-ref, decide at Wave 3.
> - **`generator`, `transformer`** — belong to §06 Circuits. Session 3 prose mentions them in §05.5 and §05.3 but as plain text (not `<Term>`), so no glossary entry needed this session.
> - **`displacement-current`** — belongs to §07 Maxwell. Session 2 established `displacement-field` already; §05 can reference `<Term slug="displacement-field">` for its preview callout without forcing a new entry. If Wave 2 agents feel they need a distinct `displacement-current` term, add as forward-ref placeholder in Wave 3.

Total new glossary terms: **24** (12 §04 + 12 §05).

- [ ] **Step 5: Verify with tsc and tests**

```bash
pnpm tsc --noEmit
pnpm vitest run tests/content/
```

Expected: clean. The 3 pre-existing test failures from §01 + §02 (turbulence numeric, parse-mdx pendulum golden, references env-var) are NOT new — verify by stashing your changes and re-running once if anything looks suspicious. They are NOT this session's responsibility.

- [ ] **Step 6: Commit**

```bash
git add lib/content/branches.ts lib/content/physicists.ts lib/content/glossary.ts
git commit -m "$(cat <<'EOF'
feat(em/§04-§05): scaffold magnetism-in-matter + induction, physicists, glossary

Adds 9 new topic entries to ELECTROMAGNETISM_TOPICS (FIG.17–FIG.25).
Adds Weiss, Meissner, Kamerlingh Onnes, Henry, Lenz to PHYSICISTS
(structural only — prose seeded via scripts/content/seed-em-03.ts in Wave 3).
Adds 24 §04/§05 glossary terms (structural only). Appends EM relatedTopics
to Faraday (+5 induction topics), Curie (+ferro, +para), Foucault (+eddy).

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Wave 1.5 — SKIPPED this session

The Session 2 implementation log confirms `MU_0`, `SPEED_OF_LIGHT`, and `BOHR_MAGNETON` already cover every §04 + §05 equation. No new code constants required.

Where Boltzmann's constant appears in the Curie-law prose for paramagnetism, it is a symbol in an `<EquationBlock>` caption, not a value any physics-lib function consumes — the lib works in dimensionless reduced units. If a Wave 2 agent believes they need a new constant, they should STOP, flag it to the orchestrator, and the orchestrator will run an ad-hoc Wave 1.5 before dispatching the remaining agents. Otherwise: proceed directly from Wave 1's commit to Wave 2 dispatch.

Orchestrator should announce: **"Wave 1.5 skipped — no new constants needed."**

---

## Wave 2 — Per-topic authoring (9 parallel subagents)

Each task below is a complete vertical slice. A subagent can complete any one task independently once Wave 1 has landed.

### Shared instructions for every Wave 2 task — READ FIRST

This is the parallel-safety contract from the §01/§02 implementation logs:

1. **DO NOT touch `lib/content/simulation-registry.ts`.** The orchestrator merges all registry entries serially in Wave 2.5.
2. **DO NOT touch `components/physics/visualization-registry.tsx`.** It's only used for glossary tile previews; no Session 3 glossary term uses it.
3. **DO NOT run `pnpm content:publish`.** Orchestrator publishes serially in Wave 2.5.
4. **DO NOT commit.** Orchestrator commits per-topic in Wave 2.5.
5. **Shared-types contract (the Vec3 race-condition fix from §02):** Session 3 does not introduce new cross-agent types by default. If an agent believes it needs a new shared type (e.g. `Inductor`, `FluxLinkage`), it MUST (a) export the type from its own physics-lib file with a clear JSDoc comment, (b) ship a *local copy* of the type in any downstream consumer's file with a `// TODO orchestrator: replace with import` comment. The orchestrator dedupes during Wave 2.5. This mirrors the biot-savart → lorentz reconciliation that worked in §02.
6. **Return** (in the agent's final message) a **structured handoff block** with three fields:
   - **`registry`:** the exact import + registry-entry block(s) to insert into `lib/content/simulation-registry.ts`, formatted identically to the Session 2 blocks at lines 400–497 (section comment `// EM §04 — <slug>` or `// EM §05 — <slug>`, then one `NameScene: lazyScene(() => import(...))` entry per scene).
   - **`publishArg`:** the exact content slug for `pnpm content:publish --only`, e.g. `electromagnetism/ferromagnetism-and-hysteresis`.
   - **`commitSubject`:** a single-line commit subject, e.g. `feat(em/§04): ferromagnetism-and-hysteresis — domains, hysteresis loop, Curie transition`.

**Per-topic substructure (every task follows this skeleton):**

1. **Physics lib** (`lib/physics/electromagnetism/<topic>.ts`) — pure TS, no React. Imports from `@/lib/physics/constants` (needs `MU_0` for every §05 topic). Reuses `Vec3` from `@/lib/physics/electromagnetism/lorentz` if 3D is needed; `Vec2` from `@/lib/physics/coulomb` for 2D cases.
2. **Physics tests** (`tests/physics/electromagnetism/<topic>.test.ts`) — vitest. 3–8 test cases per topic with at least one known-value case per exported function.
3. **Simulation components** (`components/physics/<name>-scene.tsx`) — `"use client"` named exports, Canvas 2D animation loop via `requestAnimationFrame`, dark canvas, font-mono HUD. Extended color palette established in §03:
   - `#FF6ADE` (magenta) for + charges / north pole
   - cyan for − charges / south pole / field accents
   - `#FFD66B` (amber) for resultant vectors / motion cues
   - `rgba(120,220,255,…)` for B-field arrows
   - NEW for §04/§05: `rgba(120,255,170,…)` for induced EMF direction indicators (green-cyan, visually distinguished from applied B).
   Match `lorentz-trajectory-scene.tsx` for the canonical pattern. Every §05 topic scene must include a clear right-hand-rule visual cue somewhere on the canvas (axes badge bottom-left, curl arrow, or both) — this was the §03 risk-note carry-forward.
4. **Content page** (`app/[locale]/(topics)/electromagnetism/<slug>/page.tsx`) — copy verbatim from `app/[locale]/(topics)/electromagnetism/the-lorentz-force/page.tsx` (lines 1–48) and change ONLY the `SLUG` constant.
5. **MDX content** (`content.en.mdx`) — compose from `<TopicPageLayout aside={[...]}>`, `<TopicHeader>`, numbered `<Section index="N" title="…">`s, `<SceneCard caption="FIG.XXa — …" className="w-full"><ComponentName /></SceneCard>`, `<EquationBlock id="EQ.0X">…</EquationBlock>`s, `<Callout variant="intuition|math|warning">`s, inline `<PhysicistLink slug="…" />` and `<Term slug="…" />` cross-refs. Target word count: 1100–1400 per topic (Session 2 median was 1378). Use at least two `<PhysicistLink>` and three `<Term>` per topic. Aside array should hold 3–5 entries.

**Voice reminder (Calculus Policy A):** every topic that uses ∮ / ∇× / ∇· / ∇ / d/dt / ∫dℓ / ∫dA must explain the symbol in plain words first, in-context, before the equation form. The `aside` link to `/dictionary/<slug>` is a "go deeper" anchor, not the explanation. The reader who lands on this topic from a search engine must finish it without depending on any other topic.

**Cross-ref discipline:** `<PhysicistLink slug="…">` is only valid for slugs present in `PHYSICISTS` after Wave 1. For Session 3, the allowed set is: everyone from §01 + §02 + §03 (Coulomb, Franklin, Gauss, Faraday, Poisson, Curie, Ørsted, Ampère, Biot, Savart, Lorentz) plus the 5 new ones (Weiss, Meissner, Kamerlingh Onnes, Henry, Lenz) plus any earlier CM physicist that's relevant (e.g. Foucault for eddy currents). Anyone else (Einstein, Heisenberg, Oppenheimer, Richard Feynman, etc.) gets a plain-text mention.

Similarly `<Term slug="…">` is only valid for slugs present in `GLOSSARY` after Wave 1 OR already seeded from earlier sessions. If the agent wants to use a term not in the list, it should flag it in the handoff block under an optional `forwardRefs: [slug1, slug2]` field so Wave 3 knows to seed a placeholder.

**§04 voice reminder — the Meissner/ferromagnetism surprise is the payoff of this module.** Lean into the reveal. Iron remembers; superconductors expel. These are not incremental facts; they are phase transitions that feel like magic until the reader sees the domain / flux-expulsion story. Kurzgesagt, not Griffiths.

**§05 voice reminder — every topic ramps toward Maxwell.** Faraday's law is the first time `∂B/∂t` enters a field equation; that's the door §07 walks through. Call it out. Don't spoil it, but set the hook.

---

### Task 2: Topic `magnetization-and-the-h-field` (FIG.17, §04)

**Goal:** why matter responds to B at all. M as volume-averaged atomic moments. The H field as B "minus the material's contribution," and why H is the useful bookkeeping field when currents (not magnets) are what you control. Linear regime: M = χ_m H; μ = μ₀(1 + χ_m).

**Files:**
- Create: `lib/physics/electromagnetism/magnetization.ts`
- Create: `tests/physics/electromagnetism/magnetization.test.ts`
- Create: `components/physics/magnetization-vectors-scene.tsx`
- Create: `components/physics/h-vs-b-field-scene.tsx`
- Create: `components/physics/chi-vs-temperature-scene.tsx`
- Create: `app/[locale]/(topics)/electromagnetism/magnetization-and-the-h-field/page.tsx`
- Create: `app/[locale]/(topics)/electromagnetism/magnetization-and-the-h-field/content.en.mdx`

- [ ] **Step 1: Write `lib/physics/electromagnetism/magnetization.ts`**

```typescript
import { MU_0 } from "@/lib/physics/constants";

/** Auxiliary H field from B and M: H = B/μ₀ − M. */
export function hFromBM(B: number, M: number): number {
  return B / MU_0 - M;
}

/** Linear-regime magnetisation: M = χ_m · H. */
export function linearMagnetization(H: number, chi: number): number {
  return chi * H;
}

/** Relative permeability: μ_r = 1 + χ_m. */
export function relativePermeability(chi: number): number {
  return 1 + chi;
}

/** Absolute permeability: μ = μ₀ · (1 + χ_m). */
export function absolutePermeability(chi: number): number {
  return MU_0 * (1 + chi);
}

/** B from H in a linear material: B = μ₀(1 + χ_m)·H. */
export function bFromHLinear(H: number, chi: number): number {
  return absolutePermeability(chi) * H;
}
```

- [ ] **Step 2: Write `tests/physics/electromagnetism/magnetization.test.ts`**

```typescript
import { describe, expect, it } from "vitest";
import {
  hFromBM,
  linearMagnetization,
  relativePermeability,
  absolutePermeability,
  bFromHLinear,
} from "@/lib/physics/electromagnetism/magnetization";
import { MU_0 } from "@/lib/physics/constants";

describe("hFromBM", () => {
  it("returns B/μ₀ when M is zero (vacuum)", () => {
    expect(hFromBM(2e-3, 0)).toBeCloseTo(2e-3 / MU_0, 4);
  });
  it("subtracts M from B/μ₀ in matter", () => {
    expect(hFromBM(2e-3, 100)).toBeCloseTo(2e-3 / MU_0 - 100, 4);
  });
});

describe("linearMagnetization", () => {
  it("scales with susceptibility", () => {
    expect(linearMagnetization(1000, 2.5e-5)).toBeCloseTo(2.5e-2, 10);
  });
  it("returns 0 when χ_m is 0", () => {
    expect(linearMagnetization(1000, 0)).toBe(0);
  });
});

describe("relativePermeability", () => {
  it("equals 1 in vacuum", () => {
    expect(relativePermeability(0)).toBe(1);
  });
  it("is slightly less than 1 for diamagnets (χ < 0)", () => {
    expect(relativePermeability(-1e-5)).toBeCloseTo(0.99999, 6);
  });
});

describe("absolutePermeability", () => {
  it("equals μ₀ in vacuum", () => {
    expect(absolutePermeability(0)).toBeCloseTo(MU_0, 15);
  });
});

describe("bFromHLinear", () => {
  it("B = μ₀ H in vacuum", () => {
    expect(bFromHLinear(1000, 0)).toBeCloseTo(MU_0 * 1000, 10);
  });
  it("B > μ₀ H for paramagnet (χ > 0)", () => {
    expect(bFromHLinear(1000, 1e-3)).toBeGreaterThan(MU_0 * 1000);
  });
});
```

- [ ] **Step 3: Write the 3 simulation components**

`magnetization-vectors-scene.tsx` — a 2D slab of material under an external B (shown as amber arrows entering from the left). A 6×4 lattice of atomic-moment arrows inside the slab. Two regimes toggled by a button: "paramagnet" — moments nudge toward B with thermal jitter; "ferromagnet" — moments snap en masse to align. HUD: applied field, volume-averaged M, χ_m.

`h-vs-b-field-scene.tsx` — parallel-plate magnet analogue: a long solenoid with a permeable core slid partially inside. Two-panel split. Top: B-field lines (cyan) — continuous across the core/air boundary but denser inside. Bottom: H-field lines (amber) — discontinuous normal component (source terms from the bound "magnetic charges" on the core faces), identical strength inside and outside the solenoid's free current. Reader sees why H is easier to reason about when you know the *free* current but not the internal magnetisation.

`chi-vs-temperature-scene.tsx` — a small multi-line chart. Three curves over a temperature range: (a) diamagnet — flat, slightly negative; (b) paramagnet — Curie's 1/T law; (c) ferromagnet — near-singular at T_c, then collapsing to paramagnet behaviour above. Slider for the x-axis range so the reader can zoom into the ferromagnetic critical region.

- [ ] **Step 4: Write `page.tsx`** (copy from `the-lorentz-force/page.tsx`, change `SLUG` constant only):

```typescript
const SLUG = "electromagnetism/magnetization-and-the-h-field";
```

- [ ] **Step 5: Write `content.en.mdx`**

Outline (target 1200–1400 words):
1. **§1 Why matter isn't passive** — every atom has orbiting electrons, hence tiny current loops, hence tiny magnetic moments. Ordinarily they point every direction and cancel. In a magnet, or in a paramagnet near a field, they don't. ~200 words.
2. **§2 Magnetisation M** — define M as the average magnetic moment per unit volume. Units: A/m. Plain words: "how aligned are the atoms, per cubic metre." Link to `/dictionary/magnetization`. ~200 words.
3. **§3 Where M comes from** — SceneCard `MagnetizationVectorsScene`. Toggle between paramagnet (thermal jitter + slight bias) and ferromagnet (collective lock-in). The distinction anchors §04.2 and §04.3. ~250 words.
4. **§4 The H field** — the bookkeeping field. EQ.01: **H = B/μ₀ − M**. Plain words: H is "the part of B you put there with free currents, after you back out what the material contributes." Why H is useful: it ignores bound currents (just as D ignored bound charges in §02). ~250 words.
5. **§5 H vs B in a solenoid with a core** — SceneCard `HVsBFieldScene`. Two-panel comparison. ~200 words.
6. **§6 Linear materials** — for most stuff, M = χ_m H, giving B = μ₀(1 + χ_m) H = μ H. EQ.02–03. Three families of χ_m: negative (diamagnets), small positive (paramagnets), huge and nonlinear (ferromagnets). Preview the next three topics. SceneCard `ChiVsTemperatureScene`. ~250 words.
7. **§7 Where it shows up** — every transformer core, every inductor specifying "μ_r = 2000," every MRI scanner's field-focusing iron. ~150 words.

Aside (3–5 items):
- `{ type: "term", label: "Magnetisation", href: "/dictionary/magnetization" }`
- `{ type: "term", label: "H field", href: "/dictionary/h-field" }`
- `{ type: "term", label: "Magnetic susceptibility", href: "/dictionary/magnetic-susceptibility" }`
- `{ type: "term", label: "Magnetic permeability", href: "/dictionary/magnetic-permeability" }`

**Commit subject:** `feat(em/§04): magnetization-and-the-h-field — M, H, μ, and why matter responds to B`

---

### Task 3: Topic `dia-and-paramagnetism` (FIG.18, §04)

**Goal:** the two boring-but-important regimes. Diamagnetism: Lenz-induced orbital currents oppose the applied B (χ < 0). Paramagnetism: unpaired spins partially align, thermally disrupted (χ > 0, follows Curie's law χ ∝ 1/T). Every ordinary material is one or the other.

**Files:**
- Create: `lib/physics/electromagnetism/magnetic-materials.ts`, `tests/physics/electromagnetism/magnetic-materials.test.ts`
- Create: `components/physics/orbital-response-scene.tsx`
- Create: `components/physics/paramagnet-alignment-scene.tsx`
- Create: `components/physics/susceptibility-spectrum-scene.tsx`
- Create: topic folder + page.tsx + content.en.mdx

- [ ] **Step 1–5 per shared structure.**

**Physics lib** (`lib/physics/electromagnetism/magnetic-materials.ts`):

```typescript
/** Curie's law: χ = C / T for paramagnets. C is the Curie constant (material-specific, K). */
export function curieSusceptibility(curieConstant: number, temperature: number): number {
  if (temperature <= 0) throw new Error("temperature must be positive (Kelvin)");
  return curieConstant / temperature;
}

/** Langevin function L(x) = coth(x) − 1/x; averaged magnetisation at dimensionless x = μB/(kT). */
export function langevin(x: number): number {
  if (Math.abs(x) < 1e-6) return x / 3; // series expansion to avoid 0/0
  return 1 / Math.tanh(x) - 1 / x;
}

/** Paramagnetic M from Langevin: M = n·μ·L(μB/kT). Returns A/m. */
export function paramagneticM(
  n: number,
  moment: number,
  B: number,
  kT: number,
): number {
  if (kT <= 0) throw new Error("kT must be positive");
  const x = (moment * B) / kT;
  return n * moment * langevin(x);
}

/** Rough diamagnetic susceptibility model: χ_dia ≈ −μ₀ · n · e²·⟨r²⟩ / (6·m_e). Returns dimensionless. */
export function diamagneticSusceptibility(
  n: number,
  rSquared: number,
  electronChargeSquaredOverMass: number,
  mu0: number,
): number {
  return (-mu0 * n * electronChargeSquaredOverMass * rSquared) / 6;
}
```

**Tests:** Curie's law returns positive χ for positive T; langevin(0.001) ≈ 0.000333; langevin(large x) → 1; paramagnetic M saturates at high B; diamagnetic χ is negative.

**Sim components:**
- `orbital-response-scene.tsx` — single atom, two concentric orbits with electrons running in opposite senses. When an external B is ramped on (amber arrow grows from top), Lenz's law speeds up one orbit and slows the other, giving a *net* induced moment antiparallel to B. Caption: "diamagnetism is universal — every material has it; in most, paramagnetism or ferromagnetism dominates."
- `paramagnet-alignment-scene.tsx` — 40 spins in a 2D grid, each a magenta/cyan arrow. At high T (thermal jitter cranked via slider), spins point randomly. As T cools, they increasingly bias toward B. Graph HUD: M vs T overlaid with Curie's 1/T law.
- `susceptibility-spectrum-scene.tsx` — log-scale bar chart of χ_m for ~12 everyday materials: bismuth (strong dia), water (weak dia), copper (weak dia), vacuum (0), aluminum (weak para), oxygen gas (moderate para), liquid oxygen (strong para), iron (off-chart — note that and link forward to §04.3). Hover reveals the numeric value. Reader gets a feel for "most materials are either very slightly positive or very slightly negative."

**Prose outline (target ~1200 words):**
1. **§1 Two quiet regimes** — most materials respond to a magnetic field. The response is usually small. ~150 words.
2. **§2 Diamagnetism — everyone's baseline** — SceneCard `OrbitalResponseScene`. Lenz-style orbital response. Universal; small; negative. EQ.01 schematic χ_dia expression. ~300 words.
3. **§3 Paramagnetism — spins biased by B** — SceneCard `ParamagnetAlignmentScene`. Unpaired spins partially align; thermal motion fights them. ~250 words.
4. **§4 Curie's law** — EQ.02: χ = C/T. Experimental fact Pierre Curie extracted from his doctoral data. ~200 words.
5. **§5 The spectrum of χ_m** — SceneCard `SusceptibilitySpectrumScene`. Order-of-magnitude tour. ~200 words.
6. **§6 Where it shows up** — superconducting-magnet pole pieces built from low-χ materials; paramagnetic contrast agents in MRI (gadolinium); levitating frogs in strong diamagnetic fields. ~150 words.

Aside: Curie, Weiss, diamagnetism, paramagnetism, magnetic-susceptibility.

**Commit subject:** `feat(em/§04): dia-and-paramagnetism — the two quiet regimes and Curie's law`

---

### Task 4: Topic `ferromagnetism-and-hysteresis` (FIG.19, §04 MONEY SHOT)

**Goal:** the surprise module. Iron's atoms don't just bias — they cooperate. Weiss's 1907 domain theory: regions of uniform alignment separated by thin walls; the bulk shows net magnetisation only when domains reconfigure. The hysteresis loop as the record of domain-wall motion with friction. Curie temperature as the phase transition above which cooperation breaks.

**Files:**
- Create: `lib/physics/electromagnetism/ferromagnetism.ts`, `tests/physics/electromagnetism/ferromagnetism.test.ts`
- Create: `components/physics/hysteresis-domain-scene.tsx` *(money shot)*
- Create: `components/physics/curie-transition-scene.tsx`
- Create: `components/physics/domain-wall-motion-scene.tsx`
- Create: topic folder

- [ ] **Step 1–5 per shared structure.**

**Physics lib** (`lib/physics/electromagnetism/ferromagnetism.ts`):

```typescript
/**
 * Smooth hysteresis model — the piezo-and-ferroelectricity precedent.
 * Soft loop with realistic Pr/Psat ≈ 0.38 (not idealised square).
 * Given current applied field H and previous state (H_prev, M_prev),
 * return the new M using a tanh-based switching curve with coercivity Hc.
 */
export interface HysteresisParams {
  Msat: number;       // saturation magnetisation
  Hc: number;         // coercive field (positive)
  remanence: number;  // Mr as fraction of Msat (0..1), e.g. 0.38 for soft iron
}

export function ferromagneticM(
  H: number,
  prev: { H: number; M: number },
  params: HysteresisParams,
): number {
  const { Msat, Hc, remanence } = params;
  const k = 3 / Hc; // steepness so the curve bends around ±Hc
  const goingUp = H >= prev.H;
  const offset = goingUp ? -remanence * Msat : remanence * Msat;
  // Position along the branch; saturate via tanh.
  const branch = Msat * Math.tanh(k * H) + offset * (1 - Math.tanh(k * H) ** 2);
  return Math.max(-Msat, Math.min(Msat, branch));
}

/** Curie-Weiss susceptibility above T_c: χ = C / (T − T_c). Diverges at T_c. */
export function curieWeiss(curieConstant: number, T: number, Tc: number): number {
  if (T <= Tc) throw new Error("curieWeiss defined only for T > T_c");
  return curieConstant / (T - Tc);
}

/**
 * Spontaneous magnetisation below T_c (mean-field, Landau expansion).
 * M(T) / Msat ≈ √(1 − T/Tc) for T < Tc; 0 for T ≥ Tc.
 */
export function spontaneousMagnetisation(T: number, Tc: number, Msat: number): number {
  if (T >= Tc) return 0;
  return Msat * Math.sqrt(1 - T / Tc);
}
```

**Tests:** hysteresis loop closes after a full cycle (within tolerance); remnant M at H=0 is near Mr (positive on descending branch, negative on ascending); Curie-Weiss diverges as T → T_c+; spontaneous M is 0 above T_c and √ near T_c-.

**Sim components:**
- `hysteresis-domain-scene.tsx` ***(money shot — this is the image the reader screenshots)*** — two synchronized panels driven by the same applied-H value (auto-ramped back and forth, or slider-driven).
  - **Left panel:** B vs H plot, trace drawing live. Soft hysteresis loop (remanence 0.38·Msat per the Session 2 soft-loop precedent). Highlight the points Hc (coercive field, zero crossing of B on descending branch) and Br (remanent B at H=0). Grid lines, numeric HUD.
  - **Right panel:** 12×8 domain mosaic, each cell a magenta-or-cyan arrow. Domain walls (thin amber lines). As H sweeps, domain walls advance or retreat by cells flipping in clumps; at saturation, one colour fills the grid. Barkhausen-style stepwise flipping (not smooth) — add slight audio-less "click" via a subtle visual flash when a cell changes colour.
  - Both panels update in lockstep. A vertical marker on the left panel pins which point on the loop the mosaic corresponds to.
- `curie-transition-scene.tsx` — M(T) vs T. Smooth drop from Msat at T=0 to 0 at T_c, following the √(1 − T/T_c) mean-field shape. Slider for T_c. Dotted extension for T > T_c showing the paramagnetic Curie-Weiss tail (1/(T−T_c) susceptibility). Caption: "the phase transition you can see in your hand."
- `domain-wall-motion-scene.tsx` — zoomed-in 3×3 view of one domain wall. Slider for applied H. At small H, wall bulges slightly (reversible). At moderate H, wall breaks free of a pinning site and jumps (irreversible Barkhausen jump). Reveals the microscopic origin of hysteresis loss.

**Prose outline (target ~1400 words — this is the denser topic):**
1. **§1 Iron's cooperative trick** — most materials give χ_m of order 10⁻⁵. Iron's is 10⁴ to 10⁶. That ratio is not about bigger magnets; it is about cooperation between neighbours. ~200 words.
2. **§2 Domains** — each region of ~µm size is already fully magnetised. A virgin piece of iron looks unmagnetised because its domains point different directions and cancel. SceneCard `DomainWallMotionScene` can also slot here; pick one. ~250 words.
3. **§3 The hysteresis loop — money shot** — SceneCard `HysteresisDomainScene`. Explain as you narrate the sweep: starting from demagnetised state (origin), apply H, domains flip and the piece saturates at Msat. Reduce H; domains lock, M stays near Msat = *remanence* at H=0 (Br). Reverse H; a specific magnitude Hc forces domains to flip the other way (coercive field). Back and forth forever. EQ.01 sketch + area = hysteresis loss per cycle. ~350 words.
4. **§4 The Curie temperature** — heat iron past ~1043 K and ferromagnetism vanishes; cool back and it returns. SceneCard `CurieTransitionScene`. EQ.02 Curie-Weiss law above T_c. This is a phase transition — the first second-order phase transition in this branch. ~250 words.
5. **§5 Soft vs hard materials** — soft: low Hc, low remanence (transformer cores — you want easy switching and low loss). Hard: high Hc, high remanence (permanent magnets — you want the field to stick). ~200 words.
6. **§6 Where it shows up** — every speaker, every DC motor, every hard-disk platter, every MRI main magnet's iron return yoke, every refrigerator magnet, the Earth's core field (the geodynamo plus locked ancient magnetisation in basalt). ~150 words.

Aside: Pierre Curie, Pierre Weiss, ferromagnetism, magnetic-domain, hysteresis-loop, curie-temperature.

**Commit subject:** `feat(em/§04): ferromagnetism-and-hysteresis — domains, hysteresis loop, Curie transition`

---

### Task 5: Topic `superconductivity-and-meissner` (FIG.20, §04)

**Goal:** below T_c, the resistance goes to zero AND the material expels its internal B field. The second part is the Meissner effect, and it means a superconductor is more than a perfect conductor — it is a phase of matter whose defining property is B = 0 inside. Introduce Kamerlingh Onnes (1911, mercury at 4.2 K), Meissner (1933, lead and tin expel field), and the phenomenological London equations as a preview of why λ_L exists.

**Files:**
- Create: `lib/physics/electromagnetism/superconductivity.ts`, `tests/physics/electromagnetism/superconductivity.test.ts`
- Create: `components/physics/meissner-expulsion-scene.tsx`
- Create: `components/physics/levitation-scene.tsx`
- Create: `components/physics/critical-temperature-scene.tsx`
- Create: topic folder

- [ ] **Step 1–5 per shared structure.**

**Physics lib** (`lib/physics/electromagnetism/superconductivity.ts`):

```typescript
/**
 * Resistance step at the critical temperature.
 * R(T) = R_0 for T > T_c; near-zero (returns 0 exactly) for T ≤ T_c.
 */
export function resistance(T: number, Tc: number, R0: number): number {
  return T > Tc ? R0 : 0;
}

/**
 * London penetration depth λ_L inside a type-I superconductor.
 * B(x) = B_0 · exp(−x/λ_L), where x is depth from the surface.
 */
export function bPenetration(B0: number, depth: number, lambdaL: number): number {
  if (lambdaL <= 0) throw new Error("lambdaL must be positive");
  return B0 * Math.exp(-depth / lambdaL);
}

/** Empirical λ_L temperature dependence (two-fluid model): λ(T) = λ_0 / √(1 − (T/Tc)^4). */
export function londonDepthVsT(lambda0: number, T: number, Tc: number): number {
  if (T >= Tc) return Infinity;
  return lambda0 / Math.sqrt(1 - Math.pow(T / Tc, 4));
}

/** Critical field H_c(T) ≈ H_c0 · (1 − (T/Tc)^2). Superconductivity destroyed above H_c(T). */
export function criticalField(Hc0: number, T: number, Tc: number): number {
  if (T >= Tc) return 0;
  return Hc0 * (1 - Math.pow(T / Tc, 2));
}
```

**Tests:** resistance drops sharply at T_c; exponential penetration with depth; λ diverges as T → T_c; critical field is 0 at T_c, H_c0 at T=0.

**Sim components:**
- `meissner-expulsion-scene.tsx` — spherical sample in a uniform external B. Above T_c: field lines penetrate straight through. Slider drops T below T_c: field lines smoothly bend around the sphere (like fluid flow around a solid), exterior field rearranges, interior shows B = 0 (blue = cold, empty colour indicating no field). Differentiate from "hollow conductor" case by noting: this happens even if cooled *in the field*, which is why Meissner's discovery was a shock.
- `levitation-scene.tsx` — a small permanent magnet floating a few cm above a cooled YBCO puck (or idealised superconducting plate). Image-charge-like repulsion illustrated with a mirror-magnet drawn underneath the plate, as a dashed ghost. Visual echo of §01.07 method-of-images. Gentle floating wobble via damped sinusoid. Caption links to §01 method-of-images.
- `critical-temperature-scene.tsx` — reproduce Kamerlingh Onnes's 1911 chart: R vs T for mercury, sharp drop at 4.2 K. Slider for material: mercury (4.2 K), lead (7.2 K), niobium (9.3 K), YBCO (92 K). Each plot shows the same motif — sharp step. Caption includes the historical note: "the 1911 plot that started everything."

**Prose outline (target ~1300 words):**
1. **§1 Zero is a phase of matter** — Onnes's 1911 mercury measurement. Resistance didn't approach zero — it *became* zero, at 4.2 K, in a single measurement that dropped below his instrument's noise floor. ~200 words.
2. **§2 Not just zero resistance** — SceneCard `MeissnerExpulsionScene`. Meissner + Ochsenfeld, 1933: the material expels flux even if cooled in the field. A perfect conductor would trap the field it was cooled in (Lenz's law, no dissipation). A superconductor *doesn't*. This is the signature of a new phase. ~300 words.
3. **§3 Penetration depth** — EQ.01: B(x) = B₀·e^(−x/λ_L). Plain words: the field decays exponentially inside the surface, on a scale of ~100 nm. Not truly "zero inside" — zero only more than a few λ_L in. ~200 words.
4. **§4 Levitation** — SceneCard `LevitationScene`. The method-of-images picture: flux expulsion is formally equivalent to an image magnet underneath the sample that repels the real one. Callout linking to `/electromagnetism/method-of-images`. ~200 words.
5. **§5 Critical temperature and field** — SceneCard `CriticalTemperatureScene`. T_c varies dramatically: 4.2 K (Hg), 92 K (YBCO 1986), 203 K (hydrogen sulfide under 155 GPa, 2015). Room-temperature superconductor still open. ~200 words.
6. **§6 What it's good for** — MRI superconducting magnets, maglev trains (Meissner-based), SQUIDs measuring femtotesla fields, LHC dipole magnets. Brief honest note: the microscopic theory is BCS (1957), Cooper pairs; covered in QUANTUM branch, future. ~200 words.

Aside: Kamerlingh Onnes, Meissner, meissner-effect, critical-temperature, diamagnetism (superconductors are the ultimate diamagnet).

**Commit subject:** `feat(em/§04): superconductivity-and-meissner — zero resistance, flux expulsion, levitation`

---

### Task 6: Topic `faradays-law` (FIG.21, §05)

**Goal:** a changing magnetic flux through a loop induces an EMF around the loop. EMF = −dΦ_B/dt. This is the first dynamic field equation; the minus sign is Lenz. Integral form for a wire loop; differential form ∇×E = −∂B/∂t is the first piece of Maxwell's synthesis. Faraday's 1831 disk generator as the historical hook.

**Files:**
- Create: `lib/physics/electromagnetism/faradays-law.ts`, `tests/physics/electromagnetism/faradays-law.test.ts`
- Create: `components/physics/magnet-through-coil-scene.tsx`
- Create: `components/physics/flux-change-area-scene.tsx`
- Create: `components/physics/faraday-disk-scene.tsx`
- Create: topic folder

- [ ] **Step 1–5 per shared structure.**

**Physics lib** (`lib/physics/electromagnetism/faradays-law.ts`):

```typescript
/** Magnetic flux through a flat area with uniform B at angle θ to the area normal: Φ = B·A·cos θ. */
export function flux(B: number, area: number, theta: number): number {
  return B * area * Math.cos(theta);
}

/** Finite-difference EMF: EMF = −ΔΦ/Δt. N turns multiplies the signal. */
export function inducedEmf(
  fluxBefore: number,
  fluxAfter: number,
  dt: number,
  turns = 1,
): number {
  if (dt <= 0) throw new Error("dt must be positive");
  return -turns * (fluxAfter - fluxBefore) / dt;
}

/**
 * Faraday-disk EMF: a conducting disk of radius R rotating at angular speed ω in axial B
 * has an EMF between centre and rim of EMF = ½·B·ω·R².
 */
export function faradayDiskEmf(B: number, omega: number, R: number): number {
  return 0.5 * B * omega * R * R;
}
```

**Tests:** flux reduces to B·A at θ=0; EMF sign is negative when flux increases; Faraday disk at R=1, ω=1, B=1 gives exactly 0.5.

**Sim components:**
- `magnet-through-coil-scene.tsx` — bar magnet pushed toward and away from a multi-turn coil. Galvanometer needle deflects proportionally to the speed of motion, sign flips with direction. HUD: Φ(t), dΦ/dt, induced EMF. The canonical Faraday 1831 setup.
- `flux-change-area-scene.tsx` — rectangular wire loop with a sliding bar, lying in a uniform B pointing into the page. As the bar slides, the loop area changes, Φ changes, EMF is induced. Live arrow showing the induced current direction (by Lenz, opposing the change).
- `faraday-disk-scene.tsx` — 2D top-down view of Faraday's homopolar disk: conducting disk in axial B, rotating at ω. Shows radial charge accumulation, steady-state EMF between centre and rim. Slider for ω. Historical note: built by Faraday in 1831 — the first DC generator.

**Prose outline (~1250 words):**
1. **§1 Faraday's trick** — an 1831 experiment in his Royal Institution basement. Push a magnet into a coil: needle twitches. Hold it still: nothing. Pull it out: twitches the other way. ~250 words.
2. **§2 Flux through a loop** — Φ_B = ∫∫B·dA. Plain words: "how much B passes through the surface the loop bounds." EQ.01. ~200 words.
3. **§3 Faraday's law — integral form** — EMF = −dΦ_B/dt. Plain words first, then EQ.02. The minus sign is Lenz (next topic). Emphasise: the *only* thing that matters is how fast Φ changes — not what caused it (moving magnet, changing current, rotating loop are all equivalent). ~300 words.
4. **§4 Three ways to change Φ** — (a) move the magnet; (b) change B via a changing current elsewhere (mutual-inductance preview); (c) change the area or orientation of the loop in a static B. SceneCards `MagnetThroughCoilScene` + `FluxChangeAreaScene`. ~250 words.
5. **§5 The Faraday disk** — SceneCard `FaradayDiskScene`. ½BωR² EMF. First practical generator. Historical hook: Faraday built this from a hand-cranked copper disk in 1831. ~200 words.
6. **§6 Differential form preview** — ∇×E = −∂B/∂t. Plain-words gloss for the curl (link to `/dictionary/curl`, already in glossary from §03). Paired with §03's ∇×B = μ₀J, you now have two of Maxwell's four equations in dynamic form. Preview §07 displacement current. ~200 words.
7. **§7 Where it shows up** — every generator in every power plant on Earth, every induction cooktop, every transformer primary-to-secondary coupling, every contactless-charger pad, every magnetic swipe card, RFID tags. ~200 words.

Aside: Faraday, Joseph Henry (independent US discovery), Lenz (preview), electromagnetic-induction, faradays-law-term, emf, flux-linkage.

**Commit subject:** `feat(em/§05): faradays-law — EMF = −dΦ/dt, three ways to change flux, differential form preview`

---

### Task 7: Topic `lenz-law-and-motional-emf` (FIG.22, §05)

**Goal:** the minus sign in Faraday's law, spelled out. The induced current always flows in the direction that opposes the change. For a rod sliding in a uniform B: EMF = BLv; induced current opposes the motion (magnetic braking). The "Thomson jumping ring" as the memorable demo.

**Files:**
- Create: `lib/physics/electromagnetism/lenz-motional-emf.ts`, `tests/physics/electromagnetism/lenz-motional-emf.test.ts`
- Create: `components/physics/lenz-opposition-scene.tsx`
- Create: `components/physics/sliding-rod-emf-scene.tsx`
- Create: `components/physics/jumping-ring-scene.tsx`
- Create: topic folder

- [ ] **Step 1–5 per shared structure.**

**Physics lib** (`lib/physics/electromagnetism/lenz-motional-emf.ts`):

```typescript
/** Motional EMF on a straight rod of length L moving at speed v perpendicular to uniform B: EMF = BLv. */
export function motionalEmf(B: number, L: number, v: number): number {
  return B * L * v;
}

/**
 * For a rod on rails with resistance R in the loop:
 * induced current I = BLv/R, retarding force F_mag = −B·I·L = −B²L²v/R.
 * Returns {I, F_mag}. F_mag is negative (opposes v).
 */
export function slidingRodDynamics(
  B: number, L: number, v: number, R: number,
): { I: number; F_mag: number } {
  if (R <= 0) throw new Error("R must be positive");
  const I = (B * L * v) / R;
  const F_mag = -B * I * L;
  return { I, F_mag };
}

/** Terminal velocity under constant applied force F_ext and rail resistance R: v_term = F_ext·R/(B²L²). */
export function terminalVelocity(F_ext: number, B: number, L: number, R: number): number {
  const denom = B * B * L * L;
  if (denom === 0) throw new Error("B·L must be nonzero");
  return (F_ext * R) / denom;
}
```

**Tests:** motionalEmf scales linearly with each of B, L, v; induced current has correct sign; retarding force points opposite to v; terminal velocity scales as expected.

**Sim components:**
- `lenz-opposition-scene.tsx` — magnet approaching a conducting loop. Induced current drawn as circulating arrows (green-cyan for "induced" accent). Second loop (no current) with a north-pole face repelling the incoming magnet — the induced loop temporarily becomes a magnet with the pole that pushes back. Reverse: as the magnet retreats, the induced pole flips to pull it back. Caption: "Nature's conservative streak."
- `sliding-rod-emf-scene.tsx` — rails in uniform B, rod sliding at v. Live HUD: Φ(t), EMF, I, F_mag (retarding). User toggles an external hand-force; rod accelerates toward terminal velocity. Time-series trace along the bottom.
- `jumping-ring-scene.tsx` — a vertical iron core with a primary coil at the base. An aluminium ring sits on top. AC is switched on; ring jumps into the air (sometimes metres). When the ring is cooled with liquid nitrogen first, it jumps higher (lower R → stronger induced current → stronger Lenz repulsion). Slow-motion animation.

**Prose outline (~1200 words):**
1. **§1 Nature is conservative** — the minus sign in Faraday's law is physical, not notational. The induced current *opposes* the change that caused it. Lenz realised this in 1834. ~200 words.
2. **§2 Lenz's law stated** — the induced current flows in whatever direction produces a B that opposes the change in flux. Plain-words version first. EQ.01 is the sign-decorated Faraday's law. SceneCard `LenzOppositionScene`. ~300 words.
3. **§3 Motional EMF** — SceneCard `SlidingRodEmfScene`. Derive EMF = BLv from F = qv×B on the charges in the rod. Match the §03 Lorentz-force derivation. EQ.02. ~300 words.
4. **§4 Magnetic braking from Lenz** — the induced current feels its own F = IL×B force back from the external field. The force is always retarding. This is the principle behind every regenerative-braking system. EQ.03 (v_term). ~200 words.
5. **§5 The jumping ring** — SceneCard `JumpingRingScene`. The classic Elihu Thomson demo from 1887. ~150 words.
6. **§6 Where it shows up** — eddy-current brakes on trains, induction cooktops (Lenz forces working on the pan), magnetic separation in recycling, anti-theft tags in stores. Preview §05.5 eddy-currents. ~150 words.

Aside: Lenz, Faraday, lenzs-law-term, motional-emf, emf.

**Commit subject:** `feat(em/§05): lenz-law-and-motional-emf — the minus sign, EMF=BLv, magnetic braking`

---

### Task 8: Topic `self-and-mutual-inductance` (FIG.23, §05)

**Goal:** L and M are proportionality constants between flux and current. Self-inductance: EMF = −L·dI/dt. Mutual inductance: flux through coil 2 from current in coil 1 is Φ₂₁ = M·I₁. The SI unit henry honours Joseph Henry (who independently discovered induction about the same time Faraday did). Back-EMF as the phenomenology of self-inductance in real circuits.

**Files:**
- Create: `lib/physics/electromagnetism/inductance.ts`, `tests/physics/electromagnetism/inductance.test.ts`
- Create: `components/physics/inductor-current-buildup-scene.tsx`
- Create: `components/physics/mutual-induction-scene.tsx`
- Create: `components/physics/rl-time-constant-scene.tsx`
- Create: topic folder

- [ ] **Step 1–5 per shared structure.**

**Physics lib** (`lib/physics/electromagnetism/inductance.ts`):

```typescript
import { MU_0 } from "@/lib/physics/constants";

/** Self-inductance of a long solenoid: L = μ₀ · N² · A / ℓ. */
export function solenoidSelfInductance(N: number, area: number, length: number): number {
  if (length <= 0) throw new Error("length must be positive");
  return (MU_0 * N * N * area) / length;
}

/** Toroid self-inductance: L = μ₀ · N² · h · ln(b/a) / (2π), where a/b are inner/outer radii, h height. */
export function toroidSelfInductance(N: number, h: number, a: number, b: number): number {
  if (a <= 0 || b <= a) throw new Error("require 0 < a < b");
  return (MU_0 * N * N * h * Math.log(b / a)) / (2 * Math.PI);
}

/** Self-induced EMF: EMF = −L · dI/dt. Returns a negative number when current is rising. */
export function selfInducedEmf(L: number, dIdt: number): number {
  return -L * dIdt;
}

/** Mutual inductance between two concentric solenoids (inner of N2, outer of n1 turns/m, area A_inner): M = μ₀·n1·N2·A_inner. */
export function concentricSolenoidMutual(
  n1: number, N2: number, areaInner: number,
): number {
  return MU_0 * n1 * N2 * areaInner;
}

/** RL time constant τ = L/R. */
export function rlTimeConstant(L: number, R: number): number {
  if (R <= 0) throw new Error("R must be positive");
  return L / R;
}

/** Current rise in an RL circuit switched onto EMF V at t=0: I(t) = (V/R)·(1 − e^(−t/τ)). */
export function rlCurrent(V: number, R: number, L: number, t: number): number {
  const tau = rlTimeConstant(L, R);
  return (V / R) * (1 - Math.exp(-t / tau));
}
```

**Tests:** solenoid L scales with N²; toroidal formula reduces correctly; self-induced EMF sign is opposite to dI/dt; rlCurrent starts at 0 and approaches V/R; rlCurrent at t=τ is ~63% of asymptote.

**Sim components:**
- `inductor-current-buildup-scene.tsx` — simple circuit with switch, battery, R, and an inductor. On switch-close, I rises with (1 − e^(−t/τ)). Panel shows the inductor's back-EMF drawing an opposing arrow across its terminals. Slider for L. Time-series trace.
- `mutual-induction-scene.tsx` — two coaxial coils. Primary current ramped up/down; secondary's EMF drawn in real time. Slider for geometric separation reveals the k coupling factor — pull secondary away and the induced EMF drops.
- `rl-time-constant-scene.tsx` — overlay of three RL transients with τ = 0.5, 1, 2 seconds. Visual grid at τ, 2τ, 3τ showing the 63% / 86% / 95% levels. Reader gets the "current fills a bucket" intuition.

**Prose outline (~1250 words):**
1. **§1 A coil resists its own changing current** — you try to increase the current in a coil. The current rises, but the rising current generates a rising B field, which generates a flux, which (by Faraday) generates an EMF *opposing* the current. The coil fights you. ~250 words.
2. **§2 Self-inductance L** — EQ.01: Φ = L·I, hence EMF = −L·dI/dt. Plain-words derivation before the equation. Units: henry = Vs/A. ~250 words.
3. **§3 Henry's story** — Joseph Henry, Princeton professor, discovered induction independently of Faraday around 1830. Published late. Named the SI unit. ~150 words.
4. **§4 Computing L for a solenoid** — EQ.02: L = μ₀ N² A / ℓ. SceneCard `InductorCurrentBuildupScene`. ~200 words.
5. **§5 Mutual inductance M** — two coils; a current in one produces flux through the other. EQ.03: Φ₂₁ = M I₁. SceneCard `MutualInductionScene`. Coupling coefficient k = M/√(L₁L₂) ∈ [0,1]. Transformer preview. ~250 words.
6. **§6 The RL time constant** — SceneCard `RLTimeConstantScene`. EQ.04 τ = L/R; EQ.05 I(t) = (V/R)(1 − e^(−t/τ)). Why current never quite reaches its max. ~200 words.
7. **§7 Where it shows up** — every switched-mode power supply, every induction motor, every magnetic-card reader, every NFC handshake, every ignition coil in an internal-combustion engine. ~150 words.

Aside: Joseph Henry, Faraday, self-inductance, mutual-inductance, henry-unit, back-emf.

**Commit subject:** `feat(em/§05): self-and-mutual-inductance — L, M, τ=L/R, and the back-EMF`

---

### Task 9: Topic `energy-in-magnetic-fields` (FIG.24, §05)

**Goal:** where does the work done against back-EMF go? Into the magnetic field. Energy stored in an inductor: U = ½LI². Energy density of a B field: u = B²/(2μ₀). Symmetry with §01 capacitance-and-field-energy's ½CV² and ½ε₀E². The field is a reservoir.

**Files:**
- Create: `lib/physics/electromagnetism/magnetic-energy.ts`, `tests/physics/electromagnetism/magnetic-energy.test.ts`
- Create: `components/physics/magnetic-energy-density-scene.tsx`
- Create: `components/physics/inductor-energy-ramp-scene.tsx`
- Create: `components/physics/capacitor-vs-inductor-scene.tsx`
- Create: topic folder

- [ ] **Step 1–5 per shared structure.**

**Physics lib** (`lib/physics/electromagnetism/magnetic-energy.ts`):

```typescript
import { MU_0 } from "@/lib/physics/constants";

/** Energy stored in an inductor carrying current I: U = ½ L I². */
export function inductorEnergy(L: number, I: number): number {
  return 0.5 * L * I * I;
}

/** Magnetic-field energy density: u = B²/(2μ₀). Returns J/m³. */
export function magneticEnergyDensity(B: number): number {
  return (B * B) / (2 * MU_0);
}

/**
 * Linear-material energy density (matter): u = (1/2) · H · B.
 * In the linear regime B = μH, this reduces to B²/(2μ).
 */
export function magneticEnergyDensityMatter(H: number, B: number): number {
  return 0.5 * H * B;
}

/** Total energy in a volume of uniform B: U = u · V. */
export function totalFieldEnergy(B: number, volume: number): number {
  return magneticEnergyDensity(B) * volume;
}
```

**Tests:** inductor energy at I=0 is 0; quadruples when I doubles; magneticEnergyDensity at B=1 T gives ~397.9 kJ/m³ (≈ 1/(2μ₀)); totalFieldEnergy scales linearly with volume.

**Sim components:**
- `magnetic-energy-density-scene.tsx` — 2D uniform B region. Colour shading proportional to u = B²/(2μ₀). Slider for B. Numeric readout in J/m³ alongside intuition scale ("this cubic metre at 2 T stores as much energy as a lit 100 W bulb for 17 minutes").
- `inductor-energy-ramp-scene.tsx` — inductor energy U(t) = ½L I(t)² traced as I ramps up from 0 to I_max. Side panel shows dU/dt = L I (dI/dt) matching the power the battery supplies against the back-EMF. Conservation check: ∫P dt = ½L I_max². ~200 words caption.
- `capacitor-vs-inductor-scene.tsx` — side-by-side panels. Left: capacitor filling up (from §01.5), U = ½CV², energy in E field. Right: inductor ramping up, U = ½LI², energy in B field. Same shape of graph; different meaning. Punchline: "electricity and magnetism are each other's mirror images."

**Prose outline (~1150 words):**
1. **§1 Where did the work go** — the battery pushed current against back-EMF. Doing work against a force moves energy somewhere. The somewhere is the magnetic field. ~200 words.
2. **§2 Energy stored in an inductor** — EQ.01: U = ½LI². Derivation from W = ∫ V·I dt with V = L·dI/dt. SceneCard `InductorEnergyRampScene`. ~250 words.
3. **§3 Energy density of a B field** — EQ.02: u = B²/(2μ₀). Plain-words derivation from "a solenoid has U = ½LI² *and* we computed L = μ₀N²A/ℓ *and* B_inside = μ₀NI/ℓ"; three substitutions give it. SceneCard `MagneticEnergyDensityScene`. ~300 words.
4. **§4 Symmetry with the electric case** — SceneCard `CapacitorVsInductorScene`. ½CV² ↔ ½LI². ½ε₀E² ↔ ½B²/μ₀. The fields are reservoirs. ~200 words.
5. **§5 Matter modifies energy density** — for linear media, u = ½H·B, which becomes B²/(2μ) with μ = μ₀(1+χ_m). Small note on nonlinear materials (ferromagnets) where the integral form is necessary. ~150 words.
6. **§6 Where it shows up** — energy storage in superconducting coils (SMES), flux pumps in tokamaks, the MRI ramp-up taking minutes at kA currents, pulsed-power Z-pinch experiments. ~150 words.

Aside: Faraday, self-inductance, magnetic-energy-density, field-energy-density (§01), H field.

**Commit subject:** `feat(em/§05): energy-in-magnetic-fields — U=½LI², u=B²/(2μ₀), the field as reservoir`

---

### Task 10: Topic `eddy-currents` (FIG.25, §05 MONEY SHOT)

**Goal:** when flux changes inside a bulk conductor, induced currents form closed loops — eddies. They dissipate energy as heat and produce retarding forces on whatever motion caused the flux change. The falling-magnet-in-copper-tube is the canonical demonstration; induction cooktops and magnetic brakes are the applications.

**Files:**
- Create: `lib/physics/electromagnetism/eddy-currents.ts`, `tests/physics/electromagnetism/eddy-currents.test.ts`
- Create: `components/physics/magnet-through-tube-scene.tsx` *(money shot)*
- Create: `components/physics/induction-heating-scene.tsx`
- Create: `components/physics/magnetic-brake-scene.tsx`
- Create: topic folder

- [ ] **Step 1–5 per shared structure.**

**Physics lib** (`lib/physics/electromagnetism/eddy-currents.ts`):

```typescript
/**
 * Terminal velocity of a magnet falling through a conducting tube (phenomenological model).
 * v_term = m·g / (k · σ · B_eff²), where k is a geometry factor (units m³).
 * The formula is not exact — it captures the scaling behaviour.
 */
export function tubeTerminalVelocity(
  mass: number,
  g: number,
  sigma: number,
  Beff: number,
  k: number,
): number {
  if (sigma <= 0 || Beff === 0 || k <= 0) {
    throw new Error("sigma, |B_eff|, and k must all be positive");
  }
  return (mass * g) / (k * sigma * Beff * Beff);
}

/**
 * Eddy-current power dissipated per unit volume in a sinusoidal field B(t) = B0 sin(ωt):
 * P/V = (π² B0² d² f²) / (6 ρ), where d is the thickness of the sheet, f is frequency, ρ is resistivity.
 * Classic "thin sheet" formula used in transformer-laminate design.
 */
export function eddyPowerDensity(
  B0: number, d: number, f: number, rho: number,
): number {
  if (rho <= 0) throw new Error("rho must be positive");
  return (Math.PI * Math.PI * B0 * B0 * d * d * f * f) / (6 * rho);
}

/** Simple magnetic-brake drag coefficient c such that F_drag = −c·v. For a disk, c ≈ σ·t·B²·A_eff. */
export function brakeDragCoefficient(
  sigma: number, thickness: number, B: number, areaEff: number,
): number {
  return sigma * thickness * B * B * areaEff;
}
```

**Tests:** terminal velocity inversely proportional to σ·B²; thinner laminations reduce eddy power as d²; brake drag scales with B².

**Sim components:**
- `magnet-through-tube-scene.tsx` ***(money shot — the image this topic is known for)*** — side view of a vertical copper tube. Bar magnet (magenta N / cyan S) released at the top. Slow-motion fall: live current-density heatmap on the tube wall (coloured *rings* of induced current, glowing green-cyan near the magnet's poles, above and below). Left panel: position vs time. Right panel: velocity vs time — accelerates briefly, then plateaus at terminal velocity (sharp asymptote). Caption: "the tube is not touching the magnet. Nothing solid connects them. The drag is all field."
- `induction-heating-scene.tsx` — a copper pan on an induction cooktop. Alternating current in the cooktop coil generates AC flux through the pan bottom; closed-loop eddy currents heat the pan (I²R). Slider for drive frequency reveals the skin-depth effect — too-low frequency penetrates too deep; too-high wastes energy in the coil. The cooktop design sweet spot.
- `magnetic-brake-scene.tsx` — aluminium disk spinning between the poles of a strong magnet. Eddy-current drag slows it to a stop. Slider for B. Angular velocity vs time shown as exponential decay. The principle behind regenerative braking.

**Prose outline (~1200 words):**
1. **§1 Induction in a solid** — Faraday's law doesn't care that the loop is made of a wire. Draw an imaginary loop *inside* a copper block; if the flux through it changes, an EMF drives current along it — now a real current, because the block conducts everywhere. ~200 words.
2. **§2 Eddy currents named** — Foucault, 1855, demonstrated them with a swinging copper disk that refused to swing freely between magnet poles. They were "Foucault currents" until "eddy" caught on. ~150 words.
3. **§3 The falling magnet — money shot** — SceneCard `MagnetThroughTubeScene`. Walk through the physics. As the magnet falls through a horizontal ring of the tube, the flux through that ring first rises (magnet approaching), then falls (magnet receding). Induced current circulates one way, then the other. By Lenz's law, each induced current produces a retarding force. Work done against this force is dissipated as I²R heat in the tube. Energy conservation: the magnet loses gravitational PE at the same rate the tube gains heat, and the magnet stops accelerating. ~400 words.
4. **§4 Eddy currents are usually a nuisance** — SceneCard `MagneticBrakeScene`. They dissipate power. Transformer cores avoid this by being laminated — thin insulating layers break the eddy loops. EQ.01 eddy-power formula shows the d² scaling that makes thin sheets so much better. ~250 words.
5. **§5 Eddy currents are sometimes the point** — SceneCard `InductionHeatingScene`. Induction cooktops, induction-hardening of steel surfaces, electromagnetic metal separation in recycling, eddy-current testing for cracks in pipelines. ~200 words.
6. **§6 Where it shows up** — regenerative-braking in Teslas / trains / rollercoasters, magnetic damping in precision instruments, credit-card readers, airport security gates, the reason a dropped copper coin rings audibly when it lands flat in a strong-magnet lab. ~200 words.

Aside: Foucault (original discoverer), Faraday, Lenz, eddy-current, magnetic-energy-density, motional-emf.

**Commit subject:** `feat(em/§05): eddy-currents — Foucault currents, falling magnet, induction heating`

---

## Wave 2.5 — Registry merge + publish + per-topic commit (serial, orchestrator)

The orchestrator runs this wave inline (no subagent) once all 9 Wave 2 agents have returned. For each of the 9 topics, in any order (prefer §04 → §05 for a clean commit-log story):

### Task 11: For each topic, do the 3-step merge

- [ ] **Step 1: Append the agent's `registry` block to `lib/content/simulation-registry.ts`**

Insert the agent's returned import + entry block at the end of the `SIMULATION_REGISTRY` object (immediately before the closing `};` on line ~498), mirroring the Session 2 sectioning:

```typescript
  // EM §04 — <slug>
  FooScene: lazyScene(() =>
    import("@/components/physics/foo-scene").then((m) => ({ default: m.FooScene })),
  ),
  BarScene: lazyScene(() =>
    import("@/components/physics/bar-scene").then((m) => ({ default: m.BarScene })),
  ),
  BazScene: lazyScene(() =>
    import("@/components/physics/baz-scene").then((m) => ({ default: m.BazScene })),
  ),
```

- [ ] **Step 2: Vec3 / shared-type race reconciliation (if needed)**

If any agent flagged a shared type that it shipped as a local fallback, now is the time to: (a) remove the local copy, (b) replace with `import { type Foo } from "@/lib/physics/electromagnetism/<canonical-home>";`, (c) verify `pnpm tsc --noEmit` stays clean. See Session 2 biot-savart → lorentz reconciliation precedent (implementation log). Session 3 does not *expect* any such type; if one appears, this is the place to collapse it.

- [ ] **Step 3: Publish the topic**

```bash
pnpm content:publish --only electromagnetism/<slug>
```

Confirm exactly one row was inserted/updated. If the CLI reports zero rows, the MDX almost certainly has a parser-stopping error — open the MDX, check for unmatched JSX tags or unclosed code fences, fix, retry.

- [ ] **Step 4: Commit**

```bash
git add lib/physics/electromagnetism/<topic>.ts \
  tests/physics/electromagnetism/<topic>.test.ts \
  components/physics/<scene-1>.tsx \
  components/physics/<scene-2>.tsx \
  components/physics/<scene-3>.tsx \
  lib/content/simulation-registry.ts \
  "app/[locale]/(topics)/electromagnetism/<slug>"
git commit -m "$(cat <<'EOF'
<commit-subject-from-agent>

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

After all 9 topics: 9 new commits on main.

---

## Wave 3 — Seed prose + finalize (serial, single subagent)

This wave covers the **CRITICAL cross-ref gotcha** confirmed in §01 + §02: `<PhysicistLink>` and `<Term>` resolve at render time against Supabase `content_entries` (kind='physicist'|'glossary'). Adding slugs to the TS arrays gives structural metadata only — the cross-ref will throw `"Term: unknown slug"` or `"Physicist: unknown slug"` at render time until the prose row is in Supabase.

### Task 12: Author and run `scripts/content/seed-em-03.ts`

**Files:**
- Create: `/Users/romanpochtman/Developer/physics/scripts/content/seed-em-03.ts`

- [ ] **Step 1: Mirror `seed-em-02.ts` structure**

Copy the pattern from `scripts/content/seed-em-02.ts`:
- Same imports (`dotenv/config`, `createHash`, `getServiceClient`).
- Same `PhysicistSeed` and `GlossarySeed` interfaces.
- Same `parseMajorWork` helper.
- Same `paragraphsToBlocks` helper (if present in seed-em-02).
- Same `main()` upserting to `content_entries` with `source_hash` deduplication.

- [ ] **Step 2: Author 5 physicist seeds**

For each of: `pierre-weiss`, `walther-meissner`, `heike-kamerlingh-onnes`, `joseph-henry`, `heinrich-lenz`. Required fields per `PhysicistSeed`:

- `slug`, `name`, `shortName`
- `born`, `died`, `nationality`
- `oneLiner` (≤ 200 chars, headline-grade)
- `bio` (3 paragraphs, ~400–500 words, voice = Kurzgesagt meets Stripe docs; historical hooks, no filler)
- `contributions` (5 bullet items)
- `majorWorks` (3 items in `Title (Year) — description` format)
- `relatedTopics` (matching what was added to `lib/content/physicists.ts` in Wave 1, Step 2)

Voice/depth reference: read `seed-em-02.ts` lines 38–160 (Curie, Ørsted, Ampère entries) — match that bar exactly. Each bio should be (a) accurate, (b) interesting, (c) standalone.

Key historical hooks to include (guides, not scripts — embellish with accurate detail):
- **Pierre Weiss** (1865–1940): Alsatian physicist who, in 1907, proposed that ferromagnetic materials contain "molecular fields" — regions of spontaneous alignment (domains) — that averaging explained the hysteresis Curie had documented. Coined the word *domain*. His Curie–Weiss law (χ = C/(T−T_c)) was the first mean-field theory in condensed-matter physics. Born in Mulhouse when Alsace was French; educated in Zurich after Alsace became German; lived his whole career bridging the French/German/Swiss scientific cultures.
- **Walther Meissner** (1882–1974): German low-temperature physicist who, with Robert Ochsenfeld in Berlin in October 1933, cooled tin and lead cylinders in an applied magnetic field and observed that the field was expelled on crossing T_c. This was the moment superconductivity stopped being "perfect conduction" and started being "a phase of matter." Founder of the low-temperature institute in Munich; survived two world wars on the same Munich campus; died 91 and still publishing.
- **Heike Kamerlingh Onnes** (1853–1926): Dutch experimental virtuoso at Leiden who spent fifteen years obsessed with a single question — what happens to metals near absolute zero? He built the world's first helium liquefier in 1908 (reaching 4.2 K for the first time), then used it to discover, in April 1911, that mercury's resistance dropped to zero below 4.2 K. Nobel 1913. His lab motto, "door meten tot weten" ("through measuring, to knowing"), carved above the Leiden physics building's entrance, is still visible today.
- **Joseph Henry** (1797–1878): American physicist, son of a Scottish immigrant, self-taught from borrowed textbooks, became the first Secretary of the Smithsonian in 1846. Discovered self-inductance and mutual inductance in the late 1820s and early 1830s — roughly contemporaneous with Faraday but with characteristic American reticence about publishing. Built the strongest electromagnets of his era (lifting 3500 lbs), invented the electromechanical telegraph relay that Morse patented, and wrote the first clear description of back-EMF. The SI unit henry (H = V·s/A) carries his name.
- **Heinrich Lenz** (1804–1865): Russian-German physicist working in St. Petersburg who, in 1834, formulated the conservation principle built into Faraday's law: "the induced current's direction is such as to oppose the change that caused it." Also discovered (independently of Joule) the I²R heating law. Died on a cliff in Rome at 61 while on a European holiday.

- [ ] **Step 3: Author 24 glossary seeds**

For each glossary slug added in Wave 1 Step 4. Required fields per `GlossarySeed`:

- `slug`, `term`, `category`
- `shortDefinition` (1–2 sentences, ≤ 250 chars)
- `description` (2–3 paragraphs, ~250–400 words)
- `history` (optional, 1 paragraph, where there's a story)
- `relatedPhysicists`, `relatedTopics`

Voice/depth reference: `seed-em-02.ts` glossary entries. Same sharp-idea principle: pick one sharp thought per term, develop it fully; short definition if the term is utilitarian.

**Terms that genuinely have a sharp idea (give them full treatment):** magnetization, h-field, diamagnetism, paramagnetism, ferromagnetism, hysteresis-loop, curie-temperature, meissner-effect, electromagnetic-induction, faradays-law-term, lenzs-law-term, emf, self-inductance, eddy-current, magnetic-energy-density.

**Terms that are utilitarian (shorter treatment OK):** magnetic-susceptibility, magnetic-permeability, magnetic-domain, critical-temperature, motional-emf, mutual-inductance, henry-unit, back-emf, flux-linkage.

- [ ] **Step 4: Forward-reference placeholders**

Scan the 9 new MDX files for any `<Term slug="…">` or `<PhysicistLink slug="…">` whose slug is NOT in the 24-term list above nor in the 5-physicist list nor in any prior-session list. For every unresolved slug, add a placeholder `GlossarySeed` with:

- `shortDefinition`: a one-line stub (e.g. "Displacement current: the Maxwell addition to Ampère's law that makes electromagnetism self-consistent under time variation. Full treatment in §07.")
- `description`: a 2-sentence stub that explicitly says "This is a placeholder entry. The topic covering this term in depth is `<slug>`; see §0X of the electromagnetism branch."
- `category`: best-fit category.

The Session 2 precedent is `fresnel-equations` (commit `0e350ca`). Expected Session 3 forward-refs (verify at author time — might be zero):
- `displacement-current` — if any §05 MDX references it outside of a `displacement-field` aside.
- `larmor-formula` — unlikely but possible in §04.2 if an agent mentions the Larmor precession of a single spin in an applied B.
- `superconductivity` (without `-term` suffix) — if an agent wrote `<Term slug="superconductivity">` rather than linking to the topic page directly.
- `aharonov-bohm-effect` or `aharonov-bohm` — unlikely in §04/§05 but possible in a §05.1 aside.

Add these placeholders to the seed, flag each in a code comment `// FORWARD-REF: full treatment in §0X`, and make a note in the MemPalace log at Wave 3 Step 6.

- [ ] **Step 5: Run the seed script**

```bash
pnpm exec tsx --conditions=react-server scripts/content/seed-em-03.ts
```

Expected output: `✓ physicist <slug>` for 5 entries, `✓ glossary <slug>` for 24+ entries (24 planned + any forward-ref placeholders), `done`.

If any insert fails: read the error, fix the seed entry, re-run (upsert + source_hash makes it idempotent — no duplicate rows).

- [ ] **Step 6: Verify cross-refs resolve at render time**

```bash
pnpm dev &
DEV_PID=$!
sleep 6
for slug in magnetization-and-the-h-field dia-and-paramagnetism ferromagnetism-and-hysteresis superconductivity-and-meissner faradays-law lenz-law-and-motional-emf self-and-mutual-inductance energy-in-magnetic-fields eddy-currents; do
  echo "=== $slug ==="
  curl -s -o /dev/null -w "%{http_code}\n" http://localhost:3000/en/electromagnetism/$slug
done
kill $DEV_PID 2>/dev/null
wait $DEV_PID 2>/dev/null || true
```

Expected: `200` on all 9. Any `500` means a cross-ref is still unresolved — tail `dev`'s log, find the offending slug, add the missing seed, re-run.

- [ ] **Step 7: Commit the seed script**

```bash
git add scripts/content/seed-em-03.ts
git commit -m "$(cat <<'EOF'
fix(em/§04-§05): seed physicists + glossary prose into Supabase

PhysicistLink / Term components fetch from content_entries (kind='physicist'|
'glossary') at render time. The TS arrays in lib/content/{physicists,glossary}.ts
provide structural metadata only — without prose rows in Supabase, the cross-refs
throw "unknown slug" at render. Same gotcha as cc3fcbc (em/§01) and 0e2a47d (em/§02-03).

Adds 5 new physicist bios (Weiss, Meissner, Kamerlingh Onnes, Henry, Lenz) and
24 glossary terms covering magnetization/H field/dia-para-ferromagnetism/
superconductivity and all induction terminology. Idempotent upsert via source_hash.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

### Task 13: Full build, spec update, session-end commit

**Files:**
- Modify: `docs/superpowers/specs/2026-04-22-electromagnetism-branch-design.md`

- [ ] **Step 1: Full build + test sweep**

```bash
pnpm tsc --noEmit
pnpm vitest run
pnpm build 2>&1 | tail -60
```

Expected: clean tsc; vitest passes for all new tests (the 3 pre-existing failures from §01 are expected and are NOT this session's responsibility); build lists 9 new `/en/electromagnetism/<slug>` routes.

- [ ] **Step 2: Branch-hub smoke test**

```bash
pnpm dev &
DEV_PID=$!
sleep 6
curl -s http://localhost:3000/en/electromagnetism | grep -cE 'FIG\.0[1-9]|FIG\.1[0-9]|FIG\.2[0-5]'
kill $DEV_PID 2>/dev/null
```

Expected: ≥ 25 (FIG.01 through FIG.25 should all appear).

- [ ] **Step 3: Update the spec progress table**

Open `docs/superpowers/specs/2026-04-22-electromagnetism-branch-design.md`. Update the **Module status** table:

```
| §04 Magnetic fields in matter | 4 | 4 | ☑ complete |
| §05 Electrodynamics & induction | 5 | 5 | ☑ complete |
```

Recompute the total row:

```
| **Total** | **66** | **25** | **38% complete** |
```

In the **Per-topic checklist** under §04 and §05, replace all 9 `- [ ]` with `- [x]`.

Update the document header status line:

```
**Status:** in progress — §01 shipped 2026-04-22; §02 + §03 shipped 2026-04-22; §04 + §05 shipped 2026-04-23
```

- [ ] **Step 4: Commit the spec update**

```bash
git add docs/superpowers/specs/2026-04-22-electromagnetism-branch-design.md
git commit -m "$(cat <<'EOF'
docs(em/§04-§05): mark magnetism-in-matter + induction modules complete

All 9 topics in §04 + §05 shipped and reading from Supabase. Branch is now
25/66 topics (38% complete). Statics era closed, dynamics opened.
Next session: §06 Circuits (7 topics). Reusable CircuitCanvas primitive
flagged in spec Open Questions — propose spinning that off as a mini-plan
before Session 4.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

- [ ] **Step 5: MemPalace implementation log**

Write `implementation_log_em_session_3_magnetism_in_matter_induction.md` to MemPalace (`wing=physics, room=decisions`) via `mempalace_kg_add` or direct write. Pattern match `implementation_log_em_session_2_fields_in_matter_magnetostatics.md`. Must cover:

- Summary of what shipped (9 topics, FIG.17–25, 25/66 = 38%).
- Wave-by-wave commit log.
- Any deviations from this plan (expected: forward-ref placeholders in Wave 3 Step 4, soft-hysteresis amplitude choices, scene count if any agent shipped a 4th scene).
- **What future sessions should know** — especially:
  - Whether the `tanh`-based soft-hysteresis model generalises well to §04.3 (Pr/Psat ≈ 0.38 was Session 2's piezo precedent; if Session 3 ferromagnetism kept the same ratio, flag it; if it used a different one, document why).
  - Whether the green-cyan "induced EMF" colour convention held across all §05 topics.
  - Whether any new shared types were introduced (and the canonical home).
  - Whether the pre-existing 3 test failures are *still* present (three sessions deep now — flag as overdue for a dedicated triage session before §07).
  - Whether any MDX forward-refs required placeholder entries (record the slugs).
- Next session's scope: §06 Circuits, 7 topics. Flag the CircuitCanvas primitive as a mini-plan candidate. Note that §07 Maxwell (after circuits) will want a look at the parse-mdx pre-existing failure since new equation-block patterns may need parser updates.

- [ ] **Step 6: Report back to the user**

Single-paragraph summary plus a short list:
- All 9 topics live at `/en/electromagnetism/<slug>` (200 OK on all).
- Build clean, tests green (minus the 3 documented pre-existing failures from §01).
- Spec progress: 25/66 (38%).
- Commit count this session: **14** (Wave 1 + 9 × Wave 2.5 + 1 seed + 1 spec-update, plus Wave 2.5 may land an extra commit if the Vec3-style reconciliation forces a dedup commit; 13–15 is the band).
- Next session: §06 Circuits (7 topics). Flag the CircuitCanvas primitive proposal.
- Any surprises or deviations from this plan, including forward-ref placeholders added.

---

## Definition of done

- All 9 §04 + §05 topic pages render `200` at `/en/electromagnetism/<slug>`.
- `pnpm build` clean. `pnpm vitest run` green for all new tests (pre-existing 3 failures noted but unchanged).
- New physicists + glossary terms have prose rows in `content_entries` (verified via Wave 3 Step 6 curl sweep).
- Spec progress table updated: §04 = 4/4, §05 = 5/5, total = 25/66 (38%).
- Per-module commits land cleanly on main:
  - Wave 1 scaffolding (1 commit)
  - Wave 1.5 (skipped — 0 commits)
  - Wave 2.5 per-topic (9 commits)
  - Wave 3 seed (1 commit)
  - Wave 3 spec update (1 commit)
  - Optional: Wave 2.5 type-reconciliation if triggered (0 or 1 extra commit)
  - Total: 12–13 commits this session.
- MemPalace implementation log written.

---

## Risk notes

- **CRITICAL — physicist/glossary cross-refs blow up at render.** The §01/§02 gotcha, still active. Wave 3 Task 12 prevents recurrence. Don't skip it. Don't run Wave 2.5 commits and call the session done — the build will pass (TS doesn't know about Supabase row presence) but any `<PhysicistLink slug="walther-meissner">` will server-error until the seed runs.
- **Registry conflicts under parallel agents.** Mitigated by the parallel-safety contract (agents return registry blocks; orchestrator merges serially in Wave 2.5). Same approach worked in §01 (7 agents) and §02 (9 agents). Session 3 is also 9.
- **Vec3 / shared-type race.** Session 3 is unlikely to introduce a new cross-agent type (no 3D dynamics heavier than §03 already shipped), but Wave 2 shared instructions codify the local-fallback + canonical-import pattern just in case.
- **§04 voice — the surprise is the payoff.** Meissner expulsion and ferromagnetic memory feel like magic until the domain / flux-expulsion story is told. Resist the Griffiths-encyclopedic temptation; lean into the reveal. The Session 2 log flagged the hysteresis-loop shape specifically: use the `tanh`-based soft loop with Pr ≈ 0.38·Psat, not an idealised square. Carry that precedent into §04.3.
- **§05 voice — every topic ramps toward Maxwell.** Don't treat Faraday's law as a standalone curiosity; it's the first dynamic field equation. Don't treat self-inductance as circuit trivia; the energy it stores in the field leads directly to §05.4's ½B²/μ₀ and §05.1's differential-form ∇×E. Every topic earns its place as a step toward the §07 synthesis.
- **Right-hand-rule visuals.** Every §05 scene needs a visible right-hand-rule cue — curl arrow, axes badge, or both. §03 set this precedent; keeping it through §05 avoids the "I can't tell which way the current flows" reader frustration. Nonnegotiable floor.
- **Calculus Policy A discipline.** Topics 6 (Faraday's ∇× + d/dt), 7 (Lenz sign), and 9 (energy density) push vector calculus again. Re-read each draft asking: "if I'd never seen ∇× or ∂/∂t before, would I survive this paragraph?". If no, expand the plain-words gloss before the equation.
- **Soft-hysteresis amplitude choices.** The §04.3 hysteresis-domain-scene money shot needs realistic loop proportions. Session 2's `piezo-and-ferroelectricity` used Pr/Psat ≈ 0.38 and Hc appearing as ~15% of Hsat. Mirror those proportions for ferromagnetism; real iron loops look less dramatic than textbook cartoons.
- **Forward-ref placeholders.** The fresnel-equations precedent says: if the seed misses a forward-referenced slug, the page renders 200 but the browser console logs warnings until the slug lands. Wave 3 Step 4 scans for these proactively; don't skip that step. Known-likely forward-refs this session: `displacement-current` (if any §05 topic references it beyond `displacement-field`), `superconductivity` (if any MDX uses the bare slug).
- **Pre-existing test failures from §01 are now three sessions deep.** The Session 2 log already flagged this. If they're still present, the MemPalace log should explicitly call it out (overdue for triage; parse-mdx golden especially since §07 Maxwell will add displacement-current equation-block patterns).
- **Seed-script idempotency.** `seed-em-02.ts` uses `upsert` + source_hash deduplication. The new script must do the same — re-running on the same data should be a no-op.

---

## Spec self-review — done

**Coverage:** Each of the 9 §04/§05 topics in the spec has a Wave 2 task (Tasks 2–10). Every spec section ("Voice", "Calculus policy A", "Money-shot principle", "Integration checklist", "Dependency notes" — §05 requires §03, which is in place) is referenced in shared instructions or per-topic templates. The CRITICAL cross-ref gotcha from the prompt is addressed in Wave 3 Task 12. The fresnel-style forward-ref gotcha is addressed in Wave 3 Step 4. The Vec3-style shared-type race is addressed in the Wave 2 shared contract (item 5). The §04 ferromagnetism money shot is specifically called out as synchronized two-panel; the §05 eddy-currents money shot is specifically called out as slow-mo tube with induced current bands.

**Placeholder scan:** No "TBD", no "TODO" outside the shared-type fallback contract (where `// TODO orchestrator: replace with import` is the explicit convention carried over from §02), no "implement later", no naked "Add error handling." All physics-lib functions have specified signatures and minimal test coverage. All sim components have specific behaviour descriptions with HUD callouts.

**Type consistency:** No new shared types expected; if an agent introduces one, Wave 2.5 Task 11 Step 2 reconciles. Session 2's `Vec3 = { x: number; y: number; z: number }` from `lib/physics/electromagnetism/lorentz.ts` remains canonical and any §05 topic that needs 3D vectors imports from there. §04 topics are scalar-only and don't touch vectors. `HysteresisParams` in `ferromagnetism.ts` is local to that file. `slidingRodDynamics`'s return shape `{ I, F_mag }` is local to `lenz-motional-emf.ts`. `rlCurrent` and `rlTimeConstant` re-use each other within `inductance.ts`. All intra-file usages are consistent.

**File-path absolutes:** Every Create/Modify path is absolute or repo-relative without ambiguity.

**Module-existence sanity check:** `lib/content/branches.ts:341` defines `magnetism-in-matter` (index 4) and `:342` defines `induction` (index 5). Wave 1 Step 1's topic-`module` fields align. No module-list edit needed.

**Commit count consistency:** The Wave-by-wave totals (1 + 9 + 1 + 1 = 12) match the Definition-of-done stated band (12–13 with optional reconciliation).

No issues found. Plan is ready to execute.
