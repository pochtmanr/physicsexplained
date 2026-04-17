/**
 * Angular momentum, torque, and rigid-body rotation helpers.
 *
 * Pure functions — the scene components only import and call these.
 */

/**
 * Angular momentum of a point mass at radius r moving at tangential speed v.
 * L = m · r · v.
 */
export function pointAngularMomentum(
  mass: number,
  radius: number,
  tangentialV: number,
): number {
  return mass * radius * tangentialV;
}

/**
 * Angular momentum of a rigid body rotating at angular velocity ω about an
 * axis whose moment of inertia is I.   L = I · ω.
 */
export function rigidAngularMomentum(I: number, omega: number): number {
  return I * omega;
}

/**
 * Kinetic energy of a rigid body rotating at ω, KE = ½·I·ω².
 */
export function rotationalKE(I: number, omega: number): number {
  return 0.5 * I * omega * omega;
}

/**
 * Skater "pull-in" scenario.
 *
 * A figure skater spins with arms outstretched, moment of inertia I₀, at
 * angular velocity ω₀. They draw their arms in, and the moment of inertia
 * drops to I(t) on some time profile. Because external torque is zero,
 * L = I(t)·ω(t) is conserved: ω(t) = L / I(t).
 */
export function skaterOmega(
  I: number,
  Linitial: number,
): number {
  if (I <= 1e-6) return 0;
  return Linitial / I;
}

/**
 * Linear interpolation for a smooth time-dependent moment of inertia.
 * Returns I(t) that eases from I0 at t=0 to I1 at t=duration.
 */
export function easeInOutI(
  t: number,
  I0: number,
  I1: number,
  duration: number,
): number {
  if (t <= 0) return I0;
  if (t >= duration) return I1;
  const s = t / duration;
  const eased = s * s * (3 - 2 * s); // smoothstep
  return I0 + (I1 - I0) * eased;
}

/**
 * Moment of inertia of common shapes about their symmetry axis.
 */
export const MOMENT_OF_INERTIA = {
  /** Solid disk radius r, mass m:  I = ½·m·r² */
  solidDisk: (m: number, r: number) => 0.5 * m * r * r,
  /** Hollow hoop radius r, mass m:  I = m·r² */
  hoop: (m: number, r: number) => m * r * r,
  /** Solid sphere radius r, mass m:  I = ⅖·m·r² */
  solidSphere: (m: number, r: number) => 0.4 * m * r * r,
  /** Hollow spherical shell radius r, mass m:  I = ⅔·m·r² */
  sphericalShell: (m: number, r: number) => (2 / 3) * m * r * r,
  /** Thin rod length L about its centre, mass m:  I = (1/12)·m·L² */
  rodCentre: (m: number, L: number) => (1 / 12) * m * L * L,
  /** Thin rod length L about one end, mass m:  I = (1/3)·m·L² */
  rodEnd: (m: number, L: number) => (1 / 3) * m * L * L,
} as const;

/**
 * Parallel-axis theorem: moment of inertia about an axis parallel to one
 * through the centre of mass, separated by distance d.
 *    I = I_cm + m·d²
 */
export function parallelAxis(
  Icm: number,
  mass: number,
  distance: number,
): number {
  return Icm + mass * distance * distance;
}

/**
 * Angular acceleration α = τ / I from torque and moment of inertia.
 */
export function angularAcceleration(torque: number, I: number): number {
  if (I <= 1e-6) return 0;
  return torque / I;
}
