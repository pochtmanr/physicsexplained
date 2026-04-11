# Physics Site v0 — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a Next.js + MDX physics explainer site with two polished pages (Simple Harmonic Motion, Kepler's Laws) in a sci-fi-terminal dark aesthetic, using 2D canvas animations, JSXGraph diagrams, and accurate physics solvers.

**Architecture:** Next.js 15 App Router with MDX pages. Math lives in pure TypeScript modules in `lib/physics/*` (unit-tested with vitest). Visual components in `components/physics/*` import from `lib/physics/*` and render via Canvas 2D or JSXGraph. Shared layout primitives in `components/layout/*`. Dark theme only, Tailwind v4 tokens, Motion (motion.dev) for animations.

**Tech Stack:** Next.js 15, TypeScript strict, MDX (`@next/mdx`), Tailwind v4, shadcn/ui, Motion (`motion`), JSXGraph, KaTeX (via `rehype-katex` + `remark-math`), odex (ODE solver), math.js, vitest, pnpm, Vercel.

**Reference spec:** `docs/superpowers/specs/2026-04-11-physics-site-design.md`

---

## File Structure

**New files to create:**

```
physics/
├─ .gitignore
├─ .node-version
├─ package.json
├─ pnpm-lock.yaml
├─ tsconfig.json
├─ next.config.mjs
├─ next-env.d.ts
├─ postcss.config.mjs
├─ vitest.config.ts
├─ mdx-components.tsx
├─ README.md
│
├─ app/
│  ├─ layout.tsx
│  ├─ page.tsx                              — landing
│  ├─ globals.css                           — tailwind v4 tokens + grid overlay
│  ├─ not-found.tsx                         — 404
│  ├─ sandbox/
│  │  └─ page.tsx                           — dev-only primitive showcase
│  └─ (topics)/
│     ├─ harmonic-motion/
│     │  └─ page.mdx
│     └─ kepler/
│        └─ page.mdx
│
├─ components/
│  ├─ layout/
│  │  ├─ scene-card.tsx
│  │  ├─ hud.tsx
│  │  ├─ figure-label.tsx
│  │  ├─ callout.tsx
│  │  ├─ topic-header.tsx
│  │  ├─ section.tsx
│  │  ├─ nav.tsx
│  │  └─ grid-background.tsx
│  ├─ math/
│  │  └─ equation-block.tsx
│  └─ physics/
│     ├─ pendulum-scene.tsx
│     ├─ phase-portrait.tsx
│     ├─ orbit-scene.tsx
│     ├─ ellipse-construction.tsx
│     ├─ sweep-areas.tsx
│     ├─ harmony-table.tsx
│     └─ inverse-square-scene.tsx
│
├─ lib/
│  ├─ physics/
│  │  ├─ constants.ts                        — G, AU, YEAR, etc.
│  │  ├─ ode.ts                              — odex wrapper
│  │  ├─ pendulum.ts                         — small + large angle
│  │  └─ kepler.ts                           — solver + orbit + areas
│  ├─ animation/
│  │  └─ use-animation-frame.ts              — rAF hook, pauses when off-screen
│  └─ hooks/
│     └─ use-reduced-motion.ts
│
└─ tests/
   └─ physics/
      ├─ pendulum.test.ts
      └─ kepler.test.ts
```

Each file has **one responsibility**. Physics math is strictly separated from visual rendering. Unit tests cover only `lib/physics/*`.

---

## Pre-flight

Working directory is `/Users/romanpochtman/Developer/physics` (currently empty except `docs/`). No git repo yet. Node 20+ assumed. `pnpm` assumed installed globally.

---

## Task 1: Initialize repo + git

**Files:**
- Create: `.gitignore`
- Create: `.node-version`
- Create: `README.md`

- [ ] **Step 1: Initialize git**

Run:
```bash
cd /Users/romanpochtman/Developer/physics
git init
git branch -M main
```

- [ ] **Step 2: Write `.gitignore`**

Create `/Users/romanpochtman/Developer/physics/.gitignore`:

```gitignore
# dependencies
node_modules
.pnp
.pnp.*
.yarn/*
!.yarn/patches
!.yarn/plugins
!.yarn/releases
!.yarn/versions

# next.js
.next/
out/
build
dist

# production
*.tsbuildinfo

# misc
.DS_Store
*.pem
.env
.env.local
.env.development.local
.env.test.local
.env.production.local

# debug
npm-debug.log*
yarn-debug.log*
yarn-error.log*
.pnpm-debug.log*

# vercel
.vercel

# ide
.vscode/*
!.vscode/extensions.json
.idea

# testing
coverage
```

- [ ] **Step 3: Write `.node-version`**

Create `/Users/romanpochtman/Developer/physics/.node-version`:

```
20.11.0
```

- [ ] **Step 4: Write `README.md`**

Create `/Users/romanpochtman/Developer/physics/README.md`:

```markdown
# physics

Visual-first physics explainer site. Two-page v0: Simple Harmonic Motion + Kepler's Laws.

## Stack

Next.js 15 · TypeScript · Tailwind v4 · MDX · Motion · JSXGraph · KaTeX · odex · vitest

## Dev

```bash
pnpm install
pnpm dev
```

Open http://localhost:3000.

## Test

```bash
pnpm test
```

Runs vitest on `lib/physics/*`.

## Deploy

Vercel (auto-deploy on push to `main`).

## Design spec

See `docs/superpowers/specs/2026-04-11-physics-site-design.md`.
```

- [ ] **Step 5: Initial commit**

```bash
cd /Users/romanpochtman/Developer/physics
git add .gitignore .node-version README.md docs/
git commit -m "chore: init repo with gitignore, node-version, readme and specs"
```

Expected output: "5 files changed" or similar.

---

## Task 2: Scaffold Next.js 15 + TypeScript

**Files:**
- Create: `package.json`, `tsconfig.json`, `next.config.mjs`, `next-env.d.ts`, `app/layout.tsx`, `app/page.tsx`, `app/globals.css`, `postcss.config.mjs`

- [ ] **Step 1: Create `package.json`**

Create `/Users/romanpochtman/Developer/physics/package.json`:

```json
{
  "name": "physics",
  "version": "0.1.0",
  "private": true,
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "next lint",
    "test": "vitest run",
    "test:watch": "vitest"
  },
  "dependencies": {
    "next": "15.0.3",
    "react": "19.0.0",
    "react-dom": "19.0.0"
  },
  "devDependencies": {
    "@types/node": "20.11.0",
    "@types/react": "19.0.0",
    "@types/react-dom": "19.0.0",
    "typescript": "5.6.3"
  }
}
```

- [ ] **Step 2: Create `tsconfig.json`**

Create `/Users/romanpochtman/Developer/physics/tsconfig.json`:

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "lib": ["dom", "dom.iterable", "esnext"],
    "allowJs": false,
    "skipLibCheck": true,
    "strict": true,
    "noEmit": true,
    "esModuleInterop": true,
    "module": "esnext",
    "moduleResolution": "bundler",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "jsx": "preserve",
    "incremental": true,
    "plugins": [{ "name": "next" }],
    "paths": {
      "@/*": ["./*"]
    }
  },
  "include": [
    "next-env.d.ts",
    "**/*.ts",
    "**/*.tsx",
    ".next/types/**/*.ts"
  ],
  "exclude": ["node_modules"]
}
```

- [ ] **Step 3: Create `next-env.d.ts`**

Create `/Users/romanpochtman/Developer/physics/next-env.d.ts`:

```typescript
/// <reference types="next" />
/// <reference types="next/image-types/global" />
```

- [ ] **Step 4: Create `next.config.mjs`**

Create `/Users/romanpochtman/Developer/physics/next.config.mjs`:

```javascript
/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  pageExtensions: ["ts", "tsx", "mdx"],
};

export default nextConfig;
```

- [ ] **Step 5: Create `postcss.config.mjs`**

Create `/Users/romanpochtman/Developer/physics/postcss.config.mjs`:

```javascript
export default {
  plugins: {
    "@tailwindcss/postcss": {},
  },
};
```

- [ ] **Step 6: Create minimal `app/globals.css`**

Create `/Users/romanpochtman/Developer/physics/app/globals.css`:

```css
@import "tailwindcss";

html, body {
  background: #05070A;
  color: #E6EDF7;
}
```

- [ ] **Step 7: Create minimal `app/layout.tsx`**

Create `/Users/romanpochtman/Developer/physics/app/layout.tsx`:

```typescript
import "./globals.css";

export const metadata = {
  title: "physics",
  description: "Visual-first physics explainers.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
```

- [ ] **Step 8: Create minimal `app/page.tsx`**

Create `/Users/romanpochtman/Developer/physics/app/page.tsx`:

```typescript
export default function HomePage() {
  return <main className="p-16">physics v0 — bootstrapped</main>;
}
```

- [ ] **Step 9: Install base dependencies**

Run:
```bash
cd /Users/romanpochtman/Developer/physics
pnpm install
```

Expected: creates `node_modules/` and `pnpm-lock.yaml`. No errors.

- [ ] **Step 10: Install Tailwind v4**

Run:
```bash
pnpm add -D tailwindcss@next @tailwindcss/postcss@next
```

- [ ] **Step 11: Verify dev server**

Run:
```bash
pnpm dev
```

Visit http://localhost:3000. Expected: dark page with white text "physics v0 — bootstrapped". Ctrl+C to stop.

- [ ] **Step 12: Commit**

```bash
git add package.json pnpm-lock.yaml tsconfig.json next.config.mjs next-env.d.ts postcss.config.mjs app/
git commit -m "chore: scaffold next 15 app with tailwind v4"
```

---

## Task 3: Install the rest of the dependencies

**Files:**
- Modify: `package.json`

- [ ] **Step 1: Install MDX + math pipeline**

Run:
```bash
cd /Users/romanpochtman/Developer/physics
pnpm add @next/mdx @mdx-js/loader @mdx-js/react @types/mdx remark-math rehype-katex katex
```

- [ ] **Step 2: Install Motion (motion.dev) and JSXGraph**

Run:
```bash
pnpm add motion jsxgraph
pnpm add -D @types/jsxgraph
```

- [ ] **Step 3: Install odex, math.js, pretext**

Run:
```bash
pnpm add odex mathjs @chenglou/pretext
```

Note: `@chenglou/pretext` is installed per spec decision but not used in v0 figures. Reserved for v1.

- [ ] **Step 4: Install vitest + jsdom**

Run:
```bash
pnpm add -D vitest @vitest/ui jsdom @testing-library/jest-dom
```

- [ ] **Step 5: Install clsx for className composition**

Run:
```bash
pnpm add clsx
```

- [ ] **Step 6: Verify `package.json` dependencies**

Read `/Users/romanpochtman/Developer/physics/package.json` and confirm all the following appear under `dependencies` or `devDependencies`:

- `next`, `react`, `react-dom`
- `@next/mdx`, `@mdx-js/loader`, `@mdx-js/react`, `@types/mdx`
- `remark-math`, `rehype-katex`, `katex`
- `motion`, `jsxgraph`, `@types/jsxgraph`
- `odex`, `mathjs`, `@chenglou/pretext`
- `clsx`
- `tailwindcss`, `@tailwindcss/postcss`
- `vitest`, `@vitest/ui`, `jsdom`
- `typescript`, `@types/node`, `@types/react`, `@types/react-dom`

- [ ] **Step 7: Commit**

```bash
git add package.json pnpm-lock.yaml
git commit -m "chore: add mdx, motion, jsxgraph, odex, vitest and friends"
```

---

## Task 4: Wire MDX + KaTeX pipeline

**Files:**
- Modify: `next.config.mjs`
- Create: `mdx-components.tsx`
- Modify: `app/globals.css` (add KaTeX styles)

- [ ] **Step 1: Update `next.config.mjs` to register MDX with remark-math + rehype-katex**

Replace `/Users/romanpochtman/Developer/physics/next.config.mjs` entirely with:

```javascript
import createMDX from "@next/mdx";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  pageExtensions: ["ts", "tsx", "mdx"],
};

const withMDX = createMDX({
  options: {
    remarkPlugins: [remarkMath],
    rehypePlugins: [[rehypeKatex, { strict: false }]],
  },
});

export default withMDX(nextConfig);
```

- [ ] **Step 2: Create `mdx-components.tsx`**

Create `/Users/romanpochtman/Developer/physics/mdx-components.tsx`:

```typescript
import type { MDXComponents } from "mdx/types";

export function useMDXComponents(components: MDXComponents): MDXComponents {
  return {
    ...components,
  };
}
```

- [ ] **Step 3: Import KaTeX styles in `globals.css`**

Replace `/Users/romanpochtman/Developer/physics/app/globals.css` with:

```css
@import "tailwindcss";
@import "katex/dist/katex.min.css";

html,
body {
  background: #05070A;
  color: #E6EDF7;
}
```

- [ ] **Step 4: Verify**

Run:
```bash
pnpm dev
```

Expected: starts without errors on http://localhost:3000. Ctrl+C to stop.

- [ ] **Step 5: Commit**

```bash
git add next.config.mjs mdx-components.tsx app/globals.css
git commit -m "chore: wire mdx pipeline with remark-math and rehype-katex"
```

---

## Task 5: Self-host fonts via next/font

**Files:**
- Modify: `app/layout.tsx`

We're using Google-hosted Inter, Inter Display equivalent (using `Inter` with display settings), and JetBrains Mono. All three are available via `next/font/google`. No font files to download manually.

- [ ] **Step 1: Update `app/layout.tsx` to use next/font**

Replace `/Users/romanpochtman/Developer/physics/app/layout.tsx` with:

```typescript
import "./globals.css";
import { Inter, JetBrains_Mono } from "next/font/google";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
  display: "swap",
});

export const metadata = {
  title: "physics",
  description: "Visual-first physics explainers.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      className={`${inter.variable} ${jetbrainsMono.variable}`}
    >
      <body className="font-sans antialiased">{children}</body>
    </html>
  );
}
```

- [ ] **Step 2: Verify**

Run:
```bash
pnpm dev
```

Visit http://localhost:3000. Expected: text now renders in Inter instead of the system default. Ctrl+C.

- [ ] **Step 3: Commit**

```bash
git add app/layout.tsx
git commit -m "chore: self-host inter and jetbrains mono via next/font"
```

---

## Task 6: Tailwind v4 design tokens from the spec

**Files:**
- Modify: `app/globals.css`

- [ ] **Step 1: Write the full token system into `globals.css`**

Replace `/Users/romanpochtman/Developer/physics/app/globals.css` with:

```css
@import "tailwindcss";
@import "katex/dist/katex.min.css";

@theme {
  /* Background */
  --color-bg-0: #05070A;
  --color-bg-1: #0B0F16;
  --color-bg-2: #121826;

  /* Foreground */
  --color-fg-0: #E6EDF7;
  --color-fg-1: #9FB0C8;
  --color-fg-2: #5B6B86;
  --color-fg-3: #2A3448;

  /* Accents */
  --color-cyan: #5BE9FF;
  --color-magenta: #FF4FD8;
  --color-amber: #F5C451;

  /* Semantic */
  --color-grid: rgba(91, 233, 255, 0.08);
  --color-glow: rgba(91, 233, 255, 0.35);

  /* Fonts (wired to next/font variables from layout.tsx) */
  --font-sans: var(--font-sans);
  --font-mono: var(--font-mono);

  /* Motion tokens (exposed for JS consumers) */
  --duration-fast: 180ms;
  --duration-base: 320ms;
  --duration-slow: 600ms;
}

html,
body {
  background: var(--color-bg-0);
  color: var(--color-fg-0);
  font-size: 18px;
  line-height: 1.65;
}

/* Links default to cyan with subtle glow on hover */
a {
  color: var(--color-cyan);
  text-decoration: none;
  transition: text-shadow var(--duration-fast) ease;
}

a:hover {
  text-shadow: 0 0 12px var(--color-glow);
}

/* KaTeX output should inherit our foreground color */
.katex {
  color: var(--color-fg-0);
}
```

- [ ] **Step 2: Verify**

Run:
```bash
pnpm dev
```

Visit http://localhost:3000. Expected:
- Background is near-black with slight blue tint (`#05070A`)
- Text is cool-white Inter at 18px
- No errors in terminal

Ctrl+C to stop.

- [ ] **Step 3: Commit**

```bash
git add app/globals.css
git commit -m "feat: tailwind v4 design tokens for sci-fi terminal theme"
```

---

## Task 7: Grid overlay background component

**Files:**
- Create: `components/layout/grid-background.tsx`
- Modify: `app/layout.tsx`

- [ ] **Step 1: Create `components/layout/grid-background.tsx`**

Create `/Users/romanpochtman/Developer/physics/components/layout/grid-background.tsx`:

```typescript
export function GridBackground() {
  return (
    <div
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 z-0"
      style={{
        backgroundImage: `
          linear-gradient(to right, var(--color-grid) 1px, transparent 1px),
          linear-gradient(to bottom, var(--color-grid) 1px, transparent 1px)
        `,
        backgroundSize: "80px 80px",
        maskImage:
          "radial-gradient(ellipse at center, rgba(0,0,0,1) 40%, rgba(0,0,0,0) 90%)",
        WebkitMaskImage:
          "radial-gradient(ellipse at center, rgba(0,0,0,1) 40%, rgba(0,0,0,0) 90%)",
      }}
    />
  );
}
```

- [ ] **Step 2: Mount it in the root layout**

Replace `/Users/romanpochtman/Developer/physics/app/layout.tsx` with:

```typescript
import "./globals.css";
import { Inter, JetBrains_Mono } from "next/font/google";
import { GridBackground } from "@/components/layout/grid-background";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
  display: "swap",
});

export const metadata = {
  title: "physics",
  description: "Visual-first physics explainers.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      className={`${inter.variable} ${jetbrainsMono.variable}`}
    >
      <body className="font-sans antialiased">
        <GridBackground />
        <div className="relative z-10">{children}</div>
      </body>
    </html>
  );
}
```

- [ ] **Step 3: Verify**

Run:
```bash
pnpm dev
```

Visit http://localhost:3000. Expected: subtle cyan grid overlay visible over the dark background, fading toward the edges.

- [ ] **Step 4: Commit**

```bash
git add components/layout/grid-background.tsx app/layout.tsx
git commit -m "feat: signature cyan grid background overlay"
```

---

## Task 8: Vitest setup

**Files:**
- Create: `vitest.config.ts`
- Create: `tests/smoke.test.ts`

- [ ] **Step 1: Create `vitest.config.ts`**

Create `/Users/romanpochtman/Developer/physics/vitest.config.ts`:

```typescript
import { defineConfig } from "vitest/config";
import path from "node:path";

export default defineConfig({
  test: {
    environment: "node",
    include: ["tests/**/*.test.ts"],
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./"),
    },
  },
});
```

- [ ] **Step 2: Create a smoke test**

Create `/Users/romanpochtman/Developer/physics/tests/smoke.test.ts`:

```typescript
import { describe, it, expect } from "vitest";

describe("smoke", () => {
  it("runs vitest", () => {
    expect(1 + 1).toBe(2);
  });
});
```

- [ ] **Step 3: Run tests to verify setup**

Run:
```bash
pnpm test
```

Expected output: "1 passed". If any error, fix before proceeding.

- [ ] **Step 4: Commit**

```bash
git add vitest.config.ts tests/
git commit -m "chore: vitest config with path alias and smoke test"
```

---

## Task 9: Physics constants module

**Files:**
- Create: `lib/physics/constants.ts`
- Create: `tests/physics/constants.test.ts`

- [ ] **Step 1: Write the failing test**

Create `/Users/romanpochtman/Developer/physics/tests/physics/constants.test.ts`:

```typescript
import { describe, it, expect } from "vitest";
import { G_SI, AU_M, YEAR_S, GM_SUN_SI } from "@/lib/physics/constants";

describe("physics constants", () => {
  it("G has the correct SI value", () => {
    expect(G_SI).toBeCloseTo(6.6743e-11, 15);
  });

  it("one AU is roughly 1.496e11 m", () => {
    expect(AU_M).toBeCloseTo(1.495978707e11, 3);
  });

  it("one sidereal year is roughly 3.156e7 s", () => {
    expect(YEAR_S).toBeCloseTo(3.15576e7, 0);
  });

  it("GM of the sun is roughly 1.327e20 m^3/s^2", () => {
    expect(GM_SUN_SI).toBeCloseTo(1.32712440018e20, 3);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run:
```bash
pnpm test tests/physics/constants.test.ts
```

Expected: FAIL with "Cannot find module '@/lib/physics/constants'".

- [ ] **Step 3: Create `lib/physics/constants.ts`**

Create `/Users/romanpochtman/Developer/physics/lib/physics/constants.ts`:

```typescript
/**
 * Physical constants in SI units.
 * Source: CODATA 2018 and IAU 2012.
 */

/** Gravitational constant, m^3 kg^-1 s^-2 */
export const G_SI = 6.6743e-11;

/** Standard gravity at Earth's surface, m/s^2 */
export const g_SI = 9.80665;

/** One astronomical unit in meters (IAU 2012 definition) */
export const AU_M = 1.495978707e11;

/** One Julian year in seconds */
export const YEAR_S = 365.25 * 86400;

/** Standard gravitational parameter of the Sun, m^3/s^2 */
export const GM_SUN_SI = 1.32712440018e20;
```

- [ ] **Step 4: Run test to verify it passes**

Run:
```bash
pnpm test tests/physics/constants.test.ts
```

Expected: PASS (all 4 tests).

- [ ] **Step 5: Commit**

```bash
git add lib/physics/constants.ts tests/physics/constants.test.ts
git commit -m "feat(physics): SI constants module with tests"
```

---

## Task 10: ODE solver wrapper (odex)

**Files:**
- Create: `lib/physics/ode.ts`
- Create: `tests/physics/ode.test.ts`

The `odex` package is an adaptive Runge-Kutta ODE integrator. We wrap it in a typed interface that suits our needs: solve an ODE system from t=0 to t=T and return samples at N evenly-spaced points.

- [ ] **Step 1: Write the failing test**

Create `/Users/romanpochtman/Developer/physics/tests/physics/ode.test.ts`:

```typescript
import { describe, it, expect } from "vitest";
import { integrate } from "@/lib/physics/ode";

describe("ode.integrate", () => {
  it("solves dy/dt = y (exponential growth) to high accuracy", () => {
    // dy/dt = y, y(0) = 1 => y(t) = e^t
    const samples = integrate({
      y0: [1],
      rhs: (_t, y) => [y[0]],
      tEnd: 1,
      nSamples: 11,
    });

    expect(samples.length).toBe(11);
    const last = samples[samples.length - 1]!;
    expect(last.t).toBeCloseTo(1, 10);
    expect(last.y[0]).toBeCloseTo(Math.E, 6);
  });

  it("solves simple harmonic oscillator and preserves energy", () => {
    // y = [x, v], dx/dt = v, dv/dt = -x  (omega = 1, period = 2pi)
    // x(0)=1, v(0)=0 => x(t)=cos(t), v(t)=-sin(t)
    const samples = integrate({
      y0: [1, 0],
      rhs: (_t, y) => [y[1], -y[0]],
      tEnd: 2 * Math.PI,
      nSamples: 101,
    });

    const last = samples[samples.length - 1]!;
    expect(last.t).toBeCloseTo(2 * Math.PI, 10);
    expect(last.y[0]).toBeCloseTo(1, 6);   // back to x=1
    expect(last.y[1]).toBeCloseTo(0, 6);   // back to v=0
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run:
```bash
pnpm test tests/physics/ode.test.ts
```

Expected: FAIL, module not found.

- [ ] **Step 3: Create `lib/physics/ode.ts`**

Create `/Users/romanpochtman/Developer/physics/lib/physics/ode.ts`:

```typescript
// @ts-expect-error - odex has no types
import { Solver } from "odex";

export interface ODESample {
  t: number;
  y: number[];
}

export interface IntegrateOptions {
  /** Initial state vector */
  y0: number[];
  /** Right-hand side f(t, y) returning dy/dt */
  rhs: (t: number, y: number[]) => number[];
  /** End time (integration starts at t=0) */
  tEnd: number;
  /** Number of samples to return, evenly spaced in [0, tEnd] */
  nSamples: number;
  /** Absolute tolerance (default 1e-10) */
  absTol?: number;
  /** Relative tolerance (default 1e-10) */
  relTol?: number;
}

/**
 * Integrate an ODE system from t=0 to t=tEnd and return N evenly-spaced samples.
 * Uses odex (adaptive high-order RK).
 */
export function integrate(opts: IntegrateOptions): ODESample[] {
  const {
    y0,
    rhs,
    tEnd,
    nSamples,
    absTol = 1e-10,
    relTol = 1e-10,
  } = opts;

  if (nSamples < 2) {
    throw new Error("nSamples must be at least 2");
  }

  const solver = new Solver(y0.length);
  solver.absoluteTolerance = absTol;
  solver.relativeTolerance = relTol;
  solver.denseOutput = true;

  const samples: ODESample[] = [];
  const dt = tEnd / (nSamples - 1);

  const f = (_t: number, y: number[], yPrime: number[]) => {
    const out = rhs(_t, y);
    for (let i = 0; i < out.length; i++) yPrime[i] = out[i]!;
  };

  // First sample is the initial condition
  samples.push({ t: 0, y: [...y0] });

  // Integrate and collect dense samples
  solver.solve(f, 0, [...y0], tEnd, solver.grid(dt, (t: number, y: number[]) => {
    if (t === 0) return; // already pushed
    samples.push({ t, y: [...y] });
  }));

  return samples;
}
```

- [ ] **Step 4: Run test to verify it passes**

Run:
```bash
pnpm test tests/physics/ode.test.ts
```

Expected: PASS (both tests).

If odex's API signature differs from what's assumed above, adjust the `solve` call accordingly; the odex README (https://github.com/littleredcomputer/odex) is the authoritative reference.

- [ ] **Step 5: Commit**

```bash
git add lib/physics/ode.ts tests/physics/ode.test.ts
git commit -m "feat(physics): typed ode.integrate wrapping odex"
```

---

## Task 11: Pendulum — small angle analytic solution

**Files:**
- Create: `lib/physics/pendulum.ts`
- Create: `tests/physics/pendulum.test.ts`

- [ ] **Step 1: Write the failing test**

Create `/Users/romanpochtman/Developer/physics/tests/physics/pendulum.test.ts`:

```typescript
import { describe, it, expect } from "vitest";
import {
  smallAngleTheta,
  smallAnglePeriod,
} from "@/lib/physics/pendulum";
import { g_SI } from "@/lib/physics/constants";

describe("pendulum — small-angle analytic", () => {
  it("period matches 2*pi*sqrt(L/g) for L = 1m", () => {
    const L = 1;
    expect(smallAnglePeriod(L)).toBeCloseTo(
      2 * Math.PI * Math.sqrt(L / g_SI),
      10,
    );
  });

  it("theta(0) equals initial amplitude", () => {
    expect(smallAngleTheta({ t: 0, theta0: 0.1, L: 1 })).toBeCloseTo(0.1, 10);
  });

  it("theta(T/2) equals -theta0", () => {
    const L = 1;
    const theta0 = 0.15;
    const T = smallAnglePeriod(L);
    expect(
      smallAngleTheta({ t: T / 2, theta0, L }),
    ).toBeCloseTo(-theta0, 10);
  });

  it("theta(T) returns to theta0", () => {
    const L = 1;
    const theta0 = 0.2;
    const T = smallAnglePeriod(L);
    expect(
      smallAngleTheta({ t: T, theta0, L }),
    ).toBeCloseTo(theta0, 10);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

```bash
pnpm test tests/physics/pendulum.test.ts
```

Expected: FAIL, module not found.

- [ ] **Step 3: Create `lib/physics/pendulum.ts`**

Create `/Users/romanpochtman/Developer/physics/lib/physics/pendulum.ts`:

```typescript
import { g_SI } from "./constants";

/**
 * Small-angle pendulum. Assumes sin(theta) ≈ theta.
 * Solution: theta(t) = theta0 * cos(omega * t), omega = sqrt(g/L).
 */

export interface SmallAngleInput {
  /** Time in seconds */
  t: number;
  /** Initial amplitude in radians (should be < ~0.3 for the approximation to hold) */
  theta0: number;
  /** Pendulum length in meters */
  L: number;
  /** Optional gravity override in m/s^2 (defaults to standard gravity) */
  g?: number;
}

export function smallAngleOmega(L: number, g: number = g_SI): number {
  return Math.sqrt(g / L);
}

export function smallAnglePeriod(L: number, g: number = g_SI): number {
  return 2 * Math.PI * Math.sqrt(L / g);
}

export function smallAngleTheta({
  t,
  theta0,
  L,
  g = g_SI,
}: SmallAngleInput): number {
  const omega = smallAngleOmega(L, g);
  return theta0 * Math.cos(omega * t);
}

export function smallAngleThetaDot({
  t,
  theta0,
  L,
  g = g_SI,
}: SmallAngleInput): number {
  const omega = smallAngleOmega(L, g);
  return -theta0 * omega * Math.sin(omega * t);
}
```

- [ ] **Step 4: Run test to verify it passes**

```bash
pnpm test tests/physics/pendulum.test.ts
```

Expected: PASS (all 4 tests).

- [ ] **Step 5: Commit**

```bash
git add lib/physics/pendulum.ts tests/physics/pendulum.test.ts
git commit -m "feat(physics): small-angle pendulum analytic solution"
```

---

## Task 12: Pendulum — large angle via ODE

**Files:**
- Modify: `lib/physics/pendulum.ts`
- Modify: `tests/physics/pendulum.test.ts`

The exact pendulum equation is `θ'' = -(g/L) sin θ`. For large angles this has no closed-form elementary solution — we integrate numerically with odex. As a sanity check, the period of a large-angle pendulum is given by `T = (4/ω) * K(sin(θ₀/2))` where `K` is the complete elliptic integral of the first kind. We compute `K` via the arithmetic-geometric mean for validation.

- [ ] **Step 1: Add failing tests for large-angle integration**

Append to `/Users/romanpochtman/Developer/physics/tests/physics/pendulum.test.ts`:

```typescript
import {
  largeAngleSolve,
  exactLargeAnglePeriod,
} from "@/lib/physics/pendulum";

describe("pendulum — large angle via ODE", () => {
  it("large-angle period at theta0=10deg matches small-angle to 1e-4", () => {
    const L = 1;
    const theta0 = (10 * Math.PI) / 180;
    const T_num = exactLargeAnglePeriod(theta0, L);
    expect(T_num).toBeCloseTo(smallAnglePeriod(L), 4);
  });

  it("large-angle period at theta0=80deg is noticeably longer (>10%)", () => {
    const L = 1;
    const theta0 = (80 * Math.PI) / 180;
    const Ts = smallAnglePeriod(L);
    const Tl = exactLargeAnglePeriod(theta0, L);
    expect(Tl / Ts).toBeGreaterThan(1.1);
    expect(Tl / Ts).toBeLessThan(1.3);
  });

  it("largeAngleSolve returns N samples across [0, tEnd]", () => {
    const samples = largeAngleSolve({
      theta0: 0.5,
      L: 1,
      tEnd: 2,
      nSamples: 50,
    });
    expect(samples.length).toBe(50);
    expect(samples[0]!.t).toBe(0);
    expect(samples[0]!.theta).toBeCloseTo(0.5, 10);
    expect(samples[samples.length - 1]!.t).toBeCloseTo(2, 10);
  });
});
```

- [ ] **Step 2: Run tests to verify the new ones fail**

```bash
pnpm test tests/physics/pendulum.test.ts
```

Expected: first 4 tests pass, last 3 fail because `largeAngleSolve` and `exactLargeAnglePeriod` do not exist.

- [ ] **Step 3: Extend `lib/physics/pendulum.ts`**

Append to `/Users/romanpochtman/Developer/physics/lib/physics/pendulum.ts`:

```typescript
import { integrate } from "./ode";

export interface LargeAngleInput {
  /** Initial amplitude in radians */
  theta0: number;
  /** Pendulum length in meters */
  L: number;
  /** Integration horizon in seconds */
  tEnd: number;
  /** Number of samples to return */
  nSamples: number;
  /** Optional gravity override */
  g?: number;
}

export interface PendulumSample {
  t: number;
  theta: number;
  thetaDot: number;
}

/**
 * Integrate the full nonlinear pendulum equation theta'' = -(g/L) sin(theta)
 * starting from rest at theta0. Uses odex.
 */
export function largeAngleSolve(input: LargeAngleInput): PendulumSample[] {
  const { theta0, L, tEnd, nSamples, g = g_SI } = input;
  const omega2 = g / L;

  const samples = integrate({
    y0: [theta0, 0],
    rhs: (_t, y) => [y[1]!, -omega2 * Math.sin(y[0]!)],
    tEnd,
    nSamples,
  });

  return samples.map((s) => ({
    t: s.t,
    theta: s.y[0]!,
    thetaDot: s.y[1]!,
  }));
}

/**
 * Complete elliptic integral of the first kind K(k) using the
 * arithmetic-geometric mean. k is the modulus (NOT the parameter m = k^2).
 * Converges to full double precision in ~10 iterations.
 */
function completeEllipticK(k: number): number {
  let a = 1;
  let b = Math.sqrt(1 - k * k);
  for (let i = 0; i < 20; i++) {
    const aNext = (a + b) / 2;
    const bNext = Math.sqrt(a * b);
    if (Math.abs(a - b) < 1e-15) break;
    a = aNext;
    b = bNext;
  }
  return Math.PI / (2 * a);
}

/**
 * Exact period of a simple pendulum at amplitude theta0 using the
 * elliptic-integral formula: T = 4 * sqrt(L/g) * K(sin(theta0 / 2)).
 */
export function exactLargeAnglePeriod(
  theta0: number,
  L: number,
  g: number = g_SI,
): number {
  const k = Math.sin(theta0 / 2);
  return 4 * Math.sqrt(L / g) * completeEllipticK(k);
}
```

- [ ] **Step 4: Run tests to verify they pass**

```bash
pnpm test tests/physics/pendulum.test.ts
```

Expected: all 7 tests pass.

- [ ] **Step 5: Commit**

```bash
git add lib/physics/pendulum.ts tests/physics/pendulum.test.ts
git commit -m "feat(physics): large-angle pendulum via ode + exact elliptic period"
```

---

## Task 13: Kepler — eccentric anomaly solver

**Files:**
- Create: `lib/physics/kepler.ts`
- Create: `tests/physics/kepler.test.ts`

Kepler's equation `M = E − e·sin E` is transcendental; we solve for `E` given mean anomaly `M` and eccentricity `e` via Newton-Raphson.

- [ ] **Step 1: Write the failing test**

Create `/Users/romanpochtman/Developer/physics/tests/physics/kepler.test.ts`:

```typescript
import { describe, it, expect } from "vitest";
import { solveKepler } from "@/lib/physics/kepler";

describe("Kepler's equation solver", () => {
  const eccentricities = [0, 0.1, 0.3, 0.5, 0.7, 0.9];

  for (const e of eccentricities) {
    it(`round-trips for e=${e} across mean anomaly`, () => {
      for (let i = 0; i < 20; i++) {
        const M = (2 * Math.PI * i) / 20 - Math.PI;
        const E = solveKepler(M, e);
        const MRecovered = E - e * Math.sin(E);
        expect(MRecovered).toBeCloseTo(M, 10);
      }
    });
  }

  it("converges within 10 iterations even at e=0.9", () => {
    const { iterations } = solveKepler(1.5, 0.9, { returnDiagnostics: true });
    expect(iterations).toBeLessThanOrEqual(10);
  });
});
```

- [ ] **Step 2: Run to verify it fails**

```bash
pnpm test tests/physics/kepler.test.ts
```

Expected: FAIL, module not found.

- [ ] **Step 3: Create `lib/physics/kepler.ts`**

Create `/Users/romanpochtman/Developer/physics/lib/physics/kepler.ts`:

```typescript
/**
 * Newton-Raphson solver for Kepler's equation: M = E - e*sin(E).
 * Given mean anomaly M and eccentricity e, returns eccentric anomaly E.
 */

export interface KeplerSolveOptions {
  /** Convergence tolerance on |f(E)|. Default 1e-12. */
  tolerance?: number;
  /** Max iterations. Default 30. */
  maxIterations?: number;
  /** If true, returns an object with iteration count. */
  returnDiagnostics?: boolean;
}

export function solveKepler(M: number, e: number): number;
export function solveKepler(
  M: number,
  e: number,
  opts: KeplerSolveOptions & { returnDiagnostics: true },
): { E: number; iterations: number };
export function solveKepler(
  M: number,
  e: number,
  opts?: KeplerSolveOptions,
): number | { E: number; iterations: number } {
  const tol = opts?.tolerance ?? 1e-12;
  const maxIter = opts?.maxIterations ?? 30;

  // Normalize M to [-pi, pi] for numerical stability
  const Mnorm = Math.atan2(Math.sin(M), Math.cos(M));

  // Good initial guess: E0 = M + e*sin(M) (Danby)
  let E = Mnorm + e * Math.sin(Mnorm);
  let iterations = 0;

  for (let i = 0; i < maxIter; i++) {
    const f = E - e * Math.sin(E) - Mnorm;
    const fPrime = 1 - e * Math.cos(E);
    const dE = f / fPrime;
    E -= dE;
    iterations = i + 1;
    if (Math.abs(f) < tol) break;
  }

  if (opts?.returnDiagnostics) {
    return { E, iterations };
  }
  return E;
}
```

- [ ] **Step 4: Run to verify it passes**

```bash
pnpm test tests/physics/kepler.test.ts
```

Expected: PASS (7 tests: 6 eccentricities + 1 convergence check).

- [ ] **Step 5: Commit**

```bash
git add lib/physics/kepler.ts tests/physics/kepler.test.ts
git commit -m "feat(physics): Kepler's equation solver via Newton-Raphson"
```

---

## Task 14: Kepler — orbit position over time

**Files:**
- Modify: `lib/physics/kepler.ts`
- Modify: `tests/physics/kepler.test.ts`

Given a Keplerian orbit with semi-major axis `a`, eccentricity `e`, and period `T`, we want `r(t)` and the Cartesian position `(x, y)` at time `t`.

- [ ] **Step 1: Add failing tests**

Append to `/Users/romanpochtman/Developer/physics/tests/physics/kepler.test.ts`:

```typescript
import { orbitPosition } from "@/lib/physics/kepler";

describe("Keplerian orbit position", () => {
  const a = 1; // AU
  const e = 0.3;
  const T = 1; // year

  it("at t=0 the body is at perihelion (positive x axis, distance a(1-e))", () => {
    const p = orbitPosition({ t: 0, a, e, T });
    expect(p.x).toBeCloseTo(a * (1 - e), 10);
    expect(p.y).toBeCloseTo(0, 10);
    expect(p.r).toBeCloseTo(a * (1 - e), 10);
  });

  it("at t=T/2 the body is at aphelion (negative x, distance a(1+e))", () => {
    const p = orbitPosition({ t: T / 2, a, e, T });
    expect(p.x).toBeCloseTo(-a * (1 + e), 10);
    expect(p.y).toBeCloseTo(0, 10);
    expect(p.r).toBeCloseTo(a * (1 + e), 10);
  });

  it("at t=T the body returns to perihelion", () => {
    const p = orbitPosition({ t: T, a, e, T });
    expect(p.x).toBeCloseTo(a * (1 - e), 10);
    expect(p.y).toBeCloseTo(0, 10);
  });

  it("circular orbit (e=0) has constant radius a", () => {
    for (let i = 0; i < 10; i++) {
      const p = orbitPosition({ t: (i / 10) * T, a: 1, e: 0, T });
      expect(p.r).toBeCloseTo(1, 10);
    }
  });
});
```

- [ ] **Step 2: Run to verify they fail**

```bash
pnpm test tests/physics/kepler.test.ts
```

Expected: `orbitPosition` not exported — FAIL.

- [ ] **Step 3: Extend `lib/physics/kepler.ts`**

Append to `/Users/romanpochtman/Developer/physics/lib/physics/kepler.ts`:

```typescript
export interface OrbitPositionInput {
  /** Time in same units as T */
  t: number;
  /** Semi-major axis (any unit) */
  a: number;
  /** Eccentricity in [0, 1) */
  e: number;
  /** Orbital period in same units as t */
  T: number;
}

export interface OrbitPosition {
  /** Radial distance from focus (perihelion at t=0) */
  r: number;
  /** True anomaly (angle from perihelion, radians) */
  theta: number;
  /** Cartesian x in the orbital plane (perihelion along +x) */
  x: number;
  /** Cartesian y in the orbital plane */
  y: number;
}

/**
 * Compute Cartesian position on a Keplerian orbit at time t.
 * The focus containing the attracting body sits at the origin.
 * At t=0 the body is at perihelion (r = a(1-e), along +x).
 */
export function orbitPosition(input: OrbitPositionInput): OrbitPosition {
  const { t, a, e, T } = input;
  // Mean anomaly advances linearly with time: M = 2*pi*(t/T)
  const M = (2 * Math.PI * t) / T;
  // Solve Kepler's equation for the eccentric anomaly E
  const E = solveKepler(M, e);
  // True anomaly theta from eccentric anomaly via the standard formula
  const theta = 2 * Math.atan2(
    Math.sqrt(1 + e) * Math.sin(E / 2),
    Math.sqrt(1 - e) * Math.cos(E / 2),
  );
  // Radial distance
  const r = a * (1 - e * Math.cos(E));
  // Cartesian (perihelion along +x)
  const x = r * Math.cos(theta);
  const y = r * Math.sin(theta);
  return { r, theta, x, y };
}
```

- [ ] **Step 4: Run to verify tests pass**

```bash
pnpm test tests/physics/kepler.test.ts
```

Expected: all tests pass.

- [ ] **Step 5: Commit**

```bash
git add lib/physics/kepler.ts tests/physics/kepler.test.ts
git commit -m "feat(physics): orbitPosition returns Cartesian position on a Keplerian orbit"
```

---

## Task 15: Kepler — swept area (2nd law)

**Files:**
- Modify: `lib/physics/kepler.ts`
- Modify: `tests/physics/kepler.test.ts`

Kepler's second law says equal areas are swept in equal times. We verify this by computing the swept area between two times `t1` and `t2` and confirming the full orbit sweeps `pi * a * b` where `b = a * sqrt(1 - e^2)`.

Analytical formula: the area swept from perihelion to eccentric anomaly `E` is `(a * b / 2) * (E - e * sin E) = (a * b / 2) * M`. Since mean anomaly `M = 2*pi*t/T`, the swept area is linear in `t` — exactly the 2nd law.

- [ ] **Step 1: Add failing tests**

Append to `/Users/romanpochtman/Developer/physics/tests/physics/kepler.test.ts`:

```typescript
import { sweptArea } from "@/lib/physics/kepler";

describe("Kepler's 2nd law — swept area", () => {
  const a = 1;
  const T = 1;

  it("full orbit sweeps exactly pi*a*b for various eccentricities", () => {
    for (const e of [0, 0.2, 0.5, 0.8]) {
      const b = a * Math.sqrt(1 - e * e);
      const area = sweptArea({ t1: 0, t2: T, a, e, T });
      expect(area).toBeCloseTo(Math.PI * a * b, 10);
    }
  });

  it("areas for equal time intervals are equal (2nd law)", () => {
    const e = 0.5;
    const n = 6;
    const dt = T / n;
    const areas: number[] = [];
    for (let i = 0; i < n; i++) {
      areas.push(sweptArea({ t1: i * dt, t2: (i + 1) * dt, a, e, T }));
    }
    const first = areas[0]!;
    for (const area of areas) {
      expect(area).toBeCloseTo(first, 10);
    }
  });
});
```

- [ ] **Step 2: Run to verify they fail**

```bash
pnpm test tests/physics/kepler.test.ts
```

Expected: `sweptArea` not exported — FAIL.

- [ ] **Step 3: Extend `lib/physics/kepler.ts`**

Append to `/Users/romanpochtman/Developer/physics/lib/physics/kepler.ts`:

```typescript
export interface SweptAreaInput {
  /** Start time */
  t1: number;
  /** End time */
  t2: number;
  /** Semi-major axis */
  a: number;
  /** Eccentricity in [0, 1) */
  e: number;
  /** Orbital period */
  T: number;
}

/**
 * Area swept by the radius vector between times t1 and t2 on a Keplerian
 * orbit with semi-major axis a, eccentricity e, period T.
 *
 * Kepler's 2nd law: the area is linear in elapsed time, equal to
 *   (pi * a * b) * (t2 - t1) / T
 * where b = a * sqrt(1 - e^2) is the semi-minor axis.
 */
export function sweptArea(input: SweptAreaInput): number {
  const { t1, t2, a, e, T } = input;
  const b = a * Math.sqrt(1 - e * e);
  const totalArea = Math.PI * a * b;
  return (totalArea * (t2 - t1)) / T;
}
```

- [ ] **Step 4: Run to verify tests pass**

```bash
pnpm test tests/physics/kepler.test.ts
```

Expected: all tests pass.

- [ ] **Step 5: Commit**

```bash
git add lib/physics/kepler.ts tests/physics/kepler.test.ts
git commit -m "feat(physics): swept-area function implements Kepler's 2nd law analytically"
```

---

## Task 16: Animation frame hook with off-screen pause

**Files:**
- Create: `lib/animation/use-animation-frame.ts`
- Create: `lib/hooks/use-reduced-motion.ts`

Every Canvas-based scene uses this hook so animations pause when scrolled out of view and respect `prefers-reduced-motion`.

- [ ] **Step 1: Create `lib/hooks/use-reduced-motion.ts`**

Create `/Users/romanpochtman/Developer/physics/lib/hooks/use-reduced-motion.ts`:

```typescript
"use client";

import { useEffect, useState } from "react";

/**
 * Returns true if the user has requested reduced motion.
 */
export function useReducedMotion(): boolean {
  const [reduced, setReduced] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReduced(mq.matches);
    const onChange = (e: MediaQueryListEvent) => setReduced(e.matches);
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);

  return reduced;
}
```

- [ ] **Step 2: Create `lib/animation/use-animation-frame.ts`**

Create `/Users/romanpochtman/Developer/physics/lib/animation/use-animation-frame.ts`:

```typescript
"use client";

import { useEffect, useRef, type RefObject } from "react";

export type FrameCallback = (t: number, dt: number) => void;

export interface UseAnimationFrameOptions {
  /** Ref to the element whose visibility gates the animation */
  elementRef: RefObject<HTMLElement | null>;
  /** Called on every frame while element is visible */
  onFrame: FrameCallback;
  /** If true, ignores visibility and always runs (default false) */
  alwaysOn?: boolean;
}

/**
 * Runs a requestAnimationFrame loop that:
 *  - calls onFrame with (elapsedSeconds, deltaSeconds)
 *  - pauses automatically when the referenced element scrolls out of view
 *  - cleans up on unmount
 *
 * Note: this does NOT respect reduced-motion — the consumer should check
 * useReducedMotion() and either skip rendering or render a single frame.
 */
export function useAnimationFrame({
  elementRef,
  onFrame,
  alwaysOn = false,
}: UseAnimationFrameOptions) {
  const visibleRef = useRef(alwaysOn);
  const rafRef = useRef<number | null>(null);
  const startRef = useRef<number | null>(null);
  const lastRef = useRef<number | null>(null);
  const onFrameRef = useRef(onFrame);

  // Keep latest callback without re-starting the loop
  useEffect(() => {
    onFrameRef.current = onFrame;
  }, [onFrame]);

  useEffect(() => {
    const el = elementRef.current;

    const tick = (now: number) => {
      if (startRef.current === null) startRef.current = now;
      const elapsed = (now - startRef.current) / 1000;
      const dt =
        lastRef.current === null ? 0 : (now - lastRef.current) / 1000;
      lastRef.current = now;

      if (visibleRef.current) {
        onFrameRef.current(elapsed, dt);
      }
      rafRef.current = requestAnimationFrame(tick);
    };

    if (alwaysOn) {
      visibleRef.current = true;
      rafRef.current = requestAnimationFrame(tick);
      return () => {
        if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
      };
    }

    if (!el) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        if (!entry) return;
        visibleRef.current = entry.isIntersecting;
        if (entry.isIntersecting) {
          // Reset timer on re-enter to avoid huge dt jumps
          lastRef.current = null;
        }
      },
      { threshold: 0.05 },
    );

    observer.observe(el);
    rafRef.current = requestAnimationFrame(tick);

    return () => {
      observer.disconnect();
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
    };
  }, [elementRef, alwaysOn]);
}
```

- [ ] **Step 3: Commit**

```bash
git add lib/animation/use-animation-frame.ts lib/hooks/use-reduced-motion.ts
git commit -m "feat(animation): rAF hook with intersection pause and reduced-motion hook"
```

---

## Task 17: SceneCard primitive

**Files:**
- Create: `components/layout/scene-card.tsx`

- [ ] **Step 1: Create the component**

Create `/Users/romanpochtman/Developer/physics/components/layout/scene-card.tsx`:

```typescript
import clsx from "clsx";
import type { ReactNode } from "react";

export interface SceneCardProps {
  /** "FIG.01 — the pendulum" style caption */
  caption?: string;
  /** Scene content (usually a canvas or JSXGraph container) */
  children: ReactNode;
  /** Optional HUD slot rendered in the bottom-right corner */
  hud?: ReactNode;
  /** Additional className on the card wrapper */
  className?: string;
}

export function SceneCard({ caption, children, hud, className }: SceneCardProps) {
  return (
    <figure className={clsx("my-16 w-full", className)}>
      {caption && (
        <figcaption className="mb-3 font-mono text-xs uppercase tracking-wider text-[var(--color-fg-2)]">
          {caption}
        </figcaption>
      )}
      <div className="relative overflow-hidden rounded-md border border-[var(--color-fg-3)] bg-[var(--color-bg-1)]">
        {children}
        {hud && (
          <div className="pointer-events-none absolute bottom-3 right-3">
            {hud}
          </div>
        )}
      </div>
    </figure>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add components/layout/scene-card.tsx
git commit -m "feat(primitives): SceneCard chrome wrapper for animations"
```

---

## Task 18: HUD primitive

**Files:**
- Create: `components/layout/hud.tsx`

- [ ] **Step 1: Create the component**

Create `/Users/romanpochtman/Developer/physics/components/layout/hud.tsx`:

```typescript
import clsx from "clsx";
import type { ReactNode } from "react";

export interface HUDProps {
  children: ReactNode;
  className?: string;
}

/**
 * Mono corner readout for live scene values.
 * Use inside SceneCard via the `hud` prop.
 */
export function HUD({ children, className }: HUDProps) {
  return (
    <div
      className={clsx(
        "rounded-sm border border-[var(--color-fg-3)] bg-[var(--color-bg-0)]/70 px-2 py-1",
        "font-mono text-xs text-[var(--color-fg-1)] backdrop-blur-sm",
        className,
      )}
    >
      {children}
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add components/layout/hud.tsx
git commit -m "feat(primitives): HUD mono corner readout"
```

---

## Task 19: FigureLabel primitive (inline for section headers)

**Files:**
- Create: `components/layout/figure-label.tsx`

FigureLabel is a small inline label like `§ FIRST LAW · FIG.01` for use inside prose or above diagrams that aren't wrapped in a SceneCard.

- [ ] **Step 1: Create the component**

Create `/Users/romanpochtman/Developer/physics/components/layout/figure-label.tsx`:

```typescript
import clsx from "clsx";

export interface FigureLabelProps {
  section?: string;
  figure: string;
  className?: string;
}

export function FigureLabel({ section, figure, className }: FigureLabelProps) {
  return (
    <div
      className={clsx(
        "font-mono text-xs uppercase tracking-wider text-[var(--color-fg-2)]",
        className,
      )}
    >
      {section ? `§ ${section} · ${figure}` : figure}
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add components/layout/figure-label.tsx
git commit -m "feat(primitives): FigureLabel"
```

---

## Task 20: EquationBlock primitive

**Files:**
- Create: `components/math/equation-block.tsx`

- [ ] **Step 1: Create the component**

Create `/Users/romanpochtman/Developer/physics/components/math/equation-block.tsx`:

```typescript
import clsx from "clsx";
import type { ReactNode } from "react";

export interface EquationBlockProps {
  /** Label shown on the left, e.g. "EQ.01" */
  id: string;
  /** KaTeX-rendered children (typically passed from MDX as `$$…$$` block) */
  children: ReactNode;
  className?: string;
}

/**
 * A display-mode equation block with a mono ID label and a cyan left border.
 * Children should already contain rendered KaTeX (MDX block math).
 */
export function EquationBlock({ id, children, className }: EquationBlockProps) {
  return (
    <div
      className={clsx(
        "my-8 flex items-center gap-6 border-l-2 border-[var(--color-cyan)] bg-[var(--color-bg-1)] px-6 py-5",
        className,
      )}
    >
      <div className="font-mono text-xs uppercase tracking-wider text-[var(--color-fg-2)]">
        {id}
      </div>
      <div className="flex-1 text-[var(--color-fg-0)]">{children}</div>
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add components/math/equation-block.tsx
git commit -m "feat(primitives): EquationBlock with cyan left border and mono ID"
```

---

## Task 21: Callout primitive

**Files:**
- Create: `components/layout/callout.tsx`

- [ ] **Step 1: Create the component**

Create `/Users/romanpochtman/Developer/physics/components/layout/callout.tsx`:

```typescript
import clsx from "clsx";
import type { ReactNode } from "react";

export type CalloutVariant = "intuition" | "math" | "warning";

export interface CalloutProps {
  variant: CalloutVariant;
  children: ReactNode;
  className?: string;
}

const VARIANT_STYLES: Record<
  CalloutVariant,
  { border: string; label: string; labelColor: string }
> = {
  intuition: {
    border: "border-[var(--color-amber)]",
    label: "INTUITION",
    labelColor: "text-[var(--color-amber)]",
  },
  math: {
    border: "border-[var(--color-cyan)]",
    label: "MATH",
    labelColor: "text-[var(--color-cyan)]",
  },
  warning: {
    border: "border-[var(--color-magenta)]",
    label: "CAUTION",
    labelColor: "text-[var(--color-magenta)]",
  },
};

export function Callout({ variant, children, className }: CalloutProps) {
  const style = VARIANT_STYLES[variant];
  return (
    <aside
      className={clsx(
        "my-6 border-l-2 bg-[var(--color-bg-1)] px-6 py-5",
        style.border,
        className,
      )}
    >
      <div
        className={clsx(
          "mb-2 font-mono text-xs uppercase tracking-wider",
          style.labelColor,
        )}
      >
        {style.label}
      </div>
      <div className="text-[var(--color-fg-1)]">{children}</div>
    </aside>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add components/layout/callout.tsx
git commit -m "feat(primitives): Callout with intuition/math/warning variants"
```

---

## Task 22: TopicHeader primitive

**Files:**
- Create: `components/layout/topic-header.tsx`

- [ ] **Step 1: Create the component**

Create `/Users/romanpochtman/Developer/physics/components/layout/topic-header.tsx`:

```typescript
import clsx from "clsx";

export interface TopicHeaderProps {
  /** Section number label, e.g. "§ 01 · CLASSICAL MECHANICS" */
  eyebrow: string;
  /** Big title, e.g. "THE PENDULUM" */
  title: string;
  /** Optional italic/plain subtitle below the title */
  subtitle?: string;
  className?: string;
}

export function TopicHeader({
  eyebrow,
  title,
  subtitle,
  className,
}: TopicHeaderProps) {
  return (
    <header className={clsx("mt-16 mb-24", className)}>
      <div className="mb-6 font-mono text-xs uppercase tracking-[0.2em] text-[var(--color-cyan)]">
        {eyebrow}
      </div>
      <h1 className="mb-6 text-6xl font-bold uppercase tracking-tight text-[var(--color-fg-0)] md:text-7xl">
        {title}
      </h1>
      {subtitle && (
        <p className="max-w-[36ch] text-xl italic text-[var(--color-fg-1)]">
          {subtitle}
        </p>
      )}
    </header>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add components/layout/topic-header.tsx
git commit -m "feat(primitives): TopicHeader hero block"
```

---

## Task 23: Section primitive

**Files:**
- Create: `components/layout/section.tsx`

- [ ] **Step 1: Create the component**

Create `/Users/romanpochtman/Developer/physics/components/layout/section.tsx`:

```typescript
import clsx from "clsx";
import type { ReactNode } from "react";

export interface SectionProps {
  /** Numeric section index, e.g. 1, 2, 3 */
  index: number;
  /** Section heading */
  title: string;
  children: ReactNode;
  className?: string;
}

export function Section({ index, title, children, className }: SectionProps) {
  const indexStr = String(index).padStart(2, "0");
  return (
    <section className={clsx("mb-24", className)}>
      <div className="mb-4 flex items-baseline gap-4">
        <span className="font-mono text-xs uppercase tracking-wider text-[var(--color-cyan)]">
          § {indexStr}
        </span>
        <h2 className="text-3xl font-semibold text-[var(--color-fg-0)]">
          {title}
        </h2>
      </div>
      <div className="prose prose-invert max-w-none text-[var(--color-fg-0)]">
        {children}
      </div>
    </section>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add components/layout/section.tsx
git commit -m "feat(primitives): Section with numbered mono header"
```

---

## Task 24: Nav primitive

**Files:**
- Create: `components/layout/nav.tsx`

- [ ] **Step 1: Create the component**

Create `/Users/romanpochtman/Developer/physics/components/layout/nav.tsx`:

```typescript
import Link from "next/link";

export function Nav() {
  return (
    <nav className="sticky top-0 z-20 flex items-center justify-between px-8 py-5 backdrop-blur-sm">
      <Link
        href="/"
        className="font-mono text-sm uppercase tracking-[0.2em] text-[var(--color-fg-0)]"
      >
        physics
      </Link>
      <div className="font-mono text-xs uppercase tracking-wider text-[var(--color-fg-2)]">
        v0
      </div>
    </nav>
  );
}
```

- [ ] **Step 2: Add nav to root layout**

Replace `/Users/romanpochtman/Developer/physics/app/layout.tsx` with:

```typescript
import "./globals.css";
import { Inter, JetBrains_Mono } from "next/font/google";
import { GridBackground } from "@/components/layout/grid-background";
import { Nav } from "@/components/layout/nav";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
  display: "swap",
});

export const metadata = {
  title: "physics",
  description: "Visual-first physics explainers.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      className={`${inter.variable} ${jetbrainsMono.variable}`}
    >
      <body className="font-sans antialiased">
        <GridBackground />
        <div className="relative z-10">
          <Nav />
          {children}
        </div>
      </body>
    </html>
  );
}
```

- [ ] **Step 3: Commit**

```bash
git add components/layout/nav.tsx app/layout.tsx
git commit -m "feat(primitives): minimal top nav with mono wordmark"
```

---

## Task 25: Sandbox page showcasing all primitives

**Files:**
- Create: `app/sandbox/page.tsx`

- [ ] **Step 1: Create the sandbox**

Create `/Users/romanpochtman/Developer/physics/app/sandbox/page.tsx`:

```typescript
import { SceneCard } from "@/components/layout/scene-card";
import { HUD } from "@/components/layout/hud";
import { FigureLabel } from "@/components/layout/figure-label";
import { Callout } from "@/components/layout/callout";
import { TopicHeader } from "@/components/layout/topic-header";
import { Section } from "@/components/layout/section";
import { EquationBlock } from "@/components/math/equation-block";

export default function SandboxPage() {
  return (
    <main className="mx-auto max-w-[720px] px-6 pb-32">
      <TopicHeader
        eyebrow="§ 99 · INTERNAL"
        title="SANDBOX"
        subtitle="A showcase of every primitive in the design system."
      />

      <Section index={1} title="Typography">
        <p>
          This is body text in Inter at 18px, line-height 1.65. The curious
          adult can read it comfortably for half an hour without strain.
          <a href="#"> Links like this</a> glow softly on hover.
        </p>
      </Section>

      <Section index={2} title="Equation blocks">
        <EquationBlock id="EQ.01">
          <span className="font-mono text-lg">F = -kx</span>
        </EquationBlock>
        <EquationBlock id="EQ.02">
          <span className="font-mono text-lg">T = 2π √(L / g)</span>
        </EquationBlock>
      </Section>

      <Section index={3} title="Callouts">
        <Callout variant="intuition">
          The further you pull, the harder it pulls back. That's the whole idea.
        </Callout>
        <Callout variant="math">
          This approximation holds only while sin θ ≈ θ.
        </Callout>
        <Callout variant="warning">
          At large angles, the period depends on amplitude.
        </Callout>
      </Section>

      <Section index={4} title="Scene cards + HUD">
        <SceneCard
          caption="FIG.00 — empty scene"
          hud={<HUD>θ = 0.27 rad · T = 2.01 s</HUD>}
        >
          <div className="flex h-64 items-center justify-center text-[var(--color-fg-2)]">
            (canvas goes here)
          </div>
        </SceneCard>
      </Section>

      <Section index={5} title="Figure labels">
        <FigureLabel section="FIRST LAW" figure="FIG.01" />
      </Section>
    </main>
  );
}
```

- [ ] **Step 2: Visual verification**

Run:
```bash
pnpm dev
```

Visit http://localhost:3000/sandbox. Expected:
- Sci-fi terminal look with grid overlay
- Big uppercase "SANDBOX" heading with cyan eyebrow
- Body text in Inter, links are cyan with glow
- Two equation blocks with cyan left borders and EQ.01/EQ.02 mono labels
- Three callouts with amber/cyan/magenta left borders
- Empty scene card with HUD in bottom-right
- All mono text uses JetBrains Mono

Ctrl+C to stop.

- [ ] **Step 3: Commit**

```bash
git add app/sandbox/page.tsx
git commit -m "feat: sandbox page showcasing all layout primitives"
```

---

## Task 26: PendulumScene component (small angle, basic render)

**Files:**
- Create: `components/physics/pendulum-scene.tsx`

This component renders a pendulum onto a canvas, driven by `smallAngleTheta` from `lib/physics/pendulum.ts`. v0 supports small-angle mode only in this task; large-angle via ODE is added in Task 30.

- [ ] **Step 1: Create the component**

Create `/Users/romanpochtman/Developer/physics/components/physics/pendulum-scene.tsx`:

```typescript
"use client";

import { useEffect, useRef, useState } from "react";
import { smallAngleTheta, smallAnglePeriod } from "@/lib/physics/pendulum";
import { useAnimationFrame } from "@/lib/animation/use-animation-frame";
import { useReducedMotion } from "@/lib/hooks/use-reduced-motion";

export interface PendulumSceneProps {
  /** Initial amplitude in radians (small-angle mode holds for <~0.3) */
  theta0: number;
  /** Pendulum length in meters */
  length: number;
  /** Canvas width in px */
  width?: number;
  /** Canvas height in px */
  height?: number;
  /** Bob radius in px */
  bobRadius?: number;
  /** Called every frame with the current state for a HUD overlay */
  onState?: (state: { theta: number; period: number; t: number }) => void;
}

export function PendulumScene({
  theta0,
  length,
  width = 480,
  height = 360,
  bobRadius = 10,
  onState,
}: PendulumSceneProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const reducedMotion = useReducedMotion();

  // Trail buffer: array of recent bob positions with timestamps for fading
  const trailRef = useRef<Array<{ x: number; y: number; age: number }>>([]);

  useAnimationFrame({
    elementRef: containerRef,
    alwaysOn: false,
    onFrame: (t, dt) => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      // Handle HiDPI
      const dpr = window.devicePixelRatio || 1;
      if (canvas.width !== width * dpr || canvas.height !== height * dpr) {
        canvas.width = width * dpr;
        canvas.height = height * dpr;
        ctx.scale(dpr, dpr);
      }

      // Compute angle
      const theta = reducedMotion
        ? theta0 // freeze at initial position if reduced motion
        : smallAngleTheta({ t, theta0, L: length });
      const period = smallAnglePeriod(length);

      // Convert to screen coordinates
      // Pivot at top-center, pendulum hangs down
      const pivotX = width / 2;
      const pivotY = 50;
      const pxPerMeter = (height - 100) / Math.max(length, 0.1);
      const bobX = pivotX + pxPerMeter * length * Math.sin(theta);
      const bobY = pivotY + pxPerMeter * length * Math.cos(theta);

      // Update trail (cap to 60 points)
      trailRef.current.forEach((p) => (p.age += dt));
      trailRef.current = trailRef.current.filter((p) => p.age < 1.2);
      trailRef.current.push({ x: bobX, y: bobY, age: 0 });
      if (trailRef.current.length > 60) trailRef.current.shift();

      // Clear
      ctx.clearRect(0, 0, width, height);

      // Draw ghost extremes (dim cyan dots at ±theta0)
      ctx.fillStyle = "rgba(91, 233, 255, 0.25)";
      for (const sign of [-1, 1]) {
        const gx = pivotX + pxPerMeter * length * Math.sin(sign * theta0);
        const gy = pivotY + pxPerMeter * length * Math.cos(sign * theta0);
        ctx.beginPath();
        ctx.arc(gx, gy, 3, 0, Math.PI * 2);
        ctx.fill();
      }

      // Draw trail
      for (const p of trailRef.current) {
        const alpha = Math.max(0, 1 - p.age / 1.2) * 0.6;
        ctx.fillStyle = `rgba(91, 233, 255, ${alpha})`;
        ctx.beginPath();
        ctx.arc(p.x, p.y, 2, 0, Math.PI * 2);
        ctx.fill();
      }

      // Draw rod
      ctx.strokeStyle = "#E6EDF7";
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(pivotX, pivotY);
      ctx.lineTo(bobX, bobY);
      ctx.stroke();

      // Draw pivot dot
      ctx.fillStyle = "#5B6B86";
      ctx.beginPath();
      ctx.arc(pivotX, pivotY, 3, 0, Math.PI * 2);
      ctx.fill();

      // Draw bob with glow
      ctx.shadowColor = "rgba(91, 233, 255, 0.6)";
      ctx.shadowBlur = 16;
      ctx.fillStyle = "#5BE9FF";
      ctx.beginPath();
      ctx.arc(bobX, bobY, bobRadius, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0;

      // Notify parent
      onState?.({ theta, period, t });
    },
  });

  return (
    <div
      ref={containerRef}
      style={{ width, height }}
      className="mx-auto"
    >
      <canvas
        ref={canvasRef}
        style={{ width, height }}
        className="block"
      />
    </div>
  );
}
```

- [ ] **Step 2: Add to sandbox for visual verification**

Replace `/Users/romanpochtman/Developer/physics/app/sandbox/page.tsx` section 4 with:

```typescript
      <Section index={4} title="Scene cards + HUD">
        <PendulumSceneWithHUD />
      </Section>
```

And add at the top of the file (after the existing imports):

```typescript
import { PendulumScene } from "@/components/physics/pendulum-scene";
import { useState } from "react";
```

Then add this component at the bottom of the file (before the `export default`):

```typescript
"use client";

function PendulumSceneWithHUD() {
  const [state, setState] = useState({ theta: 0, period: 0, t: 0 });
  return (
    <SceneCard
      caption="FIG.00 — pendulum smoke test"
      hud={
        <HUD>
          θ = {state.theta.toFixed(2)} rad · T = {state.period.toFixed(2)} s
        </HUD>
      }
    >
      <div className="flex h-80 items-center justify-center">
        <PendulumScene theta0={0.3} length={1.2} onState={setState} />
      </div>
    </SceneCard>
  );
}
```

Note: since we added a client component using `useState`, the entire sandbox page must become a client component. Mark the whole file with `"use client";` at the top.

- [ ] **Step 3: Verify**

Run `pnpm dev`. Visit http://localhost:3000/sandbox.

Expected:
- Pendulum visibly swings left-right on a periodic cycle
- White rod, cyan glowing bob
- Cyan trail fades as bob moves
- HUD shows live θ and period values
- Smooth 60fps motion

Ctrl+C.

- [ ] **Step 4: Commit**

```bash
git add components/physics/pendulum-scene.tsx app/sandbox/page.tsx
git commit -m "feat(physics): PendulumScene canvas component (small-angle mode)"
```

---

## Task 27: FIG.01 — the basic pendulum on harmonic-motion page

**Files:**
- Create: `app/(topics)/harmonic-motion/page.mdx`

- [ ] **Step 1: Create the MDX page with FIG.01 only**

Create `/Users/romanpochtman/Developer/physics/app/(topics)/harmonic-motion/page.mdx`:

```mdx
import { TopicHeader } from "@/components/layout/topic-header";
import { Section } from "@/components/layout/section";
import { SceneCard } from "@/components/layout/scene-card";
import { HUD } from "@/components/layout/hud";
import { EquationBlock } from "@/components/math/equation-block";
import { PendulumScene } from "@/components/physics/pendulum-scene";

<main className="mx-auto max-w-[720px] px-6 pb-32">

<TopicHeader
  eyebrow="§ 01 · CLASSICAL MECHANICS"
  title="THE PENDULUM"
  subtitle="Why every clock that ever ticked ticked the same way."
/>

<Section index={1} title="The question">

In 1583, a bored nineteen-year-old sat in Pisa cathedral watching a bronze chandelier sway above his head. The breeze coming through the open doors nudged it this way and that. Sometimes it swung in a wide arc; sometimes it settled into a small one.

Galileo timed the swings against his own pulse. No matter how wide the chandelier swung, each full cycle took the same amount of time.

He had just discovered something that would define physics for four centuries.

</Section>

<Section index={2} title="The restoring force">

A pendulum, at rest, hangs straight down. If you pull it aside and let go, gravity pulls it back toward straight-down. The further you pull, the harder gravity tugs. That relationship — the force scales with the displacement — is the heart of the story.

<EquationBlock id="EQ.01">
  <span className="font-mono text-lg">F = −kx</span>
</EquationBlock>

Read it out loud: "force equals negative stiffness times displacement." The minus sign is the whole point — the force always pushes back toward zero.

<SceneCard caption="FIG.01 — the pendulum">
  <div className="flex h-80 items-center justify-center">
    <PendulumScene theta0={0.3} length={1.2} />
  </div>
</SceneCard>

</Section>

</main>
```

- [ ] **Step 2: Verify**

Run `pnpm dev`. Visit http://localhost:3000/harmonic-motion.

Expected: topic header, two sections of prose, one equation block, one swinging pendulum scene. No errors.

Ctrl+C.

- [ ] **Step 3: Commit**

```bash
git add "app/(topics)/harmonic-motion/page.mdx"
git commit -m "feat(content): harmonic-motion §1-§2 with FIG.01"
```

---

## Task 28: FIG.02 — period timing overlay

**Files:**
- Modify: `components/physics/pendulum-scene.tsx`
- Modify: `app/(topics)/harmonic-motion/page.mdx`

Extend `PendulumScene` with an optional `showTimer` prop that draws a timeline bar below the pendulum and flashes a tick every full period.

- [ ] **Step 1: Extend PendulumScene with showTimer**

Replace the `PendulumSceneProps` interface in `/Users/romanpochtman/Developer/physics/components/physics/pendulum-scene.tsx` with:

```typescript
export interface PendulumSceneProps {
  theta0: number;
  length: number;
  width?: number;
  height?: number;
  bobRadius?: number;
  onState?: (state: { theta: number; period: number; t: number }) => void;
  /** Draws a timeline bar below the pendulum, flashing at each zero-crossing */
  showTimer?: boolean;
}
```

Add these two lines after the existing destructure of `{ theta0, length, ... }`:

```typescript
    showTimer = false,
```

Inside the `useAnimationFrame` `onFrame` callback, right before `onState?.(...)`, add:

```typescript
      if (showTimer) {
        const period = smallAnglePeriod(length);
        const barY = height - 20;
        const barLeft = 40;
        const barRight = width - 40;
        const barWidth = barRight - barLeft;

        // Draw background bar
        ctx.strokeStyle = "#2A3448";
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(barLeft, barY);
        ctx.lineTo(barRight, barY);
        ctx.stroke();

        // Progress fill
        const cyclesDone = t / period;
        const fractionThisCycle = cyclesDone - Math.floor(cyclesDone);
        ctx.strokeStyle = "#5BE9FF";
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(barLeft, barY);
        ctx.lineTo(barLeft + barWidth * fractionThisCycle, barY);
        ctx.stroke();

        // Ticks at integer cycle boundaries (flashing for 0.2s after each)
        const completedCycles = Math.floor(cyclesDone);
        for (let c = 1; c <= completedCycles; c++) {
          const x = barLeft + barWidth * (c / Math.max(1, completedCycles));
          const ageOfTick = t - c * period;
          const alpha = ageOfTick < 0.2 ? 1 : 0.4;
          ctx.strokeStyle = `rgba(91, 233, 255, ${alpha})`;
          ctx.beginPath();
          ctx.moveTo(x, barY - 6);
          ctx.lineTo(x, barY + 6);
          ctx.stroke();
        }
      }
```

- [ ] **Step 2: Add FIG.02 section to the MDX page**

Append to `/Users/romanpochtman/Developer/physics/app/(topics)/harmonic-motion/page.mdx`, right before the final closing `</main>` tag:

```mdx
<Section index={3} title="The rhythm">

The thing Galileo heard in his pulse had a name: the **period**, the time it takes the pendulum to complete one full swing and return. For a small-angle pendulum of length L, that time works out to:

<EquationBlock id="EQ.02">
  <span className="font-mono text-lg">T = 2π √(L / g)</span>
</EquationBlock>

Notice what's not in that equation: the mass of the bob, the initial amplitude, the color of the string. Only the length matters.

<SceneCard caption="FIG.02 — one full period">
  <div className="flex h-96 items-center justify-center">
    <PendulumScene theta0={0.25} length={1.2} showTimer />
  </div>
</SceneCard>

</Section>
```

- [ ] **Step 3: Verify**

Run `pnpm dev`. Visit http://localhost:3000/harmonic-motion.

Expected:
- §3 section added
- Second pendulum has a timeline bar below it
- Bar fills cyan as the pendulum swings through one period
- Cyan ticks appear at period boundaries and briefly flash

Ctrl+C.

- [ ] **Step 4: Commit**

```bash
git add components/physics/pendulum-scene.tsx "app/(topics)/harmonic-motion/page.mdx"
git commit -m "feat: FIG.02 period timing overlay on pendulum scene"
```

---

## Task 29: FIG.03 — three pendulums money shot

**Files:**
- Modify: `app/(topics)/harmonic-motion/page.mdx`

Three `PendulumScene` components side by side, same length (same period), different amplitudes. They should stay in sync because period depends only on L/g.

Per the spec's polish note, we add a tiny initial phase offset that decays so the eye is drawn to the synchronization. That's implementable by adding a `phaseOffset` prop to the scene, but for v0 simplicity we start them in sync and rely on the visual.

- [ ] **Step 1: Append §4 with three pendulums**

Append to `/Users/romanpochtman/Developer/physics/app/(topics)/harmonic-motion/page.mdx`, right before the final `</main>`:

```mdx
<Section index={4} title="The surprise">

Here is the thing that blew Galileo's mind, and should blow ours. Take three pendulums. Give them different masses. Pull them to different angles — one gentle, one moderate, one wild. Let them go.

Watch what happens.

<div className="-mx-32 my-16">
<div className="grid grid-cols-3 gap-4">

<SceneCard caption="FIG.03a — 1 kg · 10°">
  <div className="flex h-80 items-center justify-center">
    <PendulumScene theta0={(10 * Math.PI) / 180} length={1.2} width={260} height={300} />
  </div>
</SceneCard>

<SceneCard caption="FIG.03b — 3 kg · 25°">
  <div className="flex h-80 items-center justify-center">
    <PendulumScene theta0={(25 * Math.PI) / 180} length={1.2} width={260} height={300} bobRadius={14} />
  </div>
</SceneCard>

<SceneCard caption="FIG.03c — 10 kg · 40°">
  <div className="flex h-80 items-center justify-center">
    <PendulumScene theta0={(40 * Math.PI) / 180} length={1.2} width={260} height={300} bobRadius={18} />
  </div>
</SceneCard>

</div>
</div>

Different masses. Different amplitudes. Same length. And they swing in perfect lockstep, crossing the center at exactly the same moment, swing after swing after swing.

The period depends only on L and g. Galileo saw it in a chandelier in 1583. Isaac Newton explained it, eighty years later.

</Section>
```

- [ ] **Step 2: Verify**

Run `pnpm dev`. Visit http://localhost:3000/harmonic-motion.

Expected:
- §4 section with three side-by-side pendulum scenes
- Each has a different amplitude and bob size
- All three cross the center at the same time, visibly synchronized
- Prose explains the significance

If the three pendulums drift out of sync it's a timing bug — they share the same length so they must share the same period. Check that `length={1.2}` is identical in all three.

Ctrl+C.

- [ ] **Step 3: Commit**

```bash
git add "app/(topics)/harmonic-motion/page.mdx"
git commit -m "feat: FIG.03 three pendulums money shot in §4"
```

---

## Task 30: FIG.04 — phase portrait (JSXGraph)

**Files:**
- Create: `components/physics/phase-portrait.tsx`
- Modify: `app/(topics)/harmonic-motion/page.mdx`

- [ ] **Step 1: Create the PhasePortrait component**

Create `/Users/romanpochtman/Developer/physics/components/physics/phase-portrait.tsx`:

```typescript
"use client";

import { useEffect, useRef } from "react";
import {
  smallAngleTheta,
  smallAngleThetaDot,
  smallAnglePeriod,
} from "@/lib/physics/pendulum";
import { useAnimationFrame } from "@/lib/animation/use-animation-frame";

type JXG = typeof import("jsxgraph");

export interface PhasePortraitProps {
  theta0: number;
  length: number;
  width?: number;
  height?: number;
}

export function PhasePortrait({
  theta0,
  length,
  width = 480,
  height = 360,
}: PhasePortraitProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const boardRef = useRef<any>(null);
  const pointRef = useRef<any>(null);
  const jxgRef = useRef<JXG | null>(null);

  // Initialize JSXGraph board on mount
  useEffect(() => {
    let cancelled = false;

    (async () => {
      const JXG = (await import("jsxgraph")).default;
      jxgRef.current = JXG as unknown as JXG;

      if (cancelled || !containerRef.current) return;
      if (!containerRef.current.id) {
        containerRef.current.id = `phase-portrait-${Math.random().toString(36).slice(2)}`;
      }

      const omega = Math.sqrt(9.80665 / length);
      const vMax = theta0 * omega;
      const margin = 1.3;

      const board = JXG.JSXGraph.initBoard(containerRef.current.id, {
        boundingbox: [-theta0 * margin, vMax * margin, theta0 * margin, -vMax * margin],
        axis: true,
        showNavigation: false,
        showCopyright: false,
        keepAspectRatio: false,
        defaultAxes: {
          x: { name: "x (rad)", withLabel: true, strokeColor: "#5B6B86" },
          y: { name: "v (rad/s)", withLabel: true, strokeColor: "#5B6B86" },
        },
      });

      // Background ellipse trace (the full phase-space orbit)
      const curve = board.create(
        "curve",
        [
          (t: number) => theta0 * Math.cos(t),
          (t: number) => -theta0 * omega * Math.sin(t),
          0,
          2 * Math.PI,
        ],
        { strokeColor: "#5BE9FF", strokeWidth: 2, strokeOpacity: 0.6 },
      );

      // Animating point
      const pt = board.create("point", [theta0, 0], {
        name: "",
        fixed: true,
        size: 5,
        fillColor: "#5BE9FF",
        strokeColor: "#5BE9FF",
        showInfobox: false,
      });

      boardRef.current = board;
      pointRef.current = pt;
    })();

    return () => {
      cancelled = true;
      if (boardRef.current && jxgRef.current) {
        try {
          (jxgRef.current as any).JSXGraph.freeBoard(boardRef.current);
        } catch {
          // noop
        }
      }
    };
  }, [theta0, length]);

  // Drive the point via the animation frame hook
  useAnimationFrame({
    elementRef: containerRef,
    onFrame: (t) => {
      const theta = smallAngleTheta({ t, theta0, L: length });
      const thetaDot = smallAngleThetaDot({ t, theta0, L: length });
      if (pointRef.current) {
        pointRef.current.moveTo([theta, thetaDot], 0);
      }
    },
  });

  return (
    <div
      ref={containerRef}
      className="jxgbox mx-auto"
      style={{ width, height, backgroundColor: "transparent" }}
    />
  );
}
```

- [ ] **Step 2: Append §5 to the MDX page**

Append to `/Users/romanpochtman/Developer/physics/app/(topics)/harmonic-motion/page.mdx`, right before the final `</main>`:

```mdx
import { PhasePortrait } from "@/components/physics/phase-portrait";

<Section index={5} title="The shape of motion">

If you plot a pendulum's position and velocity against each other, the motion draws a perfect circle (well — an ellipse, if the units disagree). Every swing retraces the same curve.

This curve has a name. It's called a **phase portrait**, and it's the shape of every oscillator that ever existed.

<SceneCard caption="FIG.04 — phase portrait">
  <div className="flex h-96 items-center justify-center">
    <PhasePortrait theta0={0.3} length={1.2} />
  </div>
</SceneCard>

</Section>
```

- [ ] **Step 3: Verify**

Run `pnpm dev`. Visit http://localhost:3000/harmonic-motion.

Expected: new §5 with a phase-space plot. The axes are labeled `x (rad)` and `v (rad/s)`. A cyan ellipse is drawn, and a cyan point traces around the ellipse as the pendulum's virtual state evolves.

If JSXGraph errors about `window` during SSR, the dynamic `import("jsxgraph")` inside `useEffect` should have prevented that; verify the file begins with `"use client";`.

Ctrl+C.

- [ ] **Step 4: Commit**

```bash
git add components/physics/phase-portrait.tsx "app/(topics)/harmonic-motion/page.mdx"
git commit -m "feat: FIG.04 phase portrait via JSXGraph in §5"
```

---

## Task 31: FIG.05 — small vs large angle comparison

**Files:**
- Modify: `components/physics/pendulum-scene.tsx`
- Modify: `app/(topics)/harmonic-motion/page.mdx`

Add an optional `exact` mode to `PendulumScene` that integrates the nonlinear ODE via `largeAngleSolve` and plays back the precomputed samples.

- [ ] **Step 1: Extend PendulumScene**

In `/Users/romanpochtman/Developer/physics/components/physics/pendulum-scene.tsx`:

Add to `PendulumSceneProps`:

```typescript
  /** If true, integrates the full nonlinear ODE instead of small-angle. */
  exact?: boolean;
```

Add `exact = false,` to the destructure.

At the top of the component body (before `useAnimationFrame`), add:

```typescript
  const exactSamplesRef = useRef<
    ReturnType<typeof import("@/lib/physics/pendulum").largeAngleSolve> | null
  >(null);

  useEffect(() => {
    if (!exact) {
      exactSamplesRef.current = null;
      return;
    }
    let cancelled = false;
    (async () => {
      const { largeAngleSolve, exactLargeAnglePeriod } = await import(
        "@/lib/physics/pendulum"
      );
      const T = exactLargeAnglePeriod(theta0, length);
      // Integrate across 3 periods at 300 samples/period for smooth playback
      const samples = largeAngleSolve({
        theta0,
        L: length,
        tEnd: 3 * T,
        nSamples: 900,
      });
      if (!cancelled) exactSamplesRef.current = samples;
    })();
    return () => {
      cancelled = true;
    };
  }, [exact, theta0, length]);
```

Add this import at the top of the file:

```typescript
import { useEffect } from "react";
```

(Make sure the existing `useRef, useState` import is merged with `useEffect`.)

Inside `onFrame`, replace the line that computes `theta` with:

```typescript
      // Compute angle
      let theta: number;
      let period: number;
      if (exact && exactSamplesRef.current && exactSamplesRef.current.length > 0) {
        const samples = exactSamplesRef.current;
        const tWrap = t % samples[samples.length - 1]!.t;
        // Find nearest sample (linear scan is fine at 900 samples)
        let i = 0;
        while (i < samples.length - 1 && samples[i + 1]!.t < tWrap) i++;
        theta = samples[i]!.theta;
        // Period = full sample span / 3 (we integrated 3 periods)
        period = samples[samples.length - 1]!.t / 3;
      } else {
        theta = reducedMotion
          ? theta0
          : smallAngleTheta({ t, theta0, L: length });
        period = smallAnglePeriod(length);
      }
```

- [ ] **Step 2: Append §6 to the MDX page**

Append to `/Users/romanpochtman/Developer/physics/app/(topics)/harmonic-motion/page.mdx`, right before the final `</main>`:

```mdx
<Section index={6} title="Where it breaks">

All of this rests on one quiet assumption: that the angle is small. Small enough that sin θ ≈ θ. Below maybe fifteen degrees, the approximation is invisible. But pull the pendulum up past forty-five degrees, past sixty, past seventy, and the symmetry starts to fail.

The full equation — the honest one — is this:

<EquationBlock id="EQ.03">
  <span className="font-mono text-lg">θ″ = −(g/L) · sin θ</span>
</EquationBlock>

There's no closed-form elementary solution. At large angles, the period stretches with amplitude. The clock slows down.

<SceneCard caption="FIG.05 — small vs large angle">
  <div className="grid grid-cols-2 gap-6">
    <div>
      <div className="mb-2 text-center font-mono text-xs uppercase text-[var(--color-fg-2)]">
        10° · T ≈ 2.20 s
      </div>
      <PendulumScene theta0={(10 * Math.PI) / 180} length={1.2} width={280} height={320} />
    </div>
    <div>
      <div className="mb-2 text-center font-mono text-xs uppercase text-[var(--color-magenta)]">
        80° · T ≈ 2.52 s
      </div>
      <PendulumScene theta0={(80 * Math.PI) / 180} length={1.2} width={280} height={320} exact />
    </div>
  </div>
</SceneCard>

Watch carefully. The small-angle pendulum on the left keeps perfect time. The large-angle pendulum on the right slowly falls behind.

</Section>

<Section index={7} title="Why it matters">

This equation — the simple harmonic oscillator — is everywhere. Every clock pendulum, every spring, every LC circuit, every vibrating string, every tuning fork, every atom in a crystal, every mode of every quantum field. All of it reduces to "force proportional to displacement, back toward zero."

Galileo found it in a chandelier. Huygens turned it into a clock in 1656. Foucault used it to prove the Earth rotates in 1851. It's the mathematical seed of every wave in the universe.

And it isn't the only thing that repeats.

</Section>
```

- [ ] **Step 3: Verify**

Run `pnpm dev`. Visit http://localhost:3000/harmonic-motion.

Expected:
- §6 with side-by-side 10° and 80° pendulums
- The 80° pendulum swings through a clearly wider arc
- §7 closing section

Ctrl+C.

- [ ] **Step 4: Commit**

```bash
git add components/physics/pendulum-scene.tsx "app/(topics)/harmonic-motion/page.mdx"
git commit -m "feat: FIG.05 small vs large angle, §6-§7 complete harmonic-motion page"
```

---

## Task 32: Write the full prose for harmonic-motion page

**Files:**
- Modify: `app/(topics)/harmonic-motion/page.mdx`

Phases 27-31 stubbed the prose. This task reviews the prose and tightens it to hit the ~900-1100 word target with the voice established in the spec (Kurzgesagt meets Stripe docs, curious adult audience, no calculus assumed).

- [ ] **Step 1: Review current word count**

Run:
```bash
wc -w "app/(topics)/harmonic-motion/page.mdx"
```

Note the current count. If it's already in range, skip to Step 3.

- [ ] **Step 2: Tighten the prose**

Read through the MDX file and apply these edits if needed:
- §1 should set the scene in 2-3 short paragraphs, no math
- §2 should explain restoring force intuitively, then show EQ.01 with a plain-language translation
- §3 should introduce "period" as a word, then show EQ.02
- §4 is the money shot — let the figures do the work, keep prose minimal
- §5 introduces phase space in 2 paragraphs max
- §6 is the honesty section, includes EQ.03
- §7 closes with significance

No placeholders. Every sentence should be written.

- [ ] **Step 3: Re-check word count**

```bash
wc -w "app/(topics)/harmonic-motion/page.mdx"
```

Target: 900-1300 words of body prose (not counting MDX syntax and JSX). Close enough is fine.

- [ ] **Step 4: Commit**

```bash
git add "app/(topics)/harmonic-motion/page.mdx"
git commit -m "content: tighten harmonic-motion prose to voice and word-count targets"
```

---

## Task 33: OrbitScene component

**Files:**
- Create: `components/physics/orbit-scene.tsx`

Canvas-based Keplerian orbit renderer, driven by `lib/physics/kepler.ts`.

- [ ] **Step 1: Create the component**

Create `/Users/romanpochtman/Developer/physics/components/physics/orbit-scene.tsx`:

```typescript
"use client";

import { useRef } from "react";
import { orbitPosition } from "@/lib/physics/kepler";
import { useAnimationFrame } from "@/lib/animation/use-animation-frame";

export interface OrbitSceneProps {
  /** Semi-major axis in display units */
  a: number;
  /** Eccentricity [0, 1) */
  e: number;
  /** Orbital period in seconds of wall time (display period, not physical) */
  T: number;
  width?: number;
  height?: number;
  onState?: (state: { t: number; r: number; theta: number }) => void;
}

export function OrbitScene({
  a,
  e,
  T,
  width = 600,
  height = 400,
  onState,
}: OrbitSceneProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const trailRef = useRef<Array<{ x: number; y: number; age: number }>>([]);

  useAnimationFrame({
    elementRef: containerRef,
    onFrame: (t, dt) => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      const dpr = window.devicePixelRatio || 1;
      if (canvas.width !== width * dpr || canvas.height !== height * dpr) {
        canvas.width = width * dpr;
        canvas.height = height * dpr;
        ctx.scale(dpr, dpr);
      }

      const p = orbitPosition({ t, a, e, T });

      // Map simulation coordinates to canvas coordinates.
      // Center of ellipse sits at (-a*e, 0) in sim coords; focus (sun) is at origin.
      // We want the sun at canvas center.
      const scale = Math.min(width, height) / (2.5 * a);
      const cx = width / 2;
      const cy = height / 2;
      const px = cx + p.x * scale;
      const py = cy - p.y * scale; // flip y

      // Update trail
      trailRef.current.forEach((q) => (q.age += dt));
      trailRef.current = trailRef.current.filter((q) => q.age < 3);
      trailRef.current.push({ x: px, y: py, age: 0 });
      if (trailRef.current.length > 200) trailRef.current.shift();

      ctx.clearRect(0, 0, width, height);

      // Draw ellipse outline (center at canvas-offset-by-c, where c = a*e)
      const bSim = a * Math.sqrt(1 - e * e);
      const ellipseCenterX = cx + -a * e * scale;
      const ellipseCenterY = cy;
      ctx.strokeStyle = "rgba(91, 233, 255, 0.35)";
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.ellipse(
        ellipseCenterX,
        ellipseCenterY,
        a * scale,
        bSim * scale,
        0,
        0,
        Math.PI * 2,
      );
      ctx.stroke();

      // Draw sun at focus
      ctx.shadowColor = "rgba(91, 233, 255, 0.8)";
      ctx.shadowBlur = 20;
      ctx.fillStyle = "#5BE9FF";
      ctx.beginPath();
      ctx.arc(cx, cy, 8, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0;

      // Draw trail
      for (const q of trailRef.current) {
        const alpha = Math.max(0, 1 - q.age / 3) * 0.5;
        ctx.fillStyle = `rgba(91, 233, 255, ${alpha})`;
        ctx.beginPath();
        ctx.arc(q.x, q.y, 2, 0, Math.PI * 2);
        ctx.fill();
      }

      // Draw planet
      ctx.fillStyle = "#E6EDF7";
      ctx.beginPath();
      ctx.arc(px, py, 5, 0, Math.PI * 2);
      ctx.fill();

      onState?.({ t, r: p.r, theta: p.theta });
    },
  });

  return (
    <div ref={containerRef} style={{ width, height }} className="mx-auto">
      <canvas ref={canvasRef} style={{ width, height }} className="block" />
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add components/physics/orbit-scene.tsx
git commit -m "feat(physics): OrbitScene canvas renderer driven by Kepler solver"
```

---

## Task 34: EllipseConstruction component (FIG.01, JSXGraph)

**Files:**
- Create: `components/physics/ellipse-construction.tsx`

Interactive JSXGraph ellipse where a point P traces the ellipse and two segments PF1 and PF2 are drawn from the foci.

- [ ] **Step 1: Create the component**

Create `/Users/romanpochtman/Developer/physics/components/physics/ellipse-construction.tsx`:

```typescript
"use client";

import { useEffect, useRef, useState } from "react";
import { useAnimationFrame } from "@/lib/animation/use-animation-frame";

export interface EllipseConstructionProps {
  /** Semi-major axis */
  a?: number;
  /** Eccentricity */
  e?: number;
  /** Orbit period in wall-time seconds for the tracer */
  T?: number;
  width?: number;
  height?: number;
}

export function EllipseConstruction({
  a = 1,
  e = 0.5,
  T = 12,
  width = 620,
  height = 380,
}: EllipseConstructionProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const boardRef = useRef<any>(null);
  const ptRef = useRef<any>(null);
  const seg1Ref = useRef<any>(null);
  const seg2Ref = useRef<any>(null);
  const jxgRef = useRef<any>(null);

  const [readout, setReadout] = useState({ d1: 0, d2: 0 });

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const JXG = (await import("jsxgraph")).default;
      jxgRef.current = JXG;

      if (cancelled || !containerRef.current) return;
      if (!containerRef.current.id) {
        containerRef.current.id = `ellipse-${Math.random().toString(36).slice(2)}`;
      }

      const c = a * e;
      const b = a * Math.sqrt(1 - e * e);
      const pad = 1.3;

      const board = JXG.JSXGraph.initBoard(containerRef.current.id, {
        boundingbox: [-a * pad - c, b * pad, a * pad - c, -b * pad],
        axis: false,
        showNavigation: false,
        showCopyright: false,
        keepAspectRatio: true,
      });

      // Draw ellipse
      board.create(
        "curve",
        [
          (t: number) => a * Math.cos(t) - c,
          (t: number) => b * Math.sin(t),
          0,
          2 * Math.PI,
        ],
        { strokeColor: "#5BE9FF", strokeWidth: 2 },
      );

      // Foci: F1 is the sun-focus at origin (which is +c from ellipse center)
      // With our ellipse centered at (-c, 0), origin is the right focus.
      board.create("point", [0, 0], {
        name: "F₁",
        fixed: true,
        size: 4,
        fillColor: "#5BE9FF",
        strokeColor: "#5BE9FF",
        label: {
          offset: [8, 8],
          fontSize: 12,
          strokeColor: "#9FB0C8",
          cssClass: "font-mono",
        },
      });
      board.create("point", [-2 * c, 0], {
        name: "F₂",
        fixed: true,
        size: 4,
        fillColor: "#5B6B86",
        strokeColor: "#5B6B86",
        label: {
          offset: [8, 8],
          fontSize: 12,
          strokeColor: "#9FB0C8",
          cssClass: "font-mono",
        },
      });

      // Tracer point P
      const pt = board.create("point", [a - c, 0], {
        name: "P",
        fixed: true,
        size: 5,
        fillColor: "#E6EDF7",
        strokeColor: "#E6EDF7",
        showInfobox: false,
        label: { fontSize: 12, strokeColor: "#E6EDF7" },
      });

      const seg1 = board.create(
        "segment",
        [[0, 0], pt],
        { strokeColor: "#5BE9FF", strokeWidth: 1.5 },
      );
      const seg2 = board.create(
        "segment",
        [[-2 * c, 0], pt],
        { strokeColor: "#5B6B86", strokeWidth: 1.5 },
      );

      boardRef.current = board;
      ptRef.current = pt;
      seg1Ref.current = seg1;
      seg2Ref.current = seg2;
    })();
    return () => {
      cancelled = true;
      if (boardRef.current && jxgRef.current) {
        try {
          jxgRef.current.JSXGraph.freeBoard(boardRef.current);
        } catch {
          // noop
        }
      }
    };
  }, [a, e]);

  useAnimationFrame({
    elementRef: containerRef,
    onFrame: (t) => {
      if (!ptRef.current) return;
      const c = a * e;
      const b = a * Math.sqrt(1 - e * e);
      // Parametric ellipse, uniform angular speed (for visualization, not Keplerian)
      const phase = (t / T) * 2 * Math.PI;
      const px = a * Math.cos(phase) - c;
      const py = b * Math.sin(phase);
      ptRef.current.moveTo([px, py], 0);
      // Update readout
      const d1 = Math.hypot(px - 0, py - 0);
      const d2 = Math.hypot(px - -2 * c, py - 0);
      setReadout({ d1, d2 });
    },
  });

  return (
    <div className="flex flex-col items-center gap-3">
      <div
        ref={containerRef}
        className="jxgbox"
        style={{ width, height, backgroundColor: "transparent" }}
      />
      <div className="font-mono text-xs text-[var(--color-fg-1)]">
        |PF₁| = {readout.d1.toFixed(3)} · |PF₂| = {readout.d2.toFixed(3)} · sum ={" "}
        {(readout.d1 + readout.d2).toFixed(3)}
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add components/physics/ellipse-construction.tsx
git commit -m "feat(physics): EllipseConstruction JSXGraph component for FIG.01"
```

---

## Task 35: SweepAreas component (FIG.02 money shot)

**Files:**
- Create: `components/physics/sweep-areas.tsx`

This is the spec's Kepler money shot. At every `T/6`, freeze the current wedge and fill it with magenta. After one full orbit, six visibly-unequal wedges all represent the same area.

- [ ] **Step 1: Create the component**

Create `/Users/romanpochtman/Developer/physics/components/physics/sweep-areas.tsx`:

```typescript
"use client";

import { useRef, useState } from "react";
import { orbitPosition, sweptArea } from "@/lib/physics/kepler";
import { useAnimationFrame } from "@/lib/animation/use-animation-frame";

export interface SweepAreasProps {
  /** Semi-major axis */
  a?: number;
  /** Eccentricity */
  e?: number;
  /** Orbit wall time in seconds */
  T?: number;
  /** Number of wedges */
  wedges?: number;
  width?: number;
  height?: number;
}

interface FrozenWedge {
  /** Sun-to-planet polyline points in canvas coords */
  points: Array<{ x: number; y: number }>;
  /** Area in AU^2 */
  area: number;
}

export function SweepAreas({
  a = 1,
  e = 0.6,
  T = 18,
  wedges = 6,
  width = 640,
  height = 440,
}: SweepAreasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const trailRef = useRef<Array<{ x: number; y: number; age: number }>>([]);
  const frozenRef = useRef<FrozenWedge[]>([]);
  const currentWedgeRef = useRef<Array<{ x: number; y: number; px: number; py: number }>>([]);
  const cycleStartRef = useRef<number>(0);
  const [areas, setAreas] = useState<number[]>([]);

  // Map sim (x,y) to canvas (px, py); sun at canvas center
  const scale = Math.min(width, height) / (2.6 * a);
  const cx = width / 2;
  const cy = height / 2;
  const toCanvas = (x: number, y: number) => ({
    x: cx + x * scale,
    y: cy - y * scale,
  });

  useAnimationFrame({
    elementRef: containerRef,
    onFrame: (t, dt) => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;
      const dpr = window.devicePixelRatio || 1;
      if (canvas.width !== width * dpr || canvas.height !== height * dpr) {
        canvas.width = width * dpr;
        canvas.height = height * dpr;
        ctx.scale(dpr, dpr);
      }

      // Time within current orbit
      const tCycle = t - cycleStartRef.current;
      const p = orbitPosition({ t: tCycle, a, e, T });
      const pc = toCanvas(p.x, p.y);

      // Track wedge path
      currentWedgeRef.current.push({
        x: p.x,
        y: p.y,
        px: pc.x,
        py: pc.y,
      });

      // Check if we've crossed a wedge boundary (T/wedges)
      const wedgeDuration = T / wedges;
      const wedgeIndex = Math.floor(tCycle / wedgeDuration);
      const nextWedgeStartTime = (wedgeIndex + 1) * wedgeDuration;
      if (wedgeIndex < wedges && frozenRef.current.length < wedgeIndex) {
        // We just crossed boundary wedgeIndex; freeze the wedge that just ended
        const endedIdx = frozenRef.current.length;
        const startTime = endedIdx * wedgeDuration;
        const endTime = (endedIdx + 1) * wedgeDuration;
        const area = sweptArea({ t1: startTime, t2: endTime, a, e, T });
        frozenRef.current.push({
          points: currentWedgeRef.current.map((pt) => ({ x: pt.px, y: pt.py })),
          area,
        });
        setAreas(frozenRef.current.map((w) => w.area));
        // Start new wedge from the last point
        const last = currentWedgeRef.current[currentWedgeRef.current.length - 1];
        currentWedgeRef.current = last ? [last] : [];
      }

      // If we completed an orbit, reset for next loop after a 2s pause
      if (tCycle > T + 2) {
        cycleStartRef.current = t;
        frozenRef.current = [];
        currentWedgeRef.current = [];
        trailRef.current = [];
        setAreas([]);
      }

      // Update trail
      trailRef.current.forEach((q) => (q.age += dt));
      trailRef.current = trailRef.current.filter((q) => q.age < 4);
      trailRef.current.push({ x: pc.x, y: pc.y, age: 0 });
      if (trailRef.current.length > 300) trailRef.current.shift();

      ctx.clearRect(0, 0, width, height);

      // Ellipse outline
      const bSim = a * Math.sqrt(1 - e * e);
      const c = a * e;
      ctx.strokeStyle = "rgba(91, 233, 255, 0.35)";
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.ellipse(cx - c * scale, cy, a * scale, bSim * scale, 0, 0, Math.PI * 2);
      ctx.stroke();

      // Frozen wedges (magenta filled)
      ctx.fillStyle = "rgba(255, 79, 216, 0.3)";
      ctx.strokeStyle = "rgba(255, 79, 216, 0.6)";
      ctx.lineWidth = 1;
      for (const wedge of frozenRef.current) {
        if (wedge.points.length < 2) continue;
        ctx.beginPath();
        ctx.moveTo(cx, cy);
        for (const pt of wedge.points) ctx.lineTo(pt.x, pt.y);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
      }

      // Trail
      for (const q of trailRef.current) {
        const alpha = Math.max(0, 1 - q.age / 4) * 0.5;
        ctx.fillStyle = `rgba(91, 233, 255, ${alpha})`;
        ctx.beginPath();
        ctx.arc(q.x, q.y, 2, 0, Math.PI * 2);
        ctx.fill();
      }

      // Sun
      ctx.shadowColor = "rgba(91, 233, 255, 0.8)";
      ctx.shadowBlur = 24;
      ctx.fillStyle = "#5BE9FF";
      ctx.beginPath();
      ctx.arc(cx, cy, 10, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0;

      // Planet
      ctx.fillStyle = "#E6EDF7";
      ctx.beginPath();
      ctx.arc(pc.x, pc.y, 6, 0, Math.PI * 2);
      ctx.fill();
    },
  });

  return (
    <div className="flex flex-col items-center gap-4">
      <div ref={containerRef} style={{ width, height }}>
        <canvas ref={canvasRef} style={{ width, height }} className="block" />
      </div>
      <div className="font-mono text-xs text-[var(--color-fg-1)]">
        {areas.length === 0
          ? "watching orbit…"
          : areas.map((A, i) => `A${i + 1} = ${A.toFixed(3)}`).join("  ·  ")}
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add components/physics/sweep-areas.tsx
git commit -m "feat(physics): SweepAreas component — Kepler 2nd law money shot"
```

---

## Task 36: HarmonyTable + log-log plot (FIG.03)

**Files:**
- Create: `components/physics/harmony-table.tsx`

- [ ] **Step 1: Create the component**

Create `/Users/romanpochtman/Developer/physics/components/physics/harmony-table.tsx`:

```typescript
"use client";

import { useEffect, useRef } from "react";

const PLANETS = [
  { name: "Mercury", a: 0.387, T: 0.2408 },
  { name: "Earth", a: 1.0, T: 1.0 },
  { name: "Mars", a: 1.524, T: 1.881 },
  { name: "Jupiter", a: 5.203, T: 11.862 },
] as const;

export function HarmonyTable() {
  const plotRef = useRef<HTMLDivElement>(null);
  const boardRef = useRef<any>(null);
  const jxgRef = useRef<any>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const JXG = (await import("jsxgraph")).default;
      jxgRef.current = JXG;
      if (cancelled || !plotRef.current) return;
      if (!plotRef.current.id) {
        plotRef.current.id = `harmony-${Math.random().toString(36).slice(2)}`;
      }

      const board = JXG.JSXGraph.initBoard(plotRef.current.id, {
        boundingbox: [-1.5, 2.5, 2, -1.5], // log10 space
        axis: true,
        showNavigation: false,
        showCopyright: false,
        defaultAxes: {
          x: { name: "log₁₀ a (AU)", withLabel: true, strokeColor: "#5B6B86" },
          y: { name: "log₁₀ T (yr)", withLabel: true, strokeColor: "#5B6B86" },
        },
      });

      // Line T = a^(3/2) in log-log is log T = 1.5 log a
      board.create(
        "functiongraph",
        [(x: number) => 1.5 * x, -1.5, 2],
        { strokeColor: "#5BE9FF", strokeWidth: 1.5 },
      );

      // Data points
      for (const p of PLANETS) {
        const x = Math.log10(p.a);
        const y = Math.log10(p.T);
        board.create("point", [x, y], {
          name: p.name,
          size: 4,
          fillColor: "#FF4FD8",
          strokeColor: "#FF4FD8",
          fixed: true,
          label: {
            offset: [8, 8],
            fontSize: 11,
            strokeColor: "#9FB0C8",
            cssClass: "font-mono",
          },
        });
      }

      boardRef.current = board;
    })();
    return () => {
      cancelled = true;
      if (boardRef.current && jxgRef.current) {
        try {
          jxgRef.current.JSXGraph.freeBoard(boardRef.current);
        } catch {
          // noop
        }
      }
    };
  }, []);

  return (
    <div className="flex flex-col gap-8">
      <table className="w-full border-collapse font-mono text-sm">
        <thead>
          <tr className="border-b border-[var(--color-fg-3)]">
            <th className="py-2 text-left uppercase text-[var(--color-fg-2)]">
              Planet
            </th>
            <th className="py-2 text-right uppercase text-[var(--color-fg-2)]">
              a (AU)
            </th>
            <th className="py-2 text-right uppercase text-[var(--color-fg-2)]">
              T (yr)
            </th>
            <th className="py-2 text-right uppercase text-[var(--color-cyan)]">
              T² / a³
            </th>
          </tr>
        </thead>
        <tbody>
          {PLANETS.map((p) => {
            const ratio = (p.T * p.T) / (p.a * p.a * p.a);
            return (
              <tr
                key={p.name}
                className="border-b border-[var(--color-fg-3)]/40"
              >
                <td className="py-2 text-[var(--color-fg-0)]">{p.name}</td>
                <td className="py-2 text-right text-[var(--color-fg-1)]">
                  {p.a.toFixed(3)}
                </td>
                <td className="py-2 text-right text-[var(--color-fg-1)]">
                  {p.T.toFixed(3)}
                </td>
                <td className="py-2 text-right font-semibold text-[var(--color-cyan)]">
                  {ratio.toFixed(3)}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>

      <div
        ref={plotRef}
        className="jxgbox mx-auto"
        style={{ width: 560, height: 360, backgroundColor: "transparent" }}
      />
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add components/physics/harmony-table.tsx
git commit -m "feat(physics): HarmonyTable with log-log plot — Kepler 3rd law"
```

---

## Task 37: InverseSquareScene (FIG.04)

**Files:**
- Create: `components/physics/inverse-square-scene.tsx`

Single orbit, with a force vector drawn from planet to sun, length proportional to `1/r²`.

- [ ] **Step 1: Create the component**

Create `/Users/romanpochtman/Developer/physics/components/physics/inverse-square-scene.tsx`:

```typescript
"use client";

import { useRef, useState } from "react";
import { orbitPosition } from "@/lib/physics/kepler";
import { useAnimationFrame } from "@/lib/animation/use-animation-frame";

export interface InverseSquareSceneProps {
  a?: number;
  e?: number;
  T?: number;
  width?: number;
  height?: number;
}

export function InverseSquareScene({
  a = 1,
  e = 0.5,
  T = 16,
  width = 600,
  height = 400,
}: InverseSquareSceneProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [readout, setReadout] = useState({ r: 0, F: 0 });

  useAnimationFrame({
    elementRef: containerRef,
    onFrame: (t) => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;
      const dpr = window.devicePixelRatio || 1;
      if (canvas.width !== width * dpr || canvas.height !== height * dpr) {
        canvas.width = width * dpr;
        canvas.height = height * dpr;
        ctx.scale(dpr, dpr);
      }

      const p = orbitPosition({ t, a, e, T });
      const scale = Math.min(width, height) / (2.6 * a);
      const cx = width / 2;
      const cy = height / 2;
      const px = cx + p.x * scale;
      const py = cy - p.y * scale;

      // Force magnitude ∝ 1/r² (relative — set so perihelion has F ≈ 3 units)
      const rRelative = p.r / a;
      const F = 1 / (rRelative * rRelative);

      ctx.clearRect(0, 0, width, height);

      // Ellipse outline
      const bSim = a * Math.sqrt(1 - e * e);
      const c = a * e;
      ctx.strokeStyle = "rgba(91, 233, 255, 0.35)";
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.ellipse(cx - c * scale, cy, a * scale, bSim * scale, 0, 0, Math.PI * 2);
      ctx.stroke();

      // Sun
      ctx.shadowColor = "rgba(91, 233, 255, 0.8)";
      ctx.shadowBlur = 20;
      ctx.fillStyle = "#5BE9FF";
      ctx.beginPath();
      ctx.arc(cx, cy, 10, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0;

      // Planet
      ctx.fillStyle = "#E6EDF7";
      ctx.beginPath();
      ctx.arc(px, py, 5, 0, Math.PI * 2);
      ctx.fill();

      // Force vector from planet toward sun, length proportional to F (capped)
      const dx = cx - px;
      const dy = cy - py;
      const dist = Math.hypot(dx, dy);
      const ux = dx / dist;
      const uy = dy / dist;
      const vectorLen = Math.min(120, 20 * F);
      const tipX = px + ux * vectorLen;
      const tipY = py + uy * vectorLen;

      // Use magenta near perihelion, cyan elsewhere
      const nearPerihelion = rRelative < 1.0;
      ctx.strokeStyle = nearPerihelion ? "#FF4FD8" : "#5BE9FF";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(px, py);
      ctx.lineTo(tipX, tipY);
      ctx.stroke();

      // Arrow head
      const angle = Math.atan2(uy, ux);
      ctx.beginPath();
      ctx.moveTo(tipX, tipY);
      ctx.lineTo(
        tipX - 8 * Math.cos(angle - Math.PI / 6),
        tipY - 8 * Math.sin(angle - Math.PI / 6),
      );
      ctx.lineTo(
        tipX - 8 * Math.cos(angle + Math.PI / 6),
        tipY - 8 * Math.sin(angle + Math.PI / 6),
      );
      ctx.closePath();
      ctx.fillStyle = nearPerihelion ? "#FF4FD8" : "#5BE9FF";
      ctx.fill();

      setReadout({ r: p.r, F });
    },
  });

  return (
    <div className="relative" style={{ width, height }} ref={containerRef}>
      <canvas ref={canvasRef} style={{ width, height }} className="block" />
      <div className="pointer-events-none absolute bottom-3 right-3 rounded-sm border border-[var(--color-fg-3)] bg-[var(--color-bg-0)]/70 px-2 py-1 font-mono text-xs text-[var(--color-fg-1)] backdrop-blur-sm">
        r = {readout.r.toFixed(2)} AU · F = {readout.F.toFixed(2)}
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add components/physics/inverse-square-scene.tsx
git commit -m "feat(physics): InverseSquareScene — force vector visualization"
```

---

## Task 38: Kepler MDX page

**Files:**
- Create: `app/(topics)/kepler/page.mdx`

- [ ] **Step 1: Create the MDX page**

Create `/Users/romanpochtman/Developer/physics/app/(topics)/kepler/page.mdx`:

```mdx
import { TopicHeader } from "@/components/layout/topic-header";
import { Section } from "@/components/layout/section";
import { SceneCard } from "@/components/layout/scene-card";
import { EquationBlock } from "@/components/math/equation-block";
import { EllipseConstruction } from "@/components/physics/ellipse-construction";
import { SweepAreas } from "@/components/physics/sweep-areas";
import { HarmonyTable } from "@/components/physics/harmony-table";
import { InverseSquareScene } from "@/components/physics/inverse-square-scene";

<main className="mx-auto max-w-[720px] px-6 pb-32">

<TopicHeader
  eyebrow="§ 02 · CLASSICAL MECHANICS"
  title="THE LAWS OF PLANETS"
  subtitle="How a German astronomer broke the sky open with three sentences."
/>

<Section index={1} title="Before Kepler">

For fifteen hundred years, astronomers believed the heavens ran on perfect circles. Ptolemy, writing in the second century, built an elaborate machine of circles-on-circles — epicycles — to make his predictions line up with reality. Copernicus, in 1543, put the sun in the middle instead of the Earth. He kept the circles.

Then Johannes Kepler, working from the astonishingly careful observations of Tycho Brahe, gave up on circles altogether. He tried everything else he could think of. After eight years of calculation, he landed on the truth.

Orbits are ellipses.

</Section>

<Section index={2} title="First law — planets move on ellipses">

An ellipse is a stretched circle with two special points inside it, called **foci**. What makes an ellipse an ellipse is that if you pick any point on the curve and draw lines to each focus, the two lengths always add to the same number.

<EquationBlock id="EQ.01">
  <span className="font-mono text-lg">r(θ) = a(1 − e²) / (1 + e · cos θ)</span>
</EquationBlock>

The number `a` is the semi-major axis — the long radius. The number `e` is the eccentricity — how "squished" the ellipse is, from zero (perfect circle) to almost one (nearly flat). Every planet's orbit is one of these shapes, with the sun sitting at one of the two foci.

<SceneCard caption="FIG.01 — the ellipse">
  <div className="flex h-[420px] items-center justify-center">
    <EllipseConstruction a={1} e={0.5} />
  </div>
</SceneCard>

</Section>

<Section index={3} title="Second law — equal areas in equal times">

Kepler noticed something else: planets don't move at constant speed. They move faster when they're closer to the sun, and slower when they're far away.

But the *area* swept by the line from the sun to the planet, per unit of time — that stays the same.

Watch it happen.

<SceneCard caption="FIG.02 — equal areas, equal times">
  <div className="flex items-center justify-center">
    <SweepAreas a={1} e={0.6} T={18} wedges={6} />
  </div>
</SceneCard>

The wedges look wildly different. Some are long and thin, some are fat and round. And yet the readout below says they're all the same area, to three decimal places.

That is Kepler's second law. It doesn't look like it should be true. It is.

</Section>

<Section index={4} title="Third law — the harmony of the worlds">

For every planet orbiting the sun, there is a single number that comes out the same.

<EquationBlock id="EQ.02">
  <span className="font-mono text-lg">T² = (4π² / GM) · a³</span>
</EquationBlock>

In plain English: the square of the orbital period, divided by the cube of the semi-major axis, is the same for every body orbiting the same star. Kepler called this the "harmony of the worlds."

<SceneCard caption="FIG.03 — the harmony">
  <div className="flex items-center justify-center">
    <HarmonyTable />
  </div>
</SceneCard>

Look at the rightmost column. Mercury, Earth, Mars, Jupiter — four worlds with nothing in common except that they orbit the same star — and the ratio `T² / a³` lines up to three decimal places. That's not curve-fitting. That's a law of nature, hiding in plain sight for every astronomer who ever looked up.

</Section>

<Section index={5} title="What Newton saw">

Kepler *described* the laws. He never explained them. That job was left to Isaac Newton, who realized — eighty years later — that if you assume a single force pulling the planet toward the sun, with magnitude proportional to one over the distance squared, you get every one of Kepler's three laws for free.

<EquationBlock id="EQ.03">
  <span className="font-mono text-lg">F = G · M · m / r²</span>
</EquationBlock>

The further the planet is from the sun, the weaker the pull — but it weakens fast, as the square of the distance. When the planet swings close, the force balloons. When it drifts far, the force barely tugs.

<SceneCard caption="FIG.04 — the inverse square in action">
  <div className="flex h-[440px] items-center justify-center">
    <InverseSquareScene a={1} e={0.5} T={16} />
  </div>
</SceneCard>

The arrow shows how hard gravity pulls. Watch it grow as the planet dives toward perihelion, and shrink as it coasts out to aphelion.

</Section>

<Section index={6} title="Why it matters">

Every artificial satellite in orbit around Earth obeys Kepler's laws. Every rocket we've ever sent to another planet used them to plan its trajectory. When Le Verrier predicted the existence of Neptune in 1846, based on perturbations in the orbit of Uranus, he used Kepler. When we find exoplanets today by watching stars wobble, we're using Kepler. When LIGO detects gravitational waves from merging black holes, the orbital decay is Kepler's laws, generalized to Einstein's gravity.

Three sentences from a half-blind mystic in 1609. Still running the universe.

</Section>

</main>
```

- [ ] **Step 2: Verify**

Run `pnpm dev`. Visit http://localhost:3000/kepler.

Expected:
- All 6 sections render
- FIG.01: ellipse with tracing point and |PF₁| + |PF₂| readout
- FIG.02: sweep areas animation — watch at least one full orbit to see the magenta wedges all equal
- FIG.03: harmony table with log-log plot below
- FIG.04: orbit with force vector that grows near perihelion

Ctrl+C.

- [ ] **Step 3: Commit**

```bash
git add "app/(topics)/kepler/page.mdx"
git commit -m "feat(content): kepler page with all 4 figures and prose"
```

---

## Task 39: Landing page

**Files:**
- Modify: `app/page.tsx`

- [ ] **Step 1: Replace with a real landing**

Replace `/Users/romanpochtman/Developer/physics/app/page.tsx` with:

```typescript
import Link from "next/link";

const TOPICS = [
  {
    href: "/harmonic-motion",
    eyebrow: "§ 01 · CLASSICAL MECHANICS",
    title: "THE PENDULUM",
    subtitle: "Why every clock that ever ticked ticked the same way.",
  },
  {
    href: "/kepler",
    eyebrow: "§ 02 · CLASSICAL MECHANICS",
    title: "THE LAWS OF PLANETS",
    subtitle: "How a German astronomer broke the sky open with three sentences.",
  },
];

export default function HomePage() {
  return (
    <main className="mx-auto max-w-[960px] px-6 pb-32 pt-8">
      <div className="mb-16">
        <div className="mb-4 font-mono text-xs uppercase tracking-[0.2em] text-[var(--color-cyan)]">
          PHYSICS · V0
        </div>
        <h1 className="mb-6 text-5xl font-bold uppercase tracking-tight text-[var(--color-fg-0)] md:text-6xl">
          Physics, explained visually.
        </h1>
        <p className="max-w-[50ch] text-lg text-[var(--color-fg-1)]">
          A small handful of topics, polished to death. Two pages in v0 —
          classical mechanics, with more to come.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {TOPICS.map((t) => (
          <Link
            key={t.href}
            href={t.href}
            className="group block border border-[var(--color-fg-3)] bg-[var(--color-bg-1)] p-8 transition-all hover:border-[var(--color-cyan)]"
          >
            <div className="mb-3 font-mono text-xs uppercase tracking-wider text-[var(--color-cyan)]">
              {t.eyebrow}
            </div>
            <h2 className="mb-3 text-3xl font-semibold text-[var(--color-fg-0)] transition-colors group-hover:text-[var(--color-cyan)]">
              {t.title}
            </h2>
            <p className="text-[var(--color-fg-1)]">{t.subtitle}</p>
          </Link>
        ))}
      </div>
    </main>
  );
}
```

- [ ] **Step 2: Verify**

Run `pnpm dev`. Visit http://localhost:3000.

Expected: landing page with two topic cards, each linking to the correct route. Cards hover-highlight with cyan border.

Ctrl+C.

- [ ] **Step 3: Commit**

```bash
git add app/page.tsx
git commit -m "feat: landing page with topic cards"
```

---

## Task 40: 404 page

**Files:**
- Create: `app/not-found.tsx`

- [ ] **Step 1: Create the 404**

Create `/Users/romanpochtman/Developer/physics/app/not-found.tsx`:

```typescript
import Link from "next/link";

export default function NotFound() {
  return (
    <main className="mx-auto max-w-[720px] px-6 py-32 text-center">
      <div className="mb-6 font-mono text-xs uppercase tracking-[0.2em] text-[var(--color-magenta)]">
        ERROR · 404
      </div>
      <h1 className="mb-6 text-5xl font-bold uppercase text-[var(--color-fg-0)]">
        A pendulum without a pivot.
      </h1>
      <p className="mb-12 text-lg text-[var(--color-fg-1)]">
        This page is missing its fixed point. Nothing to swing around.
      </p>
      <Link
        href="/"
        className="inline-block border border-[var(--color-cyan)] px-6 py-3 font-mono text-sm uppercase tracking-wider text-[var(--color-cyan)] transition-all hover:bg-[var(--color-cyan)]/10"
      >
        Return to origin
      </Link>
    </main>
  );
}
```

- [ ] **Step 2: Verify**

Run `pnpm dev`. Visit http://localhost:3000/this-does-not-exist.

Expected: 404 page matching the design system.

Ctrl+C.

- [ ] **Step 3: Commit**

```bash
git add app/not-found.tsx
git commit -m "feat: in-character 404 page"
```

---

## Task 41: Run full physics test suite + build

- [ ] **Step 1: Run all tests**

```bash
cd /Users/romanpochtman/Developer/physics
pnpm test
```

Expected: all tests pass. If any fail, debug before proceeding.

- [ ] **Step 2: Production build**

```bash
pnpm build
```

Expected: successful build with no TypeScript errors. Warnings about bundle size on the topic pages are acceptable (they're heavy because of JSXGraph + odex). If there are any errors, fix them before proceeding.

- [ ] **Step 3: Smoke-test production**

```bash
pnpm start
```

Visit http://localhost:3000. Click through landing → harmonic-motion → kepler. Expected: all pages render, all animations run. Ctrl+C.

- [ ] **Step 4: Commit any build-fix changes (if any)**

```bash
git status
# If anything changed:
git add -A
git commit -m "chore: fix build errors"
```

---

## Task 42: Deploy to Vercel

**Files:** none (CLI deploy)

- [ ] **Step 1: Install Vercel CLI if not already present**

```bash
which vercel || pnpm add -g vercel
```

- [ ] **Step 2: Push to GitHub first**

Suggest the user create a GitHub repo named `physics` and then run:

```bash
cd /Users/romanpochtman/Developer/physics
git remote add origin git@github.com:<user>/physics.git
git push -u origin main
```

This step requires user interaction (GitHub repo creation and auth). If the user wants to skip GitHub and deploy directly from local, use `vercel` instead.

- [ ] **Step 3: Deploy with Vercel CLI**

```bash
vercel --prod
```

Follow prompts. Accept defaults: project name `physics`, framework `Next.js`, no build command override.

Expected: deployment succeeds, URL printed.

- [ ] **Step 4: Manual smoke check on the deployed URL**

Visit the deployed URL. Click through all three pages. Verify animations run and pages load < 2s.

- [ ] **Step 5: No commit needed**

Vercel deploys from git. No local changes.

---

## Self-Review

Running the self-review checklist against the spec:

**Spec coverage:**
- § Vision: captured by the set of pages in Tasks 27-38.
- § v0 Scope: all pages, all figures, all tests covered. ✓
- § Architecture: folder structure locked in Tasks 1-8. ✓
- § Design System: tokens in Task 6, primitives in Tasks 17-24. ✓
- § Page 1 (Pendulum): 7 sections, 5 figures — covered by Tasks 26-32. ✓
- § Page 2 (Kepler): 6 sections, 4 figures — covered by Tasks 33-38. ✓
- § Shared Components: SceneCard, HUD, FigureLabel, EquationBlock, Callout, TopicHeader, Section, PendulumScene, OrbitScene, PhasePortrait — all covered. ✓
- § Validation & Quality Gates: unit tests in Tasks 9-15, build + smoke in Task 41. Accessibility (reduced-motion) in Task 16. ✓
- § Definition of Done: landing (Task 39) + both topic pages + all tests + deploy (Task 42) + 404 (Task 40). ✓

**Placeholder scan:** No "TBD" / "TODO" / "implement later" remain. The 900-1100 prose word count in Task 32 is a review pass on prose already drafted in Tasks 27-31, not a placeholder.

**Type consistency:**
- `smallAngleTheta` signature: `{ t, theta0, L, g? } => number` — used consistently in Tasks 11, 26, 30.
- `orbitPosition` returns `{ r, theta, x, y }` — used in Tasks 14, 33, 35, 37.
- `sweptArea({ t1, t2, a, e, T })` — used in Task 35.
- `PendulumSceneProps` grows across Tasks 26, 28, 31 (adds `showTimer`, then `exact`) — each addition is shown in the task, no surprise fields referenced later.
- `integrate({ y0, rhs, tEnd, nSamples })` → `ODESample[]` with `{ t, y }` — consistent in Tasks 10, 12.
- `solveKepler(M, e)` returning `number` or `{ E, iterations }` via overloads — consistent in Task 13, used in Task 14.

No inconsistencies found.

---

## Execution Handoff

Plan complete and saved to `/Users/romanpochtman/Developer/physics/docs/superpowers/plans/2026-04-11-physics-site-v0.md`.

Two execution options:

**1. Subagent-Driven (recommended)** — I dispatch a fresh subagent per task, review between tasks, fast iteration. Good fit for a 42-task plan because each task is small and self-contained.

**2. Inline Execution** — Execute tasks in this session using executing-plans, batch execution with checkpoints for review.

Which approach?
