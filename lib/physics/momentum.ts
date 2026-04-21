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

/**
 * Tsiolkovsky rocket equation (1903).
 *
 * Δv = u · ln(m₀ / m_f)
 *
 *   u   — exhaust velocity (m/s), relative to the rocket
 *   m0  — initial mass (kg), rocket + all propellant
 *   mf  — final mass (kg), rocket + remaining propellant (mf ≤ m0)
 *
 * Returns the velocity increment Δv (m/s) acquired by expelling
 * the mass (m0 − mf) at exhaust velocity u. Assumes the only
 * momentum exchange is with the expelled propellant (no gravity
 * loss, no drag, no external forces).
 */
export function tsiolkovskyDeltaV(
  u: number,
  m0: number,
  mf: number,
): number {
  if (!(mf > 0) || !(m0 > 0)) {
    throw new Error(
      `tsiolkovskyDeltaV: masses must be positive (got m0=${m0}, mf=${mf})`,
    );
  }
  if (mf > m0) {
    throw new Error(
      `tsiolkovskyDeltaV: final mass (${mf}) cannot exceed initial (${m0})`,
    );
  }
  return u * Math.log(m0 / mf);
}

/**
 * Inverse form of the rocket equation — the mass ratio m₀/m_f required to
 * achieve a given Δv at a given exhaust velocity u.
 */
export function rocketMassRatio(deltaV: number, u: number): number {
  if (!(u > 0)) {
    throw new Error(`rocketMassRatio: exhaust velocity must be positive`);
  }
  return Math.exp(deltaV / u);
}
