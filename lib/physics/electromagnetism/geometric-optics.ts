/**
 * Geometric optics — §09.6.
 *
 * The short-wavelength limit of Maxwell's equations. When the wavelength of
 * light is small compared to every feature of the optical system (lens
 * diameter, mirror radius of curvature, object size), the wave equation
 * collapses into a collection of **rays** — lines that propagate in straight
 * lines through homogeneous media and kink at sharp interfaces. The kink
 * itself is governed by Snell's law, and every ray's trajectory is the one
 * that makes the optical path length stationary. That last sentence is
 * **Fermat's principle**, and it is the optical sibling of the classical
 * principle of least action: same mathematical machinery (a variational
 * principle), different substrate (light through index instead of matter
 * through potential).
 *
 * This kernel implements the four pillars of a first ray-optics course:
 *
 *   1. Snell's law in the form that returns a transmitted angle or null
 *      when total internal reflection makes the transmission nonexistent.
 *   2. The thin-lens imaging equation 1/f = 1/s_o + 1/s_i, reported with
 *      transverse magnification m = −s_i/s_o and a qualitative verdict on
 *      whether the image is real/virtual and upright/inverted.
 *   3. The lensmaker's equation for a thin lens in air, in its symmetric
 *      form 1/f = (n − 1)·(1/R1 − 1/R2). Signs follow the standard
 *      "positive for a surface whose centre of curvature is on the outgoing
 *      side" convention; a double-convex lens has R1 > 0 and R2 < 0.
 *   4. Fermat-style path integrals: travel time along a polyline that
 *      visits several points in media with given indices, plus the
 *      optical-path-length (OPL) sum Σ n_i · L_i that Fermat says is
 *      stationary along the real ray.
 *
 * Everything is pure: no DOM, no Math.random, deterministic for given
 * inputs. Angles are in radians throughout.
 */

import { SPEED_OF_LIGHT } from "@/lib/physics/constants";

// -----------------------------------------------------------------------------
// Snell's law
// -----------------------------------------------------------------------------

/**
 * Snell's law — returns the transmitted angle (radians) when a ray at
 * incidence angle θ_i crosses from a medium of index n1 into a medium of
 * index n2. Returns `null` when the geometry implies total internal
 * reflection, i.e. when sin θ_t would exceed 1.
 *
 *   n1 · sin θ_i = n2 · sin θ_t
 *
 * The input angle is measured from the interface *normal*, not the surface.
 * θ_i is clamped to the valid range [0, π/2]; values outside throw. The
 * output, when defined, is in [0, π/2].
 */
export function snellsLaw(
  thetaI_rad: number,
  n1: number,
  n2: number,
): number | null {
  if (!Number.isFinite(thetaI_rad)) {
    throw new Error("snellsLaw: thetaI_rad must be finite");
  }
  if (thetaI_rad < 0 || thetaI_rad > Math.PI / 2) {
    throw new Error("snellsLaw: thetaI_rad must be in [0, π/2]");
  }
  if (!(n1 > 0) || !(n2 > 0)) {
    throw new Error("snellsLaw: n1 and n2 must be positive");
  }
  const sinT = (n1 / n2) * Math.sin(thetaI_rad);
  if (sinT > 1 + 1e-15) return null; // TIR
  // Clamp floating-point overshoot at the critical angle itself.
  return Math.asin(Math.min(1, Math.max(-1, sinT)));
}

// -----------------------------------------------------------------------------
// Thin lens
// -----------------------------------------------------------------------------

export interface ThinLensImageResult {
  /** Image distance s_i along the optical axis. Sign convention: positive on
   *  the far (transmitted) side of the lens — i.e. a real image for a
   *  converging lens. Negative means the image forms on the object side and
   *  is virtual. Infinite when the object sits exactly at the focal point. */
  s_i: number;
  /** Transverse magnification m = −s_i / s_o. Negative means inverted, >1 in
   *  magnitude means enlarged. */
  magnification: number;
  /** "real" if s_i > 0 (image is where light actually converges); "virtual"
   *  if s_i ≤ 0 (image is a back-extrapolation of the diverging rays). */
  type: "real" | "virtual";
  /** "upright" if m > 0, "inverted" if m < 0. */
  orientation: "upright" | "inverted";
}

/**
 * Thin-lens imaging equation.
 *
 *   1/s_o + 1/s_i = 1/f
 *
 * Solved for the image distance s_i and the transverse magnification
 * m = −s_i / s_o. The sign conventions follow the "Cartesian" one most common
 * in undergraduate optics:
 *
 *   • f > 0 for a converging lens; f < 0 for a diverging one.
 *   • s_o > 0 for an object on the incoming-light side of the lens.
 *   • s_i > 0 when the image forms on the outgoing side (real image);
 *     s_i < 0 when the image sits on the incoming side (virtual image).
 *
 * Edge cases:
 *   – s_o → ∞ makes s_i → f and m → 0 (image collapses to the focal point).
 *   – s_o = f makes s_i = ∞ (parallel emerging rays, no image).
 *   – 0 < s_o < f for f > 0 gives s_i < 0 — virtual, upright, magnified:
 *     the magnifying-glass regime.
 */
export function thinLensImage(f: number, s_o: number): ThinLensImageResult {
  if (!Number.isFinite(f) || f === 0) {
    throw new Error("thinLensImage: f must be finite and nonzero");
  }
  if (!Number.isFinite(s_o) || s_o === 0) {
    throw new Error("thinLensImage: s_o must be finite and nonzero");
  }

  // Object at the focal point → parallel emerging rays → image at infinity.
  if (Math.abs(s_o - f) < 1e-15) {
    return {
      s_i: Number.POSITIVE_INFINITY,
      magnification: Number.NEGATIVE_INFINITY,
      type: "real",
      orientation: "inverted",
    };
  }

  // 1/s_i = 1/f − 1/s_o  ⇒  s_i = (f · s_o) / (s_o − f)
  const s_i = (f * s_o) / (s_o - f);
  const m = -s_i / s_o;
  return {
    s_i,
    magnification: m,
    type: s_i > 0 ? "real" : "virtual",
    orientation: m >= 0 ? "upright" : "inverted",
  };
}

/**
 * Lensmaker's equation for a thin lens in air.
 *
 *   1/f = (n − 1) · (1/R1 − 1/R2)
 *
 * Sign convention: R is positive when the centre of curvature lies on the
 * far (transmitted) side of the refracting surface, and negative when it
 * lies on the near (incoming) side. For the archetypal symmetric
 * biconvex lens shown in every textbook figure, R1 > 0 and R2 < 0, so
 * 1/R1 − 1/R2 is strictly positive and f comes out positive (converging).
 *
 * A flat surface corresponds to |R| → ∞ and contributes nothing to 1/f.
 * Pass `Infinity` or `-Infinity` to model a plano-convex / plano-concave
 * piece of glass.
 *
 * Example: symmetric biconvex crown glass, n = 1.5, R1 = 10 cm, R2 = −10 cm.
 *   1/f = 0.5 · (1/10 − 1/(−10)) = 0.5 · 0.2 = 0.1  ⇒  f = 10 cm.
 */
export function lensmakerEquation(n: number, R1: number, R2: number): number {
  if (!(n > 1)) {
    throw new Error("lensmakerEquation: n must be > 1 for a glass-in-air lens");
  }
  if (R1 === 0 || R2 === 0) {
    throw new Error("lensmakerEquation: curvature radii must be nonzero");
  }
  const inv1 = Number.isFinite(R1) ? 1 / R1 : 0;
  const inv2 = Number.isFinite(R2) ? 1 / R2 : 0;
  const invF = (n - 1) * (inv1 - inv2);
  if (invF === 0) return Number.POSITIVE_INFINITY; // perfectly cancelled curvature
  return 1 / invF;
}

// -----------------------------------------------------------------------------
// Fermat's principle — path time and optical path length
// -----------------------------------------------------------------------------

/**
 * A polyline path is a sequence of points; between consecutive vertices the
 * ray travels in a straight line through a medium whose index is listed by
 * `indices`. There must be exactly one index per *segment*, i.e.
 * `indices.length === path.length − 1`.
 */
export interface PathPoint {
  x: number;
  y: number;
}

/**
 * Total travel time for a polyline ray.
 *
 *   t = Σ n_i · L_i / c
 *
 * where L_i is the Euclidean length of segment i and n_i the index in that
 * segment. This is equivalent to OPL / c; it is the quantity Fermat's
 * principle says is stationary along the true ray.
 *
 * Returns seconds when positions are in metres. For arbitrary length units
 * the result scales linearly (L in metres → t in seconds, L in mm →
 * t in ms·1e-3·s/mm scaling; pick one and stick to it per call).
 */
export function fermatTime(
  path: readonly PathPoint[],
  indices: readonly number[],
): number {
  if (path.length < 2) {
    throw new Error("fermatTime: path needs at least two points");
  }
  if (indices.length !== path.length - 1) {
    throw new Error(
      "fermatTime: indices must have length === path.length − 1",
    );
  }
  let total = 0;
  for (let i = 0; i < indices.length; i++) {
    const n = indices[i];
    if (!(n > 0) || !Number.isFinite(n)) {
      throw new Error(`fermatTime: indices[${i}] must be a finite positive number`);
    }
    const a = path[i];
    const b = path[i + 1];
    const dx = b.x - a.x;
    const dy = b.y - a.y;
    const L = Math.sqrt(dx * dx + dy * dy);
    total += (n * L) / SPEED_OF_LIGHT;
  }
  return total;
}

/**
 * A single segment of a Fermat path — a physical length (in whatever units
 * the caller uses) together with the refractive index of the medium.
 */
export interface OpticalSegment {
  length: number;
  index: number;
}

/**
 * Optical path length:
 *
 *   OPL = Σ n_i · L_i
 *
 * The dimensioned analog of travel time — unlike `fermatTime`, OPL carries
 * the units of length, not time. Fermat's principle is equivalent to the
 * statement that OPL is stationary along the real ray; in a piecewise
 * straight-line geometry like a refraction at a single interface, "OPL is
 * minimum" is exactly Snell's law.
 */
export function opticalPathLength(segments: readonly OpticalSegment[]): number {
  let total = 0;
  for (const s of segments) {
    if (!(s.index > 0) || !Number.isFinite(s.index)) {
      throw new Error("opticalPathLength: every segment index must be > 0");
    }
    if (!Number.isFinite(s.length) || s.length < 0) {
      throw new Error("opticalPathLength: every segment length must be ≥ 0");
    }
    total += s.index * s.length;
  }
  return total;
}
