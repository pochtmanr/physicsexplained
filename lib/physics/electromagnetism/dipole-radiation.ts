/**
 * Oscillating electric-dipole radiation.
 *
 * A point dipole at the origin whose dipole moment oscillates along ẑ,
 *
 *   p(t) = p₀ cos(ω t) ẑ
 *
 * is the simplest thing that radiates. Every antenna is a variation. The
 * retarded solution of Maxwell's equations in spherical coordinates separates
 * into two distinct regimes by radius:
 *
 *   · NEAR-FIELD (r ≪ c/ω): quasi-static. The field looks like an
 *     instantaneous dipole field that "breathes" in place. E falls off as
 *     1/r³. Energy is stored, swapped between E and B each quarter-period,
 *     and re-absorbed by the source. No net flow outward.
 *
 *   · FAR-FIELD (r ≫ c/ω): radiative. E_θ ∝ sin θ / r, B_φ = E_θ / c, both
 *     transverse, in phase, peaking broadside (θ = π/2) and zero along the
 *     dipole axis (θ = 0, π). These are outgoing spherical wavefronts; the
 *     Poynting vector points radially outward and the energy LEAVES for good.
 *
 * The crossover happens at a single characteristic radius
 *
 *   r_transition = c / ω = λ / (2π)
 *
 * which is the distance a wavefront travels in one radian of the dipole's
 * oscillation. That is where the closed near-field loops pinch off and
 * propagate outward as radiation. This is the moment fields LEAVE THEIR
 * SOURCE — the topological event that makes light out of current.
 *
 * Units are SI throughout. Dipole-moment magnitude p₀ is in C·m; angular
 * frequency ω is in rad/s; r is in m; retarded time is measured in seconds.
 *
 * References:
 *   · Griffiths, "Introduction to Electrodynamics", §11.1.2 (point-dipole
 *     multipole expansion; retarded-potential derivation of the E_θ and B_φ
 *     expressions).
 *   · Jackson, "Classical Electrodynamics", §9.2 (multipole radiation).
 */

import { EPSILON_0, MU_0, SPEED_OF_LIGHT } from "@/lib/physics/constants";

/**
 * Near-zone (quasi-static) electric field of an oscillating dipole.
 *
 * Valid in the regime r ≪ c/ω. In that limit the full retarded dipole field
 * reduces to the instantaneous static dipole field evaluated at the retarded
 * dipole moment p(t_ret) = p₀ cos(ω t_ret). The spherical components are
 *
 *   E_r     =  (2 p_ret / 4πε₀) · cos θ / r³
 *   E_θ     =  (  p_ret / 4πε₀) · sin θ / r³
 *
 * where p_ret = p₀ cos(ω · tRet). Both components fall off as 1/r³, so the
 * near field dominates at small radii but dies too fast to carry energy to
 * infinity. The magnetic part in the near zone is smaller by a factor of
 * (ω r / c) and is omitted here.
 *
 * Returns { Er, Etheta } in V/m.
 */
export function dipoleNearFieldE(
  p0: number,
  omega: number,
  r: number,
  thetaRad: number,
  tRet: number,
): { Er: number; Etheta: number } {
  if (r <= 0) return { Er: 0, Etheta: 0 };
  const pRet = p0 * Math.cos(omega * tRet);
  const prefactor = 1 / (4 * Math.PI * EPSILON_0);
  const r3 = r * r * r;
  const Er = (2 * pRet * Math.cos(thetaRad) * prefactor) / r3;
  const Etheta = (pRet * Math.sin(thetaRad) * prefactor) / r3;
  return { Er, Etheta };
}

/**
 * Far-zone (radiation) transverse electric field of an oscillating dipole.
 *
 * Valid in the regime r ≫ c/ω. In that limit only the accelerating-charge
 * term in the retarded Liénard–Wiechert expansion survives, giving a single
 * transverse component
 *
 *   E_θ(r, θ, t) = −(μ₀ p₀ ω² / 4π) · (sin θ / r) · cos(ω (t − r/c))
 *
 * The magnitude falls off as 1/r — the Poynting flux S ∝ E² / μ₀c then
 * falls as 1/r², so integrating over a sphere of radius r gives a
 * radius-independent radiated power. Energy carried to infinity. This is
 * what a far-away observer detects as "light from the source".
 *
 * The sign follows the Griffiths convention (dipole moment along +ẑ, E_θ
 * positive in the direction of increasing θ). Callers who only need the
 * magnitude can take an absolute value.
 *
 * Returns E_θ in V/m. The radial component is vanishing in this limit.
 */
export function dipoleFarFieldE(
  p0: number,
  omega: number,
  r: number,
  thetaRad: number,
  tRet: number,
): number {
  if (r <= 0) return 0;
  const amplitude = (MU_0 * p0 * omega * omega) / (4 * Math.PI);
  const phase = omega * (tRet - r / SPEED_OF_LIGHT);
  return -amplitude * (Math.sin(thetaRad) / r) * Math.cos(phase);
}

/**
 * Total time-averaged power radiated by an oscillating electric dipole.
 *
 *   ⟨P⟩ = (μ₀ p₀² ω⁴) / (12π c)     (watts)
 *
 * Equivalently (1/4πε₀c³) · (p₀² ω⁴ / 3) via μ₀ = 1/(ε₀c²). The ω⁴
 * dependence is the Rayleigh-scattering law — why the sky is blue. The
 * p₀² dependence is the "radiate twice as far / four times as much power"
 * rule that governs antenna design.
 *
 * Obtained by integrating ⟨S⟩ over a far-field sphere — see
 * `dipoleAngularIntensity` and the solid-angle integral
 * ∫ sin³θ dθ dφ = 8π/3.
 */
export function dipoleTotalPower(p0: number, omega: number): number {
  return (MU_0 * p0 * p0 * omega * omega * omega * omega) /
    (12 * Math.PI * SPEED_OF_LIGHT);
}

/**
 * Angular distribution of radiated power (time-averaged Poynting flux times
 * r² — i.e. power per steradian):
 *
 *   dP/dΩ = (μ₀ p₀² ω⁴) / (32π² c) · sin²θ
 *
 * θ is the polar angle from the dipole axis. The pattern is the "doughnut":
 * zero along the axis (sin 0 = 0), maximum broadside (sin π/2 = 1), azimuthal
 * symmetric. Integrating over the full solid angle recovers `dipoleTotalPower`:
 *
 *   ∫₀^π sin²θ · 2π sin θ dθ = (8π/3)
 *   (μ₀ p₀² ω⁴ / 32π² c) · 8π/3 = μ₀ p₀² ω⁴ / (12π c)  ✓
 *
 * Units: W/sr.
 */
export function dipoleAngularIntensity(
  p0: number,
  omega: number,
  thetaRad: number,
): number {
  const s = Math.sin(thetaRad);
  return (MU_0 * p0 * p0 * omega * omega * omega * omega * s * s) /
    (32 * Math.PI * Math.PI * SPEED_OF_LIGHT);
}

/**
 * Transition radius between the near-field (quasi-static, 1/r³) and the
 * far-field (radiative, 1/r):
 *
 *   r_transition = c / ω = λ / (2π)
 *
 * It is a single radian of wavefront propagation — the distance light
 * travels while the source advances by one radian of phase. Inside r_t
 * the field looks like an instantaneous dipole that breathes; outside r_t
 * the loops have pinched off and propagate outward as spherical wavefronts.
 * The two regimes have equal magnitude at r = r_t (up to order-one factors)
 * — this is the crossover point drawn by the near-far field transition scene.
 *
 * Returns metres. Requires ω > 0.
 */
export function transitionRadius(omega: number): number {
  if (omega <= 0) return Infinity;
  return SPEED_OF_LIGHT / omega;
}
