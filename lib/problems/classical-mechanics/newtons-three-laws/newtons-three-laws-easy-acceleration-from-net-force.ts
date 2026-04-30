/**
 * EASY — Acceleration from a single net force.
 *
 * A 5 kg box on a frictionless surface is pushed with a single horizontal
 * force of 30 N. Find the acceleration.
 *
 * Steps:
 *   1. a = F_net / m   (Newton's second law)
 */

import { acceleration } from "@/lib/physics/newton";

export const inputs: Record<string, { value: number; units: string }> = {
  F_net: { value: 30, units: "N" },
  m: { value: 5, units: "kg" },
};

export function solve(): Record<string, number> {
  const F_net = inputs.F_net.value;
  const m = inputs.m.value;

  const a = acceleration(F_net, m);

  return { a };
}
