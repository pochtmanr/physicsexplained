/**
 * §06.2 EINSTEIN'S ELEVATOR — pure-TS helpers.
 *
 * The "happiest thought" formalised. A freely-falling lab is locally
 * indistinguishable from an inertial frame in deep space; a rocket accelerating
 * at g in deep space is locally indistinguishable from a stationary lab on
 * Earth's surface. Both statements are local — over a finite region, real
 * gravity has tidal forces, and the equivalence breaks down.
 *
 * Conventions:
 *   • SI throughout. Accelerations in m/s², distances in meters, time in s.
 *   • g defaults to `g_SI` (standard surface gravity, 9.80665 m/s²).
 *   • Earth's radius defaults to 6.371 × 10⁶ m (mean volumetric radius).
 */

import { g_SI } from "@/lib/physics/constants";

/** Mean volumetric radius of Earth, in meters. Used as the default radial
 *  scale for the tidal-acceleration helper. */
export const EARTH_RADIUS_M = 6.371e6;

/**
 * Apparent gravitational acceleration in a lab whose own frame is
 * accelerating at `a_lab` (taken positive in the direction of g_field).
 *
 *   g_apparent = g_field − a_lab
 *
 * Special cases:
 *   • a_lab = g_field (free-falling elevator) → g_apparent = 0 — the lab is
 *     a local inertial frame; objects inside float.
 *   • a_lab = 0 (stationary lab on Earth) → g_apparent = g_field.
 *   • a_lab = −g_field (lab accelerating upward at g, e.g., a rocket in deep
 *     space with g_field = 0 mimics a stationary lab on Earth via the reverse
 *     equivalence — pass g_field = 0, a_lab = −g and the apparent g is +g).
 *
 * @example
 *   apparentGravityInFreelyFallingFrame(9.81, 9.81) === 0
 *   apparentGravityInFreelyFallingFrame(9.81, 0) === 9.81
 */
export function apparentGravityInFreelyFallingFrame(
  g_field: number,
  a_lab: number,
): number {
  return g_field - a_lab;
}

/**
 * Tidal acceleration (the residual relative acceleration between two test
 * masses separated by `deltaR` along the radial direction in a real
 * gravitational field). To leading order in deltaR/R:
 *
 *   Δa = −2 g Δr / R
 *
 * The minus sign reflects the convergence of radial free-fall trajectories:
 * two masses dropped at slightly different radii experience slightly
 * different g, and the lower one accelerates faster — the elevator-frame
 * separation decreases (tidal compression along the orbital plane;
 * stretching along the radial axis is the other half of the symmetric
 * traceless tide tensor). For Earth at the surface, dg/dr = −2g/R.
 *
 * @param deltaR Separation between the two test masses (m, radial).
 * @param R Distance to the central mass (m, default = Earth's radius).
 * @param g Local gravitational acceleration (m/s², default = g_SI).
 * @returns Differential acceleration in m/s² (sign-conventioned).
 *
 * @example
 *   tidalAccelerationOverSeparation(1) ≈ −3.08 × 10⁻⁶ m/s²  // 1 m at Earth surface
 *   tidalAccelerationOverSeparation(0) === 0  // no separation, no tide
 */
export function tidalAccelerationOverSeparation(
  deltaR: number,
  R: number = EARTH_RADIUS_M,
  g: number = g_SI,
): number {
  if (R <= 0) throw new RangeError(`tidal acceleration requires R > 0 (got ${R})`);
  return (-2 * g * deltaR) / R;
}

/**
 * Time for an elevator dropped from rest to fall a distance `h` under
 * uniform gravity. From the kinematic h = ½ g t²:
 *
 *   t = √(2h/g)
 *
 * @param h Drop distance (m, must be ≥ 0).
 * @param g Local gravitational acceleration (m/s², default = g_SI, must be > 0).
 *
 * @example
 *   elevatorFallTime(10) ≈ 1.428 s  // 10 m at Earth's surface
 *   elevatorFallTime(0) === 0
 */
export function elevatorFallTime(h: number, g: number = g_SI): number {
  if (h < 0) throw new RangeError(`elevatorFallTime requires h ≥ 0 (got ${h})`);
  if (g <= 0) throw new RangeError(`elevatorFallTime requires g > 0 (got ${g})`);
  return Math.sqrt((2 * h) / g);
}

/**
 * Velocity attained by an elevator after falling for time `t` under uniform
 * gravity (starting from rest). v = g t.
 *
 * @example
 *   elevatorFallVelocity(1) ≈ 9.807 m/s
 *   elevatorFallVelocity(0) === 0
 */
export function elevatorFallVelocity(t: number, g: number = g_SI): number {
  if (t < 0) throw new RangeError(`elevatorFallVelocity requires t ≥ 0 (got ${t})`);
  if (g <= 0) throw new RangeError(`elevatorFallVelocity requires g > 0 (got ${g})`);
  return g * t;
}
