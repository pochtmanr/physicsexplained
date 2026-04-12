# Physics Site v0.5 — Hub UI, Nav, Footer, Branches IA

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Restructure the v0 site as a 6-branch hub with a real cinematic landing page: hero section featuring a live orbital animation, branches grid, a featured-topic spotlight, and a wider page layout. Migrate the 2 existing topic pages under `/classical-mechanics`. Add a branch menu + breadcrumbs to the Nav. Add a global Footer attributed to Simnetiq Ltd with real links to simnetiq.store and x.com/simnetiq. Simplify the background (remove the cyan grid) so animations carry the visual weight. Coming-soon branch pages include an email capture form.

**Architecture:** Introduce a single source of truth for site content — `lib/content/branches.ts` — that defines all 6 branches and their topics. All nav menus, breadcrumbs, branch pages, and the hub grid derive from this file. URL structure becomes `/<branch-slug>` (branch page) and `/<branch-slug>/<topic-slug>` (topic page). Old v0 routes redirect. Page-width rules: hub + branch pages use `max-w-7xl` (1280px) for wide cinematic layouts; topic pages keep the `max-w-[720px]` prose column for long-form reading.

**Tech Stack:** Unchanged from v0 — Next.js 15 App Router, MDX, Tailwind v4, Motion, no new dependencies. Possibly add a server action for the email capture endpoint (no new packages needed).

**Predecessor spec:** `docs/superpowers/specs/2026-04-11-physics-site-design.md`
**Predecessor plan:** `docs/superpowers/plans/2026-04-11-physics-site-v0.md`

**User decisions already locked (2026-04-12):**
1. ✅ **Background:** Simplify — remove or dramatically minimize the grid. Let the animations be the visual signature.
2. ✅ **Page width:** Wider layout. Hub + branch pages go to `max-w-7xl`. Topic pages stay at `max-w-[720px]` prose column.
3. ✅ **Hero:** Landing page gets a cinematic hero section with a reused animation (OrbitScene from Kepler — "laws of planets"). Plus additional sections with graphics below.
4. ✅ **Branch routing:** Dynamic `app/[branch]/page.tsx` with `generateStaticParams`. One file, not six.
5. ✅ **Coming-soon pages:** Clickable (navigate to branch page) with email capture form ("Enter your email to stay updated").
6. ✅ **Footer links:** Real URLs — `https://www.simnetiq.store/` (Simnetiq site) and `https://x.com/simnetiq` (Twitter/X).
7. ✅ **Version label:** `v0.5` in Nav and Footer.

---

## v0.5 Scope

### In scope
- **Content manifest** (`lib/content/branches.ts`) — source of truth for branches + topics
- **Layout constants** (`lib/layout.ts`) — centralized width tokens so "wide page" vs "prose page" is one import
- **Remove grid background** — simpler solid `bg-0` with optional soft radial glow accent
- **Hub landing page `/`** — cinematic layout with 4 sections:
  1. **Hero** with live `<OrbitScene>` animation on the right, big display text + CTAs on the left
  2. **Branches grid** — 6 cards (1 live, 5 coming-soon) in a `max-w-7xl` responsive grid
  3. **Featured topic spotlight** — embedded `<PendulumScene>` with excerpt and "Read →" CTA
  4. **Philosophy / how-we-teach** section — 3 icon+text columns
- **Dynamic branch route** `app/[branch]/page.tsx` with `generateStaticParams()` returning all 6 branch slugs
- **Coming-soon branch pages** — render branch hero + email capture form component
- **Route migration:**
  - Move `app/(topics)/harmonic-motion/` → `app/(topics)/classical-mechanics/pendulum/`
  - Move `app/(topics)/kepler/` → `app/(topics)/classical-mechanics/kepler/`
  - 308 permanent redirects in `next.config.mjs` from old routes to new routes
- **Nav upgrade:** branch menu dropdown + breadcrumbs + `v0.5` version label
- **Footer** component attributed to Simnetiq Ltd with real external links
- **Email capture** component + stub server action (writes to console/log in v0.5; real mailing list provider in a later phase)
- **Wider container:** hub page + branch pages use `max-w-7xl px-6` (1280px); topic pages keep `max-w-[720px]` for reading

### Out of scope (deferred to v0.7+)
- Subfield layer (Branch → Subfield → Topic)
- Topic index within a branch with search
- Any new topic pages beyond the 2 we already have
- Full mobile polish (we'll make things *not broken* on mobile, not *polished*)
- Light mode
- i18n
- Comments / social features
- User accounts
- A real mailing list backend — v0.5 logs emails to a server-side file or console; wiring to ConvertKit / Buttondown / Resend is a later, trivial swap

---

## File Structure

**New files:**
```
lib/
├─ content/
│  ├─ branches.ts                — branch + topic manifest (source of truth)
│  └─ types.ts                   — Branch, Topic, BranchSlug types
└─ layout.ts                     — width tokens: WIDE_CONTAINER, PROSE_CONTAINER

components/layout/
├─ footer.tsx                    — Simnetiq-attributed footer with real external links
├─ nav-branch-menu.tsx           — branch dropdown for Nav (client component)
├─ nav-breadcrumbs.tsx           — breadcrumbs next to wordmark
├─ branch-card.tsx               — hub grid card
├─ branch-hero.tsx               — branch-page hero block
├─ topic-card.tsx                — topic grid card
└─ coming-soon-card.tsx          — (if the two "coming soon" variants share code)

components/sections/              — NEW DIRECTORY: landing page sections
├─ hero-section.tsx              — hero with OrbitScene + title + CTAs
├─ branches-section.tsx          — the 6-card branches grid
├─ featured-topic-section.tsx    — spotlight with embedded PendulumScene
└─ philosophy-section.tsx        — 3-column "how we teach" block

components/forms/
└─ email-signup.tsx              — email capture form for coming-soon pages

app/
├─ page.tsx                      — replaced: composed of hero + branches + featured + philosophy
├─ not-found.tsx                 — unchanged
├─ actions/
│  └─ email-signup.ts            — server action, handles form POST, logs to server
├─ [branch]/
│  └─ page.tsx                   — NEW dynamic route, generates all 6 branch URLs
└─ (topics)/
   └─ classical-mechanics/
      ├─ pendulum/
      │  └─ page.mdx             — moved from /harmonic-motion
      └─ kepler/
         └─ page.mdx             — moved from /kepler
```

Note: `[branch]` lives at the app root (NOT inside `(topics)`) so the dynamic segment matches top-level paths like `/electromagnetism`. The `(topics)/classical-mechanics/pendulum` path resolves via the `(topics)` route group — `(topics)` is a group wrapper with no URL segment, so the URL is still `/classical-mechanics/pendulum`. `[branch]/page.tsx` is the FALLBACK that renders branches that don't have a group-wrapper directory (i.e., the 5 coming-soon branches). The implementer must verify that Classical Mechanics's own page (wrapped in `(topics)`) takes priority over the dynamic fallback.

**Modified files:**
- `app/layout.tsx` — add `<Footer />` mount, add flex-col min-h-screen wrapper, remove `<GridBackground />` mount
- `components/layout/nav.tsx` — add branch menu + breadcrumbs + v0.5 label
- `components/layout/grid-background.tsx` — simplified or deleted entirely (see Task 5)
- `next.config.mjs` — 308 redirects from `/harmonic-motion` and `/kepler`

**Deleted files (possibly):**
- `components/layout/grid-background.tsx` — if Task 5 removes it entirely rather than simplifying it. Decision in Task 5.

---

## Content Manifest Design

This is the most important architectural decision. All UI derives from `lib/content/branches.ts`. Example shape:

```typescript
// lib/content/types.ts (illustrative, not final code)

export type BranchSlug =
  | "classical-mechanics"
  | "electromagnetism"
  | "thermodynamics"
  | "relativity"
  | "quantum"
  | "modern-physics";

export interface Topic {
  slug: string;                 // "pendulum"
  title: string;                // "The Pendulum"
  eyebrow: string;              // "FIG.01 · OSCILLATIONS"
  subtitle: string;             // "Why every clock..."
  readingMinutes: number;       // 5
  status: "live" | "draft" | "coming-soon";
}

export interface Branch {
  slug: BranchSlug;
  index: number;                // 1..6 for "§ 01" display
  title: string;                // "CLASSICAL MECHANICS"
  eyebrow: string;              // "§ 01"
  subtitle: string;             // "The physics of cannonballs, planets, and pendulums."
  description: string;          // longer paragraph for the branch-page hero
  topics: Topic[];              // may be empty
  status: "live" | "coming-soon";
}
```

The manifest file itself exports a `BRANCHES: readonly Branch[]` array and helper functions:

```typescript
// lib/content/branches.ts (illustrative)

export const BRANCHES: readonly Branch[] = [...];

export function getBranch(slug: string): Branch | undefined;
export function getTopic(branchSlug: string, topicSlug: string): Topic | undefined;
export function getAllRoutes(): string[]; // for sitemap/SEO later
```

Every page (hub, branch, nav, footer, breadcrumbs) imports from this file. Adding a new topic later is a single edit to the manifest plus writing the MDX file at the right path.

---

## Task 1: Content manifest — types

**Files:**
- Create: `lib/content/types.ts`

- [ ] **Step 1: Create the type definitions**

`lib/content/types.ts` exports:
- `BranchSlug` union of the 6 slug literals
- `TopicStatus = "live" | "draft" | "coming-soon"`
- `BranchStatus = "live" | "coming-soon"`
- `Topic` interface with fields: `slug`, `title`, `eyebrow`, `subtitle`, `readingMinutes`, `status`
- `Branch` interface with fields: `slug` (typed as `BranchSlug`), `index`, `title`, `eyebrow`, `subtitle`, `description`, `topics: readonly Topic[]`, `status`

No runtime code, types only. Exported names are stable — every downstream file will import from here.

- [ ] **Step 2: tsc check**

Run `pnpm exec tsc --noEmit` — must be clean.

---

## Task 2: Content manifest — data

**Files:**
- Create: `lib/content/branches.ts`

- [ ] **Step 1: Write the BRANCHES constant**

Define all 6 branches in index order. For each, fill in exact values:

1. **classical-mechanics** · § 01 · "CLASSICAL MECHANICS" · status `live` · topics: `[pendulum, kepler]`
2. **electromagnetism** · § 02 · "ELECTROMAGNETISM" · status `coming-soon` · empty topics
3. **thermodynamics** · § 03 · "THERMODYNAMICS" · status `coming-soon` · empty
4. **relativity** · § 04 · "RELATIVITY" · status `coming-soon` · empty
5. **quantum** · § 05 · "QUANTUM MECHANICS" · status `coming-soon` · empty
6. **modern-physics** · § 06 · "MODERN PHYSICS" · status `coming-soon` · empty

The 2 live topics:
- `pendulum` · "THE PENDULUM" · eyebrow "FIG.01 · OSCILLATIONS" · subtitle "Why every clock that ever ticked ticked the same way." · readingMinutes 5 · status `live`
- `kepler` · "THE LAWS OF PLANETS" · eyebrow "FIG.02 · ORBITAL MECHANICS" · subtitle "How a German astronomer broke the sky open with three sentences." · readingMinutes 6 · status `live`

Branch subtitles (one-liners for the hub card):
- Classical Mechanics — "The physics of cannonballs, planets, and pendulums."
- Electromagnetism — "Light, charge, and the field that holds the world together."
- Thermodynamics — "Heat, entropy, and why time moves forward."
- Relativity — "The weirdness that hides at the edges of speed."
- Quantum Mechanics — "The rules the universe actually runs on."
- Modern Physics — "From the nucleus to the Standard Model and beyond."

Branch descriptions (longer paragraph for the branch-page hero) are drafted in Task 8.

- [ ] **Step 2: Write helper functions**

- `getBranch(slug: string): Branch | undefined` — linear find
- `getTopic(branchSlug: string, topicSlug: string): Topic | undefined`
- `getLiveBranches(): readonly Branch[]`
- `getAllRoutes(): string[]` — returns `[ "/", "/classical-mechanics", "/classical-mechanics/pendulum", ...]`

- [ ] **Step 3: tsc check**

`pnpm exec tsc --noEmit` must be clean.

---

## Task 3: Migrate topic routes

**Files:**
- Move: `app/(topics)/harmonic-motion/page.mdx` → `app/(topics)/classical-mechanics/pendulum/page.mdx`
- Move: `app/(topics)/kepler/page.mdx` → `app/(topics)/classical-mechanics/kepler/page.mdx`
- Modify: `next.config.mjs` to add 308 redirects

- [ ] **Step 1: Create the new directory structure**

Create `app/(topics)/classical-mechanics/pendulum/` and `app/(topics)/classical-mechanics/kepler/`.

- [ ] **Step 2: Move the MDX files**

`git mv` preserves history. If `git mv` complains about missing git tracking (because of our skip-commits operating mode in v0), use plain `mv`.

Move `page.mdx` into each new directory with the same filename.

- [ ] **Step 3: Add redirects to `next.config.mjs`**

Add a top-level `async redirects()` function returning:
```
[
  { source: "/harmonic-motion", destination: "/classical-mechanics/pendulum", permanent: true },
  { source: "/kepler", destination: "/classical-mechanics/kepler", permanent: true },
]
```

- [ ] **Step 4: Remove the old directories**

`rmdir app/(topics)/harmonic-motion` and `rmdir app/(topics)/kepler`. They should be empty after the moves.

- [ ] **Step 5: Verify routes**

Run `pnpm dev` in background, curl the new routes and confirm 200:
- `/classical-mechanics/pendulum`
- `/classical-mechanics/kepler`

Curl the old routes and confirm 308 (with location header):
- `/harmonic-motion` → `/classical-mechanics/pendulum`
- `/kepler` → `/classical-mechanics/kepler`

Kill the dev server.

---

## Task 4: Footer component

**Files:**
- Create: `components/layout/footer.tsx`
- Modify: `app/layout.tsx`

### Task 4a: Footer component

- [ ] **Step 1: Write Footer**

Pure server component. Container uses `WIDE_CONTAINER` from `lib/layout.ts` (to be created in Task 0 below). Renders:

- Top divider: 1px `border-t border-[var(--color-fg-3)]/40`
- 3-column grid on `lg+`, stacked on `< lg`:
  - **Left column:** "PHYSICS · V0.5" mono label in cyan → one-line mission sentence: "Visual-first physics explainers." in `fg-1`
  - **Middle column:** heading "BRANCHES" mono xs uppercase `fg-2` → derived from `BRANCHES` manifest, mapped to links (mono text, `fg-1`, hover cyan glow)
  - **Right column:** heading "BUILT BY" mono xs uppercase `fg-2` → two real external links:
    - **`Simnetiq Ltd`** → `https://www.simnetiq.store/` (target=_blank, rel="noopener noreferrer")
    - **`@simnetiq on X`** → `https://x.com/simnetiq` (target=_blank, rel="noopener noreferrer")
    - Below the links: small mono "MIT · OPEN SOURCE" label
- Bottom bar (beneath the grid, inside a second `border-t`):
  - Left: mono xs `© 2026 Simnetiq Ltd` in `fg-2`
  - Right: mono xs `All animations accurate · No tracking · Made with care` in `fg-2`

Use the `<footer>` semantic element. Use existing design tokens exclusively.

### Task 4b: Mount in `app/layout.tsx`

- [ ] **Step 1: Add wrapping flex column**

Modify `app/layout.tsx` so the root body structure becomes:

```
<body className="font-sans antialiased">
  <div className="relative z-10 flex min-h-screen flex-col">
    <Nav />
    <div className="flex-1">{children}</div>
    <Footer />
  </div>
</body>
```

This keeps the footer pinned to the bottom on short pages without sticky positioning hacks. Keep the existing font variables on `<html>`. Remove the `GridBackground` import + mount if Task 5 decides to delete it.

### Task 4c: Visual verification

- [ ] **Step 1: Confirm footer renders on all pages**

`pnpm dev`. Curl each of these and grep the response for "SIMNETIQ":
```
curl -s http://localhost:3001/ | grep -c "SIMNETIQ"
curl -s http://localhost:3001/classical-mechanics/pendulum | grep -c "SIMNETIQ"
```
Both must return ≥1. Kill dev.

---

## Task 0: Layout constants

**Files:**
- Create: `lib/layout.ts`

This is a prerequisite for Tasks 4, 7, 8. Do it FIRST (before Task 4) even though it's numbered 0.

- [ ] **Step 1: Write the constants**

`lib/layout.ts` exports:

```
export const WIDE_CONTAINER = "mx-auto w-full max-w-7xl px-6 md:px-8";
export const PROSE_CONTAINER = "mx-auto w-full max-w-[720px] px-6";
```

These strings are used as `className` values throughout the site. When the user later wants to change "wide" from 1280 to 1440 or whatever, it's a single edit here.

- [ ] **Step 2: tsc check**

`pnpm exec tsc --noEmit` must be clean.

---

## Task 5: Simplify background — remove the grid

**Files:**
- Delete: `components/layout/grid-background.tsx`
- Modify: `app/layout.tsx` (remove the `<GridBackground />` mount)

User decision: simpler is better. The animated physics scenes (pendulum, orbit, sweep-areas) should be the visual signature of the site, not a background grid that competes for attention. Solid `bg-0` is the new ground state.

- [ ] **Step 1: Delete `components/layout/grid-background.tsx`**

Remove the file entirely. It's no longer imported anywhere.

- [ ] **Step 2: Remove `GridBackground` from `app/layout.tsx`**

Delete the import line and the `<GridBackground />` JSX. The body becomes cleaner:

```
<body className="font-sans antialiased">
  <div className="relative z-10 flex min-h-screen flex-col">
    <Nav />
    <div className="flex-1">{children}</div>
    <Footer />
  </div>
</body>
```

The `relative z-10` wrapper is no longer strictly necessary (nothing sits below it anymore), but leaving it as a defensive layering primitive is fine. The implementer may simplify it to just a plain `<div className="flex min-h-screen flex-col">` if they prefer.

- [ ] **Step 3: Optional subtle hero glow**

Task 7's hero section will add its OWN local background effect — a soft radial cyan glow behind the OrbitScene. That lives in the hero component, not the root layout. Do not add a global background effect in Task 5.

- [ ] **Step 4: Visual verification**

`pnpm dev`. Visit `/` and confirm the background is solid near-black with no grid. Kill dev.

---

## Task 6: Nav upgrade — branch menu + breadcrumbs

**Files:**
- Create: `components/layout/nav-branch-menu.tsx`
- Create: `components/layout/nav-breadcrumbs.tsx`
- Modify: `components/layout/nav.tsx`

### Task 6a: NavBranchMenu (client component)

- [ ] **Step 1: Create the component**

Client component (`"use client"`). Renders a button labeled "BRANCHES" in mono, that when clicked opens a dropdown listing all 6 branches from the manifest. Each item:
- Mono eyebrow (§ 01–06) in cyan
- Branch title in `fg-0`
- Short subtitle in `fg-2`
- Click → navigate (via next/link) to `/<branch-slug>/`
- Coming-soon branches have `text-[var(--color-fg-2)]` and a small "COMING SOON" pill instead of being disabled entirely

Click-outside or Escape closes the dropdown. Use `useState` + a ref + a `keydown` listener. No animation library — use CSS transition on `opacity` and `translateY` with the motion tokens from `globals.css`.

- [ ] **Step 2: Accessibility**

- Dropdown button is a `<button>` with `aria-expanded` and `aria-haspopup="menu"`
- Dropdown panel uses `role="menu"`
- Items use `role="menuitem"`
- Arrow keys navigate between items
- Focus returns to the trigger button on close

### Task 6b: Breadcrumbs (server component)

- [ ] **Step 1: Create the component**

Server component. Takes a `path: string` prop (the current pathname, e.g. `/classical-mechanics/pendulum`) and renders breadcrumbs derived from the manifest:

- `/` → (nothing, just the wordmark)
- `/<branch>` → `physics / CLASSICAL MECHANICS`
- `/<branch>/<topic>` → `physics / CLASSICAL MECHANICS / THE PENDULUM`

The separator is `·` in mono. Each segment is a link except the last. Colors: previous segments `fg-2`, final segment `fg-0`. Entire breadcrumb is mono xs uppercase with `tracking-wider`.

On the hub (`/`), render nothing (just the wordmark is enough).

- [ ] **Step 2: Read pathname**

Since this is a server component, use Next.js 15's `headers()` + read the pathname from the `x-pathname` header if middleware sets it. Simpler: accept `path` as a prop and call it from a tiny client wrapper that reads `usePathname()` and passes it down. Choose whichever pattern the implementer finds cleaner.

### Task 6c: Assemble Nav

- [ ] **Step 1: Modify `components/layout/nav.tsx`**

Keep the sticky top styling from v0 (semi-opaque bg + backdrop-blur + bottom border). New layout:

- Left: wordmark "physics" + breadcrumbs inline (breadcrumbs appear if not on `/`)
- Center: empty
- Right: `<NavBranchMenu />` + v0.5 version label

The wordmark is a `<Link href="/">`.

- [ ] **Step 2: Visual verification**

`pnpm dev`. Visit `/`, `/classical-mechanics`, `/classical-mechanics/pendulum` and confirm:
- Breadcrumbs appear correctly (nothing on hub, one level on branch, two levels on topic)
- Branches menu opens + lists all 6
- Clicking a live branch navigates; a coming-soon branch also navigates but the target page shows the coming-soon state
- Keyboard navigation works (Tab, Arrow, Escape)

---

## Task 7: Hub landing page — cinematic

**Files:**
- Create: `components/layout/branch-card.tsx`
- Create: `components/sections/hero-section.tsx`
- Create: `components/sections/branches-section.tsx`
- Create: `components/sections/featured-topic-section.tsx`
- Create: `components/sections/philosophy-section.tsx`
- Modify: `app/page.tsx`

User decision: the landing page goes from "hero + cards" in v0 to a real multi-section cinematic page. Four sections on the hub, composed in `app/page.tsx`, each section self-contained with its own internal max-width wrapper.

The landing is now the *showcase* for the design system — the page someone screenshots and tweets. It has to be impressive.

### Task 7a: BranchCard component

- [ ] **Step 1: Create `components/layout/branch-card.tsx`**

Pure RSC. Props: `{ branch: Branch; className?: string }`. Renders a `<Link>` when `branch.status === "live"`, or still a `<Link>` (but differently styled) when `coming-soon` — per user decision, coming-soon branches ARE clickable, they just lead to a branch page with the email capture form. So BranchCard is always a link.

Card visual:
- 1px `border-[var(--color-fg-3)]` border, `bg-[var(--color-bg-1)]`, 6-8px rounding
- `p-8 md:p-10`
- Mono eyebrow `§ 0N` in cyan (from `branch.eyebrow`)
- Display title (`text-2xl md:text-3xl font-semibold uppercase tracking-tight`) in `fg-0`
- Subtitle in `fg-1`
- Bottom-right pill:
  - If live: `2 TOPICS` in cyan mono xs inside a thin cyan-bordered box
  - If coming-soon: `COMING SOON` in magenta mono xs inside a thin magenta-bordered box
- Hover state: border color transitions to cyan (or magenta for coming-soon), title color transitions to cyan (or magenta), subtle `translate-y-[-2px]` lift with a 180ms ease. Use the motion tokens already in `globals.css`.

### Task 7b: HeroSection — THE signature section

- [ ] **Step 1: Create `components/sections/hero-section.tsx`**

Pure RSC. Client children (OrbitScene) are fine inside an RSC wrapper. The section uses `WIDE_CONTAINER` and is roughly 90vh tall with `min-h-[640px]`.

Layout (desktop, 2-column split):
- **Left column (60% width on lg+):**
  - Mono eyebrow "PHYSICS · V0.5 · CLASSICAL MECHANICS LIVE" in cyan, small
  - Big display title: "Physics, explained visually." — `text-5xl md:text-7xl lg:text-8xl font-bold tracking-tight leading-[1.05]`
  - Subtitle paragraph: "From pendulums to planets — real physics, real simulations, no videos." in `fg-1`, `text-lg md:text-xl`, max-width ~48ch
  - Two CTA buttons:
    - Primary: cyan-bordered button "→ Start with classical mechanics" linking to `/classical-mechanics`
    - Secondary: text link "Or browse all six branches ↓" (anchor to `#branches` section below) in `fg-2` mono hover cyan

- **Right column (40% width on lg+, hidden on md, positioned below on sm):**
  - `<OrbitScene a={1} e={0.35} T={14} width={560} height={520} />` — reused from Kepler page, tuned for hero scale
  - Wrapped in a scene container WITHOUT a SceneCard chrome (no caption, no border) — the orbit animation is the art, not a figure
  - A soft radial cyan glow behind the orbit: a `div` with `bg-[radial-gradient(circle_at_center,_rgba(91,233,255,0.15),_transparent_70%)]` sized ~800×800px, positioned behind the orbit via `absolute inset-0 -z-10`
  - The OrbitScene uses `prefers-reduced-motion` (already wired in the existing `useAnimationFrame` hook behavior) — on reduced-motion browsers it freezes at a representative frame

Mobile (sm):
- Stack vertically — title + subtitle + CTAs first, then the orbit below at reduced size (`width=320 height=280`)
- Or hide the orbit entirely on very small screens to preserve performance — implementer's judgment

Key constraint: **this section is the performance-critical moment for LCP**. The OrbitScene is a client component with dynamic imports, so it lazy-loads. LCP should be the large display text, which is a pure RSC render and hits ~400ms. Verify in Task 9's Lighthouse check.

### Task 7c: BranchesSection

- [ ] **Step 1: Create `components/sections/branches-section.tsx`**

Pure RSC. Uses `WIDE_CONTAINER`. Renders:

- Top spacer: `mt-32 md:mt-48`
- Small mono eyebrow "§ BRANCHES" in cyan with `id="branches"` (for the hero's scroll anchor)
- Section title: `text-4xl md:text-5xl font-bold uppercase tracking-tight`: "Six branches of physics."
- Short lead paragraph in `fg-1` max-w-prose: "Start with what exists. The rest is on the way."
- Grid: `grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-12`
- Iterate `BRANCHES` from the manifest, render `<BranchCard branch={b} />` for each

### Task 7d: FeaturedTopicSection

- [ ] **Step 1: Create `components/sections/featured-topic-section.tsx`**

Pure RSC. Uses `WIDE_CONTAINER`. Shows the Pendulum topic as the spotlight (hardcoded slug — this is fine for v0.5, later promote to a manifest field).

Layout: 2-column grid `lg:grid-cols-[1.1fr_1fr] gap-12 items-center`. On mobile, stacked.

- **Left column:**
  - Mono eyebrow "§ FEATURED"
  - Title: `text-3xl md:text-4xl font-semibold uppercase tracking-tight`: "Start here: The Pendulum."
  - 2-paragraph excerpt (copy the intro from the pendulum MDX file)
  - Stat row: mono xs "5 MIN READ · 5 LIVE FIGURES · CLASSICAL MECHANICS"
  - CTA button: "→ Read the pendulum" linking to `/classical-mechanics/pendulum`

- **Right column:**
  - Embedded `<PendulumScene theta0={0.35} length={1.2} width={420} height={360} />`
  - Wrapped in a minimal frame (thin `fg-3` border, `bg-1` inside, no caption)

### Task 7e: PhilosophySection

- [ ] **Step 1: Create `components/sections/philosophy-section.tsx`**

Pure RSC. Uses `WIDE_CONTAINER`. Explains the project's approach in 3 short columns.

- Mono eyebrow "§ HOW WE TEACH"
- Title: "Three rules for every topic."
- 3-column grid on md+, stacked on sm:

**Column 1 — "ACCURATE"**
- Mono eyebrow "01 · ACCURACY"
- Heading "Real math, not cartoons."
- Paragraph: "Every animation is driven by a unit-tested physics solver — odex for ODEs, Newton-Raphson for Kepler's equation, analytic solutions where they exist. If a number appears on screen, it's correct to at least three decimals."

**Column 2 — "INTUITIVE"**
- Mono eyebrow "02 · INTUITION"
- Heading "Feel it before you prove it."
- Paragraph: "We show you the idea first, with moving pictures, and the math second. No formulas without a picture. No picture without the math underneath."

**Column 3 — "OPEN"**
- Mono eyebrow "03 · OPEN"
- Heading "Free and open source."
- Paragraph: "Every line of code, every equation, every solver — open source. Fork it, embed it, improve it. Society gets smarter when physics gets easier."

Each column: thin `fg-3` left border, padding, heading in `fg-0`, paragraph in `fg-1`.

### Task 7f: Compose the landing page

- [ ] **Step 1: Rewrite `app/page.tsx`**

Pure RSC. Imports the four sections and composes them vertically:

```
import { HeroSection } from "@/components/sections/hero-section";
import { BranchesSection } from "@/components/sections/branches-section";
import { FeaturedTopicSection } from "@/components/sections/featured-topic-section";
import { PhilosophySection } from "@/components/sections/philosophy-section";

export default function HomePage() {
  return (
    <main className="pb-32">
      <HeroSection />
      <BranchesSection />
      <FeaturedTopicSection />
      <PhilosophySection />
    </main>
  );
}
```

Each section handles its own container + padding + spacing via `WIDE_CONTAINER` and `mt-*` utilities. `app/page.tsx` is tiny — just composition.

- [ ] **Step 2: Generate metadata**

```
export const metadata = {
  title: "Physics, explained visually",
  description: "Visual-first physics explainers with live, accurate simulations. Classical mechanics first — quantum, relativity, and more on the way.",
  openGraph: {
    title: "Physics, explained visually",
    description: "Visual-first physics explainers with live, accurate simulations.",
  },
};
```

- [ ] **Step 3: Visual verification**

`pnpm dev`. Visit `http://localhost:3001/`:
- Hero: OrbitScene is animating in the right column, text left
- Scroll down → BranchesSection with 6 cards (1 live, 5 coming-soon)
- Scroll down → FeaturedTopicSection with a small pendulum
- Scroll down → PhilosophySection 3-column
- Footer at the bottom

Expected: you can visually confirm the site feels dramatically richer than v0's simple two-card layout. Eyeball at desktop width and mobile width (narrow the browser to ~375px) to catch obvious stacking issues.

- [ ] **Step 4: Curl sanity check**

```
curl -s http://localhost:3001/ | grep -c "§"  # count section markers
curl -s http://localhost:3001/ | grep -c "SIMNETIQ"
```

Expected: 4+ section markers, ≥1 SIMNETIQ.

---

## Task 8: Branch pages — dynamic route + email capture

**Files:**
- Create: `components/layout/branch-hero.tsx`
- Create: `components/layout/topic-card.tsx`
- Create: `components/forms/email-signup.tsx`
- Create: `app/actions/email-signup.ts`
- Create: `app/[branch]/page.tsx` — dynamic route for all 6 branches
- Create: `app/(topics)/classical-mechanics/page.tsx` — live branch page (takes priority over dynamic route)

User decision: dynamic `[branch]/page.tsx`. One file, `generateStaticParams` returning all 6 slugs. Coming-soon branches get an email capture form.

### Task 8a: BranchHero component

- [ ] **Step 1: Create `components/layout/branch-hero.tsx`**

Pure RSC. Props: `{ branch: Branch }`. Uses `WIDE_CONTAINER`.

Renders:
- Big mono eyebrow `§ 0N · CLASSICAL MECHANICS` in cyan (from `branch.eyebrow + branch.title`)
- Big display title — but since the eyebrow already contains the title, use a secondary headline here: `branch.subtitle` as the big title (the one-liner is the visual headline)
- Longer `branch.description` paragraph in `fg-1`, max-width prose
- If the branch is live: stat line `N TOPICS · ~M MIN TOTAL READING` in mono xs uppercase `fg-2`
- If coming-soon: stat line `STATUS · IN DEVELOPMENT` in magenta mono xs

### Task 8b: TopicCard component

- [ ] **Step 1: Create `components/layout/topic-card.tsx`**

Pure RSC. Props: `{ branchSlug: string; topic: Topic }`. Similar shape to BranchCard but for topics within a branch.

- Always a `<Link>` to `/{branchSlug}/{topic.slug}`
- Mono eyebrow: `topic.eyebrow` (e.g., "FIG.01 · OSCILLATIONS")
- Title: `topic.title` (large, display)
- Subtitle: `topic.subtitle`
- Bottom stat row: `READING TIME · ~{N} MIN` in mono xs
- Hover: cyan border + cyan title + slight translate-y lift
- `topic.status === "coming-soon"` not expected in v0.5 (we only have 2 live topics, no coming-soon topics inside a branch yet). If it happens anyway, show the same magenta "COMING SOON" pill as BranchCard.

### Task 8c: Email capture — server action

- [ ] **Step 1: Create `app/actions/email-signup.ts`**

Server action (file-level `"use server"`). Exports a single function:

```
"use server";

export interface SignupResult {
  ok: boolean;
  message: string;
}

export async function signupForBranchUpdates(
  branchSlug: string,
  email: string,
): Promise<SignupResult> {
  // Validate email (very basic regex)
  // If invalid: return { ok: false, message: "Please enter a valid email." }
  // Otherwise: log it server-side
  //   console.log(`[email-signup] ${new Date().toISOString()} branch=${branchSlug} email=${email}`);
  // And return { ok: true, message: "Thanks — we'll email you when this branch goes live." }
}
```

The server action just logs. In a later phase it'll POST to a real mailing list provider — that's a 5-line swap to fetch() against a Resend / Buttondown / ConvertKit endpoint. For v0.5, console logs are honest and don't lie to users.

### Task 8d: Email capture — form component

- [ ] **Step 1: Create `components/forms/email-signup.tsx`**

Client component (`"use client"`). Uses React's `useActionState` hook (Next.js 15 App Router) to handle the server action.

Props: `{ branchSlug: string; className?: string }`.

Renders:
- Label "GET NOTIFIED" in mono xs uppercase cyan
- Explainer text: "Enter your email and we'll ping you once {branchTitle} is live. No spam, no tracking, unsubscribe in one click." in `fg-1` text-sm
- Form with a single email input + submit button:
  - Input: `type="email"`, `name="email"`, required, placeholder "your@email.com", styled with `bg-bg-1 border-fg-3 px-4 py-3 font-mono text-sm`, cyan focus ring
  - Button: `type="submit"`, cyan-bordered "→ Notify me" in mono uppercase
  - Loading state uses `useFormStatus` — button disabled and text changes to "Sending…" during submission
- Result display: show `result.message` in either cyan (success) or magenta (error) below the form

Keep the form narrow (max-w-md) and left-aligned.

### Task 8e: Dynamic branch route

- [ ] **Step 1: Create `app/[branch]/page.tsx`**

The dynamic branch route. Pure RSC. Imports:
- `getBranch`, `BRANCHES` from `@/lib/content/branches`
- `BranchHero`, `TopicCard` from `@/components/layout/*`
- `EmailSignup` from `@/components/forms/email-signup`
- `notFound` from `next/navigation`

```
import { notFound } from "next/navigation";

export async function generateStaticParams() {
  return BRANCHES.map((b) => ({ branch: b.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ branch: string }> }) {
  const { branch: slug } = await params;
  const branch = getBranch(slug);
  if (!branch) return {};
  return {
    title: `${branch.title} — physics`,
    description: branch.subtitle,
  };
}

export default async function BranchPage({ params }: { params: Promise<{ branch: string }> }) {
  const { branch: slug } = await params;
  const branch = getBranch(slug);
  if (!branch) notFound();
  // ... render hero + topics grid OR email signup
}
```

Render structure:
- `<BranchHero branch={branch} />`
- If `branch.status === "live"`:
  - Below the hero, render a topic grid:
    ```
    <div className="mt-16 grid grid-cols-1 md:grid-cols-2 gap-6">
      {branch.topics.map((t) => <TopicCard key={t.slug} branchSlug={branch.slug} topic={t} />)}
    </div>
    ```
- If `branch.status === "coming-soon"`:
  - Below the hero, render the email capture form:
    ```
    <div className="mt-16 max-w-xl">
      <EmailSignup branchSlug={branch.slug} />
    </div>
    ```

Use `WIDE_CONTAINER` as the outer wrapper.

### Task 8f: Classical Mechanics override (higher priority than dynamic route)

Next.js App Router routes statically-defined segments BEFORE dynamic segments. So `app/(topics)/classical-mechanics/page.tsx` will take priority over `app/[branch]/page.tsx` when the URL is `/classical-mechanics`. This is intentional — classical mechanics has its own group-wrapped directory for its topic pages, and we want one page file to render the branch itself.

- [ ] **Step 1: Create `app/(topics)/classical-mechanics/page.tsx`**

Pure RSC. This file is IDENTICAL to what the dynamic route would render for the live case. Extract the rendering logic into a shared helper if it grows — for v0.5, copy-pasting a 20-line function is fine.

```
import { getBranch } from "@/lib/content/branches";
import { BranchHero } from "@/components/layout/branch-hero";
import { TopicCard } from "@/components/layout/topic-card";
import { WIDE_CONTAINER } from "@/lib/layout";

export const metadata = {
  title: "Classical Mechanics — physics",
  description: "The physics of cannonballs, planets, and pendulums.",
};

export default function ClassicalMechanicsPage() {
  const branch = getBranch("classical-mechanics")!;
  return (
    <main className={`${WIDE_CONTAINER} py-16`}>
      <BranchHero branch={branch} />
      <div className="mt-16 grid grid-cols-1 md:grid-cols-2 gap-6">
        {branch.topics.map((t) => (
          <TopicCard key={t.slug} branchSlug={branch.slug} topic={t} />
        ))}
      </div>
    </main>
  );
}
```

### Task 8g: Verify all 6 branch routes + priority

- [ ] **Step 1: Check route priority**

`pnpm dev`. Curl each route and confirm:

```
/classical-mechanics          → 200, contains TopicCards for pendulum and kepler
/classical-mechanics/pendulum → 200, full topic page (MDX)
/classical-mechanics/kepler   → 200, full topic page (MDX)
/electromagnetism             → 200, contains EmailSignup form
/thermodynamics               → 200, contains EmailSignup form
/relativity                   → 200, contains EmailSignup form
/quantum                      → 200, contains EmailSignup form
/modern-physics               → 200, contains EmailSignup form
/harmonic-motion              → 308 redirect to /classical-mechanics/pendulum
/kepler                       → 308 redirect to /classical-mechanics/kepler
/nonexistent-branch           → 404
```

Kill dev.

- [ ] **Step 2: Quickly submit the form**

Use curl or the browser to POST the form on `/electromagnetism`, verify the server logs the email in the dev console. Make sure the form doesn't break hard on duplicate submit or invalid email — the validation message should render inline.

---

## Task 9: Full build verification

**Files:** none

- [ ] **Step 1: Run the full gate suite**

```bash
cd /Users/romanpochtman/Developer/physics
pnpm exec tsc --noEmit
pnpm test
pnpm build
```

All three must exit cleanly. Expected test count: still 27 (no new tests — all v0.5 work is UI, no new physics math).

- [ ] **Step 2: Check bundle sizes against budgets**

After `pnpm build`, verify:
- `/` (hub) First Load JS < 150 kB
- `/<branch>/<topic>` pages < 400 kB
- Newly-added pages (branch pages) should be in the 100–130 kB range since they're static RSCs with no client interactivity beyond the Nav dropdown

If the NavBranchMenu pushes the shared chunk over budget because it's a client component, consider lazy-loading its branch list or moving it behind a Suspense boundary. Report + user decides.

- [ ] **Step 3: Smoke-test production**

```bash
pnpm start &
STARTPID=$!
sleep 4
for route in / \
             /classical-mechanics \
             /classical-mechanics/pendulum \
             /classical-mechanics/kepler \
             /electromagnetism \
             /thermodynamics \
             /relativity \
             /quantum \
             /modern-physics \
             /harmonic-motion \
             /kepler \
             /nonexistent; do
  echo -n "$route: "
  curl -s -o /dev/null -w "%{http_code} %{size_download}B\n" http://localhost:3001$route
done
kill $STARTPID 2>/dev/null
```

Expected:
- `/`, all 6 branch pages, both topic pages: 200
- `/harmonic-motion`, `/kepler`: 308 (permanent redirect)
- `/nonexistent`: 404

- [ ] **Step 4: Accessibility spot-check**

Using browser devtools on `/classical-mechanics/pendulum`:
- Tab through the nav — dropdown opens on Enter, arrow-navigates items
- Escape closes the dropdown and restores focus
- Breadcrumb links are keyboard-navigable
- All interactive elements have visible focus rings (cyan is a good default; add `focus-visible:ring-2 focus-visible:ring-[var(--color-cyan)]` to any card/link that's missing one)

---

## Self-Review Notes

**Spec coverage:**
- Hub + 6 branches + content manifest + Footer + upgraded Nav: all covered by Tasks 1–8
- Route migration with redirects: Task 3
- Build + performance budgets: Task 9
- Grid refinement: Task 5

**Placeholder scan:** No "TBD" / "TODO" / "implement later" remain. Two explicit user-decision gates:
- Task 5 Step 1: user picks grid option A or B (default A)
- Task 8e Step 1: implementer picks static pages vs dynamic route (prefer dynamic)

**Type consistency:**
- `Branch`, `Topic`, `BranchSlug` all defined in Task 1, used in Tasks 2, 4, 6, 7, 8 without drift
- `getBranch`, `getTopic`, `getLiveBranches`, `getAllRoutes` all defined in Task 2, called consistently everywhere

**Risks:**
- Dynamic branch route may collide with `(topics)` route group if directory naming is wrong. Implementer should test by creating `app/[branch]/page.tsx` AFTER the classical-mechanics migration and verify classical-mechanics's own `page.tsx` still wins.
- The NavBranchMenu is the first client component in the layout layer — make sure it doesn't drag the shared JS chunk past the 150 kB landing budget. If it does, the fix is usually a Suspense boundary around the menu.
- Breadcrumbs on topic pages need to render correctly even though the MDX files don't export the topic title explicitly. Derive the title from the manifest via the URL pathname — do NOT require MDX frontmatter.
- Redirects from the old routes must be tested — a broken redirect becomes a silent 404 that's easy to miss.

---

## Execution Handoff

Plan saved to `docs/superpowers/plans/2026-04-11-physics-site-v0.5-nav-branches.md`.

The next session should start with:

1. Read this plan
2. Read the predecessor spec + plan for context on the design system and existing code
3. Read `lib/content/*` (empty on start), `components/layout/nav.tsx`, `app/page.tsx`, `app/layout.tsx` to understand what's there
4. Execute Tasks 1–9 in order

Approach: same pattern as v0 — batched implementer per phase, sanity check via `tsc` + `test` + `curl`, no per-task commits unless explicitly asked, optional reviewer subagents at user's discretion.

Target: 1 session, roughly similar token budget to v0's Phases 3 + 4 combined (the visual work is comparable in scope).

## Open Questions — RESOLVED

All 5 open questions from the original v0.5 plan are now locked (2026-04-12):

1. ✅ **Background:** Simplified — cyan grid REMOVED. Solid `bg-0` background. Local hero glow only. (Task 5)
2. ✅ **Branch routing:** Dynamic `app/[branch]/page.tsx` with `generateStaticParams()`. (Task 8e)
3. ✅ **Coming-soon pages:** Clickable. Branch pages render an `EmailSignup` form for coming-soon branches. (Task 8d)
4. ✅ **Footer URLs:** Real URLs — `https://www.simnetiq.store/` and `https://x.com/simnetiq`. (Task 4a)
5. ✅ **Version label:** `v0.5` in Nav and Footer. (Tasks 4a, 6c)

Additional decisions locked in this session:
6. ✅ **Layout width:** Hub + branch pages use `max-w-7xl` (1280px). Topic pages stay `max-w-[720px]` for reading. Centralized in `lib/layout.ts`. (Task 0)
7. ✅ **Hero animation:** Reuse `<OrbitScene>` from Kepler page, tuned to 560×520 with soft radial cyan glow behind. (Task 7b)
8. ✅ **Landing sections:** Four sections — Hero, Branches, Featured Topic (Pendulum), Philosophy. (Task 7f)

## Remaining open questions (low-priority, can defer)

These can be decided during execution or after a first pass:

1. **OrbitScene parameters for the hero** — `a={1} e={0.35} T={14}` is a decent starting guess. The implementer should tune e and T for visual appeal; a higher e makes the orbit more dramatic, a longer T makes the animation calmer.
2. **FeaturedTopicSection topic choice** — hardcoded to Pendulum in v0.5. Could rotate with Kepler later via a date-based hash or random pick, but YAGNI for v0.5.
3. **PhilosophySection copy** — drafted in this plan but can be tightened by whoever writes the final copy.
