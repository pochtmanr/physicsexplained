/**
 * Shared pseudo-random helpers for the kinetic-theory scenes — a small,
 * deterministic toolkit reused by the bouncing-gas, Maxwell–Boltzmann sampling,
 * and Brownian-walk simulations (FIG.15, FIG.16, FIG.18).
 *
 * Why a seeded generator rather than `Math.random()`? Two reasons. First, the
 * physics tests need reproducible draws so a mean or variance can be asserted
 * against a tolerance. Second, scenes that rebuild their initial state on a
 * control change (e.g. resampling N molecules) look calmer when the layout is
 * stable rather than reshuffled on every render. `Math.random()` is also banned
 * inside the workflow/runtime layer; a explicit PRNG keeps this module portable.
 *
 * `mulberry32` is a well-known 32-bit generator: tiny, fast, and statistically
 * good enough for visualisation and for the law-of-large-numbers tests here. It
 * is NOT cryptographic.
 *
 * React-free, typed, no side effects beyond the generator's own internal state.
 */

/** A function returning the next uniform variate in [0, 1). */
export type Rng = () => number;

/**
 * mulberry32 — a 32-bit seeded PRNG. Returns a closure that yields successive
 * uniform variates in [0, 1). Same seed ⇒ same stream.
 */
export function mulberry32(seed: number): Rng {
  let a = seed >>> 0;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Uniform variate in [min, max). */
export function uniform(rng: Rng, min: number, max: number): number {
  return min + (max - min) * rng();
}

/**
 * Standard normal variate (mean 0, variance 1) via the Box–Muller transform.
 * Each call consumes two uniforms and returns one normal; the paired value is
 * discarded for simplicity (the streams are cheap).
 */
export function gaussian(rng: Rng): number {
  // Guard u1 away from 0 so log() stays finite.
  const u1 = Math.max(rng(), 1e-12);
  const u2 = rng();
  return Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
}

/** Normal variate with given mean and standard deviation. */
export function gaussianWith(rng: Rng, mean: number, std: number): number {
  return mean + std * gaussian(rng);
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
