/**
 * Cycloid geometry and tautochrone physics.
 *
 * A cycloid is the curve traced by a point on the rim of a circle of
 * radius R rolling along a straight line.
 *   x(t) = R * (t - sin(t))
 *   y(t) = R * (1 - cos(t))
 */

export interface CycloidPoint {
  x: number;
  y: number;
}

/**
 * Generate N points along one arch of a cycloid (parameter t in [0, 2*pi]).
 */
export function cycloidArch(R: number, N: number): CycloidPoint[] {
  const points: CycloidPoint[] = [];
  for (let i = 0; i < N; i++) {
    const t = (2 * Math.PI * i) / (N - 1);
    points.push({
      x: R * (t - Math.sin(t)),
      y: R * (1 - Math.cos(t)),
    });
  }
  return points;
}

/**
 * Center of the rolling circle at parameter t.
 */
export function rollingCircleCenter(R: number, t: number): CycloidPoint {
  return {
    x: R * t,
    y: R,
  };
}

/**
 * Point on the rim (generating point) at parameter t.
 * This traces the cycloid itself.
 */
export function generatingPoint(R: number, t: number): CycloidPoint {
  return {
    x: R * (t - Math.sin(t)),
    y: R * (1 - Math.cos(t)),
  };
}

/**
 * Time for an object to slide to the bottom of a cycloidal track
 * (tautochrone property): T = pi * sqrt(R / g).
 * Independent of starting position.
 */
export function tautochroneTime(R: number, g: number): number {
  return Math.PI * Math.sqrt(R / g);
}
