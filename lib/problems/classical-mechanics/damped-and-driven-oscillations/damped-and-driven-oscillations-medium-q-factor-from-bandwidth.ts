/**
 * MEDIUM — Q factor and energy ringdown from damping parameters.
 *
 * A tuning fork modelled as an underdamped oscillator has
 * ω₀ = 2π × 440 rad/s (A₄ note) and γ = 8.796 rad/s.
 * Find Q, the number of cycles for amplitude to fall to 1/e of initial,
 * and the half-power bandwidth Δω.
 *
 * Physics:
 *   Q = ω₀ / γ
 *   Amplitude ∝ exp(−γt/2).  After n_e cycles amplitude = 1/e ⇒
 *     γ * t_e / 2 = 1  ⇒  t_e = 2/γ  ⇒  n_e = t_e * f_d = (2/γ)*(ω_d / 2π)
 *   Half-power bandwidth (FWHM of resonance curve): Δω = γ (i.e. ω₀/Q).
 *
 * Steps:
 *   1. Q       = omega_0 / gamma
 *   2. omega_d = sqrt(omega_0^2 - gamma^2 / 4)
 *   3. t_e     = 2 / gamma
 *   4. n_e     = t_e * omega_d / (2 * pi)
 *   5. delta_omega = gamma          ← final answer (bandwidth)
 */

import { qualityFactor } from "@/lib/physics/damped-oscillator";

export const inputs: Record<string, { value: number; units: string }> = {
  omega_0: { value: 2 * Math.PI * 440, units: "rad/s" },
  gamma:   { value: 8.796,             units: "rad/s" },
};

export function solve(): Record<string, number> {
  const omega_0 = inputs.omega_0.value;
  const gamma   = inputs.gamma.value;

  // Step 1: quality factor
  const Q = qualityFactor({ omega0: omega_0, gamma });

  // Step 2: damped angular frequency
  const omega_d = Math.sqrt(omega_0 * omega_0 - (gamma * gamma) / 4);

  // Step 3: time for amplitude to fall to 1/e  (γ*t_e/2 = 1 ⇒ t_e = 2/γ)
  const t_e = 2 / gamma;

  // Step 4: number of full cycles in t_e
  const n_e = (t_e * omega_d) / (2 * Math.PI);

  // Step 5: half-power bandwidth Δω = γ
  const delta_omega = gamma;

  return { Q, omega_d, t_e, n_e, delta_omega };
}
