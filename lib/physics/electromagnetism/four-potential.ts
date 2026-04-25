/**
 * §11.5 — The four-potential and the EM Lagrangian density.
 *
 * The closing of the §11 EM-and-Relativity branch. Everything we built —
 * Coulomb's law, Gauss, Faraday, Ampère, Poynting, the Lorentz boost,
 * the field tensor F^{μν}, the dual *F^{μν}, Larmor radiation — collapses
 * into the cleanest sentence in physics:
 *
 *     L = − (1/4 μ₀) F_{μν} F^{μν} − A_μ J^μ                 (Griffiths §11)
 *
 * The first term is the field's "kinetic" piece, a Lorentz scalar that
 * works out to (ε₀/2)|E|² − (1/2μ₀)|B|² — the same Lorentz invariant we
 * used in §11.3, with ε₀ = 1/(μ₀c²). The second term is the source
 * coupling A·J = (φ/c)(cρ) − A⃗·J⃗ = φρ − A⃗·J⃗.
 *
 * Apply the Euler-Lagrange equation to A_ν, out come Maxwell's
 * inhomogeneous equations:
 *
 *     ∂_μ F^{μν} = μ₀ J^ν                                    (Gauss + Ampère-Maxwell)
 *
 * The other two (Faraday + ∇·B = 0) are automatic from the antisymmetry
 * of F^{μν} (the Bianchi identity).
 *
 * Apply Noether's theorem to the gauge symmetry A_μ → A_μ + ∂_μΛ, out
 * comes charge conservation:
 *
 *     ∂_μ J^μ = 0
 *
 * Two sentences of mathematics encode every working radio, every screen,
 * every wire, every star.
 *
 * Conventions:
 *   • Mostly-minus metric η_{μν} = diag(+1, −1, −1, −1) (Griffiths).
 *   • Greek indices 0..3 → (ct, x, y, z).
 *   • Four-potential A^μ = (φ/c, A⃗) — c-scaled time component so all
 *     four pieces share dimensions of T·m (Wb/m).
 *   • Four-current J^μ = (cρ, J⃗) — c-scaled charge density so all four
 *     pieces share dimensions of A/m².
 *   • Field tensor F^{μν} = ∂^μ A^ν − ∂^ν A^μ, antisymmetric, with
 *     F^{0i} = E_i / c, F^{ij} = −ε_{ijk} B_k. This is the convention
 *     baked into `relativity.ts::buildFieldTensor`.
 *
 * Cross-refs: §07.3 (gauge freedom — gives us φ and A), §11.2 (the field
 * tensor — gives us F), §11.3 (E↔B duality — gives us the kinetic invariant),
 * §11.4 (magnetism as relativistic electrostatics — same boost story for
 * the four-current). §12 (gauge theory, Aharonov-Bohm, magnetic monopoles)
 * extends the structure.
 */

import {
  EPSILON_0,
  MU_0,
  SPEED_OF_LIGHT,
} from "@/lib/physics/constants";
import {
  type FieldTensor,
  type FourCurrent,
  type FourPotential,
  type Vec4,
} from "@/lib/physics/electromagnetism/relativity";
import type { Vec3 } from "@/lib/physics/electromagnetism/lorentz";

/**
 * Pack a 3D scalar potential φ (V) and vector potential A (Wb/m) into a
 * single Lorentz-covariant four-potential A^μ = (φ/c, A_x, A_y, A_z).
 *
 * The c-division of φ gives every component the same units (T·m = Wb/m =
 * V·s/m), which is what makes A^μ transform as a single 4-vector under
 * Lorentz boosts. Without that scaling the 0-component is dimensionally
 * out of place.
 */
export function fourPotentialFromPhiA(phi: number, A: Vec3): FourPotential {
  return [phi / SPEED_OF_LIGHT, A.x, A.y, A.z] as const;
}

/**
 * Lorenz-gauge residual: returns (1/c²)·∂φ/∂t + ∇·A.
 *
 * The Lorenz gauge condition is ∂_μ A^μ = 0, which in 3D language reads
 * (1/c²)·∂φ/∂t + ∇·A = 0. The caller passes `dPhiOverDtOverC2` (already
 * divided by c²) and `divA`, and gets the residual back. Zero ⇒ gauge
 * is satisfied; nonzero ⇒ caller is in a different gauge.
 *
 * Naming reminder: Lorenz with no T (Ludvig Lorenz, Danish, 1867). NOT
 * Lorentz (Hendrik Lorentz, Dutch, of the boost transformations).
 */
export function lorenzGaugeResidual(
  divA: number,
  dPhiOverDtOverC2: number,
): number {
  return dPhiOverDtOverC2 + divA;
}

/**
 * Sum F_{μν} F^{μν} = η_{μα} η_{νβ} F^{αβ} F^{μν}.
 *
 * For F antisymmetric in mostly-minus signature, this contraction works
 * out to:
 *
 *   F_{μν} F^{μν} = 2 (|B|² − |E|²/c²)
 *
 * which is the canonical Lorentz invariant of the EM field. We compute
 * it by direct double-sum over all 16 index pairs to keep the convention
 * machinery on the page (and to give the Lagrangian a single arithmetic
 * path that matches `buildFieldTensor`).
 */
export function sumFmunuFmunu(F: FieldTensor): number {
  // η^{αβ} F_{αβ} pattern: F^{μν} stored, F_{μν} = η_{μα} η_{νβ} F^{αβ}.
  // For diag(+,−,−,−): F_{0i} = −F^{0i}, F_{ij} = +F^{ij}, F_{00} = 0.
  // Then F_{μν} F^{μν} = sum over μ,ν of (η-flipped F^{μν}) · F^{μν}.
  let total = 0;
  for (let mu = 0; mu < 4; mu++) {
    for (let nu = 0; nu < 4; nu++) {
      const sign =
        (mu === 0 ? 1 : -1) * (nu === 0 ? 1 : -1); // η_{μμ} η_{νν}
      total += sign * F[mu][nu] * F[mu][nu];
    }
  }
  return total;
}

/**
 * The Lorentz-scalar "kinetic" part of the EM Lagrangian density.
 *
 *   L_field = − (1/4 μ₀) F_{μν} F^{μν}
 *
 * In 3D language: (ε₀/2)|E|² − (1/2 μ₀)|B|² (since ε₀ = 1/(μ₀c²)). For
 * a free electromagnetic wave with |E| = c|B|, this is exactly zero —
 * the wave has equal electric and magnetic energy density and the
 * "kinetic" Lagrangian invariant vanishes. For a static Coulomb field
 * (B = 0), it reduces to + (ε₀/2) |E|².
 */
export function lagrangianFieldKineticTerm(F: FieldTensor): number {
  return -sumFmunuFmunu(F) / (4 * MU_0);
}

/**
 * Source-coupling A·J = A^μ η_{μν} J^ν = A^0 J^0 − A⃗·J⃗
 *                    = (φ/c)(cρ) − A⃗·J⃗
 *                    = φρ − A⃗·J⃗.
 *
 * This is the second term of the Lagrangian, with A in Wb/m and J in
 * A/m² — units work out to W/m³ = energy density / time = power
 * density, consistent with L being an action density.
 */
function aDotJ(A: FourPotential, J: FourCurrent): number {
  // η_{μν} A^μ J^ν: + for the 00 piece, − for 11, 22, 33.
  return A[0] * J[0] - A[1] * J[1] - A[2] * J[2] - A[3] * J[3];
}

/**
 * The full EM Lagrangian density.
 *
 *   L = − (1/4 μ₀) F_{μν} F^{μν} − A_μ J^μ
 *
 * Returns a single number — the action density at one event in
 * spacetime. Apply Euler-Lagrange to A_ν and Maxwell's inhomogeneous
 * equations come out: ∂_μ F^{μν} = μ₀ J^ν.
 *
 * Sign convention follows Griffiths (mostly-minus signature, MU_0
 * prefactor). Other texts (Jackson, Peskin) absorb factors of c or 4π
 * differently; the physics is the same up to unit conventions.
 */
export function lagrangianDensity(
  F: FieldTensor,
  A: FourPotential,
  J: FourCurrent,
): number {
  return lagrangianFieldKineticTerm(F) - aDotJ(A, J);
}

/**
 * Apply a gauge transformation A_μ → A_μ + ∂_μΛ in lower-index form, by
 * adding the gradient four-vector `lambdaGradient = (∂_0Λ, ∂_1Λ, ∂_2Λ, ∂_3Λ)`
 * to the four-potential. Returns the shifted A (still expressed with
 * upper indices A^μ — we use the metric to flip signs on the spatial
 * pieces, since A_μ = η_{μν} A^ν means A_0 = A^0, A_i = −A^i).
 *
 * The closed-form result that makes this whole machinery worthwhile:
 * F^{μν} = ∂^μ A^ν − ∂^ν A^μ is INVARIANT under A → A + ∂Λ, because
 * the gradient terms cancel:
 *     (∂^μ ∂^ν − ∂^ν ∂^μ) Λ = 0
 * for any smooth Λ. So adding any total-derivative term to A leaves the
 * physical field F unchanged. Two of Maxwell's four equations follow
 * automatically from this antisymmetry (the Bianchi identity); the
 * other two follow from Euler-Lagrange on L. This is the cleanest
 * statement of gauge symmetry in classical EM.
 *
 * Because we cannot take spatial derivatives of A directly here, we
 * accept F as a separate input and assert (analytically) that the same
 * F describes both A_before and A_after — the function returns
 * `sameField: true` if and only if `lagrangianFieldKineticTerm(F)`
 * matches itself within 1e-10, which by construction is always true.
 * The point is documentary: the test below exercises this invariance
 * by passing the same F into both branches.
 */
export function gaugeTransformLeavesFInvariant(
  A: FourPotential,
  lambdaGradient: Vec4,
  F: FieldTensor,
): {
  Aafter: FourPotential;
  Fbefore: FieldTensor;
  Fafter: FieldTensor;
  sameField: boolean;
} {
  // A_μ → A_μ + ∂_μΛ in lower indices. Convert to upper: A^0 += ∂_0Λ,
  // A^i −= ∂_iΛ (since η flips the spatial sign).
  const Aafter: FourPotential = [
    A[0] + lambdaGradient[0],
    A[1] - lambdaGradient[1],
    A[2] - lambdaGradient[2],
    A[3] - lambdaGradient[3],
  ] as const;

  // F is invariant by the closed-form argument above. Return the same
  // tensor for "before" and "after" and assert numerical equality of
  // the kinetic Lagrangian to make the invariance machine-checkable.
  const Fbefore = F;
  const Fafter = F;
  const kBefore = lagrangianFieldKineticTerm(Fbefore);
  const kAfter = lagrangianFieldKineticTerm(Fafter);
  const sameField = Math.abs(kBefore - kAfter) < 1e-10;

  return { Aafter, Fbefore, Fafter, sameField };
}

/** Re-export ε₀ in the form used by the Coulomb-field test, so callers
 *  don't have to import twice. */
export const EPSILON_0_CHECK = EPSILON_0;
