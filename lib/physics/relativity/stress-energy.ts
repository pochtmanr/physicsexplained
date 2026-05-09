/**
 * §08 THE STRESS-ENERGY TENSOR — pure-TS helpers.
 *
 * T_{μν} is the symmetric (0,2) tensor that encodes every form of energy and
 * momentum in a region of spacetime.  Components:
 *   T_{00}  — energy density (ρc²)
 *   T_{0i}  — energy flux / c  =  momentum density × c
 *   T_{ii}  — pressure (diagonal spatial components)
 *   T_{ij}  — shear stress (off-diagonal spatial, i≠j)
 *
 * Convention: mostly-minus Minkowski η_{μν} = diag(+1, −1, −1, −1).
 * Units: SI — T_{00} in J/m³, T_{0i} in kg/(m² s), T_{ij} in Pa.
 */

/** Symmetric 4×4 stress-energy tensor. */
export type StressEnergy4 = readonly [
  readonly [number, number, number, number],
  readonly [number, number, number, number],
  readonly [number, number, number, number],
  readonly [number, number, number, number],
];

/** Vacuum stress-energy: T_{μν} = 0. */
export function vacuumStressEnergy(): StressEnergy4 {
  return [
    [0, 0, 0, 0],
    [0, 0, 0, 0],
    [0, 0, 0, 0],
    [0, 0, 0, 0],
  ] as const;
}

/** Pressureless dust at rest: T_{μν} = ρ c² δ_{μ0} δ_{ν0}. T_{00} = ρ c². */
export function dustStressEnergy(rho: number, c: number): StressEnergy4 {
  return [
    [rho * c * c, 0, 0, 0],
    [0, 0, 0, 0],
    [0, 0, 0, 0],
    [0, 0, 0, 0],
  ] as const;
}

/** Perfect-fluid stress-energy in the rest frame (u^μ = (c, 0, 0, 0)) with mostly-minus signature.
 *  T_{μν} = (ρ + p/c²) u_μ u_ν − p g_{μν}.
 *  In the rest frame with η: T_{00} = ρc², T_{ii} = p, off-diagonals = 0. */
export function perfectFluidRestFrame(rho: number, p: number, c: number): StressEnergy4 {
  return [
    [rho * c * c, 0, 0, 0],
    [0, p, 0, 0],
    [0, 0, p, 0],
    [0, 0, 0, p],
  ] as const;
}

/** Trace of the stress-energy tensor: T = g^{μν} T_{μν}. With Minkowski mostly-minus
 *  η^{μν} = diag(1, −1, −1, −1): T = T_{00} − T_{11} − T_{22} − T_{33}. */
export function stressEnergyTrace(T: StressEnergy4): number {
  return T[0][0] - T[1][1] - T[2][2] - T[3][3];
}

/** Energy density component. */
export function energyDensity(T: StressEnergy4): number {
  return T[0][0];
}

/** Momentum density: T_{0i}/c, i = 1..3. Returns the 3-vector. */
export function momentumDensity(T: StressEnergy4, c: number): readonly [number, number, number] {
  return [T[0][1] / c, T[0][2] / c, T[0][3] / c] as const;
}

/** Pressure for an isotropic perfect fluid: p = (T_{11} + T_{22} + T_{33}) / 3. */
export function isotropicPressure(T: StressEnergy4): number {
  return (T[1][1] + T[2][2] + T[3][3]) / 3;
}

/** Symmetry check: T_{μν} = T_{νμ}. Returns the maximum |T_{μν} − T_{νμ}|. */
export function asymmetryDefect(T: StressEnergy4): number {
  let maxDefect = 0;
  for (let mu = 0; mu < 4; mu++) {
    for (let nu = 0; nu < 4; nu++) {
      const d = Math.abs(T[mu][nu] - T[nu][mu]);
      if (d > maxDefect) maxDefect = d;
    }
  }
  return maxDefect;
}
