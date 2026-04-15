/**
 * Friction and drag — pure helper functions for the FIG.04 scenes.
 *
 * Three regimes show up in this topic:
 *   - Static / kinetic friction on solid contact (Amontons).
 *   - Linear viscous drag in slow flow (Stokes).
 *   - Quadratic inertial drag in fast flow (Newtonian drag).
 *
 * Nothing in this file touches the DOM. The scene components call into it.
 */

export const G = 9.80665;

// ---------------------------------------------------------------------------
// Static / kinetic friction on an inclined plane
// ---------------------------------------------------------------------------

/**
 * Critical tilt angle (radians) at which a block of friction coefficient μ_s
 * starts to slip. On a flat surface the driving force along the slope is
 * m·g·sinθ; the maximum static-friction resistance is μ_s·m·g·cosθ. The block
 * is on the verge of slipping when tan θ = μ_s.
 */
export function criticalAngle(muStatic: number): number {
  return Math.atan(Math.max(0, muStatic));
}

/**
 * Returns true when a block on a ramp of angle θ (radians) is still held
 * static by the surface friction.
 */
export function isBlockStatic(angle: number, muStatic: number): boolean {
  return Math.tan(angle) <= muStatic;
}

/**
 * Net acceleration along a ramp once the block is sliding. Positive means the
 * block accelerates downhill.
 *
 *   a = g (sinθ − μ_k cosθ)
 *
 * Clamped at 0 — once the block is moving, kinetic friction cannot reverse it
 * in a single step.
 */
export function slideAcceleration(
  angle: number,
  muKinetic: number,
  g = G,
): number {
  const a = g * (Math.sin(angle) - muKinetic * Math.cos(angle));
  return Math.max(0, a);
}

// ---------------------------------------------------------------------------
// Linear (Stokes) drag and terminal velocity
// ---------------------------------------------------------------------------

/**
 * Stokes drag force on a sphere of radius r moving at speed v through a fluid
 * of dynamic viscosity η.
 *
 *   F_drag = 6 π η r v
 */
export function stokesDrag(
  v: number,
  radius: number,
  viscosity: number,
): number {
  return 6 * Math.PI * viscosity * radius * v;
}

/**
 * Terminal velocity for a sphere in linear drag under gravity.
 *
 *   m g = b v_t     =>    v_t = m g / b
 *
 * The caller passes the "drag coefficient" b (units of N·s/m) directly, so
 * this one-liner works for any linear-drag model, not just Stokes.
 */
export function terminalVelocityLinear(
  mass: number,
  dragCoefficient: number,
  g = G,
): number {
  if (dragCoefficient <= 0) return Infinity;
  return (mass * g) / dragCoefficient;
}

/**
 * Closed-form velocity for a body falling from rest under gravity with linear
 * drag:
 *
 *   v(t) = v_t · (1 − e^(−t / τ)),    where τ = m / b
 *
 * Approaches v_t exponentially. Returns 0 at t = 0 and asymptotes to v_t.
 */
export function velocityLinearDrag(
  t: number,
  mass: number,
  dragCoefficient: number,
  g = G,
): number {
  if (dragCoefficient <= 0) return g * t;
  const vt = terminalVelocityLinear(mass, dragCoefficient, g);
  const tau = mass / dragCoefficient;
  return vt * (1 - Math.exp(-t / tau));
}

/**
 * Distance fallen from rest with linear drag:
 *
 *   y(t) = v_t · (t − τ (1 − e^(−t / τ)))
 */
export function positionLinearDrag(
  t: number,
  mass: number,
  dragCoefficient: number,
  g = G,
): number {
  if (dragCoefficient <= 0) return 0.5 * g * t * t;
  const vt = terminalVelocityLinear(mass, dragCoefficient, g);
  const tau = mass / dragCoefficient;
  return vt * (t - tau * (1 - Math.exp(-t / tau)));
}

// ---------------------------------------------------------------------------
// Quadratic (inertial) drag
// ---------------------------------------------------------------------------

/**
 * Newtonian quadratic drag force on a body of cross-sectional area A in a
 * fluid of density ρ, with drag coefficient C_d:
 *
 *   F_drag = ½ ρ C_d A v²
 *
 * The caller usually wraps this in a single "k" for demos, where F = k v².
 */
export function quadraticDrag(
  v: number,
  density: number,
  dragCoefficient: number,
  area: number,
): number {
  return 0.5 * density * dragCoefficient * area * v * v;
}

// ---------------------------------------------------------------------------
// Drag-regime sampling for the log-log plot
// ---------------------------------------------------------------------------

export interface DragSample {
  v: number;
  linear: number;
  quadratic: number;
  total: number;
}

export interface DragSamplingOptions {
  /** Linear coefficient b such that F_lin = b v. */
  linearCoefficient: number;
  /** Quadratic coefficient k such that F_quad = k v². */
  quadraticCoefficient: number;
  /** Minimum velocity (m/s). Must be positive because we plot log scale. */
  vMin: number;
  /** Maximum velocity (m/s). */
  vMax: number;
  /** Number of samples spread logarithmically across [vMin, vMax]. */
  samples: number;
}

/**
 * Sample the two drag regimes across a log-spaced velocity range. The total
 * force is the sum — on a log-log plot this reads as a smooth curve that
 * follows the Stokes line (slope 1) at low v and the quadratic line (slope 2)
 * at high v, with a knee where the two components cross.
 */
export function sampleDragRegimes(opts: DragSamplingOptions): DragSample[] {
  const { linearCoefficient, quadraticCoefficient, vMin, vMax, samples } = opts;
  if (vMin <= 0 || vMax <= vMin || samples < 2) return [];
  const logMin = Math.log10(vMin);
  const logMax = Math.log10(vMax);
  const out: DragSample[] = [];
  for (let i = 0; i < samples; i++) {
    const frac = i / (samples - 1);
    const v = Math.pow(10, logMin + frac * (logMax - logMin));
    const linear = linearCoefficient * v;
    const quadratic = quadraticCoefficient * v * v;
    out.push({ v, linear, quadratic, total: linear + quadratic });
  }
  return out;
}

/**
 * Crossover velocity — where the linear and quadratic contributions are
 * equal. Setting b·v = k·v² gives v = b / k. This is where the regime switch
 * happens in the log-log plot, and it is what the Reynolds-number marker
 * hints at on the axis.
 */
export function dragCrossoverVelocity(
  linearCoefficient: number,
  quadraticCoefficient: number,
): number {
  if (quadraticCoefficient <= 0) return Infinity;
  return linearCoefficient / quadraticCoefficient;
}
