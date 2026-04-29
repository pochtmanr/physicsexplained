/**
 * §03.4 FOUR-VECTORS AND PROPER TIME — pure-TS helpers.
 *
 * The honest-moment apex of §03. The §02 algebra — time dilation, length
 * contraction, velocity-addition, Doppler shift — was always a single fact
 * about how four-vectors transform under Lorentz boosts in 4D pseudo-Euclidean
 * spacetime. This module ships the two cleanest realisations of that fact:
 *
 *   • the four-velocity u^μ = γ(c, v_x, v_y, v_z) — every observer's tangent
 *     vector along their own worldline, normalised so that u^μ u_μ = c² for
 *     all observers in all frames. The geometric statement of "everyone moves
 *     through spacetime at c."
 *
 *   • proper time τ — the parameter a clock carried along the worldline
 *     accumulates, related to lab time by dτ = dt/γ. Integrate it along a
 *     worldline of arbitrary shape and you recover the §02.1 time-dilation
 *     formula as a special case (constant β), the §03.5 twin-paradox result
 *     as another (broken-geodesic), and any GR-style proper-time integral as
 *     the same construction with a non-Minkowski metric.
 *
 * The four-vector formalism shows up across every relativistic theory:
 * the four-potential A^μ in EM (§11.5), the four-current J^μ, the
 * four-momentum p^μ in §04.1, the four-force F^μ in §04.4. They all inherit
 * the Lorentz-transformation rule from the prototype (ct, x, y, z) and they
 * all satisfy the same kind of invariant: their Minkowski norm is the same
 * in every inertial frame. The algebra was the geometry all along.
 */

import { SPEED_OF_LIGHT } from "@/lib/physics/constants";
import { gamma, minkowskiNormSquared } from "./types";
import type { Vec4, MinkowskiPoint } from "./types";

/**
 * Four-velocity u^μ = γ(c, v_x, v_y, v_z) for a particle moving with
 * 3-velocity v in the lab frame.
 *
 * The defining property is its Minkowski norm:
 *
 *     u^μ u_μ = γ²(c² − |v|²) = γ² c² (1 − β²) = c²
 *
 * which holds for every observer in every inertial frame. That is the
 * geometric statement of "everyone moves through spacetime at c": the
 * length of every observer's tangent vector along their own worldline
 * is c, regardless of how fast they appear to be moving in space.
 *
 * Throws via {@link gamma} if |v|/c ≥ 1 (massless particles do not have a
 * well-defined four-velocity in this normalisation; use a four-momentum
 * instead — see {@link FourMomentum} in `./types`).
 */
export function fourVelocity(
  v: { x: number; y: number; z: number },
  c: number = SPEED_OF_LIGHT,
): Vec4 {
  const vMag = Math.sqrt(v.x * v.x + v.y * v.y + v.z * v.z);
  const beta = vMag / c;
  const g = gamma(beta);
  return [g * c, g * v.x, g * v.y, g * v.z] as const;
}

/**
 * Re-export so callers that import the four-vector module get the
 * Minkowski norm-squared without a second import. Single source of
 * truth lives in `./types`.
 */
export { minkowskiNormSquared };

/**
 * Proper-time elapsed along a worldline by trapezoidal integration of
 * dτ = dt · √(1 − β²). Worldline events must be ordered by lab time t.
 * The local 3-velocity in each segment is computed from successive event
 * pairs as |Δr|/Δt; segments with non-positive Δt are skipped (degenerate),
 * and segments at or above β = 1 are also skipped (they correspond to
 * lightlike or unphysical motion, not a clock's worldline).
 *
 * For a stationary worldline, |Δr| = 0 in every segment, so β = 0, the
 * integrand is 1, and τ = total lab time. For a uniform-velocity worldline,
 * β is constant and τ = lab_time / γ — the §02.1 time-dilation result,
 * recovered as a special case of the geometric integral.
 *
 * The integral is the §03 reformulation of "the moving clock ticks slow":
 * a clock measures the proper time along its own worldline, and proper
 * time is a Lorentz-invariant geometric length. Two worldlines connecting
 * the same pair of events accumulate, in general, different amounts of
 * proper time — and §03.5 cashes this as the twin paradox.
 */
export function properTimeAlongWorldline(
  events: readonly MinkowskiPoint[],
  c: number = SPEED_OF_LIGHT,
): number {
  if (events.length < 2) return 0;
  let tau = 0;
  for (let i = 1; i < events.length; i++) {
    const a = events[i - 1];
    const b = events[i];
    const dt = b.t - a.t;
    if (dt <= 0) continue;
    const dx = b.x - a.x;
    const dy = b.y - a.y;
    const dz = b.z - a.z;
    const beta = Math.sqrt(dx * dx + dy * dy + dz * dz) / (c * dt);
    if (beta >= 1) continue;
    const oneOverGamma = Math.sqrt(1 - beta * beta);
    tau += dt * oneOverGamma;
  }
  return tau;
}

/**
 * Rapidity η associated with the speed βc. Defined by tanh(η) = β, so
 *
 *     η = atanh(β) = (1/2) ln((1 + β)/(1 − β))
 *
 * Rapidity is the additive parameter for collinear Lorentz boosts: where
 * velocities compose by the relativistic velocity-addition formula
 * (non-additive), rapidities simply add. Geometrically a Lorentz boost
 * along x is a hyperbolic rotation by angle η in the (ct, x) plane —
 * the algebra of §02.3 written as one geometric verb. The §03.4 scene
 * uses rapidity as the natural slider parameter for the algebra-becomes-
 * geometry collapse: as η increases linearly, the four-velocity vector
 * sweeps the upper hyperbola u^μ u_μ = c², and the §02 algebra columns
 * (γ, β, time-dilation, length-contraction, velocity-addition, Doppler)
 * each light up as monotonic functions of the same η.
 */
export function rapidityFromBeta(beta: number): number {
  if (Math.abs(beta) >= 1) {
    throw new RangeError(`rapidityFromBeta: |β| must be < 1 (got ${beta})`);
  }
  return Math.atanh(beta);
}

/**
 * Inverse of {@link rapidityFromBeta}: β = tanh(η). Always returns a value
 * strictly inside (−1, 1), so γ is finite for every finite rapidity. The
 * |β| → 1 limit is η → ±∞ — light is the asymptote, never reached by
 * matter at finite proper acceleration.
 */
export function betaFromRapidity(eta: number): number {
  return Math.tanh(eta);
}
