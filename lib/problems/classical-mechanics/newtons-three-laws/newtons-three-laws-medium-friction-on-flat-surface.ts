/**
 * MEDIUM — Net force and acceleration with kinetic friction on a flat surface.
 *
 * A 12 kg crate is pushed along a horizontal floor with an applied force of
 * 80 N. The coefficient of kinetic friction between the crate and the floor is
 * 0.35. Find the friction force, the net force, and the resulting acceleration.
 *
 * Steps:
 *   1. F_normal = m * g                        (normal force on flat surface)
 *   2. F_friction = mu_k * F_normal             (kinetic friction)
 *   3. F_net = F_applied - F_friction           (net force along motion)
 *   4. a = F_net / m                            (Newton's second law)
 */

import { acceleration } from "@/lib/physics/newton";
import { G } from "@/lib/physics/friction";

export const inputs: Record<string, { value: number; units: string }> = {
  m: { value: 12, units: "kg" },
  F_applied: { value: 80, units: "N" },
  mu_k: { value: 0.35, units: "" },
  g: { value: G, units: "m/s²" },
};

export function solve(): Record<string, number> {
  const m = inputs.m.value;
  const F_applied = inputs.F_applied.value;
  const mu_k = inputs.mu_k.value;
  const g = inputs.g.value;

  // Step 1: normal force on a flat surface equals weight
  const F_normal = m * g;

  // Step 2: kinetic friction force
  const F_friction = mu_k * F_normal;

  // Step 3: net force
  const F_net = F_applied - F_friction;

  // Step 4: acceleration via Newton's second law
  const a = acceleration(F_net, m);

  return { F_normal, F_friction, F_net, a };
}
