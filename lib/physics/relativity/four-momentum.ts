/**
 * Four-momentum p^μ = (E/c, p_x, p_y, p_z) for the RT §04.1 topic.
 *
 *   • Builds a four-momentum from rest mass m and 3-velocity v (massive case).
 *   • Builds a photon four-momentum from energy E and a unit propagation
 *     direction n (massless case, |p| = E/c, the four-momentum is null).
 *   • Recovers total energy E from a four-momentum's time component (E = p^0 · c).
 *   • Re-exports `minkowskiNormSquared` from `./types` so collision/Compton
 *     consumers don't need a second import for the invariant
 *     m²c² = (E/c)² − |p|².
 *   • Boost helper that applies the +x Lorentz boost matrix from `./types`.
 *
 * Convention: mostly-minus metric (+,−,−,−), Griffiths convention. SI units
 * unless the optional `c` argument overrides (used in unit-test natural-units
 * checks).
 */

import { SPEED_OF_LIGHT } from "@/lib/physics/constants";
import { gamma, minkowskiNormSquared, boostX, applyMatrix } from "./types";
import type { FourMomentum } from "./types";

/** Build a four-momentum (E/c, p_x, p_y, p_z) for a particle of rest mass m
 *  moving at 3-velocity v. */
export function fourMomentum(
  m: number,
  v: { x: number; y: number; z: number },
  c = SPEED_OF_LIGHT,
): FourMomentum {
  const vMag = Math.sqrt(v.x * v.x + v.y * v.y + v.z * v.z);
  const beta = vMag / c;
  const g = gamma(beta);
  return [g * m * c, g * m * v.x, g * m * v.y, g * m * v.z] as const;
}

/** Build a photon four-momentum with energy E moving in unit direction n.
 *  Throws if n is not a unit vector — photons are null and the algebra
 *  silently breaks if |n| ≠ 1. */
export function photonFourMomentum(
  E: number,
  n: { x: number; y: number; z: number },
  c = SPEED_OF_LIGHT,
): FourMomentum {
  const nMag = Math.sqrt(n.x * n.x + n.y * n.y + n.z * n.z);
  if (Math.abs(nMag - 1) > 1e-9) {
    throw new RangeError(
      `photonFourMomentum: direction must be unit vector, got |n| = ${nMag}`,
    );
  }
  return [E / c, (E / c) * n.x, (E / c) * n.y, (E / c) * n.z] as const;
}

/** Total energy E from four-momentum components (E = p^0 · c). */
export function energyFromFourMomentum(
  p: FourMomentum,
  c = SPEED_OF_LIGHT,
): number {
  return p[0] * c;
}

/** Re-export so collision/Compton modules don't need a second import for the
 *  invariant m²c² = p^μ p_μ. Single source of truth lives in `./types`. */
export { minkowskiNormSquared };

/** Apply a Lorentz boost along +x by velocity βc to a four-momentum.
 *  The Minkowski norm is preserved (m²c² is the Lorentz invariant). */
export function boostFourMomentum(
  p: FourMomentum,
  beta: number,
): FourMomentum {
  return applyMatrix(boostX(beta), p);
}
