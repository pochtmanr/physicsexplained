# Electromagnetism Session 6 — §10 Radiation

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (token-saving variant — parallel waves, no per-task review) to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking. Feedback style: per wing=physics `feedback_execution_style.md`.

**Goal:** Ship 6 topics — §10 Radiation (FIG.52–57): `larmor-formula`, `electric-dipole-radiation`, `antennas-and-radio`, `synchrotron-radiation`, `bremsstrahlung`, `radiation-reaction`. After Session 6, the EM branch progress moves from 51/66 (77%) to 57/66 (86%). Only §11 EM & Relativity (5) + §12 Foundations (4) = 9 topics across 2 modules remain. §10 is the "where does light come from?" module — every topic is a variation on Larmor's formula (P ∝ a²). §10.2 is the visual money shot (near-field wrapping tightly, far-field breaking off as outgoing spherical wavefronts — the moment fields LEAVE THEIR SOURCE). §10.6 is the honesty moment of the branch — classical electrodynamics has an open seam at radiation reaction and we write it that way, not by hand-waving.

**Architecture:** Four waves mirroring the Session 5 precedent without Wave 0 (the §01–§05 tex-backfill loop closed cleanly last session; no carried-over inconsistencies) and without Wave 1.5 (no shared primitive — 6 topics does not cross the amortization threshold the CircuitCanvas + RayTraceCanvas primitives crossed; each topic handles field-lines / polar-pattern / trajectory drawing inline in Canvas 2D). Wave 1 scaffolds the data layer (branches / physicists / glossary / constants). Wave 2 dispatches 6 parallel topic agents. Wave 2.5 serially merges registry + publishes + commits per-topic. Wave 3 authors the seed script, runs verification, updates the spec, and files the implementation log. The 6-agent parallel dispatch is smaller than Session 5's 14-agent fan-out and uses the same NO-registry-touch / NO-publish / NO-commit contract that has held cleanly across Sessions 1–5.

**Tech Stack:** Next.js 15 (App Router), React 19, TypeScript strict, Tailwind v4, MDX (`@next/mdx` + rehype-katex), Canvas 2D + `requestAnimationFrame`, Supabase `content_entries`, Vitest, `pnpm content:publish` CLI, `tsx --conditions=react-server` for seed scripts.

**Expected commit total:** 10 baseline — 1 Wave 1 scaffold + 6 Wave 2.5 per-topic + 1 Wave 3 seed + 1 Wave 3 spec-update + 1 Wave 3 MDX parse-fix reconciliation if needed. 11 if a forward-ref placeholder follow-up commit lands. 12 if the `content:publish` CLI hash-source patch (see gotcha §C below) ships as a mid-session quality-of-life improvement.

---

## Vision and voice reminders

**§10 voice — WHERE DOES LIGHT COME FROM? ACCELERATING CHARGES.** Every antenna, every synchrotron, every X-ray tube, every bremsstrahlung spectrum is a variation on one formula: power ∝ (acceleration)². Each topic is a variation of Larmor's 1897 result. §10.1 states the formula. §10.2 draws the fields breaking off. §10.3 builds the first antenna (Hertz 1888 → Marconi 1901). §10.4 bends the charge in a ring to make light on purpose (relativistic beaming). §10.5 scatters the charge off another charge to make an X-ray (continuous bremsstrahlung spectrum). §10.6 closes the module on the honest admission that classical EM has a hole at self-interaction. The module ends the "light is electromagnetic waves" arc that §07 → §08 → §09 built up, and sets up §11 (boost E and B into each other) and §12 (gauge, monopoles, QED classical limit).

**Money shot to nail — §10.2 `electric-dipole-radiation`.** Oscillating dipole at the origin with field lines drawn in real time: near-field wrapping tightly (quasi-static, 1/r³ roll-off), far-field breaking off as outgoing spherical wavefronts (1/r, radiative). The moment fields LEAVE THEIR SOURCE. Animated — the near/far transition happens smoothly as radius increases. Slider: dipole oscillation frequency ω (which sets the wavelength λ = 2πc/ω and therefore the transition radius r ~ λ/2π). Optional toggle: magnetic-dipole analogue (perpendicular loops replacing parallel rods) for cross-reference with §03.5.

**Honest moment to nail — §10.6 `radiation-reaction`.** Don't hand-wave. Abraham-Lorentz 1903 derivation of F_rad = (μ₀ q² / 6π c) × d³x/dt³ (a *third-order* ODE, which is already unusual). Then: the runaway solutions (acceleration grows without bound without external force), the pre-acceleration paradox (the charge responds before the force is applied), the self-energy divergence. Landau-Lifshitz regularisation (reduce-order by substituting the external force's rate-of-change for the jerk term). Dirac 1938 relativistic extension (the ALD equation). And: QED resolves the classical divergences via renormalisation but at the classical level radiation reaction remains a seam in the fabric. Write the honesty directly — "this is the open problem of classical electrodynamics, and physicists have made peace with the fact that the classical theory is incomplete here." Kurzgesagt voice. 1400–1500 words.

**Calculus policy — unchanged.** Every topic that uses ∇, ∇·, ∇×, ∮, ∬, d/dt, d²/dt², d³/dt³ must explain the symbol in local context in plain words before the compact form. Side notes (`Callout math`) carry the denser derivations. Redundancy is a feature — every topic remains standalone for a search-engine landing reader.

---

## File structure and registries

**Files created this session:**

Physics libraries (6 new — one per topic):
- `lib/physics/electromagnetism/larmor.ts` (§10.1 — Larmor formula P = q²a² / (6πε₀c³), relativistic extension P = (q²γ⁶/6πε₀c³)·(a·a − (v×a)²/c²), radiation pattern helper ⟨S(θ)⟩ ∝ sin²θ for non-relativistic dipole)
- `lib/physics/electromagnetism/dipole-radiation.ts` (§10.2 — near-field / far-field decomposition; E_θ and B_φ retarded-time expressions; near-field ∝ 1/r³, far-field ∝ 1/r; transition radius r = c/ω)
- `lib/physics/electromagnetism/antenna.ts` (§10.3 — Hertzian dipole gain G = 1.5 (directivity), half-wave dipole gain ≈ 1.64; radiation resistance R_rad = (2π/3)(μ₀c)(L/λ)² for short dipole; effective aperture A_eff = G λ² / 4π; free-space path loss 20·log(4πd/λ))
- `lib/physics/electromagnetism/synchrotron.ts` (§10.4 — relativistic Larmor P = q²c·β⁴γ⁴/(6πε₀R²) for circular motion; opening-angle Δθ ≈ 1/γ of the forward emission cone; critical frequency ω_c = (3/2)γ³c/R; synchrotron spectral function F(ω/ω_c) using approximate analytical fits)
- `lib/physics/electromagnetism/bremsstrahlung.ts` (§10.5 — non-relativistic Coulomb-deflection radiation; impact-parameter formula dE/dω ∝ ln(b_max/b_min) for thin-target; Bethe-Heitler cross-section sketch; thick-target continuous spectrum shape dN/dE ∝ (E_max − E)/E; Duane-Hunt cutoff E_max = eU)
- `lib/physics/electromagnetism/radiation-reaction.ts` (§10.6 — Abraham-Lorentz force F_rad = (μ₀q²/6πc)·ȧ, characteristic time τ_0 = q²/(6πε₀mc³) ≈ 6.3×10⁻²⁴ s for electron; runaway-solution demonstration exp(t/τ_0) grows; Landau-Lifshitz reduced-order substitution ȧ → Ḟ_ext/m; relativistic ALD equation coefficients)

Topic pages (6 per-topic directories, each with `page.tsx` + `content.en.mdx`):
- `app/[locale]/(topics)/electromagnetism/larmor-formula/{page.tsx,content.en.mdx}`
- `app/[locale]/(topics)/electromagnetism/electric-dipole-radiation/{page.tsx,content.en.mdx}`
- `app/[locale]/(topics)/electromagnetism/antennas-and-radio/{page.tsx,content.en.mdx}`
- `app/[locale]/(topics)/electromagnetism/synchrotron-radiation/{page.tsx,content.en.mdx}`
- `app/[locale]/(topics)/electromagnetism/bremsstrahlung/{page.tsx,content.en.mdx}`
- `app/[locale]/(topics)/electromagnetism/radiation-reaction/{page.tsx,content.en.mdx}`

Scene components (flat files in `components/physics/` — follow existing kebab-case convention; ~18–20 new files, 3 per topic):
- §10.1 `larmor-formula`: `larmor-radiation-lobe-scene.tsx`, `larmor-power-vs-acceleration-scene.tsx`, `larmor-relativistic-comparison-scene.tsx`
- §10.2 `electric-dipole-radiation`: `dipole-field-lines-scene.tsx`, `near-far-field-transition-scene.tsx`, `dipole-polar-pattern-scene.tsx`
- §10.3 `antennas-and-radio`: `hertz-1888-apparatus-scene.tsx`, `half-wave-dipole-pattern-scene.tsx`, `radio-path-loss-scene.tsx` (note: `antenna-radiation-pattern-scene.tsx` ALREADY EXISTS at §07.4 Poynting-vector — topic agent MUST NOT collide with this slug; use the three names above exclusively)
- §10.4 `synchrotron-radiation`: `synchrotron-tangent-cone-scene.tsx`, `synchrotron-spectrum-scene.tsx`, `relativistic-beaming-scene.tsx`
- §10.5 `bremsstrahlung`: `coulomb-deflection-scene.tsx`, `continuous-xray-spectrum-scene.tsx`, `thick-target-shape-scene.tsx`
- §10.6 `radiation-reaction`: `abraham-lorentz-phase-scene.tsx`, `runaway-vs-reduced-order-scene.tsx`, `radiation-reaction-timescale-scene.tsx`

Test files (6 new — one per physics lib):
- `tests/physics/electromagnetism/larmor.test.ts`
- `tests/physics/electromagnetism/dipole-radiation.test.ts`
- `tests/physics/electromagnetism/antenna.test.ts`
- `tests/physics/electromagnetism/synchrotron.test.ts`
- `tests/physics/electromagnetism/bremsstrahlung.test.ts`
- `tests/physics/electromagnetism/radiation-reaction.test.ts`

Seed script (Wave 3):
- `scripts/content/seed-em-06.ts` — mirrors `seed-em-05.ts` exactly.

**Files modified this session:**
- `lib/content/branches.ts` — append 6 `Topic` entries (FIG.52–57) to `ELECTROMAGNETISM_TOPICS`. `ELECTROMAGNETISM_MODULES` already contains `{ slug: "radiation", title: "Radiation", index: 10 }` — NO module changes needed.
- `lib/content/physicists.ts` — append **3 new** physicist entries (Larmor, Hertz, Dirac) and optionally 1–2 more (Marconi for §10.3, Abraham for §10.6); modify `relatedTopics` arrays on 2 existing physicists (`james-clerk-maxwell`, `hendrik-antoon-lorentz`, and if present `albert-einstein`).
- `lib/content/glossary.ts` — append ~12–15 new structural entries across §10.1–§10.6.
- `lib/physics/constants.ts` — append `ALPHA_FINE = 7.2973525693e-3` (fine-structure constant; CODATA 2018) so §10.1 Larmor can reference α cleanly when discussing the classical electron radius and Thomson cross-section.
- `lib/content/simulation-registry.ts` — append ~18 new scene lazy-import entries grouped by topic with `// EM §10 — <slug>` section comments. Inserted by Wave 2.5 orchestrator only.

**Files NOT modified:**
- `lib/content/branches.ts` status flip — EM branch has been `live` since Session 1.
- `components/physics/visualization-registry.tsx` — glossary-tile preview only; no §10 glossary term needs a tile preview.
- `components/physics/antenna-radiation-pattern-scene.tsx` — DO NOT edit. It's used by §07.4 `the-poynting-vector` already. §10.3 agent creates three new antenna-scene files with distinct names.
- `components/physics/ray-trace-canvas/*` — §10 is field-level, not ray-level. No primitive edits this session.

---

## Self-contained context — what agents need to know

**Content-publish CLI behaviour (carried from Session 5):**
- Command: `pnpm content:publish --only electromagnetism/<slug>` — inserts or updates exactly one row in Supabase `content_entries` table, keyed by `(kind="topic", slug="electromagnetism/<slug>", locale="en")`.
- `source_hash = sha256(RAW MDX source string)` — **NOT** `sha256(JSON.stringify(parsed blocks))`. This means parser-only fixes require `--force` to trigger re-publish; unchanged MDX is a true no-op. Session 5 Wave 0 discovered this the hard way. Session 6 should not need a backfill, but any mid-session parser tweak that changes rendered output without editing MDX source will look like 0/0 and need `--force`.
- Zero rows inserted/updated on a run = MDX parse error silently swallowed. If a publish reports `0 / 0`, open `content.en.mdx` and check for unclosed JSX, invalid `<EquationBlock tex="...">` escaping, bare `<` in prose that parses as a JSX tag opener, multi-line `$$…$$` math blocks that choke micromark, or nested `<PhysicistLink slug="...">` inside JSX attributes (`title="..."`). All three of those are real Session 5 regressions — see MDX authoring gotchas below.

**Seed script behaviour (`seed-em-06.ts`):**
- Run with: `pnpm exec tsx --conditions=react-server scripts/content/seed-em-06.ts`. The `react-server` condition lets `import "server-only"` resolve inside the Supabase service-client module.
- Mirrors `seed-em-05.ts` exactly (reference file: `scripts/content/seed-em-05.ts`):
  - `interface PhysicistSeed` and `interface GlossarySeed` (exact field set — copy-paste from seed-em-05).
  - `parseMajorWork(s: string)` helper for "Title (1903) — description" regex parsing.
  - `paragraphsToBlocks(text: string)` helper that splits `\n\n` into `{ type: "paragraph", inlines: [p] }` blocks.
  - `main()` loop upserts to `content_entries` keyed by `(kind, slug, locale)` with `source_hash = sha256(JSON.stringify({title, subtitle, blocks, meta}))`.
- Per-entry discipline (Session 5 precedent): bios ~300–400 words (3 paragraphs — schooling, central work, legacy), glossary descriptions ~150–250 words (1–2 paragraphs). Tight and factual — no padding. Session 5 tried 500-word bios and hit a stream timeout on the Gemini/Claude worker running the seed; 350-word bios finished comfortably.

**Page.tsx canonical shape (every new topic — identical to Session 5):**
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

export default async function Page({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  const entry = await getContentEntry("topic", SLUG, locale);
  if (!entry) notFound();

  const aside = Array.isArray(entry.meta.aside)
    ? (entry.meta.aside as AsideLink[])
    : [];
  const eyebrow =
    typeof entry.meta.eyebrow === "string" ? entry.meta.eyebrow : "";

  return (
    <TopicPageLayout aside={aside}>
      <TopicHeader
        eyebrow={eyebrow}
        title={entry.title}
        subtitle={entry.subtitle ?? ""}
      />
      {entry.localeFallback ? (
        <p className="mt-2 font-mono text-xs opacity-60">
          Translation pending. Showing English.
        </p>
      ) : null}
      <ContentBlocks blocks={entry.blocks} />
    </TopicPageLayout>
  );
}
```

Only `const SLUG = "electromagnetism/<slug>";` changes per topic.

**MDX content canonical shape (content.en.mdx):**
```mdx
import { TopicHeader } from "@/components/layout/topic-header";
import { Section } from "@/components/layout/section";
import { SceneCard } from "@/components/layout/scene-card";
import { EquationBlock } from "@/components/math/equation-block";
import { Callout } from "@/components/layout/callout";
import { TopicPageLayout } from "@/components/layout/topic-page-layout";
import { <SceneName>Scene } from "@/components/physics/<scene-name>-scene";

<TopicPageLayout aside={[
  { type: "physicist", label: "...", href: "/physicists/<slug>" },
  { type: "term", label: "...", href: "/dictionary/<slug>" },
]}>

<TopicHeader
  eyebrow="FIG.XX · RADIATION"
  title="<TITLE IN ALL CAPS>"
  subtitle="<one-line hook>"
/>

<Section index={1} title="<section heading>">

<prose with <PhysicistLink slug="..." />, <Term slug="..." />, $inline math$ ... >

<EquationBlock tex={`P = \\frac{q^2 a^2}{6 \\pi \\varepsilon_0 c^3}`} />

<SceneCard title="FIG.XX · <caption>" ...>
  <<SceneName>Scene />
</SceneCard>

<Callout variant="math">
...side derivation...
</Callout>

</Section>
```
- Target word count: 1100–1400 baseline; 1400–1600 for §10.2 (money shot) and §10.6 (honest moment).
- `<EquationBlock tex={`…`}>` uses JSX expression with a template literal; backslashes are escaped once (`\\nabla`, `\\cdot`). This is the convention the Session 4 Wave 1.75 parse-mdx fix restored; it is stable.
- **`<PhysicistLink>` for humans, `<Term>` for concepts/phenomena/instruments/units.** Session 5 §09.8 used `<Term slug="christiaan-huygens">` for Huygens, which works (aside-link renders identically), but the convention slip produced a glossary placeholder when a physicist placeholder would have been correct. Session 6 agents must use `<PhysicistLink slug="joseph-larmor" />` for Larmor, `<PhysicistLink slug="heinrich-hertz" />` for Hertz, etc. — human references get `<PhysicistLink>`, concept references get `<Term>`.

**Scene component canonical shape (components/physics/<kebab-slug>-scene.tsx):**
- `"use client"` at the top.
- Named export matching registry entry name (`PascalCase` ending in `Scene`).
- Canvas 2D + `requestAnimationFrame` animation loop via `useAnimationFrame` from `@/lib/animation/use-animation-frame` (see `antenna-radiation-pattern-scene.tsx:3` for the import pattern).
- Theme colours via `useThemeColors()` from `@/lib/hooks/use-theme-colors`.
- Dark background, font-mono HUD, palette continues from Sessions 1–5:
  - magenta `rgba(255,106,222,…)` — positive charge / E-field
  - cyan `rgba(120,220,255,…)` — negative charge / B-field / wavefronts
  - amber `rgba(255,180,80,…)` — radiated light / ray paths / emitted photons
  - green-cyan `rgba(140,240,200,…)` — induced current
  - lilac `rgba(200,160,255,…)` — field-energy density / displacement current
  - pale-blue `rgba(140,200,255,…)` — outgoing wavefronts (extension of the §09 palette)
  - NEW this session suggested: **orange-red** `rgba(255,140,80,…)` for bremsstrahlung X-ray emission and synchrotron radiation beams, to visually distinguish from ordinary visible-light amber. Agents may adopt or skip at author discretion.
- No external 3D libraries, no WebGL, no three.js — Canvas 2D only. §10 is field-level but renders fine in 2D via cross-section views.

**Parallel-safety contract (Wave 2 — enforced for all 6 agents):**
1. **DO NOT** modify `lib/content/simulation-registry.ts`. Orchestrator merges the 6 handoff blocks serially in Wave 2.5.
2. **DO NOT** modify `components/physics/visualization-registry.tsx`. Not needed this session.
3. **DO NOT** modify `lib/content/branches.ts`, `lib/content/physicists.ts`, `lib/content/glossary.ts` — Wave 1 already scaffolded those.
4. **DO NOT** modify `lib/physics/constants.ts` — Wave 1 already added `ALPHA_FINE`.
5. **DO NOT** run `pnpm content:publish`. Orchestrator publishes in Wave 2.5.
6. **DO NOT** `git commit`. Orchestrator commits per-topic in Wave 2.5.
7. **DO NOT** edit `components/physics/antenna-radiation-pattern-scene.tsx` — it is used by §07.4 already. §10.3 creates three new antenna-scene files with different filenames (see File structure above).
8. **TYPES CONTRACT:** No shared primitive types this session. Use `Vec2` from `@/lib/physics/coulomb` for 2D geometry where useful. Do not import from `@/components/physics/ray-trace-canvas` — §10 is field-level.
9. **MDX GOTCHAS CONTRACT (all three are real Session 5 regressions — do not repeat):**
   - (i) **No nested JSX inside string JSX attributes.** `<SceneCard title="Foo <PhysicistLink slug='bar'/>" />` breaks quoting. Put human and concept links in body prose only.
   - (ii) **No multi-line `$$…$$` math blocks.** Micromark chokes on `$$ a \\qquad<newline> b $$`. Collapse to single-line `$$ a \\qquad b $$`.
   - (iii) **No bare `<` in prose.** `"intensity drops to <0.5%"` parses as a JSX tag opener. Reword to `"intensity drops to well under 0.5%"` or escape as `&lt;`. Same for `>`.
10. **RETURN HANDOFF BLOCK** to orchestrator at end of work containing:
   - `registry`: exact multi-line text block to append to `SIMULATION_REGISTRY` (section comment `// EM §10 — <slug>` + 3 lazy-import entries).
   - `publishArg`: `electromagnetism/<slug>` literal.
   - `commitSubject`: single line matching `feat(em/§10): <slug> — <tagline>`.
   - `forwardRefs`: array of `{slug, kind}` referenced from MDX that do NOT yet have a `content_entries` row (physicist or glossary). Orchestrator aggregates; Wave 3 adds placeholders via seed script.
   - `wordCount`: prose word count for the content.en.mdx file, excluding frontmatter imports.

**Forward-reference placeholder pattern (Wave 3):** Pattern established in Session 4 (`seed-em-04.ts:637–665`). Each placeholder `GlossarySeed` has `shortDefinition` ending with "Full treatment in §0X" and `description` beginning "This is a placeholder entry..." with a `// FORWARD-REF: full treatment in §0X` code comment above it. Session 6 likely surfaces 1–2 new forward-refs pointing at §11 (`field-tensor`, `four-potential`, `lorentz-boost-em` via §10.4 synchrotron's minimal-SR inline or §10.6 ALD relativistic form) and possibly §12 (`aharonov-bohm-effect` if §10.6 references the quantum resolution). Scan all 6 MDX files at Wave 3 start.

---

## Task decomposition

### Wave 1 — Data-layer scaffold

**Purpose:** Add 6 new `Topic` entries, 3 minimum / up to 5 maximum new structural physicist entries, 12–15 new structural glossary entries, and 1 new physics constant (`ALPHA_FINE`) to the TS registries. TS arrays are structural metadata only; Supabase prose seeding happens in Wave 3.

**Serial, 1 subagent. 1 commit.**

### Task 1.1: Append 6 topics to ELECTROMAGNETISM_TOPICS

**File:** `lib/content/branches.ts` — append inside the `ELECTROMAGNETISM_TOPICS` array. Find the closing `]` of the array (after the last entry `waveguides-and-fibers` at approximately line ~780) and insert the 6 new entries before it.

- [ ] **Step 1: Grep to locate the insertion point**

Run: `grep -n "waveguides-and-fibers\|^];" lib/content/branches.ts | head -5`
Expected: the `waveguides-and-fibers` entry ends near line 785 and the first `];` thereafter closes `ELECTROMAGNETISM_TOPICS`. Insert the 6 new topics immediately before that closing `];`.

- [ ] **Step 2: Append the 6 §10 Radiation entries**

```ts
  {
    slug: "larmor-formula",
    title: "THE LARMOR FORMULA",
    eyebrow: "FIG.52 · RADIATION",
    subtitle: "Why every accelerating charge leaves light behind.",
    readingMinutes: 11,
    status: "live",
    module: "radiation",
  },
  {
    slug: "electric-dipole-radiation",
    title: "ELECTRIC DIPOLE RADIATION",
    eyebrow: "FIG.53 · RADIATION",
    subtitle: "The simplest antenna in the universe.",
    readingMinutes: 12,
    status: "live",
    module: "radiation",
  },
  {
    slug: "antennas-and-radio",
    title: "ANTENNAS AND RADIO",
    eyebrow: "FIG.54 · RADIATION",
    subtitle: "The difference between a wire and a broadcast.",
    readingMinutes: 12,
    status: "live",
    module: "radiation",
  },
  {
    slug: "synchrotron-radiation",
    title: "SYNCHROTRON RADIATION",
    eyebrow: "FIG.55 · RADIATION",
    subtitle: "Light made on purpose by bending electrons in a circle.",
    readingMinutes: 11,
    status: "live",
    module: "radiation",
  },
  {
    slug: "bremsstrahlung",
    title: "BREMSSTRAHLUNG",
    eyebrow: "FIG.56 · RADIATION",
    subtitle: "The light that comes out when a charge gets in the way of itself.",
    readingMinutes: 10,
    status: "live",
    module: "radiation",
  },
  {
    slug: "radiation-reaction",
    title: "RADIATION REACTION",
    eyebrow: "FIG.57 · RADIATION",
    subtitle: "The force that a charge exerts back on itself.",
    readingMinutes: 13,
    status: "live",
    module: "radiation",
  },
```

- [ ] **Step 3: Verify compile**

Run: `pnpm tsc --noEmit`
Expected: no errors. The `module: "radiation"` slug is already in `ELECTROMAGNETISM_MODULES` (seen at line 344 of branches.ts), so the `Topic` type-check passes.

### Task 1.2: Append 3 new physicists (+ modify `relatedTopics` on 2 existing)

**File:** `lib/content/physicists.ts`.

- [ ] **Step 1: Grep to confirm absences and locate existing entries**

Run: `grep -n "slug: \"\(joseph-larmor\|heinrich-hertz\|paul-dirac\|guglielmo-marconi\|max-abraham\|james-clerk-maxwell\|hendrik-antoon-lorentz\|albert-einstein\)\"" lib/content/physicists.ts`
Expected absences: `joseph-larmor`, `heinrich-hertz`, `paul-dirac`. Present (line anchors for `relatedTopics` edits): `james-clerk-maxwell` (~line 921), `hendrik-antoon-lorentz` (~line 825), `albert-einstein` (~line 356).

Marconi and Abraham are OPTIONAL — add only if §10.3 / §10.6 author agents want to `<PhysicistLink>` them. If omitted at Wave 1, the Wave 2 agent must mention them in plain prose (no link) or flag via `forwardRefs` handoff.

- [ ] **Step 2: Append 3 new structural physicist entries**

The `Physicist` interface at `lib/content/types.ts` uses: `slug`, `born`, `died`, `nationality`, `image`, `relatedTopics`. That is all the TS array carries; bios, contributions, and majorWorks live in Supabase via the Wave 3 seed.

Append just before the closing `];` of `PHYSICISTS` (find by grep `grep -n "^];" lib/content/physicists.ts | tail -1`):

```ts
  {
    slug: "joseph-larmor",
    born: "1857",
    died: "1942",
    nationality: "Irish",
    image: storageUrl("physicists/joseph-larmor.avif"),
    relatedTopics: [
      { branchSlug: "electromagnetism", topicSlug: "larmor-formula" },
      { branchSlug: "electromagnetism", topicSlug: "electric-dipole-radiation" },
      { branchSlug: "electromagnetism", topicSlug: "synchrotron-radiation" },
    ],
  },
  {
    slug: "heinrich-hertz",
    born: "1857",
    died: "1894",
    nationality: "German",
    image: storageUrl("physicists/heinrich-hertz.avif"),
    relatedTopics: [
      { branchSlug: "electromagnetism", topicSlug: "antennas-and-radio" },
      { branchSlug: "electromagnetism", topicSlug: "deriving-the-em-wave-equation" },
      { branchSlug: "electromagnetism", topicSlug: "the-electromagnetic-spectrum" },
    ],
  },
  {
    slug: "paul-dirac",
    born: "1902",
    died: "1984",
    nationality: "British",
    image: storageUrl("physicists/paul-dirac.avif"),
    relatedTopics: [
      { branchSlug: "electromagnetism", topicSlug: "radiation-reaction" },
    ],
  },
```

- [ ] **Step 3: Append `relatedTopics` items to 2 existing physicists**

For `james-clerk-maxwell` (inspect the existing `relatedTopics` array around line 926), append:
```ts
      { branchSlug: "electromagnetism", topicSlug: "larmor-formula" },
      { branchSlug: "electromagnetism", topicSlug: "antennas-and-radio" },
```
(Maxwell 1862 predicted EM waves; Hertz 1887–88 confirmed; radio was born out of that lineage.)

For `hendrik-antoon-lorentz` (around line 825), append:
```ts
      { branchSlug: "electromagnetism", topicSlug: "radiation-reaction" },
```
(The Abraham-Lorentz equation bears his name.)

For `albert-einstein` (line 356 — check current `relatedTopics` first; may already include EM relativity topics from earlier scaffolding): append ONLY IF not present:
```ts
      { branchSlug: "electromagnetism", topicSlug: "radiation-reaction" },
```
(Dirac's 1938 relativistic ALD extension uses SR; Einstein's name surfaces via that lineage.) If Einstein's existing array already includes this or if the agent judges it tangential, skip.

- [ ] **Step 4: Verify compile**

Run: `pnpm tsc --noEmit`
Expected: no errors.

### Task 1.3: Append 12–15 new glossary structural entries

**File:** `lib/content/glossary.ts`.

- [ ] **Step 1: Grep existing glossary for potential collisions**

Run: `grep -n "slug: \"\(larmor-formula\|larmor-power\|radiation-zone\|near-field-zone\|far-field-zone\|hertzian-dipole\|antenna-gain\|radiation-pattern\|dipole-moment\|synchrotron-radiation\|relativistic-beaming\|bremsstrahlung\|continuous-x-ray-spectrum\|abraham-lorentz-equation\|self-energy-divergence\|radiation-reaction-term\|runaway-solution\)\"" lib/content/glossary.ts`

For every slug that returns a match: SKIP — do not add a duplicate. Session 5 added `radiation-pressure-term` (already present) so there's precedent for suffix-on-collision when a slug would clash with an existing topic or term.

- [ ] **Step 2: Append new glossary structural entries**

The `GlossaryTerm` interface from `lib/content/types.ts` requires: `slug`, `category`, and optional `illustration` / `images` / `visualization` / `relatedPhysicists` / `relatedTopics`. Full `term` / `shortDefinition` / `description` prose lives in the Wave 3 seed.

Suggested additions (trim at author time — target 12–15 total):

```ts
  // §10.1 larmor-formula
  {
    slug: "larmor-formula",
    category: "concept",
    relatedPhysicists: ["joseph-larmor"],
    relatedTopics: [
      { branchSlug: "electromagnetism", topicSlug: "larmor-formula" },
    ],
  },
  {
    slug: "larmor-power",
    category: "concept",
    relatedPhysicists: ["joseph-larmor"],
    relatedTopics: [
      { branchSlug: "electromagnetism", topicSlug: "larmor-formula" },
    ],
  },
  // §10.2 electric-dipole-radiation
  {
    slug: "near-field-zone",
    category: "concept",
    relatedTopics: [
      { branchSlug: "electromagnetism", topicSlug: "electric-dipole-radiation" },
    ],
  },
  {
    slug: "far-field-zone",
    category: "concept",
    relatedTopics: [
      { branchSlug: "electromagnetism", topicSlug: "electric-dipole-radiation" },
      { branchSlug: "electromagnetism", topicSlug: "antennas-and-radio" },
    ],
  },
  {
    slug: "retarded-time",
    category: "concept",
    relatedTopics: [
      { branchSlug: "electromagnetism", topicSlug: "electric-dipole-radiation" },
      { branchSlug: "electromagnetism", topicSlug: "radiation-reaction" },
    ],
  },
  // §10.3 antennas-and-radio
  {
    slug: "hertzian-dipole",
    category: "concept",
    relatedPhysicists: ["heinrich-hertz"],
    relatedTopics: [
      { branchSlug: "electromagnetism", topicSlug: "antennas-and-radio" },
      { branchSlug: "electromagnetism", topicSlug: "electric-dipole-radiation" },
    ],
  },
  {
    slug: "antenna-gain",
    category: "concept",
    relatedTopics: [
      { branchSlug: "electromagnetism", topicSlug: "antennas-and-radio" },
    ],
  },
  {
    slug: "radiation-pattern",
    category: "concept",
    relatedTopics: [
      { branchSlug: "electromagnetism", topicSlug: "antennas-and-radio" },
      { branchSlug: "electromagnetism", topicSlug: "electric-dipole-radiation" },
    ],
  },
  // §10.4 synchrotron-radiation
  {
    slug: "synchrotron-radiation",
    category: "phenomenon",
    relatedTopics: [
      { branchSlug: "electromagnetism", topicSlug: "synchrotron-radiation" },
    ],
  },
  {
    slug: "relativistic-beaming",
    category: "phenomenon",
    relatedTopics: [
      { branchSlug: "electromagnetism", topicSlug: "synchrotron-radiation" },
    ],
  },
  // §10.5 bremsstrahlung
  {
    slug: "bremsstrahlung",
    category: "phenomenon",
    relatedTopics: [
      { branchSlug: "electromagnetism", topicSlug: "bremsstrahlung" },
    ],
  },
  {
    slug: "duane-hunt-limit",
    category: "concept",
    relatedTopics: [
      { branchSlug: "electromagnetism", topicSlug: "bremsstrahlung" },
    ],
  },
  // §10.6 radiation-reaction
  {
    slug: "abraham-lorentz-equation",
    category: "concept",
    relatedPhysicists: ["hendrik-antoon-lorentz"],
    relatedTopics: [
      { branchSlug: "electromagnetism", topicSlug: "radiation-reaction" },
    ],
  },
  {
    slug: "runaway-solution",
    category: "concept",
    relatedTopics: [
      { branchSlug: "electromagnetism", topicSlug: "radiation-reaction" },
    ],
  },
  {
    slug: "self-energy-divergence",
    category: "concept",
    relatedTopics: [
      { branchSlug: "electromagnetism", topicSlug: "radiation-reaction" },
    ],
  },
```

- [ ] **Step 3: Verify TypeScript**

Run: `pnpm tsc --noEmit`
Expected: no errors.

### Task 1.4: Add `ALPHA_FINE` to physics constants

**File:** `lib/physics/constants.ts`.

- [ ] **Step 1: Append the constant**

Append after the existing `BOHR_MAGNETON` line:

```ts
/** Fine-structure constant α = e²/(4πε₀ ℏc) ≈ 1/137 (CODATA 2018, dimensionless) */
export const ALPHA_FINE = 7.2973525693e-3;
```

- [ ] **Step 2: Verify compile**

Run: `pnpm tsc --noEmit`
Expected: no errors.

### Task 1.5: Commit Wave 1

- [ ] **Step 1: Commit**

```bash
git add lib/content/branches.ts lib/content/physicists.ts lib/content/glossary.ts lib/physics/constants.ts
git commit -m "$(cat <<'EOF'
feat(em/§10): scaffold radiation topics, 3 physicists, glossary, ALPHA_FINE

Structural metadata only — adds 6 Topic entries (FIG.52–57), 3 new physicist
entries (Larmor, Hertz, Dirac), appends relatedTopics on Maxwell/Lorentz, and
~14 glossary structural entries across Larmor, dipole radiation, antennas,
synchrotron, bremsstrahlung, radiation reaction. Also adds ALPHA_FINE to
lib/physics/constants.ts for §10.1 Larmor prose.

Prose bios and glossary descriptions seeded separately in Wave 3 via
scripts/content/seed-em-06.ts.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

### Wave 2 — 6 parallel topic agents

**Purpose:** Dispatch 6 parallel subagents, one per §10 topic. Each authors a vertical slice: physics lib + vitest + 3 scene components + page.tsx + content.en.mdx. NO registry touch, NO publish, NO commit. Return a structured handoff block for Wave 2.5 orchestrator merge.

**Parallel, 6 subagents. 0 commits.** (Orchestrator commits per-topic in Wave 2.5.)

### Shared Wave 2 agent prompt (to be passed to each of the 6 subagents)

Each subagent receives this self-contained prompt with only the `<slug>` / `<fig-number>` / `<title>` / `<subtitle>` / module-specific physics context swapped in:

> You are authoring topic `<slug>` (FIG.<fig-number>) for the Physics.explained EM branch, §10 Radiation. Follow the parallel-safety contract exactly:
>
> - **Files you WILL create:**
>   - `lib/physics/electromagnetism/<lib-name>.ts` (pure TS; no React)
>   - `tests/physics/electromagnetism/<lib-name>.test.ts` (vitest, 3–8 tests covering the key analytical relationships; numeric tolerances ≤ 1e-4 for closed-form checks, ≤ 5% for approximate-spectrum shape tests)
>   - `components/physics/<scene-1>-scene.tsx` (Canvas 2D, "use client", named export <Scene1Name>Scene, useAnimationFrame hook, useThemeColors hook)
>   - `components/physics/<scene-2>-scene.tsx`
>   - `components/physics/<scene-3>-scene.tsx`
>   - `app/[locale]/(topics)/electromagnetism/<slug>/page.tsx` (exact canonical shape — only SLUG string changes)
>   - `app/[locale]/(topics)/electromagnetism/<slug>/content.en.mdx` (1100–1400 words baseline; 1400–1600 for §10.2 money shot and §10.6 honest moment)
>
> - **Files you must NOT touch:** `lib/content/simulation-registry.ts`, `components/physics/visualization-registry.tsx`, `lib/content/branches.ts`, `lib/content/physicists.ts`, `lib/content/glossary.ts`, `lib/physics/constants.ts`, `components/physics/antenna-radiation-pattern-scene.tsx` (belongs to §07.4), any file in `components/physics/ray-trace-canvas/`, any file in another topic's scope.
>
> - **Commands you must NOT run:** `pnpm content:publish`, `git add`, `git commit`.
>
> - **Physics lib imports from:**
>   - `@/lib/physics/constants` — use `EPSILON_0`, `MU_0`, `SPEED_OF_LIGHT`, `ELEMENTARY_CHARGE`, `BOHR_MAGNETON`, `ALPHA_FINE` as needed.
>   - `@/lib/physics/coulomb` for `Vec2` if 2D geometry helpers are useful.
>   - No cross-imports from other topics' physics libs.
>
> - **Scene components:**
>   - Palette: magenta `rgba(255,106,222,…)` (+), cyan `rgba(120,220,255,…)` (−/B), amber `rgba(255,180,80,…)` (light/radiation), green-cyan `rgba(140,240,200,…)` (induced current), lilac `rgba(200,160,255,…)` (field energy), pale-blue `rgba(140,200,255,…)` (wavefronts), and optional orange-red `rgba(255,140,80,…)` for X-ray / synchrotron beams.
>   - 400×250 canvas (or aspect 1.6:1); font-mono HUD for readouts; useAnimationFrame for animation.
>   - Named export `<SceneName>Scene` in PascalCase matching the registry name.
>
> - **MDX authoring (three hard rules from Session 5 regressions — do not repeat):**
>   - (i) No nested JSX inside string attributes (`title="..."`). Put `<PhysicistLink>` and `<Term>` in body prose only.
>   - (ii) No multi-line `$$…$$` math blocks. Collapse to a single line.
>   - (iii) No bare `<` or `>` in prose outside of math (`<0.5%` → `well under 0.5%` or `&lt;0.5%`).
>
> - **Link conventions:** `<PhysicistLink slug="joseph-larmor" />` for humans; `<Term slug="radiation-pattern" />` for concepts / phenomena / instruments / units. Do NOT use `<Term>` for a physicist.
>
> - **Physicist / term slugs guaranteed present in Supabase** at Wave 3 run time: the Wave 1 scaffold + Wave 3 seed together cover Larmor, Hertz, Dirac, Maxwell, Lorentz, and all §10 glossary terms from Wave 1 Task 1.3. `<PhysicistLink>` to any of them is safe. If you want to reference a physicist NOT in the Wave 1 scaffold (e.g., Marconi, Abraham), do ONE of: (a) mention in plain prose without a link, or (b) add the slug to your `forwardRefs` handoff array with `{slug, kind: "physicist", reason: "<why>"}` and Wave 3 will add a placeholder.
>
> - **HANDOFF BLOCK (return to orchestrator at end):**
>   ```
>   registry: |
>     // EM §10 — <slug>
>     <Scene1Name>: lazyScene(() =>
>       import("@/components/physics/<scene-1>-scene").then((m) => ({ default: m.<Scene1Name> })),
>     ),
>     <Scene2Name>: lazyScene(() =>
>       import("@/components/physics/<scene-2>-scene").then((m) => ({ default: m.<Scene2Name> })),
>     ),
>     <Scene3Name>: lazyScene(() =>
>       import("@/components/physics/<scene-3>-scene").then((m) => ({ default: m.<Scene3Name> })),
>     ),
>   publishArg: "electromagnetism/<slug>"
>   commitSubject: "feat(em/§10): <slug> — <tagline>"
>   forwardRefs: [{slug: "<missing-slug>", kind: "physicist|glossary", reason: "<why>"}, ...] | []
>   wordCount: <number>
>   ```

### Task 2.1: §10.1 larmor-formula

**Slug:** `larmor-formula`. **FIG:** 52. **Lib:** `lib/physics/electromagnetism/larmor.ts`. **Tagline:** "Power radiated by an accelerating charge."

**Money line to hit:** Power radiated by an accelerating point charge, non-relativistic: P = q²a² / (6πε₀c³). Independent of velocity (to leading order), scales as acceleration *squared*, has an angular pattern sin²θ (the "doughnut" lobe about the instantaneous acceleration vector). Every other §10 topic is a variation.

**Physics-lib surface:**

```ts
// lib/physics/electromagnetism/larmor.ts
export function larmorPower(q: number, aMag: number): number;
// P = q² a² / (6π ε₀ c³). Units: coulombs, m/s², watts.

export function larmorPowerRelativistic(q: number, aMag: number, v: number, parallel: boolean): number;
// Lienard generalization. If parallel: P = q²γ⁶a²/(6πε₀c³). Else perpendicular: P = q²γ⁴a²/(6πε₀c³).

export function larmorAngularIntensity(q: number, aMag: number, thetaRad: number): number;
// dP/dΩ = (q² a² / 16π² ε₀ c³) · sin²θ. θ from instantaneous acceleration axis.

export function thomsonCrossSection(): number;
// σ_T = (8π/3) · r_e², with r_e = q²/(4πε₀ m c²) ≈ 2.82 × 10⁻¹⁵ m for the electron.
// Returns σ_T ≈ 6.652 × 10⁻²⁹ m² for an electron.
```

**Tests (minimum 3):** (i) larmorPower(q_e, 1 m/s²) matches 5.71 × 10⁻⁵⁴ W within 1%; (ii) angular integral of larmorAngularIntensity over full sphere equals larmorPower; (iii) thomsonCrossSection returns 6.65 × 10⁻²⁹ m² ± 0.02 × 10⁻²⁹ m².

**Scenes (3):**
- `larmor-radiation-lobe-scene.tsx` (LarmorRadiationLobeScene) — polar-plot of sin²θ with the acceleration vector drawn centered, lobe outline + semi-transparent fill; user slider for acceleration magnitude (visual only, lobe stays sin²θ).
- `larmor-power-vs-acceleration-scene.tsx` (LarmorPowerVsAccelerationScene) — log-log plot of P vs a for electron over a ∈ [10⁰, 10²⁰] m/s² with grid lines; annotations for "hydrogen-electron orbit (10²² m/s²)", "synchrotron at 1 GeV (10⁻¹⁷ — scroll-off)", "car accelerating 0–100 (2.7 m/s²)".
- `larmor-relativistic-comparison-scene.tsx` (LarmorRelativisticComparisonScene) — non-rel vs γ⁴ (perpendicular) vs γ⁶ (parallel) power curves on same axes as a function of β = v/c.

**Aside links (suggested):** Joseph Larmor, J. C. Maxwell; `larmor-formula`, `larmor-power`, `radiation-pattern`.

**Cross-references in prose:** §08.1 (wave equation — where radiation "lives"), §03.5 (magnetic dipole — the analog problem), §07.4 (Poynting vector — what Larmor is integrating).

### Task 2.2: §10.2 electric-dipole-radiation (MONEY SHOT)

**Slug:** `electric-dipole-radiation`. **FIG:** 53. **Lib:** `lib/physics/electromagnetism/dipole-radiation.ts`. **Tagline:** "Near-field wraps, far-field breaks off into light."

**Money line to hit:** An oscillating electric dipole at the origin has two field regions: near-field (quasi-static, E ∝ 1/r³, stored energy, re-absorbed within one cycle) and far-field (radiative, E ∝ 1/r, energy carried away as spherical wavefronts). The transition radius is r ≈ c/ω = λ/(2π). **This is the moment fields LEAVE THEIR SOURCE.** Draw it literally — animated field-line topology showing loops pinching off as they cross the transition radius.

**Physics-lib surface:**

```ts
// lib/physics/electromagnetism/dipole-radiation.ts
export function dipoleNearFieldE(p0: number, omega: number, r: number, thetaRad: number, tRet: number): { Er: number; Etheta: number };
// Near-field E of an oscillating dipole p(t) = p₀ cos(ωt). Returns (E_r, E_θ) at (r, θ, t). Valid r ≪ c/ω.

export function dipoleFarFieldE(p0: number, omega: number, r: number, thetaRad: number, tRet: number): number;
// E_θ far-field: E_θ = -(μ₀ p₀ ω² / 4π r) · sin θ · cos(ω(t − r/c)). Valid r ≫ c/ω.

export function dipoleTotalPower(p0: number, omega: number): number;
// P = (μ₀ p₀² ω⁴) / (12π c). ⟨·⟩ time-average.

export function dipoleAngularIntensity(p0: number, omega: number, thetaRad: number): number;
// dP/dΩ = (μ₀ p₀² ω⁴ / 32π² c) · sin²θ.

export function transitionRadius(omega: number): number;
// r_transition = c/ω (the radius where near-field and far-field magnitudes cross over).
```

**Tests (minimum 4):** (i) dipoleTotalPower matches analytic μ₀p₀²ω⁴/(12πc) within 1e-12; (ii) angular integral of dipoleAngularIntensity = dipoleTotalPower; (iii) dipoleFarFieldE peaks at θ = π/2 and is zero at θ = 0, θ = π; (iv) transitionRadius(ω) · ω = SPEED_OF_LIGHT within 1e-12.

**Scenes (3):**
- `dipole-field-lines-scene.tsx` (DipoleFieldLinesScene) **— MONEY SHOT.** Oscillating vertical dipole at the origin. Field lines drawn as streamlines integrating from E = E_near + E_far at each time step; near-field lines form closed loops around the dipole, far-field lines propagate outward as expanding circles. Animation cycles through one full oscillation period; field-line colour shifts from lilac (near-field stored) to amber (far-field radiative) as each loop crosses the transition radius. Slider: ω (which sets λ = 2πc/ω and therefore the transition radius).
- `near-far-field-transition-scene.tsx` (NearFarFieldTransitionScene) — log-log plot of E_near(r) ∝ 1/r³ and E_far(r) ∝ 1/r vs r/λ; transition radius r = c/ω = λ/(2π) marked with a vertical line; crossover point labelled.
- `dipole-polar-pattern-scene.tsx` (DipolePolarPatternScene) — 3D-looking cross-section of the sin²θ doughnut about the dipole axis; rotating slowly for clarity.

**Aside links:** J. C. Maxwell, Heinrich Hertz; `near-field-zone`, `far-field-zone`, `retarded-time`, `dipole-moment`.

**Cross-references:** §03.5 (magnetic-dipole analogue), §08.2 (plane waves as far-field limit), §10.1 (Larmor formula specialized to a dipole).

### Task 2.3: §10.3 antennas-and-radio

**Slug:** `antennas-and-radio`. **FIG:** 54. **Lib:** `lib/physics/electromagnetism/antenna.ts`. **Tagline:** "From Hertz 1888 to transatlantic radio."

**Money line to hit:** An antenna is an accelerating-charge arrangement designed to radiate efficiently. The Hertzian (short) dipole is the simplest case; the half-wave dipole is the standard practical case (length = λ/2 → resonant, radiation resistance ≈ 73 Ω, gain ≈ 1.64). Hertz in 1888 built the first radio transmitter + receiver and measured standing waves to confirm Maxwell's c = 1/√(μ₀ε₀). Marconi in 1901 extended the range from 2 km across Bologna (1895) to 3500 km transatlantic (Poldhu → St. John's).

**Physics-lib surface:**

```ts
// lib/physics/electromagnetism/antenna.ts
export function radiationResistanceShort(lengthM: number, wavelengthM: number): number;
// R_rad = (2π/3) · μ₀ c · (L/λ)². Short-dipole (L ≪ λ) formula.

export function halfWaveDipoleGain(): number;
// Returns 1.64 (≈ 2.15 dBi). The canonical gain of a centre-fed λ/2 dipole.

export function effectiveAperture(gain: number, wavelengthM: number): number;
// A_eff = G · λ² / 4π. For a receiving antenna — the "collecting area" for far-field power.

export function pathLossDb(distanceM: number, wavelengthM: number): number;
// Free-space path loss FSPL = 20 · log₁₀(4π · d / λ). Friis.

export function radiationPatternHalfWaveDipole(thetaRad: number): number;
// |cos((π/2) cos θ) / sin θ|². The exact far-field pattern of a half-wave dipole.
```

**Tests (minimum 4):** (i) radiationResistanceShort(0.1, 1) ≈ 7.9 Ω ± 5%; (ii) halfWaveDipoleGain() === 1.64 (tolerance 1e-12); (iii) effectiveAperture(1.64, 1) ≈ 0.131 m²; (iv) pathLossDb(1000, 0.3) ≈ 82 dB ± 1 dB (900 MHz cellular 1 km baseline).

**Scenes (3):**
- `hertz-1888-apparatus-scene.tsx` (Hertz1888ApparatusScene) — schematic of Hertz's 1888 spark-gap transmitter and loop-antenna receiver; animated spark striking; outgoing radio wave drawn as concentric expanding circles; loop-antenna voltage trace plotting receiver response. Historical flavour: Karlsruhe lab, 8 Hz repetition rate of his induction-coil's spark.
- `half-wave-dipole-pattern-scene.tsx` (HalfWaveDipolePatternScene) — polar plot of |cos((π/2) cos θ)/sin θ|² next to sin²θ (Hertzian dipole) for comparison; both lobes drawn with shared axis; gain readout.
- `radio-path-loss-scene.tsx` (RadioPathLossScene) — interactive plot of free-space path loss vs distance for two frequencies (100 MHz FM vs 2.4 GHz Wi-Fi); transmit-antenna + receive-antenna icons either end with power-arrow decreasing.

**Aside links:** Heinrich Hertz, J. C. Maxwell; `hertzian-dipole`, `antenna-gain`, `radiation-pattern`, `far-field-zone`.

**Cross-references:** §10.2 (dipole radiation — the antenna IS a dipole), §10.1 (Larmor formula — antenna radiates because charges accelerate), §08.1 (wave equation — what's travelling), §06.5 (resonant circuits — antenna feeds impedance-matched circuits).

**Prose note:** Marconi's 1901 transatlantic story is the canonical narrative hook. If the agent judges the topic benefits from a `<PhysicistLink slug="guglielmo-marconi" />`, add Marconi to the Wave 2 `forwardRefs` handoff array; Wave 3 seeds a bio. Otherwise plain-prose mention.

### Task 2.4: §10.4 synchrotron-radiation

**Slug:** `synchrotron-radiation`. **FIG:** 55. **Lib:** `lib/physics/electromagnetism/synchrotron.ts`. **Tagline:** "Light made on purpose by bending electrons in a ring."

**Money line to hit:** An electron moving in a circle at radius R with Lorentz factor γ emits radiation tangent to its motion in a forward cone of half-angle Δθ ≈ 1/γ. At γ = 10⁴ (typical 3rd-gen light source), the cone is ~100 μrad — narrower than a laser pointer. Critical frequency ω_c = (3/2) γ³ c/R; the spectrum is broadband from radio through hard X-ray. Every modern synchrotron light source, every free-electron laser, and astrophysically every pulsar wind nebula emits by this mechanism.

**Physics-lib surface:**

```ts
// lib/physics/electromagnetism/synchrotron.ts
export function synchrotronPower(q: number, v: number, radius: number): number;
// P = (q² c · β⁴ γ⁴) / (6π ε₀ R²). Relativistic circular motion. Larmor × γ⁴.

export function emissionConeHalfAngleRad(gamma: number): number;
// Δθ = 1/γ. Opening half-angle of the forward emission cone.

export function criticalFrequency(gamma: number, radius: number): number;
// ω_c = (3/2) γ³ c / R. The frequency above which the spectrum falls off exponentially.

export function syncSpectrumShape(xNormalized: number): number;
// Approximate universal synchrotron spectral function F(x) where x = ω/ω_c.
// Uses the asymptotic forms: F(x) ≈ 2.15 x^(1/3) for x ≪ 1; F(x) ≈ 1.25 √x · e^(-x) for x ≫ 1.
// Matched in the middle with a smooth interpolation.

export function relativisticDopplerBoost(gamma: number, thetaRad: number): number;
// Forward-direction intensity boost factor. Max = γ² on-axis; falls off as (γθ)² increases.
```

**Tests (minimum 4):** (i) emissionConeHalfAngleRad(1e4) === 1e-4; (ii) criticalFrequency(1e4, 10) ≈ 4.5 × 10¹⁷ rad/s (X-ray regime); (iii) syncSpectrumShape(1e-3) ≈ 0.215 ± 5%; (iv) relativisticDopplerBoost(10, 0) === 100 exactly.

**Scenes (3):**
- `synchrotron-tangent-cone-scene.tsx` (SynchrotronTangentConeScene) — electron in a circular orbit; instantaneous emission cone drawn tangent to velocity at γ = 1, 10, 100, 1000 toggleable; cone half-angle shrinking as γ grows.
- `synchrotron-spectrum-scene.tsx` (SynchrotronSpectrumScene) — log-log plot of F(ω/ω_c) universal curve; ω_c marked; characteristic "power at ω ≪ ω_c grows as ω^(1/3), drops exponentially for ω ≫ ω_c" annotations; realistic x-axis span from ω_c/10⁴ to ω_c × 10.
- `relativistic-beaming-scene.tsx` (RelativisticBeamingScene) — side-by-side comparison: non-relativistic dipole doughnut vs γ = 5 forward-boosted lobe; rotating animation so the cone sweeps past the viewer producing the characteristic "pulsar-like" flash.

**Aside links:** Joseph Larmor (the relativistic Larmor is the base); `synchrotron-radiation`, `relativistic-beaming`, `larmor-formula`.

**Cross-references:** §10.1 (relativistic Larmor), §08.2 (plane waves — what synchrotron emits in the far field), §11 (full relativistic treatment — this topic uses minimal SR inline and points to §11 for the boost story).

**Prose note:** Minimal-SR inline here — Lorentz factor γ = 1/√(1−β²) is introduced in-line with two sentences of explanation, following the Session 5 discipline for §09 topics that touched relativity.

### Task 2.5: §10.5 bremsstrahlung

**Slug:** `bremsstrahlung`. **FIG:** 56. **Lib:** `lib/physics/electromagnetism/bremsstrahlung.ts`. **Tagline:** "Braking radiation — the X-ray tube's spectrum."

**Money line to hit:** When a charge decelerates (German "brems" = braking), it radiates a continuous spectrum — no line structure, just a broadband shape governed by the deceleration profile. The canonical case: electrons slamming into a tungsten target in a medical/dental X-ray tube. The upper cutoff (Duane-Hunt limit) is E_max = eU where U is the accelerating voltage: a 50 kV tube produces photons up to 50 keV and no higher. The spectrum shape for a thick target is roughly dN/dE ∝ (E_max − E)/E (Kramers' formula, 1923).

**Physics-lib surface:**

```ts
// lib/physics/electromagnetism/bremsstrahlung.ts
export function duaneHuntEnergy(voltageV: number): number;
// E_max = e · U. Returns energy in joules; convenience function for the cutoff.

export function duaneHuntWavelengthM(voltageV: number): number;
// λ_min = h c / (e U). The minimum X-ray wavelength a tube can produce.

export function kramersSpectrum(E_keV: number, E_max_keV: number): number;
// dN/dE ∝ (E_max − E) / E. Thick-target approximation; Kramers 1923. Returns 0 for E > E_max.

export function thinTargetSpectrum(E_keV: number, E_max_keV: number): number;
// dN/dE ∝ ln(E_max / E) for E < E_max; Bethe-Heitler thin-target approximation.

export function bremsstrahlungAngularDistribution(thetaRad: number, gamma: number): number;
// sin²θ / (1 − β cos θ)⁴ — relativistic bremsstrahlung angular distribution. Reduces to sin²θ at γ → 1.
```

**Tests (minimum 3):** (i) duaneHuntEnergy(50_000) / ELEMENTARY_CHARGE ≈ 50_000 eV within 1 eV; (ii) kramersSpectrum(E, E_max) integrates to a finite total (numerical integration); (iii) bremsstrahlungAngularDistribution at γ = 1 reduces to sin²θ within 1e-12.

**Scenes (3):**
- `coulomb-deflection-scene.tsx` (CoulombDeflectionScene) — electron incoming toward a heavy-nucleus target; trajectory deflects; radiation emitted (amber arrow) tangent to velocity at the deflection point; impact-parameter slider adjusts how close the electron approaches and how hard the brake.
- `continuous-xray-spectrum-scene.tsx` (ContinuousXraySpectrumScene) — Kramers spectrum plot with the Duane-Hunt cutoff edge visible; voltage slider (10–150 kV) shifts the cutoff and the full spectrum proportionally; optional overlay of characteristic Kα/Kβ lines of tungsten (at ~59 keV) for clinical context.
- `thick-target-shape-scene.tsx` (ThickTargetShapeScene) — side-by-side plot of thick-target (Kramers, monotonic decrease) vs thin-target (Bethe-Heitler, logarithmic divergence at low E) spectra for pedagogical comparison.

**Aside links:** (optional) Hans Bethe if already in PHYSICISTS — otherwise plain-prose; `bremsstrahlung`, `duane-hunt-limit`, `continuous-x-ray-spectrum` (if created) or just `bremsstrahlung`.

**Cross-references:** §10.1 (Larmor — bremsstrahlung is Larmor applied to deceleration), §10.4 (synchrotron — magnetic-field deceleration), §07.4 (Poynting vector — energy flux).

### Task 2.6: §10.6 radiation-reaction (HONEST MOMENT)

**Slug:** `radiation-reaction`. **FIG:** 57. **Lib:** `lib/physics/electromagnetism/radiation-reaction.ts`. **Tagline:** "The force a charge exerts back on itself — classical EM's unsolved seam."

**Money line to hit:** If an accelerating charge radiates energy away, then by energy conservation the charge must feel a force that drains its kinetic energy. Abraham and Lorentz wrote this force down in 1903: F_rad = (μ₀ q²/6πc) · ȧ — proportional to the *derivative* of acceleration. This is already strange: Newton's laws relate force to acceleration, not to jerk. Worse: the equation of motion becomes a third-order ODE and has "runaway solutions" where acceleration grows as exp(t/τ₀), and also "pre-acceleration" solutions where the charge responds before the force is applied. Landau-Lifshitz 1962 derived a reduced-order approximation by substituting Ḟ_ext/m for ȧ that avoids the pathologies for physically reasonable external forces. Dirac 1938 extended to a relativistic equation (the ALD equation) that has the same problems. **Classical electrodynamics does not cleanly solve the radiation-reaction problem.** QED with renormalisation sidesteps the divergences at the cost of admitting the bare electron mass is infinite and regularising. At the classical level the problem remains open — the seam in the fabric.

**Physics-lib surface:**

```ts
// lib/physics/electromagnetism/radiation-reaction.ts
export function abrahamLorentzForce(q: number, jerk: number): number;
// F_rad = (μ₀ q² / 6π c) · ȧ. Signed; direction opposite to ȧ.

export function radiationReactionTimescale(q: number, m: number): number;
// τ₀ = q² / (6π ε₀ m c³). For electron: τ₀ ≈ 6.27 × 10⁻²⁴ s. The "light-crossing time of the classical electron radius."

export function runawaySolution(t: number, a0: number, tau0: number): number;
// a(t) = a₀ · exp(t/τ₀). The pathological solution of the free Abraham-Lorentz equation — no external force, yet acceleration grows without bound.

export function landauLifshitzForce(q: number, m: number, Fext: number, FextDot: number): number;
// Reduced-order approximation. F_rr ≈ (τ₀/m) · Ḟ_ext. Avoids runaways and pre-acceleration for smooth external forces.

export function classicalElectronRadius(): number;
// r_e = q² / (4π ε₀ m c²) ≈ 2.818 × 10⁻¹⁵ m for the electron. Not the "radius of the electron" — it is the radius at which electrostatic self-energy equals mc².
```

**Tests (minimum 4):** (i) radiationReactionTimescale(ELEMENTARY_CHARGE, 9.109e-31) ≈ 6.27e-24 s within 1%; (ii) runawaySolution(10 * tau0, 1, tau0) === e^10 ± 1e-10; (iii) classicalElectronRadius() ≈ 2.818e-15 m within 0.1%; (iv) landauLifshitzForce with Ḟ_ext = 0 returns 0.

**Scenes (3):**
- `abraham-lorentz-phase-scene.tsx` (AbrahamLorentzPhaseScene) — phase-plane portrait (a, ȧ) showing the runaway trajectory as an outward exponential spiral; stable zero-acceleration axis; initial condition slider illustrates how vanishing ȧ initial conditions give the "physical" solution, non-zero give runaway.
- `runaway-vs-reduced-order-scene.tsx` (RunawayVsReducedOrderScene) — side-by-side plots: (left) Abraham-Lorentz acceleration vs time exploding; (right) Landau-Lifshitz reduced-order acceleration vs time remaining bounded under the same external force (a square-pulse).
- `radiation-reaction-timescale-scene.tsx` (RadiationReactionTimescaleScene) — log timescale chart showing τ₀ (classical electron, 6×10⁻²⁴ s) vs Planck time (5.4×10⁻⁴⁴) vs atomic-transition time (10⁻¹⁵) vs nuclear-decay time; annotation: "at t ~ τ₀ the classical picture breaks down; QED is required."

**Aside links:** Hendrik Lorentz, Paul Dirac (both in Wave 1 scaffold); `abraham-lorentz-equation`, `runaway-solution`, `self-energy-divergence`, `radiation-reaction-term`.

**Cross-references:** §10.1 (Larmor — the energy being drained), §12.1 (gauge-theory-origins — the self-interaction problem motivated renormalisation in QED; the classical seam sets up the quantum resolution), §11 (the ALD equation is relativistic — belongs with §11's full Lorentz-covariant treatment but is introduced here inline).

**Prose note:** Target 1400–1500 words. This is the honesty moment of the branch. Write the unresolved status of classical radiation reaction directly — "this is the seam in the fabric; QED smooths it over via renormalisation but at the classical level the problem remains open." Do NOT hand-wave. Do NOT claim the Landau-Lifshitz approximation "solves" the problem — it avoids the pathologies for smooth external forces but is not a fundamental resolution. The spec's Risk Notes section explicitly calls for this tone.

**Optional `forwardRefs`:** Max Abraham (slug `max-abraham`) — if the agent wants a `<PhysicistLink>` for the historical-lineage section. Otherwise plain-prose mention.

---

### Wave 2.5 — Registry merge, publish, and per-topic commits

**Purpose:** Serially merge the 6 registry blocks into `lib/content/simulation-registry.ts`, run `pnpm content:publish` for each topic, and `git commit` per topic with the agent-supplied subject line. If any publish returns `0 inserted / 0 updated`, investigate MDX parse errors before committing. Work in FIG order (52 → 57) to keep the git history readable.

**Serial, 1 orchestrator. 6 commits (+ 1 reconciliation commit if a parse error surfaces).**

### Task 2.5.1: Aggregate and insert the 6 registry blocks

**File:** `lib/content/simulation-registry.ts` — append the six `// EM §10 — <slug>` blocks at the end of the `SIMULATION_REGISTRY` object, before the closing `};`. Order them FIG.52 → FIG.57.

- [ ] **Step 1: Locate the closing `};` of `SIMULATION_REGISTRY`**

Run: `grep -n "^};" lib/content/simulation-registry.ts | head -1`
Expected: one line number (the close of the `SIMULATION_REGISTRY` object).

- [ ] **Step 2: Build the aggregated block**

From the 6 agent handoffs' `registry:` fields, concatenate in FIG order. Each block looks like:
```ts
  // EM §10 — larmor-formula
  LarmorRadiationLobeScene: lazyScene(() =>
    import("@/components/physics/larmor-radiation-lobe-scene").then((m) => ({ default: m.LarmorRadiationLobeScene })),
  ),
  LarmorPowerVsAccelerationScene: lazyScene(() =>
    import("@/components/physics/larmor-power-vs-acceleration-scene").then((m) => ({ default: m.LarmorPowerVsAccelerationScene })),
  ),
  LarmorRelativisticComparisonScene: lazyScene(() =>
    import("@/components/physics/larmor-relativistic-comparison-scene").then((m) => ({ default: m.LarmorRelativisticComparisonScene })),
  ),

  // EM §10 — electric-dipole-radiation
  ...
```

- [ ] **Step 3: Edit `simulation-registry.ts` to insert the aggregated block before `};`**

Use `Edit` to locate the `// EM §09 — waveguides-and-fibers` section's final entry (the last registry entry from Session 5) and append the new `// EM §10 — ...` blocks immediately after it, still inside the `SIMULATION_REGISTRY = { ... };` object.

- [ ] **Step 4: Verify compile**

Run: `pnpm tsc --noEmit`
Expected: no errors. If an import path is wrong or a named export mismatches, fix per the actual scene file before committing. Do NOT commit yet — the per-topic commits in the next task bundle each section with its matching `content:publish`.

### Task 2.5.2: Per-topic publish + commit (6 times, FIG order)

For each of the 6 topics in order: `larmor-formula`, `electric-dipole-radiation`, `antennas-and-radio`, `synchrotron-radiation`, `bremsstrahlung`, `radiation-reaction`.

- [ ] **Step 1: Per-topic publish**

```bash
pnpm content:publish --only electromagnetism/<slug> 2>&1 | tail -5
```

Expected: `1 inserted` on first publish. If `0 / 0`, the MDX parser silently failed. Open `app/[locale]/(topics)/electromagnetism/<slug>/content.en.mdx` and check for:
  - bare `<` or `>` in prose that looks like a JSX tag opener (e.g., "temperature <300 K" → "temperature under 300 K");
  - multi-line `$$...$$` math blocks (collapse to one line);
  - nested `<PhysicistLink>` / `<Term>` inside JSX string attributes (`title="Foo <PhysicistLink/>"`);
  - unescaped backslashes in `<EquationBlock tex="...">` when quoted (prefer the template-literal form `tex={`\\nabla E`}`);
  - unclosed `<Section>` / `<TopicPageLayout>` tags.

After fixing, re-run the publish command. Expected: `1 inserted` or `1 updated`. Source-hash shift is normal on any MDX edit.

- [ ] **Step 2: Per-topic commit**

```bash
git add app/\[locale\]/\(topics\)/electromagnetism/<slug>/ \
        components/physics/<scene-1>-scene.tsx \
        components/physics/<scene-2>-scene.tsx \
        components/physics/<scene-3>-scene.tsx \
        lib/physics/electromagnetism/<lib-name>.ts \
        tests/physics/electromagnetism/<lib-name>.test.ts \
        lib/content/simulation-registry.ts
git commit -m "$(cat <<EOF
<agent-supplied commitSubject>

<one short paragraph describing the physics and the scene landed, drawn from the topic's content>

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

Note: `simulation-registry.ts` is added to each per-topic commit even though it was edited once (in Task 2.5.1). Only the first commit in the FIG sequence actually stages the registry-diff; subsequent commits see no staged change in that file, which is fine. (Alternative: stage the registry-diff entirely with the FIG.52 commit; later commits omit the registry path.) Pick one convention and apply uniformly.

- [ ] **Step 3: Loop**

Repeat Steps 1–2 for FIG.53, 54, 55, 56, 57. After each commit, verify `git log --oneline -1` matches the expected subject.

### Task 2.5.3: Verify dev-server rendering for all 6 routes

- [ ] **Step 1: Start dev server in the background**

```bash
pnpm dev &
DEV_PID=$!
sleep 10
```

The port is typically 3000 but may fall back to 3001 if 3000 is occupied — Session 5 precedent noted this.

- [ ] **Step 2: Curl sweep all 6 routes + retry any 404**

```bash
for slug in larmor-formula electric-dipole-radiation antennas-and-radio synchrotron-radiation bremsstrahlung radiation-reaction; do
  code=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/en/electromagnetism/$slug)
  echo "$slug: $code"
done
```

Expected: 200 × 6. First attempt may return 404 due to cold-compile; a second curl immediately after the first completes returns 200 (Session 5 precedent).

- [ ] **Step 3: Kill dev server**

```bash
kill $DEV_PID 2>/dev/null
```

---

### Wave 3 — Seed script, verification, spec update, implementation log

**Purpose:** (a) Author `scripts/content/seed-em-06.ts` with 3 physicist bios (Larmor, Hertz, Dirac; optionally Marconi and Abraham if surfaced as forwardRefs) and ~14 glossary descriptions; (b) run the seed and verify with SQL sampling; (c) scan all 6 MDX files for forward-ref slugs pointing at §11/§12 and add placeholders; (d) update the spec's module status + per-topic checklist + progress % to 57/66 (86%); (e) file the implementation log to MemPalace wing=physics, room=decisions.

**Serial, 2 subagents in sequence. 2 commits (seed + spec/log).**

### Task 3.1: Scan for forward-refs from §10 MDX

- [ ] **Step 1: Grep all 6 content.en.mdx for `<PhysicistLink slug="..."/>` and `<Term slug="..."/>`**

```bash
grep -rhE "(<PhysicistLink|<Term) slug=\"[^\"]+\"" \
  app/\[locale\]/\(topics\)/electromagnetism/larmor-formula \
  app/\[locale\]/\(topics\)/electromagnetism/electric-dipole-radiation \
  app/\[locale\]/\(topics\)/electromagnetism/antennas-and-radio \
  app/\[locale\]/\(topics\)/electromagnetism/synchrotron-radiation \
  app/\[locale\]/\(topics\)/electromagnetism/bremsstrahlung \
  app/\[locale\]/\(topics\)/electromagnetism/radiation-reaction \
  | sort -u
```

- [ ] **Step 2: For each unique slug, check Supabase**

```bash
mcp__physics-supabase__execute_sql <<'EOF'
select kind, slug from content_entries where (kind, slug) in
  (('physicist','joseph-larmor'), ('physicist','heinrich-hertz'), ('physicist','paul-dirac'), ('glossary','radiation-reaction-term'), ...)
order by kind, slug;
EOF
```

Any row missing from the query result is a forward-ref needing either (a) a placeholder GlossarySeed in seed-em-06.ts using the `// FORWARD-REF: full treatment in §XX` pattern, or (b) a physicist-placeholder analogue.

### Task 3.2: Author `scripts/content/seed-em-06.ts`

**File:** `scripts/content/seed-em-06.ts` — copy the exact shape of `seed-em-05.ts`, replacing the PHYSICISTS + GLOSSARY arrays with §10-specific content.

- [ ] **Step 1: Scaffold the file**

```ts
// Seed EM §10 Radiation
// 3 physicists + ~14 glossary terms (+ any forward-ref placeholders surfaced at Task 3.1)
// Run: pnpm exec tsx --conditions=react-server scripts/content/seed-em-06.ts
import "dotenv/config";
import { createHash } from "node:crypto";
import { getServiceClient } from "@/lib/supabase-server";

interface PhysicistSeed {
  slug: string;
  name: string;
  shortName: string;
  born: string;
  died: string;
  nationality: string;
  oneLiner: string;
  bio: string;
  contributions: string[];
  majorWorks: string[];
  relatedTopics: { branchSlug: string; topicSlug: string }[];
}

interface GlossarySeed {
  slug: string;
  term: string;
  category: "concept" | "phenomenon" | "instrument" | "unit";
  shortDefinition: string;
  description: string;
  history?: string;
  relatedPhysicists?: string[];
  relatedTopics?: { branchSlug: string; topicSlug: string }[];
}

function parseMajorWork(s: string): { title: string; year: string; description: string } {
  const match = s.match(/^(.+?)\s*\(([^)]+)\)\s*(—\s*(.+))?$/);
  if (match) return { title: match[1].trim(), year: match[2].trim(), description: match[4]?.trim() ?? "" };
  return { title: s, year: "", description: "" };
}

const PHYSICISTS: PhysicistSeed[] = [ /* ... see Step 2 ... */ ];
const GLOSSARY: GlossarySeed[] = [ /* ... see Step 3 ... */ ];

function paragraphsToBlocks(text: string): Array<{ type: "paragraph"; inlines: string[] }> {
  return text
    .split("\n\n")
    .map((p) => p.trim())
    .filter((p) => p.length > 0)
    .map((p) => ({ type: "paragraph" as const, inlines: [p] }));
}

async function main() {
  const client = getServiceClient();
  console.log(`Seeding ${PHYSICISTS.length} physicists + ${GLOSSARY.length} glossary terms (en)…`);

  for (const p of PHYSICISTS) {
    const blocks = paragraphsToBlocks(p.bio);
    const meta = {
      shortName: p.shortName,
      born: p.born,
      died: p.died,
      nationality: p.nationality,
      contributions: p.contributions,
      majorWorks: p.majorWorks.map(parseMajorWork),
      relatedTopics: p.relatedTopics.map(({ branchSlug, topicSlug }) => ({ branchSlug, topicSlug })),
    };
    const payload = JSON.stringify({ title: p.name, subtitle: p.oneLiner, blocks, meta });
    const source_hash = createHash("sha256").update(payload).digest("hex");

    const { error } = await client.from("content_entries").upsert({
      kind: "physicist", slug: p.slug, locale: "en",
      title: p.name, subtitle: p.oneLiner, blocks, meta, source_hash,
    }, { onConflict: "kind,slug,locale" });
    if (error) throw error;
    console.log(`  ✓ physicist/${p.slug}`);
  }

  for (const g of GLOSSARY) {
    const blocks = paragraphsToBlocks(g.description);
    const meta = {
      category: g.category,
      shortDefinition: g.shortDefinition,
      ...(g.history ? { history: g.history } : {}),
      ...(g.relatedPhysicists ? { relatedPhysicists: g.relatedPhysicists } : {}),
      ...(g.relatedTopics ? { relatedTopics: g.relatedTopics } : {}),
    };
    const payload = JSON.stringify({ title: g.term, subtitle: g.shortDefinition, blocks, meta });
    const source_hash = createHash("sha256").update(payload).digest("hex");

    const { error } = await client.from("content_entries").upsert({
      kind: "glossary", slug: g.slug, locale: "en",
      title: g.term, subtitle: g.shortDefinition, blocks, meta, source_hash,
    }, { onConflict: "kind,slug,locale" });
    if (error) throw error;
    console.log(`  ✓ glossary/${g.slug}`);
  }
  console.log("done.");
}

main().catch((e) => { console.error(e); process.exit(1); });
```

- [ ] **Step 2: Write the 3 PHYSICISTS bios** (300–400 words each — tight, factual; Session 5 500-word bios hit a stream timeout)

For each of Larmor, Hertz, Dirac (and optionally Marconi, Abraham if surfaced), produce a `PhysicistSeed` with:
  - `oneLiner` (~50–80 words; keep it under two sentences)
  - `bio` (300–400 words; 3 paragraphs — education/early career, central work, legacy/death)
  - `contributions` (5–6 bullets, each a single factual sentence)
  - `majorWorks` (2–3 items, "Title (year) — brief" format for the parseMajorWork helper)

Key biographical facts:

**Joseph Larmor (1857–1942, Irish).** Cambridge mathematical physicist. 1897 derived P = q²a²/(6πε₀c³) — the defining classical result for how accelerating charges radiate. Larmor precession ω_L = qB/(2m). 1900 *Aether and Matter* — scalar-aether model that came close to SR without making the conceptual break. Lucasian Professor of Mathematics 1903 (Newton's chair). Knighted 1909. Strong opponent of Einstein's relativity to the end.

**Heinrich Hertz (1857–1894, German).** Karlsruhe + Bonn physicist. 1886–1888 experimentally confirmed Maxwell's 1862 prediction that EM waves propagate at c. Built the first spark-gap oscillator (transmitter) and loop-antenna detector (receiver). Measured wavelength by standing-wave patterns; confirmed reflection, refraction, and polarisation of radio waves. Died at 36 of Wegener's granulomatosis. SI unit of frequency carries his name.

**Paul Dirac (1902–1984, British).** Cambridge/Florida State theoretical physicist. Dirac equation (1928) — relativistic wave equation for the electron, predicted antiparticles (positron discovered 1932). Quantum electrodynamics (co-founder with Heisenberg, Pauli, etc.). 1938 classical paper "Classical theory of radiating electrons" — the relativistic Abraham-Lorentz-Dirac equation. Shared 1933 Nobel in Physics with Schrödinger. Known for the Dirac delta, the Dirac sea, bra-ket notation, and for being the most laconic major physicist of the 20th century.

- [ ] **Step 3: Write the ~14 GLOSSARY descriptions** (150–250 words each; 1–2 paragraphs)

One GlossarySeed per structural entry added in Task 1.3. Key entries to write:

**larmor-formula** (concept). "Power radiated by an accelerating point charge: P = q² a² / (6π ε₀ c³). Derived by Joseph Larmor in 1897; the foundational result of classical radiation theory." 150 words.

**larmor-power** (concept). "The specific numeric output of Larmor's formula for a given charge and acceleration; used as a benchmark (e.g., an electron accelerated at 10 m/s² radiates ~5.7 × 10⁻⁴⁵ W)." 100 words.

**near-field-zone** (concept). "The region r ≪ c/ω around an oscillating source where the field is quasi-static — E ∝ 1/r³, stored energy, re-absorbed each cycle, no net energy flow outward." 200 words.

**far-field-zone** (concept). "The region r ≫ c/ω around an oscillating source where the field is radiative — E ∝ 1/r, E ⊥ B ⊥ k̂, energy flows outward as spherical wavefronts." 200 words.

**retarded-time** (concept). "The time t_ret = t − r/c — the instant in the source's past when the signal we observe at time t actually left the source. Foundational to all radiation calculations." 150 words.

**hertzian-dipole** (concept). "A current-carrying element short compared to a wavelength (L ≪ λ). Hertz's 1888 apparatus modelled it as a point dipole; radiation resistance R_rad ∝ (L/λ)²; gain 1.5." 200 words.

**antenna-gain** (concept). "Ratio of the antenna's radiation intensity in its maximum-direction to that of an isotropic radiator of the same total power. Dimensionless; often expressed in dBi = 10 log₁₀ G." 200 words.

**radiation-pattern** (concept). "The angular distribution dP/dΩ of radiated power. For a Hertzian dipole it is sin²θ (toroidal lobe); for a half-wave dipole slightly narrower." 200 words.

**synchrotron-radiation** (phenomenon). "Light emitted tangentially by a relativistic charge moving in a circular path. Named for the synchrotron particle accelerators where it was first observed (General Electric 1947). Broadband spectrum from radio to hard X-ray. Drives every modern light source; astrophysically produces pulsar-wind-nebula emission." 250 words.

**relativistic-beaming** (phenomenon). "For a source moving at β → 1, radiation is Lorentz-boosted into a forward cone of half-angle ~1/γ. At γ = 10⁴ the cone is 100 μrad." 200 words.

**bremsstrahlung** (phenomenon). "German 'braking radiation' — the continuous electromagnetic spectrum emitted when a charge decelerates. The dominant mechanism in X-ray tubes; also medically relevant in proton therapy and astrophysically in hot-plasma emission." 250 words.

**duane-hunt-limit** (concept). "The maximum photon energy produced by an X-ray tube: E_max = eU, where U is the accelerating voltage. A 50 kV tube cannot produce photons above 50 keV regardless of target material." 150 words.

**abraham-lorentz-equation** (concept). "F_rad = (μ₀ q²/6πc) · ȧ — the classical self-force on a radiating charge, derived by Abraham 1903 and Lorentz 1904. Produces a third-order equation of motion with runaway and pre-acceleration pathologies." 250 words.

**runaway-solution** (concept). "A solution to the Abraham-Lorentz equation in which acceleration grows exponentially as exp(t/τ₀) with τ₀ ~ 6 × 10⁻²⁴ s for the electron — in the absence of any external force. A pathology of the classical theory." 200 words.

**self-energy-divergence** (concept). "The infinite electrostatic energy computed for a point charge ∫(ε₀/2)E² dV. In classical theory unresolved; in QED renormalised by absorbing the divergence into the bare electron mass." 250 words.

- [ ] **Step 4: Add any forward-ref placeholders from Task 3.1**

Use the `// FORWARD-REF: full treatment in §0X` pattern from `seed-em-04.ts:637–665`. Likely candidates:
  - `field-tensor` (→ §11) if §10.4 or §10.6 reference the covariant ALD equation.
  - `four-potential` (→ §11.5) similarly.
  - `aharonov-bohm-effect` (→ §12.2) if §10.6 references QED resolution.

Each placeholder's `shortDefinition` ends with "Full treatment in §0X" and the `description` begins "This is a placeholder entry..."

### Task 3.3: Run the seed script + verify with SQL

- [ ] **Step 1: Run**

```bash
pnpm exec tsx --conditions=react-server scripts/content/seed-em-06.ts 2>&1 | tail -30
```

Expected: `✓ physicist/joseph-larmor`, `✓ physicist/heinrich-hertz`, `✓ physicist/paul-dirac`, and 14–15 `✓ glossary/<slug>` lines, ending with `done.`.

- [ ] **Step 2: Verify via Supabase SQL**

```sql
select kind, slug, length(subtitle) as subtitle_len, jsonb_array_length(blocks) as blocks_count
from content_entries
where (kind = 'physicist' and slug in ('joseph-larmor','heinrich-hertz','paul-dirac'))
   or (kind = 'glossary' and slug in ('larmor-formula','near-field-zone','far-field-zone','hertzian-dipole','antenna-gain','radiation-pattern','synchrotron-radiation','relativistic-beaming','bremsstrahlung','duane-hunt-limit','abraham-lorentz-equation','runaway-solution','self-energy-divergence'))
   and locale = 'en'
order by kind, slug;
```

Run via `mcp__physics-supabase__execute_sql`.
Expected: 3 physicist rows with subtitle_len > 50 and blocks_count ≥ 3; glossary rows with subtitle_len > 50 and blocks_count ≥ 1.

- [ ] **Step 3: Commit the seed**

```bash
git add scripts/content/seed-em-06.ts
git commit -m "$(cat <<'EOF'
fix(em/§10): seed physicists + glossary prose into Supabase

Adds scripts/content/seed-em-06.ts — 3 new physicist bios (Larmor, Hertz,
Dirac) and ~14 glossary descriptions across larmor-formula, dipole radiation,
antennas, synchrotron, bremsstrahlung, and radiation reaction. Plus any
forward-ref placeholders pointing at §11/§12.

Run: pnpm exec tsx --conditions=react-server scripts/content/seed-em-06.ts

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

### Task 3.4: Update spec progress + file implementation log

- [ ] **Step 1: Edit `docs/superpowers/specs/2026-04-22-electromagnetism-branch-design.md`**

Update the header's Status line (line 4) to include `§10 shipped 2026-04-24`.

Update the Module status table (around line 310) — change `§10 Radiation | 6 | 0 | ☐ not started` to `§10 Radiation | 6 | 6 | ☑ complete`, and update the total row to `**66** | **57** | **86% complete**`.

Update the Per-topic checklist (around line 401) — tick all 6 `[ ]` boxes under §10 Radiation to `[x]`.

- [ ] **Step 2: Commit the spec update**

```bash
git add docs/superpowers/specs/2026-04-22-electromagnetism-branch-design.md \
        docs/superpowers/plans/2026-04-24-electromagnetism-session-6-radiation.md
git commit -m "$(cat <<'EOF'
docs(em/§10): mark radiation module complete — 57/66 (86%)

Closes §10 Radiation (6 topics, FIG.52–57). Only §11 EM & Relativity (5) and
§12 Foundations (4) remain — 9 topics across 2 modules before the EM branch
reaches 66/66. Two sessions to branch completion.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

- [ ] **Step 3: File the implementation log to MemPalace**

Use `mcp__plugin_mempalace_mempalace__mempalace_kg_add` or the CLI (`mempalace`) to write `implementation_log_em_session_6_radiation.md` into `wing=physics`, `room=decisions`. Log should include:

  - What shipped: 6 topics, FIG.52–57; all routes 200 at `/en/electromagnetism/<slug>`.
  - Wave-by-wave recap.
  - Diagnostic answers to the prompt's open questions: (a) did we build a DipoleRadiationCanvas primitive or handle field-lines topic-by-topic, and if topic-by-topic did duplication pain emerge? (b) how did the §10.6 radiation-reaction honesty land — too dense, or just right? (c) any new forward-refs pointing at §11/§12? (d) did Hertz land across §08.1/§10.3 back-references? (e) is the `content:publish` CLI still hashing raw MDX, or did we patch it this session?
  - Deviations from plan (if any).
  - Verification results: tsc, vitest, build, curl sweep, SQL post-seed sample.
  - Next session signpost: §11 EM & Relativity (5 topics, FIG.58–62) — the branch's emotional apex.

---

## Known gotchas carried from Sessions 1–5

**(A) Seed script for new physicists + glossary prose.** `PhysicistLink` and `Term` components fetch from Supabase `content_entries` at render time; TS arrays are structural metadata only. → Wave 3 creates `seed-em-06.ts`. Per-entry discipline: bios ~300–400 words (3 paragraphs), glossary descriptions ~150–250 words.

**(B) Forward-reference placeholders.** Session 5 surfaced none pointing at §10/§11/§12. Session 6 may surface 1–2 pointing at §11 (field-tensor, four-potential) or §12 (aharonov-bohm). Scan all 6 MDX files at Wave 3 Task 3.1; add placeholders via the `// FORWARD-REF: full treatment in §0X` pattern.

**(C) `pnpm content:publish --force` for parser-affected re-publishes.** The CLI hashes raw MDX source, not parsed output. Parser fixes need `--force` to re-publish. Session 6 shouldn't need a backfill; if one surfaces, reinstate a mini-Wave 0 afterwards. **Consider a CLI patch** (15-minute change in `scripts/content/publish.ts` — hash on `JSON.stringify({title, subtitle, blocks, aside_blocks, meta})` instead of the raw MDX string) as a mid-session quality-of-life improvement, but it's optional.

**(D) MDX authoring gotchas (Session 5 regressions — already baked into the Wave 2 agent prompt above).**
  - (i) No nested JSX inside `title=""` JSX attributes.
  - (ii) No multi-line `$$…$$` math blocks.
  - (iii) No bare `<` / `>` in prose (outside of math).

**(E) Shared types between primitive and Wave 2 agents.** No primitive this session. `Vec2` from `@/lib/physics/coulomb` for 2D helpers if useful.

**(F) §10 physics-lib nesting convention.** Continue the Session 2-established `lib/physics/electromagnetism/<topic>.ts` layout. Use constants from `@/lib/physics/constants` — `MU_0`, `EPSILON_0`, `SPEED_OF_LIGHT`, `ELEMENTARY_CHARGE`, `BOHR_MAGNETON`, and the new `ALPHA_FINE` added in Wave 1.

**(G) `<PhysicistLink>` vs `<Term>` convention.** Humans → `<PhysicistLink slug="..." />`. Concepts / phenomena / instruments / units → `<Term slug="..." />`. Session 5 §09.8 used `<Term>` for Huygens (convention slip — worked at runtime but produced a glossary placeholder when a physicist one would have been correct). Session 6 agent prompt enforces the convention.

**(H) Scene-file naming.** Flat `components/physics/<kebab-slug>-scene.tsx` — **not** per-topic subdirectories (the only subdirectories are the primitive dirs: `components/physics/circuit-canvas/`, `components/physics/ray-trace-canvas/`). Do NOT create `components/physics/larmor-formula/LarmorRadiationLobeScene.tsx` — the registry expects flat import paths.

**(I) Pre-existing `antenna-radiation-pattern-scene.tsx` collision.** That file is owned by §07.4 `the-poynting-vector`. §10.3 `antennas-and-radio` MUST use distinct scene filenames (`hertz-1888-apparatus-scene.tsx`, `half-wave-dipole-pattern-scene.tsx`, `radio-path-loss-scene.tsx` — see File structure above). Do not modify or rename the §07.4 file.

---

## Verification summary (end-of-session checklist)

- [ ] `pnpm tsc --noEmit` exits 0.
- [ ] `pnpm vitest run` — all tests green; new §10 lib tests added (≥ 3 per topic × 6 topics = ≥ 18 new tests).
- [ ] `pnpm build` exits 0; all 6 new routes prerendered under `/[locale]/electromagnetism/<slug>` for en + he.
- [ ] `curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/en/electromagnetism/<slug>` returns 200 for all 6 slugs.
- [ ] Supabase SQL sample confirms physicists + glossary rows seeded with non-empty subtitle and ≥ 1 block.
- [ ] Spec progress table shows 57/66 (86%); §10 all six boxes ticked.
- [ ] `git log --oneline --grep "em/§10"` shows 6 per-topic commits in FIG order + 1 Wave 1 scaffold + 1 Wave 3 seed + 1 Wave 3 spec-update commit. ≥ 9 commits total (10 typical, up to 12 if a reconciliation commit or CLI patch lands).
- [ ] Implementation log filed to MemPalace wing=physics, room=decisions with filename `implementation_log_em_session_6_radiation.md`.

---

## Next session preview

**§11 EM & Relativity (5 topics, FIG.58–62).** Charge invariance, E and B under Lorentz boost, the electromagnetic field tensor, **magnetism-as-relativistic-electrostatics (the branch's emotional apex — two parallel current-carrying wires in the lab frame become length-contracted charge densities in the electron rest frame → Coulomb attraction = same force, different name)**, four-potential and EM Lagrangian. This is where a century of electromagnetism and a decade of special relativity snap together.

Spec Risk Notes constraint: §11 needs *minimal* SR inline — length contraction, time dilation, Lorentz transform of coordinates; full SR treatment is the future RELATIVITY branch, not this one. Plan the money-shot carefully.

After §11: §12 Foundations (4 topics — gauge-theory-origins, Aharonov-Bohm, magnetic monopoles, classical limit of QED). Two sessions and the branch is done.
