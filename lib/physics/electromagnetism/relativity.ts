/**
 * Special-relativistic types and helpers for §11 EM and Relativity.
 *
 * Conventions:
 *   • Mostly-minus metric signature (+,−,−,−), Griffiths convention.
 *   • Greek indices (0..3) on `Vec4` correspond to (ct, x, y, z).
 *   • Boost velocity is given as β = v/c (dimensionless), not v.
 *   • Field tensor F^{μν} is antisymmetric. F^{0i} = E_i / c, F^{ij} = −ε_{ijk} B_k.
 */

import { SPEED_OF_LIGHT } from "@/lib/physics/constants";
import type { Vec3 } from "@/lib/physics/electromagnetism/lorentz";

export type Vec4 = readonly [number, number, number, number];
export type FourVector = Vec4;
export type FourPotential = Vec4;
export type FourCurrent = Vec4;
export type FieldTensor = readonly [Vec4, Vec4, Vec4, Vec4];

/** Minkowski metric η_{μν} in mostly-minus signature. */
export const MINKOWSKI: FieldTensor = [
  [1, 0, 0, 0],
  [0, -1, 0, 0],
  [0, 0, -1, 0],
  [0, 0, 0, -1],
] as const;

/** Lorentz factor γ = 1/√(1 − β²). */
export function gamma(beta: number): number {
  return 1 / Math.sqrt(1 - beta * beta);
}

/** Lorentz boost matrix Λ^μ_ν along +x by velocity βc. Row-major 4×4. */
export function lorentzBoostMatrix(betaX: number): FieldTensor {
  const g = gamma(betaX);
  return [
    [g, -g * betaX, 0, 0],
    [-g * betaX, g, 0, 0],
    [0, 0, 1, 0],
    [0, 0, 0, 1],
  ] as const;
}

/** Construct antisymmetric F^{μν} from E (V/m) and B (T) in SI mostly-minus convention.
 *  F^{0i} = E_i / c, F^{ij} = −ε_{ijk} B_k. */
export function buildFieldTensor(E: Vec3, B: Vec3): FieldTensor {
  const c = SPEED_OF_LIGHT;
  return [
    [0, E.x / c, E.y / c, E.z / c],
    [-E.x / c, 0, -B.z, B.y],
    [-E.y / c, B.z, 0, -B.x],
    [-E.z / c, -B.y, B.x, 0],
  ] as const;
}

/** Closed-form Lorentz transform of E, B under boost along +x by βc.
 *  Parallel components unchanged; perpendicular components mix.
 *    E'_x = E_x;  E'_y = γ(E_y − v B_z);          E'_z = γ(E_z + v B_y)
 *    B'_x = B_x;  B'_y = γ(B_y + v E_z / c²);    B'_z = γ(B_z − v E_y / c²) */
export function transformFields(
  E: Vec3,
  B: Vec3,
  betaX: number,
): { E: Vec3; B: Vec3 } {
  const g = gamma(betaX);
  const c = SPEED_OF_LIGHT;
  const v = betaX * c;
  return {
    E: { x: E.x, y: g * (E.y - v * B.z), z: g * (E.z + v * B.y) },
    B: {
      x: B.x,
      y: g * (B.y + (v * E.z) / (c * c)),
      z: g * (B.z - (v * E.y) / (c * c)),
    },
  };
}

/** Hodge dual *F^{μν} (swaps E ↔ cB up to signs in mostly-minus signature).
 *  Used by §11.3 for the E↔B duality and the magnetic-monopole argument. */
export function dualTensor(F: FieldTensor): FieldTensor {
  const c = SPEED_OF_LIGHT;
  return [
    [0, -F[2][3], -F[3][1], -F[1][2]],
    [F[2][3], 0, -F[0][3] / c, F[0][2] / c],
    [F[3][1], F[0][3] / c, 0, -F[0][1] / c],
    [F[1][2], -F[0][2] / c, F[0][1] / c, 0],
  ] as const;
}
