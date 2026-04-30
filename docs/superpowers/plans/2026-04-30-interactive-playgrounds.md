# Interactive Playgrounds Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ship a public `/play` route with a fullscreen, shareable, mobile-friendly Orbital Mechanics N-body playground, on top of a reusable framework that the four follow-up playgrounds (pendulum, slits, EM, time dilation) can plug into.

**Architecture:** A Next.js 15 route segment `app/[locale]/play/` provides shared chrome (server `layout.tsx` for positioning + client `playground-shell.tsx` for interactivity). Each playground is a `next/dynamic`-loaded client component under `components/playgrounds/<slug>/` that uses a `usePlaygroundState(zodSchema)` hook to sync its state with the URL. The Orbital Mechanics playground extends a new pure-functional `lib/physics/n-body.ts` solver (Velocity-Verlet + Plummer softening) and is wired to the existing `/ask` deeplink + scene-catalog system.

**Tech Stack:** Next.js 15, React 19, TypeScript strict, Zod, Tailwind v4, Vitest, next-intl, existing `useAnimationFrame` + `useThemeColors` hooks, existing `SIMULATION_REGISTRY` lazy-loading pattern.

**Spec:** `docs/superpowers/specs/2026-04-30-interactive-playgrounds-design.md`

---

## Conventions used throughout this plan

- All file paths are absolute from the repo root (`/Users/romanpochtman/Developer/physics/`).
- Test runner is `pnpm test` (vitest, single run) and `pnpm test:watch`. Single-file: `pnpm test path/to/file.test.ts`.
- Type checker: `pnpm exec tsc --noEmit` (strict).
- Linter: `pnpm lint` (Next ESLint).
- Dev server: `pnpm dev` → http://localhost:3000.
- Commit style follows existing repo: `feat(playgrounds): ...`, `test(physics): ...`, etc. (see `git log --oneline -10`).
- Every task ends with a commit. Use `git add <specific files>` (per CLAUDE.md, never `git add -A`).

---

## Task 0: Create worktree + feature branch

**Files:** None (git operation).

- [ ] **Step 1: Create a worktree off `main` for this feature**

Per `superpowers:using-git-worktrees`: keep this work isolated from the active `seo/foundation-session-1` branch.

```bash
cd /Users/romanpochtman/Developer/physics
git fetch origin
git worktree add ../physics-playgrounds -b feat/playgrounds origin/main
cd ../physics-playgrounds
pnpm install
```

- [ ] **Step 2: Verify clean state**

```bash
git status
pnpm test
pnpm exec tsc --noEmit
```

Expected: clean tree, all existing tests pass, no type errors.

> All subsequent task paths are relative to `../physics-playgrounds` (the worktree).

---

## Task 1: N-body solver — types and pure step function (TDD)

**Files:**
- Create: `lib/physics/n-body.ts`
- Test: `tests/physics/n-body.test.ts`

- [ ] **Step 1: Write the failing test for two-body circular orbit energy conservation**

Create `tests/physics/n-body.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { step, totalEnergy, totalMomentum, type Body } from "@/lib/physics/n-body";

function clone(bodies: Body[]): Body[] {
  return bodies.map((b) => ({ ...b }));
}

describe("n-body step (Velocity-Verlet)", () => {
  it("conserves total energy within 1% over 1000 steps for a 2-body circular orbit", () => {
    // Body 1 at origin with mass 1, Body 2 in circular orbit at r=1.
    // For circular orbit with G=1: v = sqrt(G * M / r) = 1.
    const initial: Body[] = [
      { id: "a", mass: 1, x: 0, y: 0, vx: 0, vy: 0 },
      { id: "b", mass: 0.001, x: 1, y: 0, vx: 0, vy: 1 },
    ];
    const E0 = totalEnergy(initial);
    let bodies = clone(initial);
    const dt = 0.005;
    for (let i = 0; i < 1000; i++) bodies = step(bodies, dt);
    const E1 = totalEnergy(bodies);
    expect(Math.abs((E1 - E0) / E0)).toBeLessThan 0.01;
  });
});
```

(Note: replace `toBeLessThan 0.01` with `toBeLessThan(0.01)` — typo intentional to fail fast.)

Wait — that'd be a syntax error rather than a test fail. Use the actual call:

```ts
    expect(Math.abs((E1 - E0) / E0)).toBeLessThan(0.01);
```

Final test file content:

```ts
import { describe, expect, it } from "vitest";
import { step, totalEnergy, totalMomentum, type Body } from "@/lib/physics/n-body";

function clone(bodies: Body[]): Body[] {
  return bodies.map((b) => ({ ...b }));
}

describe("n-body step (Velocity-Verlet)", () => {
  it("conserves total energy within 1% over 1000 steps for a 2-body circular orbit", () => {
    const initial: Body[] = [
      { id: "a", mass: 1, x: 0, y: 0, vx: 0, vy: 0 },
      { id: "b", mass: 0.001, x: 1, y: 0, vx: 0, vy: 1 },
    ];
    const E0 = totalEnergy(initial);
    let bodies = clone(initial);
    const dt = 0.005;
    for (let i = 0; i < 1000; i++) bodies = step(bodies, dt);
    const E1 = totalEnergy(bodies);
    expect(Math.abs((E1 - E0) / E0)).toBeLessThan(0.01);
  });

  it("conserves total momentum exactly (within float epsilon) over 100 steps", () => {
    const initial: Body[] = [
      { id: "a", mass: 2, x: -1, y: 0, vx: 0, vy: -0.5 },
      { id: "b", mass: 3, x: 1, y: 0, vx: 0, vy: 0.5 },
      { id: "c", mass: 1, x: 0, y: 1, vx: 0.3, vy: 0 },
    ];
    const p0 = totalMomentum(initial);
    let bodies = clone(initial);
    for (let i = 0; i < 100; i++) bodies = step(bodies, 0.01);
    const p1 = totalMomentum(bodies);
    expect(Math.abs(p1.px - p0.px)).toBeLessThan(1e-9);
    expect(Math.abs(p1.py - p0.py)).toBeLessThan(1e-9);
  });

  it("does not produce NaN when two bodies coincide (Plummer softening)", () => {
    const bodies: Body[] = [
      { id: "a", mass: 1, x: 0, y: 0, vx: 0, vy: 0 },
      { id: "b", mass: 1, x: 0, y: 0, vx: 0, vy: 0 },
    ];
    const next = step(bodies, 0.01);
    expect(Number.isFinite(next[0]!.x)).toBe(true);
    expect(Number.isFinite(next[0]!.y)).toBe(true);
    expect(Number.isFinite(next[0]!.vx)).toBe(true);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

```bash
pnpm test tests/physics/n-body.test.ts
```

Expected: FAIL — `Cannot resolve "@/lib/physics/n-body"`.

- [ ] **Step 3: Write the minimal implementation**

Create `lib/physics/n-body.ts`:

```ts
export interface Body {
  id: string;
  mass: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
}

export interface NBodyOptions {
  G?: number;
  softening?: number;
}

const DEFAULT_G = 1;
const DEFAULT_SOFTENING = 0.05;

function accelerations(
  bodies: Body[],
  G: number,
  softening: number,
): Array<{ ax: number; ay: number }> {
  const eps2 = softening * softening;
  const acc = bodies.map(() => ({ ax: 0, ay: 0 }));
  for (let i = 0; i < bodies.length; i++) {
    const bi = bodies[i]!;
    for (let j = i + 1; j < bodies.length; j++) {
      const bj = bodies[j]!;
      const dx = bj.x - bi.x;
      const dy = bj.y - bi.y;
      const r2 = dx * dx + dy * dy + eps2;
      const inv = 1 / Math.sqrt(r2 * r2 * r2); // 1 / r^3 (softened)
      const fx = G * dx * inv;
      const fy = G * dy * inv;
      acc[i]!.ax += fx * bj.mass;
      acc[i]!.ay += fy * bj.mass;
      acc[j]!.ax -= fx * bi.mass;
      acc[j]!.ay -= fy * bi.mass;
    }
  }
  return acc;
}

/**
 * Velocity-Verlet integrator. Symplectic — conserves energy over long runs.
 * Pure: does not mutate input.
 */
export function step(
  bodies: Body[],
  dt: number,
  opts: NBodyOptions = {},
): Body[] {
  const G = opts.G ?? DEFAULT_G;
  const softening = opts.softening ?? DEFAULT_SOFTENING;
  const half = dt * 0.5;

  const a0 = accelerations(bodies, G, softening);

  // Drift positions by full dt with kicked velocities (kick-drift-kick)
  const drifted = bodies.map((b, i) => ({
    ...b,
    vx: b.vx + a0[i]!.ax * half,
    vy: b.vy + a0[i]!.ay * half,
  }));
  const moved = drifted.map((b) => ({
    ...b,
    x: b.x + b.vx * dt,
    y: b.y + b.vy * dt,
  }));

  const a1 = accelerations(moved, G, softening);
  return moved.map((b, i) => ({
    ...b,
    vx: b.vx + a1[i]!.ax * half,
    vy: b.vy + a1[i]!.ay * half,
  }));
}

export function totalEnergy(
  bodies: Body[],
  opts: NBodyOptions = {},
): number {
  const G = opts.G ?? DEFAULT_G;
  const softening = opts.softening ?? DEFAULT_SOFTENING;
  const eps2 = softening * softening;
  let kinetic = 0;
  for (const b of bodies) {
    kinetic += 0.5 * b.mass * (b.vx * b.vx + b.vy * b.vy);
  }
  let potential = 0;
  for (let i = 0; i < bodies.length; i++) {
    for (let j = i + 1; j < bodies.length; j++) {
      const bi = bodies[i]!;
      const bj = bodies[j]!;
      const dx = bj.x - bi.x;
      const dy = bj.y - bi.y;
      const r = Math.sqrt(dx * dx + dy * dy + eps2);
      potential -= (G * bi.mass * bj.mass) / r;
    }
  }
  return kinetic + potential;
}

export function totalMomentum(bodies: Body[]): { px: number; py: number } {
  let px = 0;
  let py = 0;
  for (const b of bodies) {
    px += b.mass * b.vx;
    py += b.mass * b.vy;
  }
  return { px, py };
}

export function centerOfMass(bodies: Body[]): { x: number; y: number } {
  const M = bodies.reduce((s, b) => s + b.mass, 0);
  if (M === 0) return { x: 0, y: 0 };
  let x = 0;
  let y = 0;
  for (const b of bodies) {
    x += (b.mass * b.x) / M;
    y += (b.mass * b.y) / M;
  }
  return { x, y };
}
```

- [ ] **Step 4: Run tests to verify they pass**

```bash
pnpm test tests/physics/n-body.test.ts
```

Expected: PASS — 3 tests green.

- [ ] **Step 5: Commit**

```bash
git add lib/physics/n-body.ts tests/physics/n-body.test.ts
git commit -m "feat(physics): add N-body Velocity-Verlet solver with Plummer softening"
```

---

## Task 2: N-body presets

**Files:**
- Create: `components/playgrounds/orbital-mechanics/presets.ts`
- Test: `components/playgrounds/orbital-mechanics/presets.test.ts`

- [ ] **Step 1: Write failing tests for preset shape and momentum-balanced presets**

Create `components/playgrounds/orbital-mechanics/presets.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { totalMomentum } from "@/lib/physics/n-body";
import { PRESETS, getPreset, type PresetId } from "./presets";

describe("orbital presets", () => {
  it("exposes 4 presets keyed by id", () => {
    const ids: PresetId[] = ["figure-8", "solar-mini", "pythagorean", "random-cluster"];
    for (const id of ids) expect(PRESETS[id]).toBeDefined();
  });

  it("figure-8 has zero net momentum", () => {
    const bodies = getPreset("figure-8");
    const p = totalMomentum(bodies);
    expect(Math.abs(p.px)).toBeLessThan(1e-9);
    expect(Math.abs(p.py)).toBeLessThan(1e-9);
  });

  it("pythagorean has 3 bodies at rest with masses 3, 4, 5", () => {
    const bodies = getPreset("pythagorean");
    expect(bodies).toHaveLength(3);
    const masses = bodies.map((b) => b.mass).sort((a, b) => a - b);
    expect(masses).toEqual([3, 4, 5]);
    for (const b of bodies) {
      expect(b.vx).toBe(0);
      expect(b.vy).toBe(0);
    }
  });

  it("random-cluster is deterministic across calls", () => {
    const a = getPreset("random-cluster");
    const b = getPreset("random-cluster");
    expect(a).toEqual(b);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

```bash
pnpm test components/playgrounds/orbital-mechanics/presets.test.ts
```

Expected: FAIL — `Cannot resolve "./presets"`.

- [ ] **Step 3: Write the implementation**

Create `components/playgrounds/orbital-mechanics/presets.ts`:

```ts
import type { Body } from "@/lib/physics/n-body";

export type PresetId = "figure-8" | "solar-mini" | "pythagorean" | "random-cluster";

// Chenciner-Montgomery (2000) figure-8: three equal masses chase each other
// along a single ∞-shape. Zero total momentum, zero angular momentum.
const FIGURE_8: Body[] = [
  { id: "a", mass: 1, x: 0.97000436, y: -0.24308753, vx: 0.466203685, vy: 0.43236573 },
  { id: "b", mass: 1, x: -0.97000436, y: 0.24308753, vx: 0.466203685, vy: 0.43236573 },
  { id: "c", mass: 1, x: 0, y: 0, vx: -0.93240737, vy: -0.86473146 },
];

const SOLAR_MINI: Body[] = [
  { id: "sun", mass: 100, x: 0, y: 0, vx: 0, vy: 0 },
  { id: "p1", mass: 1, x: 1.5, y: 0, vx: 0, vy: 8.165 },
  { id: "p2", mass: 0.7, x: -2.5, y: 0, vx: 0, vy: -6.32 },
  { id: "p3", mass: 0.4, x: 0, y: 4, vx: -5, vy: 0 },
];

// Burrau's (1913) pythagorean problem: masses 3, 4, 5 at rest at the corners
// of a 3-4-5 right triangle. Notoriously chaotic.
const PYTHAGOREAN: Body[] = [
  { id: "m3", mass: 3, x: 1, y: 3, vx: 0, vy: 0 },
  { id: "m4", mass: 4, x: -2, y: -1, vx: 0, vy: 0 },
  { id: "m5", mass: 5, x: 1, y: -1, vx: 0, vy: 0 },
];

// Mulberry32 — tiny deterministic PRNG for the random-cluster preset.
function mulberry32(seed: number) {
  let s = seed >>> 0;
  return function () {
    s = (s + 0x6d2b79f5) >>> 0;
    let t = s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function makeRandomCluster(): Body[] {
  const rand = mulberry32(0x510B7);
  const bodies: Body[] = [];
  for (let i = 0; i < 5; i++) {
    bodies.push({
      id: `r${i}`,
      mass: 0.5 + rand() * 4.5,
      x: (rand() - 0.5) * 6,
      y: (rand() - 0.5) * 6,
      vx: (rand() - 0.5) * 1.5,
      vy: (rand() - 0.5) * 1.5,
    });
  }
  return bodies;
}

export const PRESETS: Record<PresetId, Body[]> = {
  "figure-8": FIGURE_8,
  "solar-mini": SOLAR_MINI,
  "pythagorean": PYTHAGOREAN,
  "random-cluster": makeRandomCluster(),
};

export function getPreset(id: PresetId): Body[] {
  return PRESETS[id].map((b) => ({ ...b }));
}

export const PRESET_IDS: PresetId[] = ["figure-8", "solar-mini", "pythagorean", "random-cluster"];
```

- [ ] **Step 4: Run tests to verify they pass**

```bash
pnpm test components/playgrounds/orbital-mechanics/presets.test.ts
```

Expected: PASS — 4 tests green.

- [ ] **Step 5: Commit**

```bash
git add components/playgrounds/orbital-mechanics/presets.ts components/playgrounds/orbital-mechanics/presets.test.ts
git commit -m "feat(playgrounds): add orbital-mechanics presets (figure-8, solar-mini, pythagorean, random-cluster)"
```

---

## Task 3: URL state encoder (encode-state)

**Files:**
- Create: `app/[locale]/play/_components/encode-state.ts`
- Test: `app/[locale]/play/_components/encode-state.test.ts`

- [ ] **Step 1: Write failing tests**

Create `app/[locale]/play/_components/encode-state.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { z } from "zod";
import { encodeState, decodeState } from "./encode-state";

const flatSchema = z.object({
  L: z.number().default(1.0),
  theta: z.number().default(0.3),
  mode: z.enum(["small", "exact"]).default("exact"),
});

const blobSchema = z.object({
  preset: z.string().default("figure-8"),
  bodies: z.array(z.object({ id: z.string(), mass: z.number() })).default([]),
});

describe("encode-state — flat (params) mode", () => {
  it("round-trips primitive fields", () => {
    const sp = encodeState({ L: 2.5, theta: 0.4, mode: "small" }, flatSchema, "params");
    expect(sp.get("L")).toBe("2.5");
    expect(sp.get("theta")).toBe("0.4");
    expect(sp.get("mode")).toBe("small");
    const back = decodeState(new URLSearchParams(sp.toString()), flatSchema, "params");
    expect(back).toEqual({ L: 2.5, theta: 0.4, mode: "small" });
  });

  it("returns defaults when params are missing", () => {
    const back = decodeState(new URLSearchParams(""), flatSchema, "params");
    expect(back).toEqual({ L: 1.0, theta: 0.3, mode: "exact" });
  });

  it("falls back to defaults on malformed params", () => {
    const sp = new URLSearchParams("L=not-a-number&mode=invalid");
    const back = decodeState(sp, flatSchema, "params");
    expect(back).toEqual({ L: 1.0, theta: 0.3, mode: "exact" });
  });
});

describe("encode-state — blob mode", () => {
  it("round-trips a structured object via base64", () => {
    const state = {
      preset: "pythagorean",
      bodies: [{ id: "a", mass: 3 }, { id: "b", mass: 4 }],
    };
    const sp = encodeState(state, blobSchema, "blob");
    expect(sp.has("s")).toBe(true);
    const back = decodeState(new URLSearchParams(sp.toString()), blobSchema, "blob");
    expect(back).toEqual(state);
  });

  it("falls back to defaults on malformed base64", () => {
    const sp = new URLSearchParams("s=NOT_VALID_B64!!");
    const back = decodeState(sp, blobSchema, "blob");
    expect(back).toEqual({ preset: "figure-8", bodies: [] });
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

```bash
pnpm test app/\[locale\]/play/_components/encode-state.test.ts
```

Expected: FAIL — `Cannot resolve "./encode-state"`.

- [ ] **Step 3: Write the implementation**

Create `app/[locale]/play/_components/encode-state.ts`:

```ts
import { z } from "zod";

export type UrlMode = "params" | "blob";

function toUrlSafeBase64(s: string): string {
  // Browser-safe base64 with URL-safe alphabet (no padding).
  const b64 = typeof window === "undefined"
    ? Buffer.from(s, "utf-8").toString("base64")
    : window.btoa(unescape(encodeURIComponent(s)));
  return b64.replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function fromUrlSafeBase64(s: string): string {
  // Accept both URL-safe (-, _) and standard (+, /) inputs.
  const padded = s.replace(/-/g, "+").replace(/_/g, "/");
  const pad = padded.length % 4;
  const full = pad ? padded + "=".repeat(4 - pad) : padded;
  return typeof window === "undefined"
    ? Buffer.from(full, "base64").toString("utf-8")
    : decodeURIComponent(escape(window.atob(full)));
}

export function encodeState<S extends z.ZodTypeAny>(
  state: z.infer<S>,
  _schema: S,
  mode: UrlMode,
): URLSearchParams {
  const sp = new URLSearchParams();
  if (mode === "blob") {
    sp.set("s", toUrlSafeBase64(JSON.stringify(state)));
    return sp;
  }
  // params mode — set every defined primitive
  for (const [k, v] of Object.entries(state as Record<string, unknown>)) {
    if (v === undefined || v === null) continue;
    if (typeof v === "object") {
      // Nested objects in params mode: stringify under the key (rare).
      sp.set(k, toUrlSafeBase64(JSON.stringify(v)));
    } else {
      sp.set(k, String(v));
    }
  }
  return sp;
}

export function decodeState<S extends z.ZodTypeAny>(
  sp: URLSearchParams,
  schema: S,
  mode: UrlMode,
): z.infer<S> {
  if (mode === "blob") {
    const raw = sp.get("s");
    if (!raw) return schema.parse({}) as z.infer<S>;
    try {
      const json = JSON.parse(fromUrlSafeBase64(raw));
      const parsed = schema.safeParse(json);
      if (parsed.success) return parsed.data;
    } catch {
      // fallthrough to defaults
    }
    return schema.parse({}) as z.infer<S>;
  }

  // params mode — best-effort coerce strings to the schema's expected types.
  const raw: Record<string, unknown> = {};
  sp.forEach((value, key) => {
    if (value === "true") raw[key] = true;
    else if (value === "false") raw[key] = false;
    else if (/^-?\d+(\.\d+)?$/.test(value)) raw[key] = Number(value);
    else raw[key] = value;
  });
  const parsed = schema.safeParse(raw);
  return parsed.success ? parsed.data : (schema.parse({}) as z.infer<S>);
}
```

- [ ] **Step 4: Run tests to verify they pass**

```bash
pnpm test app/\[locale\]/play/_components/encode-state.test.ts
```

Expected: PASS — 5 tests green.

- [ ] **Step 5: Commit**

```bash
git add app/\[locale\]/play/_components/encode-state.ts app/\[locale\]/play/_components/encode-state.test.ts
git commit -m "feat(playgrounds): add URL state encoder (params + blob modes)"
```

---

## Task 4: usePlaygroundState hook

**Files:**
- Create: `app/[locale]/play/_components/use-playground-state.ts`

- [ ] **Step 1: Write the implementation**

Create `app/[locale]/play/_components/use-playground-state.ts`:

```ts
"use client";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import type { z } from "zod";
import { decodeState, encodeState, type UrlMode } from "./encode-state";

const WRITE_DEBOUNCE_MS = 250;

export function usePlaygroundState<S extends z.ZodTypeAny>(
  schema: S,
  mode: UrlMode,
): [z.infer<S>, (next: z.infer<S>) => void, () => void] {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const initial = useMemo(
    () => decodeState(new URLSearchParams(searchParams?.toString() ?? ""), schema, mode),
    // Re-decode only when search params identity changes (back/forward navigation).
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [searchParams?.toString()],
  );

  const [state, setStateLocal] = useState<z.infer<S>>(initial);

  // If browser nav changes the URL, hydrate local state from the new URL.
  useEffect(() => {
    setStateLocal(initial);
  }, [initial]);

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const setState = useCallback(
    (next: z.infer<S>) => {
      setStateLocal(next);
      if (debounceRef.current) clearTimeout(debounceRef.current);
      debounceRef.current = setTimeout(() => {
        const sp = encodeState(next, schema, mode);
        const qs = sp.toString();
        router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
      }, WRITE_DEBOUNCE_MS);
    },
    [router, pathname, schema, mode],
  );

  const reset = useCallback(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    router.replace(pathname, { scroll: false });
  }, [router, pathname]);

  useEffect(() => {
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, []);

  return [state, setState, reset];
}
```

- [ ] **Step 2: Type-check**

```bash
pnpm exec tsc --noEmit
```

Expected: no new errors.

- [ ] **Step 3: Commit**

```bash
git add app/\[locale\]/play/_components/use-playground-state.ts
git commit -m "feat(playgrounds): add usePlaygroundState hook (URL <-> state sync)"
```

---

## Task 5: Playground meta registry + orbital schema

**Files:**
- Create: `app/[locale]/play/_components/playground-meta.ts`
- Create: `components/playgrounds/orbital-mechanics/schema.ts`

- [ ] **Step 1: Create the orbital schema**

Create `components/playgrounds/orbital-mechanics/schema.ts`:

```ts
import { z } from "zod";
import { PRESET_IDS } from "./presets";

export const bodySchema = z.object({
  id: z.string(),
  mass: z.number().positive(),
  x: z.number(),
  y: z.number(),
  vx: z.number(),
  vy: z.number(),
});

export const orbitalSchema = z.object({
  preset: z.enum(["figure-8", "solar-mini", "pythagorean", "random-cluster", "custom"])
    .default("figure-8"),
  bodies: z.array(bodySchema).default([]),
  trails: z.boolean().default(true),
  speed: z.union([z.literal(0.25), z.literal(1), z.literal(4)]).default(1),
});

export type OrbitalState = z.infer<typeof orbitalSchema>;
export const ORBITAL_PRESET_IDS = PRESET_IDS;
```

- [ ] **Step 2: Create the meta registry**

Create `app/[locale]/play/_components/playground-meta.ts`:

```ts
import type { ComponentType } from "react";
import type { z } from "zod";
import type { UrlMode } from "./encode-state";
import { orbitalSchema } from "@/components/playgrounds/orbital-mechanics/schema";

export interface PlaygroundMeta<S extends z.ZodTypeAny = z.ZodTypeAny> {
  slug: string;
  /** Translation key for the title (under `play.<slug>.title`) */
  titleKey: string;
  /** Translation key for the AI starter prompt (under `play.<slug>.aiPrompt`) */
  aiPromptKey: string;
  /** Scene id used in the simulation registry + scene catalog */
  sceneId: string;
  schema: S;
  urlMode: UrlMode;
  /** The actual playground component, lazily loaded */
  loader: () => Promise<{ default: ComponentType }>;
}

export const PLAYGROUNDS: Record<string, PlaygroundMeta> = {
  "orbital-mechanics": {
    slug: "orbital-mechanics",
    titleKey: "play.orbital-mechanics.title",
    aiPromptKey: "play.orbital-mechanics.aiPrompt",
    sceneId: "OrbitalMechanicsPlayground",
    schema: orbitalSchema,
    urlMode: "blob",
    loader: () =>
      import("@/components/playgrounds/orbital-mechanics").then((m) => ({
        default: m.OrbitalMechanicsPlayground,
      })),
  },
};

export function getPlayground(slug: string): PlaygroundMeta | undefined {
  return PLAYGROUNDS[slug];
}

export const PLAYGROUND_SLUGS = Object.keys(PLAYGROUNDS);
```

- [ ] **Step 3: Type-check**

```bash
pnpm exec tsc --noEmit
```

Expected: no new errors. (The `@/components/playgrounds/orbital-mechanics` import will resolve later — TypeScript treats it as `unknown` until then, but the dynamic-import return type will satisfy `ComponentType`.)

If there's an error, narrow the loader return type to `unknown` and cast inside the loader for now:

```ts
loader: () =>
  import("@/components/playgrounds/orbital-mechanics").then((m) => ({
    default: (m as { OrbitalMechanicsPlayground: ComponentType }).OrbitalMechanicsPlayground,
  })),
```

- [ ] **Step 4: Commit**

```bash
git add app/\[locale\]/play/_components/playground-meta.ts components/playgrounds/orbital-mechanics/schema.ts
git commit -m "feat(playgrounds): add playground meta registry + orbital Zod schema"
```

---

## Task 6: Translations — `messages/en/play.json` and `messages/he/play.json`

**Files:**
- Create: `messages/en/play.json`
- Create: `messages/he/play.json`

- [ ] **Step 1: Write English translations**

Create `messages/en/play.json`:

```json
{
  "indexTitle": "Playgrounds",
  "indexSubtitle": "Drag, drop, share. Physics that fits in a tweet.",
  "back": "Back",
  "share": {
    "copyLink": "Copy link",
    "copied": "Link copied",
    "tweet": "Share on X",
    "explain": "Explain with AI"
  },
  "controls": {
    "play": "Play",
    "pause": "Pause",
    "reset": "Reset",
    "speed": "Speed",
    "trails": "Trails",
    "preset": "Preset",
    "bodies": "Bodies"
  },
  "orbital-mechanics": {
    "title": "Orbital Mechanics",
    "subtitle": "N-body gravitational chaos",
    "indexCardDescription": "Drop bodies, drag to set velocity, watch the chaos unfold.",
    "aiPrompt": "Explain what's happening in this gravitational system.",
    "presets": {
      "figure-8": "Figure-8",
      "solar-mini": "Mini solar system",
      "pythagorean": "Pythagorean (chaos)",
      "random-cluster": "Random cluster"
    }
  }
}
```

- [ ] **Step 2: Write Hebrew translations**

Create `messages/he/play.json`:

```json
{
  "indexTitle": "מגרשי משחקים",
  "indexSubtitle": "גרור, שחרר, שתף. פיזיקה שנכנסת לציוץ.",
  "back": "חזרה",
  "share": {
    "copyLink": "העתק קישור",
    "copied": "הקישור הועתק",
    "tweet": "שתף ב-X",
    "explain": "הסבר עם בינה מלאכותית"
  },
  "controls": {
    "play": "הפעל",
    "pause": "השהה",
    "reset": "אפס",
    "speed": "מהירות",
    "trails": "שובלים",
    "preset": "תרחיש",
    "bodies": "גופים"
  },
  "orbital-mechanics": {
    "title": "מכניקה אורביטלית",
    "subtitle": "כאוס גרביטציוני של N-גופים",
    "indexCardDescription": "הפלט גופים, גרור לקביעת מהירות, צפה בכאוס.",
    "aiPrompt": "הסבר מה קורה במערכת הגרביטציונית הזו.",
    "presets": {
      "figure-8": "ספרה 8",
      "solar-mini": "מערכת שמש קטנה",
      "pythagorean": "פיתגוראי (כאוס)",
      "random-cluster": "אשכול אקראי"
    }
  }
}
```

- [ ] **Step 3: Verify next-intl picks up the new namespace**

next-intl auto-merges `messages/<locale>/*.json` files (already configured this way per existing `common.json`, `home.json`). No code change needed — verify by adding a placeholder use or just check existing config.

```bash
grep -rn "getMessages\|messages/" i18n/ next.config.mjs 2>&1 | head -10
```

If the loader is `messages/<locale>/<namespace>.json` flattened into a single object, then translation keys above would be `play.indexTitle` etc. Verify by reading the existing loader, e.g.:

```bash
cat i18n/request.ts 2>/dev/null || find . -name "request.ts" -path "*/i18n/*"
```

- [ ] **Step 4: Commit**

```bash
git add messages/en/play.json messages/he/play.json
git commit -m "feat(playgrounds): add play namespace translations (en, he)"
```

---

## Task 7: NavGate — extend chrome opt-out for `/play/*`

**Files:**
- Create: `components/layout/nav-gate.tsx`
- Modify: `components/layout/footer-gate.tsx`
- Modify: `app/[locale]/layout.tsx`

- [ ] **Step 1: Read existing FooterGate**

```bash
cat components/layout/footer-gate.tsx
```

It currently hides on `/ask`. We extend it to also hide on `/play`, then create a parallel `NavGate`.

- [ ] **Step 2: Update FooterGate**

Replace `components/layout/footer-gate.tsx` with:

```tsx
"use client";
import { usePathname } from "next/navigation";

const HIDDEN_SEGMENTS = ["ask", "play"];

export function FooterGate({ children }: { children: React.ReactNode }) {
  const pathname = usePathname() ?? "";
  const segments = pathname.split("/").filter(Boolean);
  const hide = segments.some((s) => HIDDEN_SEGMENTS.includes(s));
  if (hide) return null;
  return <>{children}</>;
}
```

- [ ] **Step 3: Create NavGate**

Create `components/layout/nav-gate.tsx`:

```tsx
"use client";
import { usePathname } from "next/navigation";

const HIDDEN_SEGMENTS = ["play"];

export function NavGate({ children }: { children: React.ReactNode }) {
  const pathname = usePathname() ?? "";
  const segments = pathname.split("/").filter(Boolean);
  const hide = segments.some((s) => HIDDEN_SEGMENTS.includes(s));
  if (hide) return null;
  return <>{children}</>;
}
```

(Note: `/ask` keeps its existing site Nav — only `/play/*` is fully fullscreen.)

- [ ] **Step 4: Wire NavGate into the locale layout**

Modify `app/[locale]/layout.tsx` line 34:

```tsx
// Before:
//   <Nav />
// After:
//   <NavGate>
//     <Nav />
//   </NavGate>
```

Also import `NavGate` at the top:

```tsx
import { NavGate } from "@/components/layout/nav-gate";
```

The full diff (lines 6-7 area + line 34):

```tsx
import { Nav } from "@/components/layout/nav";
import { NavGate } from "@/components/layout/nav-gate";
import { Footer } from "@/components/layout/footer";
import { FooterGate } from "@/components/layout/footer-gate";
// ...
      <NavGate>
        <Nav />
      </NavGate>
```

- [ ] **Step 5: Type-check + run existing tests**

```bash
pnpm exec tsc --noEmit
pnpm test
```

Expected: no new errors, all existing tests still pass.

- [ ] **Step 6: Commit**

```bash
git add components/layout/nav-gate.tsx components/layout/footer-gate.tsx app/\[locale\]/layout.tsx
git commit -m "feat(playgrounds): add NavGate + extend FooterGate to hide chrome on /play"
```

---

## Task 8: `/play` route — server layout

**Files:**
- Create: `app/[locale]/play/layout.tsx`

- [ ] **Step 1: Create the play layout**

Create `app/[locale]/play/layout.tsx`:

```tsx
import { setRequestLocale } from "next-intl/server";
import { locales } from "@/i18n/config";

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

export default async function PlayLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  // The shell (top bar + interactivity) is mounted per-page by playground-shell.tsx.
  // Layout owns the absolute fullscreen frame so each page gets a clean 100dvh slot.
  return (
    <div className="fixed inset-0 flex flex-col bg-[var(--color-bg-0)]">
      {children}
    </div>
  );
}
```

- [ ] **Step 2: Verify dev server**

```bash
pnpm dev
# Visit http://localhost:3000/play (will 404 until Task 11; visiting just exercises the layout)
```

Expected: layout file compiles; no TS errors.

- [ ] **Step 3: Commit**

```bash
git add app/\[locale\]/play/layout.tsx
git commit -m "feat(playgrounds): add /play server layout (fullscreen frame)"
```

---

## Task 9: Share buttons component

**Files:**
- Create: `app/[locale]/play/_components/share-buttons.tsx`

- [ ] **Step 1: Create share-buttons.tsx**

Create `app/[locale]/play/_components/share-buttons.tsx`:

```tsx
"use client";
import { useState } from "react";
import { useTranslations, useLocale } from "next-intl";
import { Link2, Twitter, Sparkles, Check } from "lucide-react";

interface Props {
  /** Display title used in the tweet text */
  shareTitle: string;
  /** Scene id used by the AI deeplink */
  sceneId: string;
  /** Translation key for the AI starter prompt (resolved here so we get the localized string) */
  aiPromptKey: string;
  /**
   * Encoded URL params for the current state. We pass them in pre-encoded so the
   * playground (which already builds them via usePlaygroundState) is the source of truth.
   */
  encodedParams: URLSearchParams;
}

export function ShareButtons({ shareTitle, sceneId, aiPromptKey, encodedParams }: Props) {
  const t = useTranslations("play.share");
  const tRoot = useTranslations();
  const locale = useLocale();
  const [copied, setCopied] = useState(false);

  const currentUrl =
    typeof window === "undefined" ? "" : window.location.href;

  const tweetUrl = (() => {
    const text = encodeURIComponent(`${shareTitle} · Physics`);
    const url = encodeURIComponent(currentUrl);
    return `https://twitter.com/intent/tweet?text=${text}&url=${url}`;
  })();

  const askUrl = (() => {
    const aiPrompt = tRoot(aiPromptKey);
    const params = new URLSearchParams();
    params.set("scene", sceneId);
    params.set("params", encodedParams.toString());
    params.set("prompt", aiPrompt);
    return `/${locale}/ask?${params.toString()}`;
  })();

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(currentUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // clipboard API unavailable; silently no-op
    }
  }

  return (
    <div className="flex items-center gap-1">
      <button
        type="button"
        onClick={copyLink}
        aria-label={t("copyLink")}
        className="inline-flex h-8 w-8 items-center justify-center rounded text-[var(--color-fg-1)] hover:bg-[var(--color-fg-4)]/30"
      >
        {copied ? <Check size={14} /> : <Link2 size={14} />}
      </button>
      <a
        href={tweetUrl}
        target="_blank"
        rel="noopener noreferrer"
        aria-label={t("tweet")}
        className="inline-flex h-8 w-8 items-center justify-center rounded text-[var(--color-fg-1)] hover:bg-[var(--color-fg-4)]/30"
      >
        <Twitter size={14} />
      </a>
      <a
        href={askUrl}
        aria-label={t("explain")}
        className="inline-flex h-8 items-center gap-1 rounded bg-[var(--color-cyan)] px-2 text-xs font-mono uppercase tracking-wider text-white hover:bg-[color-mix(in_srgb,var(--color-cyan)_92%,white)]"
      >
        <Sparkles size={14} />
        <span>{t("explain")}</span>
      </a>
    </div>
  );
}
```

- [ ] **Step 2: Type-check**

```bash
pnpm exec tsc --noEmit
```

Expected: clean.

- [ ] **Step 3: Commit**

```bash
git add app/\[locale\]/play/_components/share-buttons.tsx
git commit -m "feat(playgrounds): add share buttons (copy/tweet/explain-with-ai)"
```

---

## Task 10: Playground shell (client wrapper)

**Files:**
- Create: `app/[locale]/play/_components/playground-shell.tsx`

- [ ] **Step 1: Create the shell**

Create `app/[locale]/play/_components/playground-shell.tsx`:

```tsx
"use client";
import { useTranslations } from "next-intl";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { ShareButtons } from "./share-buttons";

interface Props {
  /** Localized title shown in the top bar */
  title: string;
  /** Localized share-card title (same as title in most cases) */
  shareTitle: string;
  sceneId: string;
  aiPromptKey: string;
  /** Pre-encoded URL params for the current state; the playground passes them in */
  encodedParams: URLSearchParams;
  /** The playground component itself */
  children: React.ReactNode;
  backHref: string;
}

export function PlaygroundShell({
  title,
  shareTitle,
  sceneId,
  aiPromptKey,
  encodedParams,
  children,
  backHref,
}: Props) {
  const t = useTranslations("play");

  return (
    <>
      <header
        className="absolute inset-inline-0 inset-block-start-0 z-50 flex h-12 items-center justify-between gap-2 border-b border-[var(--color-fg-4)]/40 bg-[var(--color-bg-0)]/80 px-3 backdrop-blur-md"
      >
        <Link
          href={backHref}
          aria-label={t("back")}
          className="inline-flex h-8 w-8 items-center justify-center rounded text-[var(--color-fg-1)] hover:bg-[var(--color-fg-4)]/30"
        >
          <ArrowLeft size={16} />
        </Link>
        <h1 className="truncate font-mono text-xs uppercase tracking-wider text-[var(--color-fg-1)]">
          {title}
        </h1>
        <ShareButtons
          shareTitle={shareTitle}
          sceneId={sceneId}
          aiPromptKey={aiPromptKey}
          encodedParams={encodedParams}
        />
      </header>
      <main className="absolute inset-inline-0 inset-block-start-12 inset-block-end-0 overflow-hidden">
        {children}
      </main>
    </>
  );
}
```

(Note: we keep the top bar always-on for v1. Collapse-on-idle is a follow-up — keeps Task 10 from sprawling. The spec's §6.1 collapse behavior is captured as a TODO in Task 25.)

- [ ] **Step 2: Type-check**

```bash
pnpm exec tsc --noEmit
```

- [ ] **Step 3: Commit**

```bash
git add app/\[locale\]/play/_components/playground-shell.tsx
git commit -m "feat(playgrounds): add playground shell (top bar + share)"
```

---

## Task 11: Orbital — gestures module

**Files:**
- Create: `components/playgrounds/orbital-mechanics/gestures.ts`

- [ ] **Step 1: Create gestures module**

Create `components/playgrounds/orbital-mechanics/gestures.ts`:

```ts
import type { RefObject } from "react";

export interface GestureCallbacks {
  /** A finger went down on empty canvas; (x, y) in canvas coords */
  onTap: (x: number, y: number) => void;
  /** A finger went down on a body; index = body index in the rendered list */
  onBodyDown: (index: number, x: number, y: number) => void;
  /** Finger moved while a body was selected */
  onBodyDrag: (index: number, x: number, y: number) => void;
  /** Finger released; if dragVx/dragVy are nonzero the user dragged from a body to set velocity */
  onBodyUp: (index: number, dragVx: number, dragVy: number) => void;
  /** Two-finger pinch — scale relative to start of pinch */
  onPinch: (scale: number, centerX: number, centerY: number) => void;
  /** Two-finger pan — delta in canvas px */
  onPan: (dx: number, dy: number) => void;
  /** Long-press on a body (≥ 500ms hold without movement) */
  onLongPress: (index: number, x: number, y: number) => void;
}

export interface HitTest {
  /** Returns the body index at canvas (x, y), or -1 for empty */
  hit: (x: number, y: number) => number;
}

const LONG_PRESS_MS = 500;
const TAP_MOVE_THRESHOLD_PX = 6;

export function attachGestures(
  el: HTMLElement,
  hitTest: HitTest,
  cb: GestureCallbacks,
): () => void {
  let activeBody = -1;
  let downX = 0;
  let downY = 0;
  let startX = 0;
  let startY = 0;
  let moved = false;
  let longPressTimer: ReturnType<typeof setTimeout> | null = null;

  // Two-finger state
  let pinchStartDist = 0;
  let pinchStartScale = 1;
  let lastPan = { x: 0, y: 0 };

  function rectCoords(touch: { clientX: number; clientY: number }) {
    const r = el.getBoundingClientRect();
    return { x: touch.clientX - r.left, y: touch.clientY - r.top };
  }

  function onPointerDown(e: PointerEvent) {
    if (e.pointerType === "mouse" && e.button !== 0) return;
    el.setPointerCapture(e.pointerId);
    const { x, y } = rectCoords(e);
    downX = startX = x;
    downY = startY = y;
    moved = false;
    activeBody = hitTest.hit(x, y);
    if (activeBody >= 0) {
      cb.onBodyDown(activeBody, x, y);
      longPressTimer = setTimeout(() => {
        if (!moved && activeBody >= 0) cb.onLongPress(activeBody, x, y);
      }, LONG_PRESS_MS);
    }
  }

  function onPointerMove(e: PointerEvent) {
    const { x, y } = rectCoords(e);
    const dx = x - downX;
    const dy = y - downY;
    if (!moved && Math.hypot(dx, dy) > TAP_MOVE_THRESHOLD_PX) {
      moved = true;
      if (longPressTimer) {
        clearTimeout(longPressTimer);
        longPressTimer = null;
      }
    }
    if (activeBody >= 0 && moved) {
      cb.onBodyDrag(activeBody, x, y);
    }
  }

  function onPointerUp(e: PointerEvent) {
    const { x, y } = rectCoords(e);
    if (longPressTimer) {
      clearTimeout(longPressTimer);
      longPressTimer = null;
    }
    if (activeBody >= 0) {
      const dragVx = moved ? (x - startX) * 0.02 : 0;
      const dragVy = moved ? (y - startY) * 0.02 : 0;
      cb.onBodyUp(activeBody, dragVx, dragVy);
    } else if (!moved) {
      cb.onTap(x, y);
    }
    activeBody = -1;
  }

  // Two-finger gestures via Touch events (separate from pointer for simplicity).
  function onTouchStart(e: TouchEvent) {
    if (e.touches.length === 2) {
      const a = e.touches[0]!;
      const b = e.touches[1]!;
      pinchStartDist = Math.hypot(a.clientX - b.clientX, a.clientY - b.clientY);
      pinchStartScale = 1;
      lastPan = { x: (a.clientX + b.clientX) / 2, y: (a.clientY + b.clientY) / 2 };
      e.preventDefault();
    }
  }

  function onTouchMove(e: TouchEvent) {
    if (e.touches.length === 2 && pinchStartDist > 0) {
      const a = e.touches[0]!;
      const b = e.touches[1]!;
      const d = Math.hypot(a.clientX - b.clientX, a.clientY - b.clientY);
      const scale = (d / pinchStartDist) * pinchStartScale;
      const cx = (a.clientX + b.clientX) / 2;
      const cy = (a.clientY + b.clientY) / 2;
      cb.onPinch(scale, cx, cy);
      cb.onPan(cx - lastPan.x, cy - lastPan.y);
      lastPan = { x: cx, y: cy };
      e.preventDefault();
    }
  }

  function onTouchEnd() {
    pinchStartDist = 0;
  }

  el.addEventListener("pointerdown", onPointerDown);
  el.addEventListener("pointermove", onPointerMove);
  el.addEventListener("pointerup", onPointerUp);
  el.addEventListener("pointercancel", onPointerUp);
  el.addEventListener("touchstart", onTouchStart, { passive: false });
  el.addEventListener("touchmove", onTouchMove, { passive: false });
  el.addEventListener("touchend", onTouchEnd);
  // Browser default pinch-zoom would fight ours.
  el.style.touchAction = "none";

  return () => {
    el.removeEventListener("pointerdown", onPointerDown);
    el.removeEventListener("pointermove", onPointerMove);
    el.removeEventListener("pointerup", onPointerUp);
    el.removeEventListener("pointercancel", onPointerUp);
    el.removeEventListener("touchstart", onTouchStart);
    el.removeEventListener("touchmove", onTouchMove);
    el.removeEventListener("touchend", onTouchEnd);
    if (longPressTimer) clearTimeout(longPressTimer);
  };
}

// reasonable default body radius (px) used by hit-testing
export const BODY_HIT_RADIUS_PX = 20;
```

- [ ] **Step 2: Type-check**

```bash
pnpm exec tsc --noEmit
```

- [ ] **Step 3: Commit**

```bash
git add components/playgrounds/orbital-mechanics/gestures.ts
git commit -m "feat(playgrounds): add orbital gesture handlers (tap, drag, pinch, long-press)"
```

---

## Task 12: Orbital — controls component

**Files:**
- Create: `components/playgrounds/orbital-mechanics/controls.tsx`

- [ ] **Step 1: Create controls**

Create `components/playgrounds/orbital-mechanics/controls.tsx`:

```tsx
"use client";
import { Play, Pause, RotateCcw } from "lucide-react";
import { useTranslations } from "next-intl";
import type { OrbitalState } from "./schema";
import { ORBITAL_PRESET_IDS, type PresetId } from "./presets";

interface Props {
  state: OrbitalState;
  isPlaying: boolean;
  bodyCount: number;
  onTogglePlay: () => void;
  onChangeSpeed: (s: 0.25 | 1 | 4) => void;
  onChangeTrails: (b: boolean) => void;
  onChangePreset: (p: PresetId) => void;
  onReset: () => void;
}

export function Controls({
  state,
  isPlaying,
  bodyCount,
  onTogglePlay,
  onChangeSpeed,
  onChangeTrails,
  onChangePreset,
  onReset,
}: Props) {
  const t = useTranslations("play.controls");
  const tPresets = useTranslations("play.orbital-mechanics.presets");

  return (
    <div
      className="absolute inset-inline-1/2 inset-block-end-4 z-40 flex max-w-[92vw] -translate-x-1/2 items-center gap-3 rounded-full border border-[var(--color-fg-4)]/40 bg-[var(--color-bg-0)]/80 px-3 py-2 font-mono text-xs uppercase tracking-wider text-[var(--color-fg-1)] backdrop-blur-md md:inset-inline-end-4 md:start-auto md:translate-x-0"
      style={{ insetInlineStart: "50%" }}
    >
      <button
        type="button"
        onClick={onTogglePlay}
        aria-label={isPlaying ? t("pause") : t("play")}
        className="inline-flex h-8 w-8 items-center justify-center rounded-full hover:bg-[var(--color-fg-4)]/30"
      >
        {isPlaying ? <Pause size={14} /> : <Play size={14} />}
      </button>
      <button
        type="button"
        onClick={onReset}
        aria-label={t("reset")}
        className="inline-flex h-8 w-8 items-center justify-center rounded-full hover:bg-[var(--color-fg-4)]/30"
      >
        <RotateCcw size={14} />
      </button>
      <div className="flex items-center gap-1">
        <span className="opacity-60">{t("speed")}</span>
        {([0.25, 1, 4] as const).map((s) => (
          <button
            key={s}
            type="button"
            onClick={() => onChangeSpeed(s)}
            className={`rounded px-1.5 py-0.5 ${state.speed === s ? "bg-[var(--color-cyan)]/30 text-[var(--color-fg-0)]" : "hover:bg-[var(--color-fg-4)]/30"}`}
          >
            {s}×
          </button>
        ))}
      </div>
      <label className="flex items-center gap-1">
        <input
          type="checkbox"
          checked={state.trails}
          onChange={(e) => onChangeTrails(e.target.checked)}
          className="accent-[var(--color-cyan)]"
        />
        <span>{t("trails")}</span>
      </label>
      <select
        value={state.preset}
        onChange={(e) => onChangePreset(e.target.value as PresetId)}
        className="rounded bg-transparent px-1 text-[var(--color-fg-0)] outline-none"
        aria-label={t("preset")}
      >
        {ORBITAL_PRESET_IDS.map((p) => (
          <option key={p} value={p}>{tPresets(p)}</option>
        ))}
        <option value="custom" disabled={state.preset !== "custom"}>custom</option>
      </select>
      <span className="opacity-60">
        {t("bodies")}: {bodyCount}
      </span>
    </div>
  );
}
```

- [ ] **Step 2: Type-check**

```bash
pnpm exec tsc --noEmit
```

- [ ] **Step 3: Commit**

```bash
git add components/playgrounds/orbital-mechanics/controls.tsx
git commit -m "feat(playgrounds): add orbital controls (play/pause/speed/trails/preset)"
```

---

## Task 13: Orbital — canvas + main playground component

**Files:**
- Create: `components/playgrounds/orbital-mechanics/n-body-canvas.tsx`
- Create: `components/playgrounds/orbital-mechanics/index.tsx`

- [ ] **Step 1: Create the canvas**

Create `components/playgrounds/orbital-mechanics/n-body-canvas.tsx`:

```tsx
"use client";
import { useEffect, useRef } from "react";
import { useAnimationFrame } from "@/lib/animation/use-animation-frame";
import { useThemeColors } from "@/lib/hooks/use-theme-colors";
import { useReducedMotion } from "@/lib/hooks/use-reduced-motion";
import { step, type Body } from "@/lib/physics/n-body";
import { attachGestures, BODY_HIT_RADIUS_PX, type GestureCallbacks } from "./gestures";

interface Props {
  bodies: Body[];
  onBodiesChange: (b: Body[]) => void;
  trails: boolean;
  speed: 0.25 | 1 | 4;
  isPlaying: boolean;
  /** Called when the user creates / edits / deletes bodies (so parent can mark preset = custom) */
  onUserEdit: () => void;
}

const SIM_DT = 0.005; // physics dt per integration sub-step (independent of frame rate)
const PX_PER_UNIT_DEFAULT = 80;
const TRAIL_MAX_AGE_S = 3;

export function NBodyCanvas({
  bodies,
  onBodiesChange,
  trails,
  speed,
  isPlaying,
  onUserEdit,
}: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const colors = useThemeColors();
  const reducedMotion = useReducedMotion();

  // Mutable mirror of `bodies` so the rAF loop doesn't capture stale state.
  const bodiesRef = useRef<Body[]>(bodies);
  useEffect(() => {
    bodiesRef.current = bodies;
  }, [bodies]);

  // Trails: per-body ring buffers
  const trailsRef = useRef<Map<string, Array<{ x: number; y: number; age: number }>>>(new Map());

  // Camera: zoom + pan (world units → px). Parent doesn't manage camera.
  const camRef = useRef({ scale: PX_PER_UNIT_DEFAULT, panX: 0, panY: 0 });

  // Drag state for "drag from body" velocity arrow
  const dragRef = useRef<{ index: number; toX: number; toY: number } | null>(null);

  // Hit-test using the latest bodies snapshot
  function hitTest(x: number, y: number): number {
    const cv = canvasRef.current;
    if (!cv) return -1;
    const w = cv.clientWidth;
    const h = cv.clientHeight;
    const cam = camRef.current;
    const bs = bodiesRef.current;
    for (let i = 0; i < bs.length; i++) {
      const b = bs[i]!;
      const sx = w / 2 + (b.x - cam.panX) * cam.scale;
      const sy = h / 2 + (b.y - cam.panY) * cam.scale;
      if (Math.hypot(sx - x, sy - y) <= BODY_HIT_RADIUS_PX) return i;
    }
    return -1;
  }

  function screenToWorld(x: number, y: number): { x: number; y: number } {
    const cv = canvasRef.current!;
    const w = cv.clientWidth;
    const h = cv.clientHeight;
    const cam = camRef.current;
    return {
      x: (x - w / 2) / cam.scale + cam.panX,
      y: (y - h / 2) / cam.scale + cam.panY,
    };
  }

  // Gesture wiring
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const cb: GestureCallbacks = {
      onTap: (x, y) => {
        const { x: wx, y: wy } = screenToWorld(x, y);
        const next = [
          ...bodiesRef.current,
          {
            id: `u${Date.now().toString(36)}`,
            mass: 1,
            x: wx,
            y: wy,
            vx: 0,
            vy: 0,
          },
        ];
        // Cap at 8; replace the oldest user-spawned body if over.
        const trimmed = next.length > 8 ? next.slice(next.length - 8) : next;
        bodiesRef.current = trimmed;
        onBodiesChange(trimmed);
        onUserEdit();
      },
      onBodyDown: () => {},
      onBodyDrag: (index, x, y) => {
        dragRef.current = { index, toX: x, toY: y };
      },
      onBodyUp: (index, dragVx, dragVy) => {
        const bs = [...bodiesRef.current];
        const b = bs[index];
        if (!b) return;
        if (dragVx !== 0 || dragVy !== 0) {
          // Convert px-velocity to world-unit velocity by dividing by scale.
          const cam = camRef.current;
          bs[index] = { ...b, vx: dragVx / cam.scale, vy: dragVy / cam.scale };
        }
        bodiesRef.current = bs;
        onBodiesChange(bs);
        onUserEdit();
        dragRef.current = null;
      },
      onPinch: (scale) => {
        camRef.current.scale = Math.max(20, Math.min(320, PX_PER_UNIT_DEFAULT * scale));
      },
      onPan: (dx, dy) => {
        const cam = camRef.current;
        cam.panX -= dx / cam.scale;
        cam.panY -= dy / cam.scale;
      },
      onLongPress: (index) => {
        // v1: long-press deletes. (Mass picker is a follow-up.)
        const bs = bodiesRef.current.filter((_, i) => i !== index);
        bodiesRef.current = bs;
        onBodiesChange(bs);
        onUserEdit();
      },
    };

    return attachGestures(el, { hit: hitTest }, cb);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [onBodiesChange, onUserEdit]);

  // rAF loop
  useAnimationFrame({
    elementRef: containerRef,
    onFrame: (_t, dt) => {
      const cv = canvasRef.current;
      if (!cv) return;
      const ctx = cv.getContext("2d");
      if (!ctx) return;
      const dpr = window.devicePixelRatio || 1;
      const w = cv.clientWidth;
      const h = cv.clientHeight;
      if (cv.width !== w * dpr || cv.height !== h * dpr) {
        cv.width = w * dpr;
        cv.height = h * dpr;
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      }

      // Clear
      ctx.fillStyle = colors.bg0 || "#1A1D24";
      ctx.fillRect(0, 0, w, h);

      // Step physics
      if (isPlaying && !reducedMotion) {
        const totalDt = dt * speed;
        const subSteps = Math.max(1, Math.ceil(totalDt / SIM_DT));
        const subDt = totalDt / subSteps;
        let bs = bodiesRef.current;
        for (let i = 0; i < subSteps; i++) bs = step(bs, subDt);
        bodiesRef.current = bs;
      }

      // Trails
      if (trails) {
        for (const b of bodiesRef.current) {
          const buf = trailsRef.current.get(b.id) ?? [];
          buf.forEach((p) => (p.age += dt));
          while (buf.length > 0 && buf[0]!.age > TRAIL_MAX_AGE_S) buf.shift();
          buf.push({ x: b.x, y: b.y, age: 0 });
          trailsRef.current.set(b.id, buf);
        }
      } else {
        trailsRef.current.clear();
      }

      const cam = camRef.current;
      const cx = w / 2;
      const cy = h / 2;

      // Draw trails
      if (trails) {
        for (const buf of trailsRef.current.values()) {
          for (const p of buf) {
            const alpha = Math.max(0, 1 - p.age / TRAIL_MAX_AGE_S) * 0.5;
            ctx.fillStyle = `rgba(111, 184, 198, ${alpha})`;
            const px = cx + (p.x - cam.panX) * cam.scale;
            const py = cy + (p.y - cam.panY) * cam.scale;
            ctx.fillRect(px - 1, py - 1, 2, 2);
          }
        }
      }

      // Draw bodies
      for (const b of bodiesRef.current) {
        const px = cx + (b.x - cam.panX) * cam.scale;
        const py = cy + (b.y - cam.panY) * cam.scale;
        const r = Math.max(3, Math.min(20, 4 + Math.sqrt(b.mass) * 3));
        ctx.shadowColor = "rgba(111, 184, 198, 0.6)";
        ctx.shadowBlur = 12;
        ctx.fillStyle = "#6FB8C6";
        ctx.beginPath();
        ctx.arc(px, py, r, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;
      }

      // Drag arrow (velocity-from-body during drag)
      if (dragRef.current) {
        const { index, toX, toY } = dragRef.current;
        const b = bodiesRef.current[index];
        if (b) {
          const px = cx + (b.x - cam.panX) * cam.scale;
          const py = cy + (b.y - cam.panY) * cam.scale;
          ctx.strokeStyle = "rgba(111, 184, 198, 0.9)";
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.moveTo(px, py);
          ctx.lineTo(toX, toY);
          ctx.stroke();
        }
      }
    },
  });

  return (
    <div ref={containerRef} className="absolute inset-0">
      <canvas ref={canvasRef} className="block h-full w-full" />
    </div>
  );
}
```

- [ ] **Step 2: Create the playground composition**

Create `components/playgrounds/orbital-mechanics/index.tsx`:

```tsx
"use client";
import { useState, useMemo } from "react";
import { usePlaygroundState } from "@/app/[locale]/play/_components/use-playground-state";
import { encodeState } from "@/app/[locale]/play/_components/encode-state";
import { orbitalSchema, type OrbitalState } from "./schema";
import { getPreset, type PresetId } from "./presets";
import { NBodyCanvas } from "./n-body-canvas";
import { Controls } from "./controls";
import type { Body } from "@/lib/physics/n-body";

function bodiesFor(state: OrbitalState): Body[] {
  if (state.preset !== "custom" && state.bodies.length === 0) {
    return getPreset(state.preset as PresetId);
  }
  return state.bodies;
}

export function OrbitalMechanicsPlayground() {
  const [state, setState, reset] = usePlaygroundState(orbitalSchema, "blob");
  const [isPlaying, setIsPlaying] = useState(true);

  const bodies = useMemo(() => bodiesFor(state), [state]);

  function setBodies(next: Body[]) {
    setState({ ...state, bodies: next, preset: "custom" });
  }

  function onUserEdit() {
    if (state.preset !== "custom") {
      setState({ ...state, preset: "custom", bodies });
    }
  }

  return (
    <div className="absolute inset-0">
      <NBodyCanvas
        bodies={bodies}
        onBodiesChange={setBodies}
        trails={state.trails}
        speed={state.speed}
        isPlaying={isPlaying}
        onUserEdit={onUserEdit}
      />
      <Controls
        state={state}
        isPlaying={isPlaying}
        bodyCount={bodies.length}
        onTogglePlay={() => setIsPlaying((p) => !p)}
        onChangeSpeed={(s) => setState({ ...state, speed: s })}
        onChangeTrails={(b) => setState({ ...state, trails: b })}
        onChangePreset={(p) => setState({ ...state, preset: p, bodies: [] })}
        onReset={() => {
          setIsPlaying(true);
          reset();
        }}
      />
    </div>
  );
}

/**
 * Helper used by the page to pre-encode current URL state for the share buttons.
 * The shell needs a URLSearchParams snapshot but doesn't read state itself.
 */
export function encodeCurrentState(state: OrbitalState): URLSearchParams {
  return encodeState(state, orbitalSchema, "blob");
}
```

- [ ] **Step 3: Type-check**

```bash
pnpm exec tsc --noEmit
```

- [ ] **Step 4: Commit**

```bash
git add components/playgrounds/orbital-mechanics/n-body-canvas.tsx components/playgrounds/orbital-mechanics/index.tsx
git commit -m "feat(playgrounds): add orbital N-body canvas and playground composition"
```

---

## Task 14: `/play/[slug]/page.tsx`

**Files:**
- Create: `app/[locale]/play/[slug]/page.tsx`

- [ ] **Step 1: Create the dynamic page**

Create `app/[locale]/play/[slug]/page.tsx`:

```tsx
import { notFound } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";
import dynamic from "next/dynamic";
import { PLAYGROUND_SLUGS, getPlayground } from "../_components/playground-meta";
import { PlaygroundShell } from "../_components/playground-shell";
import { SceneSkeleton } from "@/components/layout/scene-skeleton";
import { locales } from "@/i18n/config";

export function generateStaticParams() {
  return locales.flatMap((locale) =>
    PLAYGROUND_SLUGS.map((slug) => ({ locale, slug })),
  );
}

interface Params {
  locale: string;
  slug: string;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<Params>;
}) {
  const { locale, slug } = await params;
  const meta = getPlayground(slug);
  if (!meta) return {};
  const t = await getTranslations({ locale });
  return {
    title: t(meta.titleKey),
  };
}

export default async function PlaygroundPage({
  params,
}: {
  params: Promise<Params>;
}) {
  const { locale, slug } = await params;
  setRequestLocale(locale);

  const meta = getPlayground(slug);
  if (!meta) notFound();

  const t = await getTranslations({ locale });
  const title = t(meta.titleKey);

  // Lazily load the playground component itself.
  const Playground = dynamic(meta.loader, { ssr: false, loading: () => <SceneSkeleton /> });

  // The shell needs encoded params; the playground writes them via usePlaygroundState
  // on mount, so we pass empty initial params and let the URL update populate them.
  // The share buttons read window.location.href, which is always current.
  return (
    <PlaygroundShell
      title={title}
      shareTitle={title}
      sceneId={meta.sceneId}
      aiPromptKey={meta.aiPromptKey}
      encodedParams={new URLSearchParams()}
      backHref={`/${locale}/play`}
    >
      <Playground />
    </PlaygroundShell>
  );
}
```

- [ ] **Step 2: Run dev server and visit**

```bash
pnpm dev
# Open http://localhost:3000/play/orbital-mechanics
```

Expected: page loads, fullscreen canvas appears, top bar with back arrow + title + share buttons, controls at the bottom. Tap canvas to drop a body.

If RSC complains about the dynamic loader at module scope, hoist `dynamic(...)` outside the function:

```tsx
const Playground = dynamic(() => import("@/components/playgrounds/orbital-mechanics").then(m => ({ default: m.OrbitalMechanicsPlayground })), { ssr: false, loading: () => <SceneSkeleton /> });
```

(In that case, drop the `meta.loader` indirection here, but keep it in the meta registry for the index page in Task 15.)

- [ ] **Step 3: Commit**

```bash
git add app/\[locale\]/play/\[slug\]/page.tsx
git commit -m "feat(playgrounds): add /play/[slug] dynamic page"
```

---

## Task 15: `/play` index page

**Files:**
- Create: `app/[locale]/play/page.tsx`

- [ ] **Step 1: Create index**

Create `app/[locale]/play/page.tsx`:

```tsx
import Link from "next/link";
import { setRequestLocale, getTranslations } from "next-intl/server";
import { ArrowRight } from "lucide-react";
import { PLAYGROUND_SLUGS, getPlayground } from "./_components/playground-meta";
import { locales } from "@/i18n/config";

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = await getTranslations({ locale });
  return { title: t("play.indexTitle") };
}

export default async function PlayIndex({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations({ locale });

  return (
    <div className="absolute inset-0 overflow-y-auto bg-[var(--color-bg-0)] p-6 md:p-12">
      <div className="mx-auto max-w-3xl">
        <h1 className="font-display text-3xl tracking-tight text-[var(--color-fg-0)] md:text-5xl">
          {t("play.indexTitle")}
        </h1>
        <p className="mt-2 text-[var(--color-fg-1)]">{t("play.indexSubtitle")}</p>
        <ul className="mt-8 grid gap-3">
          {PLAYGROUND_SLUGS.map((slug) => {
            const meta = getPlayground(slug)!;
            return (
              <li key={slug}>
                <Link
                  href={`/${locale}/play/${slug}`}
                  className="group flex items-center justify-between border border-[var(--color-fg-4)]/40 px-5 py-4 transition-colors hover:border-[var(--color-cyan)] hover:bg-[var(--color-fg-4)]/10"
                >
                  <div>
                    <div className="font-mono text-xs uppercase tracking-wider text-[var(--color-cyan)]">
                      {slug}
                    </div>
                    <div className="mt-1 font-display text-xl text-[var(--color-fg-0)]">
                      {t(meta.titleKey)}
                    </div>
                    <div className="mt-1 text-sm text-[var(--color-fg-1)]">
                      {t(`play.${slug}.indexCardDescription`)}
                    </div>
                  </div>
                  <ArrowRight size={16} className="text-[var(--color-fg-1)] transition-transform group-hover:translate-x-1" />
                </Link>
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Visit `/play`**

```bash
pnpm dev
# Open http://localhost:3000/play
```

Expected: index renders with one card (orbital-mechanics) → click navigates to the playground.

- [ ] **Step 3: Commit**

```bash
git add app/\[locale\]/play/page.tsx
git commit -m "feat(playgrounds): add /play index page"
```

---

## Task 16: Dynamic OG card

**Files:**
- Create: `app/[locale]/play/[slug]/opengraph-image.tsx`

- [ ] **Step 1: Create OG image route**

Create `app/[locale]/play/[slug]/opengraph-image.tsx`:

```tsx
/* eslint-disable @next/next/no-img-element */
import { ImageResponse } from "next/og";
import { getPlayground } from "../_components/playground-meta";

export const runtime = "edge";
export const alt = "Physics playground";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

interface Params {
  locale: string;
  slug: string;
}

export default async function OGImage({
  params,
  searchParams,
}: {
  params: Params;
  searchParams: Record<string, string>;
}) {
  const meta = getPlayground(params.slug);
  if (!meta) {
    return new ImageResponse(
      (<div style={{ display: "flex", width: "100%", height: "100%" }}>404</div>),
      size,
    );
  }

  // Best-effort decode of state for subtitle text. We don't import the full
  // schema module here (keeps the edge runtime tiny); we just stringify what's
  // in `s` if present.
  let subtitle = "Physics.is";
  if (searchParams.s) {
    try {
      const padded = (searchParams.s + "===").slice(0, searchParams.s.length + ((4 - (searchParams.s.length % 4)) % 4));
      const decoded = JSON.parse(
        Buffer.from(padded.replace(/-/g, "+").replace(/_/g, "/"), "base64").toString("utf-8"),
      ) as { preset?: string; bodies?: unknown[] };
      if (decoded.preset && decoded.preset !== "custom") {
        subtitle = `${decoded.preset} preset`;
      } else if (decoded.bodies?.length) {
        subtitle = `Custom · ${decoded.bodies.length} bodies`;
      }
    } catch {
      // ignore — fall back to default subtitle
    }
  }

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          background: "#1A1D24",
          color: "#EEF2F9",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          padding: "80px",
          fontFamily: "sans-serif",
        }}
      >
        <div style={{ fontSize: 36, color: "#6FB8C6", textTransform: "uppercase", letterSpacing: 4 }}>
          /play/{params.slug}
        </div>
        <div style={{ fontSize: 96, fontWeight: 700, marginTop: 24 }}>
          {meta.slug.replace(/-/g, " ")}
        </div>
        <div style={{ fontSize: 36, color: "#B6C4D8", marginTop: 16 }}>
          {subtitle}
        </div>
        <div style={{ fontSize: 28, color: "#56687F", marginTop: "auto", display: "flex", justifyContent: "flex-end" }}>
          physics.is
        </div>
      </div>
    ),
    size,
  );
}
```

(Note: this version reads `meta.slug` for the title since title-translations require pulling `next-intl/server` into the edge runtime, which is heavier. Trade-off acceptable for v1; can be upgraded later to pull translations.)

- [ ] **Step 2: Verify**

```bash
pnpm dev
# Open http://localhost:3000/play/orbital-mechanics/opengraph-image
```

Expected: a 1200x630 PNG renders.

- [ ] **Step 3: Commit**

```bash
git add app/\[locale\]/play/\[slug\]/opengraph-image.tsx
git commit -m "feat(playgrounds): add dynamic OG image for /play/[slug]"
```

---

## Task 17: Scene-catalog entry + simulation-registry entry

**Files:**
- Modify: `lib/ask/scene-catalog.ts`
- Modify: `lib/content/simulation-registry.ts`

- [ ] **Step 1: Add catalog entry**

Read `lib/ask/scene-catalog.ts` and append before `export function getSceneEntry`:

```ts
import { orbitalSchema } from "@/components/playgrounds/orbital-mechanics/schema";
```

(at the top with other imports)

And append to the `SCENE_CATALOG` array:

```ts
  {
    id: "OrbitalMechanicsPlayground",
    label: "Orbital mechanics playground",
    description: "Interactive N-body gravitational system. Drop bodies, drag to set velocity, watch chaos.",
    tags: ["orbit", "n-body", "chaos", "gravity", "playground"],
    topicSlugs: ["classical-mechanics/kepler", "classical-mechanics/universal-gravitation"],
    paramsSchema: orbitalSchema,
  },
```

- [ ] **Step 2: Add simulation-registry entry**

Read `lib/content/simulation-registry.ts` (look near the existing `OrbitScene` entry) and add:

```ts
  OrbitalMechanicsPlayground: lazyScene(() =>
    import("@/components/playgrounds/orbital-mechanics").then((m) => ({ default: m.OrbitalMechanicsPlayground })),
  ),
```

- [ ] **Step 3: Run scene catalog sync**

```bash
pnpm ask:sync-scenes
```

Expected: `synced N scenes` (where N = previous count + 1). If it fails because the database isn't reachable from the worktree, skip and document — production deploy runs this via CI.

- [ ] **Step 4: Type-check**

```bash
pnpm exec tsc --noEmit
```

- [ ] **Step 5: Commit**

```bash
git add lib/ask/scene-catalog.ts lib/content/simulation-registry.ts
git commit -m "feat(playgrounds): register orbital playground in scene catalog + sim registry"
```

---

## Task 18: Scene catalog ↔ registry contract test

**Files:**
- Create: `tests/ask/scene-catalog-contract.test.ts`

- [ ] **Step 1: Write the contract test**

The comment at the top of `lib/ask/scene-catalog.ts` says this test should exist but it doesn't (verified during planning). Add it now.

Create `tests/ask/scene-catalog-contract.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { SCENE_CATALOG } from "@/lib/ask/scene-catalog";
import { SIMULATION_REGISTRY } from "@/lib/content/simulation-registry";

describe("scene catalog contract", () => {
  it("every catalog id has a matching simulation-registry entry", () => {
    const registryIds = new Set(Object.keys(SIMULATION_REGISTRY));
    const missing = SCENE_CATALOG
      .map((e) => e.id)
      .filter((id) => !registryIds.has(id));
    expect(missing).toEqual([]);
  });
});
```

- [ ] **Step 2: Run the test**

```bash
pnpm test tests/ask/scene-catalog-contract.test.ts
```

Expected: PASS — all catalog ids (incl. the new `OrbitalMechanicsPlayground`) resolve in the registry.

If it fails, the most likely cause is the simulation-registry import pulling in client-only code into the test runner. Verify by reading the test output. If client-only modules trip jsdom, mark the registry import with a vitest mock or move the test to a server-side unit test pattern (check existing tests in `tests/content/` for examples).

- [ ] **Step 3: Commit**

```bash
git add tests/ask/scene-catalog-contract.test.ts
git commit -m "test(ask): add scene-catalog ↔ simulation-registry contract test"
```

---

## Task 19: `/ask` page consumes `?scene/?params/?prompt`

**Files:**
- Modify: `app/[locale]/ask/page.tsx`
- Modify: `components/ask/chat-screen.tsx`
- Modify: `components/ask/composer.tsx`

This is the smallest viable change to make the AI deeplink work end-to-end.

- [ ] **Step 1: Read the existing files**

```bash
cat app/\[locale\]/ask/page.tsx
sed -n '1,80p' components/ask/chat-screen.tsx
sed -n '1,60p' components/ask/composer.tsx
```

- [ ] **Step 2: Update `app/[locale]/ask/page.tsx`**

Replace its body so it forwards `searchParams` to `ChatScreen`:

```tsx
import { getSsrClient } from "@/lib/supabase-server";
import { ChatScreen } from "@/components/ask/chat-screen";

interface Props {
  searchParams: Promise<{ scene?: string; params?: string; prompt?: string }>;
}

export default async function AskLanding({ searchParams }: Props) {
  const db = await getSsrClient();
  const {
    data: { user },
  } = await db.auth.getUser();
  const fullName = (user?.user_metadata?.full_name as string | undefined) ?? null;
  const firstName = fullName?.trim().split(/\s+/)[0] ?? user?.email?.split("@")[0] ?? null;

  const sp = await searchParams;
  const deeplink = sp.scene
    ? { sceneId: sp.scene, params: sp.params ?? "", prompt: sp.prompt ?? "" }
    : null;

  return (
    <ChatScreen
      conversationId={null}
      variant="landing"
      userName={firstName}
      deeplink={deeplink}
    />
  );
}
```

- [ ] **Step 3: Update `ChatScreen` props + behaviour**

In `components/ask/chat-screen.tsx`:

- Add to `interface Props`: `deeplink?: { sceneId: string; params: string; prompt: string } | null;`
- Inside the component, after the existing state declarations, add:

```tsx
const router = useRouter();
const searchParams = typeof window !== "undefined" ? new URL(window.location.href).searchParams : null;

useEffect(() => {
  if (!deeplink) return;
  // Pre-fill composer with the seeded prompt; do NOT auto-submit.
  setText(deeplink.prompt);
  // Strip query params so refresh doesn't re-prefill or re-mount the inline scene.
  if (typeof window !== "undefined" && window.location.search) {
    const url = new URL(window.location.href);
    url.searchParams.delete("scene");
    url.searchParams.delete("params");
    url.searchParams.delete("prompt");
    window.history.replaceState({}, "", url.toString());
  }
  // eslint-disable-next-line react-hooks/exhaustive-deps
}, [deeplink?.sceneId]);
```

- Also render the inline scene above the composer when `deeplink` is set, using `InlineScene`:

```tsx
import { InlineScene } from "./inline-scene";
// inside the JSX, near the empty-state / transcript render:
{deeplink ? (
  <InlineScene id={deeplink.sceneId} params={parseDeeplinkParams(deeplink.params)} />
) : null}
```

with this helper at the bottom of the file (or in a sibling util):

```tsx
function parseDeeplinkParams(raw: string): Record<string, unknown> {
  if (!raw) return {};
  try {
    const padded = raw.replace(/-/g, "+").replace(/_/g, "/");
    const pad = padded.length % 4;
    const full = pad ? padded + "=".repeat(4 - pad) : padded;
    return JSON.parse(
      typeof window === "undefined"
        ? Buffer.from(full, "base64").toString("utf-8")
        : decodeURIComponent(escape(window.atob(full))),
    ) as Record<string, unknown>;
  } catch {
    return {};
  }
}
```

> Note: the deeplink `params` field is the value of `?params=`, which `share-buttons.tsx` builds as the *full URLSearchParams string* (e.g., `s=eyJ...`). To render the scene we need just the inner state. The simplest path: in `share-buttons.tsx` (Task 9), replace `params.set("params", encodedParams.toString())` with `params.set("params", encodedParams.get("s") ?? encodedParams.toString())` so the deeplink carries the base64 blob directly, and `parseDeeplinkParams` decodes it as above.

Apply that fix to `share-buttons.tsx`:

```tsx
// Inside askUrl construction, replace:
params.set("params", encodedParams.toString());
// with:
params.set("params", encodedParams.get("s") ?? encodedParams.toString());
```

- [ ] **Step 4: Run dev server, log in, deeplink test**

```bash
pnpm dev
# 1. Sign in
# 2. Visit http://localhost:3000/play/orbital-mechanics
# 3. Click "Explain with AI"
# 4. Land on /ask with the orbital scene rendered + composer pre-filled
```

Expected: the inline scene mounts at the top of the chat, the composer's textarea contains the AI starter prompt, the URL has been stripped of `?scene/?params/?prompt`.

- [ ] **Step 5: Type-check + tests**

```bash
pnpm exec tsc --noEmit
pnpm test tests/ask
```

Expected: clean.

- [ ] **Step 6: Commit**

```bash
git add app/\[locale\]/ask/page.tsx components/ask/chat-screen.tsx app/\[locale\]/play/_components/share-buttons.tsx
git commit -m "feat(ask): consume ?scene/?params/?prompt deeplink from playgrounds"
```

---

## Task 20: Add `/play` link to top nav

**Files:**
- Modify: `components/layout/nav.tsx`
- Modify: `messages/en/common.json`
- Modify: `messages/he/common.json`

- [ ] **Step 1: Add nav translation keys**

Edit `messages/en/common.json` `nav` block:

```json
"nav": {
  "home": "Physics.explained",
  "physicists": "Physicists",
  "dictionary": "Dictionary",
  "play": "Playgrounds",
  "homeAriaLabel": "Physics.explained — home"
},
```

Edit `messages/he/common.json` similarly:

```json
"nav": {
  ...,
  "play": "מגרשי משחקים",
  ...
},
```

- [ ] **Step 2: Add the nav link**

In `components/layout/nav.tsx`, add a `<Link>` to `/play` between the dictionary link and the search trigger (around line 50):

```tsx
<Link
  href="/play"
  className="nav-link inline-flex h-6 items-center gap-2 border border-[var(--color-fg-4)] px-3 font-mono text-xs uppercase tracking-wider text-[var(--color-fg-1)] transition-colors hover:border-[var(--color-cyan-dim)] hover:text-[var(--color-cyan-dim)] md:h-8"
>
  <span>{t("play")}</span>
</Link>
```

- [ ] **Step 3: Verify**

```bash
pnpm dev
# Open http://localhost:3000 — confirm "Playgrounds" link in top nav, click it → /play
```

- [ ] **Step 4: Commit**

```bash
git add components/layout/nav.tsx messages/en/common.json messages/he/common.json
git commit -m "feat(playgrounds): add /play link to top nav"
```

---

## Task 21: Manual QA sweep + Lighthouse mobile

**Files:** None (verification).

- [ ] **Step 1: Functional check on desktop**

```bash
pnpm build && pnpm start
# Open http://localhost:3000/play
```

Verify:
- [ ] `/play` index renders, orbital card visible.
- [ ] Click orbital → fullscreen canvas loads with figure-8 preset visible (3 bodies tracing ∞).
- [ ] Tap empty space → new body appears.
- [ ] Drag from a body → velocity arrow draws.
- [ ] Long-press a body → body deleted.
- [ ] Speed buttons (0.25× / 1× / 4×) change rate.
- [ ] Trails toggle works.
- [ ] Preset dropdown switches scenarios.
- [ ] Reset returns to figure-8 with empty URL params.
- [ ] Copy-link button copies the current URL (paste in a new tab → same scenario).
- [ ] Tweet button opens twitter.com/intent/tweet.
- [ ] Explain-with-AI button: when signed in, lands on /ask with scene + composer pre-filled. When signed out, redirects through /sign-in?next= and lands back correctly.

- [ ] **Step 2: Mobile check (Chrome devtools, iPhone 12 profile)**

Verify:
- [ ] One-finger tap drops a body.
- [ ] One-finger drag from a body sets velocity.
- [ ] Two-finger pinch zooms (canvas, not browser).
- [ ] Bottom controls fit without horizontal scroll.
- [ ] Top bar back arrow works.

- [ ] **Step 3: Lighthouse mobile audit**

```bash
# Production build already running from Step 1
pnpm exec lighthouse http://localhost:3000/play/orbital-mechanics --preset=desktop --output=html --output-path=./lh-orbital.html
pnpm exec lighthouse http://localhost:3000/play/orbital-mechanics --form-factor=mobile --throttling-method=simulate --output=html --output-path=./lh-orbital-mobile.html
```

Targets (per spec §7.1):
- LCP under 1.5 s (CI threshold 1.8 s).
- TTI under 2 s (CI threshold 2.5 s).

If targets are missed: investigate via the report (most common cause: a heavy import sneaking into the layout). Do NOT lower targets in this PR.

- [ ] **Step 4: RTL spot-check**

```bash
# Set locale to he in browser, visit /he/play/orbital-mechanics
```

Verify the back arrow is on the right, share buttons on the left, controls layout mirrors correctly.

- [ ] **Step 5: Commit (lighthouse reports — optional, gitignored anyway)**

If you want to keep the reports for the PR description:

```bash
git add lh-orbital.html lh-orbital-mobile.html
git commit -m "docs(playgrounds): include lighthouse reports for orbital mechanics"
```

Otherwise skip this commit.

---

## Task 22: Final spec follow-ups (deferred items)

Items from the spec that are intentionally deferred to follow-up specs / PRs (do NOT implement here):

- §6.1 top-bar collapse-on-idle (auto-shrink to 20 px after 3 s) — UX polish.
- §8.3 long-press → mass picker (currently long-press = delete) — UX expansion.
- §8.6 OG card sketched silhouette (currently text-only card) — needs a tiny offline simulator in the edge runtime.
- §11 next-intl namespace verification depends on the existing loader resolving `messages/<locale>/play.json` — if tests show otherwise, the loader needs a tweak. Track in a follow-up.
- Lighthouse CI gate (§7.2) — add as a GitHub Actions step in a separate infra PR.

- [ ] **Step 1: Open a follow-up issue listing these items**

```bash
gh issue create \
  --title "Playgrounds — follow-ups after orbital v1" \
  --body "Tracked from docs/superpowers/specs/2026-04-30-interactive-playgrounds-design.md:

- [ ] Top-bar collapse-on-idle (§6.1)
- [ ] Long-press mass picker (§8.3)
- [ ] OG card sketched-silhouette generator (§8.6)
- [ ] Lighthouse CI gate (§7.2)
- [ ] Verify next-intl loads play.json namespace correctly (§11)
- [ ] Spec the remaining four playgrounds (pendulum, slits, EM, time dilation)"
```

- [ ] **Step 2: PR**

```bash
git push -u origin feat/playgrounds
gh pr create --title "feat(playgrounds): /play framework + Orbital Mechanics" --body "$(cat <<'EOF'
## Summary
- New `/play` route with shared chrome (server `layout.tsx` + client `playground-shell.tsx`).
- First playground: Orbital Mechanics (N-body Velocity-Verlet, Plummer softening, 4 presets).
- URL-state-as-source-of-truth via `usePlaygroundState(zodSchema)`; "Copy link" / "Tweet" / "Explain with AI" share buttons.
- AI deeplink: `/ask?scene=&params=&prompt=` consumes the playground state and pre-fills the composer.
- Dynamic OG image per scenario.

## Test plan
- [ ] `pnpm test` — all green
- [ ] `pnpm build` — clean
- [ ] Lighthouse mobile on `/play/orbital-mechanics` meets LCP < 1.8 s, TTI < 2.5 s
- [ ] Functional QA per Task 21 in the plan

Spec: `docs/superpowers/specs/2026-04-30-interactive-playgrounds-design.md`
Plan: `docs/superpowers/plans/2026-04-30-interactive-playgrounds.md`

🤖 Generated with [Claude Code](https://claude.com/claude-code)
EOF
)"
```

---

## Self-review (run before handing off to executor)

| Spec section | Task that implements it |
|---|---|
| §3.1 file structure | Tasks 1, 2, 3, 4, 5, 8, 9, 10, 11, 12, 13, 14, 15, 16 |
| §3.2 component boundaries | Tasks 8 (layout), 10 (shell), 13 (playground), 4 (state hook) |
| §4 URL state model (params + blob) | Tasks 3, 4 |
| §5.1 Copy link | Task 9 |
| §5.2 Tweet | Task 9 |
| §5.3 Dynamic OG | Task 16 |
| §5.4 Explain-with-AI | Tasks 9, 19 |
| §6 Page chrome | Tasks 7, 8, 10 |
| §7 Performance | Tasks 14 (`next/dynamic`), 21 (Lighthouse) |
| §8 Orbital playground (physics, gestures, controls, presets, OG) | Tasks 1, 2, 11, 12, 13, 16 |
| §9 Scene catalog integration | Tasks 17, 18 |
| §10 Testing (unit, component, e2e) | Tasks 1, 2, 3, 18, 21 |
| §11 i18n | Tasks 6, 20 |
| §12 Risks → mitigations | Tasks 11 (touch-action), 19 (no-auto-submit), 1 (softening) |
| §13 Out of scope | Task 22 (issue) |

No placeholders. All file paths are concrete. Type names consistent across tasks (`Body`, `OrbitalState`, `PlaygroundMeta`, `UrlMode`, `PresetId`).
