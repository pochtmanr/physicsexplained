import { describe, it, expect } from "vitest";
import {
  inputs,
  solve,
} from "@/lib/problems/classical-mechanics/beyond-small-angles/beyond-small-angles-easy-percent-error-at-30-degrees";

describe("beyond-small-angles-easy-percent-error-at-30-degrees", () => {
  const result = solve();

  it("inputs have expected canonical values", () => {
    expect(inputs.theta_0.value).toBeCloseTo(Math.PI / 6, 10);
    expect(inputs.L.value).toBe(1.0);
    expect(inputs.g.value).toBe(9.80665);
  });

  it("step: T_small = 2π√(L/g)", () => {
    // 2π√(1.0/9.80665) ≈ 2.0064
    expect(result.T_small).toBeCloseTo(2.0064092925890407, 6);
  });

  it("step: T_exact via elliptic integral", () => {
    // 4√(1/g)·K(sin(π/12)) ≈ 2.04134
    expect(result.T_exact).toBeCloseTo(2.0413384658583684, 5);
  });

  it("step: pct_err = (T_exact − T_small) / T_exact × 100", () => {
    // ≈ 1.711 %
    expect(result.pct_err).toBeCloseTo(1.7110917103421301, 3);
  });

  it("T_exact > T_small (period stretches at large angles)", () => {
    expect(result.T_exact).toBeGreaterThan(result.T_small);
  });

  it("finalAnswerStepId value: pct_err ≈ 1.71 %", () => {
    expect(result.pct_err).toBeCloseTo(1.711, 2);
  });
});
