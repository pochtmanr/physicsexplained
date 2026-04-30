/**
 * §05.1 THE BARN-POLE PARADOX — pure-TS helpers.
 *
 * The classic length-contraction paradox. A pole of proper length L_pole moves at
 * speed βc toward a barn of proper length L_barn. In the barn rest frame the pole
 * contracts by 1/γ; in the pole rest frame the barn contracts by 1/γ. So:
 *
 *   • Barn frame: pole length = L_pole / γ. Fits if L_pole / γ ≤ L_barn.
 *   • Pole frame: barn length = L_barn / γ. Pole fits inside the (contracted) barn
 *     only if L_pole ≤ L_barn / γ — strictly stronger than the barn-frame
 *     condition. At γ > 1 with L_pole > L_barn the pole CANNOT fit in its own
 *     frame, even though it does in the barn frame.
 *
 * The "paradox" is the apparent contradiction between the two answers. The
 * resolution is that "fits inside the barn" implicitly means "both ends of the
 * pole are inside the barn AT THE SAME TIME" — and simultaneity is frame-
 * dependent. In the barn frame both doors close simultaneously at t = 0 with
 * the pole entirely inside; in the pole frame the two door-closing events are
 * separated in time by Δt' = −γ β L_barn / c (front door closes BEFORE rear
 * door — see `doorEventLagInPoleFrame`), so the pole is never fully enclosed
 * at any single moment.
 *
 * This is the same content as the Lorentz boost of a Δx-displaced pair of
 * spacelike-separated simultaneous events; the simultaneity offset is the
 * geometric content of the paradox.
 *
 * Conventions:
 *   • β = v/c, dimensionless. γ = 1/√(1 − β²).
 *   • L_pole, L_barn in meters; door-event lag in seconds.
 *   • Mostly-minus signature, x along the direction of motion.
 */

import { SPEED_OF_LIGHT } from "@/lib/physics/constants";
import { gamma } from "./types";

/**
 * Barn-frame view: a pole of proper length `LPole` moving at speed β contracts
 * to LPole / γ along the direction of motion. Returns true iff the contracted
 * pole fits inside a barn of proper length `LBarn`.
 *
 * Throws if |β| ≥ 1 (γ diverges).
 */
export function fitsInBarnInBarnFrame(
  LPole: number,
  LBarn: number,
  beta: number,
): boolean {
  return LPole / gamma(beta) <= LBarn;
}

/**
 * Pole-frame view: in the pole's rest frame the barn is the moving object and
 * contracts to LBarn / γ. The pole has its proper length LPole. Returns true
 * iff the pole could in principle fit inside the (smaller, contracted) barn.
 *
 * For LPole > LBarn this is always false at any β > 0 — the contracted barn
 * is smaller than the already-bigger pole. That is the pole-frame side of the
 * paradox.
 *
 * Throws if |β| ≥ 1.
 */
export function fitsInBarnInPoleFrame(
  LPole: number,
  LBarn: number,
  beta: number,
): boolean {
  return LPole <= LBarn / gamma(beta);
}

/**
 * Lorentz boost of the two simultaneous (in the barn frame) door-closing
 * events into the pole's rest frame. In the barn frame the rear door is at
 * x = 0, the front door at x = L_barn, and both close at t = 0. Boosting by
 * −β (the pole moves at +β relative to the barn, so the pole frame moves at
 * +β too — but we want the time interval between front and rear events as
 * seen by the pole, with Δx = +L_barn between them):
 *
 *   Δt' = γ (Δt − β Δx / c) = γ (0 − β · L_barn / c) = −γ β L_barn / c.
 *
 * The negative sign means the front-door event occurs BEFORE the rear-door
 * event in the pole frame. Physically: from the pole's perspective the front
 * door slams shut first (and bounces back open), then much later the rear
 * door slams shut. The pole is never fully enclosed at any single instant in
 * its own frame — the sequencing dissolves the apparent contradiction.
 *
 * Returns the lag in seconds (when LBarn is in meters and c in m/s). Throws
 * if |β| ≥ 1.
 */
export function doorEventLagInPoleFrame(
  LBarn: number,
  beta: number,
  c: number = SPEED_OF_LIGHT,
): number {
  return (-gamma(beta) * beta * LBarn) / c;
}

/**
 * The contracted length of the pole as measured in the barn frame. Convenience
 * wrapper around L_pole / γ(β). Throws if |β| ≥ 1.
 */
export function contractedPoleLength(LPole: number, beta: number): number {
  return LPole / gamma(beta);
}

/**
 * The contracted length of the barn as measured in the pole frame. Convenience
 * wrapper around L_barn / γ(β). Throws if |β| ≥ 1.
 */
export function contractedBarnLength(LBarn: number, beta: number): number {
  return LBarn / gamma(beta);
}
