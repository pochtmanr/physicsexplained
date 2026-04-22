// lib/physics/circular-motion.ts
/**
 * Circular motion primitives. Pure functions — no side effects, no React.
 */

/** Centripetal acceleration a = v² / r. */
export function centripetalAccel(v: number, r: number): number {
  return (v * v) / r;
}

/** Angular velocity from period: ω = 2π / T. */
export function angularFromPeriod(T: number): number {
  return (2 * Math.PI) / T;
}

/** v = ω r. */
export function linearFromAngular(omega: number, r: number): number {
  return omega * r;
}

/**
 * Orbital velocity for a circular orbit of radius r around a mass with
 * gravitational parameter GM. Derived from setting centripetal acceleration
 * equal to Newtonian gravity: v² / r = GM / r² ⇒ v = √(GM / r).
 */
export function orbitalVelocity(r: number, GM: number): number {
  return Math.sqrt(GM / r);
}
