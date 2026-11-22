/**
 * Fall from rest with linear air drag:  m·dv/dt = m·g − b·v.
 *
 * The motion is governed by one time constant τ = m/b. A heavy, compact
 * object has a large τ and falls almost as in vacuum; a light, fluffy one has
 * a small τ and quickly settles at the terminal speed v_t = g·τ. Vacuum is the
 * limit τ → ∞, represented here by `Infinity`.
 */

export const G = 9.80665;

/** τ for a feather in normal sea-level air (terminal speed ≈ 1.5 m/s). */
export const FEATHER_TAU = 0.15;
/** τ for a hammer in normal air — drag is negligible over a few metres. */
export const HAMMER_TAU = 30;

/**
 * Time constant at a given drag strength, where `air` is a fraction of the
 * drag in normal air (0 = no drag, i.e. vacuum; 1 = normal air). The drag
 * coefficient b scales with `air`, so τ = m/b scales as 1/air.
 *
 * This is a teaching model, not a density law: real linear (Stokes) drag
 * depends on viscosity, which barely changes with density.
 */
export function tauAtAir(tauInNormalAir: number, air: number): number {
  return air <= 0 ? Infinity : tauInNormalAir / air;
}

/** Distance fallen after time `t` (m), starting from rest. */
export function fallDistance(t: number, tau: number): number {
  if (t <= 0) return 0;
  const x = t / tau;
  // For x → 0 the closed form subtracts nearly equal numbers; use the series
  // ½·g·t²·(1 − x/3 + x²/12 − …), which is also the exact vacuum result at x = 0.
  if (x < 1e-3) return 0.5 * G * t * t * (1 - x / 3 + (x * x) / 12);
  return G * tau * (t - tau * (1 - Math.exp(-x)));
}

/** Speed after time `t` (m/s), starting from rest. */
export function fallSpeed(t: number, tau: number): number {
  if (t <= 0) return 0;
  const x = t / tau;
  if (x < 1e-3) return G * t * (1 - x / 2 + (x * x) / 6);
  return G * tau * (1 - Math.exp(-x));
}

/** Terminal speed (m/s); `Infinity` in vacuum. */
export function terminalSpeed(tau: number): number {
  return G * tau;
}

/** Time to fall a height `h` (m) from rest. */
export function fallTime(h: number, tau: number): number {
  if (h <= 0) return 0;
  const vacuum = Math.sqrt((2 * h) / G);
  if (!Number.isFinite(tau)) return vacuum;
  // Drag only slows the fall, so the answer lies between the vacuum time and
  // the time to cover h at terminal speed plus the spin-up lag τ.
  let lo = vacuum;
  let hi = h / (G * tau) + tau + vacuum;
  for (let i = 0; i < 60; i++) {
    const mid = (lo + hi) / 2;
    if (fallDistance(mid, tau) < h) lo = mid;
    else hi = mid;
  }
  return (lo + hi) / 2;
}
