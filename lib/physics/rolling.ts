/**
 * Rolling-without-slipping dynamics for rigid bodies.
 *
 * A body rolling without slipping has v = ω R, so the total kinetic energy
 * is (½ + ½ k) m v² where k = I / (m R²) is the shape factor. Rolling down
 * a frictionless incline, the translational equation of motion becomes
 *   m a = m g sin θ − f
 * and the rotational equation of motion becomes
 *   I α = f R       with α = a / R
 * Eliminating f yields a = g sin θ / (1 + k), our core result.
 */

export const SHAPE_FACTOR = {
  solidSphere: 2 / 5,
  hollowSphere: 2 / 3,
  solidCylinder: 1 / 2,
  hollowCylinder: 1,
} as const;

export type ShapeName = keyof typeof SHAPE_FACTOR;

/** Total kinetic energy of a rolling body, given I explicitly. */
export function rollingKE(m: number, I: number, v: number, R: number): number {
  const omega = v / R;
  return 0.5 * m * v * v + 0.5 * I * omega * omega;
}

/**
 * Linear acceleration down an incline for a rolling body with shape factor
 * k = I / (m R²). a = g sin θ / (1 + k).
 */
export function inclineAcceleration(
  shapeFactor: number,
  thetaRadians: number,
  g: number = 9.81,
): number {
  return (g * Math.sin(thetaRadians)) / (1 + shapeFactor);
}

/**
 * Minimum coefficient of static friction required to roll without slipping
 * down an incline. Derived from f = m a k, with a from inclineAcceleration:
 *   μ_req = k tan(θ) / (1 + k).
 */
export function requiredStaticFriction(
  shapeFactor: number,
  thetaRadians: number,
): number {
  return (shapeFactor * Math.tan(thetaRadians)) / (1 + shapeFactor);
}
