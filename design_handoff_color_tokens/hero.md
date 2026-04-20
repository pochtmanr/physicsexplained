# Hero Background — Implementation Spec

**For:** Claude Code in VS Code, editing the `physicsexplained` repo.
**Scope:** Hero section **background only**. Do not touch hero copy, CTAs,
layout, or any surrounding section. The existing hero text and its grid
sizing are correct — we are only replacing what sits *behind* them.

---

## 0 · Goals

Add three stacked background layers behind the hero content:

1. A **masked grid wash** that fades out toward the center so copy stays readable.
2. A **radial cyan glow** softly lighting the copy area.
3. An **ambient drifting-particle canvas** — quiet star-field, dimmed near center.
4. Four **corner L-ticks** framing the viewport (cyan-dim @ 50% opacity).

**No orbits. No rotating rings. No orbiting dots.** Remove any existing
orbit/epicycle decoration from the hero background.

Everything must respect the existing design-system tokens in
`app/globals.css` (`--color-cyan`, `--color-fg-4`, etc.). Do not invent
new colors. Dark mode is the source of truth; light mode should degrade
gracefully (lower particle opacity, softer glow — see §5).

---

## 1 · File changes

Create / edit exactly these files:

| File | Action |
|---|---|
| `components/sections/HeroBackground.tsx` (new) | The three-layer background component |
| `components/sections/HeroBackground.module.css` *or* extend `app/globals.css` | Layer styles |
| `components/sections/Hero.tsx` (existing) | Mount `<HeroBackground />` as the first child of the hero section, behind copy |
| Anywhere that previously rendered `HeroEpicycle` / orbit canvas | Delete or stop importing |

Do not add new dependencies. Everything is CSS + a single `<canvas>` + vanilla JS (or `useEffect`).

---

## 2 · Component: `HeroBackground.tsx`

```tsx
'use client';
import { useEffect, useRef } from 'react';
import styles from './HeroBackground.module.css';

export function HeroBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const cvs = canvasRef.current;
    if (!cvs) return;
    const ctx = cvs.getContext('2d');
    if (!ctx) return;

    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    let W = 0, H = 0, dpr = 1, raf = 0, last = performance.now();
    let particles: Particle[] = [];

    type Particle = {
      x: number; y: number;
      vx: number; vy: number;
      r: number; tw: number;
      hue: 'cyan' | 'magenta' | 'amber';
    };

    const palette = {
      cyan:    'rgba(91,233,255,',
      magenta: 'rgba(255,106,222,',
      amber:   'rgba(245,196,81,',
    } as const;

    function resize() {
      dpr = Math.max(1, window.devicePixelRatio || 1);
      const rect = cvs.getBoundingClientRect();
      W = rect.width; H = rect.height;
      cvs.width = W * dpr; cvs.height = H * dpr;
      ctx!.setTransform(dpr, 0, 0, dpr, 0, 0);
    }

    function seed() {
      // Quiet density — one particle per ~14,000 css px^2.
      const count = Math.floor((W * H) / 14000);
      particles = Array.from({ length: count }, () => ({
        x: Math.random() * W,
        y: Math.random() * H,
        vx: (Math.random() - 0.5) * 0.12,
        vy: (Math.random() - 0.5) * 0.12,
        r: Math.random() * 1.1 + 0.3,
        tw: Math.random() * Math.PI * 2,
        hue: Math.random() < 0.92 ? 'cyan' : (Math.random() < 0.5 ? 'magenta' : 'amber'),
      }));
    }

    function draw(now: number) {
      const dt = Math.min(48, now - last);
      last = now;
      ctx!.clearRect(0, 0, W, H);

      const cx = W / 2, cy = H / 2;
      const maxR = Math.hypot(cx, cy) || 1;

      for (const p of particles) {
        if (!reduce) {
          p.x += p.vx * dt * 0.08;
          p.y += p.vy * dt * 0.08;
          p.tw += 0.008 * dt * 0.08;
        }

        // toroidal wrap
        if (p.x < -10) p.x = W + 10;
        if (p.x > W + 10) p.x = -10;
        if (p.y < -10) p.y = H + 10;
        if (p.y > H + 10) p.y = -10;

        // center-fade so copy stays readable
        const d = Math.hypot(p.x - cx, p.y - cy) / maxR; // 0..1
        const centerFade = 1 - Math.max(0, 0.6 - d);
        const twinkle = reduce ? 0.7 : (0.55 + Math.sin(p.tw) * 0.35);
        const a = Math.min(0.9, twinkle * centerFade * 0.9);

        ctx!.fillStyle = palette[p.hue] + a.toFixed(3) + ')';
        ctx!.beginPath();
        ctx!.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx!.fill();
      }

      raf = requestAnimationFrame(draw);
    }

    resize();
    seed();
    raf = requestAnimationFrame(draw);

    const onResize = () => { resize(); seed(); };
    window.addEventListener('resize', onResize);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('resize', onResize);
    };
  }, []);

  return (
    <div className={styles.bg} aria-hidden="true">
      <div className={styles.gridWash} />
      <div className={styles.glow} />
      <canvas ref={canvasRef} className={styles.particles} />
      <span className={`${styles.corner} ${styles.tl}`} />
      <span className={`${styles.corner} ${styles.tr}`} />
      <span className={`${styles.corner} ${styles.bl}`} />
      <span className={`${styles.corner} ${styles.br}`} />
    </div>
  );
}
```

---

## 3 · Styles: `HeroBackground.module.css`

```css
.bg {
  position: absolute;
  inset: 0;
  z-index: 0;          /* behind copy; copy should be z-index >= 1 */
  overflow: hidden;
  pointer-events: none;
}

/* 3.1 — Grid wash, masked to fade toward center */
.gridWash {
  position: absolute;
  inset: 0;
  background-image:
    linear-gradient(var(--color-grid) 1px, transparent 1px),
    linear-gradient(90deg, var(--color-grid) 1px, transparent 1px);
  background-size: 40px 40px;
  /* Fades out behind text so copy breathes */
  -webkit-mask-image: radial-gradient(
    ellipse 80% 70% at center,
    rgba(0,0,0,0.25) 0%,
    rgba(0,0,0,0.95) 75%
  );
          mask-image: radial-gradient(
    ellipse 80% 70% at center,
    rgba(0,0,0,0.25) 0%,
    rgba(0,0,0,0.95) 75%
  );
}

/* 3.2 — Soft cyan glow behind copy */
.glow {
  position: absolute;
  inset: 0;
  background: radial-gradient(
    ellipse 50% 40% at center,
    rgba(91,233,255,0.14),
    transparent 70%
  );
}

/* 3.3 — Particle canvas */
.particles {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
}

/* 3.4 — Corner L-ticks */
.corner {
  position: absolute;
  width: 18px;
  height: 18px;
  border: 1px solid var(--color-cyan-dim);
  opacity: 0.5;
}
.tl { top: 24px; left: 24px; border-right: none; border-bottom: none; }
.tr { top: 24px; right: 24px; border-left:  none; border-bottom: none; }
.bl { bottom: 24px; left: 24px; border-right: none; border-top:    none; }
.br { bottom: 24px; right: 24px; border-left:  none; border-top:    none; }

/* Smaller ticks below md breakpoint */
@media (max-width: 768px) {
  .corner { width: 12px; height: 12px; top: 16px; bottom: 16px; left: 16px; right: 16px; }
  .tl { bottom: auto; right: auto; }
  .tr { bottom: auto; left:  auto; }
  .bl { top:    auto; right: auto; }
  .br { top:    auto; left:  auto; }
}

/* Reduced motion — keep particles visible but static (handled in JS too) */
@media (prefers-reduced-motion: reduce) {
  .bg { /* no-op, JS skips velocity + twinkle */ }
}

/* Light theme tune-down */
:global([data-theme="light"]) .glow {
  background: radial-gradient(
    ellipse 50% 40% at center,
    rgba(11,114,133,0.10),
    transparent 70%
  );
}
:global([data-theme="light"]) .corner {
  border-color: var(--color-cyan-dim);
  opacity: 0.4;
}
```

---

## 4 · Mount in `Hero.tsx`

Only two lines change. Render `<HeroBackground />` as the first child of
the hero section, and make sure the copy container has `position: relative; z-index: 1`.

```tsx
// Hero.tsx — illustrative, adapt to actual structure
import { HeroBackground } from './HeroBackground';

export function Hero() {
  return (
    <section className="relative isolate overflow-hidden ...existing classes">
      <HeroBackground />
      <div className="relative z-10 ...existing classes for the copy wrapper">
        {/* existing eyebrow / h1 / lede / CTAs — unchanged */}
      </div>
    </section>
  );
}
```

**Checklist when editing:**
- [ ] `<section>` has `position: relative` and `overflow: hidden`
- [ ] Copy wrapper has `position: relative; z-index: 10` (or any ≥ 1)
- [ ] Any previous `<HeroEpicycle/>`, `<Orbits/>`, or rotating-canvas import is removed
- [ ] `aria-hidden="true"` stays on the background root

---

## 5 · Token reference

Using only these tokens from `app/globals.css`:

| Token | Purpose here |
|---|---|
| `--color-grid` | Grid wash line color (already `rgba(111,184,198,0.08)` dark / `rgba(90,134,147,0.10)` light) |
| `--color-cyan` (`#5BE9FF`) | Particle hue + glow color — used as rgb literal `rgba(91,233,255,...)` in canvas |
| `--color-cyan-dim` (`#6FB8C6`) | Corner L-ticks via `var()` |
| `--color-magenta` (`#FF6ADE`) | Rare particle hue — used as `rgba(255,106,222,...)` |
| `--color-amber` (`#F5C451`) | Rare particle hue — used as `rgba(245,196,81,...)` |

Do not add new CSS variables. If a color needs alpha, keep the rgba literal
inline in the canvas code and the gradient stops.

---

## 6 · Tuning knobs

These are the numbers to tweak if something feels off. Change nothing else.

| Thing | Default | Range | Where |
|---|---|---|---|
| Particle density divisor | `14000` | 9000 (denser) – 22000 (quieter) | `seed()` |
| Max velocity | `0.12` css-px/frame | 0.04 – 0.22 | `seed()` |
| Particle radius | `0.3 – 1.4` | — | `seed()` |
| Twinkle amplitude | `0.35` | 0.2 – 0.5 | `draw()` |
| Center-fade radius | `0.6` | 0.4 – 0.75 | `draw()` — higher = bigger dark hole around copy |
| Grid size | `40px` | 32 – 48 | `.gridWash` |
| Grid mask inner opacity | `0.25` | 0.15 – 0.35 | `.gridWash` mask |
| Glow opacity | `0.14` | 0.08 – 0.2 | `.glow` |
| Glow size | `50% 40%` | 40–65% × 30–50% | `.glow` |
| Corner tick size | `18px` | 12 – 24 | `.corner` |
| Corner tick opacity | `0.5` | 0.3 – 0.7 | `.corner` |

---

## 7 · Accessibility & perf

- `aria-hidden="true"` on `.bg` — pure decoration.
- `prefers-reduced-motion` respected: particles stop drifting and stop
  twinkling; they render as a static field. Do not remove them entirely.
- Canvas is DPR-aware; use `setTransform(dpr, 0, 0, dpr, 0, 0)` so strokes
  stay crisp on retina.
- Resize is debounced by the browser via `ResizeObserver`-free simple
  `resize` listener — re-seed on resize to keep density consistent.
- No GPU effects (no `backdrop-filter`, no `filter: blur()` on large layers).
- Target: ~60fps on a 2019 MacBook Air @ 1440×900 with a hero of 100vh.

---

## 8 · Do / Don't

**Do**
- Keep the three layers in the exact stacking order: gridWash → glow → particles → corners.
- Let `overflow: hidden` on the hero section clip everything.
- Honor reduced motion.

**Don't**
- Don't animate the grid wash or the glow.
- Don't add rotating rings, orbiting dots, or epicycle trails. **This spec replaces them.**
- Don't use `backdrop-filter: blur()` on the background layers — they're already dark.
- Don't introduce new tokens. Use existing variables or rgba literals matching `--color-cyan` etc.
- Don't change hero copy, button styles, layout, spacing, or typography.

---

## 9 · Acceptance test

Open `physics.it.com` locally after the change. Verify:

1. Hero still looks structurally identical — same headline, lede, CTAs, same grid.
2. Behind the copy: subtle grid, soft cyan glow dead-center, faint drifting stars.
3. **No orbiting elements, no rotating rings, nothing spinning.**
4. Four corner L-ticks visible at the hero's edges.
5. `prefers-reduced-motion: reduce` freezes the particles but keeps them visible.
6. Light theme: glow softens to teal, grid still visible, no cyan glare.
7. Copy is fully readable — the center-fade keeps the text area the darkest region.
8. No layout shift, no scrollbar jitter, no console warnings.
