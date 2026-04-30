import { describe, it, expect } from "vitest";
import { solve } from "@/lib/problems/classical-mechanics/newtons-three-laws/newtons-three-laws-exam-block-on-incline-with-friction";

describe("newtons-three-laws-exam-block-on-incline-with-friction", () => {
  it("computes angle in radians correctly", () => {
    const result = solve();
    expect(result.theta_rad).toBeCloseTo(0.6109, 4);
  });

  it("computes gravity component along incline correctly", () => {
    const result = solve();
    expect(result.F_gravity_parallel).toBeCloseTo(84.3730, 4);
  });

  it("computes normal force correctly", () => {
    const result = solve();
    expect(result.F_normal).toBeCloseTo(120.4971, 4);
  });

  it("computes friction force correctly", () => {
    const result = solve();
    expect(result.F_friction).toBeCloseTo(24.0994, 4);
  });

  it("computes net force correctly", () => {
    const result = solve();
    expect(result.F_net).toBeCloseTo(60.2735, 4);
  });

  it("computes acceleration via slideAcceleration correctly", () => {
    const result = solve();
    expect(result.a).toBeCloseTo(4.0182, 4);
  });

  it("acceleration cross-check matches (F_net/m)", () => {
    const result = solve();
    expect(result.a_check).toBeCloseTo(4.0182, 4);
  });
});
