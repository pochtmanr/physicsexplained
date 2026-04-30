/**
 * CHALLENGE — Coupled pendulum normal-mode frequencies and beat period.
 *
 * Two identical pendulums of length L = 0.5 m are coupled by a spring
 * with constant k_c = 0.8 N/m. Each bob has mass m = 0.25 kg.
 * g = 9.80665 m/s².
 *
 * Find:
 *   1. omega0   — natural frequency of each uncoupled pendulum sqrt(g/L)  (rad/s)
 *   2. omegaC   — coupling frequency sqrt(2*k_c/m)                        (rad/s)
 *   3. omega1   — in-phase normal mode frequency (= omega0)                (rad/s)
 *   4. omega2   — anti-phase normal mode frequency sqrt(omega0²+omegaC²)  (rad/s)
 *   5. T_beat   — beat period 2π / (omega2 - omega1)                      (s)
 *   6. theta1_at_t — displacement of pendulum 1 at t = 3 s, A = 0.1 rad  (rad)
 *   7. theta2_at_t — displacement of pendulum 2 at t = 3 s                (rad)
 *
 * Uses coupledBeats and coupledMode2 from coupled-oscillator.ts.
 */

import { coupledBeats, coupledMode2 } from "@/lib/physics/coupled-oscillator";
import { g_SI } from "@/lib/physics/constants";

export const inputs: Record<string, { value: number; units: string }> = {
  L: { value: 0.5, units: "m" },
  k_c: { value: 0.8, units: "N/m" },
  m: { value: 0.25, units: "kg" },
  A: { value: 0.1, units: "rad" },
  t: { value: 3, units: "s" },
  g: { value: g_SI, units: "m/s²" },
};

export function solve(): Record<string, number> {
  const L = inputs.L.value;
  const k_c = inputs.k_c.value;
  const m = inputs.m.value;
  const A = inputs.A.value;
  const t = inputs.t.value;
  const g = inputs.g.value;

  // Step 1: uncoupled pendulum frequency
  const omega0 = Math.sqrt(g / L);

  // Step 2: coupling frequency
  const omegaC = Math.sqrt((2 * k_c) / m);

  // Step 3: in-phase mode (= omega0, spring doesn't stretch)
  const omega1 = omega0;

  // Step 4: anti-phase mode (spring adds extra restoring force)
  const omega2 = Math.sqrt(omega0 * omega0 + omegaC * omegaC);

  // Step 5: beat period
  const T_beat = (2 * Math.PI) / (omega2 - omega1);

  // Step 6 & 7: beat solution (theta1=A, theta2=0, both at rest initially)
  const params = { omega0, omegaC };
  const { theta1: theta1_at_t, theta2: theta2_at_t } = coupledBeats(t, A, params);

  // Cross-check anti-phase mode at t for reference
  const antiPhase = coupledMode2(t, A, params);

  return {
    omega0,
    omegaC,
    omega1,
    omega2,
    T_beat,
    theta1_at_t,
    theta2_at_t,
    antiPhase_theta1: antiPhase.theta1,
    antiPhase_theta2: antiPhase.theta2,
  };
}
