/**
 * Relativity of simultaneity (RT §01.5).
 *
 * Closed-form helpers for the time-component of a Lorentz boost. The whole
 * apparatus of "Newtonian time dies" lives in the cross-term β·Δx/c: when two
 * events are spatially separated, a boost mixes time and space and the events
 * stop being simultaneous in the new frame.
 *
 * Conventions match `lib/physics/relativity/types.ts` (mostly-minus, +x boost).
 */

import { SPEED_OF_LIGHT } from "@/lib/physics/constants";
import { gamma } from "./types";

/**
 * Time difference t1' − t2' between two events, measured in a frame moving
 * along +x with velocity βc relative to the lab.
 *
 *   t' = γ (t − β x / c)
 *   ⇒ t1' − t2' = γ ( (t1 − t2) − β (x1 − x2) / c )
 *
 * Inputs in SI: t in seconds, x in meters. Output: seconds.
 *
 * Sign convention: for events simultaneous in lab (t1 = t2) and x1 < x2,
 * the boosted observer sees t1' − t2' = +γ β (x2 − x1)/c > 0 when β > 0,
 * i.e. the trailing-x event is later in the boosted frame.
 */
export function tPrimeDifference(
  t1: number,
  x1: number,
  t2: number,
  x2: number,
  beta: number,
): number {
  const c = SPEED_OF_LIGHT;
  const g = gamma(beta);
  return g * ((t1 - t2) - (beta / c) * (x1 - x2));
}

/**
 * Convenience: full t' for one event under the same boost. Same algebra,
 * useful in the SpacetimeDiagramCanvas wrapper to label simultaneity slices.
 */
export function tPrime(t: number, x: number, beta: number): number {
  const c = SPEED_OF_LIGHT;
  const g = gamma(beta);
  return g * (t - (beta * x) / c);
}

/**
 * Convenience: full x' for one event under the same boost.
 *
 *   x' = γ (x − β c t)
 */
export function xPrime(t: number, x: number, beta: number): number {
  const c = SPEED_OF_LIGHT;
  const g = gamma(beta);
  return g * (x - beta * c * t);
}

/**
 * Sign of t1' − t2'. -1 / 0 / +1.
 *
 * Returns 0 only when the floating-point result is exactly within `tol` of
 * zero (default 1e-15 s) — useful for asserting "simultaneous in this frame"
 * in the train-and-platform thought experiment.
 */
export function ordering(
  t1: number,
  x1: number,
  t2: number,
  x2: number,
  beta: number,
  tol: number = 1e-15,
): -1 | 0 | 1 {
  const dt = tPrimeDifference(t1, x1, t2, x2, beta);
  if (Math.abs(dt) <= tol) return 0;
  return dt > 0 ? 1 : -1;
}
