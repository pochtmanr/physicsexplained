import { MU_0 } from "@/lib/physics/constants";
import { cross, type Vec3 } from "@/lib/physics/electromagnetism/lorentz";

const FOUR_PI = 4 * Math.PI;
const TWO_PI = 2 * Math.PI;

/**
 * Biot–Savart contribution from a single current element.
 *
 *     dB = μ₀ I / (4π) · (dl × r̂) / r²
 *
 * `dl` is the directed length of the wire segment (metres, in the direction
 * of conventional current); `r` is the displacement from the element to the
 * field point (metres). Returns the magnetic-field contribution dB in tesla.
 *
 * If r = 0 (field point sits on the element) we return a zero vector — the
 * formula has a singularity there and any finite answer would be a lie.
 */
export function biotSavartElement(I: number, dl: Vec3, r: Vec3): Vec3 {
  const r2 = r.x * r.x + r.y * r.y + r.z * r.z;
  if (r2 === 0) return { x: 0, y: 0, z: 0 };
  const rMag = Math.sqrt(r2);
  // dB = (μ₀ I / 4π) · (dl × r) / r³  (folding 1/r̂ × 1/r² into one r³)
  const k = (MU_0 * I) / (FOUR_PI * r2 * rMag);
  const c = cross(dl, r);
  return { x: k * c.x, y: k * c.y, z: k * c.z };
}

/**
 * Magnetic-field magnitude a perpendicular distance `d` from an infinitely
 * long straight wire carrying current `I`.
 *
 *     B = μ₀ I / (2π d)
 *
 * The 1/d falloff is the magnetic analogue of the 1/r² electric field
 * collapsed by integrating along the wire. Field lines are circles around
 * the wire; right-hand rule gives the sense.
 */
export function straightWireField(I: number, distance: number): number {
  if (distance <= 0) return Infinity;
  return (MU_0 * I) / (TWO_PI * distance);
}

/**
 * Magnetic-field magnitude on the symmetry axis of a circular current loop.
 *
 *     B(z) = μ₀ I R² / [2 (R² + z²)^(3/2)]
 *
 * `R` is the loop radius (metres); `z` is the distance along the axis from
 * the loop's centre. Peaks at z = 0 with B₀ = μ₀ I / (2R) and falls as
 * μ₀ I R² / (2 z³) for z ≫ R — the on-axis dipole tail.
 */
export function loopAxisField(I: number, R: number, z: number): number {
  if (R <= 0) return 0;
  const denom = 2 * Math.pow(R * R + z * z, 1.5);
  return (MU_0 * I * R * R) / denom;
}

/**
 * Magnetic-field magnitude a perpendicular distance `d` from a finite straight
 * segment carrying current `I`. The segment subtends angles θ₁ and θ₂ at the
 * field point, measured from the perpendicular foot to the two endpoints
 * (with the same sign convention used by Griffiths).
 *
 *     B = μ₀ I (sin θ₂ − sin θ₁) / (4π d)
 *
 * In the limit θ₁ → −π/2, θ₂ → +π/2 this collapses to the long-wire formula
 * μ₀ I / (2π d). The unit test below pins that limit.
 */
export function finiteSegmentField(
  I: number,
  d: number,
  theta1: number,
  theta2: number,
): number {
  if (d <= 0) return Infinity;
  return (MU_0 * I * (Math.sin(theta2) - Math.sin(theta1))) / (FOUR_PI * d);
}
