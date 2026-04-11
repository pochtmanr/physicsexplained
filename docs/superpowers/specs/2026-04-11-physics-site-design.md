# Physics Site — Design Spec

**Date:** 2026-04-11
**Status:** Approved, ready for implementation planning
**Author:** Roman Pochtman (with Claude Code)
**Scope:** v0 — two topic pages + landing page

---

## 1. Vision

An open-source, visual-first physics explainer site. The long-term vision is "from ground to PhD-level physics, explained through beautiful modern interactive diagrams." The short-term vision is: **build two pages so good they prove the approach is worth scaling.**

The website is aimed at **curious adults** — no calculus assumed, math shown but always explained in plain language first. Tone: Kurzgesagt meets Stripe docs. The design language is a **futuristic dark / sci-fi terminal** aesthetic: near-black background, cyan + magenta accents, monospace for all numbers and captions, subtle cyan grid overlay, precise and restrained.

The goal of v0 is *not* breadth. It's quality density. Two pages polished to publication quality establish the bar; every future topic inherits from them.

### Existing landscape (why this is needed)

- **PhET Interactive Simulations** — gold standard for K-12 simulations, but dated UI, feels like educational software, no PhD-level depth.
- **3Blue1Brown / Manim** — gold standard for mathematical intuition, but YouTube-only, not a website.
- **Physclips, Penn State phys_anim** — deep content, Flash-era UX.
- **Feynman Lectures online** — text + static figures, no interactivity.
- **Distill.pub** — spiritually closest (gorgeous interactive articles), but ML-focused and now archived.

Nobody has combined Wikipedia-level breadth + presentation-quality interactive visuals + a cohesive modern design system in the physics space. This project aims to occupy that empty slot, starting with two flagship topics.

### Non-goals

- Not a reference site (Wikipedia does that better).
- Not a classroom tool (PhET does that better).
- Not a video replacement (3b1b does that better).
- Not a comprehensive textbook. Two pages at a time, polished to death.

---

## 2. v0 Scope

### Pages
- `/` — minimal landing page listing the two topics
- `/harmonic-motion` — Page 1: Simple Harmonic Motion / The Pendulum
- `/kepler` — Page 2: Kepler's Laws of Planetary Motion

### In scope
- 2D graphics only
- Scripted animations + auto-playing scenes
- KaTeX equations inline and in equation blocks
- JSXGraph math diagrams
- Accurate physics (analytic solutions where possible, odex ODE solver where not)
- Desktop polish (mobile polish deferred to v0.5)
- Dark mode only
- Unit tests for all physics math

### Out of scope for v0 (explicit non-goals)
- No interactive playgrounds with draggable elements (deferred to v1)
- No 3D / Three.js
- No user accounts, no CMS, no backend
- No search, no topic index beyond a single landing page
- No i18n, no light mode, no mobile-first
- No analytics beyond Vercel defaults

---

## 3. Architecture

### Folder structure

```
physics/
├─ app/
│  ├─ layout.tsx                  — root layout, fonts, theme
│  ├─ page.tsx                    — landing (lists topics)
│  ├─ (topics)/
│  │  ├─ harmonic-motion/
│  │  │  └─ page.mdx              — page 1 content
│  │  └─ kepler/
│  │     └─ page.mdx              — page 2 content
│  ├─ sandbox/
│  │  └─ page.tsx                 — dev-only primitive showcase
│  └─ globals.css                 — tailwind v4 tokens
├─ components/
│  ├─ ui/                         — shadcn primitives (button, card)
│  ├─ physics/
│  │  ├─ pendulum-scene.tsx
│  │  ├─ phase-portrait.tsx
│  │  ├─ orbit-scene.tsx
│  │  ├─ sweep-areas.tsx
│  │  └─ ellipse-construction.tsx
│  ├─ math/
│  │  └─ equation-block.tsx       — <EquationBlock> labeled cyan-bordered block
│  └─ layout/
│     ├─ scene-card.tsx           — chrome wrapper for any animation
│     ├─ hud.tsx                  — mono corner readout
│     ├─ figure-label.tsx         — "FIG.01 — label"
│     ├─ callout.tsx              — intuition / math / warning variants
│     ├─ topic-header.tsx         — page hero
│     ├─ section.tsx
│     └─ nav.tsx
├─ lib/
│  └─ physics/
│     ├─ pendulum.ts              — small + large angle pendulum
│     ├─ kepler.ts                — Kepler's equation solver, orbit, swept area
│     └─ ode.ts                   — typed odex wrapper
├─ public/
├─ mdx-components.tsx             — MDX → our components mapping
├─ tailwind.config.ts             — tailwind v4 with custom tokens
├─ next.config.mjs                — mdx plugin, rehype-katex, remark-math
├─ vitest.config.ts
└─ package.json
```

### Architectural rule: math is separated from pixels

- `lib/physics/*` contains pure TypeScript functions. No React, no DOM, no canvas. Fully unit-tested.
- `components/physics/*` contains visual components that import from `lib/physics/*` and render the result. No physics math is performed here.
- `app/(topics)/*` contains only MDX prose and component references. No logic.

### MDX authoring model

Pages are `.mdx` files. Prose is markdown; interactive figures are React components tagged inline.

```mdx
# The Pendulum

Every clock that ever ticked, every swing that ever swung...

<PendulumScene amplitude={0.3} length={1.2} />

The restoring force is proportional to displacement:

<EquationBlock id="EQ.01">F = -kx</EquationBlock>
```

Inline equations inside prose (e.g. `$\omega = 2\pi/T$`) render via `rehype-katex` with no custom component. Only display-mode labeled equations use `<EquationBlock>`.

`mdx-components.tsx` maps markdown primitives (`h1`, `p`, `ul`, etc.) to our typography components, and makes physics/math/layout components available globally without imports in the MDX files.

### Stack (final)

| Layer | Library | Notes |
|---|---|---|
| Framework | Next.js 15 App Router + TypeScript strict | |
| Authoring | MDX via `@next/mdx` + `remark-math` + `rehype-katex` | |
| Styling | Tailwind v4 + shadcn/ui | Dark theme only for v0 |
| Animation | Motion — the `motion` package from motion.dev (Framer Motion successor, not legacy framer-motion) | MCP-integrated |
| Math diagrams | JSXGraph | Dynamic import, SSR-safe wrapper |
| Equations | KaTeX | Via rehype-katex |
| Canvas text | `@chenglou/pretext` | Installed but **not used in v0 figures** (all text overlays are DOM-rendered via `<HUD>`). Reserved for v1 when we need in-canvas label layout. |
| ODE solver | `odex` | Loaded only on pages that need it |
| Numerics | `math.js` | Tree-shaken utilities only |
| Tests | vitest | Physics math only |
| Hosting | Vercel | |

---

## 4. Design System

The "futuristic dark / sci-fi terminal" aesthetic, concretized. Every page inherits from these tokens.

### Color palette

```
Background
  bg-0     #05070A   — page background (near-black, slight blue)
  bg-1     #0B0F16   — card / scene background
  bg-2     #121826   — elevated surface / hover

Foreground
  fg-0     #E6EDF7   — primary text (slightly cool white)
  fg-1     #9FB0C8   — secondary / caption
  fg-2     #5B6B86   — muted / axis labels / grid
  fg-3     #2A3448   — dividers

Accents
  cyan     #5BE9FF   — primary accent: equations, links, key highlights
  magenta  #FF4FD8   — secondary accent: energy, warnings, contrast curves
  amber    #F5C451   — tertiary: "classical intuition" callouts

Semantic
  grid     rgba(91,233,255,0.08)   — background grid overlay
  glow     rgba(91,233,255,0.35)   — text-shadow / box-shadow glow base
```

No greens, no reds. Cyan + magenta is the whole personality. Amber is the rescue color for "hey look at this."

### Typography

```
Display    PP Neue Montreal OR Inter Display   — headings
Body       Inter                                — paragraphs (18px / 1.65)
Mono       JetBrains Mono OR Berkeley Mono      — math, code, captions, numbers
```

Self-hosted via `next/font`. Body at **18px / 1.65 line-height** on desktop. Mono is used generously — every numeric label, axis tick, and figure caption is mono — to reinforce the terminal vibe.

### Spacing & layout

```
Content column width   max 720px for prose
Wide figure            max 960px (breaks the column)
Full-bleed figure      100vw (rare, hero moments only)
Section spacing        96px between sections (desktop)
Paragraph spacing      24px
```

Single column. No sidebar. A floating mono table-of-contents strip on the right shows the current section, slides as the reader scrolls.

### Signature primitives

1. **Background grid** — 80px × 80px cyan grid at 8% opacity with a radial fade mask. Present on every page. Project signature.
2. **Equation blocks** — mono label on left (`EQ.01`), equation centered, thin cyan border on the left edge.
3. **Scene containers** — `bg-1` background, 1px `fg-3` border, mono caption above (`FIG.01 — the pendulum`), mono HUD inside the bottom-right corner.
4. **Callouts** — three variants: `<Intuition>` (amber), `<Math>` (cyan), `<Warning>` (magenta).
5. **Links** — cyan, no underline, glow on hover.
6. **Headings** — display font, tight tracking. Section numbers in mono (`§ 01`).
7. **Scroll feel** — smooth native, no scrolljacking. Animations trigger via Motion `whileInView`.

### Motion tokens

```
duration.fast    = 0.18s
duration.base    = 0.32s
duration.slow    = 0.6s
easing.standard  = [0.22, 1, 0.36, 1]           — easeOutQuart
easing.spring    = { stiffness: 180, damping: 22 }
```

### Explicit non-design-choices

- No gradient backgrounds
- No blur / frosted glass
- No rounded-full pills (6–8px rounding only)
- No emoji
- No 3D / perspective transforms
- No dark mode toggle (dark only)

---

## 5. Page 1 — Simple Harmonic Motion / The Pendulum

**Route:** `/harmonic-motion`
**Goal:** The reader finishes understanding what "restoring force" and "period" mean, and *why* a heavier bob doesn't swing slower. Kurzgesagt-clarity, no calculus required.

### Page structure

```
HERO
  § 01 · CLASSICAL MECHANICS
  THE PENDULUM
  subtitle: "Why every clock that ever ticked ticked the same way."

§ 1  The question          — hook (no math)
§ 2  The restoring force   — FIG.01 + EQ.01
§ 3  The rhythm            — FIG.02 period animation + EQ.02
§ 4  The surprise          — FIG.03 mass independence (MONEY SHOT)
§ 5  The shape of motion   — FIG.04 phase portrait (JSXGraph)
§ 6  Where it breaks       — FIG.05 small-angle vs large-angle
§ 7  Why it matters        — closing
```

### Content targets

- Body prose: ~900–1100 words (~5 min reading time)
- Equations: 4 — `F = -kx`, `T = 2π√(L/g)`, `ω = 2π/T`, `θ'' = -(g/L)·sin θ`
- Figures: 5
- No code snippets shown to the reader

### Figure specifications

#### FIG.01 — Pendulum swing
- Renderer: Canvas 2D (raw, no Konva)
- Math source: `lib/physics/pendulum.ts` — small-angle analytic solution `θ(t) = θ₀·cos(ωt)`, `ω = √(g/L)`
- Visual: white rod (1.5px), cyan bob (r=10px, subtle glow), cyan motion trail fading over 1.2s, faint dots at swing extremes
- HUD: `θ = 0.27 rad · T = 2.01 s` (mono, bottom-right)
- Playback: auto-plays on `whileInView`, pauses off-screen. No user controls in v0.

#### FIG.02 — Period timing
- Reuses `<PendulumScene>` with `showTimer` prop
- HUD adds a live elapsed-time readout
- Every zero-crossing flashes a cyan tick on a timeline bar below the scene
- After 3 ticks: `3T = 6.03 s`

#### FIG.03 — Three pendulums (MONEY SHOT)
- Three `<PendulumScene>` instances in a row
- Same length, different masses (1 kg, 3 kg, 10 kg labels), different starting amplitudes (10°, 25°, 40°)
- All three cross θ=0 simultaneously because period depends only on L/g
- Shared HUD below: `T = 2.00 s`
- **Emotional beat:** the visible synchronization despite different masses and amplitudes.
- Polish rule: a tiny initial phase offset decays to zero over the first 0.5s to draw the eye to the synchronization event.

#### FIG.04 — Phase portrait
- Renderer: JSXGraph
- Left half: small inset pendulum (reusing the scene component)
- Right half: (x, v) phase space, cyan ellipse being traced in real time, current point as a pulsing cyan dot
- Axes labels: `x (rad)`, `v (rad/s)` in mono

#### FIG.05 — Small vs large angle
- Two `<PendulumScene>` instances side by side
- Left: θ₀ = 10°, analytic small-angle solution
- Right: θ₀ = 80°, full nonlinear ODE solved with **odex**
- HUDs: `T = 2.01 s` vs `T = 2.34 s`
- Magenta highlight on the large-angle HUD — this is the "where it breaks" moment

---

## 6. Page 2 — Kepler's Laws of Planetary Motion

**Route:** `/kepler`
**Goal:** The reader leaves understanding *why* planets move in ellipses, *why* they sweep equal areas in equal times, and *why* `T² ∝ a³`. All three laws, one continuous story.

### Page structure

```
HERO
  § 02 · CLASSICAL MECHANICS
  THE LAWS OF PLANETS
  subtitle: "How a German astronomer broke the sky open with three sentences."

§ 1  Before Kepler         — hook: the mess of circles and epicycles
§ 2  First law: ellipses   — FIG.01 ellipse construction
§ 3  Second law: equal areas — FIG.02 sweep areas (THE MONEY SHOT)
§ 4  Third law: the ratio  — FIG.03 harmony table
§ 5  What Newton saw       — FIG.04 inverse-square in action
§ 6  Why it matters        — closing
```

### Content targets

- Body prose: ~1100–1300 words (~6 min reading time)
- Equations: 3 — ellipse polar form `r(θ) = a(1-e²)/(1 + e·cos θ)`, Kepler's 3rd `T² = (4π²/GM)·a³`, Newton's inverse-square
- Figures: 4

### Figure specifications

#### FIG.01 — The ellipse (JSXGraph)
- Two fixed cyan foci labeled `F₁` (sun) and `F₂`
- An animating point `P` traces the ellipse
- Two cyan segments from P to each focus
- Live mono readout: `|PF₁| = 0.67 · |PF₂| = 0.33 · sum = 1.00`

#### FIG.02 — Sweep areas (MONEY SHOT)
- Renderer: Canvas 2D for fine-grained control of filled wedges
- Math source: `lib/physics/kepler.ts` — solves Kepler's equation (`M = E − e·sin E`) via Newton-Raphson, computes true anomaly, returns `r(t)`, `θ(t)`. This is the real way to animate a Keplerian orbit, not a fake parametric cheat.
- Visual: cyan ellipse, bright cyan sun with glow at left focus, white planet dot with cyan trail
- Every `T/6`, freeze the current wedge and fill it permanently with magenta at ~30% opacity
- After one full orbit: six visibly-different-looking wedges, mono readout below proving all six areas equal to 3 decimals (`A₁ = A₂ = … = 0.524 AU²`)
- 2-second pause, reset, loop
- **Polish rule:** this is the page's emotional apex. It gets more polish time than any other single figure in v0.

#### FIG.03 — The harmony (table + JSXGraph log-log)
- Static mono table:
  ```
  PLANET      a (AU)    T (yr)    T²/a³
  Mercury     0.387     0.241     1.002
  Earth       1.000     1.000     1.000
  Mars        1.524     1.881     1.001
  Jupiter     5.203     11.862    0.999
  ```
- `T²/a³` column highlighted in cyan
- Below: JSXGraph log-log scatter of the four points on the line `T = a^(3/2)`
- Not animated. Static is the right choice — the shock is in the numbers.

#### FIG.04 — Inverse-square in action
- Single orbit, planet driven by the Kepler solver
- Cyan vector from planet to sun, length ∝ 1/r²
- Mono HUD: `r = 0.82 AU · F = 1.49 (rel.)`
- Magenta vector highlight near perihelion

---

## 7. Shared Components (extracted from Pages 1 & 2)

These are the primitives that ship with v0 and become the foundation for every future topic.

| Component | Purpose |
|---|---|
| `<SceneCard>` | Chrome wrapper for any animation (bg, border, caption, HUD slot) |
| `<HUD>` | Mono corner readout primitive |
| `<FigureLabel>` | `FIG.01 — label` mono header |
| `<EquationBlock>` | KaTeX equation with `EQ.01` left label and cyan left border |
| `<Callout>` | `intuition` / `math` / `warning` variants |
| `<TopicHeader>` | Hero block for topic pages |
| `<Section>` | Standard content section with numbered header |
| `<PendulumScene>` | Canvas 2D pendulum (reusable across FIG.01–FIG.05) |
| `<OrbitScene>` | Canvas 2D Keplerian orbit |
| `<PhasePortrait>` | JSXGraph phase-space plot |

---

## 8. Build Order

**Phase 0 — Skeleton.** `create-next-app`, dependencies, MDX wiring, fonts, Tailwind tokens, shadcn/ui install. Gate: `pnpm dev` serves a blank page with correct fonts, dark bg, and cyan grid overlay.

**Phase 1 — Primitives.** Build the shared layout components (`SceneCard`, `HUD`, `FigureLabel`, `EquationBlock`, `Callout`, `TopicHeader`, `Section`). Assemble into a `/sandbox` page showing each primitive once. Gate: visually matches Section 4 mental picture.

**Phase 2 — Physics math (pure TypeScript, no React).** Implement `lib/physics/pendulum.ts`, `lib/physics/kepler.ts`, `lib/physics/ode.ts`. Write vitest unit tests:
- Pendulum small-angle period matches `2π√(L/g)` to 1e-6
- Pendulum large-angle period matches elliptic-integral formula to 1e-3
- Kepler solver converges in <10 iterations for all e ∈ {0.0, 0.2, 0.5, 0.7, 0.9}
- Total swept area over one period equals `π·a·b`

Gate: all tests pass.

**Phase 3 — Pendulum page.** `<PendulumScene>` canvas component → FIG.01 → FIG.02 → FIG.03 (money shot) → `<PhasePortrait>` → FIG.04 → FIG.05 → MDX prose. Gate: page loads, all 5 figures animate smoothly, off-screen animations pause, equations render.

**Phase 4 — Kepler page.** `<OrbitScene>` → FIG.01 (ellipse construction in JSXGraph) → FIG.02 (money shot) → FIG.03 (harmony table + log-log plot) → FIG.04 → MDX prose. Gate: same as Phase 3, plus swept areas visibly equal in the money shot and verified by the mono readout.

**Phase 5 — Landing + polish.** `/` with two topic cards, minimal nav, OG images via `@vercel/og`, favicon, in-character 404 page. Deploy to Vercel.

---

## 9. Validation & Quality Gates

### Unit tests (vitest) — `lib/physics/*` only
- Visual components are not unit-tested. The `/sandbox` page is the manual visual regression check.

### Physics correctness gates (explicit)
- Pendulum small-angle period matches analytical formula to 1e-6
- Pendulum large-angle period matches elliptic-integral formula to 1e-3
- Kepler's equation solver converges for all e ∈ [0, 0.9]
- Total swept area over one orbital period equals `π·a·b`
- `T²/a³` table values match NASA planetary fact sheet to 3 decimals

### Performance budget
- Landing page: < 150KB JS gzipped, LCP < 1.5s
- Topic page: < 400KB JS gzipped (JSXGraph + odex are heavy)
- Animations hold 60fps on a 2020 MacBook Air
- Off-screen animations stop consuming CPU (verified in DevTools profiler)

### Accessibility
- Text contrast passes WCAG AA
- All animations respect `prefers-reduced-motion` (replaced with a single static frame)

### Definition of done (v0)
1. `/` lists both topics
2. `/harmonic-motion` renders all 5 figures, all prose, all equations
3. `/kepler` renders all 4 figures, all prose, all equations
4. All physics unit tests pass
5. Deployed to a public Vercel URL
6. Lighthouse performance > 90 on both topic pages
7. Both pages work in a fresh Chrome with no extensions and respect `prefers-reduced-motion`

---

## 10. Risks & Mitigations

| Risk | Mitigation |
|---|---|
| Sci-fi dark theme fights the figures for attention | Figures sit on `bg-1`, not pure black; cyan accents reserved for focal elements only |
| JSXGraph SSR issues | Dynamic import with `ssr: false` inside a wrapper component |
| Motion library bundle cost | Import from the smallest entry point (`motion/react` micro-dom build) |
| Kepler solver edge cases at high eccentricity | Unit tested at e ∈ {0.0, 0.2, 0.5, 0.7, 0.9} |
| Odex gives wrong pendulum result | Cross-check against the elliptic-integral formula in a test |
| "Three pendulums in sync" looks too perfect and loses emotional impact | Tiny initial phase offset that decays to zero — draws the eye to the synchronization event |
| MDX + next.js strict SSR breaks on client-only components | Use `"use client"` directive on visual components; keep MDX pages server-rendered |

---

## 11. Out of Scope (explicit for v0)

- No interactive playgrounds (draggable pendulum, adjustable eccentricity) — deferred to v1
- No 3D / Three.js / React-Three-Fiber
- No mobile-first polish (desktop-first; mobile comes in v0.5)
- No light mode
- No user accounts, CMS, backend, or search
- No i18n
- No SEO beyond meta tags + OG images
- No analytics beyond Vercel defaults

---

## 12. Resolved Decisions

1. **Project name.** Working name `physics`. Final name deferred — does not block implementation.
2. **Display + body font.** Inter Display + Inter (free, self-hosted via `next/font`).
3. **Monospace font.** JetBrains Mono (free, self-hosted via `next/font`).
4. **Package manager.** pnpm.
5. **Hosting.** Vercel.
