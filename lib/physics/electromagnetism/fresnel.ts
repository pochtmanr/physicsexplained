/**
 * Fresnel's equations — the amplitude coefficients for reflection and
 * transmission at a planar interface between two linear, isotropic,
 * non-magnetic dielectrics.
 *
 * A ray hits a boundary between a medium of refractive index n₁ and a
 * medium of refractive index n₂. The incident, reflected, and transmitted
 * rays all lie in a single *plane of incidence* — the plane containing the
 * incoming ray and the surface normal. The electric field is decomposed
 * into two orthogonal components:
 *
 *   s-polarisation (senkrecht, "perpendicular")  — E perpendicular to the
 *                                                  plane of incidence.
 *   p-polarisation (parallel)                    — E lying in the plane of
 *                                                  incidence.
 *
 * The two components satisfy independent Maxwell boundary conditions
 * (E_parallel continuous, H_parallel continuous across the interface) and
 * therefore reflect and transmit with completely different coefficients.
 * Solving the 2×2 linear systems yields the Fresnel amplitude coefficients:
 *
 *   r_s = (n₁ cosθ_i − n₂ cosθ_t) / (n₁ cosθ_i + n₂ cosθ_t)
 *   r_p = (n₁ cosθ_t − n₂ cosθ_i) / (n₁ cosθ_t + n₂ cosθ_i)
 *   t_s = (2 n₁ cosθ_i) / (n₁ cosθ_i + n₂ cosθ_t)
 *   t_p = (2 n₁ cosθ_i) / (n₂ cosθ_i + n₁ cosθ_t)
 *
 * where θ_t is the transmitted (refracted) angle, fixed by Snell's law
 * n₁ sinθ_i = n₂ sinθ_t.
 *
 * Energy-conserving INTENSITY ratios follow from |r|² and a |t|² term
 * weighted by the ratio of (cosθ × n) on the two sides:
 *
 *   R = |r|²                                   (reflectance)
 *   T = (n₂ cosθ_t) / (n₁ cosθ_i) · |t|²       (transmittance)
 *
 * Two special angles:
 *
 *   Brewster's angle  θ_B = arctan(n₂ / n₁)    →  r_p = 0 (no reflected
 *                                                  p-polarisation).
 *   Critical angle    θ_c = arcsin(n₂ / n₁)    →  total internal reflection
 *                                                  (only when n₁ > n₂).
 *
 * Sign convention: a negative r means the reflected amplitude is flipped
 * relative to the incident amplitude — a half-wavelength phase shift. With
 * the Verdet/Hecht convention used here, at normal incidence from a
 * less-dense into a denser medium (n₁ < n₂) both r_s and r_p are negative.
 */

import { fresnelCoefficients } from "@/components/physics/ray-trace-canvas/tracer";

/** Fresnel amplitude reflection coefficient for s-polarisation. */
export function fresnelRs(thetaI: number, n1: number, n2: number): number {
  return fresnelCoefficients(thetaI, n1, n2).rs;
}

/** Fresnel amplitude reflection coefficient for p-polarisation. */
export function fresnelRp(thetaI: number, n1: number, n2: number): number {
  return fresnelCoefficients(thetaI, n1, n2).rp;
}

/** Fresnel amplitude transmission coefficient for s-polarisation. */
export function fresnelTs(thetaI: number, n1: number, n2: number): number {
  return fresnelCoefficients(thetaI, n1, n2).ts;
}

/** Fresnel amplitude transmission coefficient for p-polarisation. */
export function fresnelTp(thetaI: number, n1: number, n2: number): number {
  return fresnelCoefficients(thetaI, n1, n2).tp;
}

/**
 * All four amplitude coefficients plus the transmitted angle. Returns
 * `thetaT = NaN` when total internal reflection is in play — in that case
 * the tracer's adapter flags TIR by returning `rs = rp = -1` and
 * `ts = tp = 0`, which is what the pure helpers above will also report.
 */
export function fresnelAll(
  thetaI: number,
  n1: number,
  n2: number,
): { rs: number; rp: number; ts: number; tp: number; thetaT: number } {
  const { rs, rp, ts, tp } = fresnelCoefficients(thetaI, n1, n2);
  const sinT = (n1 / n2) * Math.sin(thetaI);
  const thetaT = Math.abs(sinT) > 1 ? Number.NaN : Math.asin(sinT);
  return { rs, rp, ts, tp, thetaT };
}

/** Intensity reflectance R = |r|² (dimensionless, in [0, 1]). */
export function reflectance(r: number): number {
  return r * r;
}

/**
 * Intensity transmittance for s-polarisation,
 *
 *   T_s = (n₂ cosθ_t) / (n₁ cosθ_i) · |t_s|²
 *
 * Must satisfy R_s + T_s = 1 (energy conservation) at every incidence
 * angle short of TIR. Returns 0 when TIR is in play.
 */
export function transmittanceS(
  ts: number,
  n1: number,
  n2: number,
  thetaI: number,
  thetaT: number,
): number {
  if (!Number.isFinite(thetaT)) return 0;
  const cosI = Math.cos(thetaI);
  if (cosI === 0) return 0;
  return ((n2 * Math.cos(thetaT)) / (n1 * cosI)) * ts * ts;
}

/**
 * Intensity transmittance for p-polarisation. The same geometric weight
 * applies — the ratio (n₂ cosθ_t) / (n₁ cosθ_i) — multiplied by |t_p|².
 */
export function transmittanceP(
  tp: number,
  n1: number,
  n2: number,
  thetaI: number,
  thetaT: number,
): number {
  if (!Number.isFinite(thetaT)) return 0;
  const cosI = Math.cos(thetaI);
  if (cosI === 0) return 0;
  return ((n2 * Math.cos(thetaT)) / (n1 * cosI)) * tp * tp;
}

/**
 * Brewster's angle — the incidence angle at which r_p vanishes, so the
 * reflected beam is purely s-polarised. Derived by imposing r_p = 0 on the
 * Fresnel formula and using Snell's law:
 *
 *   θ_B = arctan(n₂ / n₁)
 *
 * Fresnel 1821. If you have ever seen glare off wet tarmac look strongly
 * polarised, this angle is why.
 */
export function brewsterAngle(n1: number, n2: number): number {
  return Math.atan(n2 / n1);
}

/**
 * Critical angle for total internal reflection from medium n₁ into medium
 * n₂. Defined only when n₁ > n₂; returns `null` otherwise.
 *
 *   θ_c = arcsin(n₂ / n₁)
 */
export function criticalAngle(n1: number, n2: number): number | null {
  if (n1 <= n2) return null;
  return Math.asin(n2 / n1);
}
