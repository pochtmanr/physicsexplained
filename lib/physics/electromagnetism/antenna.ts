/**
 * Antennas and radio — the engineering face of dipole radiation.
 *
 * An antenna is simply a conductor shaped so that a time-varying current
 * distribution couples efficiently to the radiation field. The classical
 * benchmark is the Hertzian (short) dipole — a centre-fed wire of length
 * L ≪ λ with a nearly-uniform current amplitude — whose radiation
 * resistance
 *
 *     R_rad = (2π/3) · μ₀ c · (L/λ)²
 *
 * tells you how many ohms of "usable" load the feed sees because of the
 * power leaving as EM waves. For a centre-fed half-wave dipole (L = λ/2)
 * the exact current distribution is sinusoidal, R_rad ≈ 73 Ω, and the
 * normalised far-field pattern is
 *
 *     F(θ) = | cos((π/2) cos θ) / sin θ |² ,
 *
 * peaking broadside (θ = π/2) at a directive gain of G ≈ 1.64 ≈ 2.15 dBi.
 * On the receive side the Friis relation reads
 *
 *     A_eff = G · λ² / (4π)       (effective aperture)
 *     FSPL  = 20 · log₁₀(4π d/λ)   (free-space path loss, dB)
 *
 * These four formulas underpin every radio link from Hertz's 1888 spark
 * experiment through Marconi's 1901 transatlantic demonstration to the
 * 2.4 GHz Wi-Fi radio in your pocket.
 *
 * References: Balanis, *Antenna Theory*, 3rd ed. (2005), Ch. 4; Kraus &
 * Marhefka, *Antennas for All Applications*, 3rd ed. (2002).
 */

import { MU_0, SPEED_OF_LIGHT } from "@/lib/physics/constants";

/**
 * Radiation resistance of a short (Hertzian) dipole, L ≪ λ.
 *
 *     R_rad = (2π/3) · μ₀ c · (L/λ)²
 *
 * For L/λ = 0.1 this gives ≈ 7.9 Ω; a fraction of an ohm for very short
 * whips, which is why short antennas are notoriously hard to feed — the
 * tiny R_rad sits in series with much larger ohmic losses and gets lost
 * as heat.
 */
export function radiationResistanceShort(
  lengthM: number,
  wavelengthM: number,
): number {
  if (!(lengthM > 0)) throw new Error("lengthM must be positive");
  if (!(wavelengthM > 0)) throw new Error("wavelengthM must be positive");
  const ratio = lengthM / wavelengthM;
  return ((2 * Math.PI) / 3) * MU_0 * SPEED_OF_LIGHT * ratio * ratio;
}

/**
 * Directive gain of a centre-fed half-wave dipole.
 *
 * G = 1.64 (dimensionless) ≈ 2.15 dBi. This is the canonical "antenna
 * reference number" — textbooks use it so often that manufacturers quote
 * commercial antennas in dBd ("decibels above a dipole") rather than
 * dBi. Returning the exact 1.64 keeps downstream tests simple.
 */
export function halfWaveDipoleGain(): number {
  return 1.64;
}

/**
 * Effective aperture of a receive antenna.
 *
 *     A_eff = G · λ² / (4π)
 *
 * Derived from reciprocity — any antenna that transmits with gain G also
 * receives with the same G, and the "collecting area" seen by a plane
 * wave scales as λ². For a half-wave dipole at 300 MHz (λ = 1 m):
 *   A_eff = 1.64 / (4π) ≈ 0.131 m²
 * — surprisingly large, a testament to the wave nature of the field
 * rather than geometric cross-section.
 */
export function effectiveAperture(
  gain: number,
  wavelengthM: number,
): number {
  if (!(gain >= 0)) throw new Error("gain must be non-negative");
  if (!(wavelengthM > 0)) throw new Error("wavelengthM must be positive");
  return (gain * wavelengthM * wavelengthM) / (4 * Math.PI);
}

/**
 * Free-space path loss (Friis).
 *
 *     FSPL(dB) = 20 · log₁₀(4π d / λ)
 *
 * The isotropic 1/r² intensity falloff, re-expressed in decibels. A
 * 1 km link at 900 MHz (λ = 1/3 m) gives about 82 dB — five orders of
 * magnitude of signal gone just to spherical spreading, before any
 * absorption or multipath. Doubling distance adds 6 dB; doubling
 * frequency (halving λ) also adds 6 dB. That is why long-haul radio
 * historically favoured long wavelengths.
 */
export function pathLossDb(distanceM: number, wavelengthM: number): number {
  if (!(distanceM > 0)) throw new Error("distanceM must be positive");
  if (!(wavelengthM > 0)) throw new Error("wavelengthM must be positive");
  return 20 * Math.log10((4 * Math.PI * distanceM) / wavelengthM);
}

/**
 * Normalised far-field radiation pattern of a centre-fed half-wave dipole.
 *
 *     F(θ) = | cos((π/2) · cos θ) / sin θ |²
 *
 * θ is measured from the dipole axis. F(π/2) = 1 (broadside peak),
 * F(0) = F(π) = 0 (nulls along the axis). Slightly more directive than
 * the Hertzian (short-dipole) sin²θ doughnut — the lobes are pinched a
 * touch, which is where the extra ~0.4 dB of gain over a short dipole
 * comes from. The limit at θ → 0, π is 0 (handled explicitly to avoid
 * 0/0).
 */
export function radiationPatternHalfWaveDipole(thetaRad: number): number {
  const s = Math.sin(thetaRad);
  if (Math.abs(s) < 1e-12) return 0;
  const num = Math.cos((Math.PI / 2) * Math.cos(thetaRad));
  const ratio = num / s;
  return ratio * ratio;
}
