# `_shared` — Cross-topic physics primitives

Shared canvas primitives that amortize across multiple topics. Each topic-specific Scene wraps a primitive and configures it.

## SpacetimeDiagramCanvas

Minkowski-diagram primitive for SR topics. Vertical axis `ct`, horizontal `x`. Worldlines are polylines through `MinkowskiPoint` events. Light cone renders as 45 deg dashed rays from the origin. Boosted-frame axes overlay tilts ct' toward 45 deg and x' symmetrically as |β| grows. Optional simultaneity slice draws constant-t' under boost. Providing `onBoostChange` renders a controlled β slider; otherwise no slider.

Consumed by RT §01.5 relative-simultaneity, §02.1 time-dilation, §02.3 the-lorentz-transformation (Session 1) and §03.1 spacetime-diagrams, §03.5 the-twin-paradox (Session 2).

### API

| Prop | Type | Default |
| --- | --- | --- |
| `worldlines` | `readonly Worldline[]` | required |
| `lightCone` | `boolean` | `true` |
| `simultaneitySlice` | `{ tPrime, beta } \| null` | `null` |
| `boostBeta` | `number` | `undefined` |
| `boostMin` / `boostMax` / `boostStep` | `number` | `-0.95` / `0.95` / `0.01` |
| `onBoostChange` | `(beta: number) => void` | `undefined` |
| `xRange` | `[number, number]` | `[-2, 2]` |
| `tRange` | `[number, number]` | `[0, 4]` |
| `width` / `height` | `number` | `480` / `360` |
| `palette` | `Partial<SpacetimePalette>` | `undefined` |

`Worldline.accelerated` flips the line to the orange palette slot.

### Color convention

Matches EM Sessions 1–7 scene palette. Override via `palette` only when a topic demands it.

- Stationary worldlines / lab axes: cyan `#67E8F9`
- Boosted-frame axes / simultaneity slices: magenta `#FF6ADE`
- Light cones: amber `#FFD66B`
- Accelerated worldlines: orange `#FFB36B`
- Grid: dim grey `rgba(255,255,255,0.08)`

### Notes

- Caller passes `MinkowskiPoint.t` in `ct` units; canvas does not scale by `c`.
- All math is inline (slope 1/β for ct', slope β for x', `t = tPrime/γ + β·x` for simultaneity). No sibling solver.
- `Worldline` / `MinkowskiPoint` come from `lib/physics/relativity/types`.
