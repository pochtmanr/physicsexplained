/**
 * EXAM — Determining g from two independent pendulum measurements.
 *
 * A physicist measures two pendulums at the same location:
 *   Pendulum 1: L₁ = 0.5 m, measured period T₁ = 1.4187 s
 *   Pendulum 2: L₂ = 2.0 m, measured period T₂ = 2.8375 s
 *
 * From each measurement compute g = L * (2*PI / T)².
 * Average the two estimates and compute the percentage discrepancy.
 *
 * Steps:
 *   1. g_1       — gravitational acceleration from pendulum 1
 *   2. g_2       — gravitational acceleration from pendulum 2
 *   3. g_avg     — mean estimate of g
 *   4. discrepancy — |g_1 - g_2| / g_avg  (dimensionless, fractional)
 */

import { smallAnglePeriod } from "@/lib/physics/pendulum";

export const inputs: Record<string, { value: number; units: string }> = {
  L_1: { value: 0.5, units: "m" },
  T_1: { value: 1.4187, units: "s" },
  L_2: { value: 2.0, units: "m" },
  T_2: { value: 2.8375, units: "s" },
};

export function solve(): Record<string, number> {
  const L_1 = inputs.L_1.value;
  const T_1 = inputs.T_1.value;
  const L_2 = inputs.L_2.value;
  const T_2 = inputs.T_2.value;

  // Step 1: g from pendulum 1  →  g = L * (2*PI / T)²
  const omega_1 = (2 * Math.PI) / T_1;
  const g_1 = L_1 * omega_1 * omega_1;

  // Step 2: g from pendulum 2
  const omega_2 = (2 * Math.PI) / T_2;
  const g_2 = L_2 * omega_2 * omega_2;

  // Step 3: average
  const g_avg = (g_1 + g_2) / 2;

  // Step 4: fractional discrepancy between the two estimates
  const discrepancy = Math.abs(g_1 - g_2) / g_avg;

  // Forward-check: predicted periods from g_avg
  const T_1_pred = smallAnglePeriod(L_1, g_avg);
  const T_2_pred = smallAnglePeriod(L_2, g_avg);

  return { omega_1, g_1, omega_2, g_2, g_avg, discrepancy, T_1_pred, T_2_pred };
}
