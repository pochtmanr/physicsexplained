/**
 * Relativistic velocity addition — §02.4.
 *
 * Galilean kinematics adds velocities by simple sum:
 *
 *     u_lab = u_frame + v_frame                 (Galilean — works only for v ≪ c)
 *
 * Special relativity replaces that with
 *
 *     u_lab = (u' + v) / (1 + u' v / c²)        (Einstein, 1905)
 *
 * Three properties make this the velocity-cap of the universe:
 *
 *   1. **Galilean limit.** For |u'|, |v| ≪ c the denominator → 1, and the
 *      formula collapses back to u' + v. Everyday boats, cars, and bullets
 *      see no relativistic correction at any precision we have ever bothered
 *      to measure (~10⁻¹⁶ for car speeds).
 *
 *   2. **The hard ceiling.** Plug u' = c (light, in any frame). The
 *      numerator is c + v; the denominator is 1 + v/c = (c + v)/c. The
 *      ratio is exactly c. Light, uniquely, refuses to add — its speed is
 *      the same in every inertial frame, which is exactly what Einstein's
 *      second postulate required, and what the Michelson-Morley null
 *      result already demanded eighteen years before he wrote it down.
 *
 *   3. **No velocity ever exceeds c.** Two sub-luminal velocities, however
 *      close to c, give a result still strictly less than c. The argument:
 *      take u' = c − ε₁ and v = c − ε₂ with ε₁, ε₂ > 0; expand the formula
 *      and the numerator is 2c − (ε₁ + ε₂), the denominator is
 *      2 − (ε₁ + ε₂)/c + ε₁ ε₂ / c². Algebra confirms the ratio is < c.
 *      The §02.4 scenes verify this numerically across the slider range.
 *
 * The historical hint that classical addition was already wrong sat on
 * the lab bench fifty-four years before special relativity. <Hippolyte
 * Fizeau> in 1851 measured the speed of light in moving water and got a
 * partial-dragging coefficient that classical addition could not produce.
 * The coefficient he extracted is exactly the v/c-order term of the
 * relativistic formula:
 *
 *     u_observed = c/n + v · (1 − 1/n²) + O(v²/c)
 *
 * For water, n = 1.33, the drag coefficient is 1 − 1/n² ≈ 0.434. Fizeau
 * measured ≈ 0.43. Lorentz wrote down the algebra in 1895; Einstein
 * reinterpreted it as kinematics in 1905; the Fizeau number sat in the
 * Annales de Chimie waiting the entire time.
 *
 * Pure-TS module (no React). Consumed by the three §02.4 scenes and the
 * page tests under tests/physics/relativity/velocity-addition.test.ts.
 */

import { SPEED_OF_LIGHT } from "@/lib/physics/constants";

/**
 * Relativistic velocity addition, longitudinal (collinear) case.
 *
 *     u_lab = (uPrime + v) / (1 + uPrime · v / c²)
 *
 * `uPrime` is the velocity of the object in the moving frame; `v` is the
 * velocity of that frame relative to the lab; `c` is the speed of light
 * in vacuum. All in m/s, all collinear (positive = same direction).
 *
 * The formula is symmetric in (uPrime, v) — composing a +0.6c boost with
 * a +0.6c motion-in-frame yields the same answer as the reverse. That's
 * the relativistic-velocities-form-a-group property §02.3 builds on.
 *
 * Throws if either input has |·| > c (super-luminal inputs are
 * unphysical and produce a result that is itself > c, which is
 * misleading for the caller). Equality with c is allowed and returns c.
 *
 * @param uPrime Velocity of object in moving frame (m/s).
 * @param v      Velocity of moving frame in lab (m/s).
 * @param c      Speed of light in vacuum (m/s). Defaults to SI value.
 */
export function relativisticVelocityAdd(
  uPrime: number,
  v: number,
  c: number = SPEED_OF_LIGHT,
): number {
  if (c <= 0) {
    throw new RangeError(
      `relativisticVelocityAdd: c must be positive (got ${c})`,
    );
  }
  if (Math.abs(uPrime) > c) {
    throw new RangeError(
      `relativisticVelocityAdd: |uPrime| must not exceed c (got ${uPrime} vs c=${c})`,
    );
  }
  if (Math.abs(v) > c) {
    throw new RangeError(
      `relativisticVelocityAdd: |v| must not exceed c (got ${v} vs c=${c})`,
    );
  }
  return (uPrime + v) / (1 + (uPrime * v) / (c * c));
}

/**
 * Inverse of {@link relativisticVelocityAdd}: given the lab-frame velocity
 * u and the frame velocity v, recover the in-frame velocity u'.
 *
 *     u' = (u − v) / (1 − u v / c²)
 *
 * This is just the same formula with v → −v, exhibiting the "subtraction"
 * direction of the same Lorentz-velocity group law.
 */
export function relativisticVelocitySubtract(
  u: number,
  v: number,
  c: number = SPEED_OF_LIGHT,
): number {
  return relativisticVelocityAdd(u, -v, c);
}

/**
 * Galilean velocity addition for side-by-side comparison.
 *
 *     u_classical = uPrime + v
 *
 * Defined here (rather than re-imported from `./galilean`) so the §02.4
 * scenes can plot the two-curves-diverge-at-relativistic-speed view
 * without round-tripping through another module. Numerically identical
 * to galileanVelocityAdd; the duplication is by design.
 */
export function galileanLimit(uPrime: number, v: number): number {
  return uPrime + v;
}

/**
 * The Fresnel partial-dragging coefficient: the fraction of the medium's
 * velocity that the light beam picks up.
 *
 *     η(n) = 1 − 1 / n²
 *
 * Fresnel proposed this in 1818 as a phenomenological dragging law for
 * the (then-presumed-real) luminiferous aether. Fizeau verified it in
 * 1851 by interferometry on a moving water tube. From a relativistic
 * standpoint the coefficient is no longer ad-hoc: it falls out of the
 * Lorentz velocity-addition formula at first order in v/c (see
 * {@link partialDraggingFizeau}).
 *
 * For water (n ≈ 1.33), η ≈ 0.434 — the value Fizeau measured.
 * For glass (n ≈ 1.5), η ≈ 0.556. For vacuum (n = 1), η = 0 — light
 * does not drag at all, by definition.
 */
export function fresnelDragCoefficient(nIndex: number): number {
  if (nIndex <= 0) {
    throw new RangeError(
      `fresnelDragCoefficient: nIndex must be positive (got ${nIndex})`,
    );
  }
  return 1 - 1 / (nIndex * nIndex);
}

/**
 * Speed of light in a moving medium of refractive index `nIndex`, water
 * speed `vWater` (m/s), via the relativistic velocity-addition formula.
 *
 *     u' = c / n  (light's speed in the rest frame of the water)
 *     u  = (u' + v_water) / (1 + u' v_water / c²)
 *
 * For v_water ≪ c (Fizeau's apparatus had v ~ 7 m/s — eight orders of
 * magnitude below c), expanding the denominator gives
 *
 *     u ≈ c/n + v_water · (1 − 1/n²) + O(v_water²/c)
 *
 * which is exactly the Fresnel partial-dragging law. The drag coefficient
 * `1 − 1/n²` is *not* a property of the medium dragging the aether — it
 * is what the kinematic addition formula produces. Fizeau measured it
 * fifty-four years before Einstein wrote down the formula that produces
 * it. The Lorentz contraction was already there.
 *
 * @param nIndex Refractive index of the medium (water ≈ 1.33).
 * @param vWater Velocity of the medium relative to the lab (m/s).
 * @param c      Speed of light in vacuum (m/s). Defaults to SI value.
 */
export function partialDraggingFizeau(
  nIndex: number,
  vWater: number,
  c: number = SPEED_OF_LIGHT,
): number {
  if (nIndex <= 0) {
    throw new RangeError(
      `partialDraggingFizeau: nIndex must be positive (got ${nIndex})`,
    );
  }
  return relativisticVelocityAdd(c / nIndex, vWater, c);
}

/**
 * The first-order (Fresnel) approximation to {@link partialDraggingFizeau}.
 *
 *     u_observed ≈ c/n + v_water · (1 − 1/n²)
 *
 * Useful for the §02.4 scene that overlays the linearised Fresnel
 * prediction against the full relativistic curve. At Fizeau's water
 * speeds (~7 m/s) the two are indistinguishable to ~10⁻¹⁶; the scene's
 * slider lets the reader push v_water up into the relativistic regime
 * to see the curves separate.
 */
export function fresnelLinearApproximation(
  nIndex: number,
  vWater: number,
  c: number = SPEED_OF_LIGHT,
): number {
  return c / nIndex + vWater * fresnelDragCoefficient(nIndex);
}

/**
 * Two-rocket scenario helper. Earth observer sees Rocket A at velocity
 * `vRocketA`. Rocket A then fires Rocket B at velocity `vRocketB_inA` in
 * its own frame. Returns the Earth-observed velocity of Rocket B.
 *
 * Earth: vRocketA = 0.6 c, B fired at uPrime = 0.6 c. Galilean would say
 * 1.2 c. Relativistic says (0.6 + 0.6) / (1 + 0.36) c = 1.2/1.36 c
 * ≈ 0.882 c. Always sub-luminal. The §02.4 scene plots both predictions.
 */
export function twoRocketEarthFrameVelocity(
  vRocketA: number,
  vRocketB_inA: number,
  c: number = SPEED_OF_LIGHT,
): number {
  return relativisticVelocityAdd(vRocketB_inA, vRocketA, c);
}

/**
 * Refractive index of water at 20 °C, sodium-D wavelength. The 1851
 * Fizeau experiment used n ≈ 1.33.
 */
export const REFRACTIVE_INDEX_WATER = 1.33;

/**
 * Refractive index of crown glass at sodium-D. Used as the second
 * preset in the Fizeau scene.
 */
export const REFRACTIVE_INDEX_GLASS = 1.5;

/**
 * Approximate water speed Fizeau achieved in 1851 (m/s). The water was
 * pumped through 1.5-metre tubes at this rate; the round-trip optical
 * path was 3 m, the fringe-shift signal was about 0.46 fringes, in
 * agreement with the Fresnel coefficient to 1% — fifty-four years
 * before special relativity wrote down the formula that produces it.
 */
export const FIZEAU_1851_WATER_SPEED = 7.06;
