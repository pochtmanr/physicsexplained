/**
 * Polarization modes of a gravitational wave (FIG.51, §51).
 *
 * A weak plane gravitational wave travelling along +z, written in the
 * transverse-traceless (TT) gauge, has exactly two physical degrees of
 * freedom: the plus mode h₊ and the cross mode h×. They act in the
 * transverse (x, y) plane, leaving the propagation direction untouched.
 *
 * For a ring of free test masses lying in that transverse plane at rest
 * separation L, the proper distance between the centre and a mass at
 * angle θ oscillates as the wave passes. To first order in the strain
 * amplitude h ≪ 1, the displacement of each mass is a linear response to
 * the metric perturbation:
 *
 *   δr_x = ½ ( h₊ cosθ + h× sinθ ) L
 *   δr_y = ½ ( -h₊ sinθ + h× cosθ ) L
 *
 * where (h₊, h×) are the instantaneous strain amplitudes. The factor ½
 * comes from the geodesic-deviation equation: the fractional change in a
 * proper length is ½ h, not h.
 *
 * This file is React-free, pure, and typed. It is unique to the
 * polarization-modes topic — it does NOT import or modify any shared
 * physics module.
 */

/** The two physical polarization states, plus a circular combination. */
export type PolarizationMode = "plus" | "cross" | "circular";

/** A 2D point in the transverse plane, in metres. */
export interface Vec2 {
  x: number;
  y: number;
}

/**
 * Instantaneous strain amplitudes (h₊, h×) for a chosen mode at phase φ.
 *
 * - "plus":     h₊ = h·cos φ,  h× = 0
 * - "cross":    h₊ = 0,        h× = h·cos φ
 * - "circular": h₊ = h·cos φ,  h× = h·sin φ  (right-handed rotation of the
 *               ellipse; the deformation pattern rotates rather than
 *               pulsing in place)
 *
 * @param mode  polarization state
 * @param h     peak dimensionless strain amplitude (≪ 1)
 * @param phase wave phase φ = ωt − kz, in radians
 */
export function strainAmplitudes(
  mode: PolarizationMode,
  h: number,
  phase: number,
): { hPlus: number; hCross: number } {
  switch (mode) {
    case "plus":
      return { hPlus: h * Math.cos(phase), hCross: 0 };
    case "cross":
      return { hPlus: 0, hCross: h * Math.cos(phase) };
    case "circular":
      return { hPlus: h * Math.cos(phase), hCross: h * Math.sin(phase) };
  }
}

/**
 * Displacement of a single free test mass under a passing wave.
 *
 * A mass initially at rest separation L from the ring centre, at polar
 * angle θ in the transverse plane, moves to first order in strain by
 *
 *   δr_x = ½ ( h₊ cosθ + h× sinθ ) L
 *   δr_y = ½ ( -h₊ sinθ + h× cosθ ) L
 *
 * The returned vector is the *deformed* position (rest position plus the
 * first-order displacement), suitable for drawing a deformed ring.
 *
 * @param theta   angular position of the mass on the rest ring (radians)
 * @param radius  rest separation L from the centre (metres)
 * @param hPlus   instantaneous plus-mode strain
 * @param hCross  instantaneous cross-mode strain
 */
export function deformedPosition(
  theta: number,
  radius: number,
  hPlus: number,
  hCross: number,
): Vec2 {
  const x0 = radius * Math.cos(theta);
  const y0 = radius * Math.sin(theta);
  // δr_i = ½ h_ij r_j with the TT-gauge h_ij = [[h₊, h×],[h×, −h₊]].
  const dx = 0.5 * (hPlus * x0 + hCross * y0);
  const dy = 0.5 * (hCross * x0 - hPlus * y0);
  return { x: x0 + dx, y: y0 + dy };
}

/**
 * The full deformed ring: `count` test masses evenly spaced in θ.
 */
export function deformedRing(
  count: number,
  radius: number,
  hPlus: number,
  hCross: number,
): Vec2[] {
  const out: Vec2[] = [];
  for (let i = 0; i < count; i++) {
    const theta = (2 * Math.PI * i) / count;
    out.push(deformedPosition(theta, radius, hPlus, hCross));
  }
  return out;
}

/**
 * Principal-axis angle of the strain ellipse, in radians, measured CCW
 * from the +x axis. The plus mode stretches along this axis and squeezes
 * along the perpendicular.
 *
 *   ψ = ½ atan2(h×, h₊)
 *
 * For pure plus this is 0; for pure cross it is 45° = π/4. Rotating the
 * detector by ψ would turn any × pattern into a + pattern — the two are
 * the same physics seen at 45°.
 */
export function principalAxisAngle(hPlus: number, hCross: number): number {
  return 0.5 * Math.atan2(hCross, hPlus);
}

/**
 * The spin-weight symmetry exponent. A spin-s massless field's
 * polarization pattern returns to itself under a rotation of 360°/s about
 * the propagation axis:
 *
 *   spin-1 (photon): 360° symmetry  → 1 full turn
 *   spin-2 (graviton): 180° symmetry → ½ turn
 *
 * Equivalently, the polarization plane angle ψ that brings the pattern
 * back to itself is π/s. Returns that angle in radians.
 */
export function symmetryAngle(spin: number): number {
  if (spin <= 0) return Infinity;
  return Math.PI / spin;
}

/**
 * Quadrupole strain estimate (order-of-magnitude form of the quadrupole
 * formula). For a source of mass M, internal velocity v, size R at
 * distance D, the radiated strain scales as
 *
 *   h ≈ (G / c⁴) · (2 Ï / D)   with   Ï ~ M v²
 *
 * so h ~ (G M v²) / (c⁴ D). This function returns that estimate. It is
 * an order-of-magnitude scaling, NOT a precision waveform — its purpose
 * is to show why h is ~10⁻²¹ even for violent astrophysical sources.
 *
 * @param mass       characteristic mass M (kg)
 * @param velocity   characteristic internal velocity v (m/s)
 * @param distance   distance to the source D (m)
 */
export function quadrupoleStrain(
  mass: number,
  velocity: number,
  distance: number,
): number {
  const G = 6.674e-11;
  const c = 2.998e8;
  if (distance <= 0) return Infinity;
  return (G * mass * velocity * velocity) / (c * c * c * c * distance);
}

/**
 * Net dipole moment of a set of point masses about their common centre of
 * mass. Returns the mass dipole Σ mᵢ (rᵢ − r_cm). By the definition of the
 * centre of mass this is identically zero, which is the algebraic reason
 * there is no dipole gravitational radiation: the time-varying mass dipole
 * cannot exist because Σ mᵢ rᵢ = M r_cm and momentum conservation fixes
 * r_cm to move uniformly. Returned here so a test can assert ≈ 0.
 */
export function massDipole(
  masses: readonly number[],
  positions: readonly Vec2[],
): Vec2 {
  let totalM = 0;
  let cx = 0;
  let cy = 0;
  for (let i = 0; i < masses.length; i++) {
    totalM += masses[i];
    cx += masses[i] * positions[i].x;
    cy += masses[i] * positions[i].y;
  }
  if (totalM === 0) return { x: 0, y: 0 };
  const rcmX = cx / totalM;
  const rcmY = cy / totalM;
  let dx = 0;
  let dy = 0;
  for (let i = 0; i < masses.length; i++) {
    dx += masses[i] * (positions[i].x - rcmX);
    dy += masses[i] * (positions[i].y - rcmY);
  }
  return { x: dx, y: dy };
}
