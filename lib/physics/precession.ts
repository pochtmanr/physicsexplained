import { g_SI } from "./constants";

/**
 * Gyroscope and rigid-body precession helpers.
 *
 * Pure functions. The MDX scenes and tests import from here; nothing here
 * touches the DOM, time, or any global state.
 */

/**
 * Precession angular velocity of a symmetric gyroscope supported at one end
 * of a horizontal arm, under gravity.
 *
 *   Ω_p = m · g · r / (I · ω_spin)
 *
 * where m is the disk mass, r the distance from pivot to the disk's centre
 * of mass, I the disk's moment of inertia about its own spin axis, and
 * ω_spin the spin rate in rad/s. Returns rad/s.
 *
 * Throws if the spin rate is zero — the formula diverges, and the physical
 * interpretation is that the body simply falls rather than precessing.
 */
export function precessionOmega(
  mass: number,
  leverArm: number,
  momentOfInertia: number,
  spinOmega: number,
  g: number = g_SI,
): number {
  if (spinOmega === 0) {
    throw new Error("precessionOmega: spin rate must be non-zero");
  }
  if (momentOfInertia <= 0) {
    throw new Error("precessionOmega: moment of inertia must be positive");
  }
  return (mass * g * leverArm) / (momentOfInertia * spinOmega);
}

/**
 * Period of one precession cycle in seconds.
 *   T_p = 2π / Ω_p.
 */
export function precessionPeriod(
  mass: number,
  leverArm: number,
  momentOfInertia: number,
  spinOmega: number,
  g: number = g_SI,
): number {
  const Omega = precessionOmega(mass, leverArm, momentOfInertia, spinOmega, g);
  return (2 * Math.PI) / Math.abs(Omega);
}

/**
 * Approximate nutation angular velocity of a fast symmetric top:
 *   ω_nut ≈ ω_spin · I_axial / I_transverse.
 *
 * Valid in the gyroscopic limit (ω_spin large, nutation small). For the
 * full result, solve the Euler equations — this is the leading-order
 * approximation used in the scene captions and the MDX intuition.
 */
export function nutationOmega(
  spinOmega: number,
  IAxial: number,
  ITransverse: number,
): number {
  if (ITransverse <= 0) {
    throw new Error("nutationOmega: transverse inertia must be positive");
  }
  return spinOmega * (IAxial / ITransverse);
}

/**
 * Magnitude of the spin angular momentum of a rigid body:
 *   |L| = I · ω_spin.
 */
export function spinAngularMomentum(
  momentOfInertia: number,
  spinOmega: number,
): number {
  return momentOfInertia * spinOmega;
}

/**
 * Gravitational torque on a horizontal arm of length r carrying a mass m,
 * pivoted at the base.
 *   |τ| = m · g · r.
 */
export function gravityTorque(
  mass: number,
  leverArm: number,
  g: number = g_SI,
): number {
  return mass * g * leverArm;
}

/**
 * Sagnac-effect readout of a ring laser gyroscope. For a planar ring of
 * enclosed area A, rotating at angular rate Ω about its normal, the two
 * counter-propagating beams pick up a round-trip path-length difference of
 *    ΔL = 4·A·Ω / c.
 * In frequency form, Δf / f = ΔL / L_ring. Returns the path difference in
 * metres; pass Ω in rad/s and A in m².
 */
export function sagnacPathDifference(
  enclosedArea: number,
  angularRate: number,
  c = 299_792_458,
): number {
  return (4 * enclosedArea * angularRate) / c;
}
