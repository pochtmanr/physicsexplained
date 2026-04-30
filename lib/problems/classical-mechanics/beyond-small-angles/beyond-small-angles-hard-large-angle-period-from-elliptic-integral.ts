/**
 * HARD — Exact large-angle period via the complete elliptic integral K(k).
 *
 * For a pendulum of length L released from rest at amplitude θ₀, the exact
 * period is:
 *
 *   T = 4√(L/g) · K(sin(θ₀/2))
 *
 * where K is the complete elliptic integral of the first kind.
 *
 * Given L = 2.0 m and θ₀ = 1.2 rad (≈ 68.8°), find:
 *   1. k          — elliptic modulus  k = sin(θ₀/2)
 *   2. T_small    — small-angle period T₀ = 2π√(L/g)
 *   3. T_exact    — exact period via K(k)
 *   4. ratio      — T_exact / T_small  (> 1, shows period stretching)
 *
 * NOTE on canonicalExpr:
 *   mathjs has no built-in elliptic_K.  The registry uses the two-term series
 *   expansion for T_exact:
 *     (2*PI*sqrt(L/g)) * (1 + theta_0^2/16 + 11*theta_0^4/3072)
 *   which matches the true elliptic value to within 0.072 % at θ₀ = 1.2 rad.
 *   toleranceRel is set to 1e-3 for the T_exact and ratio steps.
 *
 *   The solver computes the genuine elliptic-integral result via
 *   exactLargeAnglePeriod(); only the registry's canonicalExpr uses the series.
 */

import {
  smallAnglePeriod,
  exactLargeAnglePeriod,
} from "@/lib/physics/pendulum";

export const inputs: Record<string, { value: number; units: string }> = {
  theta_0: { value: 1.2, units: "rad" },
  L: { value: 2.0, units: "m" },
  g: { value: 9.80665, units: "m/s²" },
};

export function solve(): Record<string, number> {
  const { theta_0, L, g } = {
    theta_0: inputs.theta_0.value,
    L: inputs.L.value,
    g: inputs.g.value,
  };

  // Step 1: elliptic modulus
  const k = Math.sin(theta_0 / 2);

  // Step 2: small-angle period
  const T_small = smallAnglePeriod(L, g);

  // Step 3: exact period via elliptic integral
  const T_exact = exactLargeAnglePeriod(theta_0, L, g);

  // Step 4: ratio T_exact / T_small
  const ratio = T_exact / T_small;

  return { k, T_small, T_exact, ratio };
}
