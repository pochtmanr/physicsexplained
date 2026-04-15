/**
 * Pure projectile-motion helpers. No React, no DOM, no state.
 *
 * Conventions:
 *   - angle is in radians
 *   - +x is to the right, +y is up
 *   - g is the magnitude of gravity (positive); it pulls in the −y direction
 */

export const G_EARTH = 9.80665;

export interface Vec2 {
  x: number;
  y: number;
}

/**
 * Position of a point projectile fired from the origin at speed v
 * and angle θ (measured from the +x axis), after time t.
 */
export function position(
  t: number,
  speed: number,
  angle: number,
  g: number = G_EARTH,
): Vec2 {
  return {
    x: speed * Math.cos(angle) * t,
    y: speed * Math.sin(angle) * t - 0.5 * g * t * t,
  };
}

/**
 * Velocity of a point projectile fired from the origin at speed v
 * and angle θ, after time t.
 */
export function velocity(
  t: number,
  speed: number,
  angle: number,
  g: number = G_EARTH,
): Vec2 {
  return {
    x: speed * Math.cos(angle),
    y: speed * Math.sin(angle) - g * t,
  };
}

/**
 * Time between launch and return to the launch height (y = 0).
 * Equal to 2·v·sinθ/g. Returns 0 for non-positive angles.
 */
export function timeOfFlight(
  speed: number,
  angle: number,
  g: number = G_EARTH,
): number {
  const t = (2 * speed * Math.sin(angle)) / g;
  return t > 0 ? t : 0;
}

/**
 * Horizontal distance travelled between launch and return to
 * launch height. Equal to v²·sin(2θ)/g.
 */
export function range(
  speed: number,
  angle: number,
  g: number = G_EARTH,
): number {
  return (speed * speed * Math.sin(2 * angle)) / g;
}

/**
 * Peak height above the launch point. Equal to (v·sinθ)²/(2g).
 */
export function peakHeight(
  speed: number,
  angle: number,
  g: number = G_EARTH,
): number {
  const vy = speed * Math.sin(angle);
  return (vy * vy) / (2 * g);
}

/**
 * Time to reach peak height. Equal to v·sinθ/g.
 */
export function timeToPeak(
  speed: number,
  angle: number,
  g: number = G_EARTH,
): number {
  const t = (speed * Math.sin(angle)) / g;
  return t > 0 ? t : 0;
}

/**
 * Sample the trajectory at `n` equally spaced time steps between launch
 * and the projectile returning to the launch height. Useful for canvas
 * path drawing.
 */
export function trajectory(
  speed: number,
  angle: number,
  n: number = 64,
  g: number = G_EARTH,
): Vec2[] {
  const tEnd = timeOfFlight(speed, angle, g);
  if (tEnd <= 0) return [{ x: 0, y: 0 }];
  const pts: Vec2[] = [];
  for (let i = 0; i <= n; i++) {
    const t = (i / n) * tEnd;
    pts.push(position(t, speed, angle, g));
  }
  return pts;
}

/**
 * Vector magnitude.
 */
export function mag(v: Vec2): number {
  return Math.hypot(v.x, v.y);
}

/**
 * Angle of a vector with respect to +x axis, in radians.
 */
export function angleOf(v: Vec2): number {
  return Math.atan2(v.y, v.x);
}

/**
 * Vector addition. Returns a new Vec2.
 */
export function add(a: Vec2, b: Vec2): Vec2 {
  return { x: a.x + b.x, y: a.y + b.y };
}

/**
 * Subtract b from a. Returns a new Vec2.
 */
export function sub(a: Vec2, b: Vec2): Vec2 {
  return { x: a.x - b.x, y: a.y - b.y };
}

/**
 * Scalar-vector multiplication.
 */
export function scale(a: Vec2, s: number): Vec2 {
  return { x: a.x * s, y: a.y * s };
}
