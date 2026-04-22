import { K_COULOMB } from "./constants";

/**
 * Method of images — the trick of replacing a grounded conductor with a single
 * fictitious "image" charge that reproduces the same boundary condition
 * (V = 0 on the conductor surface) inside the physical region.
 *
 * The image charge is not real. It lives outside the region of validity of the
 * solution (behind the plane, or inside the sphere), and exists only to make
 * the math easy. In the physical region, the field of the real charge plus the
 * field of the image charge IS the true field — including the field produced
 * by the very real induced surface charge on the conductor.
 *
 * Both classic results (plane and sphere) are due to William Thomson — Lord
 * Kelvin — in 1848.
 */

/**
 * Image of a charge `q` sitting at height `d` above a grounded conducting plane
 * at z = 0.
 *
 * The image is `-q` at z = -d (the mirror reflection through the plane).
 * Together they produce V = 0 on the entire plane z = 0, which is exactly the
 * boundary condition the grounded conductor enforces.
 */
export function imageChargeForPlane(
  q: number,
  d: number,
): { q: number; x: number; y: number } {
  return { q: -q, x: 0, y: -d };
}

/**
 * Image of a charge `q` sitting at distance `a` from the center of a grounded
 * conducting sphere of radius `R` (with `a > R`).
 *
 * Kelvin's 1848 result: the image is a charge of magnitude `-qR/a` placed at
 * distance `R²/a` from the center, on the line from the center to the real
 * charge. This is the "inverse point" of the real charge with respect to the
 * sphere — the same inversive geometry that powers stereographic projection.
 *
 * Together, the real charge and its image make V = 0 everywhere on the
 * sphere's surface.
 */
export function imageChargeForSphere(
  q: number,
  a: number,
  R: number,
): { q: number; distance: number } {
  return { q: (-q * R) / a, distance: (R * R) / a };
}

/**
 * Force on the real charge `q` sitting at height `d` above a grounded plane.
 *
 * The real charge feels the field of its image — and the image sits at
 * distance `2d` from it (the real charge is at +d, the image at -d). So the
 * force is the Coulomb force between two charges `q` and `-q` separated by
 * `2d`, which works out to:
 *
 *     F = -k · q² / (2d)²
 *
 * The sign is negative — the force is attractive, pulling the real charge
 * toward the plane.
 */
export function forceOnRealCharge(q: number, d: number): number {
  const separation = 2 * d;
  return -(K_COULOMB * q * q) / (separation * separation);
}
