/**
 * HARD — Underdamped free oscillator displacement and decay.
 *
 * A 1 kg mass on a spring (k = 25 N/m) experiences damping b = 2 N·s/m.
 * It is released from x₀ = 0.3 m with zero initial velocity.
 *
 * Find:
 *   1. omega0  — natural angular frequency sqrt(k/m)        (rad/s)
 *   2. gamma   — damping coefficient b/m                     (s⁻¹)
 *   3. omegaD  — damped angular frequency sqrt(ω₀²−γ²/4)   (rad/s)
 *   4. x_at_t  — displacement at t = 1.5 s                  (m)
 *   5. tau     — decay time constant 2/γ                     (s)
 *
 * Uses dampedFree from damped-oscillator.ts.
 */

import { dampedFree } from "@/lib/physics/damped-oscillator";

export const inputs: Record<string, { value: number; units: string }> = {
  k: { value: 25, units: "N/m" },
  m: { value: 1, units: "kg" },
  b: { value: 2, units: "N·s/m" },
  x0: { value: 0.3, units: "m" },
  t: { value: 1.5, units: "s" },
};

export function solve(): Record<string, number> {
  const k = inputs.k.value;
  const m = inputs.m.value;
  const b = inputs.b.value;
  const x0 = inputs.x0.value;
  const t = inputs.t.value;

  // Step 1: natural angular frequency
  const omega0 = Math.sqrt(k / m);

  // Step 2: damping coefficient
  const gamma = b / m;

  // Step 3: damped angular frequency (underdamped: ω₀² > γ²/4)
  const omegaD = Math.sqrt(omega0 * omega0 - (gamma * gamma) / 4);

  // Step 4: displacement at time t using library
  const x_at_t = dampedFree(t, x0, { omega0, gamma });

  // Step 5: amplitude decay time constant
  const tau = 2 / gamma;

  return { omega0, gamma, omegaD, x_at_t, tau };
}
