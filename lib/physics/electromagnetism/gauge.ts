/**
 * Gauge freedom and the potentials.
 *
 * In electrodynamics the fields E and B are uniquely determined by
 *
 *   E = −∇V − ∂A/∂t,
 *   B = ∇ × A,
 *
 * but the potentials (V, A) are not uniquely determined by the fields. For
 * any smooth scalar function f(x, y, z, t) the shift
 *
 *   A → A' = A + ∇f,
 *   V → V' = V − ∂f/∂t
 *
 * leaves both E and B unchanged. This redundancy is called gauge freedom,
 * and a specific rule for pinning down (V, A) is a *gauge choice*. Two
 * popular choices are
 *
 *   Lorenz gauge:   ∇·A + (1/c²) ∂V/∂t = 0     (relativistically covariant)
 *   Coulomb gauge:  ∇·A = 0                    (V obeys Poisson instantly)
 *
 * This module supplies tiny pure-TS helpers for both: applying a gauge
 * transformation, checking that E stays put under it, and verifying the
 * Lorenz / Coulomb conditions numerically for a given (V, A) pair.
 */

import type { Vec3 } from "@/lib/physics/electromagnetism/lorentz";
import { SPEED_OF_LIGHT } from "@/lib/physics/constants";

/**
 * Apply a gauge transformation at a point.
 *
 *   A' = A + ∇f,    V' = V − ∂f/∂t
 *
 * Given the gradient of the gauge function and its time derivative at a
 * spacetime point, produce the shifted potentials (V', A').
 *
 * Inputs are dimensioned however the caller wants; the identity is purely
 * algebraic. SI units: A in V·s/m, V in volts, gradF in V (same as A), dFdt
 * in volts (same as V).
 */
export function gaugeTransform(
  A: Vec3,
  V: number,
  gradF: Vec3,
  dFdt: number,
): { A: Vec3; V: number } {
  return {
    A: { x: A.x + gradF.x, y: A.y + gradF.y, z: A.z + gradF.z },
    V: V - dFdt,
  };
}

/**
 * Electric field from potentials:  E = −∇V − ∂A/∂t.
 *
 * Tiny helper used by the invariance check below; exported because a couple
 * of scenes want to compute E both before and after a gauge shift.
 */
export function electricFromPotentials(gradV: Vec3, dAdt: Vec3): Vec3 {
  return {
    x: -gradV.x - dAdt.x,
    y: -gradV.y - dAdt.y,
    z: -gradV.z - dAdt.z,
  };
}

/**
 * Check that E = −∇V − ∂A/∂t is invariant under a gauge transformation.
 *
 * The inputs are the field's before and after "building blocks":
 *   before:  gradV,      dAdt
 *   after:   gradVAfter, dAdtAfter
 *
 * Returns true when the two E vectors agree componentwise within tolerance.
 *
 * Algebraically gauge invariance is automatic — a gauge shift by f adjusts
 *   gradV → gradV − ∂(∇f)/∂t,   dAdt → dAdt + ∂(∇f)/∂t
 * so the two correction terms cancel in E. This function is for numerical
 * sanity-checking inside the scenes and tests, where gradients are computed
 * by finite differences and floating-point drift is always possible.
 */
export function checkGaugeInvariance(
  gradV: Vec3,
  dAdt: Vec3,
  gradVAfter: Vec3,
  dAdtAfter: Vec3,
  tolerance = 1e-10,
): boolean {
  const E = electricFromPotentials(gradV, dAdt);
  const Eafter = electricFromPotentials(gradVAfter, dAdtAfter);
  return (
    Math.abs(E.x - Eafter.x) < tolerance &&
    Math.abs(E.y - Eafter.y) < tolerance &&
    Math.abs(E.z - Eafter.z) < tolerance
  );
}

/**
 * Evaluate the Lorenz-gauge residual,  ∇·A + (1/c²) ∂V/∂t.
 *
 * In the Lorenz gauge this must be identically zero. This function returns
 * the residual so that callers can verify a specific (V, A) pair, or plot
 * the residual as a function of time the way `LorenzVsCoulombGaugeScene`
 * does.
 *
 * @param divA — ∇·A at the point (1/s in SI).
 * @param dVdt — ∂V/∂t at the point (V/s).
 * @param c    — propagation speed (default = speed of light).
 */
export function lorenzGaugeResidual(
  divA: number,
  dVdt: number,
  c: number = SPEED_OF_LIGHT,
): number {
  return divA + dVdt / (c * c);
}

/**
 * True iff the given (∇·A, ∂V/∂t) satisfies the Lorenz condition within
 * tolerance. Thin wrapper around `lorenzGaugeResidual`.
 */
export function isLorenzGauge(
  divA: number,
  dVdt: number,
  tolerance = 1e-12,
  c: number = SPEED_OF_LIGHT,
): boolean {
  return Math.abs(lorenzGaugeResidual(divA, dVdt, c)) < tolerance;
}

/**
 * True iff ∇·A is zero within tolerance — the Coulomb gauge condition.
 *
 * The Coulomb gauge has ∇·A = 0 everywhere and all the time. It is the
 * simplest choice for statics and bound-state problems (it makes V obey
 * Poisson's equation instantly, just as in electrostatics), but it is *not*
 * Lorentz-invariant: observers in relative motion disagree on whether it
 * holds.
 */
export function isCoulombGauge(divA: number, tolerance = 1e-12): boolean {
  return Math.abs(divA) < tolerance;
}
