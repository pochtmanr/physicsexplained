/**
 * EXAM — Terminal velocity of a skydiver under quadratic (Newtonian) drag.
 *
 * A skydiver of mass m = 75 kg falls in a belly-down posture through air
 * (density ρ = 1.225 kg/m³) with cross-sectional area A = 0.7 m² and drag
 * coefficient C_d = 1.0.  Find:
 *   1. k     — quadratic drag constant  (½ · ρ · C_d · A)
 *   2. F_grav — gravitational force     (m · g)
 *   3. v_t   — terminal velocity        (√(F_grav / k) = √(2mg / (ρ · C_d · A)))
 *
 * quadraticDrag() from friction.ts is used to confirm k: k = quadraticDrag(1, ρ, C_d, A).
 */

import { G, quadraticDrag } from "@/lib/physics/friction";

export const inputs: Record<string, { value: number; units: string }> = {
  m:   { value: 75,    units: "kg" },
  rho: { value: 1.225, units: "kg/m³" },
  C_d: { value: 1.0,   units: "" },
  A:   { value: 0.7,   units: "m²" },
  g:   { value: G,     units: "m/s²" },
};

export function solve(): Record<string, number> {
  const m   = inputs.m.value;
  const rho = inputs.rho.value;
  const C_d = inputs.C_d.value;
  const A   = inputs.A.value;
  const g   = inputs.g.value;

  // Step 1: quadratic drag constant k = ½ ρ C_d A
  // quadraticDrag(v, density, dragCoefficient, area) = ½ρ·C_d·A·v²
  // At v = 1: quadraticDrag(1, ρ, C_d, A) = k
  const k = quadraticDrag(1, rho, C_d, A);

  // Step 2: gravitational force
  const F_grav = m * g;

  // Step 3: terminal velocity — set F_grav = k·v_t² → v_t = √(F_grav/k)
  const v_t = Math.sqrt(F_grav / k);

  return { k, F_grav, v_t };
}
