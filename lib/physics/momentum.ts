/**
 * Momentum and collisions — pure helpers for the FIG.06 scenes.
 *
 * All velocities are 1-D scalars; positive is to the right.
 */

/**
 * Final velocities in a 1-D elastic collision between two point masses.
 */
export function elasticCollision(
  mA: number,
  vA: number,
  mB: number,
  vB: number,
): { vA: number; vB: number } {
  const total = mA + mB;
  return {
    vA: ((mA - mB) / total) * vA + ((2 * mB) / total) * vB,
    vB: ((2 * mA) / total) * vA + ((mB - mA) / total) * vB,
  };
}

/**
 * Final common velocity in a 1-D perfectly inelastic collision
 * (the two bodies stick together).
 */
export function inelasticCollision(
  mA: number,
  vA: number,
  mB: number,
  vB: number,
): number {
  return (mA * vA + mB * vB) / (mA + mB);
}

/**
 * Partially inelastic collision using coefficient of restitution e ∈ [0,1].
 * e = 1 recovers the elastic case; e = 0 the perfectly inelastic one.
 * Derived from momentum conservation + relative velocity reversal.
 */
export function restitutionCollision(
  mA: number,
  vA: number,
  mB: number,
  vB: number,
  e: number,
): { vA: number; vB: number } {
  const total = mA + mB;
  const vCM = (mA * vA + mB * vB) / total;
  return {
    vA: vCM - (e * mB * (vA - vB)) / total,
    vB: vCM + (e * mA * (vA - vB)) / total,
  };
}

/**
 * Kinetic energy of a pair of 1-D point masses.
 */
export function pairKE(
  mA: number,
  vA: number,
  mB: number,
  vB: number,
): number {
  return 0.5 * (mA * vA * vA + mB * vB * vB);
}

/**
 * Total momentum.
 */
export function pairP(
  mA: number,
  vA: number,
  mB: number,
  vB: number,
): number {
  return mA * vA + mB * vB;
}
