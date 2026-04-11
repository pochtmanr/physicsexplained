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

import { integrate } from "./ode";

export interface LargeAngleInput {
  /** Initial amplitude in radians */
  theta0: number;
  /** Pendulum length in meters */
  L: number;
  /** Integration horizon in seconds */
  tEnd: number;
  /** Number of samples to return */
  nSamples: number;
  /** Optional gravity override */
  g?: number;
}

export interface PendulumSample {
  t: number;
  theta: number;
  thetaDot: number;
}

/**
 * Integrate the full nonlinear pendulum equation theta'' = -(g/L) sin(theta)
 * starting from rest at theta0. Uses odex.
 */
export function largeAngleSolve(input: LargeAngleInput): PendulumSample[] {
  const { theta0, L, tEnd, nSamples, g = g_SI } = input;
  const omega2 = g / L;

  const samples = integrate({
    y0: [theta0, 0],
    rhs: (_t, y) => [y[1]!, -omega2 * Math.sin(y[0]!)],
    tEnd,
    nSamples,
  });

  return samples.map((s) => ({
    t: s.t,
    theta: s.y[0]!,
    thetaDot: s.y[1]!,
  }));
}

/**
 * Complete elliptic integral of the first kind K(k) using the
 * arithmetic-geometric mean. k is the modulus (NOT the parameter m = k^2).
 * Converges to full double precision in ~10 iterations.
 */
function completeEllipticK(k: number): number {
  let a = 1;
  let b = Math.sqrt(1 - k * k);
  for (let i = 0; i < 20; i++) {
    const aNext = (a + b) / 2;
    const bNext = Math.sqrt(a * b);
    if (Math.abs(a - b) < 1e-15) break;
    a = aNext;
    b = bNext;
  }
  return Math.PI / (2 * a);
}

/**
 * Exact period of a simple pendulum at amplitude theta0 using the
 * elliptic-integral formula: T = 4 * sqrt(L/g) * K(sin(theta0 / 2)).
 */
export function exactLargeAnglePeriod(
  theta0: number,
  L: number,
  g: number = g_SI,
): number {
  const k = Math.sin(theta0 / 2);
  return 4 * Math.sqrt(L / g) * completeEllipticK(k);
}
