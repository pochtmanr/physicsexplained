/**
 * §54 THE FLRW METRIC — pure-TS helpers.
 *
 * The Friedmann–Lemaître–Robertson–Walker (FLRW) line element is the unique
 * metric for a universe that is spatially homogeneous and isotropic. In
 * reduced-circumference (Robertson–Walker) coordinates it reads
 *
 *   ds² = −c² dt² + a(t)² [ dr²/(1 − k r²) + r² (dθ² + sin²θ dφ²) ]
 *
 * where a(t) is the dimensionless scale factor (normalized a(t₀) = 1 today),
 * r is a comoving radial coordinate, and k ∈ {−1, 0, +1} is the sign of the
 * constant spatial curvature (open / flat / closed).
 *
 * This module is React-free and dependency-light: only the helpers the
 * three FLRW scenes and tests need. The "physics" here is geometry and
 * kinematics of the expanding grid — no Friedmann dynamics (that lives in
 * the friedmann-equations topic). Distances are returned in the same length
 * unit the caller uses for the Hubble radius / comoving coordinate.
 */

/** Spatial curvature index of an FLRW universe. */
export type CurvatureSign = -1 | 0 | 1;

/**
 * Proper (physical) distance between two comoving points at cosmic time t.
 *
 *   d_proper(t) = a(t) · χ
 *
 * where χ is the fixed comoving distance. As space expands (a grows) the
 * proper separation of objects that merely "sit on the grid" grows in
 * lockstep, even though neither object moves through space.
 */
export function properDistance(scaleFactor: number, comoving: number): number {
  return scaleFactor * comoving;
}

/**
 * Comoving distance recovered from a proper distance and the scale factor.
 * Inverse of `properDistance`. Returns NaN-safe 0 for a degenerate a = 0.
 */
export function comovingDistance(proper: number, scaleFactor: number): number {
  if (scaleFactor === 0) return 0;
  return proper / scaleFactor;
}

/**
 * Hubble recession velocity of a comoving object at proper distance d:
 *
 *   v = H · d ,   H = ȧ / a
 *
 * This is the instantaneous expansion velocity (the Hubble law), valid for
 * any FLRW model. Pass H in inverse-time units consistent with d's length
 * unit; the result is a velocity in length/time. Note v can exceed c for
 * sufficiently distant comoving objects — that is a coordinate statement
 * about the growth of intervening space, not motion through it.
 */
export function recessionVelocity(hubble: number, proper: number): number {
  return hubble * proper;
}

/**
 * Hubble parameter H = ȧ / a from the scale factor and its time derivative.
 * Returns 0 for a degenerate a = 0 to keep callers numerically safe.
 */
export function hubbleParameter(scaleFactor: number, scaleRate: number): number {
  if (scaleFactor === 0) return 0;
  return scaleRate / scaleFactor;
}

/**
 * Cosmological redshift of light emitted when the scale factor was a_emit
 * and received now (a = a_now, default 1):
 *
 *   1 + z = a_now / a_emit
 *
 * Wavelengths stretch by exactly the factor space has expanded by since
 * emission. This is NOT a Doppler shift: nothing's velocity enters; only the
 * ratio of scale factors does.
 */
export function redshiftFromScaleFactor(
  aEmit: number,
  aNow = 1,
): number {
  if (aEmit <= 0) return Infinity;
  return aNow / aEmit - 1;
}

/**
 * Inverse: the scale factor at emission for an observed redshift z.
 *
 *   a_emit = a_now / (1 + z)
 */
export function scaleFactorFromRedshift(z: number, aNow = 1): number {
  return aNow / (1 + z);
}

/**
 * The k = +1 / 0 / −1 "S_k" radial function that appears in the angular and
 * luminosity relations. With curvature radius set to 1:
 *
 *   k = +1 (closed):  S(χ) = sin χ
 *   k =  0 (flat):    S(χ) = χ
 *   k = −1 (open):    S(χ) = sinh χ
 *
 * It maps a comoving radial coordinate χ to the transverse comoving distance,
 * which controls how the area of a sphere of radius χ deviates from 4π χ².
 */
export function sk(chi: number, k: CurvatureSign): number {
  if (k === 1) return Math.sin(chi);
  if (k === -1) return Math.sinh(chi);
  return chi;
}

/**
 * Sum of the interior angles (in radians) of a geodesic triangle of area A
 * on a surface of constant Gaussian curvature K. The Gauss–Bonnet theorem
 * gives the angular excess/defect exactly:
 *
 *   (α + β + γ) − π = K · A
 *
 * For the FLRW spatial slices K = k / a², so the sign of k determines whether
 * triangles bulge (k = +1, angle sum > π), stay Euclidean (k = 0, = π), or
 * pinch (k = −1, angle sum < π).
 */
export function triangleAngleSum(area: number, K: number): number {
  return Math.PI + K * area;
}

/**
 * Convenience: angle-sum excess over π, in degrees, for a triangle of the
 * given fractional area on a curved slice. `fracArea` is the triangle's area
 * as a fraction of the unit-curvature 2-sphere/2-plane patch [0, 1]; it is
 * scaled by 2π so a hemisphere-sized triangle gives a large, visible excess.
 */
export function angleSumDegrees(fracArea: number, k: CurvatureSign): number {
  const area = Math.max(0, Math.min(1, fracArea)) * 2 * Math.PI;
  const sumRad = triangleAngleSum(area, k);
  return (sumRad * 180) / Math.PI;
}

/**
 * One non-trivial FLRW metric component for diagnostic / scene use: the
 * radial metric coefficient g_rr = a² / (1 − k r²) in Robertson–Walker form.
 * Returns Infinity at the coordinate singularity r → 1 for k = +1 (the
 * "equator" of a closed universe), which is a coordinate artifact, not a
 * physical edge.
 */
export function gRadial(
  scaleFactor: number,
  r: number,
  k: CurvatureSign,
): number {
  const denom = 1 - k * r * r;
  if (denom <= 0) return Infinity;
  return (scaleFactor * scaleFactor) / denom;
}
