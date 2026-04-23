/**
 * Displacement current — Maxwell's correction to Ampère's law.
 *
 * Ampère's 1826 law, written as ∮B·dℓ = μ₀·I_enc, has a latent bug: the
 * right-hand side depends on which *surface* you choose to compute the
 * enclosed current through, even though the left-hand side depends only on
 * the *loop*. For a charging capacitor the paradox becomes concrete —
 * choose a flat disc threaded by the wire and I_enc is the conduction
 * current; deform the same surface so it passes between the plates and
 * I_enc is zero. Two surfaces bounded by one loop, two different answers.
 *
 * Maxwell (1865, *A Dynamical Theory of the Electromagnetic Field*) fixed
 * this by adding a second term to the right-hand side:
 *
 *   ∮B·dℓ = μ₀·(I_enc + ε₀·∂Φ_E/∂t)
 *
 * The new piece, ε₀·∂Φ_E/∂t, acts like a current even though no charge
 * flows. Between the plates of a charging capacitor, ∂E/∂t is nonzero
 * precisely because ∂Q/∂t is nonzero, and the two balance *exactly*. The
 * total (conduction + displacement) current through any surface bounded by
 * the loop is the same — the paradox collapses.
 *
 * As a reveal: combining ε₀ (electric) with μ₀ (magnetic) through the
 * wave-equation step gives a propagation speed of 1/√(μ₀·ε₀), which is
 * numerically the speed of light. The displacement current is the term
 * that makes electromagnetic waves possible — FIG.34 / §08.
 */

import { EPSILON_0, MU_0 } from "@/lib/physics/constants";

/**
 * Displacement current density at a point.
 *
 *   J_d = ε₀ · ∂E/∂t
 *
 * Units: dE/dt in V/(m·s), return in A/m². If you picture a small patch of
 * area A where E is changing at rate dE/dt, then J_d·A is the rate at which
 * "flux-current" passes through that patch.
 */
export function displacementCurrentDensity(dEdt: number): number {
  return EPSILON_0 * dEdt;
}

/**
 * Total displacement current through a planar area `A` assuming E is uniform
 * and perpendicular to that area:
 *
 *   I_d = ε₀ · A · ∂E/∂t
 *
 * Units: A in m², dEdt in V/(m·s), return in amperes. Derivation: Φ_E = E·A
 * (uniform-E assumption), so ∂Φ_E/∂t = A·∂E/∂t, and I_d = ε₀·∂Φ_E/∂t.
 */
export function displacementCurrent(area: number, dEdt: number): number {
  return EPSILON_0 * area * dEdt;
}

/**
 * Parallel-plate capacitor continuity check.
 *
 * For a capacitor with plate area `A`, gap `d`, charging at rate dQ/dt, the
 * conduction current in the wire is I_c = dQ/dt. Between the plates no
 * conduction current flows, but the electric field is E = σ/ε₀ = Q/(A·ε₀),
 * so ∂E/∂t = (dQ/dt)/(A·ε₀). Plugging into I_d = ε₀·A·∂E/∂t:
 *
 *   I_d = ε₀ · A · (dQ/dt)/(A·ε₀) = dQ/dt = I_c.
 *
 * The two are exactly equal. This is the numeric core of the money shot —
 * the displacement current picks up exactly where the conduction current
 * drops off, so the total current is continuous across the plate boundary.
 *
 * Note: `d` is unused in the algebra (the plate separation cancels because
 * E depends only on σ, not on gap width) but the parameter is kept in the
 * signature because callers reason about capacitor geometry as a whole.
 */
export function capacitorCurrentContinuity(
  A: number,
  d: number,
  dQdt: number,
): { Iconduction: number; Idisplacement: number } {
  if (A <= 0) throw new Error("capacitorCurrentContinuity: A must be > 0");
  if (d <= 0) throw new Error("capacitorCurrentContinuity: d must be > 0");
  // E = Q/(A·ε₀) ⇒ dE/dt = (1/(A·ε₀))·dQ/dt.
  const dEdt = dQdt / (A * EPSILON_0);
  const Iconduction = dQdt;
  const Idisplacement = EPSILON_0 * A * dEdt;
  return { Iconduction, Idisplacement };
}

/**
 * Speed of light as it falls out of Maxwell's system.
 *
 *   c = 1 / √(μ₀ · ε₀)
 *
 * Derivation: Faraday's law (curl E = -∂B/∂t) and the Ampère–Maxwell law
 * (curl B = μ₀·ε₀·∂E/∂t in vacuum) combined give a wave equation
 *   ∂²E/∂t² = (1/(μ₀·ε₀))·∇²E
 * whose propagation speed is 1/√(μ₀·ε₀). Plugging in the CODATA values of
 * μ₀ and ε₀ gives 2.998 × 10⁸ m/s — the speed of light. The two constants
 * were measured in entirely different experiments (μ₀ from ampere-force
 * between wires; ε₀ from Coulomb's law) and yet their product reproduces
 * a number Fizeau and Foucault had measured optically a decade earlier.
 *
 * Maxwell's 1865 reaction, in his own words: "we can scarcely avoid the
 * inference that light consists in the transverse undulations of the same
 * medium which is the cause of electric and magnetic phenomena."
 */
export function speedOfLightFromFundamentals(): number {
  return 1 / Math.sqrt(MU_0 * EPSILON_0);
}

/**
 * The Ampère–Maxwell law evaluated for a given enclosed conduction current
 * and rate of change of electric flux through the bounded surface.
 *
 *   ∮B·dℓ = μ₀·(I_enc + ε₀·∂Φ_E/∂t)
 *
 * Returns the value of the line integral in tesla·metres. Used by scenes to
 * display both panels' ∮B·dℓ readouts — with Maxwell's correction enabled,
 * the two surfaces agree exactly; with it disabled (set dPhiEdt = 0 on the
 * through-the-gap surface), they diverge. That divergence is the paradox.
 */
export function ampereMaxwellLineIntegral(
  iEnclosed: number,
  dPhiEdt: number,
): number {
  return MU_0 * (iEnclosed + EPSILON_0 * dPhiEdt);
}
