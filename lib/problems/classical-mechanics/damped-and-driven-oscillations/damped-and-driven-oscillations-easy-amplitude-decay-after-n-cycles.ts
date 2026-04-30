/**
 * EASY — Amplitude of a damped oscillator after n full cycles.
 *
 * An underdamped spring starts with amplitude A_0 = 0.20 m.
 * Damping coefficient γ = 0.4 rad/s, natural frequency ω₀ = 5 rad/s.
 * Find the amplitude envelope after n = 8 complete oscillations.
 *
 * The damped angular frequency ωd = sqrt(ω₀² − γ²/4).
 * Period of damped oscillation T_d = 2π / ωd.
 * After n cycles, time elapsed t = n * T_d.
 * Amplitude at that time: A = A_0 * exp(−γ * t / 2).
 *
 * Steps:
 *   1. omega_d  = sqrt(omega_0^2 - gamma^2 / 4)
 *   2. T_d      = 2 * pi / omega_d
 *   3. t_n      = n * T_d
 *   4. A        = A_0 * exp(-gamma * t_n / 2)   ← final answer
 */

import { dampedFree } from "@/lib/physics/damped-oscillator";

export const inputs: Record<string, { value: number; units: string }> = {
  A_0:   { value: 0.20, units: "m" },
  gamma: { value: 0.4,  units: "rad/s" },
  omega_0: { value: 5,  units: "rad/s" },
  n:     { value: 8,    units: "" },
};

export function solve(): Record<string, number> {
  const A_0    = inputs.A_0.value;
  const gamma  = inputs.gamma.value;
  const omega_0 = inputs.omega_0.value;
  const n      = inputs.n.value;

  // Step 1: damped angular frequency
  const omega_d = Math.sqrt(omega_0 * omega_0 - (gamma * gamma) / 4);

  // Step 2: period of damped oscillation
  const T_d = (2 * Math.PI) / omega_d;

  // Step 3: time elapsed after n cycles
  const t_n = n * T_d;

  // Step 4: amplitude envelope A = A_0 * exp(-γ t / 2)
  // We verify via dampedFree at the same time (at cosine peak, position ≈ amplitude envelope)
  const A = A_0 * Math.exp((-gamma * t_n) / 2);

  // Cross-check with library — dampedFree gives x(t_n) with x0 = A_0,
  // at peak (multiple of period) the library value should match A.
  const x_check = dampedFree(t_n, A_0, { omega0: omega_0, gamma });

  return { omega_d, T_d, t_n, A, x_check };
}
