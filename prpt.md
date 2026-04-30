# Next session — Priority 2 UX polish round 2

## Context (what's already shipped)

Branch: `feat/priority-2-session-1` — 23 commits ahead of `main`. 2120 vitest cases green, tsc clean.

Priority 2 is end-to-end on `kinematics-newton` + `oscillations` (8 topics × 5 problems = 40 problems live in Supabase + on SSG routes). Verifier (mathjs probing), LLM diagnoser (Anthropic Sonnet 4.6 with cross-user cache), Claude-vision OCR all wired. Equation index pages live at `/<locale>/equations/<slug>`.

Tonight's fix commit `541fb58` already addressed:
- Duplicate title under the page hero (now derives a clean Title-Case name from the kebab tail of the problem id; statement renders as a leading paragraph, not as a "Section 1: The problem")
- Anonymous users no longer redirected to `/sign-in` on submit — they get instant deterministic verify; sign-in CTA only shown inline when wrong AND anonymous
- "Show me" is reversible — added "Edit" button on CORRECT/SKIPPED rows

## What this session must do

Three UX changes — all visual/design, no schema or verifier changes needed.

### 1. Bring the branches/landing design language to the problem-page surrounding chrome

Read these for reference:
- `app/[locale]/page.tsx` (landing page) — color tokens, hero treatment, BranchCard composition
- `app/[locale]/[branch]/page.tsx` (branch page) — section structure, card grid
- `components/sections/branches-section.tsx` — the canonical "card grid" pattern
- `components/layout/topic-page-layout.tsx` — wide-container usage

The problem page (`app/[locale]/(topics)/classical-mechanics/[topic]/problems/[problemId]/page.tsx`) and the topic-embedded ProblemsSection (`components/problems/problems-section.tsx`) both currently use the generic `TopicPageLayout` + `Section` + handrolled card classes. Match the visual tone of the branches/landing surfaces:
- Card border treatment, hover states, typography weights
- `font-mono uppercase tracking-wider` for eyebrow chrome (already used elsewhere)
- Color tokens — neutral-* for grays, cyan-* for accents (already present, but check the saturation matches the reference pages)

### 2. Lift `<ProblemsSection />` to the TOP of every topic page (right under the header)

Currently it renders at the bottom of each topic page (after `<ContentBlocks>`). Move it to render IMMEDIATELY after `<TopicHeader>` and BEFORE `<ContentBlocks>`. Files:
- `app/[locale]/(topics)/classical-mechanics/<topic>/page.tsx` (×8 in scope: motion-in-a-straight-line, vectors-and-projectile-motion, newtons-three-laws, friction-and-drag, the-simple-pendulum, beyond-small-angles, oscillators-everywhere, damped-and-driven-oscillations)

The component is a server component already — moving the JSX placement is safe.

### 3. Compact problem cards (slightly shorter height)

The cards in `components/problems/problems-section.tsx` currently have `p-4 mb-3` and a `line-clamp-2` statement teaser. Reduce vertical density:
- `p-3` instead of `p-4`
- Drop the `line-clamp-2` statement teaser entirely OR cap to `line-clamp-1` — the difficulty + name should be the primary signal, statement is secondary
- Use a tighter row: difficulty pill on the left, problem name in the middle, optional "→" arrow on the right
- Show 5 cards in a `grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5` pattern so all five difficulty tiers fit on one row on desktop, stacked on mobile

## Constraints

- Don't touch `lib/problems/verify.ts` or `lib/problems/diagnoser.ts` — verifier is the moat, leave it alone.
- Don't change the data model (`lib/content/problems.ts`, `lib/content/types.ts`).
- Match the existing site voice — no marketing fluff, no rounded-3xl glassmorphism, no emojis, no gradients unless the landing already uses them.
- Run `pnpm tsc --noEmit` + `pnpm vitest run` after changes; both must stay green.
- Visual smoke via `pnpm dev` + curl against `http://localhost:3000/en/classical-mechanics/the-simple-pendulum` (problems should be visible up top) and `http://localhost:3000/en/classical-mechanics/the-simple-pendulum/problems/the-simple-pendulum-easy-period-from-length` (problem page chrome matches landing tone).

## Definition of done

- ProblemsSection renders at the top of all 8 in-scope topic pages, under the header.
- The cards are visibly more compact than current (~40% less height) and use the landing/branches design language.
- Problem-detail pages match the same chrome tone (card patterns, eyebrow style, color treatments).
- Tests + tsc + dev-server smoke all pass.
- Single commit on `feat/priority-2-session-1`: `fix(problems): adopt landing/branches design tone, lift ProblemsSection to top of topic, compact cards`.

## After this session — followups still pending from earlier

- Hebrew translation pass for problem strings + equation strings (deferred — needs a small `scripts/content/translate-strings.ts` sibling that walks `messages/en/{problems,equations}/**/*.json`).
- Real-world OCR test (only mocked-vision tests exist).
- Fan out the Wave 2 + 2.5 + 3 playbook to the remaining 30 CM topics + 5 other branches.
