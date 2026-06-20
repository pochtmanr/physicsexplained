/**
 * §39 THE SCHWARZSCHILD METRIC — pure-TS helpers.
 *
 * The Schwarzschild solution is the unique static, spherically symmetric,
 * asymptotically flat vacuum solution of Einstein's field equations. In the
 * Schwarzschild coordinates (t, r, θ, φ) the line element is
 *
 *   ds² = −(1 − r_s/r) c² dt²
 *         + (1 − r_s/r)⁻¹ dr²
 *         + r² (dθ² + sin²θ dφ²)
 *
 * with the Schwarzschild radius r_s = 2GM/c². Two features dominate the
 * geometry: the time-time metric component g_tt → 0 and the radial component
 * g_rr → ∞ as r → r_s. The g_rr blow-up is a coordinate artifact (the geometry
 * is perfectly regular there); the genuine curvature singularity is at r = 0.
 *
 * This module works in geometrized-style reduced units where lengths are
 * measured in units of r_s unless stated otherwise. Functions that take SI
 * inputs say so explicitly. Nothing here imports React.
 */

import { G_SI, SPEED_OF_LIGHT } from "@/lib/physics/constants";

// ─── Characteristic scales ──────────────────────────────────────────────────

/** Schwarzschild radius r_s = 2GM/c² for a mass M (kg), returned in metres.
 *  For ordinary bodies r_s lies far inside the physical surface: the Sun's is
 *  ≈ 2954 m, the Earth's ≈ 8.87 mm. Only when an object collapses inside its
 *  own r_s does it become a black hole. */
export function schwarzschildRadius(
  M_kg: number,
  G = G_SI,
  c = SPEED_OF_LIGHT,
): number {
  return (2 * G * M_kg) / (c * c);
}

// ─── Metric components (dimensionless, x = r/r_s) ────────────────────────────

/** g_tt(x) = −(1 − 1/x) in units where c = 1, x = r/r_s.
 *  Returns the time-time component of the Schwarzschild metric. It vanishes at
 *  the horizon (x = 1) — clocks deep in the well tick arbitrarily slowly as
 *  seen from infinity — and → −1 (flat Minkowski) as x → ∞. For x < 1 it
 *  becomes positive: t stops being a time coordinate inside the horizon. */
export function gtt(x: number): number {
  return -(1 - 1 / x);
}

/** g_rr(x) = 1/(1 − 1/x), x = r/r_s.
 *  The radial component diverges at the horizon (x → 1) — this is the famous
 *  "blow-up" — but the divergence is a coordinate artifact, not a physical
 *  one. Inside the horizon (x < 1) it is negative. As x → ∞ it → 1 (flat). */
export function grr(x: number): number {
  return 1 / (1 - 1 / x);
}

/** The metric factor f(x) = 1 − 1/x, x = r/r_s.
 *  Appears as −f c²dt² and f⁻¹ dr². Zero at the horizon, 1 at infinity. */
export function metricFactor(x: number): number {
  return 1 - 1 / x;
}

/** Gravitational time-dilation factor √(1 − r_s/r) = √(1 − 1/x), x = r/r_s.
 *  The ratio dτ/dt for a static observer at radius x: proper time per unit
 *  coordinate time. A clock at x runs this much slower than a clock at
 *  infinity. Undefined (NaN) inside the horizon where no static observer
 *  exists. */
export function timeDilationFactor(x: number): number {
  return Math.sqrt(1 - 1 / x);
}

/** The Kretschmann scalar K = R_{αβγδ}R^{αβγδ} = 12 r_s²/r⁶, here returned in
 *  units of 1/r_s⁴ as 12/x⁶ (x = r/r_s). This curvature invariant is finite
 *  and small at the horizon (K = 12 at x = 1) but diverges as x → 0 — the
 *  unambiguous signature that r = 0 is a true, coordinate-independent
 *  singularity, while r = r_s is not. */
export function kretschmann(x: number): number {
  return 12 / Math.pow(x, 6);
}

// ─── Effective potential and circular orbits ─────────────────────────────────

/**
 * Dimensionless effective potential per unit mass for a massive test particle
 * in Schwarzschild geometry, in units where r_s = 1 and c = 1:
 *
 *   V_eff(x) = (1 − 1/x)(1 + ℓ²/x²)
 *
 * where x = r/r_s and ℓ = L/(m c r_s) is the reduced specific angular
 * momentum. The orbit is governed by (dx/dτ)² = E² − V_eff. Bound, circular,
 * precessing, and plunge orbits are all read off the shape of this curve. The
 * extra −2ℓ²/x³ relative to the Newtonian potential is the GR term that drives
 * perihelion precession and, for small enough ℓ, removes the centrifugal
 * barrier entirely so the particle plunges. Returns E² at the turning point.
 */
export function effectivePotential(x: number, ell: number): number {
  return (1 - 1 / x) * (1 + (ell * ell) / (x * x));
}

/**
 * Radii of circular orbits for a given reduced angular momentum ℓ, in units of
 * r_s. Circular orbits sit at extrema of V_eff. Solving dV_eff/dx = 0 gives a
 * quadratic in x:
 *
 *   x± = ℓ² ( 1 ± √(1 − 3/ℓ²) )
 *
 * The outer root (+) is a stable circular orbit; the inner root (−) is
 * unstable. Real roots require ℓ² ≥ 3, i.e. ℓ ≥ √3. At exactly ℓ = √3 the two
 * roots merge at x = 3 — that is the innermost stable circular orbit (ISCO) at
 * r = 3 r_s = 6 GM/c². Below ℓ = √3 there are no circular orbits at all: every
 * trajectory either escapes or plunges. Returns null when none exist.
 */
export function circularOrbitRadii(
  ell: number,
): { stable: number; unstable: number } | null {
  const disc = 1 - 3 / (ell * ell);
  if (disc < 0) return null;
  const root = Math.sqrt(disc);
  const stable = ell * ell * (1 + root);
  const unstable = ell * ell * (1 - root);
  return { stable, unstable };
}

/** The innermost stable circular orbit (ISCO), in units of r_s.
 *  For a non-rotating (Schwarzschild) black hole the ISCO is at r = 3 r_s =
 *  6 GM/c². Inside it no stable circular orbit exists — the basis for the inner
 *  edge of an accretion disk. */
export function iscoRadius(): number {
  return 3;
}

/** The photon sphere radius, in units of r_s.
 *  Massless particles can orbit on an unstable circular null geodesic at
 *  r = 1.5 r_s = 3GM/c². This is the radius of the black-hole "shadow"
 *  boundary seen by the Event Horizon Telescope (up to a √27/2 magnification
 *  of the apparent shadow). */
export function photonSphereRadius(): number {
  return 1.5;
}

// ─── Flamm's paraboloid (embedding diagram) ──────────────────────────────────

/**
 * Flamm's paraboloid: the embedding height z(r) of the equatorial slice of the
 * Schwarzschild geometry into flat 3-space, satisfying
 *
 *   z(r) = 2 √( r_s (r − r_s) ).
 *
 * Here x = r/r_s ≥ 1 and the returned height is in units of r_s:
 *
 *   z(x)/r_s = 2 √(x − 1).
 *
 * The funnel is vertical (infinite slope) at the horizon x = 1 and flattens to
 * the asymptotically flat plane far away. It is the "rubber sheet" picture made
 * exact — but only for the spatial geometry outside the horizon, frozen at one
 * instant of Schwarzschild time. Returns NaN for x < 1.
 */
export function flammHeight(x: number): number {
  return 2 * Math.sqrt(x - 1);
}

// ─── Coordinate speed of light (useful for Shapiro intuition) ────────────────

/** Coordinate (radial) speed of light in Schwarzschild geometry, in units of
 *  c, for a purely radial null ray: v(x) = 1 − 1/x, x = r/r_s. Far away it is
 *  1; at the horizon it drops to 0. This is a coordinate-dependent statement —
 *  a local observer always measures c — but it underlies the Shapiro delay. */
export function coordinateLightSpeedRadial(x: number): number {
  return 1 - 1 / x;
}
