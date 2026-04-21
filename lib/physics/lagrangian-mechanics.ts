/**
 * Lagrangian mechanics — numerical helpers for FIG.29 (The Lagrangian).
 *
 * This module exists to make the Lagrangian topic concrete:
 *
 *   1. `simplePendulumLagrangian` — closed-form L(θ, θ̇) for the single
 *      pendulum, so a test can check that the Euler-Lagrange machinery
 *      (differentiated analytically) reproduces the familiar equation of
 *      motion θ̈ = −(g/L) sin θ.
 *
 *   2. `doublePendulumRhs` / `solveDoublePendulum` — the double pendulum,
 *      derived once from L = T − V via Euler-Lagrange and solved with the
 *      existing odex integrator. This is the iconic "Newton is pain,
 *      Lagrange is clean" example of FIG.29.
 *
 *   3. `doublePendulumEnergy` — for sanity: a conservative double pendulum
 *      must preserve E = T + V along every trajectory. The test file
 *      exercises this and is how we know the ODE right-hand side is right.
 *
 * The cycloid / tautochrone geometry and timing already live in
 * `lib/physics/cycloid.ts` and are re-exported here for convenience, so
 * FIG.29's "constraints" section can grab everything from a single place.
 */
import { g_SI } from "./constants";
import { integrate, type ODESample } from "./ode";

export { tautochroneTime, cycloidArch } from "./cycloid";

// ---------- single pendulum ----------

export interface SimplePendulumParams {
  /** Bob mass, kg */
  m: number;
  /** Rod length, m */
  L: number;
  /** Gravity, m/s^2 */
  g?: number;
}

/**
 * Lagrangian of a simple pendulum in the natural generalised coordinate θ.
 *
 *   T = ½ m L² θ̇²
 *   V = m g L (1 − cos θ)
 *   L = T − V
 */
export function simplePendulumLagrangian(
  theta: number,
  thetaDot: number,
  params: SimplePendulumParams,
): number {
  const { m, L, g = g_SI } = params;
  const T = 0.5 * m * L * L * thetaDot * thetaDot;
  const V = m * g * L * (1 - Math.cos(theta));
  return T - V;
}

/**
 * Analytical Euler-Lagrange result for the simple pendulum:
 *   θ̈ = −(g / L) sin θ.
 * The mass drops out. This is the equation of motion that the single-pendulum
 * FIG.29 section derives in prose; this function is the numerical witness.
 */
export function simplePendulumThetaDDot(
  theta: number,
  L: number,
  g: number = g_SI,
): number {
  return -(g / L) * Math.sin(theta);
}

// ---------- double pendulum ----------

export interface DoublePendulumParams {
  /** Upper-rod length, m */
  L1: number;
  /** Lower-rod length, m */
  L2: number;
  /** Upper-bob mass, kg */
  m1: number;
  /** Lower-bob mass, kg */
  m2: number;
  /** Gravity, m/s^2 */
  g?: number;
}

export interface DoublePendulumState {
  /** Upper angle from vertical, rad */
  theta1: number;
  /** Lower angle from vertical, rad */
  theta2: number;
  /** dθ₁/dt, rad/s */
  omega1: number;
  /** dθ₂/dt, rad/s */
  omega2: number;
}

/**
 * Right-hand side of the double-pendulum ODE.
 *
 * The state is [θ₁, θ₂, ω₁, ω₂]. The explicit forms of ω̇₁ and ω̇₂ below are
 * the textbook result of applying the Euler-Lagrange equations
 *   d/dt(∂L/∂θ̇ᵢ) − ∂L/∂θᵢ = 0, i = 1, 2,
 * to the Lagrangian
 *   L = ½(m₁+m₂)L₁²θ̇₁² + ½m₂L₂²θ̇₂² + m₂L₁L₂θ̇₁θ̇₂ cos(θ₁−θ₂)
 *        + (m₁+m₂)g L₁ cos θ₁ + m₂ g L₂ cos θ₂,
 * then solving the resulting 2×2 linear system for (θ̈₁, θ̈₂).
 */
export function doublePendulumRhs(
  y: number[],
  params: DoublePendulumParams,
): number[] {
  const { L1, L2, m1, m2, g = g_SI } = params;
  const theta1 = y[0]!;
  const theta2 = y[1]!;
  const omega1 = y[2]!;
  const omega2 = y[3]!;
  const delta = theta1 - theta2;
  const sinD = Math.sin(delta);
  const cosD = Math.cos(delta);
  const den1 = L1 * (2 * m1 + m2 - m2 * Math.cos(2 * delta));
  const den2 = L2 * (2 * m1 + m2 - m2 * Math.cos(2 * delta));

  const num1 =
    -g * (2 * m1 + m2) * Math.sin(theta1) -
    m2 * g * Math.sin(theta1 - 2 * theta2) -
    2 * sinD * m2 * (omega2 * omega2 * L2 + omega1 * omega1 * L1 * cosD);
  const num2 =
    2 * sinD *
    (omega1 * omega1 * L1 * (m1 + m2) +
      g * (m1 + m2) * Math.cos(theta1) +
      omega2 * omega2 * L2 * m2 * cosD);

  return [omega1, omega2, num1 / den1, num2 / den2];
}

/**
 * Total mechanical energy E = T + V of the double pendulum.
 * Along any trajectory of the conservative equations of motion this must
 * be constant — used as a numerical health check in the tests.
 */
export function doublePendulumEnergy(
  state: DoublePendulumState,
  params: DoublePendulumParams,
): number {
  const { L1, L2, m1, m2, g = g_SI } = params;
  const { theta1, theta2, omega1, omega2 } = state;
  const delta = theta1 - theta2;

  // Cartesian velocities of each bob, via chain rule on the positions.
  const v1sq = L1 * L1 * omega1 * omega1;
  const v2sq =
    L1 * L1 * omega1 * omega1 +
    L2 * L2 * omega2 * omega2 +
    2 * L1 * L2 * omega1 * omega2 * Math.cos(delta);

  const T = 0.5 * m1 * v1sq + 0.5 * m2 * v2sq;

  // Potential with y measured upward; the pivot is the zero. Both bobs hang
  // down, so y₁ = −L₁ cos θ₁ and y₂ = −L₁ cos θ₁ − L₂ cos θ₂.
  const y1 = -L1 * Math.cos(theta1);
  const y2 = y1 - L2 * Math.cos(theta2);
  const V = m1 * g * y1 + m2 * g * y2;

  return T + V;
}

export interface DoublePendulumSolveInput {
  initial: DoublePendulumState;
  params: DoublePendulumParams;
  /** Integration horizon, seconds */
  tEnd: number;
  /** Number of evenly-spaced samples (≥ 2) */
  nSamples: number;
}

export interface DoublePendulumSample {
  t: number;
  state: DoublePendulumState;
}

/**
 * Integrate the double pendulum from `initial` over [0, tEnd].
 * Returns `nSamples` evenly-spaced states.
 */
export function solveDoublePendulum(
  input: DoublePendulumSolveInput,
): DoublePendulumSample[] {
  const { initial, params, tEnd, nSamples } = input;
  const y0 = [initial.theta1, initial.theta2, initial.omega1, initial.omega2];
  const samples: ODESample[] = integrate({
    y0,
    rhs: (_t, y) => doublePendulumRhs(y, params),
    tEnd,
    nSamples,
  });
  return samples.map((s) => ({
    t: s.t,
    state: {
      theta1: s.y[0]!,
      theta2: s.y[1]!,
      omega1: s.y[2]!,
      omega2: s.y[3]!,
    },
  }));
}
