/**
 * Total internal reflection (TIR) — §09.4.
 *
 * Light moving from a dense medium (index n₁) into a less-dense one (n₂ < n₁)
 * obeys Snell's law, n₁ sin θ_i = n₂ sin θ_t. As θ_i increases, so does θ_t,
 * and both run up against geometry: θ_t cannot exceed 90°. The incidence angle
 * at which θ_t would *just* equal 90° is the **critical angle**:
 *
 *   θ_c = arcsin(n₂ / n₁)         (defined only when n₁ > n₂)
 *
 * For θ_i ≥ θ_c the refracted ray cannot exist — Snell demands sin θ_t > 1.
 * The transmitted intensity is exactly zero and the full Fresnel reflection
 * coefficient has unit magnitude: every photon that hits the interface comes
 * back. That is **total internal reflection** — a loss-less mirror made not
 * from silver but from an angle.
 *
 * Beyond the critical angle the electromagnetic field does not vanish on the
 * low-index side; it decays *exponentially* into the second medium without
 * carrying any net energy across. The decay length is
 *
 *   d = λ₀ / (2π · √(n₁² sin²θ_i − n₂²))
 *
 * where λ₀ is the vacuum wavelength. As θ_i → θ_c⁺ the square root vanishes
 * and d → ∞ (the evanescent wave stretches far into medium 2); well past the
 * critical angle d shrinks to roughly λ/2π. This near-surface field is called
 * the **evanescent wave**, and it is why TIR prisms have to be cleaner than
 * mirror surfaces — anything touching the dense side within a wavelength
 * leaks light out of the boundary.
 *
 * If a second slab of high-index material is brought up to a gap d_gap from
 * the TIR surface, part of the evanescent field couples back into the second
 * slab and propagating light emerges on the other side — the optical analog
 * of quantum-mechanical tunnelling through a barrier. This is **frustrated
 * total internal reflection (FTIR)**. The transmission through the gap
 * decays as exp(−2·d_gap / d) — the evanescent decay distance sets the
 * tunnelling length. Beam-splitter cubes used in laser interferometry and
 * fingerprint-sensor platens both exploit it.
 *
 * Kernel contents:
 *   - criticalAngleRad   — θ_c (rad) or null if n₁ ≤ n₂.
 *   - isTIR              — true when θ_i ≥ θ_c.
 *   - evanescentDecayLength — d (same length units as λ).
 *   - frustratedTIRTransmittance — exp(−2·d_gap / d), clamped to [0, 1].
 */

/**
 * Critical angle for a ray going from medium n₁ into medium n₂.
 *
 * Returns null when n₁ ≤ n₂ — TIR is physically impossible in that case, and
 * we refuse to return a bogus value that the caller might accidentally trust.
 */
export function criticalAngleRad(n1: number, n2: number): number | null {
  if (!(n1 > n2)) return null;
  return Math.asin(n2 / n1);
}

/**
 * True iff an incidence angle θ_i (radians) produces total internal reflection
 * when going from n₁ into n₂.
 *
 * The check is θ_i ≥ θ_c — inclusive of the critical angle itself, where the
 * refracted ray grazes the interface and no energy crosses. If n₁ ≤ n₂ there
 * is no critical angle and the function returns false.
 */
export function isTIR(thetaI: number, n1: number, n2: number): boolean {
  const tc = criticalAngleRad(n1, n2);
  if (tc === null) return false;
  return thetaI >= tc;
}

/**
 * Evanescent-wave penetration depth d into medium 2.
 *
 *   d = λ₀ / (2π · √(n₁² sin²θ_i − n₂²))
 *
 * Inputs:
 *   thetaI    — incidence angle in radians (assumed ≥ θ_c; otherwise returns null).
 *   n1, n2    — refractive indices, n₁ > n₂.
 *   lambdaMm  — vacuum wavelength in mm (or any length unit — the result
 *               comes out in the same unit).
 *
 * Returns the distance over which the field amplitude falls by factor e in
 * medium 2, in the same length units as `lambdaMm`. Returns null when the
 * inputs are not in the TIR regime (so the formula's argument would be
 * non-positive and the decay length not physically defined).
 */
export function evanescentDecayLength(
  thetaI: number,
  n1: number,
  n2: number,
  lambdaMm: number,
): number | null {
  if (!(n1 > n2)) return null;
  const sinI = Math.sin(thetaI);
  const arg = n1 * n1 * sinI * sinI - n2 * n2;
  if (arg <= 0) return null;
  return lambdaMm / (2 * Math.PI * Math.sqrt(arg));
}

/**
 * Frustrated-TIR power transmittance through a narrow low-index gap of
 * thickness `gapMm`, for an incidence angle `thetaI` that would otherwise be
 * in TIR for the n₁/n₂ pair.
 *
 *   T(d_gap) ≈ exp(−2 · d_gap / d)
 *
 * where d is the evanescent decay length on the low-index side. The factor
 * of two accounts for intensity ∝ |field|², and the exponential is the
 * standard single-barrier tunnelling approximation (thick-barrier limit —
 * i.e. d_gap ≳ d/2, where a more careful treatment is not required for
 * pedagogical intuition).
 *
 * If the configuration is not in the TIR regime the gap is irrelevant — the
 * wave refracts through medium 2 normally — and the function returns 1. If
 * the gap is negative it is clamped to zero. The result is clamped to
 * [0, 1] so callers can feed it directly into an intensity multiplier.
 */
export function frustratedTIRTransmittance(
  gapMm: number,
  lambdaMm: number,
  thetaI: number,
  n1: number,
  n2: number,
): number {
  if (!isTIR(thetaI, n1, n2)) return 1;
  const d = evanescentDecayLength(thetaI, n1, n2, lambdaMm);
  if (d === null || d <= 0) return 0;
  const gap = Math.max(0, gapMm);
  const T = Math.exp((-2 * gap) / d);
  if (!Number.isFinite(T)) return 0;
  return Math.min(1, Math.max(0, T));
}
