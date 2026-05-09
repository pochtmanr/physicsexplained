/**
 * §07 MANIFOLDS AND TANGENT SPACES — pure-TS helpers.
 *
 * A smooth n-manifold is a space that locally looks like ℝⁿ — but whose global
 * topology need not be flat. The sphere S² is a 2-manifold; spacetime is a
 * 4-manifold. At every point p there is a tangent space T_p M — the vector
 * space of tangent vectors at p, spanned by the coordinate basis ∂/∂x^μ.
 *
 * This module provides:
 *   • ChartPoint — (u, v) coordinates in a two-dimensional chart.
 *   • Embedding3D — a smooth map ℝ² → ℝ³ that realises a 2-manifold in
 *     ambient 3-space (used only for rendering; the physics does not require it).
 *   • sphereEmbedding — standard spherical parametrisation.
 *   • pushforwardJacobian — numerical ∂_u/∂_v columns of the Jacobian at a point.
 *   • pushforward — converts a chart-coordinate tangent vector into an ambient ℝ³ vector.
 */

// Vec4 is used by other relativity modules; import here to satisfy the types.ts cross-reference
// even though the manifold helpers only need Vec3 internally.
import type { Vec4 } from "./types";
// Re-export so callers can import Vec4 from this file without a circular dep.
export type { Vec4 };

// ─── Chart types ──────────────────────────────────────────────────────────────

/** A point on a 2-manifold specified by its coordinates (u, v) in some chart. */
export interface ChartPoint {
  u: number;
  v: number;
}

// ─── Embedding ────────────────────────────────────────────────────────────────

/** A smooth embedding ℝ² → ℝ³ used to render 2-manifolds. */
export type Embedding3D = (u: number, v: number) => readonly [number, number, number];

/**
 * Standard sphere of radius R parametrised by (u = θ, v = φ):
 *   x = R sin θ cos φ,  y = R sin θ sin φ,  z = R cos θ.
 *
 * Range: θ ∈ [0, π], φ ∈ [0, 2π].
 * North pole: (u=0, v=anything) → (0, 0, R).
 * Equator:    (u=π/2, v=0)     → (R, 0, 0).
 */
export function sphereEmbedding(R: number): Embedding3D {
  return (u, v) => [
    R * Math.sin(u) * Math.cos(v),
    R * Math.sin(u) * Math.sin(v),
    R * Math.cos(u),
  ] as const;
}

// ─── Pushforward (tangent-map) ─────────────────────────────────────────────────

/**
 * Numerical Jacobian (pushforward) at chart point (u, v).
 *
 * Returns the two ambient vectors that span the tangent plane:
 *   [∂_u embedding, ∂_v embedding]
 *
 * Each column is computed by a forward-difference approximation with step eps.
 * On a unit sphere at (u = π/2, v = 0):
 *   ∂_u embedding ≈ (0, 0, −1)  (magnitude = R = 1)
 *   ∂_v embedding ≈ (0, 1, 0)   (magnitude = R sin θ = 1)
 */
export function pushforwardJacobian(
  embed: Embedding3D,
  u: number,
  v: number,
  eps = 1e-3,
): readonly [readonly [number, number, number], readonly [number, number, number]] {
  const p0 = embed(u, v);
  const pU = embed(u + eps, v);
  const pV = embed(u, v + eps);
  return [
    [
      (pU[0] - p0[0]) / eps,
      (pU[1] - p0[1]) / eps,
      (pU[2] - p0[2]) / eps,
    ] as const,
    [
      (pV[0] - p0[0]) / eps,
      (pV[1] - p0[1]) / eps,
      (pV[2] - p0[2]) / eps,
    ] as const,
  ] as const;
}

/**
 * Convert a tangent vector given in chart coordinates (du, dv) into ambient ℝ³
 * via the pushforward at point (u, v).
 *
 * Result: du · ∂_u embedding + dv · ∂_v embedding.
 */
export function pushforward(
  embed: Embedding3D,
  u: number,
  v: number,
  du: number,
  dv: number,
): readonly [number, number, number] {
  const [eU, eV] = pushforwardJacobian(embed, u, v);
  return [
    du * eU[0] + dv * eV[0],
    du * eU[1] + dv * eV[1],
    du * eU[2] + dv * eV[2],
  ] as const;
}
