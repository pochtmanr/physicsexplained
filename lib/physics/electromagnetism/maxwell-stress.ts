/**
 * Maxwell stress tensor, field momentum, and radiation pressure.
 *
 * The unifying insight of §07.5: electromagnetic fields carry **momentum**,
 * not just energy. The stress tensor T_ij books-keeps the flow of that
 * momentum through space so that the combined system (matter + field)
 * obeys Newton's third law. Radiation pressure on a solar sail, the kick
 * a laser gives a mirror, and the "hidden momentum" of a charge near a
 * magnetic dipole all fall out of the same few lines of algebra.
 */

import type { Vec3 } from "@/lib/physics/electromagnetism/lorentz";
import { EPSILON_0, MU_0, SPEED_OF_LIGHT } from "@/lib/physics/constants";

/**
 * Maxwell stress tensor component T_ij at a point where E and B are given.
 *
 *   T_ij = ε₀ (E_i E_j − ½ δ_ij E²) + (1/μ₀) (B_i B_j − ½ δ_ij B²)
 *
 * Units: N/m² (force per unit area, i.e. pressure / shear).
 *
 * Diagonal components T_ii give the normal stress along direction i
 * (pressure if negative-signed on an outward normal, tension if positive).
 * Off-diagonal components T_ij (i ≠ j) give the shear — the j-component of
 * momentum flowing through a surface whose normal is î.
 *
 * Indices: i, j ∈ {0, 1, 2} for x, y, z.
 */
export function stressTensor(
  E: Vec3,
  B: Vec3,
  i: 0 | 1 | 2,
  j: 0 | 1 | 2,
): number {
  const e = [E.x, E.y, E.z] as const;
  const b = [B.x, B.y, B.z] as const;
  const E2 = e[0] * e[0] + e[1] * e[1] + e[2] * e[2];
  const B2 = b[0] * b[0] + b[1] * b[1] + b[2] * b[2];
  const delta = i === j ? 1 : 0;
  return (
    EPSILON_0 * (e[i] * e[j] - 0.5 * delta * E2) +
    (1 / MU_0) * (b[i] * b[j] - 0.5 * delta * B2)
  );
}

/**
 * Full 3×3 stress tensor at a point. Returns a row-major matrix.
 * Convenience wrapper around `stressTensor` — useful for visualization
 * scenes that want every component at once.
 */
export function stressTensorMatrix(E: Vec3, B: Vec3): number[][] {
  const indices: (0 | 1 | 2)[] = [0, 1, 2];
  return indices.map((i) => indices.map((j) => stressTensor(E, B, i, j)));
}

/**
 * Trace of the Maxwell stress tensor.
 *
 *   Tr(T) = Σᵢ T_ii = ε₀(E² − 3/2 E²) + (1/μ₀)(B² − 3/2 B²)
 *         = −½ ε₀ E² − ½ (1/μ₀) B²
 *         = −(u_E + u_B)
 *
 * The trace is minus the total electromagnetic energy density. For a plane
 * wave in vacuum where u_E = u_B, the trace does NOT vanish — it equals
 * minus the full energy density. (What does vanish for a plane wave is
 * T_ii along the propagation direction balanced against the transverse
 * components — see the per-component scene.)
 */
export function stressTensorTrace(E: Vec3, B: Vec3): number {
  return (
    stressTensor(E, B, 0, 0) +
    stressTensor(E, B, 1, 1) +
    stressTensor(E, B, 2, 2)
  );
}

/**
 * Field momentum density g = ε₀ · (E × B).
 *
 * Related to the Poynting vector S = (1/μ₀)(E × B) by g = S / c².
 * Units: kg/(m²·s) — momentum per unit volume. The direction of g is the
 * direction momentum flows, which for a plane wave is the direction of
 * propagation.
 */
export function fieldMomentumDensity(E: Vec3, B: Vec3): Vec3 {
  return {
    x: EPSILON_0 * (E.y * B.z - E.z * B.y),
    y: EPSILON_0 * (E.z * B.x - E.x * B.z),
    z: EPSILON_0 * (E.x * B.y - E.y * B.x),
  };
}

/**
 * Poynting vector S = (1/μ₀) · (E × B).
 *
 * Direction of electromagnetic energy flow. Re-exported here so callers
 * of the stress-tensor module can obtain S alongside g without reaching
 * into the poynting-vector module — the scenes in this topic render both.
 */
export function poyntingVector(E: Vec3, B: Vec3): Vec3 {
  return {
    x: (E.y * B.z - E.z * B.y) / MU_0,
    y: (E.z * B.x - E.x * B.z) / MU_0,
    z: (E.x * B.y - E.y * B.x) / MU_0,
  };
}

/**
 * Radiation pressure on a perfect absorber illuminated by a plane-wave
 * intensity I (W/m²) at normal incidence.
 *
 *   P = I / c
 *
 * A perfect absorber soaks up all of the incident momentum flux. Sunlight
 * at Earth orbit has I ≈ 1361 W/m², giving P ≈ 4.54 µPa on a black sheet.
 */
export function radiationPressureAbsorber(intensity: number): number {
  return intensity / SPEED_OF_LIGHT;
}

/**
 * Radiation pressure on a perfect reflector at normal incidence.
 *
 *   P = 2 I / c
 *
 * A mirror sends the photons back the way they came; conservation of
 * momentum doubles the push. Solar sails (IKAROS, LightSail) chase this
 * factor of 2 with highly reflective aluminized membranes.
 */
export function radiationPressureReflector(intensity: number): number {
  return 2 * radiationPressureAbsorber(intensity);
}

/**
 * Solar-sail acceleration at a given distance from the Sun for a sail of
 * mass m and area A with reflectivity ρ ∈ [0, 1].
 *
 *   a = (1 + ρ) · I(r) · A / (m · c)
 *
 * where I(r) = L_sun / (4π r²). Useful sanity check for IKAROS-class
 * probes: with m/A ≈ 10 g/m², ρ ≈ 0.9, at 1 AU, a ≈ 0.08 mm/s² — tiny,
 * but free and cumulative. At 0.3 AU it climbs to ≈ 1 mm/s².
 */
const SOLAR_LUMINOSITY = 3.828e26; // W — CODATA / IAU 2015
const AU_METRES = 1.495978707e11; // m

export function solarSailAcceleration(
  distanceAU: number,
  areaM2: number,
  massKg: number,
  reflectivity: number,
): number {
  const r = distanceAU * AU_METRES;
  const I = SOLAR_LUMINOSITY / (4 * Math.PI * r * r);
  return ((1 + reflectivity) * I * areaM2) / (massKg * SPEED_OF_LIGHT);
}

/**
 * Intensity of sunlight at 1 AU — the solar constant.
 * Convenience for scenes that key their readouts off "× the solar constant".
 */
export const SOLAR_CONSTANT = SOLAR_LUMINOSITY / (4 * Math.PI * AU_METRES * AU_METRES);

/**
 * Magnitude of a Vec3. Handy for scenes that need to compare |g| to |S|/c².
 */
export function magnitude(v: Vec3): number {
  return Math.sqrt(v.x * v.x + v.y * v.y + v.z * v.z);
}
