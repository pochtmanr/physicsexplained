/**
 * §02.1 TIME DILATION — pure-TS helpers.
 *
 * Conventions:
 *   • β = v/c, dimensionless. γ = 1/√(1 − β²).
 *   • Times are in seconds. `c` is supplied explicitly so callers can pass
 *     `SPEED_OF_LIGHT` from `@/lib/physics/constants` or a unit-scaled value
 *     (e.g. 0.3 m/ns) when convenient.
 */

import { gamma } from "./types";

/**
 * Lab-frame elapsed time for a clock that ticks `t0` in its own rest frame
 * while moving at speed βc.
 *
 *   Δt_lab = γ(β) · t0
 */
export function dilatedTime(t0: number, beta: number): number {
  return gamma(beta) * t0;
}

/**
 * Proper-time elapsed for a clock moving at speed βc, given a lab-frame
 * elapsed time `dtLab`.
 *
 *   τ = Δt_lab / γ(β)
 */
export function properTime(dtLab: number, beta: number): number {
  return dtLab / gamma(beta);
}

/**
 * Survival fraction of unstable particles (e.g. atmospheric muons) traversing
 * a lab-frame distance `L` at speed βc, given a rest-frame half-life
 * `halfLifeRest` and the speed of light `c`.
 *
 * Lab-frame travel time:    t_lab    = L / (β·c)
 * Proper-time elapsed:      t_proper = t_lab / γ(β)
 * Surviving fraction:       N/N₀     = 2^(−t_proper / τ)
 *
 * Returns a number in [0, 1].
 *
 * @example
 *   // Atmospheric muons: L = 10 km, β = 0.995, τ = 2.2 μs.
 *   muonSurvivalFraction(10_000, 0.995, 2.2e-6, 2.99792458e8) ≈ 0.49
 *   //  Classical (no dilation): 2^(−L/(β·c·τ)) ≈ 0.07  → ~7× excess.
 */
export function muonSurvivalFraction(
  L: number,
  beta: number,
  halfLifeRest: number,
  c: number,
): number {
  const tLab = L / (beta * c);
  const tProper = tLab / gamma(beta);
  return Math.pow(2, -tProper / halfLifeRest);
}

/**
 * Classical (no-dilation) survival prediction — the wrong answer that lab
 * detectors disagree with by a factor of ~7. Useful for the comparison
 * scenes; keeps the "predicted-vs-observed" arithmetic colocated with the
 * relativistic version.
 */
export function classicalSurvivalFraction(
  L: number,
  beta: number,
  halfLifeRest: number,
  c: number,
): number {
  const tLab = L / (beta * c);
  return Math.pow(2, -tLab / halfLifeRest);
}
