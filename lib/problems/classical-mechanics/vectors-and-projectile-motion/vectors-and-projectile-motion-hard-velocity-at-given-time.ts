/**
 * HARD — Full velocity vector at a specified time during flight.
 *
 * A projectile is launched at 40 m/s and 60° above horizontal.
 * At t = 2 s after launch, find the horizontal velocity component,
 * the vertical velocity component, the speed, and the angle of the
 * velocity vector below the horizontal.
 *
 * Steps:
 *   1. vx        = v_0 * cos(theta)           (constant throughout)
 *   2. vy_t      = v_0 * sin(theta) - g * t   (decreases under gravity)
 *   3. speed_t   = sqrt(vx^2 + vy_t^2)
 *   4. angle_t   = atan(vy_t / vx)            (signed; negative means below horizontal)
 */

import {
  G_EARTH,
  velocity,
  mag,
  angleOf,
} from "@/lib/physics/projectile";

export const inputs: Record<string, { value: number; units: string }> = {
  v_0:   { value: 40,                  units: "m/s"  },
  theta: { value: (60 * Math.PI) / 180, units: "rad"  },
  t:     { value: 2,                   units: "s"    },
  g:     { value: G_EARTH,             units: "m/s²" },
};

export function solve(): Record<string, number> {
  const v_0   = inputs.v_0.value;
  const theta = inputs.theta.value;
  const t     = inputs.t.value;
  const g     = inputs.g.value;

  const vel     = velocity(t, v_0, theta, g);
  const vx      = vel.x;
  const vy_t    = vel.y;
  const speed_t = mag(vel);
  const angle_t = angleOf(vel); // radians, signed

  return { vx, vy_t, speed_t, angle_t };
}
