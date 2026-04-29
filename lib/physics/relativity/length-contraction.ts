/**
 * Length contraction along the direction of motion.
 *
 * Convention: a rod of proper (rest-frame) length L₀ moving at βc along the
 * direction of its length is measured in the lab frame to have length
 * L = L₀ / γ(β). Dimensions perpendicular to the boost are unchanged.
 *
 * "Lab frame" here just means whichever frame considers the rod to be in
 * motion. The rod's own rest frame is the only frame that measures the
 * proper length L₀; every other inertial frame measures something shorter.
 *
 * The functions here are pure inverses of one another via γ:
 *   contractedLength(L0, β) = L0 / γ(β)
 *   restLength(L_lab, β)    = L_lab * γ(β)
 *
 * No reference to material or optical effects — this is geometry, not stress.
 */

import { gamma } from "./types";

/**
 * Lab-frame length of a rod whose rest-frame (proper) length is L0,
 * moving longitudinally at βc.
 *
 * Throws RangeError for |β| ≥ 1 (via gamma).
 */
export function contractedLength(L0: number, beta: number): number {
  return L0 / gamma(beta);
}

/**
 * Rest-frame (proper) length of a rod measured in the lab to have length
 * L_lab while moving longitudinally at βc.
 *
 * Inverse of contractedLength: restLength(contractedLength(L0, β), β) = L0.
 *
 * Throws RangeError for |β| ≥ 1 (via gamma).
 */
export function restLength(LLab: number, beta: number): number {
  return LLab * gamma(beta);
}

/**
 * Lab-frame extent of a perpendicular dimension. Length contraction acts
 * only along the boost direction; transverse dimensions pass through
 * unchanged. Provided for completeness so the symmetry can be tested.
 */
export function perpendicularLength(L0Perp: number, _beta: number): number {
  return L0Perp;
}

/**
 * Convenience: muon-frame travel time across a contracted atmosphere.
 *
 * In the muon's rest frame the muon does not move; the atmosphere streams
 * past at βc and is contracted to L0/γ. The traversal time at speed βc is
 * t_muon = (L0 / γ) / (β·c) = L0 / (γ·β·c).
 *
 * Returns the elapsed proper time the muon experiences while the
 * atmosphere passes — the same proper time the §02.1 lab-frame derivation
 * arrives at via dt_lab/γ. Same answer, different bookkeeping.
 */
export function muonFrameTraversalTime(
  L0Atmosphere: number,
  beta: number,
  c: number,
): number {
  const contracted = contractedLength(L0Atmosphere, beta);
  return contracted / (beta * c);
}

/**
 * Survival fraction in the muon's own frame: the atmosphere is contracted,
 * the traversal takes L0/(γ·β·c) of muon proper time, and survival is
 * 2^(-t_proper / τ_rest).
 *
 * This must agree with the §02.1 lab-frame answer
 * `muonSurvivalFraction(L0, β, τ, c)` — both frames compute the same
 * physical fraction; that agreement is the conceptual point of this topic.
 */
export function muonSurvivalFromMuonFrame(
  L0Atmosphere: number,
  beta: number,
  halfLifeRest: number,
  c: number,
): number {
  const tProper = muonFrameTraversalTime(L0Atmosphere, beta, c);
  return Math.pow(2, -tProper / halfLifeRest);
}
