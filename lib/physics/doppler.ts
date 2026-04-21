/**
 * Doppler effect and shock waves.
 *
 * Sound in a medium has an absolute frame: the medium itself. This breaks the
 * symmetry between a moving source and a moving observer. Light has no such
 * medium — its Doppler formula is symmetric and relativistic.
 *
 * Conventions:
 *   - All speeds are positive magnitudes.
 *   - Positive `vSource` means the source is moving toward the observer.
 *   - Positive `vObserver` means the observer is moving toward the source.
 *   - `c` is the wave speed in the medium (speed of sound, ≈343 m/s at 20°C).
 */

/** Speed of sound in dry air at 20°C, in m/s. */
export const C_SOUND_SI = 343;

/** Speed of light in vacuum, in m/s. */
export const C_LIGHT_SI = 299_792_458;

export interface DopplerSoundInput {
  /** Emitted frequency in Hz */
  fSource: number;
  /** Source speed along the line of sight, toward observer positive (m/s) */
  vSource: number;
  /** Observer speed along the line of sight, toward source positive (m/s) */
  vObserver: number;
  /** Wave speed in the medium (m/s), defaults to speed of sound in air */
  c?: number;
}

/**
 * General classical Doppler formula for a wave in a medium.
 *
 *   f_obs = f_src · (c + v_obs) / (c − v_src)
 *
 * Holds while |v_src| < c. Above that, the formula blows up — see the sonic-
 * boom / Mach-cone geometry instead.
 */
export function dopplerSound({
  fSource,
  vSource,
  vObserver,
  c = C_SOUND_SI,
}: DopplerSoundInput): number {
  if (Math.abs(vSource) >= c) {
    throw new Error(
      "dopplerSound: |vSource| must be < c (supersonic source — use Mach-cone geometry instead)",
    );
  }
  return (fSource * (c + vObserver)) / (c - vSource);
}

/**
 * Relativistic (light) Doppler shift for motion directly along the line of
 * sight. Only the relative velocity matters — no medium, no asymmetry.
 *
 *   f_obs = f_src · sqrt((1 − β) / (1 + β)),  β = v/c
 *
 * Here `v` > 0 means the source and observer are separating (redshift).
 * `v` < 0 means they are approaching (blueshift).
 */
export function dopplerLight(
  fSource: number,
  v: number,
  c: number = C_LIGHT_SI,
): number {
  if (Math.abs(v) >= c) {
    throw new Error("dopplerLight: |v| must be < c");
  }
  const beta = v / c;
  return fSource * Math.sqrt((1 - beta) / (1 + beta));
}

/**
 * Relative wavelength shift z = (λ_obs − λ_src) / λ_src for light.
 * Positive z is redshift; negative is blueshift.
 *
 *   1 + z = sqrt((1 + β) / (1 − β))
 *
 * Non-relativistic limit: z ≈ v/c for |v| ≪ c.
 */
export function redshiftZ(v: number, c: number = C_LIGHT_SI): number {
  if (Math.abs(v) >= c) {
    throw new Error("redshiftZ: |v| must be < c");
  }
  const beta = v / c;
  return Math.sqrt((1 + beta) / (1 - beta)) - 1;
}

/**
 * Mach number: source speed divided by wave speed in the medium.
 */
export function machNumber(vSource: number, c: number = C_SOUND_SI): number {
  return vSource / c;
}

/**
 * Half-angle of the Mach cone for a supersonic source. Measured between the
 * direction of motion and the cone surface.
 *
 *   sin(θ) = 1 / M = c / v
 *
 * Undefined for subsonic motion (M ≤ 1).
 */
export function machConeAngle(vSource: number, c: number = C_SOUND_SI): number {
  const M = machNumber(vSource, c);
  if (M <= 1) {
    throw new Error(
      "machConeAngle: Mach number must be > 1 (no cone forms below the speed of sound)",
    );
  }
  return Math.asin(1 / M);
}

export interface Wavefront {
  /** Emission time in seconds */
  tEmit: number;
  /** Emission position x in meters */
  xEmit: number;
  /** Emission position y in meters */
  yEmit: number;
  /** Radius at observation time, in meters */
  radius: number;
}

export interface WavefrontGenInput {
  /** Source speed along +x axis (m/s) */
  vSource: number;
  /** Wave speed in medium (m/s) */
  c: number;
  /** Emission period — one wavefront every T seconds */
  period: number;
  /** Current observation time (s) — source assumed at origin at t=0 */
  tNow: number;
  /** How many past emissions to keep */
  nWavefronts: number;
}

/**
 * Generate a ring of wavefronts emitted at regular intervals by a source
 * moving at constant velocity along +x. Useful for the moving-source scene.
 *
 * Each wavefront was emitted at position (v · tEmit, 0) and has since expanded
 * to radius c · (tNow − tEmit).
 */
export function generateWavefronts({
  vSource,
  c,
  period,
  tNow,
  nWavefronts,
}: WavefrontGenInput): Wavefront[] {
  if (period <= 0) throw new Error("generateWavefronts: period must be > 0");
  if (c <= 0) throw new Error("generateWavefronts: c must be > 0");

  const fronts: Wavefront[] = [];
  // Emission indices 0, 1, 2, ... where tEmit = k · period
  const kMax = Math.floor(tNow / period);
  const kMin = Math.max(0, kMax - nWavefronts + 1);

  for (let k = kMin; k <= kMax; k++) {
    const tEmit = k * period;
    const age = tNow - tEmit;
    if (age < 0) continue;
    fronts.push({
      tEmit,
      xEmit: vSource * tEmit,
      yEmit: 0,
      radius: c * age,
    });
  }
  return fronts;
}
