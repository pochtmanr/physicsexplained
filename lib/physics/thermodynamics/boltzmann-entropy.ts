/**
 * Boltzmann's entropy formula, S = k_B ln Ω (FIG.12).
 *
 * The bridge between the microscopic count of arrangements (the multiplicity Ω
 * from `multiplicity.ts`) and the macroscopic, joule-per-kelvin entropy of
 * classical thermodynamics. Everything here is a thin, exactly-tested wrapper
 * around that one equation, plus the specific check the FIG.12 scene needs: the
 * statistical entropy of mixing must reproduce the FIG.10 thermodynamic result
 * ΔS = N k_B ln 2 per gas.
 *
 * Because Ω is astronomically large, the primary entry points take *ln Ω*
 * rather than Ω, so they never have to form the overflowing number itself.
 */

import { lnBinomial } from "./multiplicity";

/**
 * Boltzmann constant, J/K (exact, SI 2019 redefinition). Defined here rather
 * than imported from the shared constants module because that module is not
 * part of this session's editable surface.
 */
export const BOLTZMANN_K = 1.380649e-23;

/**
 * S = k_B ln Ω, taking ln Ω directly (the numerically safe form).
 * Returns entropy in J/K.
 */
export function entropyFromLogMultiplicity(lnOmega: number): number {
  return BOLTZMANN_K * lnOmega;
}

/**
 * S = k_B ln Ω, taking Ω itself. Convenient for the small-Ω illustrations in
 * the tombstone scene (a four-coin system, say); for large Ω prefer
 * {@link entropyFromLogMultiplicity}.
 */
export function entropyFromMultiplicity(omega: number): number {
  if (omega <= 0) throw new RangeError(`multiplicity must be > 0, got ${omega}`);
  return BOLTZMANN_K * Math.log(omega);
}

/**
 * Entropy in units of k_B (i.e. ln Ω) for a two-box macrostate "k of N
 * molecules on the left". This is the dimensionless number the scene prints
 * beside each chamber before multiplying by k_B.
 */
export function dimensionlessEntropyTwoBox(n: number, k: number): number {
  return lnBinomial(n, k);
}

/**
 * Statistical entropy of mixing two ideal gases, each of N molecules, when the
 * partition is removed so every molecule doubles its accessible volume.
 *
 * Microscopically: removing the partition multiplies each gas's spatial
 * multiplicity by 2ᴺ, so ΔS = k_B ln(2ᴺ · 2ᴺ) = 2 N k_B ln 2. This is exactly
 * the FIG.10 thermodynamic mixing entropy for equal amounts — the bridge the
 * FIG.12 scene confirms. Returns J/K.
 */
export function mixingEntropyEqualGases(nPerGas: number): number {
  return 2 * nPerGas * BOLTZMANN_K * Math.LN2;
}

/**
 * General mixing entropy from mole fractions: ΔS = −N k_B Σ xᵢ ln xᵢ, where N
 * is the total molecule count and xᵢ the fraction of species i. Reduces to
 * {@link mixingEntropyEqualGases} for two equal species. Returns J/K.
 */
export function mixingEntropyFromFractions(
  totalN: number,
  fractions: readonly number[],
): number {
  let s = 0;
  for (const x of fractions) {
    if (x > 0) s -= x * Math.log(x);
  }
  return totalN * BOLTZMANN_K * s;
}
