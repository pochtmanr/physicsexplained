/**
 * §45 KERR BLACK HOLES AND THE ERGOSPHERE — pure-TS helpers.
 *
 * The Kerr metric (Roy Kerr, 1963) describes the vacuum spacetime outside a
 * rotating, uncharged black hole. In Boyer–Lindquist coordinates it is fixed
 * by two numbers: the mass M and the spin angular momentum J. We work in
 * geometrized units (G = c = 1), where lengths are measured in units of M and
 * the spin is captured by the dimensionless ratio
 *
 *   a = J / (M c)   →   in units of M:   a* = a / M ∈ [0, 1].
 *
 * In these units M itself has the dimension of length (M = GM/c² in SI), so
 * every radius below is "in units of M". To convert to kilometres multiply by
 * GM/c² ≈ 1.4767 km per solar mass.
 *
 * Two surfaces matter:
 *
 *   • the (outer) event horizon  r_+ = M + √(M² − a²)
 *   • the (outer) static limit / ergosurface
 *        r_E(θ) = M + √(M² − a² cos²θ)
 *
 * Between them lies the ERGOSPHERE: a region outside the horizon where no
 * observer can remain at rest relative to infinity — frame dragging forces
 * everything to co-rotate. The ergosphere touches the horizon at the poles
 * (θ = 0) and bulges to r = 2M at the equator (θ = π/2) for the extremal case.
 *
 * This file is React-free and dependency-free; every quantity is expressed in
 * units of M so the scenes can scale to the canvas without choosing a mass.
 */

/** Outer event-horizon radius r_+ = M + √(M² − a²), in units of M.
 *  `aStar` is the dimensionless spin a/M ∈ [0, 1]; clamped to that range.
 *  At a* = 0 this is the Schwarzschild value 2M; at a* = 1 (extremal) it
 *  shrinks to M. For a* > 1 the square root would be imaginary — there is no
 *  horizon, and the result would be a naked singularity (cosmic censorship
 *  forbids this for astrophysical collapse). */
export function outerHorizonRadius(aStar: number): number {
  const a = clampSpin(aStar);
  return 1 + Math.sqrt(1 - a * a);
}

/** Inner (Cauchy) horizon radius r_− = M − √(M² − a²), in units of M.
 *  Exists only for 0 ≤ a* ≤ 1; equals the outer horizon at extremality. */
export function innerHorizonRadius(aStar: number): number {
  const a = clampSpin(aStar);
  return 1 - Math.sqrt(1 - a * a);
}

/** Static-limit (ergosurface) radius r_E(θ) = M + √(M² − a² cos²θ),
 *  in units of M, as a function of polar angle θ (radians from the spin axis).
 *  At the poles (θ = 0) it coincides with the horizon; at the equator
 *  (θ = π/2) it reaches 2M for any spin. */
export function ergosphereRadius(aStar: number, theta: number): number {
  const a = clampSpin(aStar);
  const c = Math.cos(theta);
  return 1 + Math.sqrt(1 - a * a * c * c);
}

/** Equatorial ergosphere thickness Δr = r_E(π/2) − r_+ in units of M.
 *  This is the radial depth of the ergosphere where it is widest. It is 0 at
 *  a* = 0 (no rotation, no ergosphere) and grows to M at a* = 1. */
export function ergosphereThickness(aStar: number): number {
  return ergosphereRadius(aStar, Math.PI / 2) - outerHorizonRadius(aStar);
}

/** Angular velocity of the horizon Ω_H = a / (r_+² + a²), in units of 1/M
 *  (i.e. c³/GM in SI). This is the rate at which the horizon — and any object
 *  that reaches it — is dragged around the spin axis. Zero for a* = 0, and
 *  Ω_H = 1/(2M) at extremality. */
export function horizonAngularVelocity(aStar: number): number {
  const a = clampSpin(aStar);
  const rPlus = outerHorizonRadius(a);
  return a / (rPlus * rPlus + a * a);
}

/** Frame-dragging angular velocity ω(r) for a zero-angular-momentum observer
 *  (ZAMO) in the equatorial plane (θ = π/2), in units of 1/M.
 *
 *  ω = 2 M a r / Σ,  where in the equatorial plane (θ = π/2):
 *      ρ² = r²  (since cos θ = 0),
 *      Δ   = r² − 2 M r + a²,
 *      A   = (r² + a²)² − a² Δ,
 *  and  ω = 2 a r / A   (with M = 1).
 *
 *  A ZAMO has no angular momentum yet is swept around the hole at this rate —
 *  the operational signature of frame dragging. ω → Ω_H as r → r_+, and
 *  ω ∝ 1/r³ far away (the Lense–Thirring fall-off). Returns 0 for a* = 0. */
export function zamoAngularVelocity(aStar: number, r: number): number {
  const a = clampSpin(aStar);
  if (a === 0) return 0;
  const r2 = r * r;
  const delta = r2 - 2 * r + a * a;
  const A = (r2 + a * a) * (r2 + a * a) - a * a * delta;
  if (A <= 0) return 0;
  return (2 * a * r) / A;
}

/** Irreducible mass M_irr in units of M: the part of a Kerr black hole's mass
 *  that CANNOT be extracted by any classical process. Built from the horizon
 *  area: M_irr = √(A_H / 16π) = √( (r_+² + a²) / 2 ) (with M = 1).
 *  M_irr = M for a* = 0; M_irr = M/√2 ≈ 0.707 M at extremality, which is why up
 *  to 1 − 1/√2 ≈ 29 % of an extremal black hole's mass-energy is in principle
 *  available via the Penrose process / superradiance. */
export function irreducibleMass(aStar: number): number {
  const a = clampSpin(aStar);
  const rPlus = outerHorizonRadius(a);
  return Math.sqrt((rPlus * rPlus + a * a) / 2);
}

/** Maximum fraction of total mass-energy extractable from a Kerr hole of spin
 *  a*: f = 1 − M_irr(a*)/M. 0 at a* = 0; → 1 − 1/√2 ≈ 0.2929 at extremality. */
export function maxExtractableEnergyFraction(aStar: number): number {
  return 1 - irreducibleMass(aStar);
}

/** Horizon area A_H = 8π M ( M + √(M² − a²) ) = 8π r_+ (in units of M²,
 *  with M = 1). Equivalently A_H = 4π (r_+² + a²). Monotonically DECREASES with
 *  spin at fixed M, from 16π (Schwarzschild) to 8π (extremal). The area can
 *  never decrease in any classical process (Hawking's area theorem), which is
 *  what bounds the Penrose process. */
export function horizonArea(aStar: number): number {
  const a = clampSpin(aStar);
  const rPlus = outerHorizonRadius(a);
  return 4 * Math.PI * (rPlus * rPlus + a * a);
}

/** Clamp a dimensionless spin a* into the physical range [0, 1]. Values above
 *  1 would describe a naked singularity (no horizon), which cosmic censorship
 *  forbids; values below 0 just flip the sense of rotation, so we fold them. */
export function clampSpin(aStar: number): number {
  if (!Number.isFinite(aStar)) return 0;
  const a = Math.abs(aStar);
  return a > 1 ? 1 : a;
}
