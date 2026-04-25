import { ALPHA_FINE, ELECTRON_MASS, SPEED_OF_LIGHT } from "@/lib/physics/constants";

/**
 * Coherent state |α⟩ photon-number statistics. Coherent states are eigenstates
 * of the annihilation operator â|α⟩ = α|α⟩ and have a Poisson distribution
 * over photon number with mean ⟨N⟩ = |α|² and variance σ² = |α|².
 * The relative fluctuation σ/⟨N⟩ = 1/|α| → 0 as |α| → ∞, which is
 * the operational meaning of "the classical limit": large amplitude
 * suppresses quantum noise.
 */
export function coherentStatePhotonStats(alpha: number): {
  meanN: number;
  varianceN: number;
  relativeFluctuation: number;
} {
  const a2 = alpha * alpha;
  const meanN = a2;
  const varianceN = a2;
  const relativeFluctuation = a2 > 0 ? 1 / Math.abs(alpha) : Infinity;
  return { meanN, varianceN, relativeFluctuation };
}

/**
 * One-loop QED running coupling at low energies (well below electroweak scale).
 *   α(E) ≈ α(0) / (1 − (α(0)/3π) ln(E²/(m_e c²)²))
 * Returns the running fine-structure constant at energy E (joules).
 *
 * At E = m_e c² returns α(0) ≈ 1/137. At E ≈ M_Z (LEP scale) returns α ≈ 1/128.
 * At asymptotically large E the perturbative formula breaks down — the Landau
 * pole sits at unphysical energies for QED proper.
 */
export function runningCouplingAlpha(energy: number): number {
  const me = ELECTRON_MASS;
  const c = SPEED_OF_LIGHT;
  const meRest = me * c * c;
  const ratio = (energy * energy) / (meRest * meRest);
  if (ratio <= 1) return ALPHA_FINE;
  const denom = 1 - (ALPHA_FINE / (3 * Math.PI)) * Math.log(ratio);
  if (denom <= 0) return Infinity;
  return ALPHA_FINE / denom;
}

/**
 * Anomalous magnetic moment of the electron at leading order: g − 2 = α/π.
 * Schwinger 1948. Numerically α/π ≈ 0.00232 / 2 ≈ 0.00116. The full QED
 * prediction goes to fifth-loop order and matches experiment to better
 * than 1 part in 10^{12} — the most precisely-tested prediction in physics.
 */
export function anomalousMagneticMomentLeadingOrder(): number {
  return ALPHA_FINE / (2 * Math.PI);
}
