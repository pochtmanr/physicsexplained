# Interactive Playgrounds — Design Spec

**Date:** 2026-04-30
**Status:** Draft (awaiting user review before plan-writing)
**Scope:** Shared playground framework + Orbital Mechanics as the first concrete playground. Pendulum, wave interference, EM field, and relativistic time dilation are out of scope for this spec — each will get its own follow-up spec built on the framework defined here.

---

## 1. Goal

Ship a public `/play` route hosting fullscreen, mobile-friendly, viral-grade interactive physics simulations. The first playground is **Orbital Mechanics** (N-body chaos sandbox). The framework defined here makes the remaining four playgrounds near-mechanical to add.

Success criteria:

- `/play/orbital-mechanics` loads to interactive in under 2 s on 4G mobile (Lighthouse-verified).
- One-finger drag works on mobile; two-finger pinch zooms.
- "Copy link" reproduces the exact scenario when opened.
- "Tweet this scenario" posts a Twitter intent URL with a dynamic OG card.
- "Explain with AI" deeplinks to `/ask` with the scene + params + a starter prompt; sign-in redirect lands the user back at `/ask` with state intact.
- All physics in `lib/physics/n-body.ts` is unit-tested for energy/momentum conservation on known orbits.

---

## 2. Non-goals

- Multiplayer / collaborative playgrounds.
- Saving scenarios to a user account (the URL is the save).
- Server-side simulation (everything runs in the browser; only OG card generation hits the server).
- Replacing existing in-article scenes — those stay as-is.
- Any of the other four playgrounds in this spec.

---

## 3. Architecture

### 3.1 Route + file structure

```
app/[locale]/play/
  layout.tsx                       # shared chrome (back arrow, title, kebab menu)
  page.tsx                         # /play index — static grid of playground cards
  [slug]/
    page.tsx                       # server component; reads URL params, mounts client playground
    opengraph-image.tsx            # dynamic OG card (Next 15 file convention)
  _components/
    playground-shell.tsx           # client; floating toolbar, share modal, fullscreen canvas slot
    share-buttons.tsx              # copy-link, tweet, explain-with-ai
    use-playground-state.ts        # generic <T> hook; Zod-validated URL <-> state sync
    encode-state.ts                # query-param + base64 hybrid encoding
    playground-meta.ts             # registry: { slug, title, description, schema, Component }

components/playgrounds/
  orbital-mechanics/
    index.tsx                      # N-body canvas + control panel
    n-body-canvas.tsx              # canvas renderer (uses useAnimationFrame)
    controls.tsx                   # floating control card
    presets.ts                     # figure-8, solar-mini, pythagorean, random-cluster
    gestures.ts                    # tap, drag, pinch, long-press handlers

lib/physics/
  n-body.ts                        # NEW pure solver, no DOM deps

tests/physics/
  n-body.test.ts                   # conservation tests, known-orbit tests
```

Why route segments + `layout.tsx`: matches Next 15 conventions, keeps shared chrome in one place, and isolates each playground page so its bundle is its own chunk.

### 3.2 Component boundaries

- `app/[locale]/play/layout.tsx` is a server component. It provides the route-level shell (no site `<Nav>` or `<Footer>`) and the static positioning of the top bar (fixed-position glass bar, back-arrow `<Link>`, title slot, kebab-menu mount point). It hosts client islands but renders no interactive logic itself.
- `playground-shell.tsx` is a client component rendered inside each `[slug]/page.tsx`. It owns the interactive chrome: the kebab-menu dropdown, share modal, "Explain with AI" link, copy-link toast, top-bar collapse-on-idle behavior. It receives the playground's current state + meta via props and renders the playground's component as `children`. It does NOT know what playground it's wrapping.
- `components/playgrounds/<slug>/index.tsx` knows about its physics and its UI. It calls `usePlaygroundState(schema)` and renders the canvas + controls. It does NOT know about share buttons or routing.
- `use-playground-state(schema)` is the only bridge: each playground passes its Zod schema, gets back `[state, setState]` synced to the URL. The shell reads from the same hook to render the share buttons' URL.

A new playground is: define schema, write the component, register it in `playground-meta.ts`, add a scene-catalog entry. No framework code changes.

---

## 4. URL state model

### 4.1 Encoding strategy

- **Fixed-shape playgrounds** (pendulum, slits, time dilation): typed query params, e.g. `/play/pendulum?L=1.2&theta=0.4&mode=double`. One key per parameter.
- **Variable-shape playgrounds** (orbital — N bodies × 5 fields each): single `?s=<base64-json>` blob. Body list goes inside.
- The choice is per-playground, encoded in `playground-meta.ts` as `urlMode: "params" | "blob"`.

### 4.2 Sync rules

- `usePlaygroundState(schema)` reads `searchParams` via `useSearchParams`, validates with Zod, falls back to defaults on parse fail.
- State writes go through `router.replace` (no history pollution), debounced to 250 ms during continuous gestures (drag, pinch).
- Reset button = `router.replace(pathname)`; strips all params back to defaults.
- All defaults live in the Zod schema itself (via `.default(...)`), so deep links and fresh visits use the same code path.

### 4.3 Encoding helpers

`encode-state.ts` exports:

- `encodeParams(state, schema): URLSearchParams` — flattens primitives to query params; encodes structured fields as base64 JSON under `s`.
- `decodeParams(searchParams, schema): T` — runs `safeParse`; returns defaults on failure with a console warning.
- Base64 uses URL-safe encoding (`-` and `_` instead of `+` and `/`); decoder accepts both for forwards compatibility.

---

## 5. Share + AI deeplink

### 5.1 Copy link

`navigator.clipboard.writeText(window.location.href)`. Toast on success. The URL already encodes the full state by §4.

### 5.2 Tweet

Twitter intent URL:

```
https://twitter.com/intent/tweet?text=<title>&url=<encoded-current-url>
```

`<title>` = playground display name + 1-line scenario summary pulled from playground meta (e.g., `Three-body chaos · Physics`). The URL becomes a Twitter card via the OG image.

### 5.3 Dynamic OG card

`opengraph-image.tsx` runs at request time, decodes URL params via the same `decodeParams` helper, and renders a 1200×630 PNG using Next 15's built-in `ImageResponse`. Card contents:

- Top: playground title.
- Center: 1–2 defining numbers (e.g., `3 bodies · figure-8 preset`) or a sketched silhouette of the orbit.
- Bottom: `physics.is/play/<slug>`.

Cached by Next per unique URL. Static fallback (no params) lives at `/play/<slug>/opengraph-image.png`.

### 5.4 Explain with AI

Builds:

```
/{locale}/ask?scene=<sceneId>&params=<base64-of-state>&prompt=<seeded-prompt>
```

- `sceneId` is a new entry in `lib/ask/scene-catalog.ts` per playground (one per spec). The catalog entry's `paramsSchema` is **the same** Zod schema as the playground (re-imported from `playground-meta.ts`), so the catalog and the playground can never drift.
- `seeded-prompt` is a 1-line starter from playground meta (e.g., `"Explain what's happening in this three-body system."`).
- Auth: existing middleware regex `/^\/(?:[a-z]{2}\/)?(?:ask|account)/` already redirects unauth users through `/sign-in?next=...`. After sign-in, the `next` URL is preserved including the `?scene=&params=&prompt=` — verified by reading the existing middleware behavior.
- `/ask` page reads `?scene` + `?params` + `?prompt`, mounts the inline scene with hydrated state, and pre-fills the composer. **This is a new capability for `/ask`** — the implementation plan must include a small change to `app/[locale]/ask/page.tsx` and `components/ask/composer.tsx` to consume these query params on first mount, then strip them from the URL via `router.replace` so a refresh doesn't re-prefill.
- `/ask` does NOT auto-send the prompt; user reviews and submits. Avoids burning tokens on accidental clicks.

---

## 6. Page chrome (fullscreen canvas)

### 6.1 Layout

The chrome is split between a server layout (positioning) and a client shell (interactivity), per §3.2:

- `app/[locale]/play/layout.tsx` (server) renders a fixed-position top bar (height 48 px, glass background, `inset-block-start: 0`) containing a `<Link href="/play">` back arrow on the start side and a title slot in the centre. It does NOT render the site's `<Nav>` or `<Footer>` (this requires either checking the pathname in `app/[locale]/layout.tsx` to opt out, or moving the play route to a sibling root segment — to be decided in the plan).
- `playground-shell.tsx` (client) renders inside `[slug]/page.tsx`, mounts a kebab-menu button into the top bar's end-side slot via a portal or sibling positioning, and owns the collapse-on-idle behaviour: the top bar shrinks to a 20 px peek bar after 3 s of canvas interaction; tap to re-expand.
- The playground component itself fills `100dvh - 48px` height (or `100dvh - 20px` when collapsed).

### 6.2 Controls

- **Mobile**: floating bottom-center card, glass-styled, has a drag handle. Default-collapsed showing only Play/Pause + Reset; swipe up to expand into full controls.
- **Desktop**: floating bottom-right card, default-expanded.
- **Reset button**: floating top-left, under the back arrow.

### 6.3 Theming + accessibility

- Uses existing theme tokens (`useThemeColors`); follows site dark/light mode.
- `useReducedMotion`: simulation freezes at the initial state; controls still work; gestures still work but produce a single still frame, not animation.
- RTL: layout uses logical CSS properties (`inset-inline-start` etc.) so Hebrew works without overrides.
- Focus-visible rings on all controls; `aria-label` on icon-only buttons.

---

## 7. Performance

### 7.1 Targets

- LCP under 1.5 s on Moto G4 / Slow 4G (Lighthouse mobile profile).
- TTI under 2 s on the same profile.
- JS payload for `/play/orbital-mechanics` route under 80 KB gzipped (excluding shared framework chunks).
- The `/play` index page payload under 30 KB gzipped.

### 7.2 Mechanisms

- Each playground = `next/dynamic({ ssr: false, loading: SceneSkeleton })`, generating its own webpack chunk per the existing `lazyScene` pattern in `simulation-registry.ts`.
- The play layout strips `Nav`, `Footer`, and any MDX/KaTeX/JSXGraph imports (none of those are used on play pages anyway, but verified by checking the bundle).
- Canvas uses the existing `useAnimationFrame` hook (visibility-aware, pauses off-screen).
- Velocity-Verlet integrator runs in the main thread for ≤5 bodies. The `n-body.ts` engine exposes a pure `step(state, dt)` function so a future Worker move requires no scene changes.
- `/play` index prefetches the orbital chunk on hover (desktop) and on `touchstart` (mobile) of its card.
- Lighthouse run is part of CI for the play routes (new GitHub Action or extension to existing one — to be defined in the implementation plan).

---

## 8. Orbital Mechanics playground

### 8.1 Physics

`lib/physics/n-body.ts` exports:

- `type Body = { id: string; mass: number; x: number; y: number; vx: number; vy: number }`
- `step(bodies: Body[], dt: number, opts?: { G?: number; softening?: number }): Body[]` — Velocity-Verlet integrator. Symplectic (energy-preserving over long runs).
- `totalEnergy(bodies, opts): number`
- `totalMomentum(bodies): { px: number; py: number }`
- `centerOfMass(bodies): { x: number; y: number }`
- Plummer softening with default ε = 0.05 (in display units) to avoid singularities on close approach. G defaults to 1 (display units; not SI).

The solver is fully pure: no DOM, no React, no `Math.random` (presets pass explicit body lists).

### 8.2 Interactions

| Gesture | Effect |
|---|---|
| Tap empty space | Drop a body at that position with mass 1 and zero velocity |
| Tap-and-drag from a body | Show velocity arrow; release sets initial velocity |
| Drag a placed body | Reposition; velocity preserved |
| Two-finger pinch | Zoom (range 0.25× – 4×) |
| Two-finger drag | Pan |
| Long-press body | Context menu: change mass (1, 5, 25, 100), delete |
| Tap empty when sim paused vs running | Same — adding a body during run is allowed; integrator picks it up next step |

Cap: 8 bodies. Adding a 9th replaces the oldest. (Visual cap; integrator handles arbitrary N.)

### 8.3 Controls (bottom card)

- Play / Pause toggle.
- Speed: 0.25× / 1× / 4× (segmented control).
- Trails: on / off (off = clean canvas, on = fading trail per body, ~3 s).
- Reset (clears bodies, returns to default preset's initial state).
- Preset picker: dropdown with figure-8, solar-mini, pythagorean, random-cluster.
- Body count badge (read-only).

### 8.4 Presets

| Preset | Description | Bodies |
|---|---|---|
| `figure-8` | Chenciner-Montgomery 1993 figure-8 orbit (3 equal masses tracing a single ∞-shape) | 3 |
| `solar-mini` | One central mass + 3 light planets at varying eccentricities | 4 |
| `pythagorean` | Burrau's classical chaos problem (masses 3, 4, 5 at the corners of a 3-4-5 right triangle, all at rest) | 3 |
| `random-cluster` | 5 bodies with random masses and velocities, deterministic seed | 5 |

Default preset on first visit: `figure-8` — visually striking, immediately suggests "drag this and watch it explode".

### 8.5 URL encoding

`urlMode: "blob"`. State shape:

```ts
{
  preset?: "figure-8" | "solar-mini" | "pythagorean" | "random-cluster" | "custom",
  bodies: Body[],   // omitted if preset is set and bodies match preset's defaults
  trails: boolean,
  speed: 0.25 | 1 | 4,
}
```

Encoded as `?s=<base64-json>`. When `preset` is set and matches, `bodies` is dropped → shorter URL for shared presets.

### 8.6 OG card

Renders:

- Title: `Orbital Mechanics`
- Subtitle: preset name or `Custom · N bodies`
- Sketched silhouette: trace the first 200 integration steps of the encoded scenario, draw as faint lines on a dark canvas.

---

## 9. Scene catalog integration

`lib/ask/scene-catalog.ts` gets a new entry:

```ts
{
  id: "OrbitalMechanicsPlayground",
  label: "Orbital mechanics playground",
  description: "Interactive N-body gravitational system. Drop bodies, drag to set velocity, watch chaos.",
  tags: ["orbit", "n-body", "chaos", "gravity", "playground"],
  topicSlugs: ["classical-mechanics/kepler", "classical-mechanics/universal-gravitation"],
  paramsSchema: orbitalPlaygroundSchema, // re-imported from playground-meta.ts
}
```

`SIMULATION_REGISTRY` in `lib/content/simulation-registry.ts` gets a corresponding lazy entry pointing to `components/playgrounds/orbital-mechanics`. This lets `/ask` render the playground inline when deeplinked from the "Explain with AI" button.

A test in `tests/ask/scene-catalog-contract.test.ts` (existing pattern) verifies the catalog id matches a registry id.

---

## 10. Testing

### 10.1 Unit (vitest)

- `tests/physics/n-body.test.ts`:
  - `step` conserves total energy within 1% over 1000 steps for figure-8 and 2-body circular orbits.
  - `step` conserves total momentum exactly (within float epsilon).
  - Plummer softening prevents NaN on coincident bodies.
  - Verlet symmetry: stepping forward then backward returns to (within tolerance) the starting state.
- `app/[locale]/play/_components/encode-state.test.ts`:
  - Round-trip: `decodeParams(encodeParams(s)) === s` for each playground's schema.
  - Bad input: malformed base64 falls back to defaults, doesn't throw.

### 10.2 Component

- `components/playgrounds/orbital-mechanics/index.test.tsx` (RTL):
  - Mounts with figure-8 preset; canvas renders.
  - Tap fires the spawn handler.
  - Reset clears query params.

### 10.3 E2E / Lighthouse

- Lighthouse mobile run on `/play/orbital-mechanics` in CI; fail if LCP > 1.8 s or TTI > 2.5 s (some headroom over the 1.5/2.0 targets to account for CI variance).

---

## 11. Internationalization

- Playground titles, control labels, preset names, AI starter prompts all live in `messages/en/play.json` (new file) and `messages/he/play.json`.
- `playground-meta.ts` references translation keys, not raw strings.
- The `ru` folder under `messages/` is legacy (not in `i18n/config.ts` locales); leaving it untouched.

---

## 12. Open questions / risks

| Item | Risk | Mitigation |
|---|---|---|
| Mobile gesture conflicts (browser pinch vs ours) | Browser may intercept pinch-zoom | `touch-action: none` on the canvas; documented in `gestures.ts` |
| Twitter card cache | Twitter caches OG cards aggressively; stale cards persist across scenario edits | URL changes on edit (state encoded), so each shared scenario is its own URL → its own cached card. No invalidation needed. |
| `/ask` deeplink token cost | Auto-rendering inline scene + auto-prompt could spike costs | Don't auto-send prompt; user has to tap submit. Inline scene render is free (client-side). |
| Verlet drift on high-speed close encounters | Energy can drift on near-collisions despite softening | Adaptive sub-stepping inside `step` when relative velocity exceeds threshold. Tested in §10.1. |
| Bundle size creep as more playgrounds are added | Shared framework grows | Each playground is its own dynamic chunk; framework code reviewed against the 30 KB index budget. |

---

## 13. Out of scope (for follow-up specs)

- Pendulum playground (with damping/forcing/double pendulum modes).
- Wave interference playground (Young's double slit, draggable slit positions).
- EM field with charges (drop charges, see field lines).
- Relativistic time dilation (drag spaceship velocity, see clock difference).

Each will be its own short spec referencing this one for the framework.
