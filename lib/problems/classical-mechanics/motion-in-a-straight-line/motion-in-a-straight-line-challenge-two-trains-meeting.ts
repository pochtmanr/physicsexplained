/**
 * CHALLENGE — Two trains meeting: find the time and location of encounter.
 *
 * Train A starts at position x = 0 moving in the +x direction at v_A = 20 m/s.
 * Train B starts at position x = L = 1200 m moving in the −x direction at
 * speed v_B = 10 m/s (so its velocity is −10 m/s).
 *
 * Both travel at constant velocity (a = 0).
 *
 * Steps:
 *   1. Write position equations:
 *        x_A(t) = v_A * t
 *        x_B(t) = L - v_B * t
 *   2. closing_speed = v_A + v_B   (they approach each other)
 *   3. t_meet = L / closing_speed
 *   4. x_meet = v_A * t_meet       (position of meeting)
 *   5. x_meet (final answer)
 *
 * Uses constantForceMotion (a=0 case) indirectly — we call it with force=0
 * to confirm x_A and x_B at t_meet and cross-check.
 */

import { constantForceMotion } from "@/lib/physics/newton";

export const inputs: Record<string, { value: number; units: string }> = {
  v_A: { value: 20, units: "m/s" },
  v_B: { value: 10, units: "m/s" },
  L: { value: 1200, units: "m" },
};

export function solve(): Record<string, number> {
  const { v_A, v_B, L } = {
    v_A: inputs.v_A.value,
    v_B: inputs.v_B.value,
    L: inputs.L.value,
  };

  // Step 2: closing speed
  const closing_speed = v_A + v_B;

  // Step 3: time of meeting
  const t_meet = L / closing_speed;

  // Step 4: position of meeting (measured from A's start)
  // Verify with constantForceMotion (F=0 ⇒ a=0 ⇒ x = v_0*t via explicit formula)
  // constantForceMotion gives x from rest; we add v_0*t manually.
  const motionA = constantForceMotion(t_meet, 0, 1); // a=0, x=0 from rest part
  const x_A_check = v_A * t_meet + motionA.x; // = v_A*t + 0
  const x_meet = v_A * t_meet;

  // Train B's position at t_meet — should equal x_meet
  const x_B_check = L - v_B * t_meet;

  return { closing_speed, t_meet, x_meet, x_A_check, x_B_check };
}
