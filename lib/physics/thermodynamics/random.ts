/**
 * Seeded pseudo-random number generation for thermodynamics scenes.
 *
 * Statistical-mechanics scenes (coin tosses, two-box gases, diffusing gases,
 * Maxwell's demon) need *reproducible* randomness: the same seed must always
 * produce the same trajectory, so that a "reverse all velocities" button or a
 * re-render lands on an identical state. `Math.random()` cannot do this — and
 * it is also banned in this codebase's workflow scripts — so every scene draws
 * from a `createRng(seed)` stream instead.
 *
 * The generator is mulberry32: a tiny, fast, well-distributed 32-bit PRNG with
 * a full 2³² period. It is not cryptographically secure (it must never be used
 * for anything security-sensitive); it is exactly what a physics visualisation
 * wants — deterministic, uniform, and cheap.
 *
 * Created by session s4-entropy-time; reused by sessions 5 (kinetic theory)
 * and 7 (phase transitions).
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

/** A uniformly random integer in [0, maxExclusive). */
export function randomInt(rng: Rng, maxExclusive: number): number {
  return Math.floor(rng() * maxExclusive);
}

/** A uniformly random float in [min, max). */
export function randomRange(rng: Rng, min: number, max: number): number {
  return min + rng() * (max - min);
}

/**
 * A standard-normal sample (mean 0, unit variance) via the Box–Muller
 * transform. Two uniforms in, one Gaussian out. Used to seed thermal
 * velocity components in the kinetic scenes.
 */
export function gaussian(rng: Rng, mean = 0, stdDev = 1): number {
  // Guard the log against u1 === 0.
  let u1 = rng();
  if (u1 < 1e-12) u1 = 1e-12;
  const u2 = rng();
  const mag = Math.sqrt(-2 * Math.log(u1));
  return mean + stdDev * mag * Math.cos(2 * Math.PI * u2);
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
