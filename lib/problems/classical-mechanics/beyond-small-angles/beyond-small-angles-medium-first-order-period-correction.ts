/**
 * MEDIUM — First-order period correction for a large-angle pendulum.
 *
 * The period of a pendulum at amplitude θ₀ can be expanded as a power series
 * in θ₀:
 *
 *   T(θ₀) = T₀ · (1 + θ₀²/16 + 11θ₀⁴/3072 + …)
 *
 * where T₀ = 2π√(L/g) is the small-angle period.
 *
 * Given L = 1.5 m and θ₀ = 0.8 rad (≈ 45.8°), find:
 *   1. T_small   — small-angle period T₀
 *   2. delta_T   — first-order correction Δ T = T₀ · θ₀²/16
 *   3. T_corr    — corrected period T₀ · (1 + θ₀²/16)
 *   4. T_series  — two-term series T₀ · (1 + θ₀²/16 + 11θ₀⁴/3072)
 *
 * The canonicalExpr for T_series uses the series directly (mathjs-parseable).
 * The solver also computes the exact elliptic value for cross-checking.
 * toleranceRel for T_series steps: 1e-4 (series accuracy vs. exact is 6.2e-5).
 */

import { smallAnglePeriod, exactLargeAnglePeriod } from "@/lib/physics/pendulum";

export const inputs: Record<string, { value: number; units: string }> = {
  theta_0: { value: 0.8, units: "rad" },
  L: { value: 1.5, units: "m" },
  g: { value: 9.80665, units: "m/s²" },
};

export function solve(): Record<string, number> {
  const { theta_0, L, g } = {
    theta_0: inputs.theta_0.value,
    L: inputs.L.value,
    g: inputs.g.value,
  };

  // Step 1: small-angle period
  const T_small = smallAnglePeriod(L, g);

  // Step 2: first-order correction term
  const delta_T = T_small * (theta_0 ** 2 / 16);

  // Step 3: first-order corrected period
  const T_corr = T_small + delta_T;

  // Step 4: two-term series (includes fourth-order correction)
  const T_series = T_small * (1 + theta_0 ** 2 / 16 + (11 * theta_0 ** 4) / 3072);

  // Cross-check with exact elliptic result
  const T_exact = exactLargeAnglePeriod(theta_0, L, g);

  return { T_small, delta_T, T_corr, T_series, T_exact };
}
