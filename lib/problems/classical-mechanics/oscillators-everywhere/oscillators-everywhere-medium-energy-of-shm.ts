/**
 * MEDIUM — Total mechanical energy of a mass-spring oscillator.
 *
 * A spring with k = 80 N/m oscillates with amplitude A = 0.15 m.
 * Find the total mechanical energy E of the system.
 *
 * Steps:
 *   1. E = (1/2) * k * A^2            — SHM energy (J)
 *   2. v_max = sqrt(2 * E / m)        — maximum speed at x = 0 (m/s)
 *   3. omega = sqrt(k / m)            — angular frequency (rad/s)
 *
 * Uses smallAngleOmega(1, k/m) to compute ω = sqrt(k/m) from pendulum.ts.
 */

import { smallAngleOmega } from "@/lib/physics/pendulum";

export const inputs: Record<string, { value: number; units: string }> = {
  k: { value: 80, units: "N/m" },
  A: { value: 0.15, units: "m" },
  m: { value: 2.0, units: "kg" },
};

export function solve(): Record<string, number> {
  const k = inputs.k.value;
  const A = inputs.A.value;
  const m = inputs.m.value;

  // Step 1: total energy E = ½ k A²
  const E = 0.5 * k * A * A;

  // Step 2: maximum speed at equilibrium (all potential → kinetic): ½mv²_max = E
  const v_max = Math.sqrt((2 * E) / m);

  // Step 3: angular frequency using pendulum lib (omega = sqrt(k/m))
  const omega = smallAngleOmega(1, k / m);

  return { E, v_max, omega };
}
