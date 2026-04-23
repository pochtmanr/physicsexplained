/**
 * Optical dispersion — how the refractive index n(λ) depends on wavelength,
 * and the two classic consequences: a prism sorts white light into a spectrum,
 * and a raindrop paints an ordered arc in the sky.
 *
 * The microscopic picture (already sketched in §09.1 index-of-refraction):
 * bound electrons in a dielectric ring at their own natural frequencies, and
 * the mismatch between the optical drive and those resonances sets how much
 * the re-radiated light lags. Wavelengths closer to an absorption band lag
 * more, so n climbs as λ shortens. That monotonic trend, well away from
 * resonances, is **normal dispersion** (dn/dλ < 0). Inside an absorption band
 * the sign flips and the medium is **anomalously** dispersive — the refractive
 * index can even drop below 1. Cauchy (1836) fit the normal-dispersion region
 * with a short power series in 1/λ²:
 *
 *                n(λ) = A + B/λ² + C/λ⁴
 *
 * Good to four decimals across the visible for crowns and common flints,
 * with C dropped for most entries in a glass catalogue.
 *
 * Abbe's number V_d measures how strongly a glass disperses:
 *
 *                V_d = (n_d − 1) / (n_F − n_C)
 *
 * where the three Fraunhofer reference lines are
 *
 *                d = He       587.6 nm
 *                F = H_beta   486.1 nm
 *                C = H_alpha  656.3 nm
 *
 * Crown glasses (N-BK7) sit near V_d ≈ 64; dense flints (SF11) near V_d ≈ 25.
 * Lower V_d means the index changes faster across the visible — more chromatic
 * spread per degree of deflection.
 *
 * Rainbow geometry — Descartes (1637), cleaned up by Newton:
 *   A ray enters a spherical raindrop, refracts at the first surface, reflects
 *   k times off the back, refracts out. The total deviation
 *
 *                D_k(θ_i) = 2·(θ_i − θ_r) + k·(π − 2·θ_r),       sin θ_r = sin θ_i / n
 *
 *   has a minimum at the impact parameter where dD/dθ_i = 0, which gives
 *
 *                cos²θ_i = (n² − 1) / (k² + 2k)     (= (n²−1)/3 for k=1)
 *
 *   The observed rainbow angle (from the antisolar point) is
 *
 *                α_k = |π − D_k|          (k=1 → ≈ 42°,  k=2 → ≈ 51°)
 *
 *   Primary bow: one internal reflection; colour order red-outside → violet-inside.
 *   Secondary bow: two internal reflections; colour order REVERSED (red inside,
 *   violet outside), ~9° above the primary, dimmer because each reflection loses
 *   roughly 4 % of the intensity.
 */

/**
 * Cauchy's two- or three-term fit to n(λ) in the normal-dispersion region.
 *
 *     n(λ) = A + B/λ² + C/λ⁴        (λ in **micrometres**)
 *
 * The third coefficient `C` defaults to 0 — adequate for crown glasses and
 * most flints away from the UV cutoff. Pass a non-zero `C` for steep flints.
 *
 * Example — Schott N-BK7 crown at the sodium D line (589 nm):
 *   cauchyDispersion(0.589, 1.5046, 4.2e-3) ≈ 1.517 (handbook value 1.5168)
 */
export function cauchyDispersion(
  lambdaUm: number,
  A: number,
  B: number,
  C: number = 0,
): number {
  if (!Number.isFinite(lambdaUm) || lambdaUm <= 0) {
    throw new Error("cauchyDispersion: lambdaUm must be finite and > 0");
  }
  if (!Number.isFinite(A) || !Number.isFinite(B) || !Number.isFinite(C)) {
    throw new Error("cauchyDispersion: A, B, C must be finite");
  }
  const l2 = lambdaUm * lambdaUm;
  const l4 = l2 * l2;
  return A + B / l2 + C / l4;
}

/**
 * Abbe number V_d — a single dimensionless measure of how strongly a glass
 * disperses across the visible.
 *
 *     V_d = (n_d − 1) / (n_F − n_C)
 *
 *   n_d  refractive index at the helium d-line (587.6 nm)
 *   n_F  refractive index at the hydrogen F-line (486.1 nm)
 *   n_C  refractive index at the hydrogen C-line (656.3 nm)
 *
 * Higher V_d = weaker dispersion. Crown glasses sit around 60; flints around 25.
 * Achromatic doublets pair a crown (high V) and a flint (low V) to null
 * first-order chromatic aberration.
 */
export function abbeNumber(n_d: number, n_F: number, n_C: number): number {
  if (!Number.isFinite(n_d) || !Number.isFinite(n_F) || !Number.isFinite(n_C)) {
    throw new Error("abbeNumber: all three indices must be finite");
  }
  const spread = n_F - n_C;
  if (spread === 0) {
    throw new Error("abbeNumber: n_F − n_C is zero (no dispersion to measure)");
  }
  return (n_d - 1) / spread;
}

/**
 * Test whether a medium is in its **normal-dispersion** regime at `lambda`,
 * i.e. dn/dλ < 0.
 *
 * Uses a centred finite difference on the supplied n(λ) function, with the
 * caller's own units for λ. Step is λ/1000 — small enough for smooth Cauchy or
 * Sellmeier fits, large enough to avoid catastrophic cancellation in float64.
 *
 * Normal dispersion is what sends violet to the wide end of a prism spectrum
 * and red to the narrow end. Anomalous dispersion (dn/dλ > 0) occurs only
 * close to material resonances, where absorption is also large.
 */
export function isNormalDispersion(
  nFn: (lambda: number) => number,
  lambda: number,
): boolean {
  if (!Number.isFinite(lambda) || lambda <= 0) {
    throw new Error("isNormalDispersion: lambda must be finite and > 0");
  }
  const step = lambda / 1000;
  const slope = (nFn(lambda + step) - nFn(lambda - step)) / (2 * step);
  return slope < 0;
}

/**
 * Internal: Descartes's formula for the primary/secondary rainbow deviation,
 * evaluated at the Descartes angle (minimum of D(θ_i)).
 *
 * For k internal reflections,
 *   cos²θ_i_min = (n² − 1) / (k² + 2k)
 *   sin θ_r     = sin θ_i_min / n
 *   D_k         = 2(θ_i_min − θ_r) + k·(π − 2θ_r)
 *   α_k         = |π − D_k|           (angle from the antisolar point)
 *
 * Returns α_k in degrees. Internal helper — exposed via the two named
 * wrappers below so callers don't have to remember which k is which bow.
 */
function rainbowAngleDeg(n: number, k: number): number {
  if (!Number.isFinite(n) || n <= 1) {
    throw new Error(`rainbow angle: n must be finite and > 1 (got ${n})`);
  }
  const cos2 = (n * n - 1) / (k * k + 2 * k);
  if (cos2 < 0 || cos2 > 1) {
    throw new Error(
      `rainbow angle: invalid cos² = ${cos2} for n=${n}, k=${k}`,
    );
  }
  const cosI = Math.sqrt(cos2);
  const thetaI = Math.acos(cosI);
  const sinR = Math.sin(thetaI) / n;
  const thetaR = Math.asin(sinR);
  const D = 2 * (thetaI - thetaR) + k * (Math.PI - 2 * thetaR);
  const alpha = Math.abs(Math.PI - D);
  return (alpha * 180) / Math.PI;
}

/**
 * Primary rainbow angle — single internal reflection inside the drop.
 * For water at n = 1.333 this is ≈ 42.4° from the antisolar point.
 * Colour order: red on the **outside**, violet on the **inside**.
 */
export function rainbowPrimaryAngle(n_water: number): number {
  return rainbowAngleDeg(n_water, 1);
}

/**
 * Secondary rainbow angle — two internal reflections inside the drop.
 * For water at n = 1.333 this is ≈ 51° from the antisolar point.
 * Colour order is **reversed** relative to the primary — red on the inside,
 * violet on the outside — because the extra bounce flips the sorting. The
 * dark band between the two bows is Alexander's dark band.
 */
export function rainbowSecondaryAngle(n_water: number): number {
  return rainbowAngleDeg(n_water, 2);
}
