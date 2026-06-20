/**
 * §40 MERCURY'S PERIHELION — pure-TS helpers.
 *
 * The leading post-Newtonian correction from the Schwarzschild geometry makes
 * a bound orbit fail to close. Each revolution the major axis advances by a
 * small angle in the direction of motion — the relativistic perihelion
 * precession:
 *
 *   Δϖ = 6πGM / (c² a (1 − e²))     radians per orbit
 *
 * where M is the central mass, a the orbital semi-major axis and e the
 * eccentricity. For Mercury (a ≈ 0.387 AU, e ≈ 0.2056) this is ≈ 5.0 × 10⁻⁷
 * rad/orbit; multiplied by ~415 orbits per century it accumulates to the
 * famous 43 arcseconds per century that Newtonian gravity could not explain.
 *
 * This file is self-contained: it does not import shared orbit machinery so
 * that the topic owns its own copy. It is React-free and fully typed.
 */

import { G_SI, SPEED_OF_LIGHT, AU_M, GM_SUN_SI } from "@/lib/physics/constants";

/** Radians → arcseconds. 1 rad = 206264.806… arcseconds. */
export const RAD_TO_ARCSEC = (180 * 3600) / Math.PI;

/** Mercury's orbital elements (mean values). */
export const MERCURY = {
  /** Semi-major axis in metres (0.387098 AU). */
  semiMajorAxis_m: 0.387098 * AU_M,
  /** Orbital eccentricity (dimensionless). */
  eccentricity: 0.205630,
  /** Sidereal orbital period in days. */
  period_days: 87.969,
} as const;

/**
 * Relativistic perihelion advance per orbit, in radians.
 *
 *   Δϖ = 6πGM / (c² a (1 − e²))
 *
 * @param GM   standard gravitational parameter of the central body (m³/s²)
 * @param a    semi-major axis (m)
 * @param e    eccentricity (0 ≤ e < 1)
 * @param c    speed of light (m/s)
 */
export function precessionPerOrbitRad(
  GM: number,
  a: number,
  e: number,
  c = SPEED_OF_LIGHT,
): number {
  if (a <= 0) return 0;
  const semiLatusFactor = a * (1 - e * e);
  if (semiLatusFactor <= 0) return 0;
  return (6 * Math.PI * GM) / (c * c * semiLatusFactor);
}

/**
 * Relativistic perihelion advance accumulated over one century, in arcseconds.
 *
 * Multiplies the per-orbit advance by the number of orbits completed in 100
 * Julian years.
 */
export function precessionArcsecPerCentury(
  GM: number,
  a: number,
  e: number,
  periodDays: number,
  c = SPEED_OF_LIGHT,
): number {
  const perOrbitRad = precessionPerOrbitRad(GM, a, e, c);
  const orbitsPerCentury = (100 * 365.25) / periodDays;
  return perOrbitRad * orbitsPerCentury * RAD_TO_ARCSEC;
}

/** Convenience: Mercury's GR precession in arcsec/century from the constants
 *  above. Returns ≈ 43. */
export function mercuryPrecessionArcsecPerCentury(
  GM = GM_SUN_SI,
  c = SPEED_OF_LIGHT,
): number {
  return precessionArcsecPerCentury(
    GM,
    MERCURY.semiMajorAxis_m,
    MERCURY.eccentricity,
    MERCURY.period_days,
    c,
  );
}

/**
 * The classic 19th-century precession budget for Mercury's perihelion,
 * in arcseconds per century, as resolved by Le Verrier / Newcomb and then GR.
 *
 * The total observed advance (in the equinox-referenced frame) is ~5600″/cy;
 * ~5025″ of that is the precession of the equinoxes (a coordinate effect).
 * The dynamical residual after subtracting the equinox is ~574″/cy, of which
 * Newtonian planetary perturbations explain ~531″ and GR supplies the
 * remaining ~43″.
 */
export interface PrecessionBudget {
  /** Pull of Venus, Jupiter, Earth and the rest — Newtonian. */
  newtonianPlanetary_arcsec: number;
  /** General-relativistic contribution. */
  generalRelativity_arcsec: number;
  /** Sum of the two model terms. */
  modelTotal_arcsec: number;
  /** Observed dynamical residual (equinox already removed). */
  observed_arcsec: number;
  /** Pre-GR shortfall: observed − Newtonian. */
  shortfall_arcsec: number;
}

/** Per-perturber breakdown of the Newtonian contribution (Newcomb-era values,
 *  arcsec/century). The sum is ~531″. */
export const NEWTONIAN_PERTURBERS: { body: string; arcsec: number }[] = [
  { body: "Venus", arcsec: 277.9 },
  { body: "Jupiter", arcsec: 153.6 },
  { body: "Earth", arcsec: 90.0 },
  { body: "Saturn", arcsec: 7.3 },
  { body: "Mars", arcsec: 2.5 },
  { body: "others", arcsec: 0.1 },
];

/**
 * Build the precession budget. The GR term defaults to the value computed from
 * first principles; the Newtonian and observed numbers are the historical
 * dynamical figures.
 */
export function precessionBudget(
  grArcsec = mercuryPrecessionArcsecPerCentury(),
): PrecessionBudget {
  const newtonian = NEWTONIAN_PERTURBERS.reduce((s, p) => s + p.arcsec, 0);
  const observed = 574.1;
  const modelTotal = newtonian + grArcsec;
  return {
    newtonianPlanetary_arcsec: newtonian,
    generalRelativity_arcsec: grArcsec,
    modelTotal_arcsec: modelTotal,
    observed_arcsec: observed,
    shortfall_arcsec: observed - newtonian,
  };
}

/**
 * Position on a precessing Kepler ellipse, for visualization.
 *
 * Returns the (x, y) of the orbiting body for true anomaly θ when the line of
 * apsides has itself rotated by `apsideAngle`. The orbit is drawn with the
 * focus at the origin; r(θ) = a(1−e²)/(1 + e·cos θ).
 */
export function precessingEllipsePoint(
  a: number,
  e: number,
  trueAnomaly: number,
  apsideAngle: number,
): { x: number; y: number; r: number } {
  const p = a * (1 - e * e);
  const r = p / (1 + e * Math.cos(trueAnomaly));
  const phi = trueAnomaly + apsideAngle;
  return { x: r * Math.cos(phi), y: r * Math.sin(phi), r };
}

/**
 * Scale the (tiny) physical precession into a visible per-orbit rotation for
 * a teaching diagram. `exaggeration` ≥ 1 multiplies the true per-orbit advance;
 * at exaggeration = 1 the advance is physically faithful (and invisibly small),
 * at large exaggeration the apsidal drift becomes obvious within a few orbits.
 */
export function exaggeratedAdvancePerOrbit(
  GM: number,
  a: number,
  e: number,
  exaggeration: number,
  c = SPEED_OF_LIGHT,
): number {
  return precessionPerOrbitRad(GM, a, e, c) * Math.max(0, exaggeration);
}

/** Earth's GR precession for comparison (~3.8″/cy). Uses Earth's elements. */
export function earthPrecessionArcsecPerCentury(GM = GM_SUN_SI): number {
  return precessionArcsecPerCentury(GM, AU_M, 0.0167, 365.256);
}

export { G_SI };
