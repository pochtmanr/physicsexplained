/**
 * HARD — Energy-amplitude relation.
 *
 * A pendulum bob of mass m = 0.5 kg hangs on a string of length L = 0.8 m.
 * It is released from rest at angle θ₀ = 0.15 rad (small-angle regime).
 * Find:
 *   1. h      — maximum height gained above the bottom
 *   2. PE_max — maximum gravitational potential energy (taking bottom = 0)
 *   3. KE_max — maximum kinetic energy (= PE_max by energy conservation)
 *   4. v_max  — maximum speed at the bottom of the swing
 *
 * The energy analysis uses E = m*g*h = m*g*L*(1 - cos(θ₀)).
 */

import { smallAnglePeriod } from "@/lib/physics/pendulum";

export const inputs: Record<string, { value: number; units: string }> = {
  m: { value: 0.5, units: "kg" },
  L: { value: 0.8, units: "m" },
  g: { value: 9.80665, units: "m/s²" },
  theta_0: { value: 0.15, units: "rad" },
};

export function solve(): Record<string, number> {
  const m = inputs.m.value;
  const L = inputs.L.value;
  const g = inputs.g.value;
  const theta_0 = inputs.theta_0.value;

  // Step 1: height at amplitude
  const h = L * (1 - Math.cos(theta_0));

  // Step 2: maximum potential energy
  const PE_max = m * g * h;

  // Step 3: maximum kinetic energy (energy conservation: KE_max = PE_max)
  const KE_max = PE_max;

  // Step 4: v_max from (1/2)*m*v² = KE_max
  const v_max = Math.sqrt(2 * KE_max / m);

  // Period (bonus intermediate for completeness)
  const T = smallAnglePeriod(L, g);

  return { h, PE_max, KE_max, v_max, T };
}
