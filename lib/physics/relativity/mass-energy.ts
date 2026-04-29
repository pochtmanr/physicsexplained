/**
 * §04.2 MASS-ENERGY EQUIVALENCE — pure-TS helpers.
 *
 * E = mc². The deepest bookkeeping fact in physics: mass and energy are the
 * same currency, denominated in different units of c². Bound systems weigh
 * less than their constituents — the binding energy comes off the balance.
 *
 * Conventions:
 *   • SI throughout. Mass in kg, energy in J, c in m/s (default
 *     `SPEED_OF_LIGHT` from `@/lib/physics/constants`).
 *   • The binding-energy curve uses MeV/nucleon, the natural nuclear unit.
 */

import { SPEED_OF_LIGHT } from "@/lib/physics/constants";

/**
 * Rest energy E₀ = m c². Kilograms in, joules out.
 *
 * @example
 *   restEnergy(1) ≈ 8.987551787e16 J  // c² in SI
 *   restEnergy(1.673e-27) ≈ 1.503e-10 J  // proton rest energy ≈ 938 MeV
 */
export function restEnergy(m: number, c = SPEED_OF_LIGHT): number {
  return m * c * c;
}

/**
 * Mass deficit Δm from a known binding-energy release ΔE.
 *
 * Used in nuclear physics to convert measured energy releases (in J or, after
 * unit conversion, MeV) into the missing mass on the balance.
 *
 *   Δm = ΔE / c²
 *
 * @example
 *   massDeficitFromEnergy(1) ≈ 1.1126e-17 kg  // 1 J → tiny mass
 *   massDeficitFromEnergy(28e6 * 1.602176634e-13)  // He-4 binding ≈ 28 MeV
 *     ≈ 4.99e-29 kg  // = 0.030 u, the He-4 mass deficit
 */
export function massDeficitFromEnergy(deltaE: number, c = SPEED_OF_LIGHT): number {
  return deltaE / (c * c);
}

/** A single point on the binding-energy-per-nucleon curve. */
export interface BindingEnergyPoint {
  /** Mass number A = Z + N (number of nucleons). */
  readonly A: number;
  /** Binding energy per nucleon B/A in MeV. */
  readonly B_per_A_MeV: number;
  /** Isotope label, e.g. "Fe-56". */
  readonly isotope: string;
}

/**
 * Binding-energy-per-nucleon curve, sample data: realistic AME-2020 values
 * for representative isotopes from H-1 to U-238. The curve climbs steeply from
 * H to He, rises through the light elements, peaks at iron-56 (~8.79 MeV/A —
 * the universe's energy minimum per nucleon), then descends slowly through
 * the heavy elements to U-238.
 *
 * Stars run on fusion (climbing left of iron); reactors run on fission
 * (descending right of iron). Every joule of energy ever liberated by a
 * nucleus has been a movement on this curve.
 *
 * Data source: AME 2020 atomic mass evaluation (Wang, Huang, Kondev, Audi,
 * Naimi, Chinese Physics C 45, 030003 — values rounded to two decimals).
 */
export function bindingEnergyCurve(): readonly BindingEnergyPoint[] {
  return [
    { A: 1, B_per_A_MeV: 0, isotope: "H-1" },
    { A: 2, B_per_A_MeV: 1.11, isotope: "H-2" },
    { A: 4, B_per_A_MeV: 7.07, isotope: "He-4" },
    { A: 12, B_per_A_MeV: 7.68, isotope: "C-12" },
    { A: 16, B_per_A_MeV: 7.98, isotope: "O-16" },
    { A: 56, B_per_A_MeV: 8.79, isotope: "Fe-56" },
    { A: 84, B_per_A_MeV: 8.72, isotope: "Kr-84" },
    { A: 138, B_per_A_MeV: 8.39, isotope: "Ba-138" },
    { A: 208, B_per_A_MeV: 7.87, isotope: "Pb-208" },
    { A: 235, B_per_A_MeV: 7.59, isotope: "U-235" },
    { A: 238, B_per_A_MeV: 7.57, isotope: "U-238" },
  ] as const;
}
