/**
 * §04.3 RELATIVISTIC COLLISIONS — pure-TS helpers.
 *
 * Conservation of total four-momentum at every interaction vertex is the
 * single content of this topic. From it follow:
 *
 *   • elastic 1D scattering — total p^μ in equals total p^μ out, AND each
 *     particle's invariant m²c² = p^μ p_μ is preserved (rest masses don't
 *     change), so kinetic energy is also conserved (the elastic case is
 *     "Newtonian + γ corrections").
 *
 *   • inelastic merger — total p^μ is still conserved, but the individual
 *     rest masses are NOT. Two particles of mass m colliding head-on at
 *     equal-and-opposite β each merge into one particle whose rest mass is
 *     2γm > 2m. Kinetic energy converted to rest mass. The conservation of
 *     four-momentum AND the non-conservation of rest mass are simultaneously
 *     true: rest mass is a Lorentz scalar of each particle, not a conserved
 *     quantity across reactions.
 *
 *   • 2D scattering — the same conservation, applied to 4-vectors with
 *     non-trivial spatial components, fixes the outgoing-particle angles
 *     given the incoming kinematics. The result diverges visibly from the
 *     Newtonian "elastic billiard ball" answer once the projectile β is
 *     non-negligible.
 *
 * Convention: mostly-minus metric (+,−,−,−), Griffiths convention. SI units
 * unless an optional `c` argument overrides.
 */

import { SPEED_OF_LIGHT } from "@/lib/physics/constants";
import { fourMomentum, minkowskiNormSquared } from "./four-momentum";
import type { FourMomentum } from "./types";

/**
 * Sum of an array of four-momenta — used to check conservation at a vertex.
 *
 * In a relativistic interaction the conserved quantity is the *total*
 * four-momentum, not the individual ones. Compute Σ p^μ_in and Σ p^μ_out
 * separately, then compare componentwise via {@link fourMomentaEqual}.
 */
export function totalFourMomentum(
  ps: readonly FourMomentum[],
): FourMomentum {
  let s0 = 0;
  let s1 = 0;
  let s2 = 0;
  let s3 = 0;
  for (const p of ps) {
    s0 += p[0];
    s1 += p[1];
    s2 += p[2];
    s3 += p[3];
  }
  return [s0, s1, s2, s3] as const;
}

/**
 * Whether two four-momentum 4-vectors are componentwise equal to within
 * `eps`. Numerical conservation checks should use this rather than triple-
 * equals comparisons because the underlying algebra goes through γ, square
 * roots, and trig functions that introduce float noise at the 10⁻¹⁵ level.
 */
export function fourMomentaEqual(
  a: FourMomentum,
  b: FourMomentum,
  eps = 1e-9,
): boolean {
  return (
    Math.abs(a[0] - b[0]) < eps &&
    Math.abs(a[1] - b[1]) < eps &&
    Math.abs(a[2] - b[2]) < eps &&
    Math.abs(a[3] - b[3]) < eps
  );
}

/**
 * Final rest mass of an inelastic merger: two particles of rest masses
 * m1, m2 collide head-on along ±x with velocities β1·c, β2·c (signed; use
 * +β for one and −β for the head-on partner) and merge into a single
 * particle.
 *
 * Conservation of four-momentum gives p_final = p1 + p2; the rest mass of
 * the merged particle then comes from the Lorentz-invariant
 *
 *     m_final²c² = (p^0_total)² − |p_total|²       (mostly-minus signature)
 *
 * For two equal-mass particles m colliding head-on at β1 = +β, β2 = −β,
 * the spatial momenta cancel and m_final = 2γ(β)·m > 2m. The "missing"
 * 2(γ−1)m of rest mass came from kinetic energy: a relativistic merger
 * weighs more than the sum of its inputs. (At β ≪ 1 the γ−1 factor is
 * (1/2)β² and the answer collapses back to the Newtonian m_final ≈ 2m
 * with a kinetic-energy correction of order β².)
 *
 * Throws if the resulting four-momentum is spacelike (m²c² < 0), which is
 * impossible for a sum of physical four-momenta and so signals a caller bug.
 */
export function inelasticMergerMass(
  m1: number,
  beta1: number,
  m2: number,
  beta2: number,
  c = SPEED_OF_LIGHT,
): number {
  const p1 = fourMomentum(m1, { x: beta1 * c, y: 0, z: 0 }, c);
  const p2 = fourMomentum(m2, { x: beta2 * c, y: 0, z: 0 }, c);
  const total = totalFourMomentum([p1, p2]);
  const m2c2 = minkowskiNormSquared(total);
  if (m2c2 < 0) {
    throw new RangeError(
      `inelasticMergerMass: spacelike total four-momentum (m²c² = ${m2c2} < 0)`,
    );
  }
  return Math.sqrt(m2c2) / c;
}
