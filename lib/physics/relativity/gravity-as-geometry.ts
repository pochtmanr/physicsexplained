/**
 * §06.4 GRAVITY AS GEOMETRY — pure-TS helpers.
 *
 * The §06 honest moment + GR bridge. The equivalence principle of §06.1–§06.3
 * has a geometric implication: locally every freely-falling lab is inertial,
 * so spacetime locally looks Minkowski. Globally, real gravity isn't a uniform
 * force field — it varies with position. The patching of locally-flat frames
 * across a gravitating region is curvature, and free-fall is the geodesic
 * motion that curvature picks out. There is no force called gravity. There is
 * curvature.
 *
 * This module exposes three minimal scaffolding helpers that bridge §06 to
 * §07 (manifolds, metric tensor, Christoffels, geodesics):
 *
 *   • schwarzschildRadius — the threshold below which the Schwarzschild metric's
 *     coordinate-time stretching diverges. For a 1 M_sun source: ≈ 2953 m.
 *     Defined here as the conceptual bridge to §09's black-hole geometry.
 *
 *   • weakFieldGtt — the time-time metric component to first order in Φ/c²,
 *     showing how the Newtonian potential Φ = −GM/r is the leading-order
 *     piece of g_tt in the metric formalism.
 *
 *   • newtonianPotential — the source-side potential, included so the §06.4
 *     prose can refer to a single canonical Φ that shows up in both the
 *     Newtonian limit and the leading-order weak-field metric.
 *
 * Session 4 (§07) replaces this scaffolding with the full Einstein field
 * equations:
 *
 *     R_{μν} − (1/2) g_{μν} R = (8π G/c⁴) T_{μν}
 *
 * — which determine g_{μν} from the matter-energy distribution T_{μν} and
 * promote the three weak-field helpers above to a single tensor identity.
 */

import { SPEED_OF_LIGHT, G_SI } from "@/lib/physics/constants";

/** Schwarzschild radius r_s = 2GM/c². The threshold below which the Schwarzschild metric's
 *  coordinate-time stretching diverges. Defined here as the conceptual bridge to §09. */
export function schwarzschildRadius(M: number, G = G_SI, c = SPEED_OF_LIGHT): number {
  if (M <= 0) throw new RangeError(`schwarzschildRadius: mass must be positive`);
  return 2 * G * M / (c * c);
}

/** Weak-field static-source approximation of the time-time metric component:
 *  g_tt ≈ -(1 + 2Φ/c²) where Φ = -GM/r is the Newtonian potential. */
export function weakFieldGtt(r: number, M: number, G = G_SI, c = SPEED_OF_LIGHT): number {
  const phi = -G * M / r;
  return -(1 + 2 * phi / (c * c));
}

/** Newtonian-equivalent gravitational potential at radius r from a point mass M.
 *  Used by the §06.4 "gravity is the geometry" reframe: this Φ shows up as the leading
 *  term in g_tt. */
export function newtonianPotential(r: number, M: number, G = G_SI): number {
  if (r <= 0 || M <= 0) throw new RangeError(`newtonianPotential: r and M must be positive`);
  return -G * M / r;
}
