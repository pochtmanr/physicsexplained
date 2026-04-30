/**
 * EASY — Kinetic friction force on a flat horizontal surface.
 *
 * A wooden crate of mass m = 8 kg is being dragged at constant velocity across
 * a level floor. The coefficient of kinetic friction between crate and floor is
 * μk = 0.4. Find the normal force and the kinetic friction force acting on the
 * crate.
 *
 * Steps:
 *   1. F_N        = m * g           (normal force equals weight on flat surface)
 *   2. F_friction = mu_k * F_N      (Amontons' kinetic-friction law)
 *
 * Because velocity is constant, net force is zero: a = F_net / m = 0.
 * acceleration() from newton.ts is used to express this.
 */

import { acceleration } from "@/lib/physics/newton";
import { G } from "@/lib/physics/friction";

export const inputs: Record<string, { value: number; units: string }> = {
  m:     { value: 8,   units: "kg" },
  mu_k:  { value: 0.4, units: "" },
  g:     { value: G,   units: "m/s²" },
};

export function solve(): Record<string, number> {
  const m    = inputs.m.value;
  const mu_k = inputs.mu_k.value;
  const g    = inputs.g.value;

  // Step 1: normal force equals weight on a horizontal surface
  const F_N = m * g;

  // Step 2: kinetic friction (Amontons — F_k = μk · N)
  const F_friction = mu_k * F_N;

  // Constant velocity → F_net = 0 → a = 0; confirms Newton's second law is satisfied.
  const a_net = acceleration(0, m); // = 0 by construction

  return { F_N, F_friction, a_net };
}
