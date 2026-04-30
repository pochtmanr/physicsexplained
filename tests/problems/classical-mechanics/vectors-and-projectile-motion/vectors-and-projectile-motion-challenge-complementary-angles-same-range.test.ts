import { describe, it, expect } from "vitest";
import {
  inputs,
  solve,
} from "@/lib/problems/classical-mechanics/vectors-and-projectile-motion/vectors-and-projectile-motion-challenge-complementary-angles-same-range";
import { G_EARTH } from "@/lib/physics/projectile";

describe("challenge — complementary angles yield the same range", () => {
  const result = solve();

  const v_0      = inputs.v_0.value;
  const R_target = inputs.R_target.value;
  const g        = inputs.g.value;

  it("inputs are sane (v_0=50, R_target=200, g=G_EARTH)", () => {
    expect(v_0).toBe(50);
    expect(R_target).toBe(200);
    expect(g).toBe(G_EARTH);
  });

  it("sin2theta = R_target * g / v_0^2", () => {
    expect(result.sin2theta).toBeCloseTo((R_target * g) / (v_0 * v_0), 10);
  });

  it("theta_low + theta_high = pi/2 (complementary pair)", () => {
    expect(result.theta_low + result.theta_high).toBeCloseTo(Math.PI / 2, 10);
  });

  it("theta_low < theta_high (low is the shallow trajectory)", () => {
    expect(result.theta_low).toBeLessThan(result.theta_high);
  });

  it("both angles are in (0, pi/2)", () => {
    expect(result.theta_low).toBeGreaterThan(0);
    expect(result.theta_low).toBeLessThan(Math.PI / 2);
    expect(result.theta_high).toBeGreaterThan(0);
    expect(result.theta_high).toBeLessThan(Math.PI / 2);
  });

  it("R_low ≈ R_target (within 1 mm)", () => {
    expect(result.R_low).toBeCloseTo(R_target, 3);
  });

  it("R_high ≈ R_target (within 1 mm)", () => {
    expect(result.R_high).toBeCloseTo(R_target, 3);
  });

  it("R_low ≈ R_high (same range, different trajectory)", () => {
    expect(result.R_low).toBeCloseTo(result.R_high, 10);
  });

  it("T_high > T_low (high arc stays in the air longer)", () => {
    expect(result.T_high).toBeGreaterThan(result.T_low);
  });

  it("delta_T = T_high - T_low (positive)", () => {
    expect(result.delta_T).toBeCloseTo(result.T_high - result.T_low, 10);
    expect(result.delta_T).toBeGreaterThan(0);
  });

  it("all outputs are finite", () => {
    for (const [, v] of Object.entries(result)) {
      expect(isFinite(v)).toBe(true);
    }
  });
});
