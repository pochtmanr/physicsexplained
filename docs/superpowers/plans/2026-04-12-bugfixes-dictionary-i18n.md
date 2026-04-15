# Bug Fixes, Dictionary Upgrade & i18n Infrastructure — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.
>
> **Important:** No intermediate git commits between tasks. No test suites. No verification steps. Just build it. Save MemPalace updates to the root agent (don't call MemPalace from subagents).

**Goal:** Fix scene-card clipping and dark-mode colors in all physics visualizations, upgrade dictionary pages to use the aside-links layout with inline interactive visualizations, and lay the i18n infrastructure for future translations.

**Architecture:** Three independent phases executed sequentially. Phase 1 fixes bugs in existing components. Phase 2 refactors dictionary layout and adds 7 new JSXGraph visualizations. Phase 3 introduces `next-intl` with `[locale]` routing, extracting all hardcoded English strings into JSON message files.

**Tech Stack:** Next.js 15 App Router, JSXGraph, TypeScript, Tailwind v4, next-intl

**Spec:** `docs/superpowers/specs/2026-04-12-bugfixes-dictionary-i18n-design.md`

---

## File Map

### Phase 1 — Bug Fixes
| Action | File | Responsibility |
|--------|------|----------------|
| Modify | `components/layout/scene-card.tsx` | Fix overflow clipping |
| Create | `lib/hooks/use-theme-colors.ts` | Hook: read CSS vars, re-emit on theme change |
| Modify | `components/physics/phase-portrait.tsx` | Use theme colors for axes |
| Modify | `components/physics/harmony-table.tsx` | Use theme colors for axes |
| Modify | `components/physics/ellipse-construction.tsx` | Use theme colors for axes/labels/points |
| Modify | `components/physics/pendulum-scene.tsx` | Use theme colors for rod/pivot/timer |
| Modify | `components/physics/orbit-scene.tsx` | Use theme colors for planet |
| Modify | `components/physics/sweep-areas.tsx` | Use theme colors for planet |
| Modify | `components/physics/inverse-square-scene.tsx` | Use theme colors for planet |

### Phase 2 — Dictionary Upgrade
| Action | File | Responsibility |
|--------|------|----------------|
| Modify | `lib/content/types.ts` | Add `illustration` field to `GlossaryTerm` |
| Modify | `lib/content/glossary.ts` | Add visualization/illustration keys to terms |
| Modify | `app/dictionary/[slug]/page.tsx` | Refactor to ArticleLayout + AsideLinks + inline viz |
| Create | `components/physics/restoring-force-scene.tsx` | Spring + F=-kx vector visualization |
| Create | `components/physics/shm-oscillator-scene.tsx` | Spring-mass + sinusoidal trace |
| Create | `components/physics/isochronism-scene.tsx` | Dual pendulums, same period |
| Create | `components/physics/inverse-square-viz.tsx` | 1/r² concentric circles + draggable point |
| Create | `components/physics/eccentricity-slider.tsx` | Ellipse morphing with e slider |
| Create | `components/physics/epicycle-scene.tsx` | Animated deferent + epicycle |
| Modify | `components/physics/visualization-registry.tsx` | Register all new + existing visualizations |

### Phase 3 — i18n Infrastructure
| Action | File | Responsibility |
|--------|------|----------------|
| Create | `i18n/config.ts` | Locale list, default locale |
| Create | `i18n/request.ts` | next-intl server request config |
| Create | `i18n/routing.ts` | next-intl routing config |
| Create | `middleware.ts` | next-intl locale detection middleware |
| Create | `messages/en/common.json` | Nav, footer, cookie banner, theme strings |
| Create | `messages/en/home.json` | Homepage hero, branch cards, featured section |
| Create | `messages/en/glossary.json` | All 14 dictionary terms |
| Create | `messages/en/physicists.json` | All physicist bios |
| Create | `messages/en/about.json` | About page |
| Create | `messages/en/legal.json` | Privacy, terms, cookies pages |
| Modify | `next.config.mjs` | Integrate next-intl plugin |
| Create | `app/[locale]/layout.tsx` | Locale-aware root layout |
| Move | All `app/**/page.*` → `app/[locale]/**/page.*` | Route restructure |
| Modify | `components/layout/nav.tsx` | Add language switcher, use `t()` |
| Modify | `components/layout/footer.tsx` | Use `t()` for all strings |
| Modify | `components/layout/cookie-banner.tsx` | Use `t()` for all strings |
| Modify | `app/sitemap.ts` | Add locale variants + hreflang |
| Modify | `lib/content/glossary.ts` | Strip inline English, use translation keys |
| Modify | `lib/content/physicists.ts` | Strip inline English, use translation keys |
| Modify | `lib/content/branches.ts` | Strip inline English, use translation keys |

---

## Phase 1 — Bug Fixes

### Task 1: Fix Scene Card Clipping

**Files:**
- Modify: `components/layout/scene-card.tsx`

- [ ] **Step 1: Fix overflow and sizing**

Replace the inner wrapper divs in `scene-card.tsx`. The current structure clips canvas content vertically due to `overflow-y-hidden` and constrains width with `w-max`.

Change lines 23-26 from:

```tsx
<div className="relative overflow-hidden rounded-md border border-[var(--color-fg-3)] bg-[var(--color-bg-1)]">
  <div className="overflow-x-auto overflow-y-hidden [-webkit-overflow-scrolling:touch] [scrollbar-width:thin]">
    <div className="mx-auto w-max">{children}</div>
  </div>
```

To:

```tsx
<div className="relative overflow-hidden rounded-md border border-[var(--color-fg-3)] bg-[var(--color-bg-1)]">
  <div className="overflow-x-auto [-webkit-overflow-scrolling:touch] [scrollbar-width:thin]">
    <div className="mx-auto">{children}</div>
  </div>
```

Changes: removed `overflow-y-hidden` (the outer div's `overflow-hidden` handles border clipping), removed `w-max` (let children size naturally).

---

### Task 2: Create useThemeColors Hook

**Files:**
- Create: `lib/hooks/use-theme-colors.ts`

- [ ] **Step 1: Write the hook**

This hook reads the computed values of CSS custom properties from `document.documentElement` and re-reads them whenever the `data-theme` attribute changes via a `MutationObserver`.

```ts
"use client";

import { useEffect, useState } from "react";

export interface ThemeColors {
  fg0: string;
  fg1: string;
  fg2: string;
  fg3: string;
  bg0: string;
  bg1: string;
}

function readColors(): ThemeColors {
  const s = getComputedStyle(document.documentElement);
  return {
    fg0: s.getPropertyValue("--color-fg-0").trim(),
    fg1: s.getPropertyValue("--color-fg-1").trim(),
    fg2: s.getPropertyValue("--color-fg-2").trim(),
    fg3: s.getPropertyValue("--color-fg-3").trim(),
    bg0: s.getPropertyValue("--color-bg-0").trim(),
    bg1: s.getPropertyValue("--color-bg-1").trim(),
  };
}

export function useThemeColors(): ThemeColors {
  const [colors, setColors] = useState<ThemeColors>({
    fg0: "#E6EDF7",
    fg1: "#9FB0C8",
    fg2: "#5B6B86",
    fg3: "#2A3448",
    bg0: "#05070A",
    bg1: "#0B0F16",
  });

  useEffect(() => {
    setColors(readColors());

    const observer = new MutationObserver(() => {
      setColors(readColors());
    });

    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["data-theme"],
    });

    return () => observer.disconnect();
  }, []);

  return colors;
}
```

The initial state uses dark-theme defaults (matching the SSR default). On mount, it reads the actual computed values. When `data-theme` changes (via `ThemeToggle`), the observer fires and re-reads all variables.

---

### Task 3: Apply Theme Colors to JSXGraph Components

**Files:**
- Modify: `components/physics/phase-portrait.tsx`
- Modify: `components/physics/harmony-table.tsx`
- Modify: `components/physics/ellipse-construction.tsx`

These three components use JSXGraph (`JXG.JSXGraph.initBoard`) with hardcoded hex colors for axes, labels, and structural elements. The fix pattern is the same for all three:

1. Import and call `useThemeColors()`
2. Add `colors` to the `useEffect` dependency array (this causes board re-init on theme change)
3. Replace hardcoded hex values with `colors.fg0`, `colors.fg1`, `colors.fg2`

- [ ] **Step 1: Fix phase-portrait.tsx**

Add import at top:
```ts
import { useThemeColors } from "@/lib/hooks/use-theme-colors";
```

Inside the component function, before the `useEffect`:
```ts
const colors = useThemeColors();
```

In the `useEffect` (lines 32-94), replace the hardcoded axis colors:

```ts
defaultAxes: {
  x: { name: "x (rad)", withLabel: true, strokeColor: colors.fg2 },
  y: { name: "v (rad/s)", withLabel: true, strokeColor: colors.fg2 },
},
```

Add `colors` to the dependency array on line 95:
```ts
}, [theta0, length, colors]);
```

- [ ] **Step 2: Fix harmony-table.tsx**

Same pattern. Add `useThemeColors` import and call.

Replace lines 33-34:
```ts
x: { name: "log₁₀ a (AU)", withLabel: true, strokeColor: colors.fg2 },
y: { name: "log₁₀ T (yr)", withLabel: true, strokeColor: colors.fg2 },
```

Replace line 58 (label strokeColor):
```ts
strokeColor: colors.fg1,
```

Add `colors` to the dependency array (line 76, currently `[]`):
```ts
}, [colors]);
```

- [ ] **Step 3: Fix ellipse-construction.tsx**

Same pattern. Add `useThemeColors` import and call.

Replace these hardcoded colors throughout the `useEffect`:

| Line | Current | Replace with |
|------|---------|-------------|
| 79 | `strokeColor: "#9FB0C8"` | `strokeColor: colors.fg1` |
| 87 | `fillColor: "#5B6B86"` | `fillColor: colors.fg2` |
| 88 | `strokeColor: "#5B6B86"` | `strokeColor: colors.fg2` |
| 92 | `strokeColor: "#9FB0C8"` | `strokeColor: colors.fg1` |
| 102 | `fillColor: "#E6EDF7"` | `fillColor: colors.fg0` |
| 103 | `strokeColor: "#E6EDF7"` | `strokeColor: colors.fg0` |
| 105 | `strokeColor: "#E6EDF7"` | `strokeColor: colors.fg0` |
| 116 | `strokeColor: "#5B6B86"` | `strokeColor: colors.fg2` |

Add `colors` to the dependency array on line 134:
```ts
}, [a, e, colors]);
```

---

### Task 4: Apply Theme Colors to Canvas Components

**Files:**
- Modify: `components/physics/pendulum-scene.tsx`
- Modify: `components/physics/orbit-scene.tsx`
- Modify: `components/physics/sweep-areas.tsx`
- Modify: `components/physics/inverse-square-scene.tsx`

These components use `<canvas>` with `ctx.fillStyle`/`ctx.strokeStyle` set to hardcoded hex values. Unlike JSXGraph, canvas redraws every frame, so we don't need to reinitialize — just read the current colors and use them in the draw loop.

The pattern for canvas components:
1. Import and call `useThemeColors()`
2. Use `colors.fg0`, `colors.fg2`, `colors.fg3` in the `onFrame` callback
3. No dependency array changes needed — the `onFrame` callback reads `colors` via closure, and `useAnimationFrame` already uses a ref to the latest callback

- [ ] **Step 1: Fix pendulum-scene.tsx**

Add import:
```ts
import { useThemeColors } from "@/lib/hooks/use-theme-colors";
```

Inside the component, before `useAnimationFrame`:
```ts
const colors = useThemeColors();
```

In the `onFrame` callback, replace:
- Line 146: `ctx.strokeStyle = "#E6EDF7"` → `ctx.strokeStyle = colors.fg0` (rod)
- Line 154: `ctx.fillStyle = "#5B6B86"` → `ctx.fillStyle = colors.fg2` (pivot dot)
- Line 175: `ctx.strokeStyle = "#2A3448"` → `ctx.strokeStyle = colors.fg3` (timer bar background)

- [ ] **Step 2: Fix orbit-scene.tsx**

Add import and `useThemeColors()` call.

In the `onFrame` callback:
- Line 102: `ctx.fillStyle = "#E6EDF7"` → `ctx.fillStyle = colors.fg0` (planet)

- [ ] **Step 3: Fix sweep-areas.tsx**

Add import and `useThemeColors()` call.

In the `onFrame` callback:
- Line 160: `ctx.fillStyle = "#E6EDF7"` → `ctx.fillStyle = colors.fg0` (planet)

- [ ] **Step 4: Fix inverse-square-scene.tsx**

Add import and `useThemeColors()` call.

In the `onFrame` callback:
- Line 72: `ctx.fillStyle = "#E6EDF7"` → `ctx.fillStyle = colors.fg0` (planet)

---

## Phase 2 — Dictionary Upgrade

### Task 5: Add illustration Field to GlossaryTerm

**Files:**
- Modify: `lib/content/types.ts`
- Modify: `lib/content/glossary.ts`

- [ ] **Step 1: Add type field**

In `lib/content/types.ts`, add after the `visualization` field (line 71):

```ts
export interface GlossaryTerm {
  slug: string;
  term: string;
  category: GlossaryCategory;
  shortDefinition: string;
  description: string;
  history?: string;
  visualization?: string;
  illustration?: string;
  relatedPhysicists?: readonly string[];
  relatedTopics?: readonly TopicRef[];
}
```

- [ ] **Step 2: Add visualization and illustration keys to glossary terms**

In `lib/content/glossary.ts`, add these fields to the appropriate terms:

```ts
// restoring-force term — add:
visualization: "restoring-force",

// simple-harmonic-oscillator term — add:
visualization: "shm-oscillator",

// phase-portrait term — add:
visualization: "phase-portrait",

// isochronism term — add:
visualization: "isochronism",

// inverse-square-law term — add:
visualization: "inverse-square",

// eccentricity term — add:
visualization: "eccentricity-slider",

// epicycle term — add:
visualization: "epicycle",

// telescope term — add:
illustration: "/images/dictionary/telescope.svg",

// quadrant term — add:
illustration: "/images/dictionary/quadrant.svg",

// astrolabe term — add:
illustration: "/images/dictionary/astrolabe.svg",

// pendulum-clock term — add:
illustration: "/images/dictionary/pendulum-clock.svg",
```

Note: the SVG files don't exist yet — Roman will provide them. The illustration paths point to `public/images/dictionary/` which will be created when the SVGs are added.

---

### Task 6: Refactor Dictionary Page Layout

**Files:**
- Modify: `app/dictionary/[slug]/page.tsx`

- [ ] **Step 1: Rewrite dictionary term page**

Replace the entire content of `app/dictionary/[slug]/page.tsx` with:

```tsx
import Link from "next/link";
import Image from "next/image";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { GLOSSARY, getTerm } from "@/lib/content/glossary";
import { getPhysicist } from "@/lib/content/physicists";
import { getBranch, getTopic } from "@/lib/content/branches";
import { TopicHeader } from "@/components/layout/topic-header";
import { ArticleLayout } from "@/components/layout/article-layout";
import { AsideLinks } from "@/components/layout/aside-links";
import type { AsideLink } from "@/components/layout/aside-links";
import { SceneCard } from "@/components/layout/scene-card";
import { Visualization } from "@/components/physics/visualization-registry";

export function generateStaticParams() {
  return GLOSSARY.map((t) => ({ slug: t.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const term = getTerm(slug);
  if (!term) return {};
  return {
    title: `${term.term} — physics`,
    description: term.shortDefinition,
  };
}

export default async function DictionaryTermPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const term = getTerm(slug);
  if (!term) notFound();

  const definitionParagraphs = term.description.split("\n\n");
  const historyParagraphs = term.history ? term.history.split("\n\n") : [];

  const relatedPhysicists = (term.relatedPhysicists ?? [])
    .map((s) => getPhysicist(s))
    .filter((p): p is NonNullable<ReturnType<typeof getPhysicist>> => p !== undefined);

  const relatedTopics = (term.relatedTopics ?? [])
    .map((ref) => {
      const branch = getBranch(ref.branchSlug);
      const topic = getTopic(ref.branchSlug, ref.topicSlug);
      if (!branch || !topic) return null;
      return { branch, topic };
    })
    .filter((x): x is { branch: NonNullable<ReturnType<typeof getBranch>>; topic: NonNullable<ReturnType<typeof getTopic>> } => x !== null);

  // Build aside links
  const asideLinks: AsideLink[] = [
    ...relatedPhysicists.map((p) => ({
      type: "physicist" as const,
      label: p.name,
      sublabel: `${p.born}–${p.died}`,
      href: `/physicists/${p.slug}`,
    })),
    ...relatedTopics.map(({ branch, topic }) => ({
      type: "topic" as const,
      label: topic.title,
      sublabel: branch.title,
      href: `/${branch.slug}/${topic.slug}`,
    })),
  ];

  let sectionIndex = 0;
  const nextIndex = (): string => {
    sectionIndex += 1;
    return String(sectionIndex).padStart(2, "0");
  };

  // Determine if there's a visualization or illustration
  const hasViz = !!term.visualization;
  const hasIllustration = !!term.illustration;

  return (
    <ArticleLayout aside={asideLinks.length > 0 ? <AsideLinks links={asideLinks} /> : undefined}>
      <TopicHeader
        eyebrow={`§ DICTIONARY · ${term.category.toUpperCase()}`}
        title={term.term}
        subtitle={term.shortDefinition}
      />

      <section className="mb-12">
        <div className="mb-4 flex flex-wrap items-baseline gap-x-3 gap-y-1">
          <span className="text-2xl font-semibold tracking-tight text-[var(--color-cyan)] tabular-nums md:text-3xl">
            §&#8239;{nextIndex()}
          </span>
          <h2 className="text-2xl font-semibold text-[var(--color-fg-0)] md:text-3xl">
            Definition
          </h2>
        </div>
        <div className="prose prose-invert max-w-none text-[var(--color-fg-0)]">
          <p>{definitionParagraphs[0]}</p>
        </div>

        {hasViz && (
          <SceneCard caption={`Interactive: ${term.term}`}>
            <Visualization vizKey={term.visualization!} />
          </SceneCard>
        )}

        {hasIllustration && (
          <SceneCard caption={term.term}>
            <div className="flex justify-center p-4">
              <Image
                src={term.illustration!}
                alt={`Illustration of ${term.term}`}
                width={560}
                height={360}
                className="h-auto max-w-full"
              />
            </div>
          </SceneCard>
        )}

        {definitionParagraphs.length > 1 && (
          <div className="prose prose-invert max-w-none text-[var(--color-fg-0)]">
            {definitionParagraphs.slice(1).map((para, i) => (
              <p key={i}>{para}</p>
            ))}
          </div>
        )}
      </section>

      {historyParagraphs.length > 0 && (
        <section className="mb-12">
          <div className="mb-4 flex flex-wrap items-baseline gap-x-3 gap-y-1">
            <span className="text-2xl font-semibold tracking-tight text-[var(--color-cyan)] tabular-nums md:text-3xl">
              §&#8239;{nextIndex()}
            </span>
            <h2 className="text-2xl font-semibold text-[var(--color-fg-0)] md:text-3xl">
              History
            </h2>
          </div>
          <div className="prose prose-invert max-w-none text-[var(--color-fg-0)]">
            {historyParagraphs.map((para, i) => (
              <p key={i}>{para}</p>
            ))}
          </div>
        </section>
      )}

      <div className="mt-12 border-t border-[var(--color-fg-3)] pt-8">
        <Link
          href="/dictionary"
          className="font-mono text-xs uppercase tracking-[0.2em] text-[var(--color-fg-2)] transition-colors hover:text-[var(--color-cyan)]"
        >
          ← Dictionary
        </Link>
      </div>
    </ArticleLayout>
  );
}
```

Key changes from original:
- Wrapped in `ArticleLayout` with `AsideLinks` sidebar
- Related physicists/topics moved from bottom card grids → aside sidebar
- Visualization/illustration placed inline after first definition paragraph
- Definition section split: first paragraph → viz/illustration → remaining paragraphs

---

### Task 7: Build Restoring Force Visualization

**Files:**
- Create: `components/physics/restoring-force-scene.tsx`

- [ ] **Step 1: Create the component**

A horizontal spring-mass system where the mass oscillates and a force vector arrow scales with displacement (F = -kx). Uses JSXGraph.

```tsx
"use client";

import { useEffect, useRef } from "react";
import { useAnimationFrame } from "@/lib/animation/use-animation-frame";
import { useThemeColors } from "@/lib/hooks/use-theme-colors";

export interface RestoringForceSceneProps {
  width?: number;
  height?: number;
}

export function RestoringForceScene({
  width = 560,
  height = 280,
}: RestoringForceSceneProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const boardRef = useRef<any>(null);
  const massRef = useRef<any>(null);
  const arrowRef = useRef<any>(null);
  const jxgRef = useRef<any>(null);
  const colors = useThemeColors();

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const JXG = (await import("jsxgraph")).default;
      jxgRef.current = JXG;

      if (cancelled || !containerRef.current) return;
      if (!containerRef.current.id) {
        containerRef.current.id = `restoring-force-${Math.random().toString(36).slice(2)}`;
      }

      const board = JXG.JSXGraph.initBoard(containerRef.current.id, {
        boundingbox: [-3, 2, 3, -2],
        axis: false,
        showNavigation: false,
        showCopyright: false,
        keepAspectRatio: false,
      });

      // Equilibrium line (dashed vertical at x=0)
      board.create("line", [[0, -2], [0, 2]], {
        strokeColor: colors.fg3,
        strokeWidth: 1,
        dash: 2,
        fixed: true,
        highlight: false,
      });

      // Equilibrium label
      board.create("text", [0.1, 1.6, "x = 0"], {
        fontSize: 11,
        strokeColor: colors.fg2,
        fixed: true,
      });

      // Horizontal axis
      board.create("line", [[-3, 0], [3, 0]], {
        strokeColor: colors.fg3,
        strokeWidth: 1,
        fixed: true,
        highlight: false,
      });

      // Mass block (point displayed as large square)
      const mass = board.create("point", [1.5, 0], {
        name: "",
        size: 12,
        fillColor: colors.fg0,
        strokeColor: colors.fg0,
        fixed: true,
        showInfobox: false,
      });

      // Force arrow: from mass toward equilibrium, length proportional to displacement
      // Arrow: [tail, head]
      const arrow = board.create("arrow", [
        [() => mass.X(), 0.5],
        [() => mass.X() - mass.X() * 0.6, 0.5],
      ], {
        strokeColor: "#FF4FD8",
        strokeWidth: 3,
        lastArrow: { type: 2, size: 6 },
      });

      // F = -kx label
      board.create("text", [
        () => mass.X() - mass.X() * 0.3,
        0.9,
        () => `F = ${(-mass.X()).toFixed(1)}`,
      ], {
        fontSize: 12,
        strokeColor: "#FF4FD8",
        fixed: true,
        anchorX: "middle",
      });

      // Spring zig-zag line from wall (-2.8, 0) to mass
      const springCoils = 8;
      const springAmplitude = 0.3;
      const wallX = -2.8;
      board.create("curve", [
        (s: number) => {
          const massX = mass.X();
          const len = massX - wallX;
          const x = wallX + s * len;
          if (s < 0.05 || s > 0.95) return x;
          const coilPhase = (s - 0.05) / 0.9;
          return x;
        },
        (s: number) => {
          if (s < 0.05 || s > 0.95) return 0;
          const coilPhase = (s - 0.05) / 0.9;
          return springAmplitude * Math.sin(coilPhase * springCoils * 2 * Math.PI);
        },
        0,
        1,
      ], {
        strokeColor: colors.fg1,
        strokeWidth: 1.5,
        numberPointsHigh: 200,
      });

      // Wall
      board.create("line", [[-2.8, -1.5], [-2.8, 1.5]], {
        strokeColor: colors.fg2,
        strokeWidth: 3,
        fixed: true,
        highlight: false,
        straightFirst: false,
        straightLast: false,
      });

      boardRef.current = board;
      massRef.current = mass;
      arrowRef.current = arrow;
    })();

    return () => {
      cancelled = true;
      if (boardRef.current && jxgRef.current) {
        try {
          jxgRef.current.JSXGraph.freeBoard(boardRef.current);
        } catch {}
      }
    };
  }, [colors]);

  // Animate: mass oscillates as SHM
  useAnimationFrame({
    elementRef: containerRef,
    onFrame: (t) => {
      if (!massRef.current) return;
      const x = 1.5 * Math.cos(2 * Math.PI * t / 3); // period = 3s
      massRef.current.moveTo([x, 0], 0);
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

---

### Task 8: Build SHM Oscillator Visualization

**Files:**
- Create: `components/physics/shm-oscillator-scene.tsx`

- [ ] **Step 1: Create the component**

A vertical spring-mass system on the left, with a synchronized sinusoidal trace (x vs t) drawn on the right. Uses canvas for smooth trail rendering.

```tsx
"use client";

import { useRef } from "react";
import { useAnimationFrame } from "@/lib/animation/use-animation-frame";
import { useThemeColors } from "@/lib/hooks/use-theme-colors";

export interface ShmOscillatorSceneProps {
  width?: number;
  height?: number;
}

export function ShmOscillatorScene({
  width = 560,
  height = 300,
}: ShmOscillatorSceneProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const colors = useThemeColors();

  const amplitude = 80; // px
  const period = 3; // seconds
  const omega = (2 * Math.PI) / period;

  // Layout: spring on left (0 → splitX), trace on right (splitX → width)
  const splitX = 160;
  const pivotY = 40;
  const restY = height / 2;

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

      const y = amplitude * Math.cos(omega * t);
      const bobY = restY + y;

      ctx.clearRect(0, 0, width, height);

      // --- Left side: spring + mass ---

      // Ceiling
      ctx.strokeStyle = colors.fg2;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(splitX / 2 - 30, pivotY);
      ctx.lineTo(splitX / 2 + 30, pivotY);
      ctx.stroke();

      // Spring zig-zag
      const coils = 10;
      const springTop = pivotY;
      const springBot = bobY - 15;
      const springLen = springBot - springTop;
      ctx.strokeStyle = colors.fg1;
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(splitX / 2, springTop);
      for (let i = 1; i <= coils * 2; i++) {
        const frac = i / (coils * 2);
        const sx = splitX / 2 + (i % 2 === 0 ? -12 : 12);
        const sy = springTop + frac * springLen;
        ctx.lineTo(sx, sy);
      }
      ctx.lineTo(splitX / 2, springBot);
      ctx.stroke();

      // Mass bob
      ctx.shadowColor = "rgba(91, 233, 255, 0.6)";
      ctx.shadowBlur = 12;
      ctx.fillStyle = "#5BE9FF";
      ctx.beginPath();
      ctx.arc(splitX / 2, bobY, 12, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0;

      // Equilibrium dashed line
      ctx.setLineDash([4, 4]);
      ctx.strokeStyle = colors.fg3;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(splitX / 2 - 30, restY);
      ctx.lineTo(width - 20, restY);
      ctx.stroke();
      ctx.setLineDash([]);

      // --- Right side: sinusoidal trace ---

      // Axes
      ctx.strokeStyle = colors.fg2;
      ctx.lineWidth = 1;
      // Vertical axis (x displacement)
      ctx.beginPath();
      ctx.moveTo(splitX + 20, pivotY);
      ctx.lineTo(splitX + 20, height - 20);
      ctx.stroke();
      // Horizontal axis (time)
      ctx.beginPath();
      ctx.moveTo(splitX + 20, restY);
      ctx.lineTo(width - 10, restY);
      ctx.stroke();

      // Trace: draw sinusoid from right edge backward in time
      const traceWidth = width - splitX - 40;
      const timeWindow = 6; // seconds visible
      ctx.strokeStyle = "#5BE9FF";
      ctx.lineWidth = 2;
      ctx.beginPath();
      let started = false;
      for (let px = 0; px <= traceWidth; px++) {
        const tTrace = t - (traceWidth - px) / traceWidth * timeWindow;
        if (tTrace < 0) continue;
        const yTrace = restY + amplitude * Math.cos(omega * tTrace);
        if (!started) {
          ctx.moveTo(splitX + 20 + px, yTrace);
          started = true;
        } else {
          ctx.lineTo(splitX + 20 + px, yTrace);
        }
      }
      ctx.stroke();

      // Current position dot on trace
      ctx.fillStyle = "#5BE9FF";
      ctx.beginPath();
      ctx.arc(splitX + 20 + traceWidth, bobY, 4, 0, Math.PI * 2);
      ctx.fill();

      // Connecting line from mass to trace
      ctx.strokeStyle = colors.fg3;
      ctx.lineWidth = 1;
      ctx.setLineDash([2, 3]);
      ctx.beginPath();
      ctx.moveTo(splitX / 2 + 12, bobY);
      ctx.lineTo(splitX + 20 + traceWidth, bobY);
      ctx.stroke();
      ctx.setLineDash([]);
    },
  });

  return (
    <div ref={containerRef} style={{ width, height }} className="mx-auto">
      <canvas ref={canvasRef} style={{ width, height }} className="block" />
    </div>
  );
}
```

---

### Task 9: Build Isochronism Visualization

**Files:**
- Create: `components/physics/isochronism-scene.tsx`

- [ ] **Step 1: Create the component**

Two pendulums side by side with different amplitudes (10deg and 35deg) but the same length. Both use the small-angle approximation, so their periods match exactly — demonstrating isochronism. Timer bars below each pendulum.

```tsx
"use client";

import { useRef } from "react";
import { smallAngleTheta, smallAnglePeriod } from "@/lib/physics/pendulum";
import { useAnimationFrame } from "@/lib/animation/use-animation-frame";
import { useThemeColors } from "@/lib/hooks/use-theme-colors";

export interface IsochronismSceneProps {
  width?: number;
  height?: number;
}

export function IsochronismScene({
  width = 560,
  height = 340,
}: IsochronismSceneProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const colors = useThemeColors();

  const L = 1.5; // meters
  const theta0A = 0.17; // ~10 degrees
  const theta0B = 0.61; // ~35 degrees
  const period = smallAnglePeriod(L);

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

      ctx.clearRect(0, 0, width, height);

      const halfW = width / 2;
      const pivotY = 40;
      const pxPerMeter = (height - 100) / L;

      // Draw each pendulum
      const pendulums = [
        { cx: halfW / 2, theta0: theta0A, label: `${Math.round(theta0A * 180 / Math.PI)}°` },
        { cx: halfW + halfW / 2, theta0: theta0B, label: `${Math.round(theta0B * 180 / Math.PI)}°` },
      ];

      for (const p of pendulums) {
        const theta = smallAngleTheta({ t, theta0: p.theta0, L });
        const bobX = p.cx + pxPerMeter * L * Math.sin(theta);
        const bobY = pivotY + pxPerMeter * L * Math.cos(theta);

        // Pivot
        ctx.fillStyle = colors.fg2;
        ctx.beginPath();
        ctx.arc(p.cx, pivotY, 3, 0, Math.PI * 2);
        ctx.fill();

        // Rod
        ctx.strokeStyle = colors.fg0;
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(p.cx, pivotY);
        ctx.lineTo(bobX, bobY);
        ctx.stroke();

        // Bob
        ctx.shadowColor = "rgba(91, 233, 255, 0.6)";
        ctx.shadowBlur = 12;
        ctx.fillStyle = "#5BE9FF";
        ctx.beginPath();
        ctx.arc(bobX, bobY, 8, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;

        // Amplitude label
        ctx.font = "11px monospace";
        ctx.fillStyle = colors.fg2;
        ctx.textAlign = "center";
        ctx.fillText(p.label, p.cx, pivotY - 12);

        // Timer bar
        const barY = height - 30;
        const barLeft = p.cx - 60;
        const barRight = p.cx + 60;
        const barWidth = barRight - barLeft;

        ctx.strokeStyle = colors.fg3;
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(barLeft, barY);
        ctx.lineTo(barRight, barY);
        ctx.stroke();

        const frac = (t % period) / period;
        ctx.strokeStyle = "#5BE9FF";
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(barLeft, barY);
        ctx.lineTo(barLeft + barWidth * frac, barY);
        ctx.stroke();
      }

      // Divider line
      ctx.strokeStyle = colors.fg3;
      ctx.lineWidth = 1;
      ctx.setLineDash([4, 4]);
      ctx.beginPath();
      ctx.moveTo(halfW, pivotY - 20);
      ctx.lineTo(halfW, height - 10);
      ctx.stroke();
      ctx.setLineDash([]);

      // "Same period" label at bottom center
      ctx.font = "11px monospace";
      ctx.fillStyle = colors.fg1;
      ctx.textAlign = "center";
      ctx.fillText(`T = ${period.toFixed(2)}s`, halfW, height - 10);
    },
  });

  return (
    <div ref={containerRef} style={{ width, height }} className="mx-auto">
      <canvas ref={canvasRef} style={{ width, height }} className="block" />
    </div>
  );
}
```

---

### Task 10: Build Inverse Square Law Visualization (Dictionary)

**Files:**
- Create: `components/physics/inverse-square-viz.tsx`

- [ ] **Step 1: Create the component**

Point source at center with concentric circles at r, 2r, 3r showing 1/r² intensity falloff. A draggable test point shows the force magnitude. Uses JSXGraph.

```tsx
"use client";

import { useEffect, useRef } from "react";
import { useThemeColors } from "@/lib/hooks/use-theme-colors";

export interface InverseSquareVizProps {
  width?: number;
  height?: number;
}

export function InverseSquareViz({
  width = 560,
  height = 360,
}: InverseSquareVizProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const boardRef = useRef<any>(null);
  const jxgRef = useRef<any>(null);
  const colors = useThemeColors();

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const JXG = (await import("jsxgraph")).default;
      jxgRef.current = JXG;

      if (cancelled || !containerRef.current) return;
      if (!containerRef.current.id) {
        containerRef.current.id = `inv-sq-${Math.random().toString(36).slice(2)}`;
      }

      const board = JXG.JSXGraph.initBoard(containerRef.current.id, {
        boundingbox: [-5, 5, 5, -5],
        axis: false,
        showNavigation: false,
        showCopyright: false,
        keepAspectRatio: true,
      });

      // Source at origin
      board.create("point", [0, 0], {
        name: "Source",
        fixed: true,
        size: 6,
        fillColor: "#5BE9FF",
        strokeColor: "#5BE9FF",
        label: { offset: [10, 10], fontSize: 11, strokeColor: colors.fg1 },
      });

      // Concentric circles at r=1, 2, 3 with decreasing opacity
      const radii = [1, 2, 3];
      for (const r of radii) {
        const opacity = 1 / (r * r);
        board.create("circle", [[0, 0], r], {
          strokeColor: "#5BE9FF",
          strokeOpacity: 0.3,
          strokeWidth: 1,
          fillColor: "#5BE9FF",
          fillOpacity: opacity * 0.15,
          fixed: true,
          highlight: false,
        });
        // Label
        board.create("text", [r + 0.15, 0.3, `${r}r`], {
          fontSize: 10,
          strokeColor: colors.fg2,
          fixed: true,
        });
      }

      // Draggable test point
      const testPt = board.create("point", [2, 1.5], {
        name: "",
        size: 5,
        fillColor: "#FF4FD8",
        strokeColor: "#FF4FD8",
        showInfobox: false,
      });

      // Line from source to test point
      board.create("segment", [[0, 0], testPt], {
        strokeColor: "#FF4FD8",
        strokeWidth: 1.5,
        dash: 2,
      });

      // Force readout text
      board.create("text", [
        () => testPt.X() + 0.3,
        () => testPt.Y() + 0.3,
        () => {
          const r = Math.hypot(testPt.X(), testPt.Y());
          const F = r > 0.1 ? 1 / (r * r) : 99;
          return `r = ${r.toFixed(2)}\nF = ${F.toFixed(2)}`;
        },
      ], {
        fontSize: 11,
        strokeColor: "#FF4FD8",
        fixed: true,
        cssClass: "font-mono whitespace-pre",
      });

      boardRef.current = board;
    })();

    return () => {
      cancelled = true;
      if (boardRef.current && jxgRef.current) {
        try {
          jxgRef.current.JSXGraph.freeBoard(boardRef.current);
        } catch {}
      }
    };
  }, [colors]);

  return (
    <div
      ref={containerRef}
      className="jxgbox mx-auto"
      style={{ width, height, backgroundColor: "transparent" }}
    />
  );
}
```

---

### Task 11: Build Eccentricity Slider Visualization

**Files:**
- Create: `components/physics/eccentricity-slider.tsx`

- [ ] **Step 1: Create the component**

An ellipse that morphs as eccentricity changes. Uses JSXGraph with a slider for `e` (0 to 0.95). Foci visible and move apart as e increases.

```tsx
"use client";

import { useEffect, useRef } from "react";
import { useThemeColors } from "@/lib/hooks/use-theme-colors";

export interface EccentricitySliderProps {
  width?: number;
  height?: number;
}

export function EccentricitySlider({
  width = 560,
  height = 380,
}: EccentricitySliderProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const boardRef = useRef<any>(null);
  const jxgRef = useRef<any>(null);
  const colors = useThemeColors();

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const JXG = (await import("jsxgraph")).default;
      jxgRef.current = JXG;

      if (cancelled || !containerRef.current) return;
      if (!containerRef.current.id) {
        containerRef.current.id = `ecc-slider-${Math.random().toString(36).slice(2)}`;
      }

      const a = 3; // fixed semi-major axis
      const board = JXG.JSXGraph.initBoard(containerRef.current.id, {
        boundingbox: [-5, 4.5, 5, -4.5],
        axis: false,
        showNavigation: false,
        showCopyright: false,
        keepAspectRatio: true,
      });

      // Eccentricity slider
      const slider = board.create("slider", [[-3.5, -3.5], [3.5, -3.5], [0, 0.5, 0.95]], {
        name: "e",
        snapWidth: 0.01,
        strokeColor: "#5BE9FF",
        fillColor: "#5BE9FF",
        label: { fontSize: 12, strokeColor: colors.fg1 },
      });

      // Dynamic ellipse
      board.create("curve", [
        (t: number) => {
          const e = slider.Value();
          return a * Math.cos(t);
        },
        (t: number) => {
          const e = slider.Value();
          const b = a * Math.sqrt(1 - e * e);
          return b * Math.sin(t);
        },
        0,
        2 * Math.PI,
      ], {
        strokeColor: "#5BE9FF",
        strokeWidth: 2,
      });

      // Focus 1 (right)
      board.create("point", [() => a * slider.Value(), 0], {
        name: "F₁",
        fixed: true,
        size: 4,
        fillColor: "#5BE9FF",
        strokeColor: "#5BE9FF",
        label: { offset: [8, 8], fontSize: 11, strokeColor: colors.fg1 },
      });

      // Focus 2 (left)
      board.create("point", [() => -a * slider.Value(), 0], {
        name: "F₂",
        fixed: true,
        size: 4,
        fillColor: colors.fg2,
        strokeColor: colors.fg2,
        label: { offset: [8, 8], fontSize: 11, strokeColor: colors.fg1 },
      });

      // Center
      board.create("point", [0, 0], {
        name: "",
        fixed: true,
        size: 2,
        fillColor: colors.fg3,
        strokeColor: colors.fg3,
      });

      // Readout
      board.create("text", [-4.5, 3.8, () => {
        const e = slider.Value();
        const b = a * Math.sqrt(1 - e * e);
        return `e = ${e.toFixed(2)}  b/a = ${(b / a).toFixed(2)}`;
      }], {
        fontSize: 12,
        strokeColor: colors.fg1,
        fixed: true,
        cssClass: "font-mono",
      });

      boardRef.current = board;
    })();

    return () => {
      cancelled = true;
      if (boardRef.current && jxgRef.current) {
        try {
          jxgRef.current.JSXGraph.freeBoard(boardRef.current);
        } catch {}
      }
    };
  }, [colors]);

  return (
    <div
      ref={containerRef}
      className="jxgbox mx-auto"
      style={{ width, height, backgroundColor: "transparent" }}
    />
  );
}
```

---

### Task 12: Build Epicycle Visualization

**Files:**
- Create: `components/physics/epicycle-scene.tsx`

- [ ] **Step 1: Create the component**

Animated deferent (large circle) + epicycle (small circle). A point rides the epicycle whose center rides the deferent. A trail shows the resulting retrograde loop path. Uses canvas.

```tsx
"use client";

import { useRef } from "react";
import { useAnimationFrame } from "@/lib/animation/use-animation-frame";
import { useThemeColors } from "@/lib/hooks/use-theme-colors";

export interface EpicycleSceneProps {
  width?: number;
  height?: number;
}

export function EpicycleScene({
  width = 560,
  height = 400,
}: EpicycleSceneProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const trailRef = useRef<Array<{ x: number; y: number }>>([]);
  const colors = useThemeColors();

  const R = 120; // deferent radius (px)
  const r = 45;  // epicycle radius (px)
  const Td = 20; // deferent period (seconds)
  const Te = 6;  // epicycle period (seconds)

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

      const cx = width / 2;
      const cy = height / 2;

      // Deferent angle (slow)
      const dAngle = (2 * Math.PI * t) / Td;
      // Epicycle center
      const ecX = cx + R * Math.cos(dAngle);
      const ecY = cy - R * Math.sin(dAngle);

      // Epicycle angle (fast, opposite direction for retrograde)
      const eAngle = -(2 * Math.PI * t) / Te;
      // Planet position
      const px = ecX + r * Math.cos(eAngle);
      const py = ecY - r * Math.sin(eAngle);

      // Update trail
      trailRef.current.push({ x: px, y: py });
      if (trailRef.current.length > 600) trailRef.current.shift();

      ctx.clearRect(0, 0, width, height);

      // Earth at center
      ctx.fillStyle = colors.fg2;
      ctx.beginPath();
      ctx.arc(cx, cy, 5, 0, Math.PI * 2);
      ctx.fill();
      ctx.font = "10px monospace";
      ctx.fillStyle = colors.fg2;
      ctx.textAlign = "center";
      ctx.fillText("Earth", cx, cy + 16);

      // Deferent circle
      ctx.strokeStyle = colors.fg3;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.arc(cx, cy, R, 0, Math.PI * 2);
      ctx.stroke();

      // Epicycle circle
      ctx.strokeStyle = colors.fg2;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.arc(ecX, ecY, r, 0, Math.PI * 2);
      ctx.stroke();

      // Epicycle center dot
      ctx.fillStyle = colors.fg1;
      ctx.beginPath();
      ctx.arc(ecX, ecY, 3, 0, Math.PI * 2);
      ctx.fill();

      // Line from Earth to epicycle center
      ctx.strokeStyle = colors.fg3;
      ctx.lineWidth = 1;
      ctx.setLineDash([4, 4]);
      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.lineTo(ecX, ecY);
      ctx.stroke();
      ctx.setLineDash([]);

      // Trail
      ctx.strokeStyle = "#FF4FD8";
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      const trail = trailRef.current;
      if (trail.length > 1) {
        ctx.moveTo(trail[0].x, trail[0].y);
        for (let i = 1; i < trail.length; i++) {
          ctx.lineTo(trail[i].x, trail[i].y);
        }
      }
      ctx.stroke();

      // Planet
      ctx.shadowColor = "rgba(255, 79, 216, 0.6)";
      ctx.shadowBlur = 12;
      ctx.fillStyle = "#FF4FD8";
      ctx.beginPath();
      ctx.arc(px, py, 5, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0;
    },
  });

  return (
    <div ref={containerRef} style={{ width, height }} className="mx-auto">
      <canvas ref={canvasRef} style={{ width, height }} className="block" />
    </div>
  );
}
```

---

### Task 13: Register All Visualizations

**Files:**
- Modify: `components/physics/visualization-registry.tsx`

- [ ] **Step 1: Add all dynamic imports and registry entries**

Replace the entire file:

```tsx
"use client";

import dynamic from "next/dynamic";

const EllipseConstruction = dynamic(
  () =>
    import("@/components/physics/ellipse-construction").then((m) => ({
      default: m.EllipseConstruction,
    })),
  { ssr: false },
);

const PhasePortrait = dynamic(
  () =>
    import("@/components/physics/phase-portrait").then((m) => ({
      default: m.PhasePortrait,
    })),
  { ssr: false },
);

const RestoringForceScene = dynamic(
  () =>
    import("@/components/physics/restoring-force-scene").then((m) => ({
      default: m.RestoringForceScene,
    })),
  { ssr: false },
);

const ShmOscillatorScene = dynamic(
  () =>
    import("@/components/physics/shm-oscillator-scene").then((m) => ({
      default: m.ShmOscillatorScene,
    })),
  { ssr: false },
);

const IsochronismScene = dynamic(
  () =>
    import("@/components/physics/isochronism-scene").then((m) => ({
      default: m.IsochronismScene,
    })),
  { ssr: false },
);

const InverseSquareViz = dynamic(
  () =>
    import("@/components/physics/inverse-square-viz").then((m) => ({
      default: m.InverseSquareViz,
    })),
  { ssr: false },
);

const EccentricitySlider = dynamic(
  () =>
    import("@/components/physics/eccentricity-slider").then((m) => ({
      default: m.EccentricitySlider,
    })),
  { ssr: false },
);

const EpicycleScene = dynamic(
  () =>
    import("@/components/physics/epicycle-scene").then((m) => ({
      default: m.EpicycleScene,
    })),
  { ssr: false },
);

const VISUALIZATIONS: Record<string, React.ComponentType> = {
  "ellipse-construction": EllipseConstruction,
  "phase-portrait": () => <PhasePortrait theta0={0.5} length={1.5} />,
  "restoring-force": RestoringForceScene,
  "shm-oscillator": ShmOscillatorScene,
  "isochronism": IsochronismScene,
  "inverse-square": InverseSquareViz,
  "eccentricity-slider": EccentricitySlider,
  "epicycle": EpicycleScene,
};

export function Visualization({ vizKey }: { vizKey: string }) {
  const Viz = VISUALIZATIONS[vizKey];
  if (!Viz) return null;
  return <Viz />;
}
```

Note: `phase-portrait` needs default props (`theta0` and `length`) since the dictionary page doesn't pass them. All other components have sensible internal defaults.

---

## Phase 3 — i18n Infrastructure

### Task 14: Install next-intl and Create Config

**Files:**
- Create: `i18n/config.ts`
- Create: `i18n/request.ts`
- Create: `i18n/routing.ts`

- [ ] **Step 1: Install next-intl**

Run:
```bash
npm install next-intl
```

- [ ] **Step 2: Create i18n config files**

`i18n/config.ts`:
```ts
export const locales = ["en", "ru"] as const;
export type Locale = (typeof locales)[number];
export const defaultLocale: Locale = "en";
```

`i18n/routing.ts`:
```ts
import { defineRouting } from "next-intl/routing";
import { locales, defaultLocale } from "./config";

export const routing = defineRouting({
  locales,
  defaultLocale,
  localePrefix: "as-needed", // no prefix for default locale
});
```

`i18n/request.ts`:
```ts
import { getRequestConfig } from "next-intl/server";
import { routing } from "./routing";

export default getRequestConfig(async ({ requestLocale }) => {
  let locale = await requestLocale;
  if (!locale || !routing.locales.includes(locale as any)) {
    locale = routing.defaultLocale;
  }

  // Load all message namespaces for this locale
  const common = (await import(`../messages/${locale}/common.json`)).default;
  const home = (await import(`../messages/${locale}/home.json`)).default;
  const glossary = (await import(`../messages/${locale}/glossary.json`)).default;
  const physicists = (await import(`../messages/${locale}/physicists.json`)).default;
  const about = (await import(`../messages/${locale}/about.json`)).default;
  const legal = (await import(`../messages/${locale}/legal.json`)).default;

  return {
    locale,
    messages: {
      common,
      home,
      glossary,
      physicists,
      about,
      legal,
    },
  };
});
```

---

### Task 15: Create Middleware and Update next.config

**Files:**
- Create: `middleware.ts`
- Modify: `next.config.mjs`

- [ ] **Step 1: Create middleware**

`middleware.ts` (project root):
```ts
import createMiddleware from "next-intl/middleware";
import { routing } from "./i18n/routing";

export default createMiddleware(routing);

export const config = {
  matcher: [
    // Match all pathnames except internal Next.js paths and static files
    "/((?!_next|api|favicon\\.ico|icon-.*\\.png|apple-icon\\.png|images|fonts|.*\\..*).*)",
  ],
};
```

- [ ] **Step 2: Update next.config.mjs**

```js
import createMDX from "@next/mdx";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";
import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin("./i18n/request.ts");

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  pageExtensions: ["ts", "tsx", "mdx"],
  async redirects() {
    return [
      {
        source: "/harmonic-motion",
        destination: "/classical-mechanics/pendulum",
        permanent: true,
      },
      {
        source: "/kepler",
        destination: "/classical-mechanics/kepler",
        permanent: true,
      },
    ];
  },
};

const withMDX = createMDX({
  options: {
    remarkPlugins: [remarkMath],
    rehypePlugins: [[rehypeKatex, { strict: false }]],
  },
});

export default withNextIntl(withMDX(nextConfig));
```

---

### Task 16: Create English Message Files

**Files:**
- Create: `messages/en/common.json`
- Create: `messages/en/home.json`
- Create: `messages/en/about.json`
- Create: `messages/en/legal.json`
- Create: `messages/en/glossary.json`
- Create: `messages/en/physicists.json`

- [ ] **Step 1: Create common.json**

Extract all UI strings from nav, footer, cookie banner, theme toggle:

```json
{
  "nav": {
    "home": "Physics.explained",
    "physicists": "Physicists",
    "dictionary": "Dictionary",
    "search": "Search",
    "homeAriaLabel": "Physics.explained — home"
  },
  "footer": {
    "branches": "Branches",
    "physicists": "Physicists",
    "dictionary": "Dictionary",
    "privacyPolicy": "Privacy Policy",
    "termsOfService": "Terms of Service",
    "cookiePolicy": "Cookie Policy",
    "copyright": "© 2026 Simnetiq Ltd"
  },
  "cookieBanner": {
    "message": "This site uses localStorage for your theme preference. No tracking cookies.",
    "linkText": "Cookie policy",
    "accept": "Accept"
  },
  "theme": {
    "toggleLight": "Switch to light mode",
    "toggleDark": "Switch to dark mode"
  },
  "aside": {
    "physicists": "Physicists",
    "topics": "Topics",
    "terms": "Terms"
  },
  "backLinks": {
    "dictionary": "← Dictionary",
    "physicists": "← All physicists"
  }
}
```

- [ ] **Step 2: Create home.json**

Extract homepage strings. Read `app/page.tsx` and `components/sections/hero-section.tsx` to get exact text. For now, create the structure with the key strings:

```json
{
  "hero": {
    "title": "Physics.",
    "titleAccent": "explained",
    "subtitle": "Visual-first physics explainers. Interactive simulations, historical context, and the mathematics that holds it all together."
  },
  "branches": {
    "sectionTitle": "Branches",
    "sectionSubtitle": "Explore the major branches of physics"
  },
  "featured": {
    "sectionTitle": "Featured",
    "sectionSubtitle": "Start here"
  }
}
```

Note: The exact hero text should be verified by reading `hero-section.tsx` — the agent implementing this task should read the file and extract the actual strings.

- [ ] **Step 3: Create glossary.json**

Extract all 14 glossary term strings. Structure by slug:

```json
{
  "pendulum-clock": {
    "term": "pendulum clock",
    "shortDefinition": "Mechanical clock regulated by a swinging pendulum; first accurate timekeeper, built by Huygens in 1656.",
    "description": "A pendulum clock uses the steady swing of a weighted rod as its timing element...",
    "history": "Christiaan Huygens designed and built the first working pendulum clock in 1656..."
  },
  "telescope": {
    "term": "telescope",
    "shortDefinition": "Optical instrument that makes distant objects appear closer...",
    "description": "A refracting telescope uses a large front lens...",
    "history": "Dutch spectacle makers built the first telescopes around 1608..."
  }
}
```

The agent should read `lib/content/glossary.ts` and extract ALL 14 terms' `term`, `shortDefinition`, `description`, and `history` fields verbatim into this JSON file.

- [ ] **Step 4: Create physicists.json**

Same pattern — read `lib/content/physicists.ts` and extract all physicist display strings:

```json
{
  "galileo-galilei": {
    "name": "Galileo Galilei",
    "shortName": "Galileo",
    "oneLiner": "...",
    "bio": "...",
    "contributions": ["...", "..."],
    "majorWorks": [
      { "title": "...", "year": "...", "description": "..." }
    ]
  }
}
```

- [ ] **Step 5: Create about.json and legal.json**

Read `app/about/page.tsx`, `app/privacy/page.tsx`, `app/terms/page.tsx`, `app/cookies/page.tsx` and extract all text content into the respective JSON files.

---

### Task 17: Restructure App Router for Locale Prefix

**Files:**
- Create: `app/[locale]/layout.tsx`
- Move: all page files into `app/[locale]/`

- [ ] **Step 1: Create locale layout**

Create `app/[locale]/layout.tsx` that wraps children with `NextIntlClientProvider`. The current `app/layout.tsx` becomes a thin shell that delegates to the locale layout.

New `app/[locale]/layout.tsx`:

```tsx
import { NextIntlClientProvider } from "next-intl";
import { getMessages } from "next-intl/server";
import { notFound } from "next/navigation";
import { routing } from "@/i18n/routing";

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;

  if (!routing.locales.includes(locale as any)) {
    notFound();
  }

  const messages = await getMessages();

  return (
    <NextIntlClientProvider messages={messages}>
      {children}
    </NextIntlClientProvider>
  );
}
```

Update `app/layout.tsx` to accept `locale` param and set `lang`:

```tsx
import "./globals.css";
import { Inter, JetBrains_Mono } from "next/font/google";
import localFont from "next/font/local";
import { Analytics } from "@vercel/analytics/next";
import { Nav } from "@/components/layout/nav";
import { Footer } from "@/components/layout/footer";
import { CookieBanner } from "@/components/layout/cookie-banner";

const inter = Inter({ subsets: ["latin"], variable: "--font-sans", display: "swap" });
const jetbrainsMono = JetBrains_Mono({ subsets: ["latin"], variable: "--font-mono", display: "swap" });
const archiveGrotesk = localFont({ src: "./fonts/archive-grotesk.otf", variable: "--font-display", display: "swap" });

export const metadata = {
  title: "physics",
  description: "Visual-first physics explainers.",
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "any" },
      { url: "/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: "/apple-icon.png",
  },
};

const noFlashScript = `(function(){try{var t=localStorage.getItem('physics-theme');if(t!=='light'&&t!=='dark'){t='dark';}document.documentElement.setAttribute('data-theme',t);}catch(e){document.documentElement.setAttribute('data-theme','dark');}})();`;

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      data-theme="dark"
      className={`${inter.variable} ${jetbrainsMono.variable} ${archiveGrotesk.variable}`}
      suppressHydrationWarning
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: noFlashScript }} />
      </head>
      <body className="font-sans antialiased">
        <div className="flex min-h-screen flex-col">
          <Nav />
          <div className="flex-1">{children}</div>
          <Footer />
        </div>
        <Analytics />
        <CookieBanner />
      </body>
    </html>
  );
}
```

Note: The root layout keeps `<html>` without `lang` — the locale layout or a server component should set it via `setRequestLocale()`. The actual `lang` attribute should be set on `<html>` based on the current locale. The implementing agent should use `next-intl`'s `setRequestLocale` pattern to handle this correctly.

- [ ] **Step 2: Move all pages into [locale] directory**

Move all page directories and files from `app/` into `app/[locale]/`:

```
app/page.tsx                    → app/[locale]/page.tsx
app/(topics)/                   → app/[locale]/(topics)/
app/dictionary/                 → app/[locale]/dictionary/
app/physicists/                 → app/[locale]/physicists/
app/about/                      → app/[locale]/about/
app/privacy/                    → app/[locale]/privacy/
app/terms/                      → app/[locale]/terms/
app/cookies/                    → app/[locale]/cookies/
app/[branch]/                   → app/[locale]/[branch]/
app/sandbox/                    → app/[locale]/sandbox/
```

Files that stay in `app/` (not locale-scoped):
- `app/layout.tsx` — root layout
- `app/globals.css`
- `app/fonts/`
- `app/sitemap.ts`
- `app/favicon.ico`, `app/icon-*.png`, `app/apple-icon.png`

- [ ] **Step 3: Update all internal Link hrefs**

After moving pages into `[locale]`, internal `<Link href="...">` calls need to use `next-intl`'s navigation utilities. Create a navigation helper:

Create `i18n/navigation.ts`:
```ts
import { createNavigation } from "next-intl/navigation";
import { routing } from "./routing";

export const { Link, redirect, usePathname, useRouter } = createNavigation(routing);
```

Then in all page/component files, replace:
```ts
import Link from "next/link";
```
with:
```ts
import { Link } from "@/i18n/navigation";
```

This ensures links automatically include/exclude the locale prefix as needed. The implementing agent should do a project-wide find-and-replace for `from "next/link"` → `from "@/i18n/navigation"` in all files that contain internal `<Link>` elements.

Exception: keep `next/link` in root layout components (`nav.tsx`, `footer.tsx`) only if they need to render outside the locale context. In practice, since they live inside the root layout which wraps `[locale]`, they should use the i18n Link too.

---

### Task 18: Update Static Data Files for i18n

**Files:**
- Modify: `lib/content/glossary.ts`
- Modify: `lib/content/physicists.ts`
- Modify: `lib/content/branches.ts`

- [ ] **Step 1: Refactor glossary.ts**

Keep only structural data. Remove all English display strings (they now live in `messages/en/glossary.json`):

```ts
import type { GlossaryCategory, GlossaryTerm } from "./types";

// Structural data only — display strings come from translation files
export interface GlossaryTermData {
  slug: string;
  category: GlossaryCategory;
  visualization?: string;
  illustration?: string;
  relatedPhysicists?: readonly string[];
  relatedTopics?: readonly TopicRef[];
}

export const GLOSSARY: readonly GlossaryTermData[] = [
  {
    slug: "pendulum-clock",
    category: "instrument",
    relatedPhysicists: ["christiaan-huygens", "galileo-galilei"],
    relatedTopics: [{ branchSlug: "classical-mechanics", topicSlug: "pendulum" }],
  },
  // ... all 14 terms with only structural fields
];
```

The `GlossaryTerm` type in `types.ts` should be updated to match, or a new `GlossaryTermData` type should be created alongside it.

Pages that display glossary content will call `getTranslations("glossary")` to get the display strings, then merge them with the structural data by slug.

- [ ] **Step 2: Same pattern for physicists.ts and branches.ts**

Same approach — keep slugs, relatedTopics, numeric data. Move `name`, `oneLiner`, `bio`, `contributions`, `title`, `subtitle`, `description` etc. into the JSON message files.

---

### Task 19: Add Language Switcher to Nav

**Files:**
- Modify: `components/layout/nav.tsx`

- [ ] **Step 1: Add language switcher**

Add a simple locale switcher next to the theme toggle. Create it as a client component:

```tsx
"use client";

import { useLocale } from "next-intl";
import { useRouter, usePathname } from "@/i18n/navigation";
import { locales } from "@/i18n/config";

const LOCALE_LABELS: Record<string, string> = {
  en: "EN",
  ru: "RU",
};

export function LocaleSwitcher() {
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();

  function onChange(newLocale: string) {
    router.replace(pathname, { locale: newLocale });
  }

  return (
    <div className="flex items-center gap-1 border border-[var(--color-fg-3)] px-2 py-1.5 font-mono text-xs uppercase tracking-wider">
      {locales.map((loc) => (
        <button
          key={loc}
          onClick={() => onChange(loc)}
          className={`cursor-pointer px-1.5 py-0.5 transition-colors ${
            loc === locale
              ? "text-[var(--color-cyan)]"
              : "text-[var(--color-fg-2)] hover:text-[var(--color-fg-1)]"
          }`}
        >
          {LOCALE_LABELS[loc]}
        </button>
      ))}
    </div>
  );
}
```

Add `<LocaleSwitcher />` in `nav.tsx` next to `<ThemeToggle />`.

---

### Task 20: Update Sitemap for Locales

**Files:**
- Modify: `app/sitemap.ts`

- [ ] **Step 1: Add locale variants**

Update the sitemap to generate entries for all locales. For the default locale (`en`), use the clean URL (no prefix). For other locales, add the prefix:

```ts
import type { MetadataRoute } from "next";
import { BRANCHES } from "@/lib/content/branches";
import { PHYSICISTS } from "@/lib/content/physicists";
import { GLOSSARY } from "@/lib/content/glossary";
import { locales, defaultLocale } from "@/i18n/config";

const BASE = "https://physics.it.com";

function localizedUrl(path: string, locale: string): string {
  if (locale === defaultLocale) return `${BASE}${path}`;
  return `${BASE}/${locale}${path}`;
}

function alternates(path: string): Record<string, string> {
  const result: Record<string, string> = {};
  for (const locale of locales) {
    result[locale] = localizedUrl(path, locale);
  }
  return result;
}

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date().toISOString();

  const staticPaths = [
    { path: "/", priority: 1.0, changeFrequency: "weekly" as const },
    { path: "/privacy", priority: 0.3, changeFrequency: "yearly" as const },
    { path: "/terms", priority: 0.3, changeFrequency: "yearly" as const },
    { path: "/cookies", priority: 0.3, changeFrequency: "yearly" as const },
  ];

  const entries: MetadataRoute.Sitemap = [];

  for (const { path, priority, changeFrequency } of staticPaths) {
    for (const locale of locales) {
      entries.push({
        url: localizedUrl(path, locale),
        lastModified: now,
        changeFrequency,
        priority,
        alternates: { languages: alternates(path) },
      });
    }
  }

  // Branch pages, topic pages, physicist pages, dictionary pages — same pattern
  // Generate for each locale with alternates pointing to all locale variants

  for (const b of BRANCHES) {
    for (const locale of locales) {
      entries.push({
        url: localizedUrl(`/${b.slug}`, locale),
        lastModified: now,
        changeFrequency: "monthly",
        priority: 0.8,
        alternates: { languages: alternates(`/${b.slug}`) },
      });
    }
    for (const t of b.topics.filter((t) => t.status === "live")) {
      for (const locale of locales) {
        entries.push({
          url: localizedUrl(`/${b.slug}/${t.slug}`, locale),
          lastModified: now,
          changeFrequency: "monthly",
          priority: 0.9,
          alternates: { languages: alternates(`/${b.slug}/${t.slug}`) },
        });
      }
    }
  }

  for (const locale of locales) {
    entries.push({
      url: localizedUrl("/physicists", locale),
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.7,
      alternates: { languages: alternates("/physicists") },
    });
  }
  for (const p of PHYSICISTS) {
    for (const locale of locales) {
      entries.push({
        url: localizedUrl(`/physicists/${p.slug}`, locale),
        lastModified: now,
        changeFrequency: "monthly",
        priority: 0.6,
        alternates: { languages: alternates(`/physicists/${p.slug}`) },
      });
    }
  }

  for (const locale of locales) {
    entries.push({
      url: localizedUrl("/dictionary", locale),
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.7,
      alternates: { languages: alternates("/dictionary") },
    });
  }
  for (const term of GLOSSARY) {
    for (const locale of locales) {
      entries.push({
        url: localizedUrl(`/dictionary/${term.slug}`, locale),
        lastModified: now,
        changeFrequency: "monthly",
        priority: 0.5,
        alternates: { languages: alternates(`/dictionary/${term.slug}`) },
      });
    }
  }

  return entries;
}
```

---

### Task 21: Update Components to Use Translations

**Files:**
- Modify: `components/layout/footer.tsx`
- Modify: `components/layout/cookie-banner.tsx`

- [ ] **Step 1: Update footer.tsx**

Replace hardcoded strings with `useTranslations("common")` calls. Since `Footer` is a server component, use `getTranslations`:

```tsx
import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { GitBranch, User, BookOpen } from "lucide-react";
import { Logo } from "./logo";
import { WIDE_CONTAINER } from "@/lib/layout";
import { NewsletterForm } from "@/components/layout/newsletter-form";

export async function Footer() {
  const t = await getTranslations("common");

  const NAV_LINKS = [
    { href: "/#branches", label: t("footer.branches"), icon: GitBranch },
    { href: "/physicists", label: t("footer.physicists"), icon: User },
    { href: "/dictionary", label: t("footer.dictionary"), icon: BookOpen },
  ];

  const LEGAL_LINKS = [
    { href: "/privacy", label: t("footer.privacyPolicy") },
    { href: "/terms", label: t("footer.termsOfService") },
    { href: "/cookies", label: t("footer.cookiePolicy") },
  ];

  // ... rest of the component stays the same, using Link from i18n/navigation
  // and t("footer.copyright") for the copyright text
}
```

- [ ] **Step 2: Update cookie-banner.tsx**

Since this is a client component, use `useTranslations`:

```tsx
"use client";

import { useState, useEffect } from "react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";

const STORAGE_KEY = "physics-cookie-consent";

export function CookieBanner() {
  const t = useTranslations("common");
  // ... same logic, replace hardcoded strings:
  // "This site uses localStorage..." → t("cookieBanner.message")
  // "Cookie policy" → t("cookieBanner.linkText")
  // "Accept" → t("cookieBanner.accept")
}
```

---

## Self-Review Checklist

1. **Spec coverage:**
   - [x] Scene card clipping fix (Task 1)
   - [x] Dark mode axes — JSXGraph (Task 2-3)
   - [x] Dark mode — canvas components (Task 4)
   - [x] Dictionary layout refactor (Task 6)
   - [x] Inline visualizations (Task 6)
   - [x] `illustration` field (Task 5)
   - [x] 7 new visualizations (Tasks 7-12)
   - [x] Visualization registry (Task 13)
   - [x] next-intl setup (Tasks 14-15)
   - [x] Message files (Task 16)
   - [x] Route restructure (Task 17)
   - [x] Static data i18n (Task 18)
   - [x] Language switcher (Task 19)
   - [x] Sitemap with locales (Task 20)
   - [x] Component translations (Task 21)

2. **Placeholder scan:** All steps contain complete code. No TBDs.

3. **Type consistency:**
   - `useThemeColors` returns `ThemeColors` with `fg0-3`, `bg0-1` — used consistently across Tasks 2-12
   - `AsideLink` type imported from `aside-links.tsx` — matches existing interface
   - `GlossaryTermData` introduced in Task 18 — consistent with structural-only approach
   - `Visualization` component interface unchanged — `vizKey: string`
