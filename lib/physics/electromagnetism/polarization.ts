/**
 * Polarization and bound charges (FIG.08).
 *
 * In a piece of insulating matter — a "dielectric" — the charges cannot
 * leave their atoms, but they can lean. Switch on an external field E
 * and every atom turns into a tiny stretched dipole: the negative cloud
 * shifts one way, the positive nucleus the other. Sum that microscopic
 * leaning over a chunk of matter and you get a macroscopic vector field
 * called the **polarization** P, measured in C/m².
 *
 * P is dipole moment per unit volume. Where P piles up or thins out,
 * the leaning fails to cancel from atom to neighbouring atom, and you
 * see the leftover charge as if it were real:
 *
 *   ρ_b = −∇·P                (bound volume charge density, C/m³)
 *   σ_b = P · n̂                (bound surface charge density, C/m²)
 *
 * "∇·P" reads as "the rate at which P spreads outward from a point."
 * The minus sign is geometry, not physics — when P points outward, the
 * positive ends of the dipoles leave the region and what's left behind
 * is negative.
 *
 * For a linear isotropic dielectric the leaning is proportional to the
 * total field that finally settles inside the material:
 *
 *   P = ε₀ χ_e E
 *
 * where χ_e is the (dimensionless) **electric susceptibility**. Bigger
 * χ_e means the material polarizes more for the same internal field.
 *
 * This module exposes pure scalar/2D-vector forms of these relations
 * for the topic's prose and visualizations. The full D-field accounting
 * lives in `dielectrics.ts` (next topic).
 */

import { EPSILON_0 } from "@/lib/physics/constants";
import type { Vec2 } from "@/lib/physics/coulomb";

/**
 * Polarization magnitude in a linear isotropic dielectric:
 *   P = ε₀ · χ_e · E
 *
 * @param chiE   electric susceptibility (dimensionless, ≥ 0 for normal matter)
 * @param eField field magnitude inside the material, V/m
 * @returns polarization magnitude, C/m²
 */
export function polarizationFromField(chiE: number, eField: number): number {
  if (chiE < 0) {
    throw new Error(
      `polarizationFromField: χ_e must be ≥ 0 for ordinary dielectrics (got ${chiE}).`,
    );
  }
  return EPSILON_0 * chiE * eField;
}

/**
 * Same as `polarizationFromField` but in 2D vector form: P is parallel
 * to E in linear isotropic matter, and scales by ε₀·χ_e.
 */
export function polarizationVectorFromField(chiE: number, eField: Vec2): Vec2 {
  if (chiE < 0) {
    throw new Error(
      `polarizationVectorFromField: χ_e must be ≥ 0 (got ${chiE}).`,
    );
  }
  const k = EPSILON_0 * chiE;
  return { x: k * eField.x, y: k * eField.y };
}

/**
 * Bound surface-charge density on a face whose outward unit normal is n̂.
 *
 *   σ_b = P · n̂
 *
 * Where P pokes out of the material the surface looks positive; where P
 * dives in the surface looks negative. Equal and opposite faces of a
 * uniformly polarized slab carry equal and opposite σ_b — the textbook
 * "bound sheets" that produce the depolarizing field inside.
 *
 * @param p      polarization vector (C/m²)
 * @param normal outward unit normal of the face (must be a unit vector)
 */
export function boundSurfaceChargeDensity(p: Vec2, normal: Vec2): number {
  const len = Math.hypot(normal.x, normal.y);
  if (len < 0.999 || len > 1.001) {
    throw new Error(
      `boundSurfaceChargeDensity: normal must be a unit vector (|n̂| = ${len.toFixed(4)}).`,
    );
  }
  return p.x * normal.x + p.y * normal.y;
}

/**
 * Bound volume charge density from the divergence of P:
 *
 *   ρ_b = −∇·P
 *
 * Caller supplies the divergence ∂Px/∂x + ∂Py/∂y already computed (the
 * physics module stays away from numerical differentiation). For a
 * uniformly polarized region ∇·P = 0 and there is no bound volume
 * charge — all the bound charge lives on the surface.
 */
export function boundVolumeChargeDensity(divP: number): number {
  return -divP;
}

/**
 * Idealized atomic dipole alignment under an external field, in two
 * dimensions. Each atom is modelled as a single rotatable dipole of
 * fixed magnitude `p0` (C·m). At equilibrium the dipole points along
 * the local field; before equilibrium it sits at some angle θ₀ to it.
 *
 * Returns the alignment fraction, defined as the cosine of the angle
 * between the dipole and the field — which is what you'd measure if you
 * averaged the projection of many dipoles onto the field direction.
 *
 *   alignment = cos(θ)   ∈ [−1, 1]
 *
 * 1 = perfectly aligned (saturated polarization), 0 = random (no net
 * polarization), −1 = anti-aligned (e.g. a switched ferroelectric just
 * before it flips back).
 */
export function dipoleAlignment(angleRadians: number): number {
  return Math.cos(angleRadians);
}

/**
 * Bound surface charge on the two faces of a uniformly polarized slab
 * of thickness `d`, when P points along the slab's symmetry axis with
 * magnitude `pMag`.
 *
 * Returns { positiveFace, negativeFace } so the caller can read off the
 * sign per face directly. The positive face is the one P leaves; the
 * negative face is the one P enters.
 *
 *   σ_+ = +P,  σ_− = −P
 *
 * Note `d` does not enter the answer — bound surface density is set by
 * the polarization itself, not by how thick the slab is. The thickness
 * matters only when you sum the equivalent dipole moment per area.
 */
export function uniformSlabBoundCharges(pMag: number, d: number): {
  positiveFace: number;
  negativeFace: number;
  totalDipoleMomentPerArea: number;
} {
  if (d <= 0) {
    throw new Error(
      `uniformSlabBoundCharges: thickness d must be positive (got ${d}).`,
    );
  }
  return {
    positiveFace: pMag,
    negativeFace: -pMag,
    totalDipoleMomentPerArea: pMag * d,
  };
}

/**
 * The depolarizing field inside a uniformly polarized infinite slab,
 * with P perpendicular to the faces. The two bound surfaces act like a
 * parallel-plate capacitor with surface charges +P and −P, producing a
 * uniform interior field that opposes P:
 *
 *   E_dep = −P / ε₀         (vector, antiparallel to P)
 *   |E_dep| = P / ε₀        (magnitude)
 *
 * This is why a dielectric slab between capacitor plates "screens" part
 * of the applied field — the bound charges produce E_dep that subtracts
 * from the external field to leave a smaller net E inside.
 */
export function depolarizingFieldInSlab(pMag: number): number {
  return pMag / EPSILON_0;
}
