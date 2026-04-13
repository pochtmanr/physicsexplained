/**
 * Elliptic integral utilities.
 */

/**
 * Complete elliptic integral of the first kind K(k) using the
 * arithmetic-geometric mean. k is the modulus (NOT the parameter m = k^2).
 * Converges to full double precision in ~10 iterations.
 */
export function completeEllipticK(k: number): number {
  let a = 1;
  let b = Math.sqrt(1 - k * k);
  for (let i = 0; i < 20; i++) {
    const aNext = (a + b) / 2;
    const bNext = Math.sqrt(a * b);
    if (Math.abs(a - b) < 1e-15) break;
    a = aNext;
    b = bNext;
  }
  return Math.PI / (2 * a);
}

/**
 * Ratio T(theta0) / T_small_angle for a simple pendulum.
 * Uses the elliptic integral formula.
 */
export function periodRatio(theta0: number): number {
  const k = Math.sin(theta0 / 2);
  return (2 / Math.PI) * completeEllipticK(k);
}
