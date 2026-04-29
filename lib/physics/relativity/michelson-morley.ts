/**
 * Michelson-Morley 1887 — predicted vs observed fringe shift.
 *
 * The classical-aether prediction for the fringe shift on rotating the
 * apparatus by 90° (the original Michelson/Morley protocol) is:
 *
 *     Δn = (2 L / λ) · (v² / c²)
 *
 * where
 *   • L is the round-trip arm length of the interferometer (m),
 *   • λ is the source wavelength (m),
 *   • v is the speed of the apparatus relative to the rest-frame of
 *     the hypothesized luminiferous aether (m/s),
 *   • c is the speed of light in vacuum (m/s).
 *
 * For the original Cleveland 1887 apparatus (L ≈ 11 m via the eight-fold
 * mirror folding, λ = 5890 Å sodium D-line, v ≈ 30 km/s Earth-orbital),
 * the prediction is Δn ≈ 0.4 fringes. The observed shift was below the
 * 0.01-fringe noise floor — a null result that, eighteen years later,
 * Einstein elevated to a postulate.
 *
 * Pure-TS module (no React). Consumed by the three §01.3 scenes and the
 * page tests under tests/physics/relativity/michelson-morley.test.ts.
 */

import { SPEED_OF_LIGHT } from "@/lib/physics/constants";

/**
 * Classical-aether prediction for the peak fringe shift on 90° rotation.
 *
 *     Δn(L, λ, v, c) = (2 L / λ) · (v² / c²)
 *
 * @param L      Round-trip arm length of the interferometer (m). For the
 *               1887 apparatus, the multi-mirror fold gives L ≈ 11 m.
 * @param lambda Source wavelength (m). Sodium D-line λ ≈ 5.89e-7 m.
 * @param v      Speed of the apparatus through the aether (m/s).
 * @param c      Speed of light in vacuum (m/s). Defaults to the SI value.
 */
export function predictedFringeShift(
  L: number,
  lambda: number,
  v: number,
  c: number = SPEED_OF_LIGHT,
): number {
  if (L <= 0) {
    throw new RangeError(`predictedFringeShift: L must be positive (got ${L})`);
  }
  if (lambda <= 0) {
    throw new RangeError(
      `predictedFringeShift: lambda must be positive (got ${lambda})`,
    );
  }
  if (c <= 0) {
    throw new RangeError(`predictedFringeShift: c must be positive (got ${c})`);
  }
  return (2 * L) / lambda * (v * v) / (c * c);
}

/**
 * Angle-resolved aether prediction. As the apparatus rotates by angle θ
 * (radians), the fringe shift relative to the θ = 0 reference traces a
 * 2θ cosine — the two arms exchange roles every 90°, so the period is π.
 *
 *     Δn(θ) = (2 L / λ) · (v² / c²) · cos(2θ)
 *
 * This is the form the FringePredictionVsDataScene plots as the dashed
 * amber curve.
 */
export function predictedFringeShiftAtAngle(
  L: number,
  lambda: number,
  v: number,
  theta: number,
  c: number = SPEED_OF_LIGHT,
): number {
  return predictedFringeShift(L, lambda, v, c) * Math.cos(2 * theta);
}

/**
 * The 1887 noise floor. Michelson and Morley quoted an experimental
 * sensitivity of about 1/100 of a fringe (the eye could not reliably
 * resolve smaller shifts on the photographic plates). Modern repeats
 * with laser-stabilized cavities push this below 1e-17.
 *
 * `expectedNullThreshold` returns the historical 1887 value (default)
 * or any other quoted bound the caller cares to override.
 */
export function expectedNullThreshold(historicalFringes: number = 0.01): number {
  if (historicalFringes < 0) {
    throw new RangeError(
      `expectedNullThreshold: threshold must be non-negative (got ${historicalFringes})`,
    );
  }
  return historicalFringes;
}

/**
 * Test whether the predicted aether-wind fringe shift exceeds the
 * experimental noise floor. The 1887 result said: prediction ≈ 0.4,
 * observed ≈ 0.00, threshold ≈ 0.01 — therefore the prediction was
 * 40× the noise floor and the observation was below it. The aether
 * died on a comparison this simple.
 */
export function isPredictionAboveNoise(
  predicted: number,
  threshold: number = expectedNullThreshold(),
): boolean {
  return Math.abs(predicted) > threshold;
}

/** Earth's orbital speed around the Sun (m/s). The 1887 v-estimate. */
export const EARTH_ORBITAL_SPEED = 2.978e4;

/** Sodium D-line wavelength (m). The 1887 source colour. */
export const SODIUM_D_WAVELENGTH = 5.89e-7;

/** Effective round-trip arm length of the 1887 apparatus (m).
 *  Mirrors fold the optical path eight times across an 11 m granite slab. */
export const MICHELSON_1887_ARM_LENGTH = 11;
