/**
 * Threshold energy and pair production — RT §04.5 closer.
 *
 * Pure kinematics from four-momentum conservation. The §04.5 topic asks:
 * how much incoming energy is needed to *create* matter? The answer comes
 * from the invariant `m²c² = (E/c)² − |p|²` and the requirement that the
 * final-state four-momentum sum match the initial-state sum exactly.
 *
 * Three results are exported:
 *
 *   1. `pairProductionThresholdLeadingOrder` — the canonical 2 m_e c² ≈
 *      1.022 MeV figure for γ + nucleus → e⁺ + e⁻ + nucleus, valid to
 *      leading order in m_e / M_nucleus (the recoil correction is O(10⁻⁴)
 *      for hydrogen and smaller for heavier nuclei).
 *
 *   2. `singlePhotonPairProductionAllowed` — always returns false. A single
 *      photon γ → e⁺ + e⁻ in vacuum is forbidden by four-momentum
 *      conservation: the photon's four-momentum is null (m²c² = 0), but a
 *      pair at rest has m²c² = (2 m_e)² c⁴ > 0. The Minkowski norm is
 *      Lorentz-invariant, so no boost can save you.
 *
 *   3. `thresholdHeadOnAtRestTarget` — closed-form lab-frame threshold
 *      energy for a moving particle of mass m1 hitting a stationary target
 *      of mass m2 to produce a final state of total rest mass M. Derived
 *      from the invariant `s = (p1 + p2)² ≥ M²c⁴`, evaluated in the lab
 *      frame and at threshold (final-state particles at rest in the COM
 *      frame, i.e. the equality case).
 *
 * Convention: SI units throughout when c, m default to constants.ts. Tests
 * also exercise natural units c = 1.
 */

import { SPEED_OF_LIGHT, ELECTRON_MASS } from "@/lib/physics/constants";

/**
 * Threshold incoming-photon energy for γ + nucleus → e⁺ + e⁻ + nucleus.
 *
 * To leading order in m_e / M_nucleus the nucleus absorbs the recoil
 * momentum at vanishing energy cost, so the photon need only carry the
 * rest energy of the pair: `E_γ ≥ 2 m_e c²`. With CODATA 2018 values this
 * lands at 1.637e-13 J ≈ 1.022 MeV.
 *
 * The exact threshold including the nucleus recoil is
 * `E_γ = 2 m_e c² (1 + m_e / M_nucleus)`, which exceeds the leading-order
 * value by ~5.5e-4 for hydrogen and is even smaller for any heavier nucleus.
 */
export function pairProductionThresholdLeadingOrder(
  c = SPEED_OF_LIGHT,
  me = ELECTRON_MASS,
): number {
  return 2 * me * c * c;
}

/**
 * Whether a single-photon pair production γ → e⁺ + e⁻ is kinematically
 * allowed in vacuum. Always false: forbidden by four-momentum conservation.
 *
 * Sketch: in any inertial frame the photon four-momentum has Minkowski
 * norm zero (massless). The final pair, regardless of how the energy is
 * partitioned between the two leptons, has invariant mass at least
 * `2 m_e c²` (achieved when both are at rest in the pair's COM frame).
 * Since the Minkowski norm is invariant under Lorentz boosts, you cannot
 * find a frame in which a null four-momentum equals a timelike one. A
 * third body (a nucleus, another photon, an electron) is required to
 * absorb momentum at energy cost the kinematics permits.
 */
export function singlePhotonPairProductionAllowed(): boolean {
  return false;
}

/**
 * Threshold lab-frame energy of a moving particle of rest mass m1 striking
 * a target of rest mass m2 at rest, to produce a final state of total rest
 * mass M.
 *
 * Derivation: in the COM frame at threshold, all final-state particles are
 * at rest, so `s = M²c⁴`. The Mandelstam invariant
 * `s = (E1 + m2 c²)² − (p1 c)²`, expanded with `E1² = (p1 c)² + m1²c⁴`,
 * collapses to `s = m1²c⁴ + m2²c⁴ + 2 E1 m2 c²`. Setting this equal to
 * `M²c⁴` and solving for E1 gives the closed-form result returned below.
 *
 *     E_threshold = (M² − m1² − m2²) c² / (2 m2)
 *
 * Note: if m1 = 0 (incoming photon), the formula reduces to
 * `(M² − m2²) c² / (2 m2)`. For pair production γ + nucleus → e⁺ + e⁻ +
 * nucleus, M = M_nucleus + 2 m_e and m2 = M_nucleus, and the leading-order
 * expansion in m_e / M_nucleus reproduces `2 m_e c²` plus the
 * (negligible) recoil correction `2 m_e² c² / M_nucleus`.
 *
 * @throws RangeError if M < m1 + m2 (the final state is heavier than what
 *   the kinematics can ever support; the threshold formula would return a
 *   negative number, which is unphysical).
 */
export function thresholdHeadOnAtRestTarget(
  M: number,
  m1: number,
  m2: number,
  c = SPEED_OF_LIGHT,
): number {
  if (M < m1 + m2) {
    throw new RangeError(
      `threshold: M (${M}) must be at least m1 + m2 (${m1 + m2}) — final state heavier than total available rest mass`,
    );
  }
  return ((M * M - m1 * m1 - m2 * m2) / (2 * m2)) * c * c;
}
