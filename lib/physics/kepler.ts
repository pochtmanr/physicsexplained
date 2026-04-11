/**
 * Newton-Raphson solver for Kepler's equation: M = E - e*sin(E).
 * Given mean anomaly M and eccentricity e, returns eccentric anomaly E.
 */

export interface KeplerSolveOptions {
  /** Convergence tolerance on |f(E)|. Default 1e-12. */
  tolerance?: number;
  /** Max iterations. Default 30. */
  maxIterations?: number;
  /** If true, returns an object with iteration count. */
  returnDiagnostics?: boolean;
}

export function solveKepler(M: number, e: number): number;
export function solveKepler(
  M: number,
  e: number,
  opts: KeplerSolveOptions & { returnDiagnostics: true },
): { E: number; iterations: number };
export function solveKepler(
  M: number,
  e: number,
  opts?: KeplerSolveOptions,
): number | { E: number; iterations: number } {
  const tol = opts?.tolerance ?? 1e-12;
  const maxIter = opts?.maxIterations ?? 30;

  // Normalize M to [-pi, pi] for numerical stability
  const Mnorm = Math.atan2(Math.sin(M), Math.cos(M));

  // Good initial guess: E0 = M + e*sin(M) (Danby)
  let E = Mnorm + e * Math.sin(Mnorm);
  let iterations = 0;

  for (let i = 0; i < maxIter; i++) {
    const f = E - e * Math.sin(E) - Mnorm;
    const fPrime = 1 - e * Math.cos(E);
    const dE = f / fPrime;
    E -= dE;
    iterations = i + 1;
    if (Math.abs(f) < tol) break;
  }

  if (opts?.returnDiagnostics) {
    return { E, iterations };
  }
  return E;
}

export interface OrbitPositionInput {
  /** Time in same units as T */
  t: number;
  /** Semi-major axis (any unit) */
  a: number;
  /** Eccentricity in [0, 1) */
  e: number;
  /** Orbital period in same units as t */
  T: number;
}

export interface OrbitPosition {
  /** Radial distance from focus (perihelion at t=0) */
  r: number;
  /** True anomaly (angle from perihelion, radians) */
  theta: number;
  /** Cartesian x in the orbital plane (perihelion along +x) */
  x: number;
  /** Cartesian y in the orbital plane */
  y: number;
}

/**
 * Compute Cartesian position on a Keplerian orbit at time t.
 * The focus containing the attracting body sits at the origin.
 * At t=0 the body is at perihelion (r = a(1-e), along +x).
 */
export function orbitPosition(input: OrbitPositionInput): OrbitPosition {
  const { t, a, e, T } = input;
  // Mean anomaly advances linearly with time: M = 2*pi*(t/T)
  const M = (2 * Math.PI * t) / T;
  // Solve Kepler's equation for the eccentric anomaly E
  const E = solveKepler(M, e);
  // True anomaly theta from eccentric anomaly via the standard formula
  const theta = 2 * Math.atan2(
    Math.sqrt(1 + e) * Math.sin(E / 2),
    Math.sqrt(1 - e) * Math.cos(E / 2),
  );
  // Radial distance
  const r = a * (1 - e * Math.cos(E));
  // Cartesian (perihelion along +x)
  const x = r * Math.cos(theta);
  const y = r * Math.sin(theta);
  return { r, theta, x, y };
}

export interface SweptAreaInput {
  /** Start time */
  t1: number;
  /** End time */
  t2: number;
  /** Semi-major axis */
  a: number;
  /** Eccentricity in [0, 1) */
  e: number;
  /** Orbital period */
  T: number;
}

/**
 * Area swept by the radius vector between times t1 and t2 on a Keplerian
 * orbit with semi-major axis a, eccentricity e, period T.
 *
 * Kepler's 2nd law: the area is linear in elapsed time, equal to
 *   (pi * a * b) * (t2 - t1) / T
 * where b = a * sqrt(1 - e^2) is the semi-minor axis.
 */
export function sweptArea(input: SweptAreaInput): number {
  const { t1, t2, a, e, T } = input;
  const b = a * Math.sqrt(1 - e * e);
  const totalArea = Math.PI * a * b;
  return (totalArea * (t2 - t1)) / T;
}
