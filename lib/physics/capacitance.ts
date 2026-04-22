import { EPSILON_0 } from "./constants";

/**
 * Parallel-plate capacitance.
 *
 *   C = ε₀ · κ · A / d
 *
 * Two flat conducting plates of area `A` (m²) held a distance `d` (m) apart,
 * with a dielectric of relative permittivity `kappa` filling the gap. With
 * vacuum (κ = 1), this reduces to the geometric form C = ε₀ A / d.
 *
 * The result is in farads (F = C/V = A·s/V).
 */
export function parallelPlateCapacitance(
  A: number,
  d: number,
  kappa: number = 1,
): number {
  return (EPSILON_0 * kappa * A) / d;
}

/**
 * Energy stored on a charged capacitor at voltage V.
 *
 *   U = ½ C V²
 *
 * Equivalently U = Q²/(2C) = ½ Q V. The factor of ½ is the give-away that
 * something interesting happened during charging — only half the work done by
 * the battery ends up on the plates; the other half is dissipated.
 */
export function energyStored(C: number, V: number): number {
  return 0.5 * C * V * V;
}

/**
 * Energy density of an electric field, in J/m³.
 *
 *   u = ½ ε₀ κ E²
 *
 * The field itself is the storage medium. Integrate `u` over a region of space
 * and you get the total energy stored in that region. For a parallel-plate
 * capacitor, ∫u dV recovers ½ C V² exactly.
 */
export function energyDensity(E: number, kappa: number = 1): number {
  return 0.5 * EPSILON_0 * kappa * E * E;
}
