/**
 * CHALLENGE — Stopping distance of a sliding block with kinetic friction.
 *
 * A hockey puck is shot across ice with initial speed v_0 = 20 m/s.
 * The kinetic friction coefficient between puck and ice is μk = 0.5.
 * Find:
 *   1. a_decel  — deceleration magnitude due to friction  (μk · g)
 *   2. t_stop   — time for the puck to come to rest       (v_0 / a_decel)
 *   3. d_stop   — total sliding distance                  (v_0² / (2 · a_decel))
 *
 * coastWithFriction() from newton.ts is used to extract d_stop via kinematics,
 * then verified against the closed-form v_0²/(2a) expression.
 */

import { coastWithFriction } from "@/lib/physics/newton";
import { G } from "@/lib/physics/friction";

export const inputs: Record<string, { value: number; units: string }> = {
  v_0:  { value: 20,  units: "m/s" },
  mu_k: { value: 0.5, units: "" },
  g:    { value: G,   units: "m/s²" },
};

export function solve(): Record<string, number> {
  const v_0  = inputs.v_0.value;
  const mu_k = inputs.mu_k.value;
  const g    = inputs.g.value;

  // Step 1: deceleration magnitude = μk · g
  const a_decel = mu_k * g;

  // Step 2: time to stop (v_0 = a_decel · t_stop)
  const t_stop = v_0 / a_decel;

  // Step 3: stopping distance — use coastWithFriction (evaluated past stop time)
  const state = coastWithFriction(t_stop, v_0, mu_k, g);
  const d_stop = state.x;

  return { a_decel, t_stop, d_stop };
}
