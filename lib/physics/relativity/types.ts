/**
 * Special-relativistic types and helpers for the RELATIVITY branch.
 *
 * Conventions:
 *   • Mostly-minus metric signature (+,−,−,−), Griffiths convention (matches lib/physics/electromagnetism/relativity.ts).
 *   • Greek indices (0..3) on Vec4 correspond to (ct, x, y, z).
 *   • Boost velocity is given as β = v/c (dimensionless), not v.
 *   • Worldlines are parametric event sequences indexed by lab time or proper time, depending on context.
 */

export type Vec4 = readonly [number, number, number, number];

export interface MinkowskiPoint {
  /** Lab-frame time coordinate (seconds). */
  t: number;
  /** Spatial coordinates (meters). */
  x: number;
  y: number;
  z: number;
}

export interface Worldline {
  events: readonly MinkowskiPoint[];
  /** CSS color string for rendering. */
  color: string;
  label?: string;
  /** Optional: marks an accelerated worldline (changes color convention to orange). */
  accelerated?: boolean;
}

export type LorentzMatrix = readonly [Vec4, Vec4, Vec4, Vec4];

/** Lorentz factor γ = 1/√(1 − β²). */
export function gamma(beta: number): number {
  if (Math.abs(beta) >= 1) {
    throw new RangeError(`Lorentz factor undefined for |β| >= 1 (got ${beta})`);
  }
  return 1 / Math.sqrt(1 - beta * beta);
}

/** Lorentz boost matrix Λ along +x by velocity βc, mostly-minus signature. */
export function boostX(beta: number): LorentzMatrix {
  const g = gamma(beta);
  return [
    [g, -g * beta, 0, 0],
    [-g * beta, g, 0, 0],
    [0, 0, 1, 0],
    [0, 0, 0, 1],
  ] as const;
}

/** Lorentz boost matrix Λ along +y by velocity βc. */
export function boostY(beta: number): LorentzMatrix {
  const g = gamma(beta);
  return [
    [g, 0, -g * beta, 0],
    [0, 1, 0, 0],
    [-g * beta, 0, g, 0],
    [0, 0, 0, 1],
  ] as const;
}

/** Lorentz boost matrix Λ along +z by velocity βc. */
export function boostZ(beta: number): LorentzMatrix {
  const g = gamma(beta);
  return [
    [g, 0, 0, -g * beta],
    [0, 1, 0, 0],
    [0, 0, 1, 0],
    [-g * beta, 0, 0, g],
  ] as const;
}

/** Spatial rotation matrix in the (i, j) plane by angle θ (radians).
 *  axis = "x" rotates in the y-z plane; "y" in z-x; "z" in x-y. */
export function rotation(theta: number, axis: "x" | "y" | "z"): LorentzMatrix {
  const c = Math.cos(theta);
  const s = Math.sin(theta);
  if (axis === "x") {
    return [
      [1, 0, 0, 0],
      [0, 1, 0, 0],
      [0, 0, c, -s],
      [0, 0, s, c],
    ] as const;
  }
  if (axis === "y") {
    return [
      [1, 0, 0, 0],
      [0, c, 0, s],
      [0, 0, 1, 0],
      [0, -s, 0, c],
    ] as const;
  }
  return [
    [1, 0, 0, 0],
    [0, c, -s, 0],
    [0, s, c, 0],
    [0, 0, 0, 1],
  ] as const;
}

/** Apply a 4×4 Lorentz matrix to a 4-vector. Returns a new Vec4. */
export function applyMatrix(M: LorentzMatrix, v: Vec4): Vec4 {
  return [
    M[0][0] * v[0] + M[0][1] * v[1] + M[0][2] * v[2] + M[0][3] * v[3],
    M[1][0] * v[0] + M[1][1] * v[1] + M[1][2] * v[2] + M[1][3] * v[3],
    M[2][0] * v[0] + M[2][1] * v[1] + M[2][2] * v[2] + M[2][3] * v[3],
    M[3][0] * v[0] + M[3][1] * v[1] + M[3][2] * v[2] + M[3][3] * v[3],
  ] as const;
}

/** Convert a MinkowskiPoint to a Vec4 with components (ct, x, y, z). */
export function pointToVec4(p: MinkowskiPoint, c: number): Vec4 {
  return [c * p.t, p.x, p.y, p.z] as const;
}

/** Convert a Vec4 (ct, x, y, z) back to a MinkowskiPoint. */
export function vec4ToPoint(v: Vec4, c: number): MinkowskiPoint {
  return { t: v[0] / c, x: v[1], y: v[2], z: v[3] };
}

/** Quadrant classification of a Minkowski-interval relationship. */
export type LightConeQuadrant =
  | "timelike-future"
  | "timelike-past"
  | "spacelike"
  | "null-future"
  | "null-past"
  | "origin";

/** Minkowski norm-squared (mostly-minus signature) of a Vec4 (ct, x, y, z) or
 *  a four-momentum (E/c, p_x, p_y, p_z). Single source of truth — both
 *  four-vectors.ts and four-momentum.ts import from here, no duplicates. */
export function minkowskiNormSquared(v: Vec4): number {
  return v[0] * v[0] - v[1] * v[1] - v[2] * v[2] - v[3] * v[3];
}

/** Squared invariant interval s² = c²Δt² − Δx² − Δy² − Δz² between two events.
 *  Sign convention: timelike s² > 0, spacelike s² < 0, null s² = 0 (mostly-plus on the time component). */
export function intervalSquared(p1: MinkowskiPoint, p2: MinkowskiPoint, c: number): number {
  const dt = p1.t - p2.t;
  const dx = p1.x - p2.x;
  const dy = p1.y - p2.y;
  const dz = p1.z - p2.z;
  return c * c * dt * dt - dx * dx - dy * dy - dz * dz;
}

/** Classify the relationship between two events. `eps` is the absolute tolerance for null. */
export function classifyInterval(p1: MinkowskiPoint, p2: MinkowskiPoint, c: number, eps = 1e-12): LightConeQuadrant {
  const s2 = intervalSquared(p1, p2, c);
  const dt = p2.t - p1.t;
  if (Math.abs(s2) < eps && Math.abs(dt) < eps) return "origin";
  if (Math.abs(s2) < eps) return dt > 0 ? "null-future" : "null-past";
  if (s2 > 0) return dt > 0 ? "timelike-future" : "timelike-past";
  return "spacelike";
}

/** Semantic alias: a four-momentum is just a Vec4 with components (E/c, px, py, pz). */
export type FourMomentum = Vec4;

/** Rest mass m₀ recovered from a FourMomentum p^μ via the invariant
 *  m²c² = (E/c)² − |p|² (Griffiths convention). Returns m in kg if p is in SI units. */
export function restMass(p: FourMomentum, c: number): number {
  const E_over_c = p[0];
  const pSq = p[1] * p[1] + p[2] * p[2] + p[3] * p[3];
  const m2c2 = E_over_c * E_over_c - pSq;
  if (m2c2 < 0) {
    throw new RangeError(`restMass: spacelike four-momentum (m²c² = ${m2c2} < 0)`);
  }
  return Math.sqrt(m2c2) / c;
}
