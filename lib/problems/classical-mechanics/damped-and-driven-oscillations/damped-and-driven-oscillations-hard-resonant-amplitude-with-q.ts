/**
 * HARD — Steady-state amplitude at resonance and at off-resonance frequency.
 *
 * A driven oscillator (mass m = 0.5 kg) has ω₀ = 10 rad/s, Q = 8,
 * and is driven by a force of peak amplitude F_0 = 4 N.
 * Find the steady-state amplitude at:
 *   (a) exact resonance  ω_d = ω₀
 *   (b) off-resonance    ω_d = 6 rad/s
 * and the ratio A_res / A_off.
 *
 * Physics:
 *   Q = ω₀ / γ  ⇒  γ = ω₀ / Q
 *   Driven amplitude: A(ω_d) = (F_0/m) / sqrt((ω₀²−ω_d²)² + (γ ω_d)²)
 *   At resonance ω_d = ω₀:  denominator = γ ω₀ ⇒ A_res = (F_0/m) / (γ ω₀) = Q·F_0/(m·ω₀²)
 *
 * Note: drivenAmplitude(omegaD, F0, params) in the lib takes F0 as (force amplitude / m)
 * when the caller passes F_0/m.  We divide explicitly so the lib returns metres.
 *
 * Steps:
 *   1. gamma   = omega_0 / Q
 *   2. F_per_m = F_0 / m
 *   3. A_res   = F_per_m / (gamma * omega_0)
 *   4. A_off   = drivenAmplitude at omega_d = 6 rad/s
 *   5. ratio   = A_res / A_off              ← final answer
 */

import { drivenAmplitude, qualityFactor } from "@/lib/physics/damped-oscillator";

export const inputs: Record<string, { value: number; units: string }> = {
  omega_0: { value: 10,  units: "rad/s" },
  Q_given: { value: 8,   units: "" },
  F_0:     { value: 4,   units: "N" },
  m:       { value: 0.5, units: "kg" },
  omega_d_off: { value: 6, units: "rad/s" },
};

export function solve(): Record<string, number> {
  const omega_0    = inputs.omega_0.value;
  const Q_given    = inputs.Q_given.value;
  const F_0        = inputs.F_0.value;
  const m          = inputs.m.value;
  const omega_d_off = inputs.omega_d_off.value;

  // Step 1: recover damping coefficient from Q
  const gamma = omega_0 / Q_given;

  // Verify Q round-trips
  const Q_check = qualityFactor({ omega0: omega_0, gamma });

  // Step 2: specific force (force per unit mass) passed to the lib
  const F_per_m = F_0 / m;

  // Step 3: resonant amplitude (analytical, ω_d = ω₀)
  // Denominator at resonance: sqrt(0 + (γ·ω₀)²) = γ·ω₀
  const A_res = F_per_m / (gamma * omega_0);

  // Cross-check with library at exact resonance
  const A_res_lib = drivenAmplitude(omega_0, F_per_m, { omega0: omega_0, gamma });

  // Step 4: off-resonance amplitude via library
  const A_off = drivenAmplitude(omega_d_off, F_per_m, { omega0: omega_0, gamma });

  // Step 5: ratio
  const ratio = A_res / A_off;

  return { gamma, Q_check, F_per_m, A_res, A_res_lib, A_off, ratio };
}
