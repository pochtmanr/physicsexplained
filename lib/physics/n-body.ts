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

/**
 * Physical body radius in **world units**, derived from mass. Independent of
 * camera zoom so collisions are invariant under pan / zoom — what looks like
 * a touch on screen always corresponds to the same physical separation.
 *
 * Tuning: at the default 80 px/unit camera, this matches the previous fixed
 * pixel sizes within ~10%. A mass-1 body is ~5 px, a mass-100 sun ~22 px.
 */
export function bodyRadius(mass: number): number {
  return 0.04 + Math.sqrt(Math.max(mass, 0)) * 0.025;
}

/**
 * Perfectly-inelastic collision: bigger body wins, smaller is absorbed.
 * Returns the merged body. Conserves total momentum and total mass; kinetic
 * energy is dissipated (not conserved — that's the "perfectly inelastic"
 * part).
 *
 * The survivor keeps its id so its trail and palette color remain continuous.
 * Tie-break on equal mass goes to the first argument.
 */
export function mergeBodies(a: Body, b: Body): Body {
  const M = a.mass + b.mass;
  const survivor = a.mass >= b.mass ? a : b;
  return {
    id: survivor.id,
    mass: M,
    x: (a.mass * a.x + b.mass * b.x) / M,
    y: (a.mass * a.y + b.mass * b.y) / M,
    vx: (a.mass * a.vx + b.mass * b.vx) / M,
    vy: (a.mass * a.vy + b.mass * b.vy) / M,
  };
}

/**
 * Mass-ratio threshold above which an overlapping pair is *absorbed* (small
 * body disappears into the big one) instead of bouncing. Below this ratio,
 * collisions are elastic. Tuned so a "planet" (mass 1) bouncing into a "sun"
 * (mass 100) is a 1:100 = absorbed event, but two near-equal bodies bounce.
 */
const ABSORB_MASS_RATIO = 25;

/**
 * Coefficient of restitution for the elastic-bounce path. 1.0 = perfectly
 * elastic (kinetic energy fully conserved), 0.0 = perfectly inelastic
 * (merge). We use 0.95 so collisions feel real but don't permanently
 * resonate at exact integration error magnitudes.
 */
const RESTITUTION = 0.95;

/**
 * 2D elastic-billiard collision response. Decomposes both velocities along
 * the line of centers (normal) and the perpendicular (tangent), exchanges
 * the normal components via the 1D elastic formula, and reconstructs.
 * Conserves linear momentum exactly; conserves kinetic energy up to the
 * `RESTITUTION` factor.
 *
 * Also pushes the bodies apart so they don't re-collide on the next sub-step
 * (positional interpenetration → infinite bounce loop otherwise).
 *
 * Returns `[a', b']` as new objects; does not mutate inputs.
 */
export function bounceBodies(a: Body, b: Body): [Body, Body] {
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  const distSq = dx * dx + dy * dy;
  const dist = Math.sqrt(distSq) || 1e-9; // guard against perfect overlap
  const nx = dx / dist;
  const ny = dy / dist;
  // Tangent = perpendicular to normal
  const tx = -ny;
  const ty = nx;

  // Project velocities onto normal and tangent axes
  const v1n = a.vx * nx + a.vy * ny;
  const v1t = a.vx * tx + a.vy * ty;
  const v2n = b.vx * nx + b.vy * ny;
  const v2t = b.vx * tx + b.vy * ty;

  // 1D elastic exchange of normal components (with restitution).
  // Standard formulas:
  //   v1n' = ((m1 - e*m2) v1n + (1+e) m2 v2n) / (m1 + m2)
  //   v2n' = ((1+e) m1 v1n + (m2 - e*m1) v2n) / (m1 + m2)
  const m1 = a.mass;
  const m2 = b.mass;
  const M = m1 + m2;
  const e = RESTITUTION;
  const v1nAfter = ((m1 - e * m2) * v1n + (1 + e) * m2 * v2n) / M;
  const v2nAfter = ((1 + e) * m1 * v1n + (m2 - e * m1) * v2n) / M;

  // Reconstruct velocity vectors. Tangential components unchanged.
  const a2: Body = {
    ...a,
    vx: v1nAfter * nx + v1t * tx,
    vy: v1nAfter * ny + v1t * ty,
  };
  const b2: Body = {
    ...b,
    vx: v2nAfter * nx + v2t * tx,
    vy: v2nAfter * ny + v2t * ty,
  };

  // Position correction: push them apart along the normal until just
  // touching, splitting the overlap by inverse-mass so the heavier body
  // moves less. Without this they'd interpenetrate and immediately bounce
  // again next frame.
  const sumR = bodyRadius(m1) + bodyRadius(m2);
  const overlap = sumR - dist;
  if (overlap > 0) {
    const wA = m2 / M; // body A absorbs more correction if it's lighter
    const wB = m1 / M;
    a2.x -= nx * overlap * wA;
    a2.y -= ny * overlap * wA;
    b2.x += nx * overlap * wB;
    b2.y += ny * overlap * wB;
  }

  return [a2, b2];
}

/**
 * Resolve every overlapping pair. The default behaviour is **elastic
 * bounce** (2D billiard physics, momentum + kinetic energy conserved up to
 * `RESTITUTION`). When the mass ratio between the pair exceeds
 * `ABSORB_MASS_RATIO`, the small body is *absorbed* by the large one
 * instead — visually "the small one disappears" while preserving total
 * momentum (use `mergeBodies`).
 *
 * Runs to fixed point so chain collisions all complete in one call. Returns
 * a *new* array; does not mutate. Collision uses world-unit radii from
 * `bodyRadius`, so the result is camera-zoom invariant.
 */
export function resolveCollisions(bodies: Body[]): Body[] {
  let bs = bodies;
  // Bound iterations defensively — chains of (n-1) absorptions or many
  // simultaneous bounces.
  const maxPasses = Math.max(8, bs.length * 2);
  for (let pass = 0; pass < maxPasses; pass++) {
    let touched = false;
    outer: for (let i = 0; i < bs.length; i++) {
      const bi = bs[i]!;
      for (let j = i + 1; j < bs.length; j++) {
        const bj = bs[j]!;
        const dx = bi.x - bj.x;
        const dy = bi.y - bj.y;
        const sumR = bodyRadius(bi.mass) + bodyRadius(bj.mass);
        if (dx * dx + dy * dy < sumR * sumR) {
          // Approach test: only respond when bodies are moving *towards* each
          // other (sticky bodies stuck post-bounce shouldn't keep bouncing).
          const rvx = bj.vx - bi.vx;
          const rvy = bj.vy - bi.vy;
          // Vector from bi to bj is (-dx, -dy); approach when dot >= 0.
          const approach = rvx * -dx + rvy * -dy;

          const heavy = Math.max(bi.mass, bj.mass);
          const light = Math.min(bi.mass, bj.mass);
          if (heavy / light >= ABSORB_MASS_RATIO) {
            // Absorption: tiny mote into a giant. Smaller dies, big keeps id.
            const m = mergeBodies(bi, bj);
            bs = [...bs.slice(0, i), m, ...bs.slice(i + 1, j), ...bs.slice(j + 1)];
            touched = true;
            break outer;
          }
          if (approach <= 0) continue; // already separating; ignore
          const [bi2, bj2] = bounceBodies(bi, bj);
          bs = [...bs.slice(0, i), bi2, ...bs.slice(i + 1, j), bj2, ...bs.slice(j + 1)];
          touched = true;
          break outer;
        }
      }
    }
    if (!touched) break;
  }
  return bs;
}

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
