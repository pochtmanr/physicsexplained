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
