# Post-Migration Content Audit — Agent Prompt

Paste this into a fresh Claude Code session to run a systematic QA pass comparing every topic's source MDX against its rendered DB-backed page, flagging missing equations, figures, animations, links, sections, and callouts.

## Context (background for the agent)

Physics.explained migrated its long-form content from per-locale MDX files to Supabase over several sessions (logs in `~/.mempalace/palace/` under wing `physics`). Topics, physicists, and glossary now render from `content_entries` via the `<ContentBlocks>` renderer at `components/content/content-blocks.tsx`. The parser is at `scripts/content/parse-mdx.ts`. The publish CLI is `pnpm content:publish`.

**Known-failing example to start with:** `/he/classical-mechanics/beyond-small-angles` is missing:
- The figure captioned `FIG.02b — 10° · זווית קטנה` (and the animation that goes with it)
- Some equations that appear in the source MDX

This tells us parts of the parsing / publishing / rendering pipeline have gaps that the pendulum golden-file test didn't catch. Your job is to find and fix them across ALL topics × locales.

---

## Prompt — paste this

You are running a post-migration content audit on physics.explained. Content was moved from per-locale MDX files to Supabase `content_entries` rows and is now rendered via `<ContentBlocks>`. I've observed that some topics are missing equations, figures, and animations that exist in the source MDX. Your job is to systematically find every gap, categorize the root cause, and propose fixes.

### Your scope

- Repo root: `/Users/romanpochtman/Developer/physics`
- Supabase project id: `cpcgkkedcfbnlfpzutrc`
- Content files: `app/[locale]/(topics)/*/*/content.{en,he}.mdx`
- Parser: `scripts/content/parse-mdx.ts`
- Publish CLI: `pnpm content:publish [--locale X] [--only slug]`
- Renderer: `components/content/content-blocks.tsx` + `components/content/content-inline.tsx`
- Block types: `lib/content/blocks.ts`
- Simulation registry: `lib/content/simulation-registry.ts` (dynamic imports, 67 components)
- Fetch helper: `lib/content/fetch.ts`
- Dev server: `pnpm dev` (defaults to port 3000; falls back to 3001/3002 if in use)

### Methodology

For every `(branch, topic, locale)` combination where both an MDX source AND a DB row exist, compare three representations and flag mismatches:

**Representation A — Source MDX** (authoritative truth):
- Count occurrences of each JSX tag:
  - `<Section index={N} title="...">` — article sections
  - `<EquationBlock id="...">$$…$$</EquationBlock>` — display equations with IDs
  - `$$…$$` top-level display math (outside EquationBlock)
  - `<SceneCard caption="...">` — figures (either with `<img>` or a simulation component child)
  - `<Callout variant="...">` — callouts
  - `<PhysicistLink slug="...">` — inline physicist links
  - `<Term slug="...">` — inline glossary links
  - `$…$` inline math (not inside `$$`)
  - `<table>` — data tables
  - Any other custom JSX tag (record names — might be new patterns the parser hasn't learned)
- Extract every unique `slug` value from PhysicistLink + Term
- Extract every `caption` value from SceneCard
- Extract every `tex` from EquationBlock and top-level `$$` blocks
- Extract the component name inside each SceneCard (e.g., `PendulumScene`)

**Representation B — DB blocks** (what publish produced):
- Query: `select blocks, meta from public.content_entries where kind='topic' and slug=$1 and locale=$2`
- Count block types in the tree (walk recursively through `section.children` + `callout.children`):
  - `section` blocks
  - `equation` blocks + collect each `id` + first 80 chars of `tex`
  - `figure` blocks of kind `image` vs kind `simulation` — collect `component` and `caption`
  - `callout` blocks + variants
  - `paragraph` blocks
  - `table` blocks
- Walk `paragraph.inlines[]` (and recursively into `em.inlines`, `strong.inlines`, `callout.children`, `list.items`):
  - Count `{kind: "physicist"}` inlines + collect slugs
  - Count `{kind: "term"}` inlines + collect slugs
  - Count `{kind: "formula"}` inlines (inline math)
- Also extract `meta.aside` array — count physicist/term link entries.

**Representation C — Rendered HTML** (what users actually see):
- Start dev server, find its port, then `curl -sSL http://localhost:<port>/<locale>/<branch>/<topic>` (follow redirects).
- Count DOM occurrences:
  - `.katex` (any KaTeX math — inline + display)
  - `.katex-display` (display math only)
  - `<img src>` matches per the image block count
  - Canvas / SVG roots corresponding to simulations (scene components render `<canvas>` or `<svg>`; grep for either plus the component's text-label fallbacks like "loading simulation" — if "loading simulation" persists in HTML, the dynamic chunk didn't arrive)
  - `href="/physicists/` count
  - `href="/dictionary/` count
  - Section headings (look for patterns like `§&nbsp;01` or the Section component's DOM structure — `<section>` tags with a numbered pill + h2)

### Parity rules (what counts as a gap)

For each topic × locale, flag a gap if ANY of these hold:

| Check | MDX has | Parsed blocks has | HTML has |
|---|---|---|---|
| Sections | N `<Section>` tags | Must have N `section` blocks | Must render N section headings |
| Display equations | M `<EquationBlock>` + top-level `$$` | Must have M `equation` blocks | Must have M `.katex-display` (approximately; may be +1/-1 if inline math got a display treatment) |
| Figures | K `<SceneCard>` tags | Must have K `figure` blocks with matching captions | Must render K scenes (not stuck in "loading simulation") |
| Callouts | C `<Callout>` tags | Must have C `callout` blocks with matching variants | Must render C callout borders |
| Physicist inlines | set of slugs from `<PhysicistLink>` | same set inside paragraph/em/strong/callout inlines | same count of `/physicists/<slug>` hrefs in HTML |
| Term inlines | set of slugs from `<Term>` | same set | same count of `/dictionary/<slug>` hrefs |
| Inline math | I occurrences of `$…$` | I `{kind:"formula"}` inlines | >= I `.katex:not(.katex-display)` |

If any row mismatches, the topic has a gap. Collect EXACT offenders:
- For a missing equation, print the source `tex` (first 80 chars) from the MDX.
- For a missing figure, print the caption + component name.
- For a missing slug, print the slug + surrounding prose sentence.

### Root-cause categorization

For each gap, determine the layer:

1. **Parser gap** — MDX has it, parsed blocks don't. Look at `scripts/content/parse-mdx.ts`:
   - `mapFlowNode` throws on unknown JSX; check if the MDX uses a tag it doesn't handle (may be in a new combinatorial position like `<table>` inside `<Callout>` inside `<Section>` — tested independently but maybe not composed).
   - `mapInlines` may drop nested JSX inside certain wrappers. Recursion into em/strong was fixed in commit 370438c; check for any other wrapper (e.g., `<del>`, `<sub>`, `<sup>`, `<a>` with nested Term, etc.).
   - Equations wrapped as `<EquationBlock>$$…$$</EquationBlock>` vs loose `$$…$$` at the section level — handle both.
   - If a section's children are wrapped in a `<div>` or `<TopicPageLayout>`, the parser already flattens those. Check for other flatten-worthy wrappers.
2. **Publish gap** — parsed blocks look correct in a one-off parse but the DB row doesn't match. Re-run `pnpm content:publish --only <slug>` — if `source_hash` matches and the run says "unchanged", the hash is the same but parser behavior changed since last publish. Force: delete the row, re-run publish.
3. **Renderer gap** — DB blocks look correct, HTML misses them. Look at `components/content/content-blocks.tsx` + `components/content/content-inline.tsx`. Common issue: a new block or inline kind added to `blocks.ts` but not cased in the renderer's switch.
4. **Dynamic-load gap** — for simulations, the HTML may show "loading simulation" persistently because the dynamic chunk 404'd. Check the Network tab / server log for 404s on scene chunks. Root cause: component renamed, registry out of sync with actual export.

### Output format

Produce three artifacts:

**1. Summary table** — Markdown table, one row per `(topic, locale)` where a gap exists. Columns: topic, locale, gap-type (parser | publish | renderer | dynamic), one-line description. Sort by number of gaps descending.

**2. Per-topic detail section** — for each row in the summary, expand with:
- The exact offending MDX snippets (with file:line refs)
- The block-tree path where the data should live
- The specific renderer or parser line to inspect
- Suggested fix (1–3 sentences)

**3. Fix recommendations** — grouped by layer:
- Parser extensions needed (JSX tag + handler snippet)
- Renderer additions (block/inline type + component snippet)
- Publish re-runs needed (slugs + `--retranslate`-equivalent force flag)
- Registry updates (missing component names)

### Start with the known-failing case

**First, validate your methodology by analyzing `/he/classical-mechanics/beyond-small-angles` end-to-end.** Expected findings (paraphrasing the user report):
- `FIG.02b — 10° · זווית קטנה` SceneCard is missing from the page
- The animation (simulation component inside that SceneCard) is not rendering
- Some equations are missing

Write your methodology against this topic first. Confirm you can detect the three issues and categorize them (likely all the same root cause — a parser or publish gap). Once your audit reliably surfaces these on this topic, scale to all 31 topics × both locales = ~62 comparisons.

### Execution plan

1. Write a single Node/tsx script `scripts/qa/audit-content.ts` (temporary — delete before final commit unless useful as permanent CI) that:
   - Reads each MDX file, runs the parser on it in-process, counts representation A + B directly (since the parser is pure, you don't need to hit the DB for B — parser output IS the authoritative "what publish would produce").
   - For C, takes a list of URLs and fetches HTML from a running dev server.
   - Compares A, B, C and emits the structured report.
2. Start dev server in background. Run the audit. Collect report. Kill dev server.
3. Look at the failures. Categorize. Propose specific code fixes.
4. Present the three artifacts (summary, per-topic detail, fix recommendations) WITHOUT making any code changes.
5. Wait for user to approve fixes before touching parser/renderer/registry.

### Boundaries

- Do NOT modify the parser, renderer, registry, or any content file during the audit phase. Audit is pure read.
- Do NOT re-run `pnpm content:publish` during the audit phase (it would mask "publish gap" bugs). Only re-run as part of a proposed fix, after user approval.
- Do NOT delete content rows without user approval.
- The dev server should run on whatever port is free. Be sure to capture its port from stdout before hitting it.
- `tests/content/references.test.ts` has a pre-existing unrelated failure (missing supabase env vars in vitest). Ignore it.

### Report back

Three sections:
1. **Methodology validation** — what you found on `/he/classical-mechanics/beyond-small-angles` and whether your audit successfully detected the reported gaps.
2. **Full audit results** — the summary table + per-topic detail across all topics × locales with gaps.
3. **Fix plan** — prioritized list of parser/renderer/registry changes, grouped by root cause, with enough code-level detail that a follow-up implementation session can execute without re-auditing.

Do NOT apply fixes in this task. Stop after the report.

---

## Priority findings to expect

Based on patterns we've seen during the migration:

- **em/strong dropping inline JSX** — fixed in commit 370438c, but similar recursion bugs likely exist in other inline wrappers.
- **Figure components with unusual caption syntax** — `caption` prop might accept expressions (like `caption={\`FIG.02b — 10° · ${someVar}\`}`) which the parser's `getAttr()` helper doesn't evaluate.
- **`<SceneCard>` children with conditional JSX** — `{showTimer && <Timer />}` inside the card might not produce a `figure` block.
- **Math inside `<Callout>`** — display equations `$$…$$` inside callouts may not recurse through mapCallout.
- **Bespoke components not registered** — beyond the 67 in simulation-registry, new scenes may have been added. Parser emits them as unknown JSX → the run fails OR silently drops them depending on where they sit.
- **Hebrew MDX structural drift** — a human translator may have reflowed prose so that a formerly-inline `<Term>` ended up wrapped in a `<p>` the parser doesn't expect.

Look for these patterns specifically while auditing.
