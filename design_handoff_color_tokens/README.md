# Handoff: Color & Type Token Update

## Overview

Updates the `physicsexplained` repo's design tokens to match the refined palette
in the Physics.explained Design System. The changes are **CSS-only** and live
primarily in `app/globals.css`. No component logic changes.

## About the design files

Files in this bundle are the source-of-truth token files from the design system,
written as plain CSS. Drop `colors_and_type.css` into your reference folder and
use the diff below to update `app/globals.css`. **Do not import the CSS file
verbatim** — your repo uses Tailwind v4 `@theme` syntax inside `app/globals.css`,
so the token *values* need to be transposed into that block.

## Fidelity

**High-fidelity.** Every hex value here is final. Apply exactly.

## Changes at a glance

1. **Collapse three bg layers to one.** `--color-bg-0/1/2` all resolve to `#07090E` in dark, `#FAFBFD` in light. Depth is now purely borders + grid-wash opacity.
2. **Foreground ladder gains a step.** Rename `fg-3 → fg-4` for borders/rules. Insert a new `fg-2 = #7D8DA6` (dark) / `#4A5569` (light) for secondary body / card subtitles. The old `fg-2` meta color is now `fg-3`.
3. **Cyan splits into two tokens.** Keep `--color-cyan` for emphasis only (hero italic, live glow, link hover). Introduce `--color-cyan-dim` for chrome (eyebrows, hover borders, pill outlines, icons).
4. **Magenta brightened** from `#FF4FD8` → `#FF6ADE` so the 12px `COMING SOON` pill clears WCAG AA on dark bg.
5. **Mint added** (`#5BFFAE` dark / `#037A4B` light) for success states — form confirmations, "correct answer" in physics scenes.
6. **Light mode re-derived**, not desaturated. Cyan becomes teal `#0B7285`, magenta fuchsia `#B6219E`, amber bronze `#9A6410`, mint emerald `#037A4B`.

## The CSS to apply

Open `app/globals.css`. Inside the existing `@theme { … }` block, replace the
color tokens with the set below. Keep the font and motion tokens as they are.

```css
@theme {
  /* Accents (shared across themes) — but re-scoped per theme below */
  --color-amber: #F5C451; /* dark default; light overrides below */
}

/* Dark (default) */
:root,
[data-theme="dark"] {
  /* Backgrounds — single layer; depth via borders + grid wash */
  --color-bg:   #07090E;
  --color-bg-0: #07090E;
  --color-bg-1: #07090E;
  --color-bg-2: #07090E;

  /* Foreground ladder — 5 steps */
  --color-fg-0: #EEF2F9;
  --color-fg-1: #B6C4D8;
  --color-fg-2: #7D8DA6; /* NEW — secondary body, card subtitles */
  --color-fg-3: #56687F; /* was fg-2 — meta, captions */
  --color-fg-4: #2A3448; /* was fg-3 — borders, hairlines */

  /* Accents */
  --color-cyan:     #5BE9FF; /* emphasis only */
  --color-cyan-dim: #6FB8C6; /* chrome — eyebrows, borders, icons */
  --color-magenta:  #FF6ADE; /* brightened from #FF4FD8 */
  --color-amber:    #F5C451;
  --color-mint:     #5BFFAE; /* NEW — success */

  --color-grid: rgba(111, 184, 198, 0.08);
  --color-glow: rgba(91, 233, 255, 0.35);
  color-scheme: dark;
}

/* Light */
[data-theme="light"] {
  --color-bg:   #FAFBFD;
  --color-bg-0: #FAFBFD;
  --color-bg-1: #FAFBFD;
  --color-bg-2: #FAFBFD;

  --color-fg-0: #0B1220;
  --color-fg-1: #293244;
  --color-fg-2: #4A5569;
  --color-fg-3: #6E7A8F;
  --color-fg-4: #CAD2DF;

  --color-cyan:     #0B7285;
  --color-cyan-dim: #5A8693;
  --color-magenta:  #B6219E;
  --color-amber:    #9A6410;
  --color-mint:     #037A4B;

  --color-grid: rgba(90, 134, 147, 0.10);
  --color-glow: rgba(11, 114, 133, 0.28);
  color-scheme: light;
}
```

## Call-sites to update

After the token rename, grep for these and update:

| Old usage | New usage | Where it typically appears |
|---|---|---|
| `bg-bg-1`, `bg-bg-2` | `bg-bg` | card/section backgrounds — depth now comes from grid-wash opacity |
| `text-fg-2` (meta, captions) | `text-fg-3` | `components/layout/branch-card.tsx`, `topic-card.tsx`, footer legal |
| `text-fg-3` (borders via text) | `text-fg-4` | rare — grep to confirm |
| `border-fg-3` | `border-fg-4` | all card/nav/footer borders |
| `text-cyan` on eyebrows, pill outlines, icons | `text-cyan-dim` / `border-cyan-dim` | `components/layout/nav.tsx` pills, every `.eyebrow` class, branch-card coming-soon pill |
| `text-cyan` on the hero italic, links, live glow | *unchanged* — stays `text-cyan` | `hero-section.tsx`, MDX link styling |
| Hard-coded `#FF4FD8` | `var(--color-magenta)` | `components/physics/epicycle-scene.tsx` trail colour |

## Component-level notes

- **`components/layout/branch-card.tsx`** — the pill should use `border-cyan-dim text-cyan-dim` for live cards; `border-magenta text-magenta` stays for coming-soon. The hover shadow stays `cyan` (emphasis).
- **`components/sections/hero-section.tsx`** — the italic accent phrase stays `cyan`. Everything else around it (eyebrow, meta) moves to `cyan-dim`.
- **`components/layout/nav.tsx`** — all nav pills go `border-fg-4 text-fg-1`, hover → `border-cyan-dim text-cyan-dim`.
- **`components/layout/callout.tsx`** — no change; amber/cyan/magenta left borders already match.
- **Newsletter success** — when a subscription returns OK, use `text-mint` instead of the current `text-cyan`.

## Files in this bundle

- `colors_and_type.css` — full standalone token file (for reference; don't import directly into the Next.js build)
- `README.md` — this file

## Verification checklist

- [ ] Dark mode: the "§ BRANCHES" eyebrow reads dimmer than the `shoulders of giants.` italic.
- [ ] Light mode: links are legible on `#FAFBFD` (teal `#0B7285`, not washed blue).
- [ ] The coming-soon pill passes contrast against the card background in both themes.
- [ ] Hero italic still glows — that's still emphasis cyan, not the dim variant.
- [ ] No references to `--color-bg-1` / `--color-bg-2` remain in component files; use `--color-bg` going forward (the aliases are kept in tokens for safety only).

## Git commit message

```
design: refine color tokens — collapse bg layers, split cyan, add mint

- Single --color-bg (was bg-0/1/2)
- Insert --color-fg-2 (#7D8DA6) for secondary body; shift meta → fg-3; borders → fg-4
- Split cyan into --color-cyan (emphasis) and --color-cyan-dim (chrome)
- Brighten magenta #FF4FD8 → #FF6ADE for AA on small pills
- Add --color-mint for success states
- Re-derive light theme (teal / fuchsia / bronze / emerald), not mechanically desaturated
```
