/**
 * MEDIUM — Net acceleration of a block sliding down a rough inclined plane.
 *
 * A 5 kg block is released from rest on a ramp inclined at θ = π/6 rad (30°).
 * The kinetic friction coefficient between block and ramp is μk = 0.25.
 * Find: the normal force, the kinetic friction force, the net force along the
 * slope, and the resulting acceleration.
 *
 * Steps:
 *   1. F_N        = m * g * cos(theta)              (component perpendicular to slope)
 *   2. F_friction = mu_k * F_N                      (kinetic friction opposing motion)
 *   3. F_net      = m * g * sin(theta) - F_friction (net force down the slope)
 *   4. a          = F_net / m                       (Newton's second law)
 *
 * slideAcceleration() from friction.ts used to cross-check step 4.
 */

import { acceleration } from "@/lib/physics/newton";
import { G, slideAcceleration } from "@/lib/physics/friction";

export const inputs: Record<string, { value: number; units: string }> = {
  m:     { value: 5,                  units: "kg" },
  theta: { value: Math.PI / 6,        units: "rad" },
  mu_k:  { value: 0.25,               units: "" },
  g:     { value: G,                  units: "m/s²" },
};

export function solve(): Record<string, number> {
  const m     = inputs.m.value;
  const theta = inputs.theta.value;
  const mu_k  = inputs.mu_k.value;
  const g     = inputs.g.value;

  // Step 1: normal force (perpendicular component of weight)
  const F_N = m * g * Math.cos(theta);

  // Step 2: kinetic friction force up the slope
  const F_friction = mu_k * F_N;

  // Step 3: net force down the slope
  const F_net = m * g * Math.sin(theta) - F_friction;

  // Step 4: Newton's second law → acceleration
  const a = acceleration(F_net, m);

  // Cross-check via the lib's slideAcceleration helper
  const a_slide = slideAcceleration(theta, mu_k, g);

  return { F_N, F_friction, F_net, a, a_slide };
}
