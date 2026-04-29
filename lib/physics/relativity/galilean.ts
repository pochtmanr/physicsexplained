/**
 * Galilean relativity — the kinematic framework Newton inherited from Galileo.
 *
 *   t' = t,   x' = x − v t,   y' = y,   z' = z.
 *
 * Velocities add by simple subtraction, accelerations are invariant, forces
 * are invariant — and Newton's second law has the same form in every inertial
 * frame. This is the "principle of Galilean relativity": laws of mechanics
 * look identical in any frame that moves at constant velocity relative to
 * another.
 *
 * The same algebra applied to a wave equation gives a frame-dependent wave
 * speed `c − v`, which is precisely where Galilean relativity falls off the
 * cliff Maxwell put under it. {@link galileanWaveSpeed} encodes that
 * (incorrect-by-postulate-2) prediction so the §01.4 scenes can show it
 * fail visually next to the Einstein answer.
 *
 * No React. Pure numerics. Imports from `@/lib/physics/relativity/types`
 * for the 4-vector type only.
 */

import type { Vec4 } from "@/lib/physics/relativity/types";

/**
 * Galilean boost along +x by velocity `v` (m/s).
 *
 * Acts on a single (t, x) event. Time is absolute, x shifts by `−v t`. The
 * y and z components are unchanged and are not part of the return type;
 * call {@link galileanBoost4} for the full 4-event flavour.
 */
export function galileanBoost(
  t: number,
  x: number,
  v: number,
): { t: number; x: number } {
  return { t, x: x - v * t };
}

/**
 * Galilean boost on a full Minkowski-style 4-event (ct, x, y, z).
 *
 * Galilean transforms leave time strictly absolute, so the first slot
 * (`ct`) is unchanged. The `c` argument is only needed to convert `ct → t`
 * before subtracting `v t` from x. Returned in the same `(ct, x, y, z)`
 * convention as the input for shape parity with `Vec4`.
 */
export function galileanBoost4(event: Vec4, v: number, c: number): Vec4 {
  const [ct, x, y, z] = event;
  const t = ct / c;
  return [ct, x - v * t, y, z] as const;
}

/**
 * Galilean velocity addition: u_lab = u_frame + v_frame.
 *
 * If you stand on a flatbed truck moving at `vFrame` and roll a ball forward
 * at `uFrame` in the truck frame, the ball moves at `uFrame + vFrame` in the
 * road frame. This works for matter to all measured precision at everyday
 * speeds — Galilean addition is the v ≪ c limit of the relativistic rule
 * encoded in §02.4.
 */
export function galileanVelocityAdd(uFrame: number, vFrame: number): number {
  return uFrame + vFrame;
}

/**
 * The wave-speed prediction of a Galilean transform applied to a wave
 * equation that propagates at speed `c` in the lab frame.
 *
 * If you boost into a frame moving at +v alongside the lab, naive Galilean
 * kinematics says the wave should appear to recede at `c − v`. Maxwell's
 * equations, applied in the same boosted frame, do NOT give a wave equation
 * with this speed — they keep `c`. That mismatch is the whole engine of
 * §01: either Galilean transforms are wrong, or Maxwell is wrong, or there
 * is a privileged aether frame. Einstein chose the first.
 */
export function galileanWaveSpeed(c: number, v: number): number {
  return c - v;
}

/**
 * Predicted observed velocity in the boat-on-river thought experiment.
 *
 * Boat moves at `boatSpeed` (positive = downstream) relative to the water.
 * Water flows at `currentSpeed` (positive = downstream) relative to the
 * shore. The shore observer sees the boat at `boatSpeed + currentSpeed`.
 * Pass a negative `boatSpeed` to model upstream motion (`+5 + (−3) = +2`,
 * i.e. the boat still wins against a 3 m/s current at 5 m/s engine speed).
 */
export function boatOnRiverShoreSpeed(
  boatSpeed: number,
  currentSpeed: number,
): number {
  return galileanVelocityAdd(boatSpeed, currentSpeed);
}

/**
 * Inverse Galilean boost — from (t, x') in a moving frame back to the lab
 * frame moving at +v relative to the moving frame, equivalently a boost of
 * −v on the moving-frame coordinates.
 */
export function galileanBoostInverse(
  t: number,
  xPrimed: number,
  v: number,
): { t: number; x: number } {
  return { t, x: xPrimed + v * t };
}

/**
 * Compose two successive Galilean boosts: a boost of v1 followed by a boost
 * of v2 is identical to a single boost of v1 + v2. (Galilean velocities form
 * an additive abelian group; that is precisely the property the relativistic
 * generalisation §02.4 has to break.)
 */
export function galileanBoostCompose(v1: number, v2: number): number {
  return v1 + v2;
}

/**
 * Acceleration is invariant under Galilean boosts.
 *
 * If a body has acceleration `aLab` in the lab frame, every other inertial
 * observer also measures acceleration `aLab`. This is why F = m a holds
 * across frames, and why Newtonian dynamics is "Galilean-invariant" — it is
 * the fact this helper encodes by simply returning its input.
 */
export function galileanAccelerationTransform(aLab: number): number {
  return aLab;
}
