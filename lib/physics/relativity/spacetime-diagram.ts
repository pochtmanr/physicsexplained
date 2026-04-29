/**
 * §03.1 SPACETIME DIAGRAMS — pure-TS helpers for Minkowski-diagram visualizations.
 *
 * A spacetime diagram plots a 2D slice of 4D Minkowski space: vertical axis
 * is the time coordinate (in `ct` units so it has the same dimensions as
 * the spatial axis), horizontal axis is one spatial coordinate `x`. A
 * particle's history is a polyline through the diagram — its WORLDLINE.
 *
 * Conventions matching `lib/physics/relativity/types.ts`:
 *   • `MinkowskiPoint.t` is in seconds; callers convert to `ct` before
 *     handing the point to `SpacetimeDiagramCanvas`.
 *   • `worldlineSlope` returns `dx / (c·dt) = β`, the dimensionless
 *     velocity-as-fraction-of-c. A vertical (stationary) worldline has
 *     slope 0; a 45° worldline has slope ±1 (light); subluminal motion
 *     has |slope| < 1.
 *
 * Note the convention: in the Minkowski diagram the FASTER a particle moves,
 * the more its worldline TILTS away from vertical — slope-as-β grows toward
 * the 45° line. The "slope > 1 means subluminal" framing in some texts
 * uses dt/dx instead of dx/d(ct); we use the latter to match the standard
 * SR pedagogy where the light-cone is the 45° envelope.
 */

import type { Worldline, MinkowskiPoint } from "@/lib/physics/relativity/types";
import { SPEED_OF_LIGHT } from "@/lib/physics/constants";

/** Build a stationary worldline at position x0, sampled from t=tMin to t=tMax in n+1 events.
 *  Each event has (t, x0, 0, 0). t values are in seconds; for plot use, callers convert to ct. */
export function stationaryWorldline(
  x0: number,
  tMin: number,
  tMax: number,
  n: number,
): Worldline {
  if (n < 1 || !Number.isFinite(n)) {
    throw new RangeError(`stationaryWorldline: n must be a positive integer (got ${n})`);
  }
  if (!(tMax > tMin)) {
    throw new RangeError(`stationaryWorldline: tMax must exceed tMin (got ${tMin} → ${tMax})`);
  }
  const events: MinkowskiPoint[] = [];
  for (let i = 0; i <= n; i++) {
    const t = tMin + (i / n) * (tMax - tMin);
    events.push({ t, x: x0, y: 0, z: 0 });
  }
  return { events, color: "#67E8F9", label: `x = ${x0}` };
}

/** Build a uniformly-moving worldline starting at (t=0, x=x0) with velocity v (m/s). */
export function uniformWorldline(
  x0: number,
  v: number,
  tMin: number,
  tMax: number,
  n: number,
): Worldline {
  if (n < 1 || !Number.isFinite(n)) {
    throw new RangeError(`uniformWorldline: n must be a positive integer (got ${n})`);
  }
  if (!(tMax > tMin)) {
    throw new RangeError(`uniformWorldline: tMax must exceed tMin (got ${tMin} → ${tMax})`);
  }
  const events: MinkowskiPoint[] = [];
  for (let i = 0; i <= n; i++) {
    const t = tMin + (i / n) * (tMax - tMin);
    events.push({ t, x: x0 + v * t, y: 0, z: 0 });
  }
  return { events, color: "#FF6ADE", label: `v = ${v.toFixed(2)} m/s` };
}

/** Slope (dx/d(ct)) of a worldline segment between two events. β = (1/c) · dx/dt.
 *  Returns +Infinity if the two events are simultaneous (Δt = 0) — a horizontal
 *  segment in the diagram, which would represent an instantaneous spatial jump
 *  (spacelike, no physical worldline can do this). */
export function worldlineSlope(p1: MinkowskiPoint, p2: MinkowskiPoint): number {
  const dt = p2.t - p1.t;
  if (Math.abs(dt) < 1e-30) return Number.POSITIVE_INFINITY;
  return (p2.x - p1.x) / (SPEED_OF_LIGHT * dt);
}
