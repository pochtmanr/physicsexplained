/**
 * §53 LIGO AND MULTI-MESSENGER ASTRONOMY — pure physics helpers.
 *
 * React-free, typed numerics for three scenes:
 *   (a) the Michelson interferometer arm response to a passing GW;
 *   (b) the GW150914 chirp template (Newtonian quadrupole inspiral);
 *   (c) sky triangulation from inter-detector arrival-time differences.
 *
 * Conventions:
 *   - SI units unless noted. c = 2.99792458e8 m/s, G = 6.674e-11.
 *   - Strain h is dimensionless: fractional length change ΔL/L.
 *   - A "+" polarized wave travelling along z stretches one arm (x) while
 *     squeezing the orthogonal arm (y) by the same fractional amount.
 *
 * This file is unique to the ligo-and-multi-messenger topic. It deliberately
 * re-derives the small amount of inspiral math it needs rather than importing a
 * shared module, so the topic is self-contained.
 */

export const C_LIGHT = 2.99792458e8; // m/s
export const G_NEWTON = 6.674e-11; // m^3 kg^-1 s^-2
export const SOLAR_MASS = 1.98892e30; // kg
export const MPC = 3.0856775815e22; // metres in a megaparsec

// ─────────────────────────────────────────────────────────────────────────────
// (a) Interferometer arm response
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Differential arm-length change for a "+" polarized wave of strain amplitude
 * `h` on a Michelson interferometer with arm length `armLength` (metres).
 *
 * One arm changes by +½ h L, the orthogonal arm by −½ h L, so the *difference*
 * the interferometer actually measures is ΔL = h · L. Returns that difference
 * in metres.
 */
export function differentialArmChange(h: number, armLength: number): number {
  return h * armLength;
}

/**
 * Fractional length change of a single arm. For a "+" wave, the x-arm sees
 * +½h and the y-arm sees −½h. `sign` selects which arm (+1 or −1).
 */
export function singleArmStrain(h: number, sign: 1 | -1): number {
  return 0.5 * sign * h;
}

/**
 * Round-trip phase shift accumulated by light of wavelength `lambda` (metres)
 * traversing an arm of length `L` that has changed length by `dL`, folded
 * `bounces` times by the Fabry–Pérot cavity (LIGO ≈ 280 effective bounces).
 *
 * Δφ = (2π / λ) · 2 · bounces · dL.  Returns radians.
 */
export function armPhaseShift(
  dL: number,
  lambda: number,
  bounces = 1,
): number {
  return (2 * Math.PI / lambda) * 2 * bounces * dL;
}

/**
 * Normalised optical power at the dark port of an ideal Michelson as a function
 * of the *differential* phase between the two arms. At Δφ = 0 the port is dark
 * (destructive interference); the GW pushes it off the dark fringe.
 *
 * P/P_in = sin²(Δφ / 2), clamped to [0, 1].
 */
export function darkPortPower(phaseDifference: number): number {
  const s = Math.sin(phaseDifference / 2);
  return s * s;
}

// ─────────────────────────────────────────────────────────────────────────────
// (b) Chirp mass and the inspiral waveform
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Chirp mass M_c = (m1 m2)^{3/5} / (m1 + m2)^{1/5}.
 * Inputs and output in solar masses.
 */
export function chirpMass(m1: number, m2: number): number {
  return Math.pow(m1 * m2, 3 / 5) / Math.pow(m1 + m2, 1 / 5);
}

/**
 * Gravitational-wave frequency f_gw of a circular binary as a function of time
 * before merger, from the leading-order (Newtonian / quadrupole) chirp:
 *
 *   f_gw(τ) = (1/π) · (5/256 · 1/τ)^{3/8} · (G M_c / c³)^{−5/8}
 *
 * where τ = t_coalesce − t is the time remaining before coalescence (seconds)
 * and M_c is the chirp mass in kg. Returns Hz. Diverges as τ → 0; callers
 * should cap at a physical merger frequency.
 */
export function chirpFrequency(tau: number, chirpMassKg: number): number {
  if (tau <= 0) return Infinity;
  const mc = (G_NEWTON * chirpMassKg) / (C_LIGHT * C_LIGHT * C_LIGHT);
  const a = Math.pow((5 / 256) * (1 / tau), 3 / 8);
  return (1 / Math.PI) * a * Math.pow(mc, -5 / 8);
}

/**
 * Frequency-domain "innermost stable circular orbit" (ISCO) gravitational-wave
 * frequency for a binary of total mass `totalMassSolar` (solar masses),
 * a convenient cap for where the inspiral template stops being valid:
 *
 *   f_isco ≈ c³ / (6^{3/2} π G M).  Returns Hz.
 */
export function iscoFrequency(totalMassSolar: number): number {
  const M = totalMassSolar * SOLAR_MASS;
  return (
    (C_LIGHT * C_LIGHT * C_LIGHT) /
    (Math.pow(6, 1.5) * Math.PI * G_NEWTON * M)
  );
}

/**
 * Strain amplitude envelope of the inspiral at instantaneous GW frequency
 * `f` (Hz) for a source at luminosity distance `distanceMpc`:
 *
 *   h(f) ∝ (G M_c / c²)^{5/3} (π f)^{2/3} / (c² · D)
 *
 * Returns the dimensionless strain amplitude. The amplitude grows as the
 * frequency sweeps up, which is why the chirp gets *louder* as it climbs.
 */
export function strainAmplitude(
  f: number,
  chirpMassSolar: number,
  distanceMpc: number,
): number {
  const mc = chirpMassSolar * SOLAR_MASS;
  const D = distanceMpc * MPC;
  const c2 = C_LIGHT * C_LIGHT;
  const factor = Math.pow((G_NEWTON * mc) / c2, 5 / 3);
  const freqTerm = Math.pow(Math.PI * f, 2 / 3);
  return (4 / (c2 * D)) * factor * freqTerm;
}

/**
 * Reconstructed strain time series of an inspiral, sampled from `tStart` to
 * `tEnd` (seconds, with coalescence at t = 0, so both are negative) at
 * `samples` points. Returns parallel arrays of t (s), f (Hz) and h (strain),
 * suitable for a waveform plot. The amplitude is normalised to `hPeak` at the
 * final sample so scenes can exaggerate honestly.
 */
export interface ChirpWaveform {
  t: number[];
  f: number[];
  h: number[];
}

export function chirpWaveform(opts: {
  m1Solar: number;
  m2Solar: number;
  tStart: number; // negative seconds before merger
  tEnd: number; // negative, closer to 0
  samples: number;
  hPeak?: number;
  fMaxHz?: number;
}): ChirpWaveform {
  const { m1Solar, m2Solar, tStart, tEnd, samples } = opts;
  const hPeak = opts.hPeak ?? 1;
  const mcKg = chirpMass(m1Solar, m2Solar) * SOLAR_MASS;
  const fMax = opts.fMaxHz ?? iscoFrequency(m1Solar + m2Solar);

  const t: number[] = [];
  const f: number[] = [];
  const hRaw: number[] = [];

  // Integrate phase so the oscillation stays continuous: φ(t) = ∫ 2π f dt.
  let phase = 0;
  let prevT = tStart;
  let maxAbs = 1e-30;

  for (let i = 0; i < samples; i++) {
    const ti = tStart + (tEnd - tStart) * (i / (samples - 1));
    const tau = -ti; // time before coalescence
    let fi = chirpFrequency(Math.max(tau, 1e-4), mcKg);
    if (fi > fMax) fi = fMax;

    const dt = ti - prevT;
    phase += 2 * Math.PI * fi * dt;
    prevT = ti;

    // Amplitude grows with frequency (∝ f^{2/3}).
    const amp = Math.pow(fi, 2 / 3);
    const hi = amp * Math.cos(phase);

    t.push(ti);
    f.push(fi);
    hRaw.push(hi);
    if (Math.abs(hi) > maxAbs) maxAbs = Math.abs(hi);
  }

  const h = hRaw.map((v) => (v / maxAbs) * hPeak);
  return { t, f, h };
}

// ─────────────────────────────────────────────────────────────────────────────
// (c) Sky localization from arrival-time differences
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Light-travel time between two detectors a baseline `baselineKm` apart, for a
 * source whose direction makes angle `theta` (radians) with the baseline.
 * A wavefront reaches the near detector earlier by Δt = (D/c) cos θ.
 * Returns seconds.
 */
export function arrivalTimeDelay(baselineKm: number, theta: number): number {
  const D = baselineKm * 1000;
  return (D / C_LIGHT) * Math.cos(theta);
}

/**
 * Given a measured arrival-time difference `dt` (seconds) between two detectors
 * `baselineKm` apart, return the cone half-angle θ (radians) the source must
 * lie on: cos θ = c·dt / D. Returns NaN if the geometry is impossible
 * (|c·dt| > D, i.e. a delay larger than the baseline allows).
 */
export function timingRingAngle(dt: number, baselineKm: number): number {
  const D = baselineKm * 1000;
  const x = (C_LIGHT * dt) / D;
  if (x < -1 || x > 1) return NaN;
  return Math.acos(x);
}

/**
 * Maximum timing uncertainty translated to an angular localization width for a
 * single detector pair. With timing precision `sigmaT` (seconds) and baseline
 * `baselineKm`, the ring has angular thickness Δθ ≈ c·σ_t / (D·sin θ).
 * Evaluated at θ = 90° (the most favourable case) it is c·σ_t / D radians.
 * Returns radians; clamps sin θ away from 0.
 */
export function ringThickness(
  sigmaT: number,
  baselineKm: number,
  theta = Math.PI / 2,
): number {
  const D = baselineKm * 1000;
  const s = Math.max(Math.abs(Math.sin(theta)), 1e-3);
  return (C_LIGHT * sigmaT) / (D * s);
}

/**
 * Rough sky-localization area (square degrees) from `nDetectors` operating with
 * timing precision `sigmaT` (seconds) and a characteristic baseline
 * `baselineKm`. Two detectors give a ring (a thin annulus spanning the sky);
 * three intersect to a patch. This is a teaching estimate, not a survey-grade
 * calculation.
 */
export function localizationAreaDeg2(
  nDetectors: number,
  sigmaT: number,
  baselineKm: number,
): number {
  const dThetaRad = ringThickness(sigmaT, baselineKm);
  const dThetaDeg = (dThetaRad * 180) / Math.PI;
  if (nDetectors <= 1) return 41253; // whole sphere in deg²
  if (nDetectors === 2) {
    // A full great-circle ring (360°) of width dThetaDeg.
    return 360 * dThetaDeg;
  }
  // Three+ detectors: two rings cross at a patch ~ dThetaDeg on a side.
  return dThetaDeg * dThetaDeg;
}
