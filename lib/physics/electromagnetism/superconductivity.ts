/**
 * Superconductivity — the Meissner phase.
 *
 * Phenomenological formulas that capture the two-fluid / London picture.
 * No microscopic (BCS) physics here; the quantum story lives in the future
 * QUANTUM branch. Functions are scalar-in / scalar-out, SI units.
 */

/**
 * DC resistance of an idealised type-I superconductor.
 * Above T_c the material is a normal metal with some baseline R_0.
 * At or below T_c the resistance collapses to zero (Onnes, Leiden, 1911).
 *
 *   R(T) = R_0  for T > T_c
 *   R(T) = 0    for T ≤ T_c
 */
export function resistance(T: number, Tc: number, R0: number): number {
  return T > Tc ? R0 : 0;
}

/**
 * London penetration depth profile of the magnetic field inside a
 * type-I superconductor. The applied field B_0 at the surface decays
 * exponentially into the bulk on a scale λ_L (~100 nm for typical
 * metals), from which the Meissner "B = 0 inside" intuition emerges
 * a few λ_L in.
 *
 *   B(x) = B_0 · exp(−x / λ_L)
 *
 * x is the depth from the surface (x ≥ 0). λ_L must be positive.
 */
export function bPenetration(B0: number, depth: number, lambdaL: number): number {
  if (lambdaL <= 0) throw new Error("lambdaL must be positive");
  return B0 * Math.exp(-depth / lambdaL);
}

/**
 * Two-fluid-model temperature dependence of the London depth:
 *
 *   λ(T) = λ_0 / √(1 − (T / T_c)^4)
 *
 * λ(0) = λ_0; λ diverges as T → T_c, signalling the loss of the
 * superfluid fraction. Returns +Infinity for T ≥ T_c.
 */
export function londonDepthVsT(lambda0: number, T: number, Tc: number): number {
  if (lambda0 <= 0) throw new Error("lambda0 must be positive");
  if (Tc <= 0) throw new Error("Tc must be positive");
  if (T < 0) throw new Error("T must be non-negative (Kelvin)");
  if (T >= Tc) return Infinity;
  return lambda0 / Math.sqrt(1 - Math.pow(T / Tc, 4));
}

/**
 * Thermodynamic critical field of a type-I superconductor:
 *
 *   H_c(T) ≈ H_c0 · (1 − (T / T_c)^2)
 *
 * Above H_c(T) the Meissner phase is destroyed. Returns 0 at T = T_c
 * and H_c0 at T = 0.
 */
export function criticalField(Hc0: number, T: number, Tc: number): number {
  if (Hc0 < 0) throw new Error("Hc0 must be non-negative");
  if (Tc <= 0) throw new Error("Tc must be positive");
  if (T < 0) throw new Error("T must be non-negative (Kelvin)");
  if (T >= Tc) return 0;
  return Hc0 * (1 - Math.pow(T / Tc, 2));
}

/**
 * Magnetic susceptibility of the Meissner phase.
 *
 * Below T_c (and below H_c), a type-I superconductor is the perfect
 * diamagnet: every bit of flux is expelled, so the volume susceptibility
 * satisfies
 *
 *   χ_m = −1  (SI, dimensionless)
 *
 * giving M = −H exactly. Above T_c the material reverts to its normal-
 * state susceptibility χ_normal (which is tiny for typical metals).
 */
export function meissnerSusceptibility(
  T: number,
  Tc: number,
  chiNormal: number = 0,
): number {
  return T <= Tc ? -1 : chiNormal;
}
