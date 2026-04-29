/**
 * Relativistic Doppler — frequency transformations under inertial motion.
 *
 * Two distinct effects, both consequences of the postulates §01.4 and the
 * time-dilation §02.1:
 *
 *   1. **Longitudinal Doppler** (line-of-sight motion):
 *        f_obs = f_emit · √((1 − β) / (1 + β))
 *      β > 0 means the source recedes from the observer along their common
 *      line of sight (redshift). β < 0 means it approaches (blueshift). At
 *      |β| ≪ 1 the formula collapses to the classical (1 − β) expression.
 *
 *   2. **Transverse Doppler** (perpendicular motion at the moment of
 *      emission/reception in the observer's frame):
 *        f_obs = f_emit / γ(β)
 *      Pure time dilation. There is no classical analogue: the line-of-sight
 *      velocity is zero, so a Galilean treatment predicts no shift at all.
 *      Special relativity predicts a redshift-by-γ that has been measured
 *      in atomic-beam experiments (Ives–Stilwell 1938, Mössbauer rotor
 *      experiments 1960s).
 *
 * No React. Pure numerics. Imports `gamma` from `@/lib/physics/relativity/types`.
 */

import { gamma } from "./types";

/**
 * Longitudinal Doppler factor for a source moving at β = v/c along the
 * line connecting it to the observer.
 *
 *   β > 0 → source recedes → observed frequency drops (redshift).
 *   β < 0 → source approaches → observed frequency rises (blueshift).
 *   β = 0 → identity.
 *
 * Throws if |β| ≥ 1 via the underlying domain check on √(1 − β²) — the
 * formula itself stays finite at β → 1 (it goes to 0), but β > 1 makes the
 * radicand negative.
 *
 * The classical (sub-relativistic) limit is f_obs ≈ f_emit · (1 − β),
 * recovered when |β| ≪ 1.
 */
export function longitudinalDoppler(fEmit: number, beta: number): number {
  return fEmit * Math.sqrt((1 - beta) / (1 + beta));
}

/**
 * Transverse Doppler factor: pure time-dilation, no classical analogue.
 *
 *   f_obs = f_emit / γ(β)
 *
 * Use this when the source is moving perpendicular to the observer's line
 * of sight at the moment the photon is emitted (in the observer's frame).
 * The observed frequency is **always** redshifted regardless of the sign
 * of β — γ(β) = γ(−β) — because the effect is the source's clock running
 * slow in the observer's frame.
 *
 * `gamma(beta)` throws for |β| ≥ 1, propagating that domain check here.
 */
export function transverseDoppler(fEmit: number, beta: number): number {
  return fEmit / gamma(beta);
}
