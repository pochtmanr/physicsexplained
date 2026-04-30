/**
 * EXAM — Full state vector (position + velocity magnitude) at mid-flight.
 *
 * A projectile is launched from the origin at 45 m/s and 37° above horizontal.
 * Find the position (x, y) and the speed at exactly half the total time of flight.
 * Then confirm y = peak height / something by computing the ratio y / H.
 *
 * This is an exam-style problem because the student must:
 *   (a) compute time of flight T,
 *   (b) evaluate position at t = T/2,
 *   (c) evaluate velocity at t = T/2 and find its magnitude,
 *   (d) recognize that t = T/2 corresponds to the peak (y = H).
 *
 * Steps:
 *   1. vx        = v_0 * cos(theta)
 *   2. vy0       = v_0 * sin(theta)
 *   3. T         = 2 * vy0 / g
 *   4. x_mid     = vx * (T / 2)
 *   5. y_mid     = vy0 * (T/2) - 0.5 * g * (T/2)^2    (should equal H)
 *   6. H         = vy0^2 / (2 * g)
 *   7. vy_mid    = vy0 - g * (T / 2)                    (should be 0)
 *   8. speed_mid = sqrt(vx^2 + vy_mid^2)                (= vx at peak)
 */

import {
  G_EARTH,
  timeOfFlight,
  peakHeight,
  position,
  velocity,
  mag,
} from "@/lib/physics/projectile";

export const inputs: Record<string, { value: number; units: string }> = {
  v_0:   { value: 45,                  units: "m/s"  },
  theta: { value: (37 * Math.PI) / 180, units: "rad"  },
  g:     { value: G_EARTH,             units: "m/s²" },
};

export function solve(): Record<string, number> {
  const v_0   = inputs.v_0.value;
  const theta = inputs.theta.value;
  const g     = inputs.g.value;

  const vx   = v_0 * Math.cos(theta);
  const vy0  = v_0 * Math.sin(theta);
  const T    = timeOfFlight(v_0, theta, g);
  const t_mid = T / 2;

  const pos      = position(t_mid, v_0, theta, g);
  const x_mid    = pos.x;
  const y_mid    = pos.y;

  const vel      = velocity(t_mid, v_0, theta, g);
  const vy_mid   = vel.y;
  const speed_mid = mag(vel);

  const H = peakHeight(v_0, theta, g);

  return { vx, vy0, T, t_mid, x_mid, y_mid, vy_mid, speed_mid, H };
}
