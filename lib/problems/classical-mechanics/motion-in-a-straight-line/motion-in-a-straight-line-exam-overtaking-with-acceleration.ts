/**
 * EXAM — Overtaking: a faster-accelerating car catches a head-start car.
 *
 * Car B has a head start of d_0 = 50 m and moves at constant v_B = 15 m/s.
 * Car A starts from rest and accelerates at a_A = 3 m/s².
 *
 * Find:
 *   1. x_B(t) = d_0 + v_B * t           (position of car B)
 *   2. x_A(t) = 0.5 * a_A * t^2         (position of car A from start)
 *   3. t_equal — time when x_A = x_B (set equal, solve quadratic)
 *      0.5*a_A*t² - v_B*t - d_0 = 0
 *      discriminant = v_B^2 + 2*a_A*d_0
 *      t_equal = (v_B + sqrt(discriminant)) / a_A   (positive root)
 *   4. x_overtake = 0.5 * a_A * t_equal^2          (A's position at overtake)
 *   5. v_A_at_overtake = a_A * t_equal              (A's speed at overtake)
 *
 * Uses constantForceMotion for car A's position/velocity.
 */

import { constantForceMotion } from "@/lib/physics/newton";

export const inputs: Record<string, { value: number; units: string }> = {
  d_0: { value: 50, units: "m" },
  v_B: { value: 15, units: "m/s" },
  a_A: { value: 3, units: "m/s²" },
};

export function solve(): Record<string, number> {
  const { d_0, v_B, a_A } = {
    d_0: inputs.d_0.value,
    v_B: inputs.v_B.value,
    a_A: inputs.a_A.value,
  };

  // Step 3: solve quadratic for t_equal
  // 0.5*a_A*t² - v_B*t - d_0 = 0
  // discriminant = v_B² + 2*a_A*d_0 (using quadratic formula on the standard form)
  const discriminant = v_B * v_B + 2 * a_A * d_0;
  const t_equal = (v_B + Math.sqrt(discriminant)) / a_A;

  // Step 4: overtake position (using constantForceMotion — starts from rest with a_A)
  const motionA = constantForceMotion(t_equal, a_A, 1); // mass=1, force=a_A ⇒ a=a_A
  const x_overtake = motionA.x; // 0.5 * a_A * t_equal²

  // Step 5: A's speed at overtake
  const v_A_at_overtake = motionA.v; // a_A * t_equal

  // Cross-check: B's position at t_equal
  const x_B_at_t = d_0 + v_B * t_equal;

  return { discriminant, t_equal, x_overtake, v_A_at_overtake, x_B_at_t };
}
