/**
 * HARD — Terminal velocity of a small sphere in Stokes (linear) drag.
 *
 * A steel sphere of radius r = 0.003 m and mass m = 1.5 × 10⁻⁴ kg falls
 * through water (dynamic viscosity η = 0.001 Pa·s). Find:
 *   1. The linear drag coefficient b = 6πηr   (Stokes' law)
 *   2. The terminal velocity v_t = mg / b
 *   3. The time constant τ = m / b            (time to reach 63 % of v_t)
 *
 * Steps:
 *   1. b    = 6 * pi * eta * r
 *   2. v_t  = m * g / b
 *   3. tau  = m / b
 *
 * Uses stokesDrag() and terminalVelocityLinear() from friction.ts.
 */

import { G, stokesDrag, terminalVelocityLinear } from "@/lib/physics/friction";

export const inputs: Record<string, { value: number; units: string }> = {
  r:   { value: 0.003,  units: "m" },
  eta: { value: 0.001,  units: "Pa·s" },
  m:   { value: 1.5e-4, units: "kg" },
  g:   { value: G,      units: "m/s²" },
};

export function solve(): Record<string, number> {
  const r   = inputs.r.value;
  const eta = inputs.eta.value;
  const m   = inputs.m.value;
  const g   = inputs.g.value;

  // Step 1: Stokes drag coefficient b = 6πηr
  // stokesDrag gives F = b*v, so b = stokesDrag(1, r, eta) at unit velocity
  const b = stokesDrag(1, r, eta); // = 6π η r · 1

  // Step 2: terminal velocity (linear drag)
  const v_t = terminalVelocityLinear(m, b, g);

  // Step 3: time constant for exponential approach to v_t
  const tau = m / b;

  return { b, v_t, tau };
}
