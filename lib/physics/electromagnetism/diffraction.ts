/**
 * Diffraction and the double slit — §09.8.
 *
 * The canonical experimental bridge from classical wave optics to quantum
 * mechanics. Thomas Young lined up two narrow slits in front of a candle
 * in 1801 and let the light paint its own pattern onto a wall on the far
 * side. What he saw was not two bright lines — it was a periodic ladder
 * of fringes. Light interferes with itself. Light is a wave.
 *
 * The physical picture is Huygens-Fresnel: every point on a wavefront is
 * the source of a secondary spherical wavelet, and the field at any
 * downstream point is the coherent (phase-preserving) sum of every
 * wavelet. A slit of width `a` carves out a ribbon of such secondary
 * sources. When you add up their contributions with the right phase
 * factors you get three famous results.
 *
 *   1. Double-slit fringe spacing  —  for two narrow slits separated by
 *      `d` and a screen at distance `L`, in the Fraunhofer (far-field)
 *      limit,
 *
 *          Δy = λ L / d.
 *
 *      Small `d` → widely-spaced fringes. Longer λ → widely-spaced
 *      fringes. This is what Young measured in 1801 to put the first
 *      experimental number on the wavelength of visible light.
 *
 *   2. Single-slit first minimum  —  a slit of width `a` produces a
 *      central bright lobe flanked by dark minima at angles satisfying
 *
 *          sin θ_min = λ / a    (first-order),  and
 *          sin θ_m   = m λ / a  (m = ±1, ±2, …).
 *
 *      The full central-maximum angular half-width is λ/a. On a screen
 *      at distance L, that's a linear half-width of λ L / a.
 *
 *   3. Diffraction grating principal maxima  —  replace two slits with
 *      `N` identical slits spaced by `d`. The principal maxima sit at
 *
 *          sin θ_m = m λ / d.
 *
 *      Exactly the same angles as a double-slit — it's the same
 *      phase-matching condition (each slit delays the next by an integer
 *      number of wavelengths). What changes is sharpness: the
 *      half-width of each principal maximum scales as 1/N, so a
 *      5 000-line-per-mm grating turns a broad double-slit fringe into a
 *      knife-thin spectral line. Fraunhofer built the first proper
 *      gratings around 1821 to resolve the solar dark lines that now
 *      bear his name.
 *
 * The *full* double-slit pattern is the product of the single-slit
 * envelope and the double-slit interference fringes: bright fringes
 * modulated by the wider single-slit sinc² envelope. The `huygensSum`
 * helper (in `ray-trace-canvas/tracer.ts`) computes that product
 * numerically by summing coherent wavelets, so we re-export it here as
 * the canonical §09.8 wave calculator. The analytical spacings below
 * match the numerical result to within 5% in the unit tests.
 */

import { huygensSum } from "@/components/physics/ray-trace-canvas/tracer";

/** Re-export the Huygens-Fresnel coherent wavelet sum as the canonical §09.8 helper. */
export { huygensSum };

/**
 * Angle of the first single-slit diffraction minimum for a slit of width `a`
 * illuminated by light of wavelength `lambda` (same units as `a`).
 *
 *   sin θ_min = λ / a          →         θ_min = arcsin(λ / a).
 *
 * Returns NaN if λ > a (no real first minimum — the slit is narrower than
 * the wavelength and the whole screen is bright).
 */
export function singleSlitFirstMinAngle(lambda: number, a: number): number {
  const ratio = lambda / a;
  if (Math.abs(ratio) > 1) return Number.NaN;
  return Math.asin(ratio);
}

/**
 * Angular half-width of the single-slit central maximum — the angle from
 * the forward direction to the first minimum on either side.
 *
 *   θ_half = arcsin(λ / a)      ≈  λ / a   for λ << a (small-angle limit).
 *
 * This is identical to `singleSlitFirstMinAngle` — provided under a
 * physicist's name for readability.
 */
export function singleSlitCentralHalfAngle(lambda: number, a: number): number {
  return singleSlitFirstMinAngle(lambda, a);
}

/**
 * Linear half-width of the single-slit central maximum on a screen at
 * distance `L`:  approximately λ L / a in the small-angle limit. Inputs in
 * any consistent length units (λ, a, L, return value all in the same
 * units).
 */
export function singleSlitCentralHalfWidth(lambda: number, a: number, L: number): number {
  return (lambda * L) / a;
}

/**
 * Double-slit fringe spacing in the far-field (Fraunhofer) limit.
 *
 *   Δy = λ L / d
 *
 * `lambda` is the illumination wavelength, `L` the slit-to-screen
 * distance, `d` the centre-to-centre slit separation. All three must be in
 * the same length units; the returned spacing is in the same units. This
 * is the small-angle form — valid when Δy << L, which covers essentially
 * every tabletop optical experiment.
 */
export function doubleSlitFringeSpacing(lambda: number, L: number, d: number): number {
  return (lambda * L) / d;
}

/**
 * Principal-maximum angles for a diffraction grating of `N` equally-spaced
 * slits separated by `d`, illuminated at normal incidence by light of
 * wavelength `lambda`. Returns all orders m = 0, ±1, ±2, … for which
 * |sin θ_m| ≤ 1 (i.e. the order is physically visible).
 *
 *   sin θ_m = m λ / d
 *
 * The output list is sorted by order magnitude. `N` controls only the
 * *sharpness* of each principal maximum (angular half-width ∝ 1/N), not
 * its position — so the returned angles are independent of `N`, but we
 * accept it to document that a grating *is* an N-slit interferometer.
 */
export function diffractionGratingPrincipalMaxima(
  N: number,
  lambda: number,
  d: number,
): { order: number; angleRad: number }[] {
  if (N < 2) throw new Error(`grating must have at least 2 slits (got N=${N})`);
  if (d <= 0) throw new Error(`slit spacing d must be positive (got d=${d})`);
  const maxOrder = Math.floor(d / lambda);
  const out: { order: number; angleRad: number }[] = [];
  for (let m = -maxOrder; m <= maxOrder; m += 1) {
    const sinTheta = (m * lambda) / d;
    if (Math.abs(sinTheta) <= 1) {
      out.push({ order: m, angleRad: Math.asin(sinTheta) });
    }
  }
  return out;
}

/**
 * Angular half-width of a single principal maximum for an N-slit grating.
 * Comes from the N-slit interference factor sin(N φ/2) / sin(φ/2), whose
 * principal peak has first zeros at φ = ±2π/N around each order. In the
 * small-angle limit this gives
 *
 *   Δθ ≈ λ / (N d)
 *
 * — explicitly shows how each additional slit sharpens the line. A
 * 1000-slit-per-mm grating illuminated at 550 nm has Δθ ≈ 5 × 10⁻⁴ rad
 * ≈ 30 arcseconds per principal maximum.
 */
export function gratingPrincipalMaxHalfWidth(N: number, lambda: number, d: number): number {
  if (N < 2) throw new Error(`grating must have at least 2 slits (got N=${N})`);
  return lambda / (N * d);
}

/**
 * Small-angle fringe-count estimator — how many double-slit fringes fit
 * within a screen of total width `screenWidth`, given wavelength `lambda`,
 * slit-to-screen distance `L`, and slit separation `d`. Useful for test
 * calibration against huygensSum.
 */
export function doubleSlitFringeCount(
  lambda: number,
  L: number,
  d: number,
  screenWidth: number,
): number {
  const spacing = doubleSlitFringeSpacing(lambda, L, d);
  return Math.floor(screenWidth / spacing);
}
