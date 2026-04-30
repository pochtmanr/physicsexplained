/**
 * CHALLENGE — Complementary angles yield the same range.
 *
 * A cannon fires shells at 50 m/s. The gunner wants to hit a target 200 m away.
 * There are two launch angles that achieve this range: a low angle and a
 * high angle (complementary pair summing to 90°).
 *
 * Given the range formula R = v_0^2 * sin(2*theta) / g, the required
 * sin(2*theta) = R * g / v_0^2. Find both angles, then verify by computing
 * the actual range at each angle and the difference in time of flight.
 *
 * Steps:
 *   1. sin2theta = R_target * g / v_0^2
 *   2. theta_low = asin(sin2theta) / 2           (shallow trajectory)
 *   3. theta_high = pi/2 - theta_low             (steep trajectory)
 *   4. R_low  = v_0^2 * sin(2 * theta_low) / g  (should equal R_target)
 *   5. T_low  = 2 * v_0 * sin(theta_low) / g
 *   6. T_high = 2 * v_0 * sin(theta_high) / g
 *   7. delta_T = T_high - T_low                  (high arc stays airborne longer)
 */

import {
  G_EARTH,
  range,
  timeOfFlight,
} from "@/lib/physics/projectile";

export const inputs: Record<string, { value: number; units: string }> = {
  v_0:      { value: 50,      units: "m/s" },
  R_target: { value: 200,     units: "m"   },
  g:        { value: G_EARTH, units: "m/s²" },
};

export function solve(): Record<string, number> {
  const v_0      = inputs.v_0.value;
  const R_target = inputs.R_target.value;
  const g        = inputs.g.value;

  const sin2theta  = (R_target * g) / (v_0 * v_0);
  const theta_low  = Math.asin(sin2theta) / 2;
  const theta_high = Math.PI / 2 - theta_low;

  const R_low  = range(v_0, theta_low, g);
  const R_high = range(v_0, theta_high, g);

  const T_low  = timeOfFlight(v_0, theta_low, g);
  const T_high = timeOfFlight(v_0, theta_high, g);
  const delta_T = T_high - T_low;

  return {
    sin2theta,
    theta_low,
    theta_high,
    R_low,
    R_high,
    T_low,
    T_high,
    delta_T,
  };
}
