/**
 * §03.5 THE TWIN PARADOX — pure-TS helpers.
 *
 * Idealised round-trip twin paradox: the home twin sits at rest; the
 * traveling twin departs at speed βc, instantaneously turns around at the
 * midpoint, and returns at βc. The total lab-frame trip time is `T_home`.
 *
 * The traveling twin's worldline is two timelike segments of equal length
 * meeting at the turnaround event. The proper time accumulated along the
 * kinked worldline is shorter than along the home twin's straight (geodesic)
 * worldline between the same two reunion events — by exactly a factor of γ:
 *
 *   τ_traveler = T_home / γ(β)
 *
 * This is the geometric content of the §03 module: proper time is the
 * Minkowski arc length, and the kinked path is the shorter one. The asymmetry
 * is geometry, not a mysterious "force aging" the traveler differently.
 *
 * The `ageDifference` is the lab-frame disparity between the two clock
 * readings at reunion — always non-negative for any real subluminal trip.
 *
 * Conventions:
 *   • β = v/c, dimensionless. γ = 1/√(1 − β²).
 *   • `T_home` and the returned proper time share whatever units the caller
 *     supplies (years, seconds, …) — the formula is dimensionless in T.
 *   • This is the textbook idealisation: we ignore the proper-time
 *     contribution of the (instantaneous, by assumption) turnaround. At
 *     high γ that contribution is negligible; the geometric content of the
 *     paradox is captured by the inertial segments alone.
 */

import { gamma } from "./types";

/**
 * Round-trip proper time for an idealised twin who travels outbound at βc,
 * instantaneously reverses, and returns at βc, taking total lab-frame time
 * `T_home` for the whole round trip.
 *
 *   τ_traveler = T_home / γ(β)
 *
 * Throws if |β| ≥ 1 (the gamma factor diverges).
 */
export function travelerProperTime(THome: number, beta: number): number {
  return THome / gamma(beta);
}

/**
 * Difference in clock readings at reunion: home − traveler. Always
 * non-negative for any subluminal β. At β = 0 returns 0 (no trip, no
 * disparity).
 */
export function ageDifference(THome: number, beta: number): number {
  return THome - travelerProperTime(THome, beta);
}
