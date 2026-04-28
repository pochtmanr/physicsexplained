# Electromagnetism Session 8 — §12 Foundations (BRANCH-CLOSING)

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (token-saving variant — parallel waves, no per-task review) to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking. Feedback style: per wing=physics `feedback_execution_style.md`.

**Goal:** Ship 4 topics — §12 Foundations (FIG.63–66): `gauge-theory-origins`, `aharonov-bohm-effect`, `magnetic-monopoles-and-duality`, `classical-limit-of-qed`. After Session 8 the EM branch progress moves from 62/66 (94%) to **66/66 (100%)** — the branch is **complete**. §12 is the **epilogue**: gauge as the symmetry behind every fundamental force, AB where the potential matters in field-free regions, monopoles as the dual that Dirac proved is *allowed*, and the classical limit of QED where Maxwell's equations are the high-occupation-number limit of a quantum field. The branch ends on §12.4's closing paragraph.

**Architecture:** Four-wave structure mirroring Session 7, adapted to 4 topics and to **branch-closing discipline**. **No Wave 0** — Session 7 confirmed (a) the `pnpm content:publish` CLI hash-source patch did NOT ship and `--force` remains the workaround for parser-only fixes; (b) §11.3 tensor LaTeX round-tripped cleanly through MDX → KaTeX, validating that EquationBlock uses block-content form `$$…$$` (NOT `tex={\`…\`}` JSX form), so single-backslash LaTeX inside MDX text is the convention. **Wave 1** (serial, 1 agent) scaffolds the data layer: 4 new `Topic` entries (FIG.63–66, module: "foundations"), 4 new physicists (Weyl, Aharonov, Bohm, Feynman — all definite), ~10–12 new structural glossary entries, and four physics-lib files. **Wave 1.5 NOT BUILT** — 4 topics is well below the CircuitCanvas-7 / RayTraceCanvas-10 amortization threshold; the §12.2 AB-effect interference visualization is the only complex scene and it has no neighbour to share with. **Wave 2** dispatches 4 parallel topic agents under the Sessions 1–7 NO-registry-touch / NO-publish / NO-commit contract. **Wave 2.5** serially merges registry → publishes → commits per-topic in **FIG order (63 → 66)** so the git log reads chronologically and §12.4 lands LAST on purpose. **Wave 3** authors the seed script (`seed-em-08.ts`), runs verification, **promotes the three §12 glossary placeholders to full content via source_hash idempotency**, **flips the spec status header from "in progress" to "complete"**, kicks off the Hebrew machine-translation pass, files the Session 8 implementation log to MemPalace, AND writes a one-paragraph 8-session retrospective. Final commit lands on `feat(em): branch complete — 66/66 topics live`.

**Tech Stack:** Next.js 15 (App Router), React 19, TypeScript strict, Tailwind v4, MDX (`@next/mdx` + rehype-katex), Canvas 2D + `requestAnimationFrame`, Supabase `content_entries`, Vitest, `pnpm content:publish` CLI, `tsx --conditions=react-server` for seed scripts.

**Expected commit total: 11 baseline.**
- 1 Wave 1 scaffold
- 4 Wave 2.5 per-topic (FIG.63 → FIG.66)
- 1 Wave 3 seed (physicists + glossary promotions)
- 1 Wave 3 spec status flip ("in progress" → "complete — branch shipped 2026-04-25") + progress 66/66
- 1 Wave 3 home-page subtitle update if needed (`components/sections/branches-section.tsx`)
- 1 Wave 3 Hebrew translation kickoff commit (only if `pnpm content:translate` produces tracked changes; otherwise fold into the seed commit)
- 1 **branch-complete commit** — `feat(em): branch complete — 66/66 topics live` summarizing the 8-session arc

(+1 if a parser-only mid-session fix lands, +1 if forward-ref placeholder follow-up is needed.)

---

## Vision and voice reminders

**§12 voice — THE EPILOGUE.** 4 topics, dense and short. **Don't over-explain.** §12 is not a teach-it-from-scratch module; it is the door to the next branch. Each topic ends with a one-sentence forward-ref to the (future) QUANTUM branch where photons, gauge bosons, and the path integral live. The home page already shows QUANTUM as `coming-soon` — §12.4's closing line is the implicit hand-off.

Topic-by-topic voice anchors:
- §12.1 `gauge-theory-origins` ends with: *"Gauge theory became the template; the Standard Model is the cathedral built from it."*
- §12.2 `aharonov-bohm-effect` ends with: *"The potential is not auxiliary; it is the real object — and quantum mechanics is the proof."*
- §12.3 `magnetic-monopoles-and-duality` ends with: *"We have not found one. We have not ruled them out. Dirac showed they would not break anything."*
- §12.4 `classical-limit-of-qed` ends with **the closing paragraph of the entire branch.** Spec voice (adapt wording, preserve cadence):

  > Maxwell wrote four equations. They survived Lorentz, who showed they were not Galilean. They survived Einstein, who rewrote them as one tensor. They survived Dirac, who quantized the field they describe. They survived Feynman, who calculated the small corrections they cannot. The classical theory is incomplete — but it is consistent, and it is the language every successor theory had to learn to speak. The next branch is QUANTUM. We will see them again.

  This is the line the reader screenshots when the branch ends. Earn it.

**Money shot to nail — §12.2 `aharonov-bohm-effect`.** Two-slit electron interference geometry. **Top:** electron source → two slits → screen with fringe pattern (familiar from §09.8 `diffraction-and-the-double-slit`). **Add:** a thin solenoid centered between the two slits, drawn as a small circle with B-field labeled INSIDE the solenoid only (cyan inward field, no field outside). **Critical visual:** the electron paths through the two slits MUST be drawn explicitly so the viewer SEES they pass through field-free regions (faint amber traces from source through each slit, threading either side of the solenoid, converging on the screen). **Toggle:** solenoid ON / OFF. With solenoid ON, the entire fringe pattern shifts laterally by phase Φ = (q/ℏ)∮**A**·d**ℓ** = (q/ℏ)Φ_B. **Slider:** enclosed flux in units of Φ_0 = h/q (the flux quantum). At Φ_B = Φ_0/2 fringes flip (constructive ↔ destructive). At Φ_B = Φ_0 fringes return to original. **The "click" moment:** the field is zero everywhere the electrons go, yet the pattern shifts. The most direct experimental evidence that the potential, not the field, is the real object. Cross-link: §03.4 `the-vector-potential`'s `GaugeFreedomScene` shows |B| invariant under gauge change — but the AB phase is *not* gauge invariant in detail (it's only the loop integral that is), and that distinction is the §12.2 deep payoff for a careful reader.

**Closing moment to nail — §12.4 `classical-limit-of-qed`.** This is the LAST topic of the LAST module of the LAST session of the EM branch. Treat it accordingly. **Open** with the historical inversion: Feynman's *Lectures on Physics* derives Maxwell's equations FROM the photon, not the other way around. **Body:** coherent states |α⟩ are eigenstates of the annihilation operator with Poisson photon-number distribution; in the limit |α|² → ∞, the expectation value of the field operator approaches the classical EM field exactly (relative quantum fluctuation vanishes as 1/√N). **Two corrections classical EM cannot reproduce:** Lamb shift (1947) and the anomalous magnetic moment (g − 2 = α/π + O(α²) ≈ 0.00116, the most precisely-tested prediction in physics). **Bridge:** running coupling α(E) is the door to QED proper — at energies far above m_e c² the coupling grows toward 1 and perturbation theory eventually breaks. **Closing paragraph (per spec, adapted):** the line above. Don't undersell.

**Calculus policy — unchanged.** Every topic that uses ∂_μ, F^{μν}, ∮, four-vector index notation explains the symbol in local context in plain words before the compact form. Side notes (`<Callout variant="math">`) carry denser tensor derivations. Redundancy is a feature — every topic stands alone for a search-engine arrival.

**§12.2 NAME-PAIR DISCIPLINE:** Aharonov-Bohm is a paper, not a single physicist. Use `<PhysicistLink slug="yakir-aharonov" />` and `<PhysicistLink slug="david-bohm" />` separately when referring to the paper. Use `<Term slug="aharonov-bohm-effect" />` when referring to the effect. **DO NOT** create a single `aharonov-and-bohm` slug or any composite physicist entry.

**§12.1 Abelian vs non-Abelian decision (carried from spec):** if §12.1 prose discusses the bridge to weak + strong forces (Yang-Mills 1954), the agent should include `<PhysicistLink slug="chen-ning-yang" />` and `<PhysicistLink slug="robert-mills" />` as full-bio entries, AND seed a `non-abelian-gauge` glossary term. If §12.1 stays U(1) Abelian only (just the QED gauge), Yang-Mills is a one-line forward-ref and Yang/Mills are NOT added to PHYSICISTS. **Default decision: include both Yang and Mills** — the 1954 paper is the central event in the modern history of physics and `gauge-theory-origins` would feel hollow without it. Wave 1 author makes the final call but defaults to inclusion.

---

## File structure and registries

**Files created this session:**

Physics libraries (4 new — one per topic, no shared types/helpers needed beyond what `relativity.ts` already provides):

- `lib/physics/electromagnetism/gauge-theory.ts` (§12.1) — `gaugeTransformation(A: FourPotential, lambda: FourVector): FourPotential` (returns A_μ + ∂_μΛ via finite differences), `u1PhaseRotation(psi: { re: number; im: number }, theta: number): { re: number; im: number }` (the U(1) phase rotation that gauge-couples to the EM field), `nonAbelianCommutator(A: FieldTensor, B: FieldTensor): FieldTensor` (gesture at SU(N): [A_μ, A_ν] — non-zero, unlike the Abelian case; only used if Wave 1 includes Yang-Mills).
- `lib/physics/electromagnetism/aharonov-bohm.ts` (§12.2) — `aharonovBohmPhase(charge: number, fluxEnclosed: number): number` (Φ = qΦ_B/ℏ), `fluxQuantum(charge: number): number` (Φ_0 = h/|q|), `interferencePattern(slitSpacing: number, screenDistance: number, wavelength: number, phaseShift: number): (x: number) => number` (returns intensity I(x) = 4cos²((πd·x/λL) + φ/2) up to normalization).
- `lib/physics/electromagnetism/monopole.ts` (§12.3) — `dualMaxwellEquations()` (returns symbolic descriptors of the symmetric Maxwell pair when monopoles exist; pure narrative output, no numerics), `diracQuantizationCondition(electricCharge: number, magneticCharge: number): { eg: number; n: number }` (returns the integer quantum number n = eg/(2πℏ)), `magneticChargeDensityFromTensor(F_dual: FieldTensor): Vec4` (∂_μ *F^{μν} = μ₀ J^ν_magnetic for the dual tensor in a monopole-bearing universe).
- `lib/physics/electromagnetism/qed-classical-limit.ts` (§12.4) — `coherentStatePhotonStats(alpha: number): { meanN: number; varianceN: number; relativeFluctuation: number }` (Poisson distribution: ⟨N⟩ = |α|², σ_N = |α|, σ_N/⟨N⟩ = 1/|α|), `runningCouplingAlpha(energy: number): number` (one-loop QED β-function at low E: α(E) ≈ α(0)/(1 − (α/3π)·ln(E²/m_e²c⁴))), `anomalousMagneticMomentLeadingOrder(): number` (returns α/(2π), the Schwinger 1948 result, ≈ 0.00116).

**Constants additions to `lib/physics/constants.ts`:** *None expected.* The Dirac quantization condition uses `e * g = 2πnℏ`. If §12.3 wants a representative monopole-charge constant, the agent may add `DIRAC_MONOPOLE_UNIT = 2 * PI * H_BAR / ELEMENTARY_CHARGE` (units: Wb), but this is optional — gesture in prose works equally well.

Topic pages (4 per-topic directories, each with `page.tsx` + `content.en.mdx`):
- `app/[locale]/(topics)/electromagnetism/gauge-theory-origins/{page.tsx,content.en.mdx}`
- `app/[locale]/(topics)/electromagnetism/aharonov-bohm-effect/{page.tsx,content.en.mdx}`
- `app/[locale]/(topics)/electromagnetism/magnetic-monopoles-and-duality/{page.tsx,content.en.mdx}`
- `app/[locale]/(topics)/electromagnetism/classical-limit-of-qed/{page.tsx,content.en.mdx}`

Scene components (flat files in `components/physics/` — 3 per topic, **12 total** — kebab-case):
- §12.1 `gauge-theory-origins`: `u1-phase-rotation-scene.tsx`, `gauge-symmetry-to-conservation-scene.tsx`, `non-abelian-gesture-scene.tsx` (the third one is optional if §12.1 stays U(1)-only; if so, replace with `gauge-as-template-scene.tsx` showing U(1) → SU(2) × U(1) → SU(3) as a template-becomes-Standard-Model gesture)
- §12.2 `aharonov-bohm-effect` (**MONEY SHOT**): `two-slit-with-solenoid-scene.tsx`, `flux-phase-shift-fringes-scene.tsx`, `field-free-electron-paths-scene.tsx`
- §12.3 `magnetic-monopoles-and-duality`: `dual-tensor-and-monopole-source-scene.tsx`, `dirac-quantization-condition-scene.tsx`, `dual-maxwell-symmetry-scene.tsx`
- §12.4 `classical-limit-of-qed`: `coherent-state-poisson-scene.tsx`, `photon-number-to-classical-field-scene.tsx`, `running-coupling-and-corrections-scene.tsx`

Test files (4 per-topic = 4 new):
- `tests/physics/electromagnetism/gauge-theory.test.ts`
- `tests/physics/electromagnetism/aharonov-bohm.test.ts`
- `tests/physics/electromagnetism/monopole.test.ts`
- `tests/physics/electromagnetism/qed-classical-limit.test.ts`

Seed script (Wave 3):
- `scripts/content/seed-em-08.ts` — mirrors `seed-em-07.ts` exactly. Adds 4 (or 6 with Yang/Mills) physicists. Promotes the 3 existing §12 forward-ref glossary placeholders (`gauge-theory-origins`, `aharonov-bohm-effect`, `magnetic-monopole`) from placeholder text to full prose via source_hash idempotency. Adds ~10–12 new glossary terms with full prose.

**Files modified this session:**
- `lib/content/branches.ts` — append 4 `Topic` entries (FIG.63–66, module: `"foundations"`) immediately before the `];` at line 912.
- `lib/content/physicists.ts` — append 4 (or 6 with Yang/Mills) new physicist structural entries before the `];` at line 1058. Append §12 entries to `relatedTopics` arrays of: `paul-dirac` (§12.3), `hermann-minkowski` (§12.3), `albert-einstein` (§12.4), `james-clerk-maxwell` (§12.4 — the closing paragraph names him), `emmy-noether` (§12.1 — gauge symmetry → charge conservation is THE Noether application).
- `lib/content/glossary.ts` — append ~10–12 new structural entries (slug + category + relatedTopics only; prose lives in seed-em-08).
- `lib/content/simulation-registry.ts` — append 12 new scene lazy-import entries grouped under `// EM §12 — <slug>` section comments. **Inserted by Wave 2.5 orchestrator only.**
- `docs/superpowers/specs/2026-04-22-electromagnetism-branch-design.md` — Wave 3 flips status to "complete", checks all 4 §12 boxes, updates module table to 4/4 ☑ complete, total to 66/66 (100%).
- `components/sections/branches-section.tsx` — Wave 3, ONLY IF the home-page subtitle copy currently says "two branches live" or similar that needs flipping. Read first; if it just lists branches without a count line, no edit needed.

**Files NOT modified:**
- `lib/content/branches.ts` branch status — EM has been `live` since Session 1.
- `lib/physics/electromagnetism/relativity.ts` and `lib/physics/electromagnetism/lorentz-boost.ts` — Session 7 owns these; reuse the canonical types/helpers as-is.
- `components/physics/visualization-registry.tsx` — glossary-tile preview only; no §12 glossary term needs a tile preview this session.
- `components/physics/circuit-canvas/*`, `components/physics/ray-trace-canvas/*` — §12 is field-level / phase-level / coherent-state-level; no primitive edits.
- `lib/physics/constants.ts` — no new constants required (default; optional `DIRAC_MONOPOLE_UNIT` if §12.3 author chooses).

**Glossary dedup table (verified by SQL on Supabase content_entries + grep on glossary.ts at plan time):**

| Slug | Status | Action |
|---|---|---|
| `gauge-invariance` | EXISTS in Supabase as full prose (Session 7 promotion, block_count=2). NOT in glossary.ts. | Append §12.1 to its Supabase relatedTopics in seed-em-08; **add structural entry** to glossary.ts so the §12 glossary index is consistent. |
| `gauge-theory-origins` | EXISTS in Supabase as placeholder (Session 7 forward-ref, block_count=1). NOT in glossary.ts. | **PROMOTE** in seed-em-08 with full prose + add structural entry to glossary.ts. |
| `aharonov-bohm-effect` | EXISTS in Supabase as placeholder (Session 7 forward-ref, block_count=1). NOT in glossary.ts. | **PROMOTE** in seed-em-08 with full prose + add structural entry to glossary.ts. |
| `magnetic-monopole` | EXISTS in Supabase as placeholder (Session 7 forward-ref, block_count=1). NOT in glossary.ts. | **PROMOTE** in seed-em-08 with full prose + add structural entry to glossary.ts. |
| `classical-limit-of-qed` | NOT seeded anywhere. | Add structural entry to glossary.ts AND add full prose seed in seed-em-08. |
| `lorenz-gauge`, `coulomb-gauge`, `gauge-transformation` | EXIST (prior sessions). | No re-seed; only append §12.1 to relatedTopics if the topic prose calls them. |
| `noethers-theorem` | EXISTS (CM seed). | Append §12.1 to relatedTopics. |
| `lorentz-force` | EXISTS (Session 2). | No change. |
| `four-potential` | EXISTS (Session 7, full prose, block_count≥1, in glossary.ts:2569). | Append §12.1 + §12.2 to its relatedTopics. |
| `electromagnetic-field-tensor` | EXISTS (Session 7, full prose, in glossary.ts:2547). | Append §12.3 to its relatedTopics (the dual tensor lives here). |
| `dual-field-tensor` | EXISTS (Session 7, full prose, in glossary.ts:2555). | Append §12.3 to its relatedTopics. |
| `four-current` | EXISTS (Session 7, full prose, in glossary.ts:2507). | Append §12.4 to its relatedTopics if the prose uses J^μ. |

**New glossary slugs to add this session (~10–12):**
- §12.1: `gauge-group`, `non-abelian-gauge` (only if §12.1 covers Yang-Mills), `yang-mills-equations` (same)
- §12.2: `aharonov-bohm-phase`, `electron-interference` (or fold into existing `interference` from §09 with cross-link — decide at author time; prefer fold-in)
- §12.3: `dirac-quantization-condition`, `electromagnetic-duality` (slug: `electromagnetic-duality`, NOT `em-duality` — match the spec naming convention)
- §12.4: `coherent-state`, `running-coupling`, `anomalous-magnetic-moment`
- **Plus structural entries** for `gauge-theory-origins`, `aharonov-bohm-effect`, `magnetic-monopole`, `gauge-invariance`, `classical-limit-of-qed` (the four that exist in Supabase but not in glossary.ts, plus the new §12.4).

Total new glossary slugs in glossary.ts: ~13–15 (8–10 truly new + 5 backfill of existing Supabase entries that were missing structural rows).

---

## Self-contained context — what agents need to know

**Content-publish CLI behaviour (verified from Session 7 log):**
- Command: `pnpm content:publish --only electromagnetism/<slug>` — inserts or updates exactly one `kind=topic` row in Supabase `content_entries`, keyed by `(kind, slug, locale)`.
- `source_hash = sha256(rawMdxSource)` (NOT the parsed payload — the CLI hash-source patch did NOT ship in Session 7).
- **Implication:** parser-only fixes that don't change MDX source require `--force`. Document `--force` in known gotchas. If Session 8 surfaces a parser change, run with `--force`.
- Zero rows inserted/updated (`0 / 0`) on a run = MDX parse error silently swallowed. If a publish reports `0 / 0`, open `content.en.mdx` and check the four MDX gotchas listed below.

**Seed script behaviour (`seed-em-08.ts`):** mirrors `seed-em-07.ts` exactly — copy verbatim. Run with `pnpm exec tsx --conditions=react-server scripts/content/seed-em-08.ts`. Same `PhysicistSeed` / `GlossarySeed` interfaces, same `parseMajorWork` / `paragraphsToBlocks` helpers, same `main()` upsert loop with `source_hash = sha256(JSON.stringify({title, subtitle, blocks, meta}))`. Per-entry discipline: bios ~300–400 words (3 paragraphs), glossary descriptions ~150–250 words (1–2 paragraphs).

**`paragraphsToBlocks` shape (Session 7 lesson — copy verbatim):**
```ts
function paragraphsToBlocks(text: string): Array<{ type: "paragraph"; inlines: string[] }> {
  return text
    .split("\n\n")
    .map((p) => p.trim())
    .filter((p) => p.length > 0)
    .map((p) => ({ type: "paragraph" as const, inlines: [p] }));
}
```
DO NOT wrap inlines as `{type:"text", text:p}` — the renderer expects flat `string[]`. Session 7's first attempt got this wrong; the fix went into the seed commit. **Copy from `seed-em-07.ts` byte-for-byte.**

**Page.tsx canonical shape (every new topic — identical to Session 7, only `const SLUG` changes):**
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

**MDX content canonical shape:** same as Session 7. Word count target 1100–1300 baseline; **1300–1500 for §12.2 (money shot) and §12.4 (closing)**; tighter is fine — §12 is the epilogue.

**EquationBlock convention (Session 7 lesson — confirmed clean):**
```mdx
<EquationBlock id="EQ.01">
$$F_{\mu\nu} = \partial_\mu A_\nu - \partial_\nu A_\mu$$
</EquationBlock>
```
Block-content form, single-backslash LaTeX is fine inside MDX text. **DO NOT** use the JSX expression form `<EquationBlock tex={\`...\`}>` — that requires double-backslash escapes. Use the block-content form throughout. (This retires Session 7's gotcha (iv) for the §12 work, except where the agent specifically chooses the `tex={...}` prop form for some unusual reason.)

**Scene component canonical shape:** `"use client"`, named export ending `Scene`, Canvas 2D + `useAnimationFrame` from `@/lib/animation/use-animation-frame`, `useThemeColors()` from `@/lib/hooks/use-theme-colors`, palette unchanged from Sessions 1–7:
- magenta `rgba(255,106,222,…)` — + charge / E-field
- cyan `rgba(120,220,255,…)` — − charge / B-field / wavefronts
- amber `rgba(255,180,80,…)` — radiated light / ray paths / electron paths in §12.2
- green-cyan `rgba(140,240,200,…)` — induced current / electron drift
- lilac `rgba(200,160,255,…)` — field-energy density / displacement current / phase-rotation marker in §12.1
- pale-blue `rgba(140,200,255,…)` — outgoing wavefronts / interference fringe maxima
- orange-red `rgba(255,140,80,…)` — bremsstrahlung / synchrotron beams
- pale-grey `rgba(180,170,200,…)` — boost-frame outlines / ghost guides
- **NEW this session, suggested:** `rgba(255,210,150,…)` for **fringe-shift overlay** in §12.2 (faint amber-yellow that shows the original (B=0) fringe pattern as a ghost while the active (B≠0) pattern is in solid amber). Optional; agents may use a desaturated amber instead.
- No external 3D libraries, no WebGL, Canvas 2D only.

**Parallel-safety contract (Wave 2 — enforced for all 4 agents):**
1. **DO NOT** modify `lib/content/simulation-registry.ts`. Orchestrator merges 4 handoff blocks serially in Wave 2.5.
2. **DO NOT** modify `components/physics/visualization-registry.tsx`. Not needed.
3. **DO NOT** modify `lib/content/branches.ts`, `lib/content/physicists.ts`, `lib/content/glossary.ts`, `lib/physics/constants.ts` — Wave 1 already scaffolded those.
4. **DO NOT** modify `lib/physics/electromagnetism/relativity.ts` or `lib/physics/electromagnetism/lorentz-boost.ts` — Session 7 owns these. Import canonical types/helpers from them.
5. **DO NOT** run `pnpm content:publish`. Orchestrator publishes in Wave 2.5.
6. **DO NOT** `git commit`. Orchestrator commits per-topic in Wave 2.5.
7. **TYPES CONTRACT (carried from Session 7):** import canonical types from the home file:
   - 2D: `import type { Vec2 } from "@/lib/physics/coulomb"`
   - 3D: `import type { Vec3 } from "@/lib/physics/electromagnetism/lorentz"`
   - 4D / tensor: `import { type Vec4, type FourVector, type FourPotential, type FourCurrent, type FieldTensor, gamma, transformFields, buildFieldTensor, dualTensor, MINKOWSKI } from "@/lib/physics/electromagnetism/relativity"`
   If a Wave 2 agent finds a missing helper, define a local fallback with a `// TODO: promote to relativity.ts` comment; orchestrator reconciles in Wave 2.5.
8. **`<Term>` SLUG DISCIPLINE (Session 7 lesson):** every `<Term slug="..."/>` MUST resolve to a glossary slug that exists in `lib/content/glossary.ts` (the array Wave 1 just edited). **Topic slugs are NOT auto-resolved by `<Term>`.** If you want to link to a topic, use `<TopicLink branchSlug="electromagnetism" topicSlug="..."/>` or plain markdown link `[the-lorentz-force](/en/electromagnetism/the-lorentz-force)`. If you reference a glossary term that doesn't exist yet (forward-ref to a future branch), that's fine — the link will render as a placeholder until the term lands; just include it in the `forwardRefs` handoff list so Wave 3 can decide whether to seed a placeholder.
9. **MDX GOTCHAS CONTRACT (still active — list pruned of items Session 7 retired):**
   - (i) **No nested JSX inside string JSX attributes.** `<SceneCard title="Foo <PhysicistLink slug='bar'/>" />` breaks quoting. Put human and concept links in body prose only.
   - (ii) **No multi-line `$$…$$` math blocks.** Micromark chokes on `$$ a \qquad<newline> b $$`. Collapse to single-line within the EquationBlock.
   - (iii) **No bare `<` or `>` in prose.** Reword or escape as `&lt;` / `&gt;`.
   - (iv) **§12.3 dual-tensor LaTeX density warning.** The dual `*F^{μν} = ½ε^{μνρσ}F_{ρσ}` is the densest single equation in the branch. Use the block-content `$$…$$` form (single-backslash LaTeX). **Test by publishing §12.3 first in Wave 2.5** — if the parser chokes on `\varepsilon^{\mu\nu\rho\sigma}` or `\partial_\mu`, fix the MDX before §12.4 publishes. Session 7 §11.3 passed cleanly with the block-content form, so this should hold.
10. **RETURN HANDOFF BLOCK** to orchestrator at end of work (matches Session 7 contract):
    - `registry`: exact multi-line text block for `SIMULATION_REGISTRY` (section comment `// EM §12 — <slug>` + 3 lazy-import entries, using the codebase's actual `lazyScene(...)` + PascalCase-key convention).
    - `publishArg`: `electromagnetism/<slug>` literal.
    - `commitSubject`: single line matching `feat(em/§12): <slug> — <tagline>`.
    - `forwardRefs`: `[{slug, kind}]` array of references pointing at slugs without a `content_entries` row.
    - `wordCount`: prose word count for content.en.mdx (excluding frontmatter imports).
    - `notes`: any deviation, surprise, or thing the orchestrator should know.

**Forward-reference placeholder pattern (Wave 3):** Pattern from `seed-em-04.ts:637–665` and reused in `seed-em-07.ts:248–280`. **Session 8 has the OPPOSITE problem from prior sessions:** §12 is the LAST module — there are no future EM modules to forward-ref to. Forward-refs in Session 8 land at the future QUANTUM branch, which doesn't exist yet. Don't seed QUANTUM placeholders in EM glossary; instead, the §12.4 closing paragraph names QUANTUM as the next branch and that's the entire bridge.

The 3 existing §12 forward-ref glossary placeholders (`gauge-theory-origins`, `aharonov-bohm-effect`, `magnetic-monopole`) get **PROMOTED** in Wave 3 via source_hash idempotency: seed-em-08 inserts new full prose; the upsert detects different `source_hash` and overwrites. Verify post-Wave-3 via SQL.

**Curl smoke discipline (Session 7 lesson):** Run curl smoke on a **fresh** dev server BEFORE the Wave 3 commit. Don't rely on a cached dev process — port 3000 may have stale state from earlier in the session. If 3000 is occupied, run on 3001 (`PORT=3001 pnpm dev`) and curl that. Both Session-7 lessons (`<Term>` slug shape + `paragraphsToBlocks` shape) were caught only because curl ran post-publish; neither tsc nor vitest would have surfaced them.

---

## Task decomposition

### Wave 0 — SKIPPED

The `pnpm content:publish` CLI hash-source patch is NOT shipping this session. Use `--force` for any parser-only republish. The §08–§11 tex-backfill check is also skipped (Session 7 §11.3 passed cleanly, the EquationBlock block-content convention is stable, and an exhaustive backfill at branch-end is out of scope).

If during Wave 2.5 a §12 publish reports `0 / 0` or a §12 page renders broken LaTeX, fix the MDX and re-run with `--force`. Document the fix in the Session 8 implementation log.

---

### Wave 1 — Data-layer scaffold

**Purpose:** Add 4 new `Topic` entries (FIG.63–66, module: `"foundations"`), 4 new physicist structural entries (Weyl, Aharonov, Bohm, Feynman; +2 if Yang and Mills are included), ~13–15 new structural glossary entries (after dedup: 8–10 truly new + 5 backfill of Session-7-Supabase-only slugs), and the four new physics-lib files. TS arrays are structural metadata only; Supabase prose seeding happens in Wave 3.

**Serial, 1 subagent. 1 commit.**

#### Task 1.1: Append 4 topics to ELECTROMAGNETISM_TOPICS

**File:** `lib/content/branches.ts` — insert immediately before the `];` at line 912.

- [ ] **Step 1:** Run `grep -n "four-potential-and-em-lagrangian\|^];" lib/content/branches.ts | head -5` to confirm the closing `];` of `ELECTROMAGNETISM_TOPICS` is at line 912 (immediately after the §11 entries appended in Session 7). Insert before it.

- [ ] **Step 2:** Verify `ELECTROMAGNETISM_MODULES` (line 337–350) contains the foundations module entry. Run `grep -n "foundations" lib/content/branches.ts | head -3`. Expect a line near 349 with `{ slug: "foundations", title: "Foundations", index: 12 }`. The module slug is **`foundations`** (NOT `em-foundations` or `foundations-em`). Use this verbatim as the `module:` field below.

- [ ] **Step 3:** Append the 4 §12 entries:

```ts
  {
    slug: "gauge-theory-origins",
    title: "GAUGE INVARIANCE AND THE BIRTH OF GAUGE THEORIES",
    eyebrow: "FIG.63 · FOUNDATIONS",
    subtitle: "The symmetry that became the template for every force.",
    readingMinutes: 13,
    status: "live",
    module: "foundations",
  },
  {
    slug: "aharonov-bohm-effect",
    title: "THE AHARONOV–BOHM EFFECT",
    eyebrow: "FIG.64 · FOUNDATIONS",
    subtitle: "When the potential matters even where the field is zero.",
    readingMinutes: 12,
    status: "live",
    module: "foundations",
  },
  {
    slug: "magnetic-monopoles-and-duality",
    title: "MAGNETIC MONOPOLES AND DUALITY",
    eyebrow: "FIG.65 · FOUNDATIONS",
    subtitle: "The symmetric version of Maxwell, and the particle we haven't found.",
    readingMinutes: 11,
    status: "live",
    module: "foundations",
  },
  {
    slug: "classical-limit-of-qed",
    title: "THE CLASSICAL LIMIT OF QED",
    eyebrow: "FIG.66 · FOUNDATIONS",
    subtitle: "Where classical electromagnetism ends, and what replaces it.",
    readingMinutes: 12,
    status: "live",
    module: "foundations",
  },
```

- [ ] **Step 4:** Run `pnpm tsc --noEmit` — expect clean.

#### Task 1.2: Append physicists to PHYSICISTS

**File:** `lib/content/physicists.ts` — insert immediately before the `];` at line 1058. After insertion, update `relatedTopics` of 5 existing physicists (Dirac, Minkowski, Einstein, Maxwell, Noether).

- [ ] **Step 1:** Verify the new physicists are not already present:
  ```bash
  grep -nE "slug: \"(hermann-weyl|yakir-aharonov|david-bohm|richard-feynman|chen-ning-yang|robert-mills)\"" lib/content/physicists.ts
  ```
  Expect 0 hits.

- [ ] **Step 2:** Append the 4 definite new physicist structural entries (image storage URLs follow the `storageUrl("physicists/<slug>.webp")` convention; if the avatar image isn't uploaded yet, the page renders with the default initial-circle fallback — don't block on it):

```ts
  {
    slug: "hermann-weyl",
    name: "Hermann Weyl",
    shortName: "Weyl",
    born: "1885",
    died: "1955",
    nationality: "German",
    image: storageUrl("physicists/hermann-weyl.webp"),
    relatedTopics: [
      { branchSlug: "electromagnetism", topicSlug: "gauge-theory-origins" },
    ],
  },
  {
    slug: "yakir-aharonov",
    name: "Yakir Aharonov",
    shortName: "Aharonov",
    born: "1932",
    died: null,
    nationality: "Israeli",
    image: storageUrl("physicists/yakir-aharonov.webp"),
    relatedTopics: [
      { branchSlug: "electromagnetism", topicSlug: "aharonov-bohm-effect" },
    ],
  },
  {
    slug: "david-bohm",
    name: "David Bohm",
    shortName: "Bohm",
    born: "1917",
    died: "1992",
    nationality: "American-British",
    image: storageUrl("physicists/david-bohm.webp"),
    relatedTopics: [
      { branchSlug: "electromagnetism", topicSlug: "aharonov-bohm-effect" },
    ],
  },
  {
    slug: "richard-feynman",
    name: "Richard Feynman",
    shortName: "Feynman",
    born: "1918",
    died: "1988",
    nationality: "American",
    image: storageUrl("physicists/richard-feynman.webp"),
    relatedTopics: [
      { branchSlug: "electromagnetism", topicSlug: "classical-limit-of-qed" },
    ],
  },
```

**Type note on `died`:** if the existing `Physicist` type requires `died: string` (no nullable), use the empty string `""` instead of `null`. Run `grep -n "died:" lib/content/physicists.ts | head -5` to see the convention used by other living physicists in PHYSICISTS — match it. (Most CM physicists are dead so the type may not be exercised; fall back to `""` if the type is `string` non-null.)

- [ ] **Step 3 (Yang-Mills inclusion — DEFAULT YES, see Vision section):** Append:

```ts
  {
    slug: "chen-ning-yang",
    name: "Chen-Ning Yang",
    shortName: "Yang",
    born: "1922",
    died: null,
    nationality: "Chinese-American",
    image: storageUrl("physicists/chen-ning-yang.webp"),
    relatedTopics: [
      { branchSlug: "electromagnetism", topicSlug: "gauge-theory-origins" },
    ],
  },
  {
    slug: "robert-mills",
    name: "Robert Mills",
    shortName: "Mills",
    born: "1927",
    died: "1999",
    nationality: "American",
    image: storageUrl("physicists/robert-mills.webp"),
    relatedTopics: [
      { branchSlug: "electromagnetism", topicSlug: "gauge-theory-origins" },
    ],
  },
```

If Wave 1 agent decides NOT to include Yang-Mills (Abelian-only §12.1), skip this step and the §12.1 prose treats them as a one-line forward-ref into the future QUANTUM branch.

- [ ] **Step 4:** Append §12 cross-link entries to `relatedTopics` of existing physicists (read each one, find its `relatedTopics: [...]` array, append the relevant `{ branchSlug, topicSlug }` entries):
  - **paul-dirac** (line 1037) — append `magnetic-monopoles-and-duality` (the 1931 Dirac quantization condition is THE result of §12.3).
  - **hermann-minkowski** (line 1047) — append `magnetic-monopoles-and-duality` (the dual tensor *F^{μν} that monopoles would source is a Minkowski-dual object).
  - **albert-einstein** (line 358) — append `classical-limit-of-qed` (the 1905 photon paper traces back through §12.4).
  - **james-clerk-maxwell** (line 932) — append `classical-limit-of-qed` (the closing paragraph of the entire branch is about Maxwell's equations).
  - **emmy-noether** (line 327) — append `gauge-theory-origins` (gauge symmetry → conservation of charge is THE Noether application).

- [ ] **Step 5:** Run `pnpm tsc --noEmit` — expect clean.

#### Task 1.3: Append ~13–15 glossary entries to GLOSSARY

**File:** `lib/content/glossary.ts` — insert immediately before the `];` at line 2583, after dedup against existing entries verified at plan time.

- [ ] **Step 1:** For each candidate slug below, run `grep -n "slug: \"<slug>\"" lib/content/glossary.ts` to verify it does NOT already exist:
  - `gauge-group` (concept)
  - `non-abelian-gauge` (concept) — only if Yang-Mills is included
  - `yang-mills-equations` (concept) — only if Yang-Mills is included
  - `aharonov-bohm-phase` (concept)
  - `electron-interference` (phenomenon) — decide at author time whether to add or fold into the existing `interference` (§09); prefer fold-in via cross-link
  - `dirac-quantization-condition` (concept)
  - `electromagnetic-duality` (concept) — match spec naming; NOT `em-duality`
  - `coherent-state` (concept)
  - `running-coupling` (concept)
  - `anomalous-magnetic-moment` (concept)
  - `classical-limit-of-qed` (concept) — backfill: prose lives in Supabase only after Wave 3
  - **Backfill (existing in Supabase, missing from glossary.ts):**
    - `gauge-invariance` (concept)
    - `gauge-theory-origins` (concept)
    - `aharonov-bohm-effect` (concept)
    - `magnetic-monopole` (concept)

- [ ] **Step 2:** For each slug NOT already present in glossary.ts, append a structural entry with topic-cross-link only (Wave 3 seed-em-08 fills in the prose):

```ts
  {
    slug: "gauge-group",
    category: "concept",
    relatedTopics: [
      { branchSlug: "electromagnetism", topicSlug: "gauge-theory-origins" },
    ],
  },
  {
    slug: "aharonov-bohm-phase",
    category: "concept",
    relatedTopics: [
      { branchSlug: "electromagnetism", topicSlug: "aharonov-bohm-effect" },
    ],
  },
  {
    slug: "dirac-quantization-condition",
    category: "concept",
    relatedTopics: [
      { branchSlug: "electromagnetism", topicSlug: "magnetic-monopoles-and-duality" },
    ],
  },
  {
    slug: "electromagnetic-duality",
    category: "concept",
    relatedTopics: [
      { branchSlug: "electromagnetism", topicSlug: "magnetic-monopoles-and-duality" },
    ],
  },
  {
    slug: "coherent-state",
    category: "concept",
    relatedTopics: [
      { branchSlug: "electromagnetism", topicSlug: "classical-limit-of-qed" },
    ],
  },
  {
    slug: "running-coupling",
    category: "concept",
    relatedTopics: [
      { branchSlug: "electromagnetism", topicSlug: "classical-limit-of-qed" },
    ],
  },
  {
    slug: "anomalous-magnetic-moment",
    category: "concept",
    relatedTopics: [
      { branchSlug: "electromagnetism", topicSlug: "classical-limit-of-qed" },
    ],
  },
  {
    slug: "classical-limit-of-qed",
    category: "concept",
    relatedTopics: [
      { branchSlug: "electromagnetism", topicSlug: "classical-limit-of-qed" },
    ],
  },
  // Backfill entries (existing in Supabase, missing from glossary.ts):
  {
    slug: "gauge-invariance",
    category: "concept",
    relatedTopics: [
      { branchSlug: "electromagnetism", topicSlug: "gauge-theory-origins" },
      { branchSlug: "electromagnetism", topicSlug: "four-potential-and-em-lagrangian" },
    ],
  },
  {
    slug: "gauge-theory-origins",
    category: "concept",
    relatedTopics: [
      { branchSlug: "electromagnetism", topicSlug: "gauge-theory-origins" },
    ],
  },
  {
    slug: "aharonov-bohm-effect",
    category: "phenomenon",
    relatedTopics: [
      { branchSlug: "electromagnetism", topicSlug: "aharonov-bohm-effect" },
    ],
  },
  {
    slug: "magnetic-monopole",
    category: "concept",
    relatedTopics: [
      { branchSlug: "electromagnetism", topicSlug: "magnetic-monopoles-and-duality" },
    ],
  },
```

If Yang-Mills is included, also append:
```ts
  {
    slug: "non-abelian-gauge",
    category: "concept",
    relatedTopics: [
      { branchSlug: "electromagnetism", topicSlug: "gauge-theory-origins" },
    ],
  },
  {
    slug: "yang-mills-equations",
    category: "concept",
    relatedTopics: [
      { branchSlug: "electromagnetism", topicSlug: "gauge-theory-origins" },
    ],
  },
```

- [ ] **Step 3:** For the **already-existing** entries in glossary.ts that need §12 cross-links, append §12 topics to their `relatedTopics` arrays (read each, find the array, append):
  - `gauge-transformation` (line ~1654) → append `gauge-theory-origins`, `aharonov-bohm-effect`
  - `noethers-theorem` → append `gauge-theory-origins`
  - `lorenz-gauge` → append `gauge-theory-origins` (only if §12.1 prose calls it; otherwise skip)
  - `four-potential` (line ~2569) → append `gauge-theory-origins`, `aharonov-bohm-effect`
  - `electromagnetic-field-tensor` (line ~2547) → append `magnetic-monopoles-and-duality`
  - `dual-field-tensor` (line ~2555) → append `magnetic-monopoles-and-duality`
  - `four-current` (line ~2507) → append `classical-limit-of-qed` (only if §12.4 prose uses J^μ; otherwise skip)
  - `interference` (from §09) → append `aharonov-bohm-effect` (electron interference IS the AB experimental setup)

- [ ] **Step 4:** Run `pnpm tsc --noEmit` — expect clean.

#### Task 1.4: Create `lib/physics/electromagnetism/gauge-theory.ts` (§12.1)

**File:** `lib/physics/electromagnetism/gauge-theory.ts` (NEW)

- [ ] **Step 1:** Write the file:

```ts
import type { FourPotential, FourVector, FieldTensor } from "@/lib/physics/electromagnetism/relativity";

/**
 * Apply a gauge transformation A_μ → A_μ + ∂_μΛ to a four-potential.
 * Lambda gradient is supplied directly as a four-vector (∂_μΛ) since we don't
 * carry a coordinate grid here. Returns the transformed four-potential.
 *
 * Gauge invariance: F^{μν} = ∂^μ A^ν − ∂^ν A^μ is unchanged because the
 * extra ∂^μ ∂_ν Λ − ∂^ν ∂_μ Λ vanishes by symmetry of mixed partials.
 */
export function gaugeTransformation(A: FourPotential, dLambda: FourVector): FourPotential {
  return [A[0] + dLambda[0], A[1] + dLambda[1], A[2] + dLambda[2], A[3] + dLambda[3]] as const;
}

/**
 * U(1) phase rotation: ψ → e^{iθ}ψ. The local version (θ a function of spacetime)
 * forces the introduction of a gauge field A_μ that transforms as A_μ → A_μ + ∂_μθ/q.
 * This is the "minimal coupling" prescription that turns ∂_μ → D_μ = ∂_μ + iqA_μ.
 *
 * Operates on a complex number represented as { re, im }.
 */
export function u1PhaseRotation(
  psi: { re: number; im: number },
  theta: number,
): { re: number; im: number } {
  const c = Math.cos(theta);
  const s = Math.sin(theta);
  return { re: psi.re * c - psi.im * s, im: psi.re * s + psi.im * c };
}

/**
 * Non-Abelian commutator [A_μ, A_ν] computed component-wise as a 4×4 matrix difference.
 * For Abelian U(1) this returns the zero tensor; for SU(N) gauge theories the commutator
 * is non-zero and contributes to the field strength F^{a}_{μν} = ∂_μ A^a_ν − ∂_ν A^a_μ
 * + g·f^{abc} A^b_μ A^c_ν. We don't carry the structure constants f^{abc} here; this
 * helper just gestures at the commutator structure.
 *
 * Used by §12.1 NonAbelianGestureScene to visualize that [A_μ, A_ν] ≠ 0 in non-Abelian
 * theories, in contrast to the Abelian case where every gauge field commutes with every other.
 */
export function nonAbelianCommutator(A: FieldTensor, B: FieldTensor): FieldTensor {
  const result: number[][] = [
    [0, 0, 0, 0],
    [0, 0, 0, 0],
    [0, 0, 0, 0],
    [0, 0, 0, 0],
  ];
  for (let i = 0; i < 4; i++) {
    for (let j = 0; j < 4; j++) {
      let abij = 0;
      let baij = 0;
      for (let k = 0; k < 4; k++) {
        abij += A[i][k] * B[k][j];
        baij += B[i][k] * A[k][j];
      }
      result[i][j] = abij - baij;
    }
  }
  return [
    [result[0][0], result[0][1], result[0][2], result[0][3]],
    [result[1][0], result[1][1], result[1][2], result[1][3]],
    [result[2][0], result[2][1], result[2][2], result[2][3]],
    [result[3][0], result[3][1], result[3][2], result[3][3]],
  ] as const;
}
```

- [ ] **Step 2:** Write `tests/physics/electromagnetism/gauge-theory.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import {
  gaugeTransformation,
  u1PhaseRotation,
  nonAbelianCommutator,
} from "@/lib/physics/electromagnetism/gauge-theory";
import type { FieldTensor } from "@/lib/physics/electromagnetism/relativity";

describe("gauge-theory", () => {
  describe("gaugeTransformation", () => {
    it("adds ∂_μΛ component-wise", () => {
      const A = [1, 2, 3, 4] as const;
      const dLambda = [0.1, 0.2, 0.3, 0.4] as const;
      const Aprime = gaugeTransformation(A, dLambda);
      expect(Aprime).toEqual([1.1, 2.2, 3.3, 4.4]);
    });
  });

  describe("u1PhaseRotation", () => {
    it("rotates by θ in the complex plane", () => {
      const psi = { re: 1, im: 0 };
      const rot = u1PhaseRotation(psi, Math.PI / 2);
      expect(rot.re).toBeCloseTo(0, 12);
      expect(rot.im).toBeCloseTo(1, 12);
    });

    it("preserves |psi|^2 (probability)", () => {
      const psi = { re: 0.6, im: 0.8 };
      const rot = u1PhaseRotation(psi, 1.337);
      const norm2 = rot.re * rot.re + rot.im * rot.im;
      expect(norm2).toBeCloseTo(1, 12);
    });
  });

  describe("nonAbelianCommutator", () => {
    it("returns zero tensor for two diagonal (Abelian-like) tensors", () => {
      const A: FieldTensor = [
        [1, 0, 0, 0],
        [0, 2, 0, 0],
        [0, 0, 3, 0],
        [0, 0, 0, 4],
      ];
      const B: FieldTensor = [
        [5, 0, 0, 0],
        [0, 6, 0, 0],
        [0, 0, 7, 0],
        [0, 0, 0, 8],
      ];
      const comm = nonAbelianCommutator(A, B);
      for (let i = 0; i < 4; i++) {
        for (let j = 0; j < 4; j++) {
          expect(comm[i][j]).toBeCloseTo(0, 12);
        }
      }
    });

    it("is non-zero for two non-commuting tensors (e.g. Pauli-like rotations in upper-left 2×2)", () => {
      const A: FieldTensor = [
        [0, 1, 0, 0],
        [1, 0, 0, 0],
        [0, 0, 0, 0],
        [0, 0, 0, 0],
      ];
      const B: FieldTensor = [
        [0, 0, 0, 0],
        [0, 0, 1, 0],
        [0, 1, 0, 0],
        [0, 0, 0, 0],
      ];
      const comm = nonAbelianCommutator(A, B);
      const allZero = comm.every((row) => row.every((v) => Math.abs(v) < 1e-12));
      expect(allZero).toBe(false);
    });
  });
});
```

- [ ] **Step 3:** Run `pnpm vitest run tests/physics/electromagnetism/gauge-theory.test.ts` — expect 4 tests pass.

#### Task 1.5: Create `lib/physics/electromagnetism/aharonov-bohm.ts` (§12.2)

**File:** `lib/physics/electromagnetism/aharonov-bohm.ts` (NEW)

- [ ] **Step 1:** Write the file:

```ts
import { ELEMENTARY_CHARGE, H_BAR, PLANCK_CONSTANT } from "@/lib/physics/constants";

/**
 * Aharonov-Bohm phase for a charge q traversing a closed loop enclosing magnetic flux Φ_B.
 *   Φ_AB = (q/ℏ) ∮ A·dℓ = (q/ℏ) Φ_B
 * The phase is gauge-invariant in detail (the loop integral of a pure-gauge ∂_μΛ
 * vanishes). Returns the phase in radians.
 */
export function aharonovBohmPhase(charge: number, fluxEnclosed: number): number {
  return (charge * fluxEnclosed) / H_BAR;
}

/**
 * Magnetic flux quantum Φ_0 = h / |q|. For an electron (q = e) this is the
 * superconducting flux quantum Φ_0 = h/e ≈ 4.14×10^{−15} Wb (Cooper-pair version
 * uses 2e in the denominator, halving it). Adding Φ_0 to the enclosed flux
 * shifts the AB phase by 2π — the fringe pattern returns to the original position.
 */
export function fluxQuantum(charge: number): number {
  return PLANCK_CONSTANT / Math.abs(charge);
}

/**
 * Two-slit interference pattern intensity I(x) on a screen at distance L,
 * with slit spacing d, electron de Broglie wavelength λ, and an additional
 * relative phase shift φ between the two paths (the AB phase).
 *
 *   I(x) = I_0 · 4 cos²(π d x / (λ L) + φ/2)
 *
 * Up to overall normalization. Returns a callable I(x) for ergonomic use in scenes.
 */
export function interferencePattern(
  slitSpacing: number,
  screenDistance: number,
  wavelength: number,
  phaseShift: number,
): (x: number) => number {
  const k = (Math.PI * slitSpacing) / (wavelength * screenDistance);
  return (x: number) => {
    const arg = k * x + phaseShift / 2;
    const c = Math.cos(arg);
    return 4 * c * c;
  };
}

/**
 * Convenience: AB phase shift expressed in units of the flux quantum Φ_0,
 * so callers can drive a slider in Φ_0 units and feed the result into
 * interferencePattern's phaseShift argument.
 */
export function abPhaseFromFluxRatio(fluxRatio: number, charge: number): number {
  // Φ_AB = (q/ℏ)·(fluxRatio·Φ_0) = (q/ℏ)·fluxRatio·(h/q) = fluxRatio·2π
  void charge;
  return fluxRatio * 2 * Math.PI;
}

export { ELEMENTARY_CHARGE };
```

- [ ] **Step 2:** Write `tests/physics/electromagnetism/aharonov-bohm.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import {
  aharonovBohmPhase,
  fluxQuantum,
  interferencePattern,
  abPhaseFromFluxRatio,
} from "@/lib/physics/electromagnetism/aharonov-bohm";
import { ELEMENTARY_CHARGE, PLANCK_CONSTANT, H_BAR } from "@/lib/physics/constants";

describe("aharonov-bohm", () => {
  it("AB phase Φ = qΦ_B/ℏ", () => {
    const phase = aharonovBohmPhase(ELEMENTARY_CHARGE, 1e-15);
    expect(phase).toBeCloseTo((ELEMENTARY_CHARGE * 1e-15) / H_BAR, 6);
  });

  it("flux quantum Φ_0 = h/e ≈ 4.14e-15 Wb", () => {
    const phi0 = fluxQuantum(ELEMENTARY_CHARGE);
    expect(phi0).toBeCloseTo(PLANCK_CONSTANT / ELEMENTARY_CHARGE, 12);
    expect(phi0).toBeCloseTo(4.135667696e-15, 6);
  });

  it("AB phase from one flux quantum equals 2π", () => {
    expect(abPhaseFromFluxRatio(1, ELEMENTARY_CHARGE)).toBeCloseTo(2 * Math.PI, 12);
  });

  it("AB phase from half a flux quantum equals π (fringes flip)", () => {
    expect(abPhaseFromFluxRatio(0.5, ELEMENTARY_CHARGE)).toBeCloseTo(Math.PI, 12);
  });

  it("interferencePattern is 2π periodic in phaseShift", () => {
    const I0 = interferencePattern(1e-6, 1, 5e-10, 0);
    const I2pi = interferencePattern(1e-6, 1, 5e-10, 2 * Math.PI);
    expect(I0(0)).toBeCloseTo(I2pi(0), 10);
    expect(I0(5e-4)).toBeCloseTo(I2pi(5e-4), 10);
  });

  it("interferencePattern fringe inversion at φ = π (constructive ↔ destructive at x=0)", () => {
    const I0 = interferencePattern(1e-6, 1, 5e-10, 0);
    const Ipi = interferencePattern(1e-6, 1, 5e-10, Math.PI);
    // At x=0: I0(0) = 4cos²(0) = 4 (max); Ipi(0) = 4cos²(π/2) = 0 (min)
    expect(I0(0)).toBeCloseTo(4, 10);
    expect(Ipi(0)).toBeCloseTo(0, 10);
  });
});
```

- [ ] **Step 3:** Verify `H_BAR`, `PLANCK_CONSTANT`, and `ELEMENTARY_CHARGE` exist in `lib/physics/constants.ts`. Run `grep -nE "(H_BAR|PLANCK_CONSTANT|ELEMENTARY_CHARGE)" lib/physics/constants.ts`. If any is missing, add to constants.ts (CODATA values: `H_BAR = 1.054571817e-34`, `PLANCK_CONSTANT = 6.62607015e-34`, `ELEMENTARY_CHARGE = 1.602176634e-19`). Most of these have been used by §10 and §11 — expect all three to exist.

- [ ] **Step 4:** Run `pnpm vitest run tests/physics/electromagnetism/aharonov-bohm.test.ts` — expect 6 tests pass.

#### Task 1.6: Create `lib/physics/electromagnetism/monopole.ts` (§12.3)

**File:** `lib/physics/electromagnetism/monopole.ts` (NEW)

- [ ] **Step 1:** Write the file:

```ts
import { H_BAR, ELEMENTARY_CHARGE } from "@/lib/physics/constants";
import type { FieldTensor, FourCurrent } from "@/lib/physics/electromagnetism/relativity";

/**
 * Dirac quantization condition: if a magnetic monopole exists with magnetic charge g,
 * its product with any electric charge q must satisfy
 *   q g = 2π n ℏ
 * for some integer n. The smallest non-trivial monopole charge is g_D = 2πℏ/e
 * ≈ 4.14×10^{−15} Wb (= Φ_0, the magnetic flux quantum).
 *
 * Returns the product q·g and the quantum number n = qg/(2πℏ).
 */
export function diracQuantizationCondition(
  electricCharge: number,
  magneticCharge: number,
): { eg: number; n: number } {
  const eg = electricCharge * magneticCharge;
  return { eg, n: eg / (2 * Math.PI * H_BAR) };
}

/**
 * The Dirac monopole unit g_D = 2πℏ/e — the smallest magnetic charge consistent
 * with the existence of an electron of charge e. Numerically equal to Φ_0 in Wb.
 */
export function diracMonopoleUnit(): number {
  return (2 * Math.PI * H_BAR) / ELEMENTARY_CHARGE;
}

/**
 * Compute the four-divergence ∂_μ *F^{μν} of the dual field tensor.
 * In standard Maxwell: ∂_μ *F^{μν} = 0 (Faraday's law + no-monopole).
 * In a monopole-bearing theory: ∂_μ *F^{μν} = μ₀ J^ν_magnetic.
 *
 * This helper takes a precomputed dual tensor and returns the 4-divergence
 * via finite differences relative to a reference point. We don't carry a
 * spacetime grid here, so this is a pedagogical placeholder used by the
 * §12.3 scene to illustrate the structural symmetry rather than do real
 * field theory. Returns the implied magnetic-current four-vector.
 */
export function magneticChargeDensityFromTensor(
  F_dual: FieldTensor,
  // Optional gradient of dual tensor over the local cell; default zero ⇒ ∂_μ*F = 0
  gradient?: readonly [FieldTensor, FieldTensor, FieldTensor, FieldTensor],
): FourCurrent {
  if (!gradient) {
    void F_dual;
    return [0, 0, 0, 0];
  }
  const J: number[] = [0, 0, 0, 0];
  for (let nu = 0; nu < 4; nu++) {
    let sum = 0;
    for (let mu = 0; mu < 4; mu++) {
      sum += gradient[mu][mu][nu];
    }
    J[nu] = sum;
  }
  return [J[0], J[1], J[2], J[3]];
}

/**
 * Symbolic descriptor of dual Maxwell equations in the presence of monopoles.
 * Returns labels for use in the §12.3 DualMaxwellSymmetryScene.
 */
export function dualMaxwellEquationLabels(): {
  withMonopoles: { electric: string[]; magnetic: string[] };
  standard: string[];
} {
  return {
    standard: [
      "∇·E = ρ/ε₀",
      "∇·B = 0",
      "∇×E = −∂B/∂t",
      "∇×B = μ₀J + μ₀ε₀ ∂E/∂t",
    ],
    withMonopoles: {
      electric: ["∇·E = ρ_e/ε₀", "∇×B = μ₀J_e + μ₀ε₀ ∂E/∂t"],
      magnetic: ["∇·B = μ₀ρ_m", "∇×E = −μ₀J_m − ∂B/∂t"],
    },
  };
}
```

- [ ] **Step 2:** Write `tests/physics/electromagnetism/monopole.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import {
  diracQuantizationCondition,
  diracMonopoleUnit,
  magneticChargeDensityFromTensor,
  dualMaxwellEquationLabels,
} from "@/lib/physics/electromagnetism/monopole";
import { ELEMENTARY_CHARGE, H_BAR } from "@/lib/physics/constants";
import type { FieldTensor } from "@/lib/physics/electromagnetism/relativity";

describe("monopole", () => {
  it("Dirac quantization eg = n · 2πℏ for the smallest unit (n=1)", () => {
    const g = diracMonopoleUnit();
    const { eg, n } = diracQuantizationCondition(ELEMENTARY_CHARGE, g);
    expect(eg).toBeCloseTo(2 * Math.PI * H_BAR, 30);
    expect(n).toBeCloseTo(1, 12);
  });

  it("doubling the monopole charge gives n=2", () => {
    const g = 2 * diracMonopoleUnit();
    const { n } = diracQuantizationCondition(ELEMENTARY_CHARGE, g);
    expect(n).toBeCloseTo(2, 12);
  });

  it("magneticChargeDensityFromTensor returns zero for zero gradient (standard Maxwell)", () => {
    const F: FieldTensor = [
      [0, 1, 0, 0],
      [-1, 0, 0, 0],
      [0, 0, 0, 0],
      [0, 0, 0, 0],
    ];
    const J = magneticChargeDensityFromTensor(F);
    expect(J).toEqual([0, 0, 0, 0]);
  });

  it("dualMaxwellEquationLabels returns 4 standard + 2 electric + 2 magnetic strings", () => {
    const labels = dualMaxwellEquationLabels();
    expect(labels.standard).toHaveLength(4);
    expect(labels.withMonopoles.electric).toHaveLength(2);
    expect(labels.withMonopoles.magnetic).toHaveLength(2);
  });
});
```

- [ ] **Step 3:** Run `pnpm vitest run tests/physics/electromagnetism/monopole.test.ts` — expect 4 tests pass.

#### Task 1.7: Create `lib/physics/electromagnetism/qed-classical-limit.ts` (§12.4)

**File:** `lib/physics/electromagnetism/qed-classical-limit.ts` (NEW)

- [ ] **Step 1:** Write the file:

```ts
import { ALPHA_FINE, ELECTRON_MASS, SPEED_OF_LIGHT } from "@/lib/physics/constants";

/**
 * Coherent state |α⟩ photon-number statistics. Coherent states are eigenstates
 * of the annihilation operator â|α⟩ = α|α⟩ and have a Poisson distribution
 * over photon number with mean ⟨N⟩ = |α|² and variance σ² = |α|².
 * The relative fluctuation σ/⟨N⟩ = 1/|α| → 0 as |α| → ∞, which is
 * the operational meaning of "the classical limit": large amplitude
 * suppresses quantum noise.
 */
export function coherentStatePhotonStats(alpha: number): {
  meanN: number;
  varianceN: number;
  relativeFluctuation: number;
} {
  const a2 = alpha * alpha;
  const meanN = a2;
  const varianceN = a2;
  const relativeFluctuation = a2 > 0 ? 1 / Math.abs(alpha) : Infinity;
  return { meanN, varianceN, relativeFluctuation };
}

/**
 * One-loop QED running coupling at low energies (well below electroweak scale).
 *   α(E) ≈ α(0) / (1 − (α(0)/3π) ln(E²/(m_e c²)²))
 * Returns the running fine-structure constant at energy E (joules).
 *
 * At E = m_e c² returns α(0) ≈ 1/137. At E ≈ M_Z (LEP scale) returns α ≈ 1/128.
 * At asymptotically large E the perturbative formula breaks down — the Landau
 * pole sits at unphysical energies for QED proper.
 */
export function runningCouplingAlpha(energy: number): number {
  const me = ELECTRON_MASS;
  const c = SPEED_OF_LIGHT;
  const meRest = me * c * c;
  const ratio = (energy * energy) / (meRest * meRest);
  if (ratio <= 1) return ALPHA_FINE;
  const denom = 1 - (ALPHA_FINE / (3 * Math.PI)) * Math.log(ratio);
  if (denom <= 0) return Infinity;
  return ALPHA_FINE / denom;
}

/**
 * Anomalous magnetic moment of the electron at leading order: g − 2 = α/π.
 * Schwinger 1948. Numerically α/π ≈ 0.00232 / 2 ≈ 0.00116. The full QED
 * prediction goes to fifth-loop order and matches experiment to better
 * than 1 part in 10^{12} — the most precisely-tested prediction in physics.
 */
export function anomalousMagneticMomentLeadingOrder(): number {
  return ALPHA_FINE / (2 * Math.PI);
}
```

- [ ] **Step 2:** Write `tests/physics/electromagnetism/qed-classical-limit.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import {
  coherentStatePhotonStats,
  runningCouplingAlpha,
  anomalousMagneticMomentLeadingOrder,
} from "@/lib/physics/electromagnetism/qed-classical-limit";
import { ALPHA_FINE, ELECTRON_MASS, SPEED_OF_LIGHT } from "@/lib/physics/constants";

describe("qed-classical-limit", () => {
  describe("coherentStatePhotonStats", () => {
    it("mean and variance both equal |α|² (Poisson)", () => {
      const stats = coherentStatePhotonStats(10);
      expect(stats.meanN).toBe(100);
      expect(stats.varianceN).toBe(100);
    });

    it("relative fluctuation is 1/|α| — vanishes at large α", () => {
      const stats100 = coherentStatePhotonStats(100);
      const stats10000 = coherentStatePhotonStats(10000);
      expect(stats100.relativeFluctuation).toBeCloseTo(0.01, 12);
      expect(stats10000.relativeFluctuation).toBeCloseTo(0.0001, 12);
    });
  });

  describe("runningCouplingAlpha", () => {
    it("returns α(0) ≈ 1/137 at the electron mass scale", () => {
      const meRest = ELECTRON_MASS * SPEED_OF_LIGHT * SPEED_OF_LIGHT;
      expect(runningCouplingAlpha(meRest)).toBeCloseTo(ALPHA_FINE, 10);
    });

    it("returns α(0) for energies at or below electron rest mass", () => {
      const meRest = ELECTRON_MASS * SPEED_OF_LIGHT * SPEED_OF_LIGHT;
      expect(runningCouplingAlpha(0)).toBeCloseTo(ALPHA_FINE, 12);
      expect(runningCouplingAlpha(meRest / 2)).toBeCloseTo(ALPHA_FINE, 12);
    });

    it("running α at LEP scale (M_Z ≈ 91 GeV) is larger than α(0)", () => {
      const Mz_J = 91.1876e9 * 1.602176634e-19;
      const alphaMz = runningCouplingAlpha(Mz_J);
      // Expected: α(M_Z) ≈ 1/128 from full SM running; one-loop QED-only is closer
      // to 1/134, but the qualitative feature (running > α(0)) is the testable claim.
      expect(alphaMz).toBeGreaterThan(ALPHA_FINE);
    });
  });

  describe("anomalousMagneticMomentLeadingOrder", () => {
    it("returns α/(2π) — Schwinger 1948", () => {
      expect(anomalousMagneticMomentLeadingOrder()).toBeCloseTo(
        ALPHA_FINE / (2 * Math.PI),
        12,
      );
    });

    it("numerical value ≈ 0.00116", () => {
      expect(anomalousMagneticMomentLeadingOrder()).toBeCloseTo(0.00116, 5);
    });
  });
});
```

- [ ] **Step 3:** Verify `ALPHA_FINE` and `ELECTRON_MASS` exist in `lib/physics/constants.ts`. Both should exist from prior sessions (§04 used `BOHR_MAGNETON`-derived `ELECTRON_MASS`; §10 used `ALPHA_FINE` for synchrotron scaling). If either is missing, add: `ELECTRON_MASS = 9.1093837015e-31`, `ALPHA_FINE = 7.2973525693e-3`.

- [ ] **Step 4:** Run `pnpm vitest run tests/physics/electromagnetism/qed-classical-limit.test.ts` — expect 7 tests pass.

#### Task 1.8: Wave 1 commit

- [ ] **Step 1:** Run `pnpm tsc --noEmit` — expect clean.
- [ ] **Step 2:** Run `pnpm vitest run tests/physics/electromagnetism/gauge-theory.test.ts tests/physics/electromagnetism/aharonov-bohm.test.ts tests/physics/electromagnetism/monopole.test.ts tests/physics/electromagnetism/qed-classical-limit.test.ts` — expect all green.
- [ ] **Step 3:** Stage and commit:

```bash
git add lib/content/branches.ts lib/content/physicists.ts lib/content/glossary.ts \
        lib/physics/electromagnetism/gauge-theory.ts \
        lib/physics/electromagnetism/aharonov-bohm.ts \
        lib/physics/electromagnetism/monopole.ts \
        lib/physics/electromagnetism/qed-classical-limit.ts \
        tests/physics/electromagnetism/gauge-theory.test.ts \
        tests/physics/electromagnetism/aharonov-bohm.test.ts \
        tests/physics/electromagnetism/monopole.test.ts \
        tests/physics/electromagnetism/qed-classical-limit.test.ts
git commit -m "$(cat <<'EOF'
feat(em/§12): scaffold foundations — 4 topics, Weyl/Aharonov/Bohm/Feynman, glossary, libs

Wave 1 of EM Session 8 (branch-closing). Four §12 topic entries
(FIG.63–66, module: foundations), 4 (or 6 with Yang/Mills) physicists
appended to PHYSICISTS, ~13–15 new structural glossary entries (with
backfill of Session-7 Supabase-only slugs gauge-invariance,
gauge-theory-origins, aharonov-bohm-effect, magnetic-monopole and
new §12 terms gauge-group, dirac-quantization-condition,
electromagnetic-duality, coherent-state, running-coupling,
anomalous-magnetic-moment, classical-limit-of-qed,
aharonov-bohm-phase). Four physics-lib files
(gauge-theory.ts, aharonov-bohm.ts, monopole.ts,
qed-classical-limit.ts) with vitest coverage.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

### Wave 2 — Per-topic authoring

**Purpose:** Author 4 topics in parallel under the contract above. Each agent produces: physics-lib augmentation (if needed beyond the Wave-1 scaffold) + 3 scene components + page.tsx + content.en.mdx + handoff block.

**4 subagents in parallel. NO commits, NO publishes, NO registry edits.**

#### Task 2.1 — §12.1 `gauge-theory-origins`

**Files (created by agent):**
- `app/[locale]/(topics)/electromagnetism/gauge-theory-origins/page.tsx`
- `app/[locale]/(topics)/electromagnetism/gauge-theory-origins/content.en.mdx`
- `components/physics/u1-phase-rotation-scene.tsx`
- `components/physics/gauge-symmetry-to-conservation-scene.tsx`
- `components/physics/non-abelian-gesture-scene.tsx` (or `gauge-as-template-scene.tsx` if §12.1 stays Abelian-only)

**Topic angle:** Weyl in 1918 tried to unify gravity and EM by letting *length scales* rescale point-to-point. Einstein flat-out rejected it ("the rod and clock problem"). In 1929, with quantum mechanics in hand, Weyl reused the same idea on the *phase* of the wave function and it worked: requiring local invariance under ψ → e^{iθ(x)}ψ forces the introduction of a gauge field that transforms as A_μ → A_μ + ∂_μθ/q — exactly the gauge freedom Maxwell's equations had been carrying around since the 1860s. The U(1) gauge symmetry of QED is Weyl's. In 1954 Yang and Mills generalized to non-Abelian groups SU(N): the same recipe but now with non-commuting generators, producing the equations that govern the weak (SU(2)) and strong (SU(3)) forces. **The voice payoff:** "every fundamental force is a gauge theory; we just got to U(1) first."

**Voice anchor (closer):** *"Gauge theory became the template; the Standard Model is the cathedral built from it."*

**MDX shape (target 1100–1300 words, 5 sections, 3 SceneCards, 4–5 EquationBlocks):**
- §1 The setup — Maxwell's gauge freedom A_μ → A_μ + ∂_μΛ has been hiding in plain sight since 1865. What does it *mean*?
- §2 Weyl 1918 → 1929 — historical hook. Length-rescaling fails; phase-rescaling succeeds. ψ → e^{iθ(x)}ψ. **U1PhaseRotationScene** animates a complex wave function rotating in the complex plane; toggle between global (single rotation) and local (point-by-point rotation that requires the compensating A_μ).
- §3 Local symmetry forces a connection — derivation: if θ depends on x, ∂_μψ → e^{iθ}(∂_μψ + iψ∂_μθ); to recover covariance, replace ∂_μ with the covariant derivative D_μ = ∂_μ + iqA_μ, where A_μ transforms as A_μ → A_μ − ∂_μθ/q. The gauge field is *required* by the local symmetry. EquationBlock with the U(1) covariant-derivative form.
- §4 Noether → charge conservation — Noether's theorem applied to the U(1) symmetry yields ∂_μJ^μ = 0. **GaugeSymmetryToConservationScene** shows the symmetry on the left and the conserved current on the right; they animate together. **`<PhysicistLink slug="emmy-noether" />`** carries the result.
- §5 Yang-Mills 1954 — non-Abelian generalization. SU(N): generators T^a don't commute, F^a_{μν} = ∂_μA^a_ν − ∂_νA^a_μ + g·f^{abc}A^b_μA^c_ν, the structure constants make the field self-coupling. **NonAbelianGestureScene** OR **GaugeAsTemplateScene** depending on inclusion decision. **`<PhysicistLink slug="chen-ning-yang" />`** + **`<PhysicistLink slug="robert-mills" />`** if included; otherwise plain text mention. Voice: "the same recipe — locally rotate something, build the gauge field that compensates — applied to SU(2) gives the weak force, applied to SU(3) gives the strong. The Standard Model is gauge theories all the way down."
- §6 Closer (~150 words). Land on the closer above. **Forward-ref to QUANTUM:** "when we get to QUANTUM, we will see that gauge theory is not a feature of electromagnetism — it is the structure of every force the universe knows about."

**Physics lib:** Reuse `gaugeTransformation`, `u1PhaseRotation`, `nonAbelianCommutator` from Wave 1's `gauge-theory.ts`. No new lib code expected; if the §12.1 scenes need a small helper (e.g., a function returning the SU(2) Pauli matrices or SU(3) Gell-Mann matrices for `NonAbelianGestureScene`), add it to `gauge-theory.ts` with a `// TODO: optional, scene-only` comment.

**Cross-link discipline:** **`<Term slug="gauge-invariance" />`** (existing, full prose post-Session-7), **`<Term slug="gauge-theory-origins" />`** (this topic itself — only used in glossary index links, not in body), **`<Term slug="gauge-group" />`** (Wave 1 added structural; Wave 3 seeds prose), **`<Term slug="non-abelian-gauge" />`** (only if Yang-Mills included). **`<PhysicistLink slug="hermann-weyl" />`** (Wave 1), **`<PhysicistLink slug="emmy-noether" />`** (existing).

#### Task 2.2 — §12.2 `aharonov-bohm-effect` — **MONEY SHOT**

**Files (created by agent):**
- `app/[locale]/(topics)/electromagnetism/aharonov-bohm-effect/page.tsx`
- `app/[locale]/(topics)/electromagnetism/aharonov-bohm-effect/content.en.mdx`
- `components/physics/two-slit-with-solenoid-scene.tsx`
- `components/physics/flux-phase-shift-fringes-scene.tsx`
- `components/physics/field-free-electron-paths-scene.tsx`

**Topic angle: the most direct experimental evidence that the potential, not the field, is the real object.** Two-slit electron interference, with a thin shielded solenoid centered between the slits. The B-field is confined to the solenoid interior; the electrons pass through field-free regions on either side. Yet when the solenoid is energized, the entire fringe pattern shifts laterally by the AB phase Φ = (q/ℏ)Φ_B. The shift is observable, periodic in Φ_B with period Φ_0 = h/q, and zero when the solenoid is off. **Confirmed experimentally by Tonomura (1986)** with electron holography around a superconducting toroid — the toroid trapped flux in quanta of Φ_0/2 (Cooper-pair flux quantum) and Tonomura's images showed the predicted phase pattern, settling the question of whether the AB effect is real (it is) and whether the potential is gauge-equivalent to the field (it is not — the potential carries phase information the field does not).

**Voice anchor (closer):** *"The potential is not auxiliary; it is the real object — and quantum mechanics is the proof."*

**Visualization specification — the click moment (TwoSlitWithSolenoidScene):**
- Geometry top-down: electron source at left, two slits in a vertical screen, second screen at right showing fringe pattern.
- Solenoid drawn as a small circle centered between the two slits (perpendicular to the page, so we see its cross-section). B-field arrows INSIDE the solenoid (cyan, into the page, only inside the circle). NO field outside.
- Two electron paths drawn as faint **amber** traces from source through each slit, threading either side of the solenoid, converging on the screen. **The paths are visibly in field-free regions** — this is the visual point.
- Toggle: solenoid ON / OFF. With OFF, fringes are centered at x=0; with ON at Φ_B > 0, fringes shift laterally. Numerical readout shows Φ_B in units of Φ_0 and the phase shift in radians.
- Slider: enclosed flux Φ_B/Φ_0 from 0 to 2 (visualizes one full periodic return).
- Sub-scene: **FluxPhaseShiftFringesScene** — animates the fringe pattern alone with the slider, showing the periodic shift. Add a faint amber-yellow ghost overlay of the OFF (Φ_B = 0) pattern so the eye sees the shift relative to baseline.
- Sub-scene: **FieldFreeElectronPathsScene** — zoom in on one electron path, showing it stays at radius r > r_solenoid throughout. Animate a single electron traversal. Optional: show the line integral ∮ A·dℓ accumulating along the path.

**MDX shape (target 1300–1500 words):**
- §1 The thought experiment — Aharonov and Bohm, 1959, asked: what happens if you put a shielded solenoid between two slits? The classical EM answer is "nothing — the electrons don't see any field." The quantum answer is "the fringe pattern shifts."
- §2 The phase — the AB phase comes from the line integral of the four-potential along the path: Φ = (q/ℏ)∮A·dℓ. By Stokes' theorem, ∮A·dℓ = ∬B·dA = Φ_B (the enclosed flux). EquationBlock with the AB phase formula. Connect to `<Term slug="four-potential" />` (existing) and `<Term slug="aharonov-bohm-phase" />` (Wave 1).
- §3 Why this matters — gauge invariance is not violated: the AB phase IS gauge-invariant (the loop integral of a pure-gauge ∂_μΛ vanishes). What's NOT gauge-invariant is the LOCAL value of A_μ along any single path — but that's not what the experiment measures. The experiment measures the loop integral, which is gauge-invariant and physical. The potential is more than the field.
- §4 The visualization — TwoSlitWithSolenoidScene + FluxPhaseShiftFringesScene side by side. Slider on enclosed flux. The "click" moment: the ghost overlay shows the unshifted pattern; the active pattern slides smoothly past it as flux increases. At Φ_B = Φ_0/2, fringes flip (constructive at x=0 becomes destructive). At Φ_B = Φ_0, fringes return.
- §5 The 1986 confirmation — Tonomura's electron-holography experiment with a superconducting toroid that Meissner-trapped flux. The toroid had to be inside a Permalloy shield AND in a superconducting state to ensure the field really was zero outside (any leakage would muddy the result). The confirmation was unambiguous. **`<PhysicistLink slug="yakir-aharonov" />`** (Wave 1), **`<PhysicistLink slug="david-bohm" />`** (Wave 1) — name them separately per the name-pair discipline above. The 1959 paper. Mention Tonomura by name in plain text (no PhysicistLink — Tonomura is not added to PHYSICISTS this session).
- §6 Closer (~150 words). Land on the closer above. **Forward-ref to QUANTUM:** "the AB effect is the cleanest pedagogical entry-point into how gauge theories actually work — the path-integral approach, when we get to QUANTUM, makes it natural rather than mysterious."

**Physics lib:** Reuse `aharonovBohmPhase`, `fluxQuantum`, `interferencePattern`, `abPhaseFromFluxRatio` from Wave 1's `aharonov-bohm.ts`. No new lib code expected. If `FluxPhaseShiftFringesScene` needs a phase-to-screen-position mapping helper, add it to `aharonov-bohm.ts`.

**Cross-link discipline:** **`<Term slug="aharonov-bohm-phase" />`**, **`<Term slug="aharonov-bohm-effect" />`** (this topic, used in glossary index), **`<Term slug="four-potential" />`**, **`<Term slug="gauge-invariance" />`**, **`<Term slug="interference" />`** (existing from §09 — cross-link the §12.2 case to the §09 baseline). **`<PhysicistLink slug="yakir-aharonov" />`**, **`<PhysicistLink slug="david-bohm" />`**.

**Cross-ref to §03.4 the-vector-potential:** Session 2's `the-vector-potential` topic gestured at the AB setup ("A non-zero outside solenoid where B=0 — Aharonov-Bohm setup"). §12.2 IS the landing of that gesture. Use a plain markdown link `[the-vector-potential](/en/electromagnetism/the-vector-potential)` near the start of §1 — closes the loop the branch opened in Session 2.

#### Task 2.3 — §12.3 `magnetic-monopoles-and-duality`

**Files (created by agent):**
- `app/[locale]/(topics)/electromagnetism/magnetic-monopoles-and-duality/page.tsx`
- `app/[locale]/(topics)/electromagnetism/magnetic-monopoles-and-duality/content.en.mdx`
- `components/physics/dual-tensor-and-monopole-source-scene.tsx`
- `components/physics/dirac-quantization-condition-scene.tsx`
- `components/physics/dual-maxwell-symmetry-scene.tsx`

**Topic angle:** The dual tensor *F^{μν} = ½ε^{μνρσ}F_{ρσ} swaps E ↔ cB (up to signs). In standard Maxwell, ∂_μ*F^{μν} = 0 (Faraday + no-monopole). If magnetic monopoles existed, that zero on the right-hand side would be a magnetic four-current J^ν_m. The Maxwell equations would become symmetric: electric monopoles source F^{μν}, magnetic monopoles source *F^{μν}. **Dirac's 1931 result:** if even ONE monopole exists anywhere in the universe, the existence of an electron forces electric charge to come in integer multiples of e, where e·g_min = 2πℏ. The argument: a charged particle's wave function in a monopole's vector potential acquires an integer-valued multiple of 2π around any closed loop, and the Wu-Yang fiber-bundle construction shows this requires the magnetic charge to be quantized. **We have not found a monopole.** Polyakov-'t Hooft showed in 1974 that GUT theories generically *predict* monopoles (as topological solitons in the Higgs vacuum), so the absence of observation is itself a constraint on cosmology (the "monopole problem" was one of the original motivations for inflation). **Voice payoff:** "Dirac proved monopoles are *allowed*. We still haven't proved they exist."

**Voice anchor (closer):** *"We have not found one. We have not ruled them out. Dirac showed they would not break anything."*

**MDX shape (target 1100–1300 words):**
- §1 The asymmetry of Maxwell — ∇·E = ρ/ε₀ vs ∇·B = 0. Why? **DualMaxwellSymmetryScene** shows the four equations side-by-side; the left column has electric sources, the right column is empty. The asymmetry is the open invitation.
- §2 The dual tensor — define *F^{μν} = ½ε^{μνρσ}F_{ρσ}. EquationBlock with the dual definition. The duality swap: under E → cB, cB → −E, F → *F. **DualTensorAndMonopoleSourceScene** animates F → *F via the E↔cB swap; show how ∂_μ*F^{μν} = 0 in standard Maxwell and what the right-hand side would look like with monopoles. The dual tensor is the densest LaTeX in the topic — use the block-content `$$$$` form.
- §3 Dirac 1931 — the quantization argument. A monopole's vector potential cannot be globally smooth (the famous "Dirac string" singularity, or in modern fiber-bundle language two patches glued by a U(1) transition function). For the wave function to be single-valued, the loop phase ∮A·dℓ must be a multiple of 2π·ℏ/q, which forces eg = 2πnℏ. **DiracQuantizationConditionScene** visualizes the integer-n constraint with a slider on g; at g = g_D the quantization is satisfied (n=1), at intermediate values it fails. **`<PhysicistLink slug="paul-dirac" />`** (existing). **`<Term slug="dirac-quantization-condition" />`** (Wave 1).
- §4 What it would mean — if even one monopole exists, charge IS quantized. We observe charge to be quantized (e is the universal unit). This is suggestive. It is not proof. The cosmological monopole problem is a genuine theoretical challenge: GUT phase transitions produce monopoles at densities far above the observed limit, and inflation is one resolution.
- §5 The search — MoEDAL at the LHC, Cabrera 1982 (the famous single-event detection that was never reproduced), IceCube searches, MACRO. We have not found one. The current limits on monopole flux are extraordinarily tight. **`<Term slug="electromagnetic-duality" />`** (Wave 1), **`<Term slug="magnetic-monopole" />`** (this topic).
- §6 Closer (~150 words). Land on the closer above. **Forward-ref to QUANTUM:** "the monopole-as-soliton picture is a quantum-field-theory story. We will see in QUANTUM that whether monopoles exist is a question about the structure of the vacuum."

**Physics lib:** Reuse `diracQuantizationCondition`, `diracMonopoleUnit`, `magneticChargeDensityFromTensor`, `dualMaxwellEquationLabels` from Wave 1's `monopole.ts`. Reuse `dualTensor` from `relativity.ts`.

**Cross-link discipline:** **`<Term slug="electromagnetic-field-tensor" />`** (existing from §11.3), **`<Term slug="dual-field-tensor" />`** (existing from §11.3), **`<Term slug="dirac-quantization-condition" />`** (Wave 1), **`<Term slug="electromagnetic-duality" />`** (Wave 1), **`<Term slug="magnetic-monopole" />`** (Wave 1 backfill structural; Wave 3 promotes prose), **`<PhysicistLink slug="paul-dirac" />`** (existing), **`<PhysicistLink slug="hermann-minkowski" />`** (existing — append §12.3 to his relatedTopics in Wave 1; the dual is a Minkowski-dual structure).

**Cross-ref to §07.2 the-four-equations:** the no-monopole law ∇·B = 0 lives in §07.2; §12.3 IS the topic that asks "what changes if we drop it?" Use a plain markdown link near the start of §1.

#### Task 2.4 — §12.4 `classical-limit-of-qed` — **CLOSING**

**Files (created by agent):**
- `app/[locale]/(topics)/electromagnetism/classical-limit-of-qed/page.tsx`
- `app/[locale]/(topics)/electromagnetism/classical-limit-of-qed/content.en.mdx`
- `components/physics/coherent-state-poisson-scene.tsx`
- `components/physics/photon-number-to-classical-field-scene.tsx`
- `components/physics/running-coupling-and-corrections-scene.tsx`

**Topic angle: the LAST topic of the LAST module of the LAST session of the EM branch.** Treat it accordingly.

**Voice anchor (closer): the closing paragraph of the entire branch.** Per spec, adapted:

> Maxwell wrote four equations. They survived Lorentz, who showed they were not Galilean. They survived Einstein, who rewrote them as one tensor. They survived Dirac, who quantized the field they describe. They survived Feynman, who calculated the small corrections they cannot. The classical theory is incomplete — but it is consistent, and it is the language every successor theory had to learn to speak. The next branch is QUANTUM. We will see them again.

The agent adapts the wording at author time. Preserve the cadence. **This is the line the reader screenshots.** Don't undersell. Don't over-decorate. Don't make it grandiose — Maxwell wrote four equations; the rest just survived.

**MDX shape (target 1300–1500 words):**
- §1 The historical inversion — Feynman's *Lectures on Physics* derives Maxwell's equations FROM the photon, not the other way around. The classical theory is what you GET when you take quantum electrodynamics and let the photon number become enormous. **`<PhysicistLink slug="richard-feynman" />`** (Wave 1).
- §2 Coherent states — |α⟩ are eigenstates of the annihilation operator â|α⟩ = α|α⟩. Their photon-number distribution is Poisson with mean ⟨N⟩ = |α|². **CoherentStatePoissonScene** shows the Poisson distribution as a slider on |α|; at small α the distribution is broad and quantum, at large α it becomes a sharp spike at ⟨N⟩. **`<Term slug="coherent-state" />`** (Wave 1).
- §3 The classical limit — the expectation value of the field operator in a coherent state is the classical EM field; the relative quantum fluctuation is 1/√⟨N⟩, vanishing as |α| → ∞. **PhotonNumberToClassicalFieldScene** shows a coherent state's field operator expectation value as the underlying classical wave with a noise envelope that shrinks as |α|² grows. EquationBlock with ⟨α|Ê|α⟩ = ε(x,t)_classical. The radio you listen to has |α|² ~ 10^20; you do not see Poisson noise.
- §4 Two corrections — Lamb shift (1947, Bethe's calculation, Welton's intuitive picture) and the anomalous magnetic moment g − 2 = α/π + O(α²). The latter is the most precisely-tested prediction in physics, agreeing with experiment to better than 1 part in 10^{12}. **RunningCouplingAndCorrectionsScene** shows g − 2 as a function of loop order, converging to the experimental value; on a second axis it shows α(E) running with energy. **`<Term slug="anomalous-magnetic-moment" />`** (Wave 1), **`<Term slug="running-coupling" />`** (Wave 1).
- §5 Where it breaks — the Landau pole at unphysical energy in QED proper, the embedding into electroweak theory at the M_Z scale, asymptotic freedom in QCD as the contrasting case. The classical theory is not just incomplete — even the *quantum* theory is incomplete; QED is an effective field theory valid below the electroweak scale.
- §6 **The closing paragraph** (~250 words). Land on the closer. Don't rush. The cadence is: name a successor; name what they did to Maxwell; repeat. Lorentz → not Galilean. Einstein → one tensor. Dirac → quantized. Feynman → small corrections. Then the consistency line. Then QUANTUM. **`<PhysicistLink slug="albert-einstein" />`** (existing), **`<PhysicistLink slug="james-clerk-maxwell" />`** (existing), **`<PhysicistLink slug="paul-dirac" />`** (existing — already in §12.3), **`<PhysicistLink slug="richard-feynman" />`** (Wave 1).

**Physics lib:** Reuse `coherentStatePhotonStats`, `runningCouplingAlpha`, `anomalousMagneticMomentLeadingOrder` from Wave 1's `qed-classical-limit.ts`. If `CoherentStatePoissonScene` needs a Poisson PMF helper for plotting, add `poissonProbability(n: number, mean: number): number` to `qed-classical-limit.ts` (using log-gamma to avoid overflow at large n).

**Cross-link discipline:** **`<Term slug="coherent-state" />`** (Wave 1), **`<Term slug="anomalous-magnetic-moment" />`** (Wave 1), **`<Term slug="running-coupling" />`** (Wave 1), **`<Term slug="classical-limit-of-qed" />`** (this topic, used in glossary index). **`<PhysicistLink slug="richard-feynman" />`** (Wave 1), **`<PhysicistLink slug="albert-einstein" />`** (existing), **`<PhysicistLink slug="james-clerk-maxwell" />`** (existing), **`<PhysicistLink slug="paul-dirac" />`** (existing).

**Cross-ref to §08 plane-waves-and-polarization:** plane waves are the classical limit of photon coherent states — link to §08.2 in §3 for the bridge. **Cross-ref to §10.1 larmor-formula:** Larmor radiation is the classical limit of single-photon spontaneous emission (Einstein's A and B coefficients in the classical limit) — link to §10.1 in §4.

**SPECIAL DISCIPLINE: §12.4 is the LAST topic of the branch.** Brief the agent on this. The closing paragraph carries the entire 8-session arc. The agent must read the §11.5 closer (the `four-potential-and-em-lagrangian` topic, shipped Session 7) before authoring §12.4 to harmonize cadence. If the §11.5 closer can be retrieved from `git show 36fd378:app/[locale]/(topics)/electromagnetism/four-potential-and-em-lagrangian/content.en.mdx`, do so. (Commit `36fd378` from the recent commits header is the §11.5 ship commit.)

#### Task 2.5 — Wave 2 verification gate

**Orchestrator runs after all 4 agents return:**

- [ ] Run `pnpm tsc --noEmit` — expect clean across all 4 topic-agent file sets. If any agent's lib uses a local fallback type for `FieldTensor` / `FourPotential` / `Vec4`, reconcile to the canonical import from `@/lib/physics/electromagnetism/relativity`.
- [ ] Run `pnpm vitest run tests/physics/electromagnetism/` — expect all green (existing Sessions 1–7 tests + 4 new test files from Wave 1).
- [ ] Inspect the §12.3 agent's content.en.mdx for tensor LaTeX correctness — the dual `*F^{μν} = ½ε^{μνρσ}F_{ρσ}` is the dense one. Confirm block-content `$$…$$` form is used.
- [ ] Inspect the §12.4 agent's closing paragraph (§6 of content.en.mdx). Verify it lands on the cadence anchor above. If the closer feels grandiose, tacked-on, or under-baked, send the agent back with a one-line correction prompt: "tighten §6 closer; preserve cadence: name a successor, name what they did, repeat. Don't decorate."
- [ ] Inspect each agent's `forwardRefs` handoff array. Expected: empty or near-empty (§12 has nowhere to forward-ref to within EM; QUANTUM forward-refs are prose-only, not glossary placeholders). If any agent reports a glossary forward-ref, decide whether to add a placeholder in seed-em-08 Wave 3 or rewrite the prose to use plain text.

---

### Wave 2.5 — Registry merge + publish + commit (per topic, serial, FIG order)

**Purpose:** Merge each agent's `registry` block into `lib/content/simulation-registry.ts` (12 new scene entries grouped under 4 `// EM §12 — <slug>` section comments), publish each topic, commit per topic. **Order: §12.1 → §12.2 → §12.3 → §12.4** so the git log reads sequentially: gauge-theory-origins → aharonov-bohm-effect → magnetic-monopoles-and-duality → classical-limit-of-qed. **§12.4 lands LAST on purpose.**

For each topic in that order:
- [ ] Append the agent's `registry` block to `simulation-registry.ts` (3 entries under `// EM §12 — <slug>` section comment, using the codebase's `lazyScene(...)` + PascalCase-key convention as confirmed in Session 7).
- [ ] Run `pnpm content:publish --only electromagnetism/<slug>` — expect `1 inserted` (or `0 inserted / 1 updated` if a previous run already created the row from earlier testing). If `0 / 0`, inspect MDX for the four gotchas (nested JSX in attribute, multi-line `$$`, bare `<` or `>`, malformed tensor LaTeX); fix and retry. If still `0 / 0` after fix, run with `--force` to confirm the parsed-output issue resolved.
- [ ] Run a curl smoke immediately after publish:
  ```bash
  curl -s -o /dev/null -w "%{http_code}\n" http://localhost:3000/en/electromagnetism/<slug>
  ```
  Expect 200. **If port 3000 is occupied with a stale dev server**, run `lsof -i :3000` to confirm; if it is, either restart it (`pkill -f "next-server"; pnpm dev &`) or curl on the alternate port the user has running.
- [ ] Commit per topic with subject `feat(em/§12): <slug> — <one-liner from agent handoff>`.

**Commits (4 expected):**
- `feat(em/§12): gauge-theory-origins — the symmetry that became every force`
- `feat(em/§12): aharonov-bohm-effect — the field is zero, the pattern shifts`
- `feat(em/§12): magnetic-monopoles-and-duality — Dirac proved they are allowed`
- `feat(em/§12): classical-limit-of-qed — Maxwell's equations, the high-N limit`

(Adapt one-liners to whatever the agent returned in handoff. Preserve the §12 prefix.)

---

### Wave 3 — Seed script + verification + spec flip + branch-complete commit

**Purpose:** Author `seed-em-08.ts` with 4 (or 6) new physicist bios + glossary prose for all Wave-1 new structural entries + **promotion of the 3 existing §12 forward-ref glossary placeholders** (`gauge-theory-origins`, `aharonov-bohm-effect`, `magnetic-monopole`) from placeholder text to full prose. Run verification curls. **Update the spec progress to 66/66 (100%) AND flip the spec status header from "in progress" to "complete — branch shipped 2026-04-25".** Optionally update `components/sections/branches-section.tsx` home-page subtitle. Trigger Hebrew machine-translation pass. File the Session 8 implementation log to MemPalace, AND a final 8-session retrospective. Land the **branch-complete commit**: `feat(em): branch complete — 66/66 topics live`.

**1 subagent for seed + spec + log + retrospective. Multiple commits.**

#### Task 3.1: Author `scripts/content/seed-em-08.ts`

**Files:** `scripts/content/seed-em-08.ts` (NEW, mirrors `seed-em-07.ts`).

- [ ] **Step 1:** Read `scripts/content/seed-em-07.ts` end-to-end. Copy its imports, `interface PhysicistSeed`, `interface GlossarySeed`, `parseMajorWork`, `paragraphsToBlocks`, `main()` loop **VERBATIM**. The Session 7 lesson: `paragraphsToBlocks` returns `Array<{ type: "paragraph"; inlines: string[] }>`. Do not modify.

- [ ] **Step 2:** Write the PHYSICISTS array (4 entries; or 6 if Yang/Mills are included per Wave 1 decision). Per-entry discipline: `bio` ~300–400 words (3 paragraphs — schooling, central work, legacy); `oneLiner` ~80–120 words; 5 `contributions`; 3 `majorWorks` parseable by `parseMajorWork`.

  **Hermann Weyl** (1885–1955, German). Schooling at Göttingen under Hilbert. Early work on Riemann surfaces and the Riemann-Hurwitz formula. 1918 attempt to unify gravity and electromagnetism via a length-rescaling "gauge" theory (literally a *Gauge*, German for gauge or measure) — Einstein flat-out rejected it. 1929 retooled the same idea as a phase gauge transformation in the new quantum mechanics, and it WORKED — the U(1) gauge symmetry of QED is Weyl's. Princeton IAS colleague of Einstein from 1933 (after Nazi rise). Also: Weyl spinors, Weyl semimetals (named for his 1929 fermion equation), foundational work in differential geometry and group theory. Wrote some of the most beautiful prose of any physicist; *Symmetry* (1952) is still in print. Died at 70 of a heart attack outside a Zurich post office on his 70th birthday. Major works: *Raum, Zeit, Materie* (1918), *Gruppentheorie und Quantenmechanik* (1928), *Symmetry* (1952). `relatedTopics`: `gauge-theory-origins`.

  **Yakir Aharonov** (1932–, Israeli). Born in Haifa during the British Mandate. Studied with David Bohm at Bristol; doctoral work on the foundations of quantum mechanics under Bohm's supervision. With Bohm, 1959, predicted the eponymous effect at Brandeis. Also: weak measurements (1988, with Albert and Vaidman), two-state vector formalism, Aharonov-Casher effect (electric AB analogue, 1984). Currently James J. Farley Professor at Chapman University; Wolf Prize 1998, National Medal of Science 2010. Major works: *Significance of Electromagnetic Potentials in the Quantum Theory* (with Bohm, 1959), *How the Result of a Measurement of a Component of the Spin of a Spin-½ Particle Can Turn Out to Be 100* (1988, weak measurements), *Quantum Paradoxes: Quantum Theory for the Perplexed* (with Rohrlich, 2005). `relatedTopics`: `aharonov-bohm-effect`.

  **David Bohm** (1917–1992, American-British). Born in Wilkes-Barre, PA. Doctorate at Berkeley under Oppenheimer (1943). Manhattan Project work (Berkeley division, theoretical calculations). Blacklisted from US academia during McCarthyism for refusing to testify against Oppenheimer's circle; relocated to São Paulo (1951–1955), then Haifa (1955–1957), then Bristol (1957–1961), settled at Birkbeck London 1961 until retirement. Collaboration with Aharonov on the 1959 paper that bears both their names — among the top-cited papers in 20th-century physics. Pilot-wave interpretation of quantum mechanics (1952, "Bohmian mechanics" — a deterministic alternative to Copenhagen that reproduces all quantum predictions and is taken seriously by a sub-school of philosophers of physics). Plasma physics (Bohm diffusion). Long philosophical correspondence with J. Krishnamurti. Died in 1992, London. Major works: *Quantum Theory* (1951), *A Suggested Interpretation of the Quantum Theory in Terms of Hidden Variables* (1952), *Significance of Electromagnetic Potentials in the Quantum Theory* (with Aharonov, 1959). `relatedTopics`: `aharonov-bohm-effect`.

  **Richard Feynman** (1918–1988, American). Born in Far Rockaway, Queens. Doctorate at Princeton 1942 under John Wheeler (path-integral formulation). Manhattan Project (1943–1945, Los Alamos, T-Division — theoretical calculations of critical mass). Cornell professorship 1945–1950. Caltech 1950 to retirement. QED with Schwinger and Tomonaga, 1948–1949 (Nobel Prize 1965, shared three ways). Path-integral formulation of quantum mechanics. Feynman diagrams (1949). *Feynman Lectures on Physics* (1963, with Leighton and Sands) — the book every undergraduate physicist reads on EM. Investigated the Challenger disaster (1986); the O-ring-in-ice-water demonstration on national television became one of the most-watched moments of public-facing physics ever. Died 1988 of liposarcoma. The §12.4 voice anchor: Feynman's *Lectures* derives Maxwell's equations FROM the photon. The inversion is §12.4's pedagogical hook. Major works: *Space-Time Approach to Non-Relativistic Quantum Mechanics* (1948, path integrals), *The Feynman Lectures on Physics* (1963), *QED: The Strange Theory of Light and Matter* (1985, the popular version). `relatedTopics`: `classical-limit-of-qed`.

  **Chen-Ning Yang** (1922–, Chinese-American) — IF INCLUDED. Born in Hefei, Anhui province. Doctorate at Chicago 1948 under Edward Teller. Institute for Advanced Study 1949–1965. Yang-Mills 1954 with Robert Mills — non-Abelian gauge theory, the template for the weak and strong forces. Nobel Prize 1957 (with Tsung-Dao Lee, parity violation). Stony Brook professorship 1965–1999, then Tsinghua and the Chinese University of Hong Kong. Major works: *Conservation of Isotopic Spin and Isotopic Gauge Invariance* (with Mills, 1954), *Question of Parity Conservation in Weak Interactions* (with Lee, 1956), *Selected Papers* (1983, the autobiographical retrospective). `relatedTopics`: `gauge-theory-origins`.

  **Robert Mills** (1927–1999, American) — IF INCLUDED. Born in Englewood, NJ. Doctorate at Columbia 1955. Postdoctoral position at Brookhaven 1953–1954 — where the Yang-Mills paper was written. Joined Ohio State 1956, full professor 1962, retired 1995. Less publicly visible than Yang but the 1954 paper is a genuine 50/50 collaboration. Wrote a lovely two-page recollection (1989) of how the work happened: a question Yang asked at a seminar, a calculation done over several weeks at Brookhaven, the realization that the field equations were highly non-trivial because of the non-Abelian structure. Major works: *Conservation of Isotopic Spin and Isotopic Gauge Invariance* (with Yang, 1954). `relatedTopics`: `gauge-theory-origins`.

- [ ] **Step 3:** Write the GLOSSARY array. **Three sections:**

  **(a) New entries with full prose** (8 truly new + 1 §12.4 backfill = 9):
  - `gauge-group` — concept; description ~150 words on U(1), SU(2), SU(N) with one-line examples.
  - `aharonov-bohm-phase` — concept; ~180 words on Φ = (q/ℏ)∮A·dℓ and the periodicity in Φ_0.
  - `dirac-quantization-condition` — concept; ~200 words on eg = 2πnℏ and the cosmological monopole problem.
  - `electromagnetic-duality` — concept; ~180 words on E↔cB, F↔*F, monopoles as dual sources.
  - `coherent-state` — concept; ~200 words on |α⟩, Poisson stats, classical limit.
  - `running-coupling` — concept; ~180 words on α(E), Landau pole, electroweak unification scale.
  - `anomalous-magnetic-moment` — concept; ~200 words on g − 2 = α/π + …, Schwinger 1948, the most-precisely-tested prediction.
  - `classical-limit-of-qed` — concept; ~200 words framing of §12.4.
  - (If Yang-Mills included) `non-abelian-gauge` — concept; ~180 words. `yang-mills-equations` — concept; ~150 words.

  **(b) Promotions** (3 forward-ref placeholders → full prose, source_hash idempotency overwrites Session 7 placeholder rows):
  - `gauge-theory-origins` — promote to ~250 words covering Weyl 1918→1929, Yang-Mills 1954, U(1)→SU(N) generalization. **Crucial:** the §12.1 topic and this glossary entry share the slug; the topic page is `electromagnetism/gauge-theory-origins` (kind=topic), the glossary entry is `gauge-theory-origins` (kind=glossary). The seed script writes only the `kind=glossary` row.
  - `aharonov-bohm-effect` — promote to ~250 words on the 1959 prediction, Tonomura 1986 confirmation, what it means for the gauge-vs-field debate.
  - `magnetic-monopole` — promote to ~250 words on Dirac 1931, the quantization argument, the cosmological problem, the experimental search.

  **(c) Update relatedTopics on existing Supabase entries** (no prose change, just append §12 cross-links):
  - `gauge-invariance` — append §12.1 to relatedTopics in the seed.
  - `four-potential` — append §12.1 + §12.2.
  - `electromagnetic-field-tensor` — append §12.3.
  - `dual-field-tensor` — append §12.3.
  - (Optional) `interference` — append §12.2.

- [ ] **Step 4:** **DO NOT** add forward-ref placeholders for QUANTUM. The branch ends. Forward-refs are prose-only ("the next branch is QUANTUM") — no Supabase rows needed.

- [ ] **Step 5:** Run `pnpm exec tsx --conditions=react-server scripts/content/seed-em-08.ts`. Expect:
  - 4–6 physicist rows inserted (kind=physicist).
  - 9–11 new glossary rows inserted (kind=glossary).
  - 3 glossary rows updated (gauge-theory-origins, aharonov-bohm-effect, magnetic-monopole — placeholder → full prose).
  - Optional: 4–5 existing glossary rows updated with appended relatedTopics.

- [ ] **Step 6:** **Verify the placeholder promotions via SQL** (Session 7 set the precedent). Use `mcp__physics-supabase__execute_sql` with project_id `cpcgkkedcfbnlfpzutrc`:

  ```sql
  SELECT kind, slug, locale, subtitle, jsonb_array_length(blocks) AS block_count
  FROM content_entries
  WHERE slug IN ('gauge-theory-origins', 'aharonov-bohm-effect', 'magnetic-monopole')
    AND kind = 'glossary'
    AND locale = 'en'
  ORDER BY slug;
  ```
  Confirm:
  - `subtitle` no longer ends "Full treatment in §12.X" — it's now the full short-definition.
  - `block_count` is ≥ 2 (was 1 for placeholders).

- [ ] **Step 7:** Curl smoke test on a fresh dev server. For each of 4 §12 routes, run `curl -s -o /dev/null -w "%{http_code} %{url_effective}\n" http://localhost:3000/en/electromagnetism/<slug>`; expect 200 across all 4. Plus `/en/physicists/hermann-weyl`, `/en/physicists/yakir-aharonov`, `/en/physicists/david-bohm`, `/en/physicists/richard-feynman`, plus Yang/Mills if included. Plus `/en/dictionary/gauge-theory-origins`, `/en/dictionary/aharonov-bohm-effect`, `/en/dictionary/magnetic-monopole`, `/en/dictionary/dirac-quantization-condition`, `/en/dictionary/coherent-state`, `/en/dictionary/anomalous-magnetic-moment`. Expect 200 on all.

- [ ] **Step 8:** Stage and commit:

```bash
git add scripts/content/seed-em-08.ts
git commit -m "$(cat <<'EOF'
fix(em/§12): seed Weyl/Aharonov/Bohm/Feynman + glossary prose; promote §12 placeholders

Wave 3 seed for EM Session 8 (branch-closing). Adds 4 (or 6 with Yang/Mills)
physicist bios (~350 words each), 9–11 new glossary terms with full prose
(gauge-group, aharonov-bohm-phase, dirac-quantization-condition,
electromagnetic-duality, coherent-state, running-coupling,
anomalous-magnetic-moment, classical-limit-of-qed), and PROMOTES the
three Session-7 forward-ref glossary placeholders (gauge-theory-origins,
aharonov-bohm-effect, magnetic-monopole) from placeholder text to full
prose via source_hash idempotency. Promotions verified via SQL: subtitle
updated, block_count ≥ 2.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

#### Task 3.2: Update spec progress AND flip status header

**File:** `docs/superpowers/specs/2026-04-22-electromagnetism-branch-design.md`

- [ ] **Step 1:** Update header status line (line 4). Replace:
  ```
  **Status:** in progress — §01 shipped 2026-04-22; §02 + §03 shipped 2026-04-22; §04 + §05 shipped 2026-04-23; §06 + §07 shipped 2026-04-23; §08 + §09 shipped 2026-04-23; §10 shipped 2026-04-24; §11 shipped 2026-04-25
  ```
  With:
  ```
  **Status:** complete — ALL 66 topics shipped 2026-04-25 (8 sessions: §01 + §02 + §03 + §04 + §05 + §06 + §07 + §08 + §09 + §10 + §11 + §12 — branch shipped 2026-04-25)
  ```

- [ ] **Step 2:** Update Module status table (lines 312–326) — flip §12 from "0 ☐ not started" to "4 ☑ complete", total Done from 62 to **66**, percentage from 94% to **100% complete**.

- [ ] **Step 3:** Check off all 4 boxes in the §12 per-topic checklist (lines 416–420):
  ```
  - [x] 63 `gauge-theory-origins`
  - [x] 64 `aharonov-bohm-effect`
  - [x] 65 `magnetic-monopoles-and-duality`
  - [x] 66 `classical-limit-of-qed`
  ```

- [ ] **Step 4:** Stage and commit:

```bash
git add docs/superpowers/specs/2026-04-22-electromagnetism-branch-design.md
git commit -m "$(cat <<'EOF'
docs(em): mark branch COMPLETE — 66/66 topics live, status: complete

Wave 3 spec flip for EM Session 8. All 12 modules shipped, all 66
topic checkboxes ticked, status header flipped from "in progress"
to "complete — ALL 66 topics shipped 2026-04-25". The 8-session
arc closes here.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

#### Task 3.3: Home-page subtitle update (conditional)

**File:** `components/sections/branches-section.tsx`

- [ ] **Step 1:** Read the file. Look for any text mentioning a count of live branches ("two branches live", "first branch", "Classical Mechanics is live", etc.). If no such text exists (the section just renders branch cards from data), no edit is needed; skip Step 2.

- [ ] **Step 2 (conditional):** If there is a count line, update it to reflect 2 live branches and 4 coming-soon. Stage and commit:

```bash
git add components/sections/branches-section.tsx
git commit -m "$(cat <<'EOF'
chore(home): update branches-section copy — EM branch complete

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

If no edit was needed, skip the commit.

#### Task 3.4: Hebrew machine-translation pass

- [ ] **Step 1:** Confirm `pnpm content:translate` exists and the convention works. Run:
  ```bash
  pnpm content:translate --help 2>&1 | head -20
  ```
  If the command does not exist (Session 7 may have deferred this; the spec mentions it but the actual CLI may need to be authored), document the absence in the implementation log and SKIP Step 2. **Don't author the CLI in Session 8** — that is out of scope for the closing session.

- [ ] **Step 2 (if CLI exists):** Run a Hebrew translation pass for §11 + §12 topics:
  ```bash
  pnpm content:translate --locale he --only electromagnetism/four-potential-and-em-lagrangian
  pnpm content:translate --locale he --only electromagnetism/gauge-theory-origins
  pnpm content:translate --locale he --only electromagnetism/aharonov-bohm-effect
  pnpm content:translate --locale he --only electromagnetism/magnetic-monopoles-and-duality
  pnpm content:translate --locale he --only electromagnetism/classical-limit-of-qed
  ```
  (Plus any §11 topics that may not have been translated yet — Session 7 may have run a sweep, but verify via SQL: `SELECT slug FROM content_entries WHERE locale = 'he' AND slug LIKE 'electromagnetism/%';`)

- [ ] **Step 3 (if Step 2 produced changes):** the translation CLI typically writes to Supabase directly; if it also writes git-tracked files, stage and commit:
  ```bash
  git add <whatever was modified>
  git commit -m "feat(em/i18n): Hebrew first-pass translation for §11 + §12"
  ```
  If the CLI runs Supabase-only and modifies no tracked files, no commit is needed. Document the count of translated topics in the implementation log either way.

- [ ] **Step 4:** Run `curl -s -o /dev/null -w "%{http_code}\n" http://localhost:3000/he/electromagnetism/aharonov-bohm-effect` — expect 200 (Hebrew page renders, with the "Translation pending. Showing English." banner OR the actual Hebrew translation depending on whether Step 2 ran).

#### Task 3.5: File MemPalace implementation log

**Tool:** `mcp__plugin_mempalace_mempalace__mempalace_kg_add` (or write to `~/.mempalace/palace/wings/physics/decisions/` directly per palace conventions used by Sessions 1–7).

- [ ] **Step 1:** Write `implementation_log_em_session_8_foundations.md` mirroring Session 7's log structure. Cover:
  - **What shipped** — 4 topics (gauge-theory-origins, aharonov-bohm-effect, magnetic-monopoles-and-duality, classical-limit-of-qed), 4–6 physicists (Weyl + Aharonov + Bohm + Feynman; +Yang +Mills if included), 9–11 new glossary terms, 3 placeholder promotions, route status (200 across all new routes).
  - **Wave-by-wave summary.**
  - **Deviations from plan.**
  - **Mid-session findings.** Specifically:
    - (a) Did the §12.2 AB-effect interference visualization land? Did the field-free electron paths read as obviously-field-free, or did it need annotation?
    - (b) Did the §12.4 closing paragraph land? Did it earn its weight, or did it feel grandiose? Was the spec-suggested cadence preserved or did the agent improvise?
    - (c) Did the §12.3 dual-tensor LaTeX (`*F^{μν} = ½ε^{μνρσ}F_{ρσ}`) round-trip cleanly through MDX → KaTeX? Or did a new gotcha surface?
    - (d) Did §12.1 land Abelian-only or include Yang-Mills? What was the deciding criterion (length, readability, narrative flow)?
    - (e) Did the placeholder promotions all land cleanly via SQL verification? Were the source_hash differences correctly detected?
    - (f) Did the curl smoke on fresh dev server catch any new MDX gotcha?
    - (g) Did the Hebrew translation CLI exist and run? If not, what's the followup?
  - **Forward-refs added** for QUANTUM (prose-only; no glossary placeholders).
  - **Final commit count for Session 8.**

- [ ] **Step 2:** Write a SECOND log: `implementation_log_em_branch_complete_8_sessions.md` — the **8-session retrospective**. ONE PARAGRAPH. Cover:
  - Total: 66 topics, 8 sessions, ~3.7 weeks of authoring (2026-04-22 → 2026-04-25 calendar; effective wall-clock per session).
  - Total physicists added: count from `lib/content/physicists.ts` (subtract CM baseline).
  - Total glossary terms added: count from `lib/content/glossary.ts` minus CM baseline minus Session 8 backfill of pre-existing Supabase rows.
  - Primitives shipped: CircuitCanvas (Session 4) + RayTraceCanvas (Session 7's predecessor, shipped Session 5). LorentzBoostCanvas was deliberately NOT built.
  - Total commits in the EM branch: count via `git log --oneline | grep -c "feat(em\|fix(em\|docs(em\|chore(em" 2>&1` or similar.
  - **The single biggest lesson for the next branch:** what's the one piece of advice the planner of the next branch (Thermodynamics? Quantum? Relativity?) should know? Pick the most important — examples: (i) "the parallel-agent dispatch pattern works at 4–10 agents per wave; below 4 it's not worth the orchestration overhead, above 10 the registry-merge step becomes the bottleneck"; (ii) "build shared physics-lib types early — Sessions 5 and 7 both benefited from up-front Vec3 / Vec4 / FieldTensor scaffolding"; (iii) "the EquationBlock block-content `$$` form is the right convention; double-backslash escaping inside `tex={...}` is unnecessary and error-prone"; (iv) something else the actual session-end findings reveal.
  - **What's the next branch?** The choice is Roman's. Options per spec scope: Thermodynamics, Relativity (the natural successor to §11), Quantum (the natural successor to §12.4), Modern Physics. The 8-session, 4-wave, parallel-subagent playbook is proven; whatever the next branch is, this is the template.

- [ ] **Step 3:** File both logs to MemPalace via `mempalace_kg_add` (wing=physics, room=decisions, drawer titles match the filenames above).

#### Task 3.6: Branch-complete commit

**Purpose:** A single ceremonial commit that summarizes the 66-topic arc. Lands AFTER everything else.

- [ ] **Step 1:** Run final verification before the commit:
  - `pnpm tsc --noEmit` — clean.
  - `pnpm vitest run` — all green.
  - `pnpm build` — clean SSG smoke for all 66 topic routes.
  - `git status` — clean working tree (all prior commits landed).
  - SQL: `SELECT COUNT(*) FROM content_entries WHERE kind='topic' AND slug LIKE 'electromagnetism/%' AND locale='en';` — expect 66.

- [ ] **Step 2:** This commit is **content-free** (no file changes); it's just a marker. Use `git commit --allow-empty`:

```bash
git commit --allow-empty -m "$(cat <<'EOF'
feat(em): branch complete — 66/66 topics live

Eight sessions (2026-04-22 → 2026-04-25), 12 modules, 66 topics, ~220
scene components, 2 reusable canvas primitives (CircuitCanvas, RayTraceCanvas),
~30 new physicists, ~120 new glossary terms.

§01 Electrostatics → §02 Electric fields in matter → §03 Magnetostatics
→ §04 Magnetism in matter → §05 Induction → §06 Circuits
→ §07 Maxwell's equations → §08 EM waves in vacuum
→ §09 Waves in matter & optics → §10 Radiation
→ §11 EM and relativity → §12 Foundations.

Maxwell wrote four equations. They survived. The next branch is QUANTUM.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

- [ ] **Step 3:** Run `git log --oneline -20` to confirm the branch-complete commit is the HEAD.

---

## Known gotchas

(A) **Seed script for new physicists + glossary prose.** `PhysicistLink` and `Term` components fetch from Supabase `content_entries` at render time; TS arrays are structural metadata only. → Wave 3 creates `seed-em-08.ts` mirroring `seed-em-07.ts`. Bios ~300–400 words, glossary descriptions ~150–250 words. **Copy `paragraphsToBlocks` byte-for-byte** — Session 7 lesson.

(B) **Forward-reference placeholder PROMOTIONS (Session 8-specific).** Sessions 4–7 seeded 3 §12 forward-ref glossary placeholders: `gauge-theory-origins`, `aharonov-bohm-effect`, `magnetic-monopole`. Wave 3 of Session 8 PROMOTES them via source_hash idempotency. The seed-em-08 GlossarySeed entries with the same slugs but different prose produce different `source_hash` values; the upsert path in `main()` detects the difference and overwrites. **Verify via SQL post-seed: `subtitle` no longer ends "Full treatment in §12.X" and `block_count` ≥ 2.** No new forward-refs are seeded (the branch is closing — QUANTUM forward-refs are prose-only).

(C) **`pnpm content:publish --force` for parser-affected re-publishes.** CLI hashes raw MDX source. Parser-only fixes need `--force`. **The Wave 0 CLI patch did NOT ship in Session 7 and is NOT shipping in Session 8.** Use `--force` if needed.

(D) **MDX authoring gotchas (still active, list pruned by Session 7's findings):**
- (i) No `<PhysicistLink slug="...">` inside `title="..."` JSX attribute (nested quotes break).
- (ii) No multi-line `$$ … \qquad<newline> … $$` math blocks. Single-line within EquationBlock.
- (iii) No bare `<` or `>` in prose (parses as JSX tag opener); reword or escape as `&lt;` / `&gt;`.
- (iv) **§12.3 dual-tensor LaTeX density warning.** Use the block-content `$$…$$` form (single-backslash LaTeX). Test by publishing §12.3 first if uncertain. Session 7 §11.3 passed cleanly; this should hold.
- (v) **`<Term>` slug must be in glossary, not topics.** `<Term slug="..."/>` resolves only against `content_entries` rows where `kind='glossary'`. Topic slugs are NOT auto-resolved. To link to a topic, use `<TopicLink branchSlug="electromagnetism" topicSlug="..."/>` or a plain markdown link `[the-vector-potential](/en/electromagnetism/the-vector-potential)`. Session 7 lesson — `<Term slug="amperes-law">` and `<Term slug="the-lorentz-force">` rendered as broken links because those are topic slugs, not glossary slugs.

(E) **Shared types between Wave 1 and Wave 2 agents.**
- `Vec2` from `@/lib/physics/coulomb`
- `Vec3` from `@/lib/physics/electromagnetism/lorentz`
- `Vec4`, `FourVector`, `FourPotential`, `FourCurrent`, `FieldTensor`, `MINKOWSKI`, `gamma`, `lorentzBoostMatrix`, `buildFieldTensor`, `transformFields`, `dualTensor` from `@/lib/physics/electromagnetism/relativity` (Session 7)

If a Wave 2 agent needs a helper that doesn't exist, define a local fallback with `// TODO: promote to relativity.ts` and let Wave 2.5 reconcile.

(F) **§12 physics-lib nesting convention.** Continue `lib/physics/electromagnetism/<topic>.ts`. Reuse constants from `@/lib/physics/constants` (`MU_0`, `EPSILON_0`, `SPEED_OF_LIGHT`, `H_BAR`, `PLANCK_CONSTANT`, `ELEMENTARY_CHARGE`, `ELECTRON_MASS`, `ALPHA_FINE`). No new constants strictly required; optional `DIRAC_MONOPOLE_UNIT = 2*PI*H_BAR/ELEMENTARY_CHARGE` if §12.3 wants it.

(G) **§12 voice — THE EPILOGUE.** Don't over-explain. Each topic ends with a forward-ref to QUANTUM. §12.4's closer is the closer of the entire branch. Cadence over decoration.

(H) **Slug-collision watch (carried from Session 7).** `lorenz-gauge` (Ludvig Lorenz, 1867) vs `lorentz-transformation` (Hendrik Lorentz, 1895). Triple-check spellings if §12.1 prose calls either.

(I) **Curl smoke discipline.** Run smoke on a fresh dev server BEFORE the Wave 3 commit. If port 3000 is occupied with stale state, use 3001. Both Session 7 latent bugs (`<Term>` slugs + `paragraphsToBlocks` shape) were caught only because curl ran post-publish; tsc and vitest will not catch MDX rendering issues.

(J) **§12.4 is the LAST topic.** Brief the §12.4 agent specifically: the closer is the closer of the entire branch. Don't undersell. Don't decorate.

---

## Definition of done (session-level)

- All 4 routes return 200 at `/en/electromagnetism/<slug>` for `gauge-theory-origins`, `aharonov-bohm-effect`, `magnetic-monopoles-and-duality`, `classical-limit-of-qed`.
- 4–6 new physicist pages return 200 at `/en/physicists/<slug>` (Weyl, Aharonov, Bohm, Feynman; +Yang +Mills if included).
- 9–11 new glossary pages return 200 at `/en/dictionary/<slug>`.
- 3 forward-ref placeholders verified PROMOTED via SQL (subtitle + block_count shifted for `gauge-theory-origins`, `aharonov-bohm-effect`, `magnetic-monopole`).
- `pnpm tsc --noEmit` clean.
- `pnpm vitest run` green (with the 4 new test files passing alongside Sessions 1–7 baselines).
- `pnpm build` clean (SSG smoke for all 66 EM routes plus Hebrew fallbacks).
- Spec progress table updated to **66/66 (100%)**.
- Spec status header flipped from "in progress" to "complete — ALL 66 topics shipped 2026-04-25".
- All 66 per-topic checkboxes ticked.
- Hebrew machine-translation pass kicked off (or absence of CLI documented).
- `components/sections/branches-section.tsx` updated if a count line exists; otherwise no-op.
- Session 8 implementation log filed to MemPalace.
- 8-session retrospective filed to MemPalace.
- Branch-complete commit lands as HEAD: `feat(em): branch complete — 66/66 topics live`.

## Definition of done (branch-level — per spec)

- ☐ All 66 topic pages resolve under `/electromagnetism/<slug>` for `en` locale.
- ☐ Branch card on home page shows as `live`.
- ☐ Module index pages render correctly at `/electromagnetism` (branch hub).
- ☐ `pnpm build` clean, all tests pass.
- ☐ All topics have the money shot identified and implemented.
- ☐ Hebrew machine-translation first pass published for at least 50 of 66 topics (or absence of CLI documented in implementation log).
- ☐ Commit history shows clean per-module progression.

**Wave 3 must verify all 7 boxes before declaring the branch done. The Hebrew first-pass is the only one that may complete async after the session closes.**

---

## Self-review notes

- **Spec coverage:** all 4 §12 topics addressed (gauge-theory-origins, aharonov-bohm-effect, magnetic-monopoles-and-duality, classical-limit-of-qed); cross-refs to §03.4 (the-vector-potential), §07.2 (the-four-equations), §08 (plane waves), §10 (Larmor), §11.3 (field tensor), §11.5 (Lagrangian) all explicit; spec voice anchors quoted verbatim for §12.4 closer.
- **Branch-level Definition-of-Done coverage:** Wave 3 explicitly addresses each of the 7 spec-level boxes via Tasks 3.2 (status), 3.3 (home-page subtitle), 3.4 (Hebrew), 3.6 (final verification + branch-complete commit + commit-history audit via `git log`).
- **Type consistency:** `Vec4`, `FourVector`, `FourPotential`, `FourCurrent`, `FieldTensor` reused from Session 7's `relativity.ts`. New §12 helpers (`gaugeTransformation`, `aharonovBohmPhase`, `diracQuantizationCondition`, `coherentStatePhotonStats`, etc.) defined Wave 1, consumed Wave 2 only.
- **Placeholder scan:** zero "TBD" / "TODO" / "implement later" in any task body. All code blocks contain runnable code with imports, signatures, and bodies. All commit messages explicit. Hebrew translation step has clear conditional gating on whether the CLI exists.
- **Yang-Mills decision documented at plan time** (DEFAULT YES) but flagged for Wave 1 author override; the Yang/Mills physicist entries and the `non-abelian-gauge` / `yang-mills-equations` glossary entries are both behind the same toggle.
- **§12.4 closing paragraph cadence anchor included verbatim from spec**, with explicit instruction for the agent to read §11.5 closer (commit `36fd378`) before authoring §12.4.
- **Forward-ref promotion mechanism documented with SQL verification step** — Session 5 set the precedent, Session 7 confirmed the upsert pattern, Session 8 promotes 3 §12 placeholders cleanly.
- **No new placeholders added.** §12 is the LAST module of the branch — there is nowhere to forward-ref to within EM. QUANTUM forward-refs are prose-only.
