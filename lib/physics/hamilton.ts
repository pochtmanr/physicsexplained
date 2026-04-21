/**
 * Hamiltonian integrators for the two-body Kepler problem.
 *
 * The scene and tests contrast two numerical schemes:
 *   - Forward Euler (non-symplectic) — drifts in energy/angular-momentum.
 *   - Leapfrog / Störmer-Verlet (symplectic) — preserves phase-space volume
 *     and keeps a closed elliptic orbit stable for many periods.
 *
 * Working in units where the central mass parameter µ = GM = 1 and the
 * initial distance is 1. The Hamiltonian is
 *
 *   H(q, p) = |p|² / 2  −  1 / |q|
 *
 * with equations of motion q̇ = p,  ṗ = −q / |q|³.
 */

export interface OrbitState {
  /** Position (x, y) */
  q: [number, number];
  /** Momentum (px, py) */
  p: [number, number];
}

/** Gravitational acceleration for a unit-mass particle in a 1/r potential. */
export function keplerAcceleration(q: [number, number]): [number, number] {
  const r2 = q[0] * q[0] + q[1] * q[1];
  const r = Math.sqrt(r2);
  const r3 = r2 * r;
  return [-q[0] / r3, -q[1] / r3];
}

/** H(q, p) = |p|²/2 − 1/|q| for a unit-mass particle in µ = 1 potential. */
export function keplerEnergy(state: OrbitState): number {
  const r = Math.sqrt(state.q[0] ** 2 + state.q[1] ** 2);
  const pSq = state.p[0] ** 2 + state.p[1] ** 2;
  return 0.5 * pSq - 1 / r;
}

/** z-component of angular momentum L = q × p. */
export function keplerAngularMomentum(state: OrbitState): number {
  return state.q[0] * state.p[1] - state.q[1] * state.p[0];
}

/**
 * One forward-Euler step. Uses q and p at time t to produce q and p at t + dt.
 * Non-symplectic: H is NOT preserved, and over many periods the orbit spirals
 * outward (energy increases toward zero) even for bound Kepler motion.
 */
export function eulerStep(state: OrbitState, dt: number): OrbitState {
  const a = keplerAcceleration(state.q);
  return {
    q: [state.q[0] + dt * state.p[0], state.q[1] + dt * state.p[1]],
    p: [state.p[0] + dt * a[0], state.p[1] + dt * a[1]],
  };
}

/**
 * One leapfrog / Störmer-Verlet step — the simplest symplectic integrator.
 * Alternates half-kicks and a full drift:
 *
 *   p_{1/2} = p + (dt/2) · f(q)
 *   q'      = q + dt · p_{1/2}
 *   p'      = p_{1/2} + (dt/2) · f(q')
 *
 * Preserves the symplectic 2-form dq ∧ dp exactly, so H is conserved up to
 * bounded oscillations for any finite step size. Equivalent to Newton's
 * second law applied to a velocity-Verlet step for a unit-mass particle.
 */
export function leapfrogStep(state: OrbitState, dt: number): OrbitState {
  const a1 = keplerAcceleration(state.q);
  const pMidX = state.p[0] + 0.5 * dt * a1[0];
  const pMidY = state.p[1] + 0.5 * dt * a1[1];
  const qNew: [number, number] = [
    state.q[0] + dt * pMidX,
    state.q[1] + dt * pMidY,
  ];
  const a2 = keplerAcceleration(qNew);
  return {
    q: qNew,
    p: [pMidX + 0.5 * dt * a2[0], pMidY + 0.5 * dt * a2[1]],
  };
}

/**
 * Integrate a fixed-step orbit forward for a given wall-clock span. Returns
 * samples of {t, q, p} at each step.
 */
export function integrateOrbit(
  method: "euler" | "leapfrog",
  initial: OrbitState,
  dt: number,
  steps: number,
): { t: number; state: OrbitState }[] {
  const step = method === "euler" ? eulerStep : leapfrogStep;
  const out: { t: number; state: OrbitState }[] = [
    { t: 0, state: { q: [...initial.q], p: [...initial.p] } },
  ];
  let s = initial;
  for (let i = 1; i <= steps; i++) {
    s = step(s, dt);
    out.push({ t: i * dt, state: { q: [...s.q], p: [...s.p] } });
  }
  return out;
}

/**
 * Produce an initial state for a circular orbit of radius r around the origin,
 * moving counterclockwise. For µ = 1 the circular speed is v = 1/√r.
 */
export function circularOrbitInitial(r: number): OrbitState {
  const v = 1 / Math.sqrt(r);
  return { q: [r, 0], p: [0, v] };
}

/**
 * Initial state for an elliptic orbit of semi-major axis a and eccentricity e,
 * starting at periapsis on the +x axis. In reduced units (µ = 1).
 * At periapsis the speed is v_p = √((1+e)/((1−e)·a)).
 */
export function ellipticOrbitInitial(a: number, e: number): OrbitState {
  const rPeri = a * (1 - e);
  const vPeri = Math.sqrt((1 + e) / (a * (1 - e)));
  return { q: [rPeri, 0], p: [0, vPeri] };
}
