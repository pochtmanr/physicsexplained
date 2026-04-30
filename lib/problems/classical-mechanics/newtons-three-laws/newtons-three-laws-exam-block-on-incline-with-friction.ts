/**
 * EXAM — Block sliding down an incline with kinetic friction.
 *
 * A 15 kg block is released from rest on a 35° ramp. The coefficient of
 * kinetic friction between the block and the ramp is 0.20. Find:
 *   1. The component of gravity along the incline (driving force)
 *   2. The normal force from the ramp surface
 *   3. The kinetic friction force (opposing downhill motion)
 *   4. The net force along the incline
 *   5. The acceleration down the ramp
 *
 * Uses slideAcceleration() from friction.ts which encodes
 *   a = g (sinθ − μ_k cosθ)
 *
 * Steps:
 *   1. theta_rad = theta_deg * pi / 180          (convert angle)
 *   2. F_gravity_parallel = m * g * sin(theta)   (gravity component along slope)
 *   3. F_normal = m * g * cos(theta)              (normal force)
 *   4. F_friction = mu_k * F_normal               (kinetic friction)
 *   5. F_net = F_gravity_parallel - F_friction    (net force down slope)
 *   6. a = slideAcceleration(theta, mu_k, g)      (acceleration via lib)
 */

import { acceleration } from "@/lib/physics/newton";
import { G, slideAcceleration } from "@/lib/physics/friction";

export const inputs: Record<string, { value: number; units: string }> = {
  m: { value: 15, units: "kg" },
  theta_deg: { value: 35, units: "°" },
  mu_k: { value: 0.2, units: "" },
  g: { value: G, units: "m/s²" },
};

export function solve(): Record<string, number> {
  const m = inputs.m.value;
  const theta_deg = inputs.theta_deg.value;
  const mu_k = inputs.mu_k.value;
  const g = inputs.g.value;

  // Step 1: convert angle to radians
  const theta_rad = (theta_deg * Math.PI) / 180;

  // Step 2: gravity component along the incline (parallel, downhill)
  const F_gravity_parallel = m * g * Math.sin(theta_rad);

  // Step 3: normal force perpendicular to incline
  const F_normal = m * g * Math.cos(theta_rad);

  // Step 4: kinetic friction force (opposes motion, acts uphill)
  const F_friction = mu_k * F_normal;

  // Step 5: net force along the incline
  const F_net = F_gravity_parallel - F_friction;

  // Step 6: acceleration — use slideAcceleration from friction.ts which
  // computes g*(sinθ − μ_k cosθ) directly; also cross-check with F_net/m.
  const a = slideAcceleration(theta_rad, mu_k, g);
  const a_check = acceleration(F_net, m); // should match a

  return {
    theta_rad,
    F_gravity_parallel,
    F_normal,
    F_friction,
    F_net,
    a,
    a_check,
  };
}
