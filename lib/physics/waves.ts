/**
 * One-dimensional wave helpers.
 *
 * The PDE at the core of this file is the wave equation
 *
 *   ∂²y/∂t² = v² · ∂²y/∂x²
 *
 * d'Alembert (1746) showed its general solution is any right-mover plus any
 * left-mover: y(x, t) = f(x − v·t) + g(x + v·t). These helpers implement the
 * common shapes we draw on the site — sinusoids, Gaussian pulses — along
 * with the dispersion-free wave kinematics that tie them together.
 */

export interface SinusoidalWaveParams {
  /** Displacement amplitude, metres */
  amplitude: number;
  /** Wavelength λ, metres */
  wavelength: number;
  /** Frequency f, hertz */
  frequency: number;
  /** Optional phase offset in radians (default 0) */
  phase?: number;
}

/** Angular wavenumber k = 2π / λ (rad/m). */
export function waveNumber(wavelength: number): number {
  if (wavelength <= 0) throw new Error("wavelength must be positive");
  return (2 * Math.PI) / wavelength;
}

/** Angular frequency ω = 2π f (rad/s). */
export function angularFrequency(frequency: number): number {
  return 2 * Math.PI * frequency;
}

/** Phase (propagation) velocity v = f · λ (m/s). */
export function phaseVelocity(frequency: number, wavelength: number): number {
  return frequency * wavelength;
}

/** Period T = 1 / f (s). */
export function period(frequency: number): number {
  if (frequency === 0) throw new Error("frequency must be non-zero");
  return 1 / frequency;
}

/** Speed of a transverse wave on a stretched string: v = √(T / μ). */
export function stringWaveSpeed(tension: number, linearDensity: number): number {
  if (tension < 0 || linearDensity <= 0) {
    throw new Error("tension must be ≥ 0 and linear density must be > 0");
  }
  return Math.sqrt(tension / linearDensity);
}

/**
 * Sinusoidal travelling wave: y = A · sin(k·x − ω·t + φ).
 * Propagates in +x at phase velocity v = ω/k = f·λ.
 */
export function sineWave(
  x: number,
  t: number,
  params: SinusoidalWaveParams,
): number {
  const { amplitude, wavelength, frequency, phase = 0 } = params;
  const k = waveNumber(wavelength);
  const omega = angularFrequency(frequency);
  return amplitude * Math.sin(k * x - omega * t + phase);
}

/**
 * Gaussian pulse centred at x0 at time t = 0, moving with velocity v.
 * At a given time t, the pulse has drifted to x0 + v·t without changing shape.
 */
export function gaussianPulse(
  x: number,
  t: number,
  x0: number,
  v: number,
  width: number,
  amplitude: number,
): number {
  if (width <= 0) throw new Error("width must be positive");
  const centre = x0 + v * t;
  const dx = (x - centre) / width;
  return amplitude * Math.exp(-dx * dx);
}

/**
 * d'Alembert's general solution to the wave equation.
 * Returns f(x − v·t) + g(x + v·t) for arbitrary shape functions f and g.
 */
export function dAlembert(
  x: number,
  t: number,
  v: number,
  f: (u: number) => number,
  g: (u: number) => number,
): number {
  return f(x - v * t) + g(x + v * t);
}

/**
 * Time-averaged energy per unit length of a sinusoidal transverse wave on a
 * string: ⟨u⟩ = (1/2) · μ · A² · ω². (Equal split between kinetic and
 * elastic-potential contributions.)
 */
export function linearEnergyDensity(
  linearDensity: number,
  amplitude: number,
  angFreq: number,
): number {
  if (linearDensity <= 0) throw new Error("linear density must be positive");
  return 0.5 * linearDensity * amplitude * amplitude * angFreq * angFreq;
}

/**
 * Time-averaged power delivered by a sinusoidal wave on a string:
 * ⟨P⟩ = ⟨u⟩ · v = (1/2) · μ · v · A² · ω².
 */
export function wavePower(
  linearDensity: number,
  amplitude: number,
  angFreq: number,
  waveSpeed: number,
): number {
  return linearEnergyDensity(linearDensity, amplitude, angFreq) * waveSpeed;
}

/**
 * Verify that a shape f satisfies the wave equation numerically. For any
 * twice-differentiable f, y(x,t) = f(x − v·t) + g(x + v·t) has
 * ∂²y/∂t² = v² · ∂²y/∂x². Returns the residual
 * |∂²y/∂t² − v² · ∂²y/∂x²| computed via centred differences — intended
 * for the unit-test suite, not for rendering.
 */
export function waveEquationResidual(
  y: (x: number, t: number) => number,
  x: number,
  t: number,
  v: number,
  h: number = 1e-3,
): number {
  const ytt =
    (y(x, t + h) - 2 * y(x, t) + y(x, t - h)) / (h * h);
  const yxx =
    (y(x + h, t) - 2 * y(x, t) + y(x - h, t)) / (h * h);
  return Math.abs(ytt - v * v * yxx);
}
