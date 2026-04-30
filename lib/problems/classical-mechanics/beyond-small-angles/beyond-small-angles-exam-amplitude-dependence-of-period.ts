/**
 * EXAM — Amplitude dependence of the pendulum period at very large swing.
 *
 * A clock pendulum of length L = 1.0 m is pulled to θ₀ = 1.4 rad (≈ 80.2°)
 * and released.  The small-angle formula predicts T₀ = 2π√(L/g).
 *
 * Find:
 *   1. T_small     — small-angle period T₀
 *   2. T_exact     — true period via elliptic integral K(sin(θ₀/2))
 *   3. pct_stretch — percentage by which the true period exceeds T₀
 *                    (T_exact − T_small) / T_small × 100
 *   4. n_cycles    — after how many cycles does the large-angle pendulum
 *                    lag the small-angle oscillator by a full period T_small?
 *                    n_cycles = T_small / (T_exact − T_small)
 *
 * This is an exam-level problem because it combines the elliptic integral
 * formula, the interpretation of isochronism failure, and a derived quantity
 * (phase lag expressed in cycle count).
 *
 * NOTE on canonicalExpr:
 *   The registry uses the two-term series for T_exact:
 *     (2*PI*sqrt(L/g)) * (1 + theta_0^2/16 + 11*theta_0^4/3072)
 *   At θ₀ = 1.4 rad the series error is 0.18 % vs. the exact elliptic value.
 *   toleranceRel is set to 5e-3 for T_exact and derived steps.
 *
 *   The solver uses exactLargeAnglePeriod() (true elliptic integral).
 *   The registry canonicalExpr for pct_stretch and n_cycles is derived from
 *   the series-T_exact, so they inherit the same 5e-3 tolerance.
 */

import {
  smallAnglePeriod,
  exactLargeAnglePeriod,
} from "@/lib/physics/pendulum";

export const inputs: Record<string, { value: number; units: string }> = {
  theta_0: { value: 1.4, units: "rad" },
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

  // Step 3: percentage by which T_exact exceeds T_small
  const pct_stretch = ((T_exact - T_small) / T_small) * 100;

  // Step 4: number of cycles until the large-angle pendulum lags by one full T_small
  const n_cycles = T_small / (T_exact - T_small);

  return { T_small, T_exact, pct_stretch, n_cycles };
}
