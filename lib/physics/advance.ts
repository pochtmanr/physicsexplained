import { resolveCollisions, step, type Body } from "./n-body";

/**
 * The one and only integration step size. Every machine integrates with
 * exactly this dt, so the same starting state produces bit-identical
 * trajectories regardless of refresh rate or frame pacing.
 */
export const SIM_DT = 0.005;

/**
 * Spiral-of-death guard: worst legitimate frame is the rAF clamp (0.1 s)
 * at max speed (10×) → 0.1 × 10 / 0.005 = 200 steps. Anything beyond that
 * is a pathological stall; we let the sim fall behind rather than freeze.
 */
export const MAX_STEPS_PER_FRAME = 200;

export interface AdvanceResult {
  bodies: Body[];
  /** Fractional sim-time remainder (< simDt) to feed into the next frame. */
  accumulator: number;
  /** Integration steps actually taken this frame. */
  steps: number;
}

/**
 * Classic fixed-timestep accumulator ("Fix Your Timestep"). Frame time is
 * banked into the accumulator; physics advances in whole SIM_DT steps and
 * the remainder carries over — never a variable-sized step.
 */
export function advanceSimulation(
  bodies: Body[],
  accumulator: number,
  frameDt: number,
  speed: number,
  simDt: number = SIM_DT,
  maxSteps: number = MAX_STEPS_PER_FRAME,
): AdvanceResult {
  let acc = accumulator + frameDt * speed;
  let bs = bodies;
  let steps = 0;
  while (acc >= simDt && steps < maxSteps) {
    bs = resolveCollisions(step(bs, simDt));
    acc -= simDt;
    steps++;
  }
  // Guard tripped: drop the un-integrated backlog so time debt can't
  // snowball across frames — the sim runs slower instead of freezing.
  if (acc >= simDt) acc = acc % simDt;
  return { bodies: bs, accumulator: acc, steps };
}
