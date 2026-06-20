/**
 * §46 PENROSE DIAGRAMS AND CAUSAL STRUCTURE — pure-TS helpers.
 *
 * A Penrose (conformal) diagram is built by a *conformal compactification*:
 * an angle-preserving rescaling of the metric that drags the infinite
 * coordinate ranges of spacetime into a finite picture. Distances are
 * distorted, but the 45° light cones — the causal structure — are preserved
 * everywhere. The standard recipe for Minkowski space uses the arctangent
 * to map (t, r) ∈ (−∞, ∞) onto a finite triangular diamond.
 *
 * Conventions in this file:
 *   - Null coordinates  u = t − r ,  v = t + r   (we keep r ≥ 0).
 *   - Compactified null coordinates  ũ = arctan(u) ,  ṽ = arctan(v),
 *     each ranging over (−π/2, π/2).
 *   - Diagram axes  T = ṽ + ũ  (vertical, "time"),  X = ṽ − ũ  (horizontal,
 *     "space"). For r ≥ 0 the region collapses to the right half-diamond
 *     0 ≤ X, |T| + X ≤ π.
 *
 * None of this changes the physics: it is a coordinate choice that makes the
 * *global* causal structure — what can reach what — drawable on one page.
 * This module is React-free and dependency-free so it can be unit-tested and
 * shared by the canvas scenes.
 */

export const HALF_PI = Math.PI / 2;

/** A point in the compactified diagram, with diagram coordinates (X, T). */
export interface DiagramPoint {
  /** Horizontal diagram coordinate (space-like), range roughly [0, π]. */
  X: number;
  /** Vertical diagram coordinate (time-like), range roughly [−π, π]. */
  T: number;
}

/**
 * Conformal compactification of flat (Minkowski) spacetime.
 *
 * Maps a physical event (t, r) with r ≥ 0 to its position in the Penrose
 * diamond. The map is f(x) = arctan(x) applied to the null coordinates, so
 * every finite event lands strictly inside the diamond and the boundaries
 * (|x| → ∞) are the conformal infinities ℐ⁺, ℐ⁻, i⁰, i±.
 */
export function minkowskiCompactify(t: number, r: number): DiagramPoint {
  const u = t - r;
  const v = t + r;
  const uTil = Math.atan(u);
  const vTil = Math.atan(v);
  return { X: vTil - uTil, T: vTil + uTil };
}

/**
 * The five classes of "infinity" of compactified Minkowski space, returned as
 * diagram points (the corners/edges of the diamond). These are the limits of
 * minkowskiCompactify as coordinates run off to infinity.
 *
 *   i⁺  future timelike infinity   (t → +∞, r finite)
 *   i⁻  past timelike infinity     (t → −∞, r finite)
 *   i⁰  spatial infinity           (r → +∞, t finite)
 *   ℐ⁺  future null infinity (scri-plus)   — where outgoing light ends
 *   ℐ⁻  past null infinity   (scri-minus)  — where incoming light begins
 */
export interface ConformalInfinities {
  iPlus: DiagramPoint;
  iMinus: DiagramPoint;
  iZero: DiagramPoint;
  /** Endpoints of future null infinity ℐ⁺ as a line segment [from, to]. */
  scriPlus: [DiagramPoint, DiagramPoint];
  /** Endpoints of past null infinity ℐ⁻ as a line segment [from, to]. */
  scriMinus: [DiagramPoint, DiagramPoint];
}

export function conformalInfinities(): ConformalInfinities {
  // r ≥ 0 right-diamond corners (T = ṽ + ũ, X = ṽ − ũ, each tilde in ±π/2):
  return {
    iPlus: { X: 0, T: Math.PI }, // ũ, ṽ → +π/2
    iMinus: { X: 0, T: -Math.PI }, // ũ, ṽ → −π/2
    iZero: { X: Math.PI, T: 0 }, // ṽ → +π/2, ũ → −π/2
    scriPlus: [
      { X: 0, T: Math.PI },
      { X: Math.PI, T: 0 },
    ],
    scriMinus: [
      { X: Math.PI, T: 0 },
      { X: 0, T: -Math.PI },
    ],
  };
}

/**
 * Causal relationship between two diagram points, judged by the diagram's
 * own 45° light cones (which faithfully represent the physical light cones
 * because the conformal map preserves null directions).
 *
 * Returns:
 *   "timelike"   — B is inside A's light cone (|ΔT| > |ΔX|): A can send a
 *                  massive signal to B (or vice-versa).
 *   "null"       — B is on A's light cone (|ΔT| = |ΔX|): only light connects.
 *   "spacelike"  — B is outside A's light cone (|ΔT| < |ΔX|): no causal
 *                  signal can connect them.
 */
export type CausalRelation = "timelike" | "null" | "spacelike";

export function causalRelation(
  a: DiagramPoint,
  b: DiagramPoint,
  eps = 1e-9,
): CausalRelation {
  const dT = Math.abs(b.T - a.T);
  const dX = Math.abs(b.X - a.X);
  if (Math.abs(dT - dX) <= eps) return "null";
  return dT > dX ? "timelike" : "spacelike";
}

/**
 * Can event A causally influence event B? True iff B lies in the future light
 * cone of A: B.T > A.T (future) and the separation is timelike or null.
 */
export function canReach(a: DiagramPoint, b: DiagramPoint, eps = 1e-9): boolean {
  if (b.T - a.T < eps) return false; // B not strictly in A's future
  const rel = causalRelation(a, b, eps);
  return rel === "timelike" || rel === "null";
}

/**
 * The four regions of the maximally-extended Schwarzschild (Kruskal) Penrose
 * diagram, labeled in the standard convention:
 *   I    — our exterior universe (r > r_s)
 *   II   — the black-hole interior (between horizon and future singularity)
 *   III  — the "other" asymptotic exterior universe (a mirror of I)
 *   IV   — the white-hole interior (past singularity)
 */
export type SchwarzschildRegion = "I" | "II" | "III" | "IV";

/**
 * Classify a point of the maximally-extended Schwarzschild geometry given its
 * Kruskal–Szekeres coordinates (U, V). The two future-pointing null
 * coordinates U, V satisfy U·V < 0 in the exteriors and U·V > 0 in the
 * interiors; the horizon is U = 0 or V = 0; the singularity is the hyperbola
 * U·V = 1.
 *
 * Convention here: V increases up-and-right, U increases up-and-left.
 *   Region I  : V > 0, U < 0  (right exterior — us)
 *   Region II : V > 0, U > 0  (future interior — black hole)
 *   Region III: V < 0, U > 0  (left exterior — mirror universe)
 *   Region IV : V < 0, U < 0  (past interior — white hole)
 */
export function schwarzschildRegion(U: number, V: number): SchwarzschildRegion {
  if (V >= 0 && U < 0) return "I";
  if (V > 0 && U >= 0) return "II";
  if (V < 0 && U > 0) return "III";
  return "IV";
}

/**
 * Is a Kruskal point beyond the future singularity? The singularity is the
 * curve r = 0, which in Kruskal coordinates is U·V = 1 (taking r_s = 1). The
 * future singularity has V > 0; points with U·V ≥ 1 there are unphysical
 * (past the singularity).
 */
export function beyondSingularity(U: number, V: number): boolean {
  return U * V >= 1;
}

/**
 * Whether an observer in region I (V > 0, U < 0) who later crosses the future
 * horizon (into region II) can avoid the singularity. The answer is no: once
 * U > 0 (inside region II), increasing proper time drives U·V → 1, the
 * singularity. This helper returns the *maximum* affine "time" available
 * before hitting r = 0 along a radial infall, parameterized by U > 0 at fixed
 * V: it is the V at which U·V = 1, i.e. 1/U.
 */
export function singularityProperLimit(U: number): number {
  if (U <= 0) return Infinity; // still outside the horizon — no bound
  return 1 / U;
}

/**
 * Sample the conformal image of a radial light ray of Minkowski space.
 * An outgoing ray has u = t − r = const (u₀); an ingoing ray has
 * v = t + r = const (v₀). Returns an ordered list of diagram points tracing
 * the ray; because the map preserves null lines, the result is a straight 45°
 * segment in the diagram (this function is the ground truth the scene draws).
 */
export function sampleNullRay(
  kind: "outgoing" | "ingoing",
  constValue: number,
  samples = 24,
  paramMax = 12,
): DiagramPoint[] {
  const pts: DiagramPoint[] = [];
  for (let i = 0; i <= samples; i++) {
    const s = (i / samples) * paramMax; // s ≥ 0 parameter along the ray
    let t: number;
    let r: number;
    if (kind === "outgoing") {
      // u = t − r = constValue, sweep r upward: t = constValue + r
      r = s;
      t = constValue + r;
    } else {
      // v = t + r = constValue, sweep r upward: t = constValue − r
      r = s;
      t = constValue - r;
    }
    pts.push(minkowskiCompactify(t, r));
  }
  return pts;
}

/** Linear interpolation helper (shared by scenes for animating the squeeze). */
export function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

/**
 * Partial-compactification blend used by the "watch infinity fold in" scene.
 * At s = 0 the map is the identity (raw Minkowski coordinates, rescaled);
 * at s = 1 it is the full arctan compactification. Returns diagram-space (X,T)
 * for a given physical (t, r) at squeeze fraction s ∈ [0, 1].
 *
 * The raw branch is normalized by `scale` so that the identity picture and the
 * compactified picture share a comparable bounding box for a smooth animation.
 */
export function blendCompactify(
  t: number,
  r: number,
  s: number,
  scale = HALF_PI / 12,
): DiagramPoint {
  const full = minkowskiCompactify(t, r);
  const rawU = (t - r) * scale;
  const rawV = (t + r) * scale;
  const raw: DiagramPoint = { X: rawV - rawU, T: rawV + rawU };
  return {
    X: lerp(raw.X, full.X, s),
    T: lerp(raw.T, full.T, s),
  };
}
