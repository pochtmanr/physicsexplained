/**
 * The Lorentz force and friends.
 *
 * Canonical 3D vector type for the electromagnetism branch lives here:
 * other §03 topics (biot-savart, vector-potential, magnetic-dipole) import
 * `Vec3` from this module so the type is defined exactly once.
 */

/** A 3D vector in Cartesian coordinates. SI units throughout the EM branch. */
export interface Vec3 {
  x: number;
  y: number;
  z: number;
}

/** Vector cross product, a × b. Right-handed: x̂ × ŷ = ẑ. */
export function cross(a: Vec3, b: Vec3): Vec3 {
  return {
    x: a.y * b.z - a.z * b.y,
    y: a.z * b.x - a.x * b.z,
    z: a.x * b.y - a.y * b.x,
  };
}

/**
 * Lorentz force on a charge q with velocity v in fields E and B.
 *
 *   F = q (E + v × B)
 *
 * SI units: q in C, v in m/s, E in V/m, B in T → F in N.
 */
export function lorentzForce(q: number, v: Vec3, E: Vec3, B: Vec3): Vec3 {
  const vCrossB = cross(v, B);
  return {
    x: q * (E.x + vCrossB.x),
    y: q * (E.y + vCrossB.y),
    z: q * (E.z + vCrossB.z),
  };
}

/**
 * Cyclotron radius (Larmor radius) of a charged particle moving perpendicular
 * to a uniform magnetic field.
 *
 *   r = m · v⊥ / (|q| · B)
 *
 * Larger speed means a wider circle; stronger field means a tighter one.
 * Sign of q does not matter for the radius — only for the sense of rotation.
 */
export function cyclotronRadius(
  m: number,
  v_perp: number,
  q: number,
  B: number,
): number {
  return (m * v_perp) / (Math.abs(q) * B);
}

/**
 * Cyclotron angular frequency, in rad/s.
 *
 *   ω = |q| · B / m
 *
 * The famous result: ω is independent of the particle's speed, so the
 * orbital period T = 2π/ω is the same for slow and fast particles. That
 * is what makes the cyclotron work — the accelerating voltage can be flipped
 * at one fixed frequency and stay in step with every orbit, no matter how
 * energetic the particle has become.
 */
export function cyclotronFrequency(q: number, B: number, m: number): number {
  return (Math.abs(q) * B) / m;
}
