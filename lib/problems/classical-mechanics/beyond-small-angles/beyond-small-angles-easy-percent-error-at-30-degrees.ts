/**
 * EASY — Percent error of the small-angle approximation at θ₀ = 30°.
 *
 * The small-angle period is T₀ = 2π√(L/g).
 * The exact period uses the elliptic integral:
 *   T_exact = 4√(L/g) · K(sin(θ₀/2))
 *
 * At θ₀ = 30° (≈ 0.5236 rad) the small-angle approximation under-predicts
 * the period by about 1.71 %.
 *
 * Steps:
 *   1. T_small = 2π√(L/g)          — small-angle period
 *   2. T_exact = 4√(L/g)·K(sin(θ₀/2))  — exact period via elliptic integral
 *   3. pct_err = (T_exact − T_small) / T_exact × 100   — percent error
 *
 * Canonical expression for the verifier uses the series expansion:
 *   pct_err ≈ (θ₀²/16 + 11θ₀⁴/3072) / (1 + θ₀²/16 + 11θ₀⁴/3072) × 100
 * which is accurate to < 0.003 % rel. error vs. the exact elliptic result
 * at θ₀ = π/6.  toleranceRel is set to 1e-4.
 */

import { smallAnglePeriod, exactLargeAnglePeriod } from "@/lib/physics/pendulum";

export const inputs: Record<string, { value: number; units: string }> = {
  theta_0: { value: Math.PI / 6, units: "rad" }, // 30°
  L: { value: 1.0, units: "m" },
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

  // Step 2: exact period (elliptic integral)
  const T_exact = exactLargeAnglePeriod(theta_0, L, g);

  // Step 3: percent error (positive: exact is always larger)
  const pct_err = ((T_exact - T_small) / T_exact) * 100;

  return { T_small, T_exact, pct_err };
}
