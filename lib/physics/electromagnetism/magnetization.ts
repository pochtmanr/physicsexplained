/**
 * Magnetisation, the H field, and linear-regime bookkeeping.
 *
 * Scalar helpers that treat B, H, and M as co-linear magnitudes — enough for
 * the §04 FIG.17 topic, where the interesting contrast is between the *total*
 * field B and the *free-current* field H inside a uniformly magnetised slab.
 *
 * Conventions (SI):
 *   B in tesla (T)
 *   M in A/m
 *   H in A/m
 *   χ_m (magnetic susceptibility) dimensionless, M = χ_m H
 *   μ_r = 1 + χ_m  (relative permeability, dimensionless)
 *   μ   = μ₀ · μ_r (absolute permeability, H/m)
 */

import { MU_0 } from "@/lib/physics/constants";

/**
 * Auxiliary H field from B and M:
 *
 *   H = B / μ₀ − M
 *
 * In plain words, H is "the part of B you put there with free currents, after
 * you back out what the material's magnetisation contributes." In vacuum
 * (M = 0) this collapses to H = B/μ₀.
 */
export function hFromBM(B: number, M: number): number {
  return B / MU_0 - M;
}

/**
 * Linear-regime magnetisation response to an H field:
 *
 *   M = χ_m · H
 *
 * χ_m is the magnetic susceptibility — tiny and negative for diamagnets,
 * tiny and positive for paramagnets, huge and nonlinear for ferromagnets
 * (the "linear" regime breaks for ferromagnets once hysteresis kicks in).
 */
export function linearMagnetization(H: number, chi: number): number {
  return chi * H;
}

/**
 * Relative permeability:
 *
 *   μ_r = 1 + χ_m
 *
 * Dimensionless. The number engineers read off a ferrite datasheet.
 * A diamagnet has μ_r slightly less than 1; soft iron has μ_r in the
 * thousands.
 */
export function relativePermeability(chi: number): number {
  return 1 + chi;
}

/**
 * Absolute permeability:
 *
 *   μ = μ₀ · (1 + χ_m) = μ₀ · μ_r
 *
 * Units: H/m (henries per metre).
 */
export function absolutePermeability(chi: number): number {
  return MU_0 * (1 + chi);
}

/**
 * B from H in a linear isotropic material:
 *
 *   B = μ₀ (1 + χ_m) H = μ · H
 *
 * This is the single most useful equation in transformer and inductor
 * design — once you know the core's μ, you know how much B each ampere-turn
 * per metre of H buys you.
 */
export function bFromHLinear(H: number, chi: number): number {
  return absolutePermeability(chi) * H;
}

/**
 * Curie's law for paramagnetic susceptibility:
 *
 *   χ_m(T) = C / T
 *
 * C is the Curie constant (material-specific, in K). Valid above any
 * ordering temperature, and for isolated non-interacting moments. Used by
 * the ChiVsTemperatureScene to draw the paramagnetic curve alongside the
 * diamagnetic baseline and the ferromagnetic Curie–Weiss divergence.
 */
export function curieSusceptibility(T: number, C: number): number {
  if (T <= 0) {
    throw new Error("curieSusceptibility: temperature must be positive");
  }
  return C / T;
}

/**
 * Curie–Weiss law for ferromagnetic susceptibility above T_c:
 *
 *   χ_m(T) = C / (T − T_c)     for T > T_c
 *
 * Diverges as T → T_c⁺ (the ferromagnetic transition) and crosses over
 * smoothly into Curie's law for T ≫ T_c. Below T_c the linear relation
 * M = χ_m H fails and the sample shows hysteresis instead — we return
 * `Infinity` there as a deliberate sentinel so plots can clip the curve.
 */
export function curieWeissSusceptibility(
  T: number,
  C: number,
  Tc: number,
): number {
  if (T <= Tc) return Number.POSITIVE_INFINITY;
  return C / (T - Tc);
}
