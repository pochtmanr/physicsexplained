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
