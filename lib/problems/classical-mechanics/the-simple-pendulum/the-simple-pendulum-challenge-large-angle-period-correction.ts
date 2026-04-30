/**
 * CHALLENGE — Large-angle period correction via elliptic integral.
 *
 * A pendulum of length L = 1.0 m is released from θ₀ = 0.6 rad (~34°).
 * This amplitude is large enough that the small-angle approximation
 * introduces a measurable error.
 *
 * Steps:
 *   1. T_small  — small-angle period (2*PI*sqrt(L/g))
 *   2. k        — elliptic modulus: sin(θ₀ / 2)
 *   3. K        — complete elliptic integral K(k) via AGM
 *   4. T_exact  — exact period: 4*sqrt(L/g)*K(k)
 *   5. delta    — fractional period error: (T_exact - T_small) / T_small
 */

import {
  smallAnglePeriod,
  exactLargeAnglePeriod,
} from "@/lib/physics/pendulum";
import { completeEllipticK } from "@/lib/physics/elliptic";

export const inputs: Record<string, { value: number; units: string }> = {
  L: { value: 1.0, units: "m" },
  g: { value: 9.80665, units: "m/s²" },
  theta_0: { value: 0.6, units: "rad" },
};

export function solve(): Record<string, number> {
  const L = inputs.L.value;
  const g = inputs.g.value;
  const theta_0 = inputs.theta_0.value;

  // Step 1: small-angle period
  const T_small = smallAnglePeriod(L, g);

  // Step 2: elliptic modulus
  const k = Math.sin(theta_0 / 2);

  // Step 3: complete elliptic integral
  const K = completeEllipticK(k);

  // Step 4: exact period
  const T_exact = exactLargeAnglePeriod(theta_0, L, g);

  // Step 5: fractional error introduced by small-angle approximation
  const delta = (T_exact - T_small) / T_small;

  return { T_small, k, K, T_exact, delta };
}
