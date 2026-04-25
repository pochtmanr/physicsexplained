/**
 * Geometry helpers for §11.2 e-and-b-under-lorentz and §11.4 magnetism-as-
 * relativistic-electrostatics. Closed-form length/density transforms used by
 * the two-panel boost-visualisation scenes.
 */

import { gamma } from "@/lib/physics/electromagnetism/relativity";

/** Rest-frame length L_0 contracted by an observer moving at βc:  L = L_0 / γ. */
export function lengthContract(restLength: number, beta: number): number {
  return restLength / gamma(beta);
}

/** Charge density of a line of charges that moves at sign·βc in the observer's frame.
 *  ρ' = γ ρ_rest for a continuous line with rest-frame charge per length n0·q. */
export function boostLineDensity(
  restDensity: number,
  beta: number,
  sign: 1 | -1,
): number {
  // sign distinguishes lattice (+1) vs electron (−1) flow direction in the §11.4 setup.
  // Magnitude is symmetric under the two-frame transformation; sign threads through
  // the eventual force direction at the call site, not the density magnitude here.
  void sign;
  return gamma(beta) * restDensity;
}

/** Net + charge density of two-wire setup boosted from lab frame to electron rest frame.
 *
 *  In the lab frame: lattice (+) and drifting electrons (−) cancel — ρ_lab = 0.
 *  In the electron rest frame: electrons sit still, the lattice drifts at −β.
 *  Length contraction makes the lattice line density γ·n0 and the (now-moving)
 *  electron line density n0/γ. Net charge density per unit length is n0·(γ − 1/γ).
 *
 *  Returns this asymmetry; multiply by elementary charge for SI Coulombs/metre. */
export function netChargeDensityTwoWire(beta: number, n0: number): number {
  const g = gamma(beta);
  return n0 * (g - 1 / g);
}
