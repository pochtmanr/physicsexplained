/**
 * Maxwell's equations — the four lines.
 *
 * After thirty-six figures of individual laws — Coulomb, Gauss, Biot–Savart,
 * Ampère, Faraday, the magnetic vector potential, induction in matter — the
 * whole of classical electromagnetism collapses onto exactly four field
 * equations. Written in the vector form we use today (courtesy of
 * <PhysicistLink slug="oliver-heaviside" />, who boiled Maxwell's 1865
 * twenty-equation quaternion mess down to the four lines in a student's
 * notebook), they read:
 *
 *   ∮ E · dA   =  Q_enc / ε₀                     (Gauss — sources of E)
 *   ∮ B · dA   =  0                              (no magnetic monopoles)
 *   ∮ E · dℓ   =  −dΦ_B / dt                     (Faraday — induction)
 *   ∮ B · dℓ   =  μ₀ ( I_enc + ε₀ dΦ_E/dt )      (Ampère–Maxwell)
 *
 * Four lines of calculus that describe:
 *   — every electric light, motor, and generator that has ever run;
 *   — every radio wave, X-ray, and visible photon your eyes have ever
 *     received;
 *   — the speed of light itself, which drops out of the last two lines
 *     as c = 1 / √(μ₀ ε₀), with no experiment on a beam of light
 *     required to measure it.
 *
 * This module exposes the right-hand sides of the integral-form laws
 * plus the speed-of-light consequence. The helpers are intentionally
 * tiny — each is a one-liner that names a piece of one of the four
 * equations. The value of the module is in the test file, where each
 * line's structure and the constants' interplay are asserted.
 */

import { EPSILON_0, MU_0, SPEED_OF_LIGHT } from "@/lib/physics/constants";

/**
 * Right-hand side of Gauss's law in integral form:
 *
 *   ∮ E · dA = Q_enc / ε₀
 *
 * The total outward electric flux through a closed surface equals the
 * charge inside, divided by the permittivity of free space. This is
 * the line that says "charges are the sources of the electric field" —
 * field lines begin and end on charges, and ε₀ is the exchange rate
 * from coulombs to volt-metres.
 *
 * Units: qEnclosed in coulombs, return in V·m.
 */
export function gaussRhs(qEnclosed: number): number {
  return qEnclosed / EPSILON_0;
}

/**
 * Right-hand side of the no-magnetic-monopole law in integral form:
 *
 *   ∮ B · dA = 0
 *
 * The total outward magnetic flux through any closed surface is
 * exactly zero — field lines of B are loops that never begin or end.
 * This is the only one of the four that has no source term on the
 * right-hand side, and the only one that is still experimentally
 * open: Paul Dirac showed in 1931 that monopoles are consistent with
 * quantum mechanics and would explain charge quantisation, but no one
 * has found one. The helper returns the literal zero to make that
 * fact explicit in code.
 */
export function noMonopoleRhs(): 0 {
  return 0;
}

/**
 * Right-hand side of Faraday's law in integral form:
 *
 *   ∮ E · dℓ = −dΦ_B / dt
 *
 * The EMF around a closed loop equals minus the rate at which the
 * magnetic flux through the loop is changing. The minus sign is
 * Lenz's: the induced current opposes the change that produced it.
 * This is the first law with a *time derivative* on the right-hand
 * side — the first line that says electromagnetism has dynamics, not
 * just static configurations.
 *
 * Units: dPhi_B_dt in Wb/s (= volts), return in volts.
 */
export function faradayRhs(dPhi_B_dt: number): number {
  return -dPhi_B_dt;
}

/**
 * Right-hand side of the Ampère–Maxwell law in integral form:
 *
 *   ∮ B · dℓ = μ₀ ( I_enc + ε₀ dΦ_E / dt )
 *
 * The circulation of B around a closed loop has two sources: real
 * conduction current threading the loop, and the rate of change of
 * electric flux through any surface spanning the loop. The second
 * term — μ₀ε₀ dΦ_E/dt — is Maxwell's 1861 correction, the
 * <Term slug="displacement-current" />. Without it Ampère's law is
 * inconsistent for a charging capacitor (FIG.33). With it, a
 * time-varying E field takes over the job of the conduction current
 * through the capacitor gap, and the bookkeeping closes.
 *
 * Units: iEnclosed in A, dPhi_E_dt in (V·m)/s, return in T·m.
 */
export function ampereMaxwellRhs(
  iEnclosed: number,
  dPhi_E_dt: number,
): number {
  return MU_0 * (iEnclosed + EPSILON_0 * dPhi_E_dt);
}

/**
 * Speed of light in vacuum derived from ε₀ and μ₀:
 *
 *   c = 1 / √( μ₀ ε₀ )
 *
 * The wave equation falls out of Faraday's law and the Ampère–Maxwell
 * law in vacuum. The wave speed is fixed entirely by the two
 * constants that appear in the right-hand sides of the four
 * equations. Maxwell in 1864 computed this number from electrostatic
 * and magnetostatic measurements alone and recognised it as the speed
 * of light — one of the most stunning coincidences in physics, which
 * turned out not to be a coincidence at all. §08 will unpack the
 * derivation in full; here the helper just returns the number.
 *
 * Return: speed of light in metres per second.
 */
export function c(): number {
  return 1 / Math.sqrt(MU_0 * EPSILON_0);
}

/**
 * Relative error between the derived c = 1/√(μ₀ε₀) and the SI-defined
 * exact value of the speed of light, 299 792 458 m/s. With the
 * CODATA-2018 values of μ₀ and ε₀ this should be well under 1e-8 —
 * the residual is the rounding in the stored constants, not physics.
 */
export function cResidual(): number {
  return Math.abs(c() - SPEED_OF_LIGHT) / SPEED_OF_LIGHT;
}
