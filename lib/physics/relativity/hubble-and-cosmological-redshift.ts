/**
 * §56 HUBBLE AND COSMOLOGICAL REDSHIFT — pure-TS helpers.
 *
 * Two ideas live in this topic, and the helpers separate them cleanly.
 *
 *   1. The LOCAL Hubble law (Hubble 1929): for nearby galaxies the recession
 *      velocity is proportional to distance,  v = H₀ d.  This is the
 *      low-redshift, "straight-line" approximation that Hubble fit to 24
 *      galaxies.
 *
 *   2. The EXACT cosmological redshift: light emitted when the scale factor was
 *      a_emit and received today (a = 1) is stretched by exactly the factor by
 *      which space has expanded,  1 + z = a_now / a_emit.  No velocity enters;
 *      this is NOT a Doppler shift.
 *
 * This module is React-free and dependency-light. It is a NEW file unique to
 * the hubble-and-cosmological-redshift topic — it intentionally re-derives the
 * handful of FLRW relations it needs rather than importing the shared
 * the-flrw-metric.ts, so the topic owns its own helpers and tests. Lengths are
 * returned in megaparsecs (Mpc) and times in gigayears (Gyr) unless noted.
 */

// ─── Units / constants the topic needs (self-contained) ──────────────────────

/** Speed of light in km/s — the natural unit for redshift / Hubble work. */
export const C_KM_S = 299_792.458;

/** Conversion: 1 Mpc = 3.0856775814913673e19 km. */
export const MPC_KM = 3.0856775814913673e19;

/** Seconds in a Julian year. */
export const YEAR_S = 365.25 * 86400;

/** Concordance (Planck-ish) parameters used by the lookback scene. Default
 *  H₀ in km/s/Mpc; matter and dark-energy density fractions (flat, Ω_r tiny). */
export interface CosmoParams {
  /** Hubble constant today, km/s/Mpc. */
  H0: number;
  /** Matter density parameter Ω_m. */
  Om: number;
  /** Dark-energy (Λ) density parameter Ω_Λ. */
  OL: number;
  /** Radiation density parameter Ω_r (tiny today, matters at high z). */
  Or: number;
}

/** A reasonable concordance default (flat, Ω total ≈ 1). */
export const CONCORDANCE: CosmoParams = {
  H0: 67.4,
  Om: 0.315,
  OL: 0.685,
  Or: 9.0e-5,
};

// ─── 1. The local Hubble law  v = H₀ d ───────────────────────────────────────

/**
 * Hubble recession velocity (km/s) for a galaxy at distance d (Mpc):
 *
 *   v = H₀ · d
 *
 * Valid only for small d / small z — it is the tangent line to the true,
 * curved velocity–distance relation at the origin. Hubble's 1929 fit covered
 * d ≲ 2 Mpc, where the approximation is excellent.
 */
export function hubbleVelocity(H0: number, dMpc: number): number {
  return H0 * dMpc;
}

/**
 * Distance (Mpc) inferred from a recession velocity (km/s) via the local
 * Hubble law, d = v / H₀. The inverse of `hubbleVelocity`.
 */
export function hubbleDistance(H0: number, vKmS: number): number {
  if (H0 === 0) return Infinity;
  return vKmS / H0;
}

/**
 * Hubble time t_H = 1 / H₀, returned in gigayears. With H₀ in km/s/Mpc this is
 * the rough age the universe would have if it had always expanded at today's
 * rate — within ~5% of the true age for the concordance model by coincidence
 * of Ω_m and Ω_Λ.
 */
export function hubbleTimeGyr(H0: number): number {
  // 1/H0 in seconds: (Mpc in km) / (H0 km/s/Mpc) = s
  const tSec = MPC_KM / H0;
  return tSec / YEAR_S / 1e9;
}

/** Hubble radius / length c/H₀ in Mpc — the distance at which the naive
 *  Hubble velocity equals c. */
export function hubbleRadiusMpc(H0: number): number {
  return C_KM_S / H0;
}

// ─── 2. The exact cosmological redshift  1 + z = a_now / a_emit ───────────────

/**
 * Cosmological redshift z for light emitted when the scale factor was a_emit
 * (received now at a = a_now, default 1):
 *
 *   1 + z = a_now / a_emit
 *
 * Wavelengths stretch by exactly the factor space has expanded since emission.
 * Returns Infinity for a_emit ≤ 0 (the Big-Bang limit).
 */
export function redshiftFromScaleFactor(aEmit: number, aNow = 1): number {
  if (aEmit <= 0) return Infinity;
  return aNow / aEmit - 1;
}

/**
 * Scale factor at emission for an observed redshift z:  a_emit = a_now / (1+z).
 */
export function scaleFactorFromRedshift(z: number, aNow = 1): number {
  return aNow / (1 + z);
}

/**
 * Wavelength stretch factor (λ_obs / λ_emit) for redshift z. Equal to 1 + z by
 * definition; provided so scenes can label the photon's stretch directly.
 */
export function stretchFactor(z: number): number {
  return 1 + z;
}

/**
 * The naive "redshift velocity" cz (km/s). For small z this is the recession
 * velocity that goes into the local Hubble law; for large z it exceeds c and
 * is no longer a physical speed — a reminder that cosmological redshift is not
 * Doppler. Provided to make that breakdown visible in the scenes.
 */
export function redshiftVelocity(z: number): number {
  return C_KM_S * z;
}

/**
 * The special-relativistic Doppler redshift for a genuine recession speed
 * β = v/c:
 *
 *   1 + z = sqrt((1 + β) / (1 − β))
 *
 * Included only to CONTRAST with the cosmological formula: it saturates as
 * β → 1 (z → ∞ only at the speed of light), whereas cosmological z is
 * unbounded for finite expansion. The two agree to first order in β.
 */
export function dopplerRedshift(beta: number): number {
  if (beta >= 1) return Infinity;
  if (beta <= -1) return -1;
  return Math.sqrt((1 + beta) / (1 - beta)) - 1;
}

// ─── 3. Friedmann expansion rate E(z) and lookback time ──────────────────────

/**
 * Dimensionless expansion rate E(z) = H(z) / H₀ for a flat-ish ΛCDM model:
 *
 *   E(z) = sqrt( Ω_r (1+z)⁴ + Ω_m (1+z)³ + Ω_k (1+z)² + Ω_Λ )
 *
 * with the curvature term Ω_k = 1 − Ω_r − Ω_m − Ω_Λ. Each component scales
 * with its own power of (1+z): radiation ∝ (1+z)⁴, matter ∝ (1+z)³, Λ constant.
 */
export function expansionRate(z: number, p: CosmoParams): number {
  const Ok = 1 - p.Or - p.Om - p.OL;
  const x = 1 + z;
  const inside = p.Or * x ** 4 + p.Om * x ** 3 + Ok * x ** 2 + p.OL;
  return Math.sqrt(Math.max(inside, 0));
}

/**
 * Hubble parameter H(z) in km/s/Mpc at redshift z: H(z) = H₀ E(z).
 */
export function hubbleAtRedshift(z: number, p: CosmoParams): number {
  return p.H0 * expansionRate(z, p);
}

/**
 * Lookback time (Gyr) to redshift z: how long ago the light we see at redshift
 * z was emitted. From the FLRW relation
 *
 *   t_L(z) = (1/H₀) ∫₀ᶻ dz' / [ (1+z') E(z') ]
 *
 * integrated numerically (Simpson) over the substitution. Returns the elapsed
 * cosmic time between emission and now.
 */
export function lookbackTimeGyr(z: number, p: CosmoParams, steps = 2000): number {
  if (z <= 0) return 0;
  const f = (zp: number) => 1 / ((1 + zp) * expansionRate(zp, p));
  const integral = simpson(f, 0, z, steps);
  const tH = hubbleTimeGyr(p.H0); // 1/H0 in Gyr
  return tH * integral;
}

/**
 * Age of the universe (Gyr) AT redshift z — i.e. the cosmic time elapsed
 * between the Big Bang (z → ∞) and the moment the light at redshift z was
 * emitted. Computed as the total age minus the lookback time.
 *
 *   age(z) = (1/H₀) ∫_z^∞ dz' / [ (1+z') E(z') ]
 */
export function ageAtRedshiftGyr(z: number, p: CosmoParams, steps = 4000): number {
  // integrate from z to a large cap; integrand decays fast at high z
  const zMax = 1e7;
  const f = (zp: number) => 1 / ((1 + zp) * expansionRate(zp, p));
  // substitute u = 1/(1+z') to tame the infinite upper limit:
  //   z' = 1/u − 1, dz' = −du/u²; bounds z'∈[z, zMax] → u∈[1/(1+zMax), 1/(1+z)]
  const uLo = 1 / (1 + zMax);
  const uHi = 1 / (1 + z);
  const g = (u: number) => {
    const zp = 1 / u - 1;
    return f(zp) / (u * u);
  };
  const integral = simpson(g, uLo, uHi, steps);
  const tH = hubbleTimeGyr(p.H0);
  return tH * integral;
}

/** Present age of the universe (Gyr) for these parameters: age at z = 0. */
export function ageNowGyr(p: CosmoParams, steps = 4000): number {
  return ageAtRedshiftGyr(0, p, steps);
}

// ─── numeric utility ─────────────────────────────────────────────────────────

/** Composite Simpson's rule for ∫_a^b f dx with an even number of intervals. */
export function simpson(
  f: (x: number) => number,
  a: number,
  b: number,
  steps: number,
): number {
  const n = steps % 2 === 0 ? steps : steps + 1;
  const h = (b - a) / n;
  let s = f(a) + f(b);
  for (let i = 1; i < n; i++) {
    s += (i % 2 === 0 ? 2 : 4) * f(a + i * h);
  }
  return (s * h) / 3;
}
