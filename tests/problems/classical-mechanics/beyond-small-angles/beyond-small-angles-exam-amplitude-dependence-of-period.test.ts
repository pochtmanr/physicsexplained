import { describe, it, expect } from "vitest";
import {
  inputs,
  solve,
} from "@/lib/problems/classical-mechanics/beyond-small-angles/beyond-small-angles-exam-amplitude-dependence-of-period";

describe("beyond-small-angles-exam-amplitude-dependence-of-period", () => {
  const result = solve();

  it("inputs have expected canonical values", () => {
    expect(inputs.theta_0.value).toBe(1.4);
    expect(inputs.L.value).toBe(1.0);
    expect(inputs.g.value).toBe(9.80665);
  });

  it("step: T_small = 2π√(L/g)", () => {
    // 2π√(1/9.80665) ≈ 2.0064
    expect(result.T_small).toBeCloseTo(2.0064092925890407, 6);
  });

  it("step: T_exact via elliptic integral at θ₀ = 1.4 rad", () => {
    // ≈ 2.2839
    expect(result.T_exact).toBeCloseTo(2.28394927191036, 4);
  });

  it("step: pct_stretch = (T_exact − T_small) / T_small × 100", () => {
    // ≈ 13.83 %
    expect(result.pct_stretch).toBeCloseTo(13.832670150923487, 2);
  });

  it("step: n_cycles = T_small / (T_exact − T_small)", () => {
    // ≈ 7.23 cycles before one full period of lag
    expect(result.n_cycles).toBeCloseTo(
      result.T_small / (result.T_exact - result.T_small),
      5,
    );
    expect(result.n_cycles).toBeCloseTo(7.23, 1);
  });

  it("T_exact > T_small", () => {
    expect(result.T_exact).toBeGreaterThan(result.T_small);
  });

  it("T_exact matches series expansion within 5e-3 relative at θ₀ = 1.4", () => {
    const T_series =
      result.T_small * (1 + 1.4 ** 2 / 16 + (11 * 1.4 ** 4) / 3072);
    const relErr = Math.abs(T_series - result.T_exact) / result.T_exact;
    expect(relErr).toBeLessThan(5e-3);
  });

  it("finalAnswerStepId value: n_cycles ≈ 7.2", () => {
    expect(result.n_cycles).toBeCloseTo(7.2, 0);
  });
});
