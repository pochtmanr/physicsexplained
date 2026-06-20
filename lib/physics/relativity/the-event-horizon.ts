/**
 * §44 THE EVENT HORIZON — pure-TS helpers.
 *
 * The Schwarzschild geometry outside a non-rotating mass M:
 *
 *   ds² = −(1 − r_s/r) c² dt²  +  (1 − r_s/r)⁻¹ dr²  +  r² dΩ²
 *
 * where r_s = 2GM/c² is the Schwarzschild radius. The surface r = r_s is the
 * event horizon: a one-way causal boundary, not a material surface. The factor
 * (1 − r_s/r) controls three signature effects that this file computes:
 *
 *   1. Gravitational time dilation / redshift — the rate of a static clock and
 *      the redshift of light it emits, both → 0 as r → r_s.
 *   2. The tilt of the outgoing light cone — the coordinate slope dt/dr of a
 *      radially outgoing photon, which → ∞ at the horizon (the cone goes
 *      vertical; outgoing light is frozen in Schwarzschild t).
 *   3. The Gullstrand–Painlevé "river" speed — the inflow speed of space in the
 *      river model, c·√(r_s/r), which equals c exactly at the horizon and
 *      exceeds c inside.
 *
 * All functions take r in units of r_s ("r/r_s") unless noted, so they are
 * scale-free and apply to any black hole. Conventions:
 *   • x ≡ r/r_s. The horizon is x = 1; x > 1 is outside, 0 < x < 1 is inside.
 *   • SI helpers (schwarzschildRadiusMeters, tidalStretchAcceleration) take
 *     SI inputs and return SI outputs.
 *
 * This file is intentionally self-contained (it does not import the shared
 * §08/§44 black-hole helpers) so the topic owns its own copy of the math.
 */

import { G_SI, SPEED_OF_LIGHT } from "@/lib/physics/constants";

/** Schwarzschild radius r_s = 2GM/c² in meters for a mass M in kg.
 *  Sun ≈ 2954 m, Earth ≈ 8.87 mm, Sgr A* (4.3 × 10⁶ M_sun) ≈ 1.27 × 10¹⁰ m. */
export function schwarzschildRadiusMeters(
  M_kg: number,
  G = G_SI,
  c = SPEED_OF_LIGHT,
): number {
  return (2 * G * M_kg) / (c * c);
}

/**
 * The Schwarzschild metric factor f(x) = 1 − r_s/r = 1 − 1/x, with x = r/r_s.
 * Positive outside the horizon (x > 1), zero at the horizon, negative inside —
 * where r and t swap their timelike/spacelike roles. Returns NaN for x ≤ 0.
 */
export function metricFactor(x: number): number {
  if (x <= 0) return NaN;
  return 1 - 1 / x;
}

/**
 * Gravitational time-dilation factor for a STATIC observer at x = r/r_s,
 * relative to a clock at infinity: dτ/dt = √(1 − 1/x).
 *
 * A static clock just above the horizon ticks arbitrarily slowly as seen from
 * far away; at x = 1 the rate is exactly 0 (the clock appears frozen). Returns
 * 0 at and inside the horizon (no static observer can exist there). The reader
 * should note: this is the DISTANT view. The infaller's own wristwatch ticks
 * once per second the whole way down.
 */
export function staticTimeDilation(x: number): number {
  const f = metricFactor(x);
  if (!(f > 0)) return 0;
  return Math.sqrt(f);
}

/**
 * Gravitational redshift factor 1 + z for light emitted by a static source at
 * x_emit and received by a static observer at x_obs (both ≥ 1, in r_s units):
 *
 *   1 + z = √( (1 − 1/x_obs) / (1 − 1/x_emit) ).
 *
 * For an observer at infinity (x_obs → ∞) this reduces to
 * 1/√(1 − 1/x_emit), which diverges as x_emit → 1: light from the horizon is
 * redshifted to zero frequency — the source fades to black. Returns Infinity
 * in that limit.
 */
export function redshiftFactor(xEmit: number, xObs = Infinity): number {
  const fEmit = metricFactor(xEmit);
  if (!(fEmit > 0)) return Infinity;
  const fObs = Number.isFinite(xObs) ? metricFactor(xObs) : 1;
  if (!(fObs > 0)) return Infinity;
  return Math.sqrt(fObs / fEmit);
}

/**
 * Coordinate slope c·dt/dr of a radially OUTGOING photon in Schwarzschild
 * coordinates: |c dt/dr| = 1 / (1 − 1/x) = 1/f(x), with x = r/r_s.
 *
 * This is the tilt of the future light cone's outgoing edge on a (c t, r)
 * diagram. Far away (x ≫ 1) the slope → 1 (a 45° cone). As x → 1⁺ the slope
 * → ∞: the cone closes up to vertical and the outgoing edge no longer points
 * outward. That is the coordinate signature of the horizon. Returns Infinity
 * at and inside x = 1.
 */
export function outgoingLightConeSlope(x: number): number {
  const f = metricFactor(x);
  if (!(f > 0)) return Infinity;
  return 1 / f;
}

/**
 * Gullstrand–Painlevé "river" inflow speed of space at x = r/r_s, in units of
 * c: v_river/c = √(1/x) = √(r_s/r).
 *
 * In the river picture, space itself falls inward at this speed and light
 * swims at c relative to the flowing water. Outside the horizon (x > 1) the
 * river is sub-luminal and outward-swimming light makes headway. At x = 1 the
 * river reaches exactly c, so outgoing light is held stationary. Inside
 * (x < 1) the river is super-luminal and even light is carried inward — the
 * one-way property, with no local rule broken. Returns the dimensionless
 * speed v/c (so √(1/x)).
 */
export function riverSpeedOverC(x: number): number {
  if (x <= 0) return Infinity;
  return Math.sqrt(1 / x);
}

/**
 * Proper time (in units of r_s/c) for an observer who falls radially from rest
 * at x_start = r_start/r_s to the central singularity x = 0, along a
 * Schwarzschild-geodesic that starts at rest at x_start:
 *
 *   c τ / r_s = (2/3) · x_start^{3/2}   measured from x_start down to x = 0.
 *
 * Crucially this is FINITE — the infaller reaches the singularity in finite
 * proper time even though the distant observer never sees them cross the
 * horizon. (Falling from rest at the horizon itself, x_start = 1, gives
 * cτ/r_s = 2/3.) Returns NaN for x_start < 0.
 */
export function infallProperTime(xStart: number): number {
  if (xStart < 0) return NaN;
  return (2 / 3) * Math.pow(xStart, 1.5);
}

/**
 * Tidal stretching acceleration (Newtonian/leading-GR estimate) per unit
 * length along the radial direction, for a body at radius r_m (meters) outside
 * a mass M_kg:  a_tidal/Δℓ = 2GM / r³  (units s⁻²).
 *
 * Multiply by the body length Δℓ (head-to-foot) to get the differential
 * "spaghettification" acceleration. Because it scales as M/r³ and the horizon
 * scales as r_s ∝ M, the tidal force AT the horizon scales as 1/M²: small holes
 * shred infallers outside the horizon; supermassive holes are gentle there.
 */
export function tidalStretchPerLength(
  r_m: number,
  M_kg: number,
  G = G_SI,
): number {
  return (2 * G * M_kg) / Math.pow(r_m, 3);
}

/** Solar mass in kg (IAU). */
export const M_SUN_KG = 1.989e30;

/** Sgr A* mass estimate ≈ 4.3 × 10⁶ M_sun (kg). */
export const SGR_A_STAR_MASS_KG = 4.3e6 * M_SUN_KG;

/** M87* mass estimate ≈ 6.5 × 10⁹ M_sun (kg) — the 2019 EHT target. */
export const M87_STAR_MASS_KG = 6.5e9 * M_SUN_KG;
