/**
 * EASY — Period from length.
 *
 * A simple pendulum of length L = 1.2 m swings at small angles
 * on Earth (g = 9.80665 m/s²). Find the period T.
 *
 * Steps:
 *   1. omega = sqrt(g / L)   — angular frequency
 *   2. T = 2 * PI / omega    — period
 */

import { smallAngleOmega, smallAnglePeriod } from "@/lib/physics/pendulum";

export const inputs: Record<string, { value: number; units: string }> = {
  L: { value: 1.2, units: "m" },
  g: { value: 9.80665, units: "m/s²" },
};

export function solve(): Record<string, number> {
  const L = inputs.L.value;
  const g = inputs.g.value;

  const omega = smallAngleOmega(L, g);
  const T = smallAnglePeriod(L, g);

  return { omega, T };
}
