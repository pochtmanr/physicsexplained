/**
 * EXAM — Full driven-oscillator analysis: amplitude and phase across frequencies.
 *
 * A mechanical system has m = 2 kg, ω₀ = 8 rad/s, γ = 2 rad/s.
 * It is driven by F(t) = F_0 cos(ω_d t) with F_0 = 20 N.
 *
 * Tasks:
 *   (a) Q factor and damping regime identification.
 *   (b) Steady-state amplitude at driving frequencies
 *       ω_d = 2, ω_d = ω₀ (resonance), ω_d = 14 rad/s.
 *   (c) Phase shift at each driving frequency:
 *       φ(ω_d) = atan2(γ ω_d,  ω₀² − ω_d²)
 *       (phase by which displacement lags the driving force)
 *   (d) Ratio of resonant amplitude to static amplitude (ω_d → 0).
 *       A_static = F_0 / (m ω₀²) = F_0_per_m / ω₀²
 *
 * Note: drivenAmplitude in the lib takes F0 as the specific force (F_0/m).
 *
 * Steps:
 *   1. Q          = omega_0 / gamma
 *   2. F_per_m    = F_0 / m
 *   3. A_low      = drivenAmplitude(omega_d_low, F_per_m, params)
 *   4. A_res      = drivenAmplitude(omega_0, F_per_m, params)
 *   5. A_high     = drivenAmplitude(omega_d_high, F_per_m, params)
 *   6. phi_low    = atan2(gamma * omega_d_low,  omega_0^2 - omega_d_low^2)
 *   7. phi_res    = atan2(gamma * omega_0,       0)   = pi/2
 *   8. phi_high   = atan2(gamma * omega_d_high, omega_0^2 - omega_d_high^2)
 *   9. A_static   = F_per_m / omega_0^2
 *  10. Q_factor_ratio = A_res / A_static   ← final answer (should ≈ Q)
 */

import { drivenAmplitude, qualityFactor } from "@/lib/physics/damped-oscillator";

export const inputs: Record<string, { value: number; units: string }> = {
  m:           { value: 2,  units: "kg" },
  omega_0:     { value: 8,  units: "rad/s" },
  gamma:       { value: 2,  units: "rad/s" },
  F_0:         { value: 20, units: "N" },
  omega_d_low:  { value: 2,  units: "rad/s" },
  omega_d_high: { value: 14, units: "rad/s" },
};

export function solve(): Record<string, number> {
  const m            = inputs.m.value;
  const omega_0      = inputs.omega_0.value;
  const gamma        = inputs.gamma.value;
  const F_0          = inputs.F_0.value;
  const omega_d_low  = inputs.omega_d_low.value;
  const omega_d_high = inputs.omega_d_high.value;

  const params = { omega0: omega_0, gamma };

  // Step 1: Q factor
  const Q = qualityFactor(params);

  // Step 2: specific force
  const F_per_m = F_0 / m;

  // Step 3: amplitude at low driving frequency
  const A_low = drivenAmplitude(omega_d_low, F_per_m, params);

  // Step 4: amplitude at resonance
  const A_res = drivenAmplitude(omega_0, F_per_m, params);

  // Step 5: amplitude at high driving frequency
  const A_high = drivenAmplitude(omega_d_high, F_per_m, params);

  // Step 6: phase at low frequency  φ = atan2(γωd, ω₀² − ωd²)
  const phi_low = Math.atan2(
    gamma * omega_d_low,
    omega_0 * omega_0 - omega_d_low * omega_d_low,
  );

  // Step 7: phase at resonance (ω₀² − ω₀² = 0) → π/2
  const phi_res = Math.atan2(gamma * omega_0, 0);

  // Step 8: phase at high frequency
  const phi_high = Math.atan2(
    gamma * omega_d_high,
    omega_0 * omega_0 - omega_d_high * omega_d_high,
  );

  // Step 9: static amplitude (ωd → 0 limit: denominator → ω₀²)
  const A_static = F_per_m / (omega_0 * omega_0);

  // Step 10: ratio A_res / A_static — for low damping this ≈ Q
  const Q_factor_ratio = A_res / A_static;

  return {
    Q,
    F_per_m,
    A_low,
    A_res,
    A_high,
    phi_low,
    phi_res,
    phi_high,
    A_static,
    Q_factor_ratio,
  };
}
