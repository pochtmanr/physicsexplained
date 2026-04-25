/**
 * §11.3 — The electromagnetic field tensor.
 *
 *   F^{μν} = ∂^μ A^ν − ∂^ν A^μ
 *
 * Six independent numbers (3 E + 3 B) packed antisymmetrically into a 4×4
 * Lorentz tensor:
 *
 *                ⎡   0      Eₓ/c    Eᵧ/c    E_z/c ⎤
 *      F^{μν} =  ⎢ −Eₓ/c     0      −B_z     Bᵧ   ⎥
 *                ⎢ −Eᵧ/c    B_z      0      −Bₓ   ⎥
 *                ⎣ −E_z/c  −Bᵧ      Bₓ       0    ⎦
 *
 * The construction (`buildFieldTensor`), the Hodge dual (`dualTensor`) and
 * the Minkowski metric (`MINKOWSKI`) live in `relativity.ts` next door —
 * this file re-exports them and adds the tensor-trace identities the
 * topic page actually needs:
 *
 *   • antisymmetry assertion
 *   • E and B *recovered* from F (inverse of buildFieldTensor)
 *   • the Lagrangian density scalar  L = −¼ F^{μν} F_{μν}, which the
 *     topic uses as the Lorentz-invariant numerical "first invariant"
 *     scalar trace.
 *
 * Conventions are mostly-minus signature (+,−,−,−) following Griffiths.
 */

import { EPSILON_0, SPEED_OF_LIGHT } from "@/lib/physics/constants";
import {
  buildFieldTensor,
  dualTensor,
  MINKOWSKI,
  type FieldTensor,
} from "@/lib/physics/electromagnetism/relativity";
import type { Vec3 } from "@/lib/physics/electromagnetism/lorentz";

// Re-exports — downstream callers (the topic page, scenes, tests) get one
// import surface for the field-tensor work.
export { buildFieldTensor, dualTensor, MINKOWSKI };
export type { FieldTensor };

/**
 * Returns true iff F is numerically antisymmetric: F[i][j] = −F[j][i] for
 * all (i,j), including the diagonal-is-zero check. Tolerance is absolute
 * 1e-12, which is generous for any sensible double-precision F.
 */
export function tensorAntisymmetryAssert(F: FieldTensor): boolean {
  const tol = 1e-12;
  for (let i = 0; i < 4; i++) {
    for (let j = 0; j < 4; j++) {
      if (Math.abs(F[i][j] + F[j][i]) > tol) return false;
    }
  }
  return true;
}

/**
 * Recover the electric field E from F^{μν}.
 *
 *   F^{0i} = E_i / c   ⇒   E_i = c · F^{0i}
 *
 * Inverse of `buildFieldTensor` for the E components.
 */
export function extractEFromTensor(F: FieldTensor): Vec3 {
  const c = SPEED_OF_LIGHT;
  return {
    x: c * F[0][1],
    y: c * F[0][2],
    z: c * F[0][3],
  };
}

/**
 * Recover the magnetic field B from F^{μν}.
 *
 *   F^{ij} = −ε_{ijk} B_k   ⇒
 *     F^{12} = −B_z   →   B_z = −F[1][2]
 *     F^{23} = −B_x   →   B_x = −F[2][3]
 *     F^{31} = −B_y   →   B_y = −F[3][1] = F[1][3]
 *
 * Inverse of `buildFieldTensor` for the B components.
 */
export function extractBFromTensor(F: FieldTensor): Vec3 {
  return {
    x: -F[2][3],
    y: -F[3][1], // = F[1][3] by antisymmetry
    z: -F[1][2],
  };
}

/**
 * Lower both indices on F^{μν} using η_{μν} (mostly-minus). For a diagonal
 * metric this is just a sign flip on the temporal-spatial blocks:
 *
 *   F_{μν} = η_{μα} η_{νβ} F^{αβ}
 *
 * Concretely:
 *   F_{00} = +F^{00}                       (= 0)
 *   F_{0i} = −F^{0i}     (one minus from η_{ii} = −1)
 *   F_{i0} = −F^{i0}     (one minus from η_{ii} = −1)
 *   F_{ij} = +F^{ij}     (two minuses cancel)
 */
export function lowerFieldTensor(F: FieldTensor): FieldTensor {
  const out: number[][] = [
    [0, 0, 0, 0],
    [0, 0, 0, 0],
    [0, 0, 0, 0],
    [0, 0, 0, 0],
  ];
  for (let mu = 0; mu < 4; mu++) {
    for (let nu = 0; nu < 4; nu++) {
      out[mu][nu] = MINKOWSKI[mu][mu] * MINKOWSKI[nu][nu] * F[mu][nu];
    }
  }
  return [
    [out[0][0], out[0][1], out[0][2], out[0][3]],
    [out[1][0], out[1][1], out[1][2], out[1][3]],
    [out[2][0], out[2][1], out[2][2], out[2][3]],
    [out[3][0], out[3][1], out[3][2], out[3][3]],
  ] as const;
}

/**
 * The Lagrangian-density scalar trace
 *
 *     L_kin = −¼ F^{μν} F_{μν}
 *
 * In SI units with our convention F^{0i} = E_i/c and F^{ij} = −ε_{ijk} B_k,
 * the explicit double-sum evaluates to
 *
 *     L_kin = ½ ( |E|² / c² − |B|² )                    (dimensionless × T²)
 *
 * Multiplying by ε₀c² gives the usual EM Lagrangian density
 *
 *     L_EM = (ε₀ / 2) ( |E|² − c² |B|² )                   (J/m³)
 *
 * which is the form the §11.5 topic uses. We return the SI form so the
 * units are honest. Sign convention follows Jackson/Griffiths: positive
 * for a pure-E field, negative for a pure-B field, zero for a plane wave
 * where |E| = c|B|.
 */
export function lagrangianTrace(F: FieldTensor): number {
  const Flow = lowerFieldTensor(F);
  let sum = 0;
  for (let mu = 0; mu < 4; mu++) {
    for (let nu = 0; nu < 4; nu++) {
      sum += F[mu][nu] * Flow[mu][nu];
    }
  }
  // L = −¼ F^{μν} F_{μν}, but multiply by ε₀ c² so the result has units
  // of J/m³ — i.e. the §11.5 EM-Lagrangian normalisation.
  return -0.25 * sum * EPSILON_0 * SPEED_OF_LIGHT * SPEED_OF_LIGHT;
}

/**
 * Same scalar in "natural-unit" form, i.e. the dimensionless tensor trace
 * before any prefactor. Useful for tests that want to compare to the
 * closed-form ½(E²/c² − B²) without wrestling with ε₀.
 */
export function lagrangianTraceRaw(F: FieldTensor): number {
  const Flow = lowerFieldTensor(F);
  let sum = 0;
  for (let mu = 0; mu < 4; mu++) {
    for (let nu = 0; nu < 4; nu++) {
      sum += F[mu][nu] * Flow[mu][nu];
    }
  }
  return -0.25 * sum;
}
