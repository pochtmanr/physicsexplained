import { describe, it, expect } from "vitest";
import {
  inputs,
  solve,
} from "@/lib/problems/classical-mechanics/the-simple-pendulum/the-simple-pendulum-exam-gravity-from-two-pendulums";

describe("the-simple-pendulum-exam-gravity-from-two-pendulums", () => {
  const result = solve();

  it("inputs have expected canonical values", () => {
    expect(inputs.L_1.value).toBe(0.5);
    expect(inputs.T_1.value).toBe(1.4187);
    expect(inputs.L_2.value).toBe(2.0);
    expect(inputs.T_2.value).toBe(2.8375);
  });

  it("step 1: omega_1 = 2*PI / T_1", () => {
    // 2*PI / 1.4187 = 4.42883295...
    expect(result.omega_1).toBeCloseTo(4.4288, 4);
  });

  it("step 1b: g_1 = L_1 * omega_1²", () => {
    // 0.5 * (4.42883)² = 9.80728065...
    expect(result.g_1).toBeCloseTo(9.8073, 4);
  });

  it("step 2: omega_2 = 2*PI / T_2", () => {
    // 2*PI / 2.8375 = 2.21433843...
    expect(result.omega_2).toBeCloseTo(2.2143, 4);
  });

  it("step 2b: g_2 = L_2 * omega_2²", () => {
    // 2.0 * (2.21434)² = 9.80658940...
    expect(result.g_2).toBeCloseTo(9.8066, 4);
  });

  it("step 3: g_avg = (g_1 + g_2) / 2", () => {
    // ≈ 9.80693503...
    expect(result.g_avg).toBeCloseTo(9.8069, 4);
  });

  it("step 4: discrepancy = |g_1 - g_2| / g_avg", () => {
    // ≈ 0.00007049 (very small — measurements are consistent)
    expect(result.discrepancy).toBeCloseTo(0.0001, 4);
  });

  it("predicted periods from g_avg round-trip close to measured", () => {
    // 3 decimal places: averaging two slightly-offset estimates means predictions
    // match to ~0.001 s but not necessarily to 0.0001 s.
    expect(result.T_1_pred).toBeCloseTo(1.419, 3);
    expect(result.T_2_pred).toBeCloseTo(2.837, 3);
  });

  it("g_avg is close to standard gravity", () => {
    expect(result.g_avg).toBeCloseTo(9.807, 3);
  });

  it("finalAnswerStepId value: g_avg", () => {
    expect(result.g_avg).toBeCloseTo(9.8069, 4);
  });
});
