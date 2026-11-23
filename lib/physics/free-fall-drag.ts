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

/** A falling object: distance fallen (m) and downward speed (m/s). */
export interface FallState {
  x: number;
  v: number;
}

/**
 * Advance a falling object by `dt` seconds with time constant `tau`.
 *
 * This is the exact solution over the step, not an approximation, so the
 * result does not depend on the frame rate. It starts from any state, which
 * is what lets the drag change mid-fall: the object carries on from where it
 * is and relaxes towards the new terminal speed.
 */
export function stepFall(state: FallState, dt: number, tau: number): FallState {
  if (dt <= 0) return state;
  if (!Number.isFinite(tau)) {
    return { x: state.x + state.v * dt + 0.5 * G * dt * dt, v: state.v + G * dt };
  }
  const vt = G * tau;
  // 1 − e^(−dt/τ), computed without cancellation when dt ≪ τ.
  const decay = -Math.expm1(-dt / tau);
  return {
    x: state.x + vt * dt - (vt - state.v) * tau * decay,
    v: state.v + (vt - state.v) * decay,
  };
}

/**
 * Time (s) for an object in `state` to reach distance `floor`; 0 if already
 * there. Expects a falling object (`v` ≥ 0) and `tau` > 0.
 */
export function timeToFloor(state: FallState, floor: number, tau: number): number {
  const d = floor - state.x;
  if (d <= 0) return 0;
  if (!Number.isFinite(tau)) {
    return (-state.v + Math.sqrt(state.v * state.v + 2 * G * d)) / G;
  }
  // The speed heads for g·τ from whichever side it starts, so the object is
  // never slower than it would be from rest: the from-rest bound holds.
  let lo = 0;
  let hi = d / (G * tau) + tau + Math.sqrt((2 * d) / G);
  // Guard the bracket for inputs outside the stated range (moving upward).
  for (let i = 0; i < 40 && stepFall(state, hi, tau).x < floor; i++) hi *= 2;
  for (let i = 0; i < 60; i++) {
    const mid = (lo + hi) / 2;
    if (stepFall(state, mid, tau).x < floor) lo = mid;
    else hi = mid;
  }
  return (lo + hi) / 2;
}

/**
 * `stepFall`, stopping at `floor`. When the object lands during the step it
 * is left resting on the floor and `landedAfter` is the time into the step
 * at which it touched down; otherwise `landedAfter` is null.
 */
export function stepFallToFloor(
  state: FallState,
  dt: number,
  tau: number,
  floor: number,
): { state: FallState; landedAfter: number | null } {
  if (state.x >= floor) return { state: { x: floor, v: 0 }, landedAfter: 0 };
  const next = stepFall(state, dt, tau);
  if (next.x < floor) return { state: next, landedAfter: null };
  return { state: { x: floor, v: 0 }, landedAfter: timeToFloor(state, floor, tau) };
}
