/**
 * HARD — Apparent weight in an accelerating elevator.
 *
 * A 70 kg person stands on a scale inside an elevator. The elevator
 * accelerates upward at 2.5 m/s². Find:
 *   1. The person's true weight (gravitational force)
 *   2. The net upward force needed to produce that acceleration
 *   3. The normal force from the scale (apparent weight)
 *
 * Steps:
 *   1. W = m * g                    (true weight)
 *   2. F_net = m * a_elevator        (net force from Newton's second law)
 *   3. N = W + F_net                 (normal force; scale reads this value)
 */

import { acceleration } from "@/lib/physics/newton";
import { G } from "@/lib/physics/friction";

export const inputs: Record<string, { value: number; units: string }> = {
  m: { value: 70, units: "kg" },
  a_elevator: { value: 2.5, units: "m/s²" },
  g: { value: G, units: "m/s²" },
};

export function solve(): Record<string, number> {
  const m = inputs.m.value;
  const a_elevator = inputs.a_elevator.value;
  const g = inputs.g.value;

  // Step 1: true weight
  const W = m * g;

  // Step 2: net force required for upward acceleration
  // acceleration() is just F/m; here we use it in reverse: F = m*a
  // We call it with F = m*a_elevator, mass = 1 to get the scaled value,
  // or simply compute directly using the library's underlying formula.
  const F_net = acceleration(m * a_elevator, 1); // = m * a_elevator

  // Step 3: apparent weight (normal force from the scale)
  const N = W + F_net;

  return { W, F_net, N };
}
