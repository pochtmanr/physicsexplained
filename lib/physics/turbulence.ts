/**
 * Turbulence — Kolmogorov 1941.
 *
 * The inertial-range energy spectrum of isotropic, homogeneous turbulence
 * follows a single universal power law:
 *
 *     E(k) = C_K · ε^(2/3) · k^(-5/3)
 *
 * where k is the wavenumber magnitude, ε is the mean dissipation rate, and
 * C_K ≈ 1.5 is the Kolmogorov constant (experimentally measured, not
 * derived). The law was obtained by dimensional analysis alone — given the
 * assumption that, in the inertial range, the only relevant scales are k
 * itself and ε, there is no other combination with units of energy density.
 *
 * This module supplies small helpers for plotting that spectrum on log-log
 * axes and for the two scales that bracket the inertial range: the
 * integral scale (where energy enters) and the Kolmogorov microscale
 * (where viscosity finally dissipates it).
 *
 * All functions are deterministic and side-effect-free. Units are SI when
 * SI inputs are provided; most callers work in dimensionless units for
 * visualisation.
 */

/** Kolmogorov constant in the inertial range. Empirical, ~1.5. */
export const KOLMOGOROV_CONSTANT = 1.5;

/**
 * Kolmogorov's −5/3 law: E(k) in the inertial range of fully developed,
 * isotropic, homogeneous turbulence.
 *
 * @param k  Wavenumber magnitude (1/length). Must be positive.
 * @param epsilon  Mean energy dissipation rate per unit mass (energy / time).
 * @param C_K  Kolmogorov constant. Defaults to 1.5.
 * @returns Energy spectral density at wavenumber k.
 */
export function kolmogorovSpectrum(
  k: number,
  epsilon: number,
  C_K: number = KOLMOGOROV_CONSTANT,
): number {
  if (!(k > 0)) {
    throw new Error("kolmogorovSpectrum: k must be strictly positive");
  }
  if (!(epsilon >= 0)) {
    throw new Error("kolmogorovSpectrum: epsilon must be non-negative");
  }
  return C_K * Math.cbrt(epsilon * epsilon) * Math.pow(k, -5 / 3);
}

/**
 * Kolmogorov microscale η — the length at which viscous dissipation
 * takes over from the inertial cascade.
 *
 *     η = (ν³ / ε)^(1/4)
 *
 * Below this scale, eddies lose their energy to heat rather than passing
 * it along. In the atmosphere η is about a millimetre. In a jet engine
 * combustor it is a few microns.
 */
export function kolmogorovMicroscale(nu: number, epsilon: number): number {
  if (!(nu > 0)) {
    throw new Error("kolmogorovMicroscale: nu must be positive");
  }
  if (!(epsilon > 0)) {
    throw new Error("kolmogorovMicroscale: epsilon must be positive");
  }
  return Math.pow((nu * nu * nu) / epsilon, 0.25);
}

/**
 * Ratio L/η of the integral scale to the Kolmogorov microscale, in
 * fully-developed turbulence. Scales as Re^(3/4), the number of decades
 * of inertial range available between energy injection and dissipation.
 */
export function scaleSeparation(reynoldsNumber: number): number {
  if (!(reynoldsNumber > 0)) {
    throw new Error("scaleSeparation: Re must be positive");
  }
  return Math.pow(reynoldsNumber, 0.75);
}

export interface SpectrumPoint {
  /** Wavenumber. */
  k: number;
  /** Energy spectral density at k. */
  E: number;
  /** log10(k). Convenient for plotting. */
  logK: number;
  /** log10(E). Convenient for plotting. */
  logE: number;
}

/**
 * Sample the Kolmogorov spectrum on a logarithmically-spaced grid of
 * wavenumbers between kMin and kMax. Useful for rendering the log-log
 * plot that gives the −5/3 law its characteristic straight line.
 */
export function sampleSpectrum(
  kMin: number,
  kMax: number,
  count: number,
  epsilon: number = 1,
  C_K: number = KOLMOGOROV_CONSTANT,
): SpectrumPoint[] {
  if (!(kMin > 0) || !(kMax > kMin)) {
    throw new Error("sampleSpectrum: require 0 < kMin < kMax");
  }
  if (!(count >= 2)) {
    throw new Error("sampleSpectrum: count must be at least 2");
  }
  const logKMin = Math.log10(kMin);
  const logKMax = Math.log10(kMax);
  const out: SpectrumPoint[] = [];
  for (let i = 0; i < count; i++) {
    const logK = logKMin + (i * (logKMax - logKMin)) / (count - 1);
    const k = Math.pow(10, logK);
    const E = kolmogorovSpectrum(k, epsilon, C_K);
    out.push({ k, E, logK, logE: Math.log10(E) });
  }
  return out;
}
