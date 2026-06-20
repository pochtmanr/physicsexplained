/**
 * §09 LIGHT DEFLECTION AND GRAVITATIONAL LENSING — pure-TS helpers.
 *
 * A light ray grazing a mass M with impact parameter b is bent through a small
 * angle. To first post-Newtonian order in the Schwarzschild geometry the
 * deflection is
 *
 *   α = 4GM / (c² b)
 *
 * exactly twice the value a naive Newtonian "corpuscle" calculation predicts
 * (α_Newton = 2GM / c² b). The extra factor of two comes from the curvature of
 * space — not just the warping of time — and its 1919 measurement at the solar
 * limb (α ≈ 1.75″) is the result that put Einstein on the front page of every
 * newspaper.
 *
 * From a single deflection angle the whole apparatus of gravitational lensing
 * follows: the lens equation maps a true source position to one or more image
 * positions, and for a perfectly aligned point lens the images smear into an
 * Einstein ring of angular radius θ_E.
 *
 * This file is unique to this topic. It is React-free and side-effect-free so
 * the scenes and the test suite can both import it.
 */

import { G_SI, SPEED_OF_LIGHT, GM_SUN_SI } from "@/lib/physics/constants";

/** The Sun's equatorial radius in meters (IAU 2015 nominal value). */
export const R_SUN_M = 6.957e8;

/** Radians → arcseconds. 1 rad = 206264.806… arcseconds. */
export const ARCSEC_PER_RAD = (180 / Math.PI) * 3600;

/** Convert an angle in radians to arcseconds. */
export function radToArcsec(rad: number): number {
  return rad * ARCSEC_PER_RAD;
}

/**
 * General-relativistic light-deflection angle for a ray with impact
 * parameter b grazing a mass with gravitational parameter GM.
 *
 *   α = 4 GM / (c² b)
 *
 * Returned in radians. Valid in the weak-field, large-b regime (b ≫ r_s); it
 * diverges as b → 0 where the linearized treatment breaks down. Pass GM
 * directly (e.g. GM_SUN_SI) to avoid losing precision in G·M.
 */
export function deflectionGR(
  b_m: number,
  GM = GM_SUN_SI,
  c = SPEED_OF_LIGHT,
): number {
  if (b_m <= 0) return Infinity;
  return (4 * GM) / (c * c * b_m);
}

/**
 * The pre-1919 "Newtonian" half-value: a light corpuscle on a hyperbolic
 * orbit, or equivalently the bending of time alone in the GR calculation.
 *
 *   α = 2 GM / (c² b)
 *
 * This is the number Einstein himself published in 1911 before he had the full
 * field equations; the 1915 theory doubled it.
 */
export function deflectionNewtonian(
  b_m: number,
  GM = GM_SUN_SI,
  c = SPEED_OF_LIGHT,
): number {
  if (b_m <= 0) return Infinity;
  return (2 * GM) / (c * c * b_m);
}

/** Convenience: GR deflection at the solar limb (b = R_sun), in arcseconds.
 *  Should evaluate to ≈ 1.75″ — the headline 1919 prediction. */
export function solarLimbDeflectionArcsec(
  GM = GM_SUN_SI,
  c = SPEED_OF_LIGHT,
): number {
  return radToArcsec(deflectionGR(R_SUN_M, GM, c));
}

/**
 * Einstein radius (angular) of a point lens of gravitational parameter GM,
 * with observer–lens distance D_L, observer–source distance D_S, and
 * lens–source distance D_LS (all small-angle, flat-sky):
 *
 *   θ_E = sqrt( 4GM/c² · D_LS / (D_L D_S) )
 *
 * Returned in radians. When the source sits exactly behind the lens the image
 * is a ring of this radius; θ_E sets the natural angular scale of every lens.
 */
export function einsteinRadius(
  D_L_m: number,
  D_S_m: number,
  D_LS_m: number,
  GM = GM_SUN_SI,
  c = SPEED_OF_LIGHT,
): number {
  if (D_L_m <= 0 || D_S_m <= 0) return 0;
  const rsOverC2 = (4 * GM) / (c * c);
  const arg = rsOverC2 * (D_LS_m / (D_L_m * D_S_m));
  return Math.sqrt(Math.max(0, arg));
}

/**
 * Point-lens image positions for a source at (dimensionless) angular offset u
 * from the lens, measured in units of the Einstein radius θ_E.
 *
 * Solving the lens equation u = θ − 1/θ (in θ_E units) gives two images:
 *
 *   θ± = ½ ( u ± sqrt(u² + 4) )
 *
 * The "+" image lies outside θ_E on the same side as the source; the "−" image
 * lies inside θ_E on the opposite side (negative θ). As u → 0 the two images
 * approach ±1 and, with full alignment, merge into the Einstein ring.
 *
 * Returns the two image positions in units of θ_E.
 */
export function lensImagePositions(u: number): [number, number] {
  const root = Math.sqrt(u * u + 4);
  const thetaPlus = 0.5 * (u + root);
  const thetaMinus = 0.5 * (u - root);
  return [thetaPlus, thetaMinus];
}

/**
 * Signed magnification of a single point-lens image at position θ (in θ_E
 * units). For the standard point lens
 *
 *   μ(θ) = 1 / ( 1 − θ^{-4} )
 *
 * The sign encodes image parity (the inner image is flipped, μ < 0). Physical
 * brightness is |μ|, which diverges on the Einstein ring (θ → ±1).
 */
export function imageMagnification(theta: number): number {
  const t4 = Math.pow(theta, 4);
  if (t4 === 1) return Infinity;
  return 1 / (1 - 1 / t4);
}

/**
 * Total (combined) magnification of a point source at offset u (in θ_E units),
 * summing the absolute magnifications of both images:
 *
 *   A(u) = (u² + 2) / ( u · sqrt(u² + 4) )
 *
 * A → ∞ as u → 0 (perfect alignment) and A → 1 for u ≫ 1 (no lensing). This is
 * the curve traced out by a microlensing light-curve as a star drifts behind a
 * compact lens.
 */
export function totalMagnification(u: number): number {
  if (u <= 0) return Infinity;
  return (u * u + 2) / (u * Math.sqrt(u * u + 4));
}

/**
 * Integrate a single photon trajectory past a point mass in the weak-field
 * limit, returning the polyline of (x, y) positions in the same length units
 * as the inputs. The ray starts far to the left moving in +x with impact
 * parameter b (its asymptotic y-offset), and is deflected by the transverse
 * acceleration of the effective potential.
 *
 * We use the standard first-order ("Born") bending model: the transverse
 * deflection rate is 2GM/(c²) · (perpendicular component)/r³ integrated along
 * an essentially straight path, summing to the total α = 4GM/(c²b). This is a
 * teaching integrator — it reproduces the correct asymptotic angle while
 * staying numerically simple — not a full geodesic solver.
 *
 * @param b_units      impact parameter (asymptotic y-offset)
 * @param rsEff        an effective "strength" length 2GM/c² in the same units
 * @param xStart/xEnd  integration range in x
 * @param steps        number of segments
 * @param mode         "gr" (factor 4) or "newtonian" (factor 2)
 */
export function tracePhoton(
  b_units: number,
  rsEff: number,
  xStart: number,
  xEnd: number,
  steps: number,
  mode: "gr" | "newtonian" = "gr",
): Array<{ x: number; y: number }> {
  const factor = mode === "gr" ? 2 : 1; // rsEff already = 2GM/c²; ×2 → 4GM/c²
  const dx = (xEnd - xStart) / steps;
  let x = xStart;
  let y = b_units;
  let vy = 0; // transverse velocity per unit x-path (slope), starts straight
  const pts: Array<{ x: number; y: number }> = [{ x, y }];
  for (let i = 0; i < steps; i++) {
    const r2 = x * x + y * y;
    const r = Math.sqrt(r2);
    if (r > 1e-9) {
      // transverse acceleration ∝ -(rsEff·factor)·y / r³ (points toward mass)
      const ay = -(rsEff * factor) * (y / (r2 * r));
      vy += ay * dx;
    }
    x += dx;
    y += vy * dx;
    pts.push({ x, y });
  }
  return pts;
}

/** Asymptotic bend angle (radians) recovered from a traced photon: the change
 *  in path slope between the first and last segments. Useful for tests that
 *  the integrator reproduces 4GM/(c²b). */
export function tracedBendAngle(
  pts: Array<{ x: number; y: number }>,
): number {
  if (pts.length < 3) return 0;
  const a0 = pts[1];
  const a1 = pts[0];
  const b0 = pts[pts.length - 1];
  const b1 = pts[pts.length - 2];
  const slopeIn = (a0.y - a1.y) / (a0.x - a1.x);
  const slopeOut = (b0.y - b1.y) / (b0.x - b1.x);
  return Math.atan(slopeIn) - Math.atan(slopeOut);
}

/** Re-export so scenes can label readouts without re-importing constants. */
export { GM_SUN_SI, G_SI, SPEED_OF_LIGHT };
