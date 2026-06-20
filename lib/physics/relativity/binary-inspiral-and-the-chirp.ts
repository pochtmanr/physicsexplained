/**
 * §52 BINARY INSPIRAL AND THE CHIRP — pure-TS helpers.
 *
 * A bound binary of two compact masses radiates gravitational waves through
 * the time-varying mass quadrupole of its orbit. The radiation carries away
 * orbital energy and angular momentum, so the orbit shrinks: the separation
 * falls, the orbital frequency rises, and — because gravitational-wave power
 * scales steeply with frequency — the amplitude rises with it. Heard as sound,
 * the signal sweeps upward in pitch: the chirp.
 *
 * To leading (Newtonian / quadrupole) order every observable of the inspiral
 * is governed by a single combination of the two masses, the chirp mass:
 *
 *   M_c = (m1 m2)^{3/5} / (m1 + m2)^{1/5}
 *
 * The gravitational-wave frequency f (twice the orbital frequency) evolves as
 *
 *   df/dt = (96/5) π^{8/3} (G M_c / c³)^{5/3} f^{11/3}
 *
 * which integrates to the closed-form time-to-coalescence and the famous
 * f^{-8/3} secular sweep. This file is self-contained — it does not import
 * shared orbit machinery so the topic owns its own copy. React-free, typed.
 */

import { G_SI, SPEED_OF_LIGHT } from "@/lib/physics/constants";

/** Solar mass in kilograms (IAU nominal). */
export const M_SUN = 1.98892e30;

/** Megaparsec in metres (for strain-amplitude estimates). */
export const MPC_M = 3.0856775814913673e22;

/** Convenience re-exports so tests need a single import. */
export const G = G_SI;
export const C = SPEED_OF_LIGHT;

/**
 * Chirp mass M_c = (m1 m2)^{3/5} / (m1 + m2)^{1/5}.
 *
 * The single combination of component masses that controls the leading-order
 * inspiral waveform. Two very different (m1, m2) pairs with the same chirp
 * mass produce nearly identical early-inspiral signals — which is why M_c is
 * the first, tightest quantity any detection pins down.
 *
 * @param m1 first mass (any consistent unit — kg or M_sun)
 * @param m2 second mass (same unit as m1)
 * @returns chirp mass in the same unit as the inputs
 */
export function chirpMass(m1: number, m2: number): number {
  if (m1 <= 0 || m2 <= 0) {
    throw new Error("chirpMass: masses must be positive");
  }
  return Math.pow(m1 * m2, 0.6) / Math.pow(m1 + m2, 0.2);
}

/** Total mass M = m1 + m2 (same unit as inputs). */
export function totalMass(m1: number, m2: number): number {
  return m1 + m2;
}

/** Symmetric mass ratio η = m1 m2 / (m1 + m2)². Ranges (0, 1/4]; equal masses give 1/4. */
export function symmetricMassRatio(m1: number, m2: number): number {
  const M = m1 + m2;
  return (m1 * m2) / (M * M);
}

/**
 * Reduced "mass in time units": the gravitational radius of the chirp mass
 * divided by c, G M_c / c³, in seconds. This is the natural timescale of the
 * inspiral and the quantity that actually appears in df/dt.
 *
 * @param chirpMass_kg chirp mass in kilograms
 */
export function chirpTimeScale(chirpMass_kg: number): number {
  return (G * chirpMass_kg) / Math.pow(C, 3);
}

/**
 * Quadrupole-formula frequency evolution:
 *
 *   df/dt = (96/5) π^{8/3} (G M_c / c³)^{5/3} f^{11/3}
 *
 * with f the gravitational-wave frequency (Hz), i.e. twice the orbital
 * frequency. Returns df/dt in Hz/s. Always positive — the binary always
 * spins up.
 *
 * @param f             gravitational-wave frequency, Hz
 * @param chirpMass_kg  chirp mass, kg
 */
export function frequencyDot(f: number, chirpMass_kg: number): number {
  const tau = chirpTimeScale(chirpMass_kg); // G M_c / c³ in s
  return (
    (96 / 5) *
    Math.pow(Math.PI, 8 / 3) *
    Math.pow(tau, 5 / 3) *
    Math.pow(f, 11 / 3)
  );
}

/**
 * Time remaining until coalescence for a binary currently radiating at GW
 * frequency f. Integrating df/dt analytically gives:
 *
 *   t_coal = (5/256) (G M_c / c³)^{-5/3} (π f)^{-8/3}
 *
 * @param f             current GW frequency, Hz
 * @param chirpMass_kg  chirp mass, kg
 * @returns seconds to merger (Newtonian estimate; ignores merger/ringdown)
 */
export function timeToCoalescence(f: number, chirpMass_kg: number): number {
  const tau = chirpTimeScale(chirpMass_kg);
  return (5 / 256) * Math.pow(tau, -5 / 3) * Math.pow(Math.PI * f, -8 / 3);
}

/**
 * Closed-form frequency as a function of time-to-coalescence τ = t_coal − t.
 * Inverting timeToCoalescence:
 *
 *   f(τ) = (1/π) (5 / (256 τ))^{3/8} (G M_c / c³)^{-5/8}
 *
 * Diverges as τ → 0 (formally, where the point-mass approximation breaks
 * down). Used to render the chirp's rising frequency directly from physics.
 *
 * @param tau           time before coalescence, s (τ > 0)
 * @param chirpMass_kg  chirp mass, kg
 */
export function frequencyAtTimeToMerger(
  tau: number,
  chirpMass_kg: number,
): number {
  if (tau <= 0) throw new Error("frequencyAtTimeToMerger: tau must be > 0");
  const ts = chirpTimeScale(chirpMass_kg);
  return (
    (1 / Math.PI) *
    Math.pow(5 / (256 * tau), 3 / 8) *
    Math.pow(ts, -5 / 8)
  );
}

/**
 * Orbital separation (Keplerian) for a circular binary of total mass M_kg
 * radiating at GW frequency f. Orbital frequency is f/2, so by Kepler's third
 * law a = (G M / ω_orb²)^{1/3} with ω_orb = π f.
 *
 * @param f       GW frequency, Hz
 * @param M_kg    total mass, kg
 * @returns separation in metres
 */
export function orbitalSeparation(f: number, M_kg: number): number {
  const omegaOrb = Math.PI * f; // orbital angular frequency = π f
  return Math.cbrt((G * M_kg) / (omegaOrb * omegaOrb));
}

/**
 * Order-of-magnitude GW strain amplitude at distance D for a circular binary:
 *
 *   h ≈ (4/D) (G M_c / c²)^{5/3} (π f / c)^{2/3}
 *
 * This is the leading quadrupole amplitude (averaged over orientation up to an
 * O(1) factor). Returns the dimensionless strain h.
 *
 * @param f             GW frequency, Hz
 * @param chirpMass_kg  chirp mass, kg
 * @param distance_m    luminosity distance, m
 */
export function strainAmplitude(
  f: number,
  chirpMass_kg: number,
  distance_m: number,
): number {
  const rc = (G * chirpMass_kg) / (C * C); // gravitational radius of M_c, m
  return (
    (4 / distance_m) *
    Math.pow(rc, 5 / 3) *
    Math.pow((Math.PI * f) / C, 2 / 3)
  );
}

/**
 * Innermost stable circular orbit (ISCO) GW frequency for total mass M_kg.
 * Schwarzschild ISCO sits at r = 6 G M / c²; the orbital frequency there gives
 * a GW frequency
 *
 *   f_ISCO = c³ / (6^{3/2} π G M)
 *
 * A reasonable "end of inspiral" marker for the chirp.
 *
 * @param M_kg total mass, kg
 */
export function iscoFrequency(M_kg: number): number {
  return Math.pow(C, 3) / (Math.pow(6, 1.5) * Math.PI * G * M_kg);
}

/**
 * Sample the strain waveform h(t) of the inspiral on a time grid, using the
 * leading-order chirp: frequency from frequencyAtTimeToMerger, amplitude from
 * strainAmplitude, phase from integrating 2π f. The phase integral has a
 * closed form, ϕ(τ) = −2 (5 ts / τ)^{... } — but we integrate numerically on
 * the grid for clarity and robustness.
 *
 * Returns parallel arrays { t, f, h } where t runs from −durationBefore up to
 * −tEnd (both measured as time-before-merger, so t = −τ). The waveform is
 * h(t) = A(τ) cos(ϕ(τ)).
 *
 * @param chirpMass_kg chirp mass, kg
 * @param totalMass_kg total mass, kg (sets the ISCO cutoff)
 * @param distance_m   distance, m (sets overall amplitude scale)
 * @param samples      number of grid points
 */
export function inspiralWaveform(
  chirpMass_kg: number,
  totalMass_kg: number,
  distance_m: number,
  samples = 400,
): { t: number[]; f: number[]; h: number[]; fMax: number } {
  // End the inspiral at the ISCO frequency (or its time-to-merger).
  const fIsco = iscoFrequency(totalMass_kg);
  const tauEnd = timeToCoalescence(fIsco, chirpMass_kg); // smallest τ we show
  // Start ~ a few seconds earlier (whatever the duration of the visible chirp).
  const tauStart = Math.max(tauEnd * 50, tauEnd + 1e-3);

  const t: number[] = [];
  const f: number[] = [];
  const h: number[] = [];
  let phase = 0;
  let prevTau = tauStart;
  let fMax = 0;

  for (let i = 0; i < samples; i++) {
    // τ decreases geometrically so the late, fast part is well resolved.
    const frac = i / (samples - 1);
    const tau = tauStart * Math.pow(tauEnd / tauStart, frac);
    const fi = frequencyAtTimeToMerger(tau, chirpMass_kg);
    const Ai = strainAmplitude(fi, chirpMass_kg, distance_m);
    // dt between this and previous sample (time advances as τ decreases).
    const dt = prevTau - tau;
    phase += 2 * Math.PI * fi * dt;
    prevTau = tau;
    t.push(-tau);
    f.push(fi);
    h.push(Ai * Math.cos(phase));
    if (fi > fMax) fMax = fi;
  }

  return { t, f, h, fMax };
}

/** Hz → musical-pitch-ish helper: returns frequency in Hz unchanged but
 *  clamped to the audible band for "you could hear this" annotations. */
export function audibleFraction(f: number): number {
  const lo = 20;
  const hi = 2000;
  if (f <= lo) return 0;
  if (f >= hi) return 1;
  return (f - lo) / (hi - lo);
}

/**
 * Cumulative shift of the time of periastron for the Hulse–Taylor pulsar,
 * accumulated by orbital decay. The orbital period decays at a nearly constant
 * rate Ṗ (s/s), so the period at time t is P(t) ≈ P0 (1 + (Ṗ/P0) t) and the
 * cumulative phase drift of periastron relative to a constant-period clock is
 *
 *   ΔT(t) = ½ (Ṗ / P0) t²   (a parabola in t)
 *
 * That downward parabola, plotted against decades of data, is the iconic
 * Hulse–Taylor figure: measured points lying on the GR-predicted curve.
 *
 * @param t_s     elapsed time since the epoch, seconds
 * @param P0_s    orbital period at epoch, seconds
 * @param Pdot    dimensionless period derivative Ṗ (s/s, negative for decay)
 * @returns cumulative periastron-time shift in seconds (negative = early)
 */
export function cumulativePeriastronShift(
  t_s: number,
  P0_s: number,
  Pdot: number,
): number {
  return 0.5 * (Pdot / P0_s) * t_s * t_s;
}

/** Hulse–Taylor PSR B1913+16 orbital parameters (Weisberg & Huang 2016). */
export const HULSE_TAYLOR = {
  /** Orbital period, seconds (≈ 7.75 hours). */
  period_s: 27906.98,
  /** GR-predicted period derivative, dimensionless (s/s). */
  PdotGR: -2.40242e-12,
  /** Orbital eccentricity. */
  eccentricity: 0.6171334,
} as const;
