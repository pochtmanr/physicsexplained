/**
 * §07 THE METRIC TENSOR — pure-TS helpers.
 *
 * The metric tensor g_{μν} is the object that turns coordinate differences into
 * actual distances. Without it a manifold has only differential structure; with it
 * the manifold has lengths, angles, areas, and volumes.
 *
 * Key identity: ds² = g_{μν} dx^μ dx^ν  (Einstein summation implied).
 *
 * This module provides:
 *   • lineElement      — ds² = g_{μν} dx^μ dx^ν for any n-dimensional metric.
 *   • sphericalMetric2D — g on S²: diag(R², R² sin²θ).
 *   • polarMetric2D    — flat plane in polars: diag(1, r²).
 *   • minkowskiMetric4D — η = diag(+1, −1, −1, −1) in mostly-minus convention.
 *   • det2             — determinant of a 2×2 metric.
 *   • inverse2         — inverse of a 2×2 metric (raises indices).
 *   • magnitudeSquared — |V|² = g_{μν} V^μ V^ν.
 *   • metricDot        — g_{μν} U^μ V^ν (inner product of two vectors).
 */

// ─── Line element ──────────────────────────────────────────────────────────────

/**
 * Compute the line-element ds² = g_{μν} dx^μ dx^ν given metric g and
 * infinitesimal displacement dx.
 *
 * Works for any dimension n: g must be n×n, dx must have length n.
 */
export function lineElement(
  g: ReadonlyArray<readonly number[]>,
  dx: readonly number[],
): number {
  const n = dx.length;
  let acc = 0;
  for (let mu = 0; mu < n; mu++) {
    for (let nu = 0; nu < n; nu++) {
      acc += g[mu][nu] * dx[mu] * dx[nu];
    }
  }
  return acc;
}

// ─── Standard metrics ─────────────────────────────────────────────────────────

/**
 * Metric on a 2-sphere of radius R in coordinates (θ, φ):
 *   ds² = R²(dθ² + sin²θ dφ²)
 *   g = diag(R², R² sin²θ)
 *
 * Note: at θ = 0 (north pole) the dφ term vanishes — pole degeneracy.
 */
export function sphericalMetric2D(
  R: number,
  theta: number,
): readonly [readonly [number, number], readonly [number, number]] {
  return [
    [R * R, 0],
    [0, R * R * Math.sin(theta) * Math.sin(theta)],
  ] as const;
}

/**
 * Euclidean polar metric in coordinates (r, φ):
 *   ds² = dr² + r² dφ²
 *   g = diag(1, r²)
 *
 * At r = 1 this reduces to the identity. The off-diagonal elements are always 0.
 */
export function polarMetric2D(
  r: number,
): readonly [readonly [number, number], readonly [number, number]] {
  return [
    [1, 0],
    [0, r * r],
  ] as const;
}

/**
 * Minkowski metric η_{μν} = diag(+1, −1, −1, −1).
 *
 * Mostly-minus (space-like) convention — the sign carried through
 * from the §03.2 invariant interval. Coordinates ordered (ct, x, y, z).
 *
 * A null vector satisfies η_{μν} V^μ V^ν = 0.
 * A timelike vector satisfies η_{μν} V^μ V^ν > 0.
 * A spacelike vector satisfies η_{μν} V^μ V^ν < 0.
 */
export function minkowskiMetric4D(): readonly [
  readonly [number, number, number, number],
  readonly [number, number, number, number],
  readonly [number, number, number, number],
  readonly [number, number, number, number],
] {
  return [
    [1, 0, 0, 0],
    [0, -1, 0, 0],
    [0, 0, -1, 0],
    [0, 0, 0, -1],
  ] as const;
}

// ─── 2×2 matrix utilities ─────────────────────────────────────────────────────

/**
 * Determinant of a 2×2 metric.
 *   det g = g_{00} g_{11} − g_{01} g_{10}
 *
 * Used to compute the volume element √(|g|) d²x.
 */
export function det2(
  g: readonly [readonly [number, number], readonly [number, number]],
): number {
  return g[0][0] * g[1][1] - g[0][1] * g[1][0];
}

/**
 * Inverse of a 2×2 metric (used to raise indices).
 *
 * g^{μν} satisfies g^{μν} g_{νρ} = δ^μ_ρ.
 * The inverse is the standard 2×2 formula divided by the determinant.
 * Throws a RangeError if the metric is singular (det ≈ 0).
 */
export function inverse2(
  g: readonly [readonly [number, number], readonly [number, number]],
): readonly [readonly [number, number], readonly [number, number]] {
  const d = det2(g);
  if (Math.abs(d) < 1e-12)
    throw new RangeError(`inverse2: singular metric (det = ${d})`);
  return [
    [g[1][1] / d, -g[0][1] / d],
    [-g[1][0] / d, g[0][0] / d],
  ] as const;
}

// ─── Vector operations ────────────────────────────────────────────────────────

/**
 * Magnitude squared of a vector with respect to a metric:
 *   |V|² = g_{μν} V^μ V^ν
 *
 * Equivalent to lineElement(g, V). Under the Minkowski metric a null
 * vector returns exactly 0.
 */
export function magnitudeSquared(
  g: ReadonlyArray<readonly number[]>,
  V: readonly number[],
): number {
  return lineElement(g, V);
}

/**
 * Inner product of two vectors with respect to a metric:
 *   g(U, V) = g_{μν} U^μ V^ν
 *
 * Symmetric for symmetric g: metricDot(g, U, V) = metricDot(g, V, U).
 */
export function metricDot(
  g: ReadonlyArray<readonly number[]>,
  U: readonly number[],
  V: readonly number[],
): number {
  const n = U.length;
  let acc = 0;
  for (let mu = 0; mu < n; mu++) {
    for (let nu = 0; nu < n; nu++) {
      acc += g[mu][nu] * U[mu] * V[nu];
    }
  }
  return acc;
}
