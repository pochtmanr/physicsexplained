/**
 * Newton's three laws — pure helper functions for the FIG.03 scenes.
 *
 * None of these do any rendering; they just evaluate the physics so the
 * scene components stay thin.
 */

/**
 * First law / coasting block with kinetic friction.
 *
 * A block of mass m starts at position x0 moving with velocity v0. The
 * surface exerts a kinetic-friction deceleration of mu·g opposite the
 * direction of motion. Returns {x, v} at time t, stopping cleanly once
 * the block has come to rest.
 */
export interface CoastState {
  x: number;
  v: number;
  stopped: boolean;
}

export function coastWithFriction(
  t: number,
  v0: number,
  mu: number,
  g = 9.80665,
): CoastState {
  if (v0 <= 0) return { x: 0, v: 0, stopped: true };
  const a = -mu * g;
  if (mu <= 0) {
    return { x: v0 * t, v: v0, stopped: false };
  }
  const tStop = -v0 / a; // positive
  if (t >= tStop) {
    const xStop = v0 * tStop + 0.5 * a * tStop * tStop;
    return { x: xStop, v: 0, stopped: true };
  }
  return {
    x: v0 * t + 0.5 * a * t * t,
    v: v0 + a * t,
    stopped: false,
  };
}

/**
 * Second law — acceleration from force and mass.
 */
export function acceleration(force: number, mass: number): number {
  if (mass <= 0) return 0;
  return force / mass;
}

/**
 * Second law kinematics: starting from rest, constant force on a mass m.
 * Returns position and velocity at time t.
 */
export function constantForceMotion(
  t: number,
  force: number,
  mass: number,
): { x: number; v: number; a: number } {
  const a = acceleration(force, mass);
  return {
    a,
    v: a * t,
    x: 0.5 * a * t * t,
  };
}

/**
 * Third law — two skaters at rest push each other apart with equal and
 * opposite impulse J (the force × duration of the push). By momentum
 * conservation, v_A = -J/m_A and v_B = +J/m_B.
 */
export interface SkaterVelocities {
  vA: number;
  vB: number;
}

export function skaterVelocities(
  massA: number,
  massB: number,
  impulse: number,
): SkaterVelocities {
  return {
    vA: -impulse / Math.max(massA, 1e-6),
    vB: impulse / Math.max(massB, 1e-6),
  };
}
