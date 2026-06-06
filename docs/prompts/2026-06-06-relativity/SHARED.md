# SHARED instructions — Relativity completion sprint (2026-06-06)

Every session MUST read this file completely before writing any code. It is the
contract that lets 6 parallel sessions land without conflicts.

## 0. Workspace setup (do this first)

```bash
cd /Users/roman/Developer/physics
git worktree add ../physics-wt-<SESSION-ID> -b feat/relativity-<SESSION-ID> main
cd ../physics-wt-<SESSION-ID>
cp /Users/roman/Developer/physics/.env.local .
pnpm install
```

`<SESSION-ID>` is given in your session file (e.g. `s1-schwarzschild`).
Work ONLY inside your worktree. Never touch `main`, never push, never merge —
the integration session does that.

## 1. Pattern study (mandatory, before writing)

Read these files in your worktree:

1. `components/physics/_shared/README.md` — THE canonical scene rules
   (theme tokens, `useSceneSize`, `applyDpr`, no hardcoded colors/widths,
   no borders/backgrounds inside `SceneCard`). Follow it to the letter.
2. `app/[locale]/(topics)/relativity/einsteins-field-equations/content.en.mdx`
   — gold-standard topic MDX (structure, voice, aside, sections, equations).
3. `app/[locale]/(topics)/relativity/einsteins-field-equations/page.tsx`
   and `opengraph-image.tsx` — per-topic boilerplate (only the SLUG changes).
4. `components/physics/einsteins-field-equations/efe-split-screen-scene.tsx`
   — reference interactive scene (controls + canvas).
5. `components/physics/maxwell-and-the-speed-of-light/foucault-rotating-mirror-scene.tsx`
   — reference animated scene.
6. `lib/physics/relativity/efe.ts` and `lib/physics/relativity/lorentz.ts`
   — pure physics helper style (typed, documented, no React).
7. `docs/roadmap/04-relativity.md` — narrative source material (the module
   numbering there is outdated; trust `lib/content/branches.ts`, but mine the
   roadmap for storytelling, scene ideas, historical anchors).
8. Your topics' entries in `lib/content/branches.ts` (search
   `RELATIVITY_TOPICS`) — the `title`, `eyebrow`, `subtitle` there are the
   source of truth and MUST match your `TopicHeader` exactly.

## 2. Per-topic definition of done

For each topic slug assigned to you:

1. **`app/[locale]/(topics)/relativity/<slug>/content.en.mdx`**
   - Imports: layout components + your scene components (see EFE example).
   - `<TopicPageLayout aside={[...]}>` with 2–3 physicist links and 4–6
     dictionary term links (`{ type: "physicist"|"term", label, href }`).
   - `<TopicHeader eyebrow="…" title="…" subtitle="…" />` — copy the exact
     strings from `lib/content/branches.ts`.
   - 6 numbered `<Section index={n} title="…">` blocks, ~110–150 lines total,
     ~1200–1800 words. Section 1 is historical/narrative hook; the last section
     is "why it matters / what comes next" with cross-links to sibling topics
     (`[text](/relativity/<other-slug>)`).
   - 3–4 `<EquationBlock id="EQ.0n">$$…$$</EquationBlock>` — EVERY displayed
     formula followed by a plain-English gloss (assume the reader cannot read
     tensor notation cold).
   - 1–2 `<Callout variant="intuition">` / `variant="math"` blocks.
   - Use `<PhysicistLink slug="…" />` and `<Term slug="…" />` inline for
     first mentions (only slugs that exist in the registries or your seeds).
   - Voice: match the existing essays — historical, concrete, zero fluff,
     numbers and dates over adjectives.
2. **3 interactive scenes** in `components/physics/<slug>/<scene-name>-scene.tsx`
   - Follow `_shared/README.md` exactly. Theme tokens only. Responsive via
     `useSceneSize`. Interactive (sliders/buttons) where it teaches.
   - Pure math goes in `lib/physics/relativity/<topic>.ts` (one file per topic,
     exported functions, no React). Write vitest tests for nontrivial physics
     functions in the same dir pattern you find (`*.test.ts` colocated or under
     `tests/`).
   - Embed each scene in MDX inside
     `<SceneCard caption="FIG.<n><a|b|c> — …">` with a long, didactic caption
     (see EFE captions for tone/length).
3. **`page.tsx`** — copy from EFE, change only `const SLUG`.
4. **`opengraph-image.tsx`** — copy from EFE, change only the slug string.
5. **Registry + references**
   - Flip your topics in `lib/content/branches.ts` from
     `status: "coming-soon"` to `status: "live"`. Touch NOTHING else there.
   - Append new dictionary terms to `lib/content/glossary.ts` and new
     physicists to `lib/content/physicists.ts` — ONLY the ones your session
     OWNS (ownership table in your session file). Append at the END of the
     array under a banner comment `// ─── §NN <module> (sprint 2026-06-06)`.
     Physicist entries: `relatedTopics` must reference topics that exist in
     `branches.ts` (all 61 relativity topics qualify, any status). Physicists
     have NO `image:` field for now (portraits come later).
   - Create `content/seeds/<SESSION-ID>.json` with full text for every new
     dictionary term and physicist you own — shape documented at the top of
     `scripts/content/publish-seeds.ts`. Definitions: 2–3 paragraphs, precise,
     self-contained. Physicist bios: 3–4 paragraphs. This file is what makes
     `/dictionary/<term>` and `/physicists/<slug>` pages real — treat it as
     first-class content, same writing standard as the essays.
   - You MAY reference (aside links, `<Term>`, `relatedPhysicists`) terms and
     physicists owned by OTHER sessions — they'll exist after integration.
     You MUST NOT create entries you don't own.
6. **Publish + verify**
   - `DOTENV_CONFIG_PATH=.env.local pnpm content:publish --only relativity/<slug>`
     (this upserts the topic row the page reads; without it the page 404s).
   - `npx tsc --noEmit` — must pass.
   - `pnpm test` — must pass (your new physics tests + the registry tests).
   - `pnpm dev` → open `http://localhost:3000/en/relativity/<slug>` — page
     renders, all 3 scenes draw and respond, equations render, no console
     errors. Check both themes (`data-theme` toggle in the nav).
7. **Commit** — one commit per topic:
   `feat(relativity/<slug>): <title> — essay + 3 scenes + refs`.
   Do NOT push. Do NOT merge.

## 3. Shared-file discipline (conflict avoidance)

You may edit ONLY these shared files, append-only, under your banner comment:
`lib/content/glossary.ts`, `lib/content/physicists.ts`.
In `lib/content/branches.ts` you change only the `status:` value on your own
topics' lines. Never reformat, never reorder, never touch other modules'
sections. Everything else you create is in directories named by your slugs, so
collisions are impossible.

## 4. When you finish all topics

Run the full gate one last time (`tsc`, `pnpm test`), then print a summary:
topics done, scenes created, glossary terms + physicists added, seed file path,
branch name. Leave the worktree in place — the integration session merges it.
