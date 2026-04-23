# Full-Bleed Nav, Footer, and Dual-Card Hero — Design

**Date:** 2026-04-23
**Scope:** Redesign `Nav`, `Footer`, and `HeroSection` on the marketing site so they match the full-width feel of `/ask`. Hero gets a two-column layout with text+CTAs on the left and two stacked framed figures on the right.

## Goals

1. Kill the `max-w-7xl` cap on the site-wide chrome (nav + footer) and the landing hero. Content goes edge-to-edge with a small horizontal gutter, matching how `/ask` already feels.
2. Replace the single-card hero with a two-card composition: one text column, two stacked scene cards.
3. Introduce `SymmetryTriptychScene` (already used on `/electromagnetism/gauss-law` as FIG.03b) as the hero's second card, running in a non-interactive auto-cycling mode.
4. Leave everything else on the site on the existing `WIDE_CONTAINER` until a follow-up pass.

## Non-Goals

- Not touching `BranchesSection`, `PhysicistsSection`, `FeaturedTopicSection`, `DictionarySection`, or `PhilosophySection` in this round. They keep `WIDE_CONTAINER`.
- Not touching `/ask` layout.
- Not touching topic article pages or `TopicPageLayout`.
- No new animations or scenes. `SymmetryTriptychScene` is reused as-is with one new prop.

## Layout Token

New token in `lib/layout.ts`:

```ts
// Full-bleed: edge-to-edge with a small gutter, no max-width cap.
export const FULL_BLEED = "w-full px-6 md:px-10";
```

- `px-6` on mobile (matches `WIDE_CONTAINER`).
- `px-10` on `md+` — slightly wider than `WIDE_CONTAINER`'s `px-8` so the edge doesn't feel pinched once we remove the centered cap.
- No `mx-auto`, no `max-w-*`.

`WIDE_CONTAINER` stays untouched.

## Nav (`components/layout/nav.tsx`)

- Replace `WIDE_CONTAINER` with `FULL_BLEED` on the top-level container inside `<nav>`.
- No structural changes to the inner flex row.
- `SearchCommand` stays as a child of `<nav>` (no container).
- `NavBranchMenu`'s mega panel keeps `WIDE_CONTAINER` for its internal grid — the dropdown content reads better capped, even though the panel itself spans the full nav width (it already does, via `absolute inset-x-0`).
- `MobileNav` drawer stays as-is (its sticky header uses `WIDE_CONTAINER` and the drawer content uses `max-w-[640px]`). Drawer should feel contained.

## Footer (`components/layout/footer.tsx`)

- Replace `WIDE_CONTAINER` with `FULL_BLEED` on the outer content wrapper.
- No structural changes. The three rows (logo+socials, nav+newsletter, legal+copyright) already use `justify-between` / `md:flex-row`, so they expand naturally to fill wider space.

## FramedCard (new — `components/layout/framed-card.tsx`)

Thin reusable wrapper that renders the existing `section-frame.module.css` hairline shell + four corner squares, plus an optional FIG label positioned above the content.

```tsx
interface Props {
  figLabel?: string;     // e.g. "FIG.01 · THE EPICYCLE"
  className?: string;
  children: React.ReactNode;
}
```

- Uses `section-frame.module.css` classes (`shell`, `shellInner`, `shellCorner`, `scTl/scTr/scBl/scBr`) — no duplication.
- FIG label rendered as `<div>` with the existing `pointer-events-none absolute -top-4 start-0 font-mono text-xs uppercase tracking-[0.2em] text-[var(--color-cyan-dim)]` classes currently inlined in `HeroSection`.
- Padding: `p-4 md:p-6` inside `shellInner`. Slightly tighter than the old hero's `px-12 py-14` because each card only holds a scene, not a whole composition.

Co-locate `section-frame.module.css` import in this file. The `HeroSection` stops importing it directly.

## Hero (`components/sections/hero-section.tsx`)

### Structure

```tsx
<section className="relative isolate overflow-hidden pt-8 pb-12 md:pt-20 md:pb-32 md:min-h-[640px] lg:min-h-[90vh] flex items-center">
  <HeroBackground />
  <div className={`${FULL_BLEED} relative z-10`}>
    <div className="grid grid-cols-1 lg:grid-cols-[1fr_1fr] gap-12 lg:gap-16 items-center">
      {/* Left: text + CTAs, no frame */}
      <div className="min-w-0">
        <div className="font-mono text-xs uppercase tracking-[0.2em] text-[var(--color-cyan-dim)]">
          {t("tag")}
        </div>
        <h1 className="mt-6 text-3xl md:text-5xl lg:text-6xl tracking-tight leading-[1.1] text-[var(--color-fg-0)]">
          {t("titleLead")} <span className="font-display italic text-[var(--color-cyan)]">{t("titleHighlight")}</span>
        </h1>
        <p className="mt-6 text-sm md:mt-8 md:text-xl text-[var(--color-fg-1)] max-w-[48ch]">
          {t("subtitle")}
        </p>
        <div className="mt-8 flex flex-wrap gap-6 items-center md:mt-10">
          <Link href="/classical-mechanics" className="...existing cta classes...">
            {t("ctaPrimary")} <span>→</span>
          </Link>
          <a href="#branches" className="...existing secondary cta classes...">
            {t("ctaSecondary")} <span>↓</span>
          </a>
        </div>
      </div>

      {/* Right: two stacked cards, hidden on mobile */}
      <div className="hidden lg:flex flex-col gap-10 min-w-0">
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
```

### Changes from today

- Outer `heroStyles.shell` removed. Text now sits on the particle background directly (matches Linear / Anthropic / Stripe homepage feel).
- `grid-cols-[1.05fr_1fr]` → `grid-cols-[1fr_1fr]`. Equal halves.
- `gap-16` → `gap-12 lg:gap-16`. Cards need a bit more room on wide screens.
- `WIDE_CONTAINER` → `FULL_BLEED`.
- Right column becomes `flex flex-col gap-10` with two `FramedCard` children.
- FIG label is now inside `FramedCard`, not inline in hero.
- `section-frame.module.css` is no longer imported here.

### Mobile

- `<lg` (< 1024px): right column hidden entirely (`hidden lg:flex`). Same as today. Text + CTA only.
- Left column keeps its current responsive type stack (3xl → 5xl → 6xl).

## SymmetryTriptychScene — new `mode` prop

`components/physics/symmetry-triptych-scene.tsx`:

Add prop:

```ts
type Mode = "time" | "space" | "rotation";
interface Props { mode?: Mode | "auto"; }
```

Behavior:

- If `mode` is omitted: current behavior — user starts in `"time"`, tabs visible and clickable.
- If `mode` is `"time" | "space" | "rotation"`: tabs hidden, scene locked to that mode.
- If `mode === "auto"`: tabs hidden, internal state cycles `time → space → rotation → time …` every 5 000 ms. Use a `setInterval` in a `useEffect` gated on `mode === "auto"`.

No other behavioral change. Canvas, animation frame loop, labels, colors — all unchanged. The tab click handlers keep their existing state setter so the prop change is additive.

## i18n (`messages/{en,he,ru}/home.json`)

Under `home.hero`:

- Rename `figLabel` → `fig1Label` (value unchanged: `"FIG.01 · THE EPICYCLE"`).
- Add `fig2Label`: `"FIG.02 · SYMMETRY & CONSERVATION"` (en), and translated equivalents for he/ru.

If we want zero-risk on translations, we keep `figLabel` as a deprecated alias for one release and have `fig1Label` default to it. I'll do a straight rename — the site is in active dev and nothing else references it.

## Files Touched

**Modified:**
- `lib/layout.ts` — add `FULL_BLEED` export.
- `components/layout/nav.tsx` — swap container.
- `components/layout/footer.tsx` — swap container.
- `components/sections/hero-section.tsx` — new structure.
- `components/physics/symmetry-triptych-scene.tsx` — new `mode` prop.
- `messages/en/home.json`, `messages/he/home.json`, `messages/ru/home.json` — rename `figLabel` → `fig1Label`, add `fig2Label`.

**Added:**
- `components/layout/framed-card.tsx` — reusable shell wrapper.

**Not modified:**
- `components/sections/section-frame.module.css` — existing classes reused from `FramedCard` (import just moves).
- `components/sections/hero-background.tsx` — unchanged.
- `components/sections/{branches,physicists,featured-topic,dictionary,philosophy}-section.tsx` — unchanged.
- `app/[locale]/ask/**` — unchanged.
- `components/layout/mobile-nav.tsx`, `components/layout/nav-branch-menu.tsx` — unchanged (internal `WIDE_CONTAINER` kept on purpose).

## Risks & Notes

1. **Two animated canvases in the hero.** `EpicycleScene` and `SymmetryTriptychScene` each run an `useAnimationFrame` loop. Both use `elementRef` with an `IntersectionObserver` pattern (check existing `useAnimationFrame` in `lib/animation/`), so they should pause off-screen. Worth verifying on first paint — if CPU cost is noticeable, add `prefers-reduced-motion` guards (both scenes probably already have them; confirm during implementation).

2. **Full-bleed on ultrawide monitors.** At 2560px+ the nav links will drift far apart. That's the explicit choice. If the logo looks lost after we ship, we revisit — but user saw the tradeoff and picked A.

3. **`PROSE_CONTAINER` quirk.** `lib/layout.ts` has `PROSE_CONTAINER = "mx-auto w-full max-w-9xl px-6"` but Tailwind doesn't ship `max-w-9xl` by default. That's an existing bug unrelated to this work — flagged, not fixed here.

4. **Hero min-height.** The section keeps `lg:min-h-[90vh]`. With two stacked cards on the right, the scenes will center vertically via `items-center` on the grid — the taller column defines the height. `EpicycleScene` (~400px max) + gap + `SymmetryTriptychScene` (~280px max) ≈ 720px. On a 900px-tall viewport that fits inside 90vh comfortably. On shorter viewports (laptop 13" at ~740px height) the hero will push below the fold — acceptable, it's the landing scroll cue.

## Success Criteria

- `/` on desktop: nav spans edge to edge, hero is two columns, right side has two framed scene cards stacked with FIG.01 and FIG.02 labels, SymmetryTriptych auto-cycles.
- `/` on mobile: nav full-bleed, hero shows text + CTA only (no cards), footer full-bleed.
- `/ask` untouched.
- Other landing sections untouched (BranchesSection etc. still max-w-7xl).
- Reduced motion preference still honored by both scenes.
- i18n keys resolve in en, he, ru.
