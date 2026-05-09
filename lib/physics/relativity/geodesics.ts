/**
 * §07 GEODESICS — pure-TS helpers.
 *
 * A geodesic on a manifold is the curve whose tangent vector is parallel-transported
 * along itself. Equivalently, it is the curve that extremises the arc-length functional
 *   ∫ √(g_{μν} dx^μ/dλ · dx^ν/dλ) dλ = 0  (variational characterisation).
 *
 * The equation of motion is the geodesic equation:
 *   d²x^μ/dλ² + Γ^μ_{αβ} (dx^α/dλ)(dx^β/dλ) = 0.
 *
 * On a flat space this reduces to d²x^μ/dλ² = 0 — a straight line. On a curved
 * manifold the Christoffel correction exactly accounts for the "turning" needed to
 * keep the tangent parallel.
 *
 * This module provides:
 *   • integrateGeodesic   — RK4 numerical integration of the geodesic equation.
 *   • greatCircle         — analytic great-circle sampling on a sphere of radius R.
 *   • conservedEnergy     — g_{tt} v^t (conserved along geodesics of static metrics).
 *
 * Depends on christoffelSymbols from ./christoffel.
 */

import { christoffelSymbols } from "./christoffel";

// ─── Types ────────────────────────────────────────────────────────────────────

/** A single state snapshot along the integrated geodesic path. */
export interface GeodesicStep {
  x: readonly number[];
  v: readonly number[];
  lambda: number;
}

// ─── integrateGeodesic ────────────────────────────────────────────────────────

/**
 * Solve the geodesic equation d²x^μ/dλ² + Γ^μ_{αβ} (dx^α/dλ)(dx^β/dλ) = 0
 * numerically using a classic RK4 integrator.
 *
 * @param metric  A function x → g_{μν}(x) returning the metric tensor as an
 *                n×n readonly number[][] at each point.
 * @param x0      Initial position (length n).
 * @param v0      Initial velocity dx/dλ (length n).
 * @param T       Total parameter range (integrate from λ = 0 to λ = T).
 * @param h       Step size Δλ. Total steps = Math.floor(T / h).
 * @returns       Array of { x, v, lambda } snapshots, including the initial state.
 */
export function integrateGeodesic(
  metric: (x: readonly number[]) => readonly (readonly number[])[],
  x0: readonly number[],
  v0: readonly number[],
  T: number,
  h: number,
): readonly GeodesicStep[] {
  const n = x0.length;
  const path: GeodesicStep[] = [{ x: [...x0], v: [...v0], lambda: 0 }];
  let x = [...x0];
  let v = [...v0];

  /** Compute the coordinate acceleration from the geodesic equation at (x, v). */
  const accel = (xCur: readonly number[], vCur: readonly number[]): number[] => {
    const Gamma = christoffelSymbols(metric, xCur);
    const a: number[] = new Array(n).fill(0);
    for (let mu = 0; mu < n; mu++) {
      let acc = 0;
      for (let alpha = 0; alpha < n; alpha++) {
        for (let beta = 0; beta < n; beta++) {
          acc -= Gamma[mu][alpha][beta] * vCur[alpha] * vCur[beta];
        }
      }
      a[mu] = acc;
    }
    return a;
  };

  let lambda = 0;
  const steps = Math.floor(T / h);
  for (let step = 0; step < steps; step++) {
    // RK4: k1
    const k1v = accel(x, v);
    const k1x = [...v];
    // k2
    const x2 = x.map((xi, i) => xi + 0.5 * h * k1x[i]);
    const v2 = v.map((vi, i) => vi + 0.5 * h * k1v[i]);
    const k2v = accel(x2, v2);
    const k2x = [...v2];
    // k3
    const x3 = x.map((xi, i) => xi + 0.5 * h * k2x[i]);
    const v3 = v.map((vi, i) => vi + 0.5 * h * k2v[i]);
    const k3v = accel(x3, v3);
    const k3x = [...v3];
    // k4
    const x4 = x.map((xi, i) => xi + h * k3x[i]);
    const v4 = v.map((vi, i) => vi + h * k3v[i]);
    const k4v = accel(x4, v4);
    const k4x = [...v4];

    x = x.map((xi, i) => xi + (h / 6) * (k1x[i] + 2 * k2x[i] + 2 * k3x[i] + k4x[i]));
    v = v.map((vi, i) => vi + (h / 6) * (k1v[i] + 2 * k2v[i] + 2 * k3v[i] + k4v[i]));
    lambda += h;
    path.push({ x: [...x], v: [...v], lambda });
  }
  return path;
}

// ─── greatCircle ─────────────────────────────────────────────────────────────

/** A sample on the unit sphere in spherical coordinates (θ, φ). */
export interface SphereSample {
  theta: number;
  phi: number;
}

/**
 * Compute a great circle on a sphere of radius R, parametrised by
 * initial position (θ₀, φ₀) and an initial azimuth (compass bearing, radians
 * measured from north toward east).
 *
 * The great circle is the intersection of the sphere with a plane through the
 * origin. The plane is determined by the position vector and the initial tangent.
 *
 * @param R               Sphere radius (affects nothing in the angular output, included for API clarity).
 * @param theta0          Initial colatitude θ₀ ∈ [0, π].
 * @param phi0            Initial longitude φ₀ ∈ [0, 2π).
 * @param initialAzimuth  Initial heading: 0 = north (−∂_θ), π/2 = east (+∂_φ).
 * @param steps           Number of samples. Default 64 (+ 1 for closure).
 * @returns               Array of (θ, φ) samples for s ∈ [0, 2π].
 */
export function greatCircle(
  R: number,
  theta0: number,
  phi0: number,
  initialAzimuth: number,
  steps: number = 64,
): readonly SphereSample[] {
  void R; // radius only scales 3D position; angles are independent of R
  const result: SphereSample[] = [];

  // Cartesian position of the starting point on the unit sphere.
  const px = Math.sin(theta0) * Math.cos(phi0);
  const py = Math.sin(theta0) * Math.sin(phi0);
  const pz = Math.cos(theta0);

  // Local orthonormal frame at (θ₀, φ₀): north (−∂_θ direction) and east (+∂_φ / sin θ).
  // North: (-cos θ cos φ, -cos θ sin φ, sin θ)
  const eNorth: [number, number, number] = [
    -Math.cos(theta0) * Math.cos(phi0),
    -Math.cos(theta0) * Math.sin(phi0),
    Math.sin(theta0),
  ];
  // East: (-sin φ, cos φ, 0)
  const eEast: [number, number, number] = [-Math.sin(phi0), Math.cos(phi0), 0];

  // Initial tangent vector in Cartesian coordinates.
  const tx = Math.cos(initialAzimuth) * eNorth[0] + Math.sin(initialAzimuth) * eEast[0];
  const ty = Math.cos(initialAzimuth) * eNorth[1] + Math.sin(initialAzimuth) * eEast[1];
  const tz = Math.cos(initialAzimuth) * eNorth[2] + Math.sin(initialAzimuth) * eEast[2];

  // The great circle is parametrised as p cos(s) + t sin(s) for s ∈ [0, 2π].
  for (let i = 0; i <= steps; i++) {
    const s = (i / steps) * 2 * Math.PI;
    const x = px * Math.cos(s) + tx * Math.sin(s);
    const y = py * Math.cos(s) + ty * Math.sin(s);
    const z = pz * Math.cos(s) + tz * Math.sin(s);
    // Convert back to spherical — clamp z to [-1, 1] to guard against float drift.
    const theta = Math.acos(Math.max(-1, Math.min(1, z)));
    const phi = Math.atan2(y, x);
    result.push({ theta, phi });
  }
  return result;
}

// ─── conservedEnergy ─────────────────────────────────────────────────────────

/**
 * Conserved energy along a geodesic of a static metric:
 *   E = g_{tt} (dx^t/dλ) = g[0][0] * v[0].
 *
 * For a static metric in coordinates (t, x^1, ...) the time-translation Killing
 * vector ∂_t implies this quantity is constant along every geodesic. Used in tests
 * to verify that the integrator preserves the conserved charge to within truncation
 * error.
 *
 * @param g   Metric tensor (2D array, n×n) at the current point.
 * @param v   Velocity vector dx^μ/dλ.
 * @returns   g_{tt} v^t.
 */
export function conservedEnergy(
  g: readonly (readonly number[])[],
  v: readonly number[],
): number {
  return g[0][0] * v[0];
}
