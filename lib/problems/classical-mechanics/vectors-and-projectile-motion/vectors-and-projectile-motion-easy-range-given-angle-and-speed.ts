/**
 * EASY — Horizontal range given launch angle and speed.
 *
 * A ball is kicked from flat ground at 20 m/s and 30° above horizontal.
 * Find: vx, vy, time of flight, and horizontal range.
 *
 * Steps:
 *   1. vx  = v_0 * cos(theta)
 *   2. vy  = v_0 * sin(theta)
 *   3. T   = 2 * v_0 * sin(theta) / g
 *   4. R   = v_0^2 * sin(2*theta) / g
 */

import {
  G_EARTH,
  timeOfFlight,
  range,
} from "@/lib/physics/projectile";

export const inputs: Record<string, { value: number; units: string }> = {
  v_0:   { value: 20,          units: "m/s" },
  theta: { value: Math.PI / 6, units: "rad" }, // 30°
  g:     { value: G_EARTH,     units: "m/s²" },
};

export function solve(): Record<string, number> {
  const v_0   = inputs.v_0.value;
  const theta = inputs.theta.value;
  const g     = inputs.g.value;

  const vx       = v_0 * Math.cos(theta);
  const vy       = v_0 * Math.sin(theta);
  const t_flight = timeOfFlight(v_0, theta, g);
  const R        = range(v_0, theta, g);

  return { vx, vy, t_flight, R };
}
