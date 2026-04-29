/**
 * The Lorentz transformation — four lines of algebra that replaced Galileo.
 *
 *   t' = γ(t − v x / c²)
 *   x' = γ(x − v t)
 *   y' = y
 *   z' = z
 *
 * The boost mixes time and the boost-direction spatial coordinate. Time is no
 * longer absolute; the two coordinates rotate into each other through the
 * pseudo-angle β = v/c with γ = 1/√(1 − β²).
 *
 * Three equivalent ways to read this:
 *   1. Algebraic — Lorentz, 1904, derived from electrodynamics + a
 *      contraction hypothesis in the aether.
 *   2. Geometric — Einstein, 1905, derived from two postulates with no aether.
 *   3. Group-theoretic — Poincaré, 1905–1906, the boosts together with spatial
 *      rotations form the Poincaré group; composing two boosts along x is a
 *      single boost along x with rapidity-additive law.
 *
 * The transformation preserves the invariant interval
 *   s² = (c t)² − x² − y² − z²
 * which is the metric statement of a 4D pseudo-Euclidean rotation.
 *
 * No React. Pure numerics. Companion to §02.1 time-dilation, §02.2
 * length-contraction, §02.4 velocity-addition — those are all
 * consequences of these four lines.
 *
 * EM cross-ref: see /electromagnetism/e-and-b-under-lorentz for the field-
 * tensor application of the same algebra.
 */

import { SPEED_OF_LIGHT } from "@/lib/physics/constants";
import { gamma, boostX, applyMatrix } from "./types";
import type { Vec4 } from "./types";

/**
 * Lorentz boost along +x by velocity βc. Acts on a single (t, x) event.
 *
 *   t' = γ(t − β x / c)
 *   x' = γ(x − β c t)
 *
 * The y and z components are unchanged (the boost is purely along x).
 * For the full 4-vector flavour, see {@link applyLorentzBoost}.
 */
export function lorentzTransform(
  t: number,
  x: number,
  beta: number,
): { t: number; x: number } {
  const c = SPEED_OF_LIGHT;
  const g = gamma(beta);
  return {
    t: g * (t - (beta / c) * x),
    x: g * (x - beta * c * t),
  };
}

/**
 * Inverse Lorentz boost — equivalent to a forward boost by `−β`.
 *
 * If `lorentzTransform(t, x, β)` carries lab-frame coordinates `(t, x)` into
 * the moving frame's `(t', x')`, then `inverseLorentz(t', x', β)` returns the
 * original `(t, x)`. The boost group is closed under inversion: Λ(β)·Λ(−β) = I.
 */
export function inverseLorentz(
  tPrime: number,
  xPrime: number,
  beta: number,
): { t: number; x: number } {
  return lorentzTransform(tPrime, xPrime, -beta);
}

/**
 * Invariant spacetime interval s² = (c t)² − x² − y² − z².
 *
 * Mostly-minus signature (+,−,−,−), Griffiths convention. A direct numerical
 * proof of relativity's central geometric claim: this scalar is unchanged by
 * any Lorentz boost. See `lorentz.test.ts` for the explicit invariance check.
 *
 * Interpretation:
 *   · s² > 0 — timelike separation (one event in the other's lightcone);
 *   · s² < 0 — spacelike separation (causally disconnected);
 *   · s² = 0 — null separation (light-worldline connection).
 */
export function interval(
  t: number,
  x: number,
  y: number,
  z: number,
): number {
  const c = SPEED_OF_LIGHT;
  return (c * t) ** 2 - x * x - y * y - z * z;
}

/**
 * Apply the 4×4 Lorentz boost matrix Λ to a 4-vector (ct, x, y, z).
 *
 * Wraps the matrix form already encoded in `boostX(β)` from
 * {@link "@/lib/physics/relativity/types"}. Returns a new Vec4 in the
 * boosted frame, leaving y and z unchanged.
 *
 *   Λ(β) = ⎛  γ      −γβ    0   0 ⎞
 *          ⎜ −γβ      γ     0   0 ⎟
 *          ⎜  0       0     1   0 ⎟
 *          ⎝  0       0     0   1 ⎠
 */
export function applyLorentzBoost(v: Vec4, beta: number): Vec4 {
  return applyMatrix(boostX(beta), v);
}
