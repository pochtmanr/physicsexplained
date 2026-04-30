export interface Body {
  id: string;
  mass: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
}

export interface NBodyOptions {
  G?: number;
  softening?: number;
}

const DEFAULT_G = 1;
const DEFAULT_SOFTENING = 0.05;

function accelerations(
  bodies: Body[],
  G: number,
  softening: number,
): Array<{ ax: number; ay: number }> {
  const eps2 = softening * softening;
  const acc = bodies.map(() => ({ ax: 0, ay: 0 }));
  for (let i = 0; i < bodies.length; i++) {
    const bi = bodies[i]!;
    for (let j = i + 1; j < bodies.length; j++) {
      const bj = bodies[j]!;
      const dx = bj.x - bi.x;
      const dy = bj.y - bi.y;
      const r2 = dx * dx + dy * dy + eps2;
      const inv = 1 / Math.sqrt(r2 * r2 * r2); // 1 / r^3 (softened)
      const fx = G * dx * inv;
      const fy = G * dy * inv;
      acc[i]!.ax += fx * bj.mass;
      acc[i]!.ay += fy * bj.mass;
      acc[j]!.ax -= fx * bi.mass;
      acc[j]!.ay -= fy * bi.mass;
    }
  }
  return acc;
}

/**
 * Velocity-Verlet integrator. Symplectic — conserves energy over long runs.
 * Pure: does not mutate input.
 */
export function step(
  bodies: Body[],
  dt: number,
  opts: NBodyOptions = {},
): Body[] {
  const G = opts.G ?? DEFAULT_G;
  const softening = opts.softening ?? DEFAULT_SOFTENING;
  const half = dt * 0.5;

  const a0 = accelerations(bodies, G, softening);

  // Drift positions by full dt with kicked velocities (kick-drift-kick)
  const drifted = bodies.map((b, i) => ({
    ...b,
    vx: b.vx + a0[i]!.ax * half,
    vy: b.vy + a0[i]!.ay * half,
  }));
  const moved = drifted.map((b) => ({
    ...b,
    x: b.x + b.vx * dt,
    y: b.y + b.vy * dt,
  }));

  const a1 = accelerations(moved, G, softening);
  return moved.map((b, i) => ({
    ...b,
    vx: b.vx + a1[i]!.ax * half,
    vy: b.vy + a1[i]!.ay * half,
  }));
}

export function totalEnergy(
  bodies: Body[],
  opts: NBodyOptions = {},
): number {
  const G = opts.G ?? DEFAULT_G;
  const softening = opts.softening ?? DEFAULT_SOFTENING;
  const eps2 = softening * softening;
  let kinetic = 0;
  for (const b of bodies) {
    kinetic += 0.5 * b.mass * (b.vx * b.vx + b.vy * b.vy);
  }
  let potential = 0;
  for (let i = 0; i < bodies.length; i++) {
    for (let j = i + 1; j < bodies.length; j++) {
      const bi = bodies[i]!;
      const bj = bodies[j]!;
      const dx = bj.x - bi.x;
      const dy = bj.y - bi.y;
      const r = Math.sqrt(dx * dx + dy * dy + eps2);
      potential -= (G * bi.mass * bj.mass) / r;
    }
  }
  return kinetic + potential;
}

export function totalMomentum(bodies: Body[]): { px: number; py: number } {
  let px = 0;
  let py = 0;
  for (const b of bodies) {
    px += b.mass * b.vx;
    py += b.mass * b.vy;
  }
  return { px, py };
}

export function centerOfMass(bodies: Body[]): { x: number; y: number } {
  const M = bodies.reduce((s, b) => s + b.mass, 0);
  if (M === 0) return { x: 0, y: 0 };
  let x = 0;
  let y = 0;
  for (const b of bodies) {
    x += (b.mass * b.x) / M;
    y += (b.mass * b.y) / M;
  }
  return { x, y };
}
