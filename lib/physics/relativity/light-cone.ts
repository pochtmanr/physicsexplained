/**
 * Light-cone geometry and causal structure (RT §03.3).
 *
 * Every event in spacetime carries two cones: a future cone (locus of all
 * events reachable from it at speeds ≤ c) and a past cone (locus of events
 * that could have reached it at speeds ≤ c). Outside both cones is the
 * "elsewhere" — events with no Lorentz-invariant temporal ordering relative
 * to the apex.
 *
 * Conventions match `lib/physics/relativity/types.ts`:
 *   • Mostly-minus signature (+,−,−,−).
 *   • s² > 0 timelike, s² < 0 spacelike, s² = 0 null.
 *   • Δt = p2.t − p1.t > 0 ⇒ p2 is future-of-p1.
 */

import { SPEED_OF_LIGHT } from "@/lib/physics/constants";
import {
  classifyInterval,
  intervalSquared,
} from "./types";
import type { LightConeQuadrant, MinkowskiPoint } from "./types";

/**
 * Quadrant classification of `p2` relative to `p1`. Thin wrapper around
 * `classifyInterval` — kept here so callers reading "light-cone" code don't
 * have to reach into the types module for the labelled enum.
 *
 *   • "timelike-future"  — p2 is inside p1's future light cone.
 *   • "timelike-past"    — p2 is inside p1's past light cone.
 *   • "null-future"      — p2 lies on p1's future light cone.
 *   • "null-past"        — p2 lies on p1's past light cone.
 *   • "spacelike"        — p2 is in the elsewhere of p1.
 *   • "origin"           — p2 coincides with p1.
 */
export function quadrant(
  p1: MinkowskiPoint,
  p2: MinkowskiPoint,
  c: number = SPEED_OF_LIGHT,
): LightConeQuadrant {
  return classifyInterval(p1, p2, c);
}

/**
 * Causal connectivity test: can a signal travelling at ≤ c carry information
 * from `p1` to `p2`? Returns true iff
 *
 *   (1) the interval is timelike or null, AND
 *   (2) p2 is in the future of p1 (Δt > 0).
 *
 * This relation is Lorentz-invariant — the sign of Δt cannot flip on a
 * timelike or null interval under any boost with |β| < 1. (See the
 * test suite for the invariance check.)
 */
export function isCausallyConnected(
  p1: MinkowskiPoint,
  p2: MinkowskiPoint,
  c: number = SPEED_OF_LIGHT,
): boolean {
  const s2 = intervalSquared(p1, p2, c);
  if (s2 < 0) return false; // spacelike — no signal at v ≤ c
  return p2.t > p1.t;
}

/**
 * Light-cone boundary helper. For a single (t, x) coordinate centred on the
 * origin (apex at (0, 0)), returns the signed distance to the 45° envelope:
 *
 *   d = c|t| − |x|
 *
 *   • d > 0  ⇒ event is inside a light cone (timelike from origin).
 *   • d = 0  ⇒ event is on the cone (null from origin).
 *   • d < 0  ⇒ event is in the elsewhere.
 *
 * Sign of `t` distinguishes future (t > 0) vs past (t < 0). Use this for
 * scene shading — point membership in a single cell.
 */
export function lightConeBoundary(
  t: number,
  x: number,
  c: number = SPEED_OF_LIGHT,
): number {
  return c * Math.abs(t) - Math.abs(x);
}
