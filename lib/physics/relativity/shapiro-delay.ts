/**
 * §42 THE SHAPIRO TIME DELAY — pure-TS helpers.
 *
 * In the Schwarzschild geometry outside a mass M, the coordinate speed of a
 * radial light ray is reduced relative to its flat-space value c. A radar
 * pulse that passes near the Sun therefore takes longer — in the coordinate
 * time of a distant observer — to traverse a given path than it would if the
 * Sun were absent. This is the Shapiro delay, the "fourth classical test" of
 * general relativity (Irwin Shapiro, 1964).
 *
 * The standard weak-field result for the EXTRA one-way coordinate time taken
 * by a ray that travels between a source at distance r₁ and a receiver at
 * distance r₂ from the mass, passing at closest approach (impact parameter) b,
 * is, to leading order in GM/c²:
 *
 *   Δt_oneway ≈ (2GM/c³) · ln[ (r₁ + x₁)(r₂ + x₂) / b² ]
 *
 * where xᵢ = √(rᵢ² − b²) is the along-path distance from closest approach to
 * endpoint i. The round-trip (out-and-back) delay is twice this.
 *
 * This file is React-free and self-contained: it defines its OWN copies of the
 * constants it needs (G, c, AU) so it depends on no shared physics module.
 */

// ── Local physical constants (own copies; do not import shared module) ──────

/** Gravitational constant, m³ kg⁻¹ s⁻². CODATA 2018. */
export const G = 6.6743e-11;
/** Speed of light in vacuum, m/s (exact, SI 2019). */
export const C = 2.99792458e8;
/** Standard gravitational parameter of the Sun GM_⊙, m³/s². IAU 2012. */
export const GM_SUN = 1.32712440018e20;
/** One astronomical unit, m. IAU 2012. */
export const AU = 1.495978707e11;
/** Solar radius, m (IAU nominal). */
export const R_SUN = 6.957e8;

/**
 * Gravitational time scale 2GM/c³ — the natural unit of the Shapiro delay.
 * For the Sun this is ≈ 9.85 microseconds; the logarithmic factor multiplies
 * it up to the ~100–200 μs round-trip delays actually observed.
 */
export function gravTimeScale(GM = GM_SUN): number {
  return (2 * GM) / Math.pow(C, 3);
}

/**
 * Extra ONE-WAY coordinate-time delay for a light ray skirting a point mass.
 *
 * @param r1 source distance from the mass (m)
 * @param r2 receiver distance from the mass (m)
 * @param b  impact parameter / closest-approach distance (m)
 * @param GM gravitational parameter of the deflecting mass (m³/s²)
 * @returns the additional propagation time in seconds (positive)
 *
 * Uses Δt = (2GM/c³) ln[(r₁+x₁)(r₂+x₂)/b²], xᵢ = √(rᵢ²−b²).
 * Requires b ≤ min(r1, r2); throws otherwise (the geometry is undefined).
 */
export function shapiroOneWay(
  r1: number,
  r2: number,
  b: number,
  GM = GM_SUN,
): number {
  if (b <= 0) throw new Error("impact parameter b must be positive");
  if (b > r1 || b > r2) {
    throw new Error("impact parameter b cannot exceed either endpoint radius");
  }
  const x1 = Math.sqrt(r1 * r1 - b * b);
  const x2 = Math.sqrt(r2 * r2 - b * b);
  const arg = ((r1 + x1) * (r2 + x2)) / (b * b);
  return gravTimeScale(GM) * Math.log(arg);
}

/**
 * Round-trip (radar echo) Shapiro delay: out to the target and back.
 * Simply twice the one-way value with the same geometry.
 */
export function shapiroRoundTrip(
  r1: number,
  r2: number,
  b: number,
  GM = GM_SUN,
): number {
  return 2 * shapiroOneWay(r1, r2, b, GM);
}

/**
 * Coordinate speed of a radial light ray at radius r in the Schwarzschild
 * geometry, in units of c. To first order the radial coordinate speed is
 *
 *   v_coord/c = 1 − 2GM/(c² r) = 1 − r_s/r
 *
 * where r_s = 2GM/c² is the Schwarzschild radius. This is NOT a locally
 * measured speed — a local observer always measures c. It is the rate at which
 * the radial coordinate advances per unit distant-observer coordinate time,
 * and it is the quantity whose deficit, integrated along the path, produces
 * the Shapiro delay. Clamped to ≥ 0 for plotting; values below ~1 only for
 * r ≫ r_s in any physical weak-field setting.
 */
export function coordinateLightSpeed(r: number, GM = GM_SUN): number {
  if (r <= 0) return 0;
  const rs = (2 * GM) / (C * C);
  return Math.max(0, 1 - rs / r);
}

/**
 * Impact parameter of the Earth–target line of sight as a function of the
 * angular separation θ (radians) between the target and the mass, for a target
 * at distance d behind/around the mass. For small θ near superior conjunction
 * the geometric impact parameter is b ≈ θ · (d_mass) where d_mass is the
 * Earth–Sun distance. This helper returns b for a ray grazing the Sun whose
 * line of sight is offset by angle θ from the Sun's center.
 *
 * @param theta angular offset from the mass center (radians)
 * @param dMass distance from observer to the mass (m), default 1 AU
 */
export function impactParameterFromAngle(theta: number, dMass = AU): number {
  return Math.abs(Math.tan(theta)) * dMass;
}

/**
 * Convenience: round-trip Earth↔Venus radar Shapiro delay as a function of the
 * impact parameter b of the line of sight past the Sun. Earth and Venus are
 * placed at their mean orbital radii from the Sun. Returns seconds.
 *
 * At superior conjunction the line of sight grazes the Sun and b → R_⊙, where
 * the logarithm peaks and the round-trip delay reaches its famous ~200 μs.
 */
export function earthVenusRoundTrip(
  b: number,
  rEarth = AU,
  rVenus = 0.723 * AU,
): number {
  // Clamp b so it never exceeds the smaller orbital radius (Venus's).
  const bMax = Math.min(rEarth, rVenus);
  const bClamped = Math.min(Math.max(b, R_SUN * 1e-3), bMax);
  return shapiroRoundTrip(rEarth, rVenus, bClamped);
}

/**
 * Per-segment delay density dt/dx (extra seconds of delay per metre of path)
 * at along-path coordinate x measured from closest approach, for impact
 * parameter b. The integrand of the one-way delay is, to leading order,
 *
 *   d(Δt)/dx = (2GM/c³) / r,   r = √(b² + x²)
 *
 * Integrating this from −x₁ to +x₂ reproduces shapiroOneWay (up to the
 * standard log form). Useful for the "accumulated delay along path" scene:
 * the integrand is sharply peaked at x = 0 (closest approach), showing that
 * essentially all the delay is acquired while the ray skirts the mass.
 */
export function delayDensity(x: number, b: number, GM = GM_SUN): number {
  const r = Math.sqrt(b * b + x * x);
  if (r === 0) return 0;
  return gravTimeScale(GM) / r;
}

/** Seconds → microseconds, for display. */
export function toMicroseconds(seconds: number): number {
  return seconds * 1e6;
}
