import { describe, it, expect } from "vitest";
import {
  inputs,
  solve,
} from "@/lib/problems/classical-mechanics/beyond-small-angles/beyond-small-angles-challenge-length-from-large-angle-period";

const G = 9.80665;

describe("beyond-small-angles-challenge-length-from-large-angle-period", () => {
  const result = solve();

  it("inputs have expected canonical values", () => {
    expect(inputs.T.value).toBe(3.0);
    expect(inputs.theta_0.value).toBe(1.0);
    expect(inputs.g.value).toBe(9.80665);
  });

  it("step: k = sin(θ₀/2) = sin(0.5)", () => {
    expect(result.k).toBeCloseTo(Math.sin(0.5), 10);
  });

  it("step: K_val = K(sin(0.5)) ≈ 1.6750", () => {
    expect(result.K_val).toBeCloseTo(1.6749939160926133, 6);
  });

  it("step: L = g·(T/(4K))²", () => {
    // g*(3/(4*1.67499))^2 ≈ 1.9662 m
    expect(result.L).toBeCloseTo(1.9661503933044664, 5);
  });

  it("step: T_verify round-trips back to 3.0 s", () => {
    expect(result.T_verify).toBeCloseTo(3.0, 8);
  });

  it("L_naive (small-angle) is significantly larger than true L", () => {
    // L_naive = g*(T/2π)² ≈ 2.237 m
    expect(result.L_naive).toBeGreaterThan(result.L * 1.05);
  });

  it("finalAnswerStepId value: L ≈ 1.966 m", () => {
    expect(result.L).toBeCloseTo(1.966, 2);
  });
});
