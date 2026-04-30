import { describe, expect, it } from "vitest";
import { step, totalEnergy, totalMomentum, type Body } from "@/lib/physics/n-body";

function clone(bodies: Body[]): Body[] {
  return bodies.map((b) => ({ ...b }));
}

describe("n-body step (Velocity-Verlet)", () => {
  it("conserves total energy within 1% over 1000 steps for a 2-body circular orbit", () => {
    const initial: Body[] = [
      { id: "a", mass: 1, x: 0, y: 0, vx: 0, vy: 0 },
      { id: "b", mass: 0.001, x: 1, y: 0, vx: 0, vy: 1 },
    ];
    const E0 = totalEnergy(initial);
    let bodies = clone(initial);
    const dt = 0.005;
    for (let i = 0; i < 1000; i++) bodies = step(bodies, dt);
    const E1 = totalEnergy(bodies);
    expect(Math.abs((E1 - E0) / E0)).toBeLessThan(0.01);
  });

  it("conserves total momentum exactly (within float epsilon) over 100 steps", () => {
    const initial: Body[] = [
      { id: "a", mass: 2, x: -1, y: 0, vx: 0, vy: -0.5 },
      { id: "b", mass: 3, x: 1, y: 0, vx: 0, vy: 0.5 },
      { id: "c", mass: 1, x: 0, y: 1, vx: 0.3, vy: 0 },
    ];
    const p0 = totalMomentum(initial);
    let bodies = clone(initial);
    for (let i = 0; i < 100; i++) bodies = step(bodies, 0.01);
    const p1 = totalMomentum(bodies);
    expect(Math.abs(p1.px - p0.px)).toBeLessThan(1e-9);
    expect(Math.abs(p1.py - p0.py)).toBeLessThan(1e-9);
  });

  it("does not produce NaN when two bodies coincide (Plummer softening)", () => {
    const bodies: Body[] = [
      { id: "a", mass: 1, x: 0, y: 0, vx: 0, vy: 0 },
      { id: "b", mass: 1, x: 0, y: 0, vx: 0, vy: 0 },
    ];
    const next = step(bodies, 0.01);
    expect(Number.isFinite(next[0]!.x)).toBe(true);
    expect(Number.isFinite(next[0]!.y)).toBe(true);
    expect(Number.isFinite(next[0]!.vx)).toBe(true);
  });
});
