import { describe, it, expect } from "vitest";
import { solve } from "@/lib/problems/classical-mechanics/newtons-three-laws/newtons-three-laws-medium-friction-on-flat-surface";

describe("newtons-three-laws-medium-friction-on-flat-surface", () => {
  it("computes normal force correctly", () => {
    const result = solve();
    expect(result.F_normal).toBeCloseTo(117.6798, 4);
  });

  it("computes friction force correctly", () => {
    const result = solve();
    expect(result.F_friction).toBeCloseTo(41.1879, 4);
  });

  it("computes net force correctly", () => {
    const result = solve();
    expect(result.F_net).toBeCloseTo(38.8121, 4);
  });

  it("computes acceleration correctly", () => {
    const result = solve();
    expect(result.a).toBeCloseTo(3.2343, 4);
  });
});
