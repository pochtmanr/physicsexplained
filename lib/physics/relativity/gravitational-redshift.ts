/**
 * §06.3 GRAVITATIONAL REDSHIFT — pure-TS helpers.
 *
 * A photon climbing out of a gravity well loses energy. By E = hν, that loss
 * appears as a frequency drop:
 *
 *     Δν / ν  =  −g h / c²
 *
 * for a tower of height h on Earth's surface (source at top, absorber at
 * bottom: photons fall INTO the well → blueshift at the bottom; equivalently
 * photons climbing OUT redshift at the top).
 *
 * The 1960 Pound-Rebka experiment at Harvard's 22.5-meter Jefferson Physical
 * Laboratory measured this shift to better than 10% — the first laboratory
 * test of general relativity. Pound-Snider 1965 refined the measurement to
 * 1% agreement with the prediction. Both results are derivable from the
 * equivalence principle alone, with no field equations required.
 *
 * Conventions:
 *   • SI throughout. h in meters, g in m/s² (default `g_SI`), c in m/s
 *     (default `SPEED_OF_LIGHT`). Δν/ν is a dimensionless fractional shift.
 *   • Sign: `gravitationalRedshiftFractional` returns the magnitude gh/c²
 *     (positive). The redshift direction is set by physical context — an
 *     absorber at the bottom of the tower sees a *blueshift* of the same
 *     magnitude; a source emitting upward sees its photons redshift on
 *     arrival at the top.
 */

import { SPEED_OF_LIGHT, g_SI } from "@/lib/physics/constants";

/** Gravitational redshift Δν/ν for a photon climbing through a gravitational potential
 *  difference ΔΦ. Sign convention: positive Δν/ν = blueshift (climbing INTO potential well);
 *  for a photon climbing OUT (e.g., the Pound-Rebka source-at-top, absorber-at-bottom), the
 *  reverse: an absorber-at-bottom sees a *blue*shift, source-at-top sees a *red*shift.
 *  Conventional Δν/ν = gh/c² for tower of height h (source at top, absorber at bottom). */
export function gravitationalRedshiftFractional(h: number, g = g_SI, c = SPEED_OF_LIGHT): number {
  return g * h / (c * c);
}

/** The Doppler velocity needed to compensate the redshift (move the absorber toward the source
 *  at this v to recover resonance): v ≈ c × (Δν/ν) = gh/c. */
export function compensatingDopplerVelocity(h: number, g = g_SI, c = SPEED_OF_LIGHT): number {
  return g * h / c;
}

/** The Pound-Rebka 1960 prediction: 22.5-meter tower at Harvard, g = 9.81. */
export const POUND_REBKA_PREDICTED = gravitationalRedshiftFractional(22.5);

/** The Pound-Rebka 1960 measured value: (2.57 ± 0.26) × 10⁻¹⁵; refined Pound-Snider 1965 to
 *  ratio measured/predicted = 0.9990 ± 0.0076. */
export const POUND_REBKA_MEASURED = 2.57e-15;
export const POUND_REBKA_MEASUREMENT_ERROR = 0.26e-15;
export const POUND_SNIDER_RATIO = 0.9990;
export const POUND_SNIDER_RATIO_ERROR = 0.0076;
