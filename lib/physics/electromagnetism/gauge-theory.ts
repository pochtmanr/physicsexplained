import type { FourPotential, FourVector, FieldTensor } from "@/lib/physics/electromagnetism/relativity";

/**
 * Apply a gauge transformation A_μ → A_μ + ∂_μΛ to a four-potential.
 * Lambda gradient is supplied directly as a four-vector (∂_μΛ) since we don't
 * carry a coordinate grid here. Returns the transformed four-potential.
 *
 * Gauge invariance: F^{μν} = ∂^μ A^ν − ∂^ν A^μ is unchanged because the
 * extra ∂^μ ∂_ν Λ − ∂^ν ∂_μ Λ vanishes by symmetry of mixed partials.
 */
export function gaugeTransformation(A: FourPotential, dLambda: FourVector): FourPotential {
  return [A[0] + dLambda[0], A[1] + dLambda[1], A[2] + dLambda[2], A[3] + dLambda[3]] as const;
}

/**
 * U(1) phase rotation: ψ → e^{iθ}ψ. The local version (θ a function of spacetime)
 * forces the introduction of a gauge field A_μ that transforms as A_μ → A_μ + ∂_μθ/q.
 * This is the "minimal coupling" prescription that turns ∂_μ → D_μ = ∂_μ + iqA_μ.
 *
 * Operates on a complex number represented as { re, im }.
 */
export function u1PhaseRotation(
  psi: { re: number; im: number },
  theta: number,
): { re: number; im: number } {
  const c = Math.cos(theta);
  const s = Math.sin(theta);
  return { re: psi.re * c - psi.im * s, im: psi.re * s + psi.im * c };
}

/**
 * Non-Abelian commutator [A_μ, A_ν] computed component-wise as a 4×4 matrix difference.
 * For Abelian U(1) this returns the zero tensor; for SU(N) gauge theories the commutator
 * is non-zero and contributes to the field strength F^{a}_{μν} = ∂_μ A^a_ν − ∂_ν A^a_μ
 * + g·f^{abc} A^b_μ A^c_ν. We don't carry the structure constants f^{abc} here; this
 * helper just gestures at the commutator structure.
 *
 * Used by §12.1 NonAbelianGestureScene to visualize that [A_μ, A_ν] ≠ 0 in non-Abelian
 * theories, in contrast to the Abelian case where every gauge field commutes with every other.
 */
export function nonAbelianCommutator(A: FieldTensor, B: FieldTensor): FieldTensor {
  const result: number[][] = [
    [0, 0, 0, 0],
    [0, 0, 0, 0],
    [0, 0, 0, 0],
    [0, 0, 0, 0],
  ];
  for (let i = 0; i < 4; i++) {
    for (let j = 0; j < 4; j++) {
      let abij = 0;
      let baij = 0;
      for (let k = 0; k < 4; k++) {
        abij += A[i][k] * B[k][j];
        baij += B[i][k] * A[k][j];
      }
      result[i][j] = abij - baij;
    }
  }
  return [
    [result[0][0], result[0][1], result[0][2], result[0][3]],
    [result[1][0], result[1][1], result[1][2], result[1][3]],
    [result[2][0], result[2][1], result[2][2], result[2][3]],
    [result[3][0], result[3][1], result[3][2], result[3][3]],
  ] as const;
}
