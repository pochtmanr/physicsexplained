import { describe, expect, it } from "vitest";
import { resolveCollisions, step, type Body } from "@/lib/physics/n-body";
import { advanceSimulation, SIM_DT, MAX_STEPS_PER_FRAME } from "@/lib/physics/advance";

// Chaotic starting state (Burrau's pythagorean problem) — maximally sensitive
// to any step-size difference, which is exactly what we're guarding against.
function startBodies(): Body[] {
  return [
    { id: "m3", mass: 3, x: 1, y: 3, vx: 0, vy: 0 },
    { id: "m4", mass: 4, x: -2, y: -1, vx: 0, vy: 0 },
    { id: "m5", mass: 5, x: 1, y: -1, vx: 0, vy: 0 },
  ];
}

/** Ground truth: n integration steps of exactly SIM_DT each. */
function integrateReference(bodies: Body[], nSteps: number): Body[] {
  let bs = bodies;
  for (let i = 0; i < nSteps; i++) bs = resolveCollisions(step(bs, SIM_DT));
  return bs;
}

describe("advanceSimulation", () => {
  it("trajectory depends only on total step count, never on frame pacing", () => {
    // 60 Hz Mac vs jittery 144 Hz Windows with frame drops.
    const steady = Array.from({ length: 120 }, () => 1 / 60);
    const jittery = Array.from({ length: 240 }, (_, i) =>
      i % 7 === 0 ? 1 / 30 : 1 / 144,
    );
    for (const dts of [steady, jittery]) {
      let bs = startBodies();
      let acc = 0;
      let total = 0;
      for (const dt of dts) {
        const r = advanceSimulation(bs, acc, dt, 1);
        bs = r.bodies;
        acc = r.accumulator;
        total += r.steps;
      }
      // toEqual on numbers is exact — proves every step used exactly SIM_DT.
      expect(bs).toEqual(integrateReference(startBodies(), total));
    }
  });

  it("carries the fractional remainder to the next frame", () => {
    const r1 = advanceSimulation(startBodies(), 0, 0.003, 1);
    expect(r1.steps).toBe(0);
    expect(r1.accumulator).toBeCloseTo(0.003, 12);
    const r2 = advanceSimulation(r1.bodies, r1.accumulator, 0.003, 1);
    expect(r2.steps).toBe(1);
    expect(r2.accumulator).toBeCloseTo(0.001, 12);
  });

  it("scales sim time by speed without losing time", () => {
    // 0.01s × 4 = 0.04s of sim time ≈ 8 steps; float rounding may bank the
    // last step in the accumulator instead — either way nothing is lost.
    const r = advanceSimulation(startBodies(), 0, 0.01, 4);
    expect(r.steps).toBeGreaterThanOrEqual(7);
    expect(r.steps).toBeLessThanOrEqual(8);
    expect(r.steps * SIM_DT + r.accumulator).toBeCloseTo(0.04, 12);
  });

  it("caps steps per frame and drops the excess backlog (spiral-of-death guard)", () => {
    const r = advanceSimulation(startBodies(), 0, 60, 10); // absurd frame
    expect(r.steps).toBe(MAX_STEPS_PER_FRAME);
    expect(r.accumulator).toBeLessThan(SIM_DT);
  });
});
