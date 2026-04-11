import { g_SI } from "./constants";

/**
 * Small-angle pendulum. Assumes sin(theta) ≈ theta.
 * Solution: theta(t) = theta0 * cos(omega * t), omega = sqrt(g/L).
 */

export interface SmallAngleInput {
  /** Time in seconds */
  t: number;
  /** Initial amplitude in radians (should be < ~0.3 for the approximation to hold) */
  theta0: number;
  /** Pendulum length in meters */
  L: number;
  /** Optional gravity override in m/s^2 (defaults to standard gravity) */
  g?: number;
}

export function smallAngleOmega(L: number, g: number = g_SI): number {
  return Math.sqrt(g / L);
}

export function smallAnglePeriod(L: number, g: number = g_SI): number {
  return 2 * Math.PI * Math.sqrt(L / g);
}

export function smallAngleTheta({
  t,
  theta0,
  L,
  g = g_SI,
}: SmallAngleInput): number {
  const omega = smallAngleOmega(L, g);
  return theta0 * Math.cos(omega * t);
}

export function smallAngleThetaDot({
  t,
  theta0,
  L,
  g = g_SI,
}: SmallAngleInput): number {
  const omega = smallAngleOmega(L, g);
  return -theta0 * omega * Math.sin(omega * t);
}
