/**
 * Work, energy, and power — pure helpers for the FIG.05 scenes.
 *
 * None of these functions render; they model the physics and let the
 * scene components stay thin.
 */

const G = 9.80665;

/**
 * Work done by a constant force F on a displacement d, at angle θ between them.
 * W = F · d · cos θ (joules, with F in newtons and d in metres).
 */
export function constantWork(
  force: number,
  distance: number,
  angle: number = 0,
): number {
  return force * distance * Math.cos(angle);
}

/**
 * Kinetic energy ½·m·v².
 */
export function kineticEnergy(mass: number, velocity: number): number {
  return 0.5 * mass * velocity * velocity;
}

/**
 * Gravitational potential energy, m·g·h, measured from an arbitrary zero.
 */
export function gravitationalPE(
  mass: number,
  height: number,
  g: number = G,
): number {
  return mass * g * height;
}

/**
 * Elastic (spring) potential energy ½·k·x² of a Hookean spring stretched by x.
 */
export function springPE(stiffness: number, displacement: number): number {
  return 0.5 * stiffness * displacement * displacement;
}

/**
 * Slide a point mass down a symmetric parabolic bowl of half-width L
 * with bottom at y=0 and rim at y=H. Returns KE, PE, and total E at time t,
 * given optional coefficient of kinetic friction μ that bleeds energy.
 *
 * Bowl profile: y(x) = H · (x/L)².
 * For small-enough amplitudes this approximates simple harmonic motion
 * with ω² = 2gH/L². A constant fractional energy-loss per oscillation
 * is applied as an exponential envelope — crude but visually correct.
 */
export interface BowlState {
  x: number;
  y: number;
  v: number;
  ke: number;
  pe: number;
  total: number;
}

export function bowlState(
  t: number,
  amplitude: number,
  halfWidth: number,
  rimHeight: number,
  mass: number,
  friction: number,
  g: number = G,
): BowlState {
  const omega = Math.sqrt((2 * g * rimHeight) / (halfWidth * halfWidth));
  // Energy decay from friction: crude exponential envelope.
  const decay = Math.exp(-friction * t * omega * 0.2);
  const xAmp = Math.min(amplitude, halfWidth) * decay;
  const x = xAmp * Math.cos(omega * t);
  const v = -xAmp * omega * Math.sin(omega * t);
  const y = rimHeight * (x / halfWidth) * (x / halfWidth);
  const ke = 0.5 * mass * v * v;
  const pe = mass * g * y;
  return { x, y, v, ke, pe, total: ke + pe };
}

/**
 * Power — rate of doing work.  P = F · v for a constant force along motion.
 */
export function instantPower(force: number, velocity: number): number {
  return force * velocity;
}

/**
 * Average power W/Δt.
 */
export function averagePower(work: number, duration: number): number {
  if (duration <= 0) return 0;
  return work / duration;
}
