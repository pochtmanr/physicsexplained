/**
 * MEDIUM — Final velocity from initial velocity, acceleration, and time.
 *
 * A train starts at v₀ = 5 m/s and accelerates at a = 2 m/s² for t = 12 s.
 * Find the final velocity and the distance covered.
 *
 * Steps:
 *   1. v_f = v_0 + a * t        (velocity-time kinematic relation)
 *   2. d   = v_0 * t + 0.5 * a * t^2  (position-time kinematic relation)
 *   3. v_f (final answer — same as step 1, labelled here for step registry)
 *
 * Uses constantForceMotion from newton.ts for step 2 (zero-offset position).
 */

import { constantForceMotion, acceleration } from "@/lib/physics/newton";

export const inputs: Record<string, { value: number; units: string }> = {
  v_0: { value: 5, units: "m/s" },
  a: { value: 2, units: "m/s²" },
  t: { value: 12, units: "s" },
};

export function solve(): Record<string, number> {
  const { v_0, a: aVal, t } = {
    v_0: inputs.v_0.value,
    a: inputs.a.value,
    t: inputs.t.value,
  };

  // Step 1: final velocity
  const v_f = v_0 + aVal * t;

  // Step 2: displacement — use constantForceMotion to derive a (a = F/m),
  // but here we already have a directly. We use the kinematic identity
  // that matches constantForceMotion's output when starting at rest and
  // then add v_0*t for the initial-velocity offset.
  // acceleration() expects force/mass; we reconstruct by passing a*1 / 1.
  const accelCheck = acceleration(aVal, 1); // should equal aVal
  const motionFromRest = constantForceMotion(t, aVal, 1); // .x = 0.5*a*t², .v = a*t
  const d = v_0 * t + motionFromRest.x;

  return { v_f, d, accel_check: accelCheck };
}
