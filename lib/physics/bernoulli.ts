/**
 * Bernoulli's principle — pure helpers for the FIG.25 scenes.
 *
 * All quantities SI:
 *   p   pressure (Pa)
 *   ρ   density  (kg/m³)
 *   v   flow speed (m/s)
 *   h   elevation (m)
 *   A   cross-section area (m²)
 *   g   standard gravity (m/s²)
 *
 * Valid domain: inviscid, incompressible, steady flow along a streamline.
 * Nothing in this file touches the DOM.
 */

import { g_SI } from "./constants";

/** Density of dry air at 20 °C, sea level (kg/m³). */
export const RHO_AIR = 1.204;
/** Density of pure water at 20 °C (kg/m³). */
export const RHO_WATER = 998.2;
/** Standard atmospheric pressure (Pa). */
export const P_ATM = 101_325;

/**
 * Bernoulli constant (total head as a pressure) along a streamline:
 *
 *   B = p + ½ ρ v² + ρ g h
 *
 * This sum is conserved between any two points on the same streamline of
 * an inviscid, incompressible, steady flow.
 */
export function bernoulliHead(
  p: number,
  rho: number,
  v: number,
  h: number,
  g: number = g_SI,
): number {
  return p + 0.5 * rho * v * v + rho * g * h;
}

/**
 * Given the Bernoulli constant B and the flow state at a second point,
 * return the pressure at that point:
 *
 *   p₂ = B − ½ ρ v₂² − ρ g h₂
 */
export function pressureFromHead(
  head: number,
  rho: number,
  v: number,
  h: number,
  g: number = g_SI,
): number {
  return head - 0.5 * rho * v * v - rho * g * h;
}

/**
 * Pressure difference predicted by Bernoulli for two points on the same
 * streamline at (v₁, h₁) and (v₂, h₂):
 *
 *   p₁ − p₂ = ½ ρ (v₂² − v₁²) + ρ g (h₂ − h₁)
 *
 * Positive result means point 1 has higher pressure than point 2.
 */
export function bernoulliPressureDrop(
  rho: number,
  v1: number,
  v2: number,
  h1: number = 0,
  h2: number = 0,
  g: number = g_SI,
): number {
  return 0.5 * rho * (v2 * v2 - v1 * v1) + rho * g * (h2 - h1);
}

/**
 * Continuity equation for incompressible flow in a pipe that changes
 * cross-section:
 *
 *   A₁ v₁ = A₂ v₂     =>     v₂ = v₁ · A₁ / A₂
 *
 * Narrow the pipe, and the same volume of fluid must flow faster.
 */
export function continuityVelocity(
  v1: number,
  A1: number,
  A2: number,
): number {
  if (!(A2 > 0)) {
    throw new Error(
      `continuityVelocity: downstream area must be positive (got ${A2})`,
    );
  }
  return (v1 * A1) / A2;
}

/**
 * Pressure drop across a Venturi constriction, horizontal pipe, using
 * continuity + Bernoulli. Given inlet velocity v₁ and area ratio A₁/A₂,
 * return p₁ − p₂ (Pa, positive in the normal case where A₂ < A₁).
 *
 *   p₁ − p₂ = ½ ρ (v₂² − v₁²)
 *           = ½ ρ v₁² ((A₁/A₂)² − 1)
 */
export function venturiPressureDrop(
  rho: number,
  v1: number,
  areaRatio: number,
): number {
  return 0.5 * rho * v1 * v1 * (areaRatio * areaRatio - 1);
}

/**
 * A Venturi pipe: flat-bottomed, horizontal, symmetric. The radius follows
 * a smooth cosine bump from R₁ at the mouths down to R₂ in the throat over
 * the central half of the pipe. Good enough for an illustration; the
 * real geometry of a measuring Venturi is a cone+cylinder+cone, but the
 * physics it displays is identical.
 */
export interface VenturiProfileOptions {
  /** Total pipe length (m). */
  length: number;
  /** Mouth radius R₁ (m). */
  mouthRadius: number;
  /** Throat radius R₂ (m), must satisfy 0 < R₂ ≤ R₁. */
  throatRadius: number;
  /** Fraction of the pipe occupied by the constriction, 0 < f < 1. */
  throatFraction?: number;
}

/**
 * Pipe cross-section radius as a smooth function of axial position x ∈ [0, L].
 * Returns R₁ at the ends and R₂ in the middle, with a smooth cosine transition.
 */
export function venturiRadius(
  x: number,
  opts: VenturiProfileOptions,
): number {
  const { length, mouthRadius, throatRadius, throatFraction = 0.4 } = opts;
  if (!(length > 0)) return mouthRadius;
  if (!(throatRadius > 0) || throatRadius > mouthRadius) return mouthRadius;

  const L = length;
  const f = Math.max(0.05, Math.min(0.95, throatFraction));
  const rampStart = L * (0.5 - f / 2);
  const rampEnd = L * (0.5 + f / 2);
  if (x <= rampStart || x >= rampEnd) return mouthRadius;

  // Cosine blend from R₁ at rampStart to R₂ at midpoint to R₁ at rampEnd
  const phase = (x - rampStart) / (rampEnd - rampStart); // 0 … 1
  const blend = 0.5 - 0.5 * Math.cos(2 * Math.PI * phase); // 0 … 1 … 0
  return mouthRadius + (throatRadius - mouthRadius) * blend;
}

export interface VenturiSample {
  /** Axial position (m). */
  x: number;
  /** Local radius (m). */
  radius: number;
  /** Local cross-sectional area (m²). */
  area: number;
  /** Local flow speed (m/s). */
  velocity: number;
  /** Local static pressure (Pa). */
  pressure: number;
}

export interface VenturiSamplingOptions extends VenturiProfileOptions {
  /** Fluid density (kg/m³). */
  rho: number;
  /** Inlet (mouth) flow speed (m/s). */
  inletVelocity: number;
  /** Inlet static pressure (Pa). Default = 1 atm. */
  inletPressure?: number;
  /** Number of points to sample along the pipe. */
  samples: number;
}

/**
 * Sample velocity and pressure along a Venturi pipe using continuity
 * (A₁ v₁ = A(x) v(x)) and Bernoulli (horizontal: p + ½ρv² = const).
 *
 * The returned pressures are absolute (Pa); subtract P_ATM if you want gauge.
 */
export function sampleVenturi(opts: VenturiSamplingOptions): VenturiSample[] {
  const { length, rho, inletVelocity, samples } = opts;
  const p1 = opts.inletPressure ?? P_ATM;
  const n = Math.max(2, samples | 0);

  const R1 = opts.mouthRadius;
  const A1 = Math.PI * R1 * R1;
  const head = p1 + 0.5 * rho * inletVelocity * inletVelocity; // horizontal pipe

  const out: VenturiSample[] = [];
  for (let i = 0; i < n; i++) {
    const x = (length * i) / (n - 1);
    const r = venturiRadius(x, opts);
    const area = Math.PI * r * r;
    const v = continuityVelocity(inletVelocity, A1, area);
    const p = head - 0.5 * rho * v * v;
    out.push({ x, radius: r, area, velocity: v, pressure: p });
  }
  return out;
}

/**
 * Torricelli's law — special case of Bernoulli for a fluid draining from
 * a tank through a small hole at depth h below the free surface:
 *
 *   v = √(2 g h)
 *
 * Same speed as a particle that has fallen from height h in vacuum.
 */
export function torricelliVelocity(h: number, g: number = g_SI): number {
  if (h < 0) return 0;
  return Math.sqrt(2 * g * h);
}

/**
 * Dynamic pressure ½ ρ v² — the "Bernoulli term" that fast flow subtracts
 * from static pressure. In aerodynamics it's written q and turns up in the
 * definition of the drag coefficient (F = C_d · q · A).
 */
export function dynamicPressure(rho: number, v: number): number {
  return 0.5 * rho * v * v;
}
