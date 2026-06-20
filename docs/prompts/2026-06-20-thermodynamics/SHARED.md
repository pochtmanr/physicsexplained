# SHARED instructions — Thermodynamics completion sprint (2026-06-20)

Every session MUST read this file completely before writing any code. It is the
contract that lets 9 parallel sessions land without conflicts.

Your raw material is `docs/roadmap/03-thermodynamics.md` — read your module's FIG
entries there. **But ignore that file's "Patterns to reuse" section**: it is
pre-migration (hex colors, `visualization-registry.tsx`, `useThemeColors`,
`useAnimationFrame`). The current scene system, described in §2.2 below, is
theme-token-based. The roadmap's physics, hooks, section outlines, scene ideas,
physicist bios, and glossary lists are still authoritative; only its scene
plumbing is stale.

---

## 0. Workspace setup (do this first)

```bash
cd /Users/roman/Developer/physics
git worktree add ../physics-wt-<SESSION-ID> -b feat/thermo-<SESSION-ID> main
cd ../physics-wt-<SESSION-ID>
cp /Users/roman/Developer/physics/.env.local .
pnpm install
```

`<SESSION-ID>` is given at the top of your session file (e.g. `s1-temperature`).
Work ONLY inside your worktree. Never touch `main`, never push, never merge.

---

## 1. Pattern study (mandatory, before writing)

Read these reference files, in order:

1. `components/physics/_shared/README.md` — THE canonical scene rules (theme
   tokens via `useSceneTokens`, responsive `useSceneSize`, `applyDpr`,
   `SCENE_CANVAS_CLASS`; no hardcoded colors/widths; no borders/backgrounds
   inside `SceneCard`).
2. `app/[locale]/(topics)/relativity/einsteins-field-equations/content.en.mdx` —
   gold-standard topic MDX (structure, voice, aside, 7 sections, equations,
   inline links, sibling cross-links).
3. `app/[locale]/(topics)/relativity/einsteins-field-equations/page.tsx` and
   `opengraph-image.tsx` — per-topic boilerplate (only the SLUG changes).
4. A reference theme-token scene under
   `components/physics/einsteins-field-equations/` (e.g.
   `efe-split-screen-scene.tsx`) — the live shape of a current scene.
5. `lib/content/simulation-registry.ts` — how scenes are registered (every scene
   MUST be registered here or it will not render).
6. `lib/content/glossary.ts` and `lib/content/physicists.ts` — the entry shapes
   you'll append to, and the existing slugs (grep before you create).
7. `content/seeds/relativity-9-13.json` — the seed-file shape for new glossary
   terms and physicists.
8. `docs/roadmap/03-thermodynamics.md` — your module's FIG entries (hooks,
   7-section outlines, scene ideas, physicist bios, glossary lists).
9. Your topics' rows in `lib/content/branches.ts` — the `title`, `eyebrow`,
   `subtitle` are the source of truth and MUST match your `TopicHeader` exactly.

---

## 2. Per-topic definition of done

### 2.1 `app/[locale]/(topics)/thermodynamics/<slug>/content.en.mdx`

- Imports: layout components (`TopicPageLayout`, `TopicHeader`, `Section`,
  `SceneCard`, `EquationBlock`, `Callout`) + your scene components.
- `<TopicPageLayout aside={[...]}>` with 2–3 physicist links and 4–6 dictionary
  term links, each `{ type: "physicist" | "term", label, href }`, where `href`
  is `/physicists/<slug>` or `/dictionary/<slug>`. Use only slugs that exist
  (after your own appends).
- `<TopicHeader eyebrow="…" title="…" subtitle="…" />` — copy the exact strings
  from `lib/content/branches.ts`.
- **7 numbered `<Section index={n} title="…">` blocks** (the roadmap specifies 7
  sections per topic). ~1300–1900 words total. Section 1 is the historical /
  narrative hook from the roadmap; the last section is "what's next / why it
  matters" and cross-links sibling topics with `[text](/thermodynamics/<other-slug>)`.
- 3–4 `<EquationBlock id="EQ.0n">$$…$$</EquationBlock>` — EVERY displayed formula
  is followed by a plain-English gloss sentence.
- 1–2 `<Callout variant="intuition">` / `variant="math">` blocks.
- Use `<PhysicistLink slug="…" />` and `<Term slug="…" />` inline for first
  mentions (existing slugs only).
- Voice: match the existing essays and the roadmap hooks — historical, concrete,
  dates and numbers over adjectives, zero fluff. Where the roadmap leans on a
  quotation (Clausius's "Die Entropie der Welt…", Onnes's *Door meten tot
  weten*, Schrödinger's "drinks orderliness"), give the original language once,
  then the English translation.

### 2.2 Interactive scenes (2 or 3 per topic — follow the roadmap)

The roadmap's "Scenes to build" table tells you how many scenes each topic gets
(**2 or 3 — do not pad to a flat 3, do not drop any**) and what each one shows.

- One file per scene: `components/physics/<slug>/<scene-name>-scene.tsx`.
- Follow `_shared/README.md` exactly:
  - `useSceneTokens()` for all colors — **never a hex literal**. Tokens auto-flip
    on `data-theme="light"|"dark"`.
  - `useSceneSize(containerRef, { ratio, maxHeight })` for responsive width — do
    not hardcode `width={720}`.
  - `applyDpr(canvas, width, height)` once per frame for device-pixel-ratio.
  - `className={SCENE_CANVAS_CLASS}` on the canvas — `SceneCard` already provides
    the border/background/corners; the canvas must NOT add its own
    `rounded-*` / `border-*` / `bg-*`.
  - Controls (sliders/buttons) styled with theme vars: active
    `border-[var(--color-cyan)] text-[var(--color-cyan)]`, inactive
    `border-[var(--color-fg-4)] text-[var(--color-fg-3)]`.
  - Static scenes: no animation/re-render. Animated scenes: `useAnimationFrame`
    (re-renders) or `useSceneTick` (ref-based, no re-render).
- Interactive (sliders/buttons) wherever it teaches.
- Pure math lives in `lib/physics/thermodynamics/<topic>.ts` (typed, documented,
  no React). Write vitest tests for nontrivial physics functions.
- Embed each scene in MDX inside
  `<SceneCard caption="FIG.<n><a|b|c> — …">` with a long, didactic caption.

**Shared physics helpers — build once, reuse across the branch.** Prefer putting
reusable math in these modules (create the ones your module needs; later sessions
import them):
`lib/physics/thermodynamics/{ideal-gas,carnot,maxwell-boltzmann,distributions,pv-plot,lattice,random,ising}.ts`.
Define semantic scene roles consistently branch-wide — hot reservoir, cold
reservoir, work arrows, heat arrows — **as theme tokens** (e.g. map to
`tokens.red` / `tokens.cyan` / `tokens.green` / `tokens.amber` per the available
token set), never as raw hex. If you add a new shared token, do it once and reuse.

### 2.3 `page.tsx`

Copy from the EFE topic's `page.tsx`; change only `const SLUG`.

### 2.4 `opengraph-image.tsx`

Copy from the EFE topic's `opengraph-image.tsx`; change only the slug string.

### 2.5 Registry + references

- **Register every scene** in `lib/content/simulation-registry.ts`. Append an
  entry keyed by the exported PascalCase component name, with a **literal** import
  specifier so it code-splits:
  ```ts
  <PascalName>: lazyScene(() =>
    import("@/components/physics/<slug>/<file>-scene").then((m) => ({ default: m.<PascalName> })),
  ),
  ```
  Append under a banner `// ─── Module N <name> (thermo sprint 2026-06-20)`. A
  scene that isn't registered will not render live.
- In `lib/content/branches.ts`, flip your topics from `status: "coming-soon"` to
  `status: "live"`. Touch NOTHING else in that file.
- Append new dictionary terms to `lib/content/glossary.ts` and new physicists to
  `lib/content/physicists.ts` — ONLY the ones your session OWNS (see your session
  file's ownership table). Append at the END of the array under a banner comment:
  `// ─── Module N <name> (thermo sprint 2026-06-20)`.
- **Grep before you create.** Run e.g. `grep '"<slug>"' lib/content/physicists.ts
  lib/content/glossary.ts` first. If the slug already exists, reference it — do
  NOT recreate it. Several names the roadmap marks "NEW" already exist (see §below).
- Physicist entry shape: `{ slug, born, died, nationality, image?, relatedTopics }`.
  `relatedTopics` must reference topics that exist in `branches.ts` (all 30
  thermo topics already do, any status). **Living physicists use `died: "—"`.**
  New physicists may omit `image` for now.
- Glossary entry shape: `{ slug, category, visualization?, illustration?, images?,
  relatedPhysicists?, relatedTopics? }`. `category` is one of
  `"instrument" | "concept" | "unit" | "phenomenon"`. `relatedPhysicists` /
  `relatedTopics` must resolve.
- **Do NOT edit existing physicist or glossary entries' `relatedTopics`** (e.g.
  adding thermo back-links to Einstein). That is deferred to a single
  integration-time pass — editing shared entries in parallel causes merge
  conflicts. You only APPEND new entries you own.

### 2.6 Seeds

Create `content/seeds/thermo-module-<N>.json` (use your module number; sessions 8
and 9 use `thermo-module-8a.json` / `thermo-module-8b.json`). It holds two arrays,
`glossary` and `physicists`, with the full prose for every term/physicist you own:

- Glossary definitions: 2–3 precise, self-contained paragraphs.
- Physicist bios: 3–4 paragraphs, plus `contributions` / `majorWorks` if you have
  them. Pull the biographical facts from the roadmap's aside notes.

Match the structure of `content/seeds/relativity-9-13.json`.

### 2.7 Publish + verify

```bash
DOTENV_CONFIG_PATH=.env.local pnpm content:publish --only thermodynamics/<slug>
npx tsc --noEmit            # must pass
pnpm test                  # must pass (validateContentRefs + ref tests)
pnpm dev                   # → http://localhost:3000/en/thermodynamics/<slug>
```

In the browser: the page renders, every scene draws and responds, equations
render, no console errors. Check both light and dark themes. Seeds publish with
`DOTENV_CONFIG_PATH=.env.local pnpm content:publish-seeds` (you may run this for
your own seed file to verify, but the canonical seed publish happens at integration).

### 2.8 Commit

One commit per topic:
`feat(thermodynamics/<slug>): <title> — essay + N scenes + refs`
(N = the actual scene count for that topic). Do NOT push. Do NOT merge.

---

## 3. Shared-file discipline (conflict avoidance)

You may edit ONLY these shared files, append-only, under your banner comment:
`lib/content/glossary.ts`, `lib/content/physicists.ts`,
`lib/content/simulation-registry.ts`. In `lib/content/branches.ts` you change
only the `status:` value on your own topics' lines. Never reformat, never
reorder, never touch another module's section. Everything else you create lives
in directories named by your slugs — collisions are impossible.

---

## 4. Reference reconciliation (read before creating any physicist/glossary)

The roadmap predates the finished relativity & EM branches, so several entries it
marks "NEW" **already exist**. Reference these; do NOT recreate them:

**Physicists already in `physicists.ts`:** `galileo-galilei`,
`james-prescott-joule`, `hermann-von-helmholtz`, `simeon-denis-poisson`,
`james-clerk-maxwell`, `ernst-mach`, `arthur-eddington`, `daniel-bernoulli`,
`albert-einstein`, `heike-kamerlingh-onnes`, `jacob-bekenstein`,
`stephen-hawking`.

**Glossary terms already in `glossary.ts`:** `hawking-radiation`,
`bekenstein-hawking-entropy` (use this instead of inventing `black-hole-entropy`),
`pressure`, `work`, `critical-temperature`, `curie-temperature`.

This list may be incomplete — the grep-before-create rule (§2.5) is the real
safeguard. When in doubt, grep.

---

## 5. When you finish all topics

Run the full gate one last time (`npx tsc --noEmit`, `pnpm test`). Print a
summary: topics done, scenes created, glossary terms + physicists added, seed
file path, branch name. Leave the worktree in place — the integration session
merges it.
