# Physics, explained visually

A visual-first physics education site with live, interactive simulations. Every equation gets a figure you can touch.

Classical mechanics is live. Quantum, relativity, thermodynamics, electromagnetism, and modern physics are on the way.

## What's inside

**7 interactive articles** across classical mechanics, each with embedded simulations:

- The Simple Pendulum — isochronism, restoring force, SHM
- Beyond Small Angles — nonlinear dynamics, phase portraits, separatrix
- Oscillators Everywhere — damping, resonance, coupled oscillators
- Kepler's Laws — elliptical orbits, equal areas, harmonic law
- Universal Gravitation — inverse-square law, shell theorem, field lines
- Energy in Orbit — vis-viva, Hohmann transfers, escape velocity
- Tides and the Three-Body Problem — tidal forces, Lagrange points, Roche limit

**36 glossary terms** — instruments, concepts, phenomena, units

**17 physicist profiles** — from Archimedes to Feynman

**20+ interactive visualizations** — pendulums, orbits, phase portraits, energy diagrams, wave chains, resonance curves, and more

## Stack

Next.js 15 &middot; React 19 &middot; TypeScript &middot; Tailwind v4 &middot; MDX &middot; KaTeX &middot; Motion &middot; JSXGraph &middot; Supabase &middot; Vercel Analytics

**i18n**: English + Russian via `next-intl`

## Dev

```bash
pnpm install
pnpm dev
```

Open http://localhost:3000.

## Test

```bash
pnpm test          # single run
pnpm test:watch    # watch mode
```

## Deploy

Vercel — auto-deploy on push to `main`.

## Project structure

```
app/[locale]/                  # i18n-aware pages
  (topics)/classical-mechanics # article pages (MDX)
  dictionary/                  # glossary index + entry pages
  physicists/                  # physicist index + profile pages
components/
  physics/                     # interactive simulation components
  sections/                    # landing page sections
  layout/                      # nav, footer, theme toggle
  math/                        # KaTeX equation rendering
lib/
  content/                     # data: glossary, physicists, branches
  physics/                     # numerical solvers, physics utils
messages/                      # i18n translation files (en, ru)
```
