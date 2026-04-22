import { MU_0 } from "@/lib/physics/constants";
import type { Vec3 } from "@/lib/physics/electromagnetism/lorentz";

export type { Vec3 } from "@/lib/physics/electromagnetism/lorentz";

/**
 * The magnetic vector potential A is the field whose curl is B:
 *
 *   B = ∇ × A
 *
 * A is to B what V is to E — one (vector) field that knows everything about
 * the (other) field, but with extra freedom: A is only determined up to the
 * gradient of an arbitrary scalar (gauge freedom). All physically observable
 * magnetic phenomena come out of B = ∇×A; the gauge choice is bookkeeping.
 *
 * In the Coulomb gauge ∇·A = 0, A satisfies a Poisson equation
 *
 *   ∇²A = −μ₀ J
 *
 * — exactly the form V satisfies for charge density (∇²V = −ρ/ε₀), so every
 * electrostatic intuition transfers component-by-component.
 */

/**
 * The axial component A_z of the vector potential of an infinite straight
 * wire of current I, at perpendicular distance `distance` from the wire,
 * relative to a reference distance `dRef`.
 *
 *   A_z(d) − A_z(dRef) = −(μ₀ I) / (2π) · ln(d / dRef)
 *
 * The wire runs parallel to ẑ; A points the same way as J, parallel to the
 * wire — by analogy with how V from a uniform line of charge points "into a
 * scalar". The 2D integral diverges (the wire is infinite), so a reference
 * distance `dRef` is mandatory; only the *difference* A(d) − A(dRef) is
 * well-defined. Pick `dRef = 1 m` for a clean baseline.
 *
 * Taking the curl of this A in cylindrical coordinates recovers the
 * familiar B_φ = μ₀I / (2πd) of an infinite wire.
 *
 * @param I — current in amperes, signed (positive = +ẑ).
 * @param distance — perpendicular distance from the wire, in metres (> 0).
 * @param dRef — reference distance at which A is taken to be zero, in metres
 *   (> 0). Mandatory because the 2D integral has no natural zero.
 */
export function aFromInfiniteWire(
  I: number,
  distance: number,
  dRef: number,
): number {
  if (distance <= 0 || dRef <= 0) return Number.NaN;
  return -((MU_0 * I) / (2 * Math.PI)) * Math.log(distance / dRef);
}

/**
 * The azimuthal component A_φ of the vector potential of an infinite ideal
 * solenoid of radius R producing uniform magnetic field B inside, evaluated
 * at radial distance r from the symmetry axis.
 *
 *   inside  (r < R):  A_φ = B · r / 2
 *   outside (r ≥ R):  A_φ = B · R² / (2 r)
 *
 * The remarkable feature: outside the solenoid B = 0, yet A is nonzero
 * (and falls off only as 1/r). The vector potential "remembers" the
 * enclosed flux even where the magnetic field has nothing to say. This is
 * the geometric setup behind the Aharonov–Bohm effect (covered in §12),
 * where an electron's wavefunction is shifted by a path that never enters
 * a region with nonzero B.
 *
 * Derived from ∮ A · dℓ = ∫∫ (∇×A) · dA = Φ_enclosed, taking the loop to be
 * a circle of radius r:
 *
 *   2π r · A_φ = Φ(r)
 *   Φ(r) = B · π r²    for r < R   (uniform B threads the disk)
 *   Φ(r) = B · π R²    for r ≥ R   (all flux is already enclosed)
 *
 * @param B_inside — uniform magnetic field inside the solenoid, in tesla.
 * @param R — solenoid radius, in metres (> 0).
 * @param r — radial distance from the axis, in metres (≥ 0).
 */
export function aFromSolenoid(B_inside: number, R: number, r: number): number {
  if (R <= 0 || r < 0) return Number.NaN;
  if (r < R) return (B_inside * r) / 2;
  return (B_inside * R * R) / (2 * r);
}

/**
 * Apply a gauge transformation to A.
 *
 *   A → A' = A + ∇f
 *
 * For any scalar function f, shifting A by its gradient leaves B = ∇×A
 * unchanged (because the curl of a gradient is identically zero). So
 * infinitely many distinct A fields all describe the same B; choosing one
 * is a "gauge choice", and the physical content is everything that survives
 * the choice — which is exactly B (and, in quantum mechanics, the integral
 * of A around closed loops).
 *
 * Adds componentwise. Inputs and output are 3D vectors.
 */
export function gaugeShift(A: Vec3, gradF: Vec3): Vec3 {
  return {
    x: A.x + gradF.x,
    y: A.y + gradF.y,
    z: A.z + gradF.z,
  };
}
