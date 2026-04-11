// eslint-disable-next-line @typescript-eslint/no-require-imports
const { Solver } = require("odex") as { Solver: new (f: unknown, n: number, opts?: object) => OdexSolver };

interface OdexSolver {
  solve(x0: number, y0: number[], xEnd: number, solOut?: unknown): { y: number[] };
  grid(dt: number, out: (t: number, y: number[]) => void): unknown;
}

export interface ODESample {
  t: number;
  y: number[];
}

export interface IntegrateOptions {
  /** Initial state vector */
  y0: number[];
  /** Right-hand side f(t, y) returning dy/dt */
  rhs: (t: number, y: number[]) => number[];
  /** End time (integration starts at t=0) */
  tEnd: number;
  /** Number of samples to return, evenly spaced in [0, tEnd] */
  nSamples: number;
  /** Absolute tolerance (default 1e-10) */
  absTol?: number;
  /** Relative tolerance (default 1e-10) */
  relTol?: number;
}

/**
 * Integrate an ODE system from t=0 to t=tEnd and return N evenly-spaced samples.
 * Uses odex (adaptive high-order RK).
 *
 * NOTE: The odex 3.x API takes (f, n, options) in the constructor, unlike what
 * the plan assumed. The RHS signature is f(x, y) returning a new array (not mutating yPrime).
 */
export function integrate(opts: IntegrateOptions): ODESample[] {
  const {
    y0,
    rhs,
    tEnd,
    nSamples,
    absTol = 1e-10,
    relTol = 1e-10,
  } = opts;

  if (nSamples < 2) {
    throw new Error("nSamples must be at least 2");
  }

  const n = y0.length;
  const dt = tEnd / (nSamples - 1);

  const samples: ODESample[] = [];

  const solver = new Solver(
    (t: number, y: number[]) => rhs(t, y),
    n,
    {
      absoluteTolerance: absTol,
      relativeTolerance: relTol,
      denseOutput: true,
    },
  );

  // First sample is the initial condition
  samples.push({ t: 0, y: [...y0] });

  solver.solve(0, [...y0], tEnd, solver.grid(dt, (t: number, y: number[]) => {
    if (t === 0) return; // already pushed
    samples.push({ t, y: [...y] });
  }));

  return samples;
}
