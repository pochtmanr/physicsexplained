/**
 * Dispersion and group velocity.
 *
 * A dispersion relation omega(k) tells us how the angular frequency of a
 * plane wave depends on its wavenumber. When that relation is linear —
 * omega = c * k — the medium is said to be non-dispersive; every Fourier
 * component travels at the same phase speed c and a pulse keeps its shape
 * forever. When omega(k) curves, different wavenumbers travel at different
 * speeds, and a compact wave packet inevitably smears out.
 *
 * This module provides:
 *   - phaseVelocity(omega, k):  v_p = omega / k
 *   - groupVelocity:            v_g = d omega / d k, evaluated numerically
 *   - a library of canonical dispersion relations (light in glass, quantum
 *     free particle, deep-water gravity waves, whistler mode in a plasma)
 *   - gaussianPacket(...) and dispersivePulse(...) for constructing and
 *     evolving a narrow-band wave packet under a dispersion relation.
 *
 * Everything here is deterministic, side-effect-free, and SI-compatible
 * when real units are plugged in; most callers supply dimensionless or
 * geometrised values for visualisation.
 */

/** Speed of light in vacuum, m/s. */
export const C_SI = 299_792_458;

// ─────────────────────────────────────────────────────────────────────────
// Basic velocities
// ─────────────────────────────────────────────────────────────────────────

/**
 * Phase velocity v_p = omega / k.
 *
 * The speed of an individual crest. Can exceed c in an anomalously
 * dispersive medium; no information travels at it.
 */
export function phaseVelocity(omega: number, k: number): number {
  if (k === 0) return Number.POSITIVE_INFINITY;
  return omega / k;
}

/**
 * Group velocity v_g = d omega / d k, estimated by a centred finite
 * difference.  The information and the energy of a wave packet move at v_g.
 */
export function groupVelocity(
  dispersionRelation: (k: number) => number,
  k: number,
  h: number = 1e-4,
): number {
  return (dispersionRelation(k + h) - dispersionRelation(k - h)) / (2 * h);
}

// ─────────────────────────────────────────────────────────────────────────
// Canonical dispersion relations
// ─────────────────────────────────────────────────────────────────────────

/**
 * Light in a medium with constant refractive index n.
 * omega(k) = c * k / n.  Non-dispersive — v_p = v_g = c / n.
 */
export function nonDispersive(n: number = 1): (k: number) => number {
  const c = C_SI / n;
  return (k: number) => c * k;
}

/**
 * Cauchy's empirical formula for light in glass:
 *   n(lambda) = A + B / lambda^2
 * Rewritten as omega(k) = c * k / n(k), with lambda = 2*pi/k.
 *
 * A ~ 1.5, B ~ 0.004 µm^2 for typical crown glass.  Supplying k in
 * reciprocal micrometres keeps the numbers pleasant.
 */
export function cauchyGlass(
  a: number = 1.5,
  bMicron2: number = 4e-3,
): (k: number) => number {
  return (k: number) => {
    const lambda = (2 * Math.PI) / k;
    const n = a + bMicron2 / (lambda * lambda);
    return (C_SI * k) / n;
  };
}

/**
 * Non-relativistic free Schrödinger particle.
 * omega(k) = hbar * k^2 / (2 * m).
 * v_p = hbar * k / (2m), v_g = hbar * k / m = p / m = classical velocity.
 * The factor-of-two gap between the two is the archetype of dispersion.
 */
export function schrodingerFreeParticle(
  hbar: number = 1,
  mass: number = 1,
): (k: number) => number {
  return (k: number) => (hbar * k * k) / (2 * mass);
}

/**
 * Deep-water gravity waves: omega = sqrt(g * k).
 * v_g = v_p / 2 — the famous "group travels at half the phase speed" result
 * that Stokes published in 1847.
 */
export function deepWaterGravityWave(
  gAccel: number = 9.80665,
): (k: number) => number {
  return (k: number) => Math.sqrt(gAccel * k);
}

// ─────────────────────────────────────────────────────────────────────────
// Wave packet construction
// ─────────────────────────────────────────────────────────────────────────

export interface GaussianPacketParams {
  /** Centre wavenumber of the packet (carrier). */
  k0: number;
  /** Spatial width of the initial envelope, at t = 0. */
  sigma: number;
  /** Dispersion relation omega(k). */
  omega: (k: number) => number;
  /** Number of Fourier components (odd is fine; default 257). */
  nModes?: number;
  /** How many sigma_k the spectrum spans (default 4). */
  spectrumHalfWidthSigmas?: number;
}

export interface PacketSample {
  x: number;
  /** Real part of the complex wave — what you plot as the carrier. */
  re: number;
  /** Modulus |psi(x,t)| — the envelope. */
  envelope: number;
}

/**
 * Evaluate a Gaussian wave packet at positions xs and time t.
 *
 * The packet is built as a narrow Gaussian superposition of plane waves
 * around k0. Each component evolves with its own omega(k), so a nonlinear
 * omega(k) causes the envelope to walk at v_g and broaden over time.
 *
 * Implementation: direct sum (not FFT) so we can step through continuous
 * time in a visualisation loop without rebuilding buffers.
 */
export function gaussianPacket(
  xs: readonly number[],
  t: number,
  params: GaussianPacketParams,
): PacketSample[] {
  const {
    k0,
    sigma,
    omega,
    nModes = 257,
    spectrumHalfWidthSigmas = 4,
  } = params;

  if (sigma <= 0) throw new Error("sigma must be positive");
  if (nModes < 3) throw new Error("nModes must be at least 3");

  // Wavenumber-space width: sigma_k = 1 / (sqrt(2) * sigma).
  // Using the convention |psi(x,0)|^2 ∝ exp(-x^2 / (2 sigma^2)).
  const sigmaK = 1 / (Math.SQRT2 * sigma);
  const kMin = k0 - spectrumHalfWidthSigmas * sigmaK;
  const kMax = k0 + spectrumHalfWidthSigmas * sigmaK;
  const dk = (kMax - kMin) / (nModes - 1);

  // Pre-compute the spectrum: A(k) ∝ exp(-(k - k0)^2 / (2 sigma_k^2)) dk.
  const ks = new Float64Array(nModes);
  const amps = new Float64Array(nModes);
  let norm = 0;
  for (let j = 0; j < nModes; j++) {
    const k = kMin + j * dk;
    const a = Math.exp(-((k - k0) ** 2) / (2 * sigmaK * sigmaK));
    ks[j] = k;
    amps[j] = a;
    norm += a;
  }
  // Normalise so that at t = 0 the peak envelope amplitude is 1.
  const scale = 1 / norm;

  const out: PacketSample[] = [];
  for (const x of xs) {
    let re = 0;
    let im = 0;
    for (let j = 0; j < nModes; j++) {
      const k = ks[j]!;
      const phase = k * x - omega(k) * t;
      const a = amps[j]! * scale;
      re += a * Math.cos(phase);
      im += a * Math.sin(phase);
    }
    out.push({
      x,
      re,
      envelope: Math.sqrt(re * re + im * im),
    });
  }
  return out;
}

/**
 * Analytic Gaussian-envelope spreading for a quadratic dispersion relation
 * omega(k) = omega0 + v_g * (k - k0) + 0.5 * beta * (k - k0)^2.
 *
 *   sigma(t) = sigma0 * sqrt(1 + (beta * t / sigma0^2)^2)
 *
 * Useful for tests and for the analytic overlay in the scene: whenever
 * beta != 0, the packet width grows without bound.
 */
export function gaussianWidth(
  sigma0: number,
  beta: number,
  t: number,
): number {
  const ratio = (beta * t) / (sigma0 * sigma0);
  return sigma0 * Math.sqrt(1 + ratio * ratio);
}

// ─────────────────────────────────────────────────────────────────────────
// Refractive index helpers
// ─────────────────────────────────────────────────────────────────────────

/**
 * Refractive index from phase velocity: n = c / v_p.
 */
export function refractiveIndex(phaseSpeed: number): number {
  return C_SI / phaseSpeed;
}

/**
 * Angle of minimum deviation for the primary rainbow, given index n.
 *
 * From Descartes (1637): the incoming ray that minimises deviation after
 * one internal reflection satisfies cos^2(theta_i) = (n^2 - 1) / 3.
 * The deviation is then D = 2 * theta_i - 4 * theta_r + pi, where
 * sin(theta_i) = n * sin(theta_r).
 *
 * For water (n = 1.333) this returns ~138° of deviation, i.e. the rainbow
 * appears on a cone of half-angle (180 - 138) = 42° around the antisolar
 * point.
 */
export function rainbowDeviationAngle(n: number): {
  incidenceDeg: number;
  deviationDeg: number;
  rainbowAngleDeg: number;
} {
  const cos2 = (n * n - 1) / 3;
  if (cos2 < 0 || cos2 > 1) {
    throw new Error(`no rainbow solution for n=${n}`);
  }
  const thetaI = Math.acos(Math.sqrt(cos2));
  const thetaR = Math.asin(Math.sin(thetaI) / n);
  const deviation = 2 * thetaI - 4 * thetaR + Math.PI;
  const deg = (r: number) => (r * 180) / Math.PI;
  return {
    incidenceDeg: deg(thetaI),
    deviationDeg: deg(deviation),
    rainbowAngleDeg: 180 - deg(deviation),
  };
}
