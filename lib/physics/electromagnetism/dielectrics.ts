import { EPSILON_0 } from "@/lib/physics/constants";

/**
 * Electric displacement field magnitude.
 *
 *   D = ε₀ E + P
 *
 * The "free-charge field": its sources are only the free charges you put on
 * the plates / pumped into a wire, not the bound charges that show up because
 * a dielectric polarised in response. In vacuum (P = 0) it reduces to ε₀ E.
 *
 * Inputs are scalar magnitudes along a common axis. SI units: E in V/m,
 * P in C/m², D in C/m².
 */
export function displacementField(E: number, P: number): number {
  return EPSILON_0 * E + P;
}

/**
 * Capacitance of a parallel-plate capacitor when the gap is filled with a
 * linear dielectric of relative permittivity κ.
 *
 *   C = κ · C₀
 *
 * `C0` is the vacuum capacitance ε₀ A / d (in farads); κ is dimensionless.
 * Slipping a κ = 4 slab into the gap quadruples the capacitance — same
 * geometry, more charge held at the same voltage.
 */
export function capacitanceWithDielectric(C0: number, kappa: number): number {
  return kappa * C0;
}

/** Materials we can ask `dielectricBreakdownField` about. */
export type DielectricMaterial = "air" | "glass" | "mica" | "water";

/**
 * Approximate dielectric breakdown field, in V/m. The value at which the
 * material stops insulating and starts arcing.
 *
 * These are pedagogical typicals — real breakdown depends on humidity,
 * impurity, geometry, frequency, and the day of the week:
 *
 *   air    ≈ 3 × 10⁶  V/m  (the ~3 kV/mm rule of thumb)
 *   glass  ≈ 1 × 10⁷  V/m
 *   water  ≈ 7 × 10⁷  V/m  (deionised; tap water breaks down far sooner)
 *   mica   ≈ 1.2 × 10⁸ V/m  (the muscle of high-voltage capacitors)
 *
 * The material list is deliberately ordered weakest → strongest.
 */
export function dielectricBreakdownField(
  material: DielectricMaterial,
): number {
  switch (material) {
    case "air":
      return 3e6;
    case "glass":
      return 1e7;
    case "water":
      return 7e7;
    case "mica":
      return 1.2e8;
  }
}
