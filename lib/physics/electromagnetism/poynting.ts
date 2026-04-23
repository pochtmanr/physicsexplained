/**
 * The Poynting vector and related energy-flow quantities.
 *
 * Named for John Henry Poynting, whose 1884 paper *"On the Transfer of
 * Energy in the Electromagnetic Field"* first identified S = (1/μ₀)·E×B
 * as the thing that carries energy through space.
 *
 * S points in the direction the field is transporting energy; its
 * magnitude is the energy flux (power per unit area, W/m²). Together
 * with the local field energy density u = ½ε₀E² + B²/(2μ₀), it satisfies
 * Poynting's theorem:
 *
 *     ∂u/∂t + ∇·S = −J·E
 *
 * — the local continuity equation for electromagnetic energy.
 */

import type { Vec3 } from "@/lib/physics/electromagnetism/lorentz";
import { cross } from "@/lib/physics/electromagnetism/lorentz";
import { EPSILON_0, MU_0, SPEED_OF_LIGHT } from "@/lib/physics/constants";

/**
 * Poynting vector, S = (1/μ₀) · E × B.
 *
 * SI units: E in V/m, B in T → S in W/m².
 * The direction is perpendicular to both E and B and given by the
 * right-hand rule: curl fingers from E toward B and the thumb points
 * along S. That is the direction the energy is flowing.
 */
export function poyntingVector(E: Vec3, B: Vec3): Vec3 {
  const c = cross(E, B);
  return { x: c.x / MU_0, y: c.y / MU_0, z: c.z / MU_0 };
}

/** Magnitude of the Poynting vector (power per unit area, W/m²). */
export function poyntingMagnitude(E: Vec3, B: Vec3): number {
  const s = poyntingVector(E, B);
  return Math.hypot(s.x, s.y, s.z);
}

/**
 * Electromagnetic field energy density at a point.
 *
 *     u = ½ ε₀ E² + B² / (2 μ₀)
 *
 * SI units: J/m³. The two terms are the electric and magnetic reservoirs
 * from §01 and §05.4, now sitting side by side.
 */
export function fieldEnergyDensity(E: Vec3, B: Vec3): number {
  const E2 = E.x * E.x + E.y * E.y + E.z * E.z;
  const B2 = B.x * B.x + B.y * B.y + B.z * B.z;
  return 0.5 * EPSILON_0 * E2 + B2 / (2 * MU_0);
}

/**
 * Intensity of a plane electromagnetic wave in vacuum with peak electric
 * field amplitude E₀.
 *
 *     I = ⟨|S|⟩ = ½ · E₀² / (μ₀ · c)  =  ½ · c · ε₀ · E₀²
 *
 * The factor of ½ comes from the time-average of cos²(ωt). Returns W/m².
 * At a solar-flare-level E₀ of 1 kV/m the intensity is ~1.3 kW/m² — close
 * to the solar constant, which is not a coincidence.
 */
export function planeWaveIntensity(E0: number): number {
  return (E0 * E0) / (2 * MU_0 * SPEED_OF_LIGHT);
}

/**
 * Peak magnetic-field amplitude B₀ implied by a plane-wave electric
 * amplitude E₀ in vacuum: B₀ = E₀ / c.
 *
 * Useful for sanity-checking scene parameters — the magnetic amplitude
 * of ordinary sunlight is six nanotesla.
 */
export function planeWaveB0(E0: number): number {
  return E0 / SPEED_OF_LIGHT;
}

/**
 * Resistive (ohmic) power dissipation density: J · E.
 *
 * This is the source term on the right side of Poynting's theorem
 *   ∂u/∂t + ∇·S = −J·E
 * — the rate at which the field loses energy to charges (and they turn
 * it into heat). SI units: J in A/m², E in V/m → power density in W/m³.
 */
export function ohmicDissipation(J: Vec3, E: Vec3): number {
  return J.x * E.x + J.y * E.y + J.z * E.z;
}

/**
 * Axial Poynting flux through a coaxial cable carrying a steady DC current
 * I at voltage V, at radial distance r between the inner and outer
 * conductors.
 *
 * Inside the insulating gap the radial electric field and azimuthal
 * magnetic field of a coax are:
 *   E_r = V / (r · ln(b/a))
 *   B_φ = μ₀ I / (2π r)
 * so their cross product is purely axial:
 *   S_z(r) = E_r · B_φ / μ₀ = V·I / (2π · r² · ln(b/a))
 *
 * Integrating 2πr·S_z(r) dr from a to b gives exactly V·I — the full
 * power of the circuit. Energy flows *through the insulating space*
 * between the conductors, not inside the copper.
 *
 * Returns the axial component of S at radius r (W/m²). The textbook-perfect
 * counter-intuition result of Poynting's theorem applied to a circuit.
 */
export function coaxAxialPoynting(
  V: number,
  I: number,
  a: number,
  b: number,
  r: number,
): number {
  if (a <= 0 || b <= a || r < a || r > b) {
    throw new Error(
      "coaxAxialPoynting: require 0 < a < b and a ≤ r ≤ b",
    );
  }
  const lnBA = Math.log(b / a);
  return (V * I) / (2 * Math.PI * r * r * lnBA);
}

/**
 * Total power transported along a coaxial cable's axis, obtained by
 * integrating the axial Poynting flux across the annular cross-section.
 *
 *   ∫_a^b 2π r · S_z(r) dr  =  V · I
 *
 * Returns watts. Provided as a sanity-check primitive: the whole point
 * of the coax reveal is that this integral recovers the circuit's
 * familiar `P = V·I` — but every joule of it is flowing through the
 * *gap*, not through the metal.
 */
export function coaxTransportedPower(V: number, I: number): number {
  return V * I;
}
