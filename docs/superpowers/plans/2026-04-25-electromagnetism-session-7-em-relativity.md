# Electromagnetism Session 7 — §11 EM & Relativity

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (token-saving variant — parallel waves, no per-task review) to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking. Feedback style: per wing=physics `feedback_execution_style.md`.

**Goal:** Ship 5 topics — §11 EM & Relativity (FIG.58–62): `charge-invariance`, `e-and-b-under-lorentz`, `the-electromagnetic-field-tensor`, `magnetism-as-relativistic-electrostatics`, `four-potential-and-em-lagrangian`. After Session 7 the EM branch progress moves from 57/66 (86%) to 62/66 (94%). Only §12 Foundations (4) remains. §11 is the **emotional apex of the entire branch**: §11.4 is the reveal the branch was built toward — two parallel currents in the lab frame (magnetic attraction) boosted into the electron rest frame (length-contracted lattice → net + charge density → Coulomb attraction). Same force, different name. §11.5 closes the module on the cleanest sentence in physics: L = −¼F_{μν}F^{μν} − A_μJ^μ. Six terms in the field-tensor square, one source-coupling term, and the entire edifice of classical electromagnetism falls out via Euler-Lagrange.

**Architecture:** Four waves mirroring the Session 6 precedent. **Pre-flight (optional, strongly recommended):** ship the 15-minute `content:publish` CLI hash-source patch so parser-only fixes self-refresh — §11.3 field-tensor is the densest LaTeX in the branch and a mid-session parser tweak might be needed. **Wave 1** (serial, 1 agent) scaffolds the data layer (5 topics, 1–2 new physicists, ~11 glossary terms after dedup, new file `lib/physics/electromagnetism/relativity.ts` for shared four-vector / field-tensor types). **Wave 1.5** is **NOT** built — 5 topics is below the CircuitCanvas (7) / RayTraceCanvas (10) amortization threshold and Session 6 (6 topics) shipped cleanly without one. The two boost-visualisation topics (§11.2 + §11.4) share a small helper module (`lib/physics/electromagnetism/lorentz-boost.ts`, created in Wave 1) instead of a full Canvas primitive. **Wave 2** dispatches 5 parallel topic agents under the Session 1–6 NO-registry-touch / NO-publish / NO-commit contract. **Wave 2.5** serially merges registry → publishes → commits per-topic. **Wave 3** authors the seed script (`seed-em-07.ts`), runs verification, updates the spec to 62/66 (94%), and files the implementation log to MemPalace.

**Tech Stack:** Next.js 15 (App Router), React 19, TypeScript strict, Tailwind v4, MDX (`@next/mdx` + rehype-katex), Canvas 2D + `requestAnimationFrame`, Supabase `content_entries`, Vitest, `pnpm content:publish` CLI, `tsx --conditions=react-server` for seed scripts.

**Expected commit total:** **9 baseline** — 1 Wave 1 scaffold + 5 Wave 2.5 per-topic + 1 Wave 3 seed + 1 Wave 3 spec-update + 1 Wave 3 forward-ref placeholder follow-up if needed. **+1** if the CLI hash-source patch ships pre-flight (10 total). **+1** if a parser-only fix for §11.3 lands mid-session (11 total).

---

## Vision and voice reminders

**§11 voice — MAGNETISM IS ELECTRICITY SEEN FROM A MOVING TRAIN.** The entire branch was building toward this. Every E-field-vs-B-field distinction the branch drew through §03 → §07 → §08 was a Faustian bargain — pedagogically necessary but ontologically wrong. There is no second force; magnetism is the relativistic correction to electrostatics. §11.1 sets charge invariance as the one quantity every observer must agree on. §11.2 derives the E↔B mixing under boost. §11.3 packages the six field components into one antisymmetric 4×4 tensor F^{μν}, with the dual *F^{μν} as the structure monopoles would source if they existed. §11.4 IS THE MONEY SHOT. §11.5 closes the loop — the whole branch is one Lagrangian, conserving one quantity (charge) via Noether. Write §11 as the historical inevitability it is: charge invariance + length contraction + Maxwell 1865 vector potential + Minkowski 1908 4D geometry = one tensor F^{μν} containing both fields, sourced by J^μ, derived from L = −¼F_{μν}F^{μν} − A_μJ^μ.

**Money shot to nail — §11.4 `magnetism-as-relativistic-electrostatics`.** Two-panel synchronized animation. **Left panel (lab frame):** two parallel wires carrying current in the same direction. Magenta + ions in a static lattice, cyan electrons drifting at v_drift, wires net-neutral, magnetic field B between them (cyan field arrows). Force F_mag = (μ₀ I₁ I₂ / 2π d) × L, attractive. **Right panel (boosted to electron rest frame):** cyan electrons now stationary; magenta lattice now drifting at −v in the opposite direction. Length contraction: lattice spacing decreases by γ = 1/√(1−v²/c²); the cyan dot count per unit length stays the same but magenta dot count per unit length INCREASES, producing net + charge density. Coulomb attraction E-field (magenta arrows). Force F_elec equals F_mag exactly. **Same force, different name.** Slider: drift velocity v on a logarithmic visual mapping (real drift velocities are mm/s but the relativistic effect at any v works the same — say so honestly in the prose). HUD shows force calculation in both panels. **The "click" moment is when the lattice spacing visibly contracts on the right and the + charge density appears.** That is the moment the branch closes.

**Closing sentence to nail — §11.5 `four-potential-and-em-lagrangian`.** L = −¼F_{μν}F^{μν} − A_μJ^μ. Six terms in the field-tensor square, one source-coupling term. Apply Euler-Lagrange to A^μ — out comes Maxwell's equations. Apply Noether's theorem to gauge symmetry — out comes charge conservation. Write it as the climactic moment of the entire branch: every §01 through §10 has been an unfolding of this single Lagrangian. Voice: "Electromagnetism rewritten as a principle of least action." 1300–1500 words. Don't rush the Euler-Lagrange step; let it land. Include the Noether → charge conservation gesture (full treatment is §12.1, but the §11.5 → §12.1 bridge is one of the cleanest narrative arcs in the branch).

**Calculus policy — unchanged.** Every topic that uses ∇, ∂_μ, F^{μν}, ∮, four-vector index notation must explain the symbol in local context in plain words before the compact form. Side notes (`Callout math`) carry the denser tensor derivations. Redundancy is a feature — every topic remains standalone.

---

## File structure and registries

**Files created this session:**

Physics libraries (5 new — one per topic — plus 1 shared types/helpers file + 1 boost helper):

- `lib/physics/electromagnetism/relativity.ts` (**NEW shared file, created in Wave 1**) — four-vector / tensor types and core boost transform.
  - `export type Vec4 = readonly [number, number, number, number];`
  - `export type FourVector = Vec4;` (semantic alias for x^μ = (ct, x, y, z))
  - `export type FourPotential = Vec4;` (A^μ = (φ/c, A_x, A_y, A_z))
  - `export type FourCurrent = Vec4;` (J^μ = (cρ, J_x, J_y, J_z))
  - `export type FieldTensor = readonly [Vec4, Vec4, Vec4, Vec4];` (4×4, antisymmetric)
  - `export const MINKOWSKI = [[1,0,0,0],[0,-1,0,0],[0,0,-1,0],[0,0,0,-1]] as const;` (mostly-minus signature, Griffiths convention)
  - `export function gamma(beta: number): number { return 1 / Math.sqrt(1 - beta * beta); }`
  - `export function lorentzBoostMatrix(betaX: number): readonly Vec4[]` (boost along +x; returns 4×4 row-major)
  - `export function buildFieldTensor(E: Vec3, B: Vec3): FieldTensor` (constructs antisymmetric F^{μν} from E, B in SI; F^{0i} = E_i/c, F^{ij} = -ε_{ijk}B_k)
  - `export function transformFields(E: Vec3, B: Vec3, betaX: number): { E: Vec3; B: Vec3 }` (closed-form §11.2 result; reused by §11.4 visualisation)
  - `export function dualTensor(F: FieldTensor): FieldTensor` (Hodge dual *F^{μν} that swaps E ↔ cB)

- `lib/physics/electromagnetism/lorentz-boost.ts` (**NEW shared helper, created in Wave 1**) — geometry helpers used by §11.2 and §11.4 scenes.
  - `export function lengthContract(restLength: number, beta: number): number` (returns L₀/γ)
  - `export function boostLineDensity(restDensity: number, beta: number, sign: 1 | -1): number` (Purcell two-wire derivation: ρ' = γρ on lattice that moves at ±β in observer's frame)
  - `export function netChargeDensityTwoWire(beta: number, n0: number): number` (returns the asymmetry ρ_+ − ρ_− between contracted lattice and rest-frame electrons in §11.4's two-panel setup; closed form n₀(γ − 1/γ))

- `lib/physics/electromagnetism/charge-invariance.ts` (§11.1 — invariance proof setup; flux-of-J^μ closed-form; Weber-Kohlrausch unit-ratio reproduction √(1/μ₀ε₀) = c)
- `lib/physics/electromagnetism/em-lorentz-transform.ts` (§11.2 — closed-form Lorentz transform of E and B under boost along +x; invariants E·B and E²−c²B²; helpers re-exported from `relativity.ts` to avoid duplication)
- `lib/physics/electromagnetism/field-tensor.ts` (§11.3 — F^{μν} construction, antisymmetry assertion, ∂_μ F^{μν} = μ₀ J^ν → recovers two of Maxwell's equations; ∂_μ *F^{μν} = 0 → recovers the other two; helpers re-exported from `relativity.ts`)
- `lib/physics/electromagnetism/relativistic-magnetism.ts` (§11.4 — Purcell two-wire derivation; ρ_lab = 0 → ρ_electron-frame = γn₀(β² ratio); F_mag/F_elec ratio = β²/(1−β²); helpers re-exported from `lorentz-boost.ts`)
- `lib/physics/electromagnetism/four-potential.ts` (§11.5 — A^μ = (φ/c, **A**); Lorenz gauge ∂_μA^μ = 0; EM Lagrangian density L = −¼F_{μν}F^{μν} − A_μJ^μ; Euler-Lagrange δL/δA_ν → ∂_μ F^{μν} = μ₀ J^ν)

Topic pages (5 per-topic directories, each with `page.tsx` + `content.en.mdx`):
- `app/[locale]/(topics)/electromagnetism/charge-invariance/{page.tsx,content.en.mdx}`
- `app/[locale]/(topics)/electromagnetism/e-and-b-under-lorentz/{page.tsx,content.en.mdx}`
- `app/[locale]/(topics)/electromagnetism/the-electromagnetic-field-tensor/{page.tsx,content.en.mdx}`
- `app/[locale]/(topics)/electromagnetism/magnetism-as-relativistic-electrostatics/{page.tsx,content.en.mdx}`
- `app/[locale]/(topics)/electromagnetism/four-potential-and-em-lagrangian/{page.tsx,content.en.mdx}`

Scene components (flat files in `components/physics/` — 3 per topic, 15 total — kebab-case):
- §11.1 `charge-invariance`: `boosted-charge-counting-scene.tsx`, `weber-kohlrausch-c-scene.tsx`, `four-current-flux-scene.tsx`
- §11.2 `e-and-b-under-lorentz`: `boost-mixing-e-b-scene.tsx`, `lorentz-invariants-scene.tsx`, `pure-e-becomes-eb-scene.tsx`
- §11.3 `the-electromagnetic-field-tensor`: `field-tensor-grid-scene.tsx`, `dual-tensor-swap-scene.tsx`, `tensor-recovers-maxwell-scene.tsx`
- §11.4 `magnetism-as-relativistic-electrostatics` (**MONEY SHOT — two-panel synchronized**): `two-wire-lab-frame-scene.tsx`, `two-wire-electron-frame-scene.tsx`, `force-equivalence-readout-scene.tsx`
- §11.5 `four-potential-and-em-lagrangian`: `four-potential-components-scene.tsx`, `lagrangian-action-scene.tsx`, `noether-charge-conservation-scene.tsx`

Test files (5 per-topic + 2 helper modules = 7 new):
- `tests/physics/electromagnetism/relativity.test.ts` (Wave 1 scaffolds basic γ, boost, tensor build/dual/transform)
- `tests/physics/electromagnetism/lorentz-boost.test.ts` (Wave 1)
- `tests/physics/electromagnetism/charge-invariance.test.ts`
- `tests/physics/electromagnetism/em-lorentz-transform.test.ts`
- `tests/physics/electromagnetism/field-tensor.test.ts`
- `tests/physics/electromagnetism/relativistic-magnetism.test.ts`
- `tests/physics/electromagnetism/four-potential.test.ts`

Seed script (Wave 3):
- `scripts/content/seed-em-07.ts` — mirrors `seed-em-06.ts` exactly.

**Files modified this session:**
- `lib/content/branches.ts` — append 5 `Topic` entries (FIG.58–62) to `ELECTROMAGNETISM_TOPICS` immediately before its closing `];` at line 866. `ELECTROMAGNETISM_MODULES` already contains `{ slug: "em-relativity", title: "EM and Relativity", index: 11 }` (verify in Wave 1 Step 1; if module slug differs, use the existing one — DO NOT change module structure).
- `lib/content/physicists.ts` — append **1 new** physicist (Hermann Minkowski) and **optionally** a 2nd (Wilhelm Weber, decide at author time based on §11.1 narrative density). Append §11 entries to `relatedTopics` arrays of: `albert-einstein` (line 356, all 5 topics — entire module is downstream of his 1905 SR), `hendrik-antoon-lorentz` (line 825, §11.2 + §11.4), `james-clerk-maxwell` (line 922, §11.5), `edward-mills-purcell` (line 632, §11.4 — canonical pedagogical source), `joseph-louis-lagrange` (line 171, §11.5), `emmy-noether` (line 326, §11.5).
- `lib/content/glossary.ts` — append **~11 new** structural entries (after dedup against existing `lorenz-gauge`, `coulomb-gauge`, `noethers-theorem`, `principle-of-least-action`, `lorentz-force`, `gauge-transformation`).
- `lib/physics/constants.ts` — **no new constants needed** (γ, β, η are derived from `SPEED_OF_LIGHT`).
- `lib/content/simulation-registry.ts` — append 15 new scene lazy-import entries grouped by topic with `// EM §11 — <slug>` section comments. **Inserted by Wave 2.5 orchestrator only.**

**Files NOT modified:**
- `lib/content/branches.ts` status flip — EM branch has been `live` since Session 1.
- `components/physics/visualization-registry.tsx` — glossary-tile preview only; no §11 glossary term needs a tile preview this session.
- `components/physics/circuit-canvas/*`, `components/physics/ray-trace-canvas/*` — §11 is field-level / frame-level; no primitive edits.

**Glossary dedup table (verified by grep at plan time):**

| Slug | Status | Action |
|---|---|---|
| `lorenz-gauge` | EXISTS (Session 4 §07.3) | Append §11.5 to `relatedTopics` only — DO NOT re-seed |
| `coulomb-gauge` | EXISTS (Session 4 §07.3) | Skip — §11 doesn't reference |
| `gauge-transformation` | EXISTS (Session 2 §03 + Session 4 §07) | Append §11.5 to `relatedTopics` |
| `gauge-invariance` | EXISTS (Session 4 forward-ref placeholder) | **Promote** to full description in seed-em-07 (§11.5 cross-ref + §12.1 forward-link) — overwrite via source_hash idempotency |
| `noethers-theorem` | EXISTS (CM seed) | Append §11.5 to `relatedTopics` |
| `principle-of-least-action` | EXISTS (CM seed) | Append §11.5 to `relatedTopics` |
| `lorentz-force` | EXISTS (Session 2 §03.1) | No change (different concept than §11.2 transformation) |
| `electromagnetic-field` | EXISTS (Session 4 forward-ref placeholder) | Optionally promote in seed-em-07 with §11.3 tensor form mention |

---

## Self-contained context — what agents need to know

**Content-publish CLI behaviour (verified by Read of `scripts/content/publish.ts:87,102`):**
- Command: `pnpm content:publish --only electromagnetism/<slug>` — inserts or updates exactly one row in Supabase `content_entries`, keyed by `(kind="topic", slug="electromagnetism/<slug>", locale="en")`.
- `source_hash = sha256(RAW MDX source string)` (line 87: `const hash = sha256(source);`). Idempotent guard at line 102: `if (!force && existing?.source_hash === hash) return`.
- **Implication:** parser-only fixes that don't change MDX source require `--force`. Pre-flight CLI patch (see Wave 0 below) is **strongly recommended** for §11.3 field-tensor's heavy LaTeX. If the patch is skipped, document `--force` usage in known gotchas and use it whenever a parse-mdx tweak is needed mid-session.
- Zero rows inserted/updated on a run = MDX parse error silently swallowed. If a publish reports `0 / 0`, open `content.en.mdx` and check for the four MDX gotchas listed below.

**Seed script behaviour (`seed-em-07.ts`):** mirrors `seed-em-06.ts` exactly. Run with `pnpm exec tsx --conditions=react-server scripts/content/seed-em-07.ts`. Same `PhysicistSeed` / `GlossarySeed` interfaces, same `parseMajorWork` / `paragraphsToBlocks` helpers, same `main()` upsert loop with `source_hash = sha256(JSON.stringify({title, subtitle, blocks, meta}))`. Per-entry discipline: bios ~300–400 words (3 paragraphs — schooling, central work, legacy). Glossary descriptions ~150–250 words (1–2 paragraphs).

**Page.tsx canonical shape (every new topic — identical to Session 6, only `const SLUG` changes):**
```tsx
import { notFound } from "next/navigation";
import { setRequestLocale } from "next-intl/server";
import { locales } from "@/i18n/config";
import { getContentEntry } from "@/lib/content/fetch";
import { ContentBlocks } from "@/components/content/content-blocks";
import { TopicHeader } from "@/components/layout/topic-header";
import { TopicPageLayout } from "@/components/layout/topic-page-layout";
import type { AsideLink } from "@/components/layout/aside-links";

const SLUG = "electromagnetism/<slug>";

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

export default async function Page({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const entry = await getContentEntry("topic", SLUG, locale);
  if (!entry) notFound();
  const aside = Array.isArray(entry.meta.aside) ? (entry.meta.aside as AsideLink[]) : [];
  const eyebrow = typeof entry.meta.eyebrow === "string" ? entry.meta.eyebrow : "";
  return (
    <TopicPageLayout aside={aside}>
      <TopicHeader eyebrow={eyebrow} title={entry.title} subtitle={entry.subtitle ?? ""} />
      {entry.localeFallback ? (
        <p className="mt-2 font-mono text-xs opacity-60">Translation pending. Showing English.</p>
      ) : null}
      <ContentBlocks blocks={entry.blocks} />
    </TopicPageLayout>
  );
}
```

**MDX content canonical shape:** same as Session 6. Word count target 1100–1400 baseline; **1500–1700 for §11.4 (money shot) and §11.5 (Lagrangian closer)**.

**Scene component canonical shape:** `"use client"`, named export ending `Scene`, Canvas 2D + `useAnimationFrame` from `@/lib/animation/use-animation-frame`, `useThemeColors()` from `@/lib/hooks/use-theme-colors`, palette unchanged from Sessions 1–6:
- magenta `rgba(255,106,222,…)` — + charge / E-field
- cyan `rgba(120,220,255,…)` — − charge / B-field / wavefronts
- amber `rgba(255,180,80,…)` — radiated light / ray paths
- green-cyan `rgba(140,240,200,…)` — induced current / electron drift
- lilac `rgba(200,160,255,…)` — field-energy density / displacement current
- pale-blue `rgba(140,200,255,…)` — outgoing wavefronts
- orange-red `rgba(255,140,80,…)` — bremsstrahlung / synchrotron beams (Session 6 addition)
- **NEW this session, suggested:** `rgba(180,170,200,…)` for **boost-frame outlines / rest-frame ghost guides** (faint dashed strokes that show the "other frame" while not the active one — useful for §11.4's two-panel setup). Optional; agents may use a desaturated cyan instead.
- No external 3D libraries, no WebGL, Canvas 2D only.

**Parallel-safety contract (Wave 2 — enforced for all 5 agents):**
1. **DO NOT** modify `lib/content/simulation-registry.ts`. Orchestrator merges 5 handoff blocks serially in Wave 2.5.
2. **DO NOT** modify `components/physics/visualization-registry.tsx`. Not needed.
3. **DO NOT** modify `lib/content/branches.ts`, `lib/content/physicists.ts`, `lib/content/glossary.ts`, `lib/physics/constants.ts` — Wave 1 already scaffolded those.
4. **DO NOT** modify `lib/physics/electromagnetism/relativity.ts` or `lib/physics/electromagnetism/lorentz-boost.ts` — Wave 1 owns these. Import the canonical types/helpers from them.
5. **DO NOT** run `pnpm content:publish`. Orchestrator publishes in Wave 2.5.
6. **DO NOT** `git commit`. Orchestrator commits per-topic in Wave 2.5.
7. **TYPES CONTRACT (carried from Session 2 Vec3 race):** import canonical types from the home file:
   - 2D: `import type { Vec2 } from "@/lib/physics/coulomb"`
   - 3D: `import type { Vec3 } from "@/lib/physics/electromagnetism/lorentz"`
   - 4D / tensor: `import { type Vec4, type FourVector, type FourPotential, type FourCurrent, type FieldTensor, gamma, transformFields, buildFieldTensor, dualTensor, MINKOWSKI } from "@/lib/physics/electromagnetism/relativity"`
   - Boost helpers: `import { lengthContract, boostLineDensity, netChargeDensityTwoWire } from "@/lib/physics/electromagnetism/lorentz-boost"`
   If a Wave 2 agent finds a missing helper, define a local fallback with a `// TODO: promote to relativity.ts` comment; orchestrator reconciles in Wave 2.5.
8. **MDX GOTCHAS CONTRACT (real Session 5 + Session 6 regressions — do not repeat, plus NEW §11-specific tensor risks):**
   - (i) **No nested JSX inside string JSX attributes.** `<SceneCard title="Foo <PhysicistLink slug='bar'/>" />` breaks quoting. Put human and concept links in body prose only.
   - (ii) **No multi-line `$$…$$` math blocks.** Micromark chokes on `$$ a \\qquad<newline> b $$`. Collapse to single-line.
   - (iii) **No bare `<` or `>` in prose.** `"~4% to <0.5%"` parses as a JSX tag opener. Reword or escape as `&lt;` / `&gt;`.
   - (iv) **NEW Session 7 risk: tensor-index escape rules.** Inside `<EquationBlock tex={`…`}>` template literals, every backslash must be doubled: `F^{\\mu\\nu}`, `\\partial_\\mu A^\\mu`, `\\Lambda^\\mu{}_\\nu`, `F_{\\mu\\nu} = \\partial_\\mu A_\\nu - \\partial_\\nu A_\\mu`. The **field-tensor topic agent (§11.3) MUST write a known-good test equation first** (`F_{\\mu\\nu} = \\partial_\\mu A_\\nu - \\partial_\\nu A_\\mu`), publish via `pnpm content:publish --only electromagnetism/the-electromagnetic-field-tensor`, verify rendered KaTeX in the browser, then continue authoring all 5 sections. This catches escape issues before they pile up. **IMPORTANT:** the §11.3 publish is the highest-risk publish of the session. Wave 2.5 should serially publish §11.3 before §11.4 and §11.5 land — if §11.3 reveals a parser issue, fix it before the high-risk neighbours go through.
   - (v) **NEW slug-collision watch:** `lorenz-gauge` (Ludvig Lorenz, Danish, 1867 gauge condition) vs `lorentz-transformation` (Hendrik Lorentz, Dutch, 1895 boost). Most-misspelled pair of names in physics. Triple-check spellings in MDX, glossary, physicist references. The publish CLI will not catch it.
9. **RETURN HANDOFF BLOCK** to orchestrator at end of work (matches Session 6 contract):
   - `registry`: exact multi-line text block for `SIMULATION_REGISTRY` (section comment `// EM §11 — <slug>` + 3 lazy-import entries).
   - `publishArg`: `electromagnetism/<slug>` literal.
   - `commitSubject`: single line matching `feat(em/§11): <slug> — <tagline>`.
   - `forwardRefs`: `[{slug, kind}]` array of references pointing at slugs without a `content_entries` row.
   - `wordCount`: prose word count for content.en.mdx (excluding frontmatter imports).

**Forward-reference placeholder pattern (Wave 3):** Pattern from `seed-em-04.ts:637–665`. Each placeholder `GlossarySeed` has `shortDefinition` ending "Full treatment in §0X" and `description` starting "This is a placeholder entry…" with a `// FORWARD-REF: full treatment in §0X` code comment above it. **Session 7 likely surfaces 1–3 §12 placeholders:**
- `aharonov-bohm-effect` (§12.2) — referenced from §11.3 field-tensor or §11.5 four-potential as the "potential matters even where the field is zero" forward-ref.
- `gauge-theory-origins` (§12.1) — referenced from §11.5 four-potential's gauge-freedom recap.
- `magnetic-monopole` (§12.3) — referenced from §11.3 field-tensor's dual-tensor *F^{μν} discussion ("if monopoles existed, the dual would source them").

Scan all 5 MDX files at Wave 3 start; collect `forwardRefs` from Wave 2 handoff blocks. Add placeholders for any unresolved slug.

---

## Task decomposition

### Wave 0 — Pre-flight: `content:publish` CLI hash-source patch (OPTIONAL but recommended)

**Purpose:** Change `source_hash` from `sha256(rawMdxSource)` to `sha256(JSON.stringify({title, subtitle, blocks, aside_blocks, meta}))` so parser-only fixes self-refresh. §11.3 field-tensor is the densest LaTeX in the branch; pre-patching removes a potential mid-session blocker. **15-minute task.**

**Decision rule:** ship if §11.3 author-time reveals a parser issue; alternatively ship now as a quality-of-life improvement. If skipped, document `--force` usage in plan known-gotchas section as the workaround.

**Files:** `scripts/content/publish.ts`

- [ ] **Step 1:** Read `scripts/content/publish.ts` lines 80–130 to see current hash logic.
- [ ] **Step 2:** Replace `const hash = sha256(source);` (line 87) with `const hash = sha256(JSON.stringify({ title, subtitle, blocks, aside_blocks, meta }));`. Variables `title`, `subtitle`, `blocks`, `aside_blocks`, `meta` are already destructured in scope — verify by reading lines 70–90 first.
- [ ] **Step 3:** Run a local sanity check: `pnpm content:publish --only electromagnetism/the-poynting-vector` (idempotent topic from §07). Expected: `0 inserted / 0 updated` (still idempotent because parsed output is byte-identical). Then artificially break and restore a parsed-output element via parse-mdx — second run should show `0 / 1` then `0 / 0`. If the experiment fails, revert and use `--force` instead.
- [ ] **Step 4:** Commit: `chore(content): hash parsed payload, not raw MDX, in content:publish` (single feat-adjacent commit).

**Skip rule:** if §11.3 author-time goes smoothly with no parser issues, the patch isn't needed and `--force` is sufficient.

---

### Wave 1 — Data-layer scaffold

**Purpose:** Add 5 new `Topic` entries, 1–2 new structural physicist entries, ~11 new structural glossary entries (after dedup), and the new shared `relativity.ts` + `lorentz-boost.ts` files. TS arrays are structural metadata only; Supabase prose seeding happens in Wave 3.

**Serial, 1 subagent. 1 commit.**

#### Task 1.1: Append 5 topics to ELECTROMAGNETISM_TOPICS

**File:** `lib/content/branches.ts` — insert immediately before the `];` at line 866.

- [ ] **Step 1:** Run `grep -n "waveguides-and-fibers\|radiation-reaction\|^];" lib/content/branches.ts | head -10` to locate the closing `];` of `ELECTROMAGNETISM_TOPICS` (expected near line 866). Insert before it.
- [ ] **Step 2:** Verify `ELECTROMAGNETISM_MODULES` (line 337–350) contains an entry for §11. Run `grep -n "em-relativity\|relativity\|index: 11" lib/content/branches.ts | head -5`. If no §11 module entry exists, **stop and ask** — `ELECTROMAGNETISM_MODULES` should already contain all 12 modules from Session 1. If it exists with a different slug than `em-relativity`, use that slug verbatim in the `module:` field below.
- [ ] **Step 3:** Append the 5 §11 entries:

```ts
  {
    slug: "charge-invariance",
    title: "CHARGE IS INVARIANT",
    eyebrow: "FIG.58 · EM AND RELATIVITY",
    subtitle: "The one quantity every observer must agree on.",
    readingMinutes: 10,
    status: "live",
    module: "em-relativity",
  },
  {
    slug: "e-and-b-under-lorentz",
    title: "E AND B UNDER A LORENTZ BOOST",
    eyebrow: "FIG.59 · EM AND RELATIVITY",
    subtitle: "What looks like a magnet to you looks like an electric field to someone moving past.",
    readingMinutes: 13,
    status: "live",
    module: "em-relativity",
  },
  {
    slug: "the-electromagnetic-field-tensor",
    title: "THE ELECTROMAGNETIC FIELD TENSOR",
    eyebrow: "FIG.60 · EM AND RELATIVITY",
    subtitle: "Six numbers, one object, the full relativistic story.",
    readingMinutes: 13,
    status: "live",
    module: "em-relativity",
  },
  {
    slug: "magnetism-as-relativistic-electrostatics",
    title: "MAGNETISM AS RELATIVISTIC ELECTROSTATICS",
    eyebrow: "FIG.61 · EM AND RELATIVITY",
    subtitle: "The reveal: there is no second force.",
    readingMinutes: 14,
    status: "live",
    module: "em-relativity",
  },
  {
    slug: "four-potential-and-em-lagrangian",
    title: "THE FOUR-POTENTIAL AND EM LAGRANGIAN",
    eyebrow: "FIG.62 · EM AND RELATIVITY",
    subtitle: "Electromagnetism rewritten as a principle of least action.",
    readingMinutes: 13,
    status: "live",
    module: "em-relativity",
  },
```

- [ ] **Step 4:** Run `pnpm tsc --noEmit` — expect clean (the existing `Topic` type accepts all these fields; if `module` field requires a literal-union type and `em-relativity` is missing, add it to the union per the existing convention).

#### Task 1.2: Append 1–2 physicists to PHYSICISTS

**File:** `lib/content/physicists.ts` — insert immediately before the `];` at line 1035, then update `relatedTopics` of 6 existing physicists.

- [ ] **Step 1:** Verify Minkowski not already present: `grep -n "minkowski" lib/content/physicists.ts` — expect 0 hits.
- [ ] **Step 2:** Append the new entry (Minkowski is **definite**; Weber is **optional** — decide at author time based on §11.1 narrative density. If §11.1 prose hooks the Weber-Kohlrausch story, append Weber as well; otherwise skip and use plain-text mention.):

```ts
  {
    slug: "hermann-minkowski",
    name: "Hermann Minkowski",
    shortName: "Minkowski",
    born: "1864",
    died: "1909",
    nationality: "German",
    image: storageUrl("physicists/hermann-minkowski.webp"),
    relatedTopics: [
      { branchSlug: "electromagnetism", topicSlug: "the-electromagnetic-field-tensor" },
      { branchSlug: "electromagnetism", topicSlug: "e-and-b-under-lorentz" },
      { branchSlug: "electromagnetism", topicSlug: "four-potential-and-em-lagrangian" },
    ],
  },
```

(Storage image is uploaded in Wave 3 via the same convention as Session 6 — if no avatar is available, the page renders with a default initial-circle. Don't block on it.)

- [ ] **Step 3 (optional Weber):** if author chose to include, append:

```ts
  {
    slug: "wilhelm-weber",
    name: "Wilhelm Eduard Weber",
    shortName: "Weber",
    born: "1804",
    died: "1891",
    nationality: "German",
    image: storageUrl("physicists/wilhelm-weber.webp"),
    relatedTopics: [
      { branchSlug: "electromagnetism", topicSlug: "charge-invariance" },
    ],
  },
```

- [ ] **Step 4:** Append §11 cross-link entries to `relatedTopics` of existing physicists (read each one, find its `relatedTopics: [...]` array, append):
   - **albert-einstein** (line 356) — append all 5 §11 topics; entire module is downstream of his 1905 SR paper.
   - **hendrik-antoon-lorentz** (line 825) — append `e-and-b-under-lorentz` and `magnetism-as-relativistic-electrostatics`.
   - **james-clerk-maxwell** (line 922) — append `four-potential-and-em-lagrangian`.
   - **edward-mills-purcell** (line 632) — append `magnetism-as-relativistic-electrostatics` (canonical pedagogical source — Berkeley Physics Course Vol II, 1965).
   - **joseph-louis-lagrange** (line 171) — append `four-potential-and-em-lagrangian`.
   - **emmy-noether** (line 326) — append `four-potential-and-em-lagrangian`.

- [ ] **Step 5:** Run `pnpm tsc --noEmit` — expect clean.

#### Task 1.3: Append ~11 glossary entries to GLOSSARY

**File:** `lib/content/glossary.ts` — insert immediately before the `];` at line 941, after dedup against the existing entries verified at plan time.

- [ ] **Step 1:** For each candidate slug below, run `grep -n "slug: \"<slug>\"" lib/content/glossary.ts` to verify it does NOT already exist:
   - `charge-invariance` (concept)
   - `lorentz-transformation-of-fields` (concept) — note: Lorentz with T (Hendrik), DIFFERENT person from `lorenz-gauge`
   - `boost-mixing-e-and-b` (phenomenon)
   - `lorentz-invariants-of-em-field` (concept) — for E·B and E²−c²B²
   - `electromagnetic-field-tensor` (concept) — also known as Faraday tensor
   - `dual-field-tensor` (concept) — *F^{μν}, Hodge dual
   - `four-current` (concept) — J^μ = (cρ, **J**)
   - `four-vector` (concept) — foundational; check if §10 added a `four-momentum` neighbour
   - `length-contraction-of-current` (phenomenon) — §11.4 specific application of SR length contraction
   - `four-potential` (concept) — A^μ = (φ/c, **A**)
   - `em-lagrangian-density` (concept) — L = −¼F_{μν}F^{μν} − A_μJ^μ

- [ ] **Step 2:** For each slug NOT already present, append a structural entry with the topic-cross-link only (Wave 3 seed-em-07 fills in the prose):

```ts
  {
    slug: "charge-invariance",
    category: "concept",
    relatedTopics: [
      { branchSlug: "electromagnetism", topicSlug: "charge-invariance" },
    ],
  },
  // ...one block per new term
```

- [ ] **Step 3:** For the **already-existing** entries that need §11 cross-links, append §11 topics to their `relatedTopics` arrays:
   - `lorenz-gauge` (line 2025) → append `four-potential-and-em-lagrangian`
   - `gauge-transformation` (line 1652) → append `four-potential-and-em-lagrangian`
   - `noethers-theorem` → append `four-potential-and-em-lagrangian`
   - `principle-of-least-action` → append `four-potential-and-em-lagrangian`

- [ ] **Step 4:** Run `pnpm tsc --noEmit` — expect clean.

#### Task 1.4: Create `lib/physics/electromagnetism/relativity.ts` shared types/helpers

**File:** `lib/physics/electromagnetism/relativity.ts` (NEW)

- [ ] **Step 1:** Write the file:

```ts
import { SPEED_OF_LIGHT } from "@/lib/physics/constants";
import type { Vec3 } from "@/lib/physics/electromagnetism/lorentz";

export type Vec4 = readonly [number, number, number, number];
export type FourVector = Vec4;
export type FourPotential = Vec4;
export type FourCurrent = Vec4;
export type FieldTensor = readonly [Vec4, Vec4, Vec4, Vec4];

/** Minkowski metric in mostly-minus signature (Griffiths convention). */
export const MINKOWSKI: FieldTensor = [
  [1, 0, 0, 0],
  [0, -1, 0, 0],
  [0, 0, -1, 0],
  [0, 0, 0, -1],
] as const;

/** Lorentz factor γ = 1/√(1 − β²). */
export function gamma(beta: number): number {
  return 1 / Math.sqrt(1 - beta * beta);
}

/** Lorentz boost matrix Λ^μ_ν along +x by velocity βc. Row-major 4×4. */
export function lorentzBoostMatrix(betaX: number): FieldTensor {
  const g = gamma(betaX);
  return [
    [g, -g * betaX, 0, 0],
    [-g * betaX, g, 0, 0],
    [0, 0, 1, 0],
    [0, 0, 0, 1],
  ] as const;
}

/** Construct antisymmetric F^{μν} from E (V/m) and B (T) in SI mostly-minus convention.
 *  F^{0i} = E_i / c, F^{ij} = −ε_{ijk} B_k. */
export function buildFieldTensor(E: Vec3, B: Vec3): FieldTensor {
  const c = SPEED_OF_LIGHT;
  return [
    [0, E.x / c, E.y / c, E.z / c],
    [-E.x / c, 0, -B.z, B.y],
    [-E.y / c, B.z, 0, -B.x],
    [-E.z / c, -B.y, B.x, 0],
  ] as const;
}

/** Closed-form Lorentz transform of E, B under boost along +x by βc.
 *  Used by §11.2 e-and-b-under-lorentz and (via lorentz-boost.ts) by §11.4. */
export function transformFields(
  E: Vec3,
  B: Vec3,
  betaX: number,
): { E: Vec3; B: Vec3 } {
  const g = gamma(betaX);
  const c = SPEED_OF_LIGHT;
  const v = betaX * c;
  // E'_x = E_x; E'_y = γ(E_y − v B_z); E'_z = γ(E_z + v B_y)
  // B'_x = B_x; B'_y = γ(B_y + v E_z / c²); B'_z = γ(B_z − v E_y / c²)
  return {
    E: { x: E.x, y: g * (E.y - v * B.z), z: g * (E.z + v * B.y) },
    B: {
      x: B.x,
      y: g * (B.y + (v * E.z) / (c * c)),
      z: g * (B.z - (v * E.y) / (c * c)),
    },
  };
}

/** Hodge dual *F^{μν} (swaps E ↔ cB up to signs). Used by §11.3 dual tensor. */
export function dualTensor(F: FieldTensor): FieldTensor {
  const c = SPEED_OF_LIGHT;
  // For input F constructed by buildFieldTensor(E, B), the dual is buildFieldTensor(c²B, -E/c).
  // Implement directly by index permutation on the input to avoid round-trip rebuild.
  return [
    [0, -F[2][3], -F[3][1], -F[1][2]],
    [F[2][3], 0, -F[0][3] / c, F[0][2] / c],
    [F[3][1], F[0][3] / c, 0, -F[0][1] / c],
    [F[1][2], -F[0][2] / c, F[0][1] / c, 0],
  ] as const;
}
```

- [ ] **Step 2:** Write `tests/physics/electromagnetism/relativity.test.ts` covering: γ at β=0, β=0.6 (g=1.25), β=0.99 (g≈7.09); lorentzBoostMatrix is the inverse of itself with β → −β to numerical tolerance; buildFieldTensor antisymmetry assertion `F[i][j] = -F[j][i]`; transformFields recovers Purcell §5.9 worked example (pure-E in lab frame → E' = γE_⊥ + B' = γβ × E / c in boosted frame, cross-product magnitudes match closed form).

- [ ] **Step 3:** Run `pnpm vitest run tests/physics/electromagnetism/relativity.test.ts` — expect pass.

#### Task 1.5: Create `lib/physics/electromagnetism/lorentz-boost.ts` boost helpers

**File:** `lib/physics/electromagnetism/lorentz-boost.ts` (NEW)

- [ ] **Step 1:** Write the file:

```ts
import { gamma } from "@/lib/physics/electromagnetism/relativity";

/** Rest-frame length L_0 contracted by an observer in a frame moving at βc. */
export function lengthContract(restLength: number, beta: number): number {
  return restLength / gamma(beta);
}

/** Charge density of a line-of-charges that moves at sign·βc in the observer's frame.
 *  ρ' = γ ρ_rest for a continuous line with rest-frame charge per length n0·q. */
export function boostLineDensity(
  restDensity: number,
  beta: number,
  sign: 1 | -1,
): number {
  // sign distinguishes lattice (+1) vs electron (-1) flow direction in the §11.4 setup.
  // Magnitude is symmetric in sign under the two-frame transformation; sign threads through
  // the eventual force direction in the caller, not the density magnitude.
  void sign;
  return gamma(beta) * restDensity;
}

/** Net + charge density of two-wire setup boosted from lab frame to electron rest frame.
 *  In lab frame: lattice (+) and drifting electrons (−) cancel, ρ_lab = 0.
 *  In electron frame: electrons are at rest, lattice contracts by γ → lattice line density
 *  becomes γ·n0; conversely the (now-moving) electron line density becomes n0/γ. Net charge
 *  density per unit length in the electron frame is e·n0·(γ − 1/γ).
 *  Returns this asymmetry; multiply by elementary charge for SI. */
export function netChargeDensityTwoWire(beta: number, n0: number): number {
  const g = gamma(beta);
  return n0 * (g - 1 / g);
}
```

- [ ] **Step 2:** Write `tests/physics/electromagnetism/lorentz-boost.test.ts` covering: lengthContract returns L_0 at β=0 and L_0/γ at β=0.6; netChargeDensityTwoWire returns 0 at β=0; netChargeDensityTwoWire matches Purcell's worked drift-velocity reproduction at β=v_drift/c with v_drift = 1 mm/s in copper (numerical sanity, value will be vanishingly small but nonzero — the point of the topic).

- [ ] **Step 3:** Run `pnpm vitest run tests/physics/electromagnetism/lorentz-boost.test.ts` — expect pass.

#### Task 1.6: Wave 1 commit

- [ ] **Step 1:** Run `pnpm tsc --noEmit` — expect clean.
- [ ] **Step 2:** Run `pnpm vitest run tests/physics/electromagnetism/relativity.test.ts tests/physics/electromagnetism/lorentz-boost.test.ts` — expect green.
- [ ] **Step 3:** Stage and commit:

```bash
git add lib/content/branches.ts lib/content/physicists.ts lib/content/glossary.ts \
        lib/physics/electromagnetism/relativity.ts \
        lib/physics/electromagnetism/lorentz-boost.ts \
        tests/physics/electromagnetism/relativity.test.ts \
        tests/physics/electromagnetism/lorentz-boost.test.ts
git commit -m "$(cat <<'EOF'
feat(em/§11): scaffold em-relativity, Minkowski, glossary, four-vector types

Wave 1 of EM Session 7. Five §11 topic entries (FIG.58–62), Hermann Minkowski
appended to PHYSICISTS, ~11 new glossary terms (with dedup against lorenz-gauge,
gauge-transformation, noethers-theorem, principle-of-least-action), and the new
shared lib/physics/electromagnetism/relativity.ts (Vec4, FourVector, FourPotential,
FourCurrent, FieldTensor, gamma, lorentzBoostMatrix, buildFieldTensor,
transformFields, dualTensor) plus lorentz-boost.ts helpers used by §11.2 + §11.4.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

### Wave 2 — Per-topic authoring

**Purpose:** Author 5 topics in parallel under the contract above. Each agent produces: physics lib + vitest tests + 3 scene components + page.tsx + content.en.mdx + handoff block.

**5 subagents in parallel. NO commits, NO publishes, NO registry edits.**

#### Task 2.1 — §11.1 `charge-invariance`

**Files (created by agent):**
- `lib/physics/electromagnetism/charge-invariance.ts`
- `tests/physics/electromagnetism/charge-invariance.test.ts`
- `app/[locale]/(topics)/electromagnetism/charge-invariance/page.tsx`
- `app/[locale]/(topics)/electromagnetism/charge-invariance/content.en.mdx`
- `components/physics/boosted-charge-counting-scene.tsx`
- `components/physics/weber-kohlrausch-c-scene.tsx`
- `components/physics/four-current-flux-scene.tsx`

**Topic angle:** the one quantity every observer agrees on. The Coulombs in a box are the same number whether you stand still or fly past at .9c. Why? Because charge is the divergence of E times ε₀, and both sides are scalar invariants — ∇·E transforms as a scalar density, and the integral over a Gaussian volume is frame-independent. **Historical hook:** Weber-Kohlrausch 1856 measured √(1/μ₀ε₀) = c six years before Maxwell's 1862 prediction that light IS an EM wave. The first quantitative hint that c was lurking inside electromagnetism. **Voice payoff:** "every quantity in this branch can rotate, mix, change sign — except this one."

**MDX shape (target 900–1100 words, 4–5 sections, 3 SceneCards, 4–5 EquationBlocks):**
- §1 The four-current J^μ = (cρ, **J**) — define the four-current; explain how four-current contraction with a four-volume gives a scalar invariant.
- §2 Why charge is invariant — flux of J^μ through a closed 3-volume is a Lorentz scalar; argue from continuity ∂_μ J^μ = 0.
- §3 BoostedChargeCountingScene — animate a parallel-plate capacitor with N charges in lab frame, then boost; charge count stays N even as plate length contracts.
- §4 Weber-Kohlrausch and the speed of light — 1856 measurement of √(1/μ₀ε₀) = c. WeberKohlrauschCScene shows the historical setup with a slider that morphs the unit-ratio readout into c. Optional `<PhysicistLink slug="wilhelm-weber" />` if Wave 1 included Weber.
- §5 The bigger picture — four-current vs four-potential vs four-momentum; charge is the time component of J^μ that no boost can mix away.

**Physics lib:** `chargeInvarianceFlux(volume: Vec3[], boost: number): number` returning Q (closed-form, returns same Q for all boosts), `weberKohlrauschRatio(): number` returning √(1/(μ₀ε₀)) — should equal SPEED_OF_LIGHT to 1e-10 relative tolerance.

**Tests:** Q invariance under β = 0, 0.5, 0.9; weberKohlrauschRatio === SPEED_OF_LIGHT within 1e-10.

#### Task 2.2 — §11.2 `e-and-b-under-lorentz`

**Files:** `em-lorentz-transform.ts`, test, `boost-mixing-e-b-scene.tsx`, `lorentz-invariants-scene.tsx`, `pure-e-becomes-eb-scene.tsx`, page.tsx, content.en.mdx.

**Topic angle:** what looks like a magnet to you looks like an electric field to someone moving past. Closed-form transformation: **E'_∥** = **E_∥**; **E'_⊥** = γ(**E_⊥** + **v** × **B**); **B'_∥** = **B_∥**; **B'_⊥** = γ(**B_⊥** − **v** × **E**/c²). **Two invariants** every observer agrees on: **E** · **B** and **E**² − c²**B**². If E·B = 0 in one frame it's zero in all; if E² > c²B² the field is "electric-like" and a frame exists where B = 0 (and vice versa). **Voice payoff:** "the magnetic and electric fields are not separate things — they are projections of one object onto your particular state of motion."

**MDX shape (target 1100–1300 words):** §1 the 1895 Lorentz transformation, §2 derivation sketch (parallel-plate capacitor → in boosted frame, displacement current source appears), §3 BoostMixingEBScene with v slider and live transformed-field readout, §4 the two Lorentz invariants — LorentzInvariantsScene shows E·B and E²−c²B² constant under boost while E and B individually rotate, §5 PureEBecomesEBScene — pure-E lab frame produces both E' and B' in any boosted frame (anchor for §11.4 setup).

**Physics lib:** Re-export `transformFields` from `relativity.ts`; add `lorentzInvariantE2MinusC2B2(E, B): number`, `lorentzInvariantEDotB(E, B): number`, vitest checks invariance under β = 0.3, 0.7.

#### Task 2.3 — §11.3 `the-electromagnetic-field-tensor`

**Files:** `field-tensor.ts`, test, `field-tensor-grid-scene.tsx`, `dual-tensor-swap-scene.tsx`, `tensor-recovers-maxwell-scene.tsx`, page.tsx, content.en.mdx.

**Topic angle:** F^{μν} packages the six field components into one antisymmetric 4×4 object. Six numbers — three E, three B — but the relativity makes them one. ∂_μ F^{μν} = μ₀ J^ν recovers Gauss's law (ν=0) and Ampère-Maxwell (ν=i). ∂_μ *F^{μν} = 0 recovers Faraday and no-monopole. The dual *F^{μν} swaps E ↔ cB (up to signs) — and **the dual is what magnetic monopoles would source** if they existed (forward-ref to §12.3 magnetic-monopoles-and-duality). **Voice payoff:** "Maxwell's four equations are two — and the second pair only looks separate because we don't have monopoles."

**Highest-risk publish of the session.** Densest LaTeX. Tensor superscript/subscript escape rules (gotcha iv) live or die here.

**MDX shape (target 1300–1500 words):** §1 motivation (six numbers, anti-symmetry), §2 explicit 4×4 with F^{0i}=E_i/c and F^{ij}=−ε_{ijk}B_k, §3 FieldTensorGridScene visualises the 4×4 with hover over each cell showing the corresponding E or B component, §4 ∂_μF^{μν} recovers two Maxwell equations (TensorRecoversMaxwellScene), §5 the dual *F^{μν} (DualTensorSwapScene morphs F → *F via E↔cB animation) and the §12.3 monopole forward-ref, §6 invariants are tensor traces (E·B = -¼*F_{μν}F^{μν}, E²−c²B² = -½F_{μν}F^{μν}/c² up to constants).

**Physics lib:** Re-export `buildFieldTensor`, `dualTensor` from relativity.ts. Add: `tensorContractFmunuJnu(F: FieldTensor, J: FourCurrent): Vec4` returning the 4-divergence sourced result (∂_μ F^{μν} = μ₀ J^ν check via finite differences on a known test field), `tensorAntisymmetryAssert(F: FieldTensor): boolean`. Tests: F antisymmetry holds for buildFieldTensor output across multiple (E,B) inputs, dual of dual recovers original up to sign in mostly-minus signature.

**SPECIAL INSTRUCTION (gotcha iv):** This agent must write a known-good test equation FIRST (`F_{\\mu\\nu} = \\partial_\\mu A_\\nu - \\partial_\\nu A_\\mu`) into content.en.mdx, then announce in handoff `readyForEarlyPublish: true`. Wave 2.5 publishes §11.3 first; if it renders cleanly the agent continues; if it fails the parser, the orchestrator coordinates a fix before §11.4 / §11.5 publish.

#### Task 2.4 — §11.4 `magnetism-as-relativistic-electrostatics` — **MONEY SHOT**

**Files:** `relativistic-magnetism.ts`, test, `two-wire-lab-frame-scene.tsx`, `two-wire-electron-frame-scene.tsx`, `force-equivalence-readout-scene.tsx`, page.tsx, content.en.mdx.

**Topic angle: the reveal the entire branch was built toward.**

**Visualisation specification — the click moment:**
- Two synchronized panels.
- **Lab frame (left panel):**
  - Two parallel wires (top wire labeled I_1, bottom wire labeled I_2, both currents to the right).
  - Static magenta + ions in a regular lattice (row of dots, equally spaced).
  - Cyan electrons drift to the right at v_drift (cyan dots flowing).
  - Wires are net-neutral (per-length count of magenta = per-length count of cyan).
  - B-field arrows between the wires (cyan, into the page below top wire, out of page above bottom wire — net B between them attracts).
  - Force F_mag = (μ₀ I_1 I_2 / 2π d) × L, attractive. Numerical readout in HUD.
- **Electron rest frame (right panel — boost lab by v_drift):**
  - The cyan electrons are now at rest.
  - The magenta lattice now drifts at −v_drift (to the left).
  - **Length contraction visible:** the lattice spacing on screen shrinks by a factor γ. Cyan dot spacing stays the same; magenta dot spacing visibly contracts.
  - Net + charge density appears (more magenta dots per unit length than cyan).
  - E-field arrows between the wires (magenta, radially attractive from the + lattice).
  - Force F_elec = ρ_net E × L, attractive. **Numerical readout in HUD shows F_elec = F_mag exactly.**
- **Slider:** drift velocity v on a logarithmic visual mapping (1 m/s → 0.99c). Real drift velocities are mm/s and the contraction is microscopic, but the formula at any v works the same — say so honestly in the prose.
- **Synchronization:** when v slider moves, both panels update in lockstep. The "click" moment: at v > 0 the magenta lattice contracts in the right panel and the + density appears.

**MDX shape (target 1500–1700 words):**
- §1 The setup — two parallel currents, the lab-frame B-field calculation, F_mag formula.
- §2 The boost — what happens when we ride along with the electrons. Inline minimal-SR primer per spec rule: define β, γ, length contraction in 2 paragraphs with one EquationBlock. **One inline aside:** `<Callout variant="warning">A full treatment of length contraction lives in the future RELATIVITY branch. For this topic we need only that lengths perpendicular to the boost are unchanged, and lengths parallel to it shorten by a factor γ.</Callout>`
- §3 The lattice contracts — derivation that magenta line density becomes γn₀ in the electron frame; cyan line density becomes n₀/γ; net is n₀(γ − 1/γ)·e. Closed-form algebra. TwoWireLabFrameScene + TwoWireElectronFrameScene side-by-side **as a single SceneCard** with the v slider (or two SceneCards with synchronized state — both work; pick whichever the parallel-safety contract allows in one scene).
- §4 The forces match — derive F_elec from the net + density and verify F_elec = F_mag exactly via β² → β²/(1−β²) chain. ForceEquivalenceReadoutScene shows both forces overlaid, identical to plotting tolerance.
- §5 **The reveal** — 200–250 word closing paragraph: "the moment a century of electromagnetism and a decade of special relativity snapped together." Don't undersell. This is the line readers will quote.
- §6 The honest caveat — Maxwell wrote his equations 40 years before this derivation existed. The reveal is post-hoc. The math worked first; the picture came later. Acknowledge.

**Physics lib:** import `boostLineDensity`, `netChargeDensityTwoWire`, `lengthContract` from `lorentz-boost.ts`. Add: `magneticForcePerLength(I1: number, I2: number, d: number): number` (μ₀I₁I₂/2πd), `electricForcePerLength(rhoLine: number, d: number): number` (Coulomb on parallel lines), `equivalenceCheck(I: number, n0: number, vDrift: number, d: number): { fMag: number; fElec: number; ratio: number }` — ratio should be 1 to 1e-10 relative tolerance for any vDrift in [1e-3, 0.99·c].

**Tests:** equivalenceCheck ratio === 1 within 1e-8 across vDrift = 0.001, 0.1, 0.5, 0.9, 0.99 (relative to c). Force magnitudes monotonic in vDrift².

**Cross-link:** `<PhysicistLink slug="hendrik-antoon-lorentz" />` (existing), `<PhysicistLink slug="albert-einstein" />` (existing), `<PhysicistLink slug="edward-mills-purcell" />` (existing — surface him as the modern teacher of the result).

#### Task 2.5 — §11.5 `four-potential-and-em-lagrangian` — **CLOSING**

**Files:** `four-potential.ts`, test, `four-potential-components-scene.tsx`, `lagrangian-action-scene.tsx`, `noether-charge-conservation-scene.tsx`, page.tsx, content.en.mdx.

**Topic angle: the cleanest sentence in physics.** L = −¼F_{μν}F^{μν} − A_μJ^μ. Six terms in the field-tensor square, one source-coupling term. Apply Euler-Lagrange to A^μ — out comes ∂_μ F^{μν} = μ₀ J^ν (Maxwell). Apply Noether's theorem to the gauge symmetry A_μ → A_μ + ∂_μΛ — out comes ∂_μ J^μ = 0 (charge conservation). The entire branch is one Lagrangian.

**MDX shape (target 1500–1700 words):**
- §1 The four-potential A^μ = (φ/c, **A**) — combines §07.3 Coulomb/Lorenz-gauge results into a single Lorentz-covariant object. FourPotentialComponentsScene shows A^μ in two frames with the boost mixing scalar and vector parts.
- §2 The EM Lagrangian density — write L = −¼F_{μν}F^{μν} − A_μJ^μ. Explain what each term means: the first is the field's kinetic energy (E²−c²B²)/2 up to signs, the second is the source coupling (φρ − **A**·**J**).
- §3 Euler-Lagrange recovers Maxwell — derivation of δL/δA_ν leads to ∂_μF^{μν} = μ₀J^ν, and antisymmetry of F gives ∂_μ(*F^{μν}) = 0 automatically. LagrangianActionScene shows the action S = ∫ L d⁴x and the variation principle visually.
- §4 Gauge invariance — A_μ → A_μ + ∂_μΛ leaves F^{μν} unchanged; Noether's theorem applied to this symmetry gives ∂_μJ^μ = 0. NoetherChargeConservationScene shows the symmetry → conservation map. **`<Term slug="gauge-invariance" />` cross-link** (existing, but Wave 3 promotes its description with §11.5 content). **`<Term slug="aharonov-bohm-effect" />` forward-ref** to §12.2 — the Lagrangian formulation makes the AB effect natural: A^μ enters L directly, so even where F^{μν} = 0 the potential carries phase information.
- §5 **The closing** — 300–400 word coda. "Maxwell wrote four equations. We just rewrote them as one line. From Coulomb 1785 through Faraday's discs and Maxwell's vortex models and Hertz's first transmitter and Einstein's 1905 paper and Minkowski's 1908 geometry and Larmor's 1897 radiation formula and the radiation-reaction seam and now this — the entire branch is one Lagrangian." Earn the line. Don't tack it on. **`<PhysicistLink slug="emmy-noether" />`** carries the symmetry → conservation principle. **`<PhysicistLink slug="joseph-louis-lagrange" />`** carries the action principle. The branch, written from one principle.
- §6 What's next — 100–150 word seam to §12. Gauge as the symmetry behind the symmetry, monopoles as the missing dual structure F^{μν} hints at, AB effect as the potential's quantum revenge, QED as the classical limit's other side. **`<Term slug="gauge-theory-origins" />`** forward-ref.

**Physics lib:** add: `lagrangianDensity(F: FieldTensor, A: FourPotential, J: FourCurrent): number` — return L = −¼F:F − A·J in SI units (with 1/μ₀ scaling per Griffiths convention; document choice). `eulerLagrangeRecoversMaxwellTest()` → asserts that finite-difference variation of the action recovers ∂_μF^{μν} = μ₀J^ν within tolerance for a known test configuration. `gaugeTransformLeavesFInvariant(A, lambda): boolean` — set up a gauge function Λ, transform A → A + ∂Λ, recompute F, verify F unchanged.

**Tests:** lagrangianDensity returns expected sign and magnitude on a static-Coulomb-field test case (S should reduce to −∫(ε₀/2)E²d⁴x for J=0 case); gauge invariance test passes for three different Λ choices.

#### Task 2.6 — Wave 2 verification gate

**Orchestrator runs after all 5 agents return:**

- [ ] Run `pnpm tsc --noEmit` — expect clean across all 5 topic-agent file sets. If any agent's lib uses a local fallback type for `Vec4`/`FourPotential`/`FieldTensor`, reconcile to the canonical import from `@/lib/physics/electromagnetism/relativity`.
- [ ] Run `pnpm vitest run tests/physics/electromagnetism/` — expect all green (existing Sessions 1–6 tests + 7 new test files).
- [ ] Inspect the §11.3 agent's known-good test equation in `electromagnetism/the-electromagnetic-field-tensor/content.en.mdx`. If the agent's MDX contains correctly-escaped tensor equations (`F_{\\mu\\nu}`, `\\partial_\\mu`), proceed. If escapes are inconsistent, send the agent back with a one-line correction prompt.

---

### Wave 2.5 — Registry merge + publish + commit (per topic, serial)

**Purpose:** Merge each agent's `registry` block into `lib/content/simulation-registry.ts` (15 new scene entries grouped under 5 `// EM §11 — <slug>` section comments), publish each topic, commit per topic. Special order: **§11.3 publishes first** to validate tensor LaTeX before §11.4 / §11.5 lock in.

**Order:** 11.3 → 11.1 → 11.2 → 11.4 → 11.5. (11.3 first to catch tensor parser issues; then natural reading order for the rest.)

For each topic in that order:
- [ ] Append the agent's `registry` block to `simulation-registry.ts` (3 lazy-import entries under `// EM §11 — <slug>` comment).
- [ ] Run `pnpm content:publish --only electromagnetism/<slug>` — expect `1 inserted` (or `0 inserted / 1 updated` if a previous run already created the row from earlier testing). If `0 / 0`, inspect MDX for the four gotchas (nested JSX in attribute, multi-line `$$`, bare `<`, double-backslash tensor escapes); fix and retry. If still `0 / 0` after fix, run with `--force` to confirm the parsed-output issue resolved.
- [ ] Run `curl -s -o /dev/null -w "%{http_code}\n" http://localhost:3000/en/electromagnetism/<slug>` (assuming dev server running — if not, run `pnpm tsc --noEmit` + `pnpm build` for SSG smoke); expect 200.
- [ ] Commit per topic with subject `feat(em/§11): <slug> — <one-liner from agent handoff>`.

**Commits (5 expected):**
- `feat(em/§11): the-electromagnetic-field-tensor — six numbers, one antisymmetric object`
- `feat(em/§11): charge-invariance — the one quantity every observer agrees on`
- `feat(em/§11): e-and-b-under-lorentz — the boost mixes them, two invariants survive`
- `feat(em/§11): magnetism-as-relativistic-electrostatics — same force, different name`
- `feat(em/§11): four-potential-and-em-lagrangian — the whole branch is one line`

---

### Wave 3 — Seed script, verification, spec update, log

**Purpose:** Author `seed-em-07.ts` with Minkowski (and optionally Weber) bios + glossary prose for the 11 new structural entries + forward-ref placeholders for any §12 references surfaced in Wave 2. Run verification curls, update spec progress to 62/66 (94%), file the implementation log to MemPalace.

**1 subagent. 2 commits (seed + spec). +1 if forward-ref placeholder follow-up is needed (the no-amend rule chooses a 3rd commit over rewriting the seed commit).**

#### Task 3.1: Author `scripts/content/seed-em-07.ts`

**Files:** `scripts/content/seed-em-07.ts` (NEW, mirrors `seed-em-06.ts`).

- [ ] **Step 1:** Read `scripts/content/seed-em-06.ts` end-to-end. Copy its `interface PhysicistSeed`, `interface GlossarySeed`, `parseMajorWork`, `paragraphsToBlocks`, `main()` loop verbatim.
- [ ] **Step 2:** Replace the PHYSICISTS array with **1 entry** (Hermann Minkowski) — bio ~350 words, 3 paragraphs (schooling at Königsberg, Bonn, ETH Zürich; central work — 1907 four-dimensional spacetime formulation, 1908 Cologne lecture; legacy — died 1909 at 44 of acute appendicitis, four years after giving SR its geometric home; mentor relationship with Hilbert; Einstein's "lazy student" relationship — mutual irritation; the geometry of numbers as parallel work). 5 contributions, 3 major works (the 1907 *Raum und Zeit* paper, the 1908 Cologne lecture, *Geometrie der Zahlen* 1896). `relatedTopics` = `the-electromagnetic-field-tensor`, `e-and-b-under-lorentz`, `four-potential-and-em-lagrangian`.
- [ ] **Step 3 (optional):** If Wave 1 included Weber, add a 2nd entry with ~300-word bio (Göttingen Seven, 1856 unit-ratio measurement with Kohlrausch finding √(1/μ₀ε₀) = c, partnership with Gauss on terrestrial magnetism). 4 contributions, 2 major works.
- [ ] **Step 4:** Write the GLOSSARY array — one `GlossarySeed` per Wave 1 new term, with `description` and `shortDefinition`. Plus **promotion entries** for `gauge-invariance` and (if extended this session) `electromagnetic-field` — these overwrite the Session 4 placeholder via source_hash idempotency. Bring §11.5 cross-references inline.
- [ ] **Step 5:** Add forward-ref placeholders for §12 references collected from Wave 2 handoff `forwardRefs` arrays. Likely candidates: `aharonov-bohm-effect`, `gauge-theory-origins`, `magnetic-monopole`. Use the established pattern (`shortDefinition` ending "Full treatment in §12", `description` starting "This is a placeholder entry…", code comment `// FORWARD-REF: full treatment in §12.X`).
- [ ] **Step 6:** Run `pnpm exec tsx --conditions=react-server scripts/content/seed-em-07.ts`. Expect:
   - 1–2 physicist rows inserted/updated.
   - 11 new glossary rows inserted, plus 1–2 promotions (existing rows updated with new prose), plus 0–3 forward-ref placeholder rows inserted.
- [ ] **Step 7:** Curl smoke test — for each of 5 §11 routes, run `curl -s -o /dev/null -w "%{http_code} %{url_effective}\n" http://localhost:3000/en/electromagnetism/<slug>`; expect 200 across all 5. Plus `/en/physicists/hermann-minkowski` and (if added) `/en/physicists/wilhelm-weber`.
- [ ] **Step 8:** Stage and commit:

```bash
git add scripts/content/seed-em-07.ts
git commit -m "$(cat <<'EOF'
fix(em/§11): seed Minkowski bio + glossary prose into Supabase

Wave 3 seed for EM Session 7. Adds Hermann Minkowski (350-word bio, 5
contributions, 3 major works), 11 new structural glossary entries
(charge-invariance, lorentz-transformation-of-fields, boost-mixing-e-and-b,
lorentz-invariants-of-em-field, electromagnetic-field-tensor, dual-field-tensor,
four-current, four-vector, length-contraction-of-current, four-potential,
em-lagrangian-density), promotion of gauge-invariance from Session-4 placeholder,
and forward-ref placeholders for §12 references (aharonov-bohm-effect,
gauge-theory-origins, magnetic-monopole).

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

#### Task 3.2: Update spec progress

**File:** `docs/superpowers/specs/2026-04-22-electromagnetism-branch-design.md`

- [ ] **Step 1:** Update header status line (line 4) — append `; §11 shipped 2026-04-25`.
- [ ] **Step 2:** Update Module status table — flip §11 from "0 not started" to "5 ☑ complete", total from 57 to 62, percentage from 86% to **94%**.
- [ ] **Step 3:** Check off all 5 boxes in the §11 per-topic checklist (lines 410–414).
- [ ] **Step 4:** Stage and commit:

```bash
git add docs/superpowers/specs/2026-04-22-electromagnetism-branch-design.md
git commit -m "$(cat <<'EOF'
docs(em/§11): mark em-relativity module complete — 62/66 (94%)

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

#### Task 3.3: File MemPalace implementation log

**Tool:** `mempalace_kg_add` (or write to `~/.mempalace/palace/wings/physics/decisions/` directly per palace conventions used by Sessions 1–6).

- [ ] Write `implementation_log_em_session_7_em_relativity.md` mirroring Session 6's log structure. Cover:
   - **What shipped** — 5 topics, 1–2 physicists, 11 glossary terms, route status, commit ledger.
   - **Wave-by-wave summary.**
   - **Deviations from plan** — specifically: did Wave 0 (CLI patch) ship? did Wave 1.5 (Canvas primitive) get built or stay deferred? was Weber included?
   - **Mid-session findings.** Especially:
     - (a) Did the §11.4 money shot land? Did the lattice contraction visibly click on first viewing or did the prose carry it?
     - (b) Did the §11.5 closing land? Did "the whole branch is one Lagrangian" feel earned or tacked-on?
     - (c) Did §11.3 tensor LaTeX (F^{\\mu\\nu}, \\partial_\\mu, \\Lambda^\\mu{}_\\nu) round-trip cleanly through publish? Or did a new MDX gotcha surface?
     - (d) New forward-refs surfaced toward §12 (count and slugs).
     - (e) Did the `lorenz-gauge` vs `lorentz-transformation` slug-collision watch hold? Any spelling slip caught?
     - (f) Did the optional Weber inclusion improve the §11.1 narrative or feel like padding?
     - (g) Was Minkowski's bio voice ("Einstein's lazy student who gave SR its geometry, dead at 44") right, or did it overshoot?
   - **Forward-refs added** for §12.
   - **Next session** — §12 Foundations (4 topics, FIG.63–66) closes the branch at 66/66. Money shot is `aharonov-bohm-effect`. Voice: short, tight, epilogue-grade. After §12 the branch is DONE.

---

## Known gotchas

(A) **Seed script for new physicists + glossary prose.** `PhysicistLink` and `Term` components fetch from Supabase `content_entries` at render time; TS arrays are structural metadata only. → Wave 3 creates `seed-em-07.ts` mirroring `seed-em-06.ts`. Bios ~300–400 words, glossary descriptions ~150–250 words.

(B) **Forward-reference placeholders.** Pattern from `seed-em-04.ts:637–665`. Likely §12 candidates: `aharonov-bohm-effect`, `gauge-theory-origins`, `magnetic-monopole`. Scan all 5 MDX files at Wave 3 start; collect from Wave 2 handoff.

(C) **`pnpm content:publish --force` for parser-affected re-publishes.** CLI hashes raw MDX source (`publish.ts:87`). Parser-only fixes need `--force`. **Pre-flight Wave 0 patch** (15 min, optional) changes hash to parsed output. Recommended pre-§11.3 publish.

(D) **MDX authoring gotchas** (Session 5 + Session 6 discoveries, all still active):
- (i) No `<PhysicistLink slug="…">` inside `title="…"` JSX attribute (nested quotes break).
- (ii) No multi-line `$$ … \qquad<newline> … $$` math blocks.
- (iii) No bare `<` or `>` in prose (parses as JSX tag opener); reword or escape as `&lt;` / `&gt;`.
- (iv) **NEW Session 7 risk: tensor-index escape rules.** Inside `<EquationBlock tex={\`…\`}>`, every backslash must be doubled: `F^{\\mu\\nu}`, `\\partial_\\mu A^\\mu`, `\\Lambda^\\mu{}_\\nu`. The §11.3 agent writes a known-good test equation first and signals `readyForEarlyPublish` so Wave 2.5 publishes §11.3 ahead of §11.4 / §11.5.

(E) **Shared types between primitive and Wave 2 agents.**
- `Vec2` from `@/lib/physics/coulomb`
- `Vec3` from `@/lib/physics/electromagnetism/lorentz`
- `Vec4`, `FourVector`, `FourPotential`, `FourCurrent`, `FieldTensor`, `MINKOWSKI`, `gamma`, `lorentzBoostMatrix`, `buildFieldTensor`, `transformFields`, `dualTensor` from `@/lib/physics/electromagnetism/relativity` (NEW Wave 1)
- Boost helpers from `@/lib/physics/electromagnetism/lorentz-boost` (NEW Wave 1)

If a Wave 2 agent needs a helper that doesn't exist, define a local fallback with `// TODO: promote to relativity.ts` and let Wave 2.5 reconcile.

(F) **§11 physics-lib nesting convention.** Continue `lib/physics/electromagnetism/<topic>.ts`. Reuse constants from `@/lib/physics/constants` (`MU_0`, `EPSILON_0`, `SPEED_OF_LIGHT`, `BOHR_MAGNETON`, `ALPHA_FINE`). No new constants this session.

(G) **§11 voice — magnetism is electricity seen from a moving train.** §11.4 carries the reveal; don't undersell. §11.5 closes the branch on one line of action; earn it.

(H) **Slug-collision watch.** `lorenz-gauge` (Ludvig Lorenz, 1867) vs `lorentz-transformation` (Hendrik Lorentz, 1895). Most-misspelled pair of names in physics. Triple-check spellings.

---

## Definition of done (session-level)

- All 5 routes return 200 at `/en/electromagnetism/<slug>` (and `/he/...` via translation-pending fallback).
- 1–2 new physicist pages return 200 at `/en/physicists/<slug>` (Minkowski definite, Weber optional).
- 11 new glossary pages return 200 at `/en/dictionary/<slug>`, plus the gauge-invariance promotion (and electromagnetic-field promotion if performed).
- 0–3 forward-ref placeholders for §12 added with proper "Full treatment in §12.X" voice.
- `pnpm tsc --noEmit` clean.
- `pnpm vitest run` green (with the 7 new test files passing alongside Sessions 1–6 baselines).
- `pnpm build` clean (SSG smoke for all 5 new routes plus Hebrew fallbacks).
- Spec progress table updated to 62/66 (94%).
- Implementation log filed to MemPalace `implementation_log_em_session_7_em_relativity.md`.
- Final commit ledger: 9 baseline (1 Wave 1 + 5 Wave 2.5 + 1 Wave 3 seed + 1 Wave 3 spec + 0–1 forward-ref follow-up). +1 if Wave 0 CLI patch shipped. +1 if a parser-only mid-session fix landed.

---

## Self-review notes

- **Spec coverage:** all 5 §11 topics addressed; cross-refs to §07 (Maxwell), §03 (Lorentz force), §12 (gauge / monopoles / AB) explicit; minimal-SR inline rule from spec §11 prerequisite section honoured.
- **Type consistency:** `Vec4`, `FourVector`, `FourPotential`, `FourCurrent`, `FieldTensor` all defined in `relativity.ts` and imported consistently across Tasks 2.1–2.5. `MINKOWSKI` / `gamma` / `lorentzBoostMatrix` / `buildFieldTensor` / `transformFields` / `dualTensor` all defined Wave 1 and consumed only Wave 2.
- **Placeholder scan:** no "TBD" / "TODO" / "implement later" in any task body. All code blocks contain runnable code. All commit messages are explicit.
- **Risk concentration:** §11.3 (densest LaTeX) publishes first in Wave 2.5 to surface parser issues before §11.4 / §11.5 lock in. Wave 0 CLI patch is optional but strongly recommended for §11.3 risk reduction.
