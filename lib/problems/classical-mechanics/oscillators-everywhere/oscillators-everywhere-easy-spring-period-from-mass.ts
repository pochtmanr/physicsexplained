/**
 * EASY — Spring period from mass and spring constant.
 *
 * A 0.5 kg block hangs on a spring with k = 200 N/m.
 * Find the angular frequency ω and the period T of oscillation.
 *
 * Steps:
 *   1. omega = sqrt(k / m)            — angular frequency (rad/s)
 *   2. T = 2 * PI / omega             — period (s)
 *
 * Uses smallAngleOmega from pendulum.ts: omega = sqrt(g / L).
 * Here we substitute effective "g" → k/m·L so that omega = sqrt(k/m).
 * We call smallAngleOmega(1, k/m) which returns sqrt((k/m) / 1) = sqrt(k/m).
 */

import { smallAngleOmega } from "@/lib/physics/pendulum";

export const inputs: Record<string, { value: number; units: string }> = {
  k: { value: 200, units: "N/m" },
  m: { value: 0.5, units: "kg" },
};

export function solve(): Record<string, number> {
  const k = inputs.k.value;
  const m = inputs.m.value;

  // Step 1: omega = sqrt(k/m)
  // smallAngleOmega(L, g) = sqrt(g/L). Setting L=1, g=k/m gives sqrt(k/m).
  const omega = smallAngleOmega(1, k / m);

  // Step 2: T = 2π / ω
  const T = (2 * Math.PI) / omega;

  return { omega, T };
}
