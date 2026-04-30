# RT Session 3 — §05 SR Applications + §06 Equivalence Principle Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (token-saving variant per `feedback_execution_style.md`) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ship the canonical SR-closer + GR-on-ramp pair on `physics.explained` — §05 SR Applications & Paradoxes (the SR victory lap: barn-pole, Bell's spaceship, GPS as a working relativity experiment, precision Lorentz-invariance tests) + §06 The Equivalence Principle (the GR bridge: inertial vs gravitational mass, Einstein's elevator, gravitational redshift via Pound-Rebka, gravity-as-geometry). 8 topics, FIG.21–FIG.28. Spec progress moves 20/61 → 28/61 (33% → 46%); **SR is fully complete after this session**; GR begins in Session 4 with §07 tensor calculus.

**Architecture:** Five waves mirroring RT Session 2 exactly (Wave 1.5 SKIP — no new shared canvas primitive justified for §05/§06). Wave 0 = serial promote-to-live (no types extension this session — §06's gravitational-redshift / EP formulas are simple per-topic helpers; YAGNI). Wave 1 = serial seed scaffold (Roland Eötvös + Pound-Rebka combined entry + 10 net new glossary terms). Wave 2 = 8 parallel per-topic subagents. Wave 2.5 = orchestrator-serial registry-merge + publish + per-topic commit. Wave 3 = seed run + curl smoke + spec progress update + MemPalace log. Pattern matches Session 2 (slimmer Wave 0 — no types extension, 8 topics not 10).

**Tech Stack:** Next.js 15 (App Router), React 19, TypeScript strict, Tailwind v4, MDX (`@next/mdx`), Canvas 2D for visualizations, Supabase `content_entries` (project `cpcgkkedcfbnlfpzutrc`), Vitest, KaTeX via rehype-katex.

**Spec:** `docs/superpowers/specs/2026-04-29-relativity-branch-design.md` — read §05 + §06 + Voice + Calculus policy + Integration checklist + Risk notes + Slug-collision watch before starting.

**Prerequisite reading for subagents:**
- `docs/superpowers/plans/2026-04-29-relativity-session-2-spacetime-geometry-dynamics.md` — Session 2 plan to mirror (same wave structure, 10 topics; this session has 8).
- `docs/superpowers/plans/2026-04-29-relativity-session-1-sr-foundations.md` — earlier shared instructions; `SpacetimeDiagramCanvas` API documented there.
- `scripts/content/seed-rt-01.ts` and `scripts/content/seed-rt-02.ts` — copy helpers byte-for-byte (`PhysicistSeed`, `GlossarySeed`, `parseMajorWork`, `paragraphsToBlocks`, source-hash idempotency `main()`). Don't paraphrase.
- MemPalace `wing=physics, room=decisions`: `implementation_log_rt_session_1_sr_foundations_kinematics.md`, `implementation_log_rt_session_2_spacetime_geometry_dynamics.md`, `feedback_execution_style.md` (token-saving subagent dispatch — branch is main; commit directly; no per-task review).

---

## File structure

### Modified files (Wave 0)
- `lib/content/branches.ts` — flip 8 entries (slugs `the-barn-pole-paradox` … `gravity-as-geometry`, lines 992–1000 except the two `// §0X` comment lines 991 + 996) from `status: "coming-soon"` → `status: "live"`. No other field changes.
- **No types.ts extension this session.** §06 EP formulas (`gh/c²` for redshift, `(m_g − m_i)/m_i` for Eötvös parameter) live in per-topic physics libs in Wave 2. No shared abstraction is justified across only 2–3 callers (Session 2's `intervalSquared` was justified by 5 §03 topics consuming it; Session 3 has no equivalent multi-topic shared formula).

### New files (Wave 1)
- `scripts/content/seed-rt-03.ts` — mirrors `seed-rt-02.ts` byte-for-byte on helpers (`PhysicistSeed`, `GlossarySeed`, `parseMajorWork`, `paragraphsToBlocks`, idempotent `main()`); 2 physicists (Eötvös + Pound-Rebka combined) + 10 net new glossary terms; append `relatedTopics` to existing Einstein, Newton, Galileo.

### Modified files (Wave 1)
- `lib/content/physicists.ts` — append Roland Eötvös + Pound-Rebka (combined entry); append RT §05/§06 `relatedTopics` to existing `albert-einstein` (+5 — barn-pole through gravity-as-geometry are all Einstein-driven), `isaac-newton` (+1 — `inertial-vs-gravitational-mass` references the equivalence Newton noticed but never explained), `galileo-galilei` (+1 — `inertial-vs-gravitational-mass` references the Pisa tower thought experiment).
- `lib/content/glossary.ts` — append 10 net new structural entries (slugs only — prose ships in `seed-rt-03.ts`).

### New files (Wave 2 — 8 topics × 5 files = ~40 new files + ~24 simulation scenes)

Per-topic shape (substitute `<slug>` per topic):
- `lib/physics/relativity/<topic>.ts`
- `tests/physics/relativity/<topic>.test.ts`
- `components/physics/<topic>/<Scene1>.tsx` × 3 scenes per topic
- `app/[locale]/(topics)/relativity/<slug>/page.tsx`
- `app/[locale]/(topics)/relativity/<slug>/content.en.mdx`

Topic slugs (FIG.21–28):

§05 SR Applications and Paradoxes:
- FIG.21 `the-barn-pole-paradox` (uses `SpacetimeDiagramCanvas` for the two-frame ghost diagram)
- FIG.22 `bells-spaceship-paradox` (uses `SpacetimeDiagramCanvas` with two parallel worldlines + a stretched-string overlay)
- FIG.23 `gps-as-relativity` (**§05 money shot** — orbital animation + dual-correction overlay)
- FIG.24 `precision-tests-of-sr` (Kennedy-Thorndike, Hughes-Drever, modern atomic-clock comparisons; data-table scene)

§06 The Equivalence Principle:
- FIG.25 `inertial-vs-gravitational-mass` (Pisa tower + Eötvös torsion balance + 2017 MICROSCOPE bound)
- FIG.26 `einsteins-elevator` (free-falling elevator + Einstein's "happiest thought")
- FIG.27 `gravitational-redshift` (**§06 money shot** — Pound-Rebka tower + Mössbauer absorber)
- FIG.28 `gravity-as-geometry` (§06 honest moment + GR bridge — closer with `<Callout variant="intuition">` and forward-link to §07)

### Modified files (Wave 2.5)
- `lib/content/simulation-registry.ts` — append ~24 new scene entries (8 topics × 3 scenes), one section per topic. Insertion point: above the closing `};` and `export type SimulationName = keyof typeof SIMULATION_REGISTRY;` (line 1239).

### Modified files (Wave 3)
- `docs/superpowers/specs/2026-04-29-relativity-branch-design.md` — flip 8 checkboxes; update Module status table; update header status line; update Total to 28/61 (46%).

---

## Wave 0 — Promote-to-live (1 subagent, serial)

**Single agent. ~3 min runtime.**

### Task 1: Flip §05+§06 topic statuses to live

**Files:**
- Modify: `/Users/romanpochtman/Developer/physics/lib/content/branches.ts`

- [ ] **Step 1: Flip 8 RT §05+§06 topic statuses to live**

Open `lib/content/branches.ts`. Locate the 8 entries on lines 992–1000 (line 991 = `// §05 SR applications` comment; line 996 = `// §06 Equivalence principle` comment; do NOT touch comments). Their slugs are `the-barn-pole-paradox`, `bells-spaceship-paradox`, `gps-as-relativity`, `precision-tests-of-sr`, `inertial-vs-gravitational-mass`, `einsteins-elevator`, `gravitational-redshift`, `gravity-as-geometry`. For each, change `status: "coming-soon"` → `status: "live"`. Leave every other field (slug, title, eyebrow, subtitle, readingMinutes, module) untouched.

Verify with grep:

```bash
grep -nE 'slug: "(the-barn-pole-paradox|bells-spaceship-paradox|gps-as-relativity|precision-tests-of-sr|inertial-vs-gravitational-mass|einsteins-elevator|gravitational-redshift|gravity-as-geometry)"' lib/content/branches.ts
```

Expected: all 8 lines appear with `status: "live"`.

- [ ] **Step 2: Verify `getAdjacentTopics()` threads correctly after flip**

Read `lib/content/branches.ts` near the `getAdjacentTopics()` definition. The function iterates `BRANCHES` in order skipping `coming-soon` topics. After Wave 0:
- Last RT §04 topic = `threshold-energy-and-pair-production` (FIG.20). Its `next` should resolve to `the-barn-pole-paradox` (FIG.21) after the flip, not whatever §05/§06 topic it currently threads to (currently it should point to `null` because all §05–§13 are coming-soon).
- `gravity-as-geometry` (FIG.28) should have `next: null` — no live branch follows (Thermo/Quantum/Modern still `coming-soon`, and §07–§13 RT topics still `coming-soon`).

No code changes expected — just a mental walk-through. If the function uses `topic.status === "live"` filtering, the flip in Step 1 is sufficient.

- [ ] **Step 3: Run typecheck**

```bash
pnpm tsc --noEmit
```

Expected: clean. (No types changes this session — only status flips.)

- [ ] **Step 4: Commit**

```bash
git add lib/content/branches.ts
git commit -m "$(cat <<'EOF'
feat(rt/§05-§06): promote 8 topics to live for SR-applications + equivalence-principle session

Flips 8 RT §05+§06 topic entries (FIG.21–FIG.28) from coming-soon to
live in lib/content/branches.ts. Spec progress: 20/61 → 28/61 staging.

§05: the-barn-pole-paradox, bells-spaceship-paradox, gps-as-relativity,
precision-tests-of-sr.
§06: inertial-vs-gravitational-mass, einsteins-elevator,
gravitational-redshift, gravity-as-geometry.

No types.ts extension this session — §06 EP formulas (gh/c² redshift,
(m_g − m_i)/m_i Eötvös parameter) ship as per-topic physics libs in
Wave 2. Below the multi-caller threshold that justified intervalSquared
in Session 2.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Wave 1 — Seed scaffold for Eötvös + Pound-Rebka + glossary (1 subagent, serial)

**Single agent. Builds the seed script ONLY — does not run it (Wave 3 runs it).**

### Task 2: Scaffold seed-rt-03.ts

**Files:**
- Create: `/Users/romanpochtman/Developer/physics/scripts/content/seed-rt-03.ts`
- Modify: `/Users/romanpochtman/Developer/physics/lib/content/physicists.ts`
- Modify: `/Users/romanpochtman/Developer/physics/lib/content/glossary.ts`

- [ ] **Step 1: Read the precedent seed scripts verbatim**

Read `scripts/content/seed-rt-02.ts` end to end (Session 2's seed; the most recent precedent). Note: `PhysicistSeed` and `GlossarySeed` interfaces (lines 8–31), `parseMajorWork` and `paragraphsToBlocks` helpers (lines 33–45), main() loop with pre-fetch source-hash idempotency (line 333 onward). **Copy these helpers byte-for-byte into `seed-rt-03.ts` — do not paraphrase.** RT Session 1+2 documented the lesson: paraphrasing `paragraphsToBlocks` introduces a renderer-incompatible block shape that 500s the page until corrected. The flat `inlines: string[]` shape is mandatory.

- [ ] **Step 2: Append Roland Eötvös + Pound-Rebka (combined) to PHYSICISTS**

Open `lib/content/physicists.ts`. Append after the existing entries (insertion point: end of array, before the closing `];`):

```typescript
{
  slug: "roland-eotvos",
  born: "1848",
  died: "1919",
  nationality: "Hungarian",
  image: storageUrl("physicists/roland-eotvos.avif"),
  relatedTopics: [
    { branchSlug: "relativity", topicSlug: "inertial-vs-gravitational-mass" },
    { branchSlug: "relativity", topicSlug: "einsteins-elevator" },
  ],
},
{
  slug: "pound-rebka",
  born: "—",
  died: "—",
  nationality: "American",
  image: storageUrl("physicists/pound-rebka.avif"),
  relatedTopics: [
    { branchSlug: "relativity", topicSlug: "gravitational-redshift" },
    { branchSlug: "relativity", topicSlug: "einsteins-elevator" },
  ],
},
```

The `pound-rebka` slug is a combined entry for Robert Pound (1919–2010) and Glen Rebka (1931–2015) — the 1960 Harvard 22.5-meter tower experiment. Combined per spec line 451 default + prompt line 12. The `born`/`died` fields are placeholder dashes because the entry is for the experimentalist *pair*, not a single individual; the bio prose in `seed-rt-03.ts` Step 5 carries the per-person dates. Match the same image-path shape as `arthur-compton` (added in Session 2). If image files don't exist in storage at seed-run time, the fallback rendering is a placeholder; this is acceptable and unblocking.

**Decision: skip Albert Michelson, Edward Morley, and Carl Anderson for this session.** They're Session 1 / Session 2 deferrals already documented; this session adds Eötvös + Pound-Rebka. Anderson is still optional per Session 2's call.

- [ ] **Step 3: Append `relatedTopics` to existing physicists**

For each existing PHYSICISTS entry, append the listed `relatedTopics` to the array. Locate by slug; do not duplicate entries that may already point at one of these topic slugs.

- `albert-einstein` (line 362): append
  - `{ branchSlug: "relativity", topicSlug: "the-barn-pole-paradox" }`
  - `{ branchSlug: "relativity", topicSlug: "einsteins-elevator" }`
  - `{ branchSlug: "relativity", topicSlug: "gravitational-redshift" }`
  - `{ branchSlug: "relativity", topicSlug: "gravity-as-geometry" }`
  - `{ branchSlug: "relativity", topicSlug: "inertial-vs-gravitational-mass" }`
- `isaac-newton` (line 24): append
  - `{ branchSlug: "relativity", topicSlug: "inertial-vs-gravitational-mass" }`
- `galileo-galilei` (line 14): append
  - `{ branchSlug: "relativity", topicSlug: "inertial-vs-gravitational-mass" }`

If a Wave 2 agent flags during execution that John S. Bell needs a physicist entry to support `bells-spaceship-paradox`, follow up — do not split this session. Default: refer to Bell as plain text (he's a Bell-inequality figure already known to many readers; the spaceship-paradox topic doesn't need his standalone entry).

- [ ] **Step 4: Append glossary structural entries to GLOSSARY**

Open `lib/content/glossary.ts`. Verify-then-append (insertion point: end of array, before the closing `];`). Each new entry has only structural fields here (slug, term, category, optional `relatedPhysicists`, `relatedTopics`); the prose `description` ships in `seed-rt-03.ts` Step 5. Match the EXACT shape of any RT Session 2 glossary entry by reading lines around `slug: "spacetime"` (line 2787) — the `four-momentum` block at line 2867 is the model for terms with a same-named topic-slug coexistence.

§05 NEW (5 terms):
- `barn-pole-paradox` (concept)
- `bell-spaceship-paradox` (concept)
- `born-rigidity` (concept) — Bell's spaceship needs this contrast: a "rigid" rod under acceleration must Born-rigidly contract; a string between two identically-accelerating rockets does not, and so it snaps. Defined here even though it's also a CM-period concept.
- `gps-correction` (concept) — the SR + GR clock-correction the satellite firmware applies; ~38 μs/day net.
- `precision-lorentz-tests` (concept) — modern Kennedy-Thorndike / Hughes-Drever / atomic-clock-comparison program.

§06 NEW (5 terms):
- `equivalence-principle` (concept) — the umbrella; weak + Einstein versions point at this.
- `weak-equivalence-principle` (concept) — Galileo / Eötvös: m_grav = m_inertial.
- `einstein-equivalence-principle` (concept) — WEP + local Lorentz invariance + local position invariance; the form that implies gravity is geometry.
- `eotvos-parameter` (concept) — η = (m_g − m_i)/m_i; current bound ≲ 10⁻¹⁵ from MICROSCOPE 2017+.
- `mossbauer-effect` (phenomenon) — recoilless gamma-ray emission in a crystal lattice; the ingredient that made Pound-Rebka feasible.

**Total 10 net new.** Skip:
- `gravitational-redshift` — topic slug ships in §06.3, **but the glossary slug is intentionally NOT shipped this session.** §06.3 prose can refer to "gravitational redshift" with plain Markdown linking to `/relativity/gravitational-redshift` (the topic page itself). If a Wave 2 agent uses `<Term slug="gravitational-redshift">` in MDX, surface as `MISSING_TERMS:` and Wave 3 forward-ref scan adds it as a brief alias entry pointing to the topic. Same playbook Session 2 used for `rapidity`/`e-mc-squared`.
- `clock-postulate` — implicit in §05.4 precision tests; if a Wave 2 agent flags as needed, add via Wave 3 forward-ref scan.

**SLUG-COLLISION DEFENCE:** the topic slug `gravitational-redshift` (FIG.27) MAY coexist with a glossary slug of the same name later — same kind-namespaced precedent as RT Session 1's `time-dilation` topic + glossary, and Session 2's `four-momentum` and `mass-energy-equivalence` pairs. **Do NOT add a `-term` suffix** if/when the glossary entry surfaces. Per Session 1+2 confirmation, `kind="topic"` and `kind="glossary"` rows in `content_entries` live in different namespaces.

Also continue Lorenz/Lorentz spelling discipline. Verify by grep:

```bash
grep -nE 'lorentz|lorenz' lib/content/glossary.ts | head
```

Right state after Step 4: `lorenz-gauge` (existing, untouched, no T) + `lorentz-transformation` + `velocity-addition-relativistic` + the new `precision-lorentz-tests` (with T). No new Lorenz entries this session. **Triple-check `precision-lorentz-tests` is spelled with T**, not D — it's named after Hendrik Antoon Lorentz (the Dutch physicist), not Ludvig Lorenz (the Danish one whose surname appears in `lorenz-gauge`).

- [ ] **Step 5: Author `seed-rt-03.ts`**

Mirror `seed-rt-02.ts` structure exactly. Skeleton:

```typescript
// Seed RT §05 SR Applications + §06 Equivalence Principle
// 2 physicists (Roland Eötvös, Pound-Rebka combined) + 10 new structural glossary terms
// Run: pnpm exec tsx --conditions=react-server scripts/content/seed-rt-03.ts
import "dotenv/config";
import { createHash } from "node:crypto";
import { getServiceClient } from "@/lib/supabase-server";

interface PhysicistSeed { /* … copy from seed-rt-02 verbatim … */ }
interface GlossarySeed { /* … copy from seed-rt-02 verbatim … */ }
function parseMajorWork(s: string) { /* … copy verbatim … */ }
function paragraphsToBlocks(text: string) { /* … copy VERBATIM — flat string[] inlines … */ }

const PHYSICISTS: PhysicistSeed[] = [
  {
    slug: "roland-eotvos",
    name: "Loránd (Roland) Eötvös",
    shortName: "Eötvös",
    born: "1848",
    died: "1919",
    nationality: "Hungarian",
    oneLiner: "Hungarian physicist who built the torsion balance that constrained the difference between inertial and gravitational mass to a few parts in 10⁹ — the first high-precision laboratory test of the equivalence principle. His 1889 and 1922 (posthumous) measurements stood as the state of the art until lunar laser ranging in the 1970s.",
    bio: `Loránd Eötvös was born in 1848 in Pest (now Budapest) into a politically prominent family — his father József was a writer and Minister of Education in the Habsburg-Hungarian government. He studied physics in Heidelberg and Königsberg under Bunsen, Helmholtz, and Kirchhoff, completing his doctorate in 1870, and returned to teach at Budapest University, where he spent his entire research career. Across forty years he turned the institution into a world-class physics centre and trained a generation of Hungarian-born physicists who would later seed Western European and American science (von Neumann, Wigner, Szilard, and Teller all passed through the orbit of Hungarian physics that Eötvös had built).

His scientific reputation rests on a single instrument and the question it answered. The torsion balance — a horizontal beam suspended from a fine fibre, with two test masses of different composition at the ends — is sensitive to any difference in the gravitational acceleration the two masses experience. If gravitational mass differed even slightly from inertial mass, the rotating Earth's varying gravitational pull and centrifugal force at different latitudes would produce a tiny torque on the beam. Eötvös measured this torque on materials as different as platinum, brass, copper, glass, water, and asbestos. The 1889 results constrained the equivalence ratio to one part in 10⁸; refined apparatus and the 1922 posthumous re-analysis (Eötvös, Pekár, Fekete) tightened it to a few parts in 10⁹. No deviation was found. The result became the most-cited experimental support for what Einstein would later canonise as the *Äquivalenzprinzip* — the equivalence principle that founds general relativity.

Eötvös also developed the gravity gradiometry that bears his name. His torsion balance, in modified form, was widely deployed in oil and mineral prospecting in the early twentieth century — the first significant industrial use of precision gravimetry. He served as Minister of Religion and Education in 1894 and as president of the Hungarian Academy of Sciences. He died in Budapest in 1919. The MICROSCOPE satellite mission, launched in 2016, finally improved on his bound by six orders of magnitude — but for nearly a hundred years, Eötvös's number was the number.`,
    contributions: [
      "1889 + 1922 Eötvös experiment — torsion-balance comparison of inertial and gravitational mass; constrained the equivalence ratio to ≲ 10⁻⁹.",
      "Gravity gradiometry — the modified Eötvös torsion balance became the first practical instrument for prospecting density anomalies in subsurface rock.",
      "The Eötvös effect — measured east-west motion alters apparent gravity due to Coriolis, the prediction confirmed in his 1908 sea voyage.",
      "President of the Hungarian Academy of Sciences (1889–1905); founder of the Royal Hungarian Society of Natural Sciences.",
      "Minister of Religion and Education, Kingdom of Hungary, 1894 — drove the modernization of Hungarian secondary-school physics curricula.",
    ],
    majorWorks: [
      "Über die Anziehung der Erde auf verschiedene Substanzen (1889) — the original torsion-balance result; published in the proceedings of the Hungarian Academy.",
      "Beiträge zum Gesetz der Proportionalität von Trägheit und Gravität (1922) — the posthumous Eötvös-Pekár-Fekete refinement; the canonical equivalence-principle constraint until the 1970s.",
    ],
    relatedTopics: [
      { branchSlug: "relativity", topicSlug: "inertial-vs-gravitational-mass" },
      { branchSlug: "relativity", topicSlug: "einsteins-elevator" },
    ],
  },
  {
    slug: "pound-rebka",
    name: "Robert Pound and Glen Rebka",
    shortName: "Pound & Rebka",
    born: "1919 / 1931",
    died: "2010 / 2015",
    nationality: "American",
    oneLiner: "American physicists at Harvard whose 1960 experiment in the 22.5-meter Jefferson tower measured the gravitational redshift predicted by general relativity, using the recently-discovered Mössbauer effect to make a recoilless gamma-ray source sharp enough to resolve a frequency shift of Δν/ν ≈ 2.46 × 10⁻¹⁵.",
    bio: `Robert Vivian Pound (1919–2010) was a Canadian-American experimental physicist who joined the Harvard physics department in 1948 after wartime radar work at MIT and a brief stay at Bell Labs. He was a co-discoverer of nuclear magnetic resonance in solids (with Edward Purcell, 1946), and through the 1950s built a reputation as one of the most skilled microwave and radio-frequency experimentalists alive. Glen Anderton Rebka Jr. (1931–2015) arrived at Harvard as a graduate student in 1958, shortly after Rudolf Mössbauer's 1958 discovery of recoilless gamma-ray emission in solid lattices.

The Mössbauer effect made it possible to produce gamma-ray sources whose emission lines were narrow enough to resolve frequency shifts at the parts-per-quadrillion level. Pound and Rebka realized this could be used to test general relativity's prediction that a photon climbing out of a gravitational potential should redshift — that is, lose energy / drop in frequency — by a factor Δν/ν = gh/c² for a tower of height h on Earth's surface. The Jefferson Physical Laboratory tower at Harvard was 22.5 meters tall, predicting Δν/ν = (9.8 m/s²)(22.5 m)/(3 × 10⁸ m/s)² ≈ 2.46 × 10⁻¹⁵ — far below any pre-Mössbauer detection threshold.

Their 1960 paper *Apparent Weight of Photons* (Pound & Rebka, Physical Review Letters 4, 337) reported a measured fractional shift of (2.57 ± 0.26) × 10⁻¹⁵ — the predicted value to better than 10% precision. A 1965 refinement (Pound & Snider) tightened agreement to 1%. The result was the first laboratory confirmation of the equivalence principle's most direct kinematic prediction, derivable from EP alone (no field equations required). The Pound-Rebka experiment remains the canonical undergraduate example of how a precision laboratory instrument can probe the geometry of spacetime. Rebka went on to become professor at the University of Wyoming; Pound continued at Harvard until his retirement in 1989, mentoring two generations of precision experimentalists.`,
    contributions: [
      "1960 Pound-Rebka experiment — first laboratory measurement of the gravitational redshift Δν/ν = gh/c² predicted by GR's equivalence principle; agreement to better than 10%, refined to 1% in Pound-Snider 1965.",
      "Application of the Mössbauer effect (Mössbauer 1958) to high-precision frequency-shift measurement — the technique that made the Jefferson tower experiment feasible.",
      "Pound co-discovered nuclear magnetic resonance in solids (with Edward Purcell and Henry Torrey, 1946) — shared the 1952 Nobel Prize landscape; founded NMR-spectroscopy practice.",
      "Robert Pound — president of the American Physical Society 1973; National Medal of Science 1990.",
      "Glen Rebka — long career in nuclear physics at the University of Wyoming after the Harvard collaboration ended.",
    ],
    majorWorks: [
      "Apparent Weight of Photons (Pound & Rebka 1960) — Physical Review Letters 4, 337; the original result.",
      "Effect of Gravity on Nuclear Resonance (Pound & Snider 1965) — Physical Review B 140, 788; the 1% refinement.",
    ],
    relatedTopics: [
      { branchSlug: "relativity", topicSlug: "gravitational-redshift" },
      { branchSlug: "relativity", topicSlug: "einsteins-elevator" },
    ],
  },
];

const GLOSSARY: GlossarySeed[] = [
  // RT §05 (5 entries) ─────────────────────────────────────────────────
  // barn-pole-paradox, bell-spaceship-paradox, born-rigidity, gps-correction, precision-lorentz-tests.
  // Each: shortDefinition ≤ 1 sentence; description 150–250 words, 1–2 paragraphs;
  // relatedPhysicists; relatedTopics.
  // RT §06 (5 entries) ─────────────────────────────────────────────────
  // equivalence-principle, weak-equivalence-principle, einstein-equivalence-principle,
  // eotvos-parameter, mossbauer-effect.
  // … fill in each per the prose guidelines below …
];

async function main() { /* … copy from seed-rt-02 verbatim — pre-fetch hash check, upsert, count inserted vs updated, log … */ }

main().catch((err) => { console.error(err); process.exit(1); });
```

**The full GLOSSARY array prose guidelines.** For each of the 10 entries, write 150–250 words of `description`, 1–2 paragraphs. Lean factual, no padding. Mirror voice from `seed-rt-02.ts` glossary entries. For each:
- `shortDefinition` ≤ 1 sentence.
- `description` 150–250 words, 1–2 paragraphs separated by `\n\n`.
- `relatedPhysicists` — slugs of relevant existing entries.
- `relatedTopics` — branch + topic slug pairs.
- `category` per the per-slug list in Step 4.

Per-slug content sketches (use as prompts; expand to full prose):

§05:
- **`barn-pole-paradox`** — Two observers, two answers, no contradiction. A pole longer than a barn at rest fits inside the barn at relativistic speeds because the relativity of simultaneity shifts which "moments" the doors are closed. The pole-frame and barn-frame stories disagree on whether the doors were ever simultaneously closed; both are correct in their own frames. The "paradox" dissolves once you stop demanding a frame-independent simultaneity.
- **`bell-spaceship-paradox`** — Two identical rockets accelerating identically (same acceleration profile in the launch frame) with a string tied between them. In the launch frame the distance between them stays constant; in the instantaneous rest frame of either rocket the distance is increasing — the string must stretch and eventually snap. John S. Bell's 1976 puzzle whose resolution is that "rigid" acceleration must Born-rigidly contract the rod, and the two-rocket setup violates that requirement.
- **`born-rigidity`** — Max Born's 1909 definition of relativistic rigidity: a body is Born-rigid if its proper length (length in its instantaneous rest frame) stays constant during acceleration. A truly rigid rod under acceleration must have its trailing end accelerate slightly faster than its leading end; the difference cancels the length-contraction so proper length is preserved. The Bell-spaceship setup (two rockets, identical accelerations) violates Born rigidity — the string between them stretches.
- **`gps-correction`** — The clock-rate correction applied by every GPS satellite firmware: SR's kinematic time dilation slows the orbiting clock by ~7 μs/day; GR's gravitational time dilation (lower gravitational potential at orbital radius vs Earth's surface) speeds it up by ~45 μs/day; net correction ~+38 μs/day. Without this, position fixes would drift ~11 km/day.
- **`precision-lorentz-tests`** — The modern experimental program that constrains Lorentz-violating extensions of SR (Standard-Model Extension parameters c_TT, c_XX, …) to parts in 10⁻¹⁸ or better. Hughes-Drever (1960s) — magnetic-resonance frequency stability across orientation. Kennedy-Thorndike (1932) — interferometer asymmetry under boost. Modern atomic-clock comparison (CACTuS, optical-lattice clocks, hydrogen masers in vacuum) — direct frequency-shift bounds.

§06:
- **`equivalence-principle`** — Einstein's foundational GR axiom that no local experiment can distinguish a freely falling laboratory in a gravitational field from an inertial laboratory in flat spacetime. Comes in three increasingly strong forms: weak (m_g = m_i for any test particle), Einstein (WEP + local Lorentz invariance + local position invariance), and strong (WEP holds for self-gravitating bodies too).
- **`weak-equivalence-principle`** — m_grav = m_inertial for any test particle, regardless of composition. Galileo's Pisa-tower observation; Eötvös's torsion-balance precision; MICROSCOPE 2017 lab-confirmed to ≲ 10⁻¹⁵. The cleanest experimental signature: all bodies in vacuum fall identically.
- **`einstein-equivalence-principle`** — WEP + local Lorentz invariance + local position invariance. Implies that gravity is geometric: the laws of physics in a freely falling frame reduce to special relativity, and any deviation would be measurable by a sensitive enough laboratory experiment. The version Einstein needed for general relativity.
- **`eotvos-parameter`** — η = (m_g − m_i)/m_i. Constrained by Eötvös 1889 + 1922 to ≲ 10⁻⁹; Adelberger group at U. Washington 1990s pushed to ~10⁻¹³; MICROSCOPE 2017+ to ≲ 10⁻¹⁵. Any nonzero η would falsify the equivalence principle and the geometric interpretation of gravity.
- **`mossbauer-effect`** — Recoilless gamma-ray emission and absorption by nuclei bound in a solid lattice. The lattice absorbs the recoil momentum collectively, leaving the gamma-ray energy unbroadened by Doppler. Discovered by Rudolf Mössbauer in 1958 (Nobel 1961); the technique that made the parts-per-quadrillion frequency resolution of the Pound-Rebka 1960 gravitational-redshift experiment feasible.

For each entry, set `relatedPhysicists` to the obvious credit (e.g., `["albert-einstein"]` for `barn-pole-paradox`, `equivalence-principle`, `einstein-equivalence-principle`; `["roland-eotvos"]` for `eotvos-parameter`, `weak-equivalence-principle`; `["pound-rebka"]` for `mossbauer-effect` (combined credit with Mössbauer himself if his entry exists; else just Pound-Rebka)). For terms whose primary discoverer is not represented in PHYSICISTS (Bell, Born, Mössbauer himself), use plain `relatedPhysicists: []` or omit; cite them in prose only. Set `relatedTopics` to the §05/§06 topics where the term first appears.

- [ ] **Step 6: Run a dry-test — make sure the file parses + tsc clean**

```bash
pnpm tsc --noEmit
```

Do NOT run the seed yet. Wave 3 runs it.

- [ ] **Step 7: Commit**

```bash
git add lib/content/physicists.ts lib/content/glossary.ts scripts/content/seed-rt-03.ts
git commit -m "$(cat <<'EOF'
feat(rt/§05-§06): scaffold seed-rt-03 — Eötvös, Pound-Rebka, glossary, related-topic links

Adds Roland Eötvös (1848–1919) and Pound-Rebka combined entry (Robert
Pound 1919–2010 + Glen Rebka 1931–2015). Bell deferred — referred to as
plain text in §05.2 spaceship-paradox prose. Anderson still deferred
per Session 2.

Appends RT §05/§06 relatedTopics to existing Einstein (+5 — barn-pole
through gravity-as-geometry), Newton (+1 — equivalence Newton noticed
but never explained), Galileo (+1 — Pisa tower).

Adds 10 net new glossary structural entries:
  §05: barn-pole-paradox, bell-spaceship-paradox, born-rigidity,
       gps-correction, precision-lorentz-tests.
  §06: equivalence-principle, weak-equivalence-principle,
       einstein-equivalence-principle, eotvos-parameter,
       mossbauer-effect.
Skips gravitational-redshift glossary entry — topic slug ships in §06.3;
glossary entry of same name only added in Wave 3 forward-ref scan if a
Wave 2 agent flags <Term> usage. Same kind-namespaced precedent as
four-momentum / mass-energy-equivalence in Session 2.

Authors scripts/content/seed-rt-03.ts mirroring seed-rt-02.ts byte-for-
byte on helpers (paragraphsToBlocks copied verbatim per Sessions 1+2
lessons). NOT executed yet — Wave 3 runs the seed.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Wave 1.5 — SKIP (decision documented)

**Decision: skip — no new shared canvas primitive justified for §05/§06.**

§05.1 (barn-pole) and §05.2 (Bell's spaceship) reuse the existing `SpacetimeDiagramCanvas` directly (shipped Wave 1.5 of RT Session 1, commit f5da3c7). §05.3 GPS uses an inline orbit canvas (one-off, no amortization). §05.4 precision tests is mostly a data table + bounds chart (no canvas primitive).

§06.1 (Pisa tower + torsion balance), §06.2 (elevator), §06.3 (Pound-Rebka tower), §06.4 (geometry rendering) each use Canvas 2D one-offs — no shared 3D-surface primitive justified for only 4 topics. The `ManifoldCanvas` primitive considered in spec line 505 is correctly deferred to Session 4 (`§07` tensor calculus is the right home — 5 manifold-geometry topics will amortize it cleanly, well past the 7-topic CircuitCanvas threshold).

Document the deferral in Wave 3's MemPalace log. **Strongly consider Wave 1.5 ManifoldCanvas primitive at Session 4's plan time.**

---

## Wave 2 — Per-topic authoring (8 parallel subagents)

**Dispatch ALL 8 in a single message** with multiple Agent tool calls in parallel. Each subagent runs to completion independently.

### Shared instructions for every Wave 2 task

These instructions are identical across all 8 topic tasks. Copy them into each agent's prompt verbatim.

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
4. **`<Term slug="...">` MUST refer to a slug that exists in `lib/content/glossary.ts`** as of Wave 1's commit. Topic slugs are NOT auto-resolved as glossary terms. Glossary entries available after Wave 1 (relevant new ones for §05/§06): `barn-pole-paradox`, `bell-spaceship-paradox`, `born-rigidity`, `gps-correction`, `precision-lorentz-tests`, `equivalence-principle`, `weak-equivalence-principle`, `einstein-equivalence-principle`, `eotvos-parameter`, `mossbauer-effect`. Plus from Sessions 1+2: `time-dilation`, `length-contraction`, `lorentz-transformation`, `velocity-addition-relativistic`, `relativistic-doppler`, `transverse-doppler`, `galilean-invariance`, `aether-luminiferous`, `two-postulates`, `simultaneity-relative`, `spacetime`, `world-line`, `proper-time`, `invariant-interval`, `light-cone`, `spacelike`, `timelike`, `null-interval`, `four-momentum`, `four-velocity`, `four-acceleration`, `four-force`, `rest-energy`, `mass-energy-equivalence`, `threshold-energy`, `pair-production`, `compton-shift`. Plus from EM §11: `four-vector`, `gauge-transformation`, `four-current`, `four-potential`. **`gravitational-redshift` is NOT a glossary slug** — use plain Markdown link `[gravitational redshift](/relativity/gravitational-redshift)` to the topic instead, OR include in `MISSING_TERMS:` so Wave 3 forward-ref scan adds it. If a needed term is missing, either author plain text OR include the slug in your final report under `MISSING_TERMS:` so the orchestrator can patch the seed before Wave 3.
5. **`<PhysicistLink slug="...">` MUST refer to a slug that exists in `lib/content/physicists.ts`.** Roland Eötvös (`roland-eotvos`) and Pound-Rebka (`pound-rebka`) are added in Wave 1; Albert Einstein, Isaac Newton, Galileo Galilei, Hendrik Lorentz, Hermann Minkowski, Henri Poincaré are pre-existing. Anyone else (Bell, Mössbauer, Born, Hughes, Drever, Kennedy, Thorndike, Adelberger): plain text only.
6. **`<Term slug="..." />` and `<PhysicistLink slug="..." />` MUST be inline inside a paragraph, NOT block-level standalone JSX nodes** (Session 1 §01.5 lesson — `<Term>` between blank lines at section level throws "unknown top-level JSX: <Term>" at MDX parse time). Embed every cross-ref node inside prose.

**Vertical slice every agent ships:**

1. `lib/physics/relativity/<topic>.ts` — pure TS, no React. Imports from `@/lib/physics/constants` (`SPEED_OF_LIGHT` always; `g_SI` for §06.2 + §06.3; `G_SI` if needed for §06.4 weak-field scaffolding) and `@/lib/physics/relativity/types`.
2. `tests/physics/relativity/<topic>.test.ts` — vitest. 6–12 test cases covering known-value spot checks, limit cases, and at least one invariant or sanity check.
3. 3 simulation components in `components/physics/<topic>/`:
   - File names: `<scene-one-name>-scene.tsx`, etc. (kebab-case file → PascalCase export). PascalCase export name MUST be a valid JS identifier (no leading digits — Session 1 §02.3 had `4x4-matrix-scene.tsx` exporting `LorentzMatrixScene`).
   - Each is `"use client"`, imports React + `useRef`/`useEffect`/`useState` as needed.
   - **§05.1 + §05.2** use the shared `SpacetimeDiagramCanvas` (`@/components/physics/_shared` index) for any Minkowski-diagram visualization. Wrap it in a topic-specific Scene component that constructs the `worldlines` array internally and passes the appropriate `lightCone`/`simultaneitySlice`/`boostBeta` props.
   - **§05.3 + §05.4 + §06.*** typically use Canvas 2D for one-off diagrams (orbit, tower, torsion balance, redshift gauge) — no shared primitive. Match scene-color conventions: cyan/blue for stationary frame; magenta/red for boosted frame; amber for light/photon; orange for accelerated worldlines (§05.2 stretched-string only); green-cyan for created particle pairs (none this session).
   - Style: dark canvas (`bg-black/40` or `bg-[#0A0C12]`), HUD overlay with `font-mono text-xs text-white/70`.
4. `app/[locale]/(topics)/relativity/<slug>/page.tsx` — copy from any live RT topic (e.g., `app/[locale]/(topics)/relativity/the-twin-paradox/page.tsx`) verbatim and change ONLY the `SLUG` constant to `relativity/<topic-slug>`.
5. `app/[locale]/(topics)/relativity/<slug>/content.en.mdx` — compose from `<TopicPageLayout aside={[...]}>`, `<TopicHeader>`, numbered `<Section>`s, `<SceneCard>`, `<EquationBlock id="EQ.0X">$$ … $$</EquationBlock>` (CHILDREN form, single-backslash LaTeX), `<Callout variant="intuition|math|warning">`s, inline `<PhysicistLink>` and `<Term>`. Target word count: 1000–1300 per topic; §05.3 GPS and §06.4 gravity-as-geometry may run 1200–1400 (the money-shot and the closer respectively).

**SceneCard convention** (per RT Session 1+2 lesson + `scripts/content/parse-mdx.ts:181–202`): the registry key for a scene is the first-child JSX element name inside `<SceneCard>`, NOT a `component=` prop. Pattern:

```mdx
<SceneCard>
  <PoundRebkaTowerScene />
</SceneCard>
```

Don't use `<SceneCard component="PoundRebkaTowerScene" props={...}>`. Props are passed as JSX attributes on the inner element.

**MDX gotchas (carry forward all six from Sessions 1+2):**
- (i) NO nested JSX in `title="..."` attributes — keep human/term links to body prose.
- (ii) Multi-line `$$ ... \\\\<newline> ... $$` LaTeX may choke micromark — collapse to single-line `$$...$$` per equation, or break across multiple `<EquationBlock>`s.
- (iii) Bare `<` in prose can parse as JSX tag opener — escape as `&lt;` or reword.
- (iv) `<EquationBlock>$$...$$</EquationBlock>` uses CHILDREN form — single-backslash LaTeX (`\beta`, `\gamma`, `\Lambda^\mu{}_\nu`). Only the `tex={\`...\`}` template-literal prop form requires double-backslash.
- (v) HTML entities (`&gt;`, `&lt;`, `&amp;`) DO NOT decode inside `$...$` or `$$...$$` — KaTeX rejects them with "Expected 'EOF', got '&'." Use literal `>`, `<`, `&` characters inside math; KaTeX handles them natively. The JSX-tag risk applies only to bare prose, NOT to math context.
- (vi) `<Term>` and `<PhysicistLink>` MUST be inline inside a paragraph, NEVER block-level. Embed inside prose, not standalone between blank lines.

**LaTeX risk this session: low.** §05/§06 are math-light compared to §03/§04. The densest equations are §05.3 GPS (γ at orbital β ≈ 1.3 × 10⁻⁵; gravitational potential `Φ = −GM/r`) and §06.3 Pound-Rebka (`Δν/ν = gh/c²` and the equivalence-principle derivation). `\begin{aligned}` and `\begin{pmatrix}` confirmed clean across Sessions 1+2 — use freely.

**Voice (per spec + prompt.md):**
- §05 is the **SR victory lap.** The barn-pole "paradox" isn't a paradox; Bell's spaceship isn't a paradox; GPS works because relativity is correct; precision Lorentz tests are the longest winning streak in physics. Tone: confident, slightly playful — "look at this beautiful theory holding up under a hundred years of being checked."
- §05.3 `gps-as-relativity` is the **SR money shot of the entire SR half** — the moment a high-school reader realizes relativity isn't an ivory-tower puzzle but the reason their phone knows where they are. Don't undersell. The orbital-clock-correction visual is the take-home.
- §06 is the **GR on-ramp.** Voice shifts from "SR is correct" (confident, settled) to "and now the deepest question — why does m_grav = m_inertial?" (curious, opening). The equivalence-principle reframe is the bridge.
- §06.3 `gravitational-redshift` is the **§06 money shot** — Pound-Rebka 1960. The first laboratory test of GR, derivable from the equivalence principle alone. The Δν/ν ≈ 2.46 × 10⁻¹⁵ signal vs the measured (2.57 ± 0.26) × 10⁻¹⁵ should land as a quiet "of course." A 22.5-meter tower at Harvard measured the geometry of spacetime.
- §06.4 `gravity-as-geometry` is the **§06 honest-moment apex + GR bridge.** Insert a `<Callout variant="intuition">` after the geometric reformulation. The reader should feel: there is no force called gravity. There is curvature, and free-falling along curvature looks like falling. The next module formalizes that geometry. **Don't soften.** The closing paragraph should plain-Markdown-link forward to §07: `[the next module formalizes the geometry](/relativity/manifolds-and-tangent-spaces)` — the link will resolve to the §07.1 coming-soon stub, but the link won't 404.

**Cross-refs to RT Sessions 1+2 (must include where natural):**
- §05.1 `the-barn-pole-paradox` extends RT §02.2 `length-contraction` (the pole is contracted in the barn frame); RT §01.5 `relative-simultaneity` (the resolution lives in simultaneity, not contraction). Plain Markdown links.
- §05.2 `bells-spaceship-paradox` extends RT §02.2 `length-contraction` and references `<Term slug="born-rigidity">` (added Wave 1).
- §05.3 `gps-as-relativity` references RT §02.1 `time-dilation` (SR correction −7 μs/day) and forward-references §06.3 `gravitational-redshift` (GR correction +45 μs/day) via plain Markdown link `[gravitational redshift](/relativity/gravitational-redshift)`.
- §05.4 `precision-tests-of-sr` references RT §01.3 `michelson-morley` as the historical predecessor.
- §06.1 `inertial-vs-gravitational-mass` references RT §02.1 `time-dilation` only obliquely; mostly stands alone.
- §06.2 `einsteins-elevator` references RT §02.1 `time-dilation` (the elevator's clocks tick at different rates depending on height, derivable from EP alone).
- §06.3 `gravitational-redshift` references §05.3 `gps-as-relativity` (the GR clock-correction is the same redshift integrated over an orbit).
- §06.4 `gravity-as-geometry` is the closer — references §03 spacetime geometry as "the SR geometry that GR generalizes to curved manifolds."

**Forward-references to §07:**
- §06.4 `gravity-as-geometry` MUST forward-link to `/relativity/manifolds-and-tangent-spaces` via plain Markdown (the §07.1 topic slug; resolves to coming-soon stub but won't 404). This is the explicit GR-bridge that makes Session 4 a natural continuation rather than a new beginning.
- §05/§06 prose MAY plain-Markdown-link to other §07 topics (`the-metric-tensor`, `geodesics`) but shouldn't depend on them. Treat as plain text with optional link.
- If a Wave 2 agent finds itself wanting `<Term slug="manifold">`, `<Term slug="metric-tensor">`, `<Term slug="geodesic-equation">` (§07 glossary terms), DO NOT use — those don't exist yet. Use plain prose. Include in `MISSING_TERMS:` only if unavoidable; Wave 3 won't add them (§07 ships its own glossary in Session 4).

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

### Task 3: Topic `the-barn-pole-paradox` (FIG.21)

**Goal:** the apparent contradiction in length contraction, resolved by the relativity of simultaneity. The reader should grasp: (1) a 10-meter pole travels at β = 0.866 (γ = 2) toward a 5-meter barn; (2) in the barn frame the pole contracts to 5 meters and fits exactly; (3) in the pole frame the barn contracts to 2.5 meters and the pole cannot fit; (4) the resolution is that the two doors are simultaneously closed in the barn frame but not in the pole frame — the pole-frame story has the rear door close (and reopen) before the front door closes. Both stories are correct. The "paradox" was never a contradiction; it was an assumption of frame-independent simultaneity.

**Files:**
- Create: `lib/physics/relativity/barn-pole.ts`
- Create: `tests/physics/relativity/barn-pole.test.ts`
- Create: `components/physics/the-barn-pole-paradox/barn-frame-scene.tsx` — uses `SpacetimeDiagramCanvas` with `boostBeta=0`. Pole worldlines (front + rear ends of the pole) tilted at slope 1/β; barn worldlines vertical (front + rear doors). Two "door closed" events plotted at the moments the doors close. Both events lie on the same `t = const` slice → simultaneous. The pole's contracted length fits.
- Create: `components/physics/the-barn-pole-paradox/pole-frame-scene.tsx` — uses `SpacetimeDiagramCanvas` with `boostBeta=−0.866` (boost into the pole's rest frame). Same events; now the pole worldlines are vertical and the barn worldlines tilt. The two "door closed" events are no longer simultaneous in this frame — front door closes long after rear door opens. The pole was never trapped in the barn from its own frame.
- Create: `components/physics/the-barn-pole-paradox/no-paradox-scene.tsx` — side-by-side comparison: barn-frame story on left ("pole fits, both doors closed simultaneously"); pole-frame story on right ("pole sticks out, doors close at different times"). Same physics, two simultaneity slices.

**Physics lib:**

```typescript
import { SPEED_OF_LIGHT } from "@/lib/physics/constants";
import { gamma } from "./types";

/** In the barn rest frame: a pole of proper length L_pole moving at β contracts to L_pole/γ.
 *  Returns true iff the contracted pole fits inside a barn of length L_barn. */
export function fitsInBarnInBarnFrame(L_pole: number, L_barn: number, beta: number): boolean {
  return L_pole / gamma(beta) <= L_barn;
}

/** In the pole rest frame: the barn contracts to L_barn/γ. The pole has its proper length L_pole.
 *  Returns true iff the (smaller, contracted) barn could in principle contain the pole. */
export function fitsInBarnInPoleFrame(L_pole: number, L_barn: number, beta: number): boolean {
  return L_pole <= L_barn / gamma(beta);
}

/** The lab-frame time interval between the two door-closing events as measured in the pole's
 *  rest frame. If positive, rear-door event precedes front-door event in pole frame; the
 *  simultaneity offset is the resolution of the paradox. */
export function doorEventLagInPoleFrame(L_barn: number, beta: number, c = SPEED_OF_LIGHT): number {
  // In barn frame: front door at x = L_barn, rear door at x = 0; both closed at t = 0.
  // Lorentz boost into pole frame: Δt' = γ(Δt − v Δx/c²) with Δt = 0, Δx = L_barn:
  //   Δt' = −γ β L_barn / c.
  return -gamma(beta) * beta * L_barn / c;
}
```

**Test cases:** at β=0 the pole fits in the barn iff L_pole ≤ L_barn (Galilean limit); at β=0.866 (γ=2), L_pole=10, L_barn=5 → fits in barn frame, not in pole frame; door lag at β=0.866, L_barn=5 m ≈ −2.89 × 10⁻⁸ s (negative = front-door event precedes rear-door event in pole frame); door lag is zero at β=0; door lag is invariant in sign under β → −β.

**Prose outline (1000–1200 words):**
1. **§1 The setup.** A 10-meter pole, a 5-meter barn, an athlete running at β = 0.866. 200 w.
2. **§2 The barn-frame story.** SceneCard: `BarnFrameScene`. Pole contracts to 5 m; both doors slam shut simultaneously at t=0; pole is trapped (briefly). EQ.01: `L_{\text{pole, barn frame}} = L_{\text{pole, rest}}/\gamma`. 250 w.
3. **§3 The pole-frame story.** SceneCard: `PoleFrameScene`. The barn contracts to 2.5 m; the pole is 10 m; it cannot fit. The two door-closings occur at different times. EQ.02: `\Delta t' = -\gamma \beta L_{\text{barn}} / c`. 250 w.
4. **§4 The resolution.** SceneCard: `NoParadoxScene`. Both stories are correct. The paradox dissolves once you stop demanding frame-independent simultaneity. The relativity of simultaneity (RT §01.5) is doing all the work. 200 w.
5. **§5 A pattern.** Most "paradoxes" of SR are this: an assumption of universal simultaneity smuggled in. Bell's spaceship (§05.2) follows the same playbook. 100 w.

**Aside:** `albert-einstein`, `length-contraction` (existing), `simultaneity-relative` (existing), `barn-pole-paradox`, `lorentz-transformation` (existing).

**Commit:** `feat(rt/§05): the-barn-pole-paradox — two observers, two answers, no contradiction`.

---

### Task 4: Topic `bells-spaceship-paradox` (FIG.22)

**Goal:** John S. Bell's 1976 puzzle. The reader should grasp: (1) two identical rockets accelerate identically (same acceleration profile in the launch frame); (2) in the launch frame the distance between them stays constant; (3) but a string between them must stretch — and snap — because Born-rigidity demands the trailing rocket accelerate slightly faster than the leading one for the *proper* distance to stay constant; (4) the launch-frame-identical accelerations violate Born rigidity. The string snaps because the rockets aren't moving rigidly together.

**Files:**
- Create: `lib/physics/relativity/bell-spaceship.ts`
- Create: `tests/physics/relativity/bell-spaceship.test.ts`
- Create: `components/physics/bells-spaceship-paradox/two-rockets-scene.tsx` — uses `SpacetimeDiagramCanvas`. Two parallel hyperbolic worldlines (constant proper acceleration in the launch frame would be hyperbolic, but Bell's setup is identical lab-frame acceleration — two parallel curves shifted by the initial separation). String drawn between them at successive times; the proper length (length in instantaneous rest frame of either rocket) is increasing.
- Create: `components/physics/bells-spaceship-paradox/string-stretches-scene.tsx` — Canvas 2D zoom on the string. Lab-frame separation = const D₀. Proper-frame separation = γ D₀, increasing as β increases. At γ ≈ 2 the proper length is twice the unstretched length; the string snaps. HUD readout of γ vs proper-length-multiple.
- Create: `components/physics/bells-spaceship-paradox/born-rigid-comparison-scene.tsx` — a third worldline pair that IS Born-rigid (trailing rocket accelerates slightly faster). The string between Born-rigid pair stays at proper length D₀; the string between the launch-frame-identical pair stretches. Visual contrast.

**Physics lib:**

```typescript
import { SPEED_OF_LIGHT } from "@/lib/physics/constants";
import { gamma } from "./types";

/** Bell's two-rocket setup: two rockets at lab-frame separation D₀, both accelerating
 *  identically. After both reach speed β, the *proper* separation (in the rockets' shared
 *  instantaneous rest frame) is γ D₀ — increasing with β. */
export function properSeparation(D0: number, beta: number): number {
  return D0 * gamma(beta);
}

/** A string of proper length L₀ tied between the rockets has stretched by factor γ at speed β.
 *  Strain = (γ − 1). Returns the strain (dimensionless). */
export function stringStrain(beta: number): number {
  return gamma(beta) - 1;
}

/** A "snapping" model: the string snaps when its strain exceeds a critical value εc
 *  (typical macroscopic strings: εc ~ 0.01–0.1). Returns the speed β at which strain = εc. */
export function snapSpeed(epsilonCritical: number): number {
  if (epsilonCritical <= 0) throw new RangeError(`epsilonCritical must be positive`);
  const gammaCrit = 1 + epsilonCritical;
  return Math.sqrt(1 - 1 / (gammaCrit * gammaCrit));
}
```

**Test cases:** properSeparation reduces to D₀ at β=0; properSeparation(D₀, 0.866) = 2 D₀ (γ=2); stringStrain is monotonically increasing in β; snapSpeed for εc=1 (γ=2) is β=0.866; snapSpeed throws on εc ≤ 0.

**Prose outline (1000–1200 words):**
1. **§1 Bell's 1976 puzzle.** Two rockets, identical acceleration profile, string between them. Will the string break? 200 w.
2. **§2 The naïve answer.** SceneCard: `TwoRocketsScene`. In the launch frame the rocket separation is constant. The string shouldn't have to stretch. 200 w.
3. **§3 The right answer.** SceneCard: `StringStretchesScene`. The string is tied to *the rockets' proper frame*, not the launch frame. EQ.01: `D_{\text{proper}} = \gamma D_0`. The string must stretch by γ. 250 w.
4. **§4 What Born rigidity demands.** SceneCard: `BornRigidComparisonScene`. A truly rigid pair would have the trailing rocket accelerate faster, exactly cancelling length contraction. EQ.02: `\Delta t_{\text{front}} = \Delta t_{\text{rear}}/\gamma_{\text{rear}}`. 200 w.
5. **§5 The deeper point.** "Identical acceleration in the launch frame" is NOT the same as "rigid translation." Born rigidity is a coordinate-independent statement; the launch-frame-identical setup smuggles in a coordinate choice. 100 w.

**Aside:** `bell-spaceship-paradox`, `born-rigidity`, `length-contraction` (existing).

**Commit:** `feat(rt/§05): bells-spaceship-paradox — a string between two synchronized rockets, and the geometry that snaps it`.

---

### Task 5: Topic `gps-as-relativity` (FIG.23) — **§05 MONEY SHOT**

**Goal:** the working-relativity-experiment-in-everyone's-pocket. The reader should grasp: (1) GPS satellites orbit at altitude ≈ 20,200 km, β ≈ 1.3 × 10⁻⁵; (2) SR's kinematic time dilation slows the orbiting clock by ~7 μs/day; (3) GR's gravitational time dilation (lower potential at orbital radius vs Earth's surface) speeds it up by ~45 μs/day; (4) net correction is +38 μs/day, programmed into every receiver; (5) without it, position fixes drift ~11 km/day. Money shot: orbital animation with the dual-correction overlay and the "11 km/day drift" gauge.

**Files:**
- Create: `lib/physics/relativity/gps-corrections.ts`
- Create: `tests/physics/relativity/gps-corrections.test.ts`
- Create: `components/physics/gps-as-relativity/gps-orbit-scene.tsx` — **THE MONEY SHOT.** Canvas 2D top-down view of Earth + GPS satellite orbiting at 20,200 km altitude. Two clock readouts overlaid: ground clock (sea-level), satellite clock. Below: SR-correction bar (slows satellite by 7 μs/day, drawn as red descending) and GR-correction bar (speeds satellite by 45 μs/day, drawn as green ascending). Net: +38 μs/day. Slider for orbital position — purely cosmetic; the corrections are constant for a circular orbit.
- Create: `components/physics/gps-as-relativity/two-clocks-comparison-scene.tsx` — Canvas 2D side-by-side ledger: SR contribution in one column; GR contribution in another; net in the third. Numerical breakdowns. Annotated: "SR slows; GR speeds; GR dominates by ~6×."
- Create: `components/physics/gps-as-relativity/uncorrected-drift-scene.tsx` — animated map showing a position fix drifting at ~11 km/day if the +38 μs/day correction is not applied. After 1 hour: ~460 m off; after 1 day: ~11 km off; after 1 week: ~77 km off. The scale of the error a working relativity experiment prevents.

**Physics lib:**

```typescript
import { SPEED_OF_LIGHT, G_SI } from "@/lib/physics/constants";

const EARTH_MASS_KG = 5.972e24;
const EARTH_RADIUS_M = 6.371e6;
const GPS_ORBIT_RADIUS_M = EARTH_RADIUS_M + 20.2e6; // ~26,571 km from Earth's center
const SECONDS_PER_DAY = 86400;

/** SR (kinematic) time-dilation correction in seconds-per-day: a clock orbiting at speed v
 *  ticks slower by dt_SR/dt_lab = √(1 − β²) ≈ −β²/2 per unit lab time. Returns the
 *  fractional rate offset (negative — clock loses time) integrated over one day. */
export function srCorrectionSecondsPerDay(orbitalSpeed: number, c = SPEED_OF_LIGHT): number {
  const beta = orbitalSpeed / c;
  // Δτ/Δt = √(1 − β²) − 1 ≈ −β²/2 for small β
  const fractional = Math.sqrt(1 - beta * beta) - 1;
  return fractional * SECONDS_PER_DAY;
}

/** GR (gravitational) time-dilation correction in seconds-per-day: a clock at radius r
 *  in Earth's potential ticks differently than a clock at Earth's surface. To leading order
 *  (weak-field), Δτ/Δt = 1 − Φ/c² where Φ = −GM/r. Returns the fractional offset
 *  (positive — orbit clock gains time vs surface) over one day. */
export function grCorrectionSecondsPerDay(orbitRadius: number, surfaceRadius = EARTH_RADIUS_M, M = EARTH_MASS_KG, G = G_SI, c = SPEED_OF_LIGHT): number {
  const phi_orbit = -G * M / orbitRadius;
  const phi_surface = -G * M / surfaceRadius;
  // Δτ_orbit/Δτ_surface ≈ 1 + (Φ_surface − Φ_orbit)/c²
  // Higher altitude → less negative Φ → orbit clock ticks faster → positive correction.
  const fractional = (phi_surface - phi_orbit) / (c * c);
  return fractional * SECONDS_PER_DAY;
}

/** Orbital speed of a GPS satellite from Kepler's third law: v = √(GM/r). */
export function gpsOrbitalSpeed(r = GPS_ORBIT_RADIUS_M, M = EARTH_MASS_KG, G = G_SI): number {
  return Math.sqrt(G * M / r);
}

/** Net correction (SR + GR) in microseconds per day. Positive = orbit clock gains time. */
export function netCorrectionMicrosecondsPerDay(): number {
  const v = gpsOrbitalSpeed();
  return (srCorrectionSecondsPerDay(v) + grCorrectionSecondsPerDay(GPS_ORBIT_RADIUS_M)) * 1e6;
}

/** Position drift per day if the +38 μs/day correction is not applied: c × Δt. */
export function uncorrectedDriftKmPerDay(c = SPEED_OF_LIGHT): number {
  const drift_seconds_per_day = Math.abs(netCorrectionMicrosecondsPerDay() * 1e-6);
  return (c * drift_seconds_per_day) / 1000; // km
}
```

**Test cases:** GPS orbital speed ≈ 3874 m/s (matches widely-cited textbook value within 0.5%); SR correction at GPS speed ≈ −7.2 μs/day (within 0.5 μs of the canonical −7); GR correction at GPS altitude ≈ +45.7 μs/day (within 1 μs of canonical +45.7); net ≈ +38.5 μs/day; uncorrected drift ≈ 11.5 km/day (within 1 km of canonical 11). Use the test descriptions as targets; if the literal numbers don't match within tolerance, recompute both prediction and test from the same physical formulas.

**Prose outline (1200–1400 words). The §05 money shot.**
1. **§1 The phone in your pocket.** GPS works because relativity is correct. If it weren't, your position would drift 11 km in a day. 250 w.
2. **§2 The orbit.** SceneCard: `GpsOrbitScene` (the money shot). Altitude ≈ 20,200 km, orbital speed ≈ 3.87 km/s. EQ.01: `v = \sqrt{GM/r} \approx 3874\,\text{m/s}`. 200 w.
3. **§3 SR slows the clock.** EQ.02: `\Delta\tau_{\text{SR}}/\Delta t \approx -\beta^2/2 \approx -7\,\mu\text{s/day}`. The kinematic correction. RT §02.1 `time-dilation`. 200 w.
4. **§4 GR speeds it up.** SceneCard: `TwoClocksComparisonScene`. EQ.03: `\Delta\tau_{\text{GR}}/\Delta t \approx +(GM/c^2)(1/R_\oplus - 1/r) \approx +45\,\mu\text{s/day}`. The gravitational correction; this is the §06.3 redshift integrated over orbit. Plain Markdown link to `[gravitational redshift](/relativity/gravitational-redshift)`. 250 w.
5. **§5 The net + the drift.** SceneCard: `UncorrectedDriftScene`. Net +38 μs/day. Without the correction, position drifts ~11 km/day. The receiver firmware applies it; the satellite-side broadcast includes the offset. 200 w.
6. **§6 The deeper point.** Every billion-dollar navigation system on Earth is a working relativity experiment. SR and GR aren't theoretical — they're the calibration in your pocket. 200 w.

**Aside:** `albert-einstein`, `time-dilation` (existing), `gps-correction`.

**Commit:** `feat(rt/§05): gps-as-relativity — relativity in your pocket, 38 microseconds at a time`.

---

### Task 6: Topic `precision-tests-of-sr` (FIG.24)

**Goal:** SR as the most-tested theory in physics. The reader should grasp: (1) Michelson-Morley (1887) — first; (2) Kennedy-Thorndike (1932) — boost-direction asymmetry constraint; (3) Hughes-Drever (1959–60) — magnetic-resonance frequency stability across orientation, a Lorentz-violation bound at parts in 10⁻¹⁵; (4) modern atomic-clock comparison and optical-lattice clocks pushing parts in 10⁻¹⁸; (5) the Standard-Model Extension (SME) phenomenology framework. This is the survey topic; the take-home is the timeline of precision.

**Files:**
- Create: `lib/physics/relativity/precision-tests.ts`
- Create: `tests/physics/relativity/precision-tests.test.ts`
- Create: `components/physics/precision-tests-of-sr/timeline-scene.tsx` — Canvas 2D horizontal timeline 1887 → 2025. Markers for: Michelson-Morley 1887 (10⁻⁹), Kennedy-Thorndike 1932 (10⁻⁹), Hughes-Drever 1960 (10⁻¹⁵), modern AC comparison 2015+ (10⁻¹⁸). Each marker labeled with experiment + bound. Y-axis: log-scale fractional bound on Lorentz-violating coefficients.
- Create: `components/physics/precision-tests-of-sr/sme-bounds-scene.tsx` — bar chart of current bounds on representative SME coefficients (c_TT, c_XX, b_T, etc.) with their experimental sources. The framework Kostelecký + collaborators systematized in the 1990s.
- Create: `components/physics/precision-tests-of-sr/why-not-broken-scene.tsx` — narrative panel: a list of motivations to break SR (quantum gravity, Lorentz-violating cosmologies, string-theory backgrounds) and the experimental bounds that say "if any of these are right, the violations are too small to see." A dramatic chart of "violation bounds vs natural Planck-scale magnitude" — the bounds are 18+ orders of magnitude tighter than naïve quantum-gravity estimates.

**Physics lib:**

```typescript
/** Historical bound on fractional Lorentz violation, indexed by year of canonical experiment.
 *  Returns the order of magnitude of the bound on Δc/c or similar SR-coefficient anisotropy. */
export interface PrecisionTestEntry {
  year: number;
  experiment: string;
  bound: number; // fractional, e.g. 1e-15
  technique: string;
}

export function precisionTestTimeline(): readonly PrecisionTestEntry[] {
  return [
    { year: 1887, experiment: "Michelson-Morley", bound: 1e-9, technique: "interferometer" },
    { year: 1932, experiment: "Kennedy-Thorndike", bound: 1e-9, technique: "asymmetric interferometer" },
    { year: 1960, experiment: "Hughes-Drever", bound: 1e-15, technique: "Li-7 NMR isotropy" },
    { year: 1979, experiment: "Brillet-Hall", bound: 5e-9, technique: "He-Ne laser interferometer (refined Michelson-Morley)" },
    { year: 2015, experiment: "Optical atomic clocks (Sr/Yb comparison)", bound: 1e-18, technique: "lattice-clock frequency comparison" },
  ] as const;
}

/** Naïve quantum-gravity expectation for a Lorentz-violating coefficient at the Planck scale:
 *  v_observation/c_planck where v_observation is a typical lab speed (e.g., Earth's orbital
 *  speed ~30 km/s) and c_planck ~ 1. Order-of-magnitude estimate. */
export function naivePlanckScaleBound(): number {
  const v_orbit = 30e3; // m/s, Earth's orbital speed around the Sun
  const c = 2.99792458e8; // m/s
  return v_orbit / c; // ~1e-4
}
```

**Test cases:** timeline returns entries in chronological order; Hughes-Drever bound is the first entry below 10⁻⁹; bound monotonically tightens (with one historical exception — Brillet-Hall 1979 was actually a slight regression vs Hughes-Drever for the specific MM-type isotropy bound, which is acceptable). Test: `precisionTestTimeline()[2].experiment` includes "Hughes" and `precisionTestTimeline()[4].bound <= 1e-17`.

**Prose outline (900–1100 words):**
1. **§1 The longest winning streak.** SR has been checked for 138 years. Every check has agreed. 200 w.
2. **§2 The four eras.** SceneCard: `TimelineScene`. Michelson-Morley 1887 → Hughes-Drever 1960 → Kostelecký-SME framework 1990s → optical-clock comparison 2015+. Six orders of magnitude of precision gain. 250 w.
3. **§3 The phenomenology.** SceneCard: `SmeBoundsScene`. The Standard-Model Extension parametrizes Lorentz violation with a finite list of coefficients. Each experiment bounds a specific subset. Modern bounds are 10⁻¹⁸ on the strongest-constrained. 200 w.
4. **§4 Why not broken?** SceneCard: `WhyNotBrokenScene`. Quantum gravity is "supposed" to break Lorentz invariance at the Planck scale. The bounds say it doesn't — by 14+ orders of magnitude tighter than naïve expectation. The puzzle. 250 w.

**Aside:** `precision-lorentz-tests`, `michelson-morley` (existing topic; plain Markdown link to `/relativity/michelson-morley`), `lorentz-transformation` (existing).

**Commit:** `feat(rt/§05): precision-tests-of-sr — a hundred years of being right, to one part in 10^18`.

---

### Task 7: Topic `inertial-vs-gravitational-mass` (FIG.25)

**Goal:** the deepest puzzle the equivalence principle resolves. The reader should grasp: (1) inertial mass m_i appears in F = m_i a (resistance to acceleration); (2) gravitational mass m_g appears in F = m_g g (coupling to gravity); (3) Galileo's Pisa observation: all things fall the same — m_g/m_i is composition-independent; (4) Eötvös 1889 + 1922 torsion balance: ≲ 10⁻⁹; (5) MICROSCOPE 2017 satellite: ≲ 10⁻¹⁵; (6) Newton noticed but never explained why — Einstein's equivalence principle says: there is no "why." It's the geometric content of the EP.

**Files:**
- Create: `lib/physics/relativity/equivalence-mass.ts`
- Create: `tests/physics/relativity/equivalence-mass.test.ts`
- Create: `components/physics/inertial-vs-gravitational-mass/pisa-tower-scene.tsx` — Canvas 2D Pisa tower with two falling balls (one iron, one wood). Both fall at the same g; trajectories overlap. Annotated: "If m_g were not equal to m_i, the heavier ball would fall faster — Aristotle was wrong, Galileo was right."
- Create: `components/physics/inertial-vs-gravitational-mass/eotvos-balance-scene.tsx` — Canvas 2D top-down view of an Eötvös torsion balance. Two test masses of different composition (e.g., platinum, copper) at the ends of a horizontal beam suspended on a fibre. Earth's rotation produces a tiny torque if m_g/m_i differs. Slider for η = (m_g − m_i)/m_i — at η = 0, no torque; at η > 0, torque visible.
- Create: `components/physics/inertial-vs-gravitational-mass/precision-progression-scene.tsx` — log-scale chart of historical bounds on η: Galileo 1589 (~10⁻³ inferred), Newton 1687 (~10⁻³), Bessel 1832 (~2×10⁻⁵), Eötvös 1889 (10⁻⁸), Eötvös-Pekár-Fekete 1922 (~3×10⁻⁹), Roll-Krotkov-Dicke 1964 (10⁻¹¹), Adelberger group 1990s (10⁻¹³), MICROSCOPE 2017+ (10⁻¹⁵). 14 orders of magnitude in 400 years.

**Physics lib:**

```typescript
/** Eötvös parameter η = (m_g − m_i) / m_i. Zero iff WEP holds exactly. */
export function eotvosParameter(m_grav: number, m_inertial: number): number {
  if (m_inertial <= 0) throw new RangeError(`m_inertial must be positive`);
  return (m_grav - m_inertial) / m_inertial;
}

/** Differential acceleration between two test masses A and B, in units of g, in a uniform
 *  gravitational field. If WEP holds (η_A = η_B = 0), Δa/g = 0. */
export function differentialAcceleration(eta_A: number, eta_B: number): number {
  return eta_A - eta_B;
}

/** Historical experimental bounds on |η|, ordered chronologically. */
export interface WEPBoundEntry {
  year: number;
  experiment: string;
  bound: number; // upper limit on |η|
}

export function wepBoundTimeline(): readonly WEPBoundEntry[] {
  return [
    { year: 1589, experiment: "Galileo (Pisa, inferred)", bound: 1e-3 },
    { year: 1832, experiment: "Bessel pendulum", bound: 2e-5 },
    { year: 1889, experiment: "Eötvös", bound: 1e-8 },
    { year: 1922, experiment: "Eötvös-Pekár-Fekete", bound: 3e-9 },
    { year: 1964, experiment: "Roll-Krotkov-Dicke", bound: 1e-11 },
    { year: 1999, experiment: "Adelberger (U. Washington)", bound: 1e-13 },
    { year: 2017, experiment: "MICROSCOPE (CNES)", bound: 1.4e-15 },
  ] as const;
}
```

**Test cases:** eotvosParameter(1.0, 1.0) = 0; eotvosParameter(1.001, 1.0) = 0.001; differentialAcceleration is symmetric in sign under (A, B) swap; wepBoundTimeline is monotonically tightening; throws on m_inertial ≤ 0.

**Prose outline (1100–1300 words):**
1. **§1 Two definitions, one number.** F = m_i a (inertial). F = m_g g (gravitational). Why are these the same number? 250 w.
2. **§2 Galileo at Pisa.** SceneCard: `PisaTowerScene`. The legendary observation. Aristotle wrong; Galileo right. 200 w.
3. **§3 Eötvös's torsion balance.** SceneCard: `EotvosBalanceScene`. The 1889 + 1922 measurement. EQ.01: `\eta = (m_g - m_i)/m_i`. Bound ≲ 10⁻⁹. 250 w.
4. **§4 The 400-year ladder.** SceneCard: `PrecisionProgressionScene`. From 10⁻³ to 10⁻¹⁵, 14 orders of magnitude. The MICROSCOPE 2017 result is the current state of the art. 250 w.
5. **§5 The deeper point.** Newton noticed but never explained the equality. Einstein's answer: there is no "why" — it's the geometric content of gravity. The next module (§06.2 elevator) makes this concrete; §06.4 makes it geometric. 200 w.

**Aside:** `roland-eotvos`, `albert-einstein`, `isaac-newton`, `galileo-galilei`, `eotvos-parameter`, `weak-equivalence-principle`, `equivalence-principle`.

**Commit:** `feat(rt/§06): inertial-vs-gravitational-mass — two definitions, one number, to 13 decimal places`.

---

### Task 8: Topic `einsteins-elevator` (FIG.26)

**Goal:** Einstein's "happiest thought." The reader should grasp: (1) a free-falling elevator is a frame where gravity has been canceled — inside, everything floats; (2) equivalently, a uniformly accelerating rocket in deep space is indistinguishable from a stationary lab in a gravitational field; (3) the equivalence is local — only over a small enough region, because real gravity has tidal forces; (4) this is the foundational thought experiment from which everything else in GR follows, including gravitational redshift (§06.3).

**Files:**
- Create: `lib/physics/relativity/elevator.ts`
- Create: `tests/physics/relativity/elevator.test.ts`
- Create: `components/physics/einsteins-elevator/free-falling-elevator-scene.tsx` — Canvas 2D split panel. Left: an elevator falling under gravity g; objects inside float (no contact force on the floor). Right: a stationary elevator deep in space, no gravity; same scene from inside — objects float. The two scenes are indistinguishable from inside.
- Create: `components/physics/einsteins-elevator/accelerating-rocket-scene.tsx` — Canvas 2D rocket accelerating at g in deep space (no gravitational field). Objects inside experience an apparent "gravity" pulling them to the floor. Indistinguishable from a stationary lab on Earth's surface. The reverse equivalence.
- Create: `components/physics/einsteins-elevator/tidal-limit-scene.tsx` — the EP is local. Two test masses far apart in a real gravitational field experience slightly different g (tidal force). The elevator equivalence breaks down over distances. Animated: as the test masses separate, the residual tidal acceleration grows visibly.

**Physics lib:**

```typescript
import { g_SI } from "@/lib/physics/constants";

/** Einstein's "happiest thought" formalised: in a freely-falling lab, the apparent
 *  gravitational field vanishes. Returns the apparent g for an observer accelerating at
 *  a_lab in lab frame, in a gravitational field of strength g_field. */
export function apparentGravityInFreelyFallingFrame(g_field: number, a_lab: number): number {
  return g_field - a_lab;
}

/** Tidal acceleration between two points separated by Δr along the radial direction in a
 *  gravitational field of strength g(r). To leading order, Δa = (dg/dr) Δr. For Earth's
 *  field at radius R, dg/dr = -2g/R. */
export function tidalAccelerationOverSeparation(deltaR: number, R = 6.371e6, g = g_SI): number {
  return -2 * g * deltaR / R;
}

/** Time for an elevator dropped from rest to fall a distance h under uniform gravity. */
export function elevatorFallTime(h: number, g = g_SI): number {
  if (h < 0 || g <= 0) throw new RangeError(`fall time requires h ≥ 0 and g > 0`);
  return Math.sqrt(2 * h / g);
}
```

**Test cases:** apparentGravityInFreelyFallingFrame(9.81, 9.81) = 0 (free-fall cancels gravity); apparent g doubles when a_lab is reversed; tidal acceleration over 1 m at Earth's surface ≈ 3 × 10⁻⁶ m/s² (small, but nonzero); elevator fall time for h=10 m ≈ 1.43 s; throws on h < 0.

**Prose outline (1000–1200 words):**
1. **§1 The happiest thought.** Einstein, 1907, in the Bern patent office: a man falling from a roof feels no gravity. From this insight everything else follows. 250 w.
2. **§2 The free-fall equivalence.** SceneCard: `FreeFallingElevatorScene`. Left: free-falling elevator on Earth. Right: stationary elevator in deep space. Indistinguishable from inside. 250 w.
3. **§3 The reverse.** SceneCard: `AcceleratingRocketScene`. A rocket accelerating at g in deep space is indistinguishable from a stationary lab on Earth's surface. EQ.01: locally, gravitational acceleration ≡ inertial acceleration. 250 w.
4. **§4 Tidal limits — the EP is local.** SceneCard: `TidalLimitScene`. Real gravity has tidal forces; elevator equivalence breaks down over a finite region. EQ.02: `\Delta a / \Delta r = -2GM/r^3`. 200 w.
5. **§5 What follows.** From the EP alone, gravitational redshift (§06.3) and bending of light follow without any field equations. The next two topics cash out the consequences. 100 w.

**Aside:** `albert-einstein`, `roland-eotvos`, `equivalence-principle`, `weak-equivalence-principle`, `einstein-equivalence-principle`.

**Commit:** `feat(rt/§06): einsteins-elevator — a free-falling lab is a frame where gravity has been canceled`.

---

### Task 9: Topic `gravitational-redshift` (FIG.27) — **§06 MONEY SHOT**

**Goal:** Pound-Rebka 1960. The reader should grasp: (1) a photon climbing out of a gravity well loses energy — its frequency drops by Δν/ν = gh/c²; (2) this is derivable from the equivalence principle alone — no field equations needed; (3) the 1960 Harvard 22.5-meter Jefferson tower experiment used the Mössbauer effect to detect Δν/ν ≈ 2.46 × 10⁻¹⁵; (4) measured value: (2.57 ± 0.26) × 10⁻¹⁵ — the predicted value to better than 10%; (5) refined to 1% by Pound-Snider 1965. **Money shot: tower cross-section + Mössbauer absorber resonance + observed-vs-predicted shift readout.**

**Files:**
- Create: `lib/physics/relativity/gravitational-redshift.ts`
- Create: `tests/physics/relativity/gravitational-redshift.test.ts`
- Create: `components/physics/gravitational-redshift/pound-rebka-tower-scene.tsx` — **THE MONEY SHOT.** Canvas 2D side-view of the Jefferson Physical Laboratory tower at Harvard, 22.5 m tall. Gamma-ray source at top (Co-57 emitting 14.4 keV gammas via Fe-57 transition). Mössbauer absorber at bottom. Photon traversing the tower; its frequency drops by gh/c² ≈ 2.46 × 10⁻¹⁵. Numerical readout. Annotated: "first laboratory test of GR; derivable from EP alone."
- Create: `components/physics/gravitational-redshift/mossbauer-resonance-scene.tsx` — Canvas 2D Mössbauer absorption spectrum. Without redshift: source and absorber resonate at the same frequency, peak absorption. With redshift: absorber needs to be Doppler-shifted (moved at small velocity v ≈ gh/c) to compensate. The Doppler velocity that recovers resonance is the measurement.
- Create: `components/physics/gravitational-redshift/predicted-vs-observed-scene.tsx` — bar chart: predicted Δν/ν = 2.46 × 10⁻¹⁵ vs measured (2.57 ± 0.26) × 10⁻¹⁵ (Pound-Rebka 1960) vs measured 0.9990 ± 0.0076 × predicted (Pound-Snider 1965). 1% agreement. Below: history-bar showing further confirmations: GP-A 1976 (10⁻⁴), atomic-fountain ground-station tests 2000s.

**Physics lib:**

```typescript
import { SPEED_OF_LIGHT, g_SI } from "@/lib/physics/constants";

/** Gravitational redshift Δν/ν for a photon climbing through a gravitational potential
 *  difference ΔΦ. Sign convention: positive Δν/ν = blueshift (climbing INTO potential well);
 *  for a photon climbing OUT (e.g., the Pound-Rebka source-at-top, absorber-at-bottom), the
 *  reverse: an absorber-at-bottom sees a *blue*shift, source-at-top sees a *red*shift.
 *  Conventional Δν/ν = gh/c² for tower of height h (source at top, absorber at bottom). */
export function gravitationalRedshiftFractional(h: number, g = g_SI, c = SPEED_OF_LIGHT): number {
  return g * h / (c * c);
}

/** The Doppler velocity needed to compensate the redshift (move the absorber toward the source
 *  at this v to recover resonance): v ≈ c × (Δν/ν) = gh/c. */
export function compensatingDopplerVelocity(h: number, g = g_SI, c = SPEED_OF_LIGHT): number {
  return g * h / c;
}

/** The Pound-Rebka 1960 prediction: 22.5-meter tower at Harvard, g = 9.81. */
export const POUND_REBKA_PREDICTED = gravitationalRedshiftFractional(22.5);

/** The Pound-Rebka 1960 measured value: (2.57 ± 0.26) × 10⁻¹⁵; refined Pound-Snider 1965 to
 *  ratio measured/predicted = 0.9990 ± 0.0076. */
export const POUND_REBKA_MEASURED = 2.57e-15;
export const POUND_REBKA_MEASUREMENT_ERROR = 0.26e-15;
export const POUND_SNIDER_RATIO = 0.9990;
export const POUND_SNIDER_RATIO_ERROR = 0.0076;
```

**Test cases:** gravitationalRedshiftFractional(22.5) ≈ 2.46 × 10⁻¹⁵ (Pound-Rebka prediction; verify within 1% — the literal `g*h/c² = 9.80665 × 22.5 / (2.99792458e8)² = 2.4538e-15`); compensating Doppler velocity at h = 22.5 m ≈ 7.36 × 10⁻⁷ m/s (≈ 0.74 μm/s — the actual Pound-Rebka apparatus moved the absorber at this scale); redshift is linear in h; redshift at h = 0 is exactly 0; redshift scales as 1/c².

**Prose outline (1200–1400 words). The §06 money shot.**
1. **§1 The prediction from EP alone.** A photon climbing in a gravity well must lose energy. Same energy = same frequency relation E=hν, so frequency drops. EQ.01: `\Delta\nu/\nu = -gh/c^2`. 250 w.
2. **§2 The 22.5-meter tower.** SceneCard: `PoundRebkaTowerScene` (the money shot). Co-57 source at top, Fe-57 absorber at bottom. Predicted shift: 2.46 × 10⁻¹⁵. 250 w.
3. **§3 The Mössbauer trick.** SceneCard: `MossbauerResonanceScene`. Recoilless gamma emission gives parts-per-quadrillion frequency resolution. Without it, the experiment is impossible — the recoil broadens the line by 10⁻⁸. With it, the 10⁻¹⁵ shift is measurable. 250 w.
4. **§4 The result.** SceneCard: `PredictedVsObservedScene`. Pound-Rebka 1960: (2.57 ± 0.26) × 10⁻¹⁵ — predicted to within 10%. Pound-Snider 1965: 0.999 ± 0.008. The first laboratory test of GR. 250 w.
5. **§5 Why it matters.** Derivable from EP alone — no field equations needed. The §06 money shot. Forward-link: §06.4 says this redshift IS the geometric content of gravity. The same redshift integrates to the +45 μs/day GR correction in §05.3 GPS. 200 w.

**Aside:** `pound-rebka`, `albert-einstein`, `mossbauer-effect`, `equivalence-principle`, `einstein-equivalence-principle`.

**Commit:** `feat(rt/§06): gravitational-redshift — climb out of a gravity well and your photons get tired`.

---

### Task 10: Topic `gravity-as-geometry` (FIG.28) — **§06 HONEST MOMENT + GR BRIDGE**

**Goal:** the equivalence principle's geometric implication. The reader should grasp: (1) "free-fall is the natural state" — geodesic motion in spacetime; (2) what we call gravity is not a force but the curvature that makes geodesics look like falling; (3) the EP says local frames are inertial → globally, the frames must be patched together → the patching produces curvature → the curvature is described by a metric tensor; (4) Session 4 (§07) formalizes the geometry: manifolds, tangent spaces, metrics, Christoffels, geodesics. **Honest moment: there is no force called gravity. There is curvature, and free-falling along curvature looks like falling. The next module formalizes that geometry.**

**Files:**
- Create: `lib/physics/relativity/gravity-as-geometry.ts`
- Create: `tests/physics/relativity/gravity-as-geometry.test.ts`
- Create: `components/physics/gravity-as-geometry/curved-trajectory-scene.tsx` — Canvas 2D split panel. Left: Newtonian view — apple "pulled" down by a gravitational force vector. Right: GR view — apple follows a geodesic in curved spacetime; the path looks curved because spacetime is curved, not because a force pulls. Same trajectory, two interpretations.
- Create: `components/physics/gravity-as-geometry/embedded-curvature-scene.tsx` — embedding-diagram-style visualization (1+1 D suppressed to 2D for visualization): a "rubber sheet" with a depression caused by a mass; nearby test particles roll into the depression along geodesics. Honest caveat in the HUD: "embedding diagrams are pedagogical, not literal — real spacetime curvature is intrinsic, not an embedding into a higher-dimensional space."
- Create: `components/physics/gravity-as-geometry/honest-moment-scene.tsx` — text-and-equation panel: the §06.4 closer. "There is no force called gravity. There is curvature." Below: a teaser-equation `R_{\mu\nu} - \frac{1}{2}g_{\mu\nu}R = (8\pi G/c^4) T_{\mu\nu}` with the sentence "this is what Session 4 will derive — the geometry that gravity is."

**Physics lib:**

```typescript
import { SPEED_OF_LIGHT, G_SI } from "@/lib/physics/constants";

/** Schwarzschild radius r_s = 2GM/c². The threshold below which the Schwarzschild metric's
 *  coordinate-time stretching diverges. Defined here as the conceptual bridge to §09. */
export function schwarzschildRadius(M: number, G = G_SI, c = SPEED_OF_LIGHT): number {
  if (M <= 0) throw new RangeError(`schwarzschildRadius: mass must be positive`);
  return 2 * G * M / (c * c);
}

/** Weak-field static-source approximation of the time-time metric component:
 *  g_tt ≈ -(1 + 2Φ/c²) where Φ = -GM/r is the Newtonian potential. */
export function weakFieldGtt(r: number, M: number, G = G_SI, c = SPEED_OF_LIGHT): number {
  const phi = -G * M / r;
  return -(1 + 2 * phi / (c * c));
}

/** Newtonian-equivalent gravitational potential at radius r from a point mass M.
 *  Used by the §06.4 "gravity is the geometry" reframe: this Φ shows up as the leading
 *  term in g_tt. */
export function newtonianPotential(r: number, M: number, G = G_SI): number {
  if (r <= 0 || M <= 0) throw new RangeError(`newtonianPotential: r and M must be positive`);
  return -G * M / r;
}
```

**Test cases:** schwarzschildRadius(M_sun = 1.989e30) ≈ 2953 m (matches widely-cited textbook value within 1 m); weakFieldGtt at r = 100×r_s ≈ −1 + 0.02 (small departure from flat metric); throws on M ≤ 0 in schwarzschildRadius and r ≤ 0 in newtonianPotential.

**Prose outline (1200–1400 words). The §06 honest moment + GR bridge.**
1. **§1 The reframe.** EP says: locally, no experiment distinguishes free-fall from no-gravity. So in any small region, spacetime looks flat (Minkowski). But globally, real gravity isn't a uniform force — it varies. The patch-together is curvature. 300 w.
2. **§2 Free-fall is the natural state.** SceneCard: `CurvedTrajectoryScene`. The apple isn't pulled — it follows a geodesic in curved spacetime. The "force of gravity" was a Newtonian fiction. 250 w.
3. **§3 The geometry made visible.** SceneCard: `EmbeddedCurvatureScene`. The rubber-sheet metaphor with the honest caveat: real curvature is intrinsic, not an embedding. The metaphor works for intuition; Session 4 makes it rigorous. 250 w.
4. **§4 The honest moment.** SceneCard: `HonestMomentScene`. **Callout (intuition variant):** "There is no force called gravity. There is curvature, and free-falling along curvature looks like falling. The next module formalizes that geometry — manifolds, tangent spaces, metrics, Christoffels, geodesics. The plumbing of GR." 250 w.
5. **§5 Forward.** Plain Markdown link: `[the next module formalizes the geometry](/relativity/manifolds-and-tangent-spaces)`. The link will resolve to the §07.1 coming-soon stub; that's fine — it indicates where the math goes next. From here we build manifolds, the metric tensor, Christoffel symbols, and geodesic equations. The Einstein field equations follow in §08; the Schwarzschild metric in §09; black holes in §10; gravitational waves in §11; cosmology in §12. The longest-running winning streak in 20th-century physics. 200 w.

**Aside:** `albert-einstein`, `equivalence-principle`, `einstein-equivalence-principle`.

**Commit:** `feat(rt/§06): gravity-as-geometry — there is no force called gravity, only curvature`.

---

## Wave 2.5 — Registry merge + publish + per-topic commit (orchestrator inline, serial)

**Order: §05.1 → §05.2 → §05.3 → §05.4 → §06.1 → §06.2 → §06.3 → §06.4.**

**Why this order:** sequential FIG order is natural; **§05.3 GPS is the riskiest publish** (densest equation set of the session — three corrections, two clocks, the orbit). When you reach it, publish first; if `0 inserted / 0 updated` returns, the LaTeX is parsing empty — switch to one `<EquationBlock>` per equation and republish before authoring §05.4. **§06.3 gravitational-redshift** is the second-riskiest (Mössbauer + EP-derivation + Pound-Rebka measurement) but math-light compared to §05.3.

For each Wave 2 topic, in order:

- [ ] **Step 1:** Open `lib/content/simulation-registry.ts`. Append the agent's `REGISTRY_BLOCK:` content under the existing entries with a `// RT §0X — <slug>` section comment. Insert before the closing `};` and the `export type SimulationName` line (line 1239).

- [ ] **Step 2:** Run typecheck.

```bash
pnpm tsc --noEmit
```

Expected: clean. If errors mention `lazyScene` or `import` paths, double-check the agent's REGISTRY_BLOCK was pasted with correct indentation and matching `m.<SceneName>` matches the file's actual export.

- [ ] **Step 3:** Publish the topic.

```bash
pnpm content:publish --only relativity/<slug>
```

Expected: `1 added` (first publish) or `1 updated`. **If `0 added / 0 updated`,** the MDX parsed empty — investigate. Check for: (a) bare `<` in prose, (b) multi-line `$$...$$`, (c) JSX inside `title=""` attribute, (d) HTML entity inside math `&gt;` from Sessions 1+2's lesson, (e) `<Term>` or `<PhysicistLink>` placed block-level instead of inline, (f) `<Term slug="gravitational-redshift">` referencing a topic-only slug.

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

Repeat for all 8 topics.

---

## Wave 3 — Finalize (1 subagent, orchestrator inline)

### Task 11: Run seed, smoke-test, update spec, log

**Files:**
- Modify: `docs/superpowers/specs/2026-04-29-relativity-branch-design.md`

- [ ] **Step 1: Pre-seed forward-ref scan**

```bash
# Scan the 8 new MDX files for any <Term slug="..."> calls.
grep -rohE '<Term slug="[^"]+"' app/\[locale\]/\(topics\)/relativity/ | sort -u
# Compare against existing GLOSSARY.
grep -nE 'slug: "' lib/content/glossary.ts
```

For each `<Term>` slug not in glossary.ts, **add a forward-ref placeholder to `seed-rt-03.ts`'s GLOSSARY array** before running the seed. Pattern: `shortDefinition` says "placeholder, full treatment in §0X.Y," `description` is one paragraph explaining the term. Likely candidates this session if Wave 2 surfaces them: `gravitational-redshift` (any §06.* topic might `<Term>` reference this). Skip placeholders that turned out unreferenced.

If placeholders are added, they fold into the seed commit — single Wave 3 seed commit. If a fix-up patch is needed AFTER seed-run (rare), it gets its own `fix(rt/§05-§06)` commit.

- [ ] **Step 2: Run the seed**

```bash
pnpm exec tsx --conditions=react-server scripts/content/seed-rt-03.ts
```

Expected: "physicists: 2 inserted (Eötvös, Pound-Rebka), glossary: 10 inserted." On a clean first run + zero forward-ref placeholders. If forward-ref placeholders were added in Step 1, count goes higher.

If parse errors surface (esbuild reporting line:column), they're typically embedded backticks or unescaped quotes inside template-literal descriptions — fix in place, re-run. Lesson from EM Session 7 + RT Sessions 1+2.

- [ ] **Step 3: Run full test sweep**

```bash
pnpm tsc --noEmit
pnpm vitest run
```

Expected: clean tsc; all tests green. RT Session 2 closed at ~250 RT tests; Session 3 should add ~70–100 more (8 topics × 8–12 tests). Record vitest count in the implementation log.

- [ ] **Step 4: Build smoke**

```bash
pnpm build 2>&1 | tail -50
```

Expected: clean. The 8 new `/en/relativity/<slug>` + 8 `/he/relativity/<slug>` routes appear in the SSG output.

- [ ] **Step 5: Curl smoke (8 topic URLs + 2 physicists + 10 glossary)**

Start dev server on port 3001 (avoid stale port-3000 cache from earlier sessions per RT Sessions 1+2 lesson):

```bash
PORT=3001 pnpm dev &
sleep 5
for slug in the-barn-pole-paradox bells-spaceship-paradox gps-as-relativity precision-tests-of-sr inertial-vs-gravitational-mass einsteins-elevator gravitational-redshift gravity-as-geometry; do
  echo "=== $slug ==="
  curl -s -o /dev/null -w "%{http_code}\n" http://localhost:3001/en/relativity/$slug
done
echo "=== roland-eotvos ==="
curl -s -o /dev/null -w "%{http_code}\n" http://localhost:3001/en/physicists/roland-eotvos
echo "=== pound-rebka ==="
curl -s -o /dev/null -w "%{http_code}\n" http://localhost:3001/en/physicists/pound-rebka
for term in barn-pole-paradox bell-spaceship-paradox born-rigidity gps-correction precision-lorentz-tests equivalence-principle weak-equivalence-principle einstein-equivalence-principle eotvos-parameter mossbauer-effect; do
  echo "=== /dictionary/$term ==="
  curl -s -o /dev/null -w "%{http_code}\n" http://localhost:3001/en/dictionary/$term
done
echo "=== /en/relativity (branch hub) ==="
curl -s http://localhost:3001/en/relativity | grep -oE "FIG.[0-9]+" | sort -u
kill %1 2>/dev/null
```

Expected: all 20 routes (8 topics + 2 physicists + 10 glossary) return 200; branch hub lists FIG.01 through FIG.28 as live (with FIG.29 onward also listed as `coming-soon` placeholders).

If any 500: the most common causes per Sessions 1+2:
- (a) `<Term>` block-level → make inline.
- (b) HTML entity inside `$...$` math → use literal character.
- (c) `paragraphsToBlocks` shape mismatch in seed → re-run with correct helper.
- (d) `<Term slug="...">` referencing a topic slug instead of glossary slug → fix MDX, re-publish.

Mid-flight fixes get their own commit (e.g., `fix(rt/§05): un-escape ... in <slug>`) — same pattern as Session 1's commit 7123d24.

- [ ] **Step 6: Update spec progress**

Open `docs/superpowers/specs/2026-04-29-relativity-branch-design.md`. Update:

- Status header (line 4): `**Status:** in progress — 28/61 topics shipped (46%); §01 + §02 + §03 + §04 + §05 + §06 shipped 2026-04-30 — SR fully complete`.
- Module status table:
  - `§05 SR applications | 4 | 4 | ☑ complete`
  - `§06 Equivalence principle | 4 | 4 | ☑ complete`
  - Total row: `**Total** | **61** | **28** | **46% complete**`.
- Per-topic checklist: flip 8 boxes 21–28.

- [ ] **Step 7: MemPalace implementation log**

Write to `wing=physics, room=decisions` via the `mempalace_kg_add` MCP tool with `room=decisions`, `kind=note`:

```
File name: implementation_log_rt_session_3_sr_applications_equivalence_principle.md
```

Mirror the structure of `implementation_log_rt_session_2_spacetime_geometry_dynamics.md`. Cover:
- Wave-by-wave summary (commits, file counts, runtime, deviations).
- (a) Did the §05.3 GPS money shot land — did the orbital animation + dual-correction overlay produce the "relativity is in your pocket" click?
- (b) Did the §06.3 gravitational-redshift Pound-Rebka money shot land — did the tower + Mössbauer + observed-vs-predicted readout produce the "first laboratory test of GR" click?
- (c) Did the §06.4 gravity-as-geometry honest moment land — did the "there is no force called gravity" Callout feel earned, or did it land too didactically?
- (d) Was the §06.4 forward-link to `/relativity/manifolds-and-tangent-spaces` (coming-soon stub) handled gracefully? Did the link 404 or render the stub?
- (e) Any LaTeX gotchas? §05/§06 are math-light vs §03/§04 — were `\begin{aligned}` and `\begin{pmatrix}` still clean?
- (f) Hebrew translation policy (defer to bulk machine-translation pass after English ships, same as Sessions 1+2).
- (g) Was the Eötvös-vs-Pound-Rebka combined-vs-split decision the right call? Did §06.1 prose feel like Eötvös needed a more substantive entry, or did §06.3 prose feel like Pound and Rebka should have separate entries?
- (h) Did the slug-collision risk on `gravitational-redshift` (topic-only this session, not glossary) hold cleanly? Did any Wave 2 agent want a `<Term slug="gravitational-redshift">` and have to fall back to plain Markdown?
- (i) `SpacetimeDiagramCanvas` reuse: 2 of 4 §05 topics (§05.1 + §05.2) — did it amortize cleanly?
- (j) Was the Wave 1.5 deferral of `ManifoldCanvas` to Session 4 the right call? Or did §06.4's embedding-diagram `EmbeddedCurvatureScene` feel like it would have benefited from the primitive?
- (k) Total runtime for parallel Wave 2 dispatch (8 agents) — note any agent that took notably longer for follow-up.

- [ ] **Step 8: Two final commits**

```bash
git add scripts/content/seed-rt-03.ts # only if modified post-seed-run for forward-ref placeholders
git add lib/content/glossary.ts # if new structural entries were added during forward-ref scan
git commit -m "$(cat <<'EOF'
chore(rt/§05-§06): seed Eötvös + Pound-Rebka + 10 glossary terms into Supabase

[describe forward-ref placeholders added if any]

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"

git add docs/superpowers/specs/2026-04-29-relativity-branch-design.md docs/superpowers/plans/2026-04-30-relativity-session-3-sr-applications-equivalence-principle.md
git commit -m "$(cat <<'EOF'
docs(rt/§05-§06): mark SR applications + equivalence principle complete — 28/61 (46%) — SR fully done

28 of 61 topics shipped. SR is fully complete. Next session: §07
(curved spacetime + tensor calculus, 5 topics, the densest math of the
branch — strongly consider Wave 1.5 ManifoldCanvas primitive).

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

- [ ] **Step 9: Report back**

Report to Roman:
- 8 §05+§06 topics live at `/en/relativity/<slug>` (200 OK on all).
- Eötvös + Pound-Rebka + 10 glossary terms in Supabase.
- `SpacetimeDiagramCanvas` reused unchanged in §05.1 + §05.2.
- §06.4 forward-links to `/relativity/manifolds-and-tangent-spaces` (§07.1 coming-soon stub) cleanly.
- Spec progress: 28/61 (46%); **SR fully complete after Session 3.**
- Total commits this session: target 12 (1 Wave 0 + 1 Wave 1 + 8 Wave 2.5 + 1 Wave 3 seed + 1 Wave 3 spec) — give-or-take 1 for forward-ref placeholders or mid-flight LaTeX fix.
- MemPalace log filed.
- Surprises / deviations.
- Recommended for Session 4: §07 + §08 (tensor calculus + EFE, 10 topics — the densest math of the branch). **Strongly consider Wave 1.5 ManifoldCanvas primitive.**

---

## Definition of done

- [ ] 8 §05+§06 topic statuses flipped from `coming-soon` → `live` in `lib/content/branches.ts`.
- [ ] No types.ts extension this session (decision documented).
- [ ] Per-topic vitest suites green for all 8 §05+§06 topics.
- [ ] All 8 §05+§06 topic pages render `200` at `/en/relativity/<slug>`.
- [ ] Branch hub `/en/relativity` lists FIG.01 through FIG.28 as live.
- [ ] Roland Eötvös + Pound-Rebka + 10 net new glossary entries live in Supabase via seed-rt-03.
- [ ] §06.4 forward-link to `/relativity/manifolds-and-tangent-spaces` (§07.1 coming-soon stub) renders without 404.
- [ ] `pnpm build` clean.
- [ ] `pnpm tsc --noEmit` clean.
- [ ] `pnpm vitest run` green.
- [ ] Spec progress table updated to 28/61 (46%) — SR fully complete.
- [ ] MemPalace implementation log filed at `wing=physics, room=decisions, file=implementation_log_rt_session_3_sr_applications_equivalence_principle.md`.
- [ ] Total commits this session: 12 ± 1.

## Risk notes

- **§05.3 GPS density** — three corrections, two clocks, the orbit, and the "11 km/day drift" gauge in one topic. Careful equation sequencing; one `<EquationBlock>` per formula. The money shot must land — don't undersell.
- **§06.3 Pound-Rebka money shot** — the §06 cornerstone. The tower-cross-section + Mössbauer-resonance + predicted-vs-observed bar chart is the most pedagogically loaded scene of the session. Get the visual right; the prose is downstream of the visual.
- **§06.4 honest-moment voice** — don't soften. The reader should feel: there is no force called gravity. The Callout should produce a "huh — yeah, of course" reaction, then the forward-link to §07 sets the next session as a natural continuation. If a Wave 2 agent over-academicizes, request a tone revision before commit.
- **§06.4 forward-link to §07.1** — `/relativity/manifolds-and-tangent-spaces` is `coming-soon`. The link should NOT 404 — it should render the topic stub page (the standard Next.js behavior for coming-soon entries). If it does 404 in the curl smoke, the routing layer needs investigation; it's a bug in the branch hub stub generator, not this session's content. Flag and follow up; don't block on it.
- **Slug collision: `gravitational-redshift` topic vs (potentially) glossary** — coexist cleanly per Sessions 1+2's `time-dilation` / `four-momentum` precedent. **Do NOT add `-term` suffix.** This session does NOT ship a `gravitational-redshift` glossary entry; if a Wave 2 agent's `<Term>` use surfaces it, Wave 3 forward-ref scan adds a brief alias entry.
- **Forward-refs to §07** — `/relativity/manifolds-and-tangent-spaces`, `/relativity/the-metric-tensor`, `/relativity/geodesics`, `/relativity/christoffels-and-parallel-transport`. Treat as plain Markdown links to `coming-soon` stubs; do not author placeholder topics. `<Term>` for §07 glossary slugs (`manifold`, `metric-tensor`, etc.) WILL fail because §07 glossary doesn't ship until Session 4 — use plain prose.
- **EM↔RT cross-refs** — none new this session. §05/§06 are SR-internal + GR-bridge; the EM-§11 crosslinks are upstream (§03.4 + §04.1) already shipped.
- **`paragraphsToBlocks` helper** — copy seed-rt-02 verbatim. Don't paraphrase. Lesson from Sessions 1+2.
- **Stale dev server cache on port 3000** — start curl-smoke server on port 3001 per RT Sessions 1+2 lesson.
- **Eötvös-vs-Pound-Rebka split-vs-combined** — default Eötvös solo (he was a single individual with a 30-year experimental program); Pound-Rebka combined (their 1960 paper is co-authored, and the experiment is universally cited as "Pound-Rebka"). If a Wave 2 agent flags Pound or Rebka deserving separate entries, follow up; do not split this session.
- **HTML entity rejection inside KaTeX `$...$` math** — Sessions 1+2 lesson; use literal `>`, `<`, `&`. The JSX-tag risk applies only to bare prose, NOT to math context.
- **`<Term>` and `<PhysicistLink>` MUST be inline** in a paragraph, never block-level standalone JSX. Sessions 1+2 lesson.
- **Pre-existing dirty files (`components/layout/mobile-nav.tsx`)** — do NOT touch unless task-relevant. Per prompt.md gotcha list.
- **Branch is main; commit directly per `feedback_execution_style.md`. Token-saving variant of subagent-driven-development — no per-task review.**

## Spec self-review — done

**Coverage:** every §05 + §06 topic in spec maps to a Wave 2 task (Tasks 3–10). Status flips handled in Wave 0 Task 1 Step 1. Eötvös + Pound-Rebka + 10 glossary terms handled in Wave 1 Task 2. §05 money shot (gps-as-relativity) flagged in Task 5; §06 money shot (gravitational-redshift) flagged in Task 9; §06 honest moment + GR bridge (gravity-as-geometry) flagged in Task 10. Voice reminders threaded through Wave 2 shared instructions. Cross-refs to RT Sessions 1+2 explicit. Forward-link to §07.1 coming-soon stub explicit in Task 10. Slug-collision watch (topic `gravitational-redshift` vs potential future glossary slug) called out in Wave 1 Step 4 + Risk notes. New physicists (Eötvös solo, Pound-Rebka combined) handled in Wave 1 Step 2. Spec-progress update + MemPalace log handled in Wave 3.

**Type consistency:** No types.ts extension this session — decision documented. Per-topic physics libs (`barn-pole.ts`, `bell-spaceship.ts`, `gps-corrections.ts`, `precision-tests.ts`, `equivalence-mass.ts`, `elevator.ts`, `gravitational-redshift.ts`, `gravity-as-geometry.ts`) each import `gamma`, `boostX`, `applyMatrix`, `MinkowskiPoint`, `Vec4`, `LorentzMatrix` from `@/lib/physics/relativity/types` (all carry forward from Sessions 1+2). New constants `g_SI` and `G_SI` are imported from `@/lib/physics/constants` for §05.3 + §06.* gravity-related formulas. All consistent.

**Placeholder scan:** none. Every step has either complete code, a complete prose outline with section word counts, or a concrete shell command with expected output.

**Plan complete.**
