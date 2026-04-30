import { describe, it, expect } from "vitest";
import {
  inputs,
  solve,
} from "@/lib/problems/classical-mechanics/the-simple-pendulum/the-simple-pendulum-challenge-large-angle-period-correction";

describe("the-simple-pendulum-challenge-large-angle-period-correction", () => {
  const result = solve();

  it("inputs have expected canonical values", () => {
    expect(inputs.L.value).toBe(1.0);
    expect(inputs.g.value).toBe(9.80665);
    expect(inputs.theta_0.value).toBe(0.6);
  });

  it("step 1: T_small = 2*PI*sqrt(L/g)", () => {
    // 2*PI*sqrt(1.0/9.80665) = 2.00640929...
    expect(result.T_small).toBeCloseTo(2.0064, 4);
  });

  it("step 2: k = sin(theta_0 / 2)", () => {
    // sin(0.3) = 0.29552021...
    expect(result.k).toBeCloseTo(0.2955, 4);
  });

  it("step 3: K = completeEllipticK(k)", () => {
    // K(0.29552) = 1.60688586...
    expect(result.K).toBeCloseTo(1.6069, 4);
  });

  it("step 4: T_exact = 4*sqrt(L/g)*K", () => {
    // 4*sqrt(1/9.80665)*K = 2.05250717...
    expect(result.T_exact).toBeCloseTo(2.0525, 4);
  });

  it("step 5: delta = (T_exact - T_small) / T_small", () => {
    // fractional correction ≈ 0.02297531 (~2.3%)
    expect(result.delta).toBeCloseTo(0.0230, 4);
  });

  it("T_exact > T_small (large angle takes longer)", () => {
    expect(result.T_exact).toBeGreaterThan(result.T_small);
  });

  it("finalAnswerStepId value: T_exact", () => {
    expect(result.T_exact).toBeCloseTo(2.0525, 4);
  });
});
