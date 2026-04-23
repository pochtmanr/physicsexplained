# Electromagnetism Session 5 — §08 EM Waves in Vacuum + §09 Waves in Matter & Optics

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (token-saving variant — parallel waves, no per-task review) to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking. Feedback style: per wing=physics `feedback_execution_style.md`.

**Goal:** Ship 14 topics — §08 EM Waves in Vacuum (4 topics, FIG.38–41) and §09 Waves in Matter & Optics (10 topics, FIG.42–51). After Session 5, the EM branch progress jumps from 37/66 (56%) to 51/66 (77%). Only §10 Radiation (6) + §11 EM & Relativity (5) + §12 Foundations (4) = 15 topics across 3 modules remain. §08 is the unification payoff (light falls out of Maxwell's four equations); §09 is the wikipedia-of-optics module (longest in the branch by topic count, ray-level and wave-level phenomena).

**Architecture:** Seven waves mirroring Session 4's seven-wave precedent, with Wave 0 now reserved for the §01–§05 `tex`-field backfill (parser fix from Session 4's Wave 1.75 never republished the older modules) and Wave 1.5 building the `RayTraceCanvas` primitive (spec Open Question #5 — a reusable optics scene-graph component for §09's 10 ray/wave topics and §08's plane-wave scenes). The 14-agent Wave 2 dispatch extends Session 4's 12-agent record and remains parallel-safe via the established NO-registry-touch / NO-publish / NO-commit contract. Forward-reference promotions: `fresnel-equations` (placeholder since Session 2) and `electromagnetic-wave` (placeholder since Session 4) get upgraded to full content in Wave 3 via source_hash-driven upsert — the same row is updated in place.

**Tech Stack:** Next.js 15 (App Router), React 19, TypeScript strict, Tailwind v4, MDX (`@next/mdx` + rehype-katex), Canvas 2D, Supabase `content_entries`, Vitest, `pnpm content:publish` CLI, `tsx --conditions=react-server` for seed scripts.

**Expected commit total:** 20 baseline — 1 Wave 0 backfill + 1 Wave 1 scaffold + 1 Wave 1.5 RayTraceCanvas + 14 Wave 2.5 per-topic + 2 Wave 3 (seed + spec-update) + 1 Wave 3 placeholder-promotion-verification if noted separately. 21–22 if an unforeseen RayTraceCanvas type-extension lands mid-wave or if a new forward-ref is discovered that needs a follow-up placeholder commit.

---

## Vision and voice reminders

**§08 voice — the derivation that defines physics.** Four equations + some vector calculus → the wave equation → speed = 1/√(μ₀ε₀) = c. §08.1 (`deriving-the-em-wave-equation`) is THE derivation of the branch — write it like you mean it, no hand-waving. Target 1400–1600 words. §08.2 (`plane-waves-and-polarization`) owns the perpendicular-transverse-in-phase reveal; the polarization slider is the delivery. §08.3 (`radiation-pressure`) makes good on §07.5 stress-tensor's promise with numbers. §08.4 (`the-electromagnetic-spectrum`) closes the module with actual wavelengths, every band labelled.

**§09 voice — optics-is-what-happens-when-light-meets-matter.** Denser than any other module (10 topics) but each topic is visual-heavy and self-contained. Priorities: (a) §09.3 `fresnel-equations` — finally upgrading the Session 2 placeholder to full treatment; (b) §09.6 `geometric-optics` — Fermat's principle cross-linked to CM's `principle-of-least-action`; (c) §09.8 `diffraction-and-the-double-slit` — the spec's money shot, photons arriving one-by-one building up fringe pattern; (d) §09.10 `waveguides-and-fibers` — how to keep light inside a pipe for a thousand kilometres, cross-linked to §06.7 transmission-lines.

**Money shots to nail:**
- **§08.2:** 3D plane wave with E and B drawn as perpendicular sinusoids propagating along k̂. Polarization slider morphs linear → elliptical → circular. Continuous animation, no discontinuity.
- **§09.8:** Two slits, monochromatic light from the left, screen on the right. Dot-by-dot photon-accumulation build-up AND continuous intensity from Huygens sum. Sliders: slit separation d, wavelength λ, distance L. Fringe spacing λL/d updates live.

**Calculus policy — unchanged.** Every topic that uses ∇, ∇·, ∇×, ∮, ∬ must explain the symbol in local context in plain words before the compact form. Side notes (`Callout math`) carry the denser derivations. Redundancy is a feature — every topic remains standalone for a search-engine landing reader.

---

## File structure and registries

**Files created this session:**

Physics libraries (14 new — one per topic):
- `lib/physics/electromagnetism/em-wave-equation.ts` (§08.1)
- `lib/physics/electromagnetism/plane-waves.ts` (§08.2)
- `lib/physics/electromagnetism/radiation-pressure.ts` (§08.3 — physics-lib slug; glossary slug `radiation-pressure-term` already exists from §07.5 and must not be duplicated)
- `lib/physics/electromagnetism/em-spectrum.ts` (§08.4)
- `lib/physics/electromagnetism/optics-refraction.ts` (§09.1 index-of-refraction)
- `lib/physics/electromagnetism/skin-depth.ts` (§09.2)
- `lib/physics/electromagnetism/fresnel.ts` (§09.3)
- `lib/physics/electromagnetism/tir.ts` (§09.4 total-internal-reflection)
- `lib/physics/electromagnetism/optical-dispersion.ts` (§09.5)
- `lib/physics/electromagnetism/geometric-optics.ts` (§09.6)
- `lib/physics/electromagnetism/interference.ts` (§09.7)
- `lib/physics/electromagnetism/diffraction.ts` (§09.8)
- `lib/physics/electromagnetism/polarization-optics.ts` (§09.9)
- `lib/physics/electromagnetism/waveguides.ts` (§09.10)

Shared primitive (Wave 1.5):
- `components/physics/ray-trace-canvas/RayTraceCanvas.tsx`
- `components/physics/ray-trace-canvas/types.ts`
- `components/physics/ray-trace-canvas/tracer.ts`
- `components/physics/ray-trace-canvas/tracer.test.ts`
- `components/physics/ray-trace-canvas/index.ts`

Topic pages (14):
- `app/[locale]/(topics)/electromagnetism/{deriving-the-em-wave-equation,plane-waves-and-polarization,radiation-pressure,the-electromagnetic-spectrum,index-of-refraction,skin-depth-in-conductors,fresnel-equations,total-internal-reflection,optical-dispersion,geometric-optics,interference,diffraction-and-the-double-slit,polarization-phenomena,waveguides-and-fibers}/{page.tsx,content.en.mdx}`

Seed script (Wave 3):
- `scripts/content/seed-em-05.ts`

**Files modified this session:**
- `lib/content/branches.ts` — append 14 `Topic` entries to `ELECTROMAGNETISM_TOPICS` (existing line 352). `ELECTROMAGNETISM_MODULES` already contains `em-waves-vacuum` (index 8) and `waves-in-matter-optics` (index 9) — NO module changes needed.
- `lib/content/physicists.ts` — append 5 new physicist entries (Snell, Fresnel, Brewster, Fraunhofer, Fizeau) + modify `relatedTopics` arrays on 3 existing physicists (`thomas-young`, `pierre-de-fermat`, `christiaan-huygens`, `isaac-newton`). `leon-foucault` stays unchanged.
- `lib/content/glossary.ts` — append ~35 new terms. Verify-then-skip for any that already exist (`refractive-index`, `polarization`, `radiation-pressure-term` confirmed existing).
- `lib/content/simulation-registry.ts` — append ~45 new scene entries (3–4 per topic × 14 topics), grouped by topic with `// EM §08 — <slug>` / `// EM §09 — <slug>` section comments. Inserted by Wave 2.5 orchestrator only.

**Files NOT modified:**
- `lib/content/branches.ts` status flip — EM branch is already `live` since Session 1.
- `components/physics/visualization-registry.tsx` — glossary-tile preview only; Wave 2 agents must not touch.
- Page template `app/[locale]/(topics)/electromagnetism/displacement-current/page.tsx` is the Session 4 canonical copy target for all 14 new `page.tsx` files; change only the `SLUG` constant.

---

## Self-contained context — what agents need to know

**Content-publish CLI behaviour:**
- Command: `pnpm content:publish --only electromagnetism/<slug>` — inserts or updates exactly one row in Supabase `content_entries` table, keyed by `(kind="topic", slug="electromagnetism/<slug>", locale="en")`.
- `source_hash = sha256(JSON.stringify({title, subtitle, blocks, meta}))`. Unchanged content is a true no-op; changed content triggers update. Re-publishing is safe.
- Zero rows inserted/updated on a run = MDX parse error silently swallowed. If a publish reports `0 / 0`, open `content.en.mdx` and check for unclosed JSX, invalid `<EquationBlock tex="...">` escaping, or malformed `<Section>` nesting.
- Wave 0 republish of §01–§05 MUST touch each of 25 existing topic rows — if the row's EquationBlock tex fields were genuinely stripped in the old parser, the new publish will show `source_hash` changed (shift) and `updated=1`. If `unchanged=1`, that topic's tex fields were already correct; verify by sampling one `content_entries.blocks` JSONB row with `mcp__physics-supabase__execute_sql`.

**Seed script behaviour (`seed-em-05.ts`):**
- Run with: `pnpm exec tsx --conditions=react-server scripts/content/seed-em-05.ts`. The `react-server` condition lets `import "server-only"` resolve inside the Supabase service-client module.
- Mirrors `seed-em-04.ts` exactly: `PhysicistSeed[]` + `GlossarySeed[]` + `paragraphsToBlocks` helper + `parseMajorWork` helper + `main()` loop over both arrays upserting to `content_entries` keyed by `(kind, slug, locale)` with `source_hash`.
- Forward-ref promotions (`fresnel-equations`, `electromagnetic-wave`): same slug, same row, richer content — the sha256 shifts, upsert triggers update, old placeholder is overwritten. Verify in dev after seed run.

**Page.tsx canonical shape (every new topic):**
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

**MDX content canonical shape (content.en.mdx):**
```mdx
import { TopicHeader } from "@/components/layout/topic-header";
import { Section } from "@/components/layout/section";
import { SceneCard } from "@/components/layout/scene-card";
import { EquationBlock } from "@/components/math/equation-block";
import { Callout } from "@/components/layout/callout";
import { TopicPageLayout } from "@/components/layout/topic-page-layout";
import { <SceneName>Scene } from "@/components/physics/<scene-name>-scene";
// ...additional scene imports

<TopicPageLayout aside={[
  { type: "physicist", label: "...", href: "/physicists/<slug>" },
  { type: "term", label: "...", href: "/dictionary/<slug>" },
]}>

<TopicHeader
  eyebrow="FIG.XX · <MODULE NAME>"
  title="<TITLE IN ALL CAPS>"
  subtitle="<one-line hook>"
/>

<Section index={1} title="<section heading>">

<prose with <PhysicistLink>, <Term>, $inline math$>

<EquationBlock tex={`\\nabla \\cdot \\mathbf{E} = \\rho/\\varepsilon_0`} />

<SceneCard title="FIG.XX · <caption>" ...>
  <<SceneName>Scene />
</SceneCard>

<Callout variant="math">
...side derivation...
</Callout>

</Section>
```
- Target word count: 1100–1400 baseline; 1400–1600 for money-shot topics (§08.1, §08.2, §09.3, §09.6, §09.8).
- `<EquationBlock tex={`…`}>` uses JSX expression with template literal, backslashes escaped — this is what Session 4's Wave 1.75 parse-mdx fix restored.

**Scene component canonical shape (components/physics/<slug-scene>.tsx):**
- `"use client"` at the top.
- Named export matching registry name.
- For §08 topics: Canvas 2D + `requestAnimationFrame` animation loop, dark background, font-mono HUD, palette magenta (+) / cyan (−, B) / amber (conduction current) / green-cyan (induced) / lilac (displacement current) / NEW this session: **amber-orange** `rgba(255,180,80,…)` for ray paths, **pale-blue** `rgba(140,200,255,…)` for wavefronts.
- For §09 topics: `import { RayTraceCanvas } from "@/components/physics/ray-trace-canvas"` with a declarative scene prop; the primitive handles the draw pass. Local animation logic only for topic-specific interaction (sliders, intensity overlay).
- Types imported from `@/components/physics/ray-trace-canvas/types` — NO local fallbacks.

**Parallel-safety contract (Wave 2 — enforced for all 14 agents):**
1. **DO NOT** modify `lib/content/simulation-registry.ts`. Orchestrator handles in Wave 2.5.
2. **DO NOT** modify `components/physics/visualization-registry.tsx`. Not needed for this session.
3. **DO NOT** run `pnpm content:publish`. Orchestrator publishes in Wave 2.5.
4. **DO NOT** `git commit`. Orchestrator commits per-topic in Wave 2.5.
5. **TYPES CONTRACT:** §09 agents MUST `import { ... } from "@/components/physics/ray-trace-canvas/types"`. No local fallbacks. No private copies. Need a new type? STOP and flag orchestrator in handoff block via `typeExtensionsNeeded` key.
6. **TYPES CONTRACT:** §08 agents use `Vec3` from `@/lib/physics/electromagnetism/lorentz` where 3D needed; `Vec2` from `@/lib/physics/coulomb` for 2D.
7. **RETURN HANDOFF BLOCK** to orchestrator containing:
   - `registry`: exact multi-line text block to append to `SIMULATION_REGISTRY` (section comment + 3–4 entries).
   - `publishArg`: `electromagnetism/<slug>`.
   - `commitSubject`: single line matching `feat(em/§08): <slug> — <tagline>` or `feat(em/§09): <slug> — <tagline>`.
   - `forwardRefs`: array of slugs referenced from MDX that do NOT yet have a Supabase content_entries row (physicist or glossary). Orchestrator aggregates; Wave 3 adds placeholders.
   - `typeExtensionsNeeded`: `null` or `{ field, why }` for RayTraceCanvas type additions discovered mid-authoring.

**Forward-reference placeholder shape (Wave 3):** Pattern established in Session 4 (commit `0e350ca` for `fresnel-equations`, Session 4 seed for `electromagnetic-wave`/`electromagnetic-field`/`gauge-invariance`). Each placeholder GlossarySeed has `shortDefinition` ending with "Full treatment in §0X" and `description` beginning "This is a placeholder entry..." with a `// FORWARD-REF: full treatment in §0X` code comment above it. See `scripts/content/seed-em-04.ts:637–665` for the verbatim pattern.

---

## Task decomposition

### Wave 0 — §01–§05 tex-field backfill

**Purpose:** Session 4's Wave 1.75 parse-mdx fix restored correct `<EquationBlock tex>` extraction, but the 25 prior topics (§01–§05) were never republished afterwards. Their Supabase `content_entries.blocks` rows likely have stripped or empty `tex` fields. Re-publish idempotently so the EquationBlock components render real LaTeX instead of fallbacks.

**Budget:** 15 minutes. Single serial subagent.

**Files:** No MDX source changes — the MDX is already correct. Only Supabase rows refreshed via `pnpm content:publish`.

### Task 0.1: Backfill §01 Electrostatics + §02 + §03 + §04 + §05 publishes

- [ ] **Step 1: Verify one topic's current Supabase state (baseline)**

```bash
cat <<'EOF' > /tmp/verify-before.sql
select slug, source_hash, jsonb_path_query_array(blocks, '$[*] ? (@.type == "equation")."tex"') as tex_fields from content_entries where kind='topic' and slug='electromagnetism/gauss-law' and locale='en';
EOF
```

Run via `mcp__physics-supabase__execute_sql` with the query above. Save the `tex_fields` result; if any tex value is `""` or missing, the parser bug stripped them and republish WILL update the row.

- [ ] **Step 2: Run the backfill publish loop**

```bash
for slug in \
  coulombs-law \
  the-electric-field \
  gauss-law \
  electric-potential \
  capacitance-and-field-energy \
  conductors-and-shielding \
  method-of-images \
  polarization-and-bound-charges \
  dielectrics-and-the-d-field \
  boundary-conditions-at-interfaces \
  piezo-and-ferroelectricity \
  the-lorentz-force \
  biot-savart-law \
  amperes-law \
  the-vector-potential \
  magnetic-dipoles \
  magnetization-and-the-h-field \
  dia-and-paramagnetism \
  ferromagnetism-and-hysteresis \
  superconductivity-and-meissner \
  faradays-law \
  lenz-law-and-motional-emf \
  self-and-mutual-inductance \
  energy-in-magnetic-fields \
  eddy-currents; do
  echo "=== $slug ==="
  pnpm content:publish --only electromagnetism/$slug 2>&1 | tail -3
done
```

Expected: mostly "1 updated" lines (parser bug was real). Any "1 unchanged" row means that topic's tex fields were already correct when originally published — fine.

- [ ] **Step 3: Verify one topic's post-backfill state**

Run the same SQL from Step 1 again; the `tex_fields` array must now contain real LaTeX strings (non-empty, with `\\nabla`, `\\cdot`, etc.).

- [ ] **Step 4: Verify dev pages render equations**

```bash
pnpm dev &
DEV_PID=$!
sleep 8
curl -s -o /dev/null -w "%{http_code}\n" http://localhost:3000/en/electromagnetism/gauss-law
curl -s -o /dev/null -w "%{http_code}\n" http://localhost:3000/en/electromagnetism/faradays-law
kill $DEV_PID 2>/dev/null
```

Expected: 200, 200. Manually spot-check one page in a browser for EquationBlock LaTeX rendering.

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "$(cat <<'EOF'
fix(em): backfill EquationBlock tex fields across §01–§05 after parser fix

Session 4's Wave 1.75 parser fix (commit 2a867d6) restored correct <EquationBlock tex>
extraction, but the 25 topics published before that fix still carried stripped or empty
tex fields in their Supabase rows. This republish refreshes all 25 topics idempotently
via pnpm content:publish. Source MDX unchanged — only the Supabase content_entries
blocks JSONB is updated. Verified via tex-fields SQL before/after on gauss-law.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

### Wave 1 — Data-layer scaffold

**Purpose:** Add 14 new `Topic` entries, 5 new `PhysicistSeed`-equivalent structural entries, and ~35 new `GlossaryTerm`-equivalent structural entries to the TS registries. TS arrays are structural metadata only; Supabase prose seeding happens in Wave 3.

**Serial, 1 subagent. 1 commit.**

### Task 1.1: Append 14 topics to ELECTROMAGNETISM_TOPICS

**File:** `lib/content/branches.ts` — append inside the `ELECTROMAGNETISM_TOPICS` array before its closing `]` (find by grep). Existing array runs through line ~707; the new entries attach after `maxwell-stress-tensor`.

- [ ] **Step 1: Append §08 EM Waves in Vacuum (4 entries)**

```ts
  {
    slug: "deriving-the-em-wave-equation",
    title: "DERIVING THE EM WAVE EQUATION",
    eyebrow: "FIG.38 · EM WAVES IN VACUUM",
    subtitle: "Four equations, two fields, and light falling out the other side.",
    readingMinutes: 11,
    status: "live",
    module: "em-waves-vacuum",
  },
  {
    slug: "plane-waves-and-polarization",
    title: "PLANE WAVES AND POLARIZATION",
    eyebrow: "FIG.39 · EM WAVES IN VACUUM",
    subtitle: "The shape of a ray of light, written in two transverse fields.",
    readingMinutes: 12,
    status: "live",
    module: "em-waves-vacuum",
  },
  {
    slug: "radiation-pressure",
    title: "ENERGY, MOMENTUM, AND RADIATION PRESSURE",
    eyebrow: "FIG.40 · EM WAVES IN VACUUM",
    subtitle: "Light pushes. Measurably.",
    readingMinutes: 11,
    status: "live",
    module: "em-waves-vacuum",
  },
  {
    slug: "the-electromagnetic-spectrum",
    title: "THE ELECTROMAGNETIC SPECTRUM",
    eyebrow: "FIG.41 · EM WAVES IN VACUUM",
    subtitle: "One equation, every wavelength from radio to gamma.",
    readingMinutes: 10,
    status: "live",
    module: "em-waves-vacuum",
  },
```

- [ ] **Step 2: Append §09 Waves in Matter & Optics (10 entries)**

```ts
  {
    slug: "index-of-refraction",
    title: "INDEX OF REFRACTION",
    eyebrow: "FIG.42 · WAVES IN MATTER & OPTICS",
    subtitle: "What slows light down when it has somewhere to be.",
    readingMinutes: 11,
    status: "live",
    module: "waves-in-matter-optics",
  },
  {
    slug: "skin-depth-in-conductors",
    title: "SKIN DEPTH IN CONDUCTORS",
    eyebrow: "FIG.43 · WAVES IN MATTER & OPTICS",
    subtitle: "How deep a radio wave can actually get into a metal.",
    readingMinutes: 11,
    status: "live",
    module: "waves-in-matter-optics",
  },
  {
    slug: "fresnel-equations",
    title: "THE FRESNEL EQUATIONS",
    eyebrow: "FIG.44 · WAVES IN MATTER & OPTICS",
    subtitle: "What reflects, what goes through, and at what angle.",
    readingMinutes: 13,
    status: "live",
    module: "waves-in-matter-optics",
  },
  {
    slug: "total-internal-reflection",
    title: "TOTAL INTERNAL REFLECTION",
    eyebrow: "FIG.45 · WAVES IN MATTER & OPTICS",
    subtitle: "The mirror made of an angle.",
    readingMinutes: 11,
    status: "live",
    module: "waves-in-matter-optics",
  },
  {
    slug: "optical-dispersion",
    title: "OPTICAL DISPERSION",
    eyebrow: "FIG.46 · WAVES IN MATTER & OPTICS",
    subtitle: "Why a prism splits white light — and why a rainbow has an order.",
    readingMinutes: 11,
    status: "live",
    module: "waves-in-matter-optics",
  },
  {
    slug: "geometric-optics",
    title: "GEOMETRIC OPTICS",
    eyebrow: "FIG.47 · WAVES IN MATTER & OPTICS",
    subtitle: "When the wavelength is small enough to forget.",
    readingMinutes: 12,
    status: "live",
    module: "waves-in-matter-optics",
  },
  {
    slug: "interference",
    title: "INTERFERENCE",
    eyebrow: "FIG.48 · WAVES IN MATTER & OPTICS",
    subtitle: "Two waves that know how to add — and how to cancel.",
    readingMinutes: 12,
    status: "live",
    module: "waves-in-matter-optics",
  },
  {
    slug: "diffraction-and-the-double-slit",
    title: "DIFFRACTION AND THE DOUBLE SLIT",
    eyebrow: "FIG.49 · WAVES IN MATTER & OPTICS",
    subtitle: "What a wave does when a wall gets in the way.",
    readingMinutes: 13,
    status: "live",
    module: "waves-in-matter-optics",
  },
  {
    slug: "polarization-phenomena",
    title: "POLARIZATION, BREWSTER, AND BIREFRINGENCE",
    eyebrow: "FIG.50 · WAVES IN MATTER & OPTICS",
    subtitle: "When the direction the field points starts to matter.",
    readingMinutes: 12,
    status: "live",
    module: "waves-in-matter-optics",
  },
  {
    slug: "waveguides-and-fibers",
    title: "WAVEGUIDES AND OPTICAL FIBERS",
    eyebrow: "FIG.51 · WAVES IN MATTER & OPTICS",
    subtitle: "How to keep light inside a pipe for a thousand kilometers.",
    readingMinutes: 12,
    status: "live",
    module: "waves-in-matter-optics",
  },
```

- [ ] **Step 3: Verify compile**

Run: `pnpm tsc --noEmit`
Expected: no errors — the `module` slugs `em-waves-vacuum` and `waves-in-matter-optics` are already in `ELECTROMAGNETISM_MODULES` (lines 345–346), so `Topic` type-check passes.

### Task 1.2: Append 5 new physicists + modify 4 existing `relatedTopics`

**File:** `lib/content/physicists.ts`.

- [ ] **Step 1: Grep to confirm none of the 5 new physicists exist**

Run: `grep -n "slug: \"\(willebrord-snell\|augustin-fresnel\|david-brewster\|joseph-fraunhofer\|hippolyte-fizeau\)\"" lib/content/physicists.ts`
Expected: zero matches.

- [ ] **Step 2: Append 5 new physicists**

Append to end of `PHYSICISTS` array (before closing `]`). Structural entries only — `bio`, `contributions`, `majorWorks` prose is seeded in Wave 3. Minimum required fields (see `Physicist` type in `lib/content/types.ts`) are slug, name, shortName, born, died, nationality, summary (short), relatedTopics. Session 4 precedent copies the full shape with `bio`/`contributions`/`majorWorks` here so the TS array matches the seed. Mirror that — include all fields.

Shape (pattern from Session 4 Kirchhoff entry):
```ts
  {
    slug: "willebrord-snell",
    name: "Willebrord Snel van Royen",
    shortName: "Snell",
    born: "1580",
    died: "1626",
    nationality: "Dutch",
    oneLiner: "Leiden astronomer who derived the sine law of refraction in 1621 but never published it; the law was re-derived by Descartes sixteen years later, delaying his credit by two centuries in France. Also pioneered triangulation as a geodetic method and measured the Earth's radius across Holland.",
    summary: "Dutch astronomer who derived the sine law of refraction (1621) — unpublished, so credit was initially given to Descartes — and pioneered geodetic triangulation.",
    relatedTopics: [
      { branchSlug: "electromagnetism", topicSlug: "fresnel-equations" },
      { branchSlug: "electromagnetism", topicSlug: "total-internal-reflection" },
      { branchSlug: "electromagnetism", topicSlug: "geometric-optics" },
      { branchSlug: "electromagnetism", topicSlug: "waveguides-and-fibers" },
    ],
  },
  {
    slug: "augustin-fresnel",
    name: "Augustin-Jean Fresnel",
    shortName: "Fresnel",
    born: "1788",
    died: "1827",
    nationality: "French",
    oneLiner: "French engineer-turned-physicist who derived the Fresnel equations (1818–1823) governing reflection and transmission at interfaces, designed the Fresnel lens that made every lighthouse in the world visible at sea, and argued the wave theory of light to victory against Laplace's particle faction at the French Academy.",
    summary: "Argued the wave theory of light and derived the Fresnel equations for reflection and transmission. Designed the Fresnel lens used in every lighthouse.",
    relatedTopics: [
      { branchSlug: "electromagnetism", topicSlug: "fresnel-equations" },
      { branchSlug: "electromagnetism", topicSlug: "polarization-phenomena" },
      { branchSlug: "electromagnetism", topicSlug: "interference" },
    ],
  },
  {
    slug: "david-brewster",
    name: "David Brewster",
    shortName: "Brewster",
    born: "1781",
    died: "1868",
    nationality: "Scottish",
    oneLiner: "Scottish physicist who discovered Brewster's angle (1815) — the incidence angle at which reflected light is purely s-polarised — by systematic measurement across dozens of materials. Invented the kaleidoscope, founded the British Association for the Advancement of Science, and twice served as president of the Royal Society of Edinburgh.",
    summary: "Discovered Brewster's angle (1815) — the angle at which reflected light is purely polarised. Inventor of the kaleidoscope.",
    relatedTopics: [
      { branchSlug: "electromagnetism", topicSlug: "polarization-phenomena" },
      { branchSlug: "electromagnetism", topicSlug: "fresnel-equations" },
    ],
  },
  {
    slug: "joseph-fraunhofer",
    name: "Joseph von Fraunhofer",
    shortName: "Fraunhofer",
    born: "1787",
    died: "1826",
    nationality: "Bavarian",
    oneLiner: "Bavarian glassmaker-turned-optician who invented the diffraction-grating spectroscope and catalogued the dark absorption lines in the solar spectrum — the Fraunhofer lines — which Kirchhoff would later identify as element fingerprints, opening astrophysics as a discipline.",
    summary: "Invented the diffraction grating and catalogued the solar absorption lines now bearing his name — lines that opened astrophysics.",
    relatedTopics: [
      { branchSlug: "electromagnetism", topicSlug: "diffraction-and-the-double-slit" },
      { branchSlug: "electromagnetism", topicSlug: "interference" },
      { branchSlug: "electromagnetism", topicSlug: "the-electromagnetic-spectrum" },
    ],
  },
  {
    slug: "hippolyte-fizeau",
    name: "Armand-Hippolyte-Louis Fizeau",
    shortName: "Fizeau",
    born: "1819",
    died: "1896",
    nationality: "French",
    oneLiner: "French physicist who, in 1849, made the first terrestrial measurement of the speed of light using a rotating toothed-wheel apparatus on the road from Paris to Montmartre — a measurement later refined by Foucault and later still by Michelson on the way to modern metrology.",
    summary: "First terrestrial measurement of the speed of light (1849), using a rotating toothed wheel on the Paris-Montmartre road.",
    relatedTopics: [
      { branchSlug: "electromagnetism", topicSlug: "deriving-the-em-wave-equation" },
      { branchSlug: "electromagnetism", topicSlug: "the-electromagnetic-spectrum" },
      { branchSlug: "electromagnetism", topicSlug: "optical-dispersion" },
    ],
  },
```

Exact `summary` / `oneLiner` field names must match the existing `Physicist` interface — inspect one existing entry (e.g. Kirchhoff from Session 4 seed) and mirror verbatim. If existing entries use only `oneLiner` and `bio`, drop `summary`.

- [ ] **Step 3: Append `relatedTopics` items to 4 existing physicists**

For each existing entry (located by the line-numbers in the prompt):

- `isaac-newton` (line 24): append `{ branchSlug: "electromagnetism", topicSlug: "optical-dispersion" }` inside its `relatedTopics` array.
- `christiaan-huygens` (line 35): append `{ branchSlug: "electromagnetism", topicSlug: "interference" }` and `{ branchSlug: "electromagnetism", topicSlug: "diffraction-and-the-double-slit" }`.
- `thomas-young` (line 271): append `{ branchSlug: "electromagnetism", topicSlug: "interference" }` and `{ branchSlug: "electromagnetism", topicSlug: "diffraction-and-the-double-slit" }`.
- `pierre-de-fermat` (line 674): append `{ branchSlug: "electromagnetism", topicSlug: "geometric-optics" }`.
- `leon-foucault`: NO CHANGE — §01/§05 assignments stay; Fizeau alone carries the c-measurement arc.

### Task 1.3: Append ~35 new glossary terms + skip existing

**File:** `lib/content/glossary.ts`.

- [ ] **Step 1: Grep existing glossary for potential collisions**

Run: `grep -n "slug: \"\(refractive-index\|polarization\|radiation-pressure-term\|speed-of-light\|em-wave-equation-term\|transverse-wave-em\|plane-wave-term\|linear-polarization\|circular-polarization\|elliptical-polarization\|polarization-axis\|light-polarization\|em-spectrum\|wavelength-em\|wavenumber\|group-velocity-em\|skin-depth\|fresnel-equations\|s-polarization\|p-polarization\|total-internal-reflection-term\|critical-angle\|optical-dispersion-term\|abbe-number\|anomalous-dispersion\|snells-law\|fermats-principle\|thin-lens\|focal-length\|constructive-interference\|destructive-interference\|coherence-length\|diffraction-em\|huygens-principle\|single-slit-diffraction\|double-slit-diffraction\|brewster-angle\|birefringence\|malus-law\|optical-fiber\|waveguide-mode\|numerical-aperture\)\"" lib/content/glossary.ts`

For every slug that returns a match: SKIP — do not add a duplicate. Note the skips for the Wave 3 seed agent so it doesn't upsert either (except the 2 promotion cases).

- [ ] **Step 2: Append new glossary structural entries**

Mirror `GlossaryTerm` interface shape exactly (inspect 1 existing entry). For each new term the TS array carries `slug` + `term` + `category` + `shortDefinition` + `relatedPhysicists` + `relatedTopics` (structural). Full `description` prose lives in the Wave 3 seed.

Suggested additions (trim at author time — target total ~35):
§08.1: `em-wave-equation-term`, `transverse-wave-em` (+ confirm `speed-of-light` status — add if missing).
§08.2: `plane-wave-term`, `linear-polarization`, `circular-polarization`, `elliptical-polarization`, `polarization-axis`. NOTE: `polarization` (electric polarization from §02) already exists — do NOT duplicate. Use `light-polarization` as a distinct slug if the §08.2 MDX needs a dedicated optical-polarization page.
§08.3: NONE new (`radiation-pressure-term` exists at §07.5).
§08.4: `em-spectrum`, `wavelength-em`, `wavenumber`.
§09.1: `refractive-index` (EXISTS — verify Wave 3 seeded it; if only structural, Wave 3 adds prose); `group-velocity-em`.
§09.2: `skin-depth`.
§09.3: `fresnel-equations` (placeholder since Session 2 — **Wave 3 promotes** to full content; Wave 1 does NOT add another structural entry); `s-polarization`, `p-polarization`.
§09.4: `total-internal-reflection-term`, `critical-angle`.
§09.5: `optical-dispersion-term`, `abbe-number`, `anomalous-dispersion`.
§09.6: `snells-law`, `fermats-principle`, `thin-lens`, `focal-length`.
§09.7: `constructive-interference`, `destructive-interference`, `coherence-length`.
§09.8: `diffraction-em`, `huygens-principle`, `single-slit-diffraction`, `double-slit-diffraction`.
§09.9: `brewster-angle`, `birefringence`, `malus-law`.
§09.10: `optical-fiber`, `waveguide-mode`, `numerical-aperture`.

- [ ] **Step 3: Verify TypeScript**

Run: `pnpm tsc --noEmit`
Expected: no errors.

### Task 1.4: Commit Wave 1

- [ ] **Step 1: Commit**

```bash
git add lib/content/branches.ts lib/content/physicists.ts lib/content/glossary.ts
git commit -m "$(cat <<'EOF'
feat(em/§08-§09): scaffold em-waves + optics topics, 5 physicists, glossary

Structural metadata only — adds 14 Topic entries (FIG.38–51), 5 new physicist
entries (Snell, Fresnel, Brewster, Fraunhofer, Fizeau), appends relatedTopics
on Newton/Huygens/Young/Fermat, and ~35 glossary structural entries across
EM waves, optics, interference, diffraction, polarization, waveguides.

Prose bios and glossary descriptions seeded separately in Wave 3 via
scripts/content/seed-em-05.ts. Forward-ref placeholders fresnel-equations and
electromagnetic-wave get upgraded to full content in the same seed.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

### Wave 1.5 — RayTraceCanvas primitive

**Purpose:** §09 Optics (10 topics) needs a reusable scene-graph component for ray sources, lenses, mirrors, dielectric interfaces, apertures, slits, and screens. Mirrors the `CircuitCanvas` primitive from Session 4 exactly — same file layout, same types-as-canonical-home discipline, same test-first build order. §08.2's plane-wave scene can also use the RayTraceCanvas via a minimal "RaySource emitting a wavefront stack" scene. Resist overbuilding: no full Maxwell-equation FDTD solver, no general-purpose numerical integration; the analytical approach covers every FIG.42–51 scene.

**Serial, 1 subagent. 1 commit.**

### Task 1.5.1: Canonical types file

**File:** `components/physics/ray-trace-canvas/types.ts`

- [ ] **Step 1: Write `types.ts` with all scene-graph interfaces**

```ts
/**
 * RayTraceCanvas — canonical type definitions.
 *
 * §09 topic agents (and §08 plane-wave scenes) MUST import from this file.
 * No local copies, no fallbacks. If a new field or kind is required, extend
 * this file via the orchestrator, not in the topic agent.
 */

/** 2D point in canvas coordinates. Canvas origin is top-left; tracer Y-axis flipped for physics convention. */
export interface Vec2 {
  x: number;
  y: number;
}

/** A ray is a directed line from (x,y) with direction vector (dx,dy) (unit). Wavelength in nm, optional polarisation unit vector perpendicular to direction. */
export interface Ray {
  id: string;
  origin: Vec2;
  direction: Vec2;
  wavelengthNm?: number; // 380–780 for visible; arbitrary for radio/microwave etc.
  polarization?: Vec2;   // perpendicular to direction in the xy plane — null means unpolarised
  amplitude?: number;    // relative intensity 0..1
  colorHint?: string;    // optional override; if absent, derived from wavelength
}

/** A planar interface between two homogeneous dielectric media, finite width, infinite in the out-of-plane direction. */
export interface Interface {
  kind: "interface";
  id: string;
  p1: Vec2;         // interface endpoints
  p2: Vec2;
  n1: number;       // index of refraction on the side the ray comes from (determined by normal direction)
  n2: number;       // index on the other side
  reflective?: boolean; // true → pure mirror (glass-air handled as interface with TIR via tracer)
}

/** Spherical mirror — curvature > 0 concave, < 0 convex, 0 flat. */
export interface Mirror {
  kind: "mirror";
  id: string;
  center: Vec2;         // geometric centre of the arc
  radius: number;       // radius of curvature — Infinity for flat mirror
  apertureHalfAngleDeg: number; // how much of the sphere is present
  axis: Vec2;           // unit vector pointing outward from reflective side
}

/** Thin lens — modeled via lens-maker's equation (1/f = (n − 1)(1/R1 − 1/R2 + …)); thin-lens approximation. */
export interface ThinLens {
  kind: "thin-lens";
  id: string;
  center: Vec2;
  axis: Vec2;           // optical axis (unit vector)
  focalLength: number;  // +converging, −diverging
  apertureHalfWidth: number;
}

/** Ray source — emits one or more rays. */
export interface RaySource {
  kind: "ray-source";
  id: string;
  position: Vec2;
  directionDeg: number;           // base direction in degrees from +x axis
  fanHalfAngleDeg?: number;       // 0 for single ray; >0 for a fan of rays
  fanCount?: number;              // number of rays in the fan
  wavelengthNm?: number;
  polarizationDeg?: number | null; // angle in degrees from direction's perpendicular; null = unpolarised
}

/** Aperture — blocks all rays except where it has an opening. Simple rectangular slit or circular iris. */
export interface Aperture {
  kind: "aperture";
  id: string;
  center: Vec2;
  axis: Vec2;                     // normal to the aperture plane
  halfWidth: number;              // total aperture width / 2
  openings: { offset: number; halfWidth: number }[]; // positions along the aperture plane
}

/** Slit configuration for diffraction — double-slit with adjustable d and width. */
export interface Slit {
  kind: "slit";
  id: string;
  center: Vec2;
  axis: Vec2;
  slitWidth: number;       // width of each slit (a)
  slitSeparation: number;  // centre-to-centre spacing (d); use 0 for single-slit
  slitCount: number;       // 1 or 2 (extensible to N)
}

/** Screen — detector / intensity readout. Rays hitting the screen register intensity as a function of position. */
export interface Screen {
  kind: "screen";
  id: string;
  center: Vec2;
  axis: Vec2;            // normal to the screen surface
  halfWidth: number;
  intensityBins?: number; // how many bins to discretise the screen into for Huygens-sum rendering
}

/** A coherent wavelet source for Huygens sum — enabled when a slit is upstream of a screen. */
export interface HuygensWavelet {
  kind: "huygens-wavelet";
  id: string;
  origin: Vec2;
  wavelengthNm: number;
  phaseRad: number;
  amplitude: number;
}

/** A waveguide mode region — a tube-of-material extension for §09.10 fiber optics. Extension hook; tracer treats as straight propagation with periodic TIR bounce. */
export interface WaveguideMode {
  kind: "waveguide-mode";
  id: string;
  p1: Vec2;             // start of the waveguide centreline
  p2: Vec2;             // end
  halfWidth: number;
  coreIndex: number;
  claddingIndex: number;
  modeIndex?: number;    // TE_m mode index
}

/** Discriminated union of all scene elements the tracer and renderer handle. */
export type SceneElement =
  | Interface
  | Mirror
  | ThinLens
  | RaySource
  | Aperture
  | Slit
  | Screen
  | HuygensWavelet
  | WaveguideMode;

/** A single RayTraceCanvas scene. */
export interface RayTraceScene {
  width: number;
  height: number;
  elements: SceneElement[];
  /** Optional: override the default dark background. */
  background?: string;
  /** Enable Huygens-sum intensity overlay on Screens that have slits upstream. */
  enableHuygensSum?: boolean;
  /** Max ray bounces before tracer gives up (default 32). */
  maxBounces?: number;
}

/** Tracer output — one path per original ray, possibly forking at interfaces. */
export interface TracedRay {
  id: string;
  sourceId: string;
  segments: { from: Vec2; to: Vec2; amplitude: number; wavelengthNm?: number }[];
  terminated: "screen-hit" | "absorbed" | "escaped" | "max-bounces";
  terminalPoint?: Vec2;
}

/** Aggregated tracer output for a full scene trace. */
export interface TraceResult {
  rays: TracedRay[];
  screenIntensities: Map<string, number[]>; // per-Screen intensity array, indexed by intensityBins
}
```

- [ ] **Step 2: Barrel export**

Write `components/physics/ray-trace-canvas/index.ts`:
```ts
export * from "./types";
export { RayTraceCanvas } from "./RayTraceCanvas";
export type { RayTraceCanvasProps } from "./RayTraceCanvas";
export { trace, refract, reflect, fresnelCoefficients, criticalAngle, thinLensImage, huygensSum } from "./tracer";
```

### Task 1.5.2: Pure-TS tracer engine (test-first)

**Files:** `components/physics/ray-trace-canvas/tracer.ts` + `tracer.test.ts`.

- [ ] **Step 1: Write failing tests**

```ts
// tracer.test.ts
import { describe, it, expect } from "vitest";
import { refract, criticalAngle, fresnelCoefficients, thinLensImage, trace } from "./tracer";
import type { RayTraceScene } from "./types";

const deg = (r: number) => (r * 180) / Math.PI;

describe("refract — Snell's law", () => {
  it("sandwich 1.0 → 1.5 → 1.0 returns original direction", () => {
    const start = { x: 1, y: 0 };
    const norm1 = { x: 0, y: 1 };
    const after1 = refract(start, norm1, 1.0, 1.5);
    const norm2 = { x: 0, y: -1 };
    const after2 = refract(after1!, norm2, 1.5, 1.0);
    expect(after2!.x).toBeCloseTo(start.x, 5);
    expect(after2!.y).toBeCloseTo(start.y, 5);
  });

  it("normal incidence passes through unchanged", () => {
    const d = { x: 0, y: 1 };
    const n = { x: 0, y: -1 };
    const out = refract(d, n, 1.0, 1.5);
    expect(out!.x).toBeCloseTo(0, 5);
    expect(out!.y).toBeCloseTo(1, 5);
  });
});

describe("criticalAngle", () => {
  it("glass(1.5) → air(1.0) gives arcsin(1/1.5) ≈ 41.81°", () => {
    const angleDeg = deg(criticalAngle(1.5, 1.0)!);
    expect(angleDeg).toBeCloseTo(41.81, 1);
  });
  it("returns null when n1 ≤ n2 (no TIR possible)", () => {
    expect(criticalAngle(1.0, 1.5)).toBeNull();
  });
});

describe("fresnelCoefficients", () => {
  it("normal incidence: r_s and r_p have equal magnitude and are negative for n1 < n2", () => {
    const { rs, rp, ts, tp } = fresnelCoefficients(0, 1.0, 1.5);
    expect(Math.abs(rs)).toBeCloseTo(Math.abs(rp), 5);
    expect(rs).toBeLessThan(0);
    expect(rp).toBeLessThan(0);
    // |r|² + |t|² relation with index ratio
    const R = rs * rs;
    const T = (1.5 / 1.0) * ts * ts * Math.cos(0) / Math.cos(0);
    expect(R + T).toBeCloseTo(1, 4);
  });
  it("Brewster's angle: r_p = 0 for air-glass at arctan(1.5)", () => {
    const brewsterRad = Math.atan(1.5 / 1.0);
    const { rp } = fresnelCoefficients(brewsterRad, 1.0, 1.5);
    expect(rp).toBeCloseTo(0, 4);
  });
});

describe("thinLensImage", () => {
  it("object at 2f produces image at 2f with magnification −1", () => {
    const f = 10;
    const { imageDistance, magnification } = thinLensImage(f, 2 * f);
    expect(imageDistance).toBeCloseTo(2 * f, 5);
    expect(magnification).toBeCloseTo(-1, 5);
  });
  it("object at infinity produces image at f", () => {
    const f = 10;
    const { imageDistance } = thinLensImage(f, 1e9);
    expect(imageDistance).toBeCloseTo(f, 2);
  });
});

describe("trace — full scene", () => {
  it("single ray refracts through a dielectric interface at 45°", () => {
    const scene: RayTraceScene = {
      width: 400,
      height: 400,
      elements: [
        {
          kind: "ray-source",
          id: "src",
          position: { x: 100, y: 100 },
          directionDeg: 45,
          wavelengthNm: 550,
        },
        {
          kind: "interface",
          id: "glass",
          p1: { x: 200, y: 50 },
          p2: { x: 200, y: 350 },
          n1: 1.0,
          n2: 1.5,
        },
        {
          kind: "screen",
          id: "scr",
          center: { x: 380, y: 200 },
          axis: { x: -1, y: 0 },
          halfWidth: 200,
        },
      ],
    };
    const result = trace(scene);
    expect(result.rays.length).toBe(1);
    expect(result.rays[0].segments.length).toBeGreaterThanOrEqual(2);
    // After refraction entering a denser medium, the ray bends toward the normal
    const entering = result.rays[0].segments[0];
    const inside = result.rays[0].segments[1];
    const angleInside = Math.atan2(inside.to.y - inside.from.y, inside.to.x - inside.from.x);
    const angleEntering = Math.atan2(entering.to.y - entering.from.y, entering.to.x - entering.from.x);
    expect(Math.abs(angleInside)).toBeLessThan(Math.abs(angleEntering));
  });
});

describe("huygensSum — double-slit fringe spacing", () => {
  it("produces fringe spacing λL/d (within 5%) for small-angle Fraunhofer geometry", async () => {
    const { huygensSum } = await import("./tracer");
    const lambdaMm = 550e-6;      // 550 nm in mm
    const d = 0.25;                // slit separation mm
    const L = 500;                 // distance to screen mm
    const expectedFringe = (lambdaMm * L) / d;
    // sample intensity across the screen; find first peak spacing
    const bins = 2048;
    const halfScreen = 20;
    const intensity = huygensSum({
      slitPositions: [-d / 2, +d / 2],
      slitWidth: 0.05,
      wavelengthMm: lambdaMm,
      distanceToScreen: L,
      screenHalfWidth: halfScreen,
      bins,
    });
    // find centre peak and first side peak
    let centreIdx = 0;
    let maxI = 0;
    for (let i = 0; i < bins; i += 1) {
      if (intensity[i] > maxI) {
        maxI = intensity[i];
        centreIdx = i;
      }
    }
    let firstPeakIdx = centreIdx + 1;
    while (firstPeakIdx < bins - 1 && !(intensity[firstPeakIdx] > intensity[firstPeakIdx - 1] && intensity[firstPeakIdx] > intensity[firstPeakIdx + 1])) {
      firstPeakIdx += 1;
    }
    const fringeMm = ((firstPeakIdx - centreIdx) / bins) * 2 * halfScreen;
    expect(fringeMm).toBeCloseTo(expectedFringe, 1);
  });
});
```

- [ ] **Step 2: Run tests, expect all to fail (tracer not implemented yet)**

Run: `pnpm vitest run components/physics/ray-trace-canvas/tracer.test.ts`
Expected: FAIL — "refract is not defined" etc.

- [ ] **Step 3: Implement `tracer.ts`**

```ts
import type {
  RayTraceScene,
  SceneElement,
  TraceResult,
  TracedRay,
  Vec2,
  Interface,
  Mirror,
  ThinLens,
  RaySource,
  Screen,
  Slit,
} from "./types";

function dot(a: Vec2, b: Vec2): number { return a.x * b.x + a.y * b.y; }
function len(a: Vec2): number { return Math.sqrt(dot(a, a)); }
function normalize(a: Vec2): Vec2 { const l = len(a) || 1; return { x: a.x / l, y: a.y / l }; }
function sub(a: Vec2, b: Vec2): Vec2 { return { x: a.x - b.x, y: a.y - b.y }; }
function add(a: Vec2, b: Vec2): Vec2 { return { x: a.x + b.x, y: a.y + b.y }; }
function scale(a: Vec2, s: number): Vec2 { return { x: a.x * s, y: a.y * s }; }

/**
 * Snell's law. `normal` points into medium 1 (side the ray comes FROM).
 * Returns null if total internal reflection.
 */
export function refract(direction: Vec2, normal: Vec2, n1: number, n2: number): Vec2 | null {
  const n = normalize(normal);
  const d = normalize(direction);
  let cosI = -dot(d, n);
  let nFrom = n1;
  let nTo = n2;
  let normUsed = n;
  if (cosI < 0) { // ray exits from the other side
    cosI = -cosI;
    nFrom = n2;
    nTo = n1;
    normUsed = scale(n, -1);
  }
  const eta = nFrom / nTo;
  const sin2T = eta * eta * (1 - cosI * cosI);
  if (sin2T > 1) return null; // TIR
  const cosT = Math.sqrt(1 - sin2T);
  return normalize(add(scale(d, eta), scale(normUsed, eta * cosI - cosT)));
}

/** Returns reflection vector r = d − 2(d·n)n (n need not be unit). */
export function reflect(direction: Vec2, normal: Vec2): Vec2 {
  const n = normalize(normal);
  const d = normalize(direction);
  return normalize(sub(d, scale(n, 2 * dot(d, n))));
}

/** Critical angle for TIR from medium n1 into n2 (n1 > n2). Returns null otherwise. */
export function criticalAngle(n1: number, n2: number): number | null {
  if (n1 <= n2) return null;
  return Math.asin(n2 / n1);
}

/**
 * Fresnel amplitude coefficients for s-polarization (perp) and p-polarization (parallel).
 * thetaI is incidence angle in radians.
 */
export function fresnelCoefficients(thetaI: number, n1: number, n2: number) {
  const sinT = (n1 / n2) * Math.sin(thetaI);
  if (Math.abs(sinT) > 1) {
    return { rs: -1, rp: -1, ts: 0, tp: 0 }; // TIR
  }
  const thetaT = Math.asin(sinT);
  const cosI = Math.cos(thetaI);
  const cosT = Math.cos(thetaT);
  const rs = (n1 * cosI - n2 * cosT) / (n1 * cosI + n2 * cosT);
  const rp = (n2 * cosI - n1 * cosT) / (n2 * cosI + n1 * cosT);
  const ts = (2 * n1 * cosI) / (n1 * cosI + n2 * cosT);
  const tp = (2 * n1 * cosI) / (n2 * cosI + n1 * cosT);
  return { rs, rp, ts, tp };
}

/** Thin-lens equation: 1/f = 1/s_o + 1/s_i. Returns image distance and magnification. */
export function thinLensImage(focalLength: number, objectDistance: number): { imageDistance: number; magnification: number } {
  const imageDistance = 1 / (1 / focalLength - 1 / objectDistance);
  const magnification = -imageDistance / objectDistance;
  return { imageDistance, magnification };
}

/**
 * Huygens–Fresnel summation for a 1D far-field diffraction pattern.
 * Inputs in consistent length units (mm suggested).
 */
export function huygensSum(params: {
  slitPositions: number[];       // position along the aperture plane
  slitWidth: number;
  wavelengthMm: number;
  distanceToScreen: number;
  screenHalfWidth: number;
  bins: number;
}): number[] {
  const { slitPositions, slitWidth, wavelengthMm, distanceToScreen, screenHalfWidth, bins } = params;
  const intensity = new Array<number>(bins).fill(0);
  const k = (2 * Math.PI) / wavelengthMm;
  const subSourcesPerSlit = 64;
  const dx = slitWidth / subSourcesPerSlit;
  for (let b = 0; b < bins; b += 1) {
    const yScreen = -screenHalfWidth + (b / (bins - 1)) * 2 * screenHalfWidth;
    let re = 0;
    let im = 0;
    for (const slitCentre of slitPositions) {
      for (let s = 0; s < subSourcesPerSlit; s += 1) {
        const yS = slitCentre - slitWidth / 2 + (s + 0.5) * dx;
        const r = Math.sqrt(distanceToScreen * distanceToScreen + (yScreen - yS) * (yScreen - yS));
        const phase = k * r;
        re += Math.cos(phase) / Math.sqrt(r);
        im += Math.sin(phase) / Math.sqrt(r);
      }
    }
    intensity[b] = re * re + im * im;
  }
  // normalise to unit max
  const maxI = Math.max(...intensity) || 1;
  for (let i = 0; i < bins; i += 1) intensity[i] /= maxI;
  return intensity;
}

/**
 * Trace every RaySource through the scene until each ray terminates.
 * Interfaces refract + optionally reflect (weighted by Fresnel if caller wants).
 * Mirrors reflect. Lenses refract via thin-lens formula. Slits emit HuygensWavelet (deferred to huygensSum).
 * Screens absorb.
 * This is an analytical, bounce-counting engine — NOT a Maxwell-FDTD solver.
 */
export function trace(scene: RayTraceScene): TraceResult {
  const rays: TracedRay[] = [];
  const screens = scene.elements.filter((e): e is Screen => e.kind === "screen");
  const screenIntensities = new Map<string, number[]>();
  for (const sc of screens) {
    screenIntensities.set(sc.id, new Array<number>(sc.intensityBins ?? 256).fill(0));
  }
  const sources = scene.elements.filter((e): e is RaySource => e.kind === "ray-source");
  for (const src of sources) {
    const fanCount = src.fanCount ?? 1;
    const halfAngle = src.fanHalfAngleDeg ?? 0;
    for (let i = 0; i < fanCount; i += 1) {
      const t = fanCount === 1 ? 0 : (i / (fanCount - 1)) * 2 - 1;
      const angleDeg = src.directionDeg + t * halfAngle;
      const rad = (angleDeg * Math.PI) / 180;
      const direction = { x: Math.cos(rad), y: Math.sin(rad) };
      const traced = traceSingleRay(scene, src.position, direction, src.wavelengthNm, scene.maxBounces ?? 32);
      traced.sourceId = src.id;
      rays.push(traced);
    }
  }
  return { rays, screenIntensities };
}

function traceSingleRay(
  scene: RayTraceScene,
  origin: Vec2,
  direction: Vec2,
  wavelengthNm: number | undefined,
  maxBounces: number,
): TracedRay {
  const segments: TracedRay["segments"] = [];
  let cur = { x: origin.x, y: origin.y };
  let dir = normalize(direction);
  let bounces = 0;
  while (bounces < maxBounces) {
    const hit = nearestHit(scene, cur, dir);
    if (!hit) {
      segments.push({ from: cur, to: { x: cur.x + dir.x * 10000, y: cur.y + dir.y * 10000 }, amplitude: 1, wavelengthNm });
      return { id: `ray-${bounces}`, sourceId: "", segments, terminated: "escaped" };
    }
    segments.push({ from: cur, to: hit.point, amplitude: 1, wavelengthNm });
    if (hit.element.kind === "screen") {
      return { id: `ray-${bounces}`, sourceId: "", segments, terminated: "screen-hit", terminalPoint: hit.point };
    }
    if (hit.element.kind === "interface") {
      const n1 = hit.fromSide === "p1" ? hit.element.n1 : hit.element.n2;
      const n2 = hit.fromSide === "p1" ? hit.element.n2 : hit.element.n1;
      const refracted = refract(dir, hit.normal, n1, n2);
      if (!refracted) {
        dir = reflect(dir, hit.normal); // TIR
      } else {
        dir = refracted;
      }
    } else if (hit.element.kind === "mirror") {
      dir = reflect(dir, hit.normal);
    } else if (hit.element.kind === "thin-lens") {
      dir = refractThinLens(hit.element, cur, dir);
    }
    cur = { x: hit.point.x + dir.x * 0.001, y: hit.point.y + dir.y * 0.001 };
    bounces += 1;
  }
  return { id: `ray-maxbounces`, sourceId: "", segments, terminated: "max-bounces" };
}

interface Hit {
  element: SceneElement;
  point: Vec2;
  normal: Vec2;
  distance: number;
  fromSide: "p1" | "p2"; // which side the ray came from — for interface n1/n2 swap
}

function nearestHit(scene: RayTraceScene, origin: Vec2, dir: Vec2): Hit | null {
  let nearest: Hit | null = null;
  for (const el of scene.elements) {
    let hit: Hit | null = null;
    if (el.kind === "interface") hit = hitInterface(el, origin, dir);
    else if (el.kind === "mirror") hit = hitMirror(el, origin, dir);
    else if (el.kind === "thin-lens") hit = hitThinLens(el, origin, dir);
    else if (el.kind === "screen") hit = hitScreen(el, origin, dir);
    if (hit && (!nearest || hit.distance < nearest.distance)) nearest = hit;
  }
  return nearest;
}

function hitInterface(el: Interface, origin: Vec2, dir: Vec2): Hit | null {
  // parameterise segment p1 + t(p2-p1) and ray origin + s*dir, solve 2x2
  const vx = el.p2.x - el.p1.x;
  const vy = el.p2.y - el.p1.y;
  const denom = dir.x * (-vy) - dir.y * (-vx);
  if (Math.abs(denom) < 1e-9) return null;
  const t = ((el.p1.x - origin.x) * (-vy) - (el.p1.y - origin.y) * (-vx)) / denom;
  const u = ((el.p1.x - origin.x) * dir.y - (el.p1.y - origin.y) * dir.x) / -denom;
  if (t < 1e-6 || u < 0 || u > 1) return null;
  const point = { x: origin.x + t * dir.x, y: origin.y + t * dir.y };
  const normal = normalize({ x: -vy, y: vx }); // 90° rotation of interface tangent
  const fromSide = dot(sub(origin, el.p1), normal) > 0 ? "p1" as const : "p2" as const;
  return { element: el, point, normal, distance: t, fromSide };
}

function hitMirror(_el: Mirror, _origin: Vec2, _dir: Vec2): Hit | null {
  return null; // not needed for any §09 topic in Session 5 beyond flat-mirror case handled via Interface with reflective:true
}

function hitThinLens(el: ThinLens, origin: Vec2, dir: Vec2): Hit | null {
  // treat lens as an infinitely-thin segment centered on el.center, extending perpendicular to el.axis
  const perp = { x: -el.axis.y, y: el.axis.x };
  const p1 = { x: el.center.x - perp.x * el.apertureHalfWidth, y: el.center.y - perp.y * el.apertureHalfWidth };
  const p2 = { x: el.center.x + perp.x * el.apertureHalfWidth, y: el.center.y + perp.y * el.apertureHalfWidth };
  const pseudo: Interface = { kind: "interface", id: el.id, p1, p2, n1: 1, n2: 1 };
  return hitInterface(pseudo, origin, dir);
}

function hitScreen(el: Screen, origin: Vec2, dir: Vec2): Hit | null {
  const perp = { x: -el.axis.y, y: el.axis.x };
  const p1 = { x: el.center.x - perp.x * el.halfWidth, y: el.center.y - perp.y * el.halfWidth };
  const p2 = { x: el.center.x + perp.x * el.halfWidth, y: el.center.y + perp.y * el.halfWidth };
  const pseudo: Interface = { kind: "interface", id: el.id, p1, p2, n1: 1, n2: 1 };
  return hitInterface(pseudo, origin, dir);
}

function refractThinLens(el: ThinLens, origin: Vec2, dir: Vec2): Vec2 {
  // Approximate: for a ray hitting the lens at displacement h from the axis,
  // the output direction is such that it focuses at distance f on the axis.
  const axis = normalize(el.axis);
  const perp = { x: -axis.y, y: axis.x };
  // distance along perp from axis to where ray hits (assume ray is at lens position)
  const rel = sub(origin, el.center);
  const h = dot(rel, perp);
  // exit angle: tan(theta_out) = tan(theta_in) - h / f (paraxial thin-lens)
  const inAngle = Math.atan2(dot(dir, perp), dot(dir, axis));
  const outAngle = inAngle - h / el.focalLength;
  return normalize(add(scale(axis, Math.cos(outAngle)), scale(perp, Math.sin(outAngle))));
}
```

- [ ] **Step 4: Rerun tests, iterate until green**

Run: `pnpm vitest run components/physics/ray-trace-canvas/tracer.test.ts`
Expected: all 8+ cases pass (Snell sandwich, normal incidence, critical angle, Fresnel-normal, Brewster, thin-lens 2f, thin-lens infinity, Huygens fringe spacing, scene-trace refraction).

### Task 1.5.3: Declarative renderer component

**File:** `components/physics/ray-trace-canvas/RayTraceCanvas.tsx`

- [ ] **Step 1: Implement the component**

```tsx
"use client";
import { useEffect, useRef } from "react";
import type { RayTraceScene, SceneElement } from "./types";
import { trace } from "./tracer";

export interface RayTraceCanvasProps {
  scene: RayTraceScene;
  className?: string;
  /** Show intensity overlay on screens with diffraction/interference. */
  showIntensity?: boolean;
  /** Optional HUD — key/value pairs to overlay in the top-left. */
  hud?: Record<string, string | number>;
}

const BG = "#0b0d10";
const RAY_COLOR = "rgba(255,180,80,0.9)";
const WAVEFRONT_COLOR = "rgba(140,200,255,0.6)";
const INTERFACE_COLOR = "rgba(120,220,240,0.8)";
const LENS_COLOR = "rgba(200,160,255,0.9)";
const SCREEN_COLOR = "rgba(200,200,210,0.8)";
const SLIT_COLOR = "rgba(230,100,200,0.9)";
const HUD_COLOR = "rgba(200,200,200,0.7)";

export function RayTraceCanvas({ scene, className, showIntensity, hud }: RayTraceCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const { width, height } = scene;
    canvas.width = width * window.devicePixelRatio;
    canvas.height = height * window.devicePixelRatio;
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;
    ctx.setTransform(window.devicePixelRatio, 0, 0, window.devicePixelRatio, 0, 0);
    ctx.clearRect(0, 0, width, height);
    ctx.fillStyle = scene.background ?? BG;
    ctx.fillRect(0, 0, width, height);

    // trace rays
    const result = trace(scene);

    // draw static scene elements first
    for (const el of scene.elements) drawElement(ctx, el);
    // draw traced rays on top
    for (const ray of result.rays) drawRay(ctx, ray);

    // HUD
    if (hud) drawHUD(ctx, hud);
  }, [scene, showIntensity, hud]);

  return <canvas ref={canvasRef} className={className} />;
}

function drawElement(ctx: CanvasRenderingContext2D, el: SceneElement) {
  ctx.lineWidth = 1.5;
  if (el.kind === "interface") {
    ctx.strokeStyle = INTERFACE_COLOR;
    ctx.beginPath();
    ctx.moveTo(el.p1.x, el.p1.y);
    ctx.lineTo(el.p2.x, el.p2.y);
    ctx.stroke();
  } else if (el.kind === "thin-lens") {
    ctx.strokeStyle = LENS_COLOR;
    const perp = { x: -el.axis.y, y: el.axis.x };
    const p1 = { x: el.center.x - perp.x * el.apertureHalfWidth, y: el.center.y - perp.y * el.apertureHalfWidth };
    const p2 = { x: el.center.x + perp.x * el.apertureHalfWidth, y: el.center.y + perp.y * el.apertureHalfWidth };
    ctx.beginPath();
    ctx.moveTo(p1.x, p1.y);
    ctx.lineTo(p2.x, p2.y);
    ctx.stroke();
  } else if (el.kind === "screen") {
    ctx.strokeStyle = SCREEN_COLOR;
    const perp = { x: -el.axis.y, y: el.axis.x };
    const p1 = { x: el.center.x - perp.x * el.halfWidth, y: el.center.y - perp.y * el.halfWidth };
    const p2 = { x: el.center.x + perp.x * el.halfWidth, y: el.center.y + perp.y * el.halfWidth };
    ctx.beginPath();
    ctx.moveTo(p1.x, p1.y);
    ctx.lineTo(p2.x, p2.y);
    ctx.stroke();
  } else if (el.kind === "slit") {
    ctx.strokeStyle = SLIT_COLOR;
    ctx.beginPath();
    ctx.arc(el.center.x, el.center.y, 3, 0, Math.PI * 2);
    ctx.stroke();
  }
}

function drawRay(ctx: CanvasRenderingContext2D, ray: { segments: { from: { x: number; y: number }; to: { x: number; y: number }; amplitude: number }[] }) {
  ctx.strokeStyle = RAY_COLOR;
  ctx.lineWidth = 1.3;
  for (const seg of ray.segments) {
    ctx.beginPath();
    ctx.moveTo(seg.from.x, seg.from.y);
    ctx.lineTo(seg.to.x, seg.to.y);
    ctx.stroke();
  }
}

function drawHUD(ctx: CanvasRenderingContext2D, hud: Record<string, string | number>) {
  ctx.fillStyle = HUD_COLOR;
  ctx.font = "11px ui-monospace, monospace";
  let y = 16;
  for (const [k, v] of Object.entries(hud)) {
    ctx.fillText(`${k}: ${v}`, 12, y);
    y += 14;
  }
}
```

### Task 1.5.4: Commit Wave 1.5

- [ ] **Step 1: Final test pass + build check**

Run: `pnpm vitest run components/physics/ray-trace-canvas/ && pnpm tsc --noEmit`
Expected: all tests pass, zero TS errors.

- [ ] **Step 2: Commit**

```bash
git add components/physics/ray-trace-canvas/
git commit -m "$(cat <<'EOF'
feat(physics): RayTraceCanvas primitive — declarative scene graph + analytical tracer

Shared primitive serving §08 plane-wave rendering and §09 optics topics
(FIG.42–51). Canonical types home for RaySource / Interface / ThinLens /
Mirror / Aperture / Slit / Screen / HuygensWavelet / WaveguideMode.

Tracer is analytical (not FDTD): Snell refraction at flat interfaces,
reflection at mirrors, TIR cut-off at n1>n2, Fresnel amplitude coefficients
for s/p polarization, thin-lens imaging via lens-maker paraxial approximation,
and Huygens–Fresnel summation for double-slit far-field patterns.

Vitest covers Snell sandwich round-trip, normal incidence, glass/air critical
angle ≈41.8°, Fresnel normal-incidence magnitude match, Brewster angle r_p=0,
thin-lens 2f→2f magnification=−1, infinity→f, and double-slit fringe spacing
λL/d within 5%. All green.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

### Wave 2 — 14 parallel per-topic agents

**Purpose:** Each agent takes ownership of exactly one topic and ships a vertical slice: physics lib + vitest + 3–4 scene components + page.tsx + content.en.mdx. No registry edits. No publishes. No commits. Return structured handoff block.

**Parallel, 14 subagents. 0 commits (orchestrator commits in Wave 2.5).**

**Shared contract delivered to every Wave 2 agent (inline in the dispatch prompt):**

> You are building ONE topic of the EM branch. You must ship a vertical slice: physics lib + vitest + scene components + page.tsx + content.en.mdx. Voice: Kurzgesagt meets Stripe docs — short declarative sentences, historical hooks, no filler, target 1100–1400 words (1400–1600 for money-shot topics marked below).
>
> **DO NOT:**
> - touch `lib/content/simulation-registry.ts`
> - touch `components/physics/visualization-registry.tsx`
> - run `pnpm content:publish`
> - `git commit` anything
>
> **IMPORT:**
> - §09 optics agents: all scene-graph types from `@/components/physics/ray-trace-canvas/types`; render via `<RayTraceCanvas>`. If you need a type extension, STOP and flag orchestrator.
> - §08 agents: `Vec3` from `@/lib/physics/electromagnetism/lorentz`; `Vec2` from `@/lib/physics/coulomb`.
>
> **RETURN a handoff block containing:**
> ```json
> {
>   "slug": "...",
>   "registry": "// EM §0X — <slug>\\n<EntryA>Scene: lazyScene(() => ...),\\n...",
>   "publishArg": "electromagnetism/<slug>",
>   "commitSubject": "feat(em/§0X): <slug> — <tagline>",
>   "forwardRefs": ["slug-a", "slug-b"],
>   "typeExtensionsNeeded": null | { "field": "...", "why": "..." }
> }
> ```

### Tasks 2.1–2.14 — one per topic

For every topic below, the steps are identical; only the FIG number, module, slug, physics-lib slug, scene names, and prose vary. List each task with:

- **Files:** physics lib, test, 3–4 scene components, page.tsx, content.en.mdx (all paths absolute).
- **Steps 1–6 (boilerplate, one per task):**
  1. Write physics-lib module (pure TS; for §08 follow existing `lib/physics/electromagnetism/` conventions; for §09 import pure tracer helpers from `@/components/physics/ray-trace-canvas/tracer` where appropriate).
  2. Write vitest tests — 3–8 cases covering the core formulas (e.g. §09.4 TIR critical-angle formula, §09.8 fringe-spacing formula, §09.3 Brewster-angle r_p zero at arctan(n2/n1), §08.1 wave-speed c = 1/√(μ₀ε₀) value, §08.3 radiation-pressure = I/c for total absorption and 2I/c for total reflection).
  3. Write scene components (3–4 per topic; default export names end in `Scene`). For §09 topics, the component builds a `RayTraceScene` declaratively and passes to `<RayTraceCanvas>`. For §08 topics, use Canvas 2D directly.
  4. Copy `page.tsx` from `app/[locale]/(topics)/electromagnetism/displacement-current/page.tsx` verbatim; change only the `SLUG` constant to `electromagnetism/<slug>`.
  5. Author `content.en.mdx` following the canonical MDX shape. Include FIG number in the `<TopicHeader eyebrow>`. Use `<PhysicistLink slug="...">` for every physicist reference (must match a PHYSICISTS entry or a Wave 3 placeholder). Use `<Term slug="...">` for every glossary reference. Include `<EquationBlock tex={`\\LaTeX`}>` for every formula. Include 3–4 `<SceneCard>` wrapping the new scene components. Include at least 2 `<Callout variant="math">` asides for denser derivations.
  6. Assemble and return the handoff block with `registry` + `publishArg` + `commitSubject` + `forwardRefs` (slugs referenced that are not yet in PHYSICISTS or GLOSSARY) + `typeExtensionsNeeded`.

**Topic roster:**

- [ ] **Task 2.1: §08.1 deriving-the-em-wave-equation** — FIG.38. Physics lib `em-wave-equation.ts`. Tests: c = 1/√(μ₀ε₀) numerical to 1% of 299792458 m/s; plane-wave ansatz satisfies ∇²E − (1/c²)∂²E/∂t² = 0; curl(curl E) identity = −∇²E under ∇·E = 0. Scenes: (a) MaxwellFourLinesScene — Maxwell's four equations animating vacuum → wave equation derivation step-by-step; (b) VacuumWaveScene — propagating 1D sinusoidal E,B visualization with k vector direction; (c) SpeedMeasurementScene — Fizeau toothed-wheel visualization with Paris-Montmartre geometry. Physicists: Maxwell (existing), Hertz (verify existing), Fizeau (NEW Wave 1). Terms: `em-wave-equation-term`, `transverse-wave-em`, `speed-of-light` (verify exists). **Money-shot: 1500-word derivation; write it like you mean it.** Upgrades `electromagnetic-wave` from Session 4 placeholder — Wave 3 handles the Supabase update, but this topic's prose should treat it as the canonical reference.

- [ ] **Task 2.2: §08.2 plane-waves-and-polarization** — FIG.39. Physics lib `plane-waves.ts`. Tests: E⊥B⊥k always (dot products zero for any valid plane wave); linear ↔ circular ↔ elliptical parameterisation as two orthogonal components with variable amplitude/phase; Poynting vector S = E×B/μ₀ direction = k̂. Scenes: (a) **[money shot]** PolarizationMorphScene — 3D plane wave with E/B sinusoids, polarization slider (ellipticity 0→1, phase 0→π); (b) PolarizationAxisScene — rotating linear polariser over unpolarised beam showing Malus's law I = I₀cos²θ. (c) JonesVectorsScene — 2D parameter space showing how (Ex, Ey, phase) maps to polarization state. Physicists: Maxwell. Terms: `plane-wave-term`, `linear-polarization`, `circular-polarization`, `elliptical-polarization`, `polarization-axis`. **Money-shot: 1500 words.**

- [ ] **Task 2.3: §08.3 radiation-pressure** — FIG.40. Physics lib `radiation-pressure.ts` (distinct from glossary `radiation-pressure-term` from §07.5). Tests: P = I/c for total absorption; P = 2I/c for total reflection; solar-sail acceleration for 1 kg/m² under solar flux 1361 W/m² at 1 AU; Crookes-radiometer thermal-dominant behaviour at low vacuum (negative result — radiation-pressure DOESN'T drive Crookes radiometer, common-misconception callout). Scenes: (a) PhotonMomentumScene — incident photon bouncing off mirror, momentum-transfer arrow; (b) SolarSailScene — solar-sail spacecraft with radiation-pressure vector + gravity vector, acceleration over time; (c) NicholsRadiometerScene — Nichols's 1901 delicate-torsion-balance historical measurement. Physicists: Maxwell (prediction 1862), Nichols (verify existing? if not — SKIP, reference inline without link). Terms: reuse `radiation-pressure-term`. **Target: 1300 words.**

- [ ] **Task 2.4: §08.4 the-electromagnetic-spectrum** — FIG.41. Physics lib `em-spectrum.ts` — a constants + converters module, not a solver. Tests: wavelength-frequency conversion c = λf numerical across 10 bands; wavenumber k = 2π/λ; band boundaries in SI. Scenes: (a) SpectrumBandsScene — logarithmic scale from radio (10⁵ m) to gamma (10⁻¹⁵ m), bands coloured, annotated with real-world generators (cosmic background, microwaves ovens, 5G, visible = Fraunhofer-line spectrum overlay, X-ray, Chernobyl gamma); (b) FraunhoferLinesScene — sun's spectrum with dark absorption lines + their element identifications; (c) VisibleBandZoomScene — zoom into 380–780 nm with RGB rendering vs true CIE colours. Physicists: Fraunhofer (NEW). Terms: `em-spectrum`, `wavelength-em`, `wavenumber`. **Target: 1100 words.**

- [ ] **Task 2.5: §09.1 index-of-refraction** — FIG.42. Physics lib `optics-refraction.ts`. Tests: phase velocity v = c/n for n > 1; group velocity < c always; Cauchy dispersion A + B/λ² fits air/glass/water reasonably; sub-1 refractive index at X-ray wavelengths (n < 1 for X-rays in glass — counterintuitive fact callout). Scenes: (a) MediumDelayScene — pulse propagates through a slab of n=1.5 and exits time-delayed versus vacuum control; (b) DispersionTableScene — common materials table with refractive indices, animated on hover; (c) GroupVsPhaseScene — wave packet showing both phase and group velocities. Terms: `refractive-index` (UPGRADE Supabase in Wave 3 if needed), `group-velocity-em`. Physicists: none new. **Target: 1100 words.**

- [ ] **Task 2.6: §09.2 skin-depth-in-conductors** — FIG.43. Physics lib `skin-depth.ts`. Tests: δ = √(2/(μσω)) for good conductor; δ at 50 Hz in copper ≈ 9.3 mm; δ at 1 GHz in copper ≈ 2 µm; δ scales as 1/√f. Scenes: (a) SkinDepthDecayScene — exponential intensity decay inside a conductor vs frequency slider; (b) CrossSectionScene — cross-section of conductor with current density concentrated near surface at high frequency; (c) CoaxSkinEffectScene — coaxial cable with AC vs DC current distribution. Terms: `skin-depth`. Physicists: Heaviside (existing from §06.7). **Target: 1100 words.**

- [ ] **Task 2.7: §09.3 fresnel-equations** — FIG.44. Physics lib `fresnel.ts`. Tests: all four coefficients (rs, rp, ts, tp) at normal incidence; |r|²+|T|²=1 with T = (n2 cos θT)/(n1 cos θI)|t|²; r_p = 0 at Brewster θ_B = arctan(n2/n1); r_s, r_p = −1 at grazing incidence. Scenes: (a) **[money shot]** FresnelCurvesScene — |rs|² and |rp|² vs incidence-angle plot, sliding incidence angle shows incoming ray + reflected + transmitted with Fresnel-weighted amplitudes; (b) BrewsterAngleScene — at Brewster angle, reflected light is purely s-polarised, illustrated with vector arrows; (c) WaterGlassScene — air-water-glass sandwich with amplitude tracking. Physicists: Fresnel (NEW). Terms: `fresnel-equations` (UPGRADE placeholder to full — Wave 3 upserts Supabase), `s-polarization`, `p-polarization`. **Money-shot: 1500 words.**

- [ ] **Task 2.8: §09.4 total-internal-reflection** — FIG.45. Physics lib `tir.ts`. Tests: critical angle from glass to air = 41.81°; critical angle water to air = 48.6°; evanescent decay length near TIR; frustrated TIR across thin gap analogously to quantum tunnelling. Scenes: (a) CriticalAngleScene — slider from 0 to 90° showing refraction, TIR, and the transition; (b) FiberOpticTIRScene — light bouncing inside a glass rod via repeated TIR; (c) EvanescentWaveScene — near-field evanescent penetration across an air gap. Physicists: Snell (NEW). Terms: `total-internal-reflection-term`, `critical-angle`. **Target: 1100 words.**

- [ ] **Task 2.9: §09.5 optical-dispersion** — FIG.46. Physics lib `optical-dispersion.ts`. Tests: Cauchy equation fit for BK7 crown glass; Abbe number V_d = (n_d − 1)/(n_F − n_C) values for crown vs flint glass; anomalous dispersion near resonance; dn/dλ negative for normal dispersion. Scenes: (a) PrismSpectrumScene — white-light prism with wavelength-dependent refractions producing rainbow; (b) RainbowFormationScene — rainbow formation geometry: spherical raindrop, two internal reflections = primary, three = secondary; (c) AbbeDiagramScene — Abbe-number-vs-nd scatter plot of glass types. Physicists: Newton (existing, `relatedTopics` append in Wave 1). Terms: `optical-dispersion-term`, `abbe-number`, `anomalous-dispersion`. **Target: 1200 words.** Cross-link: CM's `dispersion-and-group-velocity`.

- [ ] **Task 2.10: §09.6 geometric-optics** — FIG.47. Physics lib `geometric-optics.ts`. Tests: Snell's law as local minimum of path-time = Fermat; thin-lens equation 1/f = 1/s_o + 1/s_i; magnification = −s_i/s_o; lensmaker's equation for double-convex. Scenes: (a) **[money shot]** FermatPathTimeScene — minimum-time path selected across candidate paths, animated converging onto the Snell-solution; (b) ThinLensRayDiagramScene — object + two principal rays + image, slider for object distance; (c) MirrorConcaveScene — concave mirror ray diagram. Physicists: Fermat (existing, `relatedTopics` append). Terms: `snells-law`, `fermats-principle`, `thin-lens`, `focal-length`. **Money-shot: 1400 words.** Cross-link: CM's `principle-of-least-action`.

- [ ] **Task 2.11: §09.7 interference** — FIG.48. Physics lib `interference.ts`. Tests: two-source interference pattern intensity ∝ cos²(Δφ/2); constructive at Δφ = 2πm; destructive at Δφ = (2m+1)π; thin-film interference phase π upon reflection at higher-n interface; Newton's rings spacing r_m = √(mλR). Scenes: (a) TwoSourceInterferenceScene — two coherent point sources overlapping + fringe pattern; (b) NewtonsRingsScene — plano-convex lens on flat glass with monochromatic illumination producing concentric rings; (c) ThinFilmScene — soap-bubble interference with continuous colour band based on film thickness. Physicists: Young (existing, `relatedTopics` append), Huygens (existing, `relatedTopics` append), Newton (existing). Terms: `constructive-interference`, `destructive-interference`, `coherence-length`. **Target: 1200 words.**

- [ ] **Task 2.12: §09.8 diffraction-and-the-double-slit** — FIG.49. Physics lib `diffraction.ts` (import `huygensSum` from `@/components/physics/ray-trace-canvas/tracer`). Tests: single-slit first minimum at sin θ = λ/a; double-slit fringe spacing λL/d; fringe spacing varies linearly with L, inversely with d; envelope = single-slit diffraction × fringe pattern (multiplication). Scenes: (a) **[money shot]** DoubleSlitBuildupScene — photon-by-photon accumulation onto screen, fringe pattern emerging, slider for d (slit separation), λ (wavelength), L (screen distance), toggle particle-view ↔ wave-view; (b) SingleSlitScene — single-slit diffraction pattern with central maximum width 2λL/a; (c) DiffractionGratingScene — N-slit interference pattern with principal maxima. Physicists: Young (existing), Fraunhofer (NEW). Terms: `diffraction-em`, `huygens-principle`, `single-slit-diffraction`, `double-slit-diffraction`. **Money-shot: 1600 words. This is THE rock-star topic of the module.**

- [ ] **Task 2.13: §09.9 polarization-phenomena** — FIG.50. Physics lib `polarization-optics.ts`. Tests: Malus's law I = I₀ cos²θ; Brewster angle = arctan(n2/n1) for air-glass = 56.3°; quarter-wave plate converts linear→circular; birefringence ordinary+extraordinary-ray split in calcite ≈ 1.7mm for 1mm thick crystal. Scenes: (a) MalusLawScene — rotating analyser over linear-polarised beam, intensity vs angle plot; (b) BrewsterAngleScene — incidence at Brewster showing s/p separation; (c) CalciteBirefringenceScene — calcite crystal splitting a ray into ordinary + extraordinary. Physicists: Brewster (NEW), Malus (verify existing? if not — skip, reference inline). Terms: `brewster-angle`, `birefringence`, `malus-law`. **Target: 1200 words.**

- [ ] **Task 2.14: §09.10 waveguides-and-fibers** — FIG.51. Physics lib `waveguides.ts`. Tests: cutoff frequency for TE_mn mode in rectangular waveguide; numerical aperture NA = √(n_core² − n_clad²); acceptance cone half-angle = arcsin(NA); step-index fiber vs graded-index mode structure. Scenes: (a) StepIndexFiberScene — ray bouncing inside core via TIR at core-cladding interface; (b) NumericalApertureScene — acceptance cone from fiber end; (c) TelecomBandScene — standard optical-fiber telecom windows (850/1310/1550 nm) with attenuation curve. Physicists: Heaviside (existing, §06.7), Snell (NEW). Terms: `optical-fiber`, `waveguide-mode`, `numerical-aperture`. **Target: 1300 words.** Cross-link: §06.7 transmission-lines.

---

### Wave 2.5 — Serial orchestrator merge + publish + commit

**Purpose:** Take the 14 handoff blocks from Wave 2 and execute the registry-merge + publish + commit dance for each, one by one, in spec order (§08 FIG.38→41 first, then §09 FIG.42→51).

**Serial, inline orchestrator (no subagent). 14 commits.**

For each of 14 topics in order:

- [ ] **Step 1: Type-extension reconciliation (if any)**

If the agent flagged `typeExtensionsNeeded`, apply the type addition to `components/physics/ray-trace-canvas/types.ts`; re-run `pnpm vitest run components/physics/ray-trace-canvas/` (must stay green); commit as:
```bash
git add components/physics/ray-trace-canvas/types.ts
git commit -m "feat(physics): extend RayTraceCanvas types for <field> (<why>)"
```

- [ ] **Step 2: Append registry entry**

Open `lib/content/simulation-registry.ts`; append the agent's `registry` block immediately before the closing `};` of `SIMULATION_REGISTRY`. Use the section comment `// EM §08 — <slug>` or `// EM §09 — <slug>` pattern already in the file.

- [ ] **Step 3: Publish**

```bash
pnpm content:publish --only electromagnetism/<slug>
```
Expected: `1 inserted` or `1 updated`. `0 / 0` = MDX parse error; investigate before continuing.

- [ ] **Step 4: Per-topic commit**

```bash
git add \
  lib/physics/electromagnetism/<topic>.ts \
  tests/physics/electromagnetism/<topic>.test.ts \
  components/physics/<scene-a>.tsx \
  components/physics/<scene-b>.tsx \
  components/physics/<scene-c>.tsx \
  "app/[locale]/(topics)/electromagnetism/<slug>/page.tsx" \
  "app/[locale]/(topics)/electromagnetism/<slug>/content.en.mdx" \
  lib/content/simulation-registry.ts
git commit -m "$(cat <<EOF
<commitSubject from handoff>

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

Commit order (spec FIG-order):
1. deriving-the-em-wave-equation (FIG.38)
2. plane-waves-and-polarization (FIG.39)
3. radiation-pressure (FIG.40)
4. the-electromagnetic-spectrum (FIG.41)
5. index-of-refraction (FIG.42)
6. skin-depth-in-conductors (FIG.43)
7. fresnel-equations (FIG.44)
8. total-internal-reflection (FIG.45)
9. optical-dispersion (FIG.46)
10. geometric-optics (FIG.47)
11. interference (FIG.48)
12. diffraction-and-the-double-slit (FIG.49)
13. polarization-phenomena (FIG.50)
14. waveguides-and-fibers (FIG.51)

---

### Wave 3 — Seed + forward-refs + curl sweep + spec update + MemPalace log

**Purpose:** Seed all 5 new physicist bios + all new glossary prose into Supabase; upgrade the `fresnel-equations` and `electromagnetic-wave` placeholders to full content; add any forward-ref placeholders surfaced in Wave 2 handoffs; curl-sweep all 14 new URLs; update the spec's progress table to 51/66; file the MemPalace implementation log.

**Serial, 1 subagent. 2–3 commits.**

### Task 3.1: Write seed-em-05.ts

**File:** `scripts/content/seed-em-05.ts` — mirror `scripts/content/seed-em-04.ts` verbatim in structure. Reuse `PhysicistSeed`, `GlossarySeed`, `parseMajorWork`, `paragraphsToBlocks`, and the `main()` upsert loop unchanged.

- [ ] **Step 1: Write 5 PhysicistSeed entries**

Snell, Fresnel, Brewster, Fraunhofer, Fizeau — each with:
- `slug`, `name`, `shortName`, `born`, `died`, `nationality` (match TS entries from Wave 1.2).
- `oneLiner` (≤200 chars).
- `bio` (3 paragraphs, ~400–500 words each) — historical depth and Kurzgesagt voice. Source material for each is in the prompt's "new physicists" section. Include the "Snell derived but never published → Descartes got credit" arc for Snell; Fresnel's "wave-theory-won-against-Laplace + lighthouse-lens + tuberculosis at 39" arc; Brewster's "kaleidoscope-lost-to-hawkers + Royal-Society-president-twice" arc; Fraunhofer's "orphaned-glassmaker-apprentice-survived-roof-collapse + invented-spectroscope + tuberculosis-at-39" arc; Fizeau's "medical-student-who-switched-due-to-stutter + 1849 Paris-Montmartre toothed-wheel c measurement + Foucault-rivalry" arc.
- `contributions`: 5 bullet strings.
- `majorWorks`: 3 "Title (Year) — description" strings.
- `relatedTopics`: matching the Wave 1.2 assignments.

- [ ] **Step 2: Write GlossarySeed entries for all new glossary terms (~35)**

For each new term, write `shortDefinition` (≤250 chars) and `description` (2–3 paragraphs, ~250–400 words). Where the term has pedagogical depth, include a `history` field. Reference `relatedPhysicists` (array of slugs) and `relatedTopics`.

- [ ] **Step 3: Write GlossarySeed upgrades for placeholders**

Two upgrades — same slugs, richer content:
- `fresnel-equations`: replace placeholder with full treatment — derivation summary, r_s/r_p/t_s/t_p formulas, Brewster angle, applications (lens coatings, beam splitters, polarisers). `relatedPhysicists: ["augustin-fresnel"]`.
- `electromagnetic-wave`: replace placeholder with full treatment — wave-equation derivation sketch, E⊥B⊥k, speed c = 1/√(μ₀ε₀), transverse + in-phase in vacuum, polarization, energy density, Poynting flux, momentum/pressure, spectrum. `relatedPhysicists: ["james-clerk-maxwell", "heinrich-hertz", "hippolyte-fizeau"]`.

Both must match existing Supabase row shape → same source_hash computation path → upsert overwrites cleanly.

- [ ] **Step 4: Add any forward-ref placeholders surfaced by Wave 2**

Aggregate `forwardRefs` from all 14 Wave-2 handoff blocks. Expected candidates:
- `larmor-formula` (→ §10.1) if any §09 topic referenced it
- `synchrotron-radiation` (→ §10.4)
- `field-tensor`, `four-potential`, `lorentz-boost-em` (→ §11)
- `aharonov-bohm` (→ §12)

For each surfaced slug that does NOT already have a Supabase row, add a GlossarySeed placeholder with `// FORWARD-REF: full treatment in §0X` comment, `shortDefinition` ending with "Full treatment in §0X of the electromagnetism branch.", `description` starting "This is a placeholder entry..." (Session 4 precedent `seed-em-04.ts:637-665`).

- [ ] **Step 5: Run seed**

```bash
pnpm exec tsx --conditions=react-server scripts/content/seed-em-05.ts
```
Expected: console logs `✓ physicist <slug>` × 5 + `✓ glossary <slug>` × ~35. No errors.

- [ ] **Step 6: Verify placeholder promotions**

```bash
pnpm dev &
DEV_PID=$!
sleep 8
curl -sS http://localhost:3000/en/dictionary/fresnel-equations | grep -c "placeholder" || true   # expect 0
curl -sS http://localhost:3000/en/dictionary/electromagnetic-wave | grep -c "placeholder" || true  # expect 0
kill $DEV_PID 2>/dev/null
```

- [ ] **Step 7: Commit seed**

```bash
git add scripts/content/seed-em-05.ts
git commit -m "$(cat <<'EOF'
fix(em/§08-§09): seed physicists + glossary prose into Supabase

Seeds 5 new physicists (Snell, Fresnel, Brewster, Fraunhofer, Fizeau) and
~35 new glossary terms across EM waves, optics, interference, diffraction,
polarization, and waveguides. Upgrades two forward-ref placeholders to full
prose: fresnel-equations (placeholder since Session 2, commit 0e350ca) and
electromagnetic-wave (placeholder since Session 4's seed-em-04.ts).

Run with: pnpm exec tsx --conditions=react-server scripts/content/seed-em-05.ts

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

### Task 3.2: Curl-sweep all 14 new URLs

- [ ] **Step 1: Smoke-test each slug**

```bash
pnpm dev &
DEV_PID=$!
sleep 8
for slug in \
  deriving-the-em-wave-equation \
  plane-waves-and-polarization \
  radiation-pressure \
  the-electromagnetic-spectrum \
  index-of-refraction \
  skin-depth-in-conductors \
  fresnel-equations \
  total-internal-reflection \
  optical-dispersion \
  geometric-optics \
  interference \
  diffraction-and-the-double-slit \
  polarization-phenomena \
  waveguides-and-fibers; do
  code=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/en/electromagnetism/$slug)
  echo "$slug → $code"
done
kill $DEV_PID 2>/dev/null
```

Expected: 14 × 200. Any non-200 → open the topic folder, check `content.en.mdx` parse + Supabase row existence.

### Task 3.3: Update spec and file log

- [ ] **Step 1: Update spec progress**

Edit `docs/superpowers/specs/2026-04-22-electromagnetism-branch-design.md`:
- Header status line: change to include `§08 + §09 shipped 2026-04-23`.
- Module status table rows for §08 and §09: done counts → 4 and 10; Status → ☑ complete.
- Total row: Done 51 / 66 / 77%.
- Per-topic checklist: tick every §08 and §09 box.

- [ ] **Step 2: Final build**

```bash
pnpm tsc --noEmit && pnpm vitest run && pnpm build
```
Expected: all green.

- [ ] **Step 3: Commit spec + plan**

```bash
git add docs/superpowers/specs/2026-04-22-electromagnetism-branch-design.md docs/superpowers/plans/2026-04-23-electromagnetism-session-5-em-waves-optics.md
git commit -m "$(cat <<'EOF'
docs(em/§08-§09): mark em-waves + optics modules complete — 51/66 (77%)

Session 5 shipped 14 topics — §08 EM Waves in Vacuum (FIG.38–41) and §09
Waves in Matter & Optics (FIG.42–51). Branch progress 37/66 (56%) → 51/66
(77%). Only §10 Radiation + §11 EM & Relativity + §12 Foundations remain
(15 topics across 3 modules).

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

- [ ] **Step 4: File MemPalace implementation log**

Use `mcp__plugin_mempalace_mempalace__mempalace_add_drawer` with wing=physics, room=decisions, titled `implementation_log_em_session_5_em_waves_optics.md`. Include:

- Opening: "Session 5 — ships §08 EM Waves in Vacuum + §09 Waves in Matter & Optics — 14 topics, FIG.38–51. Branch progress 37/66 → 51/66 (77%). Only §10 + §11 + §12 remain (15 topics)."
- Wave-by-wave summary: what each wave did, commit SHAs (list after commit), any deviations from plan.
- Answers to the session-5 diagnostic questions from the prompt:
  1. Did the RayTraceCanvas tracer hold up across refraction/TIR/Fresnel/thin-lens/Huygens-summation? (expected: yes, with caveats if any type extension was needed)
  2. What's left for §09.10 waveguides that the primitive didn't cover? (expected: full modal analysis deferred to §10 radiation or further work)
  3. Did the Wave 0 backfill change `tex` fields in Supabase? (record how many of 25 topics actually changed vs unchanged)
  4. Did the §09.3 fresnel-equations placeholder promotion land cleanly?
  5. Any new forward-refs pointing at §10/§11/§12?
- Any commit-interleaving artefacts (Session 4 precedent: CircuitCanvas landed inside a concurrent `feat(ask)` commit).
- Session 6 recommendation: §10 Radiation (6 topics, FIG.52–57). Reuses §08 plane-wave infrastructure for antenna/dipole radiation; Larmor formula + radiation-reaction-is-unsolved-problem candour.

---

## Self-review

**Spec coverage:** Every topic in §08 (4) and §09 (10) maps to a numbered Wave 2 task. All 14 share the same 6-step template. ✓

**Placeholder scan:** No TBDs. Every code block is complete. Every commit message is a HEREDOC. ✓

**Type consistency:** RayTraceCanvas types defined in Wave 1.5 are the same types imported by §09 Wave 2 agents. `Vec2`/`Vec3` boundaries respected. Handoff block shape consistent across all 14 agents. ✓

**Parallel-safety:** All 14 Wave 2 agents forbidden from touching the same shared files (simulation-registry, visualization-registry, publish, commit). Registry merges serialised in Wave 2.5. Types-extension escape hatch in place. ✓

**Forward-ref discipline:** Wave 3 aggregates `forwardRefs` from all 14 handoffs and adds placeholders for unresolved ones; placeholder shape mirrors Session 4 precedent exactly. ✓

---

## Execution handoff

**Plan complete and saved to** `docs/superpowers/plans/2026-04-23-electromagnetism-session-5-em-waves-optics.md`.

Proceeding with **Subagent-Driven execution (token-saving variant)** per the prompt's explicit instruction: "execute via /superpowers:subagent-driven-development, token-saving variant — no per-task review, parallel waves, per wing=physics feedback_execution_style."
