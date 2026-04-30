/**
 * HARD — Total stopping distance with reaction time.
 *
 * A driver travelling at v₀ = 30 m/s reacts in t_r = 0.8 s before braking.
 * The brakes decelerate the car at a = -6 m/s² (magnitude 6 m/s²).
 * Find:
 *   1. d_react  — distance covered during reaction time (constant velocity)
 *   2. t_brake  — time to reach v = 0 under braking
 *   3. d_brake  — braking distance (from v₀ to 0)
 *   4. d_total  — total stopping distance
 *
 * Uses coastWithFriction from newton.ts for the braking phase.
 */

import { coastWithFriction } from "@/lib/physics/newton";

// g used internally by coastWithFriction; we parameterise mu so that
// mu * g = deceleration magnitude.
const G = 9.80665;

export const inputs: Record<string, { value: number; units: string }> = {
  v_0: { value: 30, units: "m/s" },
  t_r: { value: 0.8, units: "s" },
  a_brake: { value: 6, units: "m/s²" }, // magnitude; direction is opposite v
};

export function solve(): Record<string, number> {
  const { v_0, t_r, a_brake } = {
    v_0: inputs.v_0.value,
    t_r: inputs.t_r.value,
    a_brake: inputs.a_brake.value,
  };

  // Step 1: reaction-time distance (constant v)
  const d_react = v_0 * t_r;

  // Step 2: time to stop under braking  (v = v_0 - a_brake*t → t_brake = v_0/a_brake)
  const t_brake = v_0 / a_brake;

  // Step 3: braking distance — use coastWithFriction
  // mu = a_brake / g
  const mu = a_brake / G;
  const stopped = coastWithFriction(t_brake, v_0, mu, G);
  const d_brake = stopped.x;

  // Step 4: total distance
  const d_total = d_react + d_brake;

  return { d_react, t_brake, d_brake, d_total, mu };
}
