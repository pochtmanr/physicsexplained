/**
 * Magnetic dipoles (FIG.16).
 *
 * A current loop is the magnetic analogue of an electric dipole. Run a
 * steady current `I` around a flat loop of area `A` and you get a vector
 * called the **magnetic moment**:
 *
 *   m = I · A · n̂           (units: A·m²)
 *
 * where n̂ is the right-hand-rule normal to the loop. Curl the fingers of
 * your right hand in the direction the current flows; the thumb points
 * along m.
 *
 * Drop that loop into an external magnetic field B and two things happen.
 * First, the field exerts a torque that tries to swing the loop until m
 * aligns with B:
 *
 *   τ = m × B               (vector form)
 *   |τ| = m · B · sin θ     (scalar form, θ = angle between m and B)
 *
 * Second, the orientation costs energy:
 *
 *   U = −m · B
 *
 * Aligned (θ = 0) is the bottom of the bowl; anti-aligned (θ = π) is the
 * top. The loop *wants* to find θ = 0, and the torque is what pushes it
 * there. This is what makes a compass needle point north.
 *
 * Far from the loop, the magnetic field looks identical to the electric
 * field of a tiny electric dipole, with the substitutions E → B,
 * 1/(4πε₀) → μ₀/(4π). On the loop's symmetry axis at distance z,
 *
 *   B_axis = (μ₀ / 4π) · 2m / z³
 *
 * On the equatorial plane (perpendicular to m) at distance r,
 *
 *   B_eq   = (μ₀ / 4π) · m / r³
 *
 * The on-axis field is exactly twice the equatorial field at the same
 * distance — a clean factor-of-two test that this is the dipole pattern.
 *
 * This module exports scalar forms of these relations for the topic's
 * prose and visualizations. The full vector field of a dipole at an
 * arbitrary off-axis point lives one calculus level deeper than the
 * scenes need.
 */

import { MU_0 } from "@/lib/physics/constants";

const MU0_OVER_4PI = MU_0 / (4 * Math.PI);

/**
 * Magnetic moment of a planar current loop:
 *
 *   m = I · A
 *
 * @param I  current circulating around the loop, A
 * @param A  area enclosed by the loop, m²
 * @returns magnetic moment magnitude, A·m²
 */
export function magneticMoment(I: number, A: number): number {
  if (A < 0) {
    throw new Error(
      `magneticMoment: area A must be ≥ 0 (got ${A}).`,
    );
  }
  return I * A;
}

/**
 * Torque magnitude on a magnetic dipole `m` in a uniform field `B`,
 * where θ is the angle between m and B:
 *
 *   |τ| = m · B · sin θ
 *
 * Vanishes at θ = 0 (aligned) and θ = π (anti-aligned); maximum at
 * θ = π/2 (perpendicular). The direction of τ is m × B — i.e. the loop
 * rotates so that m swings toward B.
 *
 * @param m       magnetic moment magnitude, A·m²
 * @param B       external field magnitude, T
 * @param theta   angle between m and B, radians
 * @returns torque magnitude, N·m
 */
export function dipoleTorque(m: number, B: number, theta: number): number {
  return m * B * Math.sin(theta);
}

/**
 * Potential energy of a magnetic dipole `m` in a uniform field `B`,
 * where θ is the angle between m and B:
 *
 *   U = −m · B = −m · B · cos θ
 *
 * Minimum at θ = 0 (aligned, U = −m·B); maximum at θ = π (anti-aligned,
 * U = +m·B); zero at θ = π/2. The torque τ is the negative slope of
 * U(θ), so the loop is always pushed toward smaller energy.
 *
 * @param m       magnetic moment magnitude, A·m²
 * @param B       external field magnitude, T
 * @param theta   angle between m and B, radians
 * @returns potential energy, J
 */
export function dipoleEnergy(m: number, B: number, theta: number): number {
  return -m * B * Math.cos(theta);
}

/**
 * Magnetic field on the axis of a dipole, at distance `z` from its
 * centre. The dipole sits at the origin with m along the axis, and z is
 * measured along that same axis:
 *
 *   B_axis(z) = (μ₀ / 4π) · 2m / z³
 *
 * Diverges as z → 0, where the dipole approximation itself breaks down.
 *
 * @param m  magnetic moment magnitude, A·m²
 * @param z  distance along the dipole axis, m (must be > 0)
 * @returns axial field magnitude, T
 */
export function dipoleFieldOnAxis(m: number, z: number): number {
  if (z <= 0) {
    throw new Error(
      `dipoleFieldOnAxis: distance z must be > 0 (got ${z}).`,
    );
  }
  return MU0_OVER_4PI * (2 * m) / (z * z * z);
}

/**
 * Magnetic field on the equatorial plane of a dipole, at distance `r`
 * from its centre. The dipole sits at the origin with m along its axis,
 * and r is measured perpendicular to that axis:
 *
 *   B_eq(r) = (μ₀ / 4π) · m / r³
 *
 * Exactly half the on-axis value at the same distance — the canonical
 * dipole-pattern signature.
 *
 * @param m  magnetic moment magnitude, A·m²
 * @param r  distance in the equatorial plane, m (must be > 0)
 * @returns equatorial field magnitude, T
 */
export function dipoleFieldEquatorial(m: number, r: number): number {
  if (r <= 0) {
    throw new Error(
      `dipoleFieldEquatorial: distance r must be > 0 (got ${r}).`,
    );
  }
  return MU0_OVER_4PI * m / (r * r * r);
}
