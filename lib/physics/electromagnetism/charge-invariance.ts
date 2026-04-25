/**
 * §11.1 — Charge invariance.
 *
 * Of every quantity electromagnetism cares about, electric charge is the
 * one no Lorentz boost can touch. Length contracts, time dilates, mass-
 * energy mixes, the E and B fields rotate into each other, but the
 * coulomb count of a closed system is the same in every inertial frame.
 *
 * The four-current packages charge density and current density into a
 * single Lorentz-covariant object
 *
 *   J^μ = (c ρ, J_x, J_y, J_z)
 *
 * The factor of c on the time component is just unit-matching: it gives
 * J^μ units of A/m². Under a boost along +x with β = v/c:
 *
 *   c ρ' = γ (c ρ − β J_x)
 *   J_x' = γ (J_x − β c ρ)
 *
 * — exactly the same Lorentz transform the (ct, x) pair obeys. So J^μ is
 * a four-vector.
 *
 * The total charge in a volume V is the integral
 *
 *   Q = ∫_V ρ d³x  =  (1/c) ∫_V J^0 d³x
 *
 * Boost the volume and ρ → γρ (the line density picks up a γ from the
 * mixing with J_x), but the volume itself contracts longitudinally:
 * V → V/γ. The two factors cancel and Q is unchanged. More formally,
 * Q is the flux of J^μ through any space-like 3-surface that bounds the
 * same charge — the divergence-free four-current
 *
 *   ∂_μ J^μ = ∂ρ/∂t + ∇·J = 0           (continuity)
 *
 * makes that flux integral independent of which 3-slice you pick. Local
 * charge conservation is the four-dimensional version of the everyday
 * continuity equation.
 *
 * Historical note: in 1856 Wilhelm Weber and Rudolf Kohlrausch measured
 * the ratio of the electrostatic to electromagnetic units of charge and
 * got 3.1 × 10⁸ m/s — six years before Maxwell published his 1862 paper
 * predicting that light is an electromagnetic wave. The constant c was
 * already inside the EM unit system, decades before anyone could explain
 * why. We expose that ratio here as `weberKohlrauschRatio`.
 */

import { SPEED_OF_LIGHT, EPSILON_0, MU_0 } from "@/lib/physics/constants";
import { type FourCurrent } from "@/lib/physics/electromagnetism/relativity";
import type { Vec3 } from "@/lib/physics/electromagnetism/lorentz";

/**
 * Total charge in a volume V at charge density ρ, viewed from a frame
 * boosted at β relative to the rest frame. The result is independent of
 * β: ρ' = γ ρ multiplies, V' = V/γ divides, the γ cancels. We do the
 * arithmetic explicitly so the cancellation is visible to the test.
 *
 *   Q = ρ · V                 (rest frame)
 *   Q = (γ ρ) · (V / γ) = ρ V (boosted frame, identical)
 *
 * This is the operational content of "charge is a Lorentz scalar." A
 * box of N coulombs in the lab frame contains exactly N coulombs in any
 * frame.
 */
export function chargeInvarianceFlux(
  rho: number,
  volumeM3: number,
  beta: number,
): number {
  if (Math.abs(beta) >= 1) {
    throw new Error(
      `charge-invariance: |β| must be < 1, got ${beta}`,
    );
  }
  const g = 1 / Math.sqrt(1 - beta * beta);
  const rhoBoosted = g * rho;
  const volumeBoosted = volumeM3 / g;
  return rhoBoosted * volumeBoosted;
}

/**
 * The Weber-Kohlrausch ratio: √(1 / (μ₀ ε₀)). In the SI 2019 redefinition
 * this evaluates to the speed of light to all the digits CODATA carries
 * for the constants. Equality is the *physics* — that the ratio of
 * electrostatic to electromagnetic units of charge equals c — which
 * Weber & Kohlrausch measured in 1856, six years before Maxwell.
 */
export function weberKohlrauschRatio(): number {
  return Math.sqrt(1 / (MU_0 * EPSILON_0));
}

/**
 * Build the four-current J^μ from a charge density ρ (C/m³) and current
 * density J (A/m²). The time component is c · ρ so all four components
 * carry units of A/m².
 */
export function fourCurrentFromRhoJ(rho: number, J: Vec3): FourCurrent {
  return [SPEED_OF_LIGHT * rho, J.x, J.y, J.z] as const;
}

/**
 * Continuity-equation residual ∂ρ/∂t + ∇·J. Charge conservation says
 * this vanishes pointwise. The function returns the residual so a caller
 * can assert it is small (zero up to numerical noise).
 */
export function continuityResidual(dRhoDt: number, divJ: number): number {
  return dRhoDt + divJ;
}
