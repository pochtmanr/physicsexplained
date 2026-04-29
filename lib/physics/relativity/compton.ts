/**
 * Compton scattering — photon-electron elastic collision (RT §04 / FIG.19).
 *
 * The reasoning, in one breath: treat an X-ray photon as a particle with
 * energy `E = hf` and momentum `p = h/λ`, scatter it elastically off a free
 * electron at rest, and impose four-momentum conservation. Three unknowns
 * (outgoing photon wavelength, outgoing photon angle, electron recoil angle)
 * with three equations (energy, x-momentum, y-momentum) and one auxiliary
 * constraint (the electron's `E² − p²c² = m_e²c⁴` mass shell). The result
 * is the Compton shift formula
 *
 *     Δλ = (h / m_e c) (1 − cos θ),
 *
 * where θ is the scattering angle of the outgoing photon. The prefactor
 * `h / m_e c ≈ 2.4263 × 10⁻¹² m` is the **electron Compton wavelength**
 * λ_C — the universal length scale that drops out of the geometry.
 *
 * Three things to notice in the formula:
 *   1. Δλ is independent of the incoming wavelength λ. That is the signature
 *      that identified the effect: wave theory predicted the scattered
 *      wavelength to track the source, and the experimental data did not.
 *   2. Δλ is bounded above by 2λ_C (back-scatter, θ = π).
 *   3. Δλ ≥ 0 always — the scattered photon never arrives bluer than the
 *      incoming photon, because the electron recoils with positive kinetic
 *      energy.
 *
 * This module is pure numerics (no React) and imports `PLANCK_CONSTANT`,
 * `ELECTRON_MASS`, and `SPEED_OF_LIGHT` from `@/lib/physics/constants`. It
 * does **not** introduce a new value for any of those constants.
 */

import {
  ELECTRON_MASS,
  PLANCK_CONSTANT,
  SPEED_OF_LIGHT,
} from "@/lib/physics/constants";

/**
 * Electron Compton wavelength λ_C = h / (m_e c).
 *
 * CODATA-derived value: ≈ 2.4263 × 10⁻¹² m. This is the *length scale of
 * Compton scattering*, not the de Broglie wavelength of an electron. It
 * appears as the natural step size of the wavelength shift: at θ = π/2 the
 * shift is exactly λ_C; at θ = π it is exactly 2 λ_C.
 */
export const COMPTON_WAVELENGTH =
  PLANCK_CONSTANT / (ELECTRON_MASS * SPEED_OF_LIGHT);

/**
 * Compton shift Δλ for an outgoing photon scattered at angle θ (radians).
 *
 *     Δλ = λ_C (1 − cos θ)
 *
 * θ = 0 → forward-scatter, no shift. θ = π/2 → shift of one Compton
 * wavelength. θ = π → back-scatter, shift of two Compton wavelengths.
 *
 * Pure function. Accepts any real θ and returns a non-negative real
 * number — `1 − cos θ` is in [0, 2] for all θ.
 */
export function comptonShift(theta: number): number {
  return COMPTON_WAVELENGTH * (1 - Math.cos(theta));
}

/**
 * Outgoing wavelength λ' of a photon that arrived with wavelength λ_in
 * and scattered through angle θ off a free electron at rest.
 *
 *     λ' = λ_in + Δλ(θ) = λ_in + λ_C (1 − cos θ)
 *
 * Always ≥ λ_in (the electron recoil takes positive kinetic energy, so the
 * photon's energy — and thus its frequency — drops, and its wavelength
 * grows).
 */
export function scatteredWavelength(lambdaIn: number, theta: number): number {
  return lambdaIn + comptonShift(theta);
}
