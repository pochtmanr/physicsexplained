# Module 1 · Kinematics & Newton — remaining topics

FIG.01 ships. Three topics left. Each below is a punch list, not a spec. Voice = same as live oscillation topics (Galileo-chandelier tone).

---

## FIG.02 — Vectors and Projectile Motion

**Hook.** A cannonball leaves a cannon. Why does it trace a parabola? Galileo (*Two New Sciences*, 1638) broke the motion into two independent problems — horizontal and vertical — and showed the curve falls out for free.

**Sections (7):**

1. **Two motions at once** — a ball rolled off a table lands at the same moment as a ball dropped straight down. The horizontal doesn't care about the vertical. Galileo's insight.
2. **Vectors** — magnitude + direction. Addition (tip-to-tail). Components (projection onto axes). One paragraph of notation, no ceremony.
3. **The parabola** — x(t) = v·cosθ·t ; y(t) = v·sinθ·t − ½g·t². Eliminate t → y is quadratic in x. Done.
4. **Range, height, time-of-flight** — the three derived quantities. Why 45° maximises range in vacuum.
5. **Monkey and the hunter** — the thought experiment: aim directly at a monkey that drops at the trigger. The dart hits regardless of launch speed, because both are in free fall together.
6. **Air changes everything** — real baseballs don't follow parabolas. Preview of FIG.04 (drag).
7. **What's next** — forces are why anything accelerates at all → FIG.03.

**Scenes to build (3):**

| File | Purpose |
|---|---|
| `projectile-scene.tsx` | Angle slider (0–90°), speed slider; fires a ball that traces a parabola. Side panel shows horizontal velocity (constant) and vertical velocity (linear-then-flip). Range and peak-height readouts. |
| `vector-addition-scene.tsx` | Two draggable vector arrows on a canvas; resultant vector drawn with dashed-parallelogram guide. Pure geometric toy. |
| `monkey-hunter-scene.tsx` | Cannon aiming at a hanging monkey. Speed slider. Press fire — monkey drops the instant the dart leaves. Dart always intercepts the monkey regardless of speed. |

**Physicists (aside):**
- Galileo Galilei *(exists)*
- Isaac Newton *(exists)*
- Evangelista Torricelli *(NEW — Galileo's student, worked out projectile tables, Torricelli's theorem on fluid efflux)*

**Glossary terms (add via direct edits to `lib/content/glossary.ts` + `messages/<locale>/glossary.json`):**
- `vector` — concept
- `projectile-motion` — concept
- `parabola` — concept (or phenomenon)
- `range` — concept
- `monkey-and-hunter` — concept (the classic demo; worth a dedicated entry)

**Files to touch:**
- `app/[locale]/(topics)/classical-mechanics/vectors-and-projectile-motion/content.en.mdx` (replace skeleton)
- Same path, `content.he.mdx` (translate at end)
- Same path, `page.tsx` (wire `HeContent`)
- `components/physics/projectile-scene.tsx` (new)
- `components/physics/vector-addition-scene.tsx` (new)
- `components/physics/monkey-hunter-scene.tsx` (new)
- `components/physics/visualization-registry.tsx` (register 3 scenes)
- `lib/content/physicists.ts` + `messages/en/physicists.json` (add Torricelli)
- `lib/content/branches.ts` (flip `status: "live"`, `readingMinutes: 10`)
- `messages/en/home.json` + `messages/he/home.json` (update chrome)

**Reading minutes:** 10.

---

## FIG.03 — Newton's Three Laws

**Hook.** Newton at Woolsthorpe in the plague year, 1666. Twenty-three, alone, the most productive two years in the history of science. The three laws appear in print in 1687 as the Principia's first sentence. They still run the world.

**Sections (7):**

1. **The first law** — inertia. A body at rest stays at rest; a body in motion stays in motion along a straight line at constant speed. Aristotle was wrong for 2000 years. Galileo saw the truth but didn't state it as a law; Newton did.
2. **The second law** — F = ma. The most reused equation in physics. Mass is the resistance to acceleration.
3. **The third law** — every action has an equal and opposite reaction. Rockets, walking, swimming, a bird pushing down on the air.
4. **Inertial frames** — the laws hold only in frames that aren't themselves accelerating. Galilean relativity as a bonus.
5. **What Newton actually did at Woolsthorpe** — the apple story is half-myth; the real insight is that the same force holds the Moon as drops an apple.
6. **What the laws don't say** — they don't tell you what forces exist. They tell you what forces DO once you know them. Friction and drag (FIG.04) are examples.
7. **Forward** — conservation laws (Module 2) are the three laws restated without forces.

**Scenes to build (3):**

| File | Purpose |
|---|---|
| `first-law-scene.tsx` | Block on a surface with a friction slider (μ = 0 → slides forever). Push once; watch it coast or decay. |
| `f-ma-scene.tsx` | Force slider, mass slider; a ball accelerates in real time at F/m. Live readouts. |
| `action-reaction-scene.tsx` | Two ice skaters pushing each other. Mass-ratio slider. Forces are equal; velocities after the push are inversely proportional to mass (momentum-conservation preview). |

**Physicists (aside):**
- Isaac Newton *(exists)*
- Galileo Galilei *(exists)*
- Robert Hooke *(NEW — Newton's rival, independently glimpsed the inverse-square law, crucial for the Newton story)*

**Glossary terms:**
- `inertia` — concept
- `mass` — concept
- `force` — concept
- `newtons-laws-of-motion` — concept (one entry covering all three, cross-referenced)
- `inertial-frame` — concept

**Files to touch:** same pattern as FIG.02 (swap names).

**Reading minutes:** 11.

---

## FIG.04 — Friction and Drag

**Hook.** A hockey puck slides ~200 metres and stops. A car rolls, brakes, stops. A feather drifts. In every case, energy is leaving the system. Where does it go?

**Sections (7):**

1. **The energy vanishes** — into heat. Friction is the name for the mechanism. The kinetic energy of the block becomes the thermal energy of the surface and air.
2. **Static vs kinetic friction** — two regimes, two coefficients. Why μ_s > μ_k (you need extra force to *break* static contact). The sudden slip as you tip a book off a table.
3. **The inclined plane revisited** — when does a block stay put? Answer: when tan(θ) ≤ μ_s. FIG.01's ramp, with friction restored.
4. **Drag I: linear regime** — slow objects in viscous fluids (a dust mote in air, a ball-bearing in glycerine). Stokes' law. Terminal velocity.
5. **Drag II: quadratic regime** — fast objects in air (cars, cyclists, baseballs, falling skydivers). F ∝ v². The Reynolds number as the switch between regimes.
6. **When friction is useful** — walking. Writing. The grip of tyres. The world without friction would be unusable.
7. **Forward** — Module 2 (conservation) reckons with where the lost energy actually went.

**Scenes to build (3):**

| File | Purpose |
|---|---|
| `friction-ramp-scene.tsx` | Inclined plane with a block. Angle slider, μ slider. Visual threshold: block stays put until θ passes the critical angle, then slides. |
| `terminal-velocity-scene.tsx` | A sphere falling through a fluid. Fluid-density slider. v(t) trace shows the exponential approach to terminal velocity. |
| `drag-regimes-scene.tsx` | Log-log plot of drag force vs velocity. Linear at low v, quadratic at high v. Reynolds-number marker. |

**Physicists (aside):**
- Guillaume Amontons *(NEW — formulated the classical friction laws c. 1699)*
- George Gabriel Stokes *(NEW — viscous drag, Stokes' law)*
- Isaac Newton *(exists — Principia's treatment of resisted motion was the first serious attempt at drag)*

**Glossary terms:**
- `friction` — concept
- `static-friction` — concept
- `kinetic-friction` — concept
- `drag` — concept
- `terminal-velocity` — concept
- `stokes-law` — concept

Note: **don't** add `reynolds-number` here — it belongs to the Fluids module and is already slated for FIG.26.

**Files to touch:** same pattern. Reading minutes: 12.

---

## Execution order

Recommended sequence — each topic is self-contained, nothing blocks anything else:

1. FIG.03 first (Newton's laws). It's the conceptual hinge of Module 1; FIG.02 and FIG.04 both assume it. Three clean scenes.
2. FIG.02 (projectile motion). Builds on vectors — a fresh notation but a short pedagogical load. Monkey-and-hunter is the fun scene.
3. FIG.04 last (friction/drag). The most physics-heavy of the three (two drag regimes + static/kinetic split). Rewards having the vector language and F = ma already in the reader.

## Patterns to reuse

- **Scene skeleton:** copy from `damped-pendulum-scene.tsx` or `kinematics-graph-scene.tsx`. All use `useAnimationFrame`, `useThemeColors`, canvas + ResizeObserver, cyan (`#5BE9FF`) as the accent.
- **Physics functions:** pure modules in `lib/physics/*.ts`. One module per topic (`lib/physics/projectile.ts`, `lib/physics/newton.ts`, `lib/physics/friction.ts`).
- **Physicist adds:** manually edit `lib/content/physicists.ts` + `messages/en/physicists.json` (no MCP tool for this — documented gap in `docs/mcp-gaps.md`).
- **Glossary adds:** direct edits to `lib/content/glossary.ts` + `messages/en/glossary.json` + `messages/he/glossary.json` (three files; no MCP dependency required).
- **Topic status flip:** direct edit to `lib/content/branches.ts` — change `status` and `readingMinutes` on the relevant entry.
- **Hebrew content:** copy the English MDX, translate prose section-by-section, update `messages/he/home.json` chrome, wire `HeContent` into `page.tsx`.

## Definition of done per topic

- [ ] `content.en.mdx` replaces skeleton, full 7-section essay.
- [ ] All new scenes exist, are registered, render without runtime error.
- [ ] New physicists + glossary terms live with cross-links.
- [ ] `status: "live"`, `readingMinutes: N` in `branches.ts`.
- [ ] English home.json chrome updated.
- [ ] `npx tsc --noEmit` passes.
- [ ] Manual smoke test in `bun dev` at `/en/classical-mechanics/<slug>`.
- [ ] (optional) Hebrew content + page.tsx wire + home.json chrome.
