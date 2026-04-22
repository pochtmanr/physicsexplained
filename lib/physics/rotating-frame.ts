// lib/physics/rotating-frame.ts
/**
 * Rotating-reference-frame fictitious forces and Earth-frame convenience
 * values. All 2D vectors assume the rotation axis is +z.
 */

export const EARTH_OMEGA = (2 * Math.PI) / (23.9344696 * 3600); // rad/s, sidereal

export interface Omega2D {
  /** Signed scalar: magnitude of Ω, positive means counter-clockwise. */
  omegaZ: number;
}

export interface Vec2 {
  x: number;
  y: number;
}

/**
 * Coriolis acceleration in 2D: a_C = -2 Ω × v.
 * With Ω = omegaZ ẑ and v = (vx, vy, 0):
 *   -2 Ω × v = -2 omegaZ (-vy, vx, 0) = (2 omegaZ vy, -2 omegaZ vx, 0).
 */
export function coriolisAccel2D(omega: Omega2D, v: Vec2): Vec2 {
  return {
    x: 2 * omega.omegaZ * v.y,
    y: -2 * omega.omegaZ * v.x,
  };
}

/**
 * Centrifugal acceleration: a_cf = -Ω × (Ω × r) = Ω² r (outward).
 */
export function centrifugalAccel2D(omega: Omega2D, r: Vec2): Vec2 {
  const w2 = omega.omegaZ * omega.omegaZ;
  return { x: w2 * r.x, y: w2 * r.y };
}

/**
 * Period for a Foucault pendulum's plane of oscillation to complete one
 * full rotation, in hours. T = (2π) / (Ω_Earth · sin(latitude)).
 * Diverges at the equator (returns Infinity).
 */
export function foucaultRotationPeriodHours(latitudeDegrees: number): number {
  const sinLat = Math.sin((latitudeDegrees * Math.PI) / 180);
  if (sinLat === 0) return Infinity;
  const periodSeconds = (2 * Math.PI) / (EARTH_OMEGA * sinLat);
  return Math.abs(periodSeconds) / 3600;
}
