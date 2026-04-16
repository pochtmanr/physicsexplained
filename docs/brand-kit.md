# physics.it.com — Brand Kit

*Visual-first physics explainers. The science of everything.*

---

## 1. Brand Essence

**Mission** — Make the fundamental laws of the universe legible through motion, geometry, and carefully composed type.

**Personality** — Curious, rigorous, timeless, quietly cinematic. Feels like a modern scientific journal crossed with a planetarium.

**Voice** — Precise. No filler. Lets visuals carry weight. Explains without condescension.

**Tagline** — *The science of everything.*

---

## 2. Logo

The mark is a three-lobed orbital — three interlocking trajectories evoking atomic orbitals, planetary paths, and the Ptolemaic epicycle that opens the hero scene.

| Element      | Color                  | Role                                        |
|--------------|------------------------|---------------------------------------------|
| Outer lobes  | `--color-fg-0` (ivory) | Structural / body of the mark               |
| Middle lobe  | `--color-cyan`         | Accent — the "signal" inside the atom       |

### Clear space
Minimum clear space around the mark = **½ the cap-height** of the mark on all sides.

### Minimum sizes
- Digital: **24 × 24 px**
- Print: **8 mm**

### Lockups
- **Mark + wordmark (horizontal)** — mark left, wordmark right, optical alignment to orbital center.
- **Stacked** — mark above, wordmark below, centered.
- **Mark-only** — favicons, app icons, social avatars.

### Don'ts
- Don't recolor the lobes outside the palette.
- Don't add drop shadows, bevels, or gradients.
- Don't rotate or skew.
- Don't place on busy photography without a dark scrim.

---

## 3. Color System

Two themes, same semantic tokens. Never hardcode hex in product code — always use tokens (`var(--color-…)`).

### 3.1 Dark theme (primary / default)

| Token                 | Hex                            | Usage                                      |
|-----------------------|--------------------------------|--------------------------------------------|
| `--color-bg-0`        | `#05070A`                      | App background, deep space                 |
| `--color-bg-1`        | `#0B0F16`                      | Cards, elevated surfaces                   |
| `--color-bg-2`        | `#121826`                      | Hover/active surface                       |
| `--color-fg-0`        | `#E6EDF7`                      | Primary text, logo body, headings          |
| `--color-fg-1`        | `#9FB0C8`                      | Secondary text, taglines, captions         |
| `--color-fg-2`        | `#5B6B86`                      | Muted labels, meta, table headers          |
| `--color-fg-3`        | `#2A3448`                      | Borders, dividers                          |
| `--color-cyan`        | `#5BE9FF`                      | Primary accent — links, orbits, signal     |
| `--color-magenta`     | `#FF4FD8`                      | Rare accent — quantum / relativity moments |
| `--color-amber`       | `#F5C451`                      | Single warm accent (CTA underline, rare)   |
| `--color-grid`        | `rgba(91, 233, 255, 0.08)`     | Scientific-paper grid overlay              |
| `--color-glow`        | `rgba(91, 233, 255, 0.35)`     | Bloom around line work, hover glow         |

### 3.2 Light theme

| Token                 | Hex                            | Usage                                      |
|-----------------------|--------------------------------|--------------------------------------------|
| `--color-bg-0`        | `#F7F9FC`                      | Page background                            |
| `--color-bg-1`        | `#FFFFFF`                      | Cards, surfaces                            |
| `--color-bg-2`        | `#EEF2F8`                      | Hover/active surface                       |
| `--color-fg-0`        | `#0A0E14`                      | Primary text                               |
| `--color-fg-1`        | `#334155`                      | Secondary text                             |
| `--color-fg-2`        | `#64748B`                      | Muted                                      |
| `--color-fg-3`        | `#CBD5E1`                      | Borders                                    |
| `--color-cyan`        | `#0891B2`                      | Links, accents (deeper for AA contrast)    |
| `--color-magenta`     | `#C026D3`                      | Rare accent                                |
| `--color-amber`       | `#F5C451`                      | Shared across themes                       |
| `--color-grid`        | `rgba(8, 145, 178, 0.08)`      | Grid overlay                               |
| `--color-glow`        | `rgba(8, 145, 178, 0.35)`      | Hover glow                                 |

### 3.3 Usage rules

- **Cyan is the voice** — reserve for what matters: links, active states, line work in scenes, orbital paths.
- **Magenta is rare** — only for quantum, relativity, or high-energy moments. Never a default accent.
- **Amber is singular** — used sparingly, typically once per screen, e.g. a single underline or star.
- **60 / 30 / 10** — 60% background, 30% foreground ivory, 10% cyan (with magenta/amber as trace accents).
- **Accessibility** — body text on bg-0 must hit **AA (4.5:1)**. Never use fg-2 for paragraph text.

---

## 4. Typography

Three typefaces. Each has one job.

| Token            | Family               | Role                                                 |
|------------------|----------------------|------------------------------------------------------|
| `--font-display` | **Archive Grotesk**  | Wordmark, hero headings, section titles              |
| `--font-sans`    | **Inter**            | Body copy, UI, navigation, metadata                  |
| `--font-mono`    | **JetBrains Mono**   | Formulas, code, tables, numerical data               |

Hebrew fallback stack (no Archive/Inter coverage): `Heebo, Assistant, "Arial Hebrew", "Segoe UI Hebrew", system-ui`.

### 4.1 Type scale

Base `1rem = 18px`. Line-height `1.65` on body.

| Role                 | Font              | Size          | Weight | Tracking  | Line-height |
|----------------------|-------------------|---------------|--------|-----------|-------------|
| Display / Hero       | Archive Grotesk   | 72–96 px      | 500    | `-0.02em` | 1.05        |
| H1 (page title)      | Archive Grotesk   | 48–56 px      | 500    | `-0.015em`| 1.1         |
| H2 (section)         | Archive Grotesk   | 32–40 px      | 500    | `-0.01em` | 1.15        |
| H3                   | Inter             | 22–24 px      | 600    | `0`       | 1.3         |
| Body large           | Inter             | 18 px         | 400    | `0`       | 1.65        |
| Body                 | Inter             | 16 px         | 400    | `0`       | 1.6         |
| Caption / meta       | Inter             | 13 px         | 500    | `0.02em`  | 1.4         |
| Overline / label     | Inter             | 11 px         | 600    | `0.1em`   | 1.3 (UPPER) |
| Formula / code       | JetBrains Mono    | 14–16 px      | 400    | `0`       | 1.5         |

### 4.2 Rules
- **One display face per screen.** Don't mix display sizes unnecessarily.
- **Wordmark** — Archive Grotesk, Medium, `letter-spacing: 0.01em`, never all-caps, never italic.
- **KaTeX / formulas** — always LTR, even in RTL layouts (Hebrew). Color inherits `--color-fg-0`.
- **No underlines on headings**, ever. Links get glow on hover, not underline.

---

## 5. Iconography & Illustration

- **Line weight** — 1 to 1.5 px strokes at 1× rendering. Crisp, not chunky.
- **Style** — Vector, monoline, no fills unless semantically required (orbits, bodies).
- **Palette** — Ivory primary, cyan for signal/accents, magenta/amber only for conceptual emphasis.
- **Scene illustrations** (dictionary) — designed on dark; on light theme they auto-invert via `.dictionary-illustration { filter: invert(1) hue-rotate(180deg); }`. Keep this behavior intact when authoring new SVGs.
- **No skeuomorphism.** No realistic shading, no 3D bevels. Physics here is diagrammatic, not photorealistic.

---

## 6. Motion

| Token                | Value    | Use                                              |
|----------------------|----------|--------------------------------------------------|
| `--duration-fast`    | 180 ms   | Micro-interactions (hover glow, tooltip fade)    |
| `--duration-base`    | 320 ms   | Standard transitions (theme, nav, cards)         |
| `--duration-slow`    | 600 ms   | Scene choreography, hero reveal, page enter      |

**Easing** — `cubic-bezier(0.2, 0.8, 0.2, 1)` for enters, `cubic-bezier(0.4, 0, 1, 1)` for exits.

**Principles**
- Motion should feel *astronomical* — continuous, orbital, never twitchy.
- No bouncy springs, no elastic overshoot.
- Epicycles, pendulums, and orbits use real physics easing (sinusoidal, not linear).

---

## 7. Layout & Grid

- **Body font-size base** — 18px. All spacing derives from a 4px subgrid.
- **Container** — max-width ≈ 72ch for prose, 1280px for scenes.
- **Faint grid overlay** — 8% cyan at `24px` pitch, optional background on scene pages.
- **RTL** — every component must mirror. Use logical properties (`margin-inline-start`, `padding-inline-end`) — never `margin-left/right`. KaTeX stays LTR.

---

## 8. Photography & Imagery

- **Physicists** — square portraits, monochrome or desaturated, `.avif` preferred.
- **Telescopes / apparatus** — dark backgrounds, dramatic side-light. Avoid generic stock.
- **Never use AI-generated physicists or equations** — credibility is core to the brand.

---

## 9. Voice & Content

- **Tone** — Declarative, visual-first, unhurried.
- **Avoid** — "Great question", "Let's dive in", "In this article we will…".
- **Prefer** — Open with the phenomenon. Let the scene lead. Prose explains what the eye already saw.
- **Localization** — EN / RU / HE. Titles keep meaning over literal translation. Never auto-translate formulas.

---

## 10. Tokens → Code

Always consume tokens, not hex:

```tsx
// ✅ good
<div className="bg-[--color-bg-1] text-[--color-fg-0] border border-[--color-fg-3]" />

// ❌ bad
<div className="bg-[#0B0F16] text-[#E6EDF7]" />
```

CSS custom properties live in `app/globals.css`. Fonts are wired via `next/font` in `app/layout.tsx` and exposed as `--font-sans`, `--font-mono`, `--font-display`.

---

## 11. Quick Reference Card

```
COLORS  bg-0 #05070A   fg-0 #E6EDF7   cyan #5BE9FF
        bg-1 #0B0F16   fg-1 #9FB0C8   magenta #FF4FD8
        bg-2 #121826   fg-2 #5B6B86   amber #F5C451

FONTS   Display   Archive Grotesk  —  wordmark, hero
        Sans      Inter            —  body, UI
        Mono     JetBrains Mono   —  formulas, code

MOTION  fast 180ms   base 320ms   slow 600ms

LOGO    three-lobe orbital  —  ivory + cyan  —  min 24px
```

---

*Last updated: 2026-04-17*
