/**
 * Einstein's two postulates (1905), encoded structurally.
 *
 * Postulate 1 — the principle of relativity: the laws of physics take the same
 * form in every inertial frame. (No preferred frame.)
 *
 * Postulate 2 — the constancy of c: light propagates with the same speed c in
 * every inertial frame, independent of the motion of source or observer.
 *
 * The two postulates are logically incompatible with Galilean velocity
 * addition. This file packages that incompatibility as functions so a scene
 * can graph the two predictions side-by-side. The whole RT branch then unrolls
 * from this single inconsistency: time will dilate, length will contract,
 * simultaneity will become observer-dependent, velocities will compose by a
 * non-Galilean rule. Lorentz had the algebra in 1904; Einstein took the two
 * postulates SERIOUSLY and let everything else fall out.
 */

import { SPEED_OF_LIGHT } from "@/lib/physics/constants";

/**
 * Galilean velocity-addition rule applied to light: an observer moving at
 * speed v (in the same direction as the light) would, by Galilean kinematics,
 * measure the light to travel at c − v. This is what classical mechanics
 * predicts. It is what Michelson and Morley failed to detect in 1887.
 *
 * Returns c − v. Does NOT enforce |v| ≤ c — Galilean kinematics has no such
 * speed limit, and the function returns 0 (or negative) cleanly so the scene
 * can show the line crashing through zero.
 */
export function galileanCAdd(c: number, v: number): number {
  return c - v;
}

/**
 * Einstein's postulate 2, as a function: an observer moving at speed v
 * measures light to travel at c, regardless of v. The function literally
 * IGNORES v, which is the entire content of the postulate.
 *
 * Returns c. Throws if |v| ≥ c — by postulate, no inertial observer can move
 * at the speed of light, so this case is unphysical.
 */
export function einsteinCAdd(c: number, v: number): number {
  if (Math.abs(v) >= c) {
    throw new RangeError(
      `Einstein postulate: no inertial observer can have |v| >= c (got v=${v}, c=${c})`,
    );
  }
  return c;
}

/**
 * One sample of the comparison: at observer speed v (here parameterized by
 * β = v/c, dimensionless), what does each rule predict for the measured speed
 * of light in that observer's frame?
 */
export interface PostulateComparisonSample {
  /** Dimensionless boost β = v / c. */
  beta: number;
  /** Galilean prediction (c − βc), in the same units as the input c. */
  galilean: number;
  /** Einstein prediction (constant c). */
  einstein: number;
}

/**
 * Build a comparison curve over the supplied β values. Useful for the
 * `PostulateComparisonScene` graph: x-axis is β, dashed amber line is the
 * Galilean prediction (drops to 0 at β = 1), solid cyan line is Einstein's
 * postulate (stays flat at c).
 *
 * If `c` is omitted, uses the SI speed of light.
 *
 * Galilean is computed for ALL β (including |β| ≥ 1, where the prediction is
 * a negative or zero "speed"); Einstein is only defined for |β| < 1.
 */
export function compareAtVariousV(
  c: number = SPEED_OF_LIGHT,
  betas: readonly number[],
): PostulateComparisonSample[] {
  return betas.map((beta) => {
    const v = beta * c;
    const galilean = galileanCAdd(c, v);
    // Use NaN at the unphysical |β| ≥ 1 boundary so plotting code can skip it.
    const einstein = Math.abs(beta) >= 1 ? Number.NaN : einsteinCAdd(c, v);
    return { beta, galilean, einstein };
  });
}

/**
 * Are the two postulate-systems (Galilean + invariant Maxwell c) mutually
 * consistent at this β? They agree only at β = 0 (lab observer at rest).
 * For any β ≠ 0 they disagree — and the disagreement IS the cliff every
 * subsequent §02 topic falls down.
 */
export function postulatesAgreeAt(beta: number, tol: number = 1e-12): boolean {
  if (Math.abs(beta) >= 1) return false;
  const c = 1; // dimensionless comparison
  return Math.abs(galileanCAdd(c, beta * c) - einsteinCAdd(c, beta * c)) < tol;
}
