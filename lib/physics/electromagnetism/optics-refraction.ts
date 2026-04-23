/**
 * Index of refraction — the dimensionless number that parameterises how much
 * a material slows the phase of a light wave relative to vacuum.
 *
 * Definition (phase-velocity):   v_phase = c / n,  n ≥ 1 for most materials
 * Derivation (EM):               n = √(ε_r · μ_r)
 * Cauchy's empirical fit:        n(λ) = A + B/λ² + C/λ⁴ (visible, transparent
 *                                materials, well away from absorption bands)
 *
 * The microscopic picture: the incident electric field drives bound electrons
 * (Lorentz oscillators) a tiny bit off-centre. They re-radiate at the driving
 * frequency but with a phase lag. The superposition of the original wave and
 * the re-radiated waves produces a net wave whose phase fronts advance more
 * slowly than c — slower by exactly the factor 1/n. Nothing is actually
 * dragging the photons; the "speed of light in a medium" is a collective
 * phenomenon of the forward-scattered field. See Feynman Vol. I §31.
 *
 * Surprising corner: at X-ray frequencies n drops *below 1* in most solids.
 * The phase velocity is then greater than c. Relativity is not violated —
 * signal velocity (the front of a pulse carrying information) is still ≤ c,
 * and the phase velocity carries no information on its own.
 */

import { SPEED_OF_LIGHT } from "@/lib/physics/constants";

/**
 * Phase velocity of light in a medium of refractive index n.
 *
 *   v_phase = c / n
 *
 * For n = 1.5 (crown glass) this returns ≈ 2.00×10⁸ m/s — light is 33% slower.
 * For X-rays through glass n < 1 and v_phase > c (see file header).
 */
export function phaseVelocity(n: number): number {
  if (!Number.isFinite(n) || n <= 0) {
    throw new Error("phaseVelocity: n must be a finite positive number");
  }
  return SPEED_OF_LIGHT / n;
}

/**
 * Refractive index from the relative permittivity ε_r and permeability μ_r.
 *
 *   n = √(ε_r · μ_r)
 *
 * Follows from Maxwell's equations in a linear medium: the wave equation has
 * propagation speed 1/√(μ·ε) = c/√(ε_r·μ_r), and n is defined so that
 * v_phase = c/n. For most optical materials μ_r ≈ 1, so n ≈ √ε_r.
 *
 * Example: water at optical frequencies has ε_r ≈ 1.77 (different from its
 * low-frequency 80!), μ_r ≈ 1, so n ≈ 1.33 — matches the handbook value.
 */
export function indexFromPermittivityMu(epsR: number, muR: number): number {
  if (!Number.isFinite(epsR) || epsR <= 0) {
    throw new Error("indexFromPermittivityMu: epsR must be finite and > 0");
  }
  if (!Number.isFinite(muR) || muR <= 0) {
    throw new Error("indexFromPermittivityMu: muR must be finite and > 0");
  }
  return Math.sqrt(epsR * muR);
}

/**
 * Cauchy's empirical fit for transparent dielectrics in the visible.
 *
 *   n(λ) = A + B/λ² + C/λ⁴
 *
 * λ is expressed in **micrometres** (the convention Cauchy published in 1836,
 * inherited by every glass catalogue since). `C` defaults to 0 — two-term
 * Cauchy is adequate for most crown and common flint glasses; the four-term
 * form is only needed for steep-dispersion flints near the UV cutoff.
 *
 * Worked example: Schott BK7 crown glass, A = 1.5046, B = 4.2×10⁻³ µm².
 * At λ = 0.589 µm (sodium D line) this gives n ≈ 1.517 — the textbook value.
 */
export function cauchyFit(
  lambdaUm: number,
  A: number,
  B: number,
  C: number = 0,
): number {
  if (!Number.isFinite(lambdaUm) || lambdaUm <= 0) {
    throw new Error("cauchyFit: lambdaUm must be finite and > 0");
  }
  const l2 = lambdaUm * lambdaUm;
  const l4 = l2 * l2;
  return A + B / l2 + C / l4;
}

/**
 * Numerical dn/dλ for any user-supplied n(λ) using a centered finite
 * difference. Units follow the units of λ the caller passes in.
 *
 * In a *normally dispersive* medium (away from absorption bands) dn/dλ < 0:
 * shorter wavelengths bend more than longer ones — the reason a prism sorts
 * white light with violet at the wide end and red at the narrow end. In an
 * *anomalously* dispersive region dn/dλ > 0; that only happens close to a
 * material resonance, where absorption is also large.
 *
 * Uses a step of λ/1000 by default — small enough to be accurate for smooth
 * fits like Cauchy or Sellmeier, large enough to avoid catastrophic
 * cancellation in float64.
 */
export function dispersionCoefficient(
  nFn: (lambda: number) => number,
  lambda: number,
  h?: number,
): number {
  if (!Number.isFinite(lambda) || lambda <= 0) {
    throw new Error("dispersionCoefficient: lambda must be finite and > 0");
  }
  const step = h ?? lambda / 1000;
  const nPlus = nFn(lambda + step);
  const nMinus = nFn(lambda - step);
  return (nPlus - nMinus) / (2 * step);
}
