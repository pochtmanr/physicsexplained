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
  /** Absolute tolerance (default 1e-8) */
  absTol?: number;
  /** Relative tolerance (default 1e-8) */
  relTol?: number;
  /** Maximum internal integration steps (default 200000) */
  maxSteps?: number;
}

/**
 * Integrate an ODE system from t=0 to t=tEnd and return N evenly-spaced samples.
 * Uses odex (adaptive high-order RK).
 *
 * DEVIATION from plan: The odex 3.x API takes (f, n, options) in the constructor.
 * Also, floating-point rounding in `dt * (nSamples-1)` can cause the grid to emit
 * nSamples-1 points instead of nSamples. We use a slightly extended tEnd to the
 * grid and cap samples at nSamples to guarantee the correct count.
 */
export function integrate(opts: IntegrateOptions): ODESample[] {
  const {
    y0,
    rhs,
    tEnd,
    nSamples,
    absTol = 1e-8,
    relTol = 1e-8,
    maxSteps = 200000,
  } = opts;

  if (nSamples < 2) {
    throw new Error("nSamples must be at least 2");
  }

  const n = y0.length;
  // Compute target times explicitly to avoid floating-point drift
  const times: number[] = Array.from({ length: nSamples }, (_, i) =>
    i === nSamples - 1 ? tEnd : (tEnd * i) / (nSamples - 1),
  );

  const solver = new Solver(
    (t: number, y: number[]) => rhs(t, y),
    n,
    {
      absoluteTolerance: absTol,
      relativeTolerance: relTol,
      denseOutput: true,
      maxSteps,
    },
  );

  const samples: ODESample[] = [];

  // Use the grid with dt = times[1] - times[0]; grid starts at xOld (=0)
  // and steps by dt. The first call t=0 corresponds to times[0].
  const dt = tEnd / (nSamples - 1);
  let gridIndex = 0;

  solver.solve(0, [...y0], tEnd, solver.grid(dt, (t: number, y: number[]) => {
    if (gridIndex < nSamples) {
      samples.push({ t: times[gridIndex]!, y: [...y] });
      gridIndex++;
    }
  }));

  // If floating-point caused the last grid point to be missed, append it
  // by re-integrating with the exact tEnd
  if (samples.length < nSamples) {
    const result = new Solver(
      (t: number, y: number[]) => rhs(t, y),
      n,
      { absoluteTolerance: absTol, relativeTolerance: relTol, denseOutput: false, maxSteps },
    ).solve(0, [...y0], tEnd);
    samples.push({ t: tEnd, y: [...result.y] });
  }

  return samples;
}
