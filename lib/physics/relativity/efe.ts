/**
 * §08 EINSTEIN'S FIELD EQUATIONS — pure-TS helpers.
 *
 * The Einstein field equations:
 *
 *   G_{μν} = (8πG/c⁴) T_{μν}
 *
 * relate the Einstein tensor G_{μν} (encoding the geometry of spacetime)
 * to the stress-energy tensor T_{μν} (encoding the distribution of matter
 * and energy). With the cosmological constant Λ the equations become:
 *
 *   G_{μν} + Λ g_{μν} = κ T_{μν}     where  κ = 8πG/c⁴
 *
 * The coupling constant κ is fixed by the Newtonian limit: at low speeds and
 * weak fields the equations must reproduce Newton's law of gravitation, which
 * pins the coefficient to exactly 8πG/c⁴ (§08.5).
 */

import { G_SI, SPEED_OF_LIGHT } from "@/lib/physics/constants";

/** Einstein's coupling constant κ = 8πG/c⁴.
 *  The coefficient that converts matter-energy (T_{μν}) into geometry (G_{μν}).
 *  Numerically tiny in SI units (~2.07 × 10⁻⁴³) reflecting how weakly matter
 *  curves spacetime at everyday densities.  In natural units (G = c = 1) it
 *  simplifies to κ = 8π. */
export function einsteinCoupling(G = G_SI, c = SPEED_OF_LIGHT): number {
  return (8 * Math.PI * G) / Math.pow(c, 4);
}

/** Schwarzschild radius r_s = 2GM/c² for mass M.
 *  The unique characteristic length scale of GR for a non-rotating mass.
 *  At r < r_s the escape velocity exceeds c; for ordinary objects r_s is far
 *  inside their physical radius (the Sun's r_s ≈ 3 km; Earth's ≈ 9 mm). */
export function schwarzschildRadius(
  M_kg: number,
  G = G_SI,
  c = SPEED_OF_LIGHT,
): number {
  return (2 * G * M_kg) / (c * c);
}

/** Solar Schwarzschild radius (~2954 m ≈ 3 km) for sanity-checking. */
export function solarSchwarzschildRadius(): number {
  const M_sun = 1.989e30; // kg
  return schwarzschildRadius(M_sun);
}

/** Earth Schwarzschild radius (~8.87 mm) for sanity-checking. */
export function earthSchwarzschildRadius(): number {
  const M_earth = 5.972e24; // kg
  return schwarzschildRadius(M_earth);
}

/** Cosmological field equations: G_{μν} + Λ g_{μν} = κ T_{μν}.
 *  Returns the LHS minus the RHS given precomputed scalar values of each
 *  tensor component.  Pure bookkeeping helper used in unit tests.
 *  When Λ = 0 and G_{μν} = κ T_{μν}, the residual is zero. */
export function efeResidual(
  G_munu: number,
  T_munu: number,
  g_munu: number,
  Lambda: number,
  G_grav = G_SI,
  c = SPEED_OF_LIGHT,
): number {
  const kappa = einsteinCoupling(G_grav, c);
  return G_munu + Lambda * g_munu - kappa * T_munu;
}

/** Verify the order-of-magnitude of the coupling: κ ≈ 2.07 × 10⁻⁴³ in SI.
 *  Returns the value for unit testing. */
export function einsteinCouplingValueSI(): number {
  return einsteinCoupling();
}
