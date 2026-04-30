import { describe, it, expect } from "vitest";
import {
  inputs,
  solve,
} from "@/lib/problems/classical-mechanics/beyond-small-angles/beyond-small-angles-hard-large-angle-period-from-elliptic-integral";

describe("beyond-small-angles-hard-large-angle-period-from-elliptic-integral", () => {
  const result = solve();

  it("inputs have expected canonical values", () => {
    expect(inputs.theta_0.value).toBe(1.2);
    expect(inputs.L.value).toBe(2.0);
    expect(inputs.g.value).toBe(9.80665);
  });

  it("step: k = sin(θ₀/2)", () => {
    // sin(0.6) ≈ 0.56464
    expect(result.k).toBeCloseTo(Math.sin(0.6), 10);
  });

  it("step: T_small = 2π√(L/g)", () => {
    // 2π√(2/9.80665) ≈ 2.8375
    expect(result.T_small).toBeCloseTo(2.8374912332508284, 6);
  });

  it("step: T_exact via K(k)", () => {
    // 4√(2/g)·K(sin(0.6)) ≈ 3.1162
    expect(result.T_exact).toBeCloseTo(3.116161386152697, 5);
  });

  it("step: ratio = T_exact / T_small", () => {
    // ≈ 1.0982
    expect(result.ratio).toBeCloseTo(1.0982100489461617, 4);
  });

  it("ratio > 1 (large-angle period exceeds small-angle period)", () => {
    expect(result.ratio).toBeGreaterThan(1);
  });

  it("T_exact matches series expansion within 1e-3 relative", () => {
    // series: T_small*(1 + 1.2^2/16 + 11*1.2^4/3072)
    const T_series =
      result.T_small * (1 + 1.2 ** 2 / 16 + (11 * 1.2 ** 4) / 3072);
    const relErr = Math.abs(T_series - result.T_exact) / result.T_exact;
    expect(relErr).toBeLessThan(1e-3);
  });

  it("finalAnswerStepId value: T_exact ≈ 3.116 s", () => {
    expect(result.T_exact).toBeCloseTo(3.116, 2);
  });
});
