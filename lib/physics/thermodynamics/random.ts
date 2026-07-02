/**
 * Seeded pseudo-random helpers shared by the thermodynamics scenes — the
 * kinetic-theory gas simulations (bouncing gas, Maxwell–Boltzmann sampling,
 * Brownian walks) and the statistical-mechanics scenes (coin tosses, two-box
 * gases, Maxwell's demon).
 *
 * Why a seeded generator rather than `Math.random()`? Reproducibility: the
 * physics tests need deterministic draws so a mean or variance can be asserted
 * against a tolerance, and scenes that rebuild state on a control change (or a
 * "reverse all velocities" button) must land on an identical state rather than
 * reshuffling on every render. `Math.random()` is also banned inside the
 * workflow/runtime layer; an explicit PRNG keeps this module portable.
 *
 * The generator is mulberry32: a tiny, fast, well-distributed 32-bit PRNG with
 * a full 2³² period. It is NOT cryptographically secure; it is exactly what a
 * physics visualisation wants — deterministic, uniform, and cheap.
 *
 * React-free, typed, no side effects beyond the generator's own internal state.
 */

/** A pseudo-random stream: each call returns a fresh float in [0, 1). */
export type Rng = () => number;

/**
 * Construct a deterministic RNG from an integer seed (mulberry32).
 *
 * Two streams created with the same seed produce identical sequences; streams
 * with different seeds are effectively independent.
 */
export function createRng(seed: number): Rng {
  // Coerce to a 32-bit unsigned integer so any finite number is a valid seed.
  let a = seed >>> 0;
  return function next(): number {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Alias for {@link createRng} — the kinetic-theory scenes use this name. */
export const mulberry32 = createRng;

/** A uniformly random integer in [0, maxExclusive). */
export function randomInt(rng: Rng, maxExclusive: number): number {
  return Math.floor(rng() * maxExclusive);
}

/** A uniformly random float in [min, max). */
export function randomRange(rng: Rng, min: number, max: number): number {
  return min + rng() * (max - min);
}

/** Alias for {@link randomRange} — the kinetic-theory scenes use this name. */
export function uniform(rng: Rng, min: number, max: number): number {
  return randomRange(rng, min, max);
}

/**
 * A normal sample via the Box–Muller transform (mean 0, unit variance by
 * default). Two uniforms in, one Gaussian out; the paired value is discarded
 * for simplicity (the streams are cheap).
 */
export function gaussian(rng: Rng, mean = 0, stdDev = 1): number {
  // Guard the log against u1 === 0.
  const u1 = Math.max(rng(), 1e-12);
  const u2 = rng();
  const mag = Math.sqrt(-2 * Math.log(u1));
  return mean + stdDev * mag * Math.cos(2 * Math.PI * u2);
}

/** Normal variate with given mean and standard deviation. */
export function gaussianWith(rng: Rng, mean: number, std: number): number {
  return gaussian(rng, mean, std);
}

/** A 2D unit vector with uniformly random direction. */
export function randomUnitVector2D(rng: Rng): { x: number; y: number } {
  const theta = 2 * Math.PI * rng();
  return { x: Math.cos(theta), y: Math.sin(theta) };
}

/**
 * A 2D velocity drawn from the Maxwell–Boltzmann distribution at the given
 * "thermal speed" σ — i.e. each Cartesian component is N(0, σ²). The resulting
 * speed |v| is Rayleigh-distributed, the 2D analogue of the 3D speed law. Handy
 * for seeding a bouncing-molecule gas with a physically correct spread.
 */
export function maxwellVelocity2D(rng: Rng, sigma: number): { x: number; y: number } {
  return { x: gaussian(rng) * sigma, y: gaussian(rng) * sigma };
}

/**
 * Fisher–Yates shuffle. Returns a new array; the input is left untouched.
 * Deterministic for a given RNG state — the demon scene uses it to assign
 * molecules to chambers reproducibly.
 */
export function shuffled<T>(rng: Rng, items: readonly T[]): T[] {
  const out = items.slice();
  for (let i = out.length - 1; i > 0; i--) {
    const j = randomInt(rng, i + 1);
    const tmp = out[i];
    out[i] = out[j];
    out[j] = tmp;
  }
  return out;
}
