/**
 * Damped harmonic oscillator — free and driven solutions.
 */

export interface DampedParams {
  /** Natural angular frequency omega0 = sqrt(k/m) */
  omega0: number;
  /** Damping coefficient gamma = b/m */
  gamma: number;
}

/**
 * Free damped oscillator starting from x0 with zero initial velocity.
 * Handles all three regimes: underdamped, critically damped, overdamped.
 */
export function dampedFree(t: number, x0: number, params: DampedParams): number {
  const { omega0, gamma } = params;
  const disc = omega0 * omega0 - (gamma * gamma) / 4;

  if (disc > 0) {
    // Underdamped
    const omegaD = Math.sqrt(disc);
    return (
      x0 *
      Math.exp((-gamma * t) / 2) *
      (Math.cos(omegaD * t) + (gamma / (2 * omegaD)) * Math.sin(omegaD * t))
    );
  } else if (disc === 0) {
    // Critically damped
    return x0 * Math.exp((-gamma * t) / 2) * (1 + (gamma * t) / 2);
  } else {
    // Overdamped
    const alpha = Math.sqrt(-disc);
    const r1 = -gamma / 2 + alpha;
    const r2 = -gamma / 2 - alpha;
    const c1 = x0 * r2 / (r2 - r1);
    const c2 = -x0 * r1 / (r2 - r1);
    return c1 * Math.exp(r1 * t) + c2 * Math.exp(r2 * t);
  }
}

/**
 * Steady-state amplitude of a driven damped oscillator.
 * A(omegaD) = F0 / sqrt((omega0^2 - omegaD^2)^2 + (gamma * omegaD)^2)
 */
export function drivenAmplitude(
  omegaD: number,
  F0: number,
  params: DampedParams,
): number {
  const { omega0, gamma } = params;
  const diff = omega0 * omega0 - omegaD * omegaD;
  return F0 / Math.sqrt(diff * diff + gamma * gamma * omegaD * omegaD);
}

/**
 * Quality factor Q = omega0 / gamma.
 * Higher Q means less damping relative to oscillation frequency.
 */
export function qualityFactor(params: DampedParams): number {
  return params.omega0 / params.gamma;
}
