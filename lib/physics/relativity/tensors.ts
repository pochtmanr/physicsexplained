/**
 * §07.2 TENSORS ON CURVED SPACE — pure-TS helpers.
 *
 * A type-(p, q) tensor at a point p of a manifold is a multilinear map from
 * p copies of the cotangent space T*M and q copies of the tangent space TM
 * to ℝ. In a coordinate basis the tensor has n^(p+q) components which
 * transform under coordinate changes by:
 *
 *   • Contravariant (upper) index μ:  T'^...a... = (∂x'^a/∂x^μ) T'^...μ...
 *   • Covariant (lower) index ν:      T'_...a... = (∂x^ν/∂x'^a) T_...ν...
 *
 * The metric tensor g_{μν} lowers a contravariant index; its inverse g^{μν}
 * raises a covariant index.  Both operations are called "index gymnastics."
 *
 * References: Ricci & Levi-Civita, "Méthodes de calcul différentiel absolu"
 * (1900); Misner, Thorne & Wheeler §2 (1973).
 */

/** A type-(p, q) tensor in n dimensions has n^(p+q) components. */
export function tensorComponentCount(p: number, q: number, n: number): number {
  if (
    p < 0 ||
    q < 0 ||
    n <= 0 ||
    !Number.isInteger(p) ||
    !Number.isInteger(q) ||
    !Number.isInteger(n)
  ) {
    throw new RangeError(
      `tensorComponentCount: requires non-negative integer p, q and positive integer n`,
    );
  }
  return Math.pow(n, p + q);
}

/**
 * Apply a coordinate-Jacobian transformation to a contravariant index of a
 * vector V^μ.
 *
 *   V'^a = (∂x'^a/∂x^μ) V^μ.   (Einstein sum over μ)
 *
 * The Jacobian J[a][μ] = ∂x'^a/∂x^μ.
 */
export function transformContravariant(
  J: ReadonlyArray<readonly number[]>,
  V: readonly number[],
): readonly number[] {
  const n = V.length;
  if (J.length !== n)
    throw new Error(
      `Jacobian rows (${J.length}) must match vector length (${n})`,
    );
  const result: number[] = new Array(n).fill(0);
  for (let a = 0; a < n; a++) {
    if (J[a].length !== n)
      throw new Error(
        `Jacobian row ${a} has length ${J[a].length}, expected ${n}`,
      );
    for (let mu = 0; mu < n; mu++) result[a] += J[a][mu] * V[mu];
  }
  return result;
}

/**
 * Apply an inverse-Jacobian transformation to a covariant index of a
 * covector ω_μ.
 *
 *   ω'_a = (∂x^μ/∂x'^a) ω_μ.   (Einstein sum over μ)
 *
 * The inverse-Jacobian Jinv[μ][a] = ∂x^μ/∂x'^a.
 */
export function transformCovariant(
  Jinv: ReadonlyArray<readonly number[]>,
  omega: readonly number[],
): readonly number[] {
  const n = omega.length;
  const result: number[] = new Array(n).fill(0);
  for (let a = 0; a < n; a++) {
    let acc = 0;
    for (let mu = 0; mu < n; mu++) acc += Jinv[mu][a] * omega[mu];
    result[a] = acc;
  }
  return result;
}

/**
 * Lower a contravariant vector V^μ to a covariant one V_μ = g_{μν} V^ν,
 * given metric g.
 */
export function lowerIndex(
  g: ReadonlyArray<readonly number[]>,
  V: readonly number[],
): readonly number[] {
  const n = V.length;
  const result: number[] = new Array(n).fill(0);
  for (let mu = 0; mu < n; mu++) {
    let acc = 0;
    for (let nu = 0; nu < n; nu++) acc += g[mu][nu] * V[nu];
    result[mu] = acc;
  }
  return result;
}

/**
 * Raise a covariant vector V_μ to a contravariant one V^μ = g^{μν} V_ν,
 * given the inverse metric gInv.
 */
export function raiseIndex(
  gInv: ReadonlyArray<readonly number[]>,
  V: readonly number[],
): readonly number[] {
  const n = V.length;
  const result: number[] = new Array(n).fill(0);
  for (let mu = 0; mu < n; mu++) {
    let acc = 0;
    for (let nu = 0; nu < n; nu++) acc += gInv[mu][nu] * V[nu];
    result[mu] = acc;
  }
  return result;
}

/**
 * Invert a 2×2 matrix (small case used in scene examples).
 *
 * Returns [[d/det, -b/det], [-c/det, a/det]] for M = [[a, b], [c, d]].
 * Throws if the matrix is singular (|det| < 1e-12).
 */
export function invertMatrix2(
  M: readonly [readonly [number, number], readonly [number, number]],
): readonly [readonly [number, number], readonly [number, number]] {
  const det = M[0][0] * M[1][1] - M[0][1] * M[1][0];
  if (Math.abs(det) < 1e-12)
    throw new RangeError(
      `invertMatrix2: matrix is singular (det = ${det})`,
    );
  return [
    [M[1][1] / det, -M[0][1] / det],
    [-M[1][0] / det, M[0][0] / det],
  ] as const;
}
