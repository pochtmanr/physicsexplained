import { describe, it, expect } from "vitest";
import {
  inputs,
  solve,
} from "@/lib/problems/classical-mechanics/beyond-small-angles/beyond-small-angles-medium-first-order-period-correction";

describe("beyond-small-angles-medium-first-order-period-correction", () => {
  const result = solve();

  it("inputs have expected canonical values", () => {
    expect(inputs.theta_0.value).toBe(0.8);
    expect(inputs.L.value).toBe(1.5);
    expect(inputs.g.value).toBe(9.80665);
  });

  it("step: T_small = 2π√(L/g)", () => {
    // 2π√(1.5/9.80665) ≈ 2.4573
    expect(result.T_small).toBeCloseTo(2.4573394910108535, 6);
  });

  it("step: delta_T = T_small · θ₀²/16", () => {
    // 2.4573 * 0.64/16 ≈ 0.09829
    expect(result.delta_T).toBeCloseTo(2.4573394910108535 * (0.8 ** 2 / 16), 6);
  });

  it("step: T_corr = T_small + delta_T", () => {
    // ≈ 2.5556
    expect(result.T_corr).toBeCloseTo(2.5556330706512878, 5);
  });

  it("step: T_series = T_small·(1 + θ₀²/16 + 11θ₀⁴/3072)", () => {
    // ≈ 2.55924
    expect(result.T_series).toBeCloseTo(2.5592371685714372, 5);
  });

  it("T_series is closer to T_exact than T_corr alone", () => {
    const errCorr = Math.abs(result.T_corr - result.T_exact);
    const errSeries = Math.abs(result.T_series - result.T_exact);
    expect(errSeries).toBeLessThan(errCorr);
  });

  it("T_series matches T_exact within 1e-4 relative", () => {
    const relErr = Math.abs(result.T_series - result.T_exact) / result.T_exact;
    expect(relErr).toBeLessThan(1e-4);
  });

  it("finalAnswerStepId value: T_series ≈ 2.559 s", () => {
    expect(result.T_series).toBeCloseTo(2.559, 2);
  });
});
