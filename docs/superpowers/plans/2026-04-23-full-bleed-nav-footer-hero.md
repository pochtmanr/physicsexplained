# Full-Bleed Nav, Footer, and Dual-Card Hero Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make nav, footer, and the landing hero full-bleed (edge-to-edge), and replace the hero's single framed scene with two stacked framed scenes — EpicycleScene (FIG.01) above SymmetryTriptychScene (FIG.02) running in non-interactive auto-cycle mode.

**Architecture:** Add a single `FULL_BLEED` layout token in `lib/layout.ts` (no max-width cap, just side padding). Swap `Nav` and `Footer` from `WIDE_CONTAINER` to `FULL_BLEED`. Restructure `HeroSection` into a 2-column grid: bare text+CTAs on the left, two `FramedCard`-wrapped scenes on the right. Extract the existing shell chrome (`section-frame.module.css`) into a reusable `FramedCard` component. Teach `SymmetryTriptychScene` a new `mode` prop so the hero can run it in auto-cycle mode with tabs hidden.

**Tech Stack:** Next.js 15 App Router, React 19, Tailwind CSS v4, next-intl, vitest + @testing-library/react, existing CSS module `section-frame.module.css`, existing `useAnimationFrame` hook.

**Spec reference:** `docs/superpowers/specs/2026-04-23-full-bleed-nav-footer-hero-design.md`

**File map:**
- Create: `components/layout/framed-card.tsx` — reusable shell wrapper with optional FIG label.
- Create: `tests/components/layout/framed-card.test.tsx` — snapshot-ish assertions on label + children rendering.
- Create: `tests/components/physics/symmetry-triptych-mode.test.tsx` — assertions on the new `mode` prop.
- Modify: `lib/layout.ts` — add `FULL_BLEED` export.
- Modify: `components/layout/nav.tsx` — swap container.
- Modify: `components/layout/footer.tsx` — swap container.
- Modify: `components/sections/hero-section.tsx` — new structure, drop outer shell, use FramedCard.
- Modify: `components/physics/symmetry-triptych-scene.tsx` — add `mode` prop with auto-cycle.
- Modify: `messages/en/home.json`, `messages/he/home.json`, `messages/ru/home.json` — rename `figLabel` → `fig1Label`, add `fig2Label`.

**Conventions:** Functional components + hooks. Named exports. Tailwind classes preferred; CSS modules used only when reusing existing `section-frame.module.css`. Never hardcode; read from translations. Fail loudly; no silent fallbacks. TS strict.

**Verification strategy:** Logic changes (the `mode` prop) get unit tests. Layout changes (which container class is on a div) are better verified visually — the plan includes explicit manual-verification steps that run the dev server and check `/` in the browser. Typecheck and full test suite run at the end.

---

### Task 1: Add `FULL_BLEED` layout token

**Files:**
- Modify: `lib/layout.ts`

- [ ] **Step 1: Add the export**

Edit `lib/layout.ts` — keep the existing contents, append the new export. Final file:

```ts
// Centralized layout width tokens. Change once, update everywhere.

export const WIDE_CONTAINER = "mx-auto w-full max-w-7xl px-6 md:px-8";
export const PROSE_CONTAINER = "mx-auto w-full max-w-9xl px-6";

// Full-bleed: edge-to-edge with a small gutter, no max-width cap.
// Use for chrome (nav/footer) and hero sections that should feel
// borderless on wide monitors.
export const FULL_BLEED = "w-full px-6 md:px-10";
```

- [ ] **Step 2: Typecheck**

Run: `pnpm exec tsc --noEmit`
Expected: exits 0 with no errors.

- [ ] **Step 3: Commit**

```bash
git add lib/layout.ts
git commit -m "feat(layout): add FULL_BLEED container token"
```

---

### Task 2: Swap `Nav` to `FULL_BLEED`

**Files:**
- Modify: `components/layout/nav.tsx`

- [ ] **Step 1: Replace the container class**

In `components/layout/nav.tsx`:

- The import line already reads `import { WIDE_CONTAINER } from "@/lib/layout";`. Change it to:
  ```ts
  import { FULL_BLEED } from "@/lib/layout";
  ```
- The div inside `<nav>` currently uses `className={`${WIDE_CONTAINER} flex h-12 items-center justify-between gap-4 md:h-14`}`. Change `${WIDE_CONTAINER}` to `${FULL_BLEED}`.

Do NOT change the `SearchCommand` placement, the `MobileNav` component, or anything else in this file.

- [ ] **Step 2: Typecheck**

Run: `pnpm exec tsc --noEmit`
Expected: exits 0.

- [ ] **Step 3: Manually verify in the browser**

Run: `pnpm dev` (keep running; open in another terminal if needed).

Open `http://localhost:3000/` in a browser resized to at least 1440px wide.

Check:
- Logo sits near the left viewport edge (roughly 24px–40px from the left, i.e. the `px-6 md:px-10` gutter), not centered with a big left margin.
- Right-hand nav icons (Branches menu, Physicists, Dictionary, Ask, Search, Locale, Theme) sit near the right viewport edge.
- No horizontal scrollbar appears.
- The border-bottom line still spans the full viewport width.

If any of these fail, the change is wrong — revisit before moving on.

- [ ] **Step 4: Commit**

```bash
git add components/layout/nav.tsx
git commit -m "feat(nav): swap to FULL_BLEED container"
```

---

### Task 3: Swap `Footer` to `FULL_BLEED`

**Files:**
- Modify: `components/layout/footer.tsx`

- [ ] **Step 1: Replace the container class**

In `components/layout/footer.tsx`:

- Change the import `import { WIDE_CONTAINER } from "@/lib/layout";` to:
  ```ts
  import { FULL_BLEED } from "@/lib/layout";
  ```
- The outer footer content `<div className={`${WIDE_CONTAINER} pt-10 pb-6 md:py-16`}>` — change `${WIDE_CONTAINER}` to `${FULL_BLEED}`.

No other structural changes. All inner flex rows (`justify-between`, `md:flex-row`) remain untouched and will naturally expand.

- [ ] **Step 2: Typecheck**

Run: `pnpm exec tsc --noEmit`
Expected: exits 0.

- [ ] **Step 3: Manually verify in the browser**

With `pnpm dev` still running, load `http://localhost:3000/` and scroll to the footer at viewport width ≥1440px.

Check:
- Logo and GitHub/LinkedIn/X icons sit near the left and right viewport edges respectively (both on the first row).
- Navigation chips (Branches, Physicists, Dictionary) are on the left gutter; newsletter form is on the right gutter.
- Legal links row and copyright row also align to the outer gutters.
- Footer top border spans the full viewport width.

- [ ] **Step 4: Commit**

```bash
git add components/layout/footer.tsx
git commit -m "feat(footer): swap to FULL_BLEED container"
```

---

### Task 4: Create `FramedCard` component

**Files:**
- Create: `components/layout/framed-card.tsx`
- Create: `tests/components/layout/framed-card.test.tsx`

- [ ] **Step 1: Write the failing test**

Create `tests/components/layout/framed-card.test.tsx`:

```tsx
import { describe, it, expect, afterEach } from "vitest";
import { render, screen, cleanup } from "@testing-library/react";
import { FramedCard } from "@/components/layout/framed-card";

afterEach(() => cleanup());

describe("FramedCard", () => {
  it("renders its children", () => {
    render(
      <FramedCard>
        <div data-testid="child-content">hello</div>
      </FramedCard>,
    );
    expect(screen.getByTestId("child-content")).toBeInTheDocument();
  });

  it("renders the FIG label when provided", () => {
    render(
      <FramedCard figLabel="FIG.01 · THE EPICYCLE">
        <span>content</span>
      </FramedCard>,
    );
    expect(screen.getByText("FIG.01 · THE EPICYCLE")).toBeInTheDocument();
  });

  it("omits the FIG label when not provided", () => {
    const { container } = render(
      <FramedCard>
        <span>content</span>
      </FramedCard>,
    );
    // No element should contain "FIG." text
    expect(container.textContent).not.toMatch(/^FIG\./);
  });

  it("renders the four corner accent spans", () => {
    const { container } = render(
      <FramedCard>
        <span>content</span>
      </FramedCard>,
    );
    // section-frame.module.css uses a `.shellCorner` base class; four spans
    const corners = container.querySelectorAll('[aria-hidden="true"]');
    // At least the four corners; the optional label is not aria-hidden
    expect(corners.length).toBeGreaterThanOrEqual(4);
  });
});
```

- [ ] **Step 2: Run the test and verify it fails**

Run: `pnpm exec vitest run tests/components/layout/framed-card.test.tsx`
Expected: FAIL with a module-not-found error for `@/components/layout/framed-card`.

- [ ] **Step 3: Implement `FramedCard`**

Create `components/layout/framed-card.tsx`:

```tsx
import styles from "@/components/sections/section-frame.module.css";

interface Props {
  /** Optional eyebrow label rendered above the top-left of the frame, e.g. "FIG.01 · THE EPICYCLE". */
  figLabel?: string;
  /** Extra classes for the outer shell (positioning, width). */
  className?: string;
  /** Extra classes for the inner content container (padding overrides, etc). */
  innerClassName?: string;
  children: React.ReactNode;
}

/**
 * Reusable hairline shell with four corner-square accents — the framed-figure
 * chrome used across the site. Pass `figLabel` to render a small mono eyebrow
 * above the top-left corner (the "FIG.XX" treatment used on scene cards).
 */
export function FramedCard({ figLabel, className, innerClassName, children }: Props) {
  return (
    <div className={`${styles.shell} relative${className ? ` ${className}` : ""}`}>
      <span className={`${styles.shellCorner} ${styles.scTl}`} aria-hidden="true" />
      <span className={`${styles.shellCorner} ${styles.scTr}`} aria-hidden="true" />
      <span className={`${styles.shellCorner} ${styles.scBl}`} aria-hidden="true" />
      <span className={`${styles.shellCorner} ${styles.scBr}`} aria-hidden="true" />
      {figLabel ? (
        <div className="pointer-events-none absolute -top-4 start-0 px-2 font-mono text-xs uppercase tracking-[0.2em] text-[var(--color-cyan-dim)]">
          {figLabel}
        </div>
      ) : null}
      <div className={`${styles.shellInner} p-4 md:p-6${innerClassName ? ` ${innerClassName}` : ""}`}>
        {children}
      </div>
    </div>
  );
}
```

- [ ] **Step 4: Run the test and verify it passes**

Run: `pnpm exec vitest run tests/components/layout/framed-card.test.tsx`
Expected: all 4 tests pass.

- [ ] **Step 5: Typecheck**

Run: `pnpm exec tsc --noEmit`
Expected: exits 0.

- [ ] **Step 6: Commit**

```bash
git add components/layout/framed-card.tsx tests/components/layout/framed-card.test.tsx
git commit -m "feat(layout): add reusable FramedCard component"
```

---

### Task 5: Add `mode` prop to `SymmetryTriptychScene`

**Files:**
- Modify: `components/physics/symmetry-triptych-scene.tsx`
- Create: `tests/components/physics/symmetry-triptych-mode.test.tsx`

- [ ] **Step 1: Write the failing test**

Create `tests/components/physics/symmetry-triptych-mode.test.tsx`:

```tsx
import { describe, it, expect, afterEach, beforeAll, vi } from "vitest";
import { render, screen, cleanup, act } from "@testing-library/react";
import { SymmetryTriptychScene } from "@/components/physics/symmetry-triptych-scene";

beforeAll(() => {
  if (typeof window !== "undefined" && !window.matchMedia) {
    window.matchMedia = (query: string) =>
      ({
        matches: false,
        media: query,
        onchange: null,
        addListener: () => {},
        removeListener: () => {},
        addEventListener: () => {},
        removeEventListener: () => {},
        dispatchEvent: () => false,
      }) as MediaQueryList;
  }
  if (typeof globalThis.ResizeObserver === "undefined") {
    // Minimal shim for jsdom
    class ROShim {
      observe() {}
      unobserve() {}
      disconnect() {}
    }
    (globalThis as unknown as { ResizeObserver: typeof ROShim }).ResizeObserver = ROShim;
  }
  if (typeof globalThis.IntersectionObserver === "undefined") {
    class IOShim {
      observe() {}
      unobserve() {}
      disconnect() {}
      takeRecords() { return []; }
      root = null;
      rootMargin = "";
      thresholds: number[] = [];
    }
    (globalThis as unknown as { IntersectionObserver: typeof IOShim }).IntersectionObserver = IOShim;
  }
});

afterEach(() => {
  cleanup();
  vi.useRealTimers();
});

describe("SymmetryTriptychScene", () => {
  it("renders the three tab buttons by default", () => {
    render(<SymmetryTriptychScene />);
    expect(screen.getByRole("button", { name: /time → energy/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /space → momentum/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /rotation → angular L/i })).toBeInTheDocument();
  });

  it("hides the tab buttons when mode is a fixed mode", () => {
    render(<SymmetryTriptychScene mode="space" />);
    expect(screen.queryByRole("button", { name: /time → energy/i })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /space → momentum/i })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /rotation → angular L/i })).not.toBeInTheDocument();
  });

  it("hides the tab buttons when mode is auto", () => {
    render(<SymmetryTriptychScene mode="auto" />);
    expect(screen.queryByRole("button", { name: /time → energy/i })).not.toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run the test and verify it fails**

Run: `pnpm exec vitest run tests/components/physics/symmetry-triptych-mode.test.tsx`
Expected: the first test passes; the `mode="space"` and `mode="auto"` tests FAIL because the prop is not implemented yet.

- [ ] **Step 3: Implement the `mode` prop**

Modify `components/physics/symmetry-triptych-scene.tsx`. Apply these changes precisely:

3a. At the top, change the existing `type Mode` line to export it and introduce a helper:

```ts
export type Mode = "time" | "space" | "rotation";
export type SymmetryMode = Mode | "auto";

interface Props {
  /**
   * Controls which symmetry is displayed.
   *  - omitted: current interactive behavior (user starts on "time", can click tabs).
   *  - "time" | "space" | "rotation": tabs hidden, scene locked to that mode.
   *  - "auto": tabs hidden, cycle through the three modes every 5 s.
   */
  mode?: SymmetryMode;
}
```

3b. Change the component signature from `export function SymmetryTriptychScene() {` to:

```ts
export function SymmetryTriptychScene({ mode: modeProp }: Props = {}) {
```

3c. Compute the initial mode and whether tabs should be visible. Replace the existing `const [mode, setMode] = useState<Mode>("time");` line with:

```ts
const initialMode: Mode = modeProp && modeProp !== "auto" ? modeProp : "time";
const [mode, setMode] = useState<Mode>(initialMode);
const tabsVisible = modeProp === undefined;
```

3d. Add an auto-cycle effect. Place this `useEffect` immediately after the existing ResizeObserver `useEffect` block (the one that sets size):

```ts
useEffect(() => {
  if (modeProp !== "auto") return;
  const ORDER: Mode[] = ["time", "space", "rotation"];
  const id = setInterval(() => {
    setMode((prev) => {
      const i = ORDER.indexOf(prev);
      return ORDER[(i + 1) % ORDER.length];
    });
  }, 5000);
  return () => clearInterval(id);
}, [modeProp]);
```

3e. Also honor a fixed (non-auto, non-undefined) `modeProp` by syncing it to state whenever it changes. Add this effect right after the auto-cycle effect:

```ts
useEffect(() => {
  if (modeProp === undefined || modeProp === "auto") return;
  setMode(modeProp);
}, [modeProp]);
```

3f. Gate the tab button row on `tabsVisible`. The JSX near the bottom currently reads:

```tsx
<div className="mt-2 flex gap-2 px-2">
  <button ...>time → energy</button>
  <button ...>space → momentum</button>
  <button ...>rotation → angular L</button>
</div>
```

Wrap it:

```tsx
{tabsVisible && (
  <div className="mt-2 flex gap-2 px-2">
    <button ...>time → energy</button>
    <button ...>space → momentum</button>
    <button ...>rotation → angular L</button>
  </div>
)}
```

Leave every button's existing props/handlers intact.

Do not modify the canvas rendering, the `useAnimationFrame` call, or the `drawPendulum/drawSpring/drawMass/drawRotator` helpers.

- [ ] **Step 4: Run the test and verify it passes**

Run: `pnpm exec vitest run tests/components/physics/symmetry-triptych-mode.test.tsx`
Expected: all 3 tests pass.

- [ ] **Step 5: Verify the existing gauss-law usage still works**

Run: `pnpm exec tsc --noEmit`
Expected: exits 0.

Run: `pnpm exec vitest run`
Expected: all tests pass. If any pre-existing test references `SymmetryTriptychScene` with no props, it should still pass (tabs are still visible by default).

- [ ] **Step 6: Commit**

```bash
git add components/physics/symmetry-triptych-scene.tsx tests/components/physics/symmetry-triptych-mode.test.tsx
git commit -m "feat(symmetry-triptych): add mode prop for locked and auto-cycle display"
```

---

### Task 6: Add i18n keys for the two FIG labels

**Files:**
- Modify: `messages/en/home.json`
- Modify: `messages/he/home.json`
- Modify: `messages/ru/home.json`

- [ ] **Step 1: Update `messages/en/home.json`**

Inside the `hero` object:
- Rename the key `figLabel` → `fig1Label` (value `"FIG.01 · THE EPICYCLE"` unchanged).
- Add a new key `fig2Label` with value `"FIG.02 · SYMMETRY & CONSERVATION"`.

After edit, the `hero` block reads:

```json
"hero": {
  "tag": "physics.it.com · V0.5",
  "titleLead": "If I have seen further, it is by standing on the",
  "titleHighlight": "shoulders of giants.",
  "subtitle": "Physics isn't just formulas. It's the language the universe speaks. We made it visible.",
  "ctaPrimary": "Start with classical mechanics",
  "ctaSecondary": "Or browse all six branches",
  "fig1Label": "FIG.01 · THE EPICYCLE",
  "fig2Label": "FIG.02 · SYMMETRY & CONSERVATION"
}
```

- [ ] **Step 2: Update `messages/he/home.json`**

Rename `figLabel` → `fig1Label` (value `"איור 01 · האפיציקל"` unchanged). Add `fig2Label` with value `"איור 02 · סימטריה ושימור"`.

- [ ] **Step 3: Update `messages/ru/home.json`**

Rename `figLabel` → `fig1Label` (value `"РИС.01 · ЭПИЦИКЛ"` unchanged). Add `fig2Label` with value `"РИС.02 · СИММЕТРИЯ И СОХРАНЕНИЕ"`.

- [ ] **Step 4: Verify no stale references remain**

Run: `grep -rn "figLabel" messages/ app/ components/ lib/ || echo "no matches"`
Expected: `no matches` — otherwise a reference to the old key is still in the tree and needs to be renamed. (The `hero-section.tsx` update in Task 7 is the only consumer; this grep is the safety net that catches anything missed.)

- [ ] **Step 5: Commit**

```bash
git add messages/en/home.json messages/he/home.json messages/ru/home.json
git commit -m "i18n: split hero figLabel into fig1Label + fig2Label"
```

---

### Task 7: Restructure `HeroSection` — 2-column, dual framed cards, full-bleed

**Files:**
- Modify: `components/sections/hero-section.tsx`

- [ ] **Step 1: Replace the entire file**

Overwrite `components/sections/hero-section.tsx` with:

```tsx
import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { EpicycleScene } from "@/components/physics/epicycle-scene";
import { SymmetryTriptychScene } from "@/components/physics/symmetry-triptych-scene";
import { FramedCard } from "@/components/layout/framed-card";
import { FULL_BLEED } from "@/lib/layout";
import { HeroBackground } from "./hero-background";

export async function HeroSection() {
  const t = await getTranslations("home.hero");

  return (
    <section className="relative isolate overflow-hidden pt-8 pb-12 md:pt-20 md:pb-32 md:min-h-[640px] lg:min-h-[90vh] flex items-center">
      <HeroBackground />
      <div className={`${FULL_BLEED} relative z-10`}>
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_1fr] gap-12 lg:gap-16 items-center">
          <div className="min-w-0">
            <div className="font-mono text-xs uppercase tracking-[0.2em] text-[var(--color-cyan-dim)]">
              {t("tag")}
            </div>
            <h1 className="mt-6 text-3xl md:text-5xl lg:text-6xl tracking-tight leading-[1.1] text-[var(--color-fg-0)]">
              {t("titleLead")}{" "}
              <span className="font-display italic text-[var(--color-cyan)]">
                {t("titleHighlight")}
              </span>
            </h1>
            <p className="mt-6 text-sm md:mt-8 md:text-xl text-[var(--color-fg-1)] max-w-[48ch]">
              {t("subtitle")}
            </p>
            <div className="mt-8 flex flex-wrap gap-6 items-center md:mt-10">
              <Link
                href="/classical-mechanics"
                className="inline-flex items-center gap-2 border border-[var(--color-cyan)] px-4 py-2 font-mono text-xs uppercase tracking-wider text-[var(--color-cyan)] hover:bg-[var(--color-cyan)]/10 transition md:px-6 md:py-3 md:text-sm"
              >
                {t("ctaPrimary")}
                <span aria-hidden="true" className="inline-block rtl:-scale-x-100">
                  →
                </span>
              </Link>
              <a
                href="#branches"
                className="hidden items-center gap-2 font-mono text-sm uppercase tracking-wider text-[var(--color-fg-3)] hover:text-[var(--color-cyan)] md:inline-flex"
              >
                {t("ctaSecondary")}
                <span aria-hidden="true">↓</span>
              </a>
            </div>
          </div>

          <div className="hidden lg:flex flex-col gap-12 min-w-0">
            <FramedCard figLabel={t("fig1Label")}>
              <EpicycleScene />
            </FramedCard>
            <FramedCard figLabel={t("fig2Label")}>
              <SymmetryTriptychScene mode="auto" />
            </FramedCard>
          </div>
        </div>
      </div>
    </section>
  );
}
```

Notes:
- No longer imports `section-frame.module.css` (that lives inside `FramedCard` now).
- No longer imports `WIDE_CONTAINER`.
- Right column is `hidden lg:flex` — cards disappear on mobile exactly like the old single card did.
- Grid gap between the two stacked cards is `gap-12` to give the FIG.02 label above the bottom card room to breathe (the label uses `-top-4`).

- [ ] **Step 2: Typecheck**

Run: `pnpm exec tsc --noEmit`
Expected: exits 0.

- [ ] **Step 3: Run all tests**

Run: `pnpm exec vitest run`
Expected: all tests pass.

- [ ] **Step 4: Manually verify in the browser at desktop width (≥1280px)**

With `pnpm dev` running, load `http://localhost:3000/` at viewport width 1440px.

Check:
- Hero spans full viewport width (text hugs left gutter, cards hug right gutter).
- Left column shows the tag eyebrow, headline with italic cyan "shoulders of giants", subtitle, primary CTA button, secondary text link.
- Right column shows two framed cards stacked vertically with visible corner squares.
- Top card: `FIG.01 · THE EPICYCLE` label above top-left corner, EpicycleScene canvas animating inside.
- Bottom card: `FIG.02 · SYMMETRY & CONSERVATION` label above top-left corner, SymmetryTriptychScene canvas animating inside, NO tab buttons visible.
- Within ~5 seconds, the SymmetryTriptychScene caption and animation change (time → space → rotation).
- Particle background is still visible behind the text on the left.
- No giant empty frame wraps the whole hero.

- [ ] **Step 5: Manually verify in the browser at mobile width (<1024px)**

Resize the browser to 375px wide (or use DevTools device mode).

Check:
- Right column is hidden entirely — no framed cards on mobile.
- Text + primary CTA are visible and readable.
- No horizontal scrollbar.

- [ ] **Step 6: Manually verify RTL**

Load `http://localhost:3000/he` at 1440px width.

Check:
- Hero content mirrors: text column is on the right, framed cards are on the left.
- FIG labels (`איור 01 · …`, `איור 02 · …`) render at the top-leading corner (which is the top-right in RTL because of the `start-0` class).
- CTA arrow flipped via `rtl:-scale-x-100`.

- [ ] **Step 7: Commit**

```bash
git add components/sections/hero-section.tsx
git commit -m "feat(hero): full-bleed two-column layout with stacked framed scenes"
```

---

### Task 8: Final verification

**Files:** none modified; this is a verification task.

- [ ] **Step 1: Full typecheck**

Run: `pnpm exec tsc --noEmit`
Expected: exits 0 with no errors.

- [ ] **Step 2: Full test suite**

Run: `pnpm exec vitest run`
Expected: all tests pass.

- [ ] **Step 3: Lint**

Run: `pnpm lint`
Expected: exits 0. If it reports issues in files you touched, fix them. If it reports issues in files you did not touch, leave them (not in scope).

- [ ] **Step 4: Production build smoke test**

Run: `pnpm build`
Expected: exits 0 with a successful build. Watch for any next-intl key-not-found warnings in the output — if `fig1Label` or `fig2Label` is reported missing, the i18n file for that locale was not updated in Task 6.

- [ ] **Step 5: Final manual sweep**

With `pnpm dev` running, visit each of these URLs at 1440px width and confirm nothing regressed:

- `http://localhost:3000/` — hero has two cards, nav/footer are full-bleed.
- `http://localhost:3000/ask` — unchanged (redirect to sign-in if unauthenticated; that's expected).
- `http://localhost:3000/electromagnetism/gauss-law` — the SymmetryTriptychScene here (FIG.03b) still shows its three tab buttons and responds to clicks. **This is the critical regression check for Task 5.**
- `http://localhost:3000/physicists` — loads, nav/footer render full-bleed, rest unchanged.
- `http://localhost:3000/dictionary` — same.
- `http://localhost:3000/he` — Hebrew RTL renders correctly as described in Task 7 Step 6.

- [ ] **Step 6: Confirm clean git state**

Run: `git status`
Expected: clean tree with all work committed. If anything's uncommitted, figure out why before declaring done.

- [ ] **Step 7: Done**

No commit in this task — it's pure verification.

---

## Self-Review Notes (author's pass)

- **Spec coverage:** Every section of the spec is covered.
  - Layout token → Task 1.
  - Nav full-bleed → Task 2.
  - Footer full-bleed → Task 3.
  - `FramedCard` → Task 4.
  - `mode` prop on SymmetryTriptychScene → Task 5.
  - i18n renames → Task 6.
  - Hero restructure → Task 7.
  - Mobile behavior (right column hidden) → verified in Task 7 Step 5.
  - Regression check on gauss-law → verified in Task 8 Step 5.
- **Placeholder scan:** No TBDs, no "handle edge cases", no "write tests for the above" without code. Every code step shows the code.
- **Type consistency:** `Mode` stays `"time" | "space" | "rotation"`; the new umbrella type is `SymmetryMode = Mode | "auto"`. The prop is named `mode` on the component surface; internally it's `modeProp` to avoid shadowing the state variable `mode`. The internal state variable keeps its original name to avoid touching every existing reference in the scene.
- **Framing labels on cards:** The FIG label is absolutely positioned at `-top-4`. The outer card needs `relative` — I added `relative` to the shell wrapper in `FramedCard` (`section-frame.module.css` already gives `.shell` `position: relative`, so this is belt-and-suspenders but harmless).
- **Scope:** Single implementation plan. No decomposition needed.
