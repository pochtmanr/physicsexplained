/**
 * §08 THE NEWTONIAN LIMIT — Weak-field reduction of Einstein's field equations.
 *
 * The EFE reduce to Newton's gravity in three simultaneous limits:
 *   1. Weak field:   g_{μν} = η_{μν} + h_{μν},  |h| ≪ 1
 *   2. Slow motion:  v ≪ c  (geodesic reduces to d²x^i/dt² = −½ ∂^i h_{00} c²)
 *   3. Static field: ∂_t h_{μν} = 0
 *
 * Under these conditions h_{00} = −2Φ/c² and the 00-component of the linearised
 * EFE becomes ∇²Φ = 4πGρ — Poisson's equation.  The 8πG/c⁴ coefficient in EFE
 * is uniquely fixed by this matching.
 *
 * Signature convention: mostly-minus (+,−,−,−), η_{00} = +1.
 */

import { G_SI, SPEED_OF_LIGHT } from "@/lib/physics/constants";

/** Newtonian gravitational potential at distance r from a point mass M.
 *  Φ(r) = −GM/r.  Returns potential in J/kg = m²/s². */
export function newtonianPotential(
  M_kg: number,
  r_m: number,
  G = G_SI,
): number {
  if (r_m <= 0) throw new RangeError(`newtonianPotential: r must be > 0`);
  return -G * M_kg / r_m;
}

/** Weak-field metric perturbation h_{00} = −2Φ/c² (mostly-minus signature).
 *  The key bridge: a Newtonian potential Φ shows up in the time-time component
 *  of the metric as a fractional deviation of order Φ/c² from flat spacetime. */
export function h00FromPotential(Phi: number, c = SPEED_OF_LIGHT): number {
  return -2 * Phi / (c * c);
}

/** Effective g_{00} in the weak-field limit: g_{00} = η_{00} + h_{00} = 1 + h_{00}.
 *  Returns the (0,0) metric component in mostly-minus signature. */
export function weakFieldG00(Phi: number, c = SPEED_OF_LIGHT): number {
  return 1 + h00FromPotential(Phi, c);
}

/** Poisson's equation source term: 4πGρ.
 *  The right-hand side of ∇²Φ = 4πGρ that emerges from the 00-component
 *  of the linearised EFE when T_{00} ≈ ρc² and both sides are divided by c². */
export function poissonSource(rho_kg_m3: number, G = G_SI): number {
  return 4 * Math.PI * G * rho_kg_m3;
}

/** Gravitational time-dilation factor at potential Φ relative to Φ = 0.
 *  To leading order: Δτ_local/Δτ_∞ ≈ √(1 + 2Φ/c²) ≈ 1 + Φ/c².
 *  Returns the dimensionless rate (< 1 in a potential well). */
export function gravitationalTimeDilationFactor(
  Phi: number,
  c = SPEED_OF_LIGHT,
): number {
  return Math.sqrt(1 + 2 * Phi / (c * c));
}

/** Post-Newtonian perihelion advance per orbit for a test body in the field of
 *  a mass M_sun_kg.  Formula: Δφ = 6πGM / (c²a(1−e²)).
 *  Inputs: semi-major axis a_m in metres, eccentricity e (dimensionless).
 *  Returns advance in radians per orbit. */
export function mercuryPerihelionAdvancePerOrbit(
  M_sun_kg: number,
  a_m: number,
  e: number,
  G = G_SI,
  c = SPEED_OF_LIGHT,
): number {
  return 6 * Math.PI * G * M_sun_kg / (c * c * a_m * (1 - e * e));
}

/** Convert per-orbit advance (radians) to arcseconds per century.
 *  @param advancePerOrbit  Δφ in radians / orbit.
 *  @param periodSeconds    Orbital period in seconds.
 *  @param secondsPerCentury  Julian century in seconds (default 100 × 365.25 × 86400). */
export function arcsecPerCentury(
  advancePerOrbit: number,
  periodSeconds: number,
  secondsPerCentury = 100 * 365.25 * 86400,
): number {
  const orbitsPerCentury = secondsPerCentury / periodSeconds;
  const radiansPerCentury = advancePerOrbit * orbitsPerCentury;
  return radiansPerCentury * (180 / Math.PI) * 3600;
}
