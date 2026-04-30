import { describe, it, expect } from "vitest";
import {
  inputs,
  solve,
} from "@/lib/problems/classical-mechanics/oscillators-everywhere/oscillators-everywhere-easy-spring-period-from-mass";

describe("oscillators-everywhere-easy-spring-period-from-mass", () => {
  const result = solve();

  it("inputs have expected canonical values", () => {
    expect(inputs.k.value).toBe(200);
    expect(inputs.m.value).toBe(0.5);
  });

  it("step: omega = sqrt(k/m)", () => {
    // sqrt(200 / 0.5) = sqrt(400) = 20
    expect(result.omega).toBeCloseTo(20.0, 6);
  });

  it("step: T = 2*PI / omega", () => {
    // 2π / 20 ≈ 0.314159
    expect(result.T).toBeCloseTo((2 * Math.PI) / 20, 6);
  });

  it("T and omega are self-consistent: omega * T = 2*PI", () => {
    expect(result.omega * result.T).toBeCloseTo(2 * Math.PI, 6);
  });

  it("finalAnswerStepId value: T", () => {
    expect(result.T).toBeCloseTo((2 * Math.PI) / 20, 6);
  });
});
