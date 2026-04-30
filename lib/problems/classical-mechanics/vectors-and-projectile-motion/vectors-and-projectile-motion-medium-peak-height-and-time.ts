/**
 * MEDIUM — Peak height and time to peak.
 *
 * A ball is launched at 35 m/s and 50° above horizontal.
 * Find: the vertical velocity component, the time to reach peak height,
 * and the peak height.
 *
 * Steps:
 *   1. vy         = v_0 * sin(theta)
 *   2. t_peak     = v_0 * sin(theta) / g
 *   3. H          = (v_0 * sin(theta))^2 / (2 * g)
 */

import {
  G_EARTH,
  peakHeight,
  timeToPeak,
} from "@/lib/physics/projectile";

export const inputs: Record<string, { value: number; units: string }> = {
  v_0:   { value: 35,                  units: "m/s"  },
  theta: { value: (50 * Math.PI) / 180, units: "rad"  },
  g:     { value: G_EARTH,             units: "m/s²" },
};

export function solve(): Record<string, number> {
  const v_0   = inputs.v_0.value;
  const theta = inputs.theta.value;
  const g     = inputs.g.value;

  const vy     = v_0 * Math.sin(theta);
  const t_peak = timeToPeak(v_0, theta, g);
  const H      = peakHeight(v_0, theta, g);

  return { vy, t_peak, H };
}
