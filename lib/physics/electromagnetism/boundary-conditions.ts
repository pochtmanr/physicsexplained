import { EPSILON_0 } from "@/lib/physics/constants";

/**
 * Boundary conditions for electric fields at an interface between two
 * dielectric media.
 *
 * The four conditions all follow from Maxwell's two electrostatic equations
 * applied to thin "pillbox" volumes and "loop" rectangles straddling the
 * interface:
 *
 *   1. ∮ E · dℓ = 0          (E is conservative)  →  tangential E continuous
 *   2. ∮ D · dA = Q_free     (Gauss for D)        →  normal D jumps by σ_free
 *
 * From these two we get the others by substituting D = κε₀E:
 *
 *   3. tangential D jumps by the κ-ratio (κ₁ E_t = D_t/κ₂ doesn't hold; rather
 *      D₁_t / D₂_t = κ₁ / κ₂ since E_t is what matches).
 *   4. normal E jumps according to the free surface charge AND the κ-ratio.
 *
 * Conventions: subscript 1 refers to the medium on side 1 of the interface,
 * subscript 2 to side 2. The unit normal points FROM side 2 INTO side 1
 * (from "below" to "above" if you imagine a horizontal slab). σ_free is the
 * free surface charge density sitting ON the interface, in C/m².
 *
 * Permittivities are dimensionless relative permittivities κ (also written
 * ε_r); vacuum is κ = 1. The absolute permittivity of side i is ε_i = κ_i ε₀.
 */

/**
 * Tangential electric field is continuous across any interface — no exceptions.
 *
 * Derivation: ∮ E · dℓ = 0 for a thin rectangular loop straddling the boundary.
 * Take the loop's height to zero. The two short sides contribute nothing; the
 * two long sides contribute (E₁_t − E₂_t) · L = 0, so E₁_t = E₂_t.
 *
 * This is an identity — included for symmetry with the other helpers and to
 * make the API tell the whole story.
 */
export function tangentialEContinuity(E1_tan: number): number {
  return E1_tan;
}

/**
 * Normal component of E on side 2 given the normal component on side 1, the
 * relative permittivities of both sides, and any free surface charge sitting
 * on the interface.
 *
 * Pillbox argument: ∮ D · dA = Q_free_enclosed. Take a flat coin straddling
 * the interface and shrink its height to zero. The cylindrical wall drops
 * out, leaving D₁_n − D₂_n = σ_free (with the normal pointing from 2 into 1).
 * Substituting D = κε₀E and solving for E₂_n:
 *
 *     E₂_n = (κ₁ E₁_n − σ_free / ε₀) / κ₂
 *
 * If σ_free = 0 (the typical case at a clean dielectric–dielectric interface),
 * the normal E simply scales by the inverse κ ratio: E₂_n = (κ₁/κ₂) E₁_n.
 */
export function normalEJump(
  E1_normal: number,
  sigmaFree: number,
  kappa1: number,
  kappa2: number,
): number {
  return (kappa1 * E1_normal - sigmaFree / EPSILON_0) / kappa2;
}

/**
 * Tangential D on side 2 given tangential D on side 1 and the κ-ratio.
 *
 * Because tangential E is what is continuous, and D = κε₀E, the tangential
 * components of D do NOT match across the boundary — they scale:
 *
 *     D₂_t = (κ₂ / κ₁) D₁_t
 *
 * Equivalently: D₁_t / D₂_t = κ₁ / κ₂. The denser medium (higher κ) carries
 * the larger tangential D for the same tangential E.
 */
export function tangentialDJump(
  D1_tan: number,
  kappa1: number,
  kappa2: number,
): number {
  return (kappa2 / kappa1) * D1_tan;
}

/**
 * Normal D on side 2 given normal D on side 1 and any free surface charge.
 *
 *     D₁_n − D₂_n = σ_free      ⇒      D₂_n = D₁_n − σ_free
 *
 * In the common case σ_free = 0, normal D is continuous — this is the cleanest
 * statement in the whole boundary-condition story, and the reason the D field
 * is sometimes preferred over E for problems with dielectric interfaces.
 */
export function normalDContinuity(D1_normal: number, sigmaFree = 0): number {
  return D1_normal - sigmaFree;
}

/**
 * Static analogue of Snell's law: a field line crossing a clean interface
 * (σ_free = 0) bends because the normal component scales while the tangential
 * component is preserved.
 *
 * If θ₁ is the angle the field line makes with the surface normal in medium 1
 * (so tan θ₁ = E_t / E_n), then in medium 2:
 *
 *     tan θ₂ / tan θ₁ = κ₂ / κ₁
 *
 * Lines bend AWAY from the normal when going into a denser dielectric (κ₂ >
 * κ₁) — the opposite of light's behaviour at the same interface, because for
 * static fields the tangential-E rule wins, not the wave-optics rule. The
 * Fresnel-equations topic (§09) covers the dynamic version.
 *
 * Returns θ₂ in the same unit as θ₁ (radians).
 *
 * Edge cases:
 *   - θ₁ = 0 (normal incidence) → θ₂ = 0
 *   - θ₁ = π/2 (grazing) → θ₂ = π/2
 *   - κ₁ = κ₂ → θ₂ = θ₁ (no interface, geometrically)
 */
export function dielectricRefraction(
  theta1: number,
  kappa1: number,
  kappa2: number,
): number {
  // Preserve the sign so that lines tilted left or right behave symmetrically.
  const sign = Math.sign(theta1) || 1;
  const a = Math.abs(theta1);

  // Grazing or normal incidence pass through untouched.
  if (a === 0) return 0;
  if (Math.abs(a - Math.PI / 2) < 1e-12) return sign * (Math.PI / 2);

  const tan2 = (kappa2 / kappa1) * Math.tan(a);
  return sign * Math.atan(tan2);
}
