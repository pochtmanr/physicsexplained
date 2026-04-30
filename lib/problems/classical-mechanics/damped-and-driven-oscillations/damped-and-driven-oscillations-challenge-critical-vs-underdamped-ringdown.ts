/**
 * CHALLENGE — Compare underdamped and critically-damped ringdown.
 *
 * A spring–mass system with m = 1 kg, k = 16 N/m starts at x₀ = 0.25 m
 * from rest.  Natural frequency ω₀ = sqrt(k/m) = 4 rad/s.
 * Critical damping: γ_crit = 2ω₀ = 8 rad/s.
 *
 * For an underdamped system with γ_under = 1 rad/s:
 *   (a) Find x(t = 2 s) using dampedFree.
 *   (b) Find the fraction of initial energy remaining at t = 2 s.
 *       Energy ∝ x², so fraction = (x/x₀)² using the envelope approximation.
 *
 * For the critically-damped system with γ_crit:
 *   (c) Find x(t = 2 s) using dampedFree.
 *   (d) Find the first time t* at which the critically-damped solution
 *       falls below 1 % of x₀ (numerical: solved analytically for critically damped).
 *       x_crit(t) = x₀ * exp(−γt/2) * (1 + γt/2)  ≤ 0.01 * x₀
 *       0.01 = exp(−4t)(1 + 4t)  → solve iteratively.
 *
 * Note: for the 1% crossing we use a simple bisection between t=0 and t=5 s.
 *
 * Steps:
 *   1. omega_0   = sqrt(k / m)
 *   2. gamma_crit = 2 * omega_0
 *   3. x_under_2 = dampedFree(t_eval, x_0, {omega_0, gamma_under})
 *   4. energy_frac = (x_under_2 / x_0)^2  [envelope-based estimate]
 *   5. x_crit_2   = dampedFree(t_eval, x_0, {omega_0, gamma_crit})
 *   6. t_star     = bisection for 1% crossing of critically-damped solution  ← final answer
 */

import { dampedFree } from "@/lib/physics/damped-oscillator";

export const inputs: Record<string, { value: number; units: string }> = {
  k:           { value: 16,   units: "N/m" },
  m:           { value: 1,    units: "kg" },
  x_0:         { value: 0.25, units: "m" },
  gamma_under: { value: 1,    units: "rad/s" },
  t_eval:      { value: 2,    units: "s" },
};

export function solve(): Record<string, number> {
  const k           = inputs.k.value;
  const m_val       = inputs.m.value;
  const x_0         = inputs.x_0.value;
  const gamma_under = inputs.gamma_under.value;
  const t_eval      = inputs.t_eval.value;

  // Step 1: natural frequency
  const omega_0 = Math.sqrt(k / m_val);

  // Step 2: critical damping coefficient
  const gamma_crit = 2 * omega_0;

  // Step 3: underdamped position at t_eval
  const x_under_2 = dampedFree(t_eval, x_0, { omega0: omega_0, gamma: gamma_under });

  // Step 4: energy fraction remaining (envelope approximation)
  // True envelope: A(t) = x_0 * exp(-gamma_under * t / 2)
  const A_t = x_0 * Math.exp((-gamma_under * t_eval) / 2);
  const energy_frac = (A_t / x_0) ** 2;

  // Step 5: critically damped position at t_eval
  const x_crit_2 = dampedFree(t_eval, x_0, { omega0: omega_0, gamma: gamma_crit });

  // Step 6: bisection for t* where critically-damped solution first ≤ 0.01 * x_0
  // f(t) = exp(-gamma_crit * t / 2) * (1 + gamma_crit * t / 2) - 0.01
  const target = 0.01 * x_0;
  let lo = 0;
  let hi = 5; // 5 s is well past the crossing
  for (let i = 0; i < 60; i++) {
    const mid = (lo + hi) / 2;
    const val = dampedFree(mid, x_0, { omega0: omega_0, gamma: gamma_crit });
    if (val > target) {
      lo = mid;
    } else {
      hi = mid;
    }
  }
  const t_star = (lo + hi) / 2;

  return { omega_0, gamma_crit, x_under_2, energy_frac, x_crit_2, t_star };
}
