/**
 * §03.2 THE INVARIANT INTERVAL — pure-TS helpers.
 *
 * The Lorentz scalar
 *
 *   s² = c²Δt² − Δx² − Δy² − Δz²
 *
 * is preserved under every Lorentz transformation: boosts in any direction,
 * spatial rotations, and arbitrary compositions thereof. Two observers in
 * relative motion will disagree on Δt and Δx separately — but they will
 * agree on s². It is the SR generalization of Pythagoras's theorem with
 * one minus sign: a 4D pseudo-Euclidean metric replacing the Euclidean
 * dx² + dy² of plane geometry.
 *
 * Sign convention (mostly-minus): timelike s² > 0, spacelike s² < 0,
 * null s² = 0. Matches the canonical helpers `intervalSquared` and
 * `classifyInterval` in `./types`.
 */

import { SPEED_OF_LIGHT } from "@/lib/physics/constants";
import { intervalSquared, classifyInterval } from "./types";
import type { MinkowskiPoint, LightConeQuadrant } from "./types";

/**
 * Returns the signed invariant s² and the causal classification quadrant
 * for two events (timelike-future / timelike-past / spacelike / null-future
 * / null-past / origin). Thin wrapper over the canonical helpers — gives
 * topic-specific call sites a single object return so the HUD can render
 * both numbers in one read.
 */
export function intervalReport(
  p1: MinkowskiPoint,
  p2: MinkowskiPoint,
  c: number = SPEED_OF_LIGHT,
): {
  s2: number;
  quadrant: LightConeQuadrant;
} {
  return {
    s2: intervalSquared(p1, p2, c),
    quadrant: classifyInterval(p1, p2, c),
  };
}

/**
 * Proper-time elapsed along a *timelike* straight worldline between two
 * events. The proper time is the invariant heartbeat read off any clock
 * carried along the straight line connecting them:
 *
 *   Δτ = √(s²) / c     (s² > 0 required)
 *
 * Throws on spacelike intervals — proper time is not a meaningful concept
 * outside the light cone, since no clock can connect spacelike-separated
 * events without exceeding c. A null interval (s² = 0) returns 0: a photon's
 * proper time along its own worldline is zero.
 */
export function properTimeStraightWorldline(
  p1: MinkowskiPoint,
  p2: MinkowskiPoint,
  c: number = SPEED_OF_LIGHT,
): number {
  const s2 = intervalSquared(p1, p2, c);
  if (s2 < 0) {
    throw new RangeError(
      `spacelike interval (s² = ${s2}); proper time undefined`,
    );
  }
  return Math.sqrt(s2) / c;
}
