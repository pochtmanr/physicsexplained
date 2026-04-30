/**
 * MEDIUM — Length from period.
 *
 * A grandfather clock requires a pendulum with period T = 3.0 s.
 * Given g = 9.80665 m/s², find the required pendulum length L.
 *
 * Derivation: T = 2*PI*sqrt(L/g)  →  L = g*(T/(2*PI))²
 *
 * Steps:
 *   1. tau = T / (2 * PI)          — normalised period
 *   2. L   = g * tau * tau         — required length
 */

import { smallAnglePeriod } from "@/lib/physics/pendulum";

export const inputs: Record<string, { value: number; units: string }> = {
  T: { value: 3.0, units: "s" },
  g: { value: 9.80665, units: "m/s²" },
};

export function solve(): Record<string, number> {
  const T = inputs.T.value;
  const g = inputs.g.value;

  const tau = T / (2 * Math.PI);
  const L = g * tau * tau;

  // Verify by forward-computing the period with the derived L.
  const T_check = smallAnglePeriod(L, g);

  return { tau, L, T_check };
}
