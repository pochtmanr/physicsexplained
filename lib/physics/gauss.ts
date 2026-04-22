/**
 * Gauss's law in symmetry-reduced form.
 *
 * The integral statement is
 *   ∮ E · dA = Q_enclosed / ε₀
 * which is what we mean when we say "the flux through any closed
 * surface depends only on the charge inside."
 *
 * For three high-symmetry geometries the surface integral collapses to
 * algebra, and the field magnitude on the Gaussian surface follows in
 * one line. Those three closed-form solutions are what this module
 * exposes — the rest of Gauss's law is the choice of the right surface.
 */

import { EPSILON_0 } from "./constants";

/**
 * Total electric flux through a sphere of any radius `r` enclosing a
 * point charge `q`.
 *
 * Returns `q / ε₀` — note the deliberate absence of `r`. That's the
 * whole content of Gauss's law: flux through any closed surface around
 * the charge is the same number, set by the charge alone.
 *
 * The `r` argument is taken to make the API self-documenting; the
 * function ignores it on purpose. Tests assert the r-independence.
 *
 * Units: q in coulombs → flux in V·m (equivalently N·m²/C).
 */
export function fluxThroughSphere(q: number, _r: number): number {
  return q / EPSILON_0;
}

/**
 * Magnitude of E at radius `r` from a spherically symmetric charge
 * distribution that encloses a total charge `qEnclosed` inside `r`.
 *
 * This is the Gauss-law derivation of the inverse-square field for any
 * spherical configuration: a point charge, a uniformly charged sphere
 * (outside its surface), a thin spherical shell (outside), and so on.
 *
 *   E(r) = qEnclosed / (4π · ε₀ · r²)
 *
 * Units: qEnclosed in C, r in m, return in N/C.
 */
export function fieldFromSphericalSymmetry(
  qEnclosed: number,
  r: number,
): number {
  if (r <= 0) {
    throw new Error(
      `fieldFromSphericalSymmetry: r must be positive (got ${r}).`,
    );
  }
  return qEnclosed / (4 * Math.PI * EPSILON_0 * r * r);
}

/**
 * Magnitude of E at perpendicular distance `s` from an infinite line of
 * charge with linear charge density `lambda` (C/m). Cylindrical Gaussian
 * surface; the symmetry is translation along the line and rotation
 * around it.
 *
 *   E(s) = λ / (2π · ε₀ · s)
 *
 * Note the 1/s falloff — slower than a point charge's 1/r², because the
 * line keeps contributing as you move along it.
 */
export function fieldFromLineSymmetry(lambda: number, s: number): number {
  if (s <= 0) {
    throw new Error(`fieldFromLineSymmetry: s must be positive (got ${s}).`);
  }
  return lambda / (2 * Math.PI * EPSILON_0 * s);
}

/**
 * Magnitude of E at any distance from an infinite plane of charge with
 * surface charge density `sigma` (C/m²). Pillbox Gaussian surface
 * straddling the sheet.
 *
 *   E = σ / (2 · ε₀)
 *
 * Distance does not appear. The field is uniform and points away from
 * (or toward, for negative σ) the sheet. This is the limiting case
 * that gives a parallel-plate capacitor its constant interior field.
 */
export function fieldFromPlaneSymmetry(sigma: number): number {
  return sigma / (2 * EPSILON_0);
}
