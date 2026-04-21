/**
 * The principle of least action — small pure helpers for FIG.28.
 *
 * All quantities SI:
 *   t   time           (s)
 *   x,y position       (m)
 *   v   speed          (m/s)
 *   m   mass           (kg)
 *   g   gravity        (m/s²)
 *   S   action         (J·s = kg·m²/s)
 *   n   refractive index (dimensionless)
 *
 * Domain: classical point particles in 1D gravity, and Fermat-style
 * ray optics between two media. Nothing in this file touches the DOM.
 */

import { g_SI } from "./constants";

// -----------------------------------------------------------------------------
// Action integrals
// -----------------------------------------------------------------------------

/**
 * Lagrangian L = T − V for a 1D particle under uniform gravity, with
 * vertical coordinate y (positive up) and velocity v = dy/dt.
 *
 *   L(y, v) = ½ m v² − m g y
 */
export function lagrangian1D(
  m: number,
  v: number,
  y: number,
  g: number = g_SI,
): number {
  return 0.5 * m * v * v - m * g * y;
}

/**
 * Action S = ∫ L(y(t), ẏ(t)) dt for a trial vertical trajectory sampled
 * at N+1 uniform points on [0, T]. Uses Simpson composite when N is
 * even, trapezoidal otherwise.
 *
 *   S[y] = ∫₀ᵀ [½ m ẏ(t)² − m g y(t)] dt
 *
 * The derivative is approximated with centred finite differences, forward
 * at t=0 and backward at t=T. For the analytic parabola this returns the
 * Hamilton stationary value to within a few parts in 10⁴ at N≥200.
 */
export function actionFromSamples(
  ys: readonly number[],
  T: number,
  m: number,
  g: number = g_SI,
): number {
  const n = ys.length - 1;
  if (n < 2) throw new Error("actionFromSamples: need at least 3 samples");
  if (T <= 0) throw new Error("actionFromSamples: T must be positive");

  const dt = T / n;
  const L = new Array<number>(n + 1);
  for (let i = 0; i <= n; i++) {
    let v: number;
    if (i === 0) {
      v = (ys[1] - ys[0]) / dt;
    } else if (i === n) {
      v = (ys[n] - ys[n - 1]) / dt;
    } else {
      v = (ys[i + 1] - ys[i - 1]) / (2 * dt);
    }
    L[i] = lagrangian1D(m, v, ys[i], g);
  }

  // Simpson if n even, trapezoid otherwise
  if (n % 2 === 0) {
    let sum = L[0] + L[n];
    for (let i = 1; i < n; i += 2) sum += 4 * L[i];
    for (let i = 2; i < n; i += 2) sum += 2 * L[i];
    return (sum * dt) / 3;
  }
  let sum = 0.5 * (L[0] + L[n]);
  for (let i = 1; i < n; i++) sum += L[i];
  return sum * dt;
}

/**
 * Closed-form action along the ACTUAL free-fall trajectory between
 * (t=0, y=y0) and (t=T, y=yT) in uniform gravity — the physical path
 * that satisfies Newton's second law.
 *
 *   y(t) = y0 + ((yT − y0)/T + ½ g T) t − ½ g t²
 *
 * For this path, S evaluates to
 *
 *   S* = (m/6) · [3 (yT − y0)² / T  −  3 g T (yT − y0)
 *                 − g² T³ / 4  −  6 g y0 T]
 *
 * which is the Hamilton principal function for 1D free fall. Real paths
 * minimise S relative to nearby trial paths with the same endpoints.
 */
export function freeFallActionExact(
  y0: number,
  yT: number,
  T: number,
  m: number,
  g: number = g_SI,
): number {
  if (T <= 0) throw new Error("freeFallActionExact: T must be positive");
  const dy = yT - y0;
  return (
    (m / 6) *
    ((3 * dy * dy) / T - 3 * g * T * dy - (g * g * T * T * T) / 4 - 6 * g * y0 * T)
  );
}

/**
 * A one-parameter family of trial paths perturbing the true free-fall
 * trajectory by a half-sine "bump":
 *
 *   y_ε(t) = y_true(t) + ε · sin(π t / T)
 *
 * Returns y at the requested time for a given bump amplitude ε. At ε=0
 * this coincides with the physical path; nearby ε should give actions
 * strictly greater than the ε=0 value — the visible signature of
 * stationarity.
 */
export function perturbedFreeFall(
  t: number,
  T: number,
  y0: number,
  yT: number,
  epsilon: number,
  g: number = g_SI,
): number {
  const vTrue0 = (yT - y0) / T + 0.5 * g * T;
  const yTrue = y0 + vTrue0 * t - 0.5 * g * t * t;
  return yTrue + epsilon * Math.sin((Math.PI * t) / T);
}

// -----------------------------------------------------------------------------
// Fermat's principle — least-time optics
// -----------------------------------------------------------------------------

/**
 * Total travel time for a light ray that goes from A=(0, h1) in medium 1
 * (speed v1) to B=(d, −h2) in medium 2 (speed v2), crossing the y=0
 * interface at horizontal position x.
 *
 *   t(x) = √(x² + h1²)/v1  +  √((d−x)² + h2²)/v2
 *
 * h1 and h2 are perpendicular distances from the interface; both must be
 * strictly positive. Fermat: the real ray minimises t(x) with respect
 * to x, and the minimiser satisfies sin θ1 / v1 = sin θ2 / v2 — Snell's
 * law.
 */
export function fermatTime(
  x: number,
  d: number,
  h1: number,
  h2: number,
  v1: number,
  v2: number,
): number {
  if (h1 <= 0 || h2 <= 0) {
    throw new Error("fermatTime: h1 and h2 must be positive");
  }
  if (v1 <= 0 || v2 <= 0) {
    throw new Error("fermatTime: speeds must be positive");
  }
  return Math.sqrt(x * x + h1 * h1) / v1 + Math.sqrt((d - x) * (d - x) + h2 * h2) / v2;
}

/**
 * Analytic solution to ∂t/∂x = 0 — the x at which the Fermat travel
 * time is stationary, which is the unique minimum for the convex
 * geometry used above. Solved by Newton iteration on
 *
 *   f(x) = sin θ1 / v1 − sin θ2 / v2
 *
 *        = x / (v1 √(x² + h1²))  −  (d−x) / (v2 √((d−x)² + h2²))
 *
 * Root is bracketed in (0, d). Converges quadratically; 20 iterations
 * is ample for double precision.
 */
export function fermatOptimalX(
  d: number,
  h1: number,
  h2: number,
  v1: number,
  v2: number,
): number {
  if (d <= 0) throw new Error("fermatOptimalX: d must be positive");

  // Start from the geometric midpoint weighted by medium speeds.
  let x = (d * v1) / (v1 + v2);
  for (let i = 0; i < 50; i++) {
    const r1 = Math.sqrt(x * x + h1 * h1);
    const r2 = Math.sqrt((d - x) * (d - x) + h2 * h2);
    const f = x / (v1 * r1) - (d - x) / (v2 * r2);
    // f'(x) = h1² / (v1 r1³)  +  h2² / (v2 r2³)   (always > 0)
    const fp = (h1 * h1) / (v1 * r1 * r1 * r1) + (h2 * h2) / (v2 * r2 * r2 * r2);
    const dx = f / fp;
    x -= dx;
    if (Math.abs(dx) < 1e-14) break;
    // Keep bracketed
    if (x < 0) x = 0;
    if (x > d) x = d;
  }
  return x;
}

/**
 * Angles the Fermat ray makes with the interface normal, measured as
 * sin θ = opposite/hypotenuse from the crossing point at x.
 */
export function fermatAngles(
  x: number,
  d: number,
  h1: number,
  h2: number,
): { sinTheta1: number; sinTheta2: number } {
  const r1 = Math.sqrt(x * x + h1 * h1);
  const r2 = Math.sqrt((d - x) * (d - x) + h2 * h2);
  return { sinTheta1: x / r1, sinTheta2: (d - x) / r2 };
}

/**
 * Snell's law residual at crossing position x. Zero iff the ray is
 * stationary:
 *
 *   n1 sin θ1 = n2 sin θ2       ⇔       sin θ1 / v1 = sin θ2 / v2
 *
 * (with n = c/v, the two forms are equivalent up to a factor of c).
 */
export function snellResidual(
  x: number,
  d: number,
  h1: number,
  h2: number,
  v1: number,
  v2: number,
): number {
  const { sinTheta1, sinTheta2 } = fermatAngles(x, d, h1, h2);
  return sinTheta1 / v1 - sinTheta2 / v2;
}
