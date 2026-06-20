/**
 * FIG.02 HEAT, CALORIC, AND COUNT RUMFORD'S CANNONS — pure-TS helpers.
 *
 * The conceptual pivot of the whole branch: heat is not a conserved fluid
 * ("caloric") but a form of energy. Two nineteenth-century experiments fixed
 * the idea quantitatively.
 *
 * Rumford (1798) bored cannon in Munich and found that friction produces heat
 * without limit — the more work the crank does, the more the water warms, with
 * no asymptote. A finite store of fluid could never do that. Heat tracks
 * *work input*, linearly:
 *
 *   ΔT = W / (m c).
 *
 * Joule (1843–45), in his family's Manchester brewery, let a falling weight
 * turn a paddle wheel in insulated water and measured the temperature rise.
 * The work done by gravity, W = m_w g h, reappeared exactly as heat. The
 * conversion factor between the calorie (defined thermally) and the joule
 * (defined mechanically) is the mechanical equivalent of heat,
 *
 *   1 cal = 4.186 J.
 *
 * React-free, typed. SI throughout: J, kg, m, K. Specific heats in J/(kg·K).
 */

import { g_SI } from "@/lib/physics/constants";

/** Mechanical equivalent of heat: joules per thermochemical calorie. */
export const JOULES_PER_CALORIE = 4.186;

/** Calories → joules. */
export function caloriesToJoules(cal: number): number {
  return cal * JOULES_PER_CALORIE;
}

/** Joules → calories. */
export function joulesToCalories(j: number): number {
  return j / JOULES_PER_CALORIE;
}

/**
 * Gravitational work done by a falling mass: W = m g h.
 *
 * @param mass falling mass, kg
 * @param height drop height, m
 * @param gravity local g, m/s² (defaults to standard gravity)
 * @returns work, J
 * @throws RangeError for negative mass or height
 */
export function workFromFallingWeight(
  mass: number,
  height: number,
  gravity: number = g_SI,
): number {
  if (mass < 0 || height < 0) {
    throw new RangeError("mass and height must be ≥ 0");
  }
  return mass * gravity * height;
}

/**
 * Temperature rise when work W is dissipated as heat in a thermal mass:
 * ΔT = W / (m c). This is the linear, no-asymptote relation Rumford found.
 *
 * @param work energy delivered, J
 * @param mass mass being heated, kg
 * @param specificHeat specific heat capacity, J/(kg·K)
 * @returns temperature rise, K
 * @throws RangeError for non-positive mass or specific heat
 */
export function temperatureRise(
  work: number,
  mass: number,
  specificHeat: number,
): number {
  if (mass <= 0 || specificHeat <= 0) {
    throw new RangeError("mass and specific heat must be positive");
  }
  return work / (mass * specificHeat);
}

/**
 * Joule's paddle-wheel result: the ΔT of the water from a falling weight.
 *
 *   ΔT = m_weight g h / (m_water c_water).
 *
 * @param weightMass falling mass, kg
 * @param dropHeight drop height, m
 * @param waterMass mass of stirred water, kg
 * @param waterSpecificHeat c of water, J/(kg·K) (default 4186)
 * @param gravity local g, m/s² (default standard gravity)
 * @returns temperature rise of the water, K
 */
export function paddleWheelDeltaT(
  weightMass: number,
  dropHeight: number,
  waterMass: number,
  waterSpecificHeat = 4186,
  gravity: number = g_SI,
): number {
  const work = workFromFallingWeight(weightMass, dropHeight, gravity);
  return temperatureRise(work, waterMass, waterSpecificHeat);
}

/**
 * Work delivered by N turns of a crank against a constant friction torque:
 * W = τ · θ = τ · 2π N. Rumford's boring tool, idealised — heat accumulates
 * with every turn and never saturates.
 *
 * @param torque resisting torque, N·m
 * @param turns number of full rotations, ≥ 0
 * @returns work done against friction, J
 * @throws RangeError for negative torque or turns
 */
export function workFromCranking(torque: number, turns: number): number {
  if (torque < 0 || turns < 0) {
    throw new RangeError("torque and turns must be ≥ 0");
  }
  return torque * 2 * Math.PI * turns;
}

/** Convenience: the linear water temperature vs work curve for the Rumford
 *  scene — ΔT per joule for a given water mass, a constant slope. */
export function rumfordSlope(
  waterMass: number,
  waterSpecificHeat = 4186,
): number {
  if (waterMass <= 0 || waterSpecificHeat <= 0) {
    throw new RangeError("mass and specific heat must be positive");
  }
  return 1 / (waterMass * waterSpecificHeat);
}
