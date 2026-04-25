/**
 * §11.2 — Lorentz transformation of E and B, and the two scalar invariants.
 *
 * Closed-form transform of the EM field under a Lorentz boost is provided by
 * `transformFields` in ./relativity. This module adds the two Lorentz scalars
 * every observer agrees on:
 *
 *   I₁ = E · B           (pseudoscalar)
 *   I₂ = |E|² − c²|B|²   (scalar)
 *
 * If I₁ = 0 in any one frame it is zero in every frame; if I₂ > 0 there exists
 * a frame in which B = 0 (the field is "electric-like"); if I₂ < 0 there
 * exists a frame in which E = 0 (the field is "magnetic-like").
 *
 * Conventions:
 *   • SI units throughout: E in V/m, B in T, c in m/s.
 *   • Boost given as β = v/c (dimensionless), along +x in the lab frame.
 *   • All field-tensor work is delegated to ./relativity to keep one source of
 *     truth for the closed-form transform.
 */

import { SPEED_OF_LIGHT } from "@/lib/physics/constants";
import {
  type Vec4,
  type FieldTensor,
  gamma,
  transformFields,
  buildFieldTensor,
} from "@/lib/physics/electromagnetism/relativity";
import type { Vec3 } from "@/lib/physics/electromagnetism/lorentz";

// Re-export for convenient downstream import in scenes / tests.
export type { Vec4, FieldTensor, Vec3 };
export { gamma, transformFields, buildFieldTensor };

/** First Lorentz invariant I₁ = E · B (a pseudoscalar). */
export function lorentzInvariantEDotB(E: Vec3, B: Vec3): number {
  return E.x * B.x + E.y * B.y + E.z * B.z;
}

/** Second Lorentz invariant I₂ = |E|² − c²|B|² (a true scalar). */
export function lorentzInvariantE2MinusC2B2(E: Vec3, B: Vec3): number {
  const c = SPEED_OF_LIGHT;
  const E2 = E.x * E.x + E.y * E.y + E.z * E.z;
  const B2 = B.x * B.x + B.y * B.y + B.z * B.z;
  return E2 - c * c * B2;
}

/**
 * Numerical sanity check: evaluate both invariants in the lab frame, then
 * boost the fields along +x by β and evaluate them again in the boosted
 * frame. Each pair (lab, boost) should match to floating-point precision.
 *
 * This is the function the test suite calls to verify invariance under
 * `transformFields` — it returns the four numbers rather than `true`/`false`
 * so callers can pick their own tolerance for SI-magnitude inputs.
 */
export function transformInvariantsCheck(
  E: Vec3,
  B: Vec3,
  beta: number,
): {
  invariant1Lab: number;
  invariant1Boost: number;
  invariant2Lab: number;
  invariant2Boost: number;
} {
  const { E: Ep, B: Bp } = transformFields(E, B, beta);
  return {
    invariant1Lab: lorentzInvariantEDotB(E, B),
    invariant1Boost: lorentzInvariantEDotB(Ep, Bp),
    invariant2Lab: lorentzInvariantE2MinusC2B2(E, B),
    invariant2Boost: lorentzInvariantE2MinusC2B2(Ep, Bp),
  };
}

/**
 * Three-way classification of an EM field configuration based on its two
 * Lorentz invariants. Useful for the §11.2 callout and downstream tooling.
 *
 *   "mixed"            — E·B ≠ 0; no frame strips either field alone.
 *   "electric-like"    — E·B = 0 and |E|² > c²|B|²; frame exists where B = 0.
 *   "magnetic-like"    — E·B = 0 and |E|² < c²|B|²; frame exists where E = 0.
 *   "null"             — E·B = 0 and |E|² = c²|B|² (electromagnetic wave).
 */
export type EMFieldClass =
  | "mixed"
  | "electric-like"
  | "magnetic-like"
  | "null";

export function classifyEMField(
  E: Vec3,
  B: Vec3,
  tolerance = 1e-12,
): EMFieldClass {
  const i1 = lorentzInvariantEDotB(E, B);
  const i2 = lorentzInvariantE2MinusC2B2(E, B);
  // Compare on a dimensionful tolerance scaled by the field magnitudes —
  // for SI-magnitude inputs (V/m, T) an absolute 1e-12 is essentially zero.
  if (Math.abs(i1) > tolerance) return "mixed";
  if (Math.abs(i2) <= tolerance) return "null";
  return i2 > 0 ? "electric-like" : "magnetic-like";
}
