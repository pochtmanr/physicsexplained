import { H_BAR, ELEMENTARY_CHARGE } from "@/lib/physics/constants";
import type { FieldTensor, FourCurrent } from "@/lib/physics/electromagnetism/relativity";

/**
 * Dirac quantization condition: if a magnetic monopole exists with magnetic charge g,
 * its product with any electric charge q must satisfy
 *   q g = 2π n ℏ
 * for some integer n. The smallest non-trivial monopole charge is g_D = 2πℏ/e
 * ≈ 4.14×10^{−15} Wb (= Φ_0, the magnetic flux quantum).
 *
 * Returns the product q·g and the quantum number n = qg/(2πℏ).
 */
export function diracQuantizationCondition(
  electricCharge: number,
  magneticCharge: number,
): { eg: number; n: number } {
  const eg = electricCharge * magneticCharge;
  return { eg, n: eg / (2 * Math.PI * H_BAR) };
}

/**
 * The Dirac monopole unit g_D = 2πℏ/e — the smallest magnetic charge consistent
 * with the existence of an electron of charge e. Numerically equal to Φ_0 in Wb.
 */
export function diracMonopoleUnit(): number {
  return (2 * Math.PI * H_BAR) / ELEMENTARY_CHARGE;
}

/**
 * Compute the four-divergence ∂_μ *F^{μν} of the dual field tensor.
 * In standard Maxwell: ∂_μ *F^{μν} = 0 (Faraday's law + no-monopole).
 * In a monopole-bearing theory: ∂_μ *F^{μν} = μ₀ J^ν_magnetic.
 *
 * This helper takes a precomputed dual tensor and returns the 4-divergence
 * via finite differences relative to a reference point. We don't carry a
 * spacetime grid here, so this is a pedagogical placeholder used by the
 * §12.3 scene to illustrate the structural symmetry rather than do real
 * field theory. Returns the implied magnetic-current four-vector.
 */
export function magneticChargeDensityFromTensor(
  F_dual: FieldTensor,
  // Optional gradient of dual tensor over the local cell; default zero ⇒ ∂_μ*F = 0
  gradient?: readonly [FieldTensor, FieldTensor, FieldTensor, FieldTensor],
): FourCurrent {
  if (!gradient) {
    void F_dual;
    return [0, 0, 0, 0];
  }
  const J: number[] = [0, 0, 0, 0];
  for (let nu = 0; nu < 4; nu++) {
    let sum = 0;
    for (let mu = 0; mu < 4; mu++) {
      sum += gradient[mu][mu][nu];
    }
    J[nu] = sum;
  }
  return [J[0], J[1], J[2], J[3]];
}

/**
 * Symbolic descriptor of dual Maxwell equations in the presence of monopoles.
 * Returns labels for use in the §12.3 DualMaxwellSymmetryScene.
 */
export function dualMaxwellEquationLabels(): {
  withMonopoles: { electric: string[]; magnetic: string[] };
  standard: string[];
} {
  return {
    standard: [
      "∇·E = ρ/ε₀",
      "∇·B = 0",
      "∇×E = −∂B/∂t",
      "∇×B = μ₀J + μ₀ε₀ ∂E/∂t",
    ],
    withMonopoles: {
      electric: ["∇·E = ρ_e/ε₀", "∇×B = μ₀J_e + μ₀ε₀ ∂E/∂t"],
      magnetic: ["∇·B = μ₀ρ_m", "∇×E = −μ₀J_m − ∂B/∂t"],
    },
  };
}
