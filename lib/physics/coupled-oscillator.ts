/**
 * Two identical pendulums coupled by a spring.
 *
 * Normal-mode frequencies:
 *   omega_1 = omega0              (in-phase mode)
 *   omega_2 = sqrt(omega0^2 + omegaC^2)  (anti-phase mode)
 *
 * omega0 = sqrt(g/L), omegaC = sqrt(2k/m) where k is coupling spring constant.
 */

export interface CoupledParams {
  /** Natural frequency of each uncoupled pendulum, sqrt(g/L) */
  omega0: number;
  /** Coupling frequency, sqrt(2k/m) */
  omegaC: number;
}

/**
 * Beat solution: initial condition theta1 = A, theta2 = 0, both at rest.
 * Returns { theta1, theta2 } at time t.
 */
export function coupledBeats(
  t: number,
  A: number,
  params: CoupledParams,
): { theta1: number; theta2: number } {
  const { omega0, omegaC } = params;
  const omega1 = omega0;
  const omega2 = Math.sqrt(omega0 * omega0 + omegaC * omegaC);

  const sum = (omega1 + omega2) / 2;
  const diff = (omega2 - omega1) / 2;

  const theta1 = A * Math.cos(diff * t) * Math.cos(sum * t);
  const theta2 = A * Math.sin(diff * t) * Math.sin(sum * t);

  return { theta1, theta2 };
}

/**
 * In-phase normal mode: both pendulums swing together at omega0.
 */
export function coupledMode1(
  t: number,
  A: number,
  params: CoupledParams,
): { theta1: number; theta2: number } {
  const val = A * Math.cos(params.omega0 * t);
  return { theta1: val, theta2: val };
}

/**
 * Anti-phase normal mode: pendulums swing opposite at sqrt(omega0^2 + omegaC^2).
 */
export function coupledMode2(
  t: number,
  A: number,
  params: CoupledParams,
): { theta1: number; theta2: number } {
  const { omega0, omegaC } = params;
  const omega2 = Math.sqrt(omega0 * omega0 + omegaC * omegaC);
  const val = A * Math.cos(omega2 * t);
  return { theta1: val, theta2: -val };
}
