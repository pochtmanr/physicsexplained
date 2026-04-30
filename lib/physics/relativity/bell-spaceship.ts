/**
 * §05.2 BELL'S SPACESHIP PARADOX — pure-TS helpers.
 *
 * John S. Bell's 1976 puzzle (rooted in earlier remarks by Dewan & Beran 1959):
 * two identical rockets sit at lab-frame separation D₀, both ignite their
 * engines simultaneously in the launch frame and follow identical lab-frame
 * acceleration profiles. A delicate string is tied between them. Will the
 * string break?
 *
 * Naïve answer (wrong): the rockets keep the same lab-frame separation D₀
 * forever, so the string is never stretched.
 *
 * Right answer (Bell): the string IS stretched, because what determines
 * whether a physical string breaks is the *proper* separation between the
 * rockets — the distance measured in the rockets' shared instantaneous rest
 * frame — not the lab-frame separation.
 *
 * After both rockets reach speed β, the proper separation is
 *
 *   D_proper(β) = γ(β) · D₀
 *
 * because in the lab frame the moving rockets' instantaneous rest frame sees
 * the lab-frame distance D₀ as length-contracted; equivalently, undoing the
 * lab-frame contraction gives γ·D₀ in the rest frame. The string, whose
 * proper length is fixed (by the material), must stretch to span γ·D₀ — a
 * factor of γ longer than its unstressed length. At γ ≈ 1 + ε_c (where ε_c
 * is the material's critical strain), it snaps.
 *
 * The deeper geometric content: a truly Born-rigid pair of accelerating
 * rockets would have the trailing rocket accelerate slightly *faster* than
 * the leading one — exactly the relation needed to keep their proper
 * separation constant. Bell's setup ("identical lab-frame accelerations")
 * is NOT Born-rigid; it sneaks in a coordinate choice (the launch frame's
 * notion of simultaneity), and pays for it in proper length.
 *
 * Conventions:
 *   • β = v/c, dimensionless. γ = 1/√(1 − β²).
 *   • D₀ in whatever length units the caller uses (meters, light-seconds, …).
 *   • Strain ε is dimensionless, defined as (γ − 1) for a string whose
 *     unstressed proper length equals the initial separation D₀.
 */

import { gamma } from "./types";

/**
 * Proper separation between Bell's two rockets after both reach speed β,
 * given an initial lab-frame separation D₀.
 *
 *   D_proper(β) = γ(β) · D₀
 *
 * At β = 0 the rockets are still at rest and D_proper = D₀ trivially. As
 * β → 1 the proper separation diverges; the string breaks long before
 * that.
 *
 * Throws RangeError for |β| ≥ 1 (via gamma).
 */
export function properSeparation(D0: number, beta: number): number {
  return D0 * gamma(beta);
}

/**
 * Strain on the string tied between the two rockets, assuming the string's
 * unstressed proper length equals the initial lab-frame separation D₀.
 *
 *   ε(β) = D_proper / D₀ − 1 = γ(β) − 1
 *
 * Dimensionless. Monotonically increasing in |β|. ε(0) = 0; ε → ∞ as
 * β → 1.
 *
 * Throws RangeError for |β| ≥ 1.
 */
export function stringStrain(beta: number): number {
  return gamma(beta) - 1;
}

/**
 * Speed β at which the string's strain ε(β) = γ(β) − 1 first reaches a
 * critical value ε_c (the material's snap threshold). Inverts ε = γ − 1:
 *
 *   γ_crit = 1 + ε_c
 *   β_snap = √(1 − 1/γ_crit²)
 *
 * Typical macroscopic strings snap at ε_c ~ 0.01–0.1 (1%–10% strain), so
 * the string in Bell's experiment dies very early — long before the
 * rockets are anything close to relativistic. That is the punchline: a
 * "small" relativistic effect is enormous for a rigid string.
 *
 * Throws RangeError if ε_c ≤ 0 (no critical strain to snap at).
 */
export function snapSpeed(epsilonCritical: number): number {
  if (epsilonCritical <= 0) {
    throw new RangeError(
      `snapSpeed: epsilonCritical must be positive (got ${epsilonCritical})`,
    );
  }
  const gammaCrit = 1 + epsilonCritical;
  return Math.sqrt(1 - 1 / (gammaCrit * gammaCrit));
}

/**
 * Born-rigid analogue: the proper-acceleration ratio that two rockets must
 * maintain to keep their proper separation constant at D₀ as they speed up.
 *
 * For uniformly proper-accelerating rockets ("Rindler observers"), the
 * worldlines are hyperbolas
 *
 *   x_i(t) = x_i,₀ · √(1 + (a_i t / c)²)        (in the launch frame)
 *
 * with proper acceleration a_i = c² / x_i,₀ when measured at the rocket's
 * own clock. To maintain a constant proper separation, the trailing rocket
 * (smaller x₀) must have a *larger* proper acceleration than the leading
 * one, in the precise ratio
 *
 *   a_rear / a_front = x_front,₀ / x_rear,₀ = (D₀ + x_rear,₀) / x_rear,₀
 *
 * For a small initial separation D₀ ≪ x_rear,₀ this is approximately
 * 1 + D₀ / x_rear,₀ ≈ 1, so the asymmetry is tiny — but it is exactly
 * what Bell's "identical lab-frame accelerations" violate, and exactly
 * the violation that stretches the string.
 *
 * Returns the Born-rigid acceleration ratio a_rear / a_front given the
 * initial position of the rear rocket and the initial separation D₀.
 * Throws RangeError if x_rear,₀ ≤ 0 (rocket must start at positive x for
 * the Rindler hyperbola to be future-directed).
 */
export function bornRigidAccelerationRatio(
  xRearInitial: number,
  D0: number,
): number {
  if (xRearInitial <= 0) {
    throw new RangeError(
      `bornRigidAccelerationRatio: xRearInitial must be positive (got ${xRearInitial})`,
    );
  }
  return (xRearInitial + D0) / xRearInitial;
}
